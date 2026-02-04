import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface UserManagementModalProps {
  users: User[];
  onUpdateUser: (updatedUser: User) => void;
  onDeleteUser: (user: User) => void;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ users, onUpdateUser, onDeleteUser, onClose }) => {
  const pendingUsers = users.filter(u => u.status === 'Pending');
  const [selectedRoles, setSelectedRoles] = useState<Record<string, UserRole>>({});

  const handleRoleChange = (userId: string, role: UserRole) => {
    setSelectedRoles(prev => ({ ...prev, [userId]: role }));
  };

  const handleApprove = (user: User) => {
    const roleToAssign = selectedRoles[user.id] || UserRole.STAFF; // Default to Staff if not selected
    const updatedUser: User = {
      ...user,
      status: 'Approved',
      role: roleToAssign
    };
    onUpdateUser(updatedUser);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-white">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">User Access Management</h2>
            <p className="text-xs text-slate-400 mt-1 font-bold">Review and approve new account requests</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
          {pendingUsers.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <i className="fa-solid fa-users-slash text-4xl mb-4 opacity-50"></i>
                <p className="text-sm font-bold">No pending registration requests.</p>
             </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map(user => (
                <div key={user.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-start space-x-4">
                       <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg">
                          {user.firstName ? user.firstName.charAt(0) : user.name.charAt(0)}
                       </div>
                       <div>
                          <h3 className="font-black text-slate-800 text-sm">{user.lastName}, {user.firstName} {user.mi}.</h3>
                          <p className="text-[10px] text-slate-500 font-mono mt-1 mb-2">@{user.username}</p>
                          <div className="flex flex-wrap gap-2">
                             <span className="px-2 py-1 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase">{user.position}</span>
                             <span className="px-2 py-1 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase">{user.municipality}</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto bg-slate-50 p-2 rounded-2xl">
                       <select 
                          value={selectedRoles[user.id] || UserRole.STAFF}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="bg-white border-none text-xs font-bold text-slate-700 py-2 pl-3 pr-8 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                       >
                          <option value={UserRole.STAFF}>STAFF</option>
                          <option value={UserRole.ADMIN}>ADMIN</option>
                       </select>
                       
                       <button 
                         onClick={() => onDeleteUser(user)}
                         className="w-10 h-10 rounded-xl bg-white text-red-400 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100 transition-all flex items-center justify-center shadow-sm"
                         title="Reject Request"
                       >
                         <i className="fa-solid fa-trash"></i>
                       </button>

                       <button 
                         onClick={() => handleApprove(user)}
                         className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-200 transition-all active:scale-95 flex-shrink-0"
                       >
                         Approve
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};