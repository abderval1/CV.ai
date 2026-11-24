import React, { useState, useRef, useEffect } from 'react';
import { CVData, TemplateStyle, CVSectionKey } from '../types/cv';
import { DEFAULT_SECTION_ORDER } from '../utils/executivePhrasing';
import {
  Download,
  Printer,
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
  UserCheck,
  Lock,
  AlertTriangle,
  Terminal,
  BookOpen,
  Sliders,
  Palette,
  Loader2
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
import { SECTION_TITLES_BY_LANG, getResolvedSectionTitles } from '../utils/cvDocumentLabels';
import { getStoredPlatformSettingsSync, logGenerationError } from '../services/adminModulesService';
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
  const { studioText, t } = useLanguage();
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [copied, setCopied] = useState<boolean>(false);
  const [isInlineEditing, setIsInlineEditing] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [jsonImportSuccess, setJsonImportSuccess] = useState<string | null>(null);
  const [docLang, setDocLang] = useState<LanguageCode>(contentLanguage || 'en');
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState<boolean>(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [isMultiLangModalOpen, setIsMultiLangModalOpen] = useState<boolean>(false);
  const [customizationMenuOpen, setCustomizationMenuOpen] = useState<boolean>(false);
  const [, setAdminConfigVersion] = useState<number>(0);
  const [platformSettings, setPlatformSettings] = useState(() => getStoredPlatformSettingsSync());

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

  // Template Style Flags
  const isClassic = cv.templateStyle === 'un_classic';
  const isHarvard = cv.templateStyle === 'executive_harvard';
  const isAts = cv.templateStyle === 'ats_compact';
  const isEuropass = cv.templateStyle === 'european_europass';
  const isCreative = cv.templateStyle === 'creative_split';
  const isTech = cv.templateStyle === 'tech_modern';
  const isMinimalist = cv.templateStyle === 'hybrid_minimalist';
  const isAcademic = cv.templateStyle === 'academic_lattes';
  const isModern = cv.templateStyle === 'european_modern';
  const isFinance = cv.templateStyle === 'finance_wallstreet';
  const isBoard = cv.templateStyle === 'executive_board';
  const isProduct = cv.templateStyle === 'product_strategy';
  const isEditorial = cv.templateStyle === 'modern_editorial';
  const isBlueprint = cv.templateStyle === 'engineering_blueprint';

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
      : isAts
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

  const handlePrint = () => {
    if (exportRequiresPaidPlan && !isAuthenticated) {
      void recordAuditLog({
        action: 'cv_export_blocked_unauthorized',
        category: 'cv_export',
        severity: 'warning',
        status: 'blocked',
        targetResource: `resumes/${cv.templateStyle}/pdf`,
        details: 'Exportação PDF bloqueada: utilizador não autenticado.',
        metadata: { format: 'pdf', reason: 'unauthenticated' }
      });
      showWarning('Registo Obrigatório', 'Inicie sessão ou registe-se para imprimir ou guardar em PDF.');
      onOpenAuthModal?.('O registo é obrigatório para descarregar ou imprimir o seu currículo em PDF.');
      return;
    }
    if (!canExportClean) {
      void recordAuditLog({
        action: 'cv_export_blocked_unauthorized',
        category: 'cv_export',
        severity: 'warning',
        status: 'blocked',
        targetResource: `resumes/${cv.templateStyle}/pdf`,
        details: 'Exportação PDF bloqueada: subscrição ativa exigida.',
        metadata: { format: 'pdf', reason: 'plan_required' }
      });
      showWarning('Plano Requerido', 'A impressão e download do PDF de Alta Resolução são exclusivos para subscritores.');
      onOpenPricingModal?.(
        'A impressão e download em PDF de Alta Resolução são exclusivos para subscritores. Ative um plano para descarregar o seu documento oficial sem marca de água.'
      );
      return;
    }
    try {
      void recordAuditLog({
        action: 'cv_exported_pdf',
        category: 'cv_export',
        severity: 'info',
        status: 'success',
        targetResource: `resumes/${cv.templateStyle}/pdf`,
        details: `Currículo exportado/impresso em PDF (${currentTemplate.shortName}, ${docLang.toUpperCase()}).`,
        metadata: { format: 'pdf', templateStyle: cv.templateStyle, language: docLang }
      });
      if (user) {
        void dispatchUserNotification({
          user,
          eventType: 'export',
          title: 'Exportação PDF Iniciada',
          message: `Currículo (${currentTemplate.shortName}, ${docLang.toUpperCase()}) preparado para exportação/impressão em PDF.`,
          targetResource: `resumes/${cv.templateStyle}/pdf`
        });
      }
      window.print();
    } catch (err: any) {
      logGenerationError({
        timestamp: new Date().toISOString(),
        userEmail: cv.personalDetails.email || 'anonymous',
        operationType: 'pdf_export',
        errorMessage: err?.message || 'Falha ao acionar impressão PDF',
        resolved: false
      });
    }
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
    if (!isAuthenticated) {
      onOpenAuthModal?.('Inicie sessão ou crie uma conta para personalizar as cores do currículo.');
      return;
    }
    if (!hasActivePlan) {
      onOpenPricingModal?.(
        'A personalização de cores executivas e tom corporativo é exclusiva para assinantes dos planos Pro ($8/mês) ou Executivo VIP ($12/mês).'
      );
      return;
    }
    onChange({ ...cv, accentColor: hex });
    setShowColorPicker(false);
  };


  // Photo Logic:
  // Show photo if user has configured a photo and showPhoto is not false, on all photo-supporting models
  const templateSupportsPhoto =
    isEuropass ||
    isCreative ||
    isMinimalist ||
    isModern ||
    isTech ||
    isClassic ||
    isAcademic ||
    isProduct ||
    isEditorial;
  const hasUserPhoto = Boolean(cv.personalDetails.photoUrl);
  const shouldRenderPhoto = templateSupportsPhoto && hasUserPhoto && cv.personalDetails.showPhoto !== false;

  // Has photo configured but current template strictly bans it (strict US ATS / Harvard / Wall Street / Board / Principal Systems alert)
  const isPhotoSuppressedForAts =
    hasUserPhoto &&
    (isAts || isHarvard || isFinance || isBoard || isBlueprint) &&
    !templateSupportsPhoto;

  const sectionOrder: CVSectionKey[] = cv.sectionOrder && cv.sectionOrder.length > 0
    ? cv.sectionOrder
    : DEFAULT_SECTION_ORDER;

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

          {/* Unified Document Customization & Layout Popover (Ajustes) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCustomizationMenuOpen(!customizationMenuOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                customizationMenuOpen
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Ajustes de Fotografia, Cor, Espaçamento, Zoom, Edição Direta e Backup"
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Ajustes</span>
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                style={{ backgroundColor: currentAccent }}
              />
            </button>

            {customizationMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCustomizationMenuOpen(false)}
                />
                <div className="absolute left-0 sm:left-auto sm:right-0 lg:left-0 mt-1.5 w-76 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-1 space-y-3">
                  {/* Layout: Density & Zoom */}
                  <div className="pb-2.5 border-b border-slate-100 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Enquadramento &amp; Visualização
                    </div>
                    <div className="flex items-center justify-between gap-2">
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
                                'A calibração inteligente de espaçamento para ajuste em 1 página é exclusiva dos assinantes Pro ou Executivo VIP.'
                              );
                              return;
                            }
                            setDensity('compact');
                          }}
                          className={`px-2 py-1 text-[11px] rounded-md transition-colors whitespace-nowrap ${
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
                                'O ajuste de densidade e espaçamento do currículo é exclusivo dos assinantes Pro ou Executivo VIP.'
                              );
                              return;
                            }
                            setDensity('normal');
                          }}
                          className={`px-2 py-1 text-[11px] rounded-md transition-colors whitespace-nowrap ${
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
                                'O ajuste de densidade e espaçamento do currículo é exclusivo dos assinantes Pro ou Executivo VIP.'
                              );
                              return;
                            }
                            setDensity('relaxed');
                          }}
                          className={`px-2 py-1 text-[11px] rounded-md transition-colors whitespace-nowrap ${
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
                      <span className="text-xs text-slate-700 font-medium">Zoom A4</span>
                      <div className="flex items-center gap-0.5 border border-slate-200 rounded-lg bg-slate-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded"
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
                          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded"
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
                      Fotografia Executiva
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-slate-600" />
                        <span className="text-xs text-slate-700 font-medium">
                          {hasUserPhoto
                            ? shouldRenderPhoto
                              ? 'Foto ativa'
                              : 'Foto oculta'
                            : 'Sem foto carregada'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomizationMenuOpen(false);
                          if (!isAuthenticated) {
                            onOpenAuthModal?.('Inicie sessão ou crie uma conta para carregar a sua fotografia profissional.');
                            return;
                          }
                          if (!hasActivePlan) {
                            onOpenPricingModal?.(
                              'O upload e gestão de fotografia executiva é exclusivo para assinantes dos planos Pro ou Executivo VIP.'
                            );
                            return;
                          }
                          setIsPhotoModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        {hasUserPhoto ? 'Alterar' : 'Adicionar'}
                      </button>
                    </div>
                  </div>

                  {/* Accent Color Section */}
                  <div className="pb-2.5 border-b border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Cor de Destaque
                    </div>
                    <div className="grid grid-cols-7 gap-1.5 pt-0.5">
                      {ACCENT_COLORS.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setAccentColor(col.hex)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative ${
                            currentAccent === col.hex ? 'ring-2 ring-slate-900 ring-offset-2 scale-105' : ''
                          }`}
                          style={{ backgroundColor: col.hex }}
                          title={col.name}
                        >
                          {currentAccent === col.hex && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Inline Editing Toggle */}
                  <div className="pb-2.5 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) {
                          onOpenAuthModal?.('Inicie sessão ou crie uma conta para editar diretamente o seu currículo.');
                          return;
                        }
                        if (!hasActivePlan) {
                          onOpenPricingModal?.(
                            'A edição direta no documento A4 é uma funcionalidade exclusiva dos assinantes Pro ou Executivo VIP.'
                          );
                          return;
                        }
                        setIsInlineEditing(!isInlineEditing);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                        isInlineEditing
                          ? 'bg-amber-50 border-amber-300 text-amber-950 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isInlineEditing ? <Eye className="w-3.5 h-3.5 text-amber-700" /> : <Edit3 className="w-3.5 h-3.5 text-slate-600" />}
                        <span>{isInlineEditing ? 'Edição Direta: Ativa' : 'Editar Clicando no A4'}</span>
                      </span>
                      <span className={`w-2 h-2 rounded-full ${isInlineEditing ? 'bg-amber-500' : 'bg-slate-300'}`} />
                    </button>
                  </div>

                  {/* Utilities: Plain Text & JSON Backup */}
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        handleCopyPlainText();
                        setCustomizationMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
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
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
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
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                      >
                        <Download className="w-3 h-3 text-slate-500 rotate-180" />
                        <span>Restaurar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Direct Inline Edit A4 Quick Toggle */}
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                onOpenAuthModal?.('Inicie sessão ou crie uma conta para editar diretamente o seu currículo.');
                return;
              }
              if (!hasActivePlan) {
                onOpenPricingModal?.(
                  'A edição direta no documento A4 é uma funcionalidade exclusiva dos assinantes Pro ou Executivo VIP.'
                );
                return;
              }
              setIsInlineEditing((prev) => !prev);
            }}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
              isInlineEditing
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title={isInlineEditing ? 'Desativar edição direta no A4' : 'Clicar nos textos do A4 para editar'}
          >
            {isInlineEditing ? (
              <Eye className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            ) : (
              <Edit3 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            )}
            <span className="hidden xl:inline">{isInlineEditing ? studioText.docToolbar.doneEdit : studioText.docToolbar.inlineEdit}</span>
          </button>
        </div>

        {/* Hidden JSON file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportJSON}
          accept=".json"
          className="hidden"
        />

        {/* Right Side: Document Language & Clean Export Actions */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Document Language Toggle (PT / EN / ES / FR / DE) */}
          <div className="flex items-center gap-1 shrink-0">
            <div
              className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 shrink-0"
              title={studioText.docToolbar.cvContentLangTooltip}
            >
              {(['pt', 'en', 'es', 'fr', 'de'] as const).map((lang) => {
                const isTargetLoading = isTranslatingContent && translatingTargetLang === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    disabled={isTranslatingContent}
                    onClick={() => {
                      if (!isAuthenticated) {
                        onOpenAuthModal?.('Inicie sessão ou crie uma conta para traduzir o seu currículo em 5 idiomas.');
                        return;
                      }
                      if (!hasActivePlan) {
                        onOpenPricingModal?.(
                          'A tradução integral do currículo e carta para Inglês, Espanhol, Francês ou Alemão é exclusiva para assinantes Pro ($8/mês) ou Executivo VIP ($12/mês).'
                        );
                        return;
                      }
                      setDocLang(lang);
                      onSelectLanguage?.(lang);
                    }}
                    className={`px-1.5 py-1 text-[10px] sm:text-[11px] font-bold rounded-md transition-colors flex items-center gap-1 disabled:opacity-60 ${
                      docLang === lang
                        ? 'bg-white text-slate-950 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title={`${studioText.docToolbar.cvContentLangTooltip} (${lang.toUpperCase()})`}
                  >
                    {isTargetLoading && <Loader2 className="w-2.5 h-2.5 animate-spin text-slate-700" />}
                    <span>{lang.toUpperCase()}</span>
                  </button>
                );
              })}
            </div>
            {isTranslatingContent && (
              <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1 whitespace-nowrap">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="hidden sm:inline">{currentTitles.translatingLabel}</span>
              </span>
            )}
          </div>

          {/* Print / Save PDF Button */}
          <button
            type="button"
            onClick={handlePrint}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
              !isAuthenticated || !hasActivePlan
                ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
            }`}
            title={
              !isAuthenticated
                ? 'Registo obrigatório para imprimir ou guardar em PDF'
                : !hasActivePlan
                ? 'Requer ativação de Plano (Pro ou Executive) para descarregar em PDF'
                : 'Imprimir ou Guardar em PDF A4 limpo'
            }
          >
            {!isAuthenticated || !hasActivePlan ? (
              <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            ) : (
              <Printer className="w-3.5 h-3.5 text-slate-700 shrink-0" />
            )}
            <span>{studioText.docToolbar.pdfBtn}</span>
          </button>

          {/* Word Export Button */}
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                onOpenAuthModal?.('O registo é obrigatório para descarregar o currículo em formato Word (.docx).');
                return;
              }
              if (!hasActivePlan) {
                onOpenPricingModal?.(
                  'O download oficial do currículo em formato Microsoft Word (.docx) requer a ativação de um plano Pro ou Executive.'
                );
                return;
              }
              onExportWord();
            }}
            disabled={isExportingWord}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              !isAuthenticated || !hasActivePlan
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
            title={
              !isAuthenticated
                ? 'Registo obrigatório para exportar em formato Word (.docx)'
                : !hasActivePlan
                ? 'Requer ativação de Plano (Pro ou Executive) para descarregar Word (.docx)'
                : 'Exportar documento no formato nativo Microsoft Word (.docx)'
            }
          >
            {!isAuthenticated || !hasActivePlan ? (
              <Lock className="w-3.5 h-3.5 text-slate-950 shrink-0" />
            ) : (
              <Download className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{isExportingWord ? studioText.docToolbar.generating : studioText.docToolbar.wordBtn}</span>
          </button>

          {/* Multi-Language Pack Download Trigger */}
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                onOpenAuthModal?.('Inicie sessão ou crie uma conta para gerar o pacote multi-idioma.');
                return;
              }
              if (!hasActivePlan) {
                onOpenPricingModal?.('O pacote de tradução e descarga multi-idioma requer um plano Pro ou Executivo VIP ativo.');
                return;
              }
              setIsMultiLangModalOpen(true);
            }}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition-colors bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 whitespace-nowrap"
            title={t('doc.downloadMultilangDesc', studioText.docToolbar.otherLangs)}
          >
            <Globe className="w-3.5 h-3.5 text-slate-700 shrink-0" />
            <span className="hidden 2xl:inline">{studioText.docToolbar.otherLangs}</span>
          </button>
        </div>
      </div>

      {/* Strategic Educational Banner when photo is suppressed in strict ATS models */}
      {isPhotoSuppressedForAts && (
        <div className="no-print bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px] text-slate-300">
              <strong className="text-white">Proteção ATS Ativa:</strong> O modelo{' '}
              <strong className="text-white">{currentTemplate.name}</strong> oculta a foto para garantir 100% de aprovação nas triagens dos EUA/UK e Workday.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setStyle('european_europass')}
            className="text-[11px] font-bold text-blue-400 hover:text-blue-300 underline underline-offset-2 shrink-0 ml-2"
          >
            Mudar para Modelo Europeu (Com Foto) →
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
            <article className={`cv-a4-sheet cv-creative-split bg-white text-slate-900 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18),0_2px_8px_rgba(15,23,42,0.06)] border border-slate-300/70 rounded-xs min-h-[1120px] flex flex-col md:flex-row relative overflow-hidden ${
              cv.fontFamily ? resolvedFontClass : 'font-jakarta'
            } ${
              density === 'compact' ? 'cv-density-compact' : density === 'relaxed' ? 'cv-density-relaxed' : ''
            }`}>
              <CVWatermarkOverlay isVisible={!hasActivePlan} />
              {/* Left Sidebar (35% width) */}
              <aside
                className="cv-creative-sidebar w-full md:w-[35%] p-6 sm:p-8 text-white flex flex-col justify-between"
                style={{ backgroundColor: currentAccent }}
              >
                <div>
                  {/* Photo in Sidebar */}
                  {shouldRenderPhoto ? (
                    <div className="mb-5 flex justify-center md:justify-start">
                      <img
                        src={cv.personalDetails.photoUrl}
                        alt={cv.personalDetails.name}
                        className="w-28 h-28 rounded-2xl object-cover border-4 border-white/20 shadow-md"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 inline-block px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold tracking-wider uppercase">
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
                    className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight"
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
                    className="text-xs sm:text-sm font-medium text-white/90 mt-1 opacity-95"
                  >
                    {cv.personalDetails.title}
                  </div>

                  {/* Sidebar Contact Block */}
                  <div className="mt-6 pt-5 border-t border-white/20 space-y-2.5 text-xs text-white/90">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                      {currentTitles.contactsLabel}
                    </div>
                    <div>
                      <span className="block text-[10px] text-white/60">{currentTitles.locationLabel}</span>
                      <span className="font-medium">{cv.personalDetails.location}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-white/60">{currentTitles.phoneLabel}</span>
                      <span className="font-medium font-mono">{cv.personalDetails.phone}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-white/60">{currentTitles.emailLabel}</span>
                      <span className="font-medium break-all">{cv.personalDetails.email}</span>
                    </div>
                    {cv.personalDetails.linkedin && (
                      <div>
                        <span className="block text-[10px] text-white/60">LinkedIn</span>
                        <span className="font-medium break-all">{cv.personalDetails.linkedin}</span>
                      </div>
                    )}
                    {cv.personalDetails.website && (
                      <div>
                        <span className="block text-[10px] text-white/60">{currentTitles.websiteLabel}</span>
                        <span className="font-medium break-all">{cv.personalDetails.website}</span>
                      </div>
                    )}
                  </div>

                  {/* Sidebar Skills / Competencies */}
                  {cv.competencies && cv.competencies.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-white/20">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-2.5">
                        {currentTitles.skillsShort}
                      </div>
                      <div className="space-y-2">
                        {cv.competencies.map((c, i) => (
                          <div key={c.id || i} className="bg-white/10 rounded-lg p-2 text-xs">
                            <span className="font-bold block text-white">{c.category}</span>
                            <span className="text-[11px] text-white/80 line-clamp-2">{c.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sidebar Languages */}
                  {cv.languages && cv.languages.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-white/20">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-2">
                        {currentTitles.languagesShort}
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {cv.languages.map((l, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <span className="font-bold text-white">{l.language}</span>
                            <span className="text-[11px] text-white/80">{l.level}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/20 text-[10px] text-white/60 text-center">
                  {currentTitles.creativeFooter}
                </div>
              </aside>

              {/* Right Main Column (65% width) */}
              <main className="cv-creative-main w-full md:w-[65%] p-6 sm:p-10 space-y-6">
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
          ) : (
            /* CASE 2: Single Column / Official Executive Layouts (Europass, Harvard, ATS, Corporativo, Tech, etc.) */
            <article
              className={`cv-a4-sheet cv-single-column bg-white text-slate-900 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18),0_2px_8px_rgba(15,23,42,0.06)] border border-slate-300/70 rounded-xs p-5 sm:p-10 md:p-12 transition-all min-h-[1120px] relative overflow-hidden ${
                density === 'compact' ? 'cv-density-compact' : density === 'relaxed' ? 'cv-density-relaxed' : ''
              } ${isBoard ? 'border-t-[6px]' : ''} ${resolvedFontClass}`}
              style={isBoard ? { borderTopColor: currentAccent } : undefined}
            >
              <CVWatermarkOverlay isVisible={!hasActivePlan} />
              {/* Header Section */}
              <header
                className={`cv-header ${
                  isEditorial
                    ? '-mx-5 sm:-mx-10 md:-mx-12 -mt-5 sm:-mt-10 md:-mt-12 px-5 sm:px-10 md:px-12 py-6 sm:py-8 mb-6 text-white'
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
                  isEditorial
                    ? { backgroundColor: currentAccent, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }
                    : {
                        borderColor: isFinance
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
                  <div className={`flex-1 ${isClassic || isBoard ? 'text-center' : 'text-left'}`}>
                    {/* European flag/official indicator in Europass */}
                    {isEuropass && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#003399] text-white tracking-wider uppercase shadow-2xs">
                          Curriculum Vitae Europass
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {currentTitles.europassOfficial}
                        </span>
                      </div>
                    )}

                    {/* Tech header badge */}
                    {isTech && (
                      <div className="flex items-center gap-1.5 mb-2 font-mono text-[11px] text-teal-700 font-semibold tracking-wide">
                        <Terminal className="w-3.5 h-3.5 text-teal-600" />
                        <span>// TECH LEAD & SYSTEMS ARCHITECTURE</span>
                      </div>
                    )}

                    {/* Principal Engineering Blueprint tag */}
                    {isBlueprint && (
                      <div className="text-[10px] font-mono tracking-widest uppercase mb-1.5 font-semibold" style={{ color: currentAccent }}>
                        SYSTEMS ARCHITECTURE · PRINCIPAL ENGINEERING
                      </div>
                    )}

                    {/* Wall Street Finance tag */}
                    {isFinance && (
                      <div className="text-[10px] font-serif tracking-[0.2em] uppercase text-slate-500 mb-1.5 font-semibold">
                        INSTITUTIONAL FINANCE &amp; M&amp;A STANDARD
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
                        PRODUCT STRATEGY &amp; GROWTH LEADERSHIP
                      </div>
                    )}

                    {/* Two-Tone Editorial tag */}
                    {isEditorial && (
                      <div className="text-[10px] font-jakarta tracking-[0.18em] uppercase text-white/75 mb-1.5 font-semibold">
                        EXECUTIVE EDITORIAL PROFILE
                      </div>
                    )}

                    {/* Minimalist Nordic tag */}
                    {isMinimalist && (
                      <div className="text-[10px] font-mono tracking-widest uppercase text-slate-400 mb-1.5 font-semibold">
                        CURRICULUM VITAE · NORDIC EDITION
                      </div>
                    )}

                    {/* ATS indicator */}
                    {isAts && (
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-300 pb-1">
                        [ATS COMPACT · OCR PARSER COMPLIANT]
                      </div>
                    )}

                    {/* Academic Lattes tag */}
                    {isAcademic && (
                      <div className="mb-3 border-y border-slate-700/60 py-1.5 text-center font-serif">
                        <div className="text-[11px] font-bold tracking-wider uppercase text-slate-800">
                          SCIENTIFIC &amp; ACADEMIC CURRICULUM VITAE
                        </div>
                        <div className="text-[9.5px] text-slate-500 italic">
                          Indexed Research, Grants &amp; University Faculty Standard
                        </div>
                      </div>
                    )}

                    {/* UN Classic Diplomatic tag */}
                    {isClassic && (
                      <div className="flex items-center justify-center gap-1.5 mb-2 font-serif text-[11px] text-blue-900 font-bold tracking-wider uppercase">
                        <Globe className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                        <span>INTERNATIONAL GOVERNANCE &amp; PROGRAMS STANDARD</span>
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
                      className={`font-bold tracking-tight uppercase ${
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
                      style={{ color: isEditorial ? '#ffffff' : isEuropass ? '#003399' : isFinance ? '#0f172a' : currentAccent }}
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
                        isEditorial
                          ? 'text-white/90'
                          : isHarvard || isBoard
                          ? 'text-slate-700 italic font-serif-cv'
                          : isTech || isBlueprint
                          ? 'text-teal-700 font-mono text-xs sm:text-sm'
                          : 'text-slate-800'
                      }`}
                    >
                      {cv.personalDetails.title}
                    </div>

                    <div
                      className={`text-xs sm:text-[13px] mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 ${
                        isEditorial ? 'text-white/85' : 'text-slate-600'
                      } ${isClassic || isBoard ? 'justify-center' : 'justify-start'}`}
                    >
                      <span>{cv.personalDetails.location}</span>
                      <span aria-hidden="true" className={isEditorial ? 'text-white/40' : 'text-slate-400'}>|</span>
                      <span>{cv.personalDetails.phone}</span>
                      <span aria-hidden="true" className={isEditorial ? 'text-white/40' : 'text-slate-400'}>|</span>
                      <a
                        href={`mailto:${cv.personalDetails.email}`}
                        className={`hover:underline ${isEditorial ? 'text-white' : 'text-slate-800'}`}
                      >
                        {cv.personalDetails.email}
                      </a>
                      {cv.personalDetails.linkedin && (
                        <>
                          <span aria-hidden="true" className={isEditorial ? 'text-white/40' : 'text-slate-400'}>|</span>
                          <span>{cv.personalDetails.linkedin}</span>
                        </>
                      )}
                      {cv.personalDetails.website && (
                        <>
                          <span aria-hidden="true" className={isEditorial ? 'text-white/40' : 'text-slate-400'}>|</span>
                          {getSafeHttpUrl(cv.personalDetails.website) ? (
                            <a
                              href={getSafeHttpUrl(cv.personalDetails.website)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline font-semibold"
                              style={{ color: isEditorial ? '#ffffff' : currentAccent }}
                            >
                              {cv.personalDetails.website}
                            </a>
                          ) : (
                            <span className="font-semibold" style={{ color: isEditorial ? '#ffffff' : currentAccent }}>
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
                      <div className="border border-slate-300 overflow-hidden text-left text-[12.5px] sm:text-[13px] rounded-xs">
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
