import { useState } from 'react';
import { CVData } from './types/cv';
import { GENERIC_DEFAULT_CV, SAMPLE_JOB_OFFERS } from './data/initialCV';
import { Header } from './components/Header';
import { CVDocumentView } from './components/CVDocumentView';
import { ContentEditor } from './components/ContentEditor';
import { AtsRadarPanel } from './components/AtsRadarPanel';
import { AiTailorPanel } from './components/AiTailorPanel';
import { CoverLetterPanel } from './components/CoverLetterPanel';
import { PythonScriptPanel } from './components/PythonScriptPanel';
import { RawInputGenerator } from './components/RawInputGenerator';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';
import { MyResumesModal } from './components/MyResumesModal';
import { generateWordDocument, generateCoverLetterDocx, triggerDownload } from './utils/docxExport';
import { FileText, SlidersHorizontal, Check } from 'lucide-react';

export default function App() {
  const [cv, setCv] = useState<CVData>(GENERIC_DEFAULT_CV);
  const [jobDescription, setJobDescription] = useState<string>(
    SAMPLE_JOB_OFFERS[0].description
  );
  const [activeTab, setActiveTab] = useState<'raw' | 'editor' | 'ats' | 'ai' | 'cover' | 'python'>(
    'raw'
  );
  const [mobileViewMode, setMobileViewMode] = useState<'controls' | 'preview'>('controls');
  const [isExportingWord, setIsExportingWord] = useState<boolean>(false);
  const [wordSuccessNotification, setWordSuccessNotification] = useState<boolean>(false);
  const [wordNotificationMessage, setWordNotificationMessage] = useState<string>(
    'Ficheiro Word (.docx) Descarregado!'
  );

  // Modal states for SaaS
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [isMyResumesModalOpen, setIsMyResumesModalOpen] = useState<boolean>(false);

  const [letterBody, setLetterBody] = useState<string>(
    `To: The Selection and Recruitment Committee
International Development Programme / Partner Agency
Luanda, Angola

Subject: Application for the Position of Senior Project & Information Systems Coordinator

Dear Members of the Selection Committee,

It is with great interest and professional dedication that I submit my application for this executive position. With solid progressive experience in designing, operationalizing, and automating digital Monitoring, Evaluation, and Information Systems, I bring a proven track record of technical leadership in high-impact initiatives.

In my recent assignments, I was responsible for architecting, deploying, and maintaining collaborative digital platforms, standardizing field data collection workflows, and ensuring strict adherence to international evaluation standards and data security policies. 

Furthermore, my operational expertise in electronic mobile data collection (KoBoToolbox, ODK), data quality assurance (DQA) field audits, and executive dashboard modeling in Power BI enables leadership teams and international partners to make agile, evidence-based strategic decisions.

Driven by the strategic vision and impact of your organization, and prepared for immediate deployment, I welcome the opportunity to discuss my qualifications in greater detail during a technical interview.

Sincerely,

${cv.personalDetails.name || 'Seu Nome'}
${cv.personalDetails.title || 'Especialista em Gestão de Projetos & Sistemas'}
${cv.personalDetails.phone || '+244 923 000 000'} | ${cv.personalDetails.email || 'seu.email@exemplo.com'}`
  );

  const handleExportWord = async () => {
    try {
      setIsExportingWord(true);
      const sanitizedName = cv.personalDetails.name.trim().replace(/\s+/g, '_') || 'Curriculo_Estrategico';

      if (activeTab === 'cover') {
        const blob = await generateCoverLetterDocx(cv, letterBody);
        triggerDownload(blob, `Carta_Apresentacao_${sanitizedName}.docx`);
        setWordNotificationMessage('Carta de Apresentação em Word (.docx) Descarregada!');
      } else {
        const blob = await generateWordDocument(cv);
        triggerDownload(blob, `Curriculo_${sanitizedName}.docx`);
        setWordNotificationMessage('Currículo em Word (.docx) Descarregado!');
      }

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
      {/* Top Bar Navigation Contract with SaaS actions */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportWord={handleExportWord}
        isExportingWord={isExportingWord}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenPricingModal={() => setIsPricingModalOpen(true)}
        onOpenMyResumesModal={() => setIsMyResumesModalOpen(true)}
      />

      {/* Word Export Floating Toast Notification */}
      {wordSuccessNotification && (
        <div className="no-print fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="font-semibold">{wordNotificationMessage}</p>
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
          <div className="px-4 sm:px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-900">
                {activeTab === 'raw' && '0. Importar Informações, Documentos & LinkedIn'}
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
            {activeTab === 'raw' && (
              <RawInputGenerator
                onCVGenerated={(newCV) => {
                  setCv(newCV);
                  setActiveTab('editor');
                }}
                currentJobDescription={jobDescription}
                onUpdateJobDescription={setJobDescription}
                onOpenPreview={() => {
                  setMobileViewMode('preview');
                }}
              />
            )}

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
                letterBody={letterBody}
                setLetterBody={setLetterBody}
                onExportWord={handleExportWord}
                isExportingWord={isExportingWord}
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

      {/* SaaS Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* SaaS Pricing & Subscription Upgrade Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />

      {/* My Saved Resumes Library Modal */}
      <MyResumesModal
        isOpen={isMyResumesModalOpen}
        onClose={() => setIsMyResumesModalOpen(false)}
        currentCV={cv}
        onLoadResume={(loadedCV) => setCv(loadedCV)}
      />
    </div>
  );
}
