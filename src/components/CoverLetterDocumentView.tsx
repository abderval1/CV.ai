import React, { useState, useEffect } from 'react';
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
  Loader2
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
  translatingTargetLang = null
}) => {
  const { user, isAuthenticated, hasActivePlan } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const { language: appLang, setLanguage } = useLanguage();
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExportingLocal, setIsExportingLocal] = useState<boolean>(false);
  const [platformSettings, setPlatformSettings] = useState(() => getStoredPlatformSettingsSync());

  useEffect(() => {
    const syncHandler = () => setPlatformSettings(getStoredPlatformSettingsSync());
    window.addEventListener('admin-config-updated', syncHandler);
    return () => window.removeEventListener('admin-config-updated', syncHandler);
  }, []);

  const exportRequiresPaidPlan = platformSettings.requirePaidPlanForExport !== false;
  const canExportClean = exportRequiresPaidPlan ? isAuthenticated && hasActivePlan : true;

  const chrome = COVER_CHROME_LABELS[appLang] || COVER_CHROME_LABELS.pt;

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
      details: `Carta de apresentação exportada/impressa em PDF (${appLang.toUpperCase()}).`,
      metadata: { format: 'pdf', documentType: 'cover_letter', language: appLang }
    });
    if (user) {
      void dispatchUserNotification({
        user,
        eventType: 'export',
        title: 'Exportação PDF da Carta',
        message: `Carta de apresentação (${appLang.toUpperCase()}) preparada para exportação/impressão em PDF.`,
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
      const blob = await generateCoverLetterDocx(cv, letterBody, true, appLang);
      const nameClean = cv.personalDetails.name.trim().replace(/\s+/g, '_') || 'Carta_Apresentacao';
      triggerDownload(blob, `Carta_${nameClean}.docx`);
      void recordAuditLog({
        action: 'cv_exported_docx',
        category: 'cv_export',
        severity: 'info',
        status: 'success',
        targetResource: 'cover-letter/docx',
        details: `Carta de apresentação exportada em Word (.docx) (${appLang.toUpperCase()}).`,
        metadata: { format: 'docx', documentType: 'cover_letter', language: appLang }
      });
      if (user) {
        void dispatchUserNotification({
          user,
          eventType: 'export',
          title: 'Carta Exportada em Word',
          message: `A carta Carta_${nameClean}.docx foi exportada com sucesso (${appLang.toUpperCase()}).`,
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
          {/* Document Language Toggle (PT / EN / ES / FR / DE) */}
          <div className="flex items-center gap-1">
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 shrink-0" title="Traduzir conteúdo da carta e currículo">
              {(['pt', 'en', 'es', 'fr', 'de'] as const).map((lang) => {
                const isTargetLoading = isTranslatingContent && translatingTargetLang === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    disabled={isTranslatingContent}
                    onClick={() => {
                      if (!isAuthenticated) {
                        onOpenAuthModal?.('Inicie sessão ou crie uma conta para traduzir a sua carta de apresentação.');
                        return;
                      }
                      if (!hasActivePlan) {
                        onOpenPricingModal?.(
                          'A tradução integral da carta de apresentação para outros idiomas é exclusiva para assinantes Pro ($8/mês) ou Executivo VIP ($12/mês).'
                        );
                        return;
                      }
                      onSelectLanguage ? onSelectLanguage(lang) : setLanguage(lang);
                    }}
                    className={`px-1.5 py-1 text-[10px] sm:text-[11px] font-bold rounded-md transition-colors flex items-center gap-1 disabled:opacity-60 ${
                      appLang === lang
                        ? 'bg-white text-slate-950 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title={`Traduzir carta para ${lang.toUpperCase()}`}
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
                <span className="hidden sm:inline">{chrome.translating}</span>
              </span>
            )}
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-0.5 border border-slate-200 rounded-lg bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              className="text-[11px] font-mono tabular-nums text-slate-700 px-1 font-semibold"
              title="Restaurar 100%"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Copy Plain Text */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
            title="Copiar texto da carta"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>

          {/* Print / Save PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-2xs ${
              !isAuthenticated || !hasActivePlan
                ? 'bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100'
                : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
            title="Imprimir ou Guardar em PDF A4"
          >
            {!isAuthenticated || !hasActivePlan ? (
              <Lock className="w-3.5 h-3.5 text-amber-700" />
            ) : (
              <Printer className="w-3.5 h-3.5 text-slate-700" />
            )}
            <span>PDF</span>
          </button>

          {/* Download Word (.docx) */}
          <button
            type="button"
            onClick={handleDownloadWord}
            disabled={isExportingWord || isExportingLocal}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-xs whitespace-nowrap ${
              !isAuthenticated || !hasActivePlan
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {!isAuthenticated || !hasActivePlan ? (
              <Lock className="w-3.5 h-3.5 text-slate-950" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>
              {isExportingWord || isExportingLocal
                ? 'A Gerar...'
                : 'Word (.docx)'}
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
            className="cover-a4-sheet w-full max-w-[210mm] md:w-[210mm] min-h-[700px] sm:min-h-[297mm] bg-white text-slate-900 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18),0_2px_8px_rgba(15,23,42,0.06)] p-6 sm:p-12 md:p-[22mm] md:px-[25mm] rounded-xs border border-slate-300/70 relative flex flex-col justify-between"
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
