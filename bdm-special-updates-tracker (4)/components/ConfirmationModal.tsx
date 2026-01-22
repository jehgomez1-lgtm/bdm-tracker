
import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center space-y-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${isDangerous ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'}`}>
            <i className={`fa-solid ${isDangerous ? 'fa-triangle-exclamation' : 'fa-circle-info'} text-3xl`}></i>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="bg-slate-50 p-4 flex space-x-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-200"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 ${isDangerous ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
