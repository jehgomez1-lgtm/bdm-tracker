
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { MUNICIPALITIES } from '../constants';

interface LoginViewProps {
  onLogin: (username: string, password: string) => void;
  onRegister: (newUser: User) => Promise<void> | void;
  loginError?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onRegister, loginError }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Registration State
  const [regForm, setRegForm] = useState({
    username: '',
    firstName: '',
    mi: '',
    lastName: '',
    position: '',
    municipality: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isRegistering) {
        // Validation
        if (regForm.password !== regForm.confirmPassword) {
            alert("Passwords do not match.");
            setIsLoading(false);
            return;
        }
        if (!regForm.username || !regForm.password || !regForm.firstName || !regForm.lastName) {
            alert("Please fill in all required fields.");
            setIsLoading(false);
            return;
        }

        // Create User Object
        const newUser: User = {
            id: `usr_${Date.now()}`,
            username: regForm.username,
            firstName: regForm.firstName,
            mi: regForm.mi,
            lastName: regForm.lastName,
            name: `${regForm.firstName} ${regForm.lastName}`, // Fallback display name
            email: regForm.email,
            municipality: regForm.municipality,
            position: regForm.position,
            role: UserRole.STAFF, // Default role, changed by admin later
            status: 'Pending',
            Password: regForm.password,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${regForm.username}`
        };

        // Submit registration
        try {
            await onRegister(newUser);
            setIsLoading(false);
            setIsRegistering(false); // Switch back to login
            alert("Registration successful! Your account is pending Admin approval.");
        } catch (err) {
            console.error(err);
            setIsLoading(false);
            alert("Registration failed. Please try again.");
        }

    } else {
        // Login Logic
        setTimeout(() => {
            onLogin(username, password);
            setIsLoading(false);
        }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center relative overflow-hidden py-10 px-4">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
        </div>

        <div className={`relative z-10 w-full transition-all duration-500 ${isRegistering ? 'max-w-2xl' : 'max-w-md'}`}>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mx-auto mb-6">
                        <i className="fa-solid fa-cloud text-2xl text-white"></i>
                    </div>
                    <h1 className="text-2xl font-black italic tracking-tighter text-white mb-2">BDM HUB</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{isRegistering ? 'New Account Registration' : 'Enterprise Access Portal'}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {isRegistering ? (
                        <>
                           {/* Registration Fields */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputGroup icon="fa-user" label="Username" value={regForm.username} onChange={e => setRegForm({...regForm, username: e.target.value})} placeholder="jdoe" />
                                <InputGroup icon="fa-envelope" label="Email" type="email" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} placeholder="jdoe@agency.gov" />
                           </div>
                           
                           <div className="grid grid-cols-5 gap-4">
                                <div className="col-span-2">
                                    <InputGroup label="First Name" value={regForm.firstName} onChange={e => setRegForm({...regForm, firstName: e.target.value})} placeholder="Juan" />
                                </div>
                                <div className="col-span-1">
                                    <InputGroup label="M.I." value={regForm.mi} onChange={e => setRegForm({...regForm, mi: e.target.value})} placeholder="A" />
                                </div>
                                <div className="col-span-2">
                                    <InputGroup label="Last Name" value={regForm.lastName} onChange={e => setRegForm({...regForm, lastName: e.target.value})} placeholder="Dela Cruz" />
                                </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputGroup label="Position" value={regForm.position} onChange={e => setRegForm({...regForm, position: e.target.value})} placeholder="Data Officer II" />
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Area of Assignment</label>
                                    <div className="relative">
                                        <select 
                                            value={regForm.municipality}
                                            onChange={e => setRegForm({...regForm, municipality: e.target.value})}
                                            className="w-full pl-4 pr-10 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Select Municipality</option>
                                            {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                        <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                                    </div>
                                </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputGroup icon="fa-lock" label="Password" type="password" value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} placeholder="••••••••" />
                                <InputGroup icon="fa-lock" label="Confirm Password" type="password" value={regForm.confirmPassword} onChange={e => setRegForm({...regForm, confirmPassword: e.target.value})} placeholder="••••••••" />
                           </div>
                        </>
                    ) : (
                        <>
                           {/* Login Fields */}
                           <InputGroup icon="fa-user" label="Username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" />
                           <InputGroup icon="fa-lock" label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                        </>
                    )}

                    {loginError && !isRegistering && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center space-x-3 animate-in slide-in-from-top-2">
                            <i className="fa-solid fa-circle-exclamation text-red-400 text-xs"></i>
                            <p className="text-xs font-bold text-red-400">{loginError}</p>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2 group mt-4"
                    >
                        {isLoading ? (
                            <>
                                <i className="fa-solid fa-circle-notch animate-spin"></i>
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <span>{isRegistering ? 'Submit Registration' : 'Secure Login'}</span>
                                <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-white/5 pt-6">
                    <p className="text-[10px] text-slate-500 font-medium mb-3">
                        {isRegistering ? "Already have an account?" : "Need an account?"}
                    </p>
                    <button 
                        type="button"
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setIsLoading(false);
                            // Clear form errors if switching
                        }}
                        className="text-xs font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors"
                    >
                        {isRegistering ? "Return to Login" : "Register New Account"}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

const InputGroup: React.FC<{
    label: string; 
    value: string; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    placeholder?: string;
    type?: string;
    icon?: string;
}> = ({ label, value, onChange, placeholder, type = "text", icon }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative">
             <input 
                type={type} 
                value={value}
                onChange={onChange}
                className={`w-full ${icon ? 'pl-12' : 'pl-4'} pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-sm font-bold text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600`}
                placeholder={placeholder}
             />
             {icon && <i className={`fa-solid ${icon} absolute left-5 top-1/2 -translate-y-1/2 text-slate-500`}></i>}
        </div>
    </div>
);
