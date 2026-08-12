import {
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Check, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { validateImageFile } from '../../lib/adminValidation';

export function AdminField({
  label,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('flex flex-col gap-1.5 text-start', className)}>
      <span className="text-[12px] font-medium text-ink">{label}</span>
      {children}
      {error ? (
        <span className="flex items-center gap-1 text-[11px] text-red-600">
          <AlertCircle size={11} />
          {error}
        </span>
      ) : hint ? (
        <span className="text-[11px] text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

const inputBase =
  'w-full border bg-bg-light px-3.5 py-2.5 text-[13px] text-ink outline-none transition placeholder:text-muted/50 focus:border-ink/40 disabled:opacity-60';

export function AdminInput({
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      {...props}
      className={cn(
        inputBase,
        error ? 'border-red-400 bg-red-50/40' : 'border-ink/15',
        className
      )}
    />
  );
}

export function AdminTextarea({
  error,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return (
    <textarea
      {...props}
      className={cn(
        inputBase,
        'min-h-[96px] resize-y leading-relaxed',
        error ? 'border-red-400 bg-red-50/40' : 'border-ink/15',
        className
      )}
    />
  );
}

export function AdminSelect({
  error,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select
      {...props}
      className={cn(
        inputBase,
        error ? 'border-red-400 bg-red-50/40' : 'border-ink/15',
        className
      )}
    >
      {children}
    </select>
  );
}

export function AdminDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide,
  isRtl = false,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  isRtl?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const off = isRtl ? '-100%' : '100%';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className={cn('fixed inset-0 z-[80] flex', isRtl ? 'justify-start' : 'justify-end')}>
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-bg-dark/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal
            aria-labelledby="admin-drawer-title"
            initial={{ x: off }}
            animate={{ x: 0 }}
            exit={{ x: off }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative z-10 flex h-full w-full flex-col border-ink/10 bg-bg-light shadow-[var(--shadow-float)]',
              isRtl ? 'border-e' : 'border-s',
              wide ? 'max-w-2xl' : 'max-w-xl'
            )}
          >
            <header className="flex items-start justify-between gap-4 border-b border-ink/10 px-6 py-5">
              <div>
                <h2 id="admin-drawer-title" className="font-display text-2xl text-ink">
                  {title}
                </h2>
                {subtitle && <p className="mt-1 text-[12px] text-muted">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center border border-ink/15 text-ink transition hover:border-ink hover:bg-ink hover:text-bg-light"
              >
                <X size={16} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
            {footer && (
              <footer className="sticky bottom-0 border-t border-ink/10 bg-bg-light px-6 py-4">
                {footer}
              </footer>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export function AdminConfirm({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.button
            type="button"
            className="absolute inset-0 bg-bg-dark/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            aria-label="Dismiss"
          />
          <motion.div
            role="alertdialog"
            aria-modal
            aria-labelledby="admin-confirm-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md border border-ink/10 bg-bg-light p-7 shadow-[var(--shadow-float)]"
          >
            <h3 id="admin-confirm-title" className="font-display text-2xl text-ink">
              {title}
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">{message}</p>
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 border border-ink/15 px-4 py-2.5 text-[13px] font-medium text-ink transition hover:border-ink"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={cn(
                  'flex-1 px-4 py-2.5 text-[13px] font-medium text-bg-light transition',
                  destructive ? 'bg-red-700 hover:bg-red-800' : 'bg-ink hover:bg-bronze'
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function AdminToast({
  saving,
  success,
  error,
}: {
  saving?: string | null;
  success?: string | null;
  error?: string | null;
}) {
  const msg = saving || success || error;
  const tone = saving ? 'ink' : error ? 'error' : 'ok';
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={cn(
            'fixed start-1/2 top-5 z-[100] flex -translate-x-1/2 items-center gap-3 border px-5 py-3 shadow-[var(--shadow-soft)]',
            tone === 'error' && 'border-red-200 bg-white text-ink',
            tone === 'ok' && 'border-ink/10 bg-white text-ink',
            tone === 'ink' && 'border-ink/20 bg-bg-dark text-bg-light'
          )}
        >
          {saving ? (
            <span className="h-4 w-4 animate-spin border-2 border-gold border-t-transparent" />
          ) : error ? (
            <AlertCircle size={16} className="text-red-600" />
          ) : (
            <Check size={16} className="text-bronze" />
          )}
          <span className="text-[13px] font-medium whitespace-nowrap">{msg}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AdminDropzone({
  image,
  onSet,
  onClear,
  label,
  error,
  isRtl,
}: {
  image?: string;
  onSet: (dataUrl: string) => void;
  onClear: () => void;
  label: string;
  error?: string;
  isRtl: boolean;
}) {
  const id = useId();
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const read = (file: File) => {
    const err = validateImageFile(file, isRtl);
    if (err) {
      setLocalError(err);
      return;
    }
    setLocalError(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) onSet(evt.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const showError = error || localError;

  return (
    <div className="space-y-1.5 md:col-span-2">
      <p className="text-[12px] font-medium text-ink">{label}</p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) read(file);
        }}
        className={cn(
          'relative border border-dashed p-6 text-center transition',
          dragOver ? 'border-bronze bg-bronze/5' : showError ? 'border-red-400 bg-red-50/30' : 'border-ink/20 bg-bg-warm/30'
        )}
      >
        <input
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="absolute inset-0 z-10 cursor-pointer opacity-0"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) read(file);
          }}
        />
        {image ? (
          <div className="relative z-20 space-y-3">
            <img
              src={image}
              alt="Preview"
              className="mx-auto max-h-44 border border-ink/10 object-cover"
            />
            <div className="flex justify-center gap-3">
              <label
                htmlFor={id}
                className="cursor-pointer text-[12px] font-medium text-bronze underline"
              >
                {isRtl ? 'استبدال' : 'Replace'}
              </label>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClear();
                }}
                className="relative z-30 text-[12px] font-medium text-red-700 underline"
              >
                {isRtl ? 'إزالة' : 'Remove'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 py-4">
            <ImageIcon className="mx-auto text-muted" size={28} />
            <p className="text-[13px] text-ink-soft">
              {isRtl ? 'اسحب الصورة هنا أو اضغط للاختيار' : 'Drop an image here, or click to browse'}
            </p>
            <p className="text-[11px] text-muted">PNG, JPG, WEBP · max 2MB</p>
          </div>
        )}
      </div>
      {showError && (
        <span className="flex items-center gap-1 text-[11px] text-red-600">
          <AlertCircle size={11} />
          {showError}
        </span>
      )}
    </div>
  );
}