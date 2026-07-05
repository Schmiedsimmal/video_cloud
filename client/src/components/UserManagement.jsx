import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { UserPlus, Trash2, X, Shield, User as UserIcon, Loader2 } from 'lucide-react';

export default function UserManagement({ onClose }) {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'user' });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await authFetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const res = await authFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create user');
      }
      setShowCreate(false);
      setNewUser({ username: '', password: '', name: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Benutzer wirklich löschen?')) return;
    try {
      await authFetch(`/api/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const formatDate = (iso) => {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Benutzerverwaltung</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 border border-gray-700">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-700">
                      {u.role === 'admin' ? (
                        <Shield className="w-5 h-5 text-brand-400" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{u.name}</p>
                      <p className="text-xs text-gray-500">@{u.username} · {u.role === 'admin' ? 'Administrator' : 'Nutzer'} · {formatDate(u.createdAt)}</p>
                    </div>
                    {u.id !== 'user_admin' && (
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {!showCreate ? (
                <button
                  onClick={() => setShowCreate(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors border border-gray-700"
                >
                  <UserPlus className="w-4 h-4" />
                  Neuen Nutzer anlegen
                </button>
              ) : (
                <form onSubmit={handleCreate} className="space-y-3 p-4 rounded-lg bg-gray-800 border border-gray-700">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="Vollständiger Name"
                      className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Benutzername</label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      placeholder="Login-Name"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Passwort</label>
                    <input
                      type="text"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Passwort"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Rolle</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm focus:border-brand-500 focus:outline-none"
                    >
                      <option value="user">Nutzer (kann Videos ansehen)</option>
                      <option value="admin">Admin (kann alles)</option>
                    </select>
                  </div>
                  {error && (
                    <p className="text-sm text-red-400">{error}</p>
                  )}
                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={() => { setShowCreate(false); setError(''); }} className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white">
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium disabled:opacity-50"
                    >
                      {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Erstellen'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
