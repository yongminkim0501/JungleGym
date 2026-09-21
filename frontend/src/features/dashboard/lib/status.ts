"use client";

export type CenterStatusView = {
  message: string;
  icon: string;
  textClass: string;
  barClass: string;
};

export function centerStatus(currentVisitors: number): CenterStatusView {
  if (currentVisitors < 3) {
    return {
      message: "쾌적해요",
      icon: "/image/icon/star-emoji.png",
      textClass: "text-emerald-500",
      barClass: "bg-emerald-400",
    };
  }

  if (currentVisitors < 6) {
    return {
      message: "보통이에요",
      icon: "/image/icon/heart-emoji.png",
      textClass: "text-sky-500",
      barClass: "bg-sky-400",
    };
  }

  if (currentVisitors < 9) {
    return {
      message: "조금 혼잡해요",
      icon: "/image/icon/neutral-emoji.webp",
      textClass: "text-amber-500",
      barClass: "bg-amber-400",
    };
  }

  if (currentVisitors < 12) {
    return {
      message: "혼잡해요",
      icon: "/image/icon/angry-expression-emoji.webp",
      textClass: "text-orange-500",
      barClass: "bg-orange-400",
    };
  }

  return {
    message: "매우 혼잡해요",
    icon: "/image/icon/anggry.webp",
    textClass: "text-red-500",
    barClass: "bg-red-500",
  };
}
