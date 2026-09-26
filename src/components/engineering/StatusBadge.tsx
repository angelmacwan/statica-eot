import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { CheckStatus, CalculationToolStatus, EngineeringReviewStatus } from '../../engine/types';

interface StatusBadgeProps {
  status: CheckStatus | CalculationToolStatus | EngineeringReviewStatus | 'NOT_CONFIGURED' | 'READY' | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showIcon = true }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'PASS':
      case 'verified-source':
        return {
          bg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          label: status === 'verified-source' ? 'VERIFIED SOURCE' : 'PASS',
        };
      case 'FAIL':
        return {
          bg: 'bg-rose-950/60 border-rose-500/40 text-rose-300',
          icon: <XCircle className="w-4 h-4 text-rose-400" />,
          label: 'FAIL',
        };
      case 'WARNING':
      case 'ENGINEERING REVIEW REQUIRED':
      case 'engineering-review-required':
        return {
          bg: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          label: status === 'WARNING' ? 'WARNING' : 'REVIEW REQUIRED',
        };
      case 'READY':
        return {
          bg: 'bg-blue-950/60 border-blue-500/40 text-blue-300',
          icon: <Clock className="w-4 h-4 text-blue-400" />,
          label: 'READY',
        };
      case 'not-implemented':
      case 'NOT IMPLEMENTED':
        return {
          bg: 'bg-slate-800 border-slate-700 text-slate-400',
          icon: <AlertCircle className="w-4 h-4 text-slate-400" />,
          label: 'NOT IMPLEMENTED',
        };
      default:
        return {
          bg: 'bg-slate-800 border-slate-700 text-slate-400',
          icon: <Clock className="w-4 h-4 text-slate-400" />,
          label: String(status),
        };
    }
  };

  const config = getBadgeConfig();
  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded border ${config.bg} ${sizeClasses}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
