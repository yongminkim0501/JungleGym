"use client";

import * as React from "react";

const openers = new WeakMap<HTMLElement, HTMLElement | null>();

export function useModalFocus() {
  const openerRef = React.useRef<HTMLElement | null>(null);
  const modalRef = React.useRef<HTMLElement | null>(null);

  const onOpenAutoFocus = React.useCallback((event: Event) => {
    const modal = event.target instanceof HTMLElement ? event.target : null;
    const active = document.activeElement;
    const activeElement = active instanceof HTMLElement ? active : null;
    const previousModal =
      activeElement?.closest<HTMLElement>("[data-jg-modal]");

    // When a confirmation hands over to a sheet, retain the original page trigger.
    const opener = previousModal
      ? (openers.get(previousModal) ?? activeElement)
      : activeElement;

    openerRef.current = opener;
    modalRef.current = modal;
    if (modal) openers.set(modal, opener);
  }, []);

  const onCloseAutoFocus = React.useCallback((event: Event) => {
    event.preventDefault();
    const activeModal = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-jg-modal]:not([data-exiting="true"])',
      ),
    ).some((modal) => modal !== modalRef.current);

    // The incoming modal owns focus while the outgoing modal finishes its exit.
    if (!activeModal && openerRef.current?.isConnected) {
      openerRef.current.focus({ preventScroll: true });
    }
  }, []);

  return { onOpenAutoFocus, onCloseAutoFocus };
}
