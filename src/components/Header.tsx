import React, { useState } from 'react';
import { Download, Sparkles, FolderOpen, User as UserIcon, LogOut, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeTab: 'raw' | 'editor' | 'ats' | 'ai' | 'cover' | 'python';
  setActiveTab: (tab: 'raw' | 'editor' | 'ats' | 'ai' | 'cover' | 'python') => void;
  onExportWord: () => void;
  isExportingWord: boolean;
  onOpenAuthModal: () => void;
  onOpenPricingModal: () => void;
  onOpenMyResumesModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onExportWord,
  isExportingWord,
  onOpenAuthModal,
  onOpenPricingModal,
  onOpenMyResumesModal
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('raw');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap hover:text-slate-800 transition-colors flex items-center gap-1.5"
          >
            <span>Currículo Estratégico</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-900 text-white px-1.5 py-0.5 rounded text-center">
              SaaS
            </span>
          </a>
        </div>

        {/* Zone 2: Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
              activeTab === 'raw'
                ? 'text-slate-950 font-semibold border-b-2 border-slate-900'
                : 'hover:text-slate-900'
            }`}
          >
            Importar & Gerar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
              activeTab === 'editor'
                ? 'text-slate-950 font-semibold border-b-2 border-slate-900'
                : 'hover:text-slate-900'
            }`}
          >
            Editor & Perfil
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ats')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
              activeTab === 'ats'
                ? 'text-slate-950 font-semibold border-b-2 border-slate-900'
                : 'hover:text-slate-900'
            }`}
          >
            Vaga & Radar ATS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
              activeTab === 'ai'
                ? 'text-slate-950 font-semibold border-b-2 border-slate-900'
                : 'hover:text-slate-900'
            }`}
          >
            Otimizador IA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cover')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
              activeTab === 'cover'
                ? 'text-slate-950 font-semibold border-b-2 border-slate-900'
                : 'hover:text-slate-900'
            }`}
          >
            Carta de Apresentação
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('python')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
              activeTab === 'python'
                ? 'text-slate-950 font-semibold border-b-2 border-slate-900'
                : 'hover:text-slate-900'
            }`}
          >
            Script Python
          </button>
        </nav>

        {/* Zone 3: Actions & SaaS User Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* SaaS Pricing / Subscriptions Button */}
          <button
            type="button"
            onClick={onOpenPricingModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
            title="Ver Planos e Assinaturas"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            <span className="hidden sm:inline">Planos & Preços</span>
            <span className="sm:hidden">Planos</span>
          </button>

          {/* Saved Resumes / Dashboard */}
          <button
            type="button"
            onClick={onOpenMyResumesModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
            title="Gerir os Meus Currículos Salvos"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Meus CVs</span>
          </button>

          {/* User Session Dropdown or Login Button */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate hidden sm:inline">{user.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                  user.plan === 'executive'
                    ? 'bg-purple-100 text-purple-700'
                    : user.plan === 'pro'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {user.plan}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-[10px] font-medium text-slate-600">Plano Ativo:</span>
                        <span className="text-[10px] font-bold text-amber-700 capitalize">{user.plan}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenPricingModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Gerir Assinatura / Upgrade</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenMyResumesModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                      <span>Os Meus Currículos</span>
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Terminar Sessão</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
            >
              <UserIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>Entrar</span>
            </button>
          )}

          {/* Primary Action Button: Export Word (.docx) */}
          <button
            type="button"
            onClick={onExportWord}
            disabled={isExportingWord}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors rounded-lg shadow-sm whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isExportingWord
                ? 'A Gerar .docx...'
                : activeTab === 'cover'
                ? 'Descarregar Carta (.docx)'
                : 'Descarregar Word (.docx)'}
            </span>
            <span className="sm:hidden">Word (.docx)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
