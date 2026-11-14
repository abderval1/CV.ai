import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CVData } from '../types/cv';
import { X, FileText, Trash2, ArrowUpRight, Plus, Check } from 'lucide-react';
import { GENERIC_DEFAULT_CV, BLANK_CV } from '../data/initialCV';

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
  const { savedResumes, saveCurrentResume, deleteResume, firebaseUser, user, hasActivePlan } = useAuth();
  const { showSuccess, showInfo, showError } = useToast();
  const [newTitle, setNewTitle] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (!hasActivePlan) {
      onOpenPricingModal?.(
        'A gravação e sincronização de múltiplas versões de currículos na nuvem é exclusiva para assinantes Pro e Executivo VIP.'
      );
      return;
    }

    setIsSaving(true);
    try {
      const savedTitle = newTitle.trim();
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
        : 'Não foi possível guardar a nova versão do currículo. Tente novamente.';
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
    if (!hasActivePlan) {
      onOpenPricingModal?.(
        'A criação de novos currículos a partir do zero é exclusiva para assinantes Pro e Executivo VIP.'
      );
      return;
    }
    onLoadResume(BLANK_CV);
    onClose();
  };

  const handleLoadGenericTemplate = () => {
    if (!hasActivePlan) {
      onOpenPricingModal?.(
        'A substituição e carregamento de modelos de currículo é exclusiva para assinantes Pro e Executivo VIP.'
      );
      return;
    }
    onLoadResume(GENERIC_DEFAULT_CV);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Os Meus Currículos Salvos</h2>
              {user ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Conta Ativa: Sincronização na Nuvem
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  Armazenamento Local
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user
                ? 'Os seus currículos estão armazenados com segurança na nuvem associados ao seu e-mail.'
                : 'Inicie sessão ou crie uma conta para sincronizar os seus currículos permanentemente na nuvem.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
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
              placeholder="Dar um nome à versão atual (ex: CV Executivo COO 2026, CV Tech Lead, CV M&A)..."
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
              <span>{isSaving ? 'A guardar...' : saveSuccess ? 'Guardado na Nuvem!' : 'Guardar Versão'}</span>
            </button>
          </form>
        </div>

        {/* List of Saved Resumes */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Currículos Guardados ({savedResumes.length})
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreateNewBlank}
                className="text-[11px] text-slate-700 hover:text-slate-950 font-semibold hover:underline"
              >
                + Começar em Branco
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleLoadGenericTemplate}
                className="text-[11px] text-slate-700 hover:text-slate-950 font-semibold hover:underline"
              >
                Carregar Modelo Padrão
              </button>
            </div>
          </div>

          {savedResumes.map((resume) => (
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
                  <p className="text-[11px] text-slate-500 truncate">
                    {resume.targetJob} · Modificado em {resume.updatedAt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectResume(resume.data, resume.title)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>Abrir</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
                {savedResumes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteResume(resume.id);
                      showInfo('Currículo Removido', `"${resume.title}" foi removido da sua lista.`);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Eliminar versão"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
