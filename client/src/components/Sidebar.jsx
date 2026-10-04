import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Database, 
  Search, 
  Scan, 
  CheckSquare, 
  UserCheck, 
  Users, 
  BarChart3, 
  ShieldCheck, 
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();
  if (!user) return null;

  const roleNavItems = {
    custodian: [
      { path: '/custodian/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/custodian/register', label: 'Register Artifact', icon: PlusCircle },
      { path: '/custodian/my-artifacts', label: 'My Artifacts', icon: Database },
      { path: '/detector', label: 'AI Pose Detector', icon: Scan },
      { path: '/custodian/report-stolen', label: 'Report Stolen', icon: AlertTriangle },
      { path: '/search', label: 'Global Registry', icon: Search }
    ],
    authority: [
      { path: '/authority/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/detector', label: 'AI Pose Detector', icon: Scan },
      { path: '/authority/report-recovered', label: 'Report Recovery', icon: Scan },
      { path: '/authority/cases', label: 'Recovery Cases', icon: FileText },
      { path: '/search', label: 'Global Registry', icon: Search }
    ],
    expert: [
      { path: '/expert/verification-queue', label: 'Verification Queue', icon: CheckSquare },
      { path: '/detector', label: 'AI Pose Detector', icon: Scan },
      { path: '/search', label: 'Global Registry', icon: Search }
    ],
    admin: [
      { path: '/admin/user-approvals', label: 'User Approvals', icon: UserCheck },
      { path: '/admin/users', label: 'User Directory', icon: Users },
      { path: '/admin/stats', label: 'System Analytics', icon: BarChart3 },
      { path: '/admin/audit', label: 'Audit Trail', icon: ShieldCheck },
      { path: '/detector', label: 'AI Pose Detector', icon: Scan },
      { path: '/search', label: 'Global Registry', icon: Search }
    ]
  };

  const navItems = roleNavItems[user.role] || [];

  return (
    <aside
      className={`fixed top-16 bottom-0 left-0 z-40 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col justify-between shadow-xs ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="py-4 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
          {isOpen ? `${user.role.toUpperCase()} WORKSPACE` : 'MENU'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border border-blue-100 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {isOpen && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
        {isOpen && (
          <div className="px-2 truncate">
            <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
            <p className="text-[11px] text-slate-500 truncate capitalize">{user.organization}</p>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition shadow-2xs"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
