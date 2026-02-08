
import React, { useState, useEffect, useMemo } from 'react';
import { HouseholdMember, MemberRecord } from '../types';
import { searchHouseholdRecords, getHouseholdMembersByHHID } from '../utils/db';

interface HouseholdViewProps {
  records: MemberRecord[];
  onImportClick?: () => void;
  onSyncCloud?: () => void;
  isSyncing?: boolean;
}

const TABS = [
  { id: 'composition', label: 'HH Composition' },
  { id: 'info', label: 'HH Information' },
  { id: 'baseline', label: 'Baseline & EC Result' },
  { id: 'registration', label: 'Registration' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'recovery', label: 'Recovery of Overpayment' },
  { id: 'account', label: 'Transaction Account' },
  { id: 'swdi', label: 'SWDI' },
  { id: 'grievance', label: 'Grievance' },
  { id: 'hazard', label: 'Hazard Incidents' },
  { id: 'updates', label: 'Updates' }
];

export const HouseholdView: React.FC<HouseholdViewProps> = ({ records, onImportClick, onSyncCloud, isSyncing }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<HouseholdMember[]>([]);
  const [selectedHH, setSelectedHH] = useState<string | null>(null);
  const [hhMembers, setHhMembers] = useState<HouseholdMember[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('composition');
  
  // Table State
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    setSearch(''); 
    const members = await getHouseholdMembersByHHID(hhid);
    setHhMembers(members);
    setResults([]);
    setActiveTab('composition');
  };

  const handleClear = () => {
    setSearch('');
    setSelectedHH(null);
    setResults([]);
    setHhMembers([]);
  };

  // Derived Data
  const headOfHousehold = useMemo(() => {
    if (hhMembers.length === 0) return null;
    return hhMembers.find(m => m.relationship?.toUpperCase().includes('HEAD')) || hhMembers[0];
  }, [hhMembers]);

  const grantee = useMemo(() => {
    if (hhMembers.length === 0) return null;
    return hhMembers.find(m => m.isGrantee?.toUpperCase().includes('ACTIVE') || m.isGrantee === '1 - Active') || headOfHousehold;
  }, [hhMembers, headOfHousehold]);

  const filteredMembers = useMemo(() => {
    return hhMembers.filter(m => {
        const q = tableSearch.toLowerCase();
        return (
            m.firstName.toLowerCase().includes(q) ||
            m.lastName.toLowerCase().includes(q) ||
            m.entryId.toLowerCase().includes(q)
        );
    });
  }, [hhMembers, tableSearch]);

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(start, start + itemsPerPage);
  }, [filteredMembers, currentPage]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

  const getFilteredUpdates = () => {
    if (!selectedHH) return [];
    return records.filter(r => r.id.startsWith(selectedHH));
  };

  const isMemberMonitored = (m: HouseholdMember) => {
    if (!m.educMonit) return false;
    const status = m.educMonit.toUpperCase();
    return status === 'YES' || status === '1' || status === 'TRUE' || status.includes('MONITORED') || status.includes('ACTIVE');
  };

  // --- RENDER HELPERS ---
  
  if (!selectedHH) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto text-indigo-600 shadow-lg shadow-indigo-100">
                    <i className="fa-solid fa-users-viewfinder text-4xl"></i>
                </div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Household Database</h2>
                <p className="text-slate-400 font-medium">Search across the local database of profiles.</p>
            </div>

            <div className="w-full max-w-2xl relative z-50">
                <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input 
                    type="text" 
                    placeholder="Enter HHID or Last Name..." 
                    className="w-full pl-16 pr-4 py-6 bg-white border-2 border-slate-100 rounded-3xl text-lg font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-xl shadow-slate-200/50 text-slate-700"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                    />
                    {search && <button onClick={handleClear} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><i className="fa-solid fa-xmark"></i></button>}
                </div>

                {search.length > 2 && (
                    <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {isSearching && <div className="p-8 text-center text-slate-400 text-sm font-bold"><i className="fa-solid fa-circle-notch animate-spin mr-2"></i> Searching...</div>}
                        {!isSearching && results.length === 0 && <div className="p-8 text-center text-slate-400 text-sm font-bold">No records found.</div>}
                        {results.map((m, i) => (
                            <div key={i} onClick={() => handleSelectHH(m.hhid)} className="px-8 py-5 hover:bg-indigo-50 cursor-pointer flex justify-between items-center group transition-all">
                            <div>
                                <p className="font-black text-slate-800 uppercase group-hover:text-indigo-600">{m.lastName}, {m.firstName}</p>
                                <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-widest">{m.hhid}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">{m.barangay}</p>
                            </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex gap-4 pt-8">
                 {onSyncCloud && (
                    <button 
                        onClick={onSyncCloud} 
                        disabled={isSyncing}
                        className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm flex items-center transition-all"
                    >
                        <i className={`fa-solid ${isSyncing ? 'fa-circle-notch animate-spin' : 'fa-cloud-arrow-up'} mr-2`}></i>
                        {isSyncing ? 'Syncing...' : 'Sync to Cloud'}
                    </button>
                 )}
                 {onImportClick && (
                    <button onClick={onImportClick} className="bg-[#1e293b] text-white px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all">
                        Import Database (CSV)
                    </button>
                 )}
            </div>
        </div>
    );
  }

  // --- DASHBOARD VIEW ---

  return (
    <div className="bg-white min-h-screen pb-20 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Top Breadcrumb / Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-40">
            <div className="flex items-center space-x-2 text-sm">
                <span className="text-slate-400 font-bold cursor-pointer hover:text-indigo-600" onClick={handleClear}>Household Profile</span>
                <span className="text-slate-300"><i className="fa-solid fa-chevron-right text-[10px]"></i></span>
                <span className="text-slate-400 font-bold">Household ID</span>
                <span className="text-slate-300"><i className="fa-solid fa-chevron-right text-[10px]"></i></span>
                <span className="text-blue-600 font-bold font-mono">{selectedHH}</span>
            </div>
            <button onClick={handleClear} className="text-slate-400 hover:text-red-500 text-sm"><i className="fa-solid fa-xmark"></i></button>
        </div>

        {/* Basic Information Panel */}
        <div className="px-8 py-8">
            <div className="mb-4">
               <span className="bg-[#1e293b] text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm">Basic Information</span>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="relative shrink-0">
                    <div className="w-24 h-24 rounded-full border-4 border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center">
                        <i className="fa-solid fa-user text-4xl text-slate-300"></i>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-6">
                    <div className="col-span-1 lg:col-span-2">
                        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-1">
                            {headOfHousehold?.lastName}, {headOfHousehold?.firstName} {headOfHousehold?.middleName} {headOfHousehold?.extName}
                        </h1>
                        <p className="text-[11px] text-red-500 font-bold uppercase flex items-center">
                            <i className="fa-solid fa-map-location-dot mr-1"></i>
                            {headOfHousehold?.region || 'REGION V'}, {headOfHousehold?.province}, {headOfHousehold?.municipality}, {headOfHousehold?.barangay}
                        </p>
                    </div>
                    
                    <div>
                        <InfoLabel label="CLIENT STATUS" />
                        <InfoValue value={headOfHousehold?.clientStatus} icon="fa-tag" color="text-blue-600" />
                    </div>
                    <div>
                        <InfoLabel label="SET/GROUP" />
                        <InfoValue value={headOfHousehold?.hhSet || 'N/A'} icon="fa-users" />
                    </div>
                    <div>
                        <InfoLabel label="GRANTEE" />
                        <InfoValue value={`${grantee?.lastName || 'N/A'}, ${grantee?.firstName || ''}`} icon="fa-user-check" color="text-slate-600" />
                    </div>
                    <div>
                        <InfoLabel label="HHID" />
                        <InfoValue value={selectedHH} icon="fa-fingerprint" />
                    </div>
                </div>
            </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-8 mt-4 border-b border-slate-200 bg-slate-50/50">
            <div className="flex space-x-1 overflow-x-auto custom-scrollbar pb-1">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-3 text-[11px] font-bold uppercase tracking-tight whitespace-nowrap border-b-2 transition-all ${
                            activeTab === tab.id 
                            ? 'border-blue-600 text-blue-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Content Area */}
        <div className="px-8 py-8">
            
            {activeTab === 'composition' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-slate-700">Household Composition</h3>
                            <p className="text-[10px] text-slate-400">Export data to Copy, CSV, Excel, PDF & Print</p>
                        </div>
                        <div className="flex items-center space-x-2">
                             <span className="text-[11px] font-bold text-slate-500">Search:</span>
                             <input 
                                type="text" 
                                value={tableSearch}
                                onChange={(e) => setTableSearch(e.target.value)}
                                className="border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-blue-500 w-48"
                             />
                        </div>
                    </div>

                    <div className="border border-slate-200 rounded-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1500px]">
                                <thead className="bg-slate-50 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                                    <tr>
                                        <Th>Member's ID</Th>
                                        <Th>Name</Th>
                                        <Th>Monitored</Th>
                                        <Th>Relationship</Th>
                                        <Th>Member Status</Th>
                                        <Th>Sex</Th>
                                        <Th>Attending School</Th>
                                        <Th>Grade Level</Th>
                                        <Th>Client Status</Th>
                                        <Th>Age</Th>
                                        <Th>Birthday</Th>
                                        <Th>Disability</Th>
                                        <Th>IP Affiliation</Th>
                                        <Th>PhilSys Card No.</Th>
                                        <Th>Learner's ID</Th>
                                        <Th>Solo Parent</Th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px] text-slate-600 divide-y divide-slate-100">
                                    {paginatedMembers.map((m, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                            <Td>{m.entryId}</Td>
                                            <Td>
                                                <div className="flex items-center space-x-2">
                                                    {(m.relationship?.includes('HEAD') || m.relationship === '1 - Head') && (
                                                        <i className="fa-solid fa-circle-check text-green-500"></i>
                                                    )}
                                                    <span className="font-bold text-slate-700 uppercase">{m.lastName}, {m.firstName} {m.middleName} {m.extName}</span>
                                                </div>
                                            </Td>
                                            <Td>
                                                <div className="flex items-center pl-4">
                                                    {isMemberMonitored(m) ? (
                                                        <i className="fa-solid fa-square-check text-indigo-600 text-lg" title="Monitored for Education"></i>
                                                    ) : (
                                                        <i className="fa-regular fa-square text-slate-300 text-lg" title="Not Monitored"></i>
                                                    )}
                                                </div>
                                            </Td>
                                            <Td>{m.relationship}</Td>
                                            <Td>{m.memberStatus}</Td>
                                            <Td>{m.sex}</Td>
                                            <Td>{m.attendingSchool}</Td>
                                            <Td>{m.gradeLevel}</Td>
                                            <Td>{m.clientStatus}</Td>
                                            <Td>{m.age}</Td>
                                            <Td>{m.birthday}</Td>
                                            <Td>{m.disability}</Td>
                                            <Td>{m.ipAffiliation}</Td>
                                            <Td>{m.pcn}</Td>
                                            <Td>{m.lrn}</Td>
                                            <Td>{m.soloparent}</Td>
                                        </tr>
                                    ))}
                                    {paginatedMembers.length === 0 && (
                                        <tr>
                                            <td colSpan={16} className="text-center py-8 text-slate-400 italic">No members found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                        <div>
                            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredMembers.length)} to {Math.min(currentPage * itemsPerPage, filteredMembers.length)} of {filteredMembers.length} entries
                        </div>
                        <div className="flex space-x-1">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded hover:bg-slate-100 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button className="px-3 py-1 bg-blue-500 text-white rounded border border-blue-600">{currentPage}</button>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages}
                                className="px-3 py-1 border rounded hover:bg-slate-100 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* UPDATES TAB */}
            {activeTab === 'updates' && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Transaction History</h3>
                    {getFilteredUpdates().length === 0 ? (
                        <div className="p-12 text-center bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                            <i className="fa-solid fa-clock-rotate-left text-slate-300 text-4xl mb-3"></i>
                            <p className="text-slate-500 text-xs font-bold uppercase">No updates recorded.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {getFilteredUpdates().map((rec, i) => (
                                <div key={i} className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm flex items-center justify-between hover:border-blue-300 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                                            {rec.period}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800 uppercase">{rec.updateType}</p>
                                            <p className="text-[10px] text-slate-500">{rec.date} • {rec.memberName}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                                        rec.status === 'PROCESSED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                        {rec.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
            )}

            {/* PLACEHOLDER FOR OTHER TABS */}
            {activeTab !== 'composition' && activeTab !== 'updates' && (
                <div className="h-64 flex flex-col items-center justify-center text-slate-300 animate-in fade-in">
                    <i className="fa-solid fa-folder-open text-5xl mb-4"></i>
                    <p className="text-sm font-bold uppercase tracking-widest">No data available for {TABS.find(t => t.id === activeTab)?.label}</p>
                </div>
            )}
        </div>
    </div>
  );
};

const InfoLabel: React.FC<{ label: string }> = ({ label }) => (
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
);

const InfoValue: React.FC<{ value: any, icon?: string, color?: string }> = ({ value, icon, color = "text-slate-700" }) => (
    <div className={`text-xs font-bold ${color} flex items-center`}>
        {icon && <i className={`fa-solid ${icon} w-5 opacity-70`}></i>}
        <span className="uppercase truncate">{value || 'N/A'}</span>
    </div>
);

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <th className="px-3 py-3 border-b border-slate-200 font-bold whitespace-nowrap">
        <div className="flex items-center justify-between cursor-pointer hover:text-slate-700">
            <span>{children}</span>
            <i className="fa-solid fa-sort text-[9px] ml-1 opacity-50"></i>
        </div>
    </th>
);

const Td: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <td className="px-3 py-3 border-b border-slate-100 whitespace-nowrap">{children}</td>
);
