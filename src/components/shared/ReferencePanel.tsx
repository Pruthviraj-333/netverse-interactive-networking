import React from 'react';
import { ExternalLink, FileText, Server, Cloud } from 'lucide-react';
import type { Reference } from '../../types';
import { cn } from '../../utils/helpers';

const TYPE_CONFIG: Record<Reference['type'], { label: string; color: string; icon: React.ReactNode }> = {
  rfc:      { label: 'RFC',        color: '#f59e0b', icon: <FileText size={12} /> },
  ietf:     { label: 'IETF',       color: '#f59e0b', icon: <FileText size={12} /> },
  cisco:    { label: 'Cisco',      color: '#3b82f6', icon: <Server size={12} /> },
  linux:    { label: 'Linux',      color: '#10b981', icon: <Server size={12} /> },
  aws:      { label: 'AWS',        color: '#f97316', icon: <Cloud size={12} /> },
  azure:    { label: 'Azure',      color: '#60a5fa', icon: <Cloud size={12} /> },
  gcp:      { label: 'GCP',        color: '#34d399', icon: <Cloud size={12} /> },
  k8s:      { label: 'Kubernetes', color: '#818cf8', icon: <Cloud size={12} /> },
  official: { label: 'Official',   color: '#94a3b8', icon: <ExternalLink size={12} /> },
};

interface ReferencePanelProps {
  references: Reference[];
  className?: string;
}

export default function ReferencePanel({ references, className }: ReferencePanelProps) {
  if (references.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
        <FileText size={14} className="text-slate-500" />
        References &amp; Further Reading
      </h4>

      <div className="grid gap-2">
        {references.map((ref, i) => {
          const config = TYPE_CONFIG[ref.type] ?? TYPE_CONFIG.official;
          return (
            <a
              key={i}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 px-3 py-2.5 glass rounded-lg hover:bg-white/[0.06] transition-all group"
            >
              {/* Type badge */}
              <span
                className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 mt-0.5"
                style={{
                  color: config.color,
                  borderColor: `${config.color}40`,
                  backgroundColor: `${config.color}10`,
                }}
              >
                {config.icon}
                {ref.rfcNumber ? `RFC ${ref.rfcNumber}` : config.label}
              </span>

              {/* Title + description */}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-300 group-hover:text-white transition-colors line-clamp-1">
                  {ref.title}
                </div>
                {ref.description && (
                  <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{ref.description}</div>
                )}
              </div>

              <ExternalLink size={13} className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0 mt-0.5" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
