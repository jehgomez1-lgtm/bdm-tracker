import React, { useState } from 'react';
import { User, AuditLog, UserRole } from '../types';
import { UserManagementModal } from './UserManagementModal';

interface ProfileViewProps {
  user: User;
  logs: AuditLog[];
  onLogout: () => void;
  // Props for User Management
  users?: User[];
  onUpdateUser?: (updatedUser: User) => void;
  onDeleteUser?: (user: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, logs, onLogout, users, onUpdateUser, onDeleteUser }) => {
  const [showUserManagement, setShowUserManagement] = useState(false);
  const userSpecificLogs = logs.filter(l => l.user === user.name);
  const pendingCount = users ? users.filter(u => u.status === 'Pending').length : 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl shadow-sm border p-8 flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-10">
        <div className="relative">
          <img 
            src={user.avatar} 
            alt="Profile" 
            className="w-32 h-32 rounded-full border-4 border-indigo-100 shadow-xl"
          />
          <span className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></span>
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{user.name}</h2>
            <div className="mt-2 md:mt-0">
              {user.role === UserRole.ADMIN ? (
                 <button 
                    onClick={() => setShowUserManagement(true)}
                    className="group flex items-center space-x-2 bg-indigo-100 hover:bg-indigo-600 hover:text-white text-indigo-700 px-5 py-2 rounded-full border border-indigo-200 transition-all cursor-pointer active:scale-95"
                 >
                    <span className="text-[10px] font-black uppercase tracking-widest">ADMIN ACCESS</span>
                    {pendingCount > 0 && (
                        <span className="bg-red-500 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-pulse">{pendingCount}</span>
                    )}
                    <i className="fa-solid fa-chevron-right text-[10px] ml-1 group-hover:translate-x-1 transition-transform"></i>
                 </button>
              ) : (
                <span className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-slate-100 text-slate-700 border-slate-200">
                  STAFF ACCESS
                </span>
              )}
            </div>
          </div>
          <p className="text-slate-500 text-sm">@{user.username} • {user.position || 'Data Processing Officer'}</p>
          {user.municipality && <p className="text-slate-400 text-xs font-bold uppercase tracking-wide"><i className="fa-solid fa-location-dot mr-1"></i> {user.municipality}</p>}
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Actions Performed</p>
              <p className="text-xl font-black text-indigo-600">{userSpecificLogs.length}</p>
            </div>
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Status</p>
              <p className="text-xl font-black text-green-600">Active</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border p-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center">
              <i className="fa-solid fa-gear mr-2 text-indigo-500"></i> Account Settings
            </h3>
            <div className="space-y-4">
              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="flex items-center">
                  <i className="fa-solid fa-shield-halved w-8 text-indigo-500"></i>
                  <span className="text-sm font-bold text-slate-700">Change Password</span>
                </div>
                <i className="fa-solid fa-chevron-right text-[10px] text-slate-300 group-hover:text-indigo-500"></i>
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="flex items-center">
                  <i className="fa-solid fa-envelope w-8 text-indigo-500"></i>
                  <span className="text-sm font-bold text-slate-700">Notification Prefs</span>
                </div>
                <i className="fa-solid fa-chevron-right text-[10px] text-slate-300 group-hover:text-indigo-500"></i>
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="flex items-center">
                  <i className="fa-solid fa-key w-8 text-indigo-500"></i>
                  <span className="text-sm font-bold text-slate-700">API Access Keys</span>
                </div>
                <i className="fa-solid fa-chevron-right text-[10px] text-slate-300 group-hover:text-indigo-500"></i>
              </button>
              <div className="pt-4 border-t">
                <button 
                  onClick={onLogout}
                  className="w-full py-3 px-4 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center"
                >
                  <i className="fa-solid fa-right-from-bracket mr-2"></i> Terminate Session
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border p-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center">
              <i className="fa-solid fa-clock-rotate-left mr-2 text-indigo-500"></i> My Recent Activity
            </h3>
            <div className="space-y-4">
              {userSpecificLogs.length > 0 ? (
                userSpecificLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="flex items-start space-x-4 p-4 border rounded-2xl bg-slate-50/50 hover:bg-white transition-all cursor-default">
                    <div className="bg-white shadow-sm p-2 rounded-lg text-indigo-600 border border-slate-100">
                      <i className="fa-solid fa-bolt-lightning text-xs"></i>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-black text-slate-800">{log.action}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{log.details}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-slate-400 italic text-sm">No activity recorded for this session.</p>
                </div>
              )}
            </div>
            {userSpecificLogs.length > 5 && (
              <button className="w-full mt-4 text-xs font-bold text-indigo-600 uppercase tracking-widest py-2 hover:underline">
                View All Session History
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Admin Modal */}
      {showUserManagement && users && onUpdateUser && onDeleteUser && (
        <UserManagementModal 
            users={users} 
            onUpdateUser={(u) => { onUpdateUser(u); }} 
            onDeleteUser={(u) => { onDeleteUser(u); }}
            onClose={() => setShowUserManagement(false)} 
        />
      )}
    </div>
  );
};