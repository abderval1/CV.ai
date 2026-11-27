import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CVData, TemplateStyle, CVSectionKey } from '../types/cv';
import {
  Download,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Edit3,
  Eye,
  Camera,
  Info,
  ShieldCheck,
  Globe,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  UserCheck,
  AlertTriangle,
  Terminal,
  BookOpen,
  Sliders,
  Palette,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Linkedin
} from 'lucide-react';
import { TemplateSelectorDropdown } from './TemplateSelectorDropdown';
import { TemplateAdvisorModal } from './TemplateAdvisorModal';
import { PhotoManagerModal } from './PhotoManagerModal';
import { MultiLanguageDownloadModal } from './MultiLanguageDownloadModal';
import { CVWatermarkOverlay } from './CVWatermarkOverlay';
import { getTemplateById } from '../data/templateCatalog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage, LanguageCode } from '../context/LanguageContext';
import {
  SECTION_TITLES_BY_LANG,
  getResolvedSectionTitles,
  resolveTemplateStyleProfile,
  resolveEffectiveSectionOrder,
  getSurfaceContrastPalette,
  extractCefrGrade,
  EUROPASS_UI_LABELS
} from '../utils/cvDocumentLabels';
import { getStoredPlatformSettingsSync } from '../services/adminModulesService';
import { recordAuditLog } from '../services/auditLogService';
import { dispatchUserNotification } from '../services/notificationService';

interface CVDocumentViewProps {
  cv: CVData;
  onChange: (updatedCV: CVData) => void;
  onExportWord: () => void;
  isExportingWord: boolean;
  onOpenAuthModal?: (promptMessage?: string) => void;
  onOpenPricingModal?: (promptMessage?: string) => void;
  density?: 'compact' | 'normal' | 'relaxed';
  onDensityChange?: (density: 'compact' | 'normal' | 'relaxed') => void;
  onSelectLanguage?: (lang: LanguageCode) => void;
  isTranslatingContent?: boolean;
  translatingTargetLang?: LanguageCode | null;
  contentLanguage?: LanguageCode;
}

const ACCENT_COLORS = [
  { id: 'slate', name: 'Grafite Executivo', hex: '#0f172a' },
  { id: 'navy', name: 'Azul Corporativo Global', hex: '#1e3a8a' },
  { id: 'blue', name: 'Azul Europeu Europass', hex: '#1d4ed8' },
  { id: 'emerald', name: 'Verde Esmeralda', hex: '#065f46' },
  { id: 'purple', name: 'Púrpura Criativo', hex: '#7c3aed' },
  { id: 'burgundy', name: 'Harvard Burgundy', hex: '#831843' },
  { id: 'teal', name: 'Teal Corporativo', hex: '#0f766e' }
];

const HEADER_BAR_PRESETS = [
  { name: 'Cinza Claro Europass', hex: '#eceef1' },
  { name: 'Ardósia Escuro', hex: '#0f172a' },
  { name: 'Azul Marinho', hex: '#1e3a8a' },
  { name: 'Azul Europeu', hex: '#1d4ed8' },
  { name: 'Verde Esmeralda', hex: '#065f46' },
  { name: 'Vinho Executivo', hex: '#831843' },
  { name: 'Branco Puro', hex: '#ffffff' }
];

