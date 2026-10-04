import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Upload, Scan, MapPin, Calendar } from 'lucide-react';

const ReportRecovered = () => {
  const [location, setLocation] = useState('');
  const [foundDate, setFoundDate] = useState(new Date().toISOString().slice(0, 10));
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      addToast('Please upload at least one image of the recovered artifact.', 'error');
      return;
    }
    setLoading(true);

    try {
      const data = new FormData();
      data.append('location', location);
      data.append('foundDate', foundDate);
      files.forEach((file) => data.append('images', file));

      const res = await api.post('/recovered', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      addToast('AI Image Scanning Complete! Review top candidate matches.', 'success');
      navigate(`/authority/match-results?id=${res.data.recoveredObject._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to process recovery AI scan.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-[#E8E2D9] dark:border-white/10 pb-4">
        <h1 className="text-2xl font-bold font-display text-[#1C1917] dark:text-[#F5F0EB] flex items-center gap-2">
          <Scan className="w-6 h-6 text-[#8D2B1D] dark:text-[#D4AF37]" /> Report Seized Antiquity & AI Match Query
        </h1>
        <p className="text-xs text-[#78716C] dark:text-[#A89F95]">Upload photos of intercepted/recovered artifacts to query national registry</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1C1714] border border-[#E8E2D9] dark:border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] dark:text-[#F5F0EB] mb-1">Seizure / Recovery Location *</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#78716C] dark:text-[#A89F95] absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Customs Port Cargo Terminal, Chennai"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F3] dark:bg-[#14100E] border border-[#E8E2D9] dark:border-white/10 focus:border-[#C59B27] text-[#1C1917] dark:text-[#F5F0EB] text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] dark:text-[#F5F0EB] mb-1">Recovery Interception Date *</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#78716C] dark:text-[#A89F95] absolute left-3.5 top-3" />
              <input
                type="date"
                required
                value={foundDate}
                onChange={(e) => setFoundDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F3] dark:bg-[#14100E] border border-[#E8E2D9] dark:border-white/10 focus:border-[#C59B27] text-[#1C1917] dark:text-[#F5F0EB] text-xs outline-none"
              />
            </div>
          </div>
        </div>

        {/* Upload Box */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-semibold text-[#1C1917] dark:text-[#F5F0EB]">
            Recovered Object Photos (Front & Micro Details) *
          </label>
          <div className="border-2 border-dashed border-[#E8E2D9] dark:border-white/20 hover:border-[#C59B27] rounded-2xl p-6 text-center cursor-pointer bg-[#FAF7F3] dark:bg-[#14100E] transition">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="recovered-file"
            />
            <label htmlFor="recovered-file" className="cursor-pointer space-y-2 block">
              <Upload className="w-8 h-8 text-[#C59B27] mx-auto" />
              <p className="text-xs font-semibold text-[#1C1917] dark:text-[#F5F0EB]">Click to upload photos for AI Matching</p>
              <p className="text-[11px] text-[#78716C] dark:text-[#A89F95]">Photos will be analyzed by feature-extraction AI vector engine</p>
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#78716C] dark:text-[#A89F95]">Photos Attached ({files.length}):</p>
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F3] dark:bg-[#14100E] border border-[#E8E2D9] dark:border-white/10 text-xs">
                  <span className="font-mono text-[#1C1917] dark:text-[#F5F0EB] truncate">{file.name}</span>
                  <span className="text-[10px] text-[#8D2B1D] dark:text-[#D4AF37] font-bold">Ready for AI scan</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-[#8D2B1D] hover:bg-[#732216] text-white font-bold text-xs shadow-xl shadow-[#8D2B1D]/20 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? 'Running AI Feature Matching Engine...' : 'Run AI Match Query'} <Scan className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default ReportRecovered;
