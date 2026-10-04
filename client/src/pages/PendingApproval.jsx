import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowLeft, CheckCircle2 } from 'lucide-react';

const PendingApproval = () => {
  return (
    <div className="max-w-md mx-auto my-12 text-center">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-3xl flex items-center justify-center text-amber-600 mx-auto">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-display text-slate-900">Account Approval Pending</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your organization registration has been submitted successfully and is currently under review by the Archaeological Survey of India (ASI) Admin team.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-left text-xs">
          <div className="flex items-center gap-2 text-blue-700 font-bold">
            <CheckCircle2 className="w-4 h-4" /> Next Steps:
          </div>
          <ul className="text-slate-600 space-y-1 pl-6 list-disc text-[11px]">
            <li>ASI Verification Officer validates entity credentials.</li>
            <li>Status updated from <span className="text-amber-700 font-semibold">pending</span> to <span className="text-emerald-700 font-semibold">approved</span>.</li>
            <li>You will receive approval notification to log into your portal dashboard.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link
            to="/login"
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Login Screen
          </Link>
          <Link
            to="/"
            className="text-xs text-slate-500 hover:text-slate-900 transition py-1 font-semibold"
          >
            Back to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
