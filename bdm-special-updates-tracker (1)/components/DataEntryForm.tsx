
import React, { useState, useEffect, useMemo } from 'react';
import { UPDATE_TYPES } from '../constants';
import { MemberRecord, UpdateStatus, MasterRecord } from '../types';

interface MemberEntry {
  name: string;
  mid: string;
}

interface DataEntryFormProps {
  onSave: (record: MemberRecord) => void;
  onClose: () => void;
  initialRecord?: MemberRecord | null;
  masterList?: MasterRecord[];
}

export const DataEntryForm: React.FC<DataEntryFormProps> = ({ onSave, onClose, initialRecord, masterList = [] }) => {
  const [formData, setFormData] = useState({
    hhid: '',
    updateType: 'UPDATE 9 - Basic Information',
    received: new Date().toISOString().split('T')[0],
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

  // Optimized Master Lookup for 100k+ records
  const masterLookup = useMemo(() => {
    const map = new Map<string, MasterRecord>();
    masterList.forEach(m => {
      if (!m.hhid) return;
      const id = String(m.hhid).trim().toUpperCase();
      map.set(id, m);
      // Key with no dashes for robust matching
      map.set(id.replace(/-/g, ''), m);
    });
    return map;
  }, [masterList]);

  const calculatedPeriodStr = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const periods = ["Period 1", "Period 1", "Period 2", "Period 2", "Period 3", "Period 3", "Period 4", "Period 4", "Period 5", "Period 5", "Period 6", "Period 6"];
    return `${periods[month]} - ${year}`;
  }, []);

  const isHHOnly = formData.updateType.includes("Code 12 - Moved-Out HH") || formData.updateType === "Code 14";

  useEffect(() => {
    if (initialRecord) {
      setFormData({
        hhid: initialRecord.id,
        updateType: initialRecord.updateType || 'UPDATE 9 - Basic Information',
        received: initialRecord.date,
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
    
    // Check direct match or dash-less match
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
      // Auto-fill logic removed as per user request
      setIsVerified(true);
    } else {
      setFormData(prev => ({ ...prev, province: '', municipality: '', barangay: '', granteeName: '' }));
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
    const t = formData.updateType;
    if (t.includes("Duplicate")) return ["Retain", "Delist"];
    if (t.includes("UPDATE 5")) return ["1 - Distance", "2 - Inaccessible", "3 - Supply-Side", "4 - Sickly", "5 - Working", "6 - Disability", "9 - Bullied", "10 - Financial", "11 - Sibling Care", "19 - Early Pregnancy", "20 - Early Marriage", "22 - Emotionally Unprepared"];
    if (t.includes("UPDATE 2")) return ["Municipality", "Province"];
    if (t.includes("UPDATE 1 & 8")) return ["Update 1 - Newborn", "Update 8 - Adtl Member"];
    return [];
  };

  const needsMID = formData.updateType.includes("Code 12 - Moved-Out Member") || formData.updateType.includes("Duplicate Member");
  const showReasonDiv = getDynamicOptions().length > 0;
  const showAttending = formData.updateType.includes("UPDATE 5");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) return alert("Please enter a valid Household ID to verify data.");

    members.forEach(m => {
      const periodNum = parseInt(calculatedPeriodStr.match(/\d+/)?.[0] || '1');
      let details = formData.reasonResolution;
      if (showAttending) details = formData.attending === 'Yes' ? 'Attending' : details;
      if (needsMID && m.mid) details = `${details} (MID: ${m.mid})`.trim();

      onSave({
        ...initialRecord,
        id: formData.hhid,
        province: formData.province,
        municipality: formData.municipality,
        barangay: formData.barangay,
        granteeName: formData.granteeName,
        memberName: m.name || formData.granteeName,
        updateType: formData.updateType,
        date: formData.received,
        period: periodNum,
        status: formData.docStatus,
        extraInfo: details
      });
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center px-10 py-7 border-b border-gray-100 bg-white">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-[#1e293b] tracking-tighter italic leading-none">Update Tracking Hub</h2>
            <div className="flex items-center mt-2">
              <span className={`w-2.5 h-2.5 rounded-full mr-2 shadow-sm ${isVerified ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {isVerified ? 'CLOUD MASTER LINKED' : 'WAITING FOR ID VERIFICATION'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10 max-h-[85vh] overflow-y-auto custom-scrollbar">
          
          <section className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
              <h3 className="text-[13px] font-black text-[#1e293b] uppercase tracking-widest">1. Identify</h3>
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
              isVerified ? 'bg-white border-indigo-100 shadow-xl scale-100' : 'bg-slate-50/40 border-slate-50 opacity-40 scale-95 origin-top'
            }`}>
               <div className="space-y-6">
                 <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center">
                   <i className="fa-solid fa-shield-halved mr-2"></i> Locked Master Node Data
                 </h4>
                 <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Province</label>
                      <div className="font-black text-[#1e293b] text-sm truncate uppercase tracking-tight">{formData.province || '---'}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Municipality</label>
                      <div className="font-black text-[#1e293b] text-sm truncate uppercase tracking-tight">{formData.municipality || '---'}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Barangay</label>
                      <div className="font-black text-[#1e293b] text-sm truncate uppercase tracking-tight">{formData.barangay || '---'}</div>
                    </div>
                    <div className="col-span-2 space-y-1 pt-4 border-t border-slate-50">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grantee Name</label>
                      <div className="font-black text-[#1e293b] text-[15px] truncate uppercase tracking-tighter leading-none">{formData.granteeName || 'ENTER HHID...'}</div>
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
                    <input 
                      type="text" 
                      placeholder="Name/Address of Member..." 
                      value={m.name}
                      disabled={isHHOnly}
                      onChange={(e) => updateMember(i, 'name', e.target.value)}
                      className="w-full bg-transparent border-b-2 border-slate-200 py-3 text-sm font-black outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-300"
                    />
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
              <h3 className="text-[13px] font-black text-[#1e293b] uppercase tracking-widest">3. Update Info</h3>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Classification Protocol</label>
                <div className="relative">
                  <select 
                    value={formData.updateType} 
                    onChange={e => setFormData({...formData, updateType: e.target.value})} 
                    className="w-full px-8 py-6 border-2 border-slate-100 rounded-[2rem] text-sm font-black bg-slate-50/30 focus:bg-white focus:border-indigo-500 outline-none appearance-none cursor-pointer transition-all"
                  >
                    {UPDATE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
                </div>
              </div>

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
              disabled={!isVerified}
              className={`w-full py-8 rounded-[2.5rem] font-black text-[13px] uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95 flex items-center justify-center group ${
                isVerified ? 'bg-[#1e293b] text-white hover:bg-black' : 'bg-slate-100 text-slate-300'
              }`}
            >
              {isVerified ? (
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
            {!isVerified && (
              <p className="text-center text-[10px] font-black text-orange-500 uppercase tracking-widest mt-4 animate-pulse">
                 Input a valid Household ID to unlock the form
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
