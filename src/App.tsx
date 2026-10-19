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
import { generateWordDocument, generateCoverLetterDocx, triggerDownload } from './utils/docxExport';
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
  const [wordNotificationMessage, setWordNotificationMessage] = useState<string>(
    'Ficheiro Word (.docx) Descarregado!'
  );

  const [letterBody, setLetterBody] = useState<string>(
    `A/C: Comité de Seleção e Recrutamento
Expertise France / Delegação da União Europeia em Angola
Luanda, Angola

Assunto: Candidatura ao posto de MEAL & Information Systems Coordinator

Exmos. Senhores Membros do Comité de Seleção,

É com elevado interesse e sentido de compromisso que apresento a minha candidatura à posição de MEAL & Information Systems Coordinator. Com sólida trajetória no desenho, operacionalização e automação de sistemas digitais de Monitoria, Avaliação, Prestação de Contas e Aprendizagem (MEAL), trago a experiência comprovada de atuação direta em programas de grande escala financiados pela União Europeia (como o Programa FRESAN, co-gerido pelo Camões, I.P., FAO e PNUD) e pelo Programa Alimentar Mundial das Nações Unidas (WFP) em Angola.

No âmbito da assistência técnica ao Camões, I.P., fui o responsável direto pela concepção, programação e entrada em produção da Plataforma Digital Colaborativa do Sistema de Gestão de Informação MEAL (disponível em https://sgi-fresancamoes.com/). Liderando a entrega de todos os produtos do Termo de Referência (TdR), estruturei as interfaces pública e privada, automatizei os fluxos de dados de campo das províncias da Huíla, Namibe e Cunene com regras de alerta pré-análise para a equipa M&A da UIC, e garanti a integração de indicadores orientados a resultados segundo os referenciais da OCDE/CAD e as Políticas de Segurança da Informação do Camões, I.P.

Destaco igualmente a minha experiência na estruturação de fluxos de recolha móvel (KoboToolbox, ODK, Survey Solutions e WFP MoDA), auditorias de qualidade de dados (DQA), e concepção de painéis analíticos interativos em Power BI para suporte a decisões estratégicas e reporte a doadores internacionais. Adicionalmente, a minha intervenção em consórcios multiatores consolidou a minha capacidade de diálogo e harmonização metodológica com ministérios setoriais (INE, MINAGRIF) e parceiros de implementação no terreno.

Motivado pela relevância dos vossos objetivos e com plena capacidade de entrega imediata, coloco-me à disposição para aprofundar a demonstração das minhas competências numa entrevista técnica.

Com os meus melhores cumprimentos,

${AGOSTINHO_CV.personalDetails.name}
${AGOSTINHO_CV.personalDetails.title}
${AGOSTINHO_CV.personalDetails.phone} | ${AGOSTINHO_CV.personalDetails.email}`
  );

  const handleExportWord = async () => {
    try {
      setIsExportingWord(true);
      const sanitizedName = cv.personalDetails.name.trim().replace(/\s+/g, '_') || 'Agostinho_do_Rosario';

      if (activeTab === 'cover') {
        const blob = await generateCoverLetterDocx(cv, letterBody);
        triggerDownload(blob, `Carta_Apresentacao_${sanitizedName}.docx`);
        setWordNotificationMessage('Carta de Apresentação em Word (.docx) Descarregada!');
      } else {
        const blob = await generateWordDocument(cv);
        triggerDownload(blob, `CV_${sanitizedName}_MEAL.docx`);
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
    </div>
  );
}
