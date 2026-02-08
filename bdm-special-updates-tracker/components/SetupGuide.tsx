
import React, { useState } from 'react';

interface SetupGuideProps {
  currentUrl: string;
  onSaveUrl: (url: string) => void;
  onRetry: () => void;
  onWipe?: () => void;
  onManageMaster?: () => void;
}

export const SetupGuide: React.FC<SetupGuideProps> = ({ currentUrl, onSaveUrl, onRetry, onWipe, onManageMaster }) => {
  const [urlInput, setUrlInput] = useState(currentUrl);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const testConnection = async () => {
    if (!urlInput) return;
    setTestStatus('testing');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Test the link with a sheet parameter to verify script compatibility
      const urlWithParam = urlInput.includes('?') ? `${urlInput}&sheet=HHID+STATUS` : `${urlInput}?sheet=HHID+STATUS`;
      const res = await fetch(urlWithParam);
      const data = await res.json();
      
      // Robust check: Handle both legacy Array format and new Object wrapper format
      const isValid = Array.isArray(data) || (data && data.status === 'success' && Array.isArray(data.data));

      if (isValid) {
        setTestStatus('success');
        onSaveUrl(urlInput);
      } else {
        console.error("Validation failed: Data format unrecognized", data);
        setTestStatus('error');
      }
    } catch (e) {
      console.error("Connection failed", e);
      setTestStatus('error');
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10 pb-32">
      
      <div className="bg-[#020617] rounded-[3rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 p-12 opacity-5">
           <i className="fa-solid fa-cloud-bolt text-[15rem]"></i>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-xl text-center md:text-left">
            <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">System Configuration</span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase leading-none">Spreadsheet Bridge</h2>
            <p className="text-slate-400 text-sm mt-6 font-medium leading-relaxed">
              Link your master spreadsheet using your single Web App URL. The system will automatically detect and sync both <b>Sheet1</b> (Tracking) and <b>HHID STATUS</b> (Master List).
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 text-center flex flex-col items-center">
             <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/20">
                <i className="fa-solid fa-link text-white text-2xl"></i>
             </div>
             <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Ready to Link</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm">
           <div className="space-y-8">
              <div>
                 <h3 className="text-2xl font-black italic text-slate-900 tracking-tight">System Activation</h3>
                 <p className="text-slate-500 text-xs mt-2 font-bold uppercase tracking-widest">Connect your Google Apps Script Endpoint</p>
              </div>

              <div className="space-y-6">
                 <div className="relative">
                    <input 
                      type="text" 
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        setTestStatus('idle');
                      }}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full pl-16 pr-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-xs font-mono outline-none focus:border-indigo-500 transition-all text-slate-700 shadow-inner"
                    />
                    <i className="fa-solid fa-satellite absolute left-7 top-7 text-indigo-500"></i>
                 </div>

                 {testStatus === 'error' && (
                   <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl text-[11px] text-amber-700 font-bold flex flex-col space-y-2">
                      <div className="flex items-center">
                        <i className="fa-solid fa-triangle-exclamation mr-4 text-xl"></i>
                        Test failed. Ensure your script is deployed as a Web App with access for "Anyone".
                      </div>
                      <button onClick={() => onSaveUrl(urlInput)} className="underline text-amber-900 text-left mt-2">Bypass test and save</button>
                   </div>
                 )}

                 <button 
                   onClick={testConnection}
                   disabled={!urlInput || testStatus === 'testing'}
                   className={`w-full py-6 rounded-3xl text-[12px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center space-x-4 ${
                     testStatus === 'success' ? 'bg-green-600 text-white' : 
                     'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-500/20'
                   }`}
                 >
                   {testStatus === 'testing' ? (
                     <><i className="fa-solid fa-circle-notch animate-spin"></i><span>Connecting...</span></>
                   ) : testStatus === 'success' ? (
                     <><i className="fa-solid fa-circle-check"></i><span>Active Stream</span></>
                   ) : (
                     <><i className="fa-solid fa-bolt"></i><span>Activate Bridge</span></>
                   )}
                 </button>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm flex flex-col justify-between">
           <div className="space-y-6">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg"><i className="fa-solid fa-database"></i></div>
              <div>
                 <h4 className="text-xl font-black text-slate-900 leading-none">Local Master</h4>
                 <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest leading-relaxed">Offline data node for lightning-fast auto-fills</p>
              </div>
           </div>
           <button 
             onClick={onManageMaster}
             className="w-full py-4 mt-8 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 transition-all active:scale-95"
           >
             Manage Master Data
           </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto flex items-center justify-center space-x-12 pt-10 border-t border-slate-100">
          <div className="flex items-center space-x-4">
             <div className="w-2 h-2 rounded-full bg-green-500"></div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sheet1 Connected</p>
          </div>
          <div className="flex items-center space-x-4">
             <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">HH STATUS Localized</p>
          </div>
          <button 
            onClick={onWipe}
            className="text-red-400 hover:text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center"
          >
            <i className="fa-solid fa-trash-can mr-2"></i> Wipe Cache
          </button>
      </div>
    </div>
  );
};
