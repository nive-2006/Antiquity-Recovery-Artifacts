import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { UserCheck, CheckCircle2, XCircle, Building, Mail } from 'lucide-react';

const UserApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const { addToast } = useToast();

  const fetchPending = async () => {
    try {
      const res = await api.get('/admin/pending-users');
      setPendingUsers(res.data);
    } catch (err) {
      console.error('Error loading pending users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try {
      await api.patch(`/admin/users/${userId}/approve`);
      addToast('User registration approved successfully!', 'success');
      setPendingUsers(pendingUsers.filter(u => u._id !== userId));
    } catch (err) {
      addToast(err.response?.data?.message || 'Approval failed.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    setActionLoading(userId);
    try {
      await api.patch(`/admin/users/${userId}/reject`);
      addToast('User registration rejected.', 'error');
      setPendingUsers(pendingUsers.filter(u => u._id !== userId));
    } catch (err) {
      addToast(err.response?.data?.message || 'Rejection failed.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <Loading message="Retrieving pending user registrations..." />;

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <h1 className="text-2xl font-display font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-amber-600 dark:text-amber-500" /> Pending User Approval Console
        </h1>
        <p className="text-xs text-stone-600 dark:text-stone-400">Validate entity credentials before authorizing portal login access</p>
      </div>

      {pendingUsers.length === 0 ? (
        <EmptyState
          title="No Pending Registration Requests"
          description="All user accounts have been processed by system administrators."
        />
      ) : (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
              <thead className="bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-400 uppercase font-mono tracking-wider border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="px-6 py-4">User Official</th>
                  <th className="px-6 py-4">Organization & Role</th>
                  <th className="px-6 py-4">Submitted Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Approve / Reject</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {pendingUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition">
                    <td className="px-6 py-4">
                      <p className="font-bold text-stone-900 dark:text-stone-100">{u.name}</p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-stone-400" /> {u.email}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-stone-400" /> {u.organization}
                      </p>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-stone-500 dark:text-stone-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleReject(u._id)}
                        disabled={actionLoading === u._id}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 font-semibold transition text-xs"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(u._id)}
                        disabled={actionLoading === u._id}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition text-xs shadow-xs"
                      >
                        Approve User
                      </button>
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

export default UserApprovals;
