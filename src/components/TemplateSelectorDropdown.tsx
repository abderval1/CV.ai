import React, { useState, useRef, useEffect } from 'react';
import { TemplateStyle } from '../types/cv';
import { CV_TEMPLATES, getTemplateById } from '../data/templateCatalog';
import {
  ChevronDown,
  Camera,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Check,
  Briefcase
} from 'lucide-react';

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentTemplate = getTemplateById(currentStyle);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const photoTemplates = CV_TEMPLATES.filter((t) => t.category === 'with_photo' || t.category === 'hybrid');
  const withoutPhotoTemplates = CV_TEMPLATES.filter((t) => t.category === 'without_photo');

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-400"
          title="Selecionar modelo de currículo com ou sem foto"
        >
          <div className="flex items-center gap-1.5">
            {currentTemplate.hasPhoto ? (
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
            <span className="font-bold text-slate-900">{currentTemplate.shortName}</span>
            <span
              className={`hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                currentTemplate.hasPhoto
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {currentTemplate.hasPhoto ? 'Com Foto' : 'Sem Foto (ATS)'}
            </span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Quick Guide Trigger Button */}
        <button
          type="button"
          onClick={onOpenAdvisorModal}
          className="px-2 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 bg-white rounded-lg transition-colors flex items-center gap-1"
          title="Ver guia de quando e onde usar cada modelo de currículo"
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden md:inline text-[11px] font-semibold">Onde Usar?</span>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-80 sm:w-96 rounded-xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Modelos Oficiais de Currículo</span>
              </div>
              <p className="text-[10px] text-slate-300 mt-0.5">
                Selecione o formato ideal para o país e setor da sua vaga
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAdvisorModal();
              }}
              className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-bold px-2 py-1 rounded transition-colors"
            >
              Guia Completo
            </button>
          </div>

          <div className="max-h-[380px] overflow-y-auto p-2 space-y-3 divide-y divide-slate-100">
            {/* Group 1: Com Foto */}
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                <Camera className="w-3 h-3 text-blue-600" />
                <span>Modelos Com Foto (Europa Continental & Design)</span>
              </div>
              <div className="space-y-1 mt-1">
                {photoTemplates.map((item) => {
                  const isSelected = currentStyle === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectStyle(item.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg transition-colors flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-blue-50 border border-blue-200 text-blue-900'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {item.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-blue-100 text-blue-800">
                            {item.atsScore}% ATS
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.regions.join(' · ')}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          🎯 {item.bestForIndustries[0]}
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Group 2: Sem Foto / ATS Puro */}
            <div className="pt-2">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Modelos Sem Foto (ATS Estrito EUA/UK & Executivo)</span>
              </div>
              <div className="space-y-1 mt-1">
                {withoutPhotoTemplates.map((item) => {
                  const isSelected = currentStyle === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectStyle(item.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg transition-colors flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {item.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-100 text-emerald-800">
                            {item.atsScore}% ATS
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.regions.join(' · ')}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          🎯 {item.bestForIndustries[0]}
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Guide Callout */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-600">
              Dúvida sobre o país ou ATS da vaga?
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAdvisorModal();
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 underline underline-offset-2 flex items-center gap-1"
            >
              <span>Ver Guia Completo</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
