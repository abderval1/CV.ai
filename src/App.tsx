import { useState } from 'react';
import { CVData } from './types/cv';
import { AGOSTINHO_CV, SAMPLE_JOB_OFFERS } from './data/initialCV';
import { Header } from './components/Header';
import { CVDocumentView } from './components/CVDocumentView';
import { ContentEditor } from './components/ContentEditor';
import { AtsRadarPanel } from './components/AtsRadarPanel';
import { AiTailorPanel } from './components/AiTailorPanel';
import { CoverLetterPanel } from './components/CoverLetterPanel';
import { PythonScriptPanel } from './components/PythonScriptPanel';
import { generateWordDocument, triggerDownload } from './utils/docxExport';
import { FileText, SlidersHorizontal, Check } from 'lucide-react';

export default function App() {
  const [cv, setCv] = useState<CVData>(AGOSTINHO_CV);
  const [jobDescription, setJobDescription] = useState<string>(
    SAMPLE_JOB_OFFERS[0].description
  );
  const [activeTab, setActiveTab] = useState<'editor' | 'ats' | 'ai' | 'cover' | 'python'>(
    'editor'
  );
  const [mobileViewMode, setMobileViewMode] = useState<'controls' | 'preview'>('controls');
  const [isExportingWord, setIsExportingWord] = useState<boolean>(false);
  const [wordSuccessNotification, setWordSuccessNotification] = useState<boolean>(false);

  const handleExportWord = async () => {
    try {
      setIsExportingWord(true);
      const blob = await generateWordDocument(cv);
      const sanitizedName = cv.personalDetails.name.trim().replace(/\s+/g, '_') || 'Curriculo';
      triggerDownload(blob, `CV_${sanitizedName}_MEAL.docx`);
      setWordSuccessNotification(true);
      setTimeout(() => setWordSuccessNotification(false), 4000);
    } catch (err) {
      console.error('Falha ao exportar documento Word:', err);
      alert('Não foi possível compilar o ficheiro Word. Verifique os dados inseridos.');
    } finally {
      setIsExportingWord(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Top Bar Navigation Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportWord={handleExportWord}
        isExportingWord={isExportingWord}
      />

      {/* Word Export Floating Toast Notification */}
      {wordSuccessNotification && (
        <div className="no-print fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="font-semibold">Ficheiro Word (.docx) Descarregado!</p>
            <p className="text-slate-300">Formatado segundo o padrão internacional de tipografia e margens.</p>
          </div>
        </div>
      )}

      {/* Mobile Toggle Bar */}
      <div className="no-print lg:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full">
          <button
            type="button"
            onClick={() => setMobileViewMode('controls')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${
              mobileViewMode === 'controls'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Configurações & Painel</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileViewMode('preview')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${
              mobileViewMode === 'preview'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ver Currículo A4</span>
          </button>
        </div>
      </div>

      {/* Main Studio Dual-Pane Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-4rem)]">
        {/* Left Side: Control Deck / Tool Tabs */}
        <section
          className={`w-full lg:w-[46%] xl:w-[42%] 2xl:w-[38%] border-r border-slate-200 bg-slate-50 flex flex-col overflow-y-auto no-print ${
            mobileViewMode === 'preview' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Section Breadcrumb & Status */}
          <div className="px-4 sm:px-6 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-900">
                {activeTab === 'editor' && '1. Editor de Conteúdo & Perfil'}
                {activeTab === 'ats' && '2. Vaga & Análise de Compatibilidade ATS'}
                {activeTab === 'ai' && '3. Otimizador com Inteligência Artificial'}
                {activeTab === 'cover' && '4. Carta de Motivação para a Candidatura'}
                {activeTab === 'python' && '5. Script Python para Compilação Local'}
              </span>
            </div>

            <span className="text-[11px] text-slate-500 font-mono">
              {cv.experiences.length} Cargos · {cv.competencies.length} Competências
            </span>
          </div>

          {/* Active Tab Panel View */}
          <div className="p-4 sm:p-6 flex-1">
            {activeTab === 'editor' && (
              <ContentEditor
                cv={cv}
                onChange={setCv}
                onOpenAiTailor={() => setActiveTab('ai')}
              />
            )}

            {activeTab === 'ats' && (
              <AtsRadarPanel
                cv={cv}
                onChange={setCv}
                jobDescription={jobDescription}
                setJobDescription={setJobDescription}
                onOpenAiTailor={() => setActiveTab('ai')}
              />
            )}

            {activeTab === 'ai' && (
              <AiTailorPanel
                cv={cv}
                onChange={setCv}
                jobDescription={jobDescription}
              />
            )}

            {activeTab === 'cover' && (
              <CoverLetterPanel
                cv={cv}
                jobDescription={jobDescription}
              />
            )}

            {activeTab === 'python' && <PythonScriptPanel cv={cv} />}
          </div>
        </section>

        {/* Right Side: High-Fidelity A4 Document Canvas */}
        <section
          className={`flex-1 flex flex-col h-full overflow-hidden bg-slate-200/70 ${
            mobileViewMode === 'controls' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <CVDocumentView
            cv={cv}
            onChange={setCv}
            onExportWord={handleExportWord}
            isExportingWord={isExportingWord}
          />
        </section>
      </main>
    </div>
  );
}
