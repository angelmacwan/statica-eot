import React, { useState } from 'react';
import { Download, FileCode, Check, Eye } from 'lucide-react';
import { downloadDxf } from '../../engine/drawing/dxfBuilder';

export interface DrawingPreviewProps {
  svg: string;
  dxf: string;
  filename: string;
  title: string;
  description?: string;
  className?: string;
}

export const DrawingPreview: React.FC<DrawingPreviewProps> = ({
  svg,
  dxf,
  filename,
  title,
  description,
  className = '',
}) => {
  const [downloaded, setDownloaded] = useState(false);

  const handleExportDxf = () => {
    downloadDxf(dxf, filename);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const handleDownloadSvg = () => {
    if (typeof window === 'undefined') return;
    const safeName = filename.endsWith('.svg') ? filename : `${filename}.svg`;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm space-y-4 print:border-none print:shadow-none print:p-2 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-sky-600 print:hidden" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {title}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
              CAD Preview
            </span>
          </div>
          {description && (
            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 print:hidden shrink-0">
          <button
            type="button"
            onClick={handleDownloadSvg}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
            title="Download SVG vector graphic"
          >
            <Download className="w-3.5 h-3.5" />
            <span>SVG</span>
          </button>

          <button
            type="button"
            onClick={handleExportDxf}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition shadow-xs"
            title="Download AutoCAD R12 DXF file with millimeter units"
          >
            {downloaded ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Downloaded</span>
              </>
            ) : (
              <>
                <FileCode className="w-3.5 h-3.5 text-slate-300" />
                <span>Export DXF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full bg-slate-50/50 border border-slate-200 rounded-xl overflow-hidden p-4 flex items-center justify-center min-h-[300px] print:bg-white print:border-none print:p-0">
        <div
          className="w-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[480px] [&>svg]:mx-auto"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono print:hidden pt-1">
        <span>Units: Millimeters (mm) · Standard: IS 3177 / IS 807</span>
        <span>AutoCAD R12 ASCII DXF Compatible</span>
      </div>
    </div>
  );
};
