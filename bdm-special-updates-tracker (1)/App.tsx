
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { SummaryTable } from './components/SummaryTable';
import { DetailTable } from './components/DetailTable';
import { DataEntryForm } from './components/DataEntryForm';
import { AIChat } from './components/AIChat';
import { SetupGuide } from './components/SetupGuide';
import { AnalyticsView } from './components/AnalyticsView';
import { MasterDataModal } from './components/MasterDataModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { UPDATE_TYPES, DEFAULT_GOOGLE_SHEET_URL, MOCK_USERS } from './constants';
import { MemberRecord, MasterRecord, User, UserRole, UpdateStatus } from './types';
import { getMasterRecords, saveMasterRecords } from './utils/db';

const App: React.FC = () => {
  // System Launch State
  const [isSystemLaunched, setIsSystemLaunched] = useState(false);

  // Initialize with Admin user directly to bypass login
  const [currentUser] = useState<User>(MOCK_USERS[0]);
  const [cloudUrl, setCloudUrl] = useState(localStorage.getItem('bdm_cloud_url') || DEFAULT_GOOGLE_SHEET_URL);
  
  const [records, setRecords] = useState<MemberRecord[]>([]);
  const [masterRecords, setMasterRecords] = useState<MasterRecord[]>([]);
  
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'setup'>('summary');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showMasterModal, setShowMasterModal] = useState(false);
  
  // Filtering state
  const [filterMuni, setFilterMuni] = useState<string>('All');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<number | null>(null);
  
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MemberRecord | null>(null);

  // Delete State
  const [recordToDelete, setRecordToDelete] = useState<MemberRecord | null>(null);

  const loadMaster = useCallback(async () => {
    try {
      const stored = await getMasterRecords();
      setMasterRecords(stored || []);
    } catch (e) {
      console.error("Error loading master records:", e);
    }
  }, []);

  const handleUpdateMaster = async (newList: MasterRecord[]) => {
    await saveMasterRecords(newList);
    setMasterRecords(newList);
    setShowMasterModal(false);
  };

  // Robust record filtering
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchMuni = filterMuni === 'All' || r.municipality.toLowerCase() === filterMuni.toLowerCase();
      const matchType = !filterType || r.updateType.toLowerCase() === filterType.toLowerCase();
      const matchPeriod = !filterPeriod || Number(r.period) === filterPeriod;
      return matchMuni && matchType && matchPeriod;
    });
  }, [records, filterMuni, filterType, filterPeriod]);

  // Aggregated Summary Data
  const summaryData = useMemo(() => {
    const muniFiltered = records.filter(r => filterMuni === 'All' || r.municipality.toLowerCase() === filterMuni.toLowerCase());
    
    return UPDATE_TYPES.map(type => {
      const typeRecords = muniFiltered.filter(r => r.updateType?.toLowerCase().trim() === type.toLowerCase().trim());
      return {
        updateType: type,
        periods: [1, 2, 3, 4, 5, 6].map(p => typeRecords.filter(r => Number(r.period) === p).length),
        total: typeRecords.length
      };
    });
  }, [records, filterMuni]);

  const stats = useMemo(() => {
    const total = records.length;
    const munis = Array.from(new Set(records.map(r => r.municipality?.toUpperCase()))).filter(Boolean).length;
    const topTypeObj = summaryData.reduce((prev, current) => (prev.total > current.total) ? prev : current, { updateType: 'None', total: 0 });
    
    return {
      total,
      munis,
      topType: topTypeObj.total > 0 ? topTypeObj.updateType : 'No Data',
      topVolume: topTypeObj.total
    };
  }, [records, summaryData]);

  // Helper to safely parse dates from Google Sheets (which might come as ISO strings)
  const parseDate = (val: any): string => {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) { /* ignore */ }
    return String(val);
  };

  const syncFromCloud = useCallback(async () => {
    if (!cloudUrl || cloudUrl.trim() === '') return;
    setIsSyncing(true);
    try {
      // 1. Fetch Transaction Records (Sheet1)
      const response = await fetch(`${cloudUrl}${cloudUrl.includes('?') ? '&' : '?'}sheet=Sheet1`);
      const data = await response.json();
      
      const rawRecords = data.data || data;

      if (Array.isArray(rawRecords)) {
        // Robust Mapping: Handle both Array of Objects (Local/Legacy) and Array of Arrays (GAS Raw)
        const normalized = rawRecords.map((item: any) => {
          if (Array.isArray(item)) {
             // Array of Arrays [ID, Province, Muni, Brgy, Member, Type, Grantee, Date, Period, Status, Extra]
             return {
               id: String(item[0] || ''),
               province: String(item[1] || 'MASBATE'),
               municipality: String(item[2] || 'BALENO'),
               barangay: String(item[3] || ''),
               memberName: String(item[4] || ''),
               updateType: String(item[5] || 'UPDATE 9 - Basic Information'),
               granteeName: String(item[6] || ''),
               date: parseDate(item[7]),
               period: Number(item[8] || 1),
               status: (item[9] || UpdateStatus.RECEIVED) as UpdateStatus,
               extraInfo: String(item[10] || '')
             };
          } else {
             // Array of Objects (Standard JSON)
             return {
               id: String(item.id || item.ID || item.HHID || item.hhid || ''),
               province: String(item.province || item.Province || 'MASBATE'),
               municipality: String(item.municipality || item.Municipality || 'BALENO'),
               barangay: String(item.barangay || item.Barangay || ''),
               memberName: String(item.memberName || item['Member Name'] || item.member_name || ''),
               updateType: String(item.updateType || item['Update Type'] || item.update_type || 'UPDATE 9 - Basic Information'),
               granteeName: String(item.granteeName || item['Grantee Name'] || ''),
               date: parseDate(item.date || item.Date),
               period: Number(item.period || item.Period || 1),
               status: (item.status || item.Status || UpdateStatus.RECEIVED) as UpdateStatus,
               extraInfo: String(item.extraInfo || item['Extra Info'] || '')
             };
          }
        }).filter(r => r.id && r.id.toUpperCase() !== 'ID' && r.id !== ''); // Filter out header row if present in raw data

        setRecords(normalized);
      }

      // 2. Fetch Master Records (HHID STATUS)
      try {
        const masterResponse = await fetch(`${cloudUrl}${cloudUrl.includes('?') ? '&' : '?'}sheet=HHID+STATUS`);
        if (masterResponse.ok) {
            const masterDataRaw = await masterResponse.json();
            const masterData = masterDataRaw.data || masterDataRaw;

            if (Array.isArray(masterData)) {
                const normalizedMaster = masterData.map((item: any) => {
                   if (Array.isArray(item)) {
                     // Array Mapping [HHID, Province, Muni, Brgy, Grantee]
                     return {
                       hhid: String(item[0] || ''),
                       province: String(item[1] || ''),
                       municipality: String(item[2] || ''),
                       barangay: String(item[3] || ''),
                       granteeName: String(item[4] || '')
                     };
                   } else {
                     // Object Mapping
                     return {
                       hhid: String(item.ID || item.id || item.HHID || ''),
                       province: String(item.Province || item.province || ''),
                       municipality: String(item.City || item.Municipality || item.municipality || ''),
                       barangay: String(item.Barangay || item.barangay || ''),
                       granteeName: String(item.Name || item.GranteeName || item.grantee_name || item.member_name || '')
                     };
                   }
                }).filter((m: any) => m.hhid && m.hhid !== 'undefined' && m.hhid.toUpperCase() !== 'HHID');
                
                if (normalizedMaster.length > 0) {
                  setMasterRecords(normalizedMaster);
                  saveMasterRecords(normalizedMaster).catch(console.warn);
                }
            }
        }
      } catch (e) {
          // Silent fail for master data if not available or fetch fails
          console.warn("Master data fetch bypassed", e);
      }

    } catch (error) { 
      console.error("Cloud data fetch failed", error); 
    } finally { 
      setIsSyncing(false); 
    }
  }, [cloudUrl]);

  const handleSaveRecord = useCallback(async (record: MemberRecord) => {
    if (!cloudUrl) return;
    setIsSyncing(true);
    try {
      await fetch(cloudUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'save_record', record }) });
      await syncFromCloud();
      setShowEntryForm(false);
      setEditingRecord(null);
    } catch (e) { alert("Save failed."); }
    finally { setIsSyncing(false); }
  }, [cloudUrl, syncFromCloud]);

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    
    // Optimistic UI update
    setRecords(prev => prev.filter(r => r.id !== recordToDelete.id));
    setRecordToDelete(null); // Close modal immediately

    if (cloudUrl) {
       setIsSyncing(true);
       try {
          // Detect if we are likely talking to a local REST bridge or Google Apps Script
          const isLocalBridge = cloudUrl.includes('localhost') || cloudUrl.includes('127.0.0.1');

          if (isLocalBridge) {
              // Use standard REST DELETE
              const baseUrl = cloudUrl.endsWith('/') ? cloudUrl.slice(0, -1) : cloudUrl;
              await fetch(`${baseUrl}/${recordToDelete.id}`, { 
                  method: 'DELETE'
              });
          } else {
              // Assume Google Apps Script Web App (POST with action)
              await fetch(cloudUrl, { 
                method: 'POST', 
                mode: 'no-cors', 
                body: JSON.stringify({ action: 'delete_record', id: recordToDelete.id }) 
              });
          }
       } catch (e) {
          console.error("Delete failed", e);
          alert("Delete command sent, but sync might have issues. Record removed locally.");
       } finally {
          setIsSyncing(false);
       }
    }
  };

  useEffect(() => {
    loadMaster();
    if (cloudUrl) syncFromCloud();
  }, [cloudUrl, syncFromCloud, loadMaster]);

  const resetFilters = () => {
    setFilterMuni('All');
    setFilterType(null);
    setFilterPeriod(null);
  };

  if (!isSystemLaunched) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

         <div className="bg-[#1e293b]/60 backdrop-blur-3xl p-12 rounded-[2.5rem] border border-white/5 w-full max-w-sm text-center relative z-10 shadow-2xl animate-in zoom-in duration-500">
            <div className="flex flex-col items-center">
               <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/30">
                  <i className="fa-solid fa-cloud text-3xl text-white"></i>
               </div>
               <h1 className="text-4xl font-black text-white italic tracking-tighter mb-2">BDM Hub</h1>
               <p className="text-[10px] font-bold text-indigo-200/50 uppercase tracking-[0.3em] mb-10">Enterprise Cloud Analytics</p>
               
               <button 
                 onClick={() => setIsSystemLaunched(true)}
                 className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 uppercase tracking-widest text-[11px] active:scale-95"
               >
                 Launch System
               </button>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative animate-in fade-in duration-700">
      <header className="bg-[#020617] text-white sticky top-0 z-50 border-b border-white/5 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => { setActiveTab('summary'); resetFilters(); }}>
             <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20"><i className="fa-solid fa-cloud"></i></div>
             <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none hidden sm:block">BDM HUB</h1>
          </div>
          <nav className="flex items-center space-x-1 bg-white/5 rounded-2xl p-1 border border-white/5">
            {[
              { id: 'summary', icon: 'fa-house' },
              { id: 'details', icon: 'fa-table-list' },
              { id: 'setup', icon: 'fa-cloud-arrow-up' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center space-x-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}>
                <i className={`fa-solid ${tab.icon}`}></i>
                <span className="hidden sm:inline">{tab.id}</span>
              </button>
            ))}
          </nav>
          <div className="flex items-center space-x-4">
            <button onClick={() => setShowAIChat(!showAIChat)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all flex items-center justify-center"><i className="fa-solid fa-robot"></i></button>
            <div className="flex items-center space-x-3 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
               <div className="text-right">
                  <p className="text-[10px] font-black leading-none uppercase">{currentUser.name.split(' ')[0]}</p>
                  <p className="text-[8px] font-bold text-indigo-400 uppercase mt-1 tracking-widest">{currentUser.role}</p>
               </div>
               <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-xs uppercase">{currentUser.name.charAt(0)}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {activeTab === 'summary' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stats section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:rotate-12 transition-transform duration-500"><i className="fa-solid fa-database text-8xl text-indigo-600"></i></div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Throughput</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.total.toLocaleString()}</p>
                  <div className="mt-4 flex items-center text-[10px] font-bold text-indigo-600 uppercase tracking-widest"><i className="fa-solid fa-circle-check mr-2"></i> Real-time Feed</div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:rotate-12 transition-transform duration-500"><i className="fa-solid fa-fire text-8xl text-orange-600"></i></div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Peak Category</p>
                  <p className="text-xl font-black text-slate-900 tracking-tighter truncate uppercase" title={stats.topType}>{stats.topType}</p>
                  <div className="mt-4 flex items-center text-[10px] font-bold text-orange-600 uppercase tracking-widest"><i className="fa-solid fa-arrow-trend-up mr-2"></i> {stats.topVolume} Entries</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:rotate-12 transition-transform duration-500"><i className="fa-solid fa-users-viewfinder text-8xl text-teal-600"></i></div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Households</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">{masterRecords.length > 0 ? masterRecords.length.toLocaleString() : '---'}</p>
                  <div className="mt-4 flex items-center text-[10px] font-bold text-teal-600 uppercase tracking-widest"><i className="fa-solid fa-database mr-2"></i> Master List Count</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:rotate-12 transition-transform duration-500"><i className="fa-solid fa-clock-rotate-left text-8xl text-indigo-400"></i></div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">{isSyncing ? 'Syncing...' : 'Live'}</p>
                  <div className="mt-4 flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest"><i className="fa-solid fa-satellite-dish mr-2"></i> Local Cache Active</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end space-y-4 md:space-y-0 border-b pb-6 border-slate-200">
              <div>
                 <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 block">Enterprise Tracker</span>
                 <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">Mission Control</h2>
              </div>
              <div className="flex space-x-3 w-full md:w-auto">
                <select 
                  value={filterMuni}
                  onChange={(e) => setFilterMuni(e.target.value)}
                  className="bg-white border text-slate-700 px-6 py-3.5 rounded-2xl text-[10px] font-black shadow-sm uppercase tracking-widest outline-none focus:border-indigo-500"
                >
                  <option value="All">All Municipalities</option>
                  {Array.from(new Set(records.map(r => r.municipality?.toUpperCase()))).filter(Boolean).sort().map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <button onClick={syncFromCloud} className="bg-white border text-slate-700 px-8 py-3.5 rounded-2xl text-[10px] font-black shadow-sm hover:bg-slate-50 transition-all uppercase tracking-widest flex items-center">
                   <i className={`fa-solid fa-arrows-rotate mr-3 ${isSyncing ? 'animate-spin' : ''}`}></i> Sync
                </button>
                <button onClick={() => setShowEntryForm(true)} className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black shadow-xl transition-all uppercase tracking-widest">+ New Entry</button>
              </div>
            </div>

            <SummaryTable data={summaryData} onDrillDown={(type, period) => { setFilterType(type); setFilterPeriod(period); setActiveTab('details'); }} />
            <div className="pt-8 border-t border-slate-100">
              <AnalyticsView records={records} summary={summaryData} />
            </div>
          </div>
        )}
        
        {activeTab === 'details' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">Data Repository</h2>
                <div className="flex items-center space-x-2 mt-2">
                  {filterMuni !== 'All' && <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">{filterMuni}</span>}
                  {filterType && <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">{filterType}</span>}
                  {filterPeriod && <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">Period {filterPeriod}</span>}
                  {(filterMuni !== 'All' || filterType || filterPeriod) && (
                    <button onClick={resetFilters} className="text-[9px] font-black uppercase text-slate-400 hover:text-red-500 ml-2 transition-colors">Clear All Filters</button>
                  )}
                </div>
              </div>
            </div>
            <DetailTable 
              records={filteredRecords} 
              userRole={currentUser.role} 
              currentPage={1} 
              totalPages={1} 
              totalRecords={filteredRecords.length} 
              onPageChange={() => {}} 
              onEdit={(rec) => { setEditingRecord(rec); setShowEntryForm(true); }} 
              onDelete={setRecordToDelete} 
              onBulkUpdate={() => {}} 
              onBulkDelete={() => {}} 
            />
          </div>
        )}

        {activeTab === 'setup' && (
          <SetupGuide 
            currentUrl={cloudUrl} 
            onSaveUrl={(u) => { setCloudUrl(u); localStorage.setItem('bdm_cloud_url', u); }} 
            onRetry={syncFromCloud} 
            onManageMaster={() => setShowMasterModal(true)}
          />
        )}
      </main>

      <AIChat isOpen={showAIChat} onClose={() => setShowAIChat(false)} />
      {showEntryForm && <DataEntryForm onSave={handleSaveRecord} onClose={() => { setShowEntryForm(false); setEditingRecord(null); }} initialRecord={editingRecord} masterList={masterRecords} />}
      {showMasterModal && <MasterDataModal currentMaster={masterRecords} onUpdate={handleUpdateMaster} onClose={() => setShowMasterModal(false)} />}
      
      <ConfirmationModal 
        isOpen={!!recordToDelete} 
        title="Confirm Deletion" 
        message={`Are you sure you want to permanently delete record ${recordToDelete?.id}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setRecordToDelete(null)}
        isDangerous={true}
        confirmText="Yes, Delete Record"
      />
    </div>
  );
};

export default App;
