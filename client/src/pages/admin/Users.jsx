import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Loading from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';
import { Users as UsersIcon, Search } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users');
        setUsers(res.data);
      } catch (err) {
        console.error('Error fetching user directory:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.organization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading message="Loading System User Directory..." />;

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <h1 className="text-2xl font-display font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <UsersIcon className="w-6 h-6 text-amber-600 dark:text-amber-500" /> National Network User Directory
        </h1>
        <p className="text-xs text-stone-600 dark:text-stone-400">All authenticated custodians, law enforcement authorities & archaeology verifiers</p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by user name, email, role or organization..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:border-amber-500 text-stone-800 dark:text-stone-100 text-xs outline-none shadow-xs transition"
        />
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
            <thead className="bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-400 uppercase font-mono tracking-wider border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="px-6 py-4">User Official</th>
                <th className="px-6 py-4">Organization Trust</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {filtered.map((u) => (
                <tr key={u._id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition">
                  <td className="px-6 py-4">
                    <p className="font-bold text-stone-900 dark:text-stone-100">{u.name}</p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">{u.email}</p>
                  </td>
                  <td className="px-6 py-4 font-semibold text-amber-700 dark:text-amber-400">{u.organization}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 font-mono text-[11px] uppercase text-stone-700 dark:text-stone-300">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-6 py-4 text-stone-500 dark:text-stone-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
