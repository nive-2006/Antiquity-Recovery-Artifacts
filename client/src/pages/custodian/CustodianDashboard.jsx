import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loading from '../../components/Loading';
import ArtifactCard from '../../components/ArtifactCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PlusCircle, AlertTriangle, Database, CheckCircle, Clock } from 'lucide-react';

const CustodianDashboard = () => {
  const [stats, setStats] = useState(null);
  const [myArtifacts, setMyArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, artifactsRes] = await Promise.all([
          api.get('/stats/overview'),
          api.get('/artifacts?my=true')
        ]);
        setStats(statsRes.data);
        setMyArtifacts(artifactsRes.data);
      } catch (err) {
        console.error('Custodian dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <Loading message="Loading Custodian Dashboard..." />;

  const counts = stats?.counts || {};
  const pieData = (stats?.statusDistribution || []).filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      {/* Top Banner / Actions */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">Custodian Command Center</h1>
          <p className="text-xs text-slate-500">Digital Registry & Stolen Theft Reporting Hub</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/custodian/register"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Register New Artifact
          </Link>
          <Link
            to="/custodian/report-stolen"
            className="px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition flex items-center gap-2 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-red-600" /> Report Stolen
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Registered</span>
            <Database className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{counts.totalArtifacts || 0}</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Stolen Alerts</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">{counts.stolenCount || 0}</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Match Pending</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{counts.matchPendingCount || 0}</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Verified / Returned</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{(counts.verifiedCount || 0) + (counts.returnedCount || 0)}</p>
        </div>
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-slate-900">Artifact Status Distribution</h3>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '12px', color: '#111827' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No status data to plot</div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-slate-900">Custodian Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/custodian/register"
              className="block p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition group"
            >
              <h4 className="text-xs font-bold text-blue-600 group-hover:underline">Register New Antiquity</h4>
              <p className="text-[11px] text-slate-500 mt-1">Upload photos, dimensions & inscription details to generate digital passport.</p>
            </Link>

            <Link
              to="/custodian/my-artifacts"
              className="block p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition group"
            >
              <h4 className="text-xs font-bold text-blue-600 group-hover:underline">View My Registered Repository</h4>
              <p className="text-[11px] text-slate-500 mt-1">Browse table of all artifacts under your custody.</p>
            </Link>

            <Link
              to="/custodian/report-stolen"
              className="block p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-red-300 transition group"
            >
              <h4 className="text-xs font-bold text-red-600 group-hover:underline">Flag Stolen Incident FIR</h4>
              <p className="text-[11px] text-slate-500 mt-1">Immediately broadcast stolen alert to Police & Interpol AI scanner.</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Artifacts Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-lg font-bold font-display text-slate-900">Recently Managed Artifacts</h3>
          <Link to="/custodian/my-artifacts" className="text-xs font-semibold text-blue-600 hover:underline">
            Manage All ({myArtifacts.length})
          </Link>
        </div>

        {myArtifacts.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No artifacts registered yet under your custody.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myArtifacts.slice(0, 3).map((art) => (
              <ArtifactCard key={art._id} artifact={art} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustodianDashboard;
