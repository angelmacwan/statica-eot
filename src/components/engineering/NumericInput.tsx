import React from 'react';
import { InputDefinition } from '../../engine/types';

interface NumericInputProps {
  definition: InputDefinition;
  value: any;
  onChange: (val: any) => void;
  disabled?: boolean;
}

export const NumericInput: React.FC<NumericInputProps> = ({ definition, value, onChange, disabled = false }) => {
  const { label, unit, type, options, description, min, max, step } = definition;

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{label}</label>
        {unit && (
          <span className="text-xs font-mono text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-800/40">
            {unit}
          </span>
        )}
      </div>

      {type === 'select' && options ? (
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
        >
          {options.map((opt) => (
            <option key={String(opt.value)} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'number' ? (
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => {
            const v = e.target.value === '' ? '' : Number(e.target.value);
            onChange(v);
          }}
          min={min}
          max={max}
          step={step || 'any'}
          disabled={disabled}
          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
      ) : (
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
      )}

      {description && <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{description}</p>}
    </div>
  );
};
