import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  FilePlus, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ShieldAlert, 
  Calendar, 
  MapPin, 
  User, 
  Mail, 
  Building2, 
  Layers, 
  Landmark,
  ArrowRight
} from 'lucide-react';

export default function CaseRegistrationModal({ isOpen, onClose, initialData, onSuccess }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    artifactName: '',
    caseType: 'Missing',
    description: '',
    reporterName: '',
    contactInformation: '',
    location: '',
    reportDate: new Date().toISOString().split('T')[0],
    templeName: '',
    monumentName: '',
    district: '',
    state: '',
    country: 'India',
    historicalPeriod: '',
    dynasty: '',
    approximateDate: '',
    material: '',
    originalLocation: '',
    currentSuspectedLocation: '',
    evidenceImage: '',
    aiMatchImage: '',
    aiSimilarity: null,
    aiModel: 'DINOv2 + 256-D Projection Head',
    metadataSource: '',
    metadataConfidence: '',
    verificationStatus: '',
    note: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessResult(null);

      const defaultReporter = user ? user.name : '';
      const defaultContact = user ? `${user.email}${user.organization ? ' (' + user.organization + ')' : ''}` : '';

      if (initialData) {
        const meta = initialData.metadata || initialData;
        const item = initialData.matchItem || initialData;

        setFormData({
          artifactName: meta.artifact_name || meta.name || '',
          caseType: 'Missing',
          description: meta.description || meta.historical_background || '',
          reporterName: defaultReporter,
          contactInformation: defaultContact,
          location: [meta.location, meta.district, meta.state, meta.country].filter(Boolean).join(', ') || '',
          reportDate: new Date().toISOString().split('T')[0],
          templeName: meta.temple_name || meta.monument_name || '',
          monumentName: meta.monument_name || '',
          district: meta.district || '',
          state: meta.state || '',
          country: meta.country || 'India',
          historicalPeriod: meta.historical_period || '',
          dynasty: meta.dynasty || '',
          approximateDate: meta.approximate_date || '',
          material: meta.material || '',
          originalLocation: [meta.location, meta.district, meta.state].filter(Boolean).join(', ') || '',
          currentSuspectedLocation: '',
          evidenceImage: item.image_url || meta.image_url || '',
          aiMatchImage: item.image_url || '',
          aiSimilarity: item.similarity ? (item.similarity * 100).toFixed(1) : null,
          aiModel: 'DINOv2 + 256-D Projection Head',
          metadataSource: meta.metadata_source || 'AI Reference Index',
          metadataConfidence: meta.metadata_confidence || 'Medium',
          verificationStatus: meta.verification_status || 'candidate',
          note: ''
        });
      } else {
        setFormData({
          artifactName: '',
          caseType: 'Missing',
          description: '',
          reporterName: defaultReporter,
          contactInformation: defaultContact,
          location: '',
          reportDate: new Date().toISOString().split('T')[0],
          templeName: '',
          monumentName: '',
          district: '',
          state: '',
          country: 'India',
          historicalPeriod: '',
          dynasty: '',
          approximateDate: '',
          material: '',
          originalLocation: '',
          currentSuspectedLocation: '',
          evidenceImage: '',
          aiMatchImage: '',
          aiSimilarity: null,
          aiModel: '',
          metadataSource: '',
          metadataConfidence: '',
          verificationStatus: '',
          note: ''
        });
      }
    }
  }, [isOpen, initialData, user]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/cases', formData);
      if (response.data && response.data.caseId) {
        setSuccessResult(response.data);
        if (onSuccess) onSuccess(response.data);
      } else {
        setError('Case registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Case registration error:', err);
      const msg = err.response?.data?.message || 'Failed to submit recovery case. Please check required fields.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToRegistry = () => {
    onClose();
    navigate('/search');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-stone-900 dark:text-stone-100">
                Register Recovery Case
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Official registration for missing, stolen, or illicitly trafficked heritage artifacts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* SUCCESS SCREEN */}
          {successResult ? (
            <div className="py-8 px-4 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  Recovery case registered successfully.
                </h3>
                <p className="text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                  Your case file has been saved to the permanent database and is now live on the Global Registry.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 inline-block font-mono">
                <span className="text-stone-500 dark:text-stone-400 text-xs block font-sans">Official Case Identifier:</span>
                <span className="text-2xl font-black text-amber-700 dark:text-amber-400 tracking-wider">
                  Case ID: {successResult.caseId}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
                <button
                  onClick={handleGoToRegistry}
                  className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                >
                  View Global Registry <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold text-xs transition cursor-pointer w-full sm:w-auto justify-center"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Prefill Alert */}
              {initialData && (
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-xs">Prefilled from AI Search Match</span>
                    <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5 leading-relaxed">
                      AI visual similarity result metadata has been automatically prefilled below. Please review, edit, or complete all required information prior to official registration.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Section 1: Required Case Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5 border-b border-stone-100 dark:border-stone-800 pb-2">
                  <ShieldAlert className="w-4 h-4" /> Required Case Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Artifact Name */}
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 dark:text-stone-300">
                      Artifact Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="artifactName"
                      value={formData.artifactName}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Chola Bronze Nataraja Sculpture"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:border-amber-500 outline-none transition"
                    />
                  </div>

                  {/* Case Type */}
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 dark:text-stone-300">
                      Case Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="caseType"
                      value={formData.caseType}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:border-amber-500 outline-none transition cursor-pointer"
                    >
                      <option value="Missing">Missing</option>
                      <option value="Stolen">Stolen</option>
                      <option value="Illicitly removed">Illicitly removed</option>
                      <option value="Recovered">Recovered</option>
                      <option value="Suspected trafficking">Suspected trafficking</option>
                      <option value="Repatriation">Repatriation</option>
                    </select>
                  </div>

                  {/* Reporter Name */}
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 dark:text-stone-300">
                      Reporter / Organization Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="reporterName"
                      value={formData.reporterName}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Thanjavur Heritage Trust / Inspector R. Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:border-amber-500 outline-none transition"
                    />
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 dark:text-stone-300">
                      Contact Information <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="contactInformation"
                      value={formData.contactInformation}
                      onChange={handleChange}
                      required
                      placeholder="Official Email or Contact Phone Number"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:border-amber-500 outline-none transition"
                    />
                  </div>

                  {/* Last Known Location */}
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 dark:text-stone-300">
                      Last Known Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Kapaleeshwarar Shrine, Thanjavur, Tamil Nadu"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:border-amber-500 outline-none transition"
                    />
                  </div>

                  {/* Date Reported */}
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 dark:text-stone-300">
                      Date Reported <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="reportDate"
                      value={formData.reportDate}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:border-amber-500 outline-none transition"
                    />
                  </div>

                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">
                    Case Description & Circumstances <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    placeholder="Provide a full account of the missing/stolen artifact, physical description, inscription marks, FIR details, etc."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:border-amber-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Section 2: Heritage Metadata (Optional / Prefilled) */}
              <div className="space-y-4 pt-2 border-t border-stone-100 dark:border-stone-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5 border-b border-stone-100 dark:border-stone-800 pb-2">
                  <Landmark className="w-4 h-4" /> Heritage Specifications (Optional / AI Prefilled)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-600 dark:text-stone-400">Temple / Monument Name</label>
                    <input
                      type="text"
                      name="templeName"
                      value={formData.templeName}
                      onChange={handleChange}
                      placeholder="e.g., Airavatesvara Temple"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-600 dark:text-stone-400">Historical Period</label>
                    <input
                      type="text"
                      name="historicalPeriod"
                      value={formData.historicalPeriod}
                      onChange={handleChange}
                      placeholder="e.g., 10th Century CE"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-600 dark:text-stone-400">Dynasty</label>
                    <input
                      type="text"
                      name="dynasty"
                      value={formData.dynasty}
                      onChange={handleChange}
                      placeholder="e.g., Chola Dynasty"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-600 dark:text-stone-400">Approximate Date</label>
                    <input
                      type="text"
                      name="approximateDate"
                      value={formData.approximateDate}
                      onChange={handleChange}
                      placeholder="e.g., c. 985 CE"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-600 dark:text-stone-400">Material</label>
                    <input
                      type="text"
                      name="material"
                      value={formData.material}
                      onChange={handleChange}
                      placeholder="e.g., Panchaloka Bronze"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-600 dark:text-stone-400">District / State</label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      placeholder="e.g., Thanjavur, Tamil Nadu"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Images & AI Linkage */}
              <div className="space-y-4 pt-2 border-t border-stone-100 dark:border-stone-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5 border-b border-stone-100 dark:border-stone-800 pb-2">
                  <Layers className="w-4 h-4" /> Evidence & Reference Image Linkage
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-600 dark:text-stone-400">Evidence / Reference Image URL</label>
                    <input
                      type="text"
                      name="evidenceImage"
                      value={formData.evidenceImage}
                      onChange={handleChange}
                      placeholder="Image URL or local reference path"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  {formData.aiMatchImage && (
                    <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center gap-3">
                      <img
                        src={formData.aiMatchImage}
                        alt="AI Match preview"
                        className="w-12 h-12 object-contain rounded-lg bg-stone-900 border"
                      />
                      <div className="text-[11px]">
                        <span className="font-bold block text-stone-900 dark:text-stone-100">Linked AI Visual Match</span>
                        <span className="text-amber-600 font-mono font-bold">
                          Similarity: {formData.aiSimilarity}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold shadow-sm cursor-pointer transition flex items-center gap-2"
                >
                  {loading ? 'Saving Case Record...' : 'Submit Recovery Case'}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
