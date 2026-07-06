import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { X, Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function ChangePasswordModal({ onClose }) {
  const { authFetch } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Neue Passwörter stimmen nicht überein');
      return;
    }

    if (newPassword.length < 6) {
      setError('Neues Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Ändern');
      }
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Passwort ändern</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-6 flex flex-col items-center text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
            <p className="text-gray-900 font-medium">Passwort erfolgreich geändert</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Aktuelles Passwort</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Aktuelles Passwort"
                  autoFocus
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm focus:border-brand-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Neues Passwort</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Neues Passwort"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm focus:border-brand-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Neues Passwort bestätigen</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Neues Passwort wiederholen"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm focus:border-brand-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Speichern'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
