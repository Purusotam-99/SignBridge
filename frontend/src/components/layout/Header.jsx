// Purpose: Application header with navigation, backend status, and settings modal
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Layers,
  Video,
  Type,
  BarChart2,
  Settings,
  Menu,
  X,
  Radio,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { NAVIGATION_LINKS, API_BASE_URL } from '../../config/constants';
import { useRecognitionContext } from '../../context/RecognitionContext';
import StatusBadge from '../common/StatusBadge';
import MobileMenu from './MobileMenu';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
    connectionStatus,
    isDemoActive,
    demoMode,
    setDemoMode,
    refreshConnection,
    isDebugMode,
    setIsDebugMode
  } = useRecognitionContext();

  const getNavIcon = (path) => {
    switch (path) {
      case '/': return <Layers className="w-4 h-4" />;
      case '/live': return <Video className="w-4 h-4" />;
      case '/text-to-sign': return <Type className="w-4 h-4" />;
      case '/analytics': return <BarChart2 className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo and App Title */}
            <div className="flex items-center space-x-6">
              <NavLink to="/" className="flex items-center space-x-2 group">
                <img
                  src="/logo.png"
                  alt="SignBridge Logo"
                  className="h-8 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                />
                <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                  ISL
                </span>
              </NavLink>

              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center space-x-1">
                {NAVIGATION_LINKS.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`
                    }
                  >
                    {getNavIcon(link.path)}
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Right Status Badges & Settings */}
            <div className="flex items-center space-x-3">
              {/* Demo Mode / Backend Offline Warning */}
              {isDemoActive ? (
                <StatusBadge
                  status="warning"
                  label="Demo mode — backend offline"
                  icon={<AlertTriangle className="w-3 h-3 text-amber-600" />}
                />
              ) : (
                <StatusBadge
                  status="active"
                  label="Backend Online"
                  pulse={true}
                  icon={<CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                />
              )}

              {/* Debug Toggle Button */}
              <button
                type="button"
                onClick={() => setIsDebugMode(!isDebugMode)}
                aria-label="Toggle Debug Telemetry"
                title="Toggle Live Debug Telemetry (?debug=1)"
                className={`px-2 py-1 rounded-md text-[11px] font-mono font-medium transition-colors border ${
                  isDebugMode
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {isDebugMode ? 'Debug ON' : 'Debug'}
              </button>

              {/* Settings Icon Button */}
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                aria-label="Application Settings"
                title="Settings"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Mobile Hamburger Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
                className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <MobileMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          links={NAVIGATION_LINKS}
          isDemoActive={isDemoActive}
        />
      </header>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-semibold text-slate-900">SignBridge Settings</h3>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                aria-label="Close settings"
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Backend API Endpoint</label>
                <input
                  type="text"
                  readOnly
                  value={API_BASE_URL}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="font-medium text-slate-800 block">Force Demo Mode</span>
                  <span className="text-[11px] text-slate-500">Simulate predictions for UI testing</span>
                </div>
                <input
                  type="checkbox"
                  checked={demoMode}
                  onChange={(e) => setDemoMode(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Backend Connection:</span>
                <span className={connectionStatus.isOnline ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                  {connectionStatus.isOnline ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  refreshConnection();
                  setSettingsOpen(false);
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
