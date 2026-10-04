import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { ShieldCheck, Clock, User, FileCode } from 'lucide-react';

const AuditLogView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const res = await api.get('/admin/audit');
        setLogs(res.data);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAudit();
  }, []);

  if (loading) return <Loading message="Retrieving System Audit Trail..." />;

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <h1 className="text-2xl font-display font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-amber-600 dark:text-amber-500" /> Tamper-Evident System Audit Trail
        </h1>
        <p className="text-xs text-stone-600 dark:text-stone-400">Complete immutable record of all state transitions, user approvals & registration actions</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState title="No Audit Records" description="No audit log entries available yet." />
      ) : (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
              <thead className="bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-400 uppercase font-mono tracking-wider border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Executing User</th>
                  <th className="px-6 py-4">Action Triggered</th>
                  <th className="px-6 py-4">Target Entity ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition">
                    <td className="px-6 py-4 text-stone-500 dark:text-stone-400 font-mono">
                      {new Date(log.at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-stone-900 dark:text-stone-100">{log.userId?.name || 'System Auto'}</p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">{log.userId?.organization || 'System'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 font-mono text-[11px] font-bold text-amber-700 dark:text-amber-400">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-stone-600 dark:text-stone-300">
                      {log.targetId}
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

export default AuditLogView;
