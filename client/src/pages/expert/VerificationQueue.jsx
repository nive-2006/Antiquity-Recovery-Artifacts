import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loading from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { CheckSquare, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

const VerificationQueue = () => {
  const [pendingCases, setPendingCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await api.get('/cases?status=match_pending');
        setPendingCases(res.data);
      } catch (err) {
        console.error('Error fetching verification queue:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, []);

  if (loading) return <Loading message="Loading Expert Verification Queue..." />;

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <h1 className="text-2xl font-display font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-amber-600 dark:text-amber-500" /> Expert Archaeology Verification Queue
        </h1>
        <p className="text-xs text-stone-600 dark:text-stone-400">Review AI candidate matches and issue official verification decisions</p>
      </div>

      {pendingCases.length === 0 ? (
        <EmptyState
          title="Queue Empty"
          description="There are currently no AI matches waiting for expert verification."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendingCases.map((c) => {
            const artifact = c.artifactId;
            const recObj = c.recoveredObjectId;

            return (
              <div
                key={c._id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      Case: {c.caseId}
                    </span>
                    <StatusBadge status={c.status} />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">{artifact?.name || 'Unidentified Artifact'}</h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400">{artifact?.era} • {artifact?.material}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-1">Custodian: {artifact?.ownerId?.organization}</p>
                  </div>

                  {recObj && (
                    <div className="bg-stone-50 dark:bg-stone-950 p-3 rounded-2xl border border-stone-200 dark:border-stone-800 flex items-center gap-3">
                      <img
                        src={recObj.images?.[0] || 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=800&q=80'}
                        alt="Seized"
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div className="text-xs">
                        <span className="text-stone-500 dark:text-stone-400 block">Seizure Location:</span>
                        <span className="text-stone-800 dark:text-stone-200 font-semibold">{recObj.location}</span>
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  to={`/expert/review-match?caseId=${c._id}`}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-stone-950 font-semibold text-xs shadow-sm transition flex items-center justify-center gap-2"
                >
                  Enter Verification Workspace <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VerificationQueue;
