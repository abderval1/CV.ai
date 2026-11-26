import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TemplateStyle } from '../types/cv';
import { CV_TEMPLATES, getTemplateById } from '../data/templateCatalog';
import { getStoredTemplatesSync, trackFrontendTelemetry } from '../services/adminModulesService';
import {
  ChevronDown,
  Camera,
  ShieldCheck,
  FileText,
  Check
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { EDITOR_UI_TRANSLATIONS, TEMPLATE_CATALOG_I18N } from '../i18n/editorUiTranslations';

interface TemplateSelectorDropdownProps {
  currentStyle: TemplateStyle;
  onSelectStyle: (style: TemplateStyle) => void;
  onOpenAdvisorModal: () => void;
  className?: string;
}

export const TemplateSelectorDropdown: React.FC<TemplateSelectorDropdownProps> = ({
  currentStyle,
  onSelectStyle,
  onOpenAdvisorModal,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({
    top: 64,
    left: 12,
    width: 340
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { siteLanguage } = useLanguage();
  const ui = (EDITOR_UI_TRANSLATIONS[siteLanguage] || EDITOR_UI_TRANSLATIONS.en).dropdown;
  const tplMetaMap = TEMPLATE_CATALOG_I18N[siteLanguage];
  const getTplMeta = <T extends { id: TemplateStyle }>(tpl: T): T => {
    const loc = tplMetaMap?.[tpl.id];
    return loc ? { ...tpl, ...loc } : tpl;
  };

  const currentTemplate = getTplMeta(getTemplateById(currentStyle));
  const [adminCatalog, setAdminCatalog] = useState(() => getStoredTemplatesSync());

  useEffect(() => {
    const syncHandler = () => setAdminCatalog(getStoredTemplatesSync());
    window.addEventListener('admin-config-updated', syncHandler);
    return () => window.removeEventListener('admin-config-updated', syncHandler);
  }, []);

  const adminConfigMap = new Map(adminCatalog.map((t) => [t.id, t]));

  const allTemplates = CV_TEMPLATES.filter((t) => {
    const config = adminConfigMap.get(t.id);
    return config ? config.isActive : true;
  }).sort((a, b) => {
    const ordA = adminConfigMap.get(a.id)?.displayOrder ?? 999;
    const ordB = adminConfigMap.get(b.id)?.displayOrder ?? 999;
    return ordA - ordB;
  });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const margin = 12;
    const menuWidth = Math.min(360, viewportW - margin * 2);
    const left = Math.max(margin, Math.min(rect.left, viewportW - menuWidth - margin));
    const maxMenuH = Math.min(440, viewportH - margin * 2);
    const top =
      rect.bottom + 6 + maxMenuH > viewportH - margin && rect.top - 6 - maxMenuH >= margin
        ? rect.top - 6 - maxMenuH
        : Math.min(rect.bottom + 6, viewportH - margin - 200);
    setMenuPos({ top: Math.max(margin, top), left, width: menuWidth });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, updatePosition]);

  const photoTemplates = allTemplates.filter((t) => t.category === 'with_photo' || t.category === 'hybrid');
  const withoutPhotoTemplates = allTemplates.filter((t) => t.category === 'without_photo');

  const renderTemplateButton = (rawItem: typeof allTemplates[number], isPhotoGroup: boolean) => {
    const item = getTplMeta(rawItem);
    const isSelected = currentStyle === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          trackFrontendTelemetry({ type: 'template_selected', templateStyle: item.id });
          onSelectStyle(item.id);
          setIsOpen(false);
        }}
        className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-center justify-between gap-2 min-h-[44px] touch-manipulation ${
          isSelected
            ? isPhotoGroup
              ? 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-100'
              : 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {item.name}
            </span>
            <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
              {item.atsScore}% ATS
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {item.regions.slice(0, 2).join(' · ')}
          </p>
        </div>
        {isSelected && (
          <Check
            className={`w-4 h-4 shrink-0 ${
              isPhotoGroup ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          />
        )}
      </button>
    );
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="min-h-[38px] flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
        title={ui.triggerTitle}
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            currentTemplate.hasPhoto ? 'bg-blue-500' : 'bg-emerald-500'
          }`}
        />
        <span className="font-bold text-slate-900 dark:text-white truncate max-w-[155px] sm:max-w-[200px]">
          {currentTemplate.shortName}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 transition-transform shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-950/15 sm:bg-transparent"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={menuRef}
            role="listbox"
            style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
            className="fixed z-60 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-3 py-2.5 bg-slate-900 text-white flex items-center justify-between gap-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 min-w-0">
                <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-xs font-bold truncate">{ui.menuTitle}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenAdvisorModal();
                }}
                className="text-[11px] bg-white/10 hover:bg-white/20 text-white font-semibold px-2.5 py-1 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                {ui.whereToUseBtn}
              </button>
            </div>

            <div className="max-h-[62dvh] sm:max-h-[380px] overflow-y-auto p-2 space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800">
              <div>
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  <span>{ui.noPhotoGroupTitle}</span>
                </div>
                <div className="space-y-0.5 mt-1">
                  {withoutPhotoTemplates.map((rawItem) => renderTemplateButton(rawItem, false))}
                </div>
              </div>

              <div className="pt-2">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <Camera className="w-3 h-3 shrink-0" />
                  <span>{ui.photoGroupTitle}</span>
                </div>
                <div className="space-y-0.5 mt-1">
                  {photoTemplates.map((rawItem) => renderTemplateButton(rawItem, true))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
