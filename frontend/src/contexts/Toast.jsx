// src/contexts/Toast.jsx
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState
} from "react";
import { createPortal } from "react-dom";

const Ctx = createContext(null);
let _id = 0;
const genId = () => `${Date.now()}_${++_id}`;

export function NotificationProvider({ children, position = "top-right", max = 5 }) {
  const [toasts, setToasts] = useState([]);
  const container = useRef(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.id = "toast-root";
    document.body.appendChild(el);
    container.current = el;
    return () => { document.body.removeChild(el); };
  }, []);

  const remove = useCallback((id) => {
    setToasts(list => list.filter(t => t.id !== id));
  }, []);

  const push = useCallback((toast) => {
    setToasts(list => [{ ...toast, id: genId() }, ...list].slice(0, max));
  }, [max]);

  const api = useMemo(() => {
    const base = (opts = {}) => push({
      type: opts.type || "info",
      title: opts.title,
      message: opts.message,
      duration: Number.isFinite(opts.duration) ? opts.duration : 2000,
      action: opts.action,
    });
    return {
      notify: base,
      success: (opts) => base({ ...opts, type: "success" }),
      error:   (opts) => base({ ...opts, type: "error", duration: 2400 }),
      info:    (opts) => base({ ...opts, type: "info" }),
      warning: (opts) => base({ ...opts, type: "warning" }),
      toastSuccess: (message) => base({ message, type: "success" }),
      toastError:   (message) => base({ message, type: "error", duration: 2400 }),
      remove,
    };
  }, [push]);

  return (
    <Ctx.Provider value={api}>
      {children}
      {container.current && createPortal(
        <ToastStack toasts={toasts} remove={remove} position={position} />,
        container.current
      )}
    </Ctx.Provider>
  );
}

export function useNotifications() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNotifications must be used within <NotificationProvider>");
  return v;
}

// Alias quen tay:
export const useToast = useNotifications;

function ToastStack({ toasts, remove, position }) {
  const pos = {
    "top-right":    { wrapper: "top-[80px] right-4 items-end" },
    "top-left":     { wrapper: "top-4 left-4 items-start" },
    "bottom-right": { wrapper: "bottom-4 right-4 items-end" },
    "bottom-left":  { wrapper: "bottom-4 left-4 items-start" },
  }[position] || { wrapper: "top-[80px] right-4 items-end" };

  return (
    <div className={`pointer-events-none fixed z-[9999] ${pos.wrapper} p-3 space-y-2`}>
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onClose={() => remove(t.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  const { type, title, message, duration = 2000, action } = toast;
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setOpen(false); setTimeout(onClose, 120); }, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const styles = {
    success: { ring: "ring-1 ring-green-300", dot: "bg-green-500", badge: "text-green-700" },
    error:   { ring: "ring-1 ring-red-300",   dot: "bg-red-500",   badge: "text-red-700" },
    warning: { ring: "ring-1 ring-amber-300", dot: "bg-amber-500", badge: "text-amber-700" },
    info:    { ring: "ring-1 ring-blue-300",  dot: "bg-blue-500",  badge: "text-blue-700" },
  }[type || "info"];

  return (
    <div
      role="status" aria-live="polite"
      className={`pointer-events-auto bg-white ${styles.ring} shadow-lg rounded-xl px-3 py-2 w-full sm:w-[280px] text-sm
      transition-all duration-150 ${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-1 inline-flex size-2 rounded-full ${styles.dot}`} />
        <div className="flex-1 min-w-0">
          {title && <div className={`text-sm font-semibold ${styles.badge}`}>{title}</div>}
          {message && <div className="text-sm text-gray-700 leading-relaxed break-words">{message}</div>}
          {action?.label && (
            <div className="mt-1">
              <button
                onClick={() => { action.onClick?.(); onClose(); }}
                className="text-xs underline underline-offset-2"
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => { setOpen(false); setTimeout(onClose, 120); }}
          className="ml-1 shrink-0 rounded-md p-1 hover:bg-gray-100"
          aria-label="Đóng"
        >
          <svg viewBox="0 0 24 24" className="size-4 opacity-60" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
