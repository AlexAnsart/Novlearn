export const AVATARS = [
  { id: "fox", emoji: "🦊", label: "Renard" },
  { id: "robot", emoji: "🤖", label: "Robot" },
  { id: "wizard", emoji: "🧙", label: "Sorcier" },
  { id: "cat", emoji: "🐱", label: "Chat" },
  { id: "lion", emoji: "🦁", label: "Lion" },
  { id: "frog", emoji: "🐸", label: "Grenouille" },
  { id: "dragon", emoji: "🐲", label: "Dragon" },
  { id: "owl", emoji: "🦉", label: "Hibou" },
];

export const AVATAR_COLORS = [
  "#6366f1", // violet (défaut)
  "#3b82f6", // bleu
  "#10b981", // vert
  "#f59e0b", // orange
  "#ef4444", // rouge
  "#ec4899", // rose
  "#8b5cf6", // purple
  "#0ea5e9", // sky
];

export const DEFAULT_AVATAR_ID = "fox";
export const DEFAULT_AVATAR_COLOR = "#6366f1";

export function getAvatarEmoji(avatarId: string): string {
  return AVATARS.find((a) => a.id === avatarId)?.emoji ?? "🦊";
}
