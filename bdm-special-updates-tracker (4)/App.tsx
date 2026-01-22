
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { SummaryTable } from './components/SummaryTable';
import { DetailTable } from './components/DetailTable';
import { DataEntryForm } from './components/DataEntryForm';
import { SetupGuide } from './components/SetupGuide';
import { AnalyticsView } from './components/AnalyticsView';
import { MasterDataModal } from './components/MasterDataModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ProfileView } from './components/ProfileView';
import { UPDATE_TYPES, DEFAULT_GOOGLE_SHEET_URL, MOCK_USERS } from './constants';
import { MemberRecord, MasterRecord, User, UserRole, UpdateStatus, AuditLog } from './types';
import { getMasterRecords, saveMasterRecords } from './utils/db';

const App: React.FC = () => {
  // System Launch State (Replaced Auth)
  const [isSystemLaunched, setIsSystemLaunched] = useState(false);
  
  // Default to Admin User
  const [currentUser] = useState<User>(MOCK_USERS[0]);

  // App Data State
  const [cloudUrl, setCloudUrl] = useState(localStorage.getItem('bdm_cloud_url') || DEFAULT_GOOGLE_SHEET_URL);
  const [records, setRecords] = useState<MemberRecord[]>([]);
  const [masterRecords, setMasterRecords] = useState<MasterRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]); // Local session logs
  
  // UI State
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'setup'>('summary');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  
  // Filtering state
  const [filterMuni, setFilterMuni] = useState<string>('All');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<number | null>(null);
  
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MemberRecord | null>(null);

  // Delete State
  const [recordToDelete, setRecordToDelete] = useState<MemberRecord | null>(null);

  const logAction = (user: string, action: string, details: string) => {
    const newLog: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
      user,
      action,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleLogout = () => {
    setIsSystemLaunched(false);
    setShowProfile(false);
    setActiveTab('summary');
  };

  // --- Data Handlers ---

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
    logAction(currentUser.name, 'MASTER_UPDATE', `Updated master list with ${newList.length} records`);
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

  // Pagination Logic
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);

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

  // Helper to safely parse dates
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
    
    const separator = cloudUrl.includes('?') ? '&' : '?';

    try {
      // 1. Fetch Transaction Records
      const response = await fetch(`${cloudUrl}${separator}sheet=Sheet1`);
      const data = await response.json();
      
      const rawRecords = data.data || data;

      if (Array.isArray(rawRecords)) {
        const normalized = rawRecords.map((item: any) => {
          if (Array.isArray(item)) {
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
        }).filter(r => r.id && r.id.toUpperCase() !== 'ID' && r.id !== ''); 

        setRecords(normalized);
      }

      // 2. Fetch Master List (HHID STATUS)
      try {
        const masterRes = await fetch(`${cloudUrl}${separator}sheet=HHID+STATUS`);
        const masterData = await masterRes.json();
        const rawMaster = masterData.data || masterData;

        if (Array.isArray(rawMaster)) {
          const normalizedMaster: MasterRecord[] = rawMaster.map((item: any) => {
            if (Array.isArray(item)) {
              // Header Check
              const firstCol = String(item[0]).toUpperCase();
              if (firstCol === 'HHID' || firstCol === 'ID') return null;
              
              // MAPPING BASED ON SPREADSHEET IMAGE:
              // Col A (0): ID
              // Col B (1): Client Status (Ignored)
              // Col C (2): City (Municipality)
              // Col D (3): Barangay
              // Col E (4): Name (Grantee Name)
              // Col F (5): Province

              return {
                hhid: String(item[0] || ''),
                municipality: String(item[2] || ''),
                barangay: String(item[3] || ''),
                granteeName: String(item[4] || ''),
                province: String(item[5] || 'MASBATE')
              };
            }
            // Object fallback if API changes structure
            return {
               hhid: String(item.hhid || item.HHID || item.ID || ''),
               municipality: String(item.municipality || item.City || ''),
               barangay: String(item.barangay || item.Barangay || ''),
               granteeName: String(item.granteeName || item['Grantee Name'] || item.Name || ''),
               province: String(item.province || item.Province || 'MASBATE')
            };
          }).filter((r): r is MasterRecord => r !== null && r.hhid !== '');

          if (normalizedMaster.length > 0) {
            setMasterRecords(normalizedMaster);
            await saveMasterRecords(normalizedMaster);
          }
        }
      } catch (masterErr) {
        console.warn("Failed to sync Master List:", masterErr);
      }

    } catch (error) { 
      console.error("Cloud data fetch failed", error); 
    } finally { 
      setIsSyncing(false); 
    }
  }, [cloudUrl]);

  // Modified save handler: Returns Promise and DOES NOT close form automatically
  const handleSaveRecord = useCallback(async (record: MemberRecord): Promise<void> => {
    if (!cloudUrl) return;
    try {
      await fetch(cloudUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'save_record', record }) });
      logAction(currentUser.name, 'SAVE_RECORD', `Saved record for ${record.id} - ${record.memberName}`);
    } catch (e) { 
      alert("Save failed for " + record.memberName); 
      throw e;
    }
  }, [cloudUrl, currentUser]);

  const handlePostSaveParams = async () => {
    await syncFromCloud();
    setShowEntryForm(false);
    setEditingRecord(null);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    
    setRecords(prev => prev.filter(r => r.id !== recordToDelete.id));
    setRecordToDelete(null); 

    if (cloudUrl) {
       setIsSyncing(true);
       try {
          const isLocalBridge = cloudUrl.includes('localhost') || cloudUrl.includes('127.0.0.1');

          if (isLocalBridge) {
              const baseUrl = cloudUrl.endsWith('/') ? cloudUrl.slice(0, -1) : cloudUrl;
              await fetch(`${baseUrl}/${recordToDelete.id}`, { method: 'DELETE' });
          } else {
              await fetch(cloudUrl, { 
                method: 'POST', 
                mode: 'no-cors', 
                body: JSON.stringify({ action: 'delete_record', id: recordToDelete.id }) 
              });
          }
          logAction(currentUser.name, 'DELETE_RECORD', `Deleted record ${recordToDelete.id}`);
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
    if (cloudUrl && isSystemLaunched) syncFromCloud();
  }, [cloudUrl, syncFromCloud, loadMaster, isSystemLaunched]);

  const resetFilters = () => {
    setFilterMuni('All');
    setFilterType(null);
    setFilterPeriod(null);
    setCurrentPage(1);
  };

  // --- Launch View ---
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
                 onClick={() => {
                    setIsSystemLaunched(true);
                    logAction(currentUser.name, 'LAUNCH', 'System Initialized');
                 }}
                 className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 uppercase tracking-widest text-[11px] active:scale-95"
               >
                 Launch System
               </button>
            </div>
         </div>
      </div>
    );
  }

  // --- Main App View ---
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative animate-in fade-in duration-700">
      <header className="bg-[#020617] text-white sticky top-0 z-50 border-b border-white/5 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => { setActiveTab('summary'); resetFilters(); setShowProfile(false); }}>
             <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20"><i className="fa-solid fa-cloud"></i></div>
             <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none hidden sm:block">BDM HUB</h1>
          </div>
          <nav className="flex items-center space-x-1 bg-white/5 rounded-2xl p-1 border border-white/5">
            {[
              { id: 'summary', icon: 'fa-house' },
              { id: 'details', icon: 'fa-table-list' },
              { id: 'setup', icon: 'fa-cloud-arrow-up' }
            ].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setShowProfile(false); }} className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center space-x-2 ${activeTab === tab.id && !showProfile ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}>
                <i className={`fa-solid ${tab.icon}`}></i>
                <span className="hidden sm:inline">{tab.id}</span>
              </button>
            ))}
          </nav>
          <div className="flex items-center space-x-4">
            <button onClick={() => setShowProfile(true)} className="flex items-center space-x-3 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
               <div className="text-right">
                  <p className="text-[10px] font-black leading-none uppercase">{currentUser.name.split(' ')[0]}</p>
                  <p className="text-[8px] font-bold text-indigo-400 uppercase mt-1 tracking-widest">{currentUser.role}</p>
               </div>
               <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-xs uppercase text-white">
                  {currentUser.name.charAt(0)}
               </div>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {showProfile ? (
          <ProfileView user={currentUser} logs={auditLogs} onLogout={handleLogout} />
        ) : (
          <>
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
                      <div className="mt-4 flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest"><i className="fa-solid fa-satellite-dish mr-2"></i> Cloud Uplink</div>
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
              <div className="space-y-6 animate-in fade-in duration-500">
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
                  records={paginatedRecords} 
                  userRole={currentUser?.role || UserRole.STAFF} 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  totalRecords={filteredRecords.length} 
                  onPageChange={setCurrentPage} 
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
          </>
        )}
      </main>

      {showEntryForm && (
        <DataEntryForm 
          onSave={handleSaveRecord} 
          onPostSave={handlePostSaveParams}
          onClose={() => { setShowEntryForm(false); setEditingRecord(null); }} 
          initialRecord={editingRecord} 
          masterList={masterRecords} 
        />
      )}
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
