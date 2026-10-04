import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Loading from '../../components/Loading';
import { AlertTriangle } from 'lucide-react';

const ReportStolen = () => {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('id');
  
  const [artifacts, setArtifacts] = useState([]);
  const [selectedId, setSelectedId] = useState(preselectedId || '');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState('');
  const [firNumber, setFirNumber] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArtifacts = async () => {
      try {
        const res = await api.get('/artifacts?my=true');
        // Only allow reporting stolen for registered artifacts
        const registered = res.data.filter(a => a.status === 'registered');
        setArtifacts(registered);
        if (preselectedId) setSelectedId(preselectedId);
        else if (registered.length > 0) setSelectedId(registered[0]._id);
      } catch (err) {
        console.error('Error loading artifacts for theft report:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtifacts();
  }, [preselectedId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) {
      addToast('Please select a registered artifact to report.', 'error');
      return;
    }
    setSubmitting(true);

    try {
      const fullNote = `Stolen Report FIR: ${firNumber || 'Pending'} | Incident Date: ${incidentDate} | Location: ${location} | Note: ${note}`;
      
      await api.patch(`/artifacts/${selectedId}/status`, {
        status: 'stolen',
        note: fullNote
      });

      addToast('Stolen alert broadcasted to AI Recovery scanner & Police database!', 'success');
      navigate('/custodian/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to file stolen report.';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading message="Loading registered antiquities..." />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-[#E8E2D9] dark:border-white/10 pb-4">
        <h1 className="text-2xl font-bold font-display text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" /> Report Antiquity Stolen / Missing FIR
        </h1>
        <p className="text-xs text-[#78716C] dark:text-[#A89F95]">Broadcast missing notice to ASI, INTERPOL & Police Special Recovery Wings</p>
      </div>

      {artifacts.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1714] border border-[#E8E2D9] dark:border-white/10 rounded-2xl p-8 text-center space-y-4 shadow-xs">
          <p className="text-sm text-[#78716C] dark:text-[#A89F95]">You have no active 'registered' artifacts eligible to report stolen.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1C1714] border border-[#E8E2D9] dark:border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] dark:text-[#F5F0EB] mb-1">Select Stolen Artifact *</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F3] dark:bg-[#14100E] border border-[#E8E2D9] dark:border-white/10 focus:border-[#C59B27] text-[#1C1917] dark:text-[#F5F0EB] text-xs outline-none cursor-pointer"
            >
              {artifacts.map((art) => (
                <option key={art._id} value={art._id} className="bg-white dark:bg-[#1C1714]">
                  {art.name} ({art.artifactId}) - {art.era}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] dark:text-[#F5F0EB] mb-1">Incident Date *</label>
              <input
                type="date"
                required
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F3] dark:bg-[#14100E] border border-[#E8E2D9] dark:border-white/10 focus:border-[#C59B27] text-[#1C1917] dark:text-[#F5F0EB] text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] dark:text-[#F5F0EB] mb-1">Police FIR Number</label>
              <input
                type="text"
                value={firNumber}
                onChange={(e) => setFirNumber(e.target.value)}
                placeholder="e.g. FIR #402/2026 TN Idol Wing"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F3] dark:bg-[#14100E] border border-[#E8E2D9] dark:border-white/10 focus:border-[#C59B27] text-[#1C1917] dark:text-[#F5F0EB] text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] dark:text-[#F5F0EB] mb-1">Theft Site Location Details *</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Sanctum Sanctorum, Kapaleeshwarar Temple, Mylapore"
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F3] dark:bg-[#14100E] border border-[#E8E2D9] dark:border-white/10 focus:border-[#C59B27] text-[#1C1917] dark:text-[#F5F0EB] text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] dark:text-[#F5F0EB] mb-1">Incident Summary & Investigation Notes *</label>
            <textarea
              rows={3}
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Detail circumstances of theft, break-in evidence, physical damages, or suspect info..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F3] dark:bg-[#14100E] border border-[#E8E2D9] dark:border-white/10 focus:border-[#C59B27] text-[#1C1917] dark:text-[#F5F0EB] text-xs outline-none"
            />
          </div>

          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-xs text-red-600 dark:text-red-400 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> State Machine Status Transition:
            </p>
            <p className="text-[11px] opacity-90">
              Submitting this form transitions artifact status from <span className="font-mono font-bold">registered</span> to <span className="font-mono font-bold">stolen</span> and locks editing rights until verification.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xl shadow-red-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? 'Broadcasting Theft Alert...' : 'Broadcast Stolen Alert'} <AlertTriangle className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
};

export default ReportStolen;
