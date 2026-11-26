import React, { useState } from 'react';
import { CVData } from '../types/cv';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../context/LanguageContext';
import { TOOLS_UI_TRANSLATIONS } from '../i18n/toolsUiTranslations';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { generateWordDocument } from '../utils/docxExport';
import { getTemplateById } from '../data/templateCatalog';
import { recordAuditLog } from '../services/auditLogService';
import { dispatchUserNotification } from '../services/notificationService';
import { authorizedFetch } from '../utils/authHeaders';
import {
  X,
  Globe,
  Languages,
  Download,
  Printer,
  FileText,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Lock,
  RefreshCw
} from 'lucide-react';

interface MultiLanguageDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  cv: CVData;
  onApplyTranslatedCV: (translated: CVData) => void;
  onOpenPricingModal?: (prompt?: string) => void;
  onOpenAuthModal?: (prompt?: string) => void;
  density?: 'compact' | 'normal' | 'relaxed';
}

export const MultiLanguageDownloadModal: React.FC<MultiLanguageDownloadModalProps> = ({
  isOpen,
  onClose,
  cv,
  onApplyTranslatedCV,
  onOpenPricingModal,
  onOpenAuthModal,
  density = 'normal'
}) => {
  const { setLanguage, siteLanguage } = useLanguage();
  const ui = (TOOLS_UI_TRANSLATIONS[siteLanguage] || TOOLS_UI_TRANSLATIONS.en).multiLangModal;
  const { user, isAuthenticated, hasActivePlan } = useAuth();
  const { showSuccess, showError } = useToast();

  const [selectedLang, setSelectedLang] = useState<LanguageCode>('en');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translatedCV, setTranslatedCV] = useState<CVData | null>(null);
  const [isExportingWord, setIsExportingWord] = useState<boolean>(false);
  const [lastTranslatedLang, setLastTranslatedLang] = useState<LanguageCode | null>(null);

  if (!isOpen) return null;

  const handleTranslate = async (targetLang: LanguageCode) => {
    if (!isAuthenticated) {
      onOpenAuthModal?.(ui.authTranslateReq);
      return;
    }
    if (!hasActivePlan) {
      onOpenPricingModal?.(ui.planTranslateReq);
      return;
    }

    setIsTranslating(true);
    try {
      const response = await authorizedFetch('/api/translate-cv', {
        method: 'POST',
        body: JSON.stringify({
          cvData: cv,
          targetLanguage: targetLang
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.translatedCV) {
        // Merge keeping styling and order intact
        const merged: CVData = {
          ...cv,
          ...data.translatedCV,
          templateStyle: cv.templateStyle,
          accentColor: cv.accentColor,
          fontFamily: cv.fontFamily,
          sectionOrder: cv.sectionOrder,
          sectionVisibility: cv.sectionVisibility
        };
        setTranslatedCV(merged);
        setLastTranslatedLang(targetLang);
        const targetLangName =
          ui.langNames[targetLang as keyof typeof ui.langNames] ||
          SUPPORTED_LANGUAGES.find((l) => l.code === targetLang)?.name ||
          targetLang.toUpperCase();
        showSuccess(
          ui.translationReadyTitle,
          `${ui.translationReadySubPrefix} ${targetLangName}.`
        );
        if (user) {
          void dispatchUserNotification({
            user,
            eventType: 'translation',
            title: ui.notifTranslateTitle,
            message: `${ui.notifTranslateMsgPrefix} ${targetLangName}.`,
            targetResource: `translation/${targetLang}`
          });
        }
      } else {
        throw new Error(ui.translationErrorFallback);
      }
    } catch (err: any) {
      console.error('Falha ao traduzir CV:', err);
      showError(
        ui.translationErrorTitle,
        err.message || ui.translationErrorFallback
      );
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDownloadWord = async (docToExport: CVData, targetLang: LanguageCode) => {
    if (!isAuthenticated) {
      void recordAuditLog({
        action: 'cv_export_blocked_unauthorized',
        category: 'cv_export',
        severity: 'warning',
        status: 'blocked',
        targetResource: `resumes/${docToExport.templateStyle}/docx/${targetLang}`,
        details: `Exportação multilingue Word (${targetLang.toUpperCase()}) bloqueada: não autenticado.`,
        metadata: { format: 'docx', language: targetLang }
      });
      onOpenAuthModal?.(ui.authExportReq);
      return;
    }
    if (!hasActivePlan) {
      void recordAuditLog({
        action: 'cv_export_blocked_unauthorized',
        category: 'cv_export',
        severity: 'warning',
        status: 'blocked',
        targetResource: `resumes/${docToExport.templateStyle}/docx/${targetLang}`,
        details: `Exportação multilingue Word (${targetLang.toUpperCase()}) bloqueada: plano pago exigido.`,
        metadata: { format: 'docx', language: targetLang }
      });
      onOpenPricingModal?.(ui.planExportReq);
      return;
    }

    try {
      setIsExportingWord(true);
      const templateInfo = getTemplateById(docToExport.templateStyle);
      const sanitizedName = docToExport.personalDetails.name.trim().replace(/\s+/g, '_') || 'Resume';
      const langUpper = targetLang.toUpperCase();
      const blob = await generateWordDocument(docToExport, true, density, targetLang);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CV_${sanitizedName}_${langUpper}_${templateInfo.shortName.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      void recordAuditLog({
        action: 'cv_exported_docx',
        category: 'cv_export',
        severity: 'info',
        status: 'success',
        targetResource: `resumes/${docToExport.templateStyle}/docx/${targetLang}`,
        details: `Currículo multilingue exportado em Word (.docx) — idioma ${langUpper}, modelo ${templateInfo.shortName}.`,
        metadata: { format: 'docx', language: targetLang, templateStyle: docToExport.templateStyle }
      });
      if (user) {
        void dispatchUserNotification({
          user,
          eventType: 'export',
          title: ui.notifExportTitle,
          message: `${ui.notifExportWordPrefix} ${langUpper} (${templateInfo.shortName}) (.docx).`,
          targetResource: `resumes/${docToExport.templateStyle}/docx/${targetLang}`
        });
      }

      showSuccess(
        ui.wordSuccessTitle,
        `${ui.wordSuccessSubPrefix} ${langUpper} ${ui.wordSuccessSubSuffix}`
      );
    } catch (err: any) {
      console.error('Falha ao exportar docx:', err);
      showError(ui.wordErrorTitle, ui.wordErrorDesc);
    } finally {
      setIsExportingWord(false);
    }
  };

  const handlePrintPDF = (docToPrint: CVData) => {
    if (!isAuthenticated) {
      void recordAuditLog({
        action: 'cv_export_blocked_unauthorized',
        category: 'cv_export',
        severity: 'warning',
        status: 'blocked',
        targetResource: `resumes/${docToPrint.templateStyle}/pdf/${selectedLang}`,
        details: `Exportação multilingue PDF (${selectedLang.toUpperCase()}) bloqueada: não autenticado.`,
        metadata: { format: 'pdf', language: selectedLang }
      });
      onOpenAuthModal?.(ui.authPdfReq);
      return;
    }
    if (!hasActivePlan) {
      void recordAuditLog({
        action: 'cv_export_blocked_unauthorized',
        category: 'cv_export',
        severity: 'warning',
        status: 'blocked',
        targetResource: `resumes/${docToPrint.templateStyle}/pdf/${selectedLang}`,
        details: `Exportação multilingue PDF (${selectedLang.toUpperCase()}) bloqueada: plano pago exigido.`,
        metadata: { format: 'pdf', language: selectedLang }
      });
      onOpenPricingModal?.(ui.planPdfReq);
      return;
    }

    void recordAuditLog({
      action: 'cv_exported_pdf',
      category: 'cv_export',
      severity: 'info',
      status: 'success',
      targetResource: `resumes/${docToPrint.templateStyle}/pdf/${selectedLang}`,
      details: `Currículo multilingue exportado em PDF — idioma ${selectedLang.toUpperCase()}.`,
      metadata: { format: 'pdf', language: selectedLang, templateStyle: docToPrint.templateStyle }
    });
    if (user) {
      void dispatchUserNotification({
        user,
        eventType: 'export',
        title: ui.notifExportTitle,
        message: `${ui.notifExportPdfPrefix} ${selectedLang.toUpperCase()} ${ui.notifExportPdfSuffix}`,
        targetResource: `resumes/${docToPrint.templateStyle}/pdf/${selectedLang}`
      });
    }

    // Apply the translated CV and language to the main app and trigger window.print()
    setLanguage(selectedLang);
    onApplyTranslatedCV(docToPrint);
    onClose();
    setTimeout(() => {
      window.print();
    }, 450);
  };

  const activeDoc = (lastTranslatedLang === selectedLang && translatedCV) ? translatedCV : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-t-3xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-medium shadow-2xs">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {ui.modalTitle}
              </h2>
              <p className="text-xs text-slate-500">
                {ui.modalSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            aria-label={ui.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Target Language Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
              {ui.selectLang}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = selectedLang === lang.code;
                const hasTranslation = lastTranslatedLang === lang.code && translatedCV;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedLang(lang.code)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 text-slate-950 font-semibold shadow-2xs ring-1 ring-slate-900/10'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl leading-none">{lang.flag}</span>
                      <div>
                        <div className="text-xs font-medium">
                          {ui.langNames[lang.code as keyof typeof ui.langNames] || lang.name}
                        </div>
                        <div className="text-[10px] text-slate-500">{lang.code.toUpperCase()}</div>
                      </div>
                    </div>
                    {hasTranslation && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Translation Trigger or Status */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-semibold text-slate-800">
                  {lastTranslatedLang === selectedLang && translatedCV
                    ? `${ui.activeTranslationPrefix} ${ui.langNames[selectedLang as keyof typeof ui.langNames] || selectedLang.toUpperCase()}${ui.activeTranslationSuffix ? ` ${ui.activeTranslationSuffix}` : ''}`
                    : `${ui.readyTranslationPrefix} ${ui.langNames[selectedLang as keyof typeof ui.langNames] || selectedLang.toUpperCase()}${ui.readyTranslationSuffix ? ` ${ui.readyTranslationSuffix}` : ''}`}
                </span>
              </div>
              <button
                type="button"
                disabled={isTranslating}
                onClick={() => handleTranslate(selectedLang)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-md shadow-2xs transition-colors"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{ui.translating}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>
                      {lastTranslatedLang === selectedLang && translatedCV
                        ? ui.updateTranslation
                        : ui.translateAction}
                    </span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {ui.explanation}
            </p>
          </div>

          {/* Preview of Translated Content if ready */}
          {activeDoc && (
            <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {ui.previewTranslated}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {ui.langNames[selectedLang as keyof typeof ui.langNames] || selectedLang.toUpperCase()} ({selectedLang.toUpperCase()})
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-medium text-slate-900">{activeDoc.personalDetails.name}</span>
                  <span className="text-slate-500 ml-2">· {activeDoc.personalDetails.title}</span>
                </div>
                {activeDoc.summary && (
                  <p className="text-slate-600 line-clamp-2 italic bg-slate-50 p-2 rounded text-[11px]">
                    "{activeDoc.summary}"
                  </p>
                )}
                {activeDoc.experiences?.[0] && (
                  <div className="text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-800">{activeDoc.experiences[0].role}</span>
                    <span className="text-slate-400"> @ </span>
                    <span className="text-slate-700">{activeDoc.experiences[0].company}</span>
                    <span className="text-slate-400"> ({activeDoc.experiences[0].period})</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Download Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
              {ui.exportOptionsLabel}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Editable CV/Resume Button */}
              <button
                type="button"
                disabled={isExportingWord}
                onClick={() => handleDownloadWord(activeDoc || cv, selectedLang)}
                className={`flex items-center justify-between p-3.5 rounded-lg border text-left transition-colors shadow-2xs ${
                  !isAuthenticated || !hasActivePlan
                    ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950'
                    : 'border-blue-600 bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center font-semibold ${
                    !isAuthenticated || !hasActivePlan
                      ? 'bg-amber-200/80 text-amber-900'
                      : 'bg-blue-500 text-white'
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">
                      {isExportingWord ? ui.downloading : ui.downloadDocx}
                    </div>
                    <div className={`text-[10px] ${!isAuthenticated || !hasActivePlan ? 'text-amber-800' : 'text-blue-100'}`}>
                      {ui.openXmlSub}
                    </div>
                  </div>
                </div>
                {!isAuthenticated || !hasActivePlan ? (
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-white" />
                )}
              </button>

              {/* PDF / Print Button */}
              <button
                type="button"
                onClick={() => handlePrintPDF(activeDoc || cv)}
                className={`flex items-center justify-between p-3.5 rounded-lg border text-left transition-colors shadow-2xs ${
                  !isAuthenticated || !hasActivePlan
                    ? 'border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 text-amber-950'
                    : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center font-semibold ${
                    !isAuthenticated || !hasActivePlan
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">
                      {ui.downloadPdf}
                    </div>
                    <div className="text-[10px] text-slate-500">{ui.vectorA4Sub}</div>
                  </div>
                </div>
                {!isAuthenticated || !hasActivePlan ? (
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 text-white/80" />
                )}
              </button>
            </div>
          </div>

          {/* Load into Editor Action */}
          {activeDoc && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                {ui.continueEditingPrompt}
              </span>
              <button
                type="button"
                onClick={() => {
                  setLanguage(selectedLang);
                  onApplyTranslatedCV(activeDoc);
                  onClose();
                  showSuccess(
                    ui.loadedEditorTitle,
                    `${ui.loadedEditorSubPrefix} ${ui.langNames[selectedLang as keyof typeof ui.langNames] || selectedLang.toUpperCase()}.`
                  );
                }}
                className="text-xs font-semibold text-slate-900 hover:text-slate-700 underline underline-offset-4"
              >
                {ui.applyToEditor} →
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            {hasActivePlan ? (
              <span className="text-emerald-700 font-medium">{ui.unlimitedFooter}</span>
            ) : (
              <span className="text-amber-800 font-medium">{ui.planRequiredFooter}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
          >
            {ui.close}
          </button>
        </div>
      </div>
    </div>
  );
};
