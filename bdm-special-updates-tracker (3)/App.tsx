
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { SummaryTable } from './components/SummaryTable';
import { DetailTable } from './components/DetailTable';
import { AnalyticsView } from './components/AnalyticsView';
import { DataEntryForm } from './components/DataEntryForm';
import { AIChat } from './components/AIChat';
import { SetupGuide } from './components/SetupGuide';
import { BulkImportModal } from './components/BulkImportModal';
import { UPDATE_TYPES, GENERATED_RECORDS, MOCK_USERS, DEFAULT_GOOGLE_SHEET_URL } from './constants';
import { MemberRecord, User, AuditLog, UpdateStatus } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cloudUrl, setCloudUrl] = useState(localStorage.getItem('bdm_cloud_url') || DEFAULT_GOOGLE_SHEET_URL);
  const [records, setRecords] = useState<MemberRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'analytics' | 'logs' | 'setup'>('summary');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // UI State
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MemberRecord | null>(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cloud Sync Logic
  const syncFromCloud = useCallback(async () => {
    if (!cloudUrl) return;
    setIsSyncing(true);
    try {
      const response = await fetch(cloudUrl);
      const data = await response.json();
      if (Array.isArray(data)) {
        setRecords(data);
        localStorage.setItem('bdm_records', JSON.stringify(data));
      }
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [cloudUrl]);

  const saveToCloud = async (record: MemberRecord, action: 'add' | 'delete' = 'add') => {
    if (!cloudUrl) return;
    setIsSyncing(true);
    try {
      await fetch(cloudUrl, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, record })
      });
      setTimeout(syncFromCloud, 1500); 
    } catch (error) {
      console.error("Cloud Save failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Initialize Data
  useEffect(() => {
    const storedRecords = localStorage.getItem('bdm_records');
    const storedLogs = localStorage.getItem('bdm_logs');
    
    if (storedRecords) {
      setRecords(JSON.parse(storedRecords));
    } else {
      setRecords(GENERATED_RECORDS);
    }

    if (storedLogs) {
      setAuditLogs(JSON.parse(storedLogs));
    }

    if (cloudUrl) {
      syncFromCloud();
    }
  }, [cloudUrl, syncFromCloud]);

  const addLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      user: currentUser?.name || 'System',
      action,
      details
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 100);
      localStorage.setItem('bdm_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = r.memberName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            r.id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !filterType || r.updateType === filterType;
      const matchesPeriod = !filterPeriod || r.period === filterPeriod;
      return matchesSearch && matchesType && matchesPeriod;
    });
  }, [records, searchQuery, filterType, filterPeriod]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * recordsPerPage;
    return filteredRecords.slice(start, start + recordsPerPage);
  }, [filteredRecords, currentPage]);

  const summaryData = useMemo(() => {
    return UPDATE_TYPES.map(type => {
      const periods = [1, 2, 3, 4, 5, 6].map(p => 
        records.filter(r => r.updateType === type && r.period === p).length
      );
      const total = periods.reduce((a, b) => a + b, 0);
      return { updateType: type, periods, total };
    });
  }, [records]);

  const handleSaveRecord = (newRec: MemberRecord) => {
    setRecords(prev => {
      const exists = prev.findIndex(r => r.id === newRec.id);
      let updated;
      if (exists > -1) {
        updated = [...prev];
        updated[exists] = newRec;
        addLog('Update', `Modified HHID: ${newRec.id}`);
      } else {
        updated = [newRec, ...prev];
        addLog('Create', `New entry HHID: ${newRec.id}`);
      }
      localStorage.setItem('bdm_records', JSON.stringify(updated));
      return updated;
    });
    
    if (cloudUrl) saveToCloud(newRec, 'add');
    setShowEntryForm(false);
    setEditingRecord(null);
  };

  const handleDeleteRecord = (rec: MemberRecord) => {
    if (window.confirm(`Are you sure you want to delete record ${rec.id}?`)) {
      setRecords(prev => {
        const updated = prev.filter(r => r.id !== rec.id);
        localStorage.setItem('bdm_records', JSON.stringify(updated));
        return updated;
      });
      addLog('Delete', `Removed HHID: ${rec.id}`);
      if (cloudUrl) saveToCloud(rec, 'delete');
    }
  };

  const handleUpdateCloudUrl = (url: string) => {
    const cleanedUrl = url.trim();
    setCloudUrl(cleanedUrl);
    localStorage.setItem('bdm_cloud_url', cleanedUrl);
    setActiveTab('summary');
    syncFromCloud();
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center stardust-bg p-6">
        <div className="bg-white/10 backdrop-blur-2xl p-10 rounded-[3rem] shadow-2xl border border-white/20 w-full max-w-md animate-in zoom-in duration-500 text-center">
          <div className="mb-10">
            <div className="bg-indigo-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl animate-float">
              <i className="fa-solid fa-cloud text-white text-3xl"></i>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter italic leading-none">BDM Hub</h1>
            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Enterprise Cloud Analytics</p>
          </div>
          <button 
            onClick={() => setCurrentUser(MOCK_USERS[0])}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl uppercase tracking-widest text-xs"
          >
            Launch System
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-[#020617] text-white sticky top-0 z-50 border-b border-white/5 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 md:space-x-6">
             <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveTab('summary')}>
                <div className="bg-indigo-600 p-2 md:p-2.5 rounded-xl md:rounded-2xl shadow-lg shadow-indigo-500/20"><i className="fa-solid fa-database text-[10px] md:text-sm"></i></div>
                <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic leading-none hidden sm:block">BDM</h1>
             </div>
             <div className="flex items-center space-x-2 bg-white/5 px-2 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl border border-white/10">
               <div className={`w-2 h-2 rounded-full ${cloudUrl ? (isSyncing ? 'bg-indigo-400 animate-ping' : 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]') : 'bg-amber-400 animate-pulse'}`}></div>
               <div className="flex flex-col">
                  <span className="text-[7px] md:text-[9px] font-black text-white/60 uppercase leading-none">{cloudUrl ? (isSyncing ? 'SYNCING...' : 'CLOUD ACTIVE') : 'OFFLINE'}</span>
               </div>
             </div>
          </div>

          <nav className="flex items-center space-x-1 bg-white/5 rounded-2xl p-1 border border-white/5">
            {[
              { id: 'summary', label: 'Home', icon: 'fa-house' },
              { id: 'details', label: 'Database', icon: 'fa-table-list' },
              { id: 'setup', label: 'Cloud Link', icon: 'fa-cloud-arrow-up', highlight: !cloudUrl }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`relative px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black transition-all uppercase tracking-widest flex items-center space-x-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'} ${tab.highlight ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-[#020617]' : ''}`}
              >
                <i className={`fa-solid ${tab.icon}`}></i>
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.highlight && activeTab !== 'setup' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-2 md:space-x-4">
            <button onClick={() => setShowAIChat(!showAIChat)} className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all flex items-center justify-center">
              <i className="fa-solid fa-robot text-xs md:text-base"></i>
            </button>
            <img src={currentUser.avatar} className="w-8 h-8 rounded-xl border border-white/20 hidden sm:block" />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 md:py-8">
        {!cloudUrl && activeTab !== 'setup' && (
          <div className="mb-8 bg-indigo-900 text-white p-8 rounded-[2.5rem] shadow-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 relative overflow-hidden animate-in slide-in-from-top-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative z-10 flex items-center space-x-6 text-center md:text-left flex-col md:flex-row">
              <div className="bg-white/10 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-4 md:mb-0">
                <i className="fa-solid fa-cloud-arrow-up text-2xl text-indigo-300"></i>
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tighter italic">Connect Your Cloud Bridge</h3>
                <p className="text-indigo-200 text-xs font-medium opacity-80 mt-1 uppercase tracking-widest">Go to the Cloud Link tab and paste your Web App URL</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('setup')}
              className="relative z-10 bg-white text-indigo-900 px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all active:scale-95"
            >
              Setup Cloud Sync
            </button>
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end space-y-4 md:space-y-0">
              <div>
                 <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 block">Enterprise Tracker</span>
                 <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter italic">Mission Control</h2>
              </div>
              <div className="flex space-x-3 w-full md:w-auto">
                <button onClick={() => setShowEntryForm(true)} className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black shadow-xl transition-all uppercase tracking-widest">
                  + New Record
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
               {[
                 { label: "Total Data Nodes", value: records.length, icon: "fa-database", color: "text-slate-800", sub: cloudUrl ? "Cloud Synced" : "Local Database" },
                 { label: "Engine Status", value: isSyncing ? "..." : currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), icon: "fa-clock", color: "text-indigo-600", sub: "Last Heartbeat" },
                 { label: "Data Integrity", value: cloudUrl ? "High" : "Local", icon: "fa-shield-halved", color: cloudUrl ? "text-green-500" : "text-amber-500", sub: "Synchronization" },
                 { label: "Active Period", value: "P-1 2026", icon: "fa-calendar-check", color: "text-slate-600", sub: "Operational Window" }
               ].map((kpi, i) => (
                 <div key={i} className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border shadow-sm group hover:border-indigo-200 transition-all hover:shadow-xl cursor-default">
                    <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                    <p className={`text-xl md:text-3xl font-black ${kpi.color} tracking-tight`}>{kpi.value}</p>
                    <p className="text-[7px] md:text-[9px] font-bold text-slate-400 mt-2 uppercase">{kpi.sub}</p>
                 </div>
               ))}
            </div>

            <SummaryTable data={summaryData} onDrillDown={(type, period) => { setFilterType(type); setFilterPeriod(period); setActiveTab('details'); }} />
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex justify-between items-end">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter italic">Database</h2>
                <div className="flex space-x-2">
                   <button onClick={syncFromCloud} disabled={!cloudUrl} className="hidden sm:block bg-white border text-slate-700 px-6 py-3.5 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50">
                    <i className={`fa-solid fa-arrows-rotate mr-2 ${isSyncing ? 'animate-spin' : ''}`}></i> Refresh
                  </button>
                  <button onClick={() => setShowImportModal(true)} className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest">
                    Bulk Import
                  </button>
                </div>
             </div>

             <div className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="relative">
                  <input type="text" placeholder="Search records..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-6 py-4 border-2 border-slate-50 rounded-2xl text-sm font-bold bg-slate-50 focus:bg-white focus:border-indigo-500 transition-all outline-none" />
                  <i className="fa-solid fa-magnifying-glass absolute left-5 top-5 text-slate-400"></i>
                </div>
                <select value={filterType || ''} onChange={e => setFilterType(e.target.value || null)} className="px-6 py-4 border-2 border-slate-50 rounded-2xl text-xs font-black bg-slate-50 outline-none">
                  <option value="">All Categories</option>
                  {UPDATE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={filterPeriod || ''} onChange={e => setFilterPeriod(e.target.value ? parseInt(e.target.value) : null)} className="px-6 py-4 border-2 border-slate-50 rounded-2xl text-xs font-black bg-slate-50 outline-none">
                  <option value="">All Periods</option>
                  {[1, 2, 3, 4, 5, 6].map(p => <option key={p} value={p}>Period {p}</option>)}
                </select>
             </div>

             <DetailTable records={paginatedRecords} userRole={currentUser.role} currentPage={currentPage} totalPages={Math.ceil(filteredRecords.length / recordsPerPage)} totalRecords={filteredRecords.length} onPageChange={setCurrentPage} onEdit={(rec) => { setEditingRecord(rec); setShowEntryForm(true); }} onDelete={handleDeleteRecord} onBulkUpdate={() => {}} onBulkDelete={() => {}} />
          </div>
        )}

        {activeTab === 'analytics' && <AnalyticsView records={records} summary={summaryData} />}
        {activeTab === 'setup' && <SetupGuide currentUrl={cloudUrl} onSaveUrl={handleUpdateCloudUrl} onRetry={syncFromCloud} />}
      </main>

      <AIChat isOpen={showAIChat} onClose={() => setShowAIChat(false)} />
      {showEntryForm && <DataEntryForm onSave={handleSaveRecord} onClose={() => { setShowEntryForm(false); setEditingRecord(null); }} initialRecord={editingRecord} />}
      {showImportModal && <BulkImportModal onImport={(newRecs) => { setRecords(prev => [...newRecs, ...prev]); setShowImportModal(false); addLog('Import', `Imported ${newRecs.length} records.`); }} onClose={() => setShowImportModal(false)} />}
    </div>
  );
};

export default App;
