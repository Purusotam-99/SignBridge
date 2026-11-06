// Purpose: Responsive navigation drawer for mobile viewport
import React from 'react';
import { NavLink } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';

export default function MobileMenu({ isOpen, onClose, links, isDemoActive }) {
  if (!isOpen) return null;

  return (
    <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 pt-3 pb-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <img src="/logo.png" alt="SignBridge Logo" className="h-6 w-auto object-contain" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
          ISL
        </span>
      </div>
      <nav className="flex flex-col space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            onClick={onClose}
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-1">
        <span className="text-[11px] text-slate-500">System Mode</span>
        <StatusBadge
          status={isDemoActive ? 'warning' : 'active'}
          label={isDemoActive ? 'Demo Mode' : 'Backend Live'}
          size="xs"
        />
      </div>
    </div>
  );
}
