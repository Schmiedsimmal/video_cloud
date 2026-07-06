import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { Video, Lock, User, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="relative">
        <div className="absolute inset-0 blur-3xl bg-brand-600/10 rounded-full" />
        <div className="relative w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/20 mb-4">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Video Cloud</h1>
            <p className="text-sm text-gray-500 mt-1">SW Vision — Videographie</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-xl">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Benutzername</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Benutzername"
                  autoFocus
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm focus:border-brand-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Passwort</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passwort"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white text-sm font-medium transition-all shadow-lg shadow-brand-600/20 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Anmelden'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            Standard-Login: admin / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
