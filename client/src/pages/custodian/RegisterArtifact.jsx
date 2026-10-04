import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Upload, Trash2, ShieldCheck, ChevronDown } from 'lucide-react';

export const MATERIALS = {
  "Metals": ["Gold","Silver","Bronze","Copper","Iron","Brass","Lead","Tin","Zinc","Panchaloha / Panchaloka","Ashtadhatu","Mixed Metal / Alloy","Other Metal"],
  "Stone": ["Granite","Marble","Sandstone","Limestone","Soapstone","Schist","Basalt","Other Stone"],
  "Wood": ["Teak","Sandalwood","Rosewood","Other Wood"],
  "Terracotta & Ceramic": ["Terracotta","Ceramic","Porcelain","Pottery","Other Ceramic"],
  "Precious / Semi-precious Materials": ["Ivory","Bone","Coral","Pearl","Gemstone","Crystal"],
  "Organic / Other": ["Shell","Textile","Leather","Paper / Manuscript","Composite Material","Unknown","Other"]
};

const RegisterArtifact = () => {
  const [formData, setFormData] = useState({
    name: '',
    era: '',
    region: '',
    dimensions: '',
    inscriptionText: '',
    provenanceNote: 'Registered in NexData National Antiquities Registry'
  });

  // Cascading Material Selector State
  const [materialCategory, setMaterialCategory] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [materialOther, setMaterialOther] = useState('');
  const [errors, setErrors] = useState({});

  const [files, setFiles] = useState([]);
  const [angles, setAngles] = useState([]);
  const [loading, setLoading] = useState(false);

  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setMaterialCategory(category);
    setMaterialType('');
    setMaterialOther('');
    setErrors((prev) => ({ ...prev, category: '', type: '', other: '' }));
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setMaterialType(type);
    setMaterialOther('');
    setErrors((prev) => ({ ...prev, type: '', other: '' }));
  };

  const validateMaterial = () => {
    const newErrors = {};
    if (!materialCategory) {
      newErrors.category = 'Please select a category';
    }
    if (!materialType) {
      newErrors.type = 'Please select a material';
    }
    if (materialType && materialType.startsWith('Other') && !materialOther.trim()) {
      newErrors.other = 'Please specify material details';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
    setAngles((prev) => [
      ...prev,
      ...selectedFiles.map((_, idx) => (prev.length + idx === 0 ? 'front' : prev.length + idx === 1 ? 'back' : 'detail'))
    ]);
  };

  const handleAngleChange = (index, value) => {
    const updated = [...angles];
    updated[index] = value;
    setAngles(updated);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    setAngles(angles.filter((_, i) => i !== index));
  };

  const getCombinedMaterialString = () => {
    if (!materialCategory || !materialType) return '';
    if (materialType.startsWith('Other') && materialOther) {
      return `${materialCategory} - ${materialType} (${materialOther})`;
    }
    return `${materialCategory} - ${materialType}`;
  };

  const getMaterialPayload = () => {
    const payload = {
      materialCategory,
      materialType
    };
    if (materialType && materialType.startsWith('Other') && materialOther) {
      payload.materialOther = materialOther;
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateMaterial()) {
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      const materialPayload = getMaterialPayload();
      const combinedMaterial = getCombinedMaterialString();

      data.append('name', formData.name);
      data.append('material', combinedMaterial);
      data.append('materialCategory', materialCategory);
      data.append('materialType', materialType);
      if (materialPayload.materialOther) {
        data.append('materialOther', materialPayload.materialOther);
      }
      data.append('materialData', JSON.stringify(materialPayload));

      data.append('era', formData.era);
      data.append('region', formData.region);
      data.append('dimensions', formData.dimensions);
      data.append('inscriptionText', formData.inscriptionText);

      const prov = [{
        event: 'Initial Digital Passport Registration',
        date: new Date().toISOString().slice(0, 10),
        location: formData.region,
        note: formData.provenanceNote
      }];
      data.append('provenance', JSON.stringify(prov));

      files.forEach((file, index) => {
        data.append('images', file);
        data.append('angles', angles[index] || 'front');
      });

      const res = await api.post('/artifacts', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      addToast(`Artifact ${res.data.artifactId} registered successfully!`, 'success');
      navigate(`/artifacts/${res.data._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to register artifact.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showOtherInput = materialType && materialType.startsWith('Other');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold font-display text-slate-900">Register Antiquity Identity</h1>
        <p className="text-xs text-slate-500">Generate tamper-evident digital passport for temple or museum artifact</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
        
        {/* Top Row: Artifact Name & Cascading Material Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="artifact-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Artifact Name / Deity Title *
            </label>
            <input
              id="artifact-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Chola Somaskanda Bronze Idol"
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-blue-600 text-slate-900 text-xs transition outline-none"
            />
          </div>

          {/* Cascading Material Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Material Composition *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Field A: Category Dropdown */}
              <div>
                <label htmlFor="material-category" className="sr-only">Material Category</label>
                <div className="relative">
                  <select
                    id="material-category"
                    aria-label="Material Category *"
                    required
                    value={materialCategory}
                    onChange={handleCategoryChange}
                    className={`w-full px-4 py-2.5 pr-9 rounded-xl bg-white border ${
                      errors.category ? 'border-red-500' : 'border-slate-200'
                    } focus:border-blue-600 text-slate-900 text-xs appearance-none transition outline-none cursor-pointer`}
                  >
                    <option value="" disabled className="bg-white text-slate-400">
                      Select category
                    </option>
                    {Object.keys(MATERIALS).map((cat) => (
                      <option key={cat} value={cat} className="bg-white text-slate-900">
                        {cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.category && <p className="text-[11px] text-red-500 mt-1">{errors.category}</p>}
              </div>

              {/* Field B: Specific Material Dropdown */}
              <div>
                <label htmlFor="specific-material" className="sr-only">Specific Material</label>
                <div className="relative">
                  <select
                    id="specific-material"
                    aria-label="Specific Material *"
                    required
                    disabled={!materialCategory}
                    value={materialType}
                    onChange={handleTypeChange}
                    className={`w-full px-4 py-2.5 pr-9 rounded-xl bg-white border ${
                      errors.type ? 'border-red-500' : 'border-slate-200'
                    } focus:border-blue-600 text-slate-900 text-xs appearance-none transition outline-none ${
                      !materialCategory ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <option value="" disabled className="bg-white text-slate-400">
                      {materialCategory ? 'Select material' : 'Select category first'}
                    </option>
                    {materialCategory && MATERIALS[materialCategory]?.map((mat) => (
                      <option key={mat} value={mat} className="bg-white text-slate-900">
                        {mat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.type && <p className="text-[11px] text-red-500 mt-1">{errors.type}</p>}
              </div>
            </div>

            {/* Extra Text Input if "Other..." material selected */}
            {showOtherInput && (
              <div className="mt-2.5">
                <label htmlFor="material-other" className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Specify material *
                </label>
                <input
                  id="material-other"
                  type="text"
                  required
                  value={materialOther}
                  onChange={(e) => {
                    setMaterialOther(e.target.value);
                    if (e.target.value.trim()) setErrors((prev) => ({ ...prev, other: '' }));
                  }}
                  placeholder="Specify material details..."
                  className={`w-full px-4 py-2 rounded-xl bg-white border ${
                    errors.other ? 'border-red-500' : 'border-slate-200'
                  } focus:border-blue-600 text-slate-900 text-xs transition outline-none`}
                />
                {errors.other && <p className="text-[11px] text-red-500 mt-1">{errors.other}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Second Row: Era, Region, Dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="artifact-era" className="block text-xs font-semibold text-slate-700 mb-1">
              Historical Era / Period *
            </label>
            <input
              id="artifact-era"
              type="text"
              required
              value={formData.era}
              onChange={(e) => setFormData({ ...formData, era: e.target.value })}
              placeholder="e.g. 10th Century CE (Chola Dynasty)"
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-blue-600 text-slate-900 text-xs transition outline-none"
            />
          </div>

          <div>
            <label htmlFor="artifact-region" className="block text-xs font-semibold text-slate-700 mb-1">
              Region / Origin Site *
            </label>
            <input
              id="artifact-region"
              type="text"
              required
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              placeholder="e.g. Thanjavur, Tamil Nadu"
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-blue-600 text-slate-900 text-xs transition outline-none"
            />
          </div>

          <div>
            <label htmlFor="artifact-dimensions" className="block text-xs font-semibold text-slate-700 mb-1">
              Physical Dimensions
            </label>
            <input
              id="artifact-dimensions"
              type="text"
              value={formData.dimensions}
              onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
              placeholder="e.g. 95 cm x 45 cm x 25 cm, 18.5 kg"
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-blue-600 text-slate-900 text-xs transition outline-none"
            />
          </div>
        </div>

        {/* Third Row: Inscription */}
        <div>
          <label htmlFor="artifact-inscription" className="block text-xs font-semibold text-slate-700 mb-1">
            Inscription / Epigraphy Details
          </label>
          <textarea
            id="artifact-inscription"
            rows={2}
            value={formData.inscriptionText}
            onChange={(e) => setFormData({ ...formData, inscriptionText: e.target.value })}
            placeholder="Transcribe any Grantha, Brahmi, Tamil or Sanskrit epigraphical markings engraved on pedestal base..."
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-blue-600 text-slate-900 text-xs transition outline-none"
          />
        </div>

        {/* Multi-angle Image Uploader */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700">
            Multi-Angle High Resolution Images (Front, Back, Inscription, Detail)
          </label>

          <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 transition">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer space-y-2 block">
              <Upload className="w-8 h-8 text-blue-500 mx-auto" />
              <p className="text-xs font-semibold text-slate-800">Click to upload image files</p>
              <p className="text-[11px] text-slate-500">PNG, JPG or WEBP up to 10MB each</p>
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-slate-500">Selected Upload Queue ({files.length}):</p>
              <div className="space-y-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-mono text-slate-900 truncate max-w-xs">{file.name}</span>
                    <div className="flex items-center gap-3">
                      <select
                        value={angles[idx] || 'front'}
                        onChange={(e) => handleAngleChange(idx, e.target.value)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-blue-700 text-xs outline-none cursor-pointer"
                      >
                        <option value="front">Front View</option>
                        <option value="back">Back View</option>
                        <option value="side">Side View</option>
                        <option value="inscription">Inscription Detail</option>
                        <option value="pedestal">Pedestal Base</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Initial Provenance Ledger Note */}
        <div>
          <label htmlFor="provenance-note" className="block text-xs font-semibold text-slate-700 mb-1">
            Initial Provenance Ledger Note
          </label>
          <input
            id="provenance-note"
            type="text"
            value={formData.provenanceNote}
            onChange={(e) => setFormData({ ...formData, provenanceNote: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-blue-600 text-slate-900 text-xs transition outline-none"
          />
        </div>

        {/* Tamper-Evident Passport Hash Input Preview */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-slate-900">
                Tamper-Evident Passport Hash Input Data
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">HASH INPUT MATRIX</span>
          </div>
          <div className="text-[11px] font-mono text-slate-600 break-all bg-white p-3 rounded-xl border border-slate-200">
            {JSON.stringify({
              name: formData.name || '<Artifact Name>',
              material: getMaterialPayload(),
              era: formData.era || '<Historical Era>',
              region: formData.region || '<Region>'
            }, null, 2)}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Creating Digital Passport...' : 'Issue Digital Identity Passport'} <ShieldCheck className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default RegisterArtifact;
