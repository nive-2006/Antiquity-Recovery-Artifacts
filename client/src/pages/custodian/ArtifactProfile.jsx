import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Loading from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';
import Timeline from '../../components/Timeline';
import { useAuth } from '../../context/AuthContext';
import { Shield, AlertTriangle, Building, FileText } from 'lucide-react';

const ArtifactProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [artifact, setArtifact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchArtifact = async () => {
      try {
        const res = await api.get(`/artifacts/${id}`);
        setArtifact(res.data);
      } catch (err) {
        console.error('Error fetching artifact details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtifact();
  }, [id]);

  if (loading) return <Loading message="Accessing Antiquity Identity Passport..." />;
  if (!artifact) return <div className="p-8 text-center text-red-600 dark:text-red-400 font-semibold">Artifact record not found.</div>;

  const images = artifact.images || [];
  const selectedUrl = images[activeImage]?.url || null;
  const isOwner = user && artifact.ownerId && (artifact.ownerId._id === user._id || artifact.ownerId === user._id);


  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#1C1714] border border-[#E8E2D9] dark:border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs font-bold text-[#8D2B1D] dark:text-[#D4AF37] px-3 py-1 rounded-lg bg-[#C59B27]/10 border border-[#C59B27]/25">
              ID: {artifact.artifactId}
            </span>
            <StatusBadge status={artifact.status} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-[#1C1917] dark:text-[#F5F0EB]">{artifact.name}</h1>
          <p className="text-xs text-[#78716C] dark:text-[#A89F95] flex items-center gap-1.5">
            <Building className="w-4 h-4 text-[#8D2B1D] dark:text-[#D4AF37]" /> Custodian:{' '}
            <span className="text-[#1C1917] dark:text-[#F5F0EB] font-semibold">
              {artifact.ownerId?.organization || artifact.ownerId?.name || 'Registered Trustee'}
            </span>
          </p>
        </div>

        {isOwner && artifact.status === 'registered' && (
          <Link
            to={`/custodian/report-stolen?id=${artifact._id}`}
            className="px-5 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 font-bold text-xs shadow-md transition flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" /> Report Stolen / Missing
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Gallery & Metadata */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-[#1C1714] border border-[#E8E2D9] dark:border-white/10 rounded-3xl overflow-hidden p-4 space-y-4 shadow-xs">
            <div className="h-96 rounded-2xl bg-[#14100E] overflow-hidden relative border border-[#E8E2D9] dark:border-white/10 flex items-center justify-center">
              {selectedUrl ? (
                <>
                  <img
                    src={selectedUrl}
                    alt={artifact.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-3 left-3 bg-[#1C1714]/85 text-[#D4AF37] text-xs font-semibold px-3 py-1 rounded-lg border border-[#C59B27]/30 backdrop-blur-md">
                    Angle: {images[activeImage]?.angle || 'Front View'}
                  </span>
                </>
              ) : (
                <span className="text-xs text-stone-400">No registered artifact image available</span>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                      activeImage === idx ? 'border-[#8D2B1D] dark:border-[#D4AF37] scale-105' : 'border-[#E8E2D9] dark:border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={img.angle} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#1C1714] border border-[#E8E2D9] dark:border-white/10 rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-[#1C1917] dark:text-[#F5F0EB] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#8D2B1D] dark:text-[#D4AF37]" /> Physical & Archeological Identity
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-[#FAF7F3] dark:bg-[#14100E] p-3 rounded-xl border border-[#E8E2D9] dark:border-white/10">
                <span className="text-[#78716C] dark:text-[#A89F95] block text-[10px] uppercase font-semibold">Material</span>
                <span className="text-[#1C1917] dark:text-[#F5F0EB] font-bold">{artifact.material}</span>
              </div>

              <div className="bg-[#FAF7F3] dark:bg-[#14100E] p-3 rounded-xl border border-[#E8E2D9] dark:border-white/10">
                <span className="text-[#78716C] dark:text-[#A89F95] block text-[10px] uppercase font-semibold">Era / Period</span>
                <span className="text-[#1C1917] dark:text-[#F5F0EB] font-bold">{artifact.era}</span>
              </div>

              <div className="bg-[#FAF7F3] dark:bg-[#14100E] p-3 rounded-xl border border-[#E8E2D9] dark:border-white/10">
                <span className="text-[#78716C] dark:text-[#A89F95] block text-[10px] uppercase font-semibold">Region</span>
                <span className="text-[#1C1917] dark:text-[#F5F0EB] font-bold">{artifact.region}</span>
              </div>

              <div className="bg-[#FAF7F3] dark:bg-[#14100E] p-3 rounded-xl border border-[#E8E2D9] dark:border-white/10 col-span-2 sm:col-span-3">
                <span className="text-[#78716C] dark:text-[#A89F95] block text-[10px] uppercase font-semibold">Dimensions</span>
                <span className="text-[#1C1917] dark:text-[#F5F0EB] font-medium">{artifact.dimensions || 'N/A'}</span>
              </div>
            </div>

            {artifact.inscriptionText && (
              <div className="bg-[#C59B27]/10 border border-[#C59B27]/25 p-4 rounded-2xl space-y-1">
                <span className="text-xs font-bold text-[#8D2B1D] dark:text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Epigraphy / Inscription Transcriptions:
                </span>
                <p className="text-xs text-[#1C1917] dark:text-[#F5F0EB] font-mono italic">{artifact.inscriptionText}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Provenance & Status History Timelines */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-[#1C1714] border border-[#E8E2D9] dark:border-white/10 rounded-3xl p-6 shadow-xs">
            <Timeline items={artifact.provenance} title="Provenance & Historical Ownership" />
          </div>

          <div className="bg-white dark:bg-[#1C1714] border border-[#E8E2D9] dark:border-white/10 rounded-3xl p-6 shadow-xs">
            <Timeline items={artifact.history} title="Status Ledger Audit Trail" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtifactProfile;
