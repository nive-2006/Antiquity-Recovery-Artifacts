import React, { useState } from 'react';
import { Columns, Eye } from 'lucide-react';

const ImageCompare = ({ imageA, labelA = 'Recovered Object', imageB, labelB = 'Registered Artifact' }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [viewMode, setViewMode] = useState('side'); // 'side' | 'slider'

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-4 shadow-xs">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-600" /> Visual Verification Workspace
        </h4>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('side')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              viewMode === 'side' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Side-by-Side
          </button>
          <button
            onClick={() => setViewMode('slider')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              viewMode === 'slider' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overlay Split
          </button>
        </div>
      </div>

      {viewMode === 'side' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative group rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-2xs z-10">
              {labelA}
            </span>
            <img
              src={imageA}
              alt={labelA}
              className="w-full h-72 object-cover transition transform group-hover:scale-105"
            />
          </div>

          <div className="relative group rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            <span className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-2xs z-10">
              {labelB}
            </span>
            <img
              src={imageB}
              alt={labelB}
              className="w-full h-72 object-cover transition transform group-hover:scale-105"
            />
          </div>
        </div>
      ) : (
        <div className="relative w-full h-80 rounded-xl overflow-hidden border border-slate-200 select-none bg-slate-100">
          <img
            src={imageB}
            alt={labelB}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={imageA}
              alt={labelA}
              className="absolute inset-0 w-full h-full object-cover max-w-none"
              style={{ width: '100%' }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
          />
          <div
            className="absolute top-0 bottom-0 w-1 bg-blue-600 z-10 shadow-lg pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md">
              <Columns className="w-4 h-4" />
            </div>
          </div>
          <span className="absolute bottom-3 left-3 bg-slate-900/80 text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur-xs">
            {labelA} ({sliderPos}%)
          </span>
          <span className="absolute bottom-3 right-3 bg-slate-900/80 text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur-xs">
            {labelB} ({100 - sliderPos}%)
          </span>
        </div>
      )}
    </div>
  );
};

export default ImageCompare;
