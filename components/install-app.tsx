"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as { standalone?: boolean }).standalone))
  );
}

export function InstallAppBanner({ compact = false }: { compact?: boolean }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setIos(isIos());
    setStandalone(isStandalone());
    setHidden(localStorage.getItem("sf-install-dismissed") === "1");

    function onPrompt(event: Event) {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (standalone || hidden) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  function dismiss() {
    localStorage.setItem("sf-install-dismissed", "1");
    setHidden(true);
  }

  return (
    <div
      className={
        compact
          ? "rounded-xl bg-[#102938] text-white p-3 text-sm"
          : "mx-3 sm:mx-5 mt-3 rounded-2xl bg-navy-2 text-white p-3 sm:p-4 border border-white/10"
      }
    >
      <div className="flex items-start gap-3">
        <Download className="text-orange shrink-0 mt-0.5" size={18} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold">Install Kaizen</p>
          {ios ? (
            <p className="text-[13px] text-[#c5d6e2] mt-1">
              iPhone / iPad: tap <Share className="inline" size={12} /> Share, then{" "}
              <span className="font-semibold">Add to Home Screen</span>. Opens fullscreen like an app.
            </p>
          ) : deferred ? (
            <p className="text-[13px] text-[#c5d6e2] mt-1">
              Add it to the home screen and launch jobs, maps and follow-ups without the browser chrome.
            </p>
          ) : (
            <p className="text-[13px] text-[#c5d6e2] mt-1">
              Android / Chrome: menu → <span className="font-semibold">Install app</span>. iPhone: Share →
              Add to Home Screen.
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {deferred ? (
              <button
                type="button"
                onClick={install}
                className="rounded-xl bg-orange px-3 py-2 text-sm font-semibold min-h-10"
              >
                Install app
              </button>
            ) : null}
            <a
              href="/settings#install"
              className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold min-h-10 inline-flex items-center"
            >
              How to install
            </a>
          </div>
        </div>
        <button type="button" onClick={dismiss} className="p-1 text-[#9cb4c4]" aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export function InstallAppButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(isStandalone());
    function onPrompt(event: Event) {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (standalone || !deferred) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        await deferred.prompt();
        await deferred.userChoice;
        setDeferred(null);
      }}
      className="hidden sm:inline-flex rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold text-white"
    >
      Install
    </button>
  );
}
