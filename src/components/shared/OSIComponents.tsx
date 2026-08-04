import React from 'react';
import { motion } from 'framer-motion';
import { osiLayerColor, osiLayerName } from '../../utils/helpers';
import { cn } from '../../utils/helpers';

interface OSILayerBadgeProps {
  layer: number;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
}

export function OSILayerBadge({ layer, showName = true, size = 'md', active = false }: OSILayerBadgeProps) {
  const color = osiLayerColor(layer);
  const name = osiLayerName(layer);

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <motion.span
      animate={active ? { scale: [1, 1.08, 1] } : {}}
      transition={{ duration: 0.4 }}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium border transition-all',
        sizes[size],
        active && 'shadow-lg'
      )}
      style={{
        color: active ? color : `${color}cc`,
        borderColor: active ? color : `${color}40`,
        backgroundColor: active ? `${color}20` : `${color}0a`,
        boxShadow: active ? `0 0 10px ${color}40` : 'none',
      }}
    >
      <span className="font-mono text-[9px]">L{layer}</span>
      {showName && <span>{name}</span>}
    </motion.span>
  );
}

interface OSIStackProps {
  activeLayers?: number[];
  size?: 'compact' | 'full';
}

const OSI_LAYERS = [7, 6, 5, 4, 3, 2, 1];
const LAYER_NAMES: Record<number, { name: string; pdu: string; example: string }> = {
  7: { name: 'Application',  pdu: 'Data',    example: 'HTTP, DNS, FTP' },
  6: { name: 'Presentation', pdu: 'Data',    example: 'TLS/SSL, JPEG' },
  5: { name: 'Session',      pdu: 'Data',    example: 'NetBIOS, RPC' },
  4: { name: 'Transport',    pdu: 'Segment', example: 'TCP, UDP' },
  3: { name: 'Network',      pdu: 'Packet',  example: 'IP, ICMP, BGP' },
  2: { name: 'Data Link',    pdu: 'Frame',   example: 'Ethernet, 802.11' },
  1: { name: 'Physical',     pdu: 'Bit',     example: 'RJ45, Fibre, Radio' },
};

export function OSIStack({ activeLayers = [], size = 'full' }: OSIStackProps) {
  return (
    <div className="space-y-1">
      {OSI_LAYERS.map((layer) => {
        const active = activeLayers.includes(layer);
        const color = osiLayerColor(layer);
        const info = LAYER_NAMES[layer];

        return (
          <motion.div
            key={layer}
            animate={active ? { x: [0, 4, 0], scale: [1, 1.02, 1] } : { x: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'flex items-center gap-3 rounded-lg border transition-all duration-300',
              size === 'compact' ? 'px-2 py-1' : 'px-3 py-2',
              active ? 'border-opacity-60' : 'border-transparent'
            )}
            style={{
              borderColor: active ? color : 'rgba(255,255,255,0.06)',
              backgroundColor: active ? `${color}15` : 'rgba(255,255,255,0.02)',
              boxShadow: active ? `0 0 12px ${color}20` : 'none',
            }}
          >
            {/* Layer number */}
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold font-mono shrink-0"
              style={{
                backgroundColor: active ? color : `${color}20`,
                color: active ? '#fff' : color,
              }}
            >
              {layer}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-sm font-medium',
                    active ? 'text-white' : 'text-slate-400'
                  )}
                >
                  {info.name}
                </span>
                {size === 'full' && (
                  <span
                    className="text-[10px] font-mono border rounded px-1"
                    style={{ color: `${color}aa`, borderColor: `${color}30` }}
                  >
                    {info.pdu}
                  </span>
                )}
              </div>
              {size === 'full' && (
                <div className="text-[11px] text-slate-600 truncate">{info.example}</div>
              )}
            </div>

            {active && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
