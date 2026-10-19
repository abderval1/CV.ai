import React from 'react';
import { Download } from 'lucide-react';

interface HeaderProps {
  activeTab: 'editor' | 'ats' | 'ai' | 'cover' | 'python';
  setActiveTab: (tab: 'editor' | 'ats' | 'ai' | 'cover' | 'python') => void;
  onExportWord: () => void;
  isExportingWord: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onExportWord,
  isExportingWord
}) => {
  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('editor');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-slate-800 transition-colors"
        >
          Currículo Estratégico
        </a>

        {/* Zone 2: 4-5 Clean Nav Tabs */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
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

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onExportWord}
            disabled={isExportingWord}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors rounded-lg shadow-sm whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {isExportingWord
                ? 'A Gerar .docx...'
                : activeTab === 'cover'
                ? 'Descarregar Carta (.docx)'
                : 'Descarregar Word (.docx)'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
