"use client";

import * as React from "react";

type MotionKind = "dialog" | "sheet";

interface MotionPresenceOptions {
  open: boolean;
  kind: MotionKind;
}

const easeOut = "cubic-bezier(0.23, 1, 0.32, 1)";
const drawerEase = "cubic-bezier(0.32, 0.72, 0, 1)";

function useMediaQuery(query: string) {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = React.useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}

function transforms(kind: MotionKind, desktop: boolean) {
  if (kind === "dialog" || desktop) {
    return {
      open: "translate(-50%, -50%) scale(1)",
      closed: `translate(-50%, -50%) scale(${kind === "dialog" ? 0.98 : 0.96})`,
    };
  }
  return { open: "translate(-50%, 0)", closed: "translate(-50%, 100%)" };
}

function preserveCurrentFrame(element: HTMLElement) {
  const computed = window.getComputedStyle(element);
  element.style.opacity = computed.opacity;
  element.style.transform = computed.transform;
}

export function useMotionPresence({ open, kind }: MotionPresenceOptions) {
  const [present, setPresent] = React.useState(open);
  const overlayElementRef = React.useRef<HTMLDivElement | null>(null);
  const contentElementRef = React.useRef<HTMLDivElement | null>(null);
  const [nodesMounted, setNodesMounted] = React.useState(false);
  const previousContentRef = React.useRef<HTMLDivElement | null>(null);
  const desktop = useMediaQuery("(min-width: 768px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const overlayRef = React.useCallback((element: HTMLDivElement | null) => {
    overlayElementRef.current = element;
    setNodesMounted(Boolean(element && contentElementRef.current));
  }, []);

  const contentRef = React.useCallback((element: HTMLDivElement | null) => {
    contentElementRef.current = element;
    setNodesMounted(Boolean(element && overlayElementRef.current));
    // Portal children mount after their parent layout effects. Capture presence
    // from the mounted node so the very first open also gets its entrance.
    if (element) setPresent(true);
  }, []);

  React.useLayoutEffect(() => {
    const overlay = overlayElementRef.current;
    const content = contentElementRef.current;
    if (!overlay || !content) return;

    const firstMount = previousContentRef.current !== content;
    previousContentRef.current = content;
    const keyboard = document.documentElement.dataset.input === "keyboard";
    const transform = transforms(kind, desktop);
    const mobileSheet = kind === "sheet" && !desktop;
    const enterDuration =
      reducedMotion || kind === "dialog" ? 120 : mobileSheet ? 240 : 200;
    const exitDuration =
      reducedMotion || kind === "dialog" ? 90 : mobileSheet ? 180 : 140;
    const duration = open ? enterDuration : exitDuration;
    const closedTransform = reducedMotion ? transform.open : transform.closed;
    const contentComputed = window.getComputedStyle(content);
    const overlayOpacity =
      firstMount && open ? "0" : window.getComputedStyle(overlay).opacity;
    // Confirmations must be readable on their first frame. Only the backdrop
    // fades in; a short scale transition acknowledges the click immediately.
    const contentOpacity =
      firstMount && open
        ? kind === "dialog"
          ? "1"
          : "0"
        : contentComputed.opacity;
    const contentTransform =
      firstMount && open
        ? closedTransform
        : reducedMotion
          ? transform.open
          : contentComputed.transform;
    const finalOpacity = open ? "1" : "0";
    const finalTransform = open ? transform.open : closedTransform;

    const finish = () => {
      overlay.style.opacity = finalOpacity;
      content.style.opacity = finalOpacity;
      content.style.transform = finalTransform;
      if (!open) setPresent(false);
    };

    if (keyboard) {
      overlay.style.opacity = finalOpacity;
      content.style.opacity = finalOpacity;
      content.style.transform = transform.open;
      const frame = window.requestAnimationFrame(finish);
      return () => window.cancelAnimationFrame(frame);
    }

    const options: KeyframeAnimationOptions = {
      duration,
      easing: mobileSheet && !reducedMotion ? drawerEase : easeOut,
      fill: "forwards",
    };
    const overlayAnimation = overlay.animate(
      [{ opacity: overlayOpacity }, { opacity: finalOpacity }],
      options,
    );
    const contentAnimation = content.animate(
      [
        { opacity: contentOpacity, transform: contentTransform },
        { opacity: finalOpacity, transform: finalTransform },
      ],
      options,
    );

    const onFinish = () => {
      finish();
      overlayAnimation.cancel();
      contentAnimation.cancel();
    };
    contentAnimation.addEventListener("finish", onFinish, { once: true });

    return () => {
      // Retarget a reversal from the currently displayed frame, never from zero.
      if (overlay.isConnected) preserveCurrentFrame(overlay);
      if (content.isConnected) preserveCurrentFrame(content);
      overlayAnimation.cancel();
      contentAnimation.removeEventListener("finish", onFinish);
      contentAnimation.cancel();
    };
  }, [desktop, kind, nodesMounted, open, reducedMotion]);

  return { present: open || present, overlayRef, contentRef };
}
