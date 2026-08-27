import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Bell, LogOut, User, Building2, 
  Shield, FileText, ChevronDown, CheckCircle2,
  Trash2, Menu, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { formatRelativeTime } from '../../utils/formatters';

export default function Navbar({ onSearch, onNavigate, onToggleMobileMenu, mobileMenuOpen, currentSearchQuery = '' }) {
  const { user, logout, collegeSettings } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  const [searchQuery, setSearchQuery] = useState(currentSearchQuery);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    setSearchQuery(currentSearchQuery || '');
  }, [currentSearchQuery]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
      setShowMobileSearch(false);
    }
  };

  const handleNotificationClick = (n) => {
    markAsRead(n.id);
    setShowNotifications(false);
    if (n.link && onNavigate) {
      onNavigate(n.link);
    }
  };

  const roleColor = user?.role_name === 'admin' 
    ? 'bg-rose-50 text-rose-700 border-rose-200' 
    : user?.role_name === 'hod' 
    ? 'bg-purple-50 text-purple-700 border-purple-200' 
    : 'bg-blue-50 text-blue-700 border-blue-200';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 sm:px-6 backdrop-blur-md shadow-xs">
      {/* Left: Mobile Menu Toggle & Institution Branding */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileMenu}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 lg:hidden transition cursor-pointer"
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-500/20">
          <Building2 className="h-5 w-5" />
        </div>

        <div className="text-left min-w-0">
          <h1 className="text-xs font-extrabold uppercase tracking-wide text-indigo-900 line-clamp-1 max-w-[180px] sm:max-w-md lg:max-w-lg">
            {collegeSettings?.college_name || 'Vallurupalli Nageswara Rao Vignana Jyothi Institute of Engineering &Technology'}
          </h1>
          <p className="text-[11px] sm:text-xs font-semibold text-slate-500 flex items-center gap-1.5 truncate">
            <span className="truncate">{collegeSettings?.system_name || 'Faculty File Management System'}</span>
            <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-slate-300"></span>
            <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider shrink-0">VNR VJIET</span>
          </p>
        </div>
      </div>

      {/* Middle: Universal Search (Desktop) */}
      <div className="hidden md:block mx-4 flex-1 max-w-md lg:max-w-lg">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents, folders, question papers, OCR text..."
            className="w-full rounded-full border border-slate-200 bg-slate-50/80 py-2 pl-10 pr-20 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:from-blue-700 hover:to-indigo-700 transition cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Right Controls: Search Toggle (Mobile), Role Badge, Notifications, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Mobile Search Toggle */}
        <button
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition"
          title="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Current Role Badge */}
        <div className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${roleColor}`}>
          <Shield className="h-3.5 w-3.5" />
          <span>Role: <strong className="uppercase">{user?.role_name || 'FACULTY'}</strong></span>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-[11px] text-slate-400 hover:text-rose-500 cursor-pointer"
                      title="Clear All"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-2 max-h-80 space-y-1.5 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-xl p-2.5 text-xs transition ${
                        !n.read_status 
                          ? 'bg-indigo-50/70 font-medium' 
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                        !n.read_status 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="font-semibold text-slate-900 truncate">
                          {n.title}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-2">
                          {n.message}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          {formatRelativeTime(n.created_at)}
                        </div>
                      </div>
                      {!n.read_status && (
                        <div className="h-2 w-2 rounded-full bg-indigo-600 mt-1.5" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 p-1.5 pr-2 transition hover:bg-slate-100 hover:border-slate-300 cursor-pointer"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white uppercase shadow-xs">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-800 max-w-[120px] truncate leading-tight">
                {user?.full_name}
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold leading-tight">
                {user?.department_code || user?.role_name}
              </div>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50">
              <div className="border-b border-slate-100 p-2 text-left">
                <div className="font-bold text-xs text-slate-900 truncate">
                  {user?.full_name}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  @{user?.username} • {user?.email}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase ${roleColor}`}>
                    {user?.role_name}
                  </span>
                  {user?.department_code && (
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
                      {user?.department_code}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-1 space-y-0.5">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onNavigate) onNavigate('/profile');
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  My Profile
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay Bar */}
      {showMobileSearch && (
        <div className="absolute inset-x-0 top-16 bg-white border-b border-slate-200 p-3 shadow-md z-30 md:hidden animate-in slide-in-from-top duration-150">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents, OCR text..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs"
            >
              Search
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
