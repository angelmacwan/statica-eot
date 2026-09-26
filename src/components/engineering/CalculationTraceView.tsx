import React, { useState } from 'react';
import { CalculationStep, SourceLineage } from '../../engine/types';
import { ChevronDown, ChevronRight, FileSpreadsheet, Code2 } from 'lucide-react';

interface CalculationTraceViewProps {
  steps: CalculationStep[];
  sourceLineage?: SourceLineage;
}

export const CalculationTraceView: React.FC<CalculationTraceViewProps> = ({ steps, sourceLineage }) => {
  const [expanded, setExpanded] = useState(false);

  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-slate-50/70 hover:bg-slate-100/60 transition text-left"
      >
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-700">
            Formulas & Step-by-Step Calculation Trace ({steps.length} Steps)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {sourceLineage && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
              <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
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
        <div className="p-4 space-y-3.5 divide-y divide-slate-100">
          {steps.map((step, idx) => (
            <div key={step.id || idx} className={idx > 0 ? 'pt-3.5' : ''}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-800">
                  {idx + 1}. {step.label}
                </span>
                {step.sourceCell && (
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    Cell: {step.sourceCell}
                  </span>
                )}
              </div>

              {step.formulaText && (
                <div className="text-xs font-mono text-slate-800 bg-slate-50 p-2 rounded-md border border-slate-200/90 mb-1.5">
                  <span className="text-slate-400 mr-2 font-sans font-medium">Formula:</span>
                  {step.formulaText}
                </div>
              )}

              <div className="text-xs font-mono text-emerald-800 bg-emerald-50/50 p-2 rounded-md border border-emerald-200/70">
                <span className="text-emerald-600 mr-2 font-sans font-medium">Substituted:</span>
                {step.substitutedExpression}
              </div>

              {step.variables && Object.keys(step.variables).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(step.variables).map(([name, val]) => (
                    <span
                      key={name}
                      className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200"
                    >
                      <strong className="text-slate-700">{name}</strong>: {String(val.value)} {val.unit || ''}
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
