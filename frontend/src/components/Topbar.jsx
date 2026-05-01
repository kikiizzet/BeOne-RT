import React from 'react';
import { Menu, X } from 'lucide-react';

const Topbar = ({ onMenuClick, isOpen }) => {
  return (
    <div className="lg:hidden h-16 bg-white border-b border-border flex items-center justify-between px-4 sticky top-0 z-[60]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-base">
          B
        </div>
        <div>
          <h2 className="text-sm font-bold text-text-main leading-none">Beon RT</h2>
          <p className="text-[9px] text-text-muted uppercase tracking-wider mt-0.5 font-semibold">Management</p>
        </div>
      </div>
      
      <button 
        onClick={onMenuClick}
        className="p-2 rounded-lg bg-gray-50 text-text-main hover:bg-gray-100 transition-colors border border-border"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </div>
  );
};

export default Topbar;
