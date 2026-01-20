
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
      // Small timeout for better UX feel
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
        <div className="bg-indigo-600 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-2xl shadow-indigo-200 animate-float">
           <i className="fa-solid fa-earth-americas text-white text-3xl"></i>
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">Web Deployment Center</h2>
        <p className="text-slate-500 text-sm max-w-xl mt-3 font-medium leading-relaxed">
          You are currently in the <b>Preview Environment</b>. Follow the steps below to move this application to your own custom website.
        </p>
      </div>

      {/* Deployment Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { 
             step: "01", 
             title: "Source Collection", 
             desc: "Save all current files (App.tsx, index.html, etc.) to a folder on your local machine.",
             icon: "fa-file-code",
             color: "indigo"
           },
           { 
             step: "02", 
             title: "Cloud Repository", 
             desc: "Upload that folder to a private GitHub repository. This will be your master database.",
             icon: "fa-github",
             color: "slate"
           },
           { 
             step: "03", 
             title: "Instant Hosting", 
             desc: "Connect GitHub to Vercel or Netlify. They will give you a public URL (e.g. .vercel.app).",
             icon: "fa-bolt",
             color: "amber"
           }
         ].map((item) => (
           <div key={item.step} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group">
              <div className={`w-12 h-12 rounded-2xl bg-${item.color}-50 text-${item.color}-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                 <i className={`fa-solid ${item.icon} text-xl`}></i>
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2 block">Stage {item.step}</span>
              <h4 className="text-lg font-black text-slate-800 italic mb-2">{item.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
           </div>
         ))}
      </div>

      {/* Connection Console */}
      <div className="bg-[#020617] rounded-[3rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full -mr-64 -mt-64 blur-[100px]"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-16">
           <div className="lg:col-span-3 space-y-10">
              <div>
                 <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-4">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Active Link Protocol</span>
                 </div>
                 <h3 className="text-3xl font-black italic tracking-tighter">Connect Production Bridge</h3>
                 <p className="text-slate-400 text-sm mt-4 leading-relaxed font-medium">
                   Your website needs a data source to function. Paste your <b>Google Web App URL</b> here. This creates a secure, private tunnel between your website and your spreadsheet.
                 </p>
              </div>

              <div className="space-y-4">
                 <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <input 
                      type="text" 
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        setTestStatus('idle');
                      }}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="relative w-full pl-14 pr-6 py-6 bg-slate-900 border border-white/10 rounded-2xl text-xs font-mono outline-none focus:border-indigo-500 transition-all text-indigo-100"
                    />
                    <i className="fa-solid fa-link absolute left-6 top-7 text-slate-500"></i>
                 </div>

                 <button 
                   onClick={testConnection}
                   disabled={!urlInput || testStatus === 'testing'}
                   className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center space-x-3 active:scale-[0.98] ${
                     testStatus === 'success' ? 'bg-green-500 text-white' : 
                     testStatus === 'error' ? 'bg-red-500 text-white' : 
                     'bg-white text-slate-950 hover:bg-indigo-50'
                   }`}
                 >
                   {testStatus === 'testing' ? (
                     <i className="fa-solid fa-circle-notch animate-spin text-lg"></i>
                   ) : testStatus === 'success' ? (
                     <><i className="fa-solid fa-circle-check text-lg"></i> <span>Protocol Verified & Linked</span></>
                   ) : testStatus === 'error' ? (
                     <><i className="fa-solid fa-triangle-exclamation text-lg"></i> <span>Connection Error - Check URL</span></>
                   ) : (
                     <><span>Initialize Web Connection</span></>
                   )}
                 </button>
              </div>
           </div>

           <div className="lg:col-span-2 space-y-8">
              <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 h-full flex flex-col justify-between">
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-6">Production Checklist</h4>
                    <div className="space-y-5">
                       {[
                         { label: "SSL Encryption Active", status: "Auto-managed by Vercel" },
                         { label: "Data Persistence", status: "Google Cloud Managed" },
                         { label: "Global Availability", status: "CDN Enabled" },
                         { label: "Mobile Optimization", status: "Responsive Engine Ready" }
                       ].map((item, i) => (
                         <div key={i} className="flex items-start space-x-4">
                            <div className="mt-1 w-4 h-4 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[8px]">
                               <i className="fa-solid fa-check"></i>
                            </div>
                            <div>
                               <p className="text-xs font-bold text-slate-200">{item.label}</p>
                               <p className="text-[9px] text-slate-500 uppercase font-black tracking-tight">{item.status}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
                 
                 <div className="mt-8 pt-8 border-t border-white/5">
                    <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed">
                      "By hosting this on your own URL, you ensure full ownership of the interface and private access for your team."
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 md:p-12 text-center space-y-6">
         <div className="bg-slate-50 inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-slate-100">
            <i className="fa-solid fa-circle-question text-indigo-500 text-xs"></i>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Need more help?</span>
         </div>
         <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic">Common Hosting Questions</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
            <div className="space-y-2">
               <p className="text-sm font-black text-slate-800">Do I need to pay for hosting?</p>
               <p className="text-xs text-slate-500 leading-relaxed font-medium">No. GitHub and Vercel both have "Hobby" plans that are 100% free for projects like this. You only pay if you get thousands of users.</p>
            </div>
            <div className="space-y-2">
               <p className="text-sm font-black text-slate-800">What happens if I update the code here?</p>
               <p className="text-xs text-slate-500 leading-relaxed font-medium">Updates in this preview won't automatically show on your custom website. You'll need to copy the new code to your GitHub files to push the update live.</p>
            </div>
         </div>
      </div>
    </div>
  );
};
