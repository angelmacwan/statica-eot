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
      case 'PRODUCTION':
      case 'TESTED':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
          label: status === 'verified-source' ? 'VERIFIED' : status === 'TESTED' ? 'TESTED' : 'PASS',
        };
      case 'FAIL':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
          label: 'FAIL',
        };
      case 'WARNING':
      case 'ENGINEERING REVIEW REQUIRED':
      case 'engineering-review-required':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-700',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
          label: status === 'WARNING' ? 'WARNING' : 'REVIEW REQ',
        };
      case 'READY':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-700',
          icon: <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
          label: 'READY',
        };
      case 'not-implemented':
      case 'NOT IMPLEMENTED':
        return {
          bg: 'bg-slate-100 border-slate-200 text-slate-500',
          icon: <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
          label: 'NOT IMPLEMENTED',
        };
      default:
        return {
          bg: 'bg-slate-100 border-slate-200 text-slate-600',
          icon: <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
          label: String(status),
        };
    }
  };

  const config = getBadgeConfig();
  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-[11px]' : size === 'lg' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${config.bg} ${sizeClasses} shadow-sm`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
