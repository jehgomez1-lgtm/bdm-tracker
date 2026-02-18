
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

  // Robust CSV Line Parser
  const parseCSVLine = (text: string) => {
    const result = [];
    let cell = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === '"') {
        // Handle escaped quotes ("") inside quoted fields
        if (inQuotes && text[i + 1] === '"') {
          cell += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(cell.trim());
        cell = '';
      } else {
        cell += char;
      }
    }
    result.push(cell.trim()); // Push last cell
    return result;
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setProcessing(true);
    setProgress(0);
    setError(null);

    const reader = new FileReader();
    reader.readAsText(file, "UTF-8"); // Assuming UTF-8, change if encoding is different
    
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        // Split by newline but handle cases where newline is inside quotes (basic split might fail for complex CSVs, but usually sufficient for one-line-per-record)
        let lines: string[] | null = text.split(/\r?\n/);
        const totalLines = lines.length;
        
        if (totalLines < 2) throw new Error("File empty or missing headers.");

        // Parse Headers
        const headerLine = lines[0];
        const headers = parseCSVLine(headerLine).map(h => h.trim().toUpperCase());
        
        // Strict Index Finding Helper
        const findIdx = (keywords: string[]) => {
          // 1. Try exact match
          let idx = headers.findIndex(h => keywords.some(k => h === k));
          // 2. Try 'starts with' or 'includes' if exact fails
          if (idx === -1) {
             idx = headers.findIndex(h => keywords.some(k => h.includes(k)));
          }
          return idx;
        };

        // MAPPING CONFIGURATION BASED ON SCREENSHOT
        const mapping = {
          // A-D
          region: findIdx(['REGION']),
          province: findIdx(['PROVINCE']),
          muni: findIdx(['MUNICIPALITY']),
          brgy: findIdx(['BARANGAY']),
          
          // E-F
          hhid: findIdx(['HH_ID', 'HHID']),
          entryId: findIdx(['ENTRY_ID']),
          
          // G-J
          first: findIdx(['FIRST_NAME']),
          middle: findIdx(['MIDDLE_NAME']),
          last: findIdx(['LAST_NAME']),
          ext: findIdx(['EXT_NAME']),
          
          // K-N
          bday: findIdx(['BIRTHDAY']), // Column K
          age: findIdx(['AGE']),       // Column L
          sex: findIdx(['SEX']),       // Column N
          
          // O-Q
          clientStatus: findIdx(['CLIENT_STATUS']),
          csCategory: findIdx(['CS_CATEGORY']),
          memStatus: findIdx(['MEMBER_STATUS']),
          
          // R-V
          relation: findIdx(['RELATION_TO_HH_HEAD']),
          civil: findIdx(['CIVIL_STATUS']),
          grantee: findIdx(['GRANTEE']),
          set: findIdx(['HH_SET']),
          solo: findIdx(['SOLO_PARENT']),
          
          // W-X
          ip: findIdx(['IP_AFFILIATION']),
          pcn: findIdx(['PCN', 'PHILSYS_CARD_NO']),
          pcnRem: findIdx(['PCN_REMARKS']),
          
          // Z-AH
          preg: findIdx(['PREGNANCY_STATUS']),
          lmp: findIdx(['LMP']),
          healthMon: findIdx(['HEALTH_MONITORED']),
          healthFac: findIdx(['HEALTH_FACILITY']),
          healthFacStat: findIdx(['HEALTH_FACILITY_STATUS']),
          healthReason: findIdx(['REASON_FOR_NOT_ATTENDING_HEALTH']),
          healthRem: findIdx(['REASON_HEALTH_REMARKS']),
          disability: findIdx(['DISABILITY_TYPES']),
          childBene: findIdx(['CHILD_BENE']),
          
          // AI-AR
          grade: findIdx(['GRADE_LEVEL']),
          strand: findIdx(['SHS_STRAND']),
          track: findIdx(['SHS_TRACK']),
          educMon: findIdx(['EDUC_MONIT']),
          attend: findIdx(['ATTEND_SCHOOL']),
          school: findIdx(['SCHOOL_NAME']),
          educReason: findIdx(['REASON_FOR_NOT_ATTENDING_SCHOOL']),
          educRem: findIdx(['REASON_EDUC_REMARKS']),
          lrn: findIdx(['LRN', "LEARNER'S ID", 'LEARNER_ID']),
          lrnRem: findIdx(['LRN_REMARKS']),
          ageEduc: findIdx(['AGE_ON_EDUC'])
        };

        const finalRecords: HouseholdMember[] = [];
        const PARSE_CHUNK = 2000;
        let lineIdx = 1;

        const processBatch = async () => {
          if (!lines) return;
          const end = Math.min(lineIdx + PARSE_CHUNK, totalLines);
          
          for (let i = lineIdx; i < end; i++) {
            const line = lines[i];
            if (!line || line.trim() === "") continue;

            // Use the robust parser
            const cleanRow = parseCSVLine(line);
            
            // Basic validation: ensure we have at least HHID or Name
            if (cleanRow.length < 5) continue;

            const getVal = (idx: number) => (idx !== -1 && cleanRow[idx]) ? cleanRow[idx] : '';

            finalRecords.push({
              hhid: getVal(mapping.hhid),
              entryId: getVal(mapping.entryId),
              
              region: getVal(mapping.region),
              province: getVal(mapping.province),
              municipality: getVal(mapping.muni),
              barangay: getVal(mapping.brgy),
              
              firstName: getVal(mapping.first),
              lastName: getVal(mapping.last),
              middleName: getVal(mapping.middle),
              extName: getVal(mapping.ext),
              
              birthday: getVal(mapping.bday),
              age: parseInt(getVal(mapping.age)) || 0,
              sex: getVal(mapping.sex),
              
              clientStatus: getVal(mapping.clientStatus),
              csCategory: getVal(mapping.csCategory),
              memberStatus: getVal(mapping.memStatus),
              relationship: getVal(mapping.relation),
              civilStatus: getVal(mapping.civil),
              
              isGrantee: getVal(mapping.grantee),
              hhSet: getVal(mapping.set),
              
              soloparent: getVal(mapping.solo),
              ipAffiliation: getVal(mapping.ip),
              pcn: getVal(mapping.pcn),
              pcnRemarks: getVal(mapping.pcnRem),
              
              pregnancyStatus: getVal(mapping.preg),
              lmp: getVal(mapping.lmp),
              healthMonitored: getVal(mapping.healthMon),
              healthFacility: getVal(mapping.healthFac),
              healthFacilityStatus: getVal(mapping.healthFacStat),
              reasonNotAttendingHealth: getVal(mapping.healthReason),
              healthRemarks: getVal(mapping.healthRem),
              disability: getVal(mapping.disability),
              childBene: getVal(mapping.childBene),
              
              ageOnEduc: getVal(mapping.ageEduc),
              gradeLevel: getVal(mapping.grade),
              shsStrand: getVal(mapping.strand),
              shsTrack: getVal(mapping.track),
              educMonit: getVal(mapping.educMon),
              attendingSchool: getVal(mapping.attend),
              schoolName: getVal(mapping.school),
              reasonNotAttendingSchool: getVal(mapping.educReason),
              educRemarks: getVal(mapping.educRem),
              lrn: getVal(mapping.lrn),
              lrnRemarks: getVal(mapping.lrnRem)
            });
          }
          
          lineIdx = end;
          setProgress(Math.round((lineIdx / totalLines) * 100));

          if (lineIdx < totalLines) {
            setTimeout(processBatch, 0); // Yield to UI
          } else {
            // Processing Complete
            lines = null; 
            await saveHouseholdRecordsInBatches(finalRecords, (p) => setSaveProgress(p));
            onFinish();
          }
        };

        processBatch();

      } catch (err: any) {
        console.error(err);
        setError("Import Error: " + err.message);
        setProcessing(false);
      }
    };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden p-10 text-center animate-in zoom-in-95 duration-200">
        <h2 className="text-2xl font-black text-slate-800 uppercase italic mb-2 tracking-tighter">Large Volume Import</h2>
        <p className="text-xs text-slate-400 mb-8 font-medium">Compatible with Masterlist Extract Format</p>

        {processing ? (
          <div className="space-y-6">
             <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner">
                <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
             </div>
             <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Parsing CSV: {progress}% Complete</p>
             
             {progress === 100 && (
               <>
                 <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner mt-4">
                    <div className="bg-teal-500 h-full transition-all duration-300" style={{ width: `${saveProgress}%` }}></div>
                 </div>
                 <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Database Indexing: {saveProgress}% Complete</p>
               </>
             )}
          </div>
        ) : (
          <button onClick={() => fileInputRef.current?.click()} className="bg-[#1e293b] text-white px-10 py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 hover:bg-black transition-all">
             <i className="fa-solid fa-file-csv mr-2"></i> Select Profile Dataset (.csv)
          </button>
        )}
        <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleCsvUpload} />
        {error && <p className="text-red-500 mt-4 font-bold text-xs bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
        <button onClick={onClose} disabled={processing} className="mt-8 text-slate-400 font-bold uppercase text-[10px] hover:text-slate-600">Cancel</button>
      </div>
    </div>
  );
};
