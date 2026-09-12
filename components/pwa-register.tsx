"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const ready = () =>
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Registration can fail on first load in some browsers; try again next visit.
      });
    if (document.readyState === "complete") ready();
    else window.addEventListener("load", ready, { once: true });
  }, []);
  return null;
}
