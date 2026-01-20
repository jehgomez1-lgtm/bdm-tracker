
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
      {/* Build Error Recovery Section */}
      <div className="bg-red-50 border-2 border-red-100 rounded-[3rem] p-10 md:p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 text-red-600">
           <i className="fa-solid fa-triangle-exclamation text-[10rem]"></i>
        </div>
        <div className="relative z-10 space-y-8">
           <div>
              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Fix Detected</span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Emergency Build Repair</h2>
              <p className="text-slate-600 text-sm mt-3 font-medium leading-relaxed max-w-2xl">
                The error "Cannot find package @vitejs/plugin-react" means Vercel is missing its translation engine. Follow these 2 steps to fix it instantly:
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
                 <h4 className="text-xs font-black uppercase tracking-widest text-red-600 mb-4">1. Update package.json</h4>
                 <p className="text-[11px] text-slate-500 mb-4">Copy the <b>new package.json</b> code from our chat, go to GitHub, edit your file, and paste it there.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
                 <h4 className="text-xs font-black uppercase tracking-widest text-red-600 mb-4">2. Create vite.config.ts</h4>
                 <h4 className="text-[11px] text-slate-500 mb-4">Create a <b>New File</b> in your GitHub repo named <code>vite.config.ts</code> and paste the config code I provided.</h4>
              </div>
           </div>
           
           <p className="text-xs font-bold text-slate-400 italic">
             *Once you commit these changes to GitHub, Vercel will automatically try to build again. It should succeed now!
           </p>
        </div>
      </div>

      {/* Connection Protocol (Final Sync) */}
      <div className="bg-white rounded-[3rem] p-10 md:p-16 border-2 border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-16">
           <div className="lg:col-span-3 space-y-10">
              <div>
                 <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-2">Final Step After Success</span>
                 <h3 className="text-3xl font-black italic text-slate-900">3. Activate Data Bridge</h3>
                 <p className="text-slate-500 text-sm mt-4 leading-relaxed font-medium">
                   Once Vercel finishes the build successfully, open your new live website link and paste your <b>Google Apps Script URL</b> here.
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
                   {testStatus === 'testing' ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <span>Finalize Production Link</span>}
                 </button>
              </div>
           </div>

           <div className="lg:col-span-2 flex flex-col justify-center">
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Repair Progress</h4>
                 <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                       <i className="fa-solid fa-circle-check text-green-500"></i>
                       <span className="text-xs font-bold text-slate-600">GitHub Upload: OK</span>
                    </div>
                    <div className="flex items-center space-x-3">
                       <i className="fa-solid fa-circle-xmark text-red-500"></i>
                       <span className="text-xs font-bold text-slate-900">Vercel Build: Error Found</span>
                    </div>
                    <div className="flex items-center space-x-3 animate-pulse">
                       <i className="fa-solid fa-circle-dot text-indigo-500"></i>
                       <span className="text-xs font-bold text-slate-900 font-black">Applying Fixes...</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
