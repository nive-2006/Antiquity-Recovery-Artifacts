import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loading from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { FileText, Calendar, CheckSquare, ChevronRight } from 'lucide-react';

const Cases = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const url = statusFilter ? `/cases?status=${statusFilter}` : '/cases';
        const res = await api.get(url);
        setCases(res.data);
      } catch (err) {
        console.error('Error fetching cases:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, [statusFilter]);

  if (loading) return <Loading message="Loading Recovery Case Ledger..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-stone-900 dark:text-stone-100">Recovery & Verification Case Ledger</h1>
          <p className="text-xs text-stone-600 dark:text-stone-400">Formal law enforcement & expert verification case files</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 text-xs outline-none focus:border-amber-500 shadow-sm transition"
          >
            <option value="">All Case Statuses</option>
            <option value="match_pending">Match Pending</option>
            <option value="verified">Verified Match</option>
            <option value="rejected">Rejected Match</option>
            <option value="repatriating">Repatriating</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>

      {cases.length === 0 ? (
        <EmptyState
          title="No Recovery Cases Found"
          description="There are currently no recovery cases matching the selected filter."
        />
      ) : (
        <div className="space-y-4">
          {cases.map((c) => (
            <div
              key={c._id}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    {c.caseId}
                  </span>
                  <StatusBadge status={c.status} />
                </div>
                <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Created {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-semibold">Matched Artifact Identity</span>
                  <p className="font-bold text-stone-900 dark:text-stone-100 text-sm">{c.artifactId?.name || 'Unidentified'}</p>
                  <p className="text-stone-600 dark:text-stone-400">{c.artifactId?.era} • {c.artifactId?.material}</p>
                </div>

                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-semibold">Custodian Institution</span>
                  <p className="font-semibold text-amber-700 dark:text-amber-400">{c.artifactId?.ownerId?.organization || 'Registered Trust'}</p>
                  {c.verifiedBy && (
                    <p className="text-stone-500 dark:text-stone-400">Verified by: {c.verifiedBy.name} ({c.verifiedBy.organization})</p>
                  )}
                </div>
              </div>

              {c.note && (
                <p className="text-xs text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-950 p-3 rounded-xl border border-stone-200 dark:border-stone-800/80 italic">
                  Note: {c.note}
                </p>
              )}

              <div className="flex justify-end pt-2">
                <Link
                  to={`/expert/review-match?caseId=${c._id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-stone-950 text-stone-700 dark:text-stone-200 text-xs font-semibold transition shadow-xs"
                >
                  View Full Case Workspace <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Cases;
