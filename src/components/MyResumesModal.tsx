import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { CVData } from '../types/cv';
import { X, FileText, Trash2, ArrowUpRight, Plus, Check } from 'lucide-react';
import { GENERIC_DEFAULT_CV, BLANK_CV } from '../data/initialCV';
import { getStoredQuotasSync } from '../services/adminModulesService';

interface MyResumesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCV: CVData;
  onLoadResume: (cv: CVData) => void;
  onOpenPricingModal?: (prompt?: string) => void;
}

export const MyResumesModal: React.FC<MyResumesModalProps> = ({
  isOpen,
  onClose,
  currentCV,
  onLoadResume,
  onOpenPricingModal
}) => {
  const { savedResumes, saveCurrentResume, deleteResume, user, hasActivePlan } = useAuth();
  const { showSuccess, showInfo, showError } = useToast();
  const { studioText, siteLanguage } = useLanguage();
  const m = studioText.myResumes;
  const openLabels: Record<'pt' | 'en' | 'es' | 'fr' | 'de' | 'it', { emptyTitle: string; emptyDesc: string; open: string; del: string; updated: string }> = {
    pt: { emptyTitle: 'Nenhum currículo guardado na nuvem ainda', emptyDesc: 'Dê um nome à versão atual no campo acima e clique em Guardar Versão.', open: 'Abrir', del: 'Eliminar versão', updated: 'Modificado em' },
    en: { emptyTitle: 'No saved resumes in the cloud yet', emptyDesc: 'Name your current version above and click Save Version.', open: 'Open', del: 'Delete version', updated: 'Updated' },
    es: { emptyTitle: 'Aún no hay currículums guardados en la nube', emptyDesc: 'Asigna un nombre arriba y haz clic en Guardar Versión.', open: 'Abrir', del: 'Eliminar versión', updated: 'Modificado el' },
    fr: { emptyTitle: 'Aucun CV enregistré dans le cloud', emptyDesc: 'Nommez la version actuelle ci-dessus et cliquez sur Enregistrer.', open: 'Ouvrir', del: 'Supprimer cette version', updated: 'Modifié le' },
    de: { emptyTitle: 'Noch keine Lebensläufe gespeichert', emptyDesc: 'Benennen Sie die Version oben und klicken Sie auf Speichern.', open: 'Öffnen', del: 'Version löschen', updated: 'Geändert am' },
    it: { emptyTitle: 'Nessun curriculum salvato nel cloud', emptyDesc: 'Dai un nome sopra e clicca su Salva Versione.', open: 'Apri', del: 'Elimina versione', updated: 'Aggiornato il' }
  };
  const extra = openLabels[siteLanguage] || openLabels.pt;
  const [newTitle, setNewTitle] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [planQuotas, setPlanQuotas] = useState(() => getStoredQuotasSync());

  useEffect(() => {
    const syncHandler = () => setPlanQuotas(getStoredQuotasSync());
    window.addEventListener('admin-config-updated', syncHandler);
    return () => window.removeEventListener('admin-config-updated', syncHandler);
  }, []);

  if (!isOpen) return null;

  const isAdminUser = user?.role === 'admin';
  const activeQuota = planQuotas.find((q) => q.planId === (user?.plan || 'free'));
  const maxResumesLimit = !isAdminUser && activeQuota && activeQuota.maxResumes < 9000 ? activeQuota.maxResumes : null;

  const handleSaveCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (!hasActivePlan && !isAdminUser) {
      onOpenPricingModal?.(
        'A gravação e sincronização de múltiplas versões de currículos na nuvem é exclusiva para assinantes Pro e Executivo VIP.'
      );
      return;
    }

    const savedTitle = newTitle.trim();
    const isUpdatingExisting = savedResumes.some(
      (r) => r.title.trim().toLowerCase() === savedTitle.toLowerCase()
    );
    if (
      !isAdminUser &&
      !isUpdatingExisting &&
      maxResumesLimit !== null &&
      savedResumes.length >= maxResumesLimit
    ) {
      showError(
        'Limite do Plano Atingido',
        `O seu plano permite até ${maxResumesLimit} currículo(s) guardado(s). Atualize ou substitua uma versão existente.`
      );
      onOpenPricingModal?.(
        `Atingiu o limite de ${maxResumesLimit} currículo(s) do seu plano. Faça upgrade para guardar versões ilimitadas.`
      );
      return;
    }

    setIsSaving(true);
    try {
      await saveCurrentResume(currentCV, savedTitle, currentCV.personalDetails.title);
      setNewTitle('');
      setSaveSuccess(true);
      showSuccess(
        'Currículo Salvo!',
        `"${savedTitle}" foi guardado com sucesso na sua conta.`
      );
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      console.error('Erro ao guardar nova versão do currículo:', err);
      const rawMsg = String(err?.message || '');
      const friendlyDetail = rawMsg.includes('permission')
        ? 'Sem permissão na nuvem para guardar esta versão. Verifique a sua sessão e tente novamente.'
        : rawMsg || 'Não foi possível guardar a nova versão do currículo. Tente novamente.';
      showError('Erro ao Salvar', friendlyDetail);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectResume = (cv: CVData, title?: string) => {
    onLoadResume(cv);
    showSuccess('Currículo Carregado!', `"${title || 'Currículo'}" está pronto para edição.`);
    onClose();
  };

  const handleCreateNewBlank = () => {
    if (!hasActivePlan && !isAdminUser) {
      onOpenPricingModal?.(
        'A criação de novos currículos a partir do zero é exclusiva para assinantes Pro e Executivo VIP.'
      );
      return;
    }
    onLoadResume(BLANK_CV);
    onClose();
  };

  const handleLoadGenericTemplate = () => {
    if (!hasActivePlan && !isAdminUser) {
      onOpenPricingModal?.(
        'A substituição e carregamento de modelos de currículo é exclusiva para assinantes Pro e Executivo VIP.'
      );
      return;
    }
    onLoadResume(GENERIC_DEFAULT_CV);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92dvh] sm:max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{m.title}</h2>
              {user ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  {m.cloudActive}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  {m.localOnly}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user ? m.subtitleAuth : m.subtitleVisitor}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Save Current Resume Row */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/80">
          <form onSubmit={handleSaveCurrent} className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={m.placeholder}
              className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <button
              type="submit"
              disabled={!newTitle.trim() || isSaving}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors whitespace-nowrap shadow-xs flex items-center gap-1.5"
            >
              {saveSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? m.savingBtn : saveSuccess ? m.savedBtn : m.saveBtn}</span>
            </button>
          </form>
        </div>

        {/* List of Saved Resumes */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px] tabular-nums">
              {m.savedCountLabel} ({savedResumes.length}{maxResumesLimit !== null ? `/${maxResumesLimit}` : ''})
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreateNewBlank}
                className="text-[11px] text-slate-700 hover:text-slate-950 font-semibold hover:underline"
              >
                {m.newBlankBtn}
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleLoadGenericTemplate}
                className="text-[11px] text-slate-700 hover:text-slate-950 font-semibold hover:underline"
              >
                {m.loadDefaultBtn}
              </button>
            </div>
          </div>

          {savedResumes.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
              <FileText className="w-7 h-7 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-800">{extra.emptyTitle}</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">{extra.emptyDesc}</p>
            </div>
          ) : (
            savedResumes.map((resume) => (
              <div
                key={resume.id}
                className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all shadow-2xs flex items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{resume.title}</h4>
                    <p className="text-[11px] text-slate-500 truncate tabular-nums">
                      {resume.targetJob} · {extra.updated} {resume.updatedAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelectResume(resume.data, resume.title)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>{extra.open}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteResume(resume.id);
                      showInfo(extra.del, resume.title);
                    }}
                    aria-label={extra.del}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title={extra.del}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
