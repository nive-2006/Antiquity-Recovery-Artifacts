import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loading from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';
import { Scan, FileText } from 'lucide-react';

const AuthorityDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentCases, setRecentCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, casesRes] = await Promise.all([
          api.get('/stats/overview'),
          api.get('/cases')
        ]);
        setStats(statsRes.data);
        setRecentCases(casesRes.data.slice(0, 5));
      } catch (err) {
        console.error('Authority dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <Loading message="Initializing Law Enforcement Terminal..." />;

  const counts = stats?.counts || {};

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#1C1714] border border-[#E8E2D9] dark:border-white/10 rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#1C1917] dark:text-[#F5F0EB]">Law Enforcement & ASI Recovery Terminal</h1>
          <p className="text-xs text-[#78716C] dark:text-[#A89F95]">AI Image Matching & Seizure Operation Control</p>
        </div>
        <Link
          to="/authority/report-recovered"
          className="px-5 py-3 rounded-xl bg-[#8D2B1D] hover:bg-[#732216] text-white font-bold text-xs shadow-md shadow-[#8D2B1D]/20 transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Scan className="w-4 h-4" /> Run AI Recovery Scan
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1C1714] border border-[#E8E2D9] dark:border-white/10 p-5 rounded-2xl space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-[#78716C] dark:text-[#A89F95]">Total Seized Objects</span>
          <p className="text-2xl font-bold text-[#1C1917] dark:text-[#F5F0EB]">{counts.totalRecoveredObjects || 0}</p>
        </div>

        <div className="bg-white dark:bg-[#1C1714] border border-[#E8E2D9] dark:border-white/10 p-5 rounded-2xl space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-[#78716C] dark:text-[#A89F95]">Active Match Pending</span>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{counts.pendingCases || 0}</p>
        </div>

        <div className="bg-white dark:bg-[#1C1714] border border-[#E8E2D9] dark:border-white/10 p-5 rounded-2xl space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-[#78716C] dark:text-[#A89F95]">Verified Recoveries</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{counts.verifiedCases || 0}</p>
        </div>

        <div className="bg-white dark:bg-[#1C1714] border border-[#E8E2D9] dark:border-white/10 p-5 rounded-2xl space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-[#78716C] dark:text-[#A89F95]">Stolen Alerts Open</span>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{counts.stolenCount || 0}</p>
        </div>
      </div>

      {/* Action Cards & Recent Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E2D9] dark:border-white/10 pb-3">
            <h3 className="text-base font-bold text-[#1C1917] dark:text-[#F5F0EB]">Active Recovery & AI Match Cases</h3>
            <Link to="/authority/cases" className="text-xs font-semibold text-[#8D2B1D] dark:text-[#D4AF37] hover:underline">
              View All Cases
            </Link>
          </div>

          {recentCases.length === 0 ? (
            <p className="text-sm text-[#78716C] dark:text-[#A89F95] italic">No recovery cases recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentCases.map((c) => (
                <div key={c._id} className="bg-white dark:bg-[#1C1714] border border-[#E8E2D9] dark:border-white/10 p-4 rounded-2xl flex items-center justify-between gap-4 hover:border-[#C59B27]/50 transition shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#8D2B1D] dark:text-[#D4AF37]">{c.caseId}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <h4 className="text-sm font-bold text-[#1C1917] dark:text-[#F5F0EB] mt-1">
                      {c.artifactId?.name || 'Unidentified Recovered Object'}
                    </h4>
                    <p className="text-xs text-[#78716C] dark:text-[#A89F95]">
                      Custodian: {c.artifactId?.ownerId?.organization || 'Temple/Museum'}
                    </p>
                  </div>
                  <Link
                    to={`/expert/review-match?caseId=${c._id}`}
                    className="px-3 py-1.5 rounded-xl bg-[#FAF7F3] dark:bg-white/5 hover:bg-[#8D2B1D] hover:text-white dark:hover:bg-[#8D2B1D] text-[#1C1917] dark:text-[#F5F0EB] text-xs font-semibold border border-[#E8E2D9] dark:border-white/10 transition shrink-0"
                  >
                    View Case File
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#1C1714] border border-[#E8E2D9] dark:border-white/10 rounded-3xl p-6 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-[#1C1917] dark:text-[#F5F0EB]">Police & ASI Operations</h3>
          <div className="space-y-3 text-xs">
            <Link
              to="/authority/report-recovered"
              className="block p-4 rounded-2xl bg-[#C59B27]/10 border border-[#C59B27]/25 hover:bg-[#C59B27]/15 transition space-y-1"
            >
              <h4 className="font-bold text-[#8D2B1D] dark:text-[#D4AF37] flex items-center gap-1.5">
                <Scan className="w-4 h-4" /> Upload Seized Object Photos
              </h4>
              <p className="text-[#78716C] dark:text-[#A89F95] text-[11px]">Run automated AI vector distance search against national registry.</p>
            </Link>

            <Link
              to="/authority/cases"
              className="block p-4 rounded-2xl bg-[#FAF7F3] dark:bg-white/5 border border-[#E8E2D9] dark:border-white/10 hover:border-[#C59B27] transition space-y-1"
            >
              <h4 className="font-bold text-[#1C1917] dark:text-[#F5F0EB] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Case Timeline & Custody Trail
              </h4>
              <p className="text-[#78716C] dark:text-[#A89F95] text-[11px]">Track expert verification decisions and court order status.</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorityDashboard;
