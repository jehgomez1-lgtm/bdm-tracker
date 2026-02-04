
import React, { useState, useEffect, useMemo } from 'react';
import { UPDATE_TYPES } from '../constants';
import { MemberRecord, UpdateStatus, MasterRecord } from '../types';

interface MemberEntry {
  name: string;
  mid: string;
}

interface DataEntryFormProps {
  onSave: (record: MemberRecord) => Promise<void>; 
  onPostSave: () => void;
  onClose: () => void;
  initialRecord?: MemberRecord | null;
  masterList?: MasterRecord[];
  existingRecords?: MemberRecord[];
}

export const DataEntryForm: React.FC<DataEntryFormProps> = ({ 
  onSave, 
  onPostSave, 
  onClose, 
  initialRecord, 
  masterList = [],
  existingRecords = []
}) => {
  const [formData, setFormData] = useState({
    hhid: '',
    updateType: '', // Default to empty string for "--Choose--"
    received: new Date().toISOString().split('T')[0],
    period: 1, 
    docStatus: UpdateStatus.RECEIVED,
    attending: 'Yes' as 'Yes' | 'No',
    reasonResolution: '',
    province: '',
    municipality: '',
    barangay: '',
    granteeName: ''
  });

  const [members, setMembers] = useState<MemberEntry[]>([{ name: '', mid: '' }]);
  const [isVerified, setIsVerified] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Optimized Master Lookup for 100k+ records
  const masterLookup = useMemo(() => {
    const map = new Map<string, MasterRecord>();
    masterList.forEach(m => {
      if (!m.hhid) return;
      const id = String(m.hhid).trim().toUpperCase();
      map.set(id, m);
      map.set(id.replace(/-/g, ''), m);
    });
    return map;
  }, [masterList]);

  // Calculate default period based on month
  useEffect(() => {
    if (!initialRecord) {
        const now = new Date();
        const month = now.getMonth(); // 0-11
        const p = Math.floor(month / 2) + 1; // 0,1->1, 2,3->2, etc.
        setFormData(prev => ({ ...prev, period: p }));
    }
  }, [initialRecord]);

  const isHHOnly = formData.updateType.includes("Code 12 - Moved-Out HH") || formData.updateType === "Code 14";
  const isEditMode = !!initialRecord;

  useEffect(() => {
    if (initialRecord) {
      // Clean ID if it has a suffix for display
      const cleanId = initialRecord.id.split('_uid_')[0];
      
      setFormData({
        hhid: cleanId,
        updateType: initialRecord.updateType || '',
        received: initialRecord.date,
        period: initialRecord.period,
        docStatus: initialRecord.status,
        attending: 'Yes',
        reasonResolution: initialRecord.extraInfo || '',
        province: initialRecord.province,
        municipality: initialRecord.municipality,
        barangay: initialRecord.barangay,
        granteeName: initialRecord.granteeName
      });
      setMembers([{ name: initialRecord.memberName, mid: '' }]);
      setIsVerified(true);
    }
  }, [initialRecord]);

  const handleHhidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const value = rawValue.trim().toUpperCase();
    setFormData(prev => ({ ...prev, hhid: rawValue }));
    
    let match = masterLookup.get(value);
    if (!match) {
      match = masterLookup.get(value.replace(/-/g, ''));
    }

    if (match) {
      setFormData(prev => ({
        ...prev,
        province: match.province,
        municipality: match.municipality,
        barangay: match.barangay,
        granteeName: match.granteeName,
      }));
      setIsVerified(true);
      if (isManualMode) setIsManualMode(false);
    } else {
      if (!isManualMode) {
          setFormData(prev => ({ ...prev, province: '', municipality: '', barangay: '', granteeName: '' }));
      }
      setIsVerified(false);
    }
  };

  const addMember = () => !isHHOnly && setMembers([...members, { name: '', mid: '' }]);
  const removeMember = (idx: number) => members.length > 1 && setMembers(members.filter((_, i) => i !== idx));
  
  const updateMember = (idx: number, field: keyof MemberEntry, val: string) => {
    const newMembers = [...members];
    newMembers[idx][field] = val;
    setMembers(newMembers);
  };

  const getDynamicOptions = () => {
    // If multiple members, show options based on the global type, logic might be specific per member but keeping it simple for now
    const t = formData.updateType;
    if (!t) return [];
    if (t.includes("Duplicate")) return ["Retain", "Delist"];
    if (t.includes("UPDATE 5")) return ["1 - Distance", "2 - Inaccessible", "3 - Supply-Side", "4 - Sickly", "5 - Working", "6 - Disability", "9 - Bullied", "10 - Financial", "11 - Sibling Care", "19 - Early Pregnancy", "20 - Early Marriage", "22 - Emotionally Unprepared"];
    if (t.includes("UPDATE 2")) return ["Municipality", "Province"];
    if (t.includes("UPDATE 1 & 8")) return ["Update 1 - Newborn", "Update 8 - Adtl Member"];
    return [];
  };

  const needsMID = formData.updateType.includes("Code 12 - Moved-Out Member") || formData.updateType.includes("Duplicate Member");
  const showReasonDiv = getDynamicOptions().length > 0;
  const showAttending = formData.updateType.includes("UPDATE 5");
  const isFormLocked = !isVerified && !isManualMode;

  // Specific options requested by user for Edit Mode
  const STATUS_OPTIONS = [
    UpdateStatus.RECEIVED,
    UpdateStatus.ENCODED,
    UpdateStatus.PENDING,
    UpdateStatus.DISCARDED,
    UpdateStatus.RETURNED,
    UpdateStatus.SENT_THROUGH_MAIL
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormLocked) return alert("Please enter a valid Household ID to verify data or enable Manual Mode.");

    // Validate that updateType is selected
    if (!formData.updateType) {
        alert("Please enter an update type.");
        return;
    }

    setIsSubmitting(true);
    
    // Duplicate Check Logic
    // We collect duplicates to show a single warning
    const duplicates: string[] = [];

    // Helper to get raw HHID from a potentially composite ID (e.g. HHID_uid_123)
    const getBaseHhid = (fullId: string) => fullId.split('_uid_')[0];

    for (const m of members) {
      const memberNameToCheck = (m.name || formData.granteeName).toLowerCase().trim();
      const typeToCheck = formData.updateType;
      const hhidToCheck = formData.hhid.trim().toUpperCase();

      // Check if this combination exists in existingRecords
      const isDuplicate = existingRecords.some(r => {
        // If we are in edit mode, ignore the record currently being edited
        if (initialRecord && r.id === initialRecord.id) return false;

        const rHhid = getBaseHhid(r.id).toUpperCase();
        const rName = r.memberName.toLowerCase().trim();
        const rType = r.updateType;

        return (
          rHhid === hhidToCheck &&
          rType === typeToCheck &&
          rName === memberNameToCheck
        );
      });

      if (isDuplicate) {
        duplicates.push(m.name || formData.granteeName);
      }
    }

    if (duplicates.length > 0) {
      const confirmed = window.confirm(
        `⚠️ DUPLICATE ENTRY WARNING ⚠️\n\nThe following members already exist with HHID ${formData.hhid} and update type "${formData.updateType}":\n\n${duplicates.map(d => `• ${d}`).join('\n')}\n\nDo you want to continue saving regardless?`
      );
      
      if (!confirmed) {
        setIsSubmitting(false);
        return;
      }
    }

    try {
        for (const m of members) {
            let details = formData.reasonResolution;
            if (showAttending) details = formData.attending === 'Yes' ? 'Attending' : details;
            if (needsMID && m.mid) details = `${details} (MID: ${m.mid})`.trim();

            // Generate Unique ID logic for duplicates support:
            // If we are editing an existing record (initialRecord exists) and this is the first member in the list, preserve the ID.
            // Otherwise, append a unique suffix to ensure the backend creates a NEW row instead of overwriting.
            
            let recordId = formData.hhid;
            
            if (initialRecord && members.indexOf(m) === 0) {
               // Preserve existing ID for the record we are editing
               recordId = initialRecord.id; 
            } else {
               // Generate unique ID for new records (Composite ID)
               // Format: HHID_uid_Timestamp_Random
               // DetailTable strips everything after _uid_ for display
               const suffix = `_uid_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
               recordId = `${formData.hhid}${suffix}`;
            }

            const recordToSave: MemberRecord = {
                id: recordId,
                province: formData.province || 'MASBATE',
                municipality: formData.municipality || 'BALENO',
                barangay: formData.barangay || 'POBLACION',
                granteeName: formData.granteeName || 'UNKNOWN',
                memberName: m.name || formData.granteeName,
                updateType: formData.updateType, // Use Global Update Type
                date: formData.received,
                period: Number(formData.period),
                status: formData.docStatus,
                extraInfo: details
            };

            await onSave(recordToSave);
        }
        onPostSave();
    } catch (err) {
        console.error(err);
        setIsSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center px-10 py-7 border-b border-gray-100 bg-white">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-[#1e293b] tracking-tighter italic leading-none">Update Tracking Hub</h2>
            <div className="flex items-center mt-2 space-x-3">
              <div className="flex items-center">
                <span className={`w-2.5 h-2.5 rounded-full mr-2 shadow-sm ${isVerified ? 'bg-green-500 animate-pulse' : isManualMode ? 'bg-indigo-500' : 'bg-orange-500'}`}></span>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isVerified ? 'CLOUD MASTER LINKED' : isManualMode ? 'MANUAL OVERRIDE' : 'WAITING FOR VERIFICATION'}
                </p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10 max-h-[85vh] overflow-y-auto custom-scrollbar">
          
          <section className="space-y-6">
            <div className="flex justify-between items-center">
               <div className="flex items-center space-x-3">
                 <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                 <h3 className="text-[13px] font-black text-[#1e293b] uppercase tracking-widest">1. Identify</h3>
               </div>
               {!isVerified && (
                  <label className="flex items-center space-x-2 cursor-pointer">
                     <input type="checkbox" checked={isManualMode} onChange={e => setIsManualMode(e.target.checked)} className="form-checkbox text-indigo-600 rounded" />
                     <span className="text-[9px] font-black uppercase text-indigo-600">Manual Entry Mode</span>
                  </label>
               )}
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Household ID Number (Required)</label>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2">
                   <i className={`fa-solid fa-address-card ${isVerified ? 'text-indigo-600' : 'text-slate-300'} text-lg`}></i>
                </div>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="05410xxxx-xxxx-xxxxx" 
                  value={formData.hhid} 
                  onChange={handleHhidChange} 
                  className={`w-full pl-16 pr-6 py-6 border-2 rounded-[1.5rem] text-sm font-black outline-none transition-all ${
                    isVerified ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-inner' : 'border-slate-100 bg-slate-50/50 focus:border-indigo-400 focus:bg-white'
                  }`}
                />
              </div>
            </div>

            <div className={`relative overflow-hidden p-8 rounded-[2rem] border-2 transition-all duration-500 ${
              !isFormLocked ? 'bg-white border-indigo-100 shadow-xl scale-100' : 'bg-slate-50/40 border-slate-50 opacity-40 scale-95 origin-top'
            }`}>
               <div className="space-y-6">
                 <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center">
                   <i className="fa-solid fa-shield-halved mr-2"></i> Location & Grantee Data
                 </h4>
                 <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Province</label>
                      <input 
                         disabled={!isManualMode}
                         value={formData.province}
                         onChange={e => setFormData({...formData, province: e.target.value})}
                         className="w-full bg-transparent border-b font-black text-[#1e293b] text-sm truncate uppercase tracking-tight focus:border-indigo-500 outline-none"
                         placeholder="---"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Municipality</label>
                      <input 
                         disabled={!isManualMode}
                         value={formData.municipality}
                         onChange={e => setFormData({...formData, municipality: e.target.value})}
                         className="w-full bg-transparent border-b font-black text-[#1e293b] text-sm truncate uppercase tracking-tight focus:border-indigo-500 outline-none"
                         placeholder="---"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Barangay</label>
                      <input 
                         disabled={!isManualMode}
                         value={formData.barangay}
                         onChange={e => setFormData({...formData, barangay: e.target.value})}
                         className="w-full bg-transparent border-b font-black text-[#1e293b] text-sm truncate uppercase tracking-tight focus:border-indigo-500 outline-none"
                         placeholder="---"
                      />
                    </div>
                    <div className="col-span-2 space-y-1 pt-4 border-t border-slate-50">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grantee Name</label>
                      <input 
                         disabled={!isManualMode}
                         value={formData.granteeName}
                         onChange={e => setFormData({...formData, granteeName: e.target.value})}
                         className="w-full bg-transparent font-black text-[#1e293b] text-[15px] truncate uppercase tracking-tighter leading-none focus:border-indigo-500 outline-none border-b border-transparent focus:border-indigo-200"
                         placeholder="ENTER HHID..."
                      />
                    </div>
                 </div>
               </div>
               {isVerified && <div className="absolute top-0 right-0 p-4 opacity-5"><i className="fa-solid fa-cloud-check text-5xl"></i></div>}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-1.5 h-6 bg-[#1e293b] rounded-full"></div>
                <h3 className="text-[13px] font-black text-[#1e293b] uppercase tracking-widest">2. Target Members</h3>
              </div>
              {!isHHOnly && (
                <button type="button" onClick={addMember} className="text-[10px] font-black bg-[#1e293b] text-white px-6 py-2.5 rounded-2xl hover:bg-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center">
                  <i className="fa-solid fa-plus mr-2"></i> Add Member
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {members.map((m, i) => (
                <div key={i} className={`relative p-8 bg-slate-50/50 rounded-[2rem] border-2 border-slate-50 transition-all ${isHHOnly ? 'opacity-40 grayscale' : 'hover:border-indigo-100 hover:bg-white'}`}>
                  {members.length > 1 && !isHHOnly && (
                    <button type="button" onClick={() => removeMember(i)} className="absolute -top-3 -right-3 w-9 h-9 bg-white border border-slate-100 shadow-md rounded-full text-red-500 text-[14px] flex items-center justify-center hover:bg-red-50 transition-all">
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  )}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Member Name</label>
                      <input 
                        type="text" 
                        placeholder="Lastname, Firstname MI" 
                        value={m.name}
                        disabled={isHHOnly}
                        onChange={(e) => updateMember(i, 'name', e.target.value)}
                        className="w-full bg-transparent border-b-2 border-slate-200 py-3 text-sm font-black outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-300"
                      />
                    </div>

                    {needsMID && (
                      <div className="flex items-center space-x-4 pt-2">
                        <span className="text-red-500 font-black text-xl animate-pulse">*</span>
                        <input 
                          type="text" 
                          placeholder="Member ID Required"
                          value={m.mid}
                          onChange={(e) => updateMember(i, 'mid', e.target.value)}
                          className="flex-1 bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-[12px] font-mono font-bold outline-none focus:border-indigo-400 shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-1.5 h-6 bg-[#1e293b] rounded-full"></div>
              <h3 className="text-[13px] font-black text-[#1e293b] uppercase tracking-widest">3. Main Classification</h3>
            </div>
            
            <div className="space-y-6">
              {/* Row 1: Special Updates (Protocol) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SPECIAL UPDATES</label>
                <div className="relative">
                  <select 
                    value={formData.updateType} 
                    onChange={e => setFormData({...formData, updateType: e.target.value})} 
                    className="w-full pl-6 pr-10 py-4 bg-white border border-slate-200 rounded-3xl text-[13px] font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                  >
                    <option value="" disabled>--Choose--</option>
                    {UPDATE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                </div>
              </div>

              {/* Row 2: Period and Date */}
              <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Period</label>
                    <div className="relative">
                        <select 
                            value={formData.period} 
                            onChange={e => setFormData({...formData, period: parseInt(e.target.value)})} 
                            className="w-full pl-6 pr-10 py-4 bg-white border border-slate-200 rounded-3xl text-[13px] font-bold text-slate-700 outline-none appearance-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm cursor-pointer"
                        >
                            {[1, 2, 3, 4, 5, 6].map(p => <option key={p} value={p}>Period {p}</option>)}
                        </select>
                        <i className="fa-solid fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                    <div className="relative">
                        <input 
                            type="date"
                            value={formData.received}
                            onChange={e => setFormData({...formData, received: e.target.value})}
                            className="w-full pl-6 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-[13px] font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm" 
                        />
                    </div>
                  </div>
              </div>

              {/* Edit Mode Only: Document Status */}
              {isEditMode && (
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-1 flex items-center">
                       <i className="fa-solid fa-pen-to-square mr-1"></i> Update Status
                    </label>
                    <div className="relative">
                       <select 
                          value={formData.docStatus} 
                          onChange={e => setFormData({...formData, docStatus: e.target.value as UpdateStatus})} 
                          className="w-full pl-6 pr-10 py-4 bg-orange-50/50 border border-orange-200 rounded-3xl text-[13px] font-bold text-orange-800 outline-none appearance-none cursor-pointer focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm"
                       >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                       <i className="fa-solid fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-orange-400 text-xs pointer-events-none"></i>
                    </div>
                 </div>
              )}

              {(showReasonDiv || showAttending) && (
                <div className="bg-indigo-50/40 p-10 rounded-[2.5rem] border-2 border-indigo-50 space-y-8">
                  {showAttending && (
                    <div className="space-y-5">
                      <label className="text-[11px] font-black text-indigo-900 uppercase tracking-widest block">Is the member attending school?</label>
                      <div className="flex space-x-12">
                        {['Yes', 'No'].map(val => (
                          <label key={val} className="flex items-center space-x-4 cursor-pointer group">
                            <input type="radio" checked={formData.attending === val} onChange={() => setFormData({...formData, attending: val as any})} className="w-6 h-6 text-indigo-600 border-indigo-200 focus:ring-indigo-500" />
                            <span className={`text-[15px] font-black transition-colors ${formData.attending === val ? 'text-indigo-900' : 'text-slate-400 group-hover:text-slate-600'}`}>{val}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!showAttending || formData.attending === 'No') && showReasonDiv && (
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-indigo-900 uppercase tracking-widest block">{showAttending ? 'Details / Reason' : 'Resolution / Level'}</label>
                      <select 
                        value={formData.reasonResolution}
                        onChange={(e) => setFormData({...formData, reasonResolution: e.target.value})}
                        className="w-full px-6 py-5 border-2 border-white rounded-[1.5rem] text-[13px] font-black outline-none focus:border-indigo-500 bg-white shadow-xl shadow-indigo-100/50 transition-all"
                      >
                        <option value="">-- Choose Category --</option>
                        {getDynamicOptions().map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={isFormLocked || isSubmitting}
              className={`w-full py-8 rounded-[2.5rem] font-black text-[13px] uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95 flex items-center justify-center group ${
                !isFormLocked ? 'bg-[#1e293b] text-white hover:bg-black' : 'bg-slate-100 text-slate-300'
              }`}
            >
              {isSubmitting ? (
                 <>
                   <i className="fa-solid fa-circle-notch animate-spin mr-4"></i>
                   Processing Entry...
                 </>
              ) : !isFormLocked ? (
                <>
                  <i className="fa-solid fa-cloud-arrow-up mr-4 text-indigo-400 group-hover:translate-y-[-2px] transition-transform"></i>
                  Commit to Dashboard
                </>
              ) : (
                <>
                  <i className="fa-solid fa-lock mr-4 opacity-30"></i>
                  Verification Required
                </>
              )}
            </button>
            {isFormLocked && (
              <p className="text-center text-[10px] font-black text-orange-500 uppercase tracking-widest mt-4 animate-pulse">
                 Input a valid Household ID or Enable Manual Mode
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
