
import React from 'react';
import { SummaryRow } from '../types';

interface SummaryTableProps {
  data: SummaryRow[];
  onDrillDown: (type: string | null, period: number | null) => void;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({ data, onDrillDown }) => {
  const grandTotal = data.reduce((sum, row) => sum + row.total, 0);
  const periodTotals = [0, 0, 0, 0, 0, 0].map((_, i) => 
    data.reduce((sum, row) => sum + row.periods[i], 0)
  );

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1e293b] text-white">
              <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.2em] border-r border-slate-700 min-w-[350px]">
                Classification Protocol
              </th>
              {[1, 2, 3, 4, 5, 6].map(p => (
                <th key={p} className="px-4 py-6 font-black text-[10px] uppercase text-center border-r border-slate-700">
                  P-{p} 2026
                </th>
              ))}
              <th className="px-8 py-6 font-black text-[10px] uppercase text-center min-w-[150px] bg-indigo-600">
                Volume Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-all group">
                <td className="px-8 py-5 font-bold text-slate-700 text-xs border-r border-slate-50 group-hover:text-indigo-600">
                  <button onClick={() => onDrillDown(row.updateType, null)} className="hover:underline text-left uppercase tracking-tight">
                    {row.updateType}
                  </button>
                </td>
                {row.periods.map((count, pIdx) => (
                  <td key={pIdx} className="px-4 py-5 text-center text-xs border-r border-slate-50">
                    <button 
                      onClick={() => count > 0 && onDrillDown(row.updateType, pIdx + 1)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl mx-auto transition-all ${count > 0 ? 'bg-indigo-50 text-indigo-600 font-black hover:scale-110 hover:bg-indigo-600 hover:text-white shadow-sm' : 'text-slate-200'}`}
                    >
                      {count}
                    </button>
                  </td>
                ))}
                <td className="px-8 py-5 text-center text-sm font-black text-slate-800 bg-slate-50/50">
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#f8fafc] border-t-2 border-slate-800 font-black text-slate-800">
              <td className="px-8 py-6 uppercase text-[10px] tracking-widest">Aggregate Grand Total</td>
              {periodTotals.map((total, i) => (
                <td key={i} className="px-4 py-6 text-center text-xs font-black">{total}</td>
              ))}
              <td className="px-8 py-6 text-center text-2xl bg-indigo-50 text-indigo-700 border-l border-indigo-100">{grandTotal}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
