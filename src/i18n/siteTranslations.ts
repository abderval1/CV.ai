import { BillingCycle } from '../types/cv';

export type SiteLanguageCode = 'pt' | 'en' | 'es' | 'fr' | 'de' | 'it';

export interface SiteLanguageInfo {
  code: SiteLanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export const SITE_LANGUAGES: SiteLanguageInfo[] = [
  { code: 'pt', name: 'Português', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'Inglês', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Espanhol', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Francês', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Alemão', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', nativeName: 'Italiano', flag: '🇮🇹' }
];

export interface SiteDictionary {
  brandName: string;
  billingCycles: Record<BillingCycle, { label: string; shortUnit: string }>;
  header: {
    navHome: string;
    navModelsExamples: string;
    navEditor: string;
    navTools: string;
    navPricing: string;
    showcaseCvHeader: string;
    showcaseModelsCv: string;
    showcaseModelsCvDesc: string;
    showcaseExamplesCv: string;
    showcaseExamplesCvDesc: string;
    showcaseCoverHeader: string;
    showcaseModelsCover: string;
    showcaseModelsCoverDesc: string;
    showcaseExamplesCover: string;
    showcaseExamplesCoverDesc: string;
    toolsDocsHeader: string;
    toolCover: string;
    toolCoverDesc: string;
    toolAdvisor: string;
    toolAdvisorDesc: string;
    toolsAnalysisHeader: string;
    toolRaw: string;
    toolRawDesc: string;
    toolAts: string;
    toolAtsDesc: string;
    toolJobs: string;
    toolJobsDesc: string;
    toolAi: string;
    toolAiDesc: string;
    toolInterview: string;
    toolInterviewDesc: string;
    siteLangLabel: string;
    siteLangHint: string;
    currencyLabel: string;
    notificationsTitle: string;
    markAllRead: string;
    noNotifications: string;
    configureNotifs: string;
    newBadge: string;
    notifSystem: string;
    notifEmailSent: string;
    notifEmailQueued: string;
    myResumes: string;
    myProfile: string;
    subscriptionInvoices: string;
    notifPreferences: string;
    managePlan: string;
    adminPanel: string;
    signOut: string;
    signIn: string;
    downloadCoverShort: string;
    downloadWordShort: string;
    downloadCover: string;
    downloadWord: string;
    exporting: string;
    mobileWorkspace: string;
    mobileShowcaseTitle: string;
    mobileToolsTitle: string;
    mobileMyResumes: string;
    mobileMyAccount: string;
    mobileSignInRegister: string;
  };
  landing: {
    heroKicker: string;
    heroTitle: string;
    heroSubtitle: string;
    ctaBuild: string;
    ctaExploreModels: string;
    ctaMatchJobs: string;
    linkCvModels: string;
    linkRealExamples: string;
    linkCoverModels: string;
    linkPlansStarting: string;
    perMonth: string;
    cardAndPix: string;
    atsCompatPrefix: string;
    editThisModel: string;
    metrics: Array<{ value: string; label: string }>;
    deliverables: Array<{ code: string; text: string }>;
    archKicker: string;
    archTitle: string;
    archDesc: string;
    archSteps: Array<{ num: string; title: string; desc: string }>;
    jobMatch: {
      kicker: string;
      title: string;
      subtitle: string;
      profileLabel: string;
      profiles: Array<{ id: 'coo' | 'tech' | 'finance'; label: string; headline: string; skills: string[] }>;
      workplaceFilters: { all: string; remote: string; hybrid: string };
      regionFilters: { all: string; us_global: string; europe: string };
      matchSuffix: string;
      keywordsMatchedLabel: string;
      tailorCta: string;
      browseJobsCta: string;
      emptyState: string;
      jobs: Array<{
        id: string;
        profile: 'coo' | 'tech' | 'finance';
        title: string;
        company: string;
        workplace: 'remote' | 'hybrid';
        workplaceLabel: string;
        region: 'us_global' | 'europe';
        regionLabel: string;
        contract: string;
        matchScore: number;
        matchedKeywords: string[];
      }>;
    };
    atsHubKicker: string;
    atsHubTitle: string;
    tabHealth: string;
    tabSimulator: string;
    simSelectRole: string;
    simRoles: { coo: string; tech: string; cfo: string };
    simCompatLabel: string;
    simApproved: string;
    simRisk: string;
    simActionVerb: string;
    simPresent: string;
    simMissing: string;
    simMetricLabel: string;
    simQuantified: string;
    simNoNumbers: string;
    simRequiredKeywords: string;
    simOptimizedLabel: string;
    simTestLabel: string;
    simResetExample: string;
    simPlaceholder: string;
    simApplyXyz: string;
    simApplyToCv: string;
    simFixInStudio: string;
    proofContrastKicker: string;
    proofContrastTitle: string;
    proofBeforeBadge: string;
    proofBeforeQuote: string;
    proofAfterBadge: string;
    proofAfterQuote: string;
    proofCasesKicker: string;
    proofCasesTitle: string;
    proofCases: Array<{ role: string; detail: string }>;
    templatesKicker: string;
    templatesTitle: string;
    templatesSubtitle: string;
    filterAll: string;
    filterNoPhoto: string;
    filterWithPhoto: string;
    badgeWithPhoto: string;
    badgeNoPhotoAts: string;
    previewFreePrefix: string;
    useModel: string;
    showLessModels: string;
    viewAllModelsPrefix: string;
    viewAllModelsSuffix: string;
    openTemplateAdvisor: string;
    pricingKicker: string;
    pricingTitle: string;
    pricingSubtitle: string;
    freeTierName: string;
    freeTierTag: string;
    freeTierPriceUnit: string;
    freeTierDesc: string;
    freeTierFeatures: string[];
    freeTierCta: string;
    proDefaultName: string;
    proPopularBadge: string;
    proFeatures: string[];
    proCtaPrefix: string;
    execDefaultName: string;
    execBadge: string;
    execFeatures: string[];
    execCtaPrefix: string;
    equivalentPrefix: string;
    equivalentMonthlyPrefix: string;
    fullAccessForDaysPrefix: string;
    daysSuffix: string;
    includesStarAndCLevel: string;
    roiKicker: string;
    roiTitle: string;
    roiSavings: string;
    roiAgencyTitle: string;
    roiAgencyPrice: string;
    roiAgencyPoints: string[];
    roiPlatformTitle: string;
    roiPlatformPricePrefix: string;
    roiPlatformPoints: string[];
    trustNoLockIn: string;
    trustEditableDocx: string;
    trustCardPix: string;
    trustStartNow: string;
    matrixTitle: string;
    matrixSubtitle: string;
    matrixCapabilityCol: string;
    matrixFreeCol: string;
    matrixProCol: string;
    matrixExecCol: string;
    matrixRows: Array<{ feature: string; free: boolean; pro: boolean; exec: boolean }>;
    faqTitle: string;
    faqRightNote: string;
    faqs: Array<{ q: string; a: string }>;
    closingKicker: string;
    closingTitle: string;
    closingSubtitle: string;
    closingCtaBuild: string;
    closingCtaExamples: string;
    footerRights: string;
  };
  health: {
    subtitle: string;
    myResumeBtn: string;
    benchmarkBtn: string;
    globalAtsIndex: string;
    gradePrefix: string;
    tierApprovedLabel: string;
    tierApprovedDesc: string;
    tierCompetitiveLabel: string;
    tierCompetitiveDesc: string;
    tierWarningLabel: string;
    tierWarningDesc: string;
    tierCriticalLabel: string;
    tierCriticalDesc: string;
    optimizedSuffix: string;
    adjustSuffix: string;
    missingSuffix: string;
    openInEditor: string;
    fixInEditor: string;
  };
  showcase: {
    modes: Record<
      'models-cv' | 'examples-cv' | 'models-cover' | 'examples-cover',
      { tabLabel: string; kicker: string; title: string; subtitle: string }
    >;
    searchPlaceholder: string;
    allSectors: string;
    allModels: string;
    noPhotoAts: string;
    withPhotoEu: string;
    previewFreeBadge: string;
    inspectBtn: string;
    useBtn: string;
    unlockAccessBtn: string;
    emptyState: string;
    clearFilters: string;
  };
  auth: {
    kicker: string;
    loginTitle: string;
    registerTitle: string;
    forgotTitle: string;
    loginSubtitle: string;
    registerSubtitle: string;
    forgotSubtitle: string;
    tabLogin: string;
    tabRegister: string;
    googleBtn: string;
    googleLoading: string;
    dividerOr: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    targetRoleLabel: string;
    targetRolePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    rememberMe: string;
    forgotPasswordLink: string;
    termsPrefix: string;
    termsService: string;
    termsAnd: string;
    termsPrivacy: string;
    termsSuffix: string;
    submitLogin: string;
    submitRegister: string;
    submitForgot: string;
    submitResetConfirm: string;
    processing: string;
    backToLogin: string;
    registerReassurance: string;
    loginReassurance: string;
  };
  gate: {
    yourPlan: string;
    visitor: string;
    free: string;
    whatsIncluded: string;
    signInOrCreate: string;
    seePlans: string;
    activatePrefix: string;
    trustFooter: string;
  };
  pricing: {
    modalTitle: string;
    modalSubtitle: string;
    subscriberBannerTitle: string;
    subscriberBannerBadge: string;
    currencyLabel: string;
    currentPlanBtn: string;
    selectedPlanBtn: string;
    summaryTitle: string;
    summarySubtitle: string;
    quickAuthTitle: string;
    quickAuthSubtitle: string;
    quickAuthCreate: string;
    quickAuthSignIn: string;
    couponLabel: string;
    couponPlaceholder: string;
    couponApply: string;
    couponApplying: string;
    couponRemove: string;
    activePromosLabel: string;
    selectPaymentLabel: string;
    cardMethodTitle: string;
    cardMethodDesc: string;
    pixMethodTitle: string;
    payCardBtnPrefix: string;
    payCheckoutBtnPrefix: string;
    payPixBtnPrefix: string;
    payFreeCouponBtn: string;
    processing: string;
    noLockInNote: string;
    guaranteedAccessPrefix: string;
  };
  app: {
    previewGuestNotice: string;
    previewFreeNotice: string;
    createAccountBtn: string;
    activateProBtn: string;
    mobileEditorTab: string;
    mobileViewA4Cv: string;
    mobileViewA4Cover: string;
    studioTabCv: string;
    studioTabCover: string;
    studioTabAts: string;
    studioTabJobs: string;
    studioTabAi: string;
    studioTabImport: string;
    bottomHome: string;
    bottomEditor: string;
    bottomCover: string;
    bottomViewA4: string;
  };
}

export const SITE_DICTIONARIES: Record<SiteLanguageCode, SiteDictionary> = {
  pt: {
    brandName: 'Resume2Job',
    billingCycles: {
      monthly: { label: 'Mensal', shortUnit: 'mês' },
      quarterly: { label: 'Trimestral', shortUnit: 'trimestre' },
      semiannual: { label: 'Semestral', shortUnit: 'semestre' },
      yearly: { label: 'Anual', shortUnit: 'ano' }
    },
    header: {
      navHome: 'Início',
      navModelsExamples: 'Modelos & Exemplos',
      navEditor: 'Editor de CV',
      navTools: 'Ferramentas',
      navPricing: 'Planos',
      showcaseCvHeader: 'Currículos (Visualização Livre)',
      showcaseModelsCv: 'Modelos de CV',
      showcaseModelsCvDesc: '40+ layouts A4 ATS, Harvard, Finanças, Produto e Europass',
      showcaseExamplesCv: 'Exemplos de CV',
      showcaseExamplesCvDesc: 'Currículos preenchidos por profissão e setor',
      showcaseCoverHeader: 'Cartas de Apresentação',
      showcaseModelsCover: 'Modelos de Carta de Apresentação',
      showcaseModelsCoverDesc: 'Designs formais e modernos em folha A4',
      showcaseExamplesCover: 'Exemplos de Carta de Apresentação',
      showcaseExamplesCoverDesc: 'Cartas prontas por cargo, estágio ou transição',
      toolsDocsHeader: 'Documentos & Formatos',
      toolCover: 'Carta de Apresentação',
      toolCoverDesc: 'Editor A4 + geração e tradução em 5 idiomas',
      toolAdvisor: 'Modelos Internacionais',
      toolAdvisorDesc: 'Harvard, ATS Estrito, Wall Street, Europass & Tech',
      toolsAnalysisHeader: 'Melhorar e Candidatar',
      toolRaw: 'Importar Dados & LinkedIn',
      toolRawDesc: 'Crie a partir de PDF, Word, LinkedIn ou texto',
      toolAts: 'Verificador de Currículo',
      toolAtsDesc: 'Veja se faltam palavras importantes da vaga',
      toolJobs: 'Vagas Compatíveis',
      toolJobsDesc: 'Vagas alinhadas ao seu currículo com link direto',
      toolAi: 'Adaptar à Vaga com IA',
      toolAiDesc: 'Melhore as suas frases com foco em resultados',
      toolInterview: 'Treino de Entrevista',
      toolInterviewDesc: 'Pratique perguntas prováveis e veja exemplos',
      siteLangLabel: 'Idioma do Site',
      siteLangHint: 'Interface do site (não altera o idioma do CV)',
      currencyLabel: 'Moeda de Preços',
      notificationsTitle: 'Notificações do Sistema',
      markAllRead: 'Marcar lidas',
      noNotifications:
        'Sem notificações recentes. Traduções, exportações e atualizações dos seus currículos aparecerão aqui.',
      configureNotifs: 'Configurar Preferências de Notificações',
      newBadge: 'Nova',
      notifSystem: 'Sistema',
      notifEmailSent: 'E-mail Enviado',
      notifEmailQueued: 'E-mail Registado',
      myResumes: 'Os Meus Currículos',
      myProfile: 'Meu Perfil & Acesso',
      subscriptionInvoices: 'Assinatura & Faturas',
      notifPreferences: 'Preferências & Notificações',
      managePlan: 'Gerir Plano',
      adminPanel: 'Painel Administrativo',
      signOut: 'Terminar Sessão',
      signIn: 'Entrar',
      downloadCoverShort: 'Carta',
      downloadWordShort: 'Baixar CV',
      downloadCover: 'Baixar Carta',
      downloadWord: 'Baixar CV',
      exporting: 'A Gerar...',
      mobileWorkspace: 'Área de Trabalho',
      mobileShowcaseTitle: 'Modelos & Exemplos (Visualização Livre)',
      mobileToolsTitle: 'Ferramentas & Análise',
      mobileMyResumes: 'Meus CVs',
      mobileMyAccount: 'Minha Conta',
      mobileSignInRegister: 'Entrar / Registar'
    },
    landing: {
      heroKicker: 'Estúdio Executivo · Padrão ATS · Word & PDF',
      heroTitle: 'Crie um currículo impecável do zero ou melhore o seu CV existente para conquistar entrevistas e salários melhores.',
      heroSubtitle:
        'O método definitivo aprovado por recrutadores globais. Passe nos filtros ATS, organize o seu histórico com impacto mensurável e exporte em Word (.docx) ou PDF em segundos.',
      ctaBuild: 'Criar ou Melhorar CV Agora',
      ctaExploreModels: 'Explorar 40+ Modelos',
      ctaMatchJobs: 'Filtrar Vagas pelo CV',
      linkCvModels: 'Modelos de CV',
      linkRealExamples: 'Exemplos Reais',
      linkCoverModels: 'Modelos de Carta',
      linkPlansStarting: 'Planos a partir de',
      perMonth: '/mês',
      cardAndPix: 'Cartão & Pix',
      atsCompatPrefix: 'Compatibilidade',
      editThisModel: 'Editar este modelo',
      metrics: [
        { value: '98.7%', label: 'Leitura limpa em parsers ATS' },
        { value: '40+ Modelos', label: 'ATS, Moderno, Harvard, Tech & EU' },
        { value: 'Match Ao Vivo', label: 'Vagas filtradas direto do seu perfil' },
        { value: '5 Idiomas', label: 'EN · PT · ES · FR · DE em 1 clique' }
      ],
      deliverables: [
        { code: 'CV A4', text: '40+ modelos ATS & Executivos em escala real' },
        { code: 'MATCH', text: 'Vagas filtradas por perfil, país e remoto/híbrido' },
        { code: 'ADAPTAR', text: 'Ajuste o CV à vaga selecionada em 1 clique' },
        { code: '5x IDIOMA', text: 'Tradução integral sem perder layout' },
        { code: 'WORD 1:1', text: 'Download editável (.docx) e PDF sem marca' }
      ],
      archKicker: 'Ciclo Completo de Candidatura',
      archTitle: 'Do currículo à candidatura direcionada em quatro passos',
      archDesc:
        'Unimos criação de currículo calibrado para ATS, radar de oportunidades compatíveis com o seu perfil e ferramentas avançadas para destacar o seu potencial.',
      archSteps: [
        {
          num: '01',
          title: 'Crie ou Melhore o seu CV',
          desc: 'Escolha entre mais de 40 layouts internacionais ou importe o seu currículo atual para otimização imediata.'
        },
        {
          num: '02',
          title: 'Radar de Oportunidades',
          desc: 'Encontre vagas alinhadas com o seu cargo, senioridade e competências com análise de aderência.'
        },
        {
          num: '03',
          title: 'Refine & Otimize',
          desc: 'Aplique a Fórmula Google XYZ para transformar tarefas em conquistas quantificáveis de alto impacto.'
        },
        {
          num: '04',
          title: 'Exporte & Candidate-se',
          desc: 'Baixe em Word (.docx) editável e PDF de alta resolução pronto para enviar aos recrutadores.'
        }
      ],
      jobMatch: {
        kicker: 'Descoberta & Filtro Inteligente de Vagas',
        title: 'O seu CV encontra e filtra as vagas certas para o seu perfil',
        subtitle:
          'Selecione um perfil de currículo e experimente os filtros por regime e região: veja como extraímos palavras-chave do seu CV, calculamos aderência real e preparamos a candidatura.',
        profileLabel: 'Perfil ativo do CV:',
        profiles: [
          {
            id: 'coo',
            label: 'COO & Operações Globais',
            headline: 'Alexander Mendes · 12+ anos · P&L $35M+ · Transformação Digital & M&A',
            skills: ['P&L Governance', 'EBITDA', 'ERP Integration', 'OKRs', 'Lean Six Sigma']
          },
          {
            id: 'tech',
            label: 'Staff Cloud Architect',
            headline: 'Lead Software Architect · 8+ anos · AWS/GCP · Kubernetes & FinTech',
            skills: ['Kubernetes', 'TypeScript', 'gRPC', 'Terraform', 'DevSecOps']
          },
          {
            id: 'finance',
            label: 'VP Finanças & M&A',
            headline: 'Beatriz Fonseca · CFA · €140M M&A · IFRS / US GAAP & Tesouraria',
            skills: ['DCF Valuation', 'IFRS / US GAAP', 'M&A', 'FP&A', 'Treasury']
          }
        ],
        workplaceFilters: { all: 'Todos os Regimes', remote: 'Remoto', hybrid: 'Híbrido' },
        regionFilters: { all: 'Todas as Regiões', us_global: 'EUA & Global', europe: 'Europa' },
        matchSuffix: 'compatível',
        keywordsMatchedLabel: 'Competências do CV reconhecidas:',
        tailorCta: 'Adaptar CV para esta Vaga',
        browseJobsCta: 'Abrir Radar de Vagas & Aplicar',
        emptyState: 'Nenhuma vaga nesta combinação de filtros — experimente selecionar Todos.',
        jobs: [
          {
            id: 'jm-coo-1',
            profile: 'coo',
            title: 'VP of Global Operations & Strategy',
            company: 'Horizon Enterprise Cloud',
            workplace: 'hybrid',
            workplaceLabel: 'Híbrido',
            region: 'us_global',
            regionLabel: 'Nova Iorque / Global',
            contract: 'Tempo Integral',
            matchScore: 96,
            matchedKeywords: ['P&L Governance', 'OKRs', 'ERP Integration']
          },
          {
            id: 'jm-coo-2',
            profile: 'coo',
            title: 'Chief Operating Officer (EMEA)',
            company: 'Atlas Logistics & Automation',
            workplace: 'remote',
            workplaceLabel: 'Remoto',
            region: 'europe',
            regionLabel: 'Lisboa / União Europeia',
            contract: 'Contrato Executivo',
            matchScore: 93,
            matchedKeywords: ['EBITDA', 'Lean Six Sigma', 'P&L Governance']
          },
          {
            id: 'jm-tech-1',
            profile: 'tech',
            title: 'Principal Distributed Systems Architect',
            company: 'Northstar Payments Corp',
            workplace: 'remote',
            workplaceLabel: 'Remoto Global',
            region: 'us_global',
            regionLabel: 'EUA / Remoto Internacional',
            contract: 'Tempo Integral',
            matchScore: 97,
            matchedKeywords: ['Kubernetes', 'gRPC', 'DevSecOps']
          },
          {
            id: 'jm-tech-2',
            profile: 'tech',
            title: 'Head of Platform Engineering (Cloud)',
            company: 'EuroFin Core Systems',
            workplace: 'hybrid',
            workplaceLabel: 'Híbrido',
            region: 'europe',
            regionLabel: 'Berlim / Zurique',
            contract: 'Tempo Integral',
            matchScore: 91,
            matchedKeywords: ['Terraform', 'TypeScript', 'Kubernetes']
          },
          {
            id: 'jm-fin-1',
            profile: 'finance',
            title: 'VP Corporate Development & M&A',
            company: 'Vanguard Capital Partners',
            workplace: 'hybrid',
            workplaceLabel: 'Híbrido',
            region: 'us_global',
            regionLabel: 'Nova Iorque / Londres',
            contract: 'Tempo Integral',
            matchScore: 95,
            matchedKeywords: ['DCF Valuation', 'M&A', 'IFRS / US GAAP']
          },
          {
            id: 'jm-fin-2',
            profile: 'finance',
            title: 'Director of FP&A & Treasury',
            company: 'Iberia Industrial Group',
            workplace: 'remote',
            workplaceLabel: 'Remoto',
            region: 'europe',
            regionLabel: 'Madrid / Lisboa',
            contract: 'Tempo Integral',
            matchScore: 92,
            matchedKeywords: ['FP&A', 'Treasury', 'IFRS / US GAAP']
          }
        ]
      },
      atsHubKicker: 'Auditoria & Diagnóstico ATS',
      atsHubTitle: 'Auditoria & Simulador em Tempo Real',
      tabHealth: 'Diagnóstico do Currículo',
      tabSimulator: 'Simular Vaga ATS',
      simSelectRole: 'Selecione uma vaga de referência:',
      simRoles: {
        coo: 'Diretor de Operações (COO)',
        tech: 'Staff Cloud Architect',
        cfo: 'VP Finanças & M&A'
      },
      simCompatLabel: 'Compatibilidade ATS',
      simApproved: 'Perfil aprovado na triagem automática',
      simRisk: 'Risco de descarte por ausência de termos e métricas',
      simActionVerb: 'Verbo de Ação',
      simPresent: 'Presente',
      simMissing: 'Ausente',
      simMetricLabel: 'Métrica (%/€/$/N)',
      simQuantified: 'Quantificada',
      simNoNumbers: 'Sem números',
      simRequiredKeywords: 'Palavras-chave exigidas para',
      simOptimizedLabel: 'Trecho Otimizado (Fórmula Google XYZ):',
      simTestLabel: 'Teste aqui a sua descrição atual ou edite o exemplo abaixo:',
      simResetExample: 'Repor exemplo',
      simPlaceholder: 'Cole aqui um parágrafo ou realização do seu currículo atual para medir o score ATS...',
      simApplyXyz: 'Aplicar Fórmula Google XYZ (Simular 98%)',
      simApplyToCv: 'Aplicar no Meu Currículo',
      simFixInStudio: 'Corrigir o Meu CV no Estúdio',
      proofContrastKicker: 'Comparação Direta',
      proofContrastTitle: 'De descrição passiva a argumento de entrevista',
      proofBeforeBadge: 'Antes · Triagem 38% ATS',
      proofBeforeQuote:
        '“Responsável pelo atendimento corporativo, gestão da equipa comercial e acompanhamento de metas mensais da filial.”',
      proofAfterBadge: 'Depois (Fórmula Google XYZ) · 96% ATS',
      proofAfterQuote:
        '“Liderou equipa comercial de 18 consultores B2B, expandindo o pipeline anual em $4.2M (+34% YoY) com SLA de resposta abaixo de 2h.”',
      proofCasesKicker: 'Candidaturas em Produção',
      proofCasesTitle: 'Resultados reportados por assinantes em processos seletivos',
      proofCases: [
        {
          role: 'M. Oliveira · Diretor de Operações (Setor Logístico · Lisboa / Madrid)',
          detail:
            'Substituiu um CV de 4 páginas pelo formato Harvard ATS em inglês e espanhol; avançou para 4 painéis finais em 19 dias.'
        },
        {
          role: 'R. Tavares · Arquiteto Cloud Sênior (Fintech · São Paulo / Remoto EUA)',
          detail:
            'Ajustou 11 competências técnicas com o Radar ATS para vagas Workday; passou de 44% para 96% de aderência semântica.'
        },
        {
          role: 'C. Ferreira · Gestora Financeira (Indústria · Porto / Zurique)',
          detail:
            'Emitiu CV Europass e carta executiva bilíngue PT/DE com exportação direta em .docx mantendo formatação integral.'
        }
      ],
      templatesKicker: 'Padrões Internacionais',
      templatesTitle: 'Modelos Estruturados para Cada Mercado',
      templatesSubtitle:
        'Cada layout no site e no documento Word (.docx) segue os critérios exatos dos mercados dos EUA, Europa e posições executivas.',
      filterAll: 'Todos',
      filterNoPhoto: 'Sem Foto · ATS',
      filterWithPhoto: 'Com Foto · Europa',
      badgeWithPhoto: 'Com Foto',
      badgeNoPhotoAts: 'Sem Foto · ATS',
      previewFreePrefix: 'Visualizar grátis',
      useModel: 'Usar modelo',
      showLessModels: 'Mostrar menos modelos',
      viewAllModelsPrefix: 'Ver todos os',
      viewAllModelsSuffix: 'modelos disponíveis',
      openTemplateAdvisor: 'Abrir Consultor de Modelos',
      pricingKicker: 'Preços Transparentes',
      pricingTitle: 'Escolha o plano ideal para a sua candidatura',
      pricingSubtitle:
        'Acesso completo à edição, tradução em 5 idiomas e exportação nativa Word/PDF. Pagamento via Cartão Internacional ou Pix em Reais.',
      freeTierName: 'Gratuito',
      freeTierTag: 'Exploração',
      freeTierPriceUnit: '/ sempre',
      freeTierDesc: 'Pré-visualização A4 dos modelos e diagnóstico inicial antes de subscrever.',
      freeTierFeatures: [
        'Galeria completa de modelos CV & Carta',
        'Leitura do Diagnóstico de Saúde do CV',
        'Consultor de escolha por país e área'
      ],
      freeTierCta: 'Explorar Modelos Grátis',
      proDefaultName: 'Profissional Pro',
      proPopularBadge: 'Mais Escolhido',
      proFeatures: [
        'Currículos, versões e salvamento ilimitado na nuvem',
        "Exportação 1:1 em Word (.docx) e PDF A4 sem marca d'água",
        'Tradução integral do CV e Carta para 5 idiomas',
        'Radar ATS & Otimizador de Impacto (XYZ)'
      ],
      proCtaPrefix: 'Subscrever',
      execDefaultName: 'Executivo VIP',
      execBadge: 'C-Level & Global',
      execFeatures: [
        'Tudo incluído no Profissional Pro',
        'Modelos Executivos C-Level, Harvard & Diplomático ONU',
        'Simulador de Entrevista por voz/texto com notas STAR',
        'Auditoria LinkedIn & suporte prioritário'
      ],
      execCtaPrefix: 'Subscrever',
      equivalentPrefix: 'Equivalente:',
      equivalentMonthlyPrefix: 'Equivalente a',
      fullAccessForDaysPrefix: 'Acesso completo por',
      daysSuffix: 'dias',
      includesStarAndCLevel: 'Inclui Simulador STAR e Modelos C-Level',
      roiKicker: 'Retorno Sobre o Investimento',
      roiTitle: 'Consultoria Tradicional vs. Resume2Job',
      roiSavings: 'Economize até 95% frente a agências de recolocação',
      roiAgencyTitle: 'Consultoria / Freelancer Tradicional',
      roiAgencyPrice: '$150 – $400 / entrega',
      roiAgencyPoints: [
        '• Prazo médio de 5 a 10 dias úteis por versão',
        '• Cobrança adicional para adaptar o CV a novas vagas',
        '• Tradução para inglês ou outro idioma cobrada à parte (+$80)',
        '• Sem pontuação ATS ao vivo nem simulador de entrevista'
      ],
      roiPlatformTitle: 'Resume2Job (Pro & VIP)',
      roiPlatformPricePrefix: 'A partir de',
      roiPlatformPoints: [
        '• Criação e exportação em Word (.docx) e PDF em menos de 5 min',
        '• Versões ilimitadas adaptadas para cada vaga na nuvem',
        '• Tradução integral em 5 idiomas + Carta de Apresentação incluídas',
        '• Radar ATS, Fórmula Google XYZ e Vagas compatíveis ao vivo'
      ],
      trustNoLockIn: 'Sem fidelização: cancele em 1 clique',
      trustEditableDocx: 'Ficheiros Word (.docx) 100% editáveis após o download',
      trustCardPix: 'Cartão Internacional (PCI-DSS) ou Pix (BRL)',
      trustStartNow: 'Começar agora',
      matrixTitle: 'Comparativo Detalhado de Recursos',
      matrixSubtitle: 'Todos os planos sem fidelização',
      matrixCapabilityCol: 'Capacidade',
      matrixFreeCol: 'Gratuito',
      matrixProCol: 'Profissional Pro',
      matrixExecCol: 'Executivo VIP',
      matrixRows: [
        { feature: 'Pré-visualização A4 ao vivo dos modelos', free: true, pro: true, exec: true },
        { feature: 'Importação estruturada de LinkedIn, PDF e Word', free: false, pro: true, exec: true },
        { feature: 'Exportação nativa Word (.docx) e PDF A4 limpo', free: false, pro: true, exec: true },
        { feature: 'Tradução integral CV + Carta (PT, EN, ES, FR, DE)', free: false, pro: true, exec: true },
        { feature: 'Radar ATS Semântico & Otimizador Google XYZ', free: false, pro: true, exec: true },
        { feature: 'Modelos Harvard Executivo, C-Level & Diplomático ONU', free: false, pro: false, exec: true },
        { feature: 'Simulador de Entrevista por voz/texto com notas STAR', free: false, pro: false, exec: true }
      ],
      faqTitle: 'Perguntas Frequentes',
      faqRightNote: 'Pagamentos seguros via Cartão & Pix',
      faqs: [
        {
          q: 'Como funciona o pagamento via Cartão e Pix?',
          a: 'Aceitamos cartões de crédito e débito internacionais com renovação transparente, além de Pix em Reais (BRL) com QR Code e chave oficial para conferência bancária.'
        },
        {
          q: 'O currículo passa mesmo pelos robôs ATS (Workday, Taleo, Greenhouse)?',
          a: 'Sim. Os nossos modelos estritos (como Harvard Executivo e ATS Estrito) seguem leitura linear em coluna única sem caixas flutuantes que corrompem o OCR, e o Radar ATS valida as palavras-chave exatas da vaga.'
        },
        {
          q: 'O ficheiro Word (.docx) baixado mantém a formatação exata do site?',
          a: 'Sim. Utilizamos compilação nativa OpenXML (.docx) que preserva as mesmas margens A4, fontes, espaçamentos, secções visíveis e paleta de cores do preview — tanto para o CV como para a Carta de Apresentação.'
        },
        {
          q: 'A tradução traduz também o conteúdo que eu escrevi?',
          a: 'Sim. Ao trocar o idioma do documento entre Português, Inglês, Espanhol, Francês e Alemão dentro do estúdio, a plataforma traduz os títulos e o texto completo das suas experiências mantendo siglas técnicas.'
        },
        {
          q: 'Posso cancelar ou mudar de plano quando quiser?',
          a: 'Sim, diretamente na sua Área do Utilizador, sem multas ou período de fidelização.'
        }
      ],
      closingKicker: 'Pronto em Menos de 5 Minutos',
      closingTitle: 'Envie a sua próxima candidatura com layout A4 e score ATS acima de 95%',
      closingSubtitle:
        'Importe o seu PDF ou LinkedIn atual, otimize as conquistas e descarregue o pacote completo em Word (.docx) e PDF.',
      closingCtaBuild: 'Construir Meu Currículo',
      closingCtaExamples: 'Ver Exemplos Reais',
      footerRights: 'Todos os direitos reservados.'
    },
    health: {
      subtitle: 'Auditoria instantânea dos 6 critérios exigidos por Workday, Taleo, Greenhouse e Lever.',
      myResumeBtn: 'Meu Currículo',
      benchmarkBtn: 'Referência 98%',
      globalAtsIndex: 'Índice ATS Global',
      gradePrefix: 'Grau',
      tierApprovedLabel: 'Aprovado para ATS & Entrevistas',
      tierApprovedDesc: 'Estrutura compatível com Workday, Greenhouse, Taleo e triagem executiva.',
      tierCompetitiveLabel: 'Competitivo · Ajustes pontuais',
      tierCompetitiveDesc: 'Boa base; reforce palavras-chave e resultados numéricos para chegar a 90%+.',
      tierWarningLabel: 'Atenção · Lacunas estruturais',
      tierWarningDesc: 'Risco moderado de filtragem automática antes da leitura humana.',
      tierCriticalLabel: 'Crítico · Campos essenciais vazios',
      tierCriticalDesc: 'Complete o perfil, experiências e competências para passar pelos filtros ATS.',
      optimizedSuffix: 'otimizadas',
      adjustSuffix: 'ajustar',
      missingSuffix: 'ausentes',
      openInEditor: 'Abrir no Editor de Currículo',
      fixInEditor: 'Corrigir Secções no Editor'
    },
    showcase: {
      modes: {
        'models-cv': {
          tabLabel: 'Modelos de CV',
          kicker: 'Galeria Visual de Modelos de CV',
          title: 'Modelos de Currículo Profissionais',
          subtitle:
            'Visualize todos os layouts em tamanho real antes de criar a sua conta. Escolha um modelo calibrado para ATS ou mercado europeu e comece a editar.'
        },
        'examples-cv': {
          tabLabel: 'Exemplos de CV',
          kicker: 'Exemplos Reais por Profissão',
          title: 'Exemplos de Currículo Preenchidos',
          subtitle:
            'Inspire-se em currículos reais estruturados com métricas de impacto. Clique em "Usar exemplo" para carregar a estrutura e adaptar aos seus dados.'
        },
        'models-cover': {
          tabLabel: 'Modelos de Carta',
          kicker: 'Galeria Visual de Cartas de Apresentação',
          title: 'Modelos de Carta de Apresentação',
          subtitle:
            'Cartas em escala A4 compatíveis com os seus modelos de currículo. Visualize todas as estruturas gratuitas antes de subscrever.'
        },
        'examples-cover': {
          tabLabel: 'Exemplos de Carta',
          kicker: 'Exemplos Prontos de Carta',
          title: 'Exemplos de Carta de Apresentação',
          subtitle:
            'Textos persuasivos por setor e senioridade para candidatura direta, LinkedIn ou recrutamento internacional.'
        }
      },
      searchPlaceholder: 'Pesquisar por cargo, modelo ou mercado...',
      allSectors: 'Todas as Áreas',
      allModels: 'Todos',
      noPhotoAts: 'Sem Foto · ATS',
      withPhotoEu: 'Com Foto · Europa',
      previewFreeBadge: 'Visualização Gratuita',
      inspectBtn: 'Visualizar',
      useBtn: 'Usar no Estúdio',
      unlockAccessBtn: 'Desbloquear Acesso',
      emptyState: 'Nenhum item encontrado com os filtros selecionados.',
      clearFilters: 'Limpar filtros'
    },
    auth: {
      kicker: 'Acesso à Conta',
      loginTitle: 'Entrar na Plataforma',
      registerTitle: 'Criar Conta de Assinante',
      forgotTitle: 'Recuperar Palavra-passe',
      loginSubtitle: 'Aceda aos seus currículos, simulação de entrevistas e relatórios ATS.',
      registerSubtitle: 'Registe-se para guardar currículos na nuvem e desbloquear recursos executivos.',
      forgotSubtitle: 'Recupere o acesso à sua conta de forma rápida e segura.',
      tabLogin: 'Iniciar Sessão',
      tabRegister: 'Criar Nova Conta',
      googleBtn: 'Continuar com a Conta Google',
      googleLoading: 'A ligar à Conta Google...',
      dividerOr: 'ou com e-mail e palavra-passe',
      fullNameLabel: 'Nome Completo',
      fullNamePlaceholder: 'Ex: João da Silva Santos',
      targetRoleLabel: 'Cargo Desejado / Área de Atuação',
      targetRolePlaceholder: 'Ex: Diretor de Operações, Tech Lead',
      emailLabel: 'Endereço de E-mail',
      emailPlaceholder: 'nome@empresa.com',
      passwordLabel: 'Palavra-passe',
      passwordPlaceholder: 'Mínimo de 6 caracteres',
      confirmPasswordLabel: 'Confirmar Palavra-passe',
      confirmPasswordPlaceholder: 'Repita a palavra-passe',
      rememberMe: 'Manter sessão iniciada',
      forgotPasswordLink: 'Esqueceu a senha?',
      termsPrefix: 'Concordo com os',
      termsService: 'Termos de Serviço',
      termsAnd: 'e',
      termsPrivacy: 'Política de Privacidade',
      termsSuffix: 'em conformidade com a LGPD e GDPR.',
      submitLogin: 'Entrar na Plataforma',
      submitRegister: 'Criar Conta & Entrar',
      submitForgot: 'Solicitar Recuperação de Acesso',
      submitResetConfirm: 'Confirmar Nova Palavra-passe',
      processing: 'A processar...',
      backToLogin: 'Voltar ao Início de Sessão',
      registerReassurance: 'Sincronização em nuvem · Modelos Harvard, ATS e Europass · Cartão ou Pix sem fidelidade.',
      loginReassurance: 'Sessão encriptada com guarda automática dos seus currículos e versões.'
    },
    gate: {
      yourPlan: 'Seu Plano',
      visitor: 'Visitante',
      free: 'Gratuito',
      whatsIncluded: 'O que este recurso inclui:',
      signInOrCreate: 'Entrar / Criar Conta',
      seePlans: 'Ver Planos',
      activatePrefix: 'Ativar',
      trustFooter: 'Ativação imediata via Cartão ou Pix · Exportação ilimitada em Word (.docx) e PDF · Cancele quando quiser'
    },
    pricing: {
      modalTitle: 'Planos & Ativação de Assinatura',
      modalSubtitle: 'Exportação Word (.docx), Radar ATS e tradução em 5 idiomas via Cartão ou Pix sem fidelidade.',
      subscriberBannerTitle: 'Recurso Exclusivo para Assinantes',
      subscriberBannerBadge: 'Requer Plano Ativo',
      currencyLabel: 'Moeda:',
      currentPlanBtn: 'Plano Atual',
      selectedPlanBtn: 'Plano Selecionado',
      summaryTitle: 'Resumo & Pagamento',
      summarySubtitle: 'Ativação imediata no Cartão (Stripe PCI-DSS) ou via Pix em Reais com QR Code. Cancele quando quiser.',
      quickAuthTitle: 'Passo Rápido: Identifique a sua Conta',
      quickAuthSubtitle: 'Crie a sua conta gratuita em segundos para vincular a subscrição, guardar currículos na nuvem e baixar em Word (.docx).',
      quickAuthCreate: 'Criar Conta',
      quickAuthSignIn: 'Entrar',
      couponLabel: 'Tem um Cupom de Desconto?',
      couponPlaceholder: 'Insira o código do cupom',
      couponApply: 'Aplicar Cupom',
      couponApplying: 'A validar...',
      couponRemove: 'Remover',
      activePromosLabel: 'Promoções ativas:',
      selectPaymentLabel: 'Selecione o Método de Pagamento:',
      cardMethodTitle: 'Cartão de Crédito / Débito',
      cardMethodDesc: 'Visa, Mastercard, Apple Pay & Google Pay',
      pixMethodTitle: 'Pix (BRL)',
      payCardBtnPrefix: 'Pagar com Cartão',
      payCheckoutBtnPrefix: 'Continuar para Pagamento',
      payPixBtnPrefix: 'Enviar Comprovante Pix',
      payFreeCouponBtn: 'Ativar Plano Gratuitamente (Cupom 100%)',
      processing: 'A processar pagamento...',
      noLockInNote: 'Cobrança protegida com ativação automática imediata após aprovação.',
      guaranteedAccessPrefix: 'Acesso garantido durante'
    },
    app: {
      previewGuestNotice:
        'Pré-visualização: Veja como fica o modelo. Para editar, guardar e baixar o seu currículo ou PDF sem marca, crie a sua conta e ative um plano.',
      previewFreeNotice:
        'Plano Gratuito: Para editar campos, personalizar o currículo e baixar o seu currículo ou PDF sem marca, ative o plano Pro ou Executivo.',
      createAccountBtn: 'Criar Conta',
      activateProBtn: 'Ativar Plano Pro',
      mobileEditorTab: 'Editar',
      mobileViewA4Cv: 'Ver Folha',
      mobileViewA4Cover: 'Ver Carta',
      studioTabCv: 'Currículo',
      studioTabCover: 'Carta',
      studioTabAts: 'Verificador',
      studioTabJobs: 'Vagas',
      studioTabAi: 'Adaptar IA',
      studioTabImport: 'Importar',
      bottomHome: 'Início',
      bottomEditor: 'Editar',
      bottomCover: 'Carta',
      bottomViewA4: 'Ver Folha'
    }
  },
  en: {
    brandName: 'Resume2Job',
    billingCycles: {
      monthly: { label: 'Monthly', shortUnit: 'mo' },
      quarterly: { label: 'Quarterly', shortUnit: 'quarter' },
      semiannual: { label: 'Semiannual', shortUnit: '6 mos' },
      yearly: { label: 'Annual', shortUnit: 'yr' }
    },
    header: {
      navHome: 'Home',
      navModelsExamples: 'Templates & Examples',
      navEditor: 'CV Editor',
      navTools: 'Tools',
      navPricing: 'Pricing',
      showcaseCvHeader: 'Resumes (Free Preview)',
      showcaseModelsCv: 'CV Templates',
      showcaseModelsCvDesc: '40+ A4 ATS, Harvard, Finance, Product & Europass layouts',
      showcaseExamplesCv: 'CV Examples',
      showcaseExamplesCvDesc: 'Complete resumes by profession and industry',
      showcaseCoverHeader: 'Cover Letters',
      showcaseModelsCover: 'Cover Letter Templates',
      showcaseModelsCoverDesc: 'Formal and modern A4 sheet layouts',
      showcaseExamplesCover: 'Cover Letter Examples',
      showcaseExamplesCoverDesc: 'Ready-to-adapt letters by role or career shift',
      toolsDocsHeader: 'Documents & Formats',
      toolCover: 'Cover Letter',
      toolCoverDesc: 'A4 Editor + generation & 5-language translation',
      toolAdvisor: 'International Templates',
      toolAdvisorDesc: 'Harvard, Strict ATS, Wall Street, Europass & Tech',
      toolsAnalysisHeader: 'Analysis & Optimization',
      toolRaw: 'Import Data & LinkedIn',
      toolRawDesc: 'Extract structured data from PDF, Word, or text',
      toolAts: 'ATS Radar & Keywords',
      toolAtsDesc: 'Benchmark your profile against job requirements',
      toolJobs: 'Matching Jobs (Radar)',
      toolJobsDesc: 'Live openings matched to your CV with direct links',
      toolAi: 'Impact Optimizer (XYZ)',
      toolAiDesc: 'Rewrite achievements around quantifiable metrics',
      toolInterview: 'Interview Simulator',
      toolInterviewDesc: 'Technical questions and STAR scoring',
      siteLangLabel: 'Website Language',
      siteLangHint: 'Site interface only (keeps your CV language unchanged)',
      currencyLabel: 'Pricing Currency',
      notificationsTitle: 'System Notifications',
      markAllRead: 'Mark all read',
      noNotifications:
        'No recent notifications. Translations, exports, and resume updates will appear here.',
      configureNotifs: 'Notification Preferences',
      newBadge: 'New',
      notifSystem: 'System',
      notifEmailSent: 'Email Sent',
      notifEmailQueued: 'Email Queued',
      myResumes: 'My Resumes',
      myProfile: 'My Profile & Access',
      subscriptionInvoices: 'Subscription & Invoices',
      notifPreferences: 'Preferences & Notifications',
      managePlan: 'Manage Plan',
      adminPanel: 'Admin Dashboard',
      signOut: 'Sign Out',
      signIn: 'Sign In',
      downloadCoverShort: 'Letter',
      downloadWordShort: 'Get Resume',
      downloadCover: 'Download Letter',
      downloadWord: 'Download Resume',
      exporting: 'Generating...',
      mobileWorkspace: 'Workspace',
      mobileShowcaseTitle: 'Templates & Examples (Free Preview)',
      mobileToolsTitle: 'Tools & Analysis',
      mobileMyResumes: 'My CVs',
      mobileMyAccount: 'My Account',
      mobileSignInRegister: 'Sign In / Register'
    },
    landing: {
      heroKicker: 'Executive Studio · ATS Standard · Word & PDF',
      heroTitle: 'Create a flawless resume from scratch or improve your existing CV to secure interviews and better salaries.',
      heroSubtitle:
        'The ultimate professional method approved by top recruiters. Pass ATS filters, organize your career history with measurable impact, and export in Word (.docx) or PDF in seconds.',
      ctaBuild: 'Create or Improve CV Now',
      ctaExploreModels: 'Explore 40+ Templates',
      ctaMatchJobs: 'Match Jobs to My CV',
      linkCvModels: 'CV Templates',
      linkRealExamples: 'Real Examples',
      linkCoverModels: 'Cover Letter Models',
      linkPlansStarting: 'Plans starting at',
      perMonth: '/mo',
      cardAndPix: 'Card & Pix',
      atsCompatPrefix: 'Compatibility',
      editThisModel: 'Edit this template',
      metrics: [
        { value: '98.7%', label: 'Clean parsing across ATS readers' },
        { value: '40+ Layouts', label: 'ATS, Modern, Harvard, Tech & EU' },
        { value: 'Live Match', label: 'Jobs filtered directly from your CV' },
        { value: '5 Languages', label: 'EN · PT · ES · FR · DE in 1 click' }
      ],
      deliverables: [
        { code: 'A4 CV', text: '40+ ATS & Executive layouts at real A4 scale' },
        { code: 'JOB MATCH', text: 'Filter live openings by CV profile, mode & region' },
        { code: '1-CLICK FIT', text: 'Tailor CV keywords & apply directly to each role' },
        { code: '5x LANG', text: 'Full document translation keeping layout intact' },
        { code: 'WORD 1:1', text: 'Editable Word (.docx) & clean PDF export' }
      ],
      archKicker: 'End-to-End Application Engine',
      archTitle: 'From resume creation to targeted job applications in four steps',
      archDesc:
        'Built as one connected pipeline: craft an ATS-safe resume, match and filter compatible jobs by your profile, tailor keywords in 1 click, and apply with clean Word & PDF files.',
      archSteps: [
        {
          num: '01',
          title: 'Build or Import ATS CV',
          desc: 'Pick from 40+ single-column international formats (Workday, Greenhouse, Taleo) or extract data from PDF & LinkedIn.'
        },
        {
          num: '02',
          title: 'Profile-to-Job Matching',
          desc: 'Our radar scans your headline, seniority, and skills to surface compatible live openings ranked by CV fit.'
        },
        {
          num: '03',
          title: 'Smart Filters & 1-Click Tailor',
          desc: 'Filter roles by Remote, Hybrid, Region, or Contract and inject missing ATS keywords using the Google XYZ formula.'
        },
        {
          num: '04',
          title: 'Export & Apply Directly',
          desc: 'Download 1:1 editable Word (.docx), clean PDF, and a tailored cover letter in 5 languages to submit immediately.'
        }
      ],
      jobMatch: {
        kicker: 'Profile-Based Job Discovery & Smart Filtering',
        title: 'Your resume finds and filters compatible jobs automatically',
        subtitle:
          'Switch CV profiles and test live filters by work mode and region to see how skills from your resume unlock ranked openings ready for 1-click tailoring and application.',
        profileLabel: 'Active CV Profile:',
        profiles: [
          {
            id: 'coo',
            label: 'COO & Global Ops',
            headline: 'Alexander Mendes · 12+ yrs · $35M+ P&L · Digital Transformation & M&A',
            skills: ['P&L Governance', 'EBITDA', 'ERP Integration', 'OKRs', 'Lean Six Sigma']
          },
          {
            id: 'tech',
            label: 'Staff Cloud Architect',
            headline: 'Lead Software Architect · 8+ yrs · AWS/GCP · Kubernetes & FinTech',
            skills: ['Kubernetes', 'TypeScript', 'gRPC', 'Terraform', 'DevSecOps']
          },
          {
            id: 'finance',
            label: 'VP Finance & M&A',
            headline: 'Beatriz Fonseca · CFA · €140M M&A · IFRS / US GAAP & Treasury',
            skills: ['DCF Valuation', 'IFRS / US GAAP', 'M&A', 'FP&A', 'Treasury']
          }
        ],
        workplaceFilters: { all: 'All Work Modes', remote: 'Remote', hybrid: 'Hybrid' },
        regionFilters: { all: 'All Regions', us_global: 'US & Global', europe: 'Europe' },
        matchSuffix: 'match',
        keywordsMatchedLabel: 'CV skills matched:',
        tailorCta: 'Tailor CV for Role',
        browseJobsCta: 'Open Live Job Radar & Apply',
        emptyState: 'No matching roles for that filter combination — try selecting All.',
        jobs: [
          {
            id: 'jm-coo-1',
            profile: 'coo',
            title: 'VP of Global Operations & Strategy',
            company: 'Horizon Enterprise Cloud',
            workplace: 'hybrid',
            workplaceLabel: 'Hybrid',
            region: 'us_global',
            regionLabel: 'New York / Global',
            contract: 'Full-time',
            matchScore: 96,
            matchedKeywords: ['P&L Governance', 'OKRs', 'ERP Integration']
          },
          {
            id: 'jm-coo-2',
            profile: 'coo',
            title: 'Chief Operating Officer (EMEA)',
            company: 'Atlas Logistics & Automation',
            workplace: 'remote',
            workplaceLabel: 'Remote',
            region: 'europe',
            regionLabel: 'Lisbon / EU',
            contract: 'Executive Mandate',
            matchScore: 93,
            matchedKeywords: ['EBITDA', 'Lean Six Sigma', 'P&L Governance']
          },
          {
            id: 'jm-tech-1',
            profile: 'tech',
            title: 'Principal Distributed Systems Architect',
            company: 'Northstar Payments Corp',
            workplace: 'remote',
            workplaceLabel: 'Global Remote',
            region: 'us_global',
            regionLabel: 'USA / Remote',
            contract: 'Full-time',
            matchScore: 97,
            matchedKeywords: ['Kubernetes', 'gRPC', 'DevSecOps']
          },
          {
            id: 'jm-tech-2',
            profile: 'tech',
            title: 'Head of Platform Engineering (Cloud)',
            company: 'EuroFin Core Systems',
            workplace: 'hybrid',
            workplaceLabel: 'Hybrid',
            region: 'europe',
            regionLabel: 'Berlin / Zurich',
            contract: 'Full-time',
            matchScore: 91,
            matchedKeywords: ['Terraform', 'TypeScript', 'Kubernetes']
          },
          {
            id: 'jm-fin-1',
            profile: 'finance',
            title: 'VP Corporate Development & M&A',
            company: 'Vanguard Capital Partners',
            workplace: 'hybrid',
            workplaceLabel: 'Hybrid',
            region: 'us_global',
            regionLabel: 'New York / London',
            contract: 'Full-time',
            matchScore: 95,
            matchedKeywords: ['DCF Valuation', 'M&A', 'IFRS / US GAAP']
          },
          {
            id: 'jm-fin-2',
            profile: 'finance',
            title: 'Director of FP&A & Treasury',
            company: 'Iberia Industrial Group',
            workplace: 'remote',
            workplaceLabel: 'Remote',
            region: 'europe',
            regionLabel: 'Madrid / Lisbon',
            contract: 'Full-time',
            matchScore: 92,
            matchedKeywords: ['FP&A', 'Treasury', 'IFRS / US GAAP']
          }
        ]
      },
      atsHubKicker: 'ATS Audit & Diagnostics',
      atsHubTitle: 'Real-Time ATS Audit & Simulator',
      tabHealth: 'Resume Diagnostics',
      tabSimulator: 'Simulate ATS Job',
      simSelectRole: 'Select a benchmark role:',
      simRoles: {
        coo: 'Chief Operating Officer (COO)',
        tech: 'Staff Cloud Architect',
        cfo: 'VP Finance & M&A'
      },
      simCompatLabel: 'ATS Match Score',
      simApproved: 'Profile passes automated screening',
      simRisk: 'High risk of filtering due to missing keywords & metrics',
      simActionVerb: 'Action Verb',
      simPresent: 'Present',
      simMissing: 'Missing',
      simMetricLabel: 'Metric (%/€/$)',
      simQuantified: 'Quantified',
      simNoNumbers: 'No numbers',
      simRequiredKeywords: 'Required keywords for',
      simOptimizedLabel: 'Optimized Bullet (Google XYZ Formula):',
      simTestLabel: 'Test your own CV bullet or edit the sample below:',
      simResetExample: 'Reset sample',
      simPlaceholder: 'Paste a paragraph or achievement from your current resume to measure ATS score...',
      simApplyXyz: 'Apply Google XYZ Formula (Simulate 98%)',
      simApplyToCv: 'Apply to My Resume',
      simFixInStudio: 'Fix My CV in Studio',
      proofContrastKicker: 'Direct Comparison',
      proofContrastTitle: 'From passive duties to interview-winning proof',
      proofBeforeBadge: 'Before · 38% ATS Screening',
      proofBeforeQuote:
        '“Responsible for corporate client support, managing the sales team, and tracking monthly branch targets.”',
      proofAfterBadge: 'After (Google XYZ Formula) · 96% ATS',
      proofAfterQuote:
        '“Led an 18-rep B2B sales team, expanding annual pipeline by $4.2M (+34% YoY) while keeping response SLA under 2 hours.”',
      proofCasesKicker: 'Applications in Production',
      proofCasesTitle: 'Outcomes reported by subscribers in live hiring pipelines',
      proofCases: [
        {
          role: 'M. Oliveira · Operations Director (Logistics · Lisbon / Madrid)',
          detail:
            'Replaced a 4-page CV with Harvard ATS format in English and Spanish; reached 4 final panels in 19 days.'
        },
        {
          role: 'R. Tavares · Senior Cloud Architect (Fintech · São Paulo / US Remote)',
          detail:
            'Aligned 11 technical skills using ATS Radar for Workday roles; lifted semantic match from 44% to 96%.'
        },
        {
          role: 'C. Ferreira · Finance Manager (Manufacturing · Porto / Zurich)',
          detail:
            'Generated a bilingual PT/DE Europass CV and executive letter exported directly to Word (.docx).'
        }
      ],
      templatesKicker: 'International Standards',
      templatesTitle: 'Templates Calibrated for Every Hiring Market',
      templatesSubtitle:
        'Every layout on screen and in Word (.docx) follows strict US, European, and executive hiring conventions.',
      filterAll: 'All',
      filterNoPhoto: 'No Photo · ATS',
      filterWithPhoto: 'With Photo · Europe',
      badgeWithPhoto: 'With Photo',
      badgeNoPhotoAts: 'No Photo · ATS',
      previewFreePrefix: 'Preview free',
      useModel: 'Use template',
      showLessModels: 'Show fewer templates',
      viewAllModelsPrefix: 'View all',
      viewAllModelsSuffix: 'available templates',
      openTemplateAdvisor: 'Open Template Advisor',
      pricingKicker: 'Transparent Pricing',
      pricingTitle: 'Choose the right plan for your job search',
      pricingSubtitle:
        'Full access to the editor, 5-language document translation, and native Word/PDF export via International Card or Pix.',
      freeTierName: 'Free',
      freeTierTag: 'Exploration',
      freeTierPriceUnit: '/ forever',
      freeTierDesc: 'Live A4 template preview and initial resume health audit before subscribing.',
      freeTierFeatures: [
        'Full CV & Cover Letter template gallery',
        'Live CV Health Diagnostic breakdown',
        'Country & seniority template advisor'
      ],
      freeTierCta: 'Explore Templates Free',
      proDefaultName: 'Professional Pro',
      proPopularBadge: 'Most Popular',
      proFeatures: [
        'Unlimited resumes, versions & cloud storage',
        '1:1 Word (.docx) & clean A4 PDF export',
        'Full CV & Cover Letter translation across 5 languages',
        'ATS Radar & Google XYZ Impact Optimizer'
      ],
      proCtaPrefix: 'Subscribe to',
      execDefaultName: 'Executive VIP',
      execBadge: 'C-Level & Global',
      execFeatures: [
        'Everything included in Professional Pro',
        'C-Level, Harvard Executive & UN Diplomatic templates',
        'Voice/Text Interview Simulator with STAR scoring',
        'LinkedIn Audit & priority support'
      ],
      execCtaPrefix: 'Subscribe to',
      equivalentPrefix: 'Approx.:',
      equivalentMonthlyPrefix: 'Equivalent to',
      fullAccessForDaysPrefix: 'Full access for',
      daysSuffix: 'days',
      includesStarAndCLevel: 'Includes STAR Simulator & C-Level Templates',
      roiKicker: 'Return on Investment',
      roiTitle: 'Traditional Resume Agency vs. Resume2Job',
      roiSavings: 'Save up to 95% compared to executive career agencies',
      roiAgencyTitle: 'Traditional Agency / Freelancer',
      roiAgencyPrice: '$150 – $400 / delivery',
      roiAgencyPoints: [
        '• 5 to 10 business days turnaround per version',
        '• Extra fees for tailoring your CV to new openings',
        '• Translation into English or a second language billed separately (+$80)',
        '• No live ATS match score or interview simulator'
      ],
      roiPlatformTitle: 'Resume2Job (Pro & VIP)',
      roiPlatformPricePrefix: 'Starting at',
      roiPlatformPoints: [
        '• Create and export clean Word (.docx) & PDF in under 5 min',
        '• Unlimited tailored versions saved in the cloud per application',
        '• 5-language translation & Cover Letter suite included',
        '• Live ATS Radar, Google XYZ optimizer & matching job feed'
      ],
      trustNoLockIn: 'Zero lock-in: cancel in 1 click',
      trustEditableDocx: '100% editable Word (.docx) files after download',
      trustCardPix: 'International Card (PCI-DSS) or Pix (BRL)',
      trustStartNow: 'Get started',
      matrixTitle: 'Detailed Feature Comparison',
      matrixSubtitle: 'All plans cancel anytime',
      matrixCapabilityCol: 'Capability',
      matrixFreeCol: 'Free',
      matrixProCol: 'Professional Pro',
      matrixExecCol: 'Executive VIP',
      matrixRows: [
        { feature: 'Live A4 preview across all templates', free: true, pro: true, exec: true },
        { feature: 'Structured LinkedIn, PDF & Word import', free: false, pro: true, exec: true },
        { feature: 'Native Word (.docx) & clean A4 PDF export', free: false, pro: true, exec: true },
        { feature: 'Full CV + Cover Letter translation (PT, EN, ES, FR, DE)', free: false, pro: true, exec: true },
        { feature: 'Semantic ATS Radar & Google XYZ Optimizer', free: false, pro: true, exec: true },
        { feature: 'Harvard Executive, C-Level & UN Diplomatic layouts', free: false, pro: false, exec: true },
        { feature: 'Voice/Text STAR Interview Simulator', free: false, pro: false, exec: true }
      ],
      faqTitle: 'Frequently Asked Questions',
      faqRightNote: 'Secure payments via Card & Pix',
      faqs: [
        {
          q: 'How do Card and Pix payments work?',
          a: 'We accept international credit/debit cards (Visa, Mastercard, Apple Pay, Google Pay) as well as Pix (BRL) via QR Code and official key.'
        },
        {
          q: 'Do these resumes really pass Workday, Taleo, and Greenhouse ATS?',
          a: 'Yes. Strict ATS formats such as Harvard Executive and ATS Strict use single-column linear structure without floating boxes that break OCR, paired with keyword gap verification.'
        },
        {
          q: 'Does the downloaded Word (.docx) file keep exact website styling?',
          a: 'Yes. Native OpenXML (.docx) compilation preserves exact A4 margins, typography, visible sections, and color palettes for both resumes and cover letters.'
        },
        {
          q: 'Does the document translator translate my custom text too?',
          a: 'Yes. Inside the Studio, switching document language between PT, EN, ES, FR, and DE translates both section headings and your full career text while preserving technical acronyms.'
        },
        {
          q: 'Can I cancel or change plans anytime?',
          a: 'Yes, directly from your Account Area with zero penalties or minimum contract.'
        }
      ],
      closingKicker: 'Ready in Under 5 Minutes',
      closingTitle: 'Send your next application with A4 precision and a 95%+ ATS score',
      closingSubtitle:
        'Import your current PDF or LinkedIn, sharpen your achievements, and export the complete Word (.docx) & PDF package.',
      closingCtaBuild: 'Build My Resume',
      closingCtaExamples: 'View Real Examples',
      footerRights: 'All rights reserved.'
    },
    health: {
      subtitle: 'Instant check against 6 criteria required by Workday, Taleo, Greenhouse, and Lever.',
      myResumeBtn: 'My Resume',
      benchmarkBtn: '98% Benchmark',
      globalAtsIndex: 'Global ATS Index',
      gradePrefix: 'Grade',
      tierApprovedLabel: 'Ready for ATS & Interviews',
      tierApprovedDesc: 'Structure compatible with Workday, Greenhouse, Taleo, and executive screening.',
      tierCompetitiveLabel: 'Competitive · Minor refinements',
      tierCompetitiveDesc: 'Solid foundation; reinforce keywords and numeric outcomes to reach 90%+.',
      tierWarningLabel: 'Attention · Structural gaps',
      tierWarningDesc: 'Moderate risk of automated rejection before human review.',
      tierCriticalLabel: 'Critical · Key fields missing',
      tierCriticalDesc: 'Complete contact header, experience metrics, and skills to clear ATS filters.',
      optimizedSuffix: 'optimized',
      adjustSuffix: 'to refine',
      missingSuffix: 'missing',
      openInEditor: 'Open in Resume Editor',
      fixInEditor: 'Fix Sections in Editor'
    },
    showcase: {
      modes: {
        'models-cv': {
          tabLabel: 'CV Templates',
          kicker: 'Visual CV Template Gallery',
          title: 'Professional Resume Templates',
          subtitle:
            'Preview every layout at full scale before creating an account. Pick an ATS-strict or European layout and start editing.'
        },
        'examples-cv': {
          tabLabel: 'CV Examples',
          kicker: 'Real Examples by Profession',
          title: 'Completed Resume Examples',
          subtitle:
            'Browse real resumes built with measurable metrics. Click "Use in Studio" to load the structure and tailor it to your career.'
        },
        'models-cover': {
          tabLabel: 'Letter Templates',
          kicker: 'Visual Cover Letter Gallery',
          title: 'Cover Letter Templates',
          subtitle:
            'A4 cover letter designs paired cleanly with your CV layout. Preview all designs for free before subscribing.'
        },
        'examples-cover': {
          tabLabel: 'Letter Examples',
          kicker: 'Ready-to-Use Letter Samples',
          title: 'Cover Letter Examples',
          subtitle:
            'Persuasive letters organized by industry and seniority for direct applications, LinkedIn, or international hiring.'
        }
      },
      searchPlaceholder: 'Search by role, template, or market...',
      allSectors: 'All Industries',
      allModels: 'All',
      noPhotoAts: 'No Photo · ATS',
      withPhotoEu: 'With Photo · Europe',
      previewFreeBadge: 'Free Preview',
      inspectBtn: 'Preview',
      useBtn: 'Use in Studio',
      unlockAccessBtn: 'Unlock Access',
      emptyState: 'No items matched your current filters.',
      clearFilters: 'Clear filters'
    },
    auth: {
      kicker: 'Account Access',
      loginTitle: 'Sign In to Platform',
      registerTitle: 'Create Subscriber Account',
      forgotTitle: 'Reset Password',
      loginSubtitle: 'Access your saved resumes, interview simulations, and ATS reports.',
      registerSubtitle: 'Register to sync resumes in the cloud and unlock executive features.',
      forgotSubtitle: 'Recover access to your account quickly and securely.',
      tabLogin: 'Sign In',
      tabRegister: 'Create Account',
      googleBtn: 'Continue with Google',
      googleLoading: 'Connecting to Google...',
      dividerOr: 'or with email and password',
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'e.g. Alex Morgan',
      targetRoleLabel: 'Target Role / Specialty',
      targetRolePlaceholder: 'e.g. Operations Director, Staff Engineer',
      emailLabel: 'Email Address',
      emailPlaceholder: 'name@company.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Minimum 6 characters',
      confirmPasswordLabel: 'Confirm Password',
      confirmPasswordPlaceholder: 'Repeat password',
      rememberMe: 'Keep me signed in',
      forgotPasswordLink: 'Forgot password?',
      termsPrefix: 'I agree to the',
      termsService: 'Terms of Service',
      termsAnd: 'and',
      termsPrivacy: 'Privacy Policy',
      termsSuffix: 'in compliance with GDPR & LGPD.',
      submitLogin: 'Sign In',
      submitRegister: 'Create Account & Continue',
      submitForgot: 'Send Recovery Email',
      submitResetConfirm: 'Confirm New Password',
      processing: 'Processing...',
      backToLogin: 'Back to Sign In',
      registerReassurance: 'Cloud sync · Harvard, ATS & Europass layouts · Card or Pix with zero lock-in.',
      loginReassurance: 'Encrypted session with automatic cloud backup of your resume versions.'
    },
    gate: {
      yourPlan: 'Your Plan',
      visitor: 'Visitor',
      free: 'Free',
      whatsIncluded: 'Included with this tool:',
      signInOrCreate: 'Sign In / Register',
      seePlans: 'View Plans',
      activatePrefix: 'Activate',
      trustFooter: 'Instant activation via Card or Pix · Unlimited Word (.docx) & PDF exports · Cancel anytime'
    },
    pricing: {
      modalTitle: 'Plans & Subscription Activation',
      modalSubtitle: 'Word (.docx) export, ATS Radar, and 5-language document translation via Card or Pix with no lock-in.',
      subscriberBannerTitle: 'Subscriber Feature',
      subscriberBannerBadge: 'Active Plan Required',
      currencyLabel: 'Currency:',
      currentPlanBtn: 'Current Plan',
      selectedPlanBtn: 'Selected Plan',
      summaryTitle: 'Summary & Payment',
      summarySubtitle: 'Instant activation by Card (Stripe PCI-DSS) or Pix QR Code. Cancel anytime.',
      quickAuthTitle: 'Quick Step: Identify Your Account',
      quickAuthSubtitle: 'Create your free account in seconds to attach your subscription, save resumes in the cloud, and export Word (.docx).',
      quickAuthCreate: 'Create Account',
      quickAuthSignIn: 'Sign In',
      couponLabel: 'Have a Promo Code?',
      couponPlaceholder: 'Enter coupon code',
      couponApply: 'Apply Coupon',
      couponApplying: 'Checking...',
      couponRemove: 'Remove',
      activePromosLabel: 'Active offers:',
      selectPaymentLabel: 'Select Payment Method:',
      cardMethodTitle: 'Credit / Debit Card',
      cardMethodDesc: 'Visa, Mastercard, Apple Pay & Google Pay',
      pixMethodTitle: 'Pix (BRL)',
      payCardBtnPrefix: 'Pay with Card',
      payCheckoutBtnPrefix: 'Continue to Checkout',
      payPixBtnPrefix: 'Submit Pix Receipt',
      payFreeCouponBtn: 'Activate Plan Free (100% Coupon)',
      processing: 'Processing payment...',
      noLockInNote: 'Protected checkout with instant automatic activation upon approval.',
      guaranteedAccessPrefix: 'Guaranteed access for'
    },
    app: {
      previewGuestNotice:
        'Preview Mode: Live A4 layout inspection. Editing fields, data import, and clean Resume & PDF downloads require a Pro or Executive VIP plan.',
      previewFreeNotice:
        'Free Plan: Live A4 layout preview. Editing sections, customization, and clean Resume & PDF downloads require upgrading to Pro or Executive VIP.',
      createAccountBtn: 'Create Account',
      activateProBtn: 'Activate Pro Plan',
      mobileEditorTab: 'Editor & Tools',
      mobileViewA4Cv: 'View A4 CV',
      mobileViewA4Cover: 'View A4 Letter',
      studioTabCv: 'Resume',
      studioTabCover: 'Letter',
      studioTabAts: 'ATS Radar',
      studioTabJobs: 'Jobs',
      studioTabAi: 'AI Tailor',
      studioTabImport: 'Import',
      bottomHome: 'Home',
      bottomEditor: 'Editor',
      bottomCover: 'Letter',
      bottomViewA4: 'View A4'
    }
  },
  es: {
    brandName: 'Resume2Job',
    billingCycles: {
      monthly: { label: 'Mensual', shortUnit: 'mes' },
      quarterly: { label: 'Trimestral', shortUnit: 'trimestre' },
      semiannual: { label: 'Semestral', shortUnit: 'semestre' },
      yearly: { label: 'Anual', shortUnit: 'año' }
    },
    header: {
      navHome: 'Inicio',
      navModelsExamples: 'Plantillas & Ejemplos',
      navEditor: 'Editor de CV',
      navTools: 'Herramientas',
      navPricing: 'Planes',
      showcaseCvHeader: 'Currículums (Vista Libre)',
      showcaseModelsCv: 'Plantillas de CV',
      showcaseModelsCvDesc: '40+ diseños A4 ATS, Harvard, Finanzas, Producto y Europass',
      showcaseExamplesCv: 'Ejemplos de CV',
      showcaseExamplesCvDesc: 'Currículums completos por profesión y sector',
      showcaseCoverHeader: 'Cartas de Presentación',
      showcaseModelsCover: 'Plantillas de Carta',
      showcaseModelsCoverDesc: 'Diseños formales y modernos en hoja A4',
      showcaseExamplesCover: 'Ejemplos de Carta',
      showcaseExamplesCoverDesc: 'Cartas listas por cargo, prácticas o transición',
      toolsDocsHeader: 'Documentos & Formatos',
      toolCover: 'Carta de Presentación',
      toolCoverDesc: 'Editor A4 + generación y traducción en 5 idiomas',
      toolAdvisor: 'Plantillas Internacionales',
      toolAdvisorDesc: 'Harvard, ATS Estricto, Wall Street, Europass & Tech',
      toolsAnalysisHeader: 'Análisis & Optimización',
      toolRaw: 'Importar Datos & LinkedIn',
      toolRawDesc: 'Extrae estructura de PDF, Word o texto libre',
      toolAts: 'Radar ATS & Palabras Clave',
      toolAtsDesc: 'Compara tu perfil con los requisitos del puesto',
      toolJobs: 'Vacantes Compatibles',
      toolJobsDesc: 'Ofertas en vivo alineadas a tu CV con enlace directo',
      toolAi: 'Optimizador de Impacto (XYZ)',
      toolAiDesc: 'Reescribe logros enfocados en métricas reales',
      toolInterview: 'Simulador de Entrevista',
      toolInterviewDesc: 'Preguntas técnicas y evaluación método STAR',
      siteLangLabel: 'Idioma del Sitio',
      siteLangHint: 'Interfaz web (no altera el idioma de tu CV)',
      currencyLabel: 'Moneda de Precios',
      notificationsTitle: 'Notificaciones del Sistema',
      markAllRead: 'Marcar leídas',
      noNotifications: 'Sin notificaciones recientes. Traducciones y exportaciones aparecerán aquí.',
      configureNotifs: 'Preferencias de Notificaciones',
      newBadge: 'Nueva',
      notifSystem: 'Sistema',
      notifEmailSent: 'Correo Enviado',
      notifEmailQueued: 'Correo Registrado',
      myResumes: 'Mis Currículums',
      myProfile: 'Mi Perfil & Acceso',
      subscriptionInvoices: 'Suscripción & Facturas',
      notifPreferences: 'Preferencias & Notificaciones',
      managePlan: 'Gestionar Plan',
      adminPanel: 'Panel Administrativo',
      signOut: 'Cerrar Sesión',
      signIn: 'Entrar',
      downloadCoverShort: 'Carta',
      downloadWordShort: 'Bajar CV',
      downloadCover: 'Descargar Carta',
      downloadWord: 'Descargar Currículum',
      exporting: 'Generando...',
      mobileWorkspace: 'Área de Trabajo',
      mobileShowcaseTitle: 'Plantillas & Ejemplos (Vista Libre)',
      mobileToolsTitle: 'Herramientas & Análisis',
      mobileMyResumes: 'Mis CVs',
      mobileMyAccount: 'Mi Cuenta',
      mobileSignInRegister: 'Entrar / Registro'
    },
    landing: {
      heroKicker: 'IA para Postulaciones · Puntuación ATS · PDF y Word',
      heroTitle: 'IA que adapta automáticamente tu CV a cualquier vacante y multiplica tus entrevistas.',
      heroSubtitle:
        'Pega el enlace de cualquier oferta, mira tu compatibilidad ATS al instante y adapta tu resumen, logros y palabras clave en 1 clic — listo en PDF o Word.',
      ctaBuild: 'Adaptar mi CV con IA',
      ctaExploreModels: 'Explorar 40+ Plantillas',
      ctaMatchJobs: 'Filtrar Vacantes por CV',
      linkCvModels: 'Plantillas de CV',
      linkRealExamples: 'Ejemplos Reales',
      linkCoverModels: 'Plantillas de Carta',
      linkPlansStarting: 'Planes desde',
      perMonth: '/mes',
      cardAndPix: 'Tarjeta & Pix',
      atsCompatPrefix: 'Compatibilidad',
      editThisModel: 'Editar esta plantilla',
      metrics: [
        { value: '98.7%', label: 'Lectura limpia en parsers ATS' },
        { value: '40+ Diseños', label: 'ATS, Moderno, Harvard, Tech y UE' },
        { value: 'Match en Vivo', label: 'Ofertas filtradas desde tu perfil' },
        { value: '5 Idiomas', label: 'EN · PT · ES · FR · DE en 1 clic' }
      ],
      deliverables: [
        { code: 'CV A4', text: '40+ diseños ATS y Ejecutivos en formato real' },
        { code: 'MATCH', text: 'Ofertas filtradas por perfil, país y remoto/híbrido' },
        { code: 'ADAPTAR', text: 'Ajusta el CV a la oferta elegida en 1 clic' },
        { code: '5x IDIOMA', text: 'Traducción integral sin perder el diseño' },
        { code: 'WORD 1:1', text: 'Descarga editable (.docx) y PDF sin marca' }
      ],
      archKicker: 'Ciclo Completo de Candidatura',
      archTitle: 'Del currículum a la postulación dirigida en cuatro pasos',
      archDesc:
        'Unimos creación de CV compatible con ATS, radar de vacantes por perfil, filtros inteligentes y adaptación inmediata a cada oferta.',
      archSteps: [
        {
          num: '01',
          title: 'Crea o Importa tu CV ATS',
          desc: 'Elige entre más de 40 diseños internacionales de una columna (Workday, Greenhouse, Taleo) o importa PDF/LinkedIn.'
        },
        {
          num: '02',
          title: 'Radar de Ofertas por Perfil',
          desc: 'Analizamos tu cargo, nivel y habilidades para mostrarte vacantes compatibles con porcentaje real de ajuste.'
        },
        {
          num: '03',
          title: 'Filtra & Adapta en 1 Clic',
          desc: 'Filtra por remoto, híbrido, país o contrato e incorpora palabras clave de la oferta con la Fórmula Google XYZ.'
        },
        {
          num: '04',
          title: 'Exporta y Postúlate',
          desc: 'Descarga Word (.docx) fiel, PDF limpio y carta de presentación en 5 idiomas para aplicar de inmediato.'
        }
      ],
      jobMatch: {
        kicker: 'Búsqueda y Filtro Inteligente de Ofertas',
        title: 'Tu CV encuentra y filtra las vacantes adecuadas a tu perfil',
        subtitle:
          'Cambia de perfil y prueba los filtros por modalidad y región para ver cómo extraemos competencias del CV, calculamos afinidad y preparamos tu postulación.',
        profileLabel: 'Perfil activo del CV:',
        profiles: [
          {
            id: 'coo',
            label: 'COO & Operaciones Globales',
            headline: 'Alexander Mendes · 12+ años · P&L $35M+ · Transformación Digital & M&A',
            skills: ['P&L Governance', 'EBITDA', 'ERP Integration', 'OKRs', 'Lean Six Sigma']
          },
          {
            id: 'tech',
            label: 'Staff Cloud Architect',
            headline: 'Lead Software Architect · 8+ años · AWS/GCP · Kubernetes & FinTech',
            skills: ['Kubernetes', 'TypeScript', 'gRPC', 'Terraform', 'DevSecOps']
          },
          {
            id: 'finance',
            label: 'VP Finanzas & M&A',
            headline: 'Beatriz Fonseca · CFA · €140M M&A · IFRS / US GAAP & Tesorería',
            skills: ['DCF Valuation', 'IFRS / US GAAP', 'M&A', 'FP&A', 'Treasury']
          }
        ],
        workplaceFilters: { all: 'Todas las Modalidades', remote: 'Remoto', hybrid: 'Híbrido' },
        regionFilters: { all: 'Todas las Regiones', us_global: 'EE. UU. & Global', europe: 'Europa' },
        matchSuffix: 'compatible',
        keywordsMatchedLabel: 'Competencias del CV detectadas:',
        tailorCta: 'Adaptar CV a esta Oferta',
        browseJobsCta: 'Abrir Radar de Ofertas & Aplicar',
        emptyState: 'Sin ofertas para esta combinación — prueba seleccionar Todas.',
        jobs: [
          {
            id: 'jm-coo-1',
            profile: 'coo',
            title: 'VP of Global Operations & Strategy',
            company: 'Horizon Enterprise Cloud',
            workplace: 'hybrid',
            workplaceLabel: 'Híbrido',
            region: 'us_global',
            regionLabel: 'Nueva York / Global',
            contract: 'Tiempo Completo',
            matchScore: 96,
            matchedKeywords: ['P&L Governance', 'OKRs', 'ERP Integration']
          },
          {
            id: 'jm-coo-2',
            profile: 'coo',
            title: 'Chief Operating Officer (EMEA)',
            company: 'Atlas Logistics & Automation',
            workplace: 'remote',
            workplaceLabel: 'Remoto',
            region: 'europe',
            regionLabel: 'Lisboa / UE',
            contract: 'Contrato Ejecutivo',
            matchScore: 93,
            matchedKeywords: ['EBITDA', 'Lean Six Sigma', 'P&L Governance']
          },
          {
            id: 'jm-tech-1',
            profile: 'tech',
            title: 'Principal Distributed Systems Architect',
            company: 'Northstar Payments Corp',
            workplace: 'remote',
            workplaceLabel: 'Remoto Global',
            region: 'us_global',
            regionLabel: 'EE. UU. / Remoto',
            contract: 'Tiempo Completo',
            matchScore: 97,
            matchedKeywords: ['Kubernetes', 'gRPC', 'DevSecOps']
          },
          {
            id: 'jm-tech-2',
            profile: 'tech',
            title: 'Head of Platform Engineering (Cloud)',
            company: 'EuroFin Core Systems',
            workplace: 'hybrid',
            workplaceLabel: 'Híbrido',
            region: 'europe',
            regionLabel: 'Berlín / Zúrich',
            contract: 'Tiempo Completo',
            matchScore: 91,
            matchedKeywords: ['Terraform', 'TypeScript', 'Kubernetes']
          },
          {
            id: 'jm-fin-1',
            profile: 'finance',
            title: 'VP Corporate Development & M&A',
            company: 'Vanguard Capital Partners',
            workplace: 'hybrid',
            workplaceLabel: 'Híbrido',
            region: 'us_global',
            regionLabel: 'Nueva York / Londres',
            contract: 'Tiempo Completo',
            matchScore: 95,
            matchedKeywords: ['DCF Valuation', 'M&A', 'IFRS / US GAAP']
          },
          {
            id: 'jm-fin-2',
            profile: 'finance',
            title: 'Director of FP&A & Treasury',
            company: 'Iberia Industrial Group',
            workplace: 'remote',
            workplaceLabel: 'Remoto',
            region: 'europe',
            regionLabel: 'Madrid / Lisboa',
            contract: 'Tiempo Completo',
            matchScore: 92,
            matchedKeywords: ['FP&A', 'Treasury', 'IFRS / US GAAP']
          }
        ]
      },
      atsHubKicker: 'Auditoría & Diagnóstico ATS',
      atsHubTitle: 'Auditoría y Simulador en Tiempo Real',
      tabHealth: 'Diagnóstico del CV',
      tabSimulator: 'Simular Vacante ATS',
      simSelectRole: 'Selecciona un puesto de referencia:',
      simRoles: {
        coo: 'Director de Operaciones (COO)',
        tech: 'Staff Cloud Architect',
        cfo: 'VP Finanzas & M&A'
      },
      simCompatLabel: 'Compatibilidad ATS',
      simApproved: 'Perfil aprobado en el filtrado automático',
      simRisk: 'Riesgo de descarte por falta de términos y métricas',
      simActionVerb: 'Verbo de Acción',
      simPresent: 'Presente',
      simMissing: 'Ausente',
      simMetricLabel: 'Métrica (%/€/$/N)',
      simQuantified: 'Cuantificada',
      simNoNumbers: 'Sin cifras',
      simRequiredKeywords: 'Palabras clave exigidas para',
      simOptimizedLabel: 'Texto Optimizado (Fórmula Google XYZ):',
      simTestLabel: 'Prueba aquí tu propia descripción o edita el ejemplo:',
      simResetExample: 'Restablecer ejemplo',
      simPlaceholder: 'Pega aquí un párrafo o logro de tu CV actual para medir su puntuación ATS...',
      simApplyXyz: 'Aplicar Fórmula Google XYZ (Simular 98%)',
      simApplyToCv: 'Aplicar en Mi Currículum',
      simFixInStudio: 'Corregir Mi CV en el Estudio',
      proofContrastKicker: 'Comparación Directa',
      proofContrastTitle: 'De descripción pasiva a argumento de entrevista',
      proofBeforeBadge: 'Antes · Filtrado 38% ATS',
      proofBeforeQuote:
        '“Responsable de atención corporativa, gestión del equipo comercial y seguimiento de objetivos mensuales de la sucursal.”',
      proofAfterBadge: 'Después (Fórmula Google XYZ) · 96% ATS',
      proofAfterQuote:
        '“Lideró equipo comercial de 18 consultores B2B, ampliando el pipeline anual en $4.2M (+34% YoY) con SLA inferior a 2h.”',
      proofCasesKicker: 'Candidaturas en Producción',
      proofCasesTitle: 'Resultados reportados por suscriptores en procesos reales',
      proofCases: [
        {
          role: 'M. Oliveira · Director de Operaciones (Logística · Lisboa / Madrid)',
          detail:
            'Sustituyó un CV de 4 páginas por Harvard ATS en inglés y español; avanzó a 4 paneles finales en 19 días.'
        },
        {
          role: 'R. Tavares · Arquitecto Cloud Sénior (Fintech · São Paulo / Remoto EE. UU.)',
          detail:
            'Ajustó 11 competencias con Radar ATS para ofertas Workday; subió del 44% al 96% de compatibilidad.'
        },
        {
          role: 'C. Ferreira · Gestora Financiera (Industria · Oporto / Zúrich)',
          detail:
            'Emitió CV Europass y carta ejecutiva bilingüe con exportación directa en .docx sin perder formato.'
        }
      ],
      templatesKicker: 'Estándares Internacionales',
      templatesTitle: 'Plantillas Calibradas para Cada Mercado',
      templatesSubtitle:
        'Cada diseño en pantalla y en Word (.docx) sigue las normas de EE. UU., Europa y cargos directivos.',
      filterAll: 'Todos',
      filterNoPhoto: 'Sin Foto · ATS',
      filterWithPhoto: 'Con Foto · Europa',
      badgeWithPhoto: 'Con Foto',
      badgeNoPhotoAts: 'Sin Foto · ATS',
      previewFreePrefix: 'Vista previa gratis',
      useModel: 'Usar plantilla',
      showLessModels: 'Mostrar menos plantillas',
      viewAllModelsPrefix: 'Ver las',
      viewAllModelsSuffix: 'plantillas disponibles',
      openTemplateAdvisor: 'Abrir Asesor de Plantillas',
      pricingKicker: 'Precios Transparentes',
      pricingTitle: 'Elige el plan ideal para tu candidatura',
      pricingSubtitle:
        'Acceso completo a edición, traducción en 5 idiomas y exportación nativa Word/PDF. Pago con Tarjeta o Pix.',
      freeTierName: 'Gratuito',
      freeTierTag: 'Exploración',
      freeTierPriceUnit: '/ siempre',
      freeTierDesc: 'Vista previa A4 de plantillas y diagnóstico inicial antes de suscribirte.',
      freeTierFeatures: [
        'Galería completa de plantillas de CV y Carta',
        'Lectura del Diagnóstico de Salud del CV',
        'Asesor de diseño por país y sector'
      ],
      freeTierCta: 'Explorar Plantillas Gratis',
      proDefaultName: 'Profesional Pro',
      proPopularBadge: 'Más Elegido',
      proFeatures: [
        'Currículums, versiones y guardado ilimitado en la nube',
        'Exportación 1:1 en Word (.docx) y PDF A4 sin marca de agua',
        'Traducción integral del CV y Carta a 5 idiomas',
        'Radar ATS & Optimizador de Impacto (XYZ)'
      ],
      proCtaPrefix: 'Suscribirse a',
      execDefaultName: 'Ejecutivo VIP',
      execBadge: 'C-Level & Global',
      execFeatures: [
        'Todo lo incluido en Profesional Pro',
        'Plantillas Ejecutivas C-Level, Harvard y ONU',
        'Simulador de Entrevista por voz/texto con notas STAR',
        'Auditoría LinkedIn y soporte prioritario'
      ],
      execCtaPrefix: 'Suscribirse a',
      equivalentPrefix: 'Equivalente:',
      equivalentMonthlyPrefix: 'Equivalente a',
      fullAccessForDaysPrefix: 'Acceso completo durante',
      daysSuffix: 'días',
      includesStarAndCLevel: 'Incluye Simulador STAR y Plantillas C-Level',
      roiKicker: 'Retorno de la Inversión',
      roiTitle: 'Consultoría Tradicional vs. Resume2Job',
      roiSavings: 'Ahorra hasta un 95% frente a agencias de recolocación',
      roiAgencyTitle: 'Consultoría / Freelancer Tradicional',
      roiAgencyPrice: '$150 – $400 / entrega',
      roiAgencyPoints: [
        '• Plazo medio de 5 a 10 días hábiles por versión',
        '• Cargo adicional para adaptar el CV a nuevas ofertas',
        '• Traducción a inglés u otro idioma cobrada aparte (+$80)',
        '• Sin puntuación ATS en vivo ni simulador de entrevista'
      ],
      roiPlatformTitle: 'Resume2Job (Pro y VIP)',
      roiPlatformPricePrefix: 'Desde',
      roiPlatformPoints: [
        '• Creación y exportación en Word (.docx) y PDF en menos de 5 min',
        '• Versiones ilimitadas adaptadas a cada oferta en la nube',
        '• Traducción integral en 5 idiomas + Carta incluidas',
        '• Radar ATS, Fórmula Google XYZ y vacantes en vivo'
      ],
      trustNoLockIn: 'Sin permanencia: cancela en 1 clic',
      trustEditableDocx: 'Archivos Word (.docx) 100% editables tras descargar',
      trustCardPix: 'Tarjeta Internacional (PCI-DSS) o Pix (BRL)',
      trustStartNow: 'Empezar ahora',
      matrixTitle: 'Comparativa Detallada de Funciones',
      matrixSubtitle: 'Todos los planes sin permanencia',
      matrixCapabilityCol: 'Capacidad',
      matrixFreeCol: 'Gratuito',
      matrixProCol: 'Profesional Pro',
      matrixExecCol: 'Ejecutivo VIP',
      matrixRows: [
        { feature: 'Vista previa A4 en vivo de todas las plantillas', free: true, pro: true, exec: true },
        { feature: 'Importación estructurada de LinkedIn, PDF y Word', free: false, pro: true, exec: true },
        { feature: 'Exportación nativa Word (.docx) y PDF A4 limpio', free: false, pro: true, exec: true },
        { feature: 'Traducción integral CV + Carta (PT, EN, ES, FR, DE)', free: false, pro: true, exec: true },
        { feature: 'Radar ATS Semántico & Optimizador Google XYZ', free: false, pro: true, exec: true },
        { feature: 'Plantillas Harvard Ejecutivo, C-Level y ONU', free: false, pro: false, exec: true },
        { feature: 'Simulador de Entrevista por voz/texto con notas STAR', free: false, pro: false, exec: true }
      ],
      faqTitle: 'Preguntas Frecuentes',
      faqRightNote: 'Pagos seguros vía Tarjeta y Pix',
      faqs: [
        {
          q: '¿Cómo funciona el pago con Tarjeta y Pix?',
          a: 'Aceptamos tarjetas de crédito/débito internacionales con renovación transparente y Pix en Reales (BRL) con QR Code y clave oficial.'
        },
        {
          q: '¿El currículum supera realmente los filtros ATS (Workday, Taleo, Greenhouse)?',
          a: 'Sí. Nuestras plantillas estrictas siguen lectura lineal en columna única sin cuadros flotantes que rompan el OCR.'
        },
        {
          q: '¿El archivo Word (.docx) descargado mantiene el diseño exacto del sitio?',
          a: 'Sí. Compilamos en OpenXML (.docx) nativo respetando márgenes A4, fuentes, secciones y colores.'
        },
        {
          q: '¿La traducción del documento traduce también el texto que yo escribí?',
          a: 'Sí. Dentro del estudio puedes cambiar el idioma del CV y la carta entre 5 idiomas manteniendo términos técnicos.'
        },
        {
          q: '¿Puedo cancelar o cambiar de plan cuando quiera?',
          a: 'Sí, directamente desde tu Área de Usuario, sin penalizaciones ni permanencia.'
        }
      ],
      closingKicker: 'Listo en Menos de 5 Minutos',
      closingTitle: 'Envía tu próxima candidatura con formato A4 y puntuación ATS superior al 95%',
      closingSubtitle:
        'Importa tu PDF o LinkedIn actual, optimiza tus logros y descarga el paquete completo en Word (.docx) y PDF.',
      closingCtaBuild: 'Crear Mi Currículum',
      closingCtaExamples: 'Ver Ejemplos Reales',
      footerRights: 'Todos los derechos reservados.'
    },
    health: {
      subtitle: 'Auditoría instantánea de los 6 criterios exigidos por Workday, Taleo y Greenhouse.',
      myResumeBtn: 'Mi Currículum',
      benchmarkBtn: 'Referencia 98%',
      globalAtsIndex: 'Índice ATS Global',
      gradePrefix: 'Grado',
      tierApprovedLabel: 'Aprobado para ATS y Entrevistas',
      tierApprovedDesc: 'Estructura compatible con Workday, Greenhouse, Taleo y selección ejecutiva.',
      tierCompetitiveLabel: 'Competitivo · Ajustes puntuales',
      tierCompetitiveDesc: 'Buena base; refuerza palabras clave y métricas para superar el 90%.',
      tierWarningLabel: 'Atención · Brechas estructurales',
      tierWarningDesc: 'Riesgo moderado de descarte automático antes de lectura humana.',
      tierCriticalLabel: 'Crítico · Campos esenciales vacíos',
      tierCriticalDesc: 'Completa encabezado, experiencia y competencias para superar filtros ATS.',
      optimizedSuffix: 'optimizadas',
      adjustSuffix: 'a mejorar',
      missingSuffix: 'ausentes',
      openInEditor: 'Abrir en el Editor de CV',
      fixInEditor: 'Corregir Secciones en el Editor'
    },
    showcase: {
      modes: {
        'models-cv': {
          tabLabel: 'Plantillas de CV',
          kicker: 'Galería Visual de Plantillas',
          title: 'Plantillas de Currículum Profesionales',
          subtitle: 'Visualiza todos los diseños a escala real antes de registrarte.'
        },
        'examples-cv': {
          tabLabel: 'Ejemplos de CV',
          kicker: 'Ejemplos Reales por Profesión',
          title: 'Ejemplos de Currículum Completos',
          subtitle: 'Inspírate en currículums reales estructurados con métricas de impacto.'
        },
        'models-cover': {
          tabLabel: 'Plantillas de Carta',
          kicker: 'Galería de Cartas de Presentación',
          title: 'Plantillas de Carta de Presentación',
          subtitle: 'Cartas en escala A4 coordinadas con tu currículum.'
        },
        'examples-cover': {
          tabLabel: 'Ejemplos de Carta',
          kicker: 'Modelos Listos de Carta',
          title: 'Ejemplos de Carta de Presentación',
          subtitle: 'Textos persuasivos por sector para candidaturas directas e internacionales.'
        }
      },
      searchPlaceholder: 'Buscar por puesto, plantilla o mercado...',
      allSectors: 'Todos los Sectores',
      allModels: 'Todos',
      noPhotoAts: 'Sin Foto · ATS',
      withPhotoEu: 'Con Foto · Europa',
      previewFreeBadge: 'Vista Previa Gratis',
      inspectBtn: 'Visualizar',
      useBtn: 'Usar en Estudio',
      unlockAccessBtn: 'Desbloquear Acceso',
      emptyState: 'No se encontraron elementos con estos filtros.',
      clearFilters: 'Limpiar filtros'
    },
    auth: {
      kicker: 'Acceso a la Cuenta',
      loginTitle: 'Iniciar Sesión',
      registerTitle: 'Crear Cuenta de Suscriptor',
      forgotTitle: 'Recuperar Contraseña',
      loginSubtitle: 'Accede a tus currículums, simulaciones y análisis ATS.',
      registerSubtitle: 'Regístrate para guardar tus CVs en la nube y desbloquear funciones.',
      forgotSubtitle: 'Recupera el acceso a tu cuenta de forma rápida y segura.',
      tabLogin: 'Iniciar Sesión',
      tabRegister: 'Crear Cuenta',
      googleBtn: 'Continuar con Google',
      googleLoading: 'Conectando con Google...',
      dividerOr: 'o con correo y contraseña',
      fullNameLabel: 'Nombre Completo',
      fullNamePlaceholder: 'Ej: Carlos Mendoza',
      targetRoleLabel: 'Puesto Deseado / Área',
      targetRolePlaceholder: 'Ej: Director de Operaciones, Tech Lead',
      emailLabel: 'Correo Electrónico',
      emailPlaceholder: 'nombre@empresa.com',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: 'Mínimo 6 caracteres',
      confirmPasswordLabel: 'Confirmar Contraseña',
      confirmPasswordPlaceholder: 'Repite la contraseña',
      rememberMe: 'Mantener sesión iniciada',
      forgotPasswordLink: '¿Olvidaste tu contraseña?',
      termsPrefix: 'Acepto los',
      termsService: 'Términos de Servicio',
      termsAnd: 'y la',
      termsPrivacy: 'Política de Privacidad',
      termsSuffix: 'conforme a RGPD y LGPD.',
      submitLogin: 'Entrar en la Plataforma',
      submitRegister: 'Crear Cuenta y Entrar',
      submitForgot: 'Solicitar Recuperación',
      submitResetConfirm: 'Confirmar Nueva Contraseña',
      processing: 'Procesando...',
      backToLogin: 'Volver al Inicio de Sesión',
      registerReassurance: 'Sincronización en la nube · Plantillas Harvard, ATS y Europass · Sin permanencia.',
      loginReassurance: 'Sesión cifrada con respaldo automático de tus currículums.'
    },
    gate: {
      yourPlan: 'Tu Plan',
      visitor: 'Visitante',
      free: 'Gratuito',
      whatsIncluded: 'Qué incluye esta herramienta:',
      signInOrCreate: 'Entrar / Crear Cuenta',
      seePlans: 'Ver Planes',
      activatePrefix: 'Activar',
      trustFooter: 'Activación inmediata con Tarjeta o Pix · Descargas Word (.docx) y PDF ilimitadas · Cancela cuando quieras'
    },
    pricing: {
      modalTitle: 'Planes y Activación de Suscripción',
      modalSubtitle: 'Exportación Word (.docx), Radar ATS y traducción en 5 idiomas mediante Tarjeta o Pix.',
      subscriberBannerTitle: 'Función Exclusiva para Suscriptores',
      subscriberBannerBadge: 'Requiere Plan Activo',
      currencyLabel: 'Moneda:',
      currentPlanBtn: 'Plan Actual',
      selectedPlanBtn: 'Plan Seleccionado',
      summaryTitle: 'Resumen y Pago',
      summarySubtitle: 'Activación inmediata con Tarjeta (Stripe PCI-DSS) o Pix con QR Code. Sin permanencia.',
      quickAuthTitle: 'Paso Rápido: Identifica tu Cuenta',
      quickAuthSubtitle: 'Crea tu cuenta gratuita en segundos para vincular la suscripción y exportar en Word (.docx).',
      quickAuthCreate: 'Crear Cuenta',
      quickAuthSignIn: 'Entrar',
      couponLabel: '¿Tienes un Cupón de Descuento?',
      couponPlaceholder: 'Ingresa tu código',
      couponApply: 'Aplicar Cupón',
      couponApplying: 'Validando...',
      couponRemove: 'Quitar',
      activePromosLabel: 'Promociones activas:',
      selectPaymentLabel: 'Selecciona el Método de Pago:',
      cardMethodTitle: 'Tarjeta de Crédito / Débito',
      cardMethodDesc: 'Visa, Mastercard, Apple Pay & Google Pay',
      pixMethodTitle: 'Pix (BRL)',
      payCardBtnPrefix: 'Pagar con Tarjeta',
      payCheckoutBtnPrefix: 'Continuar al Pago',
      payPixBtnPrefix: 'Enviar Comprobante Pix',
      payFreeCouponBtn: 'Activar Plan Gratis (Cupón 100%)',
      processing: 'Procesando pago...',
      noLockInNote: 'Pago protegido con activación automática tras la aprobación.',
      guaranteedAccessPrefix: 'Acceso garantizado durante'
    },
    app: {
      previewGuestNotice:
        'Modo Vista Previa: Inspección visual A4. La edición, importación y descargas en Currículum y PDF requieren un plan Pro o Ejecutivo VIP.',
      previewFreeNotice:
        'Plan Gratuito: Vista previa A4. La edición de campos y descargas oficiales en Currículum y PDF requieren suscripción activa.',
      createAccountBtn: 'Crear Cuenta',
      activateProBtn: 'Activar Plan Pro',
      mobileEditorTab: 'Editor y Panel',
      mobileViewA4Cv: 'Ver CV A4',
      mobileViewA4Cover: 'Ver Carta A4',
      studioTabCv: 'Currículum',
      studioTabCover: 'Carta',
      studioTabAts: 'Radar ATS',
      studioTabJobs: 'Ofertas',
      studioTabAi: 'Optimizar IA',
      studioTabImport: 'Importar',
      bottomHome: 'Inicio',
      bottomEditor: 'Editor',
      bottomCover: 'Carta',
      bottomViewA4: 'Ver A4'
    }
  },
  fr: {
    brandName: 'Resume2Job',
    billingCycles: {
      monthly: { label: 'Mensuel', shortUnit: 'mois' },
      quarterly: { label: 'Trimestriel', shortUnit: 'trimestre' },
      semiannual: { label: 'Semestriel', shortUnit: 'semestre' },
      yearly: { label: 'Annuel', shortUnit: 'an' }
    },
    header: {
      navHome: 'Accueil',
      navModelsExamples: 'Modèles & Exemples',
      navEditor: 'Éditeur de CV',
      navTools: 'Outils',
      navPricing: 'Tarifs',
      showcaseCvHeader: 'CV (Aperçu Gratuit)',
      showcaseModelsCv: 'Modèles de CV',
      showcaseModelsCvDesc: '40+ mises en page A4 ATS, Harvard, Finance, Produit & Europass',
      showcaseExamplesCv: 'Exemples de CV',
      showcaseExamplesCvDesc: 'CV complets par métier et secteur',
      showcaseCoverHeader: 'Lettres de Motivation',
      showcaseModelsCover: 'Modèles de Lettre',
      showcaseModelsCoverDesc: 'Mises en page A4 formelles et modernes',
      showcaseExamplesCover: 'Exemples de Lettre',
      showcaseExamplesCoverDesc: 'Lettres prêtes par poste ou reconversion',
      toolsDocsHeader: 'Documents & Formats',
      toolCover: 'Lettre de Motivation',
      toolCoverDesc: 'Éditeur A4 + rédaction et traduction en 5 langues',
      toolAdvisor: 'Modèles Internationaux',
      toolAdvisorDesc: 'Harvard, ATS Strict, Wall Street, Europass & Tech',
      toolsAnalysisHeader: 'Analyse & Optimisation',
      toolRaw: 'Importer Données & LinkedIn',
      toolRawDesc: 'Extrayez la structure depuis PDF, Word ou texte',
      toolAts: 'Radar ATS & Mots-clés',
      toolAtsDesc: 'Comparez votre profil aux exigences du poste',
      toolJobs: 'Offres Compatibles',
      toolJobsDesc: 'Offres en direct alignées à votre CV',
      toolAi: 'Optimiseur d’Impact (XYZ)',
      toolAiDesc: 'Reformulez vos réalisations avec des chiffres',
      toolInterview: 'Simulateur d’Entretien',
      toolInterviewDesc: 'Questions techniques et notation méthode STAR',
      siteLangLabel: 'Langue du Site',
      siteLangHint: 'Interface du site (ne modifie pas votre CV)',
      currencyLabel: 'Devise',
      notificationsTitle: 'Notifications Système',
      markAllRead: 'Tout marquer lu',
      noNotifications: 'Aucune notification récente. Traductions et exports apparaîtront ici.',
      configureNotifs: 'Préférences de Notifications',
      newBadge: 'Nouveau',
      notifSystem: 'Système',
      notifEmailSent: 'E-mail Envoyé',
      notifEmailQueued: 'E-mail Enregistré',
      myResumes: 'Mes CV',
      myProfile: 'Mon Profil & Accès',
      subscriptionInvoices: 'Abonnement & Factures',
      notifPreferences: 'Préférences & Notifications',
      managePlan: 'Gérer mon Forfait',
      adminPanel: 'Panneau Admin',
      signOut: 'Déconnexion',
      signIn: 'Connexion',
      downloadCoverShort: 'Lettre',
      downloadWordShort: 'Télécharger CV',
      downloadCover: 'Télécharger Lettre',
      downloadWord: 'Télécharger CV',
      exporting: 'Génération...',
      mobileWorkspace: 'Espace de Travail',
      mobileShowcaseTitle: 'Modèles & Exemples (Aperçu Libre)',
      mobileToolsTitle: 'Outils & Analyse',
      mobileMyResumes: 'Mes CV',
      mobileMyAccount: 'Mon Compte',
      mobileSignInRegister: 'Connexion / Inscription'
    },
    landing: {
      heroKicker: 'IA de Candidature · Score ATS · PDF & Word',
      heroTitle: 'L’IA qui adapte automatiquement votre CV à chaque offre et augmente vos chances d’entretien.',
      heroSubtitle:
        'Collez le lien d’une offre, obtenez votre score ATS instantané et adaptez votre profil, réalisations et mots-clés en 1 clic — prêt en PDF ou Word.',
      ctaBuild: 'Adapter mon CV avec l’IA',
      ctaExploreModels: 'Explorer 40+ Modèles',
      ctaMatchJobs: 'Filtrer les Offres par CV',
      linkCvModels: 'Modèles de CV',
      linkRealExamples: 'Exemples Réels',
      linkCoverModels: 'Modèles de Lettre',
      linkPlansStarting: 'Tarifs dès',
      perMonth: '/mois',
      cardAndPix: 'Carte & Pix',
      atsCompatPrefix: 'Compatibilité',
      editThisModel: 'Modifier ce modèle',
      metrics: [
        { value: '98.7%', label: 'Lecture propre par les parseurs ATS' },
        { value: '40+ Formats', label: 'ATS, Moderne, Harvard, Tech & UE' },
        { value: 'Match Direct', label: 'Offres filtrées depuis votre CV' },
        { value: '5 Langues', label: 'EN · PT · ES · FR · DE en 1 clic' }
      ],
      deliverables: [
        { code: 'CV A4', text: '40+ mises en page ATS & Exécutives A4' },
        { code: 'MATCH', text: 'Offres filtrées par profil, pays et télétravail' },
        { code: 'ADAPTER', text: 'Ajustez votre CV à l’offre choisie en 1 clic' },
        { code: '5x LANGUES', text: 'Traduction complète sans casser le design' },
        { code: 'WORD 1:1', text: 'Téléchargement .docx éditable & PDF propre' }
      ],
      archKicker: 'Chaîne Complète de Candidature',
      archTitle: 'Du CV ATS à la candidature ciblée en quatre étapes',
      archDesc:
        'Création de CV optimisé ATS, détection d’offres compatibles avec votre profil, filtrage précis et adaptation automatique à chaque poste.',
      archSteps: [
        {
          num: '01',
          title: 'Créez ou Importez le CV ATS',
          desc: 'Choisissez parmi plus de 40 formats internationaux en colonne unique (Workday, Greenhouse, Taleo) ou importez PDF/LinkedIn.'
        },
        {
          num: '02',
          title: 'Offres Alignées au Profil',
          desc: 'Notre radar analyse votre titre, séniorité et compétences pour classer les opportunités compatibles.'
        },
        {
          num: '03',
          title: 'Filtrez & Adaptez en 1 Clic',
          desc: 'Filtrez par télétravail, hybride, région ou contrat et injectez les mots-clés manquants avec la formule Google XYZ.'
        },
        {
          num: '04',
          title: 'Exportez & Postulez',
          desc: 'Téléchargez Word (.docx) fidèle, PDF propre et lettre de motivation traduite en 5 langues pour postuler.'
        }
      ],
      jobMatch: {
        kicker: 'Détection & Filtrage Intelligent d’Offres',
        title: 'Votre CV trouve et filtre les offres adaptées à votre profil',
        subtitle:
          'Changez de profil et testez les filtres par mode et région pour voir comment nous extrayons vos compétences et préparons la candidature.',
        profileLabel: 'Profil CV actif :',
        profiles: [
          {
            id: 'coo',
            label: 'COO & Opérations Globales',
            headline: 'Alexander Mendes · 12+ ans · P&L 35M$+ · Transformation Digitale & M&A',
            skills: ['P&L Governance', 'EBITDA', 'ERP Integration', 'OKRs', 'Lean Six Sigma']
          },
          {
            id: 'tech',
            label: 'Staff Cloud Architect',
            headline: 'Lead Software Architect · 8+ ans · AWS/GCP · Kubernetes & FinTech',
            skills: ['Kubernetes', 'TypeScript', 'gRPC', 'Terraform', 'DevSecOps']
          },
          {
            id: 'finance',
            label: 'VP Finance & M&A',
            headline: 'Beatriz Fonseca · CFA · 140M€ M&A · IFRS / US GAAP & Trésorerie',
            skills: ['DCF Valuation', 'IFRS / US GAAP', 'M&A', 'FP&A', 'Treasury']
          }
        ],
        workplaceFilters: { all: 'Tous les Modes', remote: 'Télétravail', hybrid: 'Hybride' },
        regionFilters: { all: 'Toutes Régions', us_global: 'USA & Global', europe: 'Europe' },
        matchSuffix: 'compatible',
        keywordsMatchedLabel: 'Compétences du CV détectées :',
        tailorCta: 'Adapter le CV à l’Offre',
        browseJobsCta: 'Ouvrir le Radar d’Offres & Postuler',
        emptyState: 'Aucune offre pour cette sélection — essayez Tous.',
        jobs: [
          {
            id: 'jm-coo-1',
            profile: 'coo',
            title: 'VP of Global Operations & Strategy',
            company: 'Horizon Enterprise Cloud',
            workplace: 'hybrid',
            workplaceLabel: 'Hybride',
            region: 'us_global',
            regionLabel: 'New York / Global',
            contract: 'CDI / Temps plein',
            matchScore: 96,
            matchedKeywords: ['P&L Governance', 'OKRs', 'ERP Integration']
          },
          {
            id: 'jm-coo-2',
            profile: 'coo',
            title: 'Chief Operating Officer (EMEA)',
            company: 'Atlas Logistics & Automation',
            workplace: 'remote',
            workplaceLabel: 'Télétravail',
            region: 'europe',
            regionLabel: 'Lisbonne / UE',
            contract: 'Mandat Exécutif',
            matchScore: 93,
            matchedKeywords: ['EBITDA', 'Lean Six Sigma', 'P&L Governance']
          },
          {
            id: 'jm-tech-1',
            profile: 'tech',
            title: 'Principal Distributed Systems Architect',
            company: 'Northstar Payments Corp',
            workplace: 'remote',
            workplaceLabel: 'Full Remote',
            region: 'us_global',
            regionLabel: 'USA / Remote',
            contract: 'Temps plein',
            matchScore: 97,
            matchedKeywords: ['Kubernetes', 'gRPC', 'DevSecOps']
          },
          {
            id: 'jm-tech-2',
            profile: 'tech',
            title: 'Head of Platform Engineering (Cloud)',
            company: 'EuroFin Core Systems',
            workplace: 'hybrid',
            workplaceLabel: 'Hybride',
            region: 'europe',
            regionLabel: 'Berlin / Zurich',
            contract: 'Temps plein',
            matchScore: 91,
            matchedKeywords: ['Terraform', 'TypeScript', 'Kubernetes']
          },
          {
            id: 'jm-fin-1',
            profile: 'finance',
            title: 'VP Corporate Development & M&A',
            company: 'Vanguard Capital Partners',
            workplace: 'hybrid',
            workplaceLabel: 'Hybride',
            region: 'us_global',
            regionLabel: 'New York / Londres',
            contract: 'Temps plein',
            matchScore: 95,
            matchedKeywords: ['DCF Valuation', 'M&A', 'IFRS / US GAAP']
          },
          {
            id: 'jm-fin-2',
            profile: 'finance',
            title: 'Director of FP&A & Treasury',
            company: 'Iberia Industrial Group',
            workplace: 'remote',
            workplaceLabel: 'Télétravail',
            region: 'europe',
            regionLabel: 'Madrid / Lisbonne',
            contract: 'Temps plein',
            matchScore: 92,
            matchedKeywords: ['FP&A', 'Treasury', 'IFRS / US GAAP']
          }
        ]
      },
      atsHubKicker: 'Audit & Diagnostic ATS',
      atsHubTitle: 'Audit & Simulateur en Temps Réel',
      tabHealth: 'Diagnostic du CV',
      tabSimulator: 'Simuler une Offre ATS',
      simSelectRole: 'Sélectionnez un poste de référence :',
      simRoles: {
        coo: 'Directeur des Opérations (COO)',
        tech: 'Staff Cloud Architect',
        cfo: 'VP Finance & M&A'
      },
      simCompatLabel: 'Score ATS',
      simApproved: 'Profil validé par le tri automatique',
      simRisk: 'Risque de rejet par manque de mots-clés et chiffres',
      simActionVerb: 'Verbe d’Action',
      simPresent: 'Présent',
      simMissing: 'Absent',
      simMetricLabel: 'Chiffre (%/€/$/N)',
      simQuantified: 'Quantifié',
      simNoNumbers: 'Aucun chiffre',
      simRequiredKeywords: 'Mots-clés exigés pour',
      simOptimizedLabel: 'Texte Optimisé (Formule Google XYZ) :',
      simTestLabel: 'Testez votre propre phrase ou modifiez l’exemple :',
      simResetExample: 'Réinitialiser l’exemple',
      simPlaceholder: 'Collez un paragraphe de votre CV pour mesurer la compatibilité ATS...',
      simApplyXyz: 'Appliquer Formule Google XYZ (Simuler 98%)',
      simApplyToCv: 'Appliquer à Mon CV',
      simFixInStudio: 'Corriger Mon CV au Studio',
      proofContrastKicker: 'Comparaison Directe',
      proofContrastTitle: 'D’une tâche générique à une preuve d’entretien',
      proofBeforeBadge: 'Avant · Score 38% ATS',
      proofBeforeQuote:
        '« Responsable du suivi client, de la gestion de l’équipe commerciale et des objectifs mensuels de la filiale. »',
      proofAfterBadge: 'Après (Formule Google XYZ) · 96% ATS',
      proofAfterQuote:
        '« Dirigé une équipe B2B de 18 consultants, augmentant le pipeline annuel de 4,2 M$ (+34% YoY) avec un SLA sous 2h. »',
      proofCasesKicker: 'Candidatures Réelles',
      proofCasesTitle: 'Résultats rapportés par nos abonnés en processus de recrutement',
      proofCases: [
        {
          role: 'M. Oliveira · Directeur des Opérations (Logistique · Lisbonne / Madrid)',
          detail:
            'A remplacé un CV de 4 pages par le modèle Harvard ATS en anglais et espagnol ; 4 entretiens finaux en 19 jours.'
        },
        {
          role: 'R. Tavares · Architecte Cloud Senior (Fintech · São Paulo / Remote US)',
          detail:
            'A aligné 11 compétences techniques via Radar ATS pour Workday ; passé de 44% à 96%.'
        },
        {
          role: 'C. Ferreira · Directrice Financière (Industrie · Porto / Zurich)',
          detail:
            'A exporté un CV Europass et une lettre exécutive bilingue directement en Word (.docx).'
        }
      ],
      templatesKicker: 'Normes Internationales',
      templatesTitle: 'Modèles Calibrés pour Chaque Marché',
      templatesSubtitle:
        'Chaque mise en page respecte les exigences américaines, européennes et des postes de direction.',
      filterAll: 'Tous',
      filterNoPhoto: 'Sans Photo · ATS',
      filterWithPhoto: 'Avec Photo · Europe',
      badgeWithPhoto: 'Avec Photo',
      badgeNoPhotoAts: 'Sans Photo · ATS',
      previewFreePrefix: 'Aperçu gratuit',
      useModel: 'Utiliser ce modèle',
      showLessModels: 'Afficher moins',
      viewAllModelsPrefix: 'Voir les',
      viewAllModelsSuffix: 'modèles disponibles',
      openTemplateAdvisor: 'Ouvrir le Conseiller de Modèles',
      pricingKicker: 'Tarifs Transparents',
      pricingTitle: 'Choisissez la formule adaptée à votre recherche',
      pricingSubtitle:
        'Accès complet à l’éditeur, traduction en 5 langues et export Word/PDF. Paiement par Carte ou Pix.',
      freeTierName: 'Gratuit',
      freeTierTag: 'Découverte',
      freeTierPriceUnit: '/ toujours',
      freeTierDesc: 'Aperçu A4 des modèles et diagnostic ATS initial avant abonnement.',
      freeTierFeatures: [
        'Galerie complète de modèles CV & Lettre',
        'Diagnostic de santé du CV en direct',
        'Conseiller de format par pays et secteur'
      ],
      freeTierCta: 'Explorer Gratuitement',
      proDefaultName: 'Professionnel Pro',
      proPopularBadge: 'Le Plus Choisi',
      proFeatures: [
        'CV, variantes et sauvegarde illimités dans le cloud',
        'Export 1:1 en Word (.docx) et PDF A4 sans filigrane',
        'Traduction complète du CV et lettre en 5 langues',
        'Radar ATS & Optimiseur d’Impact (XYZ)'
      ],
      proCtaPrefix: 'Choisir',
      execDefaultName: 'Exécutif VIP',
      execBadge: 'Direction & Global',
      execFeatures: [
        'Tout le forfait Professionnel Pro',
        'Modèles C-Level, Harvard Executive & ONU',
        'Simulateur d’entretien voix/texte avec notation STAR',
        'Audit LinkedIn & support prioritaire'
      ],
      execCtaPrefix: 'Choisir',
      equivalentPrefix: 'Équivalent :',
      equivalentMonthlyPrefix: 'Soit',
      fullAccessForDaysPrefix: 'Accès complet pendant',
      daysSuffix: 'jours',
      includesStarAndCLevel: 'Inclut Simulateur STAR et Modèles Direction',
      roiKicker: 'Retour sur Investissement',
      roiTitle: 'Cabinet de Conseil vs. Resume2Job',
      roiSavings: 'Économisez jusqu’à 95% par rapport aux agences de carrière',
      roiAgencyTitle: 'Cabinet / Rédacteur Traditionnel',
      roiAgencyPrice: '150 $ – 400 $ / dossier',
      roiAgencyPoints: [
        '• Délai moyen de 5 à 10 jours ouvrés par version',
        '• Supplément facturé pour adapter le CV à chaque offre',
        '• Traduction en anglais facturée à part (+80 $)',
        '• Aucun score ATS en direct ni simulateur d’entretien'
      ],
      roiPlatformTitle: 'Resume2Job (Pro & VIP)',
      roiPlatformPricePrefix: 'À partir de',
      roiPlatformPoints: [
        '• Création et export Word (.docx) & PDF en moins de 5 min',
        '• Variantes illimitées adaptées à chaque offre dans le cloud',
        '• Traduction intégrale en 5 langues + Lettre incluses',
        '• Radar ATS, Formule XYZ et offres compatibles en direct'
      ],
      trustNoLockIn: 'Sans engagement : résiliez en 1 clic',
      trustEditableDocx: 'Fichiers Word (.docx) 100% modifiables après téléchargement',
      trustCardPix: 'Carte Internationale (PCI-DSS) ou Pix (BRL)',
      trustStartNow: 'Commencer maintenant',
      matrixTitle: 'Comparatif Détaillé des Fonctionnalités',
      matrixSubtitle: 'Tous les forfaits sans engagement',
      matrixCapabilityCol: 'Fonctionnalité',
      matrixFreeCol: 'Gratuit',
      matrixProCol: 'Professionnel Pro',
      matrixExecCol: 'Exécutif VIP',
      matrixRows: [
        { feature: 'Aperçu A4 en direct de tous les modèles', free: true, pro: true, exec: true },
        { feature: 'Import structuré LinkedIn, PDF et Word', free: false, pro: true, exec: true },
        { feature: 'Export natif Word (.docx) et PDF A4 propre', free: false, pro: true, exec: true },
        { feature: 'Traduction complète CV + Lettre (PT, EN, ES, FR, DE)', free: false, pro: true, exec: true },
        { feature: 'Radar ATS Sémantique & Optimiseur Google XYZ', free: false, pro: true, exec: true },
        { feature: 'Modèles Harvard Exécutif, C-Level & ONU', free: false, pro: false, exec: true },
        { feature: 'Simulateur d’entretien voix/texte méthode STAR', free: false, pro: false, exec: true }
      ],
      faqTitle: 'Questions Fréquentes',
      faqRightNote: 'Paiements sécurisés par Carte & Pix',
      faqs: [
        {
          q: 'Comment fonctionnent les paiements par Carte et Pix ?',
          a: 'Nous acceptons les cartes bancaires internationales (Visa, Mastercard, Apple Pay, Google Pay) ainsi que Pix (BRL) par QR Code.'
        },
        {
          q: 'Le CV passe-t-il réellement les robots ATS (Workday, Taleo, Greenhouse) ?',
          a: 'Oui. Nos modèles stricts utilisent une structure linéaire à colonne unique sans blocs flottants qui perturbent l’OCR.'
        },
        {
          q: 'Le fichier Word (.docx) conserve-t-il exactement la mise en page du site ?',
          a: 'Oui. La génération native OpenXML (.docx) préserve marges A4, polices, rubriques et couleurs.'
        },
        {
          q: 'La traduction du document traduit-elle aussi mon propre texte ?',
          a: 'Oui. Dans le studio, changer la langue du document entre 5 langues traduit intégralement vos expériences tout en préservant les sigles.'
        },
        {
          q: 'Puis-je annuler ou changer de formule à tout moment ?',
          a: 'Oui, directement depuis votre Espace Compte, sans frais ni engagement.'
        }
      ],
      closingKicker: 'Prêt en Moins de 5 Minutes',
      closingTitle: 'Envoyez votre prochaine candidature au format A4 avec plus de 95% de score ATS',
      closingSubtitle:
        'Importez votre PDF ou profil LinkedIn, optimisez vos réalisations et téléchargez le pack Word (.docx) + PDF.',
      closingCtaBuild: 'Créer Mon CV',
      closingCtaExamples: 'Voir les Exemples',
      footerRights: 'Tous droits réservés.'
    },
    health: {
      subtitle: 'Audit instantané des 6 critères exigés par Workday, Taleo, Greenhouse et Lever.',
      myResumeBtn: 'Mon CV',
      benchmarkBtn: 'Référence 98%',
      globalAtsIndex: 'Indice ATS Global',
      gradePrefix: 'Note',
      tierApprovedLabel: 'Prêt pour ATS & Entretiens',
      tierApprovedDesc: 'Structure compatible avec Workday, Greenhouse, Taleo et les recruteurs.',
      tierCompetitiveLabel: 'Compétitif · Ajustements mineurs',
      tierCompetitiveDesc: 'Bonne base ; renforcez mots-clés et chiffres pour atteindre 90%+.',
      tierWarningLabel: 'Attention · Lacunes structurelles',
      tierWarningDesc: 'Risque modéré de filtrage automatique avant lecture humaine.',
      tierCriticalLabel: 'Critique · Champs essentiels vides',
      tierCriticalDesc: 'Complétez coordonnées, réalisations chiffrées et compétences.',
      optimizedSuffix: 'optimisées',
      adjustSuffix: 'à affiner',
      missingSuffix: 'manquantes',
      openInEditor: 'Ouvrir dans l’Éditeur',
      fixInEditor: 'Corriger dans l’Éditeur'
    },
    showcase: {
      modes: {
        'models-cv': {
          tabLabel: 'Modèles de CV',
          kicker: 'Galerie Visuelle de Modèles',
          title: 'Modèles de CV Professionnels',
          subtitle: 'Prévisualisez chaque mise en page en taille réelle avant de créer votre compte.'
        },
        'examples-cv': {
          tabLabel: 'Exemples de CV',
          kicker: 'Exemples Réels par Métier',
          title: 'Exemples de CV Complets',
          subtitle: 'Inspirez-vous de CV réels structurés avec des indicateurs de performance.'
        },
        'models-cover': {
          tabLabel: 'Modèles de Lettre',
          kicker: 'Galerie de Lettres de Motivation',
          title: 'Modèles de Lettre de Motivation',
          subtitle: 'Lettres A4 assorties à votre modèle de CV, consultables gratuitement.'
        },
        'examples-cover': {
          tabLabel: 'Exemples de Lettre',
          kicker: 'Modèles Prêts à Adapter',
          title: 'Exemples de Lettre de Motivation',
          subtitle: 'Textes persuasifs par secteur et séniorité pour candidatures ciblées.'
        }
      },
      searchPlaceholder: 'Rechercher un poste, modèle ou pays...',
      allSectors: 'Tous les Secteurs',
      allModels: 'Tous',
      noPhotoAts: 'Sans Photo · ATS',
      withPhotoEu: 'Avec Photo · Europe',
      previewFreeBadge: 'Aperçu Gratuit',
      inspectBtn: 'Prévisualiser',
      useBtn: 'Utiliser au Studio',
      unlockAccessBtn: 'Débloquer l’Accès',
      emptyState: 'Aucun résultat ne correspond à vos filtres.',
      clearFilters: 'Réinitialiser'
    },
    auth: {
      kicker: 'Accès Compte',
      loginTitle: 'Connexion à la Plateforme',
      registerTitle: 'Créer un Compte',
      forgotTitle: 'Réinitialiser le Mot de passe',
      loginSubtitle: 'Accédez à vos CV enregistrés, simulations et rapports ATS.',
      registerSubtitle: 'Inscrivez-vous pour sauvegarder vos CV dans le cloud.',
      forgotSubtitle: 'Récupérez l’accès à votre compte en toute sécurité.',
      tabLogin: 'Connexion',
      tabRegister: 'Créer un Compte',
      googleBtn: 'Continuer avec Google',
      googleLoading: 'Connexion à Google...',
      dividerOr: 'ou avec e-mail et mot de passe',
      fullNameLabel: 'Nom Complet',
      fullNamePlaceholder: 'Ex : Claire Moreau',
      targetRoleLabel: 'Poste Visé / Domaine',
      targetRolePlaceholder: 'Ex : Directrice des Opérations, Tech Lead',
      emailLabel: 'Adresse E-mail',
      emailPlaceholder: 'nom@entreprise.com',
      passwordLabel: 'Mot de passe',
      passwordPlaceholder: 'Minimum 6 caractères',
      confirmPasswordLabel: 'Confirmer le Mot de passe',
      confirmPasswordPlaceholder: 'Répétez le mot de passe',
      rememberMe: 'Rester connecté',
      forgotPasswordLink: 'Mot de passe oublié ?',
      termsPrefix: 'J’accepte les',
      termsService: 'Conditions d’Utilisation',
      termsAnd: 'et la',
      termsPrivacy: 'Politique de Confidentialité',
      termsSuffix: 'conformes au RGPD.',
      submitLogin: 'Se Connecter',
      submitRegister: 'Créer le Compte',
      submitForgot: 'Envoyer le Lien',
      submitResetConfirm: 'Confirmer le Nouveau Mot de passe',
      processing: 'Traitement...',
      backToLogin: 'Retour à la Connexion',
      registerReassurance: 'Sauvegarde cloud · Modèles Harvard, ATS & Europass · Sans engagement.',
      loginReassurance: 'Session chiffrée avec sauvegarde automatique de vos versions.'
    },
    gate: {
      yourPlan: 'Votre Forfait',
      visitor: 'Visiteur',
      free: 'Gratuit',
      whatsIncluded: 'Inclus dans cet outil :',
      signInOrCreate: 'Connexion / Inscription',
      seePlans: 'Voir les Tarifs',
      activatePrefix: 'Activer',
      trustFooter: 'Activation immédiate par Carte ou Pix · Exports Word (.docx) et PDF illimités · Sans engagement'
    },
    pricing: {
      modalTitle: 'Tarifs & Activation d’Abonnement',
      modalSubtitle: 'Export Word (.docx), Radar ATS et traduction en 5 langues par Carte ou Pix sans engagement.',
      subscriberBannerTitle: 'Fonctionnalité Réservée aux Abonnés',
      subscriberBannerBadge: 'Forfait Actif Requis',
      currencyLabel: 'Devise :',
      currentPlanBtn: 'Forfait Actuel',
      selectedPlanBtn: 'Forfait Sélectionné',
      summaryTitle: 'Résumé & Paiement',
      summarySubtitle: 'Activation immédiate par Carte (Stripe PCI-DSS) ou Pix QR Code. Sans engagement.',
      quickAuthTitle: 'Étape Rapide : Identifiez votre Compte',
      quickAuthSubtitle: 'Créez votre compte gratuit en quelques secondes pour lier votre abonnement et exporter en Word (.docx).',
      quickAuthCreate: 'Créer un Compte',
      quickAuthSignIn: 'Connexion',
      couponLabel: 'Vous avez un Code Promo ?',
      couponPlaceholder: 'Entrez votre code',
      couponApply: 'Appliquer',
      couponApplying: 'Validation...',
      couponRemove: 'Retirer',
      activePromosLabel: 'Offres actives :',
      selectPaymentLabel: 'Choisissez le Moyen de Paiement :',
      cardMethodTitle: 'Carte Bancaire (Crédit / Débit)',
      cardMethodDesc: 'Visa, Mastercard, Apple Pay & Google Pay',
      pixMethodTitle: 'Pix (BRL)',
      payCardBtnPrefix: 'Payer par Carte',
      payCheckoutBtnPrefix: 'Continuer vers le Paiement',
      payPixBtnPrefix: 'Envoyer Justificatif Pix',
      payFreeCouponBtn: 'Activer Gratuitement (Coupon 100%)',
      processing: 'Traitement en cours...',
      noLockInNote: 'Paiement sécurisé avec activation immédiate dès validation.',
      guaranteedAccessPrefix: 'Accès garanti pendant'
    },
    app: {
      previewGuestNotice:
        'Mode Aperçu : Prévisualisation A4. L’édition, l’importation et les exports CV / PDF propres requièrent un forfait Pro ou Exécutif VIP.',
      previewFreeNotice:
        'Forfait Gratuit : Aperçu A4. L’édition des champs et les téléchargements CV / PDF sans filigrane requièrent un abonnement actif.',
      createAccountBtn: 'Créer un Compte',
      activateProBtn: 'Activer Forfait Pro',
      mobileEditorTab: 'Éditeur & Outils',
      mobileViewA4Cv: 'Voir CV A4',
      mobileViewA4Cover: 'Voir Lettre A4',
      studioTabCv: 'CV',
      studioTabCover: 'Lettre',
      studioTabAts: 'Radar ATS',
      studioTabJobs: 'Offres',
      studioTabAi: 'Optimiser IA',
      studioTabImport: 'Importer',
      bottomHome: 'Accueil',
      bottomEditor: 'Éditeur',
      bottomCover: 'Lettre',
      bottomViewA4: 'Voir A4'
    }
  },
  de: {
    brandName: 'Resume2Job',
    billingCycles: {
      monthly: { label: 'Monatlich', shortUnit: 'Monat' },
      quarterly: { label: 'Vierteljährlich', shortUnit: 'Quartal' },
      semiannual: { label: 'Halbjährlich', shortUnit: '6 Mon.' },
      yearly: { label: 'Jährlich', shortUnit: 'Jahr' }
    },
    header: {
      navHome: 'Startseite',
      navModelsExamples: 'Vorlagen & Beispiele',
      navEditor: 'Lebenslauf-Editor',
      navTools: 'Tools',
      navPricing: 'Preise',
      showcaseCvHeader: 'Lebensläufe (Freie Vorschau)',
      showcaseModelsCv: 'CV-Vorlagen',
      showcaseModelsCvDesc: '40+ A4-Layouts: ATS, Harvard, Finance, Product & Europass',
      showcaseExamplesCv: 'CV-Beispiele',
      showcaseExamplesCvDesc: 'Vollständige Lebensläufe nach Beruf & Branche',
      showcaseCoverHeader: 'Anschreiben',
      showcaseModelsCover: 'Anschreiben-Vorlagen',
      showcaseModelsCoverDesc: 'Formelle und moderne A4-Layouts',
      showcaseExamplesCover: 'Anschreiben-Beispiele',
      showcaseExamplesCoverDesc: 'Fertige Vorlagen für Karriere & Quereinstieg',
      toolsDocsHeader: 'Dokumente & Formate',
      toolCover: 'Anschreiben',
      toolCoverDesc: 'A4-Editor + Erstellung & 5-Sprachen-Übersetzung',
      toolAdvisor: 'Internationale Vorlagen',
      toolAdvisorDesc: 'Harvard, Strikt-ATS, Wall Street, Europass & Tech',
      toolsAnalysisHeader: 'Analyse & Optimierung',
      toolRaw: 'Daten & LinkedIn importieren',
      toolRawDesc: 'Struktur aus PDF, Word oder Text extrahieren',
      toolAts: 'ATS-Radar & Keywords',
      toolAtsDesc: 'Profil mit Stellenanforderungen abgleichen',
      toolJobs: 'Passende Jobs (Radar)',
      toolJobsDesc: 'Live-Stellenangebote passend zu Ihrem CV',
      toolAi: 'Impact-Optimierer (XYZ)',
      toolAiDesc: 'Erfolge mit messbaren Kennzahlen formulieren',
      toolInterview: 'Interview-Simulator',
      toolInterviewDesc: 'Fachfragen und STAR-Bewertung',
      siteLangLabel: 'Website-Sprache',
      siteLangHint: 'Nur Oberfläche (lässt Ihren CV unverändert)',
      currencyLabel: 'Währung',
      notificationsTitle: 'Systembenachrichtigungen',
      markAllRead: 'Alle gelesen',
      noNotifications: 'Keine aktuellen Benachrichtigungen. Exporte und Übersetzungen erscheinen hier.',
      configureNotifs: 'Benachrichtigungseinstellungen',
      newBadge: 'Neu',
      notifSystem: 'System',
      notifEmailSent: 'E-Mail Gesendet',
      notifEmailQueued: 'E-Mail Vorgemerkt',
      myResumes: 'Meine Lebensläufe',
      myProfile: 'Mein Profil & Zugang',
      subscriptionInvoices: 'Abo & Rechnungen',
      notifPreferences: 'Einstellungen & Hinweise',
      managePlan: 'Tarif verwalten',
      adminPanel: 'Admin-Dashboard',
      signOut: 'Abmelden',
      signIn: 'Anmelden',
      downloadCoverShort: 'Brief',
      downloadWordShort: 'CV laden',
      downloadCover: 'Anschreiben laden',
      downloadWord: 'Lebenslauf laden',
      exporting: 'Wird erstellt...',
      mobileWorkspace: 'Arbeitsbereich',
      mobileShowcaseTitle: 'Vorlagen & Beispiele (Gratis)',
      mobileToolsTitle: 'Tools & Analyse',
      mobileMyResumes: 'Meine CVs',
      mobileMyAccount: 'Mein Konto',
      mobileSignInRegister: 'Anmelden / Registrieren'
    },
    landing: {
      heroKicker: 'KI-Bewerbungsanpassung · ATS-Score · PDF & Word',
      heroTitle: 'KI, die Ihren Lebenslauf automatisch an jede Stelle anpasst und Ihre Einladungsquote steigert.',
      heroSubtitle:
        'Stellenlink einfügen, sofort ATS-Score prüfen und Profil, Erfolge sowie Keywords per 1-Klick anpassen — direkt als PDF oder Word.',
      ctaBuild: 'CV mit KI anpassen',
      ctaExploreModels: '40+ Vorlagen ansehen',
      ctaMatchJobs: 'Jobs nach Profil filtern',
      linkCvModels: 'CV-Vorlagen',
      linkRealExamples: 'Praxisbeispiele',
      linkCoverModels: 'Anschreiben-Vorlagen',
      linkPlansStarting: 'Tarife ab',
      perMonth: '/Monat',
      cardAndPix: 'Karte & Pix',
      atsCompatPrefix: 'Kompatibilität',
      editThisModel: 'Vorlage bearbeiten',
      metrics: [
        { value: '98.7%', label: 'Sauberes Parsing in ATS-Systemen' },
        { value: '40+ Vorlagen', label: 'ATS, Modern, Harvard, Tech & EU' },
        { value: 'Live-Match', label: 'Jobs direkt aus Ihrem CV gefiltert' },
        { value: '5 Sprachen', label: 'EN · PT · ES · FR · DE per Klick' }
      ],
      deliverables: [
        { code: 'A4 CV', text: '40+ ATS- & Executive-Layouts im A4-Maßstab' },
        { code: 'JOB MATCH', text: 'Stellen gefiltert nach Profil, Region & Remote' },
        { code: '1-KLICK-FIT', text: 'Keywords im CV direkt auf die Stelle abstimmen' },
        { code: '5x SPRACHE', text: 'Komplettübersetzung ohne Layoutverlust' },
        { code: 'WORD 1:1', text: 'Editierbare .docx- & saubere PDF-Datei' }
      ],
      archKicker: 'Durchgängiger Bewerbungsprozess',
      archTitle: 'Vom Lebenslauf zur gezielten Bewerbung in vier Schritten',
      archDesc:
        'ATS-konforme Lebenslauferstellung, profilbasiertes Job-Matching, präzise Filter und sofortige Anpassung auf jede Stellenanzeige.',
      archSteps: [
        {
          num: '01',
          title: 'ATS-CV erstellen oder importieren',
          desc: 'Wählen Sie aus über 40 einspaltigen Formaten (Workday, Greenhouse, Taleo) oder importieren Sie PDF/LinkedIn.'
        },
        {
          num: '02',
          title: 'Job-Matching nach CV-Profil',
          desc: 'Unser Radar gleicht Titel, Seniorität und Skills automatisch mit aktuellen Stellenangeboten ab.'
        },
        {
          num: '03',
          title: 'Filtern & per Klick anpassen',
          desc: 'Filtern Sie nach Remote, Hybrid, Region oder Vertragsart und ergänzen Sie fehlende Keywords per XYZ-Formel.'
        },
        {
          num: '04',
          title: 'Exportieren & direkt bewerben',
          desc: 'Laden Sie exakte Word (.docx), PDFs und übersetzte Anschreiben in 5 Sprachen direkt herunter.'
        }
      ],
      jobMatch: {
        kicker: 'Profilbasierte Jobsuche & Smarte Filter',
        title: 'Ihr Lebenslauf findet und filtert passende Stellen automatisch',
        subtitle:
          'Wechseln Sie das CV-Profil und testen Sie Filter nach Arbeitsmodell und Region, um den Echtzeit-Abgleich Ihrer Skills zu sehen.',
        profileLabel: 'Aktives CV-Profil:',
        profiles: [
          {
            id: 'coo',
            label: 'COO & Global Ops',
            headline: 'Alexander Mendes · 12+ Jahre · $35M+ P&L · Digitale Transformation & M&A',
            skills: ['P&L Governance', 'EBITDA', 'ERP Integration', 'OKRs', 'Lean Six Sigma']
          },
          {
            id: 'tech',
            label: 'Staff Cloud Architect',
            headline: 'Lead Software Architect · 8+ Jahre · AWS/GCP · Kubernetes & FinTech',
            skills: ['Kubernetes', 'TypeScript', 'gRPC', 'Terraform', 'DevSecOps']
          },
          {
            id: 'finance',
            label: 'VP Finance & M&A',
            headline: 'Beatriz Fonseca · CFA · €140M M&A · IFRS / US GAAP & Treasury',
            skills: ['DCF Valuation', 'IFRS / US GAAP', 'M&A', 'FP&A', 'Treasury']
          }
        ],
        workplaceFilters: { all: 'Alle Arbeitsmodelle', remote: 'Remote', hybrid: 'Hybrid' },
        regionFilters: { all: 'Alle Regionen', us_global: 'USA & Global', europe: 'Europa' },
        matchSuffix: 'Match',
        keywordsMatchedLabel: 'Erkannte CV-Kompetenzen:',
        tailorCta: 'CV auf Stelle abstimmen',
        browseJobsCta: 'Job-Radar öffnen & bewerben',
        emptyState: 'Keine Treffer für diese Filterkombination — wählen Sie Alle.',
        jobs: [
          {
            id: 'jm-coo-1',
            profile: 'coo',
            title: 'VP of Global Operations & Strategy',
            company: 'Horizon Enterprise Cloud',
            workplace: 'hybrid',
            workplaceLabel: 'Hybrid',
            region: 'us_global',
            regionLabel: 'New York / Global',
            contract: 'Vollzeit',
            matchScore: 96,
            matchedKeywords: ['P&L Governance', 'OKRs', 'ERP Integration']
          },
          {
            id: 'jm-coo-2',
            profile: 'coo',
            title: 'Chief Operating Officer (EMEA)',
            company: 'Atlas Logistics & Automation',
            workplace: 'remote',
            workplaceLabel: 'Remote',
            region: 'europe',
            regionLabel: 'Lissabon / EU',
            contract: 'Executive Mandat',
            matchScore: 93,
            matchedKeywords: ['EBITDA', 'Lean Six Sigma', 'P&L Governance']
          },
          {
            id: 'jm-tech-1',
            profile: 'tech',
            title: 'Principal Distributed Systems Architect',
            company: 'Northstar Payments Corp',
            workplace: 'remote',
            workplaceLabel: 'Global Remote',
            region: 'us_global',
            regionLabel: 'USA / Remote',
            contract: 'Vollzeit',
            matchScore: 97,
            matchedKeywords: ['Kubernetes', 'gRPC', 'DevSecOps']
          },
          {
            id: 'jm-tech-2',
            profile: 'tech',
            title: 'Head of Platform Engineering (Cloud)',
            company: 'EuroFin Core Systems',
            workplace: 'hybrid',
            workplaceLabel: 'Hybrid',
            region: 'europe',
            regionLabel: 'Berlin / Zürich',
            contract: 'Vollzeit',
            matchScore: 91,
            matchedKeywords: ['Terraform', 'TypeScript', 'Kubernetes']
          },
          {
            id: 'jm-fin-1',
            profile: 'finance',
            title: 'VP Corporate Development & M&A',
            company: 'Vanguard Capital Partners',
            workplace: 'hybrid',
            workplaceLabel: 'Hybrid',
            region: 'us_global',
            regionLabel: 'New York / London',
            contract: 'Vollzeit',
            matchScore: 95,
            matchedKeywords: ['DCF Valuation', 'M&A', 'IFRS / US GAAP']
          },
          {
            id: 'jm-fin-2',
            profile: 'finance',
            title: 'Director of FP&A & Treasury',
            company: 'Iberia Industrial Group',
            workplace: 'remote',
            workplaceLabel: 'Remote',
            region: 'europe',
            regionLabel: 'Madrid / Lissabon',
            contract: 'Vollzeit',
            matchScore: 92,
            matchedKeywords: ['FP&A', 'Treasury', 'IFRS / US GAAP']
          }
        ]
      },
      atsHubKicker: 'ATS-Audit & Diagnose',
      atsHubTitle: 'Echtzeit-ATS-Audit & Simulator',
      tabHealth: 'CV-Diagnose',
      tabSimulator: 'ATS-Stelle simulieren',
      simSelectRole: 'Referenzposition wählen:',
      simRoles: {
        coo: 'Chief Operating Officer (COO)',
        tech: 'Staff Cloud Architect',
        cfo: 'VP Finance & M&A'
      },
      simCompatLabel: 'ATS-Übereinstimmung',
      simApproved: 'Profil besteht automatische Vorauswahl',
      simRisk: 'Risiko der Aussortierung wegen fehlender Keywords & Zahlen',
      simActionVerb: 'Aktionsverb',
      simPresent: 'Vorhanden',
      simMissing: 'Fehlt',
      simMetricLabel: 'Kennzahl (%/€/$/N)',
      simQuantified: 'Quantifiziert',
      simNoNumbers: 'Keine Zahlen',
      simRequiredKeywords: 'Geforderte Keywords für',
      simOptimizedLabel: 'Optimierter Punkt (Google-XYZ-Formel):',
      simTestLabel: 'Testen Sie hier Ihren eigenen Satz oder passen Sie das Beispiel an:',
      simResetExample: 'Beispiel zurücksetzen',
      simPlaceholder: 'Fügen Sie einen Absatz aus Ihrem Lebenslauf ein, um den ATS-Wert zu prüfen...',
      simApplyXyz: 'Google-XYZ-Formel anwenden (98% simulieren)',
      simApplyToCv: 'In Meinen CV übernehmen',
      simFixInStudio: 'CV im Studio optimieren',
      proofContrastKicker: 'Direkter Vergleich',
      proofContrastTitle: 'Von passiven Aufgaben zum überzeugenden Interview-Argument',
      proofBeforeBadge: 'Vorher · 38% ATS-Score',
      proofBeforeQuote:
        '„Verantwortlich für Kundenbetreuung, Führung des Vertriebsteams und Kontrolle monatlicher Niederlassungsziele.“',
      proofAfterBadge: 'Nachher (Google-XYZ-Formel) · 96% ATS',
      proofAfterQuote:
        '„Leitete ein 18-köpfiges B2B-Vertriebsteam, steigerte die Jahres-Pipeline um $4.2M (+34% YoY) bei unter 2h Reaktionszeit.“',
      proofCasesKicker: 'Bewerbungen in der Praxis',
      proofCasesTitle: 'Berichtete Ergebnisse von Abonnenten in laufenden Verfahren',
      proofCases: [
        {
          role: 'M. Oliveira · Operations Director (Logistik · Lissabon / Madrid)',
          detail:
            'Ersetzte einen 4-seitigen CV durch das Harvard-ATS-Format auf Englisch & Spanisch; 4 Finalrunden in 19 Tagen.'
        },
        {
          role: 'R. Tavares · Senior Cloud Architect (Fintech · São Paulo / US Remote)',
          detail:
            'Optimizierte 11 Tech-Skills mit dem ATS-Radar für Workday; steigerte den Match von 44% auf 96%.'
        },
        {
          role: 'C. Ferreira · Finance Manager (Industrie · Porto / Zürich)',
          detail:
            'Erstellte zweisprachigen Europass-CV und Executive-Anschreiben direkt als Word (.docx).'
        }
      ],
      templatesKicker: 'Internationale Standards',
      templatesTitle: 'Vorlagen für Jeden Arbeitsmarkt',
      templatesSubtitle:
        'Jedes Layout folgt exakt den Standards der USA, Europas und internationaler Führungspositionen.',
      filterAll: 'Alle',
      filterNoPhoto: 'Ohne Foto · ATS',
      filterWithPhoto: 'Mit Foto · Europa',
      badgeWithPhoto: 'Mit Foto',
      badgeNoPhotoAts: 'Ohne Foto · ATS',
      previewFreePrefix: 'Kostenlos ansehen',
      useModel: 'Vorlage nutzen',
      showLessModels: 'Weniger anzeigen',
      viewAllModelsPrefix: 'Alle',
      viewAllModelsSuffix: 'Vorlagen anzeigen',
      openTemplateAdvisor: 'Vorlagen-Berater öffnen',
      pricingKicker: 'Transparente Preise',
      pricingTitle: 'Wählen Sie den passenden Tarif für Ihre Bewerbung',
      pricingSubtitle:
        'Voller Zugang zu Editor, 5-Sprachen-Übersetzung und nativem Word/PDF-Export per Karte oder Pix.',
      freeTierName: 'Kostenlos',
      freeTierTag: 'Entdecken',
      freeTierPriceUnit: '/ dauerhaft',
      freeTierDesc: 'A4-Vorschau aller Vorlagen und erste ATS-Diagnose vor dem Abo.',
      freeTierFeatures: [
        'Komplette Galerie für CV- & Anschreiben-Vorlagen',
        'Live-Auswertung der Lebenslauf-Qualität',
        'Vorlagen-Berater nach Land und Branche'
      ],
      freeTierCta: 'Gratis entdecken',
      proDefaultName: 'Professional Pro',
      proPopularBadge: 'Am beliebtesten',
      proFeatures: [
        'Unbegrenzte Lebensläufe, Versionen & Cloud-Speicher',
        '1:1 Export als Word (.docx) & sauberes A4-PDF',
        'Vollständige Übersetzung von CV & Brief in 5 Sprachen',
        'ATS-Radar & Impact-Optimierer (XYZ)'
      ],
      proCtaPrefix: 'Abonnieren:',
      execDefaultName: 'Executive VIP',
      execBadge: 'C-Level & Global',
      execFeatures: [
        'Alles aus Professional Pro inklusive',
        'Executive-, Harvard- & UN-Diplomatie-Vorlagen',
        'Sprach-/Text-Interview-Simulator mit STAR-Bewertung',
        'LinkedIn-Audit & Prioritäts-Support'
      ],
      execCtaPrefix: 'Abonnieren:',
      equivalentPrefix: 'Entspricht:',
      equivalentMonthlyPrefix: 'Entspricht',
      fullAccessForDaysPrefix: 'Voller Zugriff für',
      daysSuffix: 'Tage',
      includesStarAndCLevel: 'Inkl. STAR-Simulator & C-Level-Vorlagen',
      roiKicker: 'Wirtschaftlichkeit',
      roiTitle: 'Klassische Karriereberatung vs. Resume2Job',
      roiSavings: 'Sparen Sie bis zu 95% gegenüber Bewerbungsagenturen',
      roiAgencyTitle: 'Klassische Agentur / Ghostwriter',
      roiAgencyPrice: '$150 – $400 / Auftrag',
      roiAgencyPoints: [
        '• Ø 5 bis 10 Werktage Bearbeitungszeit pro Version',
        '• Zusatzkosten für Anpassungen an neue Stellenanzeigen',
        '• Übersetzung ins Englische wird separat berechnet (+$80)',
        '• Kein Live-ATS-Score und kein Interview-Training'
      ],
      roiPlatformTitle: 'Resume2Job (Pro & VIP)',
      roiPlatformPricePrefix: 'Ab',
      roiPlatformPoints: [
        '• Erstellung & Word (.docx) / PDF-Export in unter 5 Min.',
        '• Unbegrenzte Versionen für jede Bewerbung in der Cloud',
        '• 5-Sprachen-Übersetzung + Anschreiben inklusive',
        '• Live-ATS-Radar, Google XYZ & passende Jobs'
      ],
      trustNoLockIn: 'Keine Bindung: Kündigung mit 1 Klick',
      trustEditableDocx: '100% editierbare Word-Dateien (.docx) nach Download',
      trustCardPix: 'Internationale Karte (PCI-DSS) oder Pix (BRL)',
      trustStartNow: 'Jetzt starten',
      matrixTitle: 'Detaillierter Funktionsvergleich',
      matrixSubtitle: 'Alle Tarife jederzeit kündbar',
      matrixCapabilityCol: 'Funktion',
      matrixFreeCol: 'Kostenlos',
      matrixProCol: 'Professional Pro',
      matrixExecCol: 'Executive VIP',
      matrixRows: [
        { feature: 'Live-A4-Vorschau aller Vorlagen', free: true, pro: true, exec: true },
        { feature: 'Strukturierter LinkedIn-, PDF- & Word-Import', free: false, pro: true, exec: true },
        { feature: 'Nativer Word (.docx) & A4-PDF-Export ohne Wasserzeichen', free: false, pro: true, exec: true },
        { feature: 'Komplettübersetzung CV + Brief (PT, EN, ES, FR, DE)', free: false, pro: true, exec: true },
        { feature: 'Semantischer ATS-Radar & Google-XYZ-Optimierer', free: false, pro: true, exec: true },
        { feature: 'Harvard Executive, C-Level & UN-Vorlagen', free: false, pro: false, exec: true },
        { feature: 'Sprach-/Text-Interview-Simulator (STAR)', free: false, pro: false, exec: true }
      ],
      faqTitle: 'Häufige Fragen',
      faqRightNote: 'Sichere Zahlung per Karte & Pix',
      faqs: [
        {
          q: 'Wie funktionieren Zahlungen per Karte und Pix?',
          a: 'Wir akzeptieren internationale Kredit-/Debitkarten sowie Pix (BRL) per QR-Code.'
        },
        {
          q: 'Besteht der Lebenslauf wirklich ATS-Systeme wie Workday, Taleo oder Greenhouse?',
          a: 'Ja. Unsere strengen ATS-Layouts nutzen einspaltige lineare Struktur ohne komplexe Textboxen.'
        },
        {
          q: 'Behält die Word-Datei (.docx) exakt das Layout der Website?',
          a: 'Ja. Unsere native OpenXML-Kompilierung (.docx) erhält A4-Ränder, Schriften, Rubriken und Farben.'
        },
        {
          q: 'Übersetzt die Dokument-Übersetzung auch meine eigenen Texte?',
          a: 'Ja. Im Studio übersetzt der Dokument-Sprachumschalter Rubriken und komplette Erfahrungen in 5 Sprachen.'
        },
        {
          q: 'Kann ich jederzeit kündigen oder wechseln?',
          a: 'Ja, direkt in Ihrem Kontobereich ohne Fristen oder Gebühren.'
        }
      ],
      closingKicker: 'In unter 5 Minuten startklar',
      closingTitle: 'Senden Sie Ihre nächste Bewerbung im A4-Format mit über 95% ATS-Score',
      closingSubtitle:
        'Importieren Sie Ihren bisherigen Lebenslauf, schärfen Sie Ihre Erfolge und exportieren Sie Word (.docx) & PDF.',
      closingCtaBuild: 'Lebenslauf erstellen',
      closingCtaExamples: 'Beispiele ansehen',
      footerRights: 'Alle Rechte vorbehalten.'
    },
    health: {
      subtitle: 'Sofort-Check der 6 Kriterien von Workday, Taleo, Greenhouse und Lever.',
      myResumeBtn: 'Mein Lebenslauf',
      benchmarkBtn: '98%-Referenz',
      globalAtsIndex: 'Globaler ATS-Index',
      gradePrefix: 'Note',
      tierApprovedLabel: 'Bereit für ATS & Interviews',
      tierApprovedDesc: 'Struktur kompatibel mit Workday, Greenhouse, Taleo und Executive-Screening.',
      tierCompetitiveLabel: 'Wettbewerbsfähig · Feinschliff',
      tierCompetitiveDesc: 'Solide Basis; stärken Sie Keywords und Zahlen für 90%+.',
      tierWarningLabel: 'Achtung · Strukturelle Lücken',
      tierWarningDesc: 'Moderates Risiko automatischer Aussortierung vor menschlicher Prüfung.',
      tierCriticalLabel: 'Kritisch · Wichtige Felder leer',
      tierCriticalDesc: 'Ergänzen Sie Kopfdaten, Kennzahlen und Kompetenzen.',
      optimizedSuffix: 'optimiert',
      adjustSuffix: 'anpassen',
      missingSuffix: 'fehlend',
      openInEditor: 'Im Editor öffnen',
      fixInEditor: 'Bereiche im Editor korrigieren'
    },
    showcase: {
      modes: {
        'models-cv': {
          tabLabel: 'CV-Vorlagen',
          kicker: 'Visuelle Vorlagen-Galerie',
          title: 'Professionelle Lebenslauf-Vorlagen',
          subtitle: 'Prüfen Sie alle A4-Layouts kostenlos vor der Registrierung.'
        },
        'examples-cv': {
          tabLabel: 'CV-Beispiele',
          kicker: 'Praxisbeispiele nach Beruf',
          title: 'Ausgefüllte Lebenslauf-Beispiele',
          subtitle: 'Lassen Sie sich von messbaren Erfolgsbeispielen inspirieren.'
        },
        'models-cover': {
          tabLabel: 'Brief-Vorlagen',
          kicker: 'Anschreiben-Galerie',
          title: 'Anschreiben-Vorlagen',
          subtitle: 'A4-Layouts passend zu Ihrem Lebenslauf – kostenlos ansehen.'
        },
        'examples-cover': {
          tabLabel: 'Brief-Beispiele',
          kicker: 'Fertige Anschreiben',
          title: 'Anschreiben-Beispiele',
          subtitle: 'Überzeugende Texte nach Branche und Karrierestufe.'
        }
      },
      searchPlaceholder: 'Nach Position, Vorlage oder Markt suchen...',
      allSectors: 'Alle Branchen',
      allModels: 'Alle',
      noPhotoAts: 'Ohne Foto · ATS',
      withPhotoEu: 'Mit Foto · Europa',
      previewFreeBadge: 'Gratis-Vorschau',
      inspectBtn: 'Vorschau',
      useBtn: 'Im Studio nutzen',
      unlockAccessBtn: 'Zugang freischalten',
      emptyState: 'Keine passenden Einträge gefunden.',
      clearFilters: 'Filter zurücksetzen'
    },
    auth: {
      kicker: 'Kontozugang',
      loginTitle: 'Anmelden',
      registerTitle: 'Konto erstellen',
      forgotTitle: 'Passwort zurücksetzen',
      loginSubtitle: 'Greifen Sie auf Ihre Lebensläufe, Interview-Trainings und ATS-Berichte zu.',
      registerSubtitle: 'Registrieren Sie sich für Cloud-Speicher und alle Exportfunktionen.',
      forgotSubtitle: 'Stellen Sie Ihren Kontozugang sicher wieder her.',
      tabLogin: 'Anmelden',
      tabRegister: 'Konto erstellen',
      googleBtn: 'Mit Google fortfahren',
      googleLoading: 'Verbinde mit Google...',
      dividerOr: 'oder mit E-Mail und Passwort',
      fullNameLabel: 'Vollständiger Name',
      fullNamePlaceholder: 'z. B. Lukas Weber',
      targetRoleLabel: 'Zielposition / Bereich',
      targetRolePlaceholder: 'z. B. Operations Director, Tech Lead',
      emailLabel: 'E-Mail-Adresse',
      emailPlaceholder: 'name@firma.de',
      passwordLabel: 'Passwort',
      passwordPlaceholder: 'Mindestens 6 Zeichen',
      confirmPasswordLabel: 'Passwort bestätigen',
      confirmPasswordPlaceholder: 'Passwort wiederholen',
      rememberMe: 'Angemeldet bleiben',
      forgotPasswordLink: 'Passwort vergessen?',
      termsPrefix: 'Ich akzeptiere die',
      termsService: 'Nutzungsbedingungen',
      termsAnd: 'und die',
      termsPrivacy: 'Datenschutzerklärung',
      termsSuffix: 'gemäß DSGVO.',
      submitLogin: 'Anmelden',
      submitRegister: 'Konto erstellen & starten',
      submitForgot: 'Wiederherstellung anfordern',
      submitResetConfirm: 'Neues Passwort bestätigen',
      processing: 'Wird verarbeitet...',
      backToLogin: 'Zurück zur Anmeldung',
      registerReassurance: 'Cloud-Synchronisation · Harvard, ATS & Europass · Jederzeit kündbar.',
      loginReassurance: 'Verschlüsselte Sitzung mit automatischer Cloud-Sicherung.'
    },
    gate: {
      yourPlan: 'Ihr Tarif',
      visitor: 'Gast',
      free: 'Kostenlos',
      whatsIncluded: 'In diesem Tool enthalten:',
      signInOrCreate: 'Anmelden / Registrieren',
      seePlans: 'Tarife ansehen',
      activatePrefix: 'Aktivieren:',
      trustFooter: 'Sofortige Aktivierung per Karte oder Pix · Unbegrenzte Word- & PDF-Exporte · Jederzeit kündbar'
    },
    pricing: {
      modalTitle: 'Tarife & Abonnement aktivieren',
      modalSubtitle: 'Word (.docx)-Export, ATS-Radar & 5-Sprachen-Übersetzung per Karte oder Pix.',
      subscriberBannerTitle: 'Funktion für Abonnenten',
      subscriberBannerBadge: 'Aktiver Tarif erforderlich',
      currencyLabel: 'Währung:',
      currentPlanBtn: 'Aktueller Tarif',
      selectedPlanBtn: 'Ausgewählter Tarif',
      summaryTitle: 'Zusammenfassung & Zahlung',
      summarySubtitle: 'Sofort-Aktivierung per Karte (Stripe PCI-DSS) oder Pix. Jederzeit kündbar.',
      quickAuthTitle: 'Kurzer Schritt: Konto verknüpfen',
      quickAuthSubtitle: 'Erstellen Sie in Sekunden ein kostenloses Konto für Cloud-Speicher und Word (.docx)-Export.',
      quickAuthCreate: 'Konto erstellen',
      quickAuthSignIn: 'Anmelden',
      couponLabel: 'Gutscheincode vorhanden?',
      couponPlaceholder: 'Gutscheincode eingeben',
      couponApply: 'Einlösen',
      couponApplying: 'Prüfung...',
      couponRemove: 'Entfernen',
      activePromosLabel: 'Aktive Aktionen:',
      selectPaymentLabel: 'Zahlungsart wählen:',
      cardMethodTitle: 'Kredit- / Debitkarte',
      cardMethodDesc: 'Visa, Mastercard, Apple Pay & Google Pay',
      pixMethodTitle: 'Pix (BRL)',
      payCardBtnPrefix: 'Mit Karte zahlen',
      payCheckoutBtnPrefix: 'Weiter zur Zahlung',
      payPixBtnPrefix: 'Pix-Beleg senden',
      payFreeCouponBtn: 'Kostenlos aktivieren (100% Gutschein)',
      processing: 'Zahlung wird verarbeitet...',
      noLockInNote: 'Geschützte Zahlung mit automatischer Freischaltung nach Bestätigung.',
      guaranteedAccessPrefix: 'Garantierter Zugang für'
    },
    app: {
      previewGuestNotice:
        'Vorschau-Modus: A4-Ansicht. Bearbeitung, Import und saubere Lebenslauf- & PDF-Exporte erfordern Pro oder Executive VIP.',
      previewFreeNotice:
        'Kostenloser Tarif: A4-Vorschau. Bearbeitung und Exporte ohne Wasserzeichen erfordern ein aktives Abo.',
      createAccountBtn: 'Konto erstellen',
      activateProBtn: 'Pro aktivieren',
      mobileEditorTab: 'Editor & Tools',
      mobileViewA4Cv: 'A4-CV ansehen',
      mobileViewA4Cover: 'Brief ansehen',
      studioTabCv: 'Lebenslauf',
      studioTabCover: 'Anschreiben',
      studioTabAts: 'ATS-Radar',
      studioTabJobs: 'Jobs',
      studioTabAi: 'KI-Optimierer',
      studioTabImport: 'Import',
      bottomHome: 'Start',
      bottomEditor: 'Editor',
      bottomCover: 'Brief',
      bottomViewA4: 'A4-Ansicht'
    }
  },
  it: {
    brandName: 'Resume2Job',
    billingCycles: {
      monthly: { label: 'Mensile', shortUnit: 'mese' },
      quarterly: { label: 'Trimestrale', shortUnit: 'trimestre' },
      semiannual: { label: 'Semestrale', shortUnit: 'semestre' },
      yearly: { label: 'Annuale', shortUnit: 'anno' }
    },
    header: {
      navHome: 'Home',
      navModelsExamples: 'Modelli & Esempi',
      navEditor: 'Editor CV',
      navTools: 'Strumenti',
      navPricing: 'Piani',
      showcaseCvHeader: 'Curriculum (Anteprima Gratuita)',
      showcaseModelsCv: 'Modelli di CV',
      showcaseModelsCvDesc: '40+ layout A4 ATS, Harvard, Finanza, Prodotto ed Europass',
      showcaseExamplesCv: 'Esempi di CV',
      showcaseExamplesCvDesc: 'Curriculum completi per ruolo e settore',
      showcaseCoverHeader: 'Lettere di Presentazione',
      showcaseModelsCover: 'Modelli di Lettera',
      showcaseModelsCoverDesc: 'Layout formali e moderni in formato A4',
      showcaseExamplesCover: 'Esempi di Lettera',
      showcaseExamplesCoverDesc: 'Lettere pronte per ruolo o cambio carriera',
      toolsDocsHeader: 'Documenti & Formati',
      toolCover: 'Lettera di Presentazione',
      toolCoverDesc: 'Editor A4 + generazione e traduzione in 5 lingue',
      toolAdvisor: 'Modelli Internazionali',
      toolAdvisorDesc: 'Harvard, ATS Rigoroso, Wall Street, Europass & Tech',
      toolsAnalysisHeader: 'Analisi & Ottimizzazione',
      toolRaw: 'Importa Dati & LinkedIn',
      toolRawDesc: 'Estrai dati strutturati da PDF, Word o testo',
      toolAts: 'Radar ATS & Parole Chiave',
      toolAtsDesc: 'Confronta il tuo profilo con i requisiti dell’offerta',
      toolJobs: 'Offerte Compatibili',
      toolJobsDesc: 'Posizioni dal vivo allineate al tuo CV',
      toolAi: 'Ottimizzatore Impatto (XYZ)',
      toolAiDesc: 'Riscrivi i risultati con metriche misurabili',
      toolInterview: 'Simulatore di Colloquio',
      toolInterviewDesc: 'Domande tecniche e valutazione metodo STAR',
      siteLangLabel: 'Lingua del Sito',
      siteLangHint: 'Solo interfaccia web (non modifica il tuo CV)',
      currencyLabel: 'Valuta',
      notificationsTitle: 'Notifiche di Sistema',
      markAllRead: 'Segna lette',
      noNotifications: 'Nessuna notifica recente. Traduzioni ed esportazioni appariranno qui.',
      configureNotifs: 'Preferenze Notifiche',
      newBadge: 'Nuova',
      notifSystem: 'Sistema',
      notifEmailSent: 'Email Inviata',
      notifEmailQueued: 'Email Registrata',
      myResumes: 'I Miei CV',
      myProfile: 'Profilo & Accesso',
      subscriptionInvoices: 'Abbonamento & Fatture',
      notifPreferences: 'Preferenze & Notifiche',
      managePlan: 'Gestisci Piano',
      adminPanel: 'Pannello Admin',
      signOut: 'Esci',
      signIn: 'Accedi',
      downloadCoverShort: 'Lettera',
      downloadWordShort: 'Scarica CV',
      downloadCover: 'Scarica Lettera',
      downloadWord: 'Scarica CV',
      exporting: 'Esportazione...',
      mobileWorkspace: 'Area di Lavoro',
      mobileShowcaseTitle: 'Modelli & Esempi (Gratis)',
      mobileToolsTitle: 'Strumenti & Analisi',
      mobileMyResumes: 'I Miei CV',
      mobileMyAccount: 'Il Mio Account',
      mobileSignInRegister: 'Accedi / Registrati'
    },
    landing: {
      heroKicker: 'AI per Candidature · Punteggio ATS · PDF & Word',
      heroTitle: 'L’AI che adatta automaticamente il tuo CV a qualsiasi offerta e aumenta i colloqui.',
      heroSubtitle:
        'Incolla il link di un annuncio, verifica subito la compatibilità ATS e adatta riepilogo, risultati e parole chiave in 1 clic — pronto in PDF o Word.',
      ctaBuild: 'Adatta il CV con l’AI',
      ctaExploreModels: 'Esplora 40+ Modelli',
      ctaMatchJobs: 'Filtra Offerte dal CV',
      linkCvModels: 'Modelli di CV',
      linkRealExamples: 'Esempi Reali',
      linkCoverModels: 'Modelli di Lettera',
      linkPlansStarting: 'Piani a partire da',
      perMonth: '/mese',
      cardAndPix: 'Carta & Pix',
      atsCompatPrefix: 'Compatibilità',
      editThisModel: 'Modifica modello',
      metrics: [
        { value: '98.7%', label: 'Lettura pulita dai parser ATS' },
        { value: '40+ Modelli', label: 'ATS, Moderno, Harvard, Tech & UE' },
        { value: 'Match Dal Vivo', label: 'Offerte filtrate dal tuo profilo CV' },
        { value: '5 Lingue', label: 'EN · PT · ES · FR · DE in 1 clic' }
      ],
      deliverables: [
        { code: 'CV A4', text: '40+ layout ATS ed Executive in scala A4 reale' },
        { code: 'MATCH', text: 'Offerte filtrate per profilo, paese e remoto/ibrido' },
        { code: 'ADATTA', text: 'Allinea parole chiave al ruolo scelto in 1 clic' },
        { code: '5x LINGUE', text: 'Traduzione integrale mantenendo il layout' },
        { code: 'WORD 1:1', text: 'Download .docx modificabile & PDF pulito' }
      ],
      archKicker: 'Flusso Completo di Candidatura',
      archTitle: 'Dal curriculum alla candidatura mirata in quattro passaggi',
      archDesc:
        'Uniamo creazione di CV per filtri ATS, radar offerte basato sul tuo profilo, filtri intelligenti e adattamento automatico per ogni annuncio.',
      archSteps: [
        {
          num: '01',
          title: 'Crea o Importa il CV ATS',
          desc: 'Scegli tra oltre 40 formati internazionali a colonna singola (Workday, Greenhouse, Taleo) o importa PDF/LinkedIn.'
        },
        {
          num: '02',
          title: 'Radar Offerte per Profilo',
          desc: 'Il sistema legge ruolo, seniority e competenze per mostrarti posizioni reali ordinate per compatibilità.'
        },
        {
          num: '03',
          title: 'Filtra & Adatta in 1 Clic',
          desc: 'Filtra per remoto, ibrido, area o contratto e integra le parole chiave richieste con la Formula Google XYZ.'
        },
        {
          num: '04',
          title: 'Esporta & Candidati',
          desc: 'Scarica Word (.docx) fedele, PDF pulito e lettera di presentazione tradotta in 5 lingue per inviare subito.'
        }
      ],
      jobMatch: {
        kicker: 'Ricerca & Filtri Intelligenti per Offerte',
        title: 'Il tuo CV trova e filtra le posizioni adatte al tuo profilo',
        subtitle:
          'Cambia profilo CV e prova i filtri per modalità e regione per vedere le competenze riconosciute e la compatibilità in tempo reale.',
        profileLabel: 'Profilo CV attivo:',
        profiles: [
          {
            id: 'coo',
            label: 'COO & Global Ops',
            headline: 'Alexander Mendes · 12+ anni · P&L $35M+ · Trasformazione Digitale & M&A',
            skills: ['P&L Governance', 'EBITDA', 'ERP Integration', 'OKRs', 'Lean Six Sigma']
          },
          {
            id: 'tech',
            label: 'Staff Cloud Architect',
            headline: 'Lead Software Architect · 8+ anni · AWS/GCP · Kubernetes & FinTech',
            skills: ['Kubernetes', 'TypeScript', 'gRPC', 'Terraform', 'DevSecOps']
          },
          {
            id: 'finance',
            label: 'VP Finanza & M&A',
            headline: 'Beatriz Fonseca · CFA · €140M M&A · IFRS / US GAAP & Tesoreria',
            skills: ['DCF Valuation', 'IFRS / US GAAP', 'M&A', 'FP&A', 'Treasury']
          }
        ],
        workplaceFilters: { all: 'Tutte le Modalità', remote: 'Remoto', hybrid: 'Ibrido' },
        regionFilters: { all: 'Tutte le Regioni', us_global: 'USA & Global', europe: 'Europa' },
        matchSuffix: 'compatibile',
        keywordsMatchedLabel: 'Competenze dal CV riconosciute:',
        tailorCta: 'Adatta CV all’Offerta',
        browseJobsCta: 'Apri Radar Offerte & Candidati',
        emptyState: 'Nessuna offerta per questi filtri — prova a selezionare Tutte.',
        jobs: [
          {
            id: 'jm-coo-1',
            profile: 'coo',
            title: 'VP of Global Operations & Strategy',
            company: 'Horizon Enterprise Cloud',
            workplace: 'hybrid',
            workplaceLabel: 'Ibrido',
            region: 'us_global',
            regionLabel: 'New York / Global',
            contract: 'Tempo Pieno',
            matchScore: 96,
            matchedKeywords: ['P&L Governance', 'OKRs', 'ERP Integration']
          },
          {
            id: 'jm-coo-2',
            profile: 'coo',
            title: 'Chief Operating Officer (EMEA)',
            company: 'Atlas Logistics & Automation',
            workplace: 'remote',
            workplaceLabel: 'Remoto',
            region: 'europe',
            regionLabel: 'Lisbona / UE',
            contract: 'Contratto Executive',
            matchScore: 93,
            matchedKeywords: ['EBITDA', 'Lean Six Sigma', 'P&L Governance']
          },
          {
            id: 'jm-tech-1',
            profile: 'tech',
            title: 'Principal Distributed Systems Architect',
            company: 'Northstar Payments Corp',
            workplace: 'remote',
            workplaceLabel: 'Remoto Globale',
            region: 'us_global',
            regionLabel: 'USA / Remoto',
            contract: 'Tempo Pieno',
            matchScore: 97,
            matchedKeywords: ['Kubernetes', 'gRPC', 'DevSecOps']
          },
          {
            id: 'jm-tech-2',
            profile: 'tech',
            title: 'Head of Platform Engineering (Cloud)',
            company: 'EuroFin Core Systems',
            workplace: 'hybrid',
            workplaceLabel: 'Ibrido',
            region: 'europe',
            regionLabel: 'Berlino / Zurigo',
            contract: 'Tempo Pieno',
            matchScore: 91,
            matchedKeywords: ['Terraform', 'TypeScript', 'Kubernetes']
          },
          {
            id: 'jm-fin-1',
            profile: 'finance',
            title: 'VP Corporate Development & M&A',
            company: 'Vanguard Capital Partners',
            workplace: 'hybrid',
            workplaceLabel: 'Ibrido',
            region: 'us_global',
            regionLabel: 'New York / Londra',
            contract: 'Tempo Pieno',
            matchScore: 95,
            matchedKeywords: ['DCF Valuation', 'M&A', 'IFRS / US GAAP']
          },
          {
            id: 'jm-fin-2',
            profile: 'finance',
            title: 'Director of FP&A & Treasury',
            company: 'Iberia Industrial Group',
            workplace: 'remote',
            workplaceLabel: 'Remoto',
            region: 'europe',
            regionLabel: 'Madrid / Lisbona',
            contract: 'Tempo Pieno',
            matchScore: 92,
            matchedKeywords: ['FP&A', 'Treasury', 'IFRS / US GAAP']
          }
        ]
      },
      atsHubKicker: 'Audit & Diagnostica ATS',
      atsHubTitle: 'Audit e Simulatore in Tempo Reale',
      tabHealth: 'Diagnostica CV',
      tabSimulator: 'Simula Offerta ATS',
      simSelectRole: 'Seleziona un ruolo di riferimento:',
      simRoles: {
        coo: 'Direttore Operativo (COO)',
        tech: 'Staff Cloud Architect',
        cfo: 'VP Finanza & M&A'
      },
      simCompatLabel: 'Compatibilità ATS',
      simApproved: 'Profilo idoneo alla preselezione automatica',
      simRisk: 'Rischio di scarto per mancanza di parole chiave e numeri',
      simActionVerb: 'Verbo d’Azione',
      simPresent: 'Presente',
      simMissing: 'Assente',
      simMetricLabel: 'Metrica (%/€/$/N)',
      simQuantified: 'Quantificata',
      simNoNumbers: 'Senza numeri',
      simRequiredKeywords: 'Parole chiave richieste per',
      simOptimizedLabel: 'Testo Ottimizzato (Formula Google XYZ):',
      simTestLabel: 'Prova qui la tua descrizione o modifica l’esempio:',
      simResetExample: 'Ripristina esempio',
      simPlaceholder: 'Incolla un paragrafo del tuo CV attuale per misurare il punteggio ATS...',
      simApplyXyz: 'Applica Formula Google XYZ (Simula 98%)',
      simApplyToCv: 'Applica al Mio CV',
      simFixInStudio: 'Correggi il Mio CV in Studio',
      proofContrastKicker: 'Confronto Diretto',
      proofContrastTitle: 'Da mansione generica a prova per il colloquio',
      proofBeforeBadge: 'Prima · Punteggio 38% ATS',
      proofBeforeQuote:
        '“Responsabile dell’assistenza clienti, gestione del team commerciale e monitoraggio obiettivi mensili.”',
      proofAfterBadge: 'Dopo (Formula Google XYZ) · 96% ATS',
      proofAfterQuote:
        '“Guidato un team B2B di 18 consulenti, ampliando la pipeline annua di $4.2M (+34% YoY) con SLA sotto 2 ore.”',
      proofCasesKicker: 'Candidature Reali',
      proofCasesTitle: 'Risultati riportati dagli abbonati nei processi di selezione',
      proofCases: [
        {
          role: 'M. Oliveira · Direttore Operativo (Logistica · Lisbona / Madrid)',
          detail:
            'Ha sostituito un CV di 4 pagine con Harvard ATS in inglese e spagnolo; 4 colloqui finali in 19 giorni.'
        },
        {
          role: 'R. Tavares · Cloud Architect Senior (Fintech · San Paolo / Remoto USA)',
          detail:
            'Ha allineato 11 competenze tecniche con Radar ATS per Workday passando dal 44% al 96%.'
        },
        {
          role: 'C. Ferreira · Finance Manager (Industria · Porto / Zurigo)',
          detail:
            'Ha generato CV Europass e lettera bilingue direttamente in Word (.docx) senza alterare il layout.'
        }
      ],
      templatesKicker: 'Standard Internazionali',
      templatesTitle: 'Modelli Calibrati per Ogni Mercato',
      templatesSubtitle:
        'Ogni layout rispetta i criteri richiesti negli Stati Uniti, in Europa e per ruoli dirigenziali.',
      filterAll: 'Tutti',
      filterNoPhoto: 'Senza Foto · ATS',
      filterWithPhoto: 'Con Foto · Europa',
      badgeWithPhoto: 'Con Foto',
      badgeNoPhotoAts: 'Senza Foto · ATS',
      previewFreePrefix: 'Anteprima gratuita',
      useModel: 'Usa modello',
      showLessModels: 'Mostra meno',
      viewAllModelsPrefix: 'Vedi tutti i',
      viewAllModelsSuffix: 'modelli disponibili',
      openTemplateAdvisor: 'Apri Consulente Modelli',
      pricingKicker: 'Prezzi Trasparenti',
      pricingTitle: 'Scegli il piano ideale per la tua candidatura',
      pricingSubtitle:
        'Accesso completo all’editor, traduzione in 5 lingue ed esportazione Word/PDF tramite Carta o Pix.',
      freeTierName: 'Gratuito',
      freeTierTag: 'Esplorazione',
      freeTierPriceUnit: '/ sempre',
      freeTierDesc: 'Anteprima A4 dei modelli e diagnostica iniziale prima di abbonarsi.',
      freeTierFeatures: [
        'Galleria completa modelli CV & Lettera',
        'Analisi in diretta della salute del CV',
        'Consulente per paese e settore'
      ],
      freeTierCta: 'Esplora Gratis',
      proDefaultName: 'Professionale Pro',
      proPopularBadge: 'Più Scelto',
      proFeatures: [
        'CV, varianti e salvataggio illimitato nel cloud',
        'Esportazione 1:1 Word (.docx) e PDF A4 senza filigrana',
        'Traduzione integrale CV e Lettera in 5 lingue',
        'Radar ATS & Ottimizzatore Impatto (XYZ)'
      ],
      proCtaPrefix: 'Attiva',
      execDefaultName: 'Executive VIP',
      execBadge: 'C-Level & Global',
      execFeatures: [
        'Tutto ciò che è incluso in Professionale Pro',
        'Modelli C-Level, Harvard Executive & ONU',
        'Simulatore di colloquio voce/testo con valutazione STAR',
        'Audit LinkedIn & supporto prioritario'
      ],
      execCtaPrefix: 'Attiva',
      equivalentPrefix: 'Equivalente:',
      equivalentMonthlyPrefix: 'Pari a',
      fullAccessForDaysPrefix: 'Accesso completo per',
      daysSuffix: 'giorni',
      includesStarAndCLevel: 'Include Simulatore STAR e Modelli Executive',
      roiKicker: 'Ritorno sull’Investimento',
      roiTitle: 'Consulenza Tradizionale vs. Resume2Job',
      roiSavings: 'Risparmia fino al 95% rispetto alle agenzie di carriera',
      roiAgencyTitle: 'Consulenza / Freelancer Tradizionale',
      roiAgencyPrice: '$150 – $400 / consegna',
      roiAgencyPoints: [
        '• Tempo medio di 5–10 giorni lavorativi per versione',
        '• Costo extra per adattare il CV a nuovi annunci',
        '• Traduzione in inglese o altra lingua fatturata a parte (+$80)',
        '• Nessun punteggio ATS in diretta né simulatore colloqui'
      ],
      roiPlatformTitle: 'Resume2Job (Pro & VIP)',
      roiPlatformPricePrefix: 'Da',
      roiPlatformPoints: [
        '• Creazione ed export Word (.docx) e PDF in meno di 5 min',
        '• Versioni illimitate adattate a ogni offerta nel cloud',
        '• Traduzione in 5 lingue + Lettera di presentazione incluse',
        '• Radar ATS, Formula XYZ e offerte compatibili dal vivo'
      ],
      trustNoLockIn: 'Nessun vincolo: disdici in 1 clic',
      trustEditableDocx: 'File Word (.docx) 100% modificabili dopo il download',
      trustCardPix: 'Carta Internazionale (PCI-DSS) o Pix (BRL)',
      trustStartNow: 'Inizia ora',
      matrixTitle: 'Confronto Dettagliato delle Funzioni',
      matrixSubtitle: 'Tutti i piani senza vincoli',
      matrixCapabilityCol: 'Funzionalità',
      matrixFreeCol: 'Gratuito',
      matrixProCol: 'Professionale Pro',
      matrixExecCol: 'Executive VIP',
      matrixRows: [
        { feature: 'Anteprima A4 dal vivo di tutti i modelli', free: true, pro: true, exec: true },
        { feature: 'Importazione strutturata LinkedIn, PDF e Word', free: false, pro: true, exec: true },
        { feature: 'Esportazione nativa Word (.docx) e PDF A4 pulito', free: false, pro: true, exec: true },
        { feature: 'Traduzione completa CV + Lettera (PT, EN, ES, FR, DE)', free: false, pro: true, exec: true },
        { feature: 'Radar ATS Semantico & Ottimizzatore Google XYZ', free: false, pro: true, exec: true },
        { feature: 'Modelli Harvard Executive, C-Level & ONU', free: false, pro: false, exec: true },
        { feature: 'Simulatore di colloquio voce/testo metodo STAR', free: false, pro: false, exec: true }
      ],
      faqTitle: 'Domande Frequenti',
      faqRightNote: 'Pagamenti sicuri tramite Carta & Pix',
      faqs: [
        {
          q: 'Come funzionano i pagamenti con Carta e Pix?',
          a: 'Accettiamo carte internazionali (Visa, Mastercard, Apple Pay, Google Pay) e Pix (BRL) con QR Code.'
        },
        {
          q: 'Il curriculum supera davvero i filtri ATS (Workday, Taleo, Greenhouse)?',
          a: 'Sì. I nostri layout rigorosi usano struttura lineare a colonna singola senza caselle flottanti.'
        },
        {
          q: 'Il file Word (.docx) mantiene la formattazione esatta del sito?',
          a: 'Sì. La generazione OpenXML (.docx) preserva margini A4, font, sezioni e colori.'
        },
        {
          q: 'La traduzione del documento traduce anche i testi inseriti da me?',
          a: 'Sì. Nello studio puoi cambiare la lingua del documento tra 5 lingue mantenendo le sigle tecniche.'
        },
        {
          q: 'Posso annullare o cambiare piano quando voglio?',
          a: 'Sì, direttamente dalla tua Area Utente, senza penali né vincoli.'
        }
      ],
      closingKicker: 'Pronto in Meno di 5 Minuti',
      closingTitle: 'Invia la tua prossima candidatura in formato A4 con oltre il 95% di punteggio ATS',
      closingSubtitle:
        'Importa il tuo PDF o LinkedIn attuale, ottimizza i risultati e scarica il pacchetto completo in Word (.docx) e PDF.',
      closingCtaBuild: 'Crea il Mio CV',
      closingCtaExamples: 'Vedi Esempi Reali',
      footerRights: 'Tutti i diritti riservati.'
    },
    health: {
      subtitle: 'Verifica istantanea dei 6 criteri richiesti da Workday, Taleo, Greenhouse e Lever.',
      myResumeBtn: 'Il Mio CV',
      benchmarkBtn: 'Riferimento 98%',
      globalAtsIndex: 'Indice ATS Globale',
      gradePrefix: 'Livello',
      tierApprovedLabel: 'Pronto per ATS & Colloqui',
      tierApprovedDesc: 'Struttura compatibile con Workday, Greenhouse, Taleo e selezione executive.',
      tierCompetitiveLabel: 'Competitivo · Rifiniture minime',
      tierCompetitiveDesc: 'Buona base; rinforza parole chiave e metriche per superare il 90%.',
      tierWarningLabel: 'Attenzione · Lacune strutturali',
      tierWarningDesc: 'Rischio moderato di filtraggio automatico prima della lettura umana.',
      tierCriticalLabel: 'Critico · Campi essenziali vuoti',
      tierCriticalDesc: 'Completa intestazione, risultati e competenze per superare i filtri ATS.',
      optimizedSuffix: 'ottimizzate',
      adjustSuffix: 'da rifinire',
      missingSuffix: 'mancanti',
      openInEditor: 'Apri nell’Editor CV',
      fixInEditor: 'Correggi Sezioni nell’Editor'
    },
    showcase: {
      modes: {
        'models-cv': {
          tabLabel: 'Modelli di CV',
          kicker: 'Galleria Modelli CV',
          title: 'Modelli di Curriculum Professionali',
          subtitle: 'Visualizza ogni layout in scala reale prima di registrarti.'
        },
        'examples-cv': {
          tabLabel: 'Esempi di CV',
          kicker: 'Esempi Reali per Professione',
          title: 'Esempi di Curriculum Completi',
          subtitle: 'Prendi spunto da CV reali strutturati con metriche di impatto.'
        },
        'models-cover': {
          tabLabel: 'Modelli di Lettera',
          kicker: 'Galleria Lettere di Presentazione',
          title: 'Modelli di Lettera di Presentazione',
          subtitle: 'Lettere in formato A4 coordinate con il tuo CV.'
        },
        'examples-cover': {
          tabLabel: 'Esempi di Lettera',
          kicker: 'Lettere Pronte all’Uso',
          title: 'Esempi di Lettera di Presentazione',
          subtitle: 'Testi persuasivi per settore e livello di esperienza.'
        }
      },
      searchPlaceholder: 'Cerca per ruolo, modello o mercato...',
      allSectors: 'Tutti i Settori',
      allModels: 'Tutti',
      noPhotoAts: 'Senza Foto · ATS',
      withPhotoEu: 'Con Foto · Europa',
      previewFreeBadge: 'Anteprima Gratuita',
      inspectBtn: 'Anteprima',
      useBtn: 'Usa in Studio',
      unlockAccessBtn: 'Sblocca Accesso',
      emptyState: 'Nessun elemento trovato con questi filtri.',
      clearFilters: 'Reimposta filtri'
    },
    auth: {
      kicker: 'Accesso Account',
      loginTitle: 'Accedi alla Piattaforma',
      registerTitle: 'Crea Account',
      forgotTitle: 'Recupera Password',
      loginSubtitle: 'Accedi ai tuoi CV salvati, simulazioni e report ATS.',
      registerSubtitle: 'Registrati per sincronizzare i CV nel cloud.',
      forgotSubtitle: 'Recupera l’accesso al tuo account in sicurezza.',
      tabLogin: 'Accedi',
      tabRegister: 'Crea Account',
      googleBtn: 'Continua con Google',
      googleLoading: 'Connessione a Google...',
      dividerOr: 'oppure con email e password',
      fullNameLabel: 'Nome Completo',
      fullNamePlaceholder: 'Es. Marco Rossi',
      targetRoleLabel: 'Ruolo Desiderato / Settore',
      targetRolePlaceholder: 'Es. Operations Director, Tech Lead',
      emailLabel: 'Indirizzo Email',
      emailPlaceholder: 'nome@azienda.it',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Minimo 6 caratteri',
      confirmPasswordLabel: 'Conferma Password',
      confirmPasswordPlaceholder: 'Ripeti la password',
      rememberMe: 'Resta connesso',
      forgotPasswordLink: 'Password dimenticata?',
      termsPrefix: 'Accetto i',
      termsService: 'Termini di Servizio',
      termsAnd: 'e la',
      termsPrivacy: 'Privacy Policy',
      termsSuffix: 'in conformità al GDPR.',
      submitLogin: 'Accedi',
      submitRegister: 'Crea Account & Continua',
      submitForgot: 'Invia Link di Recupero',
      submitResetConfirm: 'Conferma Nuova Password',
      processing: 'Elaborazione...',
      backToLogin: 'Torna al Login',
      registerReassurance: 'Sincronizzazione cloud · Modelli Harvard, ATS & Europass · Senza vincoli.',
      loginReassurance: 'Sessione crittografata con backup automatico dei tuoi CV.'
    },
    gate: {
      yourPlan: 'Il Tuo Piano',
      visitor: 'Visitatore',
      free: 'Gratuito',
      whatsIncluded: 'Incluso in questo strumento:',
      signInOrCreate: 'Accedi / Registrati',
      seePlans: 'Vedi Piani',
      activatePrefix: 'Attiva',
      trustFooter: 'Attivazione immediata via Carta o Pix · Esportazioni Word (.docx) e PDF illimitate · Disdici quando vuoi'
    },
    pricing: {
      modalTitle: 'Piani & Attivazione Abbonamento',
      modalSubtitle: 'Esportazione Word (.docx), Radar ATS e traduzione in 5 lingue tramite Carta o Pix.',
      subscriberBannerTitle: 'Funzione Riservata agli Abbonati',
      subscriberBannerBadge: 'Piano Attivo Richiesto',
      currencyLabel: 'Valuta:',
      currentPlanBtn: 'Piano Attuale',
      selectedPlanBtn: 'Piano Selezionato',
      summaryTitle: 'Riepilogo & Pagamento',
      summarySubtitle: 'Attivazione immediata con Carta (Stripe PCI-DSS) o Pix QR Code. Senza vincoli.',
      quickAuthTitle: 'Passaggio Rapido: Identifica il tuo Account',
      quickAuthSubtitle: 'Crea il tuo account gratuito in pochi secondi per collegare l’abbonamento ed esportare in Word (.docx).',
      quickAuthCreate: 'Crea Account',
      quickAuthSignIn: 'Accedi',
      couponLabel: 'Hai un Codice Sconto?',
      couponPlaceholder: 'Inserisci il codice',
      couponApply: 'Applica',
      couponApplying: 'Verifica...',
      couponRemove: 'Rimuovi',
      activePromosLabel: 'Promozioni attive:',
      selectPaymentLabel: 'Seleziona il Metodo di Pagamento:',
      cardMethodTitle: 'Carta di Credito / Debito',
      cardMethodDesc: 'Visa, Mastercard, Apple Pay & Google Pay',
      pixMethodTitle: 'Pix (BRL)',
      payCardBtnPrefix: 'Paga con Carta',
      payCheckoutBtnPrefix: 'Continua al Pagamento',
      payPixBtnPrefix: 'Invia Ricevuta Pix',
      payFreeCouponBtn: 'Attiva Gratis (Coupon 100%)',
      processing: 'Elaborazione...',
      noLockInNote: 'Pagamento protetto con attivazione automatica immediata.',
      guaranteedAccessPrefix: 'Accesso garantito per'
    },
    app: {
      previewGuestNotice:
        'Modalità Anteprima: Visualizzazione A4. Modifica, importazione e download CV / PDF puliti richiedono un piano Pro o Executive VIP.',
      previewFreeNotice:
        'Piano Gratuito: Anteprima A4. Modifica ed esportazioni senza filigrana richiedono un abbonamento attivo.',
      createAccountBtn: 'Crea Account',
      activateProBtn: 'Attiva Piano Pro',
      mobileEditorTab: 'Editor & Strumenti',
      mobileViewA4Cv: 'Vedi CV A4',
      mobileViewA4Cover: 'Vedi Lettera A4',
      studioTabCv: 'Curriculum',
      studioTabCover: 'Lettera',
      studioTabAts: 'Radar ATS',
      studioTabJobs: 'Offerte',
      studioTabAi: 'Ottimizza IA',
      studioTabImport: 'Importa',
      bottomHome: 'Home',
      bottomEditor: 'Editor',
      bottomCover: 'Lettera',
      bottomViewA4: 'Vedi A4'
    }
  }
};
