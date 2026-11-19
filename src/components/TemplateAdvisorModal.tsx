import React, { useState } from 'react';
import { CVData, TemplateStyle } from '../types/cv';
import { CV_TEMPLATES, CVTemplateInfo } from '../data/templateCatalog';
import {
  Check,
  Globe,
  ShieldCheck,
  Award,
  Info,
  X,
  Camera,
  Ban,
  Building2,
  GraduationCap,
  Briefcase,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { EDITOR_UI_TRANSLATIONS, TEMPLATE_CATALOG_I18N } from '../i18n/editorUiTranslations';

interface TemplateAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemplateId: TemplateStyle;
  onSelectTemplate: (templateId: TemplateStyle) => void;
  cv: CVData;
  onUpdateCV: (cv: CVData) => void;
  onOpenAuthModal?: (prompt?: string) => void;
  onOpenPricingModal?: (prompt?: string) => void;
}

export const TemplateAdvisorModal: React.FC<TemplateAdvisorModalProps> = ({
  isOpen,
  onClose,
  currentTemplateId,
  onSelectTemplate,
  cv,
  onUpdateCV,
  onOpenAuthModal,
  onOpenPricingModal
}) => {
  const { isAuthenticated, hasActivePlan } = useAuth();
  const { siteLanguage } = useLanguage();
  const ui = (EDITOR_UI_TRANSLATIONS[siteLanguage] || EDITOR_UI_TRANSLATIONS.pt).advisor;
  const tplMetaMap = TEMPLATE_CATALOG_I18N[siteLanguage];
  const getTplMeta = (tpl: CVTemplateInfo) => {
    const loc = tplMetaMap?.[tpl.id];
    return loc ? { ...tpl, ...loc } : tpl;
  };
  const [filter, setFilter] = useState<'all' | 'with_photo' | 'without_photo' | 'executive'>('all');
  const [selectedTemplateForDetail, setSelectedTemplateForDetail] = useState<CVTemplateInfo>(
    CV_TEMPLATES.find((t) => t.id === currentTemplateId) || CV_TEMPLATES[0]
  );
  const [showPhotoRuleGuide, setShowPhotoRuleGuide] = useState<boolean>(false);

  if (!isOpen) return null;

  const filteredTemplates = CV_TEMPLATES.filter((tpl) => {
    if (filter === 'with_photo') return tpl.hasPhoto;
    if (filter === 'without_photo') return !tpl.hasPhoto;
    if (filter === 'executive')
      return (
        tpl.id === 'executive_harvard' ||
        tpl.id === 'un_classic' ||
        tpl.id === 'tech_modern' ||
        tpl.id === 'academic_lattes'
      );
    return true;
  });

  const handleApply = (id: TemplateStyle) => {
    if (!isAuthenticated) {
      onOpenAuthModal?.(ui.authPrompt);
      onClose();
      return;
    }
    if (!hasActivePlan) {
      onOpenPricingModal?.(ui.pricingPrompt);
      onClose();
      return;
    }
    onSelectTemplate(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  {ui.modalTitle}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {ui.badge}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {ui.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Photo Rule Alert Box */}
        <div className="bg-amber-50/80 border-b border-amber-200/80 px-6 py-2.5 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>{ui.goldRuleTitle}</strong> {ui.goldRuleText}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowPhotoRuleGuide(!showPhotoRuleGuide)}
            className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline underline-offset-2 flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {showPhotoRuleGuide ? ui.hideRule : ui.showRule}
          </button>
        </div>

        {/* Extended Educational Accordion if clicked */}
        {showPhotoRuleGuide && (
          <div className="p-4 sm:p-5 bg-amber-50 border-b border-amber-200 text-xs text-amber-950 space-y-3 shrink-0 animate-in fade-in duration-200">
            <h4 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
              <span>⚖️</span> {ui.lawTitle}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-white/80 rounded-lg border border-amber-200">
                <p className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                  <Ban className="w-4 h-4 text-rose-600" />
                  {ui.noPhotoTitle}
                </p>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  {ui.noPhotoDesc}
                </p>
              </div>
              <div className="p-3 bg-white/80 rounded-lg border border-amber-200">
                <p className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                  <Camera className="w-4 h-4 text-blue-600" />
                  {ui.withPhotoTitle}
                </p>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  {ui.withPhotoDesc}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {ui.filterAll} ({CV_TEMPLATES.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('with_photo')}
              className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                filter === 'with_photo'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <span>{ui.filterWithPhoto} ({CV_TEMPLATES.filter((t) => t.hasPhoto).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('without_photo')}
              className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                filter === 'without_photo'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{ui.filterNoPhoto} ({CV_TEMPLATES.filter((t) => !t.hasPhoto).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('executive')}
              className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                filter === 'executive'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-slate-700" />
              <span>{ui.filterExec}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            {ui.activeTemplateLabel}{' '}
            <strong className="text-slate-800">
              {getTplMeta(CV_TEMPLATES.find((t) => t.id === currentTemplateId) || CV_TEMPLATES[0]).name}
            </strong>
          </div>
        </div>

        {/* Main Content Area: Grid of Templates */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((rawTemplate) => {
              const template = getTplMeta(rawTemplate);
              const isSelected = currentTemplateId === template.id;

              return (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplateForDetail(rawTemplate)}
                  className={`relative rounded-xl border p-4 transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Top Badges */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          template.hasPhoto
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {template.hasPhoto ? (
                          <Camera className="w-3 h-3 text-blue-700" />
                        ) : (
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                        )}
                        <span>{template.badge}</span>
                      </span>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {template.atsScore}% ATS
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 flex items-center justify-between">
                      <span>{template.name}</span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </h3>

                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {template.tagline}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-700 block">
                          {ui.whenToUseLabel}
                        </span>
                        <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                          {template.whenToUse}
                        </p>
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold text-slate-700 block">
                          {ui.whereToUseLabel}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.regions.slice(0, 3).map((r, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-2 border border-slate-150">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          {ui.photoRuleLabel}
                        </span>
                        <span className="text-[11px] text-slate-800 font-medium">
                          {template.photoRuleLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApply(template.id);
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs hover:bg-blue-700'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{ui.currentModelBtn}</span>
                        </>
                      ) : (
                        <span>{ui.applyModelBtn}</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Selected Template Deep Dive */}
          {selectedTemplateForDetail && (() => {
            const detailTpl = getTplMeta(selectedTemplateForDetail);
            return (
              <div className="mt-6 bg-slate-900 text-white rounded-xl p-5 border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3 h-8 rounded-full"
                      style={{ backgroundColor: detailTpl.accentColor }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold">
                          {detailTpl.name}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {detailTpl.atsRatingText}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {detailTpl.tagline}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApply(detailTpl.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm shrink-0"
                  >
                    <Check className="w-4 h-4" />
                    <span>{ui.activateModelBtn}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
                  <div>
                    <h5 className="font-semibold text-blue-400 mb-1 flex items-center gap-1.5">
                      <span>🎯</span> {ui.deepWhenTitle}
                    </h5>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {detailTpl.whenToUse}
                    </p>

                    <h5 className="font-semibold text-blue-400 mt-3 mb-1 flex items-center gap-1.5">
                      <span>🌍</span> {ui.deepWhereTitle}
                    </h5>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {detailTpl.whereToUse}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                      <span>📸</span> {ui.deepPhotoTitle}
                    </h5>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {detailTpl.whyPhotoOrNot}
                    </p>

                    <h5 className="font-semibold text-emerald-400 mt-3 mb-1 flex items-center gap-1.5">
                      <span>🏭</span> {ui.deepIndustriesTitle}
                    </h5>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {detailTpl.bestForIndustries.map((ind, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]"
                        >
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-800/80 rounded-lg p-3.5 border border-slate-700/80 flex flex-col justify-between">
                    <div>
                      <h5 className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>{ui.recruiterTipTitle}</span>
                      </h5>
                      <p className="text-slate-200 text-[11px] leading-relaxed italic">
                        "{detailTpl.proTip}"
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-700 text-[10px] text-slate-400">
                      {ui.exportCompatNote}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{ui.footerValidationNote}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            {ui.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
