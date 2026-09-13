import * as React from "react";

import { cn } from "@/shared/lib";

export interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  className?: string;
}

export function Avatar({ name, imageUrl, className }: AvatarProps) {
  const fallback = name.trim().charAt(0).toUpperCase() || "?";

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${name} 프로필 이미지`}
        className={cn(
          "size-10 rounded-full bg-neutral-100 object-cover",
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-label={`${name} 프로필 이미지`}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-500",
        className,
      )}
    >
      {fallback}
    </span>
  );
}
