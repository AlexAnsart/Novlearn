"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AVATARS, AVATAR_COLORS } from "../../constants/avatars";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import AvatarDisplay from "./AvatarDisplay";

interface AvatarCustomizerProps {
  onClose: () => void;
}

export default function AvatarCustomizer({ onClose }: AvatarCustomizerProps) {
  const { user, profile, refreshProfile } = useAuth();

  const [selectedAvatarId, setSelectedAvatarId] = useState(
    profile?.avatar_id ?? "fox",
  );
  const [selectedColor, setSelectedColor] = useState(
    profile?.avatar_color ?? "#6366f1",
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_id: selectedAvatarId, avatar_color: selectedColor })
      .eq("id", user.id);

    if (error) {
      toast.error("Erreur lors de la sauvegarde.");
    } else {
      await refreshProfile();
      toast.success("Avatar mis à jour !");
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            Modifier l&apos;avatar
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prévisualisation */}
        <div className="flex justify-center mb-6">
          <AvatarDisplay
            avatarId={selectedAvatarId}
            avatarColor={selectedColor}
            size="lg"
          />
        </div>

        {/* Sélection personnage */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Personnage
        </p>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {AVATARS.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => setSelectedAvatarId(avatar.id)}
              title={avatar.label}
              className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all ${
                selectedAvatarId === avatar.id
                  ? "ring-2 ring-indigo-400 scale-110"
                  : "hover:scale-105 opacity-70 hover:opacity-100"
              }`}
              style={{ backgroundColor: selectedColor }}
            >
              {avatar.emoji}
            </button>
          ))}
        </div>

        {/* Sélection couleur */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Couleur
        </p>
        <div className="flex gap-2 flex-wrap mb-6">
          {AVATAR_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              title={color}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{ backgroundColor: color }}
            >
              {selectedColor === color && (
                <Check className="w-4 h-4 text-white drop-shadow" />
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
