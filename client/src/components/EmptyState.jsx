import React from 'react';
import { ShieldAlert } from 'lucide-react';

const EmptyState = ({ title = 'No Data Found', description = 'There are no records matching your criteria.', action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-2xl text-center shadow-xs">
      <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
        <ShieldAlert className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