export const CVDocumentView: React.FC<CVDocumentViewProps> = ({
  cv,
  onChange,
  onExportWord,
  isExportingWord,
  onOpenAuthModal,
  onOpenPricingModal,
  density = 'normal',
  onDensityChange,
  onSelectLanguage,
  isTranslatingContent = false,
  translatingTargetLang = null,
  contentLanguage = 'en'
}) => {
  const { user, isAuthenticated, hasActivePlan } = useAuth();
  const { showSuccess, showWarning, showError } = useToast();
  const { studioText } = useLanguage();
  void onExportWord;
  void isExportingWord;
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [copied, setCopied] = useState<boolean>(false);
  const [isInlineEditing, setIsInlineEditing] = useState<boolean>(false);
  const [jsonImportSuccess, setJsonImportSuccess] = useState<string | null>(null);
  const [docLang, setDocLang] = useState<LanguageCode>(contentLanguage || 'en');
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState<boolean>(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [isMultiLangModalOpen, setIsMultiLangModalOpen] = useState<boolean>(false);
  const [customizationMenuOpen, setCustomizationMenuOpen] = useState<boolean>(false);
  const [colorMenuOpen, setColorMenuOpen] = useState<boolean>(false);
  const [customizationPos, setCustomizationPos] = useState<{ top: number; left: number; width: number }>({
    top: 64,
    left: 12,
    width: 304
  });
  const [langMenuOpen, setLangMenuOpen] = useState<boolean>(false);
  const customizationBtnRef = useRef<HTMLButtonElement>(null);
  const customizationMenuRef = useRef<HTMLDivElement>(null);
  const colorMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const [, setAdminConfigVersion] = useState<number>(0);
  const [platformSettings, setPlatformSettings] = useState(() => getStoredPlatformSettingsSync());

  const updateCustomizationPos = useCallback(() => {
    if (!customizationBtnRef.current) return;
    const rect = customizationBtnRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 12;
    const width = Math.min(312, vw - margin * 2);
    const left = Math.max(margin, Math.min(rect.left, vw - width - margin));
    const top = Math.max(margin, Math.min(rect.bottom + 6, vh - 220));
    setCustomizationPos({ top, left, width });
  }, []);

  useEffect(() => {
    if (!customizationMenuOpen && !langMenuOpen && !colorMenuOpen) return;
    if (customizationMenuOpen) {
      updateCustomizationPos();
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCustomizationMenuOpen(false);
        setLangMenuOpen(false);
        setColorMenuOpen(false);
      }
    };
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (langMenuOpen && langMenuRef.current && !langMenuRef.current.contains(target)) {
        setLangMenuOpen(false);
      }
      if (colorMenuOpen && colorMenuRef.current && !colorMenuRef.current.contains(target)) {
        setColorMenuOpen(false);
      }
      if (
        customizationMenuOpen &&
        customizationMenuRef.current &&
        !customizationMenuRef.current.contains(target) &&
        customizationBtnRef.current &&
        !customizationBtnRef.current.contains(target)
      ) {
        setCustomizationMenuOpen(false);
      }
    };
    const handleReposition = () => {
      if (customizationMenuOpen) updateCustomizationPos();
    };
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    document.addEventListener('keydown', handleEsc);
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [customizationMenuOpen, langMenuOpen, colorMenuOpen, updateCustomizationPos]);

  useEffect(() => {
    const syncHandler = () => {
      setAdminConfigVersion((v) => v + 1);
      setPlatformSettings(getStoredPlatformSettingsSync());
    };
    window.addEventListener('admin-config-updated', syncHandler);
    return () => window.removeEventListener('admin-config-updated', syncHandler);
  }, []);

  const exportRequiresPaidPlan = platformSettings.requirePaidPlanForExport !== false;
  const canExportClean = exportRequiresPaidPlan ? isAuthenticated && hasActivePlan : true;

  useEffect(() => {
    if (contentLanguage) {
      setDocLang(contentLanguage);
    }
  }, [contentLanguage]);

  const setDensity = (newDensity: 'compact' | 'normal' | 'relaxed') => {
    onDensityChange?.(newDensity);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAccent = cv.accentColor || '#0f172a';
  const currentTemplate = getTemplateById(cv.templateStyle);

  // Template Style Flags (resolved across all 43 models)
  const {
    isClassic,
    isHarvard,
    isAts,
    isStrictMonoAts,
    isEuropass,
    europassVariant,
    isCreative,
    isTech,
    isMinimalist,
    isAcademic,
    isAcademicLattes,
    isModern,
    isFinance,
    isBoard,
    isProduct,
    isEditorial,
    isBlueprint,
    supportsPhoto
  } = resolveTemplateStyleProfile(cv.templateStyle);

  const europassAccent =
    cv.accentColor && cv.accentColor !== '#0f172a'
      ? cv.accentColor
      : currentTemplate.accentColor || '#1d4ed8';

  const customHeaderColor = cv.headerColor || (isEditorial ? currentAccent : undefined);
  const customBarColor = cv.barColor;
  const creativeSidebarBg = customBarColor || currentAccent;
  const creativeSidebarContrast = getSurfaceContrastPalette(creativeSidebarBg);
  const europassAsideBg = customBarColor || '#eceef1';
  const europassAsideContrast = getSurfaceContrastPalette(europassAsideBg);
  const europassBannerBg = cv.headerColor || '#f1f3f5';
  const europassBannerContrast = getSurfaceContrastPalette(europassBannerBg);
  const customHeaderContrast = getSurfaceContrastPalette(customHeaderColor || currentAccent);

  const euroLabels = EUROPASS_UI_LABELS[docLang] || EUROPASS_UI_LABELS.en;

  const resolvedFontClass =
    cv.fontFamily === 'garamond'
      ? 'font-serif-cv'
      : cv.fontFamily === 'jakarta'
      ? 'font-jakarta'
      : cv.fontFamily === 'mono'
      ? 'font-mono-code text-[13px] leading-relaxed'
      : cv.fontFamily === 'cinzel'
      ? 'font-cinzel'
      : isClassic || isHarvard || isAcademic || isFinance || isBoard
      ? 'font-serif-cv'
      : isStrictMonoAts
      ? 'font-mono-code text-[13px] leading-relaxed'
      : 'font-jakarta';

  // Prevent non-subscribers and unregistered users from bypassing download via Ctrl+P / Cmd+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        if (exportRequiresPaidPlan && !isAuthenticated) {
          e.preventDefault();
          void recordAuditLog({
            action: 'cv_export_blocked_unauthorized',
            category: 'cv_export',
            severity: 'warning',
            status: 'blocked',
            targetResource: `resumes/${cv.templateStyle}/pdf`,
            details: 'Tentativa de bypass de impressão (Ctrl+P/Cmd+P) bloqueada: utilizador não autenticado.',
            metadata: { format: 'pdf', trigger: 'keyboard_shortcut' }
          });
          onOpenAuthModal?.('O registo é obrigatório para imprimir ou descarregar o currículo em PDF.');
          return;
        }
        if (exportRequiresPaidPlan && !hasActivePlan) {
          e.preventDefault();
          void recordAuditLog({
            action: 'cv_export_blocked_unauthorized',
            category: 'cv_export',
            severity: 'warning',
            status: 'blocked',
            targetResource: `resumes/${cv.templateStyle}/pdf`,
            details: 'Tentativa de bypass de impressão (Ctrl+P/Cmd+P) bloqueada: plano pago exigido.',
            metadata: { format: 'pdf', trigger: 'keyboard_shortcut' }
          });
          onOpenPricingModal?.(
            'A impressão e download do currículo em PDF de Alta Resolução são exclusivos para assinantes. Ative o seu plano para desbloquear documentos 100% limpos e sem marca de água.'
          );
          return;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exportRequiresPaidPlan, isAuthenticated, hasActivePlan, onOpenAuthModal, onOpenPricingModal, cv.templateStyle]);

  // Comprehensive 5-language section titles & template chrome labels (shared with Word export)
  const currentTitles = SECTION_TITLES_BY_LANG[docLang] || SECTION_TITLES_BY_LANG.en;
  const sectionTitles = getResolvedSectionTitles(docLang, cv.templateStyle);

  const getSectionPrefix = (index: number) => {
    if (isTech) return <span className="text-teal-500 font-mono mr-1.5">&gt;</span>;
    if (isBlueprint) return <span className="font-mono text-[11px] mr-2 opacity-70">0{index + 1}.</span>;
    if (isMinimalist) return <span className="text-slate-400 font-mono text-[10px] mr-2">0{index + 1} /</span>;
    if (isAcademic) {
      const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][index] || `${index + 1}`;
      return <span className="text-slate-900 font-serif font-bold mr-1.5">{roman}.</span>;
    }
    if (isClassic) return <span className="text-blue-900 font-serif font-bold mr-1.5">{index + 1}.</span>;
    return null;
  };

  const handleCopyPlainText = () => {
    if (exportRequiresPaidPlan && !isAuthenticated) {
      showWarning('Registo Obrigatório', 'Inicie sessão ou crie uma conta para copiar o texto formatado.');
      onOpenAuthModal?.('O registo é obrigatório para copiar o texto do currículo.');
      return;
    }
    if (!canExportClean) {
      showWarning('Plano Requerido', 'A cópia do texto formatado requer um plano Pro ou Executive ativo.');
      onOpenPricingModal?.(
        'A extração e cópia do texto completo do currículo para formulários e candidaturas requer um plano Pro ou Executivo VIP ativo.'
      );
      return;
    }

    const text = [
      cv.personalDetails.name,
      cv.personalDetails.title,
      `${cv.personalDetails.location} | ${cv.personalDetails.phone} | ${cv.personalDetails.email}`,
      cv.personalDetails.linkedin ? `LinkedIn: ${cv.personalDetails.linkedin}` : '',
      cv.personalDetails.website ? `Website: ${cv.personalDetails.website}` : '',
      `\n${sectionTitles.summary.toUpperCase()}`,
      cv.summary,
      `\n${sectionTitles.competencies.toUpperCase()}`,
      ...cv.competencies.map((c) => `• ${c.category}: ${c.description}`),
      `\n${sectionTitles.experiences.toUpperCase()}`,
      ...cv.experiences.map((exp) =>
        [
          exp.company + (exp.location ? ` - ${exp.location}` : ''),
          `${exp.role} (${exp.period})`,
          exp.donor ? `Projeto/Financiador: ${exp.donor}` : '',
          ...exp.highlights.map((h) => `• ${h}`)
        ]
          .filter(Boolean)
          .join('\n')
      ),
      `\n${sectionTitles.educations.toUpperCase()}`,
      ...cv.educations.map((edu) => `${edu.degree} - ${edu.institution} (${edu.period})`),
      `\n${sectionTitles.languages.toUpperCase()}`,
      ...cv.languages.map((l) => `• ${l.language}: ${l.level}`)
    ]
      .filter(Boolean)
      .join('\n\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    showSuccess('Texto Copiado!', 'O texto formatado do currículo foi copiado para a área de transferência.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExportJSON = () => {
    if (!isAuthenticated) {
      void recordAuditLog({
        action: 'cv_export_blocked_unauthorized',
        category: 'cv_export',
        severity: 'warning',
        status: 'blocked',
        targetResource: 'resumes/json',
        details: 'Exportação JSON de backup bloqueada: utilizador não autenticado.',
        metadata: { format: 'json', reason: 'unauthenticated' }
      });
      showWarning('Registo Obrigatório', 'O registo é obrigatório para descarregar o backup JSON.');
      onOpenAuthModal?.('O registo é obrigatório para descarregar o ficheiro de backup do currículo.');
      return;
    }
    if (!hasActivePlan) {
      void recordAuditLog({
        action: 'cv_export_blocked_unauthorized',
        category: 'cv_export',
        severity: 'warning',
        status: 'blocked',
        targetResource: 'resumes/json',
        details: 'Exportação JSON de backup bloqueada: plano ativo exigido.',
        metadata: { format: 'json', reason: 'plan_required' }
      });
      showWarning('Plano Requerido', 'A exportação de backup requer um plano Pro ou Executive ativo.');
      onOpenPricingModal?.('A exportação do ficheiro de backup em JSON requer um plano Pro ou Executive ativo.');
      return;
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(cv, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    const sanitizedName = cv.personalDetails.name.trim().replace(/\s+/g, '_') || 'Curriculo';
    a.download = `CV_${sanitizedName}_backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    void recordAuditLog({
      action: 'cv_exported_json',
      category: 'cv_export',
      severity: 'info',
      status: 'success',
      targetResource: 'resumes/json',
      details: `Backup estruturado JSON do currículo exportado (${sanitizedName}).`,
      metadata: { format: 'json', templateStyle: cv.templateStyle }
    });
    if (user) {
      void dispatchUserNotification({
        user,
        eventType: 'export',
        title: 'Backup JSON Exportado',
        message: `Ficheiro CV_${sanitizedName}_backup.json descarregado com sucesso.`,
        targetResource: 'resumes/json'
      });
    }
    showSuccess('Backup JSON Exportado!', `Ficheiro CV_${sanitizedName}_backup.json descarregado com sucesso.`);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAuthenticated) {
      showWarning('Registo Obrigatório', 'Inicie sessão para importar backups.');
      onOpenAuthModal?.('O registo é obrigatório para restaurar backups do currículo.');
      return;
    }
    if (!hasActivePlan) {
      showWarning('Plano Requerido', 'A importação de backups JSON requer um plano Pro ou Executive ativo.');
      onOpenPricingModal?.('A importação e restauração de backups é exclusiva para assinantes Pro e Executivo VIP.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.personalDetails) {
          onChange(parsed);
          setJsonImportSuccess('Currículo importado do backup JSON com sucesso!');
          showSuccess('Currículo Importado!', 'Ficheiro JSON restaurado e sincronizado no documento.');
          setTimeout(() => setJsonImportSuccess(null), 3000);
        } else {
          showError('Ficheiro Inválido', 'O arquivo JSON selecionado não possui a estrutura correta.');
        }
      } catch {
        showError('Erro de Importação', 'Não foi possível ler o arquivo JSON selecionado.');
      }
    };
    reader.readAsText(file);
  };

  const getSafeHttpUrl = (raw?: string | null): string | null => {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return null;
  };

  const renderTextWithLinks = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        const safeHref = getSafeHttpUrl(part);
        if (!safeHref) return part;
        return (
          <a
            key={i}
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold hover:opacity-80"
            style={{ color: currentAccent }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const setStyle = (style: TemplateStyle) => {
    if (!isAuthenticated) {
      onOpenAuthModal?.('Inicie sessão ou crie uma conta para alterar e personalizar modelos de currículo.');
      return;
    }
    if (!hasActivePlan) {
      onOpenPricingModal?.(
        'A alteração de modelos de currículo e acesso aos designs internacionais (Harvard, ATS Estrito, Tech Modern) é exclusiva para assinantes Pro ($8/mês) ou Executivo VIP ($12/mês).'
      );
      return;
    }
    onChange({ ...cv, templateStyle: style });
  };

  const setAccentColor = (hex: string) => {
    onChange({ ...cv, accentColor: hex });
  };

  const setHeaderColor = (hex?: string) => {
    onChange({ ...cv, headerColor: hex });
  };

  const setBarColor = (hex?: string) => {
    onChange({ ...cv, barColor: hex });
  };

  const resetColors = () => {
    onChange({
      ...cv,
      accentColor: currentTemplate.accentColor || '#0f172a',
      headerColor: undefined,
      barColor: undefined
    });
  };


  // Photo Logic:
  // Show photo if user has configured a photo and showPhoto is not false, on all photo-supporting models
  const templateSupportsPhoto = supportsPhoto;
  const hasUserPhoto = Boolean(cv.personalDetails.photoUrl);
  const shouldRenderPhoto = templateSupportsPhoto && hasUserPhoto && cv.personalDetails.showPhoto !== false;

  // Has photo configured but current template strictly bans it
  const isPhotoSuppressedForAts = hasUserPhoto && !templateSupportsPhoto;

  const sectionOrder: CVSectionKey[] = resolveEffectiveSectionOrder(cv);

  const isSectionVisible = (key: CVSectionKey): boolean => {
    return cv.sectionVisibility?.[key] !== false;
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      {/* Top Controls Toolbar for the Document Preview */}
      <div className="no-print shrink-0 bg-white border-b border-slate-200 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Left Side: Template Selector & Grouped Settings Popover */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <TemplateSelectorDropdown
            currentStyle={cv.templateStyle}
            onSelectStyle={setStyle}
            onOpenAdvisorModal={() => setIsAdvisorModalOpen(true)}
          />

          {/* Direct Colors Popover (Cores: Accent, Header & Bars) */}
          <div ref={colorMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setColorMenuOpen((prev) => !prev)}
              aria-expanded={colorMenuOpen}
              className={`min-h-[38px] flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap touch-manipulation ${
                colorMenuOpen
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Personalizar cor principal, cabeçalho e barras do currículo"
            >
              <Palette className="w-3.5 h-3.5 shrink-0" />
              <span>Cores</span>
              <span className="flex items-center -space-x-1 shrink-0">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white shadow-2xs"
                  style={{ backgroundColor: currentAccent }}
                />
                {cv.headerColor && (
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white shadow-2xs"
                    style={{ backgroundColor: cv.headerColor }}
                  />
                )}
                {cv.barColor && (
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white shadow-2xs"
                    style={{ backgroundColor: cv.barColor }}
                  />
                )}
              </span>
            </button>

            {colorMenuOpen && (
              <div className="fixed sm:absolute left-3 right-3 sm:left-0 sm:right-auto mt-1.5 sm:w-80 max-h-[75dvh] overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200 p-3.5 z-60 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-900">Cores do Currículo</span>
                  <button
                    type="button"
                    onClick={resetColors}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Repor Cores
                  </button>
                </div>

                {/* Primary / Title Accent */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-700">Cor Principal / Títulos</span>
                    <input
                      type="color"
                      value={currentAccent}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-7 h-6 rounded border border-slate-200 cursor-pointer bg-transparent p-0"
                      aria-label="Escolher cor principal"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {ACCENT_COLORS.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setAccentColor(col.hex)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                          currentAccent.toLowerCase() === col.hex.toLowerCase()
                            ? 'ring-2 ring-slate-900 ring-offset-1 scale-105'
                            : ''
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.name}
                      >
                        {currentAccent.toLowerCase() === col.hex.toLowerCase() && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Header Background Color */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-700">Cor do Cabeçalho</span>
                    <div className="flex items-center gap-1.5">
                      {cv.headerColor && (
                        <button
                          type="button"
                          onClick={() => setHeaderColor(undefined)}
                          className="text-[10px] text-slate-500 hover:text-slate-800 underline"
                        >
                          Padrão
                        </button>
                      )}
                      <input
                        type="color"
                        value={cv.headerColor || '#f1f3f5'}
                        onChange={(e) => setHeaderColor(e.target.value)}
                        className="w-7 h-6 rounded border border-slate-200 cursor-pointer bg-transparent p-0"
                        aria-label="Escolher cor do cabeçalho"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {HEADER_BAR_PRESETS.map((preset) => {
                      const active = (cv.headerColor || '').toLowerCase() === preset.hex.toLowerCase();
                      const light = preset.hex === '#ffffff' || preset.hex === '#eceef1';
                      return (
                        <button
                          key={`hdr-${preset.hex}`}
                          type="button"
                          onClick={() => setHeaderColor(preset.hex)}
                          className={`w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center transition-transform hover:scale-110 ${
                            active ? 'ring-2 ring-blue-600 ring-offset-1 scale-105' : ''
                          }`}
                          style={{ backgroundColor: preset.hex }}
                          title={preset.name}
                        >
                          {active && <Check className={`w-3 h-3 ${light ? 'text-slate-900' : 'text-white'}`} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bar / Sidebar / Frame Color */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-700">Cor das Barras / Lateral</span>
                    <div className="flex items-center gap-1.5">
                      {cv.barColor && (
                        <button
                          type="button"
                          onClick={() => setBarColor(undefined)}
                          className="text-[10px] text-slate-500 hover:text-slate-800 underline"
                        >
                          Padrão
                        </button>
                      )}
                      <input
                        type="color"
                        value={cv.barColor || currentAccent}
                        onChange={(e) => setBarColor(e.target.value)}
                        className="w-7 h-6 rounded border border-slate-200 cursor-pointer bg-transparent p-0"
                        aria-label="Escolher cor das barras e lateral"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {HEADER_BAR_PRESETS.map((preset) => {
                      const active = (cv.barColor || '').toLowerCase() === preset.hex.toLowerCase();
                      const light = preset.hex === '#ffffff' || preset.hex === '#eceef1';
                      return (
                        <button
                          key={`bar-${preset.hex}`}
                          type="button"
                          onClick={() => setBarColor(preset.hex)}
                          className={`w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center transition-transform hover:scale-110 ${
                            active ? 'ring-2 ring-blue-600 ring-offset-1 scale-105' : ''
                          }`}
                          style={{ backgroundColor: preset.hex }}
                          title={preset.name}
                        >
                          {active && <Check className={`w-3 h-3 ${light ? 'text-slate-900' : 'text-white'}`} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Unified Document Customization & Layout Popover (Ajustes) */}
          <div className="relative">
            <button
              ref={customizationBtnRef}
              type="button"
              onClick={() => setCustomizationMenuOpen((prev) => !prev)}
              aria-expanded={customizationMenuOpen}
              className={`min-h-[38px] flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap touch-manipulation ${
                customizationMenuOpen
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Ajustes de foto, cor, tamanho do texto, espaçamento e cópia"
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span>{studioText.docToolbar.settingsBtn}</span>
            </button>

            {customizationMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-50 bg-slate-950/15 sm:bg-transparent"
                  onClick={() => setCustomizationMenuOpen(false)}
                />
                <div
                  ref={customizationMenuRef}
                  style={{ top: customizationPos.top, left: customizationPos.left, width: customizationPos.width }}
                  className="fixed z-60 max-h-[75dvh] overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200 p-3 animate-in fade-in slide-in-from-top-1 space-y-3"
                >
                  {/* Layout: Density & Zoom */}
                  <div className="pb-2.5 border-b border-slate-100 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Espaço e Tamanho
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-slate-700 font-medium">{studioText.docToolbar.density}</span>
                      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (!isAuthenticated) {
                              onOpenAuthModal?.('Inicie sessão ou crie uma conta para ajustar o espaçamento do currículo.');
                              return;
                            }
                            if (!hasActivePlan) {
                              onOpenPricingModal?.(
                                'O ajuste de espaçamento para caber em 1 página é exclusivo dos assinantes Pro ou Executivo VIP.'
                              );
                              return;
                            }
                            setDensity('compact');
                          }}
                          className={`px-2 py-1.5 text-[11px] rounded-md transition-colors whitespace-nowrap ${
                            density === 'compact'
                              ? 'bg-white text-slate-950 font-semibold shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {studioText.docToolbar.compact}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!isAuthenticated) {
                              onOpenAuthModal?.('Inicie sessão ou crie uma conta para ajustar o espaçamento do currículo.');
                              return;
                            }
                            if (!hasActivePlan) {
                              onOpenPricingModal?.(
                                'O ajuste de espaçamento do currículo é exclusivo dos assinantes Pro ou Executivo VIP.'
                              );
                              return;
                            }
                            setDensity('normal');
                          }}
                          className={`px-2 py-1.5 text-[11px] rounded-md transition-colors whitespace-nowrap ${
                            density === 'normal'
                              ? 'bg-white text-slate-950 font-semibold shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {studioText.docToolbar.normal}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!isAuthenticated) {
                              onOpenAuthModal?.('Inicie sessão ou crie uma conta para ajustar o espaçamento do currículo.');
                              return;
                            }
                            if (!hasActivePlan) {
                              onOpenPricingModal?.(
                                'O ajuste de espaçamento do currículo é exclusivo dos assinantes Pro ou Executivo VIP.'
                              );
                              return;
                            }
                            setDensity('relaxed');
                          }}
                          className={`px-2 py-1.5 text-[11px] rounded-md transition-colors whitespace-nowrap ${
                            density === 'relaxed'
                              ? 'bg-white text-slate-950 font-semibold shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {studioText.docToolbar.relaxed}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-700 font-medium">Tamanho na tela</span>
                      <div className="flex items-center gap-0.5 border border-slate-200 rounded-lg bg-slate-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded"
                          title={studioText.docToolbar.zoomOut}
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setZoomLevel(100)}
                          className="text-[11px] font-mono tabular-nums text-slate-800 px-1.5 font-semibold"
                          title="100%"
                        >
                          {zoomLevel}%
                        </button>
                        <button
                          type="button"
                          onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded"
                          title={studioText.docToolbar.zoomIn}
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Photo Management Section */}
                  <div className="pb-2.5 border-b border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Foto no Currículo
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-slate-600" />
                        <span className="text-xs text-slate-700 font-medium">
                          {hasUserPhoto
                            ? shouldRenderPhoto
                              ? 'Foto ativa'
                              : 'Foto oculta'
                            : 'Sem foto'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomizationMenuOpen(false);
                          if (!isAuthenticated) {
                            onOpenAuthModal?.('Inicie sessão ou crie uma conta para adicionar a sua foto.');
                            return;
                          }
                          if (!hasActivePlan) {
                            onOpenPricingModal?.(
                              'Adicionar e gerir foto no currículo é exclusivo para assinantes dos planos Pro ou Executivo VIP.'
                            );
                            return;
                          }
                          setIsPhotoModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        {hasUserPhoto ? 'Alterar' : 'Adicionar'}
                      </button>
                    </div>
                  </div>

                  {/* Accent, Header & Bar Colors Section */}
                  <div className="pb-2.5 border-b border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Cores (Principal, Cabeçalho e Barras)
                      </div>
                      <button
                        type="button"
                        onClick={resetColors}
                        className="text-[10px] font-semibold text-blue-600 hover:underline"
                      >
                        Repor
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5 pt-0.5">
                      {ACCENT_COLORS.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setAccentColor(col.hex)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative ${
                            currentAccent.toLowerCase() === col.hex.toLowerCase()
                              ? 'ring-2 ring-slate-900 ring-offset-2 scale-105'
                              : ''
                          }`}
                          style={{ backgroundColor: col.hex }}
                          title={col.name}
                        >
                          {currentAccent.toLowerCase() === col.hex.toLowerCase() && (
                            <Check className="w-3.5 h-3.5 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <label className="flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-700 cursor-pointer">
                        <span>Cabeçalho</span>
                        <input
                          type="color"
                          value={cv.headerColor || '#f1f3f5'}
                          onChange={(e) => setHeaderColor(e.target.value)}
                          className="w-5 h-5 rounded border-0 bg-transparent p-0 cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-700 cursor-pointer">
                        <span>Barras</span>
                        <input
                          type="color"
                          value={cv.barColor || currentAccent}
                          onChange={(e) => setBarColor(e.target.value)}
                          className="w-5 h-5 rounded border-0 bg-transparent p-0 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Inline Editing Toggle */}
                  <div className="pb-2.5 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) {
                          onOpenAuthModal?.('Inicie sessão ou crie uma conta para editar diretamente na folha.');
                          return;
                        }
                        if (!hasActivePlan) {
                          onOpenPricingModal?.(
                            'A edição direta na folha é uma funcionalidade exclusiva dos assinantes Pro ou Executivo VIP.'
                          );
                          return;
                        }
                        setIsInlineEditing(!isInlineEditing);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors ${
                        isInlineEditing
                          ? 'bg-amber-50 border-amber-300 text-amber-950 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isInlineEditing ? <Eye className="w-3.5 h-3.5 text-amber-700" /> : <Edit3 className="w-3.5 h-3.5 text-slate-600" />}
                        <span>{isInlineEditing ? 'Edição na folha: Ativa' : 'Editar direto na folha'}</span>
                      </span>
                      <span className={`w-2 h-2 rounded-full ${isInlineEditing ? 'bg-amber-500' : 'bg-slate-300'}`} />
                    </button>
                  </div>

                  {/* Utilities: Plain Text & Copy Backup */}
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        handleCopyPlainText();
                        setCustomizationMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>{copied ? studioText.docToolbar.copied : studioText.docToolbar.copy}</span>
                      </span>
                      {copied && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          handleExportJSON();
                          setCustomizationMenuOpen(false);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                      >
                        <Download className="w-3 h-3 text-slate-500" />
                        <span>{studioText.docToolbar.jsonBackup}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          fileInputRef.current?.click();
                          setCustomizationMenuOpen(false);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                      >
                        <Download className="w-3 h-3 text-slate-500 rotate-180" />
                        <span>Abrir Cópia</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hidden JSON file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportJSON}
          accept=".json"
          className="hidden"
        />

        {/* Right Side: Single Clean Language Menu + PDF & Word Export */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Document Language & Multi-language Pack Dropdown */}
          <div ref={langMenuRef} className="relative shrink-0">
            <button
              type="button"
              disabled={isTranslatingContent}
              onClick={() => setLangMenuOpen((v) => !v)}
              className={`min-h-[38px] flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap disabled:opacity-60 touch-manipulation ${
                langMenuOpen
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title={studioText.docToolbar.cvContentLangTooltip}
              aria-expanded={langMenuOpen}
            >
              {isTranslatingContent ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Globe className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>
                {isTranslatingContent && translatingTargetLang
                  ? `A traduzir (${translatingTargetLang.toUpperCase()})...`
                  : `Traduzir: ${docLang.toUpperCase()}`}
              </span>
              <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-56 max-w-[calc(100vw-1.5rem)] max-h-[70dvh] overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-60 animate-in fade-in slide-in-from-top-1 space-y-0.5">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {studioText.docToolbar.cvContentLangTooltip}
                </div>
                {(
                  [
                    { code: 'pt', label: 'Português (PT)' },
                    { code: 'en', label: 'English (EN)' },
                    { code: 'es', label: 'Español (ES)' },
                    { code: 'fr', label: 'Français (FR)' },
                    { code: 'de', label: 'Deutsch (DE)' }
                  ] as const
                ).map((item) => {
                  const isActive = docLang === item.code;
                  const isTargetLoading = isTranslatingContent && translatingTargetLang === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      disabled={isTranslatingContent}
                      onClick={() => {
                        setLangMenuOpen(false);
                        if (!isAuthenticated) {
                          onOpenAuthModal?.('Inicie sessão ou crie uma conta para traduzir o seu currículo em 5 idiomas.');
                          return;
                        }
                        if (!hasActivePlan) {
                          onOpenPricingModal?.(
                            'A tradução completa do currículo e carta para Inglês, Espanhol, Francês ou Alemão é exclusiva para assinantes Pro ($8/mês) ou Executivo VIP ($12/mês).'
                          );
                          return;
                        }
                        onSelectLanguage?.(item.code);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isTargetLoading && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
                        <span>{item.label}</span>
                      </span>
                      {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}

                <div className="pt-1 mt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setLangMenuOpen(false);
                      if (!isAuthenticated) {
                        onOpenAuthModal?.('Inicie sessão ou crie uma conta para baixar noutro idioma.');
                        return;
                      }
                      if (!hasActivePlan) {
                        onOpenPricingModal?.('Baixar o currículo traduzido noutro idioma requer um plano Pro ou Executivo VIP ativo.');
                        return;
                      }
                      setIsMultiLangModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{studioText.docToolbar.otherLangs}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Strategic Educational Banner when photo is suppressed in strict ATS models */}
      {isPhotoSuppressedForAts && (
        <div className="no-print bg-slate-900 text-white px-3 sm:px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px] text-slate-300">
              <strong className="text-white">Modo Sem Foto:</strong> O modelo{' '}
              <strong className="text-white">{currentTemplate.name}</strong> oculta a foto para evitar rejeição nos sistemas automáticos (EUA/UK).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setStyle('european_europass')}
            className="text-[11px] font-bold text-blue-400 hover:text-blue-300 underline underline-offset-2 shrink-0 sm:ml-2"
          >
            Mudar para Modelo com Foto →
          </button>
        </div>
      )}

      {/* JSON Import Notification Toast */}
      {jsonImportSuccess && (
        <div className="no-print bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{jsonImportSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setJsonImportSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Document Workspace Canvas */}
      <div className="cv-preview-container flex-1 min-h-0 overflow-auto bg-slate-200/70 p-2.5 sm:p-6 lg:p-8 flex flex-col items-center">

        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out'
          }}
          className="cv-scale-wrapper w-full max-w-[210mm] md:w-[210mm]"
        >
          {/* CASE 1: Creative Split Two-Column Layout */}
          {isCreative ? (
            <article className={`cv-a4-sheet cv-creative-split bg-white text-slate-900 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18),0_2px_8px_rgba(15,23,42,0.06)] border border-slate-300/70 rounded-xs min-h-[580px] md:min-h-[1120px] flex flex-col md:flex-row relative overflow-hidden ${
              cv.fontFamily ? resolvedFontClass : 'font-jakarta'
            } ${
              density === 'compact' ? 'cv-density-compact' : density === 'relaxed' ? 'cv-density-relaxed' : ''
            }`}>
              <CVWatermarkOverlay isVisible={!hasActivePlan} />
              {/* Left Sidebar (35% width) */}
              <aside
                className="cv-creative-sidebar w-full md:w-[35%] p-6 sm:p-8 flex flex-col justify-between"
                style={{ backgroundColor: creativeSidebarBg, color: creativeSidebarContrast.text }}
              >
                <div>
                  {/* Photo in Sidebar */}
                  {shouldRenderPhoto ? (
                    <div className="mb-5 flex justify-center md:justify-start">
                      <img
                        src={cv.personalDetails.photoUrl}
                        alt={cv.personalDetails.name}
                        className="w-28 h-28 rounded-2xl object-cover border-4 shadow-md"
                        style={{ borderColor: creativeSidebarContrast.borderColor }}
                      />
                    </div>
                  ) : (
                    <div
                      className="mb-4 inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase"
                      style={{ backgroundColor: creativeSidebarContrast.cardBg, color: creativeSidebarContrast.text }}
                    >
                      {currentTitles.creativeTag}
                    </div>
                  )}

                  <h1
                    contentEditable={isInlineEditing}
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, name: e.currentTarget.textContent || '' }
                      })
                    }
                    className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight break-words"
                    style={{ color: creativeSidebarContrast.text }}
                  >
                    {cv.personalDetails.name || 'SEU NOME'}
                  </h1>

                  <div
                    contentEditable={isInlineEditing}
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, title: e.currentTarget.textContent || '' }
                      })
                    }
                    className="text-xs sm:text-sm font-medium mt-1"
                    style={{ color: creativeSidebarContrast.mutedText }}
                  >
                    {cv.personalDetails.title}
                  </div>

                  {/* Sidebar Contact Block */}
                  <div
                    className="mt-6 pt-5 border-t space-y-2.5 text-xs"
                    style={{ borderColor: creativeSidebarContrast.borderColor, color: creativeSidebarContrast.mutedText }}
                  >
                    <div
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: creativeSidebarContrast.subtleText }}
                    >
                      {currentTitles.contactsLabel}
                    </div>
                    <div>
                      <span className="block text-[10px]" style={{ color: creativeSidebarContrast.subtleText }}>
                        {currentTitles.locationLabel}
                      </span>
                      <span className="font-medium" style={{ color: creativeSidebarContrast.text }}>
                        {cv.personalDetails.location}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px]" style={{ color: creativeSidebarContrast.subtleText }}>
                        {currentTitles.phoneLabel}
                      </span>
                      <span className="font-medium font-mono" style={{ color: creativeSidebarContrast.text }}>
                        {cv.personalDetails.phone}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px]" style={{ color: creativeSidebarContrast.subtleText }}>
                        {currentTitles.emailLabel}
                      </span>
                      <span className="font-medium break-all" style={{ color: creativeSidebarContrast.text }}>
                        {cv.personalDetails.email}
                      </span>
                    </div>
                    {cv.personalDetails.linkedin && (
                      <div>
                        <span className="block text-[10px]" style={{ color: creativeSidebarContrast.subtleText }}>
                          LinkedIn
                        </span>
                        <span className="font-medium break-all" style={{ color: creativeSidebarContrast.text }}>
                          {cv.personalDetails.linkedin}
                        </span>
                      </div>
                    )}
                    {cv.personalDetails.website && (
                      <div>
                        <span className="block text-[10px]" style={{ color: creativeSidebarContrast.subtleText }}>
                          {currentTitles.websiteLabel}
                        </span>
                        <span className="font-medium break-all" style={{ color: creativeSidebarContrast.text }}>
                          {cv.personalDetails.website}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sidebar Skills / Competencies */}
                  {cv.competencies && cv.competencies.length > 0 && (
                    <div className="mt-6 pt-5 border-t" style={{ borderColor: creativeSidebarContrast.borderColor }}>
                      <div
                        className="text-[10px] font-bold uppercase tracking-wider mb-2.5"
                        style={{ color: creativeSidebarContrast.subtleText }}
                      >
                        {currentTitles.skillsShort}
                      </div>
                      <div className="space-y-2">
                        {cv.competencies.map((c, i) => (
                          <div
                            key={c.id || i}
                            className="rounded-lg p-2 text-xs"
                            style={{ backgroundColor: creativeSidebarContrast.cardBg }}
                          >
                            <span className="font-bold block" style={{ color: creativeSidebarContrast.text }}>
                              {c.category}
                            </span>
                            <span
                              className="text-[11px] line-clamp-2"
                              style={{ color: creativeSidebarContrast.mutedText }}
                            >
                              {c.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sidebar Languages */}
                  {cv.languages && cv.languages.length > 0 && (
                    <div className="mt-6 pt-5 border-t" style={{ borderColor: creativeSidebarContrast.borderColor }}>
                      <div
                        className="text-[10px] font-bold uppercase tracking-wider mb-2"
                        style={{ color: creativeSidebarContrast.subtleText }}
                      >
                        {currentTitles.languagesShort}
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {cv.languages.map((l, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <span className="font-bold" style={{ color: creativeSidebarContrast.text }}>
                              {l.language}
                            </span>
                            <span className="text-[11px]" style={{ color: creativeSidebarContrast.mutedText }}>
                              {l.level}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className="mt-6 pt-4 border-t text-[10px] text-center"
                  style={{ borderColor: creativeSidebarContrast.borderColor, color: creativeSidebarContrast.subtleText }}
                >
                  {currentTitles.creativeFooter}
                </div>
              </aside>

              {/* Right Main Column (65% width) */}
              <main className="cv-creative-main w-full md:w-[65%] p-6 sm:p-10 space-y-6">
                {cv.headerColor && (
                  <div
                    className="rounded-xl p-4 mb-2 border"
                    style={{
                      backgroundColor: cv.headerColor,
                      borderColor: customHeaderContrast.borderColor,
                      color: customHeaderContrast.text
                    }}
                  >
                    <div className="text-xs font-bold uppercase tracking-wider" style={{ color: customHeaderContrast.subtleText }}>
                      {cv.personalDetails.title}
                    </div>
                    <div className="text-lg font-black uppercase tracking-tight" style={{ color: customHeaderContrast.text }}>
                      {cv.personalDetails.name}
                    </div>
                  </div>
                )}
                {sectionOrder.map((sectionKey) => {
                  if (!isSectionVisible(sectionKey)) return null;

                  if (sectionKey === 'summary' && cv.summary) {
                    return (
                      <section key="summary" className="cv-section">
                        <h2
                          className="cv-section-title text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
                          style={{ color: currentAccent, borderColor: currentAccent }}
                        >
                          {sectionTitles.summary}
                        </h2>
                        <p
                          contentEditable={isInlineEditing}
                          suppressContentEditableWarning
                          onBlur={(e) => onChange({ ...cv, summary: e.currentTarget.textContent || '' })}
                          className="text-xs sm:text-[13.5px] leading-relaxed text-slate-800 text-justify"
                        >
                          {cv.summary}
                        </p>
                      </section>
                    );
                  }

                  if (sectionKey === 'experiences' && cv.experiences && cv.experiences.length > 0) {
                    return (
                      <section key="experiences" className="cv-section">
                        <h2
                          className="cv-section-title text-xs font-bold uppercase tracking-wider pb-1 mb-3 border-b-2"
                          style={{ color: currentAccent, borderColor: currentAccent }}
                        >
                          {sectionTitles.experiences}
                        </h2>

                        <div className="space-y-4">
                          {cv.experiences.map((exp) => (
                            <div key={exp.id} className="cv-item relative pl-3 border-l-2 border-slate-200 space-y-1">
                              <div className="flex flex-wrap justify-between items-baseline gap-1">
                                <span className="text-[14px] font-bold text-slate-900">{exp.company}</span>
                                <span className="text-xs font-mono text-slate-500">{exp.period}</span>
                              </div>
                              <div className="text-xs font-semibold" style={{ color: currentAccent }}>
                                {exp.role} {exp.location ? `· ${exp.location}` : ''}
                              </div>
                              {exp.donor && <div className="text-[11px] italic text-slate-500">{exp.donor}</div>}
                              <ul className="mt-1 space-y-1 text-xs text-slate-700">
                                {exp.highlights.map((pt, pIdx) => (
                                  <li key={pIdx} className="flex items-start">
                                    <span className="mr-1.5 text-slate-400">•</span>
                                    <span className="leading-relaxed">{renderTextWithLinks(pt)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  if (sectionKey === 'educations' && cv.educations && cv.educations.length > 0) {
                    return (
                      <section key="educations" className="cv-section">
                        <h2
                          className="cv-section-title text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
                          style={{ color: currentAccent, borderColor: currentAccent }}
                        >
                          {sectionTitles.educations}
                        </h2>
                        <div className="space-y-2 text-xs">
                          {cv.educations.map((edu) => (
                            <div key={edu.id} className="cv-item flex justify-between items-baseline">
                              <div>
                                <strong className="text-slate-900">{edu.degree}</strong>
                                <span className="text-slate-600"> — {edu.institution}</span>
                              </div>
                              <span className="font-mono text-slate-500 text-[11px]">{edu.period}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  if (sectionKey === 'trainings' && cv.trainings && cv.trainings.length > 0) {
                    return (
                      <section key="trainings" className="cv-section">
                        <h2
                          className="cv-section-title text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
                          style={{ color: currentAccent, borderColor: currentAccent }}
                        >
                          {sectionTitles.trainings}
                        </h2>
                        <ul className="space-y-1 text-xs text-slate-700">
                          {cv.trainings.map((t, idx) => (
                            <li key={idx} className="cv-item flex items-start">
                              <span className="mr-1.5 text-slate-400">•</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    );
                  }

                  if (sectionKey === 'references' && cv.references && cv.references.length > 0) {
                    return (
                      <section key="references" className="cv-section">
                        <h2
                          className="cv-section-title text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
                          style={{ color: currentAccent, borderColor: currentAccent }}
                        >
                          {sectionTitles.references}
                        </h2>
                        <div className="space-y-2 text-xs">
                          {cv.references.map((ref, idx) => (
                            <div key={ref.id || idx} className="cv-item flex justify-between items-baseline">
                              <div>
                                <strong className="text-slate-900">{ref.name}</strong>
                                <span className="text-slate-600"> — {ref.institutionAndPosition}</span>
                              </div>
                              <span className="font-mono text-slate-500 text-[11px]">{ref.contact}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  return null;
                })}
              </main>
            </article>
          ) : isEuropass && europassVariant === 'sidebar' ? (
            /* CASE 1B: Europass Sidebar (Custom/Gray Left Column + Blue Timeline Right) */
            <article
              className={`cv-a4-sheet cv-europass-sidebar bg-white text-slate-900 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18),0_2px_8px_rgba(15,23,42,0.06)] border border-slate-300/70 rounded-xs min-h-[580px] md:min-h-[1120px] flex flex-col md:flex-row relative overflow-hidden ${
                cv.fontFamily ? resolvedFontClass : 'font-jakarta'
              } ${
                density === 'compact' ? 'cv-density-compact' : density === 'relaxed' ? 'cv-density-relaxed' : ''
              }`}
            >
              <CVWatermarkOverlay isVisible={!hasActivePlan} />
              <aside
                className="cv-europass-aside w-full md:w-[32%] p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r"
                style={{
                  backgroundColor: europassAsideBg,
                  color: europassAsideContrast.text,
                  borderColor: europassAsideContrast.borderColor,
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact'
                }}
              >
                <div>
                  {shouldRenderPhoto && (
                    <div className="mb-5 flex justify-center">
                      <img
                        src={cv.personalDetails.photoUrl}
                        alt={cv.personalDetails.name}
                        className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-sm"
                      />
                    </div>
                  )}

                  <h1
                    contentEditable={isInlineEditing}
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, name: e.currentTarget.textContent || '' }
                      })
                    }
                    className="text-xl font-bold text-center leading-snug break-words"
                    style={{ color: europassAsideContrast.text }}
                  >
                    {cv.personalDetails.name || 'SEU NOME'}
                  </h1>

                  <div
                    className="w-10 h-px mx-auto my-2.5"
                    style={{ backgroundColor: europassAsideContrast.subtleText }}
                  />

                  <div
                    contentEditable={isInlineEditing}
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, title: e.currentTarget.textContent || '' }
                      })
                    }
                    className="text-xs font-semibold text-center leading-relaxed"
                    style={{ color: europassAsideContrast.mutedText }}
                  >
                    {cv.personalDetails.title}
                  </div>

                  {/* Contact Block */}
                  <div
                    className="mt-7 pt-5 border-t space-y-2.5 text-xs"
                    style={{ borderColor: europassAsideContrast.borderColor, color: europassAsideContrast.mutedText }}
                  >
                    <h3
                      className="text-[11px] font-bold uppercase tracking-wider mb-2"
                      style={{ color: europassAsideContrast.text }}
                    >
                      {euroLabels.contact}
                    </h3>
                    {cv.personalDetails.location && (
                      <div className="flex items-start gap-2">
                        <MapPin
                          className="w-3.5 h-3.5 mt-0.5 shrink-0"
                          style={{ color: europassAsideContrast.isLight ? europassAccent : '#ffffff' }}
                        />
                        <span className="leading-snug">{cv.personalDetails.location}</span>
                      </div>
                    )}
                    {cv.personalDetails.email && (
                      <div className="flex items-start gap-2">
                        <Mail
                          className="w-3.5 h-3.5 mt-0.5 shrink-0"
                          style={{ color: europassAsideContrast.isLight ? europassAccent : '#ffffff' }}
                        />
                        <span className="break-all leading-snug">{cv.personalDetails.email}</span>
                      </div>
                    )}
                    {cv.personalDetails.phone && (
                      <div className="flex items-start gap-2">
                        <Phone
                          className="w-3.5 h-3.5 mt-0.5 shrink-0"
                          style={{ color: europassAsideContrast.isLight ? europassAccent : '#ffffff' }}
                        />
                        <span className="font-mono leading-snug">{cv.personalDetails.phone}</span>
                      </div>
                    )}
                    {cv.personalDetails.website && (
                      <div className="flex items-start gap-2">
                        <Globe
                          className="w-3.5 h-3.5 mt-0.5 shrink-0"
                          style={{ color: europassAsideContrast.isLight ? europassAccent : '#ffffff' }}
                        />
                        <span className="break-all leading-snug">{cv.personalDetails.website}</span>
                      </div>
                    )}
                    {cv.personalDetails.linkedin && (
                      <div className="flex items-start gap-2">
                        <Linkedin
                          className="w-3.5 h-3.5 mt-0.5 shrink-0"
                          style={{ color: europassAsideContrast.isLight ? europassAccent : '#ffffff' }}
                        />
                        <span className="break-all leading-snug">{cv.personalDetails.linkedin}</span>
                      </div>
                    )}
                  </div>

                  {/* Sidebar Competencies */}
                  {isSectionVisible('competencies') && cv.competencies && cv.competencies.length > 0 && (
                    <div
                      className="mt-6 pt-5 border-t space-y-2"
                      style={{ borderColor: europassAsideContrast.borderColor }}
                    >
                      <h3
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: europassAsideContrast.text }}
                      >
                        {sectionTitles.competencies}
                      </h3>
                      <div className="space-y-2 text-[11.5px]">
                        {cv.competencies.map((c, idx) => (
                          <div key={c.id || idx}>
                            <span className="font-bold block" style={{ color: europassAsideContrast.text }}>
                              {c.category}
                            </span>
                            <span className="leading-snug" style={{ color: europassAsideContrast.mutedText }}>
                              {c.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </aside>

              <main className="cv-europass-main w-full md:w-[68%] bg-white p-6 sm:p-9 space-y-6">
                {cv.headerColor && (
                  <div
                    className="rounded-lg px-4 py-3 border"
                    style={{
                      backgroundColor: cv.headerColor,
                      borderColor: customHeaderContrast.borderColor,
                      color: customHeaderContrast.text
                    }}
                  >
                    <div className="text-base font-bold leading-tight" style={{ color: customHeaderContrast.text }}>
                      {cv.personalDetails.name}
                    </div>
                    <div className="text-xs font-medium mt-0.5" style={{ color: customHeaderContrast.mutedText }}>
                      {cv.personalDetails.title}
                    </div>
                  </div>
                )}
                {sectionOrder.map((sectionKey) => {
                  if (!isSectionVisible(sectionKey) || sectionKey === 'competencies') return null;

                  if (sectionKey === 'summary' && cv.summary) {
                    return (
                      <section key="summary" className="cv-section">
                        <h2
                          className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-1 mb-2.5"
                          style={{ borderColor: europassAccent }}
                        >
                          {euroLabels.aboutMyself}
                        </h2>
                        <p
                          contentEditable={isInlineEditing}
                          suppressContentEditableWarning
                          onBlur={(e) => onChange({ ...cv, summary: e.currentTarget.textContent || '' })}
                          className="text-xs sm:text-[13px] leading-relaxed text-slate-700"
                        >
                          {cv.summary}
                        </p>
                      </section>
                    );
                  }

                  if (sectionKey === 'experiences' && cv.experiences && cv.experiences.length > 0) {
                    return (
                      <section key="experiences" className="cv-section">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-3">
                          {sectionTitles.experiences}
                        </h2>
                        <div className="space-y-4">
                          {cv.experiences.map((exp) => (
                            <div key={exp.id} className="cv-item relative pl-4 border-l border-slate-200 space-y-1">
                              <span
                                className="w-2 h-2 rounded-full absolute -left-[4.5px] top-1"
                                style={{ backgroundColor: europassAccent }}
                              />
                              <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: europassAccent }}>
                                {exp.period}
                                {exp.location ? ` – ${exp.location}` : ''}
                              </div>
                              <div className="text-[13.5px] font-bold text-slate-900">{exp.role}</div>
                              <div className="text-xs text-slate-500 font-medium">{exp.company}</div>
                              {exp.donor && <div className="text-[11px] italic text-slate-500">{renderTextWithLinks(exp.donor)}</div>}
                              <ul className="mt-1 space-y-1 text-xs text-slate-700">
                                {exp.highlights.map((pt, pIdx) => (
                                  <li key={pIdx} className="flex items-start">
                                    <span className="mr-1.5 text-slate-400">•</span>
                                    <span className="leading-relaxed">{renderTextWithLinks(pt)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  if (sectionKey === 'educations' && cv.educations && cv.educations.length > 0) {
                    return (
                      <section key="educations" className="cv-section">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-3">
                          {sectionTitles.educations}
                        </h2>
                        <div className="space-y-3.5">
                          {cv.educations.map((edu) => (
                            <div key={edu.id} className="cv-item relative pl-4 border-l border-slate-200 space-y-0.5">
                              <span
                                className="w-2 h-2 rounded-full absolute -left-[4.5px] top-1"
                                style={{ backgroundColor: europassAccent }}
                              />
                              <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: europassAccent }}>
                                {edu.period}
                              </div>
                              <div className="text-[13.5px] font-bold text-slate-900">{edu.degree}</div>
                              <div className="text-xs text-slate-600">
                                {edu.institution}
                                {edu.gpaOrHonors ? ` (${edu.gpaOrHonors})` : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  if (sectionKey === 'trainings' && cv.trainings && cv.trainings.length > 0) {
                    return (
                      <section key="trainings" className="cv-section">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-2">
                          {sectionTitles.trainings}
                        </h2>
                        <ul className="space-y-1 text-xs text-slate-700">
                          {cv.trainings.map((tr, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-1.5 text-slate-400">•</span>
                              <span>{tr}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    );
                  }

                  if (sectionKey === 'languages' && cv.languages && cv.languages.length > 0) {
                    return (
                      <section key="languages" className="cv-section">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-3">
                          {sectionTitles.languages}
                        </h2>
                        <div className="space-y-3">
                          {cv.languages.map((langItem, idx) => {
                            const grade = extractCefrGrade(langItem.level);
                            return (
                              <div key={idx} className="cv-item border-b border-slate-100 pb-2.5 last:border-b-0">
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <span className="text-xs font-bold text-slate-900">{langItem.language}</span>
                                  <span className="text-[10.5px] font-medium text-slate-500">{langItem.level}</span>
                                </div>
                                <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
                                  <div className="bg-slate-50 rounded py-1 px-1">
                                    <div className="text-slate-500 truncate">{euroLabels.listening}</div>
                                    <div className="font-bold text-slate-900 font-mono">{grade}</div>
                                  </div>
                                  <div className="bg-slate-50 rounded py-1 px-1">
                                    <div className="text-slate-500 truncate">{euroLabels.reading}</div>
                                    <div className="font-bold text-slate-900 font-mono">{grade}</div>
                                  </div>
                                  <div className="bg-slate-50 rounded py-1 px-1">
                                    <div className="text-slate-500 truncate">{euroLabels.spokenProd}</div>
                                    <div className="font-bold text-slate-900 font-mono">{grade}</div>
                                  </div>
                                  <div className="bg-slate-50 rounded py-1 px-1">
                                    <div className="text-slate-500 truncate">{euroLabels.spokenInter}</div>
                                    <div className="font-bold text-slate-900 font-mono">{grade}</div>
                                  </div>
                                  <div className="bg-slate-50 rounded py-1 px-1">
                                    <div className="text-slate-500 truncate">{euroLabels.writing}</div>
                                    <div className="font-bold text-slate-900 font-mono">{grade}</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  }

                  if (sectionKey === 'references' && cv.references && cv.references.length > 0) {
                    return (
                      <section key="references" className="cv-section">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-2">
                          {sectionTitles.references}
                        </h2>
                        <div className="space-y-2 text-xs">
                          {cv.references.map((ref, idx) => (
                            <div key={ref.id || idx} className="cv-item flex flex-wrap justify-between gap-1">
                              <div>
                                <strong className="text-slate-900">{ref.name}</strong>
                                <span className="text-slate-600"> — {ref.institutionAndPosition}</span>
                              </div>
                              <span className="font-mono text-slate-500 text-[11px]">{ref.contact}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  return null;
                })}
              </main>
            </article>
          ) : isEuropass && europassVariant === 'banner' ? (
            /* CASE 1C: Europass Banner (Soft Gray/Custom Top Banner + Full CEFR Language Matrix Table) */
            <article
              className={`cv-a4-sheet cv-padded-sheet cv-europass-banner bg-white text-slate-900 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18),0_2px_8px_rgba(15,23,42,0.06)] border border-slate-300/70 rounded-xs p-5 sm:p-10 md:p-12 transition-all min-h-[1120px] relative overflow-hidden ${
                density === 'compact' ? 'cv-density-compact' : density === 'relaxed' ? 'cv-density-relaxed' : ''
              } ${resolvedFontClass}`}
            >
              <CVWatermarkOverlay isVisible={!hasActivePlan} />

              {/* Full-bleed Gray/Custom Top Banner */}
              <header
                className="cv-europass-banner-header border-b -mx-5 sm:-mx-10 md:-mx-12 -mt-5 sm:-mt-10 md:-mt-12 px-5 sm:px-10 md:px-12 py-6 sm:py-7 mb-6"
                style={{
                  backgroundColor: europassBannerBg,
                  borderColor: europassBannerContrast.borderColor,
                  color: europassBannerContrast.text,
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact'
                }}
              >
                <div className="flex flex-col sm:flex-row items-start gap-5">
                  {shouldRenderPhoto && (
                    <img
                      src={cv.personalDetails.photoUrl}
                      alt={cv.personalDetails.name}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-sm shrink-0 mx-auto sm:mx-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className="flex flex-wrap items-baseline justify-between gap-2 pb-2 border-b"
                      style={{ borderColor: europassBannerContrast.borderColor }}
                    >
                      <h1
                        contentEditable={isInlineEditing}
                        suppressContentEditableWarning
                        onBlur={(e) =>
                          onChange({
                            ...cv,
                            personalDetails: { ...cv.personalDetails, name: e.currentTarget.textContent || '' }
                          })
                        }
                        className="text-xl sm:text-2xl font-bold tracking-tight break-words"
                        style={{ color: europassBannerContrast.text }}
                      >
                        {cv.personalDetails.name || 'YOUR FULL NAME'}
                      </h1>
                      <div
                        contentEditable={isInlineEditing}
                        suppressContentEditableWarning
                        onBlur={(e) =>
                          onChange({
                            ...cv,
                            personalDetails: { ...cv.personalDetails, title: e.currentTarget.textContent || '' }
                          })
                        }
                        className="text-xs sm:text-sm font-semibold italic"
                        style={{ color: europassBannerContrast.mutedText }}
                      >
                        {cv.personalDetails.title}
                      </div>
                    </div>

                    <div
                      className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
                      style={{ color: europassBannerContrast.mutedText }}
                    >
                      {cv.personalDetails.phone && <span>{cv.personalDetails.phone}</span>}
                      {cv.personalDetails.email && (
                        <>
                          <span style={{ color: europassBannerContrast.subtleText }}>|</span>
                          <span className="break-all">{cv.personalDetails.email}</span>
                        </>
                      )}
                      {cv.personalDetails.website && (
                        <>
                          <span style={{ color: europassBannerContrast.subtleText }}>|</span>
                          <span className="break-all">{cv.personalDetails.website}</span>
                        </>
                      )}
                      {cv.personalDetails.linkedin && (
                        <>
                          <span style={{ color: europassBannerContrast.subtleText }}>|</span>
                          <span className="break-all">{cv.personalDetails.linkedin}</span>
                        </>
                      )}
                      {cv.personalDetails.location && (
                        <div className="w-full" style={{ color: europassBannerContrast.subtleText }}>
                          {cv.personalDetails.location}
                        </div>
                      )}
                    </div>

                    {isSectionVisible('summary') && cv.summary && (
                      <p
                        contentEditable={isInlineEditing}
                        suppressContentEditableWarning
                        onBlur={(e) => onChange({ ...cv, summary: e.currentTarget.textContent || '' })}
                        className="mt-3 text-xs sm:text-[13px] leading-relaxed"
                        style={{ color: europassBannerContrast.mutedText }}
                      >
                        {cv.summary}
                      </p>
                    )}
                  </div>
                </div>
              </header>

              {/* Main Single-Column Sections */}
              <div className="space-y-5">
                {sectionOrder.map((sectionKey) => {
                  if (!isSectionVisible(sectionKey) || sectionKey === 'summary') return null;

                  const bannerBarColor = customBarColor || (cv.accentColor && cv.accentColor !== '#0f172a' ? cv.accentColor : '#0f172a');

                  if (sectionKey === 'experiences' && cv.experiences && cv.experiences.length > 0) {
                    return (
                      <section key="experiences" className="cv-section">
                        <h2
                          className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider border-b pb-1 mb-3 flex items-center gap-1.5"
                          style={{ color: currentAccent, borderColor: bannerBarColor }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: bannerBarColor }} />
                          <span>{sectionTitles.experiences}</span>
                        </h2>
                        <div className="space-y-4">
                          {cv.experiences.map((exp) => (
                            <div key={exp.id} className="cv-item space-y-1">
                              <div className="text-[11px] font-semibold uppercase text-slate-500">
                                {exp.period}
                                {exp.location ? ` – ${exp.location}` : ''}
                              </div>
                              <div className="text-[13.5px] font-bold text-slate-950">
                                {exp.role} <span className="font-normal text-slate-600">— {exp.company}</span>
                              </div>
                              {exp.donor && <div className="text-xs italic text-slate-600">{renderTextWithLinks(exp.donor)}</div>}
                              <ul className="mt-1 space-y-1 text-[13px] text-slate-800">
                                {exp.highlights.map((pt, pIdx) => (
                                  <li key={pIdx} className="flex items-start">
                                    <span className="mr-2 text-slate-400">•</span>
                                    <span className="leading-relaxed">{renderTextWithLinks(pt)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  if (sectionKey === 'educations' && cv.educations && cv.educations.length > 0) {
                    return (
                      <section key="educations" className="cv-section">
                        <h2
                          className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider border-b pb-1 mb-3 flex items-center gap-1.5"
                          style={{ color: currentAccent, borderColor: bannerBarColor }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: bannerBarColor }} />
                          <span>{sectionTitles.educations}</span>
                        </h2>
                        <div className="space-y-2.5 text-[13px] text-slate-800">
                          {cv.educations.map((edu) => (
                            <div key={edu.id} className="cv-item">
                              <div className="text-[11px] font-semibold uppercase text-slate-500">{edu.period}</div>
                              <div>
                                <strong className="text-slate-950 uppercase text-xs">{edu.degree}</strong>
                                <span> — {edu.institution}</span>
                                {edu.gpaOrHonors && <span className="text-slate-600 text-xs ml-1">({edu.gpaOrHonors})</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  if (sectionKey === 'competencies' && cv.competencies && cv.competencies.length > 0) {
                    return (
                      <section key="competencies" className="cv-section">
                        <h2
                          className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider border-b pb-1 mb-2 flex items-center gap-1.5"
                          style={{ color: currentAccent, borderColor: bannerBarColor }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: bannerBarColor }} />
                          <span>{sectionTitles.competencies}</span>
                        </h2>
                        <ul className="space-y-1 text-[13px] text-slate-800">
                          {cv.competencies.map((comp, idx) => (
                            <li key={comp.id || idx} className="cv-item flex items-start">
                              <span className="mr-2 text-slate-400">•</span>
                              <div>
                                <strong className="font-semibold text-slate-900">{comp.category}:</strong>{' '}
                                <span>{comp.description}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </section>
                    );
                  }

                  if (sectionKey === 'trainings' && cv.trainings && cv.trainings.length > 0) {
                    return (
                      <section key="trainings" className="cv-section">
                        <h2
                          className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider border-b pb-1 mb-2 flex items-center gap-1.5"
                          style={{ color: currentAccent, borderColor: bannerBarColor }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: bannerBarColor }} />
                          <span>{sectionTitles.trainings}</span>
                        </h2>
                        <ul className="space-y-1 text-[13px] text-slate-800">
                          {cv.trainings.map((tr, idx) => (
                            <li key={idx} className="cv-item flex items-start">
                              <span className="mr-2 text-slate-400">•</span>
                              <span>{tr}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    );
                  }

                  if (sectionKey === 'languages' && cv.languages && cv.languages.length > 0) {
                    return (
                      <section key="languages" className="cv-section">
                        <h2
                          className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider border-b pb-1 mb-3 flex items-center gap-1.5"
                          style={{ color: currentAccent, borderColor: bannerBarColor }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: bannerBarColor }} />
                          <span>{sectionTitles.languages}</span>
                        </h2>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-slate-300 text-[11px] text-center">
                            <thead>
                              <tr className="bg-slate-100 text-slate-800 font-bold uppercase">
                                <th className="border border-slate-300 p-1.5 text-left" rowSpan={2}>
                                  {currentTitles.europassLangCol}
                                </th>
                                <th className="border border-slate-300 p-1" colSpan={2}>
                                  {euroLabels.understanding}
                                </th>
                                <th className="border border-slate-300 p-1" colSpan={2}>
                                  {euroLabels.speaking}
                                </th>
                                <th className="border border-slate-300 p-1" rowSpan={2}>
                                  {euroLabels.writing}
                                </th>
                              </tr>
                              <tr className="bg-slate-50 text-slate-600 text-[10px]">
                                <th className="border border-slate-300 p-1 font-medium">{euroLabels.listening}</th>
                                <th className="border border-slate-300 p-1 font-medium">{euroLabels.reading}</th>
                                <th className="border border-slate-300 p-1 font-medium">{euroLabels.spokenProd}</th>
                                <th className="border border-slate-300 p-1 font-medium">{euroLabels.spokenInter}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cv.languages.map((langItem, idx) => {
                                const grade = extractCefrGrade(langItem.level);
                                return (
                                  <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                                    <td className="border border-slate-300 p-1.5 text-left font-bold text-slate-900 uppercase">
                                      {langItem.language}
                                    </td>
                                    <td className="border border-slate-300 p-1.5 font-mono font-semibold">{grade}</td>
                                    <td className="border border-slate-300 p-1.5 font-mono font-semibold">{grade}</td>
                                    <td className="border border-slate-300 p-1.5 font-mono font-semibold">{grade}</td>
                                    <td className="border border-slate-300 p-1.5 font-mono font-semibold">{grade}</td>
                                    <td className="border border-slate-300 p-1.5 font-mono font-semibold">{grade}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <p className="mt-1.5 text-[10px] text-slate-500">{euroLabels.cefrNote}</p>
                      </section>
                    );
                  }

                  if (sectionKey === 'references' && cv.references && cv.references.length > 0) {
                    return (
                      <section key="references" className="cv-section">
                        <h2
                          className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider border-b pb-1 mb-2 flex items-center gap-1.5"
                          style={{ color: currentAccent, borderColor: bannerBarColor }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: bannerBarColor }} />
                          <span>{sectionTitles.references}</span>
                        </h2>
                        <div className="space-y-2 text-xs">
                          {cv.references.map((ref, idx) => (
                            <div key={ref.id || idx} className="cv-item flex flex-wrap justify-between gap-1">
                              <div>
                                <strong className="text-slate-900">{ref.name}</strong>
                                <span className="text-slate-600"> — {ref.institutionAndPosition}</span>
                              </div>
                              <span className="font-mono text-slate-500 text-[11px]">{ref.contact}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  return null;
                })}
              </div>
            </article>
          ) : isEuropass && europassVariant === 'framed' ? (
            /* CASE 1D: Europass Modern Frame (Corner Brackets + Position & 2-Col Languages) */
            <article
              className={`cv-a4-sheet cv-europass-framed bg-white text-slate-900 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18),0_2px_8px_rgba(15,23,42,0.06)] border border-slate-300/70 rounded-xs p-6 sm:p-10 md:p-12 transition-all min-h-[1120px] relative overflow-hidden ${
                density === 'compact' ? 'cv-density-compact' : density === 'relaxed' ? 'cv-density-relaxed' : ''
              } ${resolvedFontClass}`}
            >
              <CVWatermarkOverlay isVisible={!hasActivePlan} />

              {/* Decorative L-shaped corner brackets */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-0 w-10 h-10 border-t-[8px] border-l-[8px]"
                style={{ borderColor: customBarColor || europassAccent }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-0 right-0 w-10 h-10 border-t-[8px] border-r-[8px]"
                style={{ borderColor: customBarColor || europassAccent }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-0 w-10 h-10 border-b-[8px] border-l-[8px]"
                style={{ borderColor: customBarColor || europassAccent }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 right-0 w-10 h-10 border-b-[8px] border-r-[8px]"
                style={{ borderColor: customBarColor || europassAccent }}
              />

              {/* Top Header */}
              <header
                className={`flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-5 mb-5 border-b ${
                  cv.headerColor ? 'rounded-xl p-5 border-transparent' : 'border-slate-200'
                }`}
                style={
                  cv.headerColor
                    ? {
                        backgroundColor: cv.headerColor,
                        color: customHeaderContrast.text,
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact'
                      }
                    : undefined
                }
              >
                {shouldRenderPhoto && (
                  <img
                    src={cv.personalDetails.photoUrl}
                    alt={cv.personalDetails.name}
                    className="w-24 h-24 rounded-full object-cover border-2 shadow-sm shrink-0"
                    style={{ borderColor: customBarColor || europassAccent }}
                  />
                )}
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h1
                    contentEditable={isInlineEditing}
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, name: e.currentTarget.textContent || '' }
                      })
                    }
                    className="text-2xl sm:text-3xl font-bold tracking-tight break-words"
                    style={{ color: cv.headerColor ? customHeaderContrast.text : europassAccent }}
                  >
                    {cv.personalDetails.name || 'YOUR FULL NAME'}
                  </h1>

                  <div
                    className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs"
                    style={{ color: cv.headerColor ? customHeaderContrast.mutedText : '#334155' }}
                  >
                    {cv.personalDetails.location && (
                      <div className="flex items-center justify-center sm:justify-start gap-1.5">
                        <MapPin
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: cv.headerColor ? customHeaderContrast.text : europassAccent }}
                        />
                        <span>{cv.personalDetails.location}</span>
                      </div>
                    )}
                    {cv.personalDetails.phone && (
                      <div className="flex items-center justify-center sm:justify-start gap-1.5">
                        <Phone
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: cv.headerColor ? customHeaderContrast.text : europassAccent }}
                        />
                        <span>{cv.personalDetails.phone}</span>
                      </div>
                    )}
                    {cv.personalDetails.email && (
                      <div className="flex items-center justify-center sm:justify-start gap-1.5">
                        <Mail
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: cv.headerColor ? customHeaderContrast.text : europassAccent }}
                        />
                        <span className="break-all">{cv.personalDetails.email}</span>
                      </div>
                    )}
                    {cv.personalDetails.website && (
                      <div className="flex items-center justify-center sm:justify-start gap-1.5">
                        <Globe
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: cv.headerColor ? customHeaderContrast.text : europassAccent }}
                        />
                        <span className="break-all">{cv.personalDetails.website}</span>
                      </div>
                    )}
                  </div>
                </div>
              </header>

              {/* Dedicated Position Field */}
              {cv.personalDetails.title && (
                <section className="cv-section mb-4">
                  <h2
                    className="text-xs font-extrabold uppercase tracking-wider pb-1 mb-1.5 border-b"
                    style={{ color: europassAccent, borderColor: europassAccent }}
                  >
                    {euroLabels.position}
                  </h2>
                  <p
                    contentEditable={isInlineEditing}
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, title: e.currentTarget.textContent || '' }
                      })
                    }
                    className="text-[13.5px] font-semibold text-slate-800"
                  >
                    {cv.personalDetails.title}
                  </p>
                </section>
              )}

              <div className="space-y-5">
                {sectionOrder.map((sectionKey) => {
                  if (!isSectionVisible(sectionKey)) return null;

                  if (sectionKey === 'summary' && cv.summary) {
                    return (
                      <section key="summary" className="cv-section">
                        <h2
                          className="text-xs font-extrabold uppercase tracking-wider pb-1 mb-2 border-b"
                          style={{ color: europassAccent, borderColor: europassAccent }}
                        >
                          {euroLabels.aboutMyself}
                        </h2>
                        <p
                          contentEditable={isInlineEditing}
                          suppressContentEditableWarning
                          onBlur={(e) => onChange({ ...cv, summary: e.currentTarget.textContent || '' })}
                          className="text-[13px] leading-relaxed text-slate-800"
                        >
                          {cv.summary}
                        </p>
                      </section>
                    );
                  }

                  if (sectionKey === 'experiences' && cv.experiences && cv.experiences.length > 0) {
                    return (
                      <section key="experiences" className="cv-section">
                        <h2
                          className="text-xs font-extrabold uppercase tracking-wider pb-1 mb-2.5 border-b"
                          style={{ color: europassAccent, borderColor: europassAccent }}
                        >
                          {sectionTitles.experiences}
                        </h2>
                        <div className="space-y-4">
                          {cv.experiences.map((exp) => (
                            <div key={exp.id} className="cv-item space-y-0.5">
                              <div className="text-[13.5px]">
                                <span className="font-bold" style={{ color: europassAccent }}>
                                  {exp.role}
                                </span>{' '}
                                <span className="text-xs text-slate-500 font-mono">{exp.period}</span>
                              </div>
                              <div className="text-xs font-bold italic text-slate-800">
                                {exp.company}
                                {exp.location ? ` – ${exp.location}` : ''}
                              </div>
                              {exp.donor && <div className="text-xs italic text-slate-600">{renderTextWithLinks(exp.donor)}</div>}
                              <ul className="mt-1 space-y-1 text-[13px] text-slate-800">
                                {exp.highlights.map((pt, pIdx) => (
                                  <li key={pIdx} className="flex items-start">
                                    <span className="mr-2 text-slate-400">•</span>
                                    <span className="leading-relaxed">{renderTextWithLinks(pt)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  if (sectionKey === 'educations' && cv.educations && cv.educations.length > 0) {
                    return (
                      <section key="educations" className="cv-section">
                        <h2
                          className="text-xs font-extrabold uppercase tracking-wider pb-1 mb-2.5 border-b"
                          style={{ color: europassAccent, borderColor: europassAccent }}
                        >
                          {sectionTitles.educations}
                        </h2>
                        <div className="space-y-2.5">
                          {cv.educations.map((edu) => (
                            <div key={edu.id} className="cv-item">
                              <div className="text-[13.5px]">
                                <span className="font-bold" style={{ color: europassAccent }}>
                                  {edu.degree}
                                </span>{' '}
                                <span className="text-xs text-slate-500 font-mono">{edu.period}</span>
                              </div>
                              <div className="text-xs font-semibold italic text-slate-700">
                                {edu.institution}
                                {edu.gpaOrHonors ? ` (${edu.gpaOrHonors})` : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  if (sectionKey === 'competencies' && cv.competencies && cv.competencies.length > 0) {
                    return (
                      <section key="competencies" className="cv-section">
                        <h2
                          className="text-xs font-extrabold uppercase tracking-wider pb-1 mb-2 border-b"
                          style={{ color: europassAccent, borderColor: europassAccent }}
                        >
                          {sectionTitles.competencies}
                        </h2>
                        <ul className="space-y-1 text-[13px] text-slate-800">
                          {cv.competencies.map((comp, idx) => (
                            <li key={comp.id || idx} className="cv-item flex items-start">
                              <span className="mr-2 text-slate-400">•</span>
                              <div>
                                <strong className="font-semibold text-slate-900">{comp.category}:</strong>{' '}
                                <span>{comp.description}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </section>
                    );
                  }

                  if (sectionKey === 'trainings' && cv.trainings && cv.trainings.length > 0) {
                    return (
                      <section key="trainings" className="cv-section">
                        <h2
                          className="text-xs font-extrabold uppercase tracking-wider pb-1 mb-2 border-b"
                          style={{ color: europassAccent, borderColor: europassAccent }}
                        >
                          {sectionTitles.trainings}
                        </h2>
                        <ul className="space-y-1 text-[13px] text-slate-800">
                          {cv.trainings.map((tr, idx) => (
                            <li key={idx} className="cv-item flex items-start">
                              <span className="mr-2 text-slate-400">•</span>
                              <span>{tr}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    );
                  }

                  if (sectionKey === 'languages' && cv.languages && cv.languages.length > 0) {
                    return (
                      <section key="languages" className="cv-section">
                        <h2
                          className="text-xs font-extrabold uppercase tracking-wider pb-1 mb-2.5 border-b"
                          style={{ color: europassAccent, borderColor: europassAccent }}
                        >
                          {sectionTitles.languages}
                        </h2>
                        <div className="cv-europass-languages-grid grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {cv.languages.map((langItem, idx) => {
                            const grade = extractCefrGrade(langItem.level);
                            return (
                              <div key={idx} className="cv-item space-y-0.5">
                                <div className="font-bold" style={{ color: europassAccent }}>
                                  {langItem.language}{' '}
                                  <span className="font-normal text-slate-500 text-[11px]">({langItem.level})</span>
                                </div>
                                <div className="text-[10.5px] text-slate-700 leading-relaxed">
                                  <span className="font-semibold">{euroLabels.listening.toUpperCase()}:</span> {grade} ·{' '}
                                  <span className="font-semibold">{euroLabels.reading.toUpperCase()}:</span> {grade} ·{' '}
                                  <span className="font-semibold">{euroLabels.writing.toUpperCase()}:</span> {grade}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  }

                  if (sectionKey === 'references' && cv.references && cv.references.length > 0) {
                    return (
                      <section key="references" className="cv-section">
                        <h2
                          className="text-xs font-extrabold uppercase tracking-wider pb-1 mb-2 border-b"
                          style={{ color: europassAccent, borderColor: europassAccent }}
                        >
                          {sectionTitles.references}
                        </h2>
                        <div className="space-y-1.5 text-xs">
                          {cv.references.map((ref, idx) => (
                            <div key={ref.id || idx} className="cv-item flex flex-wrap justify-between gap-1">
                              <div>
                                <strong className="text-slate-900">{ref.name}</strong>
                                <span className="text-slate-600"> — {ref.institutionAndPosition}</span>
                              </div>
                              <span className="font-mono text-slate-500 text-[11px]">{ref.contact}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  return null;
                })}
              </div>
            </article>
          ) : isEuropass ? (
            /* CASE 1E: Europass Classic (2-Column European Margin Layout, NO EUROPASS header stamp) */
            <article
              className={`cv-a4-sheet cv-padded-sheet cv-europass-classic bg-white text-slate-900 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18),0_2px_8px_rgba(15,23,42,0.06)] border border-slate-300/70 rounded-xs p-5 sm:p-10 md:p-12 transition-all min-h-[1120px] relative overflow-hidden ${
                density === 'compact' ? 'cv-density-compact' : density === 'relaxed' ? 'cv-density-relaxed' : ''
              } ${resolvedFontClass}`}
            >
              <CVWatermarkOverlay isVisible={!hasActivePlan} />

              {/* Classic Europass Top Block */}
              <header
                className={`cv-europass-grid grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-4 sm:gap-6 items-center pb-5 mb-5 border-b ${
                  cv.headerColor ? '-mx-5 sm:-mx-10 md:-mx-12 -mt-5 sm:-mt-10 md:-mt-12 px-5 sm:px-10 md:px-12 py-6 border-transparent' : 'border-slate-200'
                }`}
                style={
                  cv.headerColor
                    ? {
                        backgroundColor: cv.headerColor,
                        color: customHeaderContrast.text,
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact'
                      }
                    : undefined
                }
              >
                <div className="flex justify-center sm:justify-end">
                  {shouldRenderPhoto ? (
                    <img
                      src={cv.personalDetails.photoUrl}
                      alt={cv.personalDetails.name}
                      className="w-24 h-24 rounded-full object-cover border-2 shadow-sm"
                      style={{ borderColor: customBarColor || europassAccent }}
                    />
                  ) : (
                    <div className="hidden sm:block" />
                  )}
                </div>
                <div className="min-w-0 text-center sm:text-left">
                  <h1
                    contentEditable={isInlineEditing}
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, name: e.currentTarget.textContent || '' }
                      })
                    }
                    className="text-2xl sm:text-3xl font-bold tracking-tight break-words"
                    style={{ color: cv.headerColor ? customHeaderContrast.text : '#0f172a' }}
                  >
                    {cv.personalDetails.name || 'YOUR FULL NAME'}
                  </h1>
                  <div
                    contentEditable={isInlineEditing}
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, title: e.currentTarget.textContent || '' }
                      })
                    }
                    className="text-sm font-semibold mt-0.5"
                    style={{ color: cv.headerColor ? customHeaderContrast.mutedText : europassAccent }}
                  >
                    {cv.personalDetails.title}
                  </div>
                  <div
                    className="mt-2.5 space-y-1 text-xs"
                    style={{ color: cv.headerColor ? customHeaderContrast.mutedText : '#334155' }}
                  >
                    {cv.personalDetails.location && (
                      <div className="flex items-center justify-center sm:justify-start gap-1.5">
                        <MapPin
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: cv.headerColor ? customHeaderContrast.text : europassAccent }}
                        />
                        <span>
                          <strong style={{ color: cv.headerColor ? customHeaderContrast.text : '#0f172a' }}>
                            {euroLabels.address}:
                          </strong>{' '}
                          {cv.personalDetails.location}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
                      {cv.personalDetails.email && (
                        <span className="flex items-center gap-1.5 break-all">
                          <Mail
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: cv.headerColor ? customHeaderContrast.text : europassAccent }}
                          />
                          <span>{cv.personalDetails.email}</span>
                        </span>
                      )}
                      {cv.personalDetails.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: cv.headerColor ? customHeaderContrast.text : europassAccent }}
                          />
                          <span>{cv.personalDetails.phone}</span>
                        </span>
                      )}
                    </div>
                    {(cv.personalDetails.website || cv.personalDetails.linkedin) && (
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
                        {cv.personalDetails.website && (
                          <span className="flex items-center gap-1.5 break-all">
                            <Globe
                              className="w-3.5 h-3.5 shrink-0"
                              style={{ color: cv.headerColor ? customHeaderContrast.text : europassAccent }}
                            />
                            <span>{cv.personalDetails.website}</span>
                          </span>
                        )}
                        {cv.personalDetails.linkedin && (
                          <span className="flex items-center gap-1.5 break-all">
                            <Linkedin
                              className="w-3.5 h-3.5 shrink-0"
                              style={{ color: cv.headerColor ? customHeaderContrast.text : europassAccent }}
                            />
                            <span>{cv.personalDetails.linkedin}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </header>

              {/* 2-Column Margin Grid Sections */}
              <div className="space-y-5">
                {sectionOrder.map((sectionKey) => {
                  if (!isSectionVisible(sectionKey)) return null;
                  const classicBorderColor = customBarColor || '#e2e8f0';

                  if (sectionKey === 'summary' && cv.summary) {
                    return (
                      <section key="summary" className="cv-section cv-europass-grid grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-y-1.5 gap-x-6">
                        <h2
                          className="cv-europass-label text-xs font-extrabold uppercase tracking-wider sm:text-right pt-0.5"
                          style={{ color: europassAccent }}
                        >
                          {euroLabels.aboutMyself}
                        </h2>
                        <p
                          contentEditable={isInlineEditing}
                          suppressContentEditableWarning
                          onBlur={(e) => onChange({ ...cv, summary: e.currentTarget.textContent || '' })}
                          className="text-[13px] leading-relaxed text-slate-800 border-t pt-1.5 sm:border-t-0 sm:pt-0"
                          style={{ borderColor: classicBorderColor }}
                        >
                          {cv.summary}
                        </p>
                      </section>
                    );
                  }

                  if (sectionKey === 'experiences' && cv.experiences && cv.experiences.length > 0) {
                    return (
                      <section key="experiences" className="cv-section space-y-4">
                        {cv.experiences.map((exp, idx) => (
                          <div key={exp.id} className="cv-item cv-europass-grid grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-y-1 gap-x-6">
                            <div className="cv-europass-label sm:text-right">
                              {idx === 0 && (
                                <h2
                                  className="text-xs font-extrabold uppercase tracking-wider mb-1"
                                  style={{ color: europassAccent }}
                                >
                                  {sectionTitles.experiences}
                                </h2>
                              )}
                              <div className="text-[11px] font-mono text-slate-500">[ {exp.period} ]</div>
                            </div>
                            <div
                              className={idx === 0 ? 'border-t pt-2' : 'pt-1'}
                              style={idx === 0 ? { borderColor: classicBorderColor } : undefined}
                            >
                              <div className="text-[14px] font-bold" style={{ color: europassAccent }}>
                                {exp.role}
                              </div>
                              <div className="text-xs font-semibold text-slate-800">
                                {exp.company}
                                {exp.location ? ` · ${exp.location}` : ''}
                              </div>
                              {exp.donor && <div className="text-xs italic text-slate-600 mt-0.5">{renderTextWithLinks(exp.donor)}</div>}
                              <ul className="mt-1.5 space-y-1 text-[13px] text-slate-800">
                                {exp.highlights.map((pt, pIdx) => (
                                  <li key={pIdx} className="flex items-start">
                                    <span className="mr-2 text-slate-400">•</span>
                                    <span className="leading-relaxed">{renderTextWithLinks(pt)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </section>
                    );
                  }

                  if (sectionKey === 'educations' && cv.educations && cv.educations.length > 0) {
                    return (
                      <section key="educations" className="cv-section space-y-3">
                        {cv.educations.map((edu, idx) => (
                          <div key={edu.id} className="cv-item cv-europass-grid grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-y-1 gap-x-6">
                            <div className="cv-europass-label sm:text-right">
                              {idx === 0 && (
                                <h2
                                  className="text-xs font-extrabold uppercase tracking-wider mb-1"
                                  style={{ color: europassAccent }}
                                >
                                  {sectionTitles.educations}
                                </h2>
                              )}
                              <div className="text-[11px] font-mono text-slate-500">[ {edu.period} ]</div>
                            </div>
                            <div
                              className={idx === 0 ? 'border-t pt-2' : 'pt-0.5'}
                              style={idx === 0 ? { borderColor: classicBorderColor } : undefined}
                            >
                              <div className="text-[14px] font-bold" style={{ color: europassAccent }}>
                                {edu.degree}
                              </div>
                              <div className="text-xs font-semibold text-slate-800">
                                {edu.institution}
                                {edu.gpaOrHonors ? ` (${edu.gpaOrHonors})` : ''}
                              </div>
                            </div>
                          </div>
                        ))}
                      </section>
                    );
                  }

                  if (sectionKey === 'competencies' && cv.competencies && cv.competencies.length > 0) {
                    return (
                      <section key="competencies" className="cv-section cv-europass-grid grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-y-1.5 gap-x-6">
                        <h2
                          className="cv-europass-label text-xs font-extrabold uppercase tracking-wider sm:text-right pt-2"
                          style={{ color: europassAccent }}
                        >
                          {sectionTitles.competencies}
                        </h2>
                        <ul className="border-t pt-2 space-y-1.5 text-[13px] text-slate-800" style={{ borderColor: classicBorderColor }}>
                          {cv.competencies.map((comp, idx) => (
                            <li key={comp.id || idx} className="cv-item flex items-start">
                              <span className="mr-2 text-slate-400">•</span>
                              <div>
                                <strong className="font-semibold text-slate-900">{comp.category}:</strong>{' '}
                                <span>{comp.description}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </section>
                    );
                  }

                  if (sectionKey === 'trainings' && cv.trainings && cv.trainings.length > 0) {
                    return (
                      <section key="trainings" className="cv-section cv-europass-grid grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-y-1.5 gap-x-6">
                        <h2
                          className="cv-europass-label text-xs font-extrabold uppercase tracking-wider sm:text-right pt-2"
                          style={{ color: europassAccent }}
                        >
                          {sectionTitles.trainings}
                        </h2>
                        <ul className="border-t pt-2 space-y-1 text-[13px] text-slate-800" style={{ borderColor: classicBorderColor }}>
                          {cv.trainings.map((tr, idx) => (
                            <li key={idx} className="cv-item flex items-start">
                              <span className="mr-2 text-slate-400">•</span>
                              <span>{tr}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    );
                  }

                  if (sectionKey === 'languages' && cv.languages && cv.languages.length > 0) {
                    return (
                      <section key="languages" className="cv-section cv-europass-grid grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-y-1.5 gap-x-6">
                        <h2
                          className="cv-europass-label text-xs font-extrabold uppercase tracking-wider sm:text-right pt-2"
                          style={{ color: europassAccent }}
                        >
                          {sectionTitles.languages}
                        </h2>
                        <div className="border-t pt-2 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-slate-800" style={{ borderColor: classicBorderColor }}>
                          {cv.languages.map((l, idx) => (
                            <div key={idx} className="cv-item flex items-center gap-1.5">
                              <strong className="font-semibold text-slate-950">• {l.language}:</strong>
                              <span className="text-slate-700">{l.level}</span>
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 font-mono border border-blue-200"
                                style={{ color: europassAccent }}
                              >
                                {extractCefrGrade(l.level)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  if (sectionKey === 'references' && cv.references && cv.references.length > 0) {
                    return (
                      <section key="references" className="cv-section cv-europass-grid grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-y-1.5 gap-x-6">
                        <h2
                          className="cv-europass-label text-xs font-extrabold uppercase tracking-wider sm:text-right pt-2"
                          style={{ color: europassAccent }}
                        >
                          {sectionTitles.references}
                        </h2>
                        <div className="border-t pt-2 space-y-2 text-xs" style={{ borderColor: customBarColor || '#e2e8f0' }}>
                          {cv.references.map((ref, idx) => (
                            <div key={ref.id || idx} className="cv-item flex flex-wrap justify-between gap-1">
                              <div>
                                <strong className="text-slate-900">{ref.name}</strong>
                                <span className="text-slate-600"> — {ref.institutionAndPosition}</span>
                              </div>
                              <span className="font-mono text-slate-500 text-[11px]">{ref.contact}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  return null;
                })}
              </div>
            </article>
          ) : (
            /* CASE 2: Single Column / Official Executive Layouts (Harvard, ATS, Corporativo, Tech, etc.) */
            <article
              className={`cv-a4-sheet cv-padded-sheet cv-single-column ${
                isEditorial ? 'cv-editorial-sheet' : ''
              } ${cv.headerColor ? 'cv-custom-header' : ''} bg-white text-slate-900 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18),0_2px_8px_rgba(15,23,42,0.06)] border border-slate-300/70 rounded-xs p-5 sm:p-10 md:p-12 transition-all min-h-[1120px] relative overflow-hidden ${
                density === 'compact' ? 'cv-density-compact' : density === 'relaxed' ? 'cv-density-relaxed' : ''
              } ${isBoard || cv.barColor ? 'border-t-[6px]' : ''} ${resolvedFontClass}`}
              style={isBoard || cv.barColor ? { borderTopColor: customBarColor || currentAccent } : undefined}
            >
              <CVWatermarkOverlay isVisible={!hasActivePlan} />
              {/* Header Section */}
              <header
                className={`cv-header ${
                  isEditorial || cv.headerColor
                    ? '-mx-5 sm:-mx-10 md:-mx-12 -mt-5 sm:-mt-10 md:-mt-12 px-5 sm:px-10 md:px-12 py-6 sm:py-8 mb-6'
                    : isFinance
                    ? 'border-b-4 border-double border-slate-900 pb-4 text-left'
                    : isBoard
                    ? 'text-center border-b border-slate-300 pb-5'
                    : isHarvard
                    ? 'border-b-2 pb-4 text-left'
                    : isClassic
                    ? 'text-center border-b border-slate-200 pb-4'
                    : isEuropass
                    ? 'border-b-2 pb-5'
                    : isModern || isTech || isProduct || isBlueprint
                    ? 'text-left border-b-2 pb-4'
                    : 'text-left pb-2'
                }`}
                style={
                  isEditorial || cv.headerColor
                    ? {
                        backgroundColor: customHeaderColor || currentAccent,
                        color: customHeaderContrast.text,
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact'
                      }
                    : {
                        borderColor: customBarColor
                          ? customBarColor
                          : isFinance
                          ? '#0f172a'
                          : isModern || isHarvard || isEuropass || isTech || isProduct || isBlueprint
                          ? currentAccent
                          : '#e2e8f0'
                      }
                }
              >
                <div
                  className={`cv-header-content flex flex-col sm:flex-row items-center justify-between gap-4 ${
                    isClassic || isBoard ? 'sm:justify-center' : ''
                  }`}
                >
                  {/* Left / Main text details */}
                  <div className={`flex-1 min-w-0 ${isClassic || isBoard ? 'text-center' : 'text-left'}`}>
                    {/* Tech header badge */}
                    {isTech && (
                      <div className="flex items-center gap-1.5 mb-2 font-mono text-[11px] text-teal-700 font-semibold tracking-wide">
                        <Terminal className="w-3.5 h-3.5 text-teal-600" />
                        <span>
                          {cv.templateStyle === 'data_science_ai'
                            ? '// DATA SCIENCE, ANALYTICS & AI'
                            : '// TECH & SOFTWARE ENGINEERING'}
                        </span>
                      </div>
                    )}

                    {/* Principal Engineering Blueprint tag */}
                    {isBlueprint && (
                      <div className="text-[10px] font-mono tracking-widest uppercase mb-1.5 font-semibold" style={{ color: currentAccent }}>
                        {cv.templateStyle === 'engineering_resume'
                          ? 'ENGINEERING & TECHNICAL SYSTEMS'
                          : 'SYSTEMS ARCHITECTURE · PRINCIPAL ENGINEERING'}
                      </div>
                    )}

                    {/* Wall Street Finance tag */}
                    {isFinance && (
                      <div className="text-[10px] font-serif tracking-[0.2em] uppercase text-slate-500 mb-1.5 font-semibold">
                        INSTITUTIONAL FINANCE &amp; AUDIT STANDARD
                      </div>
                    )}

                    {/* Boardroom C-Suite tag */}
                    {isBoard && (
                      <div className="text-[10px] font-serif tracking-[0.2em] uppercase text-slate-500 mb-1.5 font-semibold">
                        BOARD OF DIRECTORS &amp; C-SUITE GOVERNANCE
                      </div>
                    )}

                    {/* Product & Growth tag */}
                    {isProduct && (
                      <div className="text-[10px] font-jakarta tracking-[0.16em] uppercase mb-1.5 font-bold" style={{ color: currentAccent }}>
                        {cv.templateStyle === 'project_based'
                          ? 'PROJECT DELIVERY & PMO LEADERSHIP'
                          : cv.templateStyle === 'freelancer_consultant'
                          ? 'INDEPENDENT CONSULTING & CLIENT DELIVERY'
                          : cv.templateStyle === 'business_analyst'
                          ? 'BUSINESS ANALYSIS & STRATEGY'
                          : 'PRODUCT STRATEGY & GROWTH LEADERSHIP'}
                      </div>
                    )}

                    {/* Two-Tone Editorial tag */}
                    {isEditorial && (
                      <div className="text-[10px] font-jakarta tracking-[0.18em] uppercase text-white/75 mb-1.5 font-semibold">
                        {cv.templateStyle === 'marketing_professional'
                          ? 'MARKETING & DIGITAL BRAND PROFILE'
                          : 'EXECUTIVE EDITORIAL PROFILE'}
                      </div>
                    )}

                    {/* Minimalist Nordic tag */}
                    {cv.templateStyle === 'hybrid_minimalist' && (
                      <div className="text-[10px] font-mono tracking-widest uppercase text-slate-400 mb-1.5 font-semibold">
                        CURRICULUM VITAE · NORDIC EDITION
                      </div>
                    )}

                    {/* Strict Mono ATS indicator */}
                    {isStrictMonoAts && (
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-300 pb-1">
                        [ATS COMPACT · OCR PARSER COMPLIANT]
                      </div>
                    )}

                    {/* Academic Lattes tag */}
                    {isAcademicLattes && (
                      <div className="mb-3 border-y border-slate-700/60 py-1.5 text-center font-serif">
                        <div className="text-[11px] font-bold tracking-wider uppercase text-slate-800">
                          SCIENTIFIC &amp; ACADEMIC CURRICULUM VITAE
                        </div>
                        <div className="text-[9.5px] text-slate-500 italic">
                          Indexed Research, Grants &amp; University Faculty Standard
                        </div>
                      </div>
                    )}

                    {/* UN / Governance tag */}
                    {isClassic && (
                      <div className="flex items-center justify-center gap-1.5 mb-2 font-serif text-[11px] text-blue-900 font-bold tracking-wider uppercase">
                        <Globe className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                        <span>
                          {cv.templateStyle === 'ngo_humanitarian'
                            ? 'HUMANITARIAN & INTERNATIONAL PROGRAMS'
                            : cv.templateStyle === 'government_public'
                            ? 'PUBLIC SECTOR & INSTITUTIONAL RECORD'
                            : 'INTERNATIONAL GOVERNANCE & PROGRAMS STANDARD'}
                        </span>
                      </div>
                    )}

                    <h1
                      contentEditable={isInlineEditing}
                      suppressContentEditableWarning
                      onBlur={(e) =>
                        onChange({
                          ...cv,
                          personalDetails: { ...cv.personalDetails, name: e.currentTarget.textContent || '' }
                        })
                      }
                      className={`font-bold tracking-tight uppercase break-words ${
                        isHarvard || isFinance || isBoard
                          ? 'text-2xl sm:text-3xl tracking-wide font-serif-cv'
                          : isClassic
                          ? 'text-2xl sm:text-3xl font-serif-cv'
                          : isEuropass
                          ? 'text-2xl sm:text-3xl font-extrabold text-[#003399]'
                          : isTech || isBlueprint || isProduct || isEditorial
                          ? 'text-2xl sm:text-3xl font-black font-jakarta tracking-tight'
                          : 'text-2xl sm:text-3xl tracking-tight'
                      }`}
                      style={{
                        color:
                          isEditorial || cv.headerColor
                            ? customHeaderContrast.text
                            : isEuropass
                            ? '#003399'
                            : isFinance
                            ? '#0f172a'
                            : currentAccent
                      }}
                    >
                      {cv.personalDetails.name || 'YOUR FULL NAME'}
                    </h1>

                    <div
                      contentEditable={isInlineEditing}
                      suppressContentEditableWarning
                      onBlur={(e) =>
                        onChange({
                          ...cv,
                          personalDetails: { ...cv.personalDetails, title: e.currentTarget.textContent || '' }
                        })
                      }
                      className={`text-sm sm:text-base font-semibold mt-1 ${
                        isEditorial || cv.headerColor
                          ? ''
                          : isHarvard || isBoard
                          ? 'text-slate-700 italic font-serif-cv'
                          : isTech || isBlueprint
                          ? 'text-teal-700 font-mono text-xs sm:text-sm'
                          : 'text-slate-800'
                      }`}
                      style={isEditorial || cv.headerColor ? { color: customHeaderContrast.mutedText } : undefined}
                    >
                      {cv.personalDetails.title}
                    </div>

                    <div
                      className={`text-xs sm:text-[13px] mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0 break-words ${
                        isEditorial || cv.headerColor ? '' : 'text-slate-600'
                      } ${isClassic || isBoard ? 'justify-center' : 'justify-start'}`}
                      style={isEditorial || cv.headerColor ? { color: customHeaderContrast.mutedText } : undefined}
                    >
                      <span>{cv.personalDetails.location}</span>
                      <span aria-hidden="true" style={isEditorial || cv.headerColor ? { color: customHeaderContrast.subtleText } : undefined} className={isEditorial || cv.headerColor ? '' : 'text-slate-400'}>|</span>
                      <span>{cv.personalDetails.phone}</span>
                      <span aria-hidden="true" style={isEditorial || cv.headerColor ? { color: customHeaderContrast.subtleText } : undefined} className={isEditorial || cv.headerColor ? '' : 'text-slate-400'}>|</span>
                      <a
                        href={`mailto:${cv.personalDetails.email}`}
                        className="hover:underline break-all sm:break-normal"
                        style={isEditorial || cv.headerColor ? { color: customHeaderContrast.text } : undefined}
                      >
                        {cv.personalDetails.email}
                      </a>
                      {cv.personalDetails.linkedin && (
                        <>
                          <span aria-hidden="true" style={isEditorial || cv.headerColor ? { color: customHeaderContrast.subtleText } : undefined} className={isEditorial || cv.headerColor ? '' : 'text-slate-400'}>|</span>
                          <span className="break-all sm:break-normal">{cv.personalDetails.linkedin}</span>
                        </>
                      )}
                      {cv.personalDetails.website && (
                        <>
                          <span aria-hidden="true" style={isEditorial || cv.headerColor ? { color: customHeaderContrast.subtleText } : undefined} className={isEditorial || cv.headerColor ? '' : 'text-slate-400'}>|</span>
                          {getSafeHttpUrl(cv.personalDetails.website) ? (
                            <a
                              href={getSafeHttpUrl(cv.personalDetails.website)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline font-semibold break-all sm:break-normal"
                              style={{ color: isEditorial || cv.headerColor ? customHeaderContrast.text : currentAccent }}
                            >
                              {cv.personalDetails.website}
                            </a>
                          ) : (
                            <span
                              className="font-semibold break-all sm:break-normal"
                              style={{ color: isEditorial || cv.headerColor ? customHeaderContrast.text : currentAccent }}
                            >
                              {cv.personalDetails.website}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Photo for European, Modern, Minimalist, Tech, Classic, Product, Editorial */}
                  {shouldRenderPhoto && (
                    <div className="cv-photo-container shrink-0 flex flex-col items-center">
                      <img
                        src={cv.personalDetails.photoUrl}
                        alt={cv.personalDetails.name}
                        className={`w-24 h-24 sm:w-28 sm:h-28 object-cover border-2 shadow-sm ${
                          isEuropass
                            ? 'rounded-xl border-blue-600/60 p-0.5'
                            : isEditorial
                            ? 'rounded-xl border-white/50'
                            : isProduct
                            ? 'rounded-xl border-slate-300'
                            : isModern
                            ? 'rounded-full border-slate-300'
                            : isTech
                            ? 'rounded-xl border-slate-400'
                            : 'rounded-lg border-slate-200'
                        }`}
                        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                      />
                      {isEuropass && (
                        <span className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                          {currentTitles.formalPhoto}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </header>

              {/* Dynamic Sections Rendered According to Custom User Section Order & Visibility */}
              {sectionOrder.map((sectionKey, secIdx) => {
                if (!isSectionVisible(sectionKey)) return null;

                const getSectionHeaderStyle = () => {
                  if (isHarvard || isFinance) {
                    return 'border-b border-slate-900 font-serif-cv tracking-wide text-slate-950';
                  }
                  if (isBoard) {
                    return 'border-b border-slate-300 font-serif-cv tracking-wider text-slate-900';
                  }
                  if (isTech) {
                    return 'border-b-2 font-mono text-[13px] text-teal-800 tracking-normal';
                  }
                  if (isBlueprint) {
                    return 'border-b font-jakarta tracking-wide text-slate-900';
                  }
                  if (isProduct || isEditorial) {
                    return 'border-b-2 font-jakarta tracking-wide';
                  }
                  if (isMinimalist) {
                    return 'border-b border-slate-200 tracking-widest text-slate-900 font-medium';
                  }
                  if (isAts) {
                    return 'border-b border-slate-400 font-mono text-slate-900';
                  }
                  if (isEuropass) {
                    return 'border-b-2 text-[#003399] font-extrabold';
                  }
                  return 'border-b border-slate-300';
                };

                const getSectionHeaderColor = () => {
                  if (isHarvard || isAts || isFinance) return undefined;
                  if (isTech) return '#0d9488';
                  if (isEuropass) return '#003399';
                  return currentAccent;
                };

                const getSectionBorderColor = () => {
                  if (customBarColor) return customBarColor;
                  if (isHarvard || isFinance) return '#0f172a';
                  if (isAts) return '#94a3b8';
                  if (isTech) return '#0d9488';
                  if (isEuropass) return '#003399';
                  return currentAccent;
                };

                if (sectionKey === 'summary' && cv.summary) {
                  return (
                    <section key="summary" className="cv-section mt-5">
                      <h2
                        className={`cv-section-title text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 mb-2 ${getSectionHeaderStyle()}`}
                        style={{ color: getSectionHeaderColor(), borderColor: getSectionBorderColor() }}
                      >
                        {getSectionPrefix(secIdx)}
                        <span>{sectionTitles.summary}</span>
                      </h2>
                      <p
                        contentEditable={isInlineEditing}
                        suppressContentEditableWarning
                        onBlur={(e) => onChange({ ...cv, summary: e.currentTarget.textContent || '' })}
                        className={`text-[13.5px] sm:text-[14px] leading-relaxed text-slate-800 text-justify ${
                          isMinimalist ? 'font-light leading-relaxed' : ''
                        } ${isProduct ? 'bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-left' : ''}`}
                      >
                        {cv.summary}
                      </p>
                    </section>
                  );
                }

                if (sectionKey === 'competencies' && cv.competencies && cv.competencies.length > 0) {
                  return (
                    <section key="competencies" className="cv-section mt-5">
                      <h2
                        className={`cv-section-title text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 mb-2 ${getSectionHeaderStyle()}`}
                        style={{ color: getSectionHeaderColor(), borderColor: getSectionBorderColor() }}
                      >
                        {getSectionPrefix(secIdx)}
                        <span>{sectionTitles.competencies}</span>
                      </h2>

                      {isTech || isProduct || isBlueprint ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {cv.competencies.map((comp, idx) => (
                            <div key={comp.id || idx} className="p-2.5 bg-slate-50/80 border border-slate-200 rounded-lg">
                              <span
                                className={`font-bold text-[11px] block ${isTech || isBlueprint ? 'font-mono' : 'font-jakarta'}`}
                                style={{ color: isTech ? '#115e59' : currentAccent }}
                              >
                                {comp.category}
                              </span>
                              <span className="text-slate-700 text-[11px] leading-relaxed">{comp.description}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <ul className="space-y-1.5 text-[13.5px] sm:text-[14px] text-slate-800">
                          {cv.competencies.map((comp, idx) => (
                            <li key={comp.id || idx} className="cv-item flex items-start">
                              <span className="mr-2 text-slate-400 font-bold">•</span>
                              <div>
                                <strong className="font-semibold text-slate-900">{comp.category}:</strong>{' '}
                                <span>{comp.description}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  );
                }

                if (sectionKey === 'experiences' && cv.experiences && cv.experiences.length > 0) {
                  return (
                    <React.Fragment key="experiences">
                      <section className="cv-section mt-5">
                        <h2
                          className={`cv-section-title text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 mb-3 ${getSectionHeaderStyle()}`}
                          style={{ color: getSectionHeaderColor(), borderColor: getSectionBorderColor() }}
                        >
                          {getSectionPrefix(secIdx)}
                          <span>{sectionTitles.experiences}</span>
                        </h2>
                        <div className="space-y-5">
                          {cv.experiences.map((exp) => (
                            <div key={exp.id} className="cv-item space-y-1">
                              {isTech || isBlueprint ? (
                                <div className="flex flex-wrap justify-between items-baseline gap-1">
                                  <span className="text-[14.5px] font-bold text-slate-950 font-jakarta">
                                    {exp.role}{' '}
                                    <span className="font-medium" style={{ color: isTech ? '#0f766e' : currentAccent }}>
                                      @ {exp.company}
                                    </span>
                                  </span>
                                  <span className="font-mono text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    {exp.period}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-wrap justify-between items-baseline gap-1">
                                  <span className="text-[14.5px] font-bold text-slate-950">{exp.company}</span>
                                  {exp.location && <span className="text-xs text-slate-500 font-medium">{exp.location}</span>}
                                </div>
                              )}

                              {!(isTech || isBlueprint) && (
                                <div className="text-[13.5px] font-semibold text-slate-800 flex flex-wrap justify-between items-center gap-1">
                                  <span className={isHarvard || isBoard || isFinance ? 'italic font-serif-cv' : ''}>{exp.role}</span>
                                  <span className="font-normal text-slate-600 text-xs sm:text-[13px] font-mono">{exp.period}</span>
                                </div>
                              )}

                              {exp.donor && (
                                <div className="text-xs italic text-slate-600">
                                  {renderTextWithLinks(exp.donor)}
                                </div>
                              )}

                              <ul className="mt-1.5 space-y-1.5 text-[13px] sm:text-[13.5px] text-slate-800">
                                {exp.highlights.map((pt, pIdx) => (
                                  <li key={pIdx} className="flex items-start">
                                    <span className={`mr-2 font-bold ${isTech ? 'text-teal-600 font-mono' : 'text-slate-400'}`}>
                                      {isTech ? '>' : '•'}
                                    </span>
                                    <span className="leading-relaxed">{renderTextWithLinks(pt)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* Visual Page Break Simulation Divider on Multi-Job CVs */}
                      {cv.experiences.length >= 3 && (
                        <div className="page-break-line my-6 text-center no-print" aria-hidden="true">
                          <span>{currentTitles.pageBreakEstimate}</span>
                        </div>
                      )}
                    </React.Fragment>
                  );
                }

                if (sectionKey === 'educations' && cv.educations && cv.educations.length > 0) {
                  return (
                    <section key="educations" className="cv-section mt-6">
                      <h2
                        className={`cv-section-title text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 mb-2 ${getSectionHeaderStyle()}`}
                        style={{ color: getSectionHeaderColor(), borderColor: getSectionBorderColor() }}
                      >
                        {getSectionPrefix(secIdx)}
                        <span>{sectionTitles.educations}</span>
                      </h2>
                      <div className="space-y-2 text-[13.5px] text-slate-800">
                        {cv.educations.map((edu) => (
                          <div key={edu.id} className="cv-item flex flex-wrap justify-between items-baseline gap-1">
                            <div>
                              <strong className="font-semibold text-slate-950">{edu.degree}</strong>
                              <span> — {edu.institution}</span>
                              {edu.gpaOrHonors && (
                                <span className="text-slate-600 text-xs ml-1 italic font-serif">
                                  ({edu.gpaOrHonors})
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-600 font-mono">{edu.period}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                }

                if (sectionKey === 'trainings' && cv.trainings && cv.trainings.length > 0) {
                  return (
                    <section key="trainings" className="cv-section mt-6">
                      <h2
                        className={`cv-section-title text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 mb-2 ${getSectionHeaderStyle()}`}
                        style={{ color: getSectionHeaderColor(), borderColor: getSectionBorderColor() }}
                      >
                        {getSectionPrefix(secIdx)}
                        <span>{sectionTitles.trainings}</span>
                      </h2>
                      <ul className="space-y-1 text-[13px] text-slate-800">
                        {cv.trainings.map((t, idx) => (
                          <li key={idx} className="cv-item flex items-start">
                            <span className="mr-2 text-slate-400 font-bold">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                }

                if (sectionKey === 'languages' && cv.languages && cv.languages.length > 0) {
                  return (
                    <section key="languages" className="cv-section mt-6">
                      <h2
                        className={`cv-section-title text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 mb-2 ${getSectionHeaderStyle()}`}
                        style={{ color: getSectionHeaderColor(), borderColor: getSectionBorderColor() }}
                      >
                        {getSectionPrefix(secIdx)}
                        <span>{sectionTitles.languages}</span>
                      </h2>
                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-slate-800">
                        {cv.languages.map((l, idx) => (
                          <div key={idx} className="cv-item flex items-center gap-1.5">
                            <strong className="font-semibold text-slate-950">• {l.language}:</strong>
                            <span className="text-slate-700">{l.level}</span>
                            {isEuropass && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800 font-mono border border-blue-200">
                                {l.level.includes('Nativo') || l.level.includes('C2') ? 'C2/Nativo' : l.level.includes('C1') ? 'C1/Avançado' : 'B2'}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                }

                if (sectionKey === 'references' && cv.references && cv.references.length > 0) {
                  return (
                    <section key="references" className="cv-section mt-6">
                      <h2
                        className={`cv-section-title text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 mb-3 ${getSectionHeaderStyle()}`}
                        style={{ color: getSectionHeaderColor(), borderColor: getSectionBorderColor() }}
                      >
                        {getSectionPrefix(secIdx)}
                        <span>{sectionTitles.references}</span>
                      </h2>
                      <div className="border border-slate-300 overflow-x-auto text-left text-[12.5px] sm:text-[13px] rounded-xs">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-300 text-slate-900">
                              <th className="p-2 sm:p-2.5 font-bold border-r border-slate-300 w-[30%]">
                                {sectionTitles.tableRefName}
                              </th>
                              <th className="p-2 sm:p-2.5 font-bold border-r border-slate-300 w-[45%]">
                                {sectionTitles.tableRefInstitution}
                              </th>
                              <th className="p-2 sm:p-2.5 font-bold w-[25%]">{sectionTitles.tableRefContact}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cv.references.map((ref, idx) => (
                              <tr
                                key={ref.id || idx}
                                className={`cv-item ${idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}`}
                              >
                                <td className="p-2 sm:p-2.5 font-bold border-r border-slate-200 border-t border-slate-200 align-top">
                                  {ref.name}
                                </td>
                                <td className="p-2 sm:p-2.5 border-r border-slate-200 border-t border-slate-200 align-top whitespace-pre-line text-slate-700">
                                  {ref.institutionAndPosition}
                                </td>
                                <td className="p-2 sm:p-2.5 border-t border-slate-200 align-top font-mono text-[11px] sm:text-xs text-slate-800 whitespace-pre-line">
                                  {ref.contact}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  );
                }

                return null;
              })}
            </article>
          )}
        </div>
      </div>

      {/* Template Advisor Modal */}
      <TemplateAdvisorModal
        isOpen={isAdvisorModalOpen}
        onClose={() => setIsAdvisorModalOpen(false)}
        currentTemplateId={cv.templateStyle}
        onSelectTemplate={setStyle}
        cv={cv}
        onUpdateCV={onChange}
        onOpenAuthModal={onOpenAuthModal}
        onOpenPricingModal={(msg) => onOpenPricingModal?.(msg)}
      />

      {/* Photo Manager Modal */}
      <PhotoManagerModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        cv={cv}
        onChange={onChange}
      />

      {/* Multi-Language CV Download Modal */}
      <MultiLanguageDownloadModal
        isOpen={isMultiLangModalOpen}
        onClose={() => setIsMultiLangModalOpen(false)}
        cv={cv}
        onApplyTranslatedCV={onChange}
        onOpenPricingModal={onOpenPricingModal}
        onOpenAuthModal={onOpenAuthModal}
        density={density}
      />
    </div>
  );
};
