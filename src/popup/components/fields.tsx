import { useState, type ReactNode } from 'react';
import { X } from '@phosphor-icons/react';

export function Field({
  label,
  help,
  error,
  children,
}: {
  label: string;
  help?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">{label}</span>
      {children}
      {help && !error && <span className="text-[11px] text-zinc-500">{help}</span>}
      {error && <span className="text-[11px] text-amber-300">{error}</span>}
    </label>
  );
}

const inputCls =
  'w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-accent/50';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} resize-none`} rows={3} />;
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  prefix,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  prefix?: string;
}) {
  return (
    <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900 focus-within:border-accent/50">
      {prefix && <span className="pl-2.5 font-mono text-sm text-zinc-500">{prefix}</span>}
      <input
        type="number"
        min={min}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-transparent px-2.5 py-1.5 font-mono text-sm text-zinc-100 outline-none"
      />
    </div>
  );
}

export function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors ${
        checked ? 'justify-end bg-accent-fill' : 'justify-start bg-zinc-700'
      }`}
    >
      <span className="h-4 w-4 rounded-full bg-zinc-950" />
    </button>
  );
}

export function Slider({
  value,
  onChange,
  min = 1,
  max = 10,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-accent"
      />
      <span className="w-8 shrink-0 text-right font-mono text-sm text-zinc-200">{value}</span>
    </div>
  );
}

export function TagsInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const commit = () => {
    const t = draft.trim();
    if (t && !values.includes(t)) onChange([...values, t]);
    setDraft('');
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 focus-within:border-accent/50">
      {values.map((v) => (
        <span
          key={v}
          className="inline-flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-200"
        >
          {v}
          <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}>
            <X size={10} weight="bold" className="text-zinc-400 hover:text-zinc-100" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Backspace' && !draft && values.length) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={commit}
        placeholder={values.length ? '' : placeholder}
        className="min-w-[6rem] flex-1 bg-transparent py-0.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
      />
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-zinc-800 px-4 py-4">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </h3>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function ToggleRow({
  label,
  help,
  checked,
  onChange,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col">
        <span className="text-sm text-zinc-200">{label}</span>
        {help && <span className="text-[11px] text-zinc-500">{help}</span>}
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}
