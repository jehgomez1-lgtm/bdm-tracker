
import React, { useState, useMemo } from 'react';
import { MemberRecord, UpdateStatus, UserRole } from '../types';
import { UPDATE_TYPES, MUNICIPALITIES } from '../constants';

interface DetailTableProps {
  records: MemberRecord[];
  userRole: UserRole;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  itemsPerPage: number;
  onItemsPerPageChange: (val: number) => void;
  onPageChange: (page: number) => void;
  onEdit: (record: MemberRecord) => void;
  onDelete: (record: MemberRecord) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  
  filterType: string | null;
  onFilterTypeChange: (val: string | null) => void;
  filterMuni: string;
  onFilterMuniChange: (val: string) => void;
  filterPeriod: number | null;
  onFilterPeriodChange: (val: number | null) => void;
  filterStatus2: string | null;
  onFilterStatus2Change: (val: string | null) => void;
  sortOption: string;
  onSortOptionChange: (val: string) => void;
}

const StatusBadge: React.FC<{ status: UpdateStatus | undefined }> = ({ status }) => {
  if (!status) return null;
  
  const config: Record<string, { style: string; icon: string }> = {
    [UpdateStatus.RECEIVED]: { 
      style: 'bg-blue-50 text-blue-700 border-blue-200', 
      icon: 'fa-inbox' 
    },
    [UpdateStatus.PENDING]: { 
      style: 'bg-amber-50 text-amber-700 border-amber-200', 
      icon: 'fa-clock' 
    },
    [UpdateStatus.PROCESSED]: { 
      style: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
      icon: 'fa-circle-check' 
    },
    [UpdateStatus.REJECTED]: { 
      style: 'bg-rose-50 text-rose-700 border-rose-200', 
      icon: 'fa-circle-xmark' 
    },
    [UpdateStatus.ENCODED]: { 
      style: 'bg-violet-50 text-violet-700 border-violet-200', 
      icon: 'fa-keyboard' 
    },
    [UpdateStatus.DISCARDED]: { 
      style: 'bg-slate-100 text-slate-500 border-slate-200 opacity-60 line-through', 
      icon: 'fa-trash-can' 
    },
    [UpdateStatus.RETURNED]: { 
      style: 'bg-orange-50 text-orange-700 border-orange-200', 
      icon: 'fa-reply' 
    },
    [UpdateStatus.SENT_THROUGH_MAIL]: { 
      style: 'bg-teal-50 text-teal-700 border-teal-200', 
      icon: 'fa-paper-plane' 
    },
  };
  
  const active = config[status] || { style: 'bg-gray-100 text-gray-800 border-gray-200', icon: 'fa-circle-info' };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest whitespace-nowrap shadow-sm transition-all ${active.style}`}>
      <i className={`fa-solid ${active.icon} text-[10px]`}></i>
      {status}
    </span>
  );
};

/**
 * MM-DD-YYYY Formatter
 */
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  
  // Handle specific YYYY-MM-DD string to avoid timezone shifts
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
     const [y, m, d] = dateStr.split('-');
     return `${m}-${d}-${y}`;
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${month}-${day}-${year}`;
};

interface ColumnDef {
  key: keyof MemberRecord;
  label: string;
}

