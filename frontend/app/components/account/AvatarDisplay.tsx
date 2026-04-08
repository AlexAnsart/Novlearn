"use client";

import { getAvatarEmoji, DEFAULT_AVATAR_ID, DEFAULT_AVATAR_COLOR } from "../../constants/avatars";

interface AvatarDisplayProps {
  avatarId?: string;
  avatarColor?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-10 h-10 text-xl rounded-xl",
  md: "w-16 h-16 text-3xl rounded-2xl",
  lg: "w-32 h-32 text-6xl rounded-3xl",
};

export default function AvatarDisplay({
  avatarId = DEFAULT_AVATAR_ID,
  avatarColor = DEFAULT_AVATAR_COLOR,
  size = "md",
}: AvatarDisplayProps) {
  const emoji = getAvatarEmoji(avatarId);

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center shadow-lg flex-shrink-0`}
      style={{ backgroundColor: avatarColor }}
    >
      {emoji}
    </div>
  );
}
