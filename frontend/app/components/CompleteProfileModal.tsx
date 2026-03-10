"use client";

import { User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export function CompleteProfileModal() {
  const { user, profile, profileLoading, refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);

  // Afficher la modale si l'utilisateur est connecté, le profil chargé,
  // et que le prénom est vide (cas SSO sans métadonnées de nom)
  const shouldShow =
    !!user &&
    !profileLoading &&
    !!profile &&
    (!profile.first_name || profile.first_name.trim() === "");

  if (!shouldShow) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedFirst = firstName.trim();
    if (!trimmedFirst) {
      toast.error("Le prénom est obligatoire.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: trimmedFirst,
          last_name: lastName.trim() || null,
        })
        .eq("id", user!.id);

      if (error) throw error;

      await refreshProfile();
      toast.success("Profil complété !");
    } catch (err: any) {
      console.error("[CompleteProfileModal] save error:", err);
      toast.error(err.message || "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-blue-400" />
          </div>
          <h3
            className="text-white text-2xl mb-2"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Complétez votre profil
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Votre connexion via Google n'a pas pu récupérer votre nom.
            <br />
            Merci de le renseigner pour continuer.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label
              htmlFor="cp-firstname"
              className="block text-blue-200 text-sm mb-1"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              Prénom <span className="text-red-400">*</span>
            </label>
            <input
              id="cp-firstname"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Votre prénom"
              autoComplete="given-name"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-800 text-white border-2 border-slate-700 focus:border-blue-500 outline-none"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            />
          </div>

          <div>
            <label
              htmlFor="cp-lastname"
              className="block text-blue-200 text-sm mb-1"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              Nom <span className="text-slate-500 text-xs">(facultatif)</span>
            </label>
            <input
              id="cp-lastname"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Votre nom de famille"
              autoComplete="family-name"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 text-white border-2 border-slate-700 focus:border-blue-500 outline-none"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            />
          </div>

          <button
            type="submit"
            disabled={saving || !firstName.trim()}
            className="w-full bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sauvegarde...
              </>
            ) : (
              "Enregistrer"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
