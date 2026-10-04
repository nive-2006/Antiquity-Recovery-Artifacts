import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { MapPin, Layers, ChevronRight } from 'lucide-react';

const ArtifactCard = ({ artifact }) => {
  const primaryImage = artifact.images && artifact.images.length > 0 ? artifact.images[0].url : 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group">
      <div className="relative h-48 overflow-hidden bg-slate-100">
        <img
          src={primaryImage}
          alt={artifact.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3">
          <StatusBadge status={artifact.status} />
        </div>
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold text-slate-800 border border-slate-200 shadow-2xs">
          {artifact.artifactId}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {artifact.name}
          </h3>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            {artifact.material} • {artifact.era}
          </p>
        </div>

        <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <p className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span>{artifact.region}</span>
          </p>
          {artifact.ownerId && (
            <p className="truncate">
              Custodian: <span className="text-slate-800 font-medium">{artifact.ownerId.organization || artifact.ownerId.name}</span>
            </p>
          )}
        </div>

        <Link
          to={`/artifacts/${artifact._id || artifact.artifactId}`}
          className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-blue-50 text-blue-600 font-semibold text-xs border border-blue-600 transition"
        >
          View Identity Record <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default ArtifactCard;
