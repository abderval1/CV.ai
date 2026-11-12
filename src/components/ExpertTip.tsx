import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Lightbulb, X, Sparkles } from 'lucide-react';

interface ExpertTipProps {
  title: string;
  tip: string;
  example?: string;
  align?: 'left' | 'right';
  compact?: boolean;
}

export const ExpertTip: React.FC<ExpertTipProps> = ({
  title,
  tip,
  example,
  align = 'left',
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove: boolean }>({
    top: 0,
    left: 12,
    width: 300,
    placeAbove: false
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const popoverWidth = Math.min(320, viewportW - 24);

    let left = align === 'right' ? rect.right - popoverWidth : rect.left;
    left = Math.max(12, Math.min(left, viewportW - popoverWidth - 12));

    const spaceBelow = viewportH - rect.bottom;
    const placeAbove = spaceBelow < 210 && rect.top > 220;
    const top = placeAbove ? rect.top - 8 : rect.bottom + 8;

    setCoords({ top, left, width: popoverWidth, placeAbove });
  }, [align]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!popoverRef.current || !popoverRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleReposition = () => updatePosition();

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen, updatePosition]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-expanded={isOpen}
        aria-label={`Dica de Especialista: ${title}`}
        title={`Dica ATS: ${title}`}
        className={
          compact
            ? `inline-flex items-center justify-center w-5 h-5 rounded-md transition-colors cursor-pointer select-none ${
                isOpen
                  ? 'bg-slate-900 text-amber-300'
                  : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
              }`
            : `inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer select-none whitespace-nowrap ${
                isOpen
                  ? 'bg-slate-900 text-amber-300'
                  : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
              }`
        }
      >
        <Lightbulb className={`w-3.5 h-3.5 shrink-0 ${isOpen ? 'text-amber-300' : 'text-amber-500'}`} />
        {!compact && <span>Dica ATS</span>}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="tooltip"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: coords.width,
            transform: coords.placeAbove ? 'translateY(-100%)' : undefined
          }}
          className="z-[70] bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700/90 p-3.5 text-left animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] font-bold text-amber-300 tracking-wide">
                {title}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
              aria-label="Fechar dica"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-200 leading-relaxed mt-2 font-normal">
            {tip}
          </p>

          {example && (
            <div className="mt-2.5 p-2 rounded-lg bg-slate-950/90 border border-slate-800 text-[10px] text-emerald-300 font-mono leading-relaxed break-words">
              <span className="text-slate-400 font-sans font-semibold block mb-0.5">
                Exemplo recomendado:
              </span>
              {example}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
