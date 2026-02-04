
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { SummaryTable } from './components/SummaryTable';
import { DetailTable } from './components/DetailTable';
import { DataEntryForm } from './components/DataEntryForm';
import { SetupGuide } from './components/SetupGuide';
import { AnalyticsView } from './components/AnalyticsView';
import { MasterDataModal } from './components/MasterDataModal';
import { HouseholdDatabaseModal } from './components/HouseholdDatabaseModal';
import { BulkImportModal } from './components/BulkImportModal';
import { ProfileView } from './components/ProfileView';
import { HouseholdView } from './components/HouseholdView';
import { LoginView } from './components/LoginView';
import { UPDATE_TYPES, DEFAULT_GOOGLE_SHEET_URL, MOCK_USERS } from './constants';
import { MemberRecord, MasterRecord, User, UserRole, UpdateStatus, AuditLog, HouseholdMember } from './types';
import { getMasterRecords, saveMasterRecords, countHouseholdRecords, openDB } from './utils/db';

const App: React.FC = () => {
  // User Management State
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [cloudUrl, setCloudUrl] = useState(localStorage.getItem('bdm_cloud_url') || DEFAULT_GOOGLE_SHEET_URL);
  const [records, setRecords] = useState<MemberRecord[]>([]);
  const [masterRecords, setMasterRecords] = useState<MasterRecord[]>([]);
  const [profileCount, setProfileCount] = useState(0); 
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'analytics' | 'profiles' | 'setup'>('summary');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [showHouseholdModal, setShowHouseholdModal] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filterMuni, setFilterMuni] = useState<string>('All');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<string>('newest');
  
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MemberRecord | null>(null);

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

  const syncUsers = useCallback(async () => {
    if (!cloudUrl || cloudUrl.trim() === '') return;
    try {
        const separator = cloudUrl.includes('?') ? '&' : '?';
        const response = await fetch(`${cloudUrl}${separator}sheet=User`);
        const data = await response.json();
        const rawUsers = data.data || data;

        if (Array.isArray(rawUsers)) {
            const mappedUsers: User[] = rawUsers.map((item: any) => {
                const isArr = Array.isArray(item);
                // Schema: ID(0), Username(1), Password(2), FirstName(3), MI(4), LastName(5), Position(6), Muni(7), Email(8), Role(9), Status(10), Avatar(11)
                return {
                    id: String(isArr ? item[0] : item.id),
                    username: String(isArr ? item[1] : item.username),
                    Password: String(isArr ? item[2] : item.Password),
                    firstName: String(isArr ? item[3] : item.firstName),
                    mi: String(isArr ? item[4] : item.mi),
                    lastName: String(isArr ? item[5] : item.lastName),
                    name: `${String(isArr ? item[3] : item.firstName)} ${String(isArr ? item[5] : item.lastName)}`,
                    position: String(isArr ? item[6] : item.position),
                    municipality: String(isArr ? item[7] : item.municipality),
                    email: String(isArr ? item[8] : item.email),
                    role: (isArr ? item[9] : item.role) as UserRole,
                    status: (isArr ? item[10] : item.status) as 'Pending' | 'Approved',
                    avatar: String(isArr ? item[11] : item.avatar)
                };
            }).filter(u => u.id && u.id.toLowerCase() !== 'id'); // Filter out header
            
            // Merge with MOCK_USERS (Admin) to ensure Admin always exists locally
            setAllUsers(prev => {
                const admin = MOCK_USERS[0];
                const others = mappedUsers.filter(u => u.id !== admin.id);
                return [admin, ...others];
            });
        }
    } catch (e) {
        console.error("Failed to sync users", e);
    }
  }, [cloudUrl]);

  const handleRegister = async (newUser: User) => {
    // Optimistic Update
    setAllUsers(prev => [...prev, newUser]);
    
    if (cloudUrl) {
       try {
         await fetch(cloudUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ action: 'register_user', user: newUser })
         });
         // Trigger a background sync to confirm
         setTimeout(syncUsers, 1000);
       } catch (e) {
         console.error("Failed to save user to cloud", e);
         alert("Registered locally only. Cloud save failed.");
       }
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    logAction(currentUser?.name || 'Admin', 'USER_UPDATE', `Updated user ${updatedUser.username} to ${updatedUser.role} / ${updatedUser.status}`);
    
    if (cloudUrl) {
       await fetch(cloudUrl, {
           method: 'POST',
           mode: 'no-cors',
           body: JSON.stringify({ action: 'update_user', user: updatedUser })
       });
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    if (window.confirm(`Are you sure you want to remove the registration request for ${userToDelete.name}?`)) {
        setAllUsers(prev => prev.filter(u => u.id !== userToDelete.id));
        logAction(currentUser?.name || 'Admin', 'USER_DELETE', `Deleted user request for ${userToDelete.username}`);
        
        if (cloudUrl) {
            await fetch(cloudUrl, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ action: 'delete_user', id: userToDelete.id })
            });
        }
    }
  };

  const handleLogin = (username: string, password: string) => {
    setLoginError('');
    const user = allUsers.find(u => u.username === username && u.Password === password);
    
    if (user) {
        if (user.status === 'Pending') {
            setLoginError('Account is pending approval from Administrator.');
        } else {
            setCurrentUser(user);
            setIsAuthenticated(true);
            setIsTerminated(false);
            setIsDeleted(false);
            logAction(user.name, 'SESSION_START', 'User logged in successfully');
        }
    } else {
        setLoginError('Invalid credentials. Access denied.');
    }
  };

  const handleLogout = () => {
    if (currentUser) {
        logAction(currentUser.name, 'SESSION_END', 'User logged out');
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setShowProfile(false);
    setIsTerminated(false);
    setIsDeleted(false);
    setLoginError('');
  };

  const loadData = useCallback(async () => {
    try {
      const storedMaster = await getMasterRecords();
      setMasterRecords(storedMaster || []);
      const count = await countHouseholdRecords();
      setProfileCount(count);
    } catch (e) {
      console.error("Error loading local data:", e);
    }
  }, []);

  const handleUpdateMaster = async (newList: MasterRecord[]) => {
    if (!currentUser) return;
    await saveMasterRecords(newList);
    setMasterRecords(newList);
    setShowMasterModal(false);
    logAction(currentUser.name, 'MASTER_UPDATE', `Updated master list with ${newList.length} records`);
  };

  const onProfileImportFinish = async () => {
    if (!currentUser) return;
    const count = await countHouseholdRecords();
    setProfileCount(count);
    setShowHouseholdModal(false);
    logAction(currentUser.name, 'HOUSEHOLD_IMPORT', `Imported ${count.toLocaleString()} records`);
  };

  const syncProfilesToCloud = async () => {
    if (!currentUser) return;
    if (!cloudUrl) return alert("Please set your Cloud URL in Setup first.");
    const count = await countHouseholdRecords();
    if (count === 0) return alert("No local records found to sync.");

    const confirmed = window.confirm(`Ready to sync ${count.toLocaleString()} records to the Google Sheet 'PROFILES' tab. This may take a few minutes for large databases. Proceed?`);
    if (!confirmed) return;

    setIsSyncing(true);
    try {
      const db = await openDB();
      const transaction = db.transaction('household_records', 'readonly');
      const store = transaction.objectStore('household_records');
      const request = store.getAll();
      
      request.onsuccess = async () => {
        const allRecords = request.result as HouseholdMember[];
        const BATCH_SIZE = 5000;
        
        logAction(currentUser.name, 'CLOUD_SYNC_START', `Syncing ${allRecords.length} profiles`);

        for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
          const batch = allRecords.slice(i, i + BATCH_SIZE);
          const payload = {
            action: 'save_profiles',
            mode: i === 0 ? 'replace' : 'append',
            records: batch
          };

          await fetch(cloudUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(payload)
          });
          
          await new Promise(r => setTimeout(r, 800)); // Throttling for GAS stability
        }

        alert(`Successfully synced ${allRecords.length.toLocaleString()} records to Cloud.`);
        logAction(currentUser.name, 'CLOUD_SYNC_FINISH', `Synced ${allRecords.length} profiles to GSheet`);
        setIsSyncing(false);
      };
    } catch (e) {
      alert("Sync failed: " + e);
      setIsSyncing(false);
    }
  };

  const syncFromCloud = useCallback(async () => {
    if (!cloudUrl || cloudUrl.trim() === '') return;
    setIsSyncing(true);
    const separator = cloudUrl.includes('?') ? '&' : '?';

    try {
      // Sync DB Records
      const response = await fetch(`${cloudUrl}${separator}sheet=Sheet1`);
      const data = await response.json();
      const rawRecords = data.data || data;

      if (Array.isArray(rawRecords)) {
        const normalized = rawRecords.map((item: any) => {
           const isArr = Array.isArray(item);
           return {
             id: String(isArr ? item[0] : item.id || ''),
             province: String(isArr ? item[1] : item.province || 'MASBATE'),
             municipality: String(isArr ? item[2] : item.municipality || 'BALENO'),
             barangay: String(isArr ? item[3] : item.barangay || ''),
             memberName: String(isArr ? item[4] : item.memberName || ''),
             updateType: String(isArr ? item[5] : item.updateType || 'UPDATE 9'),
             granteeName: String(isArr ? item[6] : item.granteeName || ''),
             date: String(isArr ? item[7] : item.date || ''),
             period: Number(isArr ? item[8] : item.period || 1),
             status: (isArr ? item[9] : item.status || UpdateStatus.RECEIVED) as UpdateStatus,
             extraInfo: String(isArr ? item[10] : item.extraInfo || '')
           };
        }).filter(r => r.id && r.id.toUpperCase() !== 'ID');
        setRecords(normalized);
      }
    } catch (error) { 
      console.error("Sync failed", error); 
    } finally { 
      setIsSyncing(false); 
    }
  }, [cloudUrl]);

  const handleSaveRecord = async (record: MemberRecord) => {
    if (!cloudUrl) return;
    await fetch(cloudUrl, { 
      method: 'POST', 
      mode: 'no-cors', 
      body: JSON.stringify({ action: 'save_record', record }) 
    });
  };

  const handleBulkImport = async (newRecords: MemberRecord[]) => {
    if (!currentUser) return;
    if (!cloudUrl) return;
    setIsSyncing(true);
    try {
      for (const rec of newRecords) {
        await handleSaveRecord(rec);
      }
      logAction(currentUser.name, 'BULK_IMPORT', `Imported ${newRecords.length} records`);
      setShowBulkImport(false);
      await syncFromCloud();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePostSaveParams = async () => {
    await syncFromCloud();
    setShowEntryForm(false);
    setEditingRecord(null);
  };

  useEffect(() => {
    loadData();
    if (cloudUrl) {
        syncFromCloud();
        syncUsers();
    }
  }, [cloudUrl, syncFromCloud, syncUsers, loadData]);

  const summaryData = useMemo(() => {
    return UPDATE_TYPES.map(type => {
      const typeRecords = records.filter(r => r.updateType === type);
      const periods = [1, 2, 3, 4, 5, 6].map(p => 
        typeRecords.filter(r => r.period === p).length
      );
      return {
        updateType: type,
        periods,
        total: typeRecords.length
      };
    }).filter(row => row.total > 0);
  }, [records]);

  const filteredRecords = useMemo(() => {
    let result = records.filter(r => {
      const matchSearch = searchQuery === '' || 
        r.memberName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMuni = filterMuni === 'All' || r.municipality === filterMuni;
      const matchType = !filterType || r.updateType === filterType;
      const matchPeriod = !filterPeriod || r.period === filterPeriod;
      return matchSearch && matchMuni && matchType && matchPeriod;
    });

    // Sort Logic
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (sortOption === 'newest') return dateB - dateA;
      if (sortOption === 'oldest') return dateA - dateB;
      return 0;
    });

    return result;
  }, [records, searchQuery, filterMuni, filterType, filterPeriod, sortOption]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  if (isDeleted) {
    return (
        <div className="min-h-screen bg-[#f1f3f4] flex flex-col items-center justify-center">
            <div className="relative mb-6">
                <i className="fa-regular fa-file text-7xl text-[#bdc1c6]"></i>
                <i className="fa-solid fa-face-frown text-3xl text-[#bdc1c6] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-1"></i>
            </div>
            <p className="text-[#80868b] text-sm font-medium">It may have been moved, edited, or deleted.</p>
        </div>
    );
  }

  if (isTerminated) {
    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-sm bg-[#1e293b]/50 backdrop-blur-2xl border border-white/5 p-12 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6">
                    <i className="fa-solid fa-cloud text-2xl text-white"></i>
                </div>

                <h1 className="text-3xl font-black italic tracking-tighter text-white mb-2">BDM Tracker</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10">Enterprise Cloud Analytics</p>

                <button 
                    onClick={() => setIsDeleted(true)}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/25 transition-all active:scale-95 hover:shadow-indigo-500/40"
                >
                    Launch System
                </button>
            </div>
        </div>
    );
  }

  if (!isAuthenticated) {
    return (
        <LoginView 
            onLogin={handleLogin} 
            onRegister={handleRegister} 
            loginError={loginError} 
        />
    );
  }

  // Guard clause to ensure currentUser is available for the main app
  if (!currentUser) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative">
      <header className="bg-[#020617] text-white sticky top-0 z-50 border-b border-white/5 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center gap-4">
          <div className="flex items-center space-x-2 cursor-pointer shrink-0" onClick={() => { setActiveTab('summary'); setShowProfile(false); }}>
             <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20"><i className="fa-solid fa-cloud"></i></div>
             <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none hidden sm:block">BDM HUB</h1>
          </div>
          
          <nav className="flex flex-wrap items-center justify-center gap-1 bg-white/5 rounded-2xl p-1 border border-white/5 flex-1">
            {[
              { id: 'summary', icon: 'fa-house' },
              { id: 'details', icon: 'fa-list' },
              { id: 'analytics', icon: 'fa-chart-pie' },
              { id: 'profiles', icon: 'fa-users' },
              { id: 'setup', icon: 'fa-gear' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => { setActiveTab(tab.id as any); setShowProfile(false); }} 
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id && !showProfile ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <i className={`fa-solid ${tab.icon}`}></i>
                <span className="hidden md:inline">{tab.id}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-4 shrink-0">
            <button onClick={() => setShowProfile(true)} className="flex items-center space-x-3 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
               <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-xs text-white">
                  {currentUser.firstName ? currentUser.firstName.charAt(0) : currentUser.name.charAt(0)}
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{currentUser.name}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {showProfile ? (
          <ProfileView 
            user={currentUser} 
            logs={auditLogs} 
            onLogout={handleLogout}
            users={allUsers}
            onUpdateUser={handleUpdateUser} 
            onDeleteUser={handleDeleteUser}
          />
        ) : (
          <>
            {activeTab === 'summary' && (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Throughput</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{records.length.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Local Profiles</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{profileCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Master Records</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{masterRecords.length.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <div className="flex items-center space-x-2">
                       <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></span>
                       <p className="text-3xl font-black text-slate-900 tracking-tighter">{isSyncing ? 'Syncing...' : 'Live'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center md:items-end border-b pb-6 gap-4">
                   <div className="text-center md:text-left">
                     <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tight">Mission Control</h2>
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Operational Summary Dashboard</p>
                   </div>
                   <div className="flex gap-3">
                      <button onClick={syncFromCloud} className="bg-white border text-slate-700 px-6 py-3.5 rounded-2xl text-[10px] font-black shadow-sm uppercase tracking-widest hover:bg-slate-50 transition-all">Refresh</button>
                      <button onClick={() => setShowEntryForm(true)} className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black shadow-xl uppercase tracking-widest hover:bg-indigo-500 transition-all">+ New Entry</button>
                   </div>
                </div>

                <SummaryTable data={summaryData} onDrillDown={(type, period) => { setFilterType(type); setFilterPeriod(period); setActiveTab('details'); }} />
              </div>
            )}
            
            {activeTab === 'details' && (
               <div className="space-y-6">
                 <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 uppercase italic">Transaction Ledger</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setShowBulkImport(true)} className="bg-white border px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50">Bulk Import</button>
                    </div>
                 </div>
                 <DetailTable 
                    records={paginatedRecords} 
                    userRole={currentUser.role} 
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredRecords.length / itemsPerPage)}
                    totalRecords={filteredRecords.length}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={setItemsPerPage}
                    onPageChange={setCurrentPage}
                    onEdit={(r) => { setEditingRecord(r); setShowEntryForm(true); }}
                    onDelete={() => {}}
                    
                    searchQuery={searchQuery}
                    onSearch={setSearchQuery}
                    
                    filterType={filterType}
                    onFilterTypeChange={setFilterType}
                    filterMuni={filterMuni}
                    onFilterMuniChange={setFilterMuni}
                    filterPeriod={filterPeriod}
                    onFilterPeriodChange={setFilterPeriod}
                    sortOption={sortOption}
                    onSortOptionChange={setSortOption}
                 />
               </div>
            )}

            {activeTab === 'analytics' && <AnalyticsView records={records} summary={summaryData} />}

            {activeTab === 'profiles' && (
              <HouseholdView 
                records={records}
                onImportClick={() => setShowHouseholdModal(true)} 
                onSyncCloud={syncProfilesToCloud}
                isSyncing={isSyncing}
              />
            )}
            
            {activeTab === 'setup' && (
              <SetupGuide currentUrl={cloudUrl} onSaveUrl={(u) => setCloudUrl(u)} onRetry={syncFromCloud} onManageMaster={() => setShowMasterModal(true)} />
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
          existingRecords={records}
        />
      )}

      {showHouseholdModal && (
        <HouseholdDatabaseModal onFinish={onProfileImportFinish} onClose={() => setShowHouseholdModal(false)} />
      )}
      
      {showMasterModal && (
        <MasterDataModal cloudUrl={cloudUrl} currentMaster={masterRecords} onUpdate={handleUpdateMaster} onClose={() => setShowMasterModal(false)} />
      )}

      {showBulkImport && (
        <BulkImportModal onImport={handleBulkImport} onClose={() => setShowBulkImport(false)} />
      )}
    </div>
  );
};

export default App;
