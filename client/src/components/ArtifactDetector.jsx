import React, { useState } from 'react';
import api from '../services/api';
import CaseRegistrationModal from './CaseRegistrationModal';
import { 
  Scan, 
  UploadCloud, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  Database,
  ExternalLink,
  Info,
  CheckCircle2,
  HelpCircle,
  Landmark,
  FilePlus,
  ArrowRight
} from 'lucide-react';

export default function ArtifactDetector() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [heritageResults, setHeritageResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Case Registration Modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedMatchData, setSelectedMatchData] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Unsupported file type. Please select a valid JPEG, PNG, or WEBP image.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit. Please select a smaller file.');
        return;
      }
      setError(null);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setHeritageResults(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Unsupported file type. Please drop a valid JPEG, PNG, or WEBP image.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        return;
      }
      setError(null);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setHeritageResults(null);
    }
  };

  const runHeritageSearch = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setHeritageResults(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await api.post('/api/heritage/search?top_k=10', formData);

      if (response.data && response.data.results) {
        setHeritageResults(response.data);
        if (response.data.results.length === 0) {
          setError('No sufficiently similar heritage match found.');
        }
      } else {
        setError('Heritage AI search failed. Please try again.');
      }
    } catch (err) {
      console.error('Heritage AI search API error:', err);
      setError('Heritage AI search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setHeritageResults(null);
    setError(null);
  };

  const handleRegisterClick = (matchItem) => {
    setSelectedMatchData({
      matchItem,
      metadata: matchItem.metadata || {}
    });
    setIsRegisterModalOpen(true);
  };

  const getVerificationBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Record
          </span>
        );
      case 'partially_verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <ShieldCheck className="w-3 h-3 text-blue-600" /> Partially Verified
          </span>
        );
      case 'candidate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Info className="w-3 h-3 text-amber-600" /> Candidate Metadata
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <HelpCircle className="w-3 h-3 text-slate-500" /> Information unavailable
          </span>
        );
    }
  };

  const getConfidenceBadge = (conf) => {
    const level = (conf || '').toLowerCase();
    if (level === 'high') {
      return <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">High</span>;
    } else if (level === 'medium') {
      return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-extrabold text-[11px]">Medium</span>;
    } else if (level === 'low') {
      return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-extrabold text-[11px]">Low</span>;
    }
    return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">Information unavailable</span>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs">
              <Scan className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
                Digital Heritage AI Search Engine
                <span className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-extrabold">
                  Trained Model (DINOv2 + 256-D Projection)
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Visual similarity search across 20,399 Indian heritage images • AI Search results are NOT automatically registered cases
              </p>
            </div>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-600" />
            <span className="font-mono text-[11px] font-semibold">Reference DB: 20,399 Images</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Upload Box & Uploaded Artifact Display */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-amber-600" />
              Upload Artifact Image
            </h3>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="relative border-2 border-dashed border-slate-200 hover:border-amber-500 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 bg-slate-50"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <UploadCloud className="w-10 h-10 mx-auto text-amber-600 mb-2" />
              <p className="text-xs font-semibold text-slate-800">
                {selectedFile ? selectedFile.name : 'Click or drag image here'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Supports JPG, PNG, WEBP (Max 10MB)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={runHeritageSearch}
                disabled={!selectedFile || loading}
                className="w-full py-3 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Searching & Enriching Metadata...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Run AI Heritage Search
                  </>
                )}
              </button>

              {selectedFile && (
                <button
                  onClick={resetAll}
                  className="w-full py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold">{error}</span>
              </div>
            )}
          </div>

          {/* Uploaded Artifact Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <ImageIcon className="w-4 h-4 text-amber-600" />
              Uploaded Artifact
            </h3>
            
            {previewUrl ? (
              <div className="space-y-2">
                <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center p-2 min-h-[220px]">
                  <img
                    src={previewUrl}
                    alt="Uploaded artifact"
                    className="max-h-64 w-auto object-contain rounded-lg"
                  />
                </div>
                <p className="text-xs font-mono text-slate-600 text-center truncate">
                  Filename: {selectedFile?.name}
                </p>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No image uploaded yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Visual Matches + Enriched Metadata */}
        <div className="lg:col-span-8 space-y-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  Visual Matches (AI Search Result)
                </h3>
                <p className="text-xs text-slate-500">
                  Top-K visual reference matches retrieved from the 20,399 heritage database. Visual matches remain search results only.
                </p>
              </div>

              {heritageResults && (
                <div className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-bold">
                  Matches: {heritageResults.results?.length || 0} / 20,399
                </div>
              )}
            </div>

            {/* Results Display */}
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-600" />
                <p className="text-xs font-semibold text-slate-700">Retrieving visual matches & loading metadata...</p>
              </div>
            ) : heritageResults && heritageResults.results?.length > 0 ? (
              <div className="space-y-6">
                
                {/* Result cards loop */}
                {heritageResults.results.map((item, index) => {
                  const meta = item.metadata || {};
                  const simPct = (item.similarity * 100).toFixed(1);

                  return (
                    <div
                      key={item.rank || index}
                      className="bg-slate-50 border border-slate-200 hover:border-amber-400 rounded-2xl p-5 space-y-4 transition shadow-2xs"
                    >
                      {/* Top Header Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-xl bg-amber-700 text-white font-mono font-bold text-xs">
                            Rank #{item.rank}
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            FAISS Index #{item.faiss_index}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {getVerificationBadge(meta.verification_status)}
                          
                          {/* VISUAL MATCH SIMILARITY DISPLAY */}
                          <div className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-mono font-extrabold flex items-center gap-1.5">
                            <span>Cosine Similarity:</span>
                            <span className="text-amber-800 font-extrabold">{simPct}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                        
                        {/* Image Preview Box & Register Action */}
                        <div className="md:col-span-4 space-y-3">
                          <div className="h-52 rounded-xl bg-slate-900 overflow-hidden relative border border-slate-800 flex items-center justify-center p-1">
                            <img
                              src={item.image_url}
                              alt={item.image_name}
                              className="w-full h-full object-contain rounded-lg"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.parentNode.innerHTML = '<span class="text-xs text-slate-400 p-4 text-center">Image unavailable</span>';
                              }}
                            />
                          </div>
                          <p className="text-[11px] font-mono text-slate-600 truncate" title={item.image_name}>
                            File: {item.image_name}
                          </p>

                          {/* PROMINENT REGISTER RECOVERY CASE BUTTON */}
                          <button
                            onClick={() => handleRegisterClick(item)}
                            className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <FilePlus className="w-4 h-4" />
                            Register Recovery Case
                          </button>
                        </div>

                        {/* Metadata Details Column */}
                        <div className="md:col-span-8 space-y-4">
                          
                          {/* HERITAGE IDENTIFICATION */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-amber-800">
                              <Landmark className="w-3.5 h-3.5" />
                              Heritage Metadata
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                                <span className="text-slate-500 font-medium block">Artifact Name:</span>
                                <span className="font-semibold text-slate-900">{meta.artifact_name || 'Information unavailable'}</span>
                              </div>

                              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                                <span className="text-slate-500 font-medium block">Temple / Monument:</span>
                                <span className="font-semibold text-slate-900">{meta.temple_name || meta.monument_name || 'Information unavailable'}</span>
                              </div>

                              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                                <span className="text-slate-500 font-medium block">Location:</span>
                                <span className="font-semibold text-slate-900">
                                  {[meta.location, meta.district, meta.state, meta.country].filter(Boolean).join(', ') || 'Information unavailable'}
                                </span>
                              </div>

                              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                                <span className="text-slate-500 font-medium block">Historical Period / Date:</span>
                                <span className="font-semibold text-slate-900">{meta.historical_period || meta.approximate_date || 'Information unavailable'}</span>
                              </div>

                              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                                <span className="text-slate-500 font-medium block">Dynasty:</span>
                                <span className="font-semibold text-slate-900">{meta.dynasty || 'Information unavailable'}</span>
                              </div>

                              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                                <span className="text-slate-500 font-medium block">Material / Type:</span>
                                <span className="font-semibold text-slate-900">
                                  {[meta.material, meta.artifact_type].filter(Boolean).join(' • ') || 'Information unavailable'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Description & History */}
                          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5 text-xs">
                            <p className="text-slate-700 leading-relaxed">
                              <strong className="text-slate-900">Description:</strong> {meta.description || 'Information unavailable'}
                            </p>
                            {meta.historical_background && (
                              <p className="text-slate-700 leading-relaxed">
                                <strong className="text-slate-900">Historical Background:</strong> {meta.historical_background}
                              </p>
                            )}
                          </div>

                          {/* METADATA VERIFICATION */}
                          <div className="pt-2 border-t border-slate-200 space-y-1.5">
                            <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                              Metadata Source & Verification Status
                            </h4>

                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs p-2.5 rounded-xl bg-white border border-slate-200">
                              <div>
                                <span className="text-slate-500">Source: </span>
                                <span className="font-bold text-slate-900">{meta.metadata_source || 'Information unavailable'}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-slate-500">Confidence:</span>
                                {getConfidenceBadge(meta.metadata_confidence)}
                              </div>
                            </div>
                          </div>

                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            ) : heritageResults && heritageResults.results?.length === 0 ? (
              <div className="py-16 text-center p-6 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-xs">
                No sufficiently similar heritage match found.
              </div>
            ) : (
              <div className="py-20 text-center p-8 text-slate-400 text-xs">
                Upload an image and click "Run AI Heritage Search" to retrieve visual reference matches.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Case Registration Modal */}
      <CaseRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        initialData={selectedMatchData}
      />
    </div>
  );
}

