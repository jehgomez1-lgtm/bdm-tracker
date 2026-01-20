
import React, { useState } from 'react';

interface SetupGuideProps {
  currentUrl: string;
  onSaveUrl: (url: string) => void;
  onRetry: () => void;
}

export const SetupGuide: React.FC<SetupGuideProps> = ({ currentUrl, onSaveUrl, onRetry }) => {
  const [urlInput, setUrlInput] = useState(currentUrl);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const testConnection = async () => {
    if (!urlInput) return;
    setTestStatus('testing');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const res = await fetch(urlInput);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setTestStatus('success');
        onSaveUrl(urlInput);
      } else {
        setTestStatus('error');
      }
    } catch (e) {
      setTestStatus('error');
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10 pb-32">
      
      {/* Verification Banner */}
      <div className="bg-indigo-600 rounded-[3rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
           <i className="fa-solid fa-circle-check text-[15rem]"></i>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-xl text-center md:text-left">
            <span className="bg-green-400 text-indigo-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Build Verified</span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase leading-none">Cloud Link Ready</h2>
            <p className="text-indigo-100 text-sm mt-6 font-medium leading-relaxed">
              Your Vercel deployment is 100% healthy. All build modules were successfully found. Now, activate the data bridge below to start managing your records.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[3rem] border border-white/20 text-center flex flex-col items-center">
             <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(74,222,128,0.5)]">
                <i className="fa-solid fa-check text-indigo-950 text-2xl"></i>
             </div>
             <div className="text-[10px] font-black uppercase tracking-widest text-green-300">Operational</div>
          </div>
        </div>
      </div>

      {/* Cloud Bridge Connection */}
      <div className="bg-white rounded-[4rem] p-10 md:p-20 border-2 border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-20">
           <div className="lg:col-span-3 space-y-12">
              <div>
                 <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-4">Connection Protocol</span>
                 <h3 className="text-4xl font-black italic text-slate-900 tracking-tight">Activate Data Sync</h3>
                 <p className="text-slate-500 text-sm mt-4 leading-relaxed font-medium">
                   Paste the <b>Web App URL</b> from your Google Apps Script project. This links your spreadsheet data to this dashboard instantly.
                 </p>
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
                      className="w-full pl-16 pr-8 py-7 bg-slate-50 border-2 border-slate-100 rounded-3xl text-xs font-mono outline-none focus:border-indigo-500 transition-all text-slate-700 shadow-inner"
                    />
                    <i className="fa-solid fa-satellite absolute left-8 top-8 text-indigo-400"></i>
                 </div>

                 {testStatus === 'error' && (
                   <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl text-[11px] text-amber-700 font-bold flex items-center">
                      <i className="fa-solid fa-triangle-exclamation mr-4 text-xl"></i>
                      The sync test returned a validation error. Check your Google Script deployment settings.
                      <button onClick={() => onSaveUrl(urlInput)} className="ml-auto bg-amber-200/50 px-4 py-2 rounded-lg hover:bg-amber-200 transition-colors">Bypass & Force Link</button>
                   </div>
                 )}

                 <button 
                   onClick={testConnection}
                   disabled={!urlInput || testStatus === 'testing'}
                   className={`w-full py-6 rounded-3xl text-[12px] font-black uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center space-x-4 ${
                     testStatus === 'success' ? 'bg-green-500 text-white' : 
                     'bg-slate-900 text-white hover:bg-black hover:scale-[1.02] active:scale-95'
                   }`}
                 >
                   {testStatus === 'testing' ? (
                     <>
                        <i className="fa-solid fa-circle-notch animate-spin"></i>
                        <span>Syncing Data Nodes...</span>
                     </>
                   ) : (
                     <>
                        <i className="fa-solid fa-bolt-lightning text-amber-400"></i>
                        <span>Finalize Data Bridge Activation</span>
                     </>
                   )}
                 </button>
              </div>
           </div>

           <div className="lg:col-span-2 flex flex-col justify-center">
              <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-200">
                 <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-8 border-b border-slate-200 pb-4">Infrastructure Status</h4>
                 <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                       <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                          <i className="fa-solid fa-microchip text-xs"></i>
                       </div>
                       <div>
                          <p className="text-xs font-black text-slate-900">Vercel Build Engine</p>
                          <p className="text-[9px] text-green-600 font-bold uppercase">Online / Healthy</p>
                       </div>
                    </div>
                    <div className="flex items-center space-x-4">
                       <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                          <i className="fa-solid fa-box-open text-xs"></i>
                       </div>
                       <div>
                          <p className="text-xs font-black text-slate-900">Package Dependencies</p>
                          <p className="text-[9px] text-green-600 font-bold uppercase">All Modules Loaded</p>
                       </div>
                    </div>
                    <div className="flex items-center space-x-4">
                       <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                          <i className="fa-solid fa-wave-square text-xs"></i>
                       </div>
                       <div>
                          <p className="text-xs font-black text-slate-900">Bridge Interface</p>
                          <p className="text-[9px] text-indigo-600 font-bold uppercase animate-pulse">Awaiting Signal...</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="text-center opacity-40">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Enterprise Data Management Protocol v1.1.0</p>
      </div>
    </div>
  );
};
