"use client";

import { Eye, EyeOff, Loader2, Lock, Save, User } from "lucide-react";

interface AccountTabProps {
  formData: { first_name: string; last_name: string };
  setFormData: (data: { first_name: string; last_name: string }) => void;
  passwordData: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  setPasswordData: (data: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => void;
  showOldPass: boolean;
  setShowOldPass: (v: boolean) => void;
  showNewPass: boolean;
  setShowNewPass: (v: boolean) => void;
  loading: boolean;
  onSaveInfo: () => void;
  onSavePassword: () => void;
}

export function AccountTab({
  formData,
  setFormData,
  passwordData,
  setPasswordData,
  showOldPass,
  setShowOldPass,
  showNewPass,
  setShowNewPass,
  loading,
  onSaveInfo,
  onSavePassword,
}: AccountTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Infos Personnelles */}
      <section className="bg-app-surface/50 border border-app-border rounded-2xl p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-content-main flex items-center gap-2">
            <User className="text-indigo-400" /> Informations
          </h2>
          <button
            onClick={onSaveInfo}
            disabled={loading}
            className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white p-3 md:px-4 md:py-2 rounded-lg font-medium transition-all flex items-center gap-2"
            title="Sauvegarder les informations"
          >
            {loading ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden md:inline">Sauvegarder Infos</span>
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-content-muted">Prénom</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-content-main focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-content-muted">Nom</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-content-main focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </section>

      {/* Changement Mot de Passe */}
      <section className="bg-app-surface/50 border border-app-border rounded-2xl p-6 md:p-8">
        <h2 className="text-xl font-bold text-content-main mb-6 flex items-center gap-2">
          <Lock className="text-emerald-400" /> Changer le mot de passe
        </h2>

        <div className="space-y-4 max-w-lg">
          {/* Ancien MDP */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-content-muted">
              Ancien mot de passe
            </label>
            <div className="relative">
              <input
                type={showOldPass ? "text" : "password"}
                value={passwordData.oldPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, oldPassword: e.target.value })
                }
                className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-content-main focus:ring-2 focus:ring-emerald-500 outline-none pr-10"
                placeholder="Requis pour changer"
              />
              <button
                type="button"
                onClick={() => setShowOldPass(!showOldPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-main"
              >
                {showOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Nouveau MDP */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-content-muted">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-content-main focus:ring-2 focus:ring-emerald-500 outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-main"
                >
                  {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-content-muted">Confirmer</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                className={`w-full bg-app-bg border rounded-xl px-4 py-3 text-content-main outline-none ${
                  passwordData.confirmPassword &&
                  passwordData.newPassword !== passwordData.confirmPassword
                    ? "border-red-500 focus:ring-red-500"
                    : "border-app-border focus:ring-emerald-500"
                }`}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onSavePassword}
              disabled={loading || !passwordData.oldPassword}
              className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
              Mettre à jour le mot de passe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
