import { useState } from 'react';
import { CVData } from './types/cv';
import { GENERIC_DEFAULT_CV, SAMPLE_JOB_OFFERS } from './data/initialCV';
import { Header } from './components/Header';
import { LandingHeroView } from './components/LandingHeroView';
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
import { SaaSAdminDashboard } from './components/SaaSAdminDashboard';
import { TemplateAdvisorModal } from './components/TemplateAdvisorModal';
import { UserProfileModal } from './components/UserProfileModal';
import { UserProfileView } from './components/UserProfileView';
import { PlanGateGuard } from './components/PlanGateGuard';
import { InterviewSimulator } from './components/InterviewSimulator';
import { useAuth } from './context/AuthContext';
import { generateWordDocument, generateCoverLetterDocx, triggerDownload } from './utils/docxExport';
import { getTemplateById } from './data/templateCatalog';
import { FileText, SlidersHorizontal, Check, Home, Edit3, Target, Download, Sparkles, User as UserIcon } from 'lucide-react';

export default function App() {
  const { user, isAuthenticated, isPro, isExecutive, hasActivePlan } = useAuth();
  const [cv, setCv] = useState<CVData>(GENERIC_DEFAULT_CV);
  const [jobDescription, setJobDescription] = useState<string>(
    SAMPLE_JOB_OFFERS[0].description
  );
  const [activeTab, setActiveTab] = useState<'home' | 'raw' | 'editor' | 'ats' | 'ai' | 'cover' | 'python' | 'interview' | 'profile'>(
    'home'
  );
  const [mobileViewMode, setMobileViewMode] = useState<'controls' | 'preview'>('controls');
  const [isExportingWord, setIsExportingWord] = useState<boolean>(false);
  const [wordSuccessNotification, setWordSuccessNotification] = useState<boolean>(false);
  const [wordNotificationMessage, setWordNotificationMessage] = useState<string>(
    'Ficheiro Word (.docx) Descarregado!'
  );

  // Modal states for SaaS
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalPrompt, setAuthModalPrompt] = useState<string | undefined>(undefined);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [isMyResumesModalOpen, setIsMyResumesModalOpen] = useState<boolean>(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState<boolean>(false);
  const [isTemplateAdvisorOpen, setIsTemplateAdvisorOpen] = useState<boolean>(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState<boolean>(false);

  const handleOpenAuth = (prompt?: string) => {
    setAuthModalPrompt(prompt);
    setIsAuthModalOpen(true);
  };

  const [letterBody, setLetterBody] = useState<string>(
    `To: The Executive Search & Selection Committee
Corporate Leadership Team
Subject: Application for Executive Leadership / Strategic Operations Role

Dear Members of the Selection Committee,

It is with strong enthusiasm and professional commitment that I submit my application for this executive position. With progressive experience in driving operational excellence, digital transformation, and strategic P&L management, I bring a proven track record of quantifiable achievements across competitive global markets.

In my recent leadership assignments, I was responsible for architecting enterprise-grade workflows, scaling cross-functional teams, and delivering multi-million dollar operational optimizations. My background combines deep analytical rigor with hands-on expertise in Business Intelligence, automated governance, and strategic stakeholder alignment.

Furthermore, my approach aligns with international corporate governance standards and modern management frameworks, enabling board members and executive stakeholders to make agile, evidence-backed decisions.

Driven by the strategic vision and continuous growth of your organization, I welcome the opportunity to discuss my qualifications and how I can deliver immediate value during a strategic interview.

Sincerely,

${cv.personalDetails.name || 'Seu Nome'}
${cv.personalDetails.title || 'Chief Operating Officer (COO) | Head de Operações'}
${cv.personalDetails.phone || '+55 11 98765-4321'} | ${cv.personalDetails.email || 'contacto@exemplo.com'}`
  );

  const handleExportWord = async () => {
    if (!isAuthenticated) {
      handleOpenAuth('O registo é obrigatório para descarregar o currículo em formato Word (.docx). Registe-se ou inicie sessão para continuar.');
      return;
    }
    try {
      setIsExportingWord(true);
      const sanitizedName = cv.personalDetails.name.trim().replace(/\s+/g, '_') || 'Curriculo_Estrategico';

      if (activeTab === 'cover') {
        const blob = await generateCoverLetterDocx(cv, letterBody, hasActivePlan);
        triggerDownload(blob, `Carta_Apresentacao_${sanitizedName}.docx`);
        setWordNotificationMessage(
          hasActivePlan
            ? 'Carta de Apresentação em Word (.docx) Descarregada!'
            : 'Carta de Apresentação (C/ Marca de Água) Descarregada!'
        );
      } else {
        const templateInfo = getTemplateById(cv.templateStyle);
        const templateTag = templateInfo.shortName.replace(/[^a-zA-Z0-9]/g, '_');
        const blob = await generateWordDocument(cv, hasActivePlan);
        triggerDownload(blob, `Curriculo_${sanitizedName}_${templateTag}.docx`);
        setWordNotificationMessage(
          hasActivePlan
            ? `Currículo Word (${templateInfo.shortName}) Oficial Descarregado!`
            : `Currículo Word (${templateInfo.shortName}) C/ Marca de Demonstração Descarregado!`
        );
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
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 selection:bg-slate-900 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Top Bar Navigation Contract with SaaS actions */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportWord={handleExportWord}
        isExportingWord={isExportingWord}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenPricingModal={() => setIsPricingModalOpen(true)}
        onOpenMyResumesModal={() => setIsMyResumesModalOpen(true)}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
        onOpenTemplateAdvisor={() => setIsTemplateAdvisorOpen(true)}
        onOpenUserProfile={() => setIsUserProfileModalOpen(true)}
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

      {/* View Mode Switching: Home Landing vs User Profile vs Studio Dual-Pane */}
      {activeTab === 'home' ? (
        <main className="flex-1 overflow-y-auto">
          <LandingHeroView
            onStartCreating={() => setActiveTab('raw')}
            onOpenPricing={() => setIsPricingModalOpen(true)}
            onSelectTemplate={(templateId) => {
              setCv((prev) => ({ ...prev, templateStyle: templateId as any }));
              setActiveTab('editor');
            }}
            onOpenTemplateAdvisor={() => setIsTemplateAdvisorOpen(true)}
            currentCV={cv}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        </main>
      ) : activeTab === 'profile' ? (
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <UserProfileView
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenPricing={() => setIsPricingModalOpen(true)}
            onLoadResume={(loadedCV) => {
              setCv(loadedCV);
              setActiveTab('editor');
            }}
            currentCV={cv}
          />
        </main>
      ) : (
        <>
          {/* Mobile Toggle Bar for Studio */}
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
          <main className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-4rem)] pb-14 lg:pb-0">
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
                    {activeTab === 'interview' && '4. Simulador de Entrevista & Scoring STAR com IA'}
                    {activeTab === 'cover' && '5. Carta de Motivação para a Candidatura'}
                    {activeTab === 'python' && '6. Compilação Offline & Automação'}
                  </span>
                </div>

                <span className="text-[11px] text-slate-500 font-mono">
                  {cv.experiences.length} Cargos · {cv.competencies.length} Competências
                </span>
              </div>

              {/* Active Tab Panel View */}
              <div className="p-4 sm:p-6 flex-1">
                {activeTab === 'raw' && (
                  !isAuthenticated ? (
                    <PlanGateGuard
                      requiredTier="authenticated"
                      featureTitle="Criação de CV & Importação de Dados"
                      featureSubtitle="A criação de currículos e extração de dados do LinkedIn ou documentos é restrita a utilizadores assinantes da plataforma."
                      featureBenefits={[
                        'Importação inteligente de LinkedIn, PDF e Word (.docx)',
                        'Estruturação nos padrões internacionais de recrutamento',
                        'Acesso total aos modelos Harvard, Tech e Executivo',
                        'Exportações ilimitadas na nuvem'
                      ]}
                      onOpenAuthModal={() => setIsAuthModalOpen(true)}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
                    />
                  ) : (
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
                  )
                )}

                {activeTab === 'editor' && (
                  !isAuthenticated ? (
                    <PlanGateGuard
                      requiredTier="authenticated"
                      featureTitle="Editor de Currículo Profissional"
                      featureSubtitle="O editor de currículos é exclusivo para assinantes da plataforma. Crie a sua conta e assine o Plano Pro ou Executivo VIP para criar o seu currículo."
                      featureBenefits={[
                        'Editor em tempo real com pré-visualização A4 executiva',
                        'Calibração de seções segundo normas ATS e C-Level',
                        'Múltiplas versões salvas na sua conta',
                        'Exportação em Microsoft Word (.docx) sem restrições'
                      ]}
                      onOpenAuthModal={() => setIsAuthModalOpen(true)}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
                    />
                  ) : (
                    <ContentEditor
                      cv={cv}
                      onChange={setCv}
                      onOpenAiTailor={() => setActiveTab('ai')}
                    />
                  )
                )}

                {activeTab === 'ats' && (
                  !isAuthenticated ? (
                    <PlanGateGuard
                      requiredTier="authenticated"
                      featureTitle="Vaga & Radar ATS Semântico"
                      featureSubtitle="Análise profunda de compatibilidade com sistemas de recrutamento ATS (Workday, Taleo, Greenhouse e SAP SuccessFactors)."
                      featureBenefits={[
                        'Diagnóstico de pontuação ATS com cálculo de densidade',
                        'Mapeamento de palavras-chave críticas da vaga',
                        'Sugestão de termos executivos ausentes no currículo',
                        'Sincronização com os seus currículos salvos'
                      ]}
                      onOpenAuthModal={() => setIsAuthModalOpen(true)}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
                    />
                  ) : !isPro ? (
                    <PlanGateGuard
                      requiredTier="pro"
                      featureTitle="Radar ATS Avançado & Análise Semântica"
                      featureSubtitle="O Radar ATS avançado compara o seu perfil diretamente contra a descrição da vaga com inteligência artificial para garantir que o seu currículo passe pelos filtros robóticos."
                      featureBenefits={[
                        'Cálculo de compatibilidade percentual e densidade de palavras-chave',
                        'Extração inteligente de competências solicitadas pelo recrutador',
                        'Destaque de métricas quantificáveis ausentes',
                        'Otimizações ilimitadas no Plano Profissional Pro'
                      ]}
                      onOpenAuthModal={() => setIsAuthModalOpen(true)}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
                    />
                  ) : (
                    <AtsRadarPanel
                      cv={cv}
                      onChange={setCv}
                      jobDescription={jobDescription}
                      setJobDescription={setJobDescription}
                      onOpenAiTailor={() => setActiveTab('ai')}
                    />
                  )
                )}

                {activeTab === 'ai' && (
                  !isAuthenticated ? (
                    <PlanGateGuard
                      requiredTier="authenticated"
                      featureTitle="Otimizador IA de Conquistas"
                      featureSubtitle="Reescreva as suas experiências utilizando a metodologia Google XYZ e verbos de ação executivos."
                      featureBenefits={[
                        'Geração de realizações e balas orientadas a métricas',
                        'Ajuste de tom formal para padrões corporativos globais',
                        'Remoção automática de chavões e termos fracos',
                        '5 créditos gratuitos de boas-vindas na sua conta'
                      ]}
                      onOpenAuthModal={() => setIsAuthModalOpen(true)}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
                    />
                  ) : !isPro ? (
                    <PlanGateGuard
                      requiredTier="pro"
                      featureTitle="Otimizador IA de Conquistas & Balas Executivas"
                      featureSubtitle="Desbloqueie reescritas de alta precisão calibradas para vagas sênior, com verbos de ação executivos e fórmulas de impacto mensurável."
                      featureBenefits={[
                        'Otimizações ilimitadas de experiências profissionais',
                        'Sugestões automáticas baseadas na descrição da vaga',
                        'Calibração de impacto financeiro (P&L, EBITDA, OPEX)',
                        'Exportação em Word (.docx) sem restrições'
                      ]}
                      onOpenAuthModal={() => setIsAuthModalOpen(true)}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
                    />
                  ) : (
                    <AiTailorPanel
                      cv={cv}
                      onChange={setCv}
                      jobDescription={jobDescription}
                    />
                  )
                )}

                {activeTab === 'interview' && (
                  !isAuthenticated ? (
                    <PlanGateGuard
                      requiredTier="authenticated"
                      featureTitle="Simulador de Entrevista (IA)"
                      featureSubtitle="Simule entrevistas reais com perguntas personalizadas para a vaga e receba notas no padrão STAR."
                      featureBenefits={[
                        '5 perguntas técnicas e comportamentais personalizadas',
                        'Gravação e transcrição de áudio por voz em tempo real',
                        'Avaliação de pontos fortes e respostas recomendadas',
                        'Treino sem estresse antes da entrevista real'
                      ]}
                      onOpenAuthModal={() => setIsAuthModalOpen(true)}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
                    />
                  ) : !isExecutive ? (
                    <PlanGateGuard
                      requiredTier="executive"
                      featureTitle="Simulador de Entrevista STAR com IA & Áudio"
                      featureSubtitle="A sala de simulação de entrevistas com perguntas personalizadas e avaliação STAR é exclusiva dos assinantes Executivo VIP."
                      featureBenefits={[
                        'Geração de 5 perguntas comportamentais e técnicas pela IA',
                        'Ditado por voz com reconhecimento de fala Web Speech',
                        'Scoring STAR com nota de 0 a 100 e resposta modelo',
                        'Treino ilimitado para qualquer descrição de vaga'
                      ]}
                      onOpenAuthModal={() => setIsAuthModalOpen(true)}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
                    />
                  ) : (
                    <InterviewSimulator
                      currentCV={cv}
                      jobDescription={jobDescription}
                      onUpdateJobDescription={setJobDescription}
                      onOpenPricing={() => setIsPricingModalOpen(true)}
                    />
                  )
                )}

                {activeTab === 'cover' && (
                  !isAuthenticated ? (
                    <PlanGateGuard
                      requiredTier="authenticated"
                      featureTitle="Carta de Apresentação Estratégica"
                      featureSubtitle="Crie cartas de motivação executivas sob medida para a empresa e vaga desejada."
                      featureBenefits={[
                        'Estrutura formal para comitês de seleção',
                        'Conexão com os pontos fortes do seu currículo',
                        'Exportação direta em Microsoft Word (.docx)'
                      ]}
                      onOpenAuthModal={() => setIsAuthModalOpen(true)}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
                    />
                  ) : !isPro ? (
                    <PlanGateGuard
                      requiredTier="pro"
                      featureTitle="Carta de Apresentação com Inteligência Artificial"
                      featureSubtitle="Elabore cartas de apresentação persuasivas e personalizadas para cada candidatura, alinhadas à cultura corporativa."
                      featureBenefits={[
                        'Geração ilimitada de cartas estratégicas',
                        'Customização para cargos de liderança e especialistas',
                        'Exportação instantânea em Word (.docx) e PDF'
                      ]}
                      onOpenAuthModal={() => setIsAuthModalOpen(true)}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
                    />
                  ) : (
                    <CoverLetterPanel
                      cv={cv}
                      jobDescription={jobDescription}
                      letterBody={letterBody}
                      setLetterBody={setLetterBody}
                      onExportWord={handleExportWord}
                      isExportingWord={isExportingWord}
                    />
                  )
                )}

                {activeTab === 'python' && (
                  !isAuthenticated ? (
                    <PlanGateGuard
                      requiredTier="authenticated"
                      featureTitle="Compilação Offline Python"
                      featureSubtitle="Exporte scripts Python para renderização e automação local de currículos."
                      featureBenefits={[
                        'Scripts independentes em Python',
                        'Geração de documentos em lote',
                        'Sem dependência de servidores web'
                      ]}
                      onOpenAuthModal={() => setIsAuthModalOpen(true)}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
                    />
                  ) : !isExecutive ? (
                    <PlanGateGuard
                      requiredTier="executive"
                      featureTitle="Compilação Offline & Scripts Python"
                      featureSubtitle="Gere código Python automatizado com Jinja2 e reportlab para compilar os seus documentos 100% offline."
                      featureBenefits={[
                        'Código-fonte Python pronto para execução local',
                        'Independência total de nuvem e privacidade máxima',
                        'Automação de múltiplos formatos para empresas'
                      ]}
                      onOpenAuthModal={() => setIsAuthModalOpen(true)}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
                    />
                  ) : (
                    <PythonScriptPanel cv={cv} />
                  )
                )}
              </div>
            </section>

            {/* Right Side: High-Fidelity A4 Document Canvas */}
            <section
              className={`flex-1 flex flex-col h-full overflow-hidden bg-slate-200/70 ${
                mobileViewMode === 'controls' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {!isAuthenticated && (
                <div className="bg-amber-400 text-slate-950 px-4 py-2.5 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-slate-900" />
                    <span>Visualização de Demonstração (Somente Leitura): Faça login para criar o seu currículo oficial.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="px-3 py-1 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    Aceder à Minha Conta
                  </button>
                </div>
              )}
              <CVDocumentView
                cv={cv}
                onChange={setCv}
                onExportWord={handleExportWord}
                isExportingWord={isExportingWord}
                onOpenAuthModal={(prompt) => handleOpenAuth(prompt)}
                onOpenPricingModal={() => setIsPricingModalOpen(true)}
              />
            </section>
          </main>

          {/* Mobile Bottom Thumb Navigation */}
          <nav className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 flex items-center justify-around shadow-lg">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Início</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('editor');
                setMobileViewMode('controls');
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
                activeTab === 'editor' && mobileViewMode === 'controls'
                  ? 'text-slate-950 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Editor</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('ats');
                setMobileViewMode('controls');
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
                activeTab === 'ats' && mobileViewMode === 'controls'
                  ? 'text-slate-950 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Radar ATS</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileViewMode('preview');
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
                mobileViewMode === 'preview'
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Ver A4</span>
            </button>

            <button
              type="button"
              onClick={handleExportWord}
              disabled={isExportingWord}
              className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-bold text-slate-900 hover:text-slate-950 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-900" />
              <span>{isExportingWord ? 'A Gerar...' : 'Word'}</span>
            </button>
          </nav>
        </>
      )}

      {/* SaaS Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthModalPrompt(undefined);
        }}
        promptMessage={authModalPrompt}
        defaultMode={authModalPrompt ? 'register' : 'login'}
      />

      {/* SaaS Pricing & Subscription Upgrade Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />

      {/* Dedicated User Profile & Subscription Account Area Modal */}
      <UserProfileModal
        isOpen={isUserProfileModalOpen}
        onClose={() => setIsUserProfileModalOpen(false)}
        onOpenPricing={() => setIsPricingModalOpen(true)}
        onOpenMyResumes={() => setIsMyResumesModalOpen(true)}
      />

      {/* My Saved Resumes Library Modal */}
      <MyResumesModal
        isOpen={isMyResumesModalOpen}
        onClose={() => setIsMyResumesModalOpen(false)}
        currentCV={cv}
        onLoadResume={(loadedCV) => setCv(loadedCV)}
      />

      {/* SaaS Admin Backend Portal & Database Management */}
      <SaaSAdminDashboard
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
      />

      {/* Global Template Advisor & Strategic Guide Modal */}
      <TemplateAdvisorModal
        isOpen={isTemplateAdvisorOpen}
        onClose={() => setIsTemplateAdvisorOpen(false)}
        currentTemplateId={cv.templateStyle}
        onSelectTemplate={(newStyle) => setCv((prev) => ({ ...prev, templateStyle: newStyle }))}
        cv={cv}
        onUpdateCV={setCv}
      />
    </div>
  );
}
