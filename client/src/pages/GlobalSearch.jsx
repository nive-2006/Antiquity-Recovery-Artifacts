import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ArtifactCard from '../components/ArtifactCard';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import { Search, Filter, RefreshCw } from 'lucide-react';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [materialFilter, setMaterialFilter] = useState('');
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchArtifacts = async (searchTerm = query) => {
    setLoading(true);
    try {
      const res = await api.get(`/artifacts/search?q=${encodeURIComponent(searchTerm)}`);
      setArtifacts(res.data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtifacts('');
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchArtifacts(query);
  };

  const filteredArtifacts = artifacts.filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (materialFilter && !item.material.toLowerCase().includes(materialFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold font-display text-slate-900">National Antiquities Search Engine</h1>
        <p className="text-xs text-slate-500">Search digital identities, stolen alerts, and recovery status across India</p>
      </div>

      {/* Search Bar & Filters */}
      <form onSubmit={handleSearchSubmit} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-blue-600 absolute left-3.5 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Artifact Name, Registration ID (NXD-...), Material, Inscription or Region..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-blue-600 text-slate-900 text-xs transition outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition shrink-0 cursor-pointer"
          >
            Search Registry
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs pt-2 border-t border-slate-100">
          <span className="text-slate-500 font-semibold flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-600" /> Filter Results:
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="registered">Registered</option>
            <option value="stolen">Stolen (Alert)</option>
            <option value="recovered">Recovered</option>
            <option value="match_pending">Match Pending</option>
            <option value="verified">Verified Match</option>
            <option value="repatriating">Repatriating</option>
            <option value="returned">Returned</option>
          </select>

          <select
            value={materialFilter}
            onChange={(e) => setMaterialFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 outline-none cursor-pointer"
          >
            <option value="">All Materials</option>
            <option value="bronze">Bronze</option>
            <option value="stone">Stone / Schist</option>
            <option value="gold">Gold Coin</option>
            <option value="terracotta">Terracotta</option>
            <option value="granite">Granite</option>
          </select>

          {(statusFilter || materialFilter || query) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('');
                setMaterialFilter('');
                setQuery('');
                fetchArtifacts('');
              }}
              className="text-blue-600 hover:underline flex items-center gap-1 ml-auto font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Clear Filters
            </button>
          )}
        </div>
      </form>

      {/* Results grid */}
      {loading ? (
        <Loading message="Executing search query..." />
      ) : filteredArtifacts.length === 0 ? (
        <EmptyState
          title="No Artifact Matches Found"
          description="No antiquities matching your search criteria were found in the digital registry."
        />
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-500">
              Showing <span className="text-slate-900 font-bold">{filteredArtifacts.length}</span> registered antiquities
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredArtifacts.map((artifact) => (
              <ArtifactCard key={artifact._id} artifact={artifact} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
