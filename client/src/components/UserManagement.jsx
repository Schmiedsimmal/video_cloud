import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { UserPlus, Trash2, X, Shield, User as UserIcon, Loader2, Pencil, KeyRound, Film, Download } from 'lucide-react';

export default function UserManagement({ onClose }) {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'user' });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', username: '', role: 'user' });
  const [editError, setEditError] = useState('');
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [downloads, setDownloads] = useState([]);

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

  const fetchDownloads = async () => {
    try {
      const res = await authFetch('/api/downloads');
      const data = await res.json();
      setDownloads(data);
    } catch (err) {
      console.error('Failed to fetch downloads:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'downloads') fetchDownloads();
  }, [activeTab]);

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

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    try {
      const res = await authFetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Speichern');
      }
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setEditError(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    if (newPassword.length < 6) {
      setResetError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }
    try {
      const res = await authFetch(`/api/users/${resetUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler');
      }
      setResetUser(null);
      setNewPassword('');
    } catch (err) {
      setResetError(err.message);
    }
  };

  const startEdit = (u) => {
    setEditingUser(u);
    setEditForm({ name: u.name, username: u.username, role: u.role });
    setEditError('');
  };

  const formatDateTime = (iso) => {
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const formatDate = (iso) => {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Benutzerverwaltung</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'users' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <UserIcon className="w-4 h-4 inline mr-1.5" />
            Nutzer
          </button>
          <button
            onClick={() => setActiveTab('downloads')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'downloads' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Download className="w-4 h-4 inline mr-1.5" />
            Downloads
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'downloads' ? (
            <div>
              {downloads.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Noch keine Downloads.</p>
              ) : (
                <div className="space-y-2">
                  {downloads.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-500/10">
                        <Download className="w-5 h-5 text-brand-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{d.videoTitle}</p>
                        <p className="text-xs text-gray-500">
                          {d.username === 'admin' ? 'Admin' : d.username} · {formatDateTime(d.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-200">
                      {u.role === 'admin' ? (
                        <Shield className="w-5 h-5 text-brand-500" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-500">@{u.username} · {u.role === 'admin' ? 'Administrator' : 'Nutzer'} · {formatDate(u.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(u)}
                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-900 transition-colors"
                        title="Bearbeiten"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setResetUser(u); setNewPassword(''); setResetError(''); }}
                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-900 transition-colors"
                        title="Passwort zurücksetzen"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      {u.id !== 'user_admin' && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {!showCreate ? (
                <button
                  onClick={() => setShowCreate(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-medium transition-colors border border-gray-200"
                >
                  <UserPlus className="w-4 h-4" />
                  Neuen Nutzer anlegen
                </button>
              ) : (
                <form onSubmit={handleCreate} className="space-y-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Name</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="Vollständiger Name"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Benutzername</label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      placeholder="Login-Name"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Passwort</label>
                    <input
                      type="text"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Passwort"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Rolle</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm focus:border-brand-500 focus:outline-none"
                    >
                      <option value="user">Nutzer (kann Videos ansehen)</option>
                      <option value="admin">Admin (kann alles)</option>
                    </select>
                  </div>
                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}
                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={() => { setShowCreate(false); setError(''); }} className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-900">
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

        {editingUser && (
          <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={() => setEditingUser(null)}>
            <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Nutzer bearbeiten</h3>
              <form onSubmit={handleEdit} className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Benutzername</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Rolle</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm focus:border-brand-500 focus:outline-none"
                  >
                    <option value="user">Nutzer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {editError && <p className="text-sm text-red-600">{editError}</p>}
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setEditingUser(null)} className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-900">Abbrechen</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium">Speichern</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {resetUser && (
          <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={() => setResetUser(null)}>
            <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Passwort zurücksetzen</h3>
              <p className="text-sm text-gray-500 mb-4">Für: {resetUser.name} (@{resetUser.username})</p>
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Neues Passwort</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoFocus
                    placeholder="Mindestens 6 Zeichen"
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                {resetError && <p className="text-sm text-red-600">{resetError}</p>}
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setResetUser(null)} className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-900">Abbrechen</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium">Zurücksetzen</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
