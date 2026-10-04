import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Loading from '../../components/Loading';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BarChart3 } from 'lucide-react';

const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats/overview');
        setStats(res.data);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Loading message="Loading System Analytics & Intelligence..." />;

  const counts = stats?.counts || {};
  const statusData = stats?.statusDistribution || [];
  const materialData = stats?.materialDistribution || [];

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <h1 className="text-2xl font-display font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-amber-600 dark:text-amber-500" /> System Analytics & Network Metrics
        </h1>
        <p className="text-xs text-stone-600 dark:text-stone-400">National antiquities identity registry performance charts</p>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl space-y-1 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Total Registered</span>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{counts.totalArtifacts || 0}</p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl space-y-1 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Registered Users</span>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{counts.totalUsers || 0}</p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl space-y-1 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Seized Interceptions</span>
          <p className="text-2xl font-bold text-terracotta dark:text-terracotta-light">{counts.totalRecoveredObjects || 0}</p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl space-y-1 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Verified Recoveries</span>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{counts.verifiedCases || 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">Artifact Status Ledger Breakdown</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" className="dark:stroke-stone-800" />
                <XAxis dataKey="name" stroke="#78716c" fontSize={11} />
                <YAxis stroke="#78716c" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1c1917', borderColor: '#292524', borderRadius: '12px', color: '#f5f5f4' }} />
                <Bar dataKey="value" fill="#8D2B1D" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">Antiquities Material Classification</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={materialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" className="dark:stroke-stone-800" />
                <XAxis dataKey="name" stroke="#78716c" fontSize={11} />
                <YAxis stroke="#78716c" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1c1917', borderColor: '#292524', borderRadius: '12px', color: '#f5f5f4' }} />
                <Bar dataKey="count" fill="#C59B27" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
