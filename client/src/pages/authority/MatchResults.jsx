import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Loading from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';
import { Sparkles, MapPin, Calendar, ArrowRight } from 'lucide-react';

const MatchResults = () => {
  const [searchParams] = useSearchParams();
  const recId = searchParams.get('id');

  const [recoveredObj, setRecoveredObj] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await api.get(`/recovered/${recId}/matches`);
        setRecoveredObj(res.data);
      } catch (err) {
        console.error('Error fetching match results:', err);
      } finally {
        setLoading(false);
      }
    };
    if (recId) fetchMatches();
  }, [recId]);

  if (loading) return <Loading message="Computing AI Feature Distance Vectors..." />;
  if (!recoveredObj) return <div className="p-8 text-center text-red-600 dark:text-red-400 font-semibold">Recovery match record not found.</div>;

  const matches = recoveredObj.matches || [];
  const primaryRecImage = recoveredObj.images?.[0] || null;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#1C1714] border border-[#E8E2D9] dark:border-white/10 rounded-3xl p-6 md:p-8 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-[#8D2B1D] dark:text-[#D4AF37] uppercase tracking-widest">
          <Sparkles className="w-4 h-4 text-[#C59B27]" /> AI Neural Vision Match Report
        </div>
        <h1 className="text-2xl font-bold font-display text-[#1C1917] dark:text-[#F5F0EB]">Top Candidate Identity Matches</h1>
        <p className="text-xs text-[#78716C] dark:text-[#A89F95] flex items-center gap-4">
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#C59B27]" /> Seized at {recoveredObj.location}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#C59B27]" /> {new Date(recoveredObj.foundDate).toLocaleDateString()}</span>
        </p>
      </div>

      {/* Top Match Cards */}
      <div className="space-y-6">
        <h3 className="text-base font-bold text-[#1C1917] dark:text-[#F5F0EB]">AI Ranked Candidates ({matches.length})</h3>

        {matches.map((m, idx) => {
          const artifact = m.artifactId;
          if (!artifact) return null;

          const registeredImg = artifact.images?.[0]?.url || null;
          const score = m.score || 0;

          return (
            <div
              key={idx}
              className="bg-white dark:bg-[#1C1714] border border-[#E8E2D9] dark:border-white/10 hover:border-[#C59B27]/50 rounded-3xl p-6 space-y-6 shadow-xs transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D9] dark:border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-[#C59B27]/10 border border-[#C59B27]/30 flex items-center justify-center font-mono font-bold text-[#8D2B1D] dark:text-[#D4AF37] text-xs">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="text-base font-bold text-[#1C1917] dark:text-[#F5F0EB]">{artifact.name}</h4>
                    <p className="text-xs font-mono text-[#8D2B1D] dark:text-[#D4AF37]">{artifact.artifactId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#78716C] dark:text-[#A89F95] block">Cosine Similarity</span>
                    <span className="text-xl font-black text-[#8D2B1D] dark:text-[#D4AF37]">{typeof score === 'number' ? score.toFixed(4) : score}</span>
                  </div>
                  <StatusBadge status={artifact.status} />
                </div>
              </div>

              {/* Side-by-Side preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#14100E] border border-[#E8E2D9] dark:border-white/10 rounded-2xl overflow-hidden relative flex items-center justify-center min-h-[200px]">
                  <span className="absolute top-2 left-2 bg-[#B91C1C] text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-xs z-10">
                    Seized Recovered Photo
                  </span>
                  {primaryRecImage ? (
                    <img src={primaryRecImage} alt="Seized" className="w-full h-56 object-cover" />
                  ) : (
                    <span className="text-xs text-stone-400">No registered artifact image available</span>
                  )}
                </div>

                <div className="bg-[#14100E] border border-[#E8E2D9] dark:border-white/10 rounded-2xl overflow-hidden relative flex items-center justify-center min-h-[200px]">
                  <span className="absolute top-2 left-2 bg-[#15803D] text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-xs z-10">
                    Registered Digital Passport ({artifact.name})
                  </span>
                  {registeredImg ? (
                    <img src={registeredImg} alt="Registered" className="w-full h-56 object-cover" />
                  ) : (
                    <span className="text-xs text-stone-400">No registered artifact image available</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-[#78716C] dark:text-[#A89F95]">
                  Custodian: <span className="text-[#1C1917] dark:text-[#F5F0EB] font-semibold">{artifact.ownerId?.organization || 'Registered Trustee'}</span>
                </div>
                <Link
                  to={`/expert/review-match?artifactId=${artifact._id}&recId=${recoveredObj._id}`}
                  className="px-5 py-2.5 rounded-xl bg-[#8D2B1D] hover:bg-[#732216] text-white font-bold text-xs shadow-md shadow-[#8D2B1D]/20 transition flex items-center gap-2 cursor-pointer"
                >
                  Inspect Verification Workspace <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchResults;
