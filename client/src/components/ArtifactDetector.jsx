import React, { useState } from 'react';
import api from '../services/api';
import { 
  Scan, 
  UploadCloud, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  Layers,
  Database
} from 'lucide-react';

export default function ArtifactDetector() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [heritageResults, setHeritageResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      // Calls ONLY the real FastAPI endpoint
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
                Visual similarity search across 20,399 real local heritage images using DINOv2-base + best_projection_head.pt
              </p>
            </div>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-600" />
            <span className="font-mono text-[11px] font-semibold">Real Database: 20,399 Heritage Images</span>
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
                    Searching Heritage Database...
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

        {/* Right Column: AI Heritage Matches (Top 10 Database Results) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  AI Heritage Matches
                </h3>
                <p className="text-xs text-slate-500">
                  Top matches retrieved strictly from local heritage image database
                </p>
              </div>

              {heritageResults && (
                <div className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-bold">
                  Matches: {heritageResults.results?.length || 0} / 20,399
                </div>
              )}
            </div>

            {/* Results Grid */}
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-600" />
                <p className="text-xs font-semibold text-slate-700">Running DINOv2 + Trained Projection Head (256-D FAISS Search)...</p>
              </div>
            ) : heritageResults && heritageResults.results?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {heritageResults.results.map((item) => (
                  <div
                    key={item.rank}
                    className="bg-slate-50 border border-slate-200 hover:border-amber-400 rounded-2xl p-3.5 space-y-3 transition shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-600 text-white font-mono font-extrabold text-xs">
                        Rank {item.rank}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        FAISS #{item.faiss_index}
                      </span>
                    </div>

                    <div className="h-48 rounded-xl bg-slate-900 overflow-hidden relative border border-slate-800 flex items-center justify-center p-1">
                      <img
                        src={item.image_url}
                        alt={item.image_name}
                        className="w-full h-full object-contain rounded-lg"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.parentNode.innerHTML = '<span class="text-xs text-slate-400 p-4 text-center">No registered artifact image available</span>';
                        }}
                      />
                    </div>

                    <div className="space-y-1 pt-1">
                      <p className="text-xs font-bold text-slate-900 truncate" title={item.image_name}>
                        Filename: {item.image_name}
                      </p>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                        <span className="text-slate-500 font-medium">Cosine similarity:</span>
                        <span className="font-mono font-extrabold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200">
                          {typeof item.similarity === 'number' ? item.similarity.toFixed(6) : item.similarity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : heritageResults && heritageResults.results?.length === 0 ? (
              <div className="py-16 text-center p-6 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-xs">
                No sufficiently similar heritage match found.
              </div>
            ) : (
              <div className="py-20 text-center p-8 text-slate-400 text-xs">
                Upload an image and click "Run AI Heritage Search" to retrieve database matches.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
