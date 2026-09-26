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
    <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-white border border-slate-200/90 shadow-sm hover:border-slate-300 transition group">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-slate-700 truncate">{label}</label>
        {unit && (
          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
            {unit}
          </span>
        )}
      </div>

      {type === 'select' && options ? (
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-2.5 py-1.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-md text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:opacity-50 transition shadow-sm"
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
          className="w-full px-2.5 py-1.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-md text-slate-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:opacity-50 transition shadow-sm"
        />
      ) : (
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-2.5 py-1.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-md text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:opacity-50 transition shadow-sm"
        />
      )}

      {description && <p className="text-[11px] text-slate-500 leading-tight">{description}</p>}
    </div>
  );
};
