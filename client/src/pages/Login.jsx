import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      addToast(`Welcome back, ${user.name}!`, 'success');
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900">Portal Authentication</h2>
          <p className="text-xs text-slate-500">Authorized Access for Antiquities Custodians & Authorities</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Official Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.gov.in"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-blue-600 text-slate-900 text-xs transition outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Security Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-blue-600 text-slate-900 text-xs transition outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Quick Logins */}
        <div className="pt-4 border-t border-slate-200 space-y-2">
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider text-center">Quick Demo Login Accounts</p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => handleQuickLogin('admin@nexdata.gov.in', 'Admin@123')}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-left text-slate-900 transition cursor-pointer"
            >
              <span className="font-bold block text-xs">Admin</span>
              <span className="text-[10px] text-slate-500">ASI HQ</span>
            </button>

            <button
              onClick={() => handleQuickLogin('custodian@chola.org', 'Pass@123')}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-left text-slate-900 transition cursor-pointer"
            >
              <span className="font-bold block text-xs">Custodian</span>
              <span className="text-[10px] text-slate-500">Temple Trust</span>
            </button>

            <button
              onClick={() => handleQuickLogin('authority@asi.gov.in', 'Pass@123')}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-left text-slate-900 transition cursor-pointer"
            >
              <span className="font-bold block text-xs">Authority</span>
              <span className="text-[10px] text-slate-500">Police Idol Wing</span>
            </button>

            <button
              onClick={() => handleQuickLogin('expert@heritage.in', 'Pass@123')}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-left text-slate-900 transition cursor-pointer"
            >
              <span className="font-bold block text-xs">Expert</span>
              <span className="text-[10px] text-slate-500">Museum Institute</span>
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Don't have an approved account?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Register Organization
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
