
import React, { useState, useEffect, useMemo } from 'react';
// Fixed: Removed SCHOOL_CHANGE_REASONS and DUPLICATE_RESOLUTIONS as they are not exported from constants and are not used in this component.
import { UPDATE_TYPES, DUMMY_MASTER_LIST } from '../constants';
import { MemberRecord, UpdateStatus, MasterRecord } from '../types';

interface DataEntryFormProps {
  onSave: (record: MemberRecord) => void;
  onClose: () => void;
  initialRecord?: MemberRecord | null;
  masterList?: MasterRecord[];
}

export const DataEntryForm: React.FC<DataEntryFormProps> = ({ onSave, onClose, initialRecord, masterList = DUMMY_MASTER_LIST }) => {
  const [formData, setFormData] = useState({
    hhid: '',
    memberName: '',
    updateType: 'other updates',
    period: 'Period 1 - 2026',
    submitted: '2026-01-09',
    received: '2026-01-09',
    deadline: '',
    docStatus: UpdateStatus.RECEIVED,
    extraVal: '',
    province: '',
    municipality: '',
    barangay: '',
    granteeName: ''
  });

  const [isAutoFilled, setIsAutoFilled] = useState(false);

  useEffect(() => {
    if (initialRecord) {
      setFormData({
        hhid: initialRecord.id,
        memberName: initialRecord.memberName,
        updateType: initialRecord.updateType,
        period: `Period ${initialRecord.period} - 2026`,
        submitted: initialRecord.date,
        received: initialRecord.date,
        deadline: '',
        docStatus: initialRecord.status,
        extraVal: initialRecord.extraInfo || '',
        province: initialRecord.province,
        municipality: initialRecord.municipality,
        barangay: initialRecord.barangay,
        granteeName: initialRecord.granteeName
      });
      setIsAutoFilled(true);
    }
  }, [initialRecord]);

  const performLookup = (hhid: string) => {
    const match = masterList.find(m => m.hhid === hhid);
    if (match) {
      setFormData(prev => ({
        ...prev,
        hhid,
        province: match.province,
        municipality: match.municipality,
        barangay: match.barangay,
        granteeName: match.granteeName,
        memberName: prev.memberName || match.granteeName
      }));
      setIsAutoFilled(true);
    } else {
      setFormData(prev => ({
        ...prev,
        hhid,
        province: '',
        municipality: '',
        barangay: '',
        granteeName: ''
      }));
      setIsAutoFilled(false);
    }
  };

  const handleHhidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, hhid: val }));
    performLookup(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const periodMatch = formData.period.match(/\d+/);
    const periodValue = periodMatch?.[0] || '1';
    
    const newRecord: MemberRecord = {
      ...initialRecord,
      id: formData.hhid || (initialRecord ? initialRecord.id : `REC-${Date.now()}`),
      province: formData.province || 'MASBATE',
      municipality: formData.municipality || 'BALENO',
      barangay: formData.barangay || 'POBLACION',
      memberName: formData.memberName || 'Unknown',
      updateType: formData.updateType,
      granteeName: formData.granteeName || 'User Entry',
      date: formData.received,
      period: parseInt(periodValue),
      status: formData.docStatus,
      extraInfo: formData.extraVal
    };
    onSave(newRecord);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[#f7f9fc] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-700">{initialRecord ? 'Refine Tracking Data' : 'Update Tracking Form'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[85vh]">
          <section>
            <h3 className="text-[10px] font-black text-[#3b3b8c] uppercase tracking-widest border-b-2 border-gray-700 pb-1 mb-3">HH Identification (VLOOKUP)</h3>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">HHID <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type="text" placeholder="Scan or enter HHID..." value={formData.hhid} onChange={handleHhidChange} readOnly={!!initialRecord} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm outline-none" />
                <i className="fa-solid fa-id-card absolute left-3 top-3 text-gray-400 text-xs"></i>
                {isAutoFilled && <span className="absolute right-3 top-2.5 text-[9px] font-black text-green-500 bg-green-50 px-1 rounded border border-green-200 uppercase">Regional Node Match</span>}
              </div>
            </div>
          </section>

          <section className="bg-gray-100 p-4 rounded-xl space-y-3 border-2 border-gray-200">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
               <i className="fa-solid fa-location-dot mr-2 text-indigo-400"></i> Local Node Data
             </h3>
             <div className="grid grid-cols-2 gap-3 text-xs">
                <div><label className="text-[8px] text-gray-500 uppercase font-bold">Muni</label><div className="font-bold text-gray-700">{formData.municipality || '---'}</div></div>
                <div><label className="text-[8px] text-gray-500 uppercase font-bold">Brgy</label><div className="font-bold text-gray-700">{formData.barangay || '---'}</div></div>
                <div className="col-span-2"><label className="text-[8px] text-gray-500 uppercase font-bold">Grantee</label><div className="font-bold text-gray-700 truncate">{formData.granteeName || '---'}</div></div>
             </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-[#3b3b8c] uppercase tracking-widest border-b-2 border-gray-700 pb-1">Entry Profile</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Target Member Name</label>
                <input type="text" placeholder="Enter Full Name..." value={formData.memberName} onChange={e => setFormData({...formData, memberName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Tracking Update Type</label>
                <select value={formData.updateType} onChange={e => setFormData({...formData, updateType: e.target.value})} className="w-full px-3 py-2 border-2 border-indigo-200 rounded text-sm bg-white">
                  {UPDATE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>
          </section>

          <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded shadow-lg transition-all">Submit Update Data</button>
        </form>
      </div>
    </div>
  );
};
