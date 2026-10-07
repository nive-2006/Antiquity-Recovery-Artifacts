import React from 'react';
import { X, Calendar, MapPin, Building2, User, Mail, ShieldCheck, Landmark, FileText, Layers } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function CaseDetailsModal({ isOpen, onClose, caseData }) {
  if (!isOpen || !caseData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-xs">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
              {caseData.caseId}
            </span>
            <StatusBadge status={caseData.status || 'Registered'} />
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Main Title & Image */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-5 space-y-2">
              <div className="h-48 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center p-2 overflow-hidden">
                {caseData.evidenceImage || caseData.aiMatchImage ? (
                  <img
                    src={caseData.evidenceImage || caseData.aiMatchImage}
                    alt={caseData.artifactName}
                    className="w-full h-full object-contain rounded-xl"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.parentNode.innerHTML = '<span class="text-stone-400 text-center p-4">Image unavailable</span>';
                    }}
                  />
                ) : (
                  <span className="text-stone-400 text-center p-4">Image unavailable</span>
                )}
              </div>
              {caseData.aiSimilarity && (
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center text-amber-700 dark:text-amber-400 font-mono font-bold text-[11px]">
                  Visual Similarity: {caseData.aiSimilarity}%
                </div>
              )}
            </div>

            <div className="md:col-span-7 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">
                  {caseData.caseType || 'Recovery Case'}
                </span>
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  {caseData.artifactName}
                </h3>
              </div>

              <div className="space-y-1.5 text-stone-600 dark:text-stone-400 border-t border-b border-stone-100 dark:border-stone-800/80 py-2">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <strong className="text-stone-800 dark:text-stone-200">Last Known Location:</strong> {caseData.location}
                </p>
                <p className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <strong className="text-stone-800 dark:text-stone-200">Date Reported:</strong> {new Date(caseData.reportDate || caseData.createdAt).toLocaleDateString()}
                </p>
                <p className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <strong className="text-stone-800 dark:text-stone-200">Reporter:</strong> {caseData.reporterName}
                </p>
              </div>

              {caseData.contactInformation && (
                <p className="text-stone-500 dark:text-stone-400 flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">Contact: {caseData.contactInformation}</span>
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1">
            <h4 className="font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider text-[10px]">
              Case Description & History
            </h4>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              {caseData.description}
            </p>
          </div>

          {/* Heritage Specifications Grid */}
          {(caseData.templeName || caseData.historicalPeriod || caseData.material || caseData.dynasty) && (
            <div className="space-y-2">
              <h4 className="font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-amber-800 dark:text-amber-400">
                <Landmark className="w-3.5 h-3.5" /> Heritage Specifications
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                {caseData.templeName && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                    <span className="text-stone-400 block text-[9px] uppercase font-semibold">Temple</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">{caseData.templeName}</span>
                  </div>
                )}
                {caseData.historicalPeriod && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                    <span className="text-stone-400 block text-[9px] uppercase font-semibold">Period</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">{caseData.historicalPeriod}</span>
                  </div>
                )}
                {caseData.dynasty && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                    <span className="text-stone-400 block text-[9px] uppercase font-semibold">Dynasty</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">{caseData.dynasty}</span>
                  </div>
                )}
                {caseData.material && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                    <span className="text-stone-400 block text-[9px] uppercase font-semibold">Material</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">{caseData.material}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold cursor-pointer transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
