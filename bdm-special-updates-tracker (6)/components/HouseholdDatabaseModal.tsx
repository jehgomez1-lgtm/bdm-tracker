
import React, { useState, useRef } from 'react';
import { HouseholdMember } from '../types';
import { saveHouseholdRecordsInBatches } from '../utils/db';

interface HouseholdDatabaseModalProps {
  onFinish: () => void;
  onClose: () => void;
}

export const HouseholdDatabaseModal: React.FC<HouseholdDatabaseModalProps> = ({ onFinish, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saveProgress, setSaveProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setProcessing(true);
    setProgress(0);
    setError(null);

    const reader = new FileReader();
    reader.readAsText(file, "windows-1252");
    
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        let lines: string[] | null = text.split(/\r?\n/);
        const totalLines = lines.length;
        
        if (totalLines < 2) throw new Error("File empty.");

        const headers = lines[0].split(',').map(h => h.trim().toUpperCase().replace(/^"|"$/g, ''));
        const findIdx = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h === k || h.includes(k)));

        const mapping = {
          idxHhid: findIdx(['HH_ID', 'HHID']),
          idxEntryId: findIdx(['ENTRY_ID']),
          idxFirst: findIdx(['FIRST_NAME']),
          idxLast: findIdx(['LAST_NAME']),
          idxBrgy: findIdx(['BARANGAY']),
          idxMuni: findIdx(['MUNICIPALITY']),
          idxSex: findIdx(['SEX']),
          idxAge: findIdx(['AGE'])
          // ... add other essential mappings
        };

        const finalRecords: HouseholdMember[] = [];
        const PARSE_CHUNK = 10000;
        let lineIdx = 1;

        const processBatch = async () => {
          if (!lines) return;
          const end = Math.min(lineIdx + PARSE_CHUNK, totalLines);
          for (let i = lineIdx; i < end; i++) {
            const line = lines[i];
            if (!line || line.trim() === "") continue;

            const row = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
            const cleanRow = row.map(v => v ? v.trim().replace(/^"|"$/g, '') : '');
            if (cleanRow.length < 5) continue;

            const getVal = (idx: number) => (idx !== -1 && cleanRow[idx]) ? cleanRow[idx] : '';

            finalRecords.push({
              hhid: getVal(mapping.idxHhid),
              entryId: getVal(mapping.idxEntryId),
              firstName: getVal(mapping.idxFirst),
              lastName: getVal(mapping.idxLast),
              middleName: '', extName: '', birthday: '', 
              region: '', province: '', municipality: getVal(mapping.idxMuni), barangay: getVal(mapping.idxBrgy),
              age: parseInt(getVal(mapping.idxAge)) || 0, sex: getVal(mapping.idxSex),
              clientStatus: '', memberStatus: '', relationship: '', civilStatus: '', isGrantee: '', hhSet: '', soloparent: '', ipAffiliation: '', pcn: '', pregnancyStatus: '', healthFacility: '', attendingSchool: '', schoolName: '', gradeLevel: '', lrn: '', disability: ''
            });
          }
          
          lineIdx = end;
          setProgress(Math.round((lineIdx / totalLines) * 100));

          if (lineIdx < totalLines) {
            setTimeout(processBatch, 0);
          } else {
            // Memory Release Hint
            lines = null;
            // Batch Save to DB
            await saveHouseholdRecordsInBatches(finalRecords, (p) => setSaveProgress(p));
            onFinish();
          }
        };

        processBatch();

      } catch (err: any) {
        setError(err.message);
        setProcessing(false);
      }
    };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden p-10 text-center">
        <h2 className="text-2xl font-black text-slate-800 uppercase italic mb-2 tracking-tighter">Large Volume Import</h2>
        <p className="text-xs text-slate-400 mb-8 font-medium">Processing 700,000+ records requires background database indexing.</p>

        {processing ? (
          <div className="space-y-6">
             <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner">
                <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
             </div>
             <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Parsing: {progress}% Complete</p>
             
             {progress === 100 && (
               <>
                 <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner mt-4">
                    <div className="bg-teal-500 h-full transition-all duration-300" style={{ width: `${saveProgress}%` }}></div>
                 </div>
                 <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">DB Indexing: {saveProgress}% Complete</p>
               </>
             )}
          </div>
        ) : (
          <button onClick={() => fileInputRef.current?.click()} className="bg-[#1e293b] text-white px-10 py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95">Select 700K Record CSV</button>
        )}
        <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleCsvUpload} />
        {error && <p className="text-red-500 mt-4 font-bold text-xs">{error}</p>}
        <button onClick={onClose} disabled={processing} className="mt-8 text-slate-400 font-bold uppercase text-[10px] hover:text-slate-600">Cancel</button>
      </div>
    </div>
  );
};
