import React from 'react';
import { Calendar, MapPin, User, FileText } from 'lucide-react';
import StatusBadge from './StatusBadge';

const Timeline = ({ items = [], title = 'History Ledger' }) => {
  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-500 italic">No timeline history recorded.</p>;
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-blue-700 uppercase tracking-wider mb-2">{title}</h4>
      <div className="relative border-l-2 border-slate-200 ml-3 pl-6 space-y-6">
        {items.map((item, idx) => (
          <div key={idx} className="relative group">
            <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center group-hover:bg-blue-600 transition-colors" />
            <div className="bg-white border border-slate-200 hover:border-blue-300 p-4 rounded-2xl space-y-2 transition shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {item.event || item.status || 'Update'}
                </span>
                {item.status && <StatusBadge status={item.status} />}
                {(item.date || item.at || item.timestamp) && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    {new Date(item.date || item.at || item.timestamp).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                )}
              </div>

              {item.location && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  {item.location}
                </p>
              )}

              {(item.changedBy || item.updatedBy) && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  Logged by:{' '}
                  <span className="text-slate-800 font-semibold">
                    {item.changedBy?.name || item.updatedBy?.name || 'Authorized Official'}
                  </span>
                  {item.changedBy?.organization && ` (${item.changedBy.organization})`}
                </p>
              )}

              {item.note && (
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-start gap-1.5 mt-2">
                  <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{item.note}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
