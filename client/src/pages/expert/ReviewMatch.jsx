import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Loading from '../../components/Loading';
import ImageCompare from '../../components/ImageCompare';
import StatusBadge from '../../components/StatusBadge';
import Timeline from '../../components/Timeline';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, XCircle, CheckCircle, FileText, AlertTriangle } from 'lucide-react';

const ReviewMatch = () => {
  const [searchParams] = useSearchParams();
  const caseIdParam = searchParams.get('caseId');
  const artifactIdParam = searchParams.get('artifactId');
  const recIdParam = searchParams.get('recId');

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [note, setNote] = useState('');
  const [decisionType, setDecisionType] = useState(null); // 'approve' | 'reject'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (caseIdParam) {
          const res = await api.get(`/cases/${caseIdParam}`);
          setCaseData(res.data);
        } else if (artifactIdParam && recIdParam) {
          const casesRes = await api.get('/cases');
          const matchedCase = casesRes.data.find(
            (c) => c.artifactId?._id === artifactIdParam || c.artifactId?.artifactId === artifactIdParam
          );
          if (matchedCase) {
            setCaseData(matchedCase);
          }
        }
      } catch (err) {
        console.error('Error loading review match details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [caseIdParam, artifactIdParam, recIdParam]);

  if (loading) return <Loading message="Loading Expert Inspection Workspace..." />;
  if (!caseData) return <div className="p-8 text-center text-red-500 font-medium">Case file not found or invalid parameters.</div>;

  const artifact = caseData.artifactId;
  const recoveredObj = caseData.recoveredObjectId;

  const recoveredImg = recoveredObj?.images?.[0] || null;
  const registeredImg = artifact?.images?.[0]?.url || null;

  const handleOpenDecision = (type) => {
    setDecisionType(type);
    setIsModalOpen(true);
  };

  const handleConfirmDecision = async () => {
    if (!note || note.trim() === '') {
      addToast('A mandatory verification justification note is required.', 'error');
      return;
    }
    setSubmitting(true);

    try {
      const res = await api.post(`/cases/${caseData._id}/verify`, {
        decision: decisionType,
        note
      });

      addToast(res.data.message, 'success');
      setIsModalOpen(false);
      navigate('/expert/verification-queue');
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification decision failed.';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
              {caseData.caseId}
            </span>
            <StatusBadge status={caseData.status} />
          </div>
          <h1 className="text-2xl font-display font-semibold text-stone-900 dark:text-stone-100">Expert Identification Workspace</h1>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Comparing seized object from <span className="text-stone-800 dark:text-stone-200 font-semibold">{recoveredObj?.location}</span> against registered identity
          </p>
        </div>

        {caseData.status === 'match_pending' && (
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleOpenDecision('reject')}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 font-bold text-xs transition flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Reject Match
            </button>
            <button
              onClick={() => handleOpenDecision('approve')}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Approve & Verify Match
            </button>
          </div>
        )}
      </div>

      {/* Visual Comparison Workspace */}
      <ImageCompare
        imageA={recoveredImg}
        labelA={`Seized Object (${recoveredObj?.location})`}
        imageB={registeredImg}
        labelB={`Registered Passport (${artifact?.name})`}
      />

      {/* Artifact Metadata Comparison & Provenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-500" /> Registered Passport Characteristics
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
              <span className="text-stone-500 dark:text-stone-400">Artifact Name</span>
              <span className="text-stone-900 dark:text-stone-100 font-bold">{artifact?.name}</span>
            </div>

            <div className="flex justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
              <span className="text-stone-500 dark:text-stone-400">Material</span>
              <span className="text-stone-900 dark:text-stone-100 font-bold">{artifact?.material}</span>
            </div>

            <div className="flex justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
              <span className="text-stone-500 dark:text-stone-400">Historical Era</span>
              <span className="text-stone-900 dark:text-stone-100 font-bold">{artifact?.era}</span>
            </div>

            <div className="flex justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
              <span className="text-stone-500 dark:text-stone-400">Dimensions</span>
              <span className="text-stone-900 dark:text-stone-100 font-bold">{artifact?.dimensions || 'N/A'}</span>
            </div>

            <div className="flex justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
              <span className="text-stone-500 dark:text-stone-400">Custodian Trust</span>
              <span className="text-amber-700 dark:text-amber-400 font-bold">{artifact?.ownerId?.organization}</span>
            </div>
          </div>

          {artifact?.inscriptionText && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-400">Pedestal Inscription Record:</span>
              <p className="text-xs text-stone-800 dark:text-stone-200 font-mono italic">{artifact.inscriptionText}</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
          <Timeline items={caseData.timeline} title="Case Audit & Verification Timeline" />
        </div>
      </div>

      {/* Decision Confirmation Modal */}
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDecision}
        title={decisionType === 'approve' ? 'Approve & Verify Identity Match' : 'Reject Match Candidate'}
        message={
          <div>
            <p className="mb-3 text-stone-700 dark:text-stone-300">
              {decisionType === 'approve'
                ? `You are certifying that the seized object is an authentic match for ${artifact?.name}. This will update artifact status to 'verified' and notify ASI Repatriation Council.`
                : `Rejecting this match will revert artifact status back to 'stolen' for further law enforcement investigation.`}
            </p>

            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Expert Verification Justification Note *
            </label>
            <textarea
              rows={3}
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Detail visual, sculptural style, or micro-chisel mark comparisons..."
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-100 text-xs outline-none focus:border-amber-500"
            />
          </div>
        }
        confirmText={decisionType === 'approve' ? 'Confirm Verification' : 'Reject Candidate'}
        confirmStyle={decisionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
        isLoading={submitting}
      />
    </div>
  );
};

export default ReviewMatch;
