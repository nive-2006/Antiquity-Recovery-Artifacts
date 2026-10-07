import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import StatusBadge from '../components/StatusBadge';
import CaseRegistrationModal from '../components/CaseRegistrationModal';
import CaseDetailsModal from '../components/CaseDetailsModal';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  FilePlus, 
  Scan, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  User, 
  ChevronRight,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [caseTypeFilter, setCaseTypeFilter] = useState('');

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedCaseForDetails, setSelectedCaseForDetails] = useState(null);

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load data ONLY from GET /api/cases
      const response = await api.get('/api/cases');
      if (Array.isArray(response.data)) {
        setCases(response.data);
      } else {
        setCases([]);
      }
    } catch (err) {
      console.error('Error fetching global registry cases:', err);
      setError('Unable to load registered cases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const filteredCases = cases.filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (caseTypeFilter && item.caseType !== caseTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (item.artifactName || '').toLowerCase().includes(q);
      const matchId = (item.caseId || '').toLowerCase().includes(q);
      const matchLoc = (item.location || '').toLowerCase().includes(q);
      const matchReporter = (item.reporterName || '').toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      return matchName || matchId || matchLoc || matchReporter || matchDesc;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black font-display text-stone-900 dark:text-stone-100">
              Global Registry
            </h1>
            <span className="px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold">
              User-Registered Recovery Cases
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Official ledger containing ONLY explicitly registered recovery cases. AI visual search results are not automatically registered.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <FilePlus className="w-4 h-4" /> Register Recovery Case
          </button>
          <Link
            to="/detector"
            className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold text-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Scan className="w-4 h-4 text-amber-600" /> AI Visual Search
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Global Registry by Case ID (DHA-...), Artifact Name, Location, Reporter..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 text-xs outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Registered">Registered</option>
              <option value="verified">Verified Match</option>
              <option value="rejected">Rejected</option>
              <option value="match_pending">Match Pending</option>
            </select>

            <select
              value={caseTypeFilter}
              onChange={(e) => setCaseTypeFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 text-xs outline-none cursor-pointer"
            >
              <option value="">All Case Types</option>
              <option value="Missing">Missing</option>
              <option value="Stolen">Stolen</option>
              <option value="Illicitly removed">Illicitly removed</option>
              <option value="Recovered">Recovered</option>
              <option value="Suspected trafficking">Suspected trafficking</option>
              <option value="Repatriation">Repatriation</option>
            </select>

            {(statusFilter || caseTypeFilter || searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setCaseTypeFilter('');
                  setSearchQuery('');
                }}
                className="p-2 text-stone-500 hover:text-amber-600 transition"
                title="Clear Filters"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <Loading message="Loading Global Registry Cases..." />
      ) : error ? (
        <div className="py-16 text-center space-y-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-3xl p-8">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
          <h3 className="text-base font-bold text-red-800 dark:text-red-300">{error}</h3>
          <button
            onClick={fetchCases}
            className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      ) : cases.length === 0 ? (
        /* EMPTY STATE - STRICTLY COMPLIANT WITH SECTION 11 */
        <div className="py-20 px-6 text-center space-y-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-700 dark:text-amber-400">
            <FolderOpen className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl font-bold font-display text-stone-900 dark:text-stone-100">
              No registered recovery cases yet.
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              AI search results are not automatically registered. Cases only appear in the Global Registry after explicit user registration.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <FilePlus className="w-4 h-4" /> Register Recovery Case
            </button>
            <Link
              to="/detector"
              className="px-5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold text-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Scan className="w-4 h-4 text-amber-600" /> Run AI Visual Search
            </Link>
          </div>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="py-12 text-center text-stone-500 text-xs bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
          No registered recovery cases match your active filters.
        </div>
      ) : (
        /* REGISTERED CASES GRID */
        <div>
          <div className="flex items-center justify-between mb-4 text-xs text-stone-500">
            <span>
              Showing <strong className="text-stone-900 dark:text-stone-100 font-bold">{filteredCases.length}</strong> registered recovery cases
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCases.map((c) => (
              <div
                key={c._id || c.caseId}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-500/60 rounded-2xl p-5 space-y-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                  <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    {c.caseId}
                  </span>
                  <StatusBadge status={c.status || 'Registered'} />
                </div>

                {/* Case Info */}
                <div className="space-y-3 flex-1">
                  <div className="flex gap-3">
                    {c.evidenceImage || c.aiMatchImage ? (
                      <div className="w-16 h-16 rounded-xl bg-stone-900 border border-stone-800 shrink-0 overflow-hidden flex items-center justify-center p-1">
                        <img
                          src={c.evidenceImage || c.aiMatchImage}
                          alt={c.artifactName}
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.parentNode.innerHTML = '<span class="text-[9px] text-stone-400 text-center">Image unavailable</span>';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shrink-0 flex items-center justify-center text-[10px] text-stone-400 font-semibold p-1 text-center">
                        Image unavailable
                      </div>
                    )}

                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                        {c.caseType}
                      </span>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                        {c.artifactName}
                      </h3>
                      {c.material && (
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                          {c.material} {c.historicalPeriod ? `• ${c.historicalPeriod}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-stone-600 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800/60">
                    <p className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{c.location}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-stone-500">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Reported {new Date(c.reportDate || c.createdAt).toLocaleDateString()}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-stone-500 truncate">
                      <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">Reporter: {c.reporterName}</span>
                    </p>
                  </div>
                </div>

                {/* Footer Action */}
                <button
                  onClick={() => setSelectedCaseForDetails(c)}
                  className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-stone-950 text-stone-700 dark:text-stone-200 font-bold text-xs transition cursor-pointer"
                >
                  View Case Details <ChevronRight className="w-3.5 h-3.5" />
                </button>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <CaseRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => fetchCases()}
      />

      <CaseDetailsModal
        isOpen={Boolean(selectedCaseForDetails)}
        onClose={() => setSelectedCaseForDetails(null)}
        caseData={selectedCaseForDetails}
      />
    </div>
  );
};

export default GlobalSearch;
