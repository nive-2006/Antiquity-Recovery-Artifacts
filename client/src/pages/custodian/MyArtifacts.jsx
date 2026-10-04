import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loading from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { Search, Eye, AlertTriangle, PlusCircle } from 'lucide-react';

const MyArtifacts = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMyArtifacts = async () => {
      try {
        const res = await api.get('/artifacts?my=true');
        setArtifacts(res.data);
      } catch (err) {
        console.error('Error fetching my artifacts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyArtifacts();
  }, []);

  const filtered = artifacts.filter(art =>
    art.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    art.artifactId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    art.material.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading message="Retrieving your digital repository..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">My Custodial Repository</h1>
          <p className="text-xs text-slate-500">All registered antiquities managed under your institution</p>
        </div>
        <Link
          to="/custodian/register"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> Register New Antiquity
        </Link>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by title, ID or material..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-blue-600 text-slate-900 text-xs transition outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No Artifacts Found"
          description="No registered antiquities match your current filter."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-900">
              <thead className="bg-slate-50 text-slate-500 uppercase font-mono tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4">Artifact Details</th>
                  <th className="px-5 py-4">Era & Region</th>
                  <th className="px-5 py-4">Material</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((art) => (
                  <tr key={art._id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-4 flex items-center gap-3">
                      <img
                        src={art.images && art.images[0] ? art.images[0].url : 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=800&q=80'}
                        alt={art.name}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200"
                      />
                      <div>
                        <Link to={`/artifacts/${art._id}`} className="font-bold text-slate-900 hover:text-blue-600 transition">
                          {art.name}
                        </Link>
                        <p className="text-[11px] font-mono text-blue-700">{art.artifactId}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{art.era}</p>
                      <p className="text-[11px] text-slate-500">{art.region}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{art.material}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={art.status} />
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <Link
                        to={`/artifacts/${art._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-600 text-xs font-semibold border border-blue-600 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" /> Identity Profile
                      </Link>
                      {art.status === 'registered' && (
                        <Link
                          to={`/custodian/report-stolen?id=${art._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 border border-red-200 text-red-600 text-xs font-semibold transition"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> Report Stolen
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyArtifacts;
