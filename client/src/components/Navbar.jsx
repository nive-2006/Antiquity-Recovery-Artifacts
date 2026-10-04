import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, LogOut, Menu, Compass } from 'lucide-react';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 backdrop-blur-md z-50 flex items-center justify-between px-4 md:px-6 shadow-xs">
      <div className="flex items-center gap-4">
        {user && (
          <button
            onClick={toggleSidebar}
            className="p-2 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100 transition"
            aria-label="Toggle sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link to={user ? `/${user.role}/dashboard` : '/'} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 p-0.5 shadow-sm group-hover:bg-blue-700 transition-colors flex items-center justify-center">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Nex<span className="text-blue-600">Data</span>
            </span>
            <span className="hidden sm:inline-block ml-2.5 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700">
              Antiquities AI Network
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/search"
          className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 text-slate-500 hover:text-slate-900 text-xs shadow-xs transition"
        >
          <Search className="w-3.5 h-3.5 text-blue-600" />
          <span>Search Antiquities Registry...</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-semibold text-slate-900">{user.name}</span>
              <span className="text-[10px] font-mono uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-500 hover:text-red-600 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-600 transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition"
            >
              Register Organization
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
