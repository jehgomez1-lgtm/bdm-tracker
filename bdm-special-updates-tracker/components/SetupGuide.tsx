
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
      await new Promise(resolve => setTimeout(resolve, 800));
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10 pb-32">
      {/* Header Section */}
      <div className="flex flex-col items-center text-center">
        <div className="bg-indigo-600 w-24 h-24 rounded-[3rem] flex items-center justify-center mb-6 shadow-2xl shadow-indigo-200 animate-float">
           <i className="fa-solid fa-flag-checkered text-white text-4xl"></i>
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">The Finish Line</h2>
        <p className="text-slate-500 text-sm max-w-xl mt-3 font-medium leading-relaxed">
          You are one click away from launching your enterprise dashboard.
        </p>
      </div>

      {/* Vercel Configuration Blueprint */}
      <div className="bg-[#020617] rounded-[3rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 p-12 opacity-10">
           <i className="fa-solid fa-screwdriver-wrench text-[12rem]"></i>
        </div>
        
        <div className="relative z-10 space-y-12">
           <div className="max-w-2xl">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 block">Final Vercel Settings</span>
              <h3 className="text-4xl font-black italic tracking-tighter">The "Configure Project" Step</h3>
              <p className="text-slate-400 text-sm mt-4 leading-relaxed font-medium">
                After you click <b>"Import"</b> on the screen in your screenshot, you will reach the Configuration page. Do these 2 things:
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 space-y-6">
                 <h4 className="text-xs font-black uppercase tracking-widest text-indigo-300 flex items-center">
                    <i className="fa-solid fa-folder-tree mr-3"></i> 1. Set Root Directory
                 </h4>
                 <p className="text-xs text-slate-300 leading-relaxed">
                   Look for the field labeled <b>"Root Directory"</b>. Click the <b>"Edit"</b> button next to it and select the folder:
                 </p>
                 <div className="p-4 bg-slate-950 rounded-xl border border-indigo-500/30 font-mono text-[11px] text-white">
                    bdm-special-updates-tracker (1)
                 </div>
                 <p className="text-[10px] text-slate-500 italic">This ensures Vercel looks inside your folder to find the app files.</p>
              </div>

              <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 space-y-6 flex flex-col justify-between">
                 <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-indigo-300 flex items-center">
                        <i className="fa-solid fa-rocket mr-3"></i> 2. Deploy
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed mt-4">
                      Leave all other settings (Framework, Build Command) as their defaults. Vercel will automatically detect them.
                    </p>
                 </div>
                 <button 
                   onClick={() => window.open('https://vercel.com/dashboard', '_blank')}
                   className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20"
                 >
                   Launch Deployment <i className="fa-solid fa-bolt ml-2"></i>
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Connection Protocol (Final Sync) */}
      <div className="bg-white rounded-[3rem] p-10 md:p-16 border-2 border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-16">
           <div className="lg:col-span-3 space-y-10">
              <div>
                 <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-2">Post-Launch Step</span>
                 <h3 className="text-3xl font-black italic text-slate-900">Final Database Link</h3>
                 <p className="text-slate-500 text-sm mt-4 leading-relaxed font-medium">
                   Once Vercel gives you your link (e.g., <code>https://bdm-tracker.vercel.app</code>), open that new site and paste your <b>Google Apps Script URL</b> here to link your live data.
                 </p>
              </div>

              <div className="space-y-4">
                 <div className="relative">
                    <input 
                      type="text" 
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        setTestStatus('idle');
                      }}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full pl-14 pr-6 py-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-mono outline-none focus:border-indigo-500 transition-all text-slate-700 shadow-inner"
                    />
                    <i className="fa-solid fa-link absolute left-6 top-7 text-slate-300"></i>
                 </div>

                 <button 
                   onClick={testConnection}
                   disabled={!urlInput || testStatus === 'testing'}
                   className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center space-x-3 ${
                     testStatus === 'success' ? 'bg-green-500 text-white' : 
                     testStatus === 'error' ? 'bg-red-500 text-white' : 
                     'bg-slate-900 text-white hover:bg-black'
                   }`}
                 >
                   {testStatus === 'testing' ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <span>Authorize Cloud Data Sync</span>}
                 </button>
              </div>
           </div>

           <div className="lg:col-span-2 flex flex-col justify-center">
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Live Status Dashboard</h4>
                 <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                       <i className="fa-solid fa-circle-check text-green-500"></i>
                       <span className="text-xs font-bold text-slate-600">GitHub Repository Sync: OK</span>
                    </div>
                    <div className="flex items-center space-x-3">
                       <i className="fa-solid fa-circle-check text-green-500"></i>
                       <span className="text-xs font-bold text-slate-600">Vercel Import Initiated: OK</span>
                    </div>
                    <div className="flex items-center space-x-3 animate-pulse">
                       <i className="fa-solid fa-circle-dot text-indigo-500"></i>
                       <span className="text-xs font-bold text-slate-900">Awaiting Final Database Link</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
