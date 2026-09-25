import React, { useState } from 'react';
import { CalculationStep, SourceLineage } from '../../engine/types';
import { ChevronDown, ChevronRight, FileSpreadsheet, Code2 } from 'lucide-react';

interface CalculationTraceViewProps {
  steps: CalculationStep[];
  sourceLineage?: SourceLineage;
}

export const CalculationTraceView: React.FC<CalculationTraceViewProps> = ({
  steps,
  sourceLineage,
}) => {
  const [expanded, setExpanded] = useState(true);

  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3.5 bg-slate-950/70 hover:bg-slate-950 transition text-left"
      >
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Calculation Trace & Methodology ({steps.length} Steps)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {sourceLineage && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
              {sourceLineage.sheet}
            </span>
          )}
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-3.5 divide-y divide-slate-800/60">
          {steps.map((step, idx) => (
            <div key={step.id || idx} className={idx > 0 ? 'pt-3.5' : ''}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-300">
                  {idx + 1}. {step.label}
                </span>
                {step.sourceCell && (
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    Cell: {step.sourceCell}
                  </span>
                )}
              </div>

              {step.formulaText && (
                <div className="text-xs font-mono text-blue-300/90 bg-slate-950/80 p-2 rounded border border-slate-800/80 mb-1.5">
                  <span className="text-slate-500 mr-2">Formula:</span>
                  {step.formulaText}
                </div>
              )}

              <div className="text-xs font-mono text-emerald-300/90 bg-slate-950/60 p-2 rounded border border-slate-800/50">
                <span className="text-slate-500 mr-2">Substitution:</span>
                {step.substitutedExpression}
              </div>

              {step.variables && Object.keys(step.variables).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(step.variables).map(([name, val]) => (
                    <span
                      key={name}
                      className="text-[11px] font-mono text-slate-400 bg-slate-800/40 px-2 py-0.5 rounded border border-slate-800"
                    >
                      <strong className="text-slate-300">{name}</strong>: {String(val.value)}{' '}
                      {val.unit || ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
