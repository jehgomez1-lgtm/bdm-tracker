
import React, { useState, useEffect } from 'react';
import { HouseholdMember, MemberRecord, UpdateStatus } from '../types';
import { searchHouseholdRecords, getHouseholdMembersByHHID } from '../utils/db';

interface HouseholdViewProps {
  records: MemberRecord[];
  onImportClick: () => void;
  onSyncCloud?: () => void;
  isSyncing?: boolean;
}

const SECTION_TABS = [
  { id: 'info', label: 'Household Information', icon: 'fa-house-user' },
  { id: 'baseline', label: 'Baseline & EC', icon: 'fa-chart-simple' },
  { id: 'reg', label: 'Registration', icon: 'fa-id-card' },
  { id: 'compliance', label: 'Compliance', icon: 'fa-check-double' },
  { id: 'payroll', label: 'Payroll', icon: 'fa-money-bill-wave' },
  { id: 'grievance', label: 'Grievance', icon: 'fa-gavel' },
  { id: 'updates', label: 'Updates', icon: 'fa-rotate' }
];

export const HouseholdView: React.FC<HouseholdViewProps> = ({ records, onImportClick, onSyncCloud, isSyncing }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<HouseholdMember[]>([]);
  const [selectedHH, setSelectedHH] = useState<string | null>(null);
  const [hhMembers, setHhMembers] = useState<HouseholdMember[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Detail View State
  const [selectedMember, setSelectedMember] = useState<HouseholdMember | null>(null);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (search.length > 2 && !selectedHH) {
        setIsSearching(true);
        const res = await searchHouseholdRecords(search);
        setResults(res);
        setIsSearching(false);
      } else if (search.length === 0) {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedHH]);

  const handleSelectHH = async (hhid: string) => {
    setSelectedHH(hhid);
    setSearch(hhid);
    const members = await getHouseholdMembersByHHID(hhid);
    setHhMembers(members);
    setResults([]);
    
    // Default select head or first member
    if (members.length > 0) {
      const head = members.find(m => m.relationship === 'HEAD' || m.relationship === 'HH HEAD') || members[0];
      setSelectedMember(head);
    }
  };

  const handleClear = () => {
    setSearch('');
    setSelectedHH(null);
    setResults([]);
    setHhMembers([]);
    setSelectedMember(null);
    setActiveTab('info');
  };

  const getFilteredUpdates = () => {
    if (!selectedHH) return [];
    // Match HHID at start of ID (ignoring unique suffix)
    return records.filter(r => r.id.startsWith(selectedHH));
  };

  return (
    <div className="space-y-6">
       {/* SEARCH BAR */}
       <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4">
         <div className="flex-1 relative">
            <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Search 700k Database (HHID or Lastname)..." 
              className="w-full pl-16 pr-4 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black outline-none focus:border-indigo-500 uppercase tracking-tight text-slate-700 placeholder:text-slate-400"
              value={search}
              onChange={(e) => {
                 setSearch(e.target.value);
                 if (selectedHH) {
                    setSelectedHH(null);
                    setHhMembers([]);
                    setSelectedMember(null);
                 }
              }}
            />
            {search && <button onClick={handleClear} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><i className="fa-solid fa-xmark"></i></button>}
         </div>
         <div className="flex gap-3">
            {onSyncCloud && (
               <button 
                 onClick={onSyncCloud} 
                 disabled={isSyncing}
                 className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center transition-all active:scale-95"
               >
                 <i className={`fa-solid ${isSyncing ? 'fa-circle-notch animate-spin' : 'fa-cloud-arrow-up'} mr-2`}></i>
                 {isSyncing ? 'Syncing...' : 'Sync Cloud'}
               </button>
            )}
            <button onClick={onImportClick} className="bg-[#1e293b] text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95">Import New 700K CSV</button>
         </div>
       </div>

       {/* SEARCH DROPDOWN */}
       {!selectedHH && search.length > 2 && (
          <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50 animate-in fade-in slide-in-from-top-2 duration-200">
             {isSearching && <div className="p-8 text-center text-slate-400 text-xs font-bold">Searching Database...</div>}
             {!isSearching && results.length === 0 && <div className="p-8 text-center text-slate-400 text-xs font-bold">No records found.</div>}
             {results.map((m, i) => (
                <div key={i} onClick={() => handleSelectHH(m.hhid)} className="px-8 py-5 hover:bg-indigo-50 cursor-pointer flex justify-between items-center group transition-all">
                   <div>
                      <p className="font-black text-slate-800 uppercase group-hover:text-indigo-600">{m.lastName}, {m.firstName}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-widest">{m.hhid}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">{m.barangay}</p>
                   </div>
                </div>
             ))}
          </div>
       )}

       {/* HOUSEHOLD DETAIL VIEW */}
       {selectedHH && hhMembers.length > 0 && selectedMember && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
             
             {/* HEADER CARD */}
             <div className="bg-[#1e293b] text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="absolute top-0 right-0 p-8 opacity-5"><i className="fa-solid fa-house-user text-9xl"></i></div>
                <div className="relative z-10">
                   <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                      {hhMembers.find(m => m.relationship === 'HEAD' || m.relationship === 'HH HEAD')?.lastName || hhMembers[0].lastName} FAMILY UNIT
                   </h2>
                   <div className="flex flex-col md:flex-row gap-2 md:gap-6 text-[10px] font-black uppercase tracking-widest text-indigo-300 mt-2">
                      <span className="flex items-center"><i className="fa-solid fa-fingerprint mr-2"></i> ID: {selectedHH}</span>
                      <span className="flex items-center"><i className="fa-solid fa-location-dot mr-2"></i> {hhMembers[0].municipality}, {hhMembers[0].barangay}</span>
                      <span className="flex items-center"><i className="fa-solid fa-users mr-2"></i> {hhMembers.length} Members</span>
                   </div>
                </div>
                <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/10 text-center">
                    <div className="text-[10px] font-black uppercase text-indigo-200 tracking-widest">HH Status</div>
                    <div className="text-xl font-black text-white">{hhMembers[0].clientStatus || 'ACTIVE'}</div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT: MEMBER LIST */}
                <div className="lg:col-span-4 bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px]">
                   <div className="p-5 border-b border-slate-50 bg-slate-50/50">
                      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Household Roster</h3>
                   </div>
                   <div className="overflow-y-auto flex-1 custom-scrollbar p-2 space-y-1">
                      {hhMembers.map((m, i) => (
                         <div 
                            key={i} 
                            onClick={() => setSelectedMember(m)}
                            className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                               selectedMember.entryId === m.entryId ? 'bg-indigo-50 border-indigo-100 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'
                            }`}
                         >
                            <div className="flex justify-between items-start">
                               <div>
                                  <p className={`text-xs font-black uppercase ${selectedMember.entryId === m.entryId ? 'text-indigo-700' : 'text-slate-700'}`}>
                                    {m.lastName}, {m.firstName}
                                  </p>
                                  <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wide">{m.relationship}</p>
                               </div>
                               {m.sex === 'MALE' ? <i className="fa-solid fa-person text-blue-400"></i> : <i className="fa-solid fa-person-dress text-pink-400"></i>}
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                {/* RIGHT: TABBED DETAILS */}
                <div className="lg:col-span-8 space-y-6">
                   
                   {/* TAB NAVIGATION */}
                   <div className="bg-white p-2 rounded-[1.5rem] shadow-sm border border-slate-100 flex overflow-x-auto custom-scrollbar">
                      {SECTION_TABS.map(tab => (
                         <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1 ${
                               activeTab === tab.id 
                               ? 'bg-indigo-600 text-white shadow-md' 
                               : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                            }`}
                         >
                            <i className={`fa-solid ${tab.icon} text-sm mb-1`}></i>
                            {tab.label.split(' ')[0]}
                         </button>
                      ))}
                   </div>

                   {/* TAB CONTENT AREA */}
                   <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 min-h-[500px]">
                      
                      {/* Household Info */}
                      {activeTab === 'info' && (
                         <div className="space-y-8 animate-in fade-in duration-300">
                            <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tight border-b pb-4 mb-4">Personal Information</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                               <InfoField label="Full Name" value={`${selectedMember.lastName}, ${selectedMember.firstName} ${selectedMember.middleName} ${selectedMember.extName}`} fullWidth />
                               <InfoField label="Birthday" value={selectedMember.birthday} />
                               <InfoField label="Age" value={selectedMember.age} />
                               <InfoField label="Sex" value={selectedMember.sex} />
                               <InfoField label="Civil Status" value={selectedMember.civilStatus} />
                               <InfoField label="Relationship" value={selectedMember.relationship} />
                            </div>

                            <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tight border-b pb-4 mb-4 mt-8">Location</h3>
                            <div className="grid grid-cols-2 gap-6">
                               <InfoField label="Province" value={selectedMember.province} />
                               <InfoField label="Municipality" value={selectedMember.municipality} />
                               <InfoField label="Barangay" value={selectedMember.barangay} />
                               <InfoField label="Region" value={selectedMember.region} />
                            </div>
                         </div>
                      )}

                      {/* Baseline & EC */}
                      {activeTab === 'baseline' && (
                         <div className="space-y-8 animate-in fade-in duration-300">
                             <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tight border-b pb-4 mb-4">Baseline Data</h3>
                             <div className="grid grid-cols-2 gap-6">
                                <InfoField label="HH Set" value={selectedMember.hhSet} />
                                <InfoField label="IP Affiliation" value={selectedMember.ipAffiliation} />
                                <InfoField label="Solo Parent" value={selectedMember.soloparent} />
                                <InfoField label="Disability" value={selectedMember.disability} />
                             </div>
                         </div>
                      )}

                      {/* Registration */}
                      {activeTab === 'reg' && (
                         <div className="space-y-8 animate-in fade-in duration-300">
                             <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tight border-b pb-4 mb-4">Registration Status</h3>
                             <div className="grid grid-cols-2 gap-6">
                                <InfoField label="Entry ID" value={selectedMember.entryId} />
                                <InfoField label="Pantawid ID (PCN)" value={selectedMember.pcn} />
                                <InfoField label="Client Status" value={selectedMember.clientStatus} />
                                <InfoField label="Member Status" value={selectedMember.memberStatus} />
                                <InfoField label="Is Grantee" value={selectedMember.isGrantee} />
                             </div>
                         </div>
                      )}

                      {/* Compliance */}
                      {activeTab === 'compliance' && (
                         <div className="space-y-8 animate-in fade-in duration-300">
                             <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tight border-b pb-4 mb-4">Education</h3>
                             <div className="grid grid-cols-2 gap-6">
                                <InfoField label="Attending School" value={selectedMember.attendingSchool} />
                                <InfoField label="School Name" value={selectedMember.schoolName} fullWidth />
                                <InfoField label="Grade Level" value={selectedMember.gradeLevel} />
                                <InfoField label="LRN" value={selectedMember.lrn} />
                             </div>

                             <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tight border-b pb-4 mb-4 mt-8">Health</h3>
                             <div className="grid grid-cols-2 gap-6">
                                <InfoField label="Health Facility" value={selectedMember.healthFacility} fullWidth />
                                <InfoField label="Pregnancy Status" value={selectedMember.pregnancyStatus} />
                             </div>
                         </div>
                      )}

                      {/* Updates */}
                      {activeTab === 'updates' && (
                          <div className="space-y-4 animate-in fade-in duration-300">
                              <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tight border-b pb-4 mb-4">Transaction History</h3>
                              {getFilteredUpdates().length === 0 ? (
                                  <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                      <p className="text-slate-400 text-xs font-bold uppercase">No updates recorded for this household.</p>
                                  </div>
                              ) : (
                                  <div className="space-y-3">
                                      {getFilteredUpdates().map((rec, i) => (
                                          <div key={i} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center">
                                              <div>
                                                  <p className="text-xs font-black text-indigo-700 uppercase">{rec.updateType}</p>
                                                  <p className="text-[10px] text-slate-500 font-bold mt-1">Period {rec.period} • {rec.date}</p>
                                                  <p className="text-[10px] text-slate-400 mt-1">{rec.memberName}</p>
                                              </div>
                                              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${rec.status === 'PROCESSED' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>{rec.status}</span>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      )}

                      {/* Placeholders for Payroll & Grievance */}
                      {(activeTab === 'payroll' || activeTab === 'grievance') && (
                          <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-50 animate-in fade-in duration-300">
                              <i className={`fa-solid ${activeTab === 'payroll' ? 'fa-money-check-dollar' : 'fa-clipboard-question'} text-6xl text-slate-200 mb-4`}></i>
                              <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Records Found</h4>
                              <p className="text-xs text-slate-300 mt-2">There is no {activeTab} data available for this member currently.</p>
                          </div>
                      )}

                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

const InfoField: React.FC<{ label: string; value: string | number | undefined; fullWidth?: boolean }> = ({ label, value, fullWidth }) => (
    <div className={`space-y-1 ${fullWidth ? 'col-span-2 md:col-span-3' : ''}`}>
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>
        <div className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-1 break-words">{value || <span className="text-slate-200 italic">N/A</span>}</div>
    </div>
);
