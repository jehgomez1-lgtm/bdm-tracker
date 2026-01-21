
import React, { useState } from 'react';

interface RegisterViewProps {
  onRegister: (data: any) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onRegister, onBack, isLoading }) => {
  const [formData, setFormData] = useState({
    firstName: '', mi: '', lastName: '', username: '', email: '', contact: '', position: '', password: '', confirmPassword: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Registration Error: Passwords do not match.");
      return;
    }
    onRegister(formData);
  };

  const isFormValid = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && formData.username && formData.email;

  return (
    <div className="min-h-screen flex items-center justify-center stardust-bg p-6 overflow-y-auto">
      <div className="bg-white/10 backdrop-blur-2xl p-10 md:p-14 rounded-[3.5rem] shadow-2xl border border-white/20 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-500 my-10">
        <div className="mb-10 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/10">
            <i className="fa-solid fa-user-shield text-indigo-400 text-3xl"></i>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase leading-none">Registration</h1>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Personnel Authorization Required</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest ml-1">First Name</label>
            <input required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Juan" />
          </div>
          <div className="grid grid-cols-4 gap-4">
             <div className="space-y-2">
               <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest ml-1">M.I.</label>
               <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-2 text-center text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 uppercase" maxLength={1} onChange={e => setFormData({...formData, mi: e.target.value})} />
             </div>
             <div className="col-span-3 space-y-2">
               <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest ml-1">Last Name</label>
               <input required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Dela Cruz" />
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest ml-1">Preferred Username</label>
            <input required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" onChange={e => setFormData({...formData, username: e.target.value})} placeholder="e.g. juan_dc" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest ml-1">Official Email</label>
            <input required type="email" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" onChange={e => setFormData({...formData, email: e.target.value})} placeholder="juan@bdm.gov" />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest ml-1">Contact Number</label>
            <input required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" onChange={e => setFormData({...formData, contact: e.target.value})} placeholder="09xx-xxx-xxxx" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest ml-1">Position</label>
            <input required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" onChange={e => setFormData({...formData, position: e.target.value})} placeholder="Data Entry Clerk" />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest ml-1">Password</label>
            <input required type="password" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest ml-1">Confirm Password</label>
            <input required type="password" className={`w-full bg-white/5 border rounded-2xl py-4 px-6 text-white text-sm outline-none transition-all ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500' : 'border-white/10'}`} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
          </div>

          <div className="md:col-span-2 pt-6 flex space-x-4">
             <button type="button" onClick={onBack} className="flex-1 py-5 border border-white/10 rounded-3xl text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all">Back</button>
             <button disabled={isLoading || !isFormValid} className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-3xl transition-all shadow-xl uppercase tracking-widest text-[10px] disabled:opacity-30">
               {isLoading ? 'Sending...' : 'Register'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
