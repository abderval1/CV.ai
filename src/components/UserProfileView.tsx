import React, { useState } from 'react';
import {
  User as UserIcon,
  Sparkles,
  ShieldCheck,
  CreditCard,
  QrCode,
  FolderOpen,
  Calendar,
  ExternalLink,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Copy,
  LogOut,
  Save,
  Download,
  Trash2,
  FileText,
  Zap,
  Lock,
  ArrowRight,
  TrendingUp,
  Award,
  Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { CVData, SubscriptionPlan, SavedResume } from '../types/cv';
import { generateWordDocument, triggerDownload } from '../utils/docxExport';
import { OFFICIAL_PIX_KEY } from './PricingModal';

interface UserProfileViewProps {
  onNavigateTab: (tab: 'home' | 'raw' | 'editor' | 'ats' | 'ai' | 'cover' | 'python' | 'interview') => void;
  onOpenPricing: () => void;
  onLoadResume: (cv: CVData) => void;
  currentCV: CVData;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  onNavigateTab,
  onOpenPricing,
  onLoadResume,
  currentCV
}) => {
  const {
    user,
    isAuthenticated,
    isPro,
    isExecutive,
    logout,
    updateUserProfile,
    switchDemoPlan,
    savedResumes,
    saveCurrentResume,
    deleteResume
  } = useAuth();
  const { formatPrice } = useCurrency();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'resumes' | 'settings'>('overview');
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [profileName, setProfileName] = useState<string>(user?.name || '');
  const [profileTargetRole, setProfileTargetRole] = useState<string>(user?.targetRole || '');
  const [profilePhone, setProfilePhone] = useState<string>(user?.phone || '');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState<boolean>(false);

  // New Resume Save Form State
  const [newResumeTitle, setNewResumeTitle] = useState<string>('');
  const [isSavingCurrent, setIsSavingCurrent] = useState<boolean>(false);

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-4xl mx-auto p-6 sm:p-12 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-slate-900" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Área do Usuário Reservada</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Faça login ou crie a sua conta profissional para aceder aos seus currículos salvos, créditos de inteligência artificial e dados de assinatura.
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('home')}
              className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      name: profileName,
      targetRole: profileTargetRole,
      phone: profilePhone
    });
    setIsEditingProfile(false);
    setSaveSuccessMsg('Dados atualizados com sucesso!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(OFFICIAL_PIX_KEY);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleSaveCurrentCV = async () => {
    if (!newResumeTitle.trim()) return;
    setIsSavingCurrent(true);
    try {
      await saveCurrentResume(currentCV, newResumeTitle.trim(), user.targetRole || 'Vaga Executiva');
      setNewResumeTitle('');
      setSaveSuccessMsg('Currículo atual salvo na sua biblioteca com sucesso!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } finally {
      setIsSavingCurrent(false);
    }
  };

  const handleExportWordResume = async (resume: SavedResume) => {
    const blob = await generateWordDocument(resume.data);
    triggerDownload(blob, `Curriculo_${resume.title.replace(/\s+/g, '_')}.docx`);
  };

  const planBadgeStyle =
    user.plan === 'executive'
      ? 'bg-purple-100 text-purple-900 border-purple-300 ring-2 ring-purple-500/20'
      : user.plan === 'pro'
      ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-500/20'
      : 'bg-slate-100 text-slate-700 border-slate-300';

  const planDisplayName =
    user.plan === 'executive'
      ? 'Executivo VIP'
      : 'Profissional Pro';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Feedback Toast */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Profile Header Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 p-6 sm:p-8 text-white relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">{user.name}</h1>
                  <span
                    className={`text-xs px-3 py-0.5 rounded-full font-extrabold uppercase border flex items-center gap-1.5 ${planBadgeStyle}`}
                  >
                    {user.plan === 'executive' && <Crown className="w-3.5 h-3.5 text-purple-700" />}
                    {user.plan === 'pro' && <Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                    <span>{planDisplayName}</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
                  {user.targetRole || 'Profissional Executivo'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="py-2 px-3.5 bg-slate-800/90 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>{isEditingProfile ? 'Cancelar' : 'Editar Dados'}</span>
              </button>

              <button
                type="button"
                onClick={() => logout()}
                className="py-2 px-3.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 rounded-xl text-xs font-semibold text-rose-300 flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Terminar Sessão</span>
              </button>
            </div>
          </div>

          {/* Quick Simulation Bar (Allows testing Pro and Executive VIP instantly) */}
          <div className="mt-6 pt-4 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-400 text-[11px] flex items-center gap-1 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Alternar Nível de Assinatura (Simulação):
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => switchDemoPlan('pro')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  user.plan === 'pro'
                    ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                1. Assinante Pro ($29/mês)
              </button>
              <button
                type="button"
                onClick={() => switchDemoPlan('executive')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  user.plan === 'executive'
                    ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                2. Executivo VIP ($49/mês)
              </button>
            </div>
          </div>
        </div>

        {/* Inline Edit Form */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className="p-6 bg-slate-50 border-b border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              Atualizar Informações da Conta
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo Desejado / Alvo</label>
                <input
                  type="text"
                  value={profileTargetRole}
                  onChange={(e) => setProfileTargetRole(e.target.value)}
                  placeholder="Ex: Head de Operações, Tech Lead"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+55 11 99999-9999"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </form>
        )}

        {/* Profile Tabs Navigation */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-white overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('overview')}
            className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'overview'
                ? 'border-slate-900 text-slate-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Assinatura & Plano</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('resumes')}
            className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'resumes'
                ? 'border-slate-900 text-slate-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-amber-600" />
            <span>Meus Currículos Salvos ({savedResumes.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Subscription & Overview */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1 & 2: Plan Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Detalhes do Seu Plano de Acesso
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Visão geral dos recursos desbloqueados e limites contratados
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onOpenPricing}
                  className="py-2 px-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{user.plan === 'pro' ? 'Fazer Upgrade para VIP' : 'Gerir Assinatura'}</span>
                </button>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Nível de Assinatura
                  </span>
                  <span className="text-sm font-black text-slate-900 mt-1 block">
                    {planDisplayName}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Assinatura Ativa
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Créditos de IA Restantes
                  </span>
                  <span className="text-sm font-black text-slate-900 mt-1 block">
                    Ilimitados (Sem Limite)
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Acesso total liberado
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Ciclo de Cobrança
                  </span>
                  <span className="text-sm font-black text-slate-900 mt-1 block capitalize">
                    {user.billingCycle === 'yearly'
                      ? 'Anual (Poupe 31%)'
                      : 'Mensal'}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {user.subscriptionExpiresAt
                      ? `Até ${new Date(user.subscriptionExpiresAt).toLocaleDateString('pt-PT')}`
                      : 'Renovação contínua'}
                  </span>
                </div>
              </div>

              {/* Unlocked Matrix */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Recursos do Seu Plano Ativo:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl border bg-emerald-50/50 border-emerald-200 text-emerald-900 flex items-center justify-between">
                    <span className="font-semibold">Radar ATS & Densidade Semântica</span>
                    <span className="text-[10px] font-bold uppercase">✓ Incluído no Plano</span>
                  </div>

                  <div className="p-3 rounded-xl border bg-emerald-50/50 border-emerald-200 text-emerald-900 flex items-center justify-between">
                    <span className="font-semibold">Otimizador IA de Conquistas & Balas</span>
                    <span className="text-[10px] font-bold uppercase">✓ Incluído no Plano</span>
                  </div>

                  <div className="p-3 rounded-xl border bg-emerald-50/50 border-emerald-200 text-emerald-900 flex items-center justify-between">
                    <span className="font-semibold">Carta de Apresentação com IA</span>
                    <span className="text-[10px] font-bold uppercase">✓ Incluído no Plano</span>
                  </div>

                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      user.plan === 'executive'
                        ? 'bg-purple-50 border-purple-200 text-purple-900'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="font-semibold">Simulador de Entrevista STAR com Voz</span>
                    <span className="text-[10px] font-bold uppercase">
                      {user.plan === 'executive' ? '✓ Desbloqueado' : 'Requer Executivo VIP'}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      user.plan === 'executive'
                        ? 'bg-purple-50 border-purple-200 text-purple-900'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="font-semibold">Compilação Offline em Python / LaTeX</span>
                    <span className="text-[10px] font-bold uppercase">
                      {user.plan === 'executive' ? '✓ Desbloqueado' : 'Requer Executivo VIP'}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      user.plan === 'executive'
                        ? 'bg-purple-50 border-purple-200 text-purple-900'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="font-semibold">Templates Harvard C-Level Exclusivos</span>
                    <span className="text-[10px] font-bold uppercase">
                      {user.plan === 'executive' ? '✓ Desbloqueado' : 'Requer Executivo VIP'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Col 3: Side Card Actions */}
          <div className="space-y-6">
            {/* Quick Navigation to Tools */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Atalhos do Studio
              </h3>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab('editor')}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border border-slate-200 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold text-slate-800">Editor de Conteúdo</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('ats')}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border border-slate-200 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-800">Radar ATS & Vaga</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('interview')}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border border-slate-200 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Crown className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-semibold text-slate-800">Simulador de Entrevista</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Pix Reference for Instant Upgrade */}
            <div className="bg-amber-50/70 rounded-3xl border border-amber-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-amber-700" />
                  Pagamento Direto via Pix
                </span>
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="text-[11px] font-bold text-amber-900 underline"
                >
                  {copiedPix ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="text-[11px] text-amber-900/80 leading-relaxed">
                Ativação imediata sem anuidade ou cartão. Chave oficial cadastrada:
              </p>
              <div className="p-2.5 bg-white rounded-xl border border-amber-200 font-mono text-[11px] text-slate-800 break-all select-all">
                {OFFICIAL_PIX_KEY}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Saved Resumes Management */}
      {activeSubTab === 'resumes' && (
        <div className="space-y-6">
          {/* Action Box to save current in-progress CV */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Salvar Currículo Atual na Sua Biblioteca
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Dê um nome para identificar este currículo (ex: &quot;Versão Vaga Diretor Google&quot;).
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="Título do Currículo (Ex: Executivo de Operações v2)"
                value={newResumeTitle}
                onChange={(e) => setNewResumeTitle(e.target.value)}
                className="flex-1 w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={handleSaveCurrentCV}
                disabled={!newResumeTitle.trim() || isSavingCurrent}
                className="w-full sm:w-auto py-2.5 px-5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Agora</span>
              </button>
            </div>
          </div>

          {/* List of Resumes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedResumes.map((resume) => (
              <div
                key={resume.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{resume.title}</h4>
                        <span className="text-[11px] text-slate-500">{resume.targetJob}</span>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {resume.updatedAt}
                    </span>
                  </div>

                  <div className="mt-3 text-[11px] text-slate-600 space-y-1">
                    <p>
                      <strong>Candidato:</strong> {resume.data.personalDetails.name || 'Sem Nome'}
                    </p>
                    <p>
                      <strong>Modelo:</strong> {resume.data.templateStyle}
                    </p>
                    <p>
                      <strong>Cargos Registados:</strong> {resume.data.experiences.length}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onLoadResume(resume.data);
                        onNavigateTab('editor');
                      }}
                      className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Abrir no Editor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportWordResume(resume)}
                      className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                      title="Exportar documento Word (.docx)"
                    >
                      <Download className="w-3 h-3" />
                      <span>Word</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteResume(resume.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Excluir currículo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
