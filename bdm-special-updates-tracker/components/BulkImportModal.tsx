
import React, { useState, useRef } from 'react';
import { MemberRecord, UpdateStatus } from '../types';
import { UPDATE_TYPES } from '../constants';

interface BulkImportModalProps {
  onImport: (records: MemberRecord[]) => void;
  onClose: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ onImport, onClose }) => {
  const [previewData, setPreviewData] = useState<MemberRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): MemberRecord[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length < 2) throw new Error("CSV file is empty or missing headers.");

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ""));
    const records: MemberRecord[] = [];

    // Required fields mapping
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/["']/g, ""));
      if (currentLine.length < headers.length) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = currentLine[index];
      });

      // Map CSV keys to MemberRecord interface
      const record: MemberRecord = {
        id: row.id || row.hhid || `BULK-${Date.now()}-${i}`,
        province: row.province || 'MASBATE',
        municipality: row.municipality || 'BALENO',
        barangay: row.barangay || 'POBLACION',
        memberName: row.membername || row.name || 'Unknown Member',
        updateType: row.updatetype || 'UPDATE 9 - Basic Information',
        granteeName: row.granteename || 'Bulk Import',
        date: row.date || new Date().toISOString().split('T')[0],
        period: parseInt(row.period) || 1,
        status: (row.status?.toUpperCase() as UpdateStatus) || UpdateStatus.RECEIVED,
        extraInfo: row.extrainfo || ''
      };

      // Validate update type against constants
      if (!UPDATE_TYPES.includes(record.updateType)) {
         record.updateType = "UPDATE 9 - Basic Information";
      }

      records.push(record);
    }

    return records;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError("Please upload a valid CSV file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        setPreviewData(parsed);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const headers = "id,province,municipality,barangay,membername,updatetype,granteename,date,period,status,extrainfo";
    const example = "041012011-3988-00056,MASBATE,BALENO,POBLACION,DOE JOHN,Code 12 - Moved-Out Member,DOE JANE,2026-01-09,1,RECEIVED,";
    const blob = new Blob([`${headers}\n${example}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'datalink_import_template.csv';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Bulk Data Import</h2>
            <p className="text-xs text-gray-500 mt-1">Upload CSV files to process multiple records simultaneously.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${previewData.length > 0 ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50'}`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".csv"
            />
            <i className={`fa-solid ${previewData.length > 0 ? 'fa-file-circle-check text-green-500' : 'fa-cloud-arrow-up text-indigo-500'} text-4xl mb-3`}></i>
            <p className="text-sm font-bold text-gray-700">
              {previewData.length > 0 ? `${previewData.length} records ready for import` : 'Click or drag CSV file here to upload'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Maximum file size: 5MB</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 flex items-center text-red-700 text-sm">
              <i className="fa-solid fa-circle-exclamation mr-2"></i>
              {error}
            </div>
          )}

          {/* Preview Table */}
          {previewData.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Preview Records</h3>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Validated</span>
              </div>
              <div className="border rounded-lg overflow-hidden border-gray-100 shadow-sm">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 border-b font-bold text-gray-600">HHID</th>
                        <th className="px-3 py-2 border-b font-bold text-gray-600">Member Name</th>
                        <th className="px-3 py-2 border-b font-bold text-gray-600">Type</th>
                        <th className="px-3 py-2 border-b font-bold text-gray-600">Period</th>
                        <th className="px-3 py-2 border-b font-bold text-gray-600">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewData.slice(0, 50).map((p, i) => (
                        <tr key={i} className="bg-white">
                          <td className="px-3 py-2 text-gray-500 font-mono">{p.id}</td>
                          <td className="px-3 py-2 font-bold">{p.memberName}</td>
                          <td className="px-3 py-2 italic text-gray-400">{p.updateType}</td>
                          <td className="px-3 py-2 text-center">{p.period}</td>
                          <td className="px-3 py-2 text-gray-400">{p.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewData.length > 50 && (
                  <div className="p-2 bg-gray-50 text-center text-[10px] text-gray-400 border-t">
                    ... and {previewData.length - 50} more records
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          {!previewData.length && (
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                <i className="fa-solid fa-circle-info mr-2 text-indigo-500"></i>
                Import Instructions
              </h3>
              <ul className="text-xs text-gray-600 space-y-2 list-disc ml-4">
                <li>Headers must match the Datalink CSV template.</li>
                <li>Required columns: <strong>id, membername, updatetype, period</strong>.</li>
                <li>Optional columns: <strong>province, municipality, barangay, date, status, extrainfo</strong>.</li>
                <li>Dates should be in <strong>YYYY-MM-DD</strong> format.</li>
              </ul>
              <button 
                onClick={downloadTemplate}
                className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center"
              >
                <i className="fa-solid fa-download mr-1"></i>
                Download CSV Template
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button 
            disabled={previewData.length === 0}
            onClick={() => onImport(previewData)}
            className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg shadow-lg transition-all active:scale-95 flex items-center"
          >
            <i className="fa-solid fa-file-import mr-2"></i>
            Commit Import ({previewData.length} records)
          </button>
        </div>
      </div>
    </div>
  );
};
