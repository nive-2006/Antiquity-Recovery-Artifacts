import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = ({ message = 'Loading NexData Network...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[300px] text-slate-500">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
      <p className="text-sm font-semibold tracking-wide animate-pulse text-slate-700">{message}</p>
    </div>
  );
};

export default Loading;
