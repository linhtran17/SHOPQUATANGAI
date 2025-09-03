import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";


const NotificationContext = createContext(null);

let _id = 0;
const genId = () => `${Date.now()}_${++_id}`;

export function NotificationProvider({ children, position = "top-right", max = 5 }) {
  const [toasts, setToasts] = useState([]);
  const container = useRef(null);

  // Create a portal root on first mount
  useEffect(() => {
    const el = document.createElement("div");
    el.setAttribute("id", "toast-root");
    document.body.appendChild(el);
    container.current = el;
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((toast) => {
    setToasts((list) => {
      const next = [{ ...toast, id: genId() }, ...list];
      return next.slice(0, max);
    });
  }, [max]);

  const api = useMemo(() => {
    const base = (opts) => push({
      type: opts.type || "info",
      title: opts.title,
      message: opts.message,
      duration: typeof opts.duration === "number" ? opts.duration : 1000,
      action: opts.action,
    });
    return {
      notify: base,
      success: (opts) => base({ ...opts, type: "success" }),
      toastSuccess: (message) => base({ message, type: "success" }),
      error: (opts) => base({ ...opts, type: "error" }),
      toastError: (message) => base({ message, type: "error", duration: 2000 }),
      info: (opts) => base({ ...opts, type: "info" }),
      warning: (opts) => base({ ...opts, type: "warning" }),
      remove,
    };
  }, [push, remove]);

  return (
    <NotificationContext.Provider value={api}>
      {children}
      {container.current && createPortal(
        <ToastStack toasts={toasts} remove={remove} position={position} />,
        container.current
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within <NotificationProvider>");
  return ctx;
}

function ToastStack({ toasts, remove, position }) {
  const pos = positionClasses(position);
  return (
    <div className={`pointer-events-none fixed z-[9999] ${pos.wrapper} p-4 space-y-2`}
         role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={() => remove(t.id)} position={position} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose, position }) {
  const { type, title, message, duration = 4000, action } = toast;
  const [open, setOpen] = useState(true);
  const [hover, setHover] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const tsRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    let raf;
    let start;
    const tick = (t) => {
      if (!start) start = t;
      const delta = t - start;
      if (!hover) {
        setElapsed((e) => Math.min(duration, e + delta));
      }
      start = t;
      if (elapsed < duration) raf = requestAnimationFrame(tick);
      else {
        setOpen(false);
        setTimeout(onClose, 200); // allow exit animation
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hover, duration, elapsed, onClose, open]);

  useEffect(() => {
    tsRef.current = Date.now();
  }, []);

  const pct = Math.max(0, Math.min(100, (elapsed / duration) * 100));

  const styleByType = {
    success: {
      ring: "ring-1 ring-green-300",
      bg: "bg-white",
      bar: "bg-green-500",
      dot: "bg-green-500",
      icon: SuccessIcon,
      badge: "text-green-700",
    },
    error: {
      ring: "ring-1 ring-red-300",
      bg: "bg-white",
      bar: "bg-red-500",
      dot: "bg-red-500",
      icon: ErrorIcon,
      badge: "text-red-700",
    },
    warning: {
      ring: "ring-1 ring-amber-300",
      bg: "bg-white",
      bar: "bg-amber-500",
      dot: "bg-amber-500",
      icon: WarningIcon,
      badge: "text-amber-700",
    },
    info: {
      ring: "ring-1 ring-blue-300",
      bg: "bg-white",
      bar: "bg-blue-500",
      dot: "bg-blue-500",
      icon: InfoIcon,
      badge: "text-blue-700",
    },
  }[type || "info"]; 

  const Icon = styleByType.icon;
  const pos = positionClasses(position);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`pointer-events-auto ${styleByType.bg} ${styleByType.ring} shadow-xl rounded-2xl px-4 py-3 w-full sm:w-[380px] transition-all duration-200 ${
        open ? pos.enter : pos.leave
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className={`mt-1 inline-flex size-2 rounded-full ${styleByType.dot}`}></span>
        <div className="flex-1 min-w-0">
          {title && <div className={`text-sm font-semibold ${styleByType.badge}`}>{title}</div>}
          {message && (
            <div className="text-sm text-gray-700 leading-relaxed break-words">{message}</div>
          )}
          {action?.label && (
            <div className="mt-2">
              <button
                onClick={() => { action.onClick?.(); onClose(); }}
                className="text-sm underline underline-offset-2"
              >
                {action.label}
              </button>
            </div>
          )}
          <div className="mt-2 h-1 w-full rounded-full bg-gray-200 overflow-hidden">
            <div className={`h-full ${styleByType.bar}`} style={{ width: `${100 - pct}%` }} />
          </div>
        </div>
        <button
          onClick={() => { setOpen(false); setTimeout(onClose, 180); }}
          className="ml-2 shrink-0 rounded-lg p-1 hover:bg-gray-100 focus:outline-none"
          aria-label="Close notification"
        >
          <Icon className="size-5 opacity-60" variant="x" />
        </button>
      </div>
    </div>
  );
}

function positionClasses(position) {
  const map = {
    "top-right": {
      wrapper: "top-4 right-4 items-end",
      enter: "opacity-100 translate-y-0 scale-100",
      leave: "opacity-0 translate-y-2 scale-95",
    },
    "top-left": {
      wrapper: "top-4 left-4 items-start",
      enter: "opacity-100 translate-y-0 scale-100",
      leave: "opacity-0 translate-y-2 scale-95",
    },
    "bottom-right": {
      wrapper: "bottom-4 right-4 items-end",
      enter: "opacity-100 -translate-y-0 scale-100",
      leave: "opacity-0 translate-y-2 scale-95",
    },
    "bottom-left": {
      wrapper: "bottom-4 left-4 items-start",
      enter: "opacity-100 -translate-y-0 scale-100",
      leave: "opacity-0 translate-y-2 scale-95",
    },
  };
  return map[position] || map["top-right"];
}

// --- Minimal icons (outline) ---
function IconBase({ children, className = "", ...rest }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} {...rest}>
      {children}
    </svg>
  );
}
function SuccessIcon({ className, variant }) {
  if (variant === "x") return (
    <IconBase className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></IconBase>
  );
  return (
    <IconBase className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></IconBase>
  );
}
function ErrorIcon({ className, variant }) {
  if (variant === "x") return (
    <IconBase className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></IconBase>
  );
  return (
    <IconBase className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></IconBase>
  );
}
function InfoIcon({ className, variant }) {
  if (variant === "x") return (
    <IconBase className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></IconBase>
  );
  return (
    <IconBase className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 6a9 9 0 100 12 9 9 0 000-12z"/></IconBase>
  );
}
function WarningIcon({ className, variant }) {
  if (variant === "x") return (
    <IconBase className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></IconBase>
  );
  return (
    <IconBase className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></IconBase>
  );
}
