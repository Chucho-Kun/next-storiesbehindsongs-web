"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { applyLanguage, getSavedLanguage, WIDGET_ELEMENT_ID } from "@/lib/google-translate";
import { SOURCE_LANGUAGE, TRANSLATE_LANGUAGES } from "@/lib/translate-languages";

const OPTIONS = [
  { code: SOURCE_LANGUAGE, label: "English (original)" },
  ...TRANSLATE_LANGUAGES,
];

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(SOURCE_LANGUAGE);
  const [failed, setFailed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  // El widget no re-traduce de forma fiable el contenido que React monta al
  // navegar en cliente, así que con un idioma activo se fuerza carga completa.
  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    if (getSavedLanguage()) window.location.reload();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    const saved = getSavedLanguage();
    if (!saved) return;
    applyLanguage(saved)
      .then(() => setActive(saved))
      .catch(() => setFailed(true));
  }, []);

  function handleSelect(code: string) {
    setOpen(false);
    buttonRef.current?.focus();
    if (code === active) return;

    setFailed(false);
    setActive(code);
    applyLanguage(code).catch(() => {
      setActive(SOURCE_LANGUAGE);
      setFailed(true);
      setOpen(true);
    });
  }

  return (
    <div
      ref={rootRef}
      translate="no"
      className="notranslate fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2"
    >
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Choose a language"
          className="w-48 rounded-lg border border-neutral-700 bg-neutral-900 p-1 shadow-xl"
        >
          <ul>
            {OPTIONS.map((option) => (
              <li key={option.code}>
                <button
                  type="button"
                  lang={option.code}
                  aria-current={option.code === active ? "true" : undefined}
                  onClick={() => handleSelect(option.code)}
                  className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-white ${
                    option.code === active ? "font-bold text-white" : "text-neutral-300"
                  }`}
                >
                  {option.label}
                  {option.code === active && <span aria-hidden="true">✓</span>}
                </button>
              </li>
            ))}
          </ul>
          {failed && (
            <p role="alert" className="px-3 py-2 text-xs text-red-400">
              Translation is unavailable right now. Please try again later.
            </p>
          )}
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        aria-label="Translate this page"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-title text-white shadow-lg hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </button>

      <div id={WIDGET_ELEMENT_ID} className="hidden" aria-hidden="true" />
    </div>
  );
}
