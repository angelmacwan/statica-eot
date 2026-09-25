import React from 'react';
import { CalculationCheck } from '../../engine/types';
import { StatusBadge } from './StatusBadge';

interface CheckTableProps {
  checks: CalculationCheck[];
}

export const CheckTable: React.FC<CheckTableProps> = ({ checks }) => {
  if (!checks || checks.length === 0) {
    return <p className="text-xs text-slate-500 italic">No automated checks configured.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
          <tr>
            <th className="py-2.5 px-3">Check / Parameter</th>
            <th className="py-2.5 px-3">Calculated / Actual</th>
            <th className="py-2.5 px-3">Criterion / Limit</th>
            <th className="py-2.5 px-3 text-center">Status</th>
            <th className="py-2.5 px-3">Engineering Assessment</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
          {checks.map((chk) => (
            <tr key={chk.id} className="hover:bg-slate-800/30 transition">
              <td className="py-2.5 px-3 font-medium text-slate-200">{chk.name}</td>
              <td className="py-2.5 px-3 font-mono text-blue-300">
                {typeof chk.actual === 'number' ? chk.actual.toFixed(3) : chk.actual} {chk.unit || ''}
              </td>
              <td className="py-2.5 px-3 font-mono text-slate-400">
                {chk.required ? `${chk.required} ${chk.unit || ''}` : chk.criterion}
              </td>
              <td className="py-2.5 px-3 text-center">
                <StatusBadge status={chk.status} size="sm" />
              </td>
              <td className="py-2.5 px-3 text-slate-300 leading-snug">{chk.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
