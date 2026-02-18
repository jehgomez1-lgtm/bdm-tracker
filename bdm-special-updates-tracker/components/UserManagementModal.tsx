
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface UserManagementModalProps {
  users: User[];
  onUpdateUser: (updatedUser: User) => void;
  onDeleteUser: (user: User) => void;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ users, onUpdateUser, onDeleteUser, onClose }) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'directory'>('requests');
  const [selectedRoles, setSelectedRoles] = useState<Record<string, UserRole>>({});

  const pendingUsers = users.filter(u => u.status === 'Pending');
  const approvedUsers = users.filter(u => u.status === 'Approved');

  const handleRoleSelection = (userId: string, role: UserRole) => {
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

  const handleUpdateExisting = (user: User) => {
     const newRole = selectedRoles[user.id];
     if (newRole && newRole !== user.role) {
         onUpdateUser({ ...user, role: newRole });
     }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-gray-100 bg-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">System Administration</h2>
              <p className="text-xs text-slate-400 mt-1 font-bold">Manage user access, roles, and account approvals</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8">
             <button 
                onClick={() => setActiveTab('requests')}
                className={`pb-3 text-[11px] font-black uppercase tracking-widest border-b-[3px] transition-all flex items-center space-x-2 ${activeTab === 'requests' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
             >
                <span>Access Requests</span>
                {pendingUsers.length > 0 && (
                    <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">{pendingUsers.length}</span>
                )}
             </button>
             <button 
                onClick={() => setActiveTab('directory')}
                className={`pb-3 text-[11px] font-black uppercase tracking-widest border-b-[3px] transition-all flex items-center space-x-2 ${activeTab === 'directory' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
             >
                <span>User Directory</span>
                <span className="bg-slate-100 text-slate-500 text-[9px] px-1.5 py-0.5 rounded-full">{approvedUsers.length}</span>
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
          
          {/* TAB 1: ACCESS REQUESTS */}
          {activeTab === 'requests' && (
              pendingUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <i className="fa-solid fa-check text-2xl opacity-30"></i>
                    </div>
                    <p className="text-sm font-bold uppercase tracking-widest">All caught up</p>
                    <p className="text-xs mt-1">No pending registration requests found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                {pendingUsers.map(user => (
                    <div key={user.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg shadow-sm">
                            {user.firstName ? user.firstName.charAt(0) : user.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 text-sm">{user.lastName}, {user.firstName} {user.mi}.</h3>
                            <div className="flex items-center space-x-2 mt-1 mb-2">
                                <span className="text-[10px] text-slate-400 font-mono">@{user.username}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className="text-[10px] text-indigo-500 font-bold uppercase">{user.municipality || 'No Area'}</span>
                            </div>
                            <span className="px-2 py-1 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase tracking-tight">{user.position}</span>
                        </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto bg-slate-50 p-2 rounded-2xl border border-slate-100">
                        <select 
                            value={selectedRoles[user.id] || UserRole.STAFF}
                            onChange={(e) => handleRoleSelection(user.id, e.target.value as UserRole)}
                            className="bg-white border-none text-[11px] font-bold text-slate-700 py-2 pl-3 pr-8 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-sm"
                        >
                            <option value={UserRole.STAFF}>ASSIGN: STAFF</option>
                            <option value={UserRole.ADMIN}>ASSIGN: ADMIN</option>
                        </select>
                        
                        <div className="w-px h-6 bg-slate-200 mx-1"></div>

                        <button 
                            onClick={() => onDeleteUser(user)}
                            className="w-8 h-8 rounded-xl bg-white text-red-400 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100 transition-all flex items-center justify-center shadow-sm"
                            title="Reject Request"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>

                        <button 
                            onClick={() => handleApprove(user)}
                            className="w-8 h-8 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-all flex items-center justify-center shadow-lg shadow-green-200"
                            title="Approve Request"
                        >
                            <i className="fa-solid fa-check"></i>
                        </button>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
              )
          )}

          {/* TAB 2: USER DIRECTORY */}
          {activeTab === 'directory' && (
             <div className="space-y-4">
                {approvedUsers.map(user => {
                    const isEditing = selectedRoles[user.id] && selectedRoles[user.id] !== user.role;
                    const isRoot = user.id === 'admin_root';
                    
                    return (
                        <div key={user.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                             <div className="flex items-center space-x-4 w-full md:w-auto">
                                <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full bg-slate-100" />
                                <div>
                                    <h3 className="font-bold text-slate-800 text-xs flex items-center">
                                        {user.name}
                                        {user.id === 'admin_root' && <i className="fa-solid fa-shield-halved text-indigo-500 ml-2 text-[10px]" title="Root Admin"></i>}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-mono">@{user.username} • {user.position || 'Staff'}</p>
                                </div>
                             </div>

                             <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                    <i className="fa-solid fa-location-dot text-slate-300 text-[10px]"></i>
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{user.municipality || 'Global'}</span>
                                </div>

                                {!isRoot ? (
                                    <div className="flex items-center gap-2">
                                        <select 
                                            value={selectedRoles[user.id] || user.role}
                                            onChange={(e) => handleRoleSelection(user.id, e.target.value as UserRole)}
                                            className={`text-[10px] font-bold py-1.5 pl-2 pr-6 rounded-lg outline-none cursor-pointer transition-colors border ${isEditing ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-100'}`}
                                        >
                                            <option value={UserRole.STAFF}>ROLE: STAFF</option>
                                            <option value={UserRole.ADMIN}>ROLE: ADMIN</option>
                                            <option value={UserRole.GUEST}>ROLE: GUEST</option>
                                        </select>
                                        
                                        {isEditing && (
                                            <button 
                                                onClick={() => handleUpdateExisting(user)}
                                                className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 shadow-sm animate-in fade-in zoom-in"
                                                title="Save Changes"
                                            >
                                                <i className="fa-solid fa-floppy-disk text-[10px]"></i>
                                            </button>
                                        )}

                                        <div className="w-px h-4 bg-slate-200 mx-1"></div>

                                        <button 
                                            onClick={() => onDeleteUser(user)}
                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                            title="Remove User"
                                        >
                                            <i className="fa-solid fa-trash-can text-sm"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-4">System Root</span>
                                )}
                             </div>
                        </div>
                    );
                })}
             </div>
          )}

        </div>
      </div>
    </div>
  );
};
