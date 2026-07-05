import { CloudUpload, Video, LogOut, Users, Shield, KeyRound } from 'lucide-react';
import { useState } from 'react';

export default function Header({ user, videoCount, isAdmin, onUploadClick, onUserMgmtClick, onLogout, onChangePassword }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/20">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Video Cloud</h1>
              <p className="text-xs text-gray-500">Professionelle Video-Ablage</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center text-sm text-gray-400">
              {videoCount} {videoCount === 1 ? 'Video' : 'Videos'}
            </span>

            {isAdmin && (
              <button
                onClick={onUploadClick}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-medium text-sm transition-all shadow-lg shadow-brand-600/20 hover:shadow-brand-500/30"
              >
                <CloudUpload className="w-4 h-4" />
                Upload
              </button>
            )}

            {isAdmin && (
              <button
                onClick={onUserMgmtClick}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium text-sm transition-colors"
                title="Benutzerverwaltung"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Nutzer</span>
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm text-gray-300">{user.name}</span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-12 z-20 w-48 rounded-lg bg-gray-800 border border-gray-700 shadow-xl py-1">
                    <div className="px-3 py-2 border-b border-gray-700">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        {user.role === 'admin' && <Shield className="w-3 h-3" />}
                        @{user.username}
                      </p>
                    </div>
                    <button
                      onClick={() => { onChangePassword(); setMenuOpen(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                    >
                      <KeyRound className="w-4 h-4" />
                      Passwort ändern
                    </button>
                    <button
                      onClick={() => { onLogout(); setMenuOpen(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Abmelden
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
