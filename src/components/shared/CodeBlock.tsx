import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import { copyToClipboard } from '../../utils/helpers';
import { useToast } from '../../stores/toastStore';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showCopy?: boolean;
  highlight?: number[]; // line numbers to highlight (1-indexed)
}

export default function CodeBlock({
  code,
  language = 'bash',
  filename,
  showCopy = true,
  highlight = [],
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const highlighted = (() => {
    try {
      return Prism.highlight(
        code,
        Prism.languages[language] ?? Prism.languages.bash,
        language
      );
    } catch {
      return code;
    }
  })();

  const lines = highlighted.split('\n');

  const handleCopy = async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopied(true);
      useToast.getState().addToast('Copied to clipboard! 📋', 'success');
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="code-wrapper my-3">
      {/* Header bar */}
      <div className="code-header">
        <div className="flex items-center gap-2">
          {/* Terminal dots */}
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          </div>
          {filename && (
            <span className="text-[11px] text-slate-500 font-mono ml-2">{filename}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600 font-mono">{language}</span>
          {showCopy && (
            <motion.button
              onClick={handleCopy}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-white px-2 py-1 rounded-md hover:bg-white/[0.06] transition-all"
              aria-label="Copy code"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-1 text-emerald-400"
                  >
                    <Check size={12} /> Copied
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-1"
                  >
                    <Copy size={12} /> Copy
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )}
        </div>
      </div>

      {/* Code body */}
      <div className="overflow-x-auto">
        <pre className="text-sm font-mono p-4 leading-relaxed">
          <code>
            {lines.map((line, i) => (
              <div
                key={i}
                className={
                  highlight.includes(i + 1)
                    ? 'bg-electric-500/10 -mx-4 px-4 border-l-2 border-electric-500'
                    : undefined
                }
                dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }}
              />
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
