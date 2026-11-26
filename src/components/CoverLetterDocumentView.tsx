import React, { useState, useEffect, useRef } from 'react';
import { CVData } from '../types/cv';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage, LanguageCode } from '../context/LanguageContext';
import {
  Download,
  Printer,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Mail,
  Lock,
  Loader2,
  Globe,
  ChevronDown
} from 'lucide-react';
import { generateCoverLetterDocx, triggerDownload } from '../utils/docxExport';
import { COVER_CHROME_LABELS } from '../utils/cvDocumentLabels';
import { getStoredPlatformSettingsSync } from '../services/adminModulesService';
import { recordAuditLog } from '../services/auditLogService';
import { dispatchUserNotification } from '../services/notificationService';

interface CoverLetterDocumentViewProps {
  cv: CVData;
  letterBody: string;
  onExportWord?: () => void;
  isExportingWord?: boolean;
  onOpenPricingModal?: (promptMessage?: string) => void;
  onOpenAuthModal?: (promptMessage?: string) => void;
  onSelectLanguage?: (lang: LanguageCode) => void;
  isTranslatingContent?: boolean;
  translatingTargetLang?: LanguageCode | null;
  contentLanguage?: LanguageCode;
}

export const CoverLetterDocumentView: React.FC<CoverLetterDocumentViewProps> = ({
  cv,
  letterBody,
  onExportWord,
  isExportingWord = false,
  onOpenPricingModal,
  onOpenAuthModal,
  onSelectLanguage,
  isTranslatingContent = false,
  translatingTargetLang = null,
  contentLanguage = 'pt'
}) => {
  const { user, isAuthenticated, hasActivePlan } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const { studioText } = useLanguage();
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExportingLocal, setIsExportingLocal] = useState<boolean>(false);
  const [langMenuOpen, setLangMenuOpen] = useState<boolean>(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const [platformSettings, setPlatformSettings] = useState(() => getStoredPlatformSettingsSync());

  useEffect(() => {
    const syncHandler = () => setPlatformSettings(getStoredPlatformSettingsSync());
    window.addEventListener('admin-config-updated', syncHandler);
    return () => window.removeEventListener('admin-config-updated', syncHandler);
  }, []);

  useEffect(() => {
    if (!langMenuOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLangMenuOpen(false);
    };
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [langMenuOpen]);

  const exportRequiresPaidPlan = platformSettings.requirePaidPlanForExport !== false;
  const canExportClean = exportRequiresPaidPlan ? isAuthenticated && hasActivePlan : true;

  const effectiveContentLang: LanguageCode = contentLanguage || 'en';
  const chrome = COVER_CHROME_LABELS[effectiveContentLang] || COVER_CHROME_LABELS.en;

  const handleCopy = () => {
    if (exportRequiresPaidPlan && !isAuthenticated) {
      showWarning('Registo Obrigatório', 'Faça login para copiar o texto da carta.');
      onOpenAuthModal?.('O registo é obrigatório para copiar a sua carta de apresentação.');
      return;
    }
    if (!canExportClean) {
      showWarning('Plano Requerido', 'A cópia do texto da carta requer um plano Pro ou Executive ativo.');
      onOpenPricingModal?.(
        'A cópia do texto completo da carta de apresentação é exclusiva para assinantes Pro e Executivo VIP.'
      );
      return;
    }
    navigator.clipboard.writeText(letterBody);
    setCopied(true);
    showSuccess('Copiado!', 'O texto da carta foi copiado para a área de transferência.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (exportRequiresPaidPlan && !isAuthenticated) {
      void recordAuditLog({
        action: 'cv_export_blocked_unauthorized',
        category: 'cv_export',
        severity: 'warning',
        status: 'blocked',
        targetResource: 'cover-letter/pdf',
        details: 'Impressão PDF da carta bloqueada: utilizador não autenticado.',
        metadata: { format: 'pdf', documentType: 'cover_letter' }
      });
      showWarning('Registo Obrigatório', 'Faça login para imprimir ou descarregar a sua carta em PDF.');
      onOpenAuthModal?.('O registo é obrigatório para imprimir ou guardar a sua carta em PDF.');
      return;
    }
    if (!canExportClean) {
      void recordAuditLog({
        action: 'cv_export_blocked_unauthorized',
        category: 'cv_export',
        severity: 'warning',
        status: 'blocked',
        targetResource: 'cover-letter/pdf',
        details: 'Impressão PDF da carta bloqueada: plano pago exigido.',
        metadata: { format: 'pdf', documentType: 'cover_letter' }
      });
      showWarning('Plano Requerido', 'A exportação oficial da carta requer um plano Pro ou Executivo VIP ativo.');
      onOpenPricingModal?.(
        'A impressão e download da Carta de Apresentação sem marca de água são exclusivos para subscritores.'
      );
      return;
    }
    void recordAuditLog({
      action: 'cv_exported_pdf',
      category: 'cv_export',
      severity: 'info',
      status: 'success',
      targetResource: 'cover-letter/pdf',
      details: `Carta de apresentação exportada/impressa em PDF (${effectiveContentLang.toUpperCase()}).`,
      metadata: { format: 'pdf', documentType: 'cover_letter', language: effectiveContentLang }
    });
    if (user) {
      void dispatchUserNotification({
        user,
        eventType: 'export',
        title: 'Exportação PDF da Carta',
        message: `Carta de apresentação (${effectiveContentLang.toUpperCase()}) preparada para exportação/impressão em PDF.`,
        targetResource: 'cover-letter/pdf'
      });
    }
    window.print();
  };

  const handleDownloadWord = async () => {
    if (exportRequiresPaidPlan && !isAuthenticated) {
      void recordAuditLog({
        action: 'cv_export_blocked_unauthorized',
        category: 'cv_export',
        severity: 'warning',
        status: 'blocked',
        targetResource: 'cover-letter/docx',
        details: 'Download Word da carta bloqueado: utilizador não autenticado.',
        metadata: { format: 'docx', documentType: 'cover_letter' }
      });
      onOpenAuthModal?.('Faça login para descarregar a sua carta oficial em formato Word (.docx).');
      return;
    }
    if (!canExportClean) {
      void recordAuditLog({
        action: 'cv_export_blocked_unauthorized',
        category: 'cv_export',
        severity: 'warning',
        status: 'blocked',
        targetResource: 'cover-letter/docx',
        details: 'Download Word da carta bloqueado: plano pago exigido.',
        metadata: { format: 'docx', documentType: 'cover_letter' }
      });
      onOpenPricingModal?.(
        'O download da Carta de Apresentação em formato Word (.docx) requer um plano Pro ou Executive ativo.'
      );
      return;
    }

    if (onExportWord) {
      onExportWord();
      return;
    }

    try {
      setIsExportingLocal(true);
      const blob = await generateCoverLetterDocx(cv, letterBody, true, effectiveContentLang);
      const nameClean = cv.personalDetails.name.trim().replace(/\s+/g, '_') || 'Carta_Apresentacao';
      triggerDownload(blob, `Carta_${nameClean}.docx`);
      void recordAuditLog({
        action: 'cv_exported_docx',
        category: 'cv_export',
        severity: 'info',
        status: 'success',
        targetResource: 'cover-letter/docx',
        details: `Carta de apresentação exportada em Word (.docx) (${effectiveContentLang.toUpperCase()}).`,
        metadata: { format: 'docx', documentType: 'cover_letter', language: effectiveContentLang }
      });
      if (user) {
        void dispatchUserNotification({
          user,
          eventType: 'export',
          title: 'Carta Exportada em Word',
          message: `A carta Carta_${nameClean}.docx foi exportada com sucesso (${effectiveContentLang.toUpperCase()}).`,
          targetResource: 'cover-letter/docx'
        });
      }
      showSuccess('Word Descarregado!', 'A carta foi compilada em formato nativo Microsoft Word (.docx).');
    } catch (err: any) {
      console.error('Erro ao compilar Word:', err);
      showError('Erro ao Descarregar', 'Não foi possível compilar o ficheiro Word.');
    } finally {
      setIsExportingLocal(false);
    }
  };

  const candidateName = cv.personalDetails.name || 'Seu Nome Completo';
  const candidateTitle = cv.personalDetails.title || 'Título Profissional Executivo';
  const candidateContacts = [
    cv.personalDetails.location,
    cv.personalDetails.phone,
    cv.personalDetails.email,
    cv.personalDetails.linkedin
  ].filter(Boolean);

  return (
    <div className="flex flex-col h-full bg-slate-200/70 overflow-hidden">
      {/* Top Document Controls Toolbar */}
      <div className="no-print bg-white border-b border-slate-200 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-2xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-900 block leading-tight truncate">
              {chrome.toolbarTitle}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {chrome.toolbarSub}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Compact Language Dropdown (PT / EN / ES / FR / DE) */}
          <div ref={langMenuRef} className="relative shrink-0">
            <button
              type="button"
              disabled={isTranslatingContent}
              onClick={() => setLangMenuOpen((v) => !v)}
              className={`min-h-[38px] flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap disabled:opacity-60 touch-manipulation ${
                langMenuOpen
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title={studioText.docToolbar.coverContentLangTooltip}
              aria-expanded={langMenuOpen}
            >
              {isTranslatingContent ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Globe className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{effectiveContentLang.toUpperCase()}</span>
              <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-52 max-w-[calc(100vw-1.5rem)] max-h-[70dvh] overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-60 animate-in fade-in slide-in-from-top-1 space-y-0.5">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {studioText.docToolbar.coverContentLangTooltip}
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
                  const isActive = effectiveContentLang === item.code;
                  const isTargetLoading = isTranslatingContent && translatingTargetLang === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      disabled={isTranslatingContent}
                      onClick={() => {
                        setLangMenuOpen(false);
                        if (!isAuthenticated) {
                          onOpenAuthModal?.('Inicie sessão ou crie uma conta para traduzir a sua carta de apresentação.');
                          return;
                        }
                        if (!hasActivePlan) {
                          onOpenPricingModal?.(
                            'A tradução completa da carta de apresentação para outros idiomas é exclusiva para assinantes Pro ($8/mês) ou Executivo VIP ($12/mês).'
                          );
                          return;
                        }
                        onSelectLanguage?.(item.code);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white font-semibold'
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
              </div>
            )}
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-0.5 border border-slate-200 rounded-lg bg-white p-0.5 shadow-2xs min-h-[38px]">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
              title={studioText.docToolbar.zoomOut}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              className="text-[11px] font-mono tabular-nums text-slate-700 px-1 font-semibold"
              title="100%"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
              title={studioText.docToolbar.zoomIn}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Copy Plain Text */}
          <button
            type="button"
            onClick={handleCopy}
            className="min-h-[38px] flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs touch-manipulation"
            title={studioText.docToolbar.copy}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? studioText.docToolbar.copied : studioText.docToolbar.copy}</span>
          </button>

          {/* Print / Save PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className={`min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-2xs touch-manipulation ${
              !isAuthenticated || !hasActivePlan
                ? 'bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100'
                : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
            title={studioText.docToolbar.pdfBtn}
          >
            {!isAuthenticated || !hasActivePlan ? (
              <Lock className="w-3.5 h-3.5 text-amber-700" />
            ) : (
              <Printer className="w-3.5 h-3.5 text-slate-700" />
            )}
            <span>{studioText.docToolbar.pdfBtn}</span>
          </button>

          {/* Download Letter */}
          <button
            type="button"
            onClick={handleDownloadWord}
            disabled={isExportingWord || isExportingLocal}
            className={`min-h-[38px] flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-xs whitespace-nowrap touch-manipulation ${
              !isAuthenticated || !hasActivePlan
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {!isAuthenticated || !hasActivePlan ? (
              <Lock className="w-3.5 h-3.5 text-slate-950" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>
              {isExportingWord || isExportingLocal
                ? studioText.docToolbar.generating
                : studioText.docToolbar.coverBtn}
            </span>
          </button>
        </div>
      </div>

      {/* Main Document Canvas Sheet Viewport */}
      <div className="cover-preview-container flex-1 min-h-0 overflow-auto p-3 sm:p-6 md:p-8 flex justify-center items-start">
        <div
          className="cv-scale-wrapper transition-transform duration-150 origin-top flex justify-center w-full"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          {/* Printable A4 Paper Sheet */}
          <article
            className="cover-a4-sheet w-full max-w-[210mm] md:w-[210mm] min-h-[520px] sm:min-h-[297mm] bg-white text-slate-900 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18),0_2px_8px_rgba(15,23,42,0.06)] p-5 sm:p-12 md:p-[22mm] md:px-[25mm] rounded-xs border border-slate-300/70 relative flex flex-col justify-between"
            style={{ boxSizing: 'border-box' }}
          >
            <div>
              {/* Executive Formal Letterhead */}
              <header className="border-b-2 border-slate-900 pb-5 mb-8">
                <h1 className="text-xl sm:text-3xl font-serif font-black tracking-tight text-slate-950 uppercase break-words">
                  {candidateName}
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1 uppercase tracking-wider">
                  {candidateTitle}
                </p>
                {candidateContacts.length > 0 && (
                  <p className="text-[11px] text-slate-500 font-mono mt-2.5 flex flex-wrap items-center gap-2 break-all sm:break-normal">
                    {candidateContacts.map((contact, i) => (
                      <span key={i} className="flex items-center gap-2">
                        <span>{contact}</span>
                        {i < candidateContacts.length - 1 && <span className="text-slate-300">|</span>}
                      </span>
                    ))}
                  </p>
                )}
              </header>

              {/* Letter Body Text formatted as paragraphs */}
              <div className="font-serif text-[13.5px] sm:text-[14px] leading-relaxed text-slate-800 space-y-4 whitespace-pre-line sm:text-justify">
                {letterBody || 'O conteúdo da carta será exibido aqui...'}
              </div>
            </div>

            {/* Formal Footer Sign-Off */}
            <footer className="pt-8 border-t border-slate-200 mt-10 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2 font-mono">
              <span>{candidateName} · {chrome.footerLabel}</span>
              <span>{chrome.standardLabel}</span>
            </footer>

            {/* Watermark for unpaid users on print/preview */}
            {!hasActivePlan && (
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none flex items-center justify-center select-none overflow-hidden"
              >
                <div className="rotate-[-35deg] text-center opacity-10">
                  <p className="text-5xl sm:text-6xl font-black text-slate-950 uppercase tracking-widest whitespace-nowrap">
                    CURRÍCULO ESTRATÉGICO
                  </p>
                  <p className="text-base sm:text-xl font-bold text-slate-900 uppercase tracking-wider mt-2">
                    EXEMPLAR DE AVALIAÇÃO · ATIVE SEU PLANO PARA REMOVER
                  </p>
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  );
};