export const DetailTable: React.FC<DetailTableProps> = ({ 
  records, 
  userRole, 
  currentPage, 
  totalPages, 
  totalRecords, 
  itemsPerPage,
  onItemsPerPageChange,
  onPageChange, 
  onEdit, 
  onDelete,
  searchQuery,
  onSearch,
  filterType,
  onFilterTypeChange,
  filterMuni,
  onFilterMuniChange,
  filterPeriod,
  onFilterPeriodChange,
  filterStatus2,
  onFilterStatus2Change,
  sortOption,
  onSortOptionChange
}) => {
  const isAdmin = userRole === UserRole.ADMIN;
  
  const dynamicFilterOptions = useMemo(() => {
    const uniqueOptions = new Set(UPDATE_TYPES);
    if (filterType) uniqueOptions.add(filterType);
    return Array.from(uniqueOptions).sort();
  }, [filterType]);
  
  const [columns] = useState<ColumnDef[]>([
    { key: 'id', label: 'HHID' },
    { key: 'province', label: 'Province' },
    { key: 'municipality', label: 'Muni' },
    { key: 'memberName', label: 'Member Name' },
    { key: 'updateType', label: 'Update Type' },
    { key: 'extraInfo', label: 'Remarks' },
    { key: 'status', label: 'Status & Dates' },
  ]);

  const renderCell = (rec: MemberRecord, key: keyof MemberRecord) => {
    switch (key) {
      case 'id':
        const displayId = rec.id.split('_uid_')[0];
        return <td key={key} className="px-4 py-4 border-r font-mono font-black text-slate-700 align-top text-[11px]">{displayId}</td>;
      case 'province':
        return <td key={key} className="px-4 py-4 border-r align-top text-slate-500">{rec.province}</td>;
      case 'municipality':
        return <td key={key} className="px-4 py-4 border-r align-top text-slate-600 font-bold uppercase tracking-tight">{rec.municipality}</td>;
      case 'memberName':
        return <td key={key} className="px-4 py-4 border-r font-black text-slate-800 align-top uppercase tracking-tighter text-[11px]">{rec.memberName}</td>;
      case 'updateType':
        return <td key={key} className="px-4 py-4 border-r italic text-slate-400 text-[10px] uppercase tracking-widest align-top font-bold max-w-[200px] leading-tight">{rec.updateType}</td>;
      case 'extraInfo':
        return <td key={key} className="px-4 py-4 border-r text-slate-500 text-[11px] align-top leading-relaxed">{rec.extraInfo}</td>;
      case 'status':
        return (
            <td key={key} className="px-4 py-4 border-r align-top min-w-[300px]">
                <div className="flex flex-col gap-2.5">
                    {/* Status 1 Display Row */}
                    <div className="flex items-center justify-between group/s1 relative p-1.5 rounded-xl hover:bg-blue-50/50 transition-colors">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-300 w-6 shrink-0 uppercase tracking-tighter group-hover/s1:text-blue-500 transition-colors">S1:</span>
                            <StatusBadge status={rec.status as UpdateStatus} />
                            {isAdmin && (
                              <button 
                                onClick={() => onEdit(rec)} 
                                title="Direct Edit Status 1"
                                className="opacity-0 group-hover/s1:opacity-100 w-7 h-7 rounded-full bg-white border border-blue-200 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 shadow-sm"
                              >
                                <i className="fa-solid fa-pencil text-[10px]"></i>
                              </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 font-bold font-mono text-[10px] bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">
                            <i className="fa-regular fa-calendar-days text-slate-300"></i>
                            {formatDate(rec.statusDate1 || rec.date)}
                        </div>
                    </div>

                    {/* Status 2 Display Row */}
                    {rec.status2 ? (
                        <div className="flex items-center justify-between group/s2 relative p-1.5 rounded-xl hover:bg-indigo-50/50 transition-colors">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-300 w-6 shrink-0 uppercase tracking-tighter group-hover/s2:text-indigo-500 transition-colors">S2:</span>
                                <StatusBadge status={rec.status2 as UpdateStatus} />
                                {isAdmin && (
                                  <button 
                                    onClick={() => onEdit(rec)} 
                                    title="Direct Edit Status 2"
                                    className="opacity-0 group-hover/s2:opacity-100 w-7 h-7 rounded-full bg-white border border-indigo-200 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all transform hover:scale-110 shadow-sm"
                                  >
                                    <i className="fa-solid fa-pencil text-[10px]"></i>
                                  </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 font-bold font-mono text-[10px] bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">
                                <i className="fa-regular fa-calendar-check text-slate-300"></i>
                                {formatDate(rec.statusDate2)}
                            </div>
                        </div>
                    ) : (
                        isAdmin && (
                            <div className="flex items-center gap-2 px-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                 <span className="text-[10px] font-black text-slate-200 w-6 shrink-0 uppercase tracking-tighter">S2:</span>
                                 <button 
                                   onClick={() => onEdit(rec)}
                                   className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black border border-dashed border-slate-200 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all uppercase tracking-widest"
                                 >
                                   <i className="fa-solid fa-plus text-[9px]"></i> Add Status 2
                                 </button>
                            </div>
                        )
                    )}
                </div>
            </td>
        );
      default:
        return <td key={key} className="px-4 py-4 border-r align-top">{String(rec[key] || '')}</td>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Controls Row */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100">
         <div className="flex items-center space-x-3 bg-slate-50 px-6 py-3 rounded-[1.5rem] border border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Show</span>
            <div className="relative">
                <select 
                    value={itemsPerPage} 
                    onChange={(e) => onItemsPerPageChange(Number(e.target.value))} 
                    className="bg-white border-none text-slate-800 text-sm font-black rounded-lg px-2 py-0 outline-none focus:ring-0 cursor-pointer appearance-none pr-6"
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
                <i className="fa-solid fa-chevron-down absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entries</span>
         </div>

         <div className="flex-1 w-full md:w-auto relative">
            <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search records via Name, ID, or Location..." 
                className="w-full pl-12 pr-4 py-3 rounded-[1.5rem] border border-slate-100 bg-slate-50 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400" 
            />
            <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
         </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
         <div className="relative">
             <select 
                value={filterType || ''} 
                onChange={(e) => onFilterTypeChange(e.target.value || null)}
                className="w-full pl-5 pr-10 py-3 rounded-2xl border border-slate-100 bg-white text-[11px] font-bold text-slate-600 outline-none appearance-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm cursor-pointer"
             >
                <option value="">All Update Types</option>
                {dynamicFilterOptions.map(t => <option key={t} value={t}>{t}</option>)}
             </select>
             <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
         </div>

         <div className="relative">
             <select 
                value={filterMuni} 
                onChange={(e) => onFilterMuniChange(e.target.value)}
                className="w-full pl-5 pr-10 py-3 rounded-2xl border border-slate-100 bg-white text-[11px] font-bold text-slate-600 outline-none appearance-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm cursor-pointer"
             >
                <option value="All">All Municipalities</option>
                {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
             </select>
             <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
         </div>

         <div className="relative">
             <select 
                value={filterPeriod || ''} 
                onChange={(e) => onFilterPeriodChange(e.target.value ? Number(e.target.value) : null)}
                className="w-full pl-5 pr-10 py-3 rounded-2xl border border-slate-100 bg-white text-[11px] font-bold text-slate-600 outline-none appearance-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm cursor-pointer"
             >
                <option value="">All Periods</option>
                {[1, 2, 3, 4, 5, 6].map(p => <option key={p} value={p}>Period {p}</option>)}
             </select>
             <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
         </div>

         <div className="relative">
             <select 
                value={filterStatus2 || ''} 
                onChange={(e) => onFilterStatus2Change(e.target.value || null)}
                className="w-full pl-5 pr-10 py-3 rounded-2xl border border-slate-100 bg-white text-[11px] font-bold text-slate-600 outline-none appearance-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm cursor-pointer"
             >
                <option value="">All Status 2</option>
                {Object.values(UpdateStatus).map(s => <option key={s} value={s}>{s}</option>)}
             </select>
             <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
         </div>

         <div className="relative">
             <select 
                value={sortOption} 
                onChange={(e) => onSortOptionChange(e.target.value)}
                className="w-full pl-5 pr-10 py-3 rounded-2xl border border-slate-100 bg-white text-[11px] font-bold text-slate-600 outline-none appearance-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm cursor-pointer"
             >
                <option value="newest">Date: Newest First</option>
                <option value="oldest">Date: Oldest First</option>
             </select>
             <i className="fa-solid fa-arrow-down-wide-short absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
         </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden min-h-[400px] relative">
        {records.length === 0 ? (
          <div className="absolute inset-4 border-2 border-dashed border-slate-100 rounded-[1.5rem] flex flex-col items-center justify-center bg-slate-50/30">
             <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
               <i className="fa-solid fa-folder-open text-3xl"></i>
             </div>
             <h3 className="text-lg font-bold text-slate-500">No Records Found</h3>
             <p className="text-xs text-slate-400 mt-1 font-medium">Adjust filters or search to view data.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-black uppercase tracking-[0.15em] border-b border-slate-100 text-[10px]">
                    {columns.map((col) => (
                      <th key={col.key} className="px-4 py-5 border-r border-slate-100 last:border-0 hover:bg-white transition-colors cursor-default whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                    {isAdmin && <th className="px-4 py-5 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-indigo-50/30 transition-colors group">
                      {columns.map(col => renderCell(rec, col.key))}
                      {isAdmin && (
                        <td className="px-4 py-4 text-center space-x-2 align-top">
                          <button onClick={() => onEdit(rec)} className="text-indigo-600 w-8 h-8 rounded-lg hover:bg-indigo-100 transition-colors inline-flex items-center justify-center shadow-sm border border-transparent hover:border-indigo-200"><i className="fa-solid fa-pen-to-square"></i></button>
                          <button onClick={() => onDelete(rec)} className="text-red-400 w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors inline-flex items-center justify-center shadow-sm border border-transparent hover:border-red-200"><i className="fa-solid fa-trash"></i></button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 px-6 py-6 border-t border-slate-100 flex justify-between items-center text-slate-500 text-sm">
                <div className="flex flex-col">
                <span className="font-black text-slate-800 tracking-tight">Page {currentPage} of {totalPages}</span>
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-0.5">Total Records: {totalRecords.toLocaleString()}</span>
                </div>
                <div className="flex space-x-2">
                <button 
                    onClick={() => onPageChange(currentPage - 1)} 
                    disabled={currentPage <= 1}
                    className="w-12 h-12 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white text-slate-600 transition-all shadow-sm flex items-center justify-center"
                >
                    <i className="fa-solid fa-chevron-left text-xs"></i>
                </button>
                <div className="w-12 h-12 flex items-center justify-center font-black text-indigo-600 bg-white border border-indigo-100 rounded-2xl shadow-sm text-sm">
                    {currentPage}
                </div>
                <button 
                    onClick={() => onPageChange(currentPage + 1)} 
                    disabled={currentPage >= totalPages}
                    className="w-12 h-12 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white text-slate-600 transition-all shadow-sm flex items-center justify-center"
                >
                    <i className="fa-solid fa-chevron-right text-xs"></i>
                </button>
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
