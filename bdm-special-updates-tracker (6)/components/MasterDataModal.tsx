
import React, { useState, useRef } from 'react';
import { MasterRecord } from '../types';

interface MasterDataModalProps {
  cloudUrl: string;
  currentMaster: MasterRecord[];
  onUpdate: (newList: MasterRecord[]) => void;
  onClose: () => void;
}

export const MasterDataModal: React.FC<MasterDataModalProps> = ({ cloudUrl, currentMaster, onUpdate, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseAndSave = (rows: any[], headers: string[]) => {
    const newRecords: MasterRecord[] = [];
    
    for (let i = 1; i < rows.length; i++) {
        const currentLine = rows[i];
        if (!currentLine || currentLine.length === 0) continue;

        const row: any = {};
        headers.forEach((h, idx) => {
            row[h] = currentLine[idx];
        });

        // Normalize keys
        const idVal = row.hhid || row.id || row['hh id'];
        const provVal = row.province;
        const muniVal = row.municipality || row.city || row.muni;
        const brgyVal = row.barangay || row.brgy;
        const nameVal = row.granteename || row.grantee_name || row.name || row['grantee name'];

        if (idVal) {
            newRecords.push({
                hhid: String(idVal).trim(),
                province: String(provVal || 'MASBATE').trim(),
                municipality: String(muniVal || '').trim(),
                barangay: String(brgyVal || '').trim(),
                granteeName: String(nameVal || '').trim()
            });
        }
    }
    onUpdate(newRecords);
  };

  const handleCloudSync = async () => {
    if (!cloudUrl) {
        setError("Please configure the Cloud URL in the Setup tab first.");
        return;
    }
    setIsSyncing(true);
    setError(null);
    try {
        const separator = cloudUrl.includes('?') ? '&' : '?';
        const res = await fetch(`${cloudUrl}${separator}sheet=HHID STATUS`);
        const json = await res.json();
        
        // Handle GAS response structure
        let rows = [];
        if (json.status === 'success' && Array.isArray(json.data)) {
            rows = json.data;
        } else if (Array.isArray(json)) {
            rows = json;
        } else if (json.data && Array.isArray(json.data)) {
            rows = json.data;
        }

        if (rows.length < 2) throw new Error("Sheet 'HHID STATUS' is empty or missing headers.");
        
        const headers = rows[0].map((h: any) => String(h).trim().toLowerCase());
        parseAndSave(rows, headers);
        
    } catch (e: any) {
        setError("Sync failed: " + e.message);
    } finally {
        setIsSyncing(false);
    }
  };

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
        const rows = lines.map(line => line.split(',').map(v => v.trim())); // Convert to array of arrays to match sync logic
        
        parseAndSave(rows, headers);
        setError(null);
      } catch (err: any) {
        setError("Error parsing master CSV. Ensure headers are present.");
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const headers = "ID,Client Status,City,Barangay,Name,Province";
    const example = "054102010-0807-00020,1 - Active,BALENO,GABI,ESQUILONA ROSE MARIE BANCULO,MASBATE";
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
            <h2 className="text-xl font-bold text-gray-800">Master Data Management</h2>
            <p className="text-xs text-gray-500 mt-1">Syncs with the <b>HHID STATUS</b> tab of your spreadsheet.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm">
              <span className="font-bold text-indigo-600">{currentMaster.length.toLocaleString()}</span> records in local cache.
            </div>
            <div className="flex gap-2">
                <button 
                  onClick={handleCloudSync}
                  disabled={isSyncing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-bold flex items-center space-x-2 transition-colors disabled:opacity-50 shadow-sm"
                >
                  <i className={`fa-solid ${isSyncing ? 'fa-circle-notch animate-spin' : 'fa-cloud-arrow-down'}`}></i>
                  <span>{isSyncing ? 'Syncing...' : 'Sync from Cloud'}</span>
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded text-sm font-bold flex items-center space-x-2 transition-colors"
                >
                  <i className="fa-solid fa-file-csv"></i>
                  <span>Upload CSV</span>
                </button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleCsvUpload} />
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded text-xs border border-red-100 font-bold">{error}</div>}

          <div className="border rounded-lg overflow-hidden bg-slate-50">
            <div className="max-h-60 overflow-y-auto">
              {currentMaster.length === 0 ? (
                 <div className="p-8 text-center text-gray-400 text-xs italic">
                    No master records loaded. Click "Sync from Cloud" to fetch from HHID STATUS.
                 </div>
              ) : (
                <table className="w-full text-left text-[11px] bg-white">
                    <thead className="bg-gray-100 sticky top-0 text-gray-600">
                    <tr>
                        <th className="px-3 py-2 border-b">HHID</th>
                        <th className="px-3 py-2 border-b">Province</th>
                        <th className="px-3 py-2 border-b">Brgy</th>
                        <th className="px-3 py-2 border-b">Grantee</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {currentMaster.slice(0, 10).map((m, i) => (
                        <tr key={i}>
                        <td className="px-3 py-2 font-mono text-slate-600">{m.hhid}</td>
                        <td className="px-3 py-2">{m.province}</td>
                        <td className="px-3 py-2">{m.barangay}</td>
                        <td className="px-3 py-2 truncate max-w-[150px] font-bold text-slate-700">{m.granteeName}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
              )}
              {currentMaster.length > 10 && <div className="p-2 text-center text-gray-400 text-[10px] bg-white border-t">... {currentMaster.length - 10} more records</div>}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-700">
             <h4 className="font-bold mb-2 uppercase tracking-widest flex items-center"><i className="fa-solid fa-circle-info mr-2"></i> Functionality</h4>
             <p className="mb-2">The <strong>Master Records</strong> count reflects the total number of households in the <strong>HHID STATUS</strong> tab of your spreadsheet.</p>
             <p>This list is used to auto-fill location and grantee data when you type an HHID in the New Entry form.</p>
             <button onClick={downloadTemplate} className="mt-3 font-black underline hover:text-blue-900">
                Download CSV Template
             </button>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
           <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded text-sm hover:bg-gray-300 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};
