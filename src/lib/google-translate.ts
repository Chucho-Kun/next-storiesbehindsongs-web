import { SOURCE_LANGUAGE, TRANSLATE_LANGUAGES } from "@/lib/translate-languages";

export const STORAGE_KEY = "sbs:translate-lang:v1";
export const COOKIE_NAME = "googtrans";
export const WIDGET_ELEMENT_ID = "google_translate_element";

const SCRIPT_SRC =
  "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
const COMBO_TIMEOUT_MS = 5000;

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
          elementId: string,
        ) => unknown;
      };
    };
  }
}

let loadPromise: Promise<void> | null = null;
let domGuardInstalled = false;

export function getSavedLanguage(): string | null {
  try {
    const code = localStorage.getItem(STORAGE_KEY);
    return TRANSLATE_LANGUAGES.some((l) => l.code === code) ? code : null;
  } catch {
    return null;
  }
}

function saveLanguage(code: string | null) {
  try {
    if (code) localStorage.setItem(STORAGE_KEY, code);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sin localStorage (modo privado): la cookie cubre la sesión.
  }
}

function writeCookie(code: string | null) {
  document.cookie = code
    ? `${COOKIE_NAME}=/${SOURCE_LANGUAGE}/${code}; path=/`
    : `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

// El widget mueve nodos de texto; sin esta guarda React lanza NotFoundError
// al desmontar o reordenar elementos que Google ya envolvió en <font>.
function installDomGuard() {
  if (domGuardInstalled) return;
  domGuardInstalled = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(
    this: Node,
    newNode: T,
    referenceNode: Node | null,
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) return newNode;
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

export function loadGoogleTranslate(): Promise<void> {
  if (loadPromise) return loadPromise;
  installDomGuard();

  loadPromise = new Promise<void>((resolve, reject) => {
    window.googleTranslateElementInit = () => {
      new window.google!.translate.TranslateElement(
        {
          pageLanguage: SOURCE_LANGUAGE,
          includedLanguages: TRANSLATE_LANGUAGES.map((l) => l.code).join(","),
          autoDisplay: false,
        },
        WIDGET_ELEMENT_ID,
      );
      resolve();
    };

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onerror = () => {
      script.remove();
      loadPromise = null;
      reject(new Error("Google Translate could not be loaded"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

function waitForCombo(): Promise<HTMLSelectElement> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const combo = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
      if (combo) {
        clearInterval(timer);
        resolve(combo);
      } else if (Date.now() - startedAt > COMBO_TIMEOUT_MS) {
        clearInterval(timer);
        reject(new Error("Google Translate widget did not render"));
      }
    }, 100);
  });
}

export async function applyLanguage(code: string): Promise<void> {
  if (code === SOURCE_LANGUAGE) {
    const wasTranslated = document.documentElement.classList.contains("translated-ltr");
    writeCookie(null);
    saveLanguage(null);
    // El widget no restaura el DOM original de forma fiable: se recarga.
    if (wasTranslated) window.location.reload();
    return;
  }

  writeCookie(code);
  await loadGoogleTranslate();
  const combo = await waitForCombo();
  saveLanguage(code);

  if (combo.value !== code) {
    combo.value = code;
    combo.dispatchEvent(new Event("change"));
  }
}
