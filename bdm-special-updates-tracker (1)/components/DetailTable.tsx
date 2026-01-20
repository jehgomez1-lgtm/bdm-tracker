
import React, { useState } from 'react';
import { MemberRecord, UpdateStatus, UserRole } from '../types';

interface DetailTableProps {
  records: MemberRecord[];
  userRole: UserRole;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onEdit: (record: MemberRecord) => void;
  onDelete: (record: MemberRecord) => void;
  onBulkUpdate: (ids: string[], updates: Partial<MemberRecord>) => void;
  onBulkDelete: (ids: string[]) => void;
}

const StatusBadge: React.FC<{ status: UpdateStatus }> = ({ status }) => {
  const styles = {
    [UpdateStatus.RECEIVED]: 'bg-blue-100 text-blue-800 border-blue-200',
    [UpdateStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [UpdateStatus.PROCESSED]: 'bg-green-100 text-green-800 border-green-200',
    [UpdateStatus.REJECTED]: 'bg-red-100 text-red-800 border-red-200',
    [UpdateStatus.ENCODED]: 'bg-purple-100 text-purple-800 border-purple-200',
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-widest ${styles[status]}`}>{status}</span>;
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
  onPageChange, 
  onEdit, 
  onDelete 
}) => {
  const isAdmin = userRole === UserRole.ADMIN;
  
  // Column Reordering State
  const [columns, setColumns] = useState<ColumnDef[]>([
    { key: 'id', label: 'HHID' },
    { key: 'province', label: 'Province' },
    { key: 'municipality', label: 'Muni' },
    { key: 'memberName', label: 'Member Name' },
    { key: 'updateType', label: 'Update Type' },
    { key: 'status', label: 'Status' },
  ]);

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow drop
  };

  const handleDrop = (dropIdx: number) => {
    if (draggedIdx === null) return;
    const newColumns = [...columns];
    const draggedItem = newColumns.splice(draggedIdx, 1)[0];
    newColumns.splice(dropIdx, 0, draggedItem);
    setColumns(newColumns);
    setDraggedIdx(null);
  };

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-12 text-center border border-dashed border-gray-300">
        <i className="fa-solid fa-folder-open text-gray-300 text-5xl mb-4"></i>
        <h3 className="text-lg font-bold text-gray-500">No Records Found</h3>
      </div>
    );
  }

  const renderCell = (rec: MemberRecord, key: keyof MemberRecord) => {
    switch (key) {
      case 'id':
        return <td key={key} className="px-4 py-3 border-r font-mono">{rec.id}</td>;
      case 'province':
        return <td key={key} className="px-4 py-3 border-r">{rec.province}</td>;
      case 'municipality':
        return <td key={key} className="px-4 py-3 border-r">{rec.municipality}</td>;
      case 'memberName':
        return <td key={key} className="px-4 py-3 border-r font-bold">{rec.memberName}</td>;
      case 'updateType':
        return <td key={key} className="px-4 py-3 border-r italic text-gray-500">{rec.updateType}</td>;
      case 'status':
        return <td key={key} className="px-4 py-3 border-r"><StatusBadge status={rec.status as UpdateStatus} /></td>;
      default:
        return <td key={key} className="px-4 py-3 border-r">{String(rec[key])}</td>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border overflow-hidden">
      <div className="bg-indigo-50/50 px-4 py-2 border-b flex items-center space-x-2">
        <i className="fa-solid fa-up-down-left-right text-indigo-400 text-[10px]"></i>
        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Tip: Drag column headers to reorder your view</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 font-bold uppercase tracking-tight border-b">
              {columns.map((col, idx) => (
                <th 
                  key={col.key} 
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(idx)}
                  className={`px-4 py-3 border-r cursor-grab active:cursor-grabbing hover:bg-indigo-50 transition-colors select-none ${draggedIdx === idx ? 'opacity-30' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span>{col.label}</span>
                    <i className="fa-solid fa-grip-vertical opacity-20 text-[10px]"></i>
                  </div>
                </th>
              ))}
              {isAdmin && <th className="px-4 py-3 text-center min-w-[120px]">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((rec) => (
              <tr key={rec.id} className="hover:bg-gray-50 transition-colors group">
                {columns.map(col => renderCell(rec, col.key))}
                {isAdmin && (
                  <td className="px-4 py-3 text-center space-x-2">
                    <button onClick={() => onEdit(rec)} className="text-indigo-600 font-bold uppercase text-[10px] bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors">Edit</button>
                    <button onClick={() => onDelete(rec)} className="text-red-600 font-bold uppercase text-[10px] bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition-colors">Del</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center text-gray-500 text-sm">
        <div className="flex flex-col">
          <span className="font-bold text-slate-700">Page {currentPage} of {totalPages}</span>
          <span className="text-[10px] uppercase font-black text-slate-400">Total Records: {totalRecords.toLocaleString()}</span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => onPageChange(currentPage - 1)} 
            disabled={currentPage <= 1}
            className="px-4 py-2 border rounded-xl bg-white hover:bg-gray-100 disabled:opacity-30 text-xs font-black transition-all shadow-sm active:scale-95"
          >
            <i className="fa-solid fa-chevron-left mr-2"></i>PREV
          </button>
          <button 
            onClick={() => onPageChange(currentPage + 1)} 
            disabled={currentPage >= totalPages}
            className="px-4 py-2 border rounded-xl bg-white hover:bg-gray-100 disabled:opacity-30 text-xs font-black transition-all shadow-sm active:scale-95"
          >
            NEXT<i className="fa-solid fa-chevron-right ml-2"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
