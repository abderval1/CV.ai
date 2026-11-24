import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { EDITOR_UI_TRANSLATIONS } from '../i18n/editorUiTranslations';

interface CVWatermarkOverlayProps {
  isVisible: boolean;
}

export const CVWatermarkOverlay: React.FC<CVWatermarkOverlayProps> = ({ isVisible }) => {
  const { siteLanguage } = useLanguage();
  if (!isVisible) return null;

  const ui = (EDITOR_UI_TRANSLATIONS[siteLanguage] || EDITOR_UI_TRANSLATIONS.en).watermark;

  return (
    <div
      className="watermark-overlay absolute inset-0 pointer-events-none select-none overflow-hidden z-20 flex flex-col justify-around items-center py-12"
      aria-hidden="true"
    >
      {/* Top diagonal watermark band */}
      <div className="watermark-band transform -rotate-[26deg] text-center w-[150%] py-3 bg-slate-900/[0.04] border-y border-slate-900/[0.08]">
        <p className="text-lg sm:text-2xl font-black tracking-[0.25em] text-slate-800/40 uppercase font-jakarta">
          {ui.topLine1}
        </p>
        <p className="text-[9px] sm:text-[11px] font-bold tracking-widest text-slate-600/50 uppercase mt-0.5">
          {ui.topLine2}
        </p>
      </div>

      {/* Middle diagonal watermark band */}
      <div className="watermark-band transform -rotate-[26deg] text-center w-[150%] py-3.5 bg-slate-900/[0.05] border-y border-slate-900/[0.10]">
        <p className="text-xl sm:text-3xl font-black tracking-[0.3em] text-slate-900/45 uppercase font-jakarta">
          {ui.midLine1}
        </p>
        <p className="text-[10px] sm:text-xs font-bold tracking-widest text-slate-700/55 uppercase mt-0.5">
          {ui.midLine2}
        </p>
      </div>

      {/* Bottom diagonal watermark band */}
      <div className="watermark-band transform -rotate-[26deg] text-center w-[150%] py-3 bg-slate-900/[0.04] border-y border-slate-900/[0.08]">
        <p className="text-lg sm:text-2xl font-black tracking-[0.25em] text-slate-800/40 uppercase font-jakarta">
          {ui.botLine1}
        </p>
        <p className="text-[9px] sm:text-[11px] font-bold tracking-widest text-slate-600/50 uppercase mt-0.5">
          {ui.botLine2}
        </p>
      </div>
    </div>
  );
};
