
import React, { useState, useRef } from 'react';
import { MasterRecord } from '../types';

interface MasterDataModalProps {
  currentMaster: MasterRecord[];
  onUpdate: (newList: MasterRecord[]) => void;
  onClose: () => void;
}

export const MasterDataModal: React.FC<MasterDataModalProps> = ({ currentMaster, onUpdate, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length < 2) throw new Error("CSV is missing headers.");

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const newRecords: MasterRecord[] = [];

        for (let i = 1; i < lines.length; i++) {
          const currentLine = lines[i].split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((h, idx) => row[h] = currentLine[idx]);

          if (row.hhid) {
            newRecords.push({
              hhid: row.hhid,
              province: row.province || '',
              municipality: row.municipality || '',
              barangay: row.barangay || '',
              granteeName: row.granteename || row.grantee_name || ''
            });
          }
        }
        onUpdate(newRecords);
      } catch (err: any) {
        setError("Error parsing master CSV. Ensure headers match: hhid, province, municipality, barangay, granteename");
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const headers = "hhid,province,municipality,barangay,granteename";
    const example = "054102010-0807-00020,MASBATE,BALENO,GABI,ESQUILONA ROSE MARIE BANCULO";
    const blob = new Blob([`${headers}\n${example}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HH_STATUS_MASTER_TEMPLATE.csv';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Master Data (HH STATUS)</h2>
            <p className="text-xs text-gray-500 mt-1">This data is used to autogenerate fields in the transaction form.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-bold text-indigo-600">{currentMaster.length}</span> records currently in master list.
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#3b3b8c] text-white px-4 py-2 rounded text-sm font-bold flex items-center space-x-2"
            >
              <i className="fa-solid fa-upload"></i>
              <span>Upload CSV (Master)</span>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleCsvUpload} />
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded text-xs border border-red-100">{error}</div>}

          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 border-b">HHID</th>
                    <th className="px-3 py-2 border-b">Province</th>
                    <th className="px-3 py-2 border-b">Brgy</th>
                    <th className="px-3 py-2 border-b">Grantee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentMaster.slice(0, 5).map((m, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-mono">{m.hhid}</td>
                      <td className="px-3 py-2">{m.province}</td>
                      <td className="px-3 py-2">{m.barangay}</td>
                      <td className="px-3 py-2 truncate max-w-[150px]">{m.granteeName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {currentMaster.length > 5 && <div className="p-2 text-center text-gray-400 text-[10px]">... {currentMaster.length - 5} more records</div>}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-700">
             <h4 className="font-bold mb-2 uppercase tracking-widest">How it works:</h4>
             <p>This mimics the <strong>'HH STATUS'</strong> tab in your Excel file. When you type an HHID in the entry form, the system automatically pulls the Province, Municipality, Barangay, and Grantee Name from this list.</p>
             <button onClick={downloadTemplate} className="mt-3 font-black underline hover:text-blue-900">
                Download CSV Template
             </button>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
           <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded text-sm">Close</button>
        </div>
      </div>
    </div>
  );
};
