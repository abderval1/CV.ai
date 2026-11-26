import { SiteLanguageCode } from './siteTranslations';

export function getIntlLocale(lang: SiteLanguageCode): string {
  switch (lang) {
    case 'en':
      return 'en-US';
    case 'es':
      return 'es-ES';
    case 'fr':
      return 'fr-FR';
    case 'de':
      return 'de-DE';
    case 'it':
      return 'it-IT';
    default:
      return 'pt-PT';
  }
}

export interface ToolsUiDictionary {
  app: {
    onlineTitle: string;
    onlineDesc: string;
    offlineTitle: string;
    offlineDesc: string;
    wordToastDefault: string;
    wordToastLetter: string;
    wordToastCvPrefix: string;
    wordToastCvSuffix: string;
    wordToastSub: string;
    pricingDefaultPrompt: string;
    checkoutConfirmedPrompt: string;
    unlockedTitle: string;
    unlockedSubSuffix: string;
    authModelPromptPrefix: string;
    authModelPromptSuffix: string;
    planModelPromptPrefix: string;
    planModelPromptSuffix: string;
    modelLoadedTitle: string;
    modelLoadedSubSuffix: string;
    authTranslatePrompt: string;
    planTranslatePrompt: string;
    langChangedTitle: string;
    langChangedSubPrefix: string;
    translatedTitle: string;
    translatedSubPrefix: string;
    notifTranslateTitle: string;
    notifTranslateMsgPrefix: string;
    translationErrorTitle: string;
    translationErrorFallback: string;
    authExportPrompt: string;
    planExportPrompt: string;
    exportLetterTitle: string;
    exportLetterSubPrefix: string;
    exportLetterSubSuffix: string;
    exportCvTitle: string;
    exportCvSubPrefix: string;
    exportCvSubSuffix: string;
    notifExportTitle: string;
    notifExportLetterMsgPrefix: string;
    notifExportCvMsgPrefix: string;
    exportErrorTitle: string;
    exportErrorDesc: string;
    maintenanceBadge: string;
    maintenanceTitle: string;
    maintenanceDefaultMsg: string;
    maintenanceAdminPrompt: string;
    maintenanceAdminBtn: string;
    adminMaintTitle: string;
    adminMaintDesc: string;
    adminMaintBtn: string;
    impersonateTitle: string;
    impersonateAs: string;
    impersonateExitBtn: string;
    resumeBuilderLabel: string;
    modelLabelPrefix: string;
    authCreateSavePrompt: string;
    wordBadgeLocked: string;
    wordBadgeOpen: string;
  };
  multiLangModal: {
    modalTitle: string;
    modalSubtitle: string;
    selectLang: string;
    langNames: Record<'pt' | 'en' | 'es' | 'fr' | 'de', string>;
    activeTranslationPrefix: string;
    activeTranslationSuffix: string;
    readyTranslationPrefix: string;
    readyTranslationSuffix: string;
    translating: string;
    updateTranslation: string;
    translateAction: string;
    explanation: string;
    previewTranslated: string;
    exportOptionsLabel: string;
    downloading: string;
    downloadDocx: string;
    openXmlSub: string;
    downloadPdf: string;
    vectorA4Sub: string;
    continueEditingPrompt: string;
    applyToEditor: string;
    loadedEditorTitle: string;
    loadedEditorSubPrefix: string;
    unlimitedFooter: string;
    planRequiredFooter: string;
    close: string;
    authTranslateReq: string;
    planTranslateReq: string;
    authExportReq: string;
    planExportReq: string;
    authPdfReq: string;
    planPdfReq: string;
    translationReadyTitle: string;
    translationReadySubPrefix: string;
    notifTranslateTitle: string;
    notifTranslateMsgPrefix: string;
    translationErrorTitle: string;
    translationErrorFallback: string;
    wordSuccessTitle: string;
    wordSuccessSubPrefix: string;
    wordSuccessSubSuffix: string;
    wordErrorTitle: string;
    wordErrorDesc: string;
    notifExportTitle: string;
    notifExportWordPrefix: string;
    notifExportPdfPrefix: string;
    notifExportPdfSuffix: string;
  };
  coverPanel: {
    aiPaused: string;
    serverErr: string;
    generatedAi: string;
    invalidFormat: string;
    generatedFallback: string;
    planRequiredWord: string;
    planRequiredPdf: string;
    recipientPlaceholder: string;
    orgPlaceholder: string;
    rolePlaceholder: string;
    defaultRecipient: string;
    defaultOrg: string;
    defaultRole: string;
  };
  miniPreview: {
    coverSidebarLabel: string;
    coverHeaderLabel: string;
    a4Official: string;
    contacts: string;
    competencies: string;
    profile: string;
    experience: string;
    education: string;
    europassBadge: string;
    aboutMe: string;
    educationTraining: string;
    langSkills: string;
    techSummary: string;
    minSummary: string;
    stdSummary: string;
    techComp: string;
    minComp: string;
    stdComp: string;
    techExp: string;
    minExp: string;
    stdExp: string;
    techEdu: string;
    minEdu: string;
    stdEdu: string;
  };
  rawGenerator: {
    title: string;
    descStandard: string;
    descTailored: string;
    clearTitle: string;
    clearBtn: string;
    presetsLabel: string;
    presetExec: string;
    presetExecTitle: string;
    presetTech: string;
    presetTechTitle: string;
    presetFin: string;
    presetFinTitle: string;
    targetLabel: string;
    stdOnu: string;
    stdOnuTitle: string;
    stdTech: string;
    stdTechTitle: string;
    stdHarvard: string;
    stdHarvardTitle: string;
    stdEuropass: string;
    stdEuropassTitle: string;
    stdAts: string;
    stdAtsTitle: string;
    modeStandardTitle: string;
    modeStandardDesc: string;
    modeTailoredTitle: string;
    modeTailoredDesc: string;
    activeBadge: string;
    sec1Title: string;
    importFileBtn: string;
    importingFileBtn: string;
    importFileTitle: string;
    linkedinTitle: string;
    linkedinHowBtn: string;
    linkedinPlaceholder: string;
    linkedinExtracting: string;
    linkedinExtractBtn: string;
    completedSuffix: string;
    step1Label: string;
    step2Label: string;
    step4Label: string;
    logStart: string;
    logStep2: string;
    logDone1: string;
    logDone2: string;
    logDone3: string;
    rolesExtractedLabel: string;
    atsSkillsLabel: string;
    educationsLabel: string;
    applyDirectBtn: string;
    pasteRawBtn: string;
    linkedinHelperTitle: string;
    linkedinHelper1: string;
    linkedinHelper2: string;
    linkedinHelper3: string;
    rawTextareaLabel: string;
    rawPlaceholder: string;
    charsInsertedSuffix: string;
    switchToTailoredBtn: string;
    sec2Title: string;
    importTdrBtn: string;
    importingTdrBtn: string;
    importTdrTitle: string;
    sampleJobsLabel: string;
    jobChipLabels: Record<'job-1' | 'job-2' | 'job-3' | 'job-4', string>;
    jobTextareaLabel: string;
    jobTextareaPlaceholder: string;
    charsInJobSuffix: string;
    switchToStandardBtn: string;
    bannerDescStandard: string;
    bannerDescTailored: string;
    generateOnlyBtn: string;
    generatingStandard: string;
    generatingTailored: string;
    generateStandardCta: string;
    generateTailoredCta: string;
    msgExecLoaded: string;
    msgTechLoaded: string;
    msgFinLoaded: string;
    msgDocImportedPrefix: string;
    msgDocImportedSuffix: string;
    msgJobDocImportedPrefix: string;
    msgJobDocImportedSuffix: string;
    msgErrExtract: string;
    msgErrNoInput: string;
    msgErrNoJob: string;
    msgAiPausedStandard: string;
    msgAiPausedTailored: string;
    msgSuccessStandard: string;
    msgSuccessTailored: string;
    msgFallbackStandard: string;
    msgFallbackTailored: string;
    msgErrLinkedInUrl: string;
    msgLinkedInSuccess: string;
    msgLinkedInApplied: string;
    msgLinkedInPasted: string;
  };
  atsRadar: {
    bannerTitle: string;
    statusNoJob: string;
    statusHigh: string;
    statusMid: string;
    statusLow: string;
    optimizeAiBtn: string;
    tabAudit: string;
    tabBotView: string;
    tabChecklist: string;
    jobHeader: string;
    loadSampleLabel: string;
    jobChips: Record<'job-1' | 'job-2' | 'job-3' | 'job-4', string>;
    jobPlaceholder: string;
    noJobWarning: string;
    activeJobInfo: string;
    missingTitle: string;
    destLabel: string;
    destComp: string;
    destSummary: string;
    destExp: string;
    destCompTitle: string;
    destSummaryTitle: string;
    destExpTitle: string;
    destCompFull: string;
    destSummaryFull: string;
    destExpFull: string;
    clickPlusPrefix: string;
    clickPlusMiddle: string;
    addAllBtn: string;
    waitingJobMsg: string;
    congratsNoMissing: string;
    insertAriaPrefix: string;
    matchedTitle: string;
    noMatchedMsg: string;
    metricsTitle: string;
    metricsHigh: string;
    metricsLow: string;
    metricsTip: string;
    verbsTitle: string;
    verbsSub: string;
    recsTitle: string;
    recMissingPrefix: string;
    recMissingSuffix: string;
    recMetrics: string;
    recPassivePrefix: string;
    recPassiveSuffix: string;
    recSummary: string;
    recExcellent: string;
    botTitle: string;
    copiedBtn: string;
    copyExtractedBtn: string;
    ocrReadability: string;
    ocrRolesBullets: string;
    ocrSkills: string;
    ocrStructurePhoto: string;
    twoCols: string;
    oneCol: string;
    withPhoto: string;
    botDesc: string;
    checklistTitle: string;
    c1Title: string;
    c1Ok: string;
    c1Warn: string;
    c1Desc: string;
    c2Title: string;
    c2Ok: string;
    c2Fail: string;
    c2Desc: string;
    c3Title: string;
    c3Ok: string;
    c3Warn: string;
    c3Desc: string;
    c4Title: string;
    c4Unit: string;
    c4Desc: string;
  };
  aiTailor: {
    tabFull: string;
    tabXyz: string;
    xyzBadge: string;
    xyzTitle: string;
    xyzSubtitlePrefix: string;
    xyzSubtitleStrong: string;
    xyzSubtitleSuffix: string;
    presetsLabel: string;
    presetOps: string;
    presetOpsSub: string;
    presetTech: string;
    presetTechSub: string;
    presetFin: string;
    presetFinSub: string;
    presetLead: string;
    presetLeadSub: string;
    xLabel: string;
    xPlaceholder: string;
    yLabel: string;
    yPlaceholder: string;
    zLabel: string;
    zPlaceholder: string;
    resultLabel: string;
    copiedBtn: string;
    copyBtn: string;
    insertedBtn: string;
    insertBtn: string;
    noExpWarnTitle: string;
    noExpWarnMsg: string;
    insertedToastTitle: string;
    insertedToastMsgPrefix: string;
    latestRoleFallback: string;
    fullTitle: string;
    fullDesc: string;
    targetStdLabel: string;
    standards: {
      exec: string;
      tech: string;
      harvard: string;
      corp: string;
    };
    activeJobLabel: string;
    charsSuffix: string;
    noJobDescFallback: string;
    runBtn: string;
    runningBtn: string;
    aiPausedErr: string;
    quotaErr: string;
    localFallbackRec: string;
    proposalTitle: string;
    proposalDesc: string;
    appliedBtn: string;
    applyBtn: string;
    newSummaryLabel: string;
    alignedCompLabel: string;
    optExpLabel: string;
    matchEstimateLabel: string;
  };
  interviewSim: {
    badge: string;
    title: string;
    subtitle: string;
    generatingBtn: string;
    generateBtn: string;
    simProgress: string;
    answeredSuffix: string;
    readinessAvg: string;
    pending: string;
    candidateLabel: string;
    profileActive: string;
    closeErr: string;
    qTabPrefix: string;
    draftTitle: string;
    typeBehavioral: string;
    typeTechnical: string;
    typeSituational: string;
    questionWord: string;
    ofWord: string;
    prevTitle: string;
    nextTitle: string;
    recruiterSeeks: string;
    recommendedFormula: string;
    keyCriteria: string;
    yourAnswerLabel: string;
    recordingBtn: string;
    voiceDictateBtn: string;
    micTitle: string;
    answerPlaceholder: string;
    charsWord: string;
    wordsWord: string;
    starHint: string;
    evaluatingBtn: string;
    evaluateBtn: string;
    verdictTitle: string;
    verdictHigh: string;
    verdictMid: string;
    verdictLow: string;
    strengthsTitle: string;
    improvementsTitle: string;
    modelAnswerTitle: string;
    emptyTitle: string;
    emptyDesc: string;
    emptyBtn: string;
    errAiPausedGen: string;
    errAiPausedEval: string;
    errShortAnswer: string;
    errGenDefault: string;
    errEvalDefault: string;
  };
  jobMatches: {
    title: string;
    subtitlePrefix: string;
    subtitleMiddle: string;
    subtitleDefaultProfile: string;
    refreshBtn: string;
    compatibleJobs: string;
    indexedPool: string;
    analyzedCriteria: string;
    fullProfile: string;
    configTitle: string;
    configSummaryCountries: string;
    configSummaryRoles: string;
    configSummaryContracts: string;
    configSummaryAuto: string;
    configSummaryEmpty: string;
    clearTitle: string;
    clearBtn: string;
    targetRolesLabel: string;
    rolePlaceholder: string;
    addBtn: string;
    countriesLabel: string;
    countries: Record<string, string>;
    contractsLabel: string;
    contracts: Record<string, string>;
    workplaces: Record<'all' | 'remote' | 'hybrid' | 'onsite', string>;
    sources: Record<'all' | 'linkedin' | 'radar' | 'remotive' | 'arbeitnow' | 'jobicy' | 'remoteok', string>;
    externalPortalsTitle: string;
    searchPlaceholder: string;
    filterBtn: string;
    clearFilterBtn: string;
    retryBtn: string;
    emptyTitle: string;
    emptyDesc: string;
    resetFiltersBtn: string;
    matchLabel: string;
    inYourCvLabel: string;
    salaryLabel: string;
    applyBtn: string;
    viewOnPrefix: string;
    adaptAtsBtn: string;
    errFetch: string;
    periodUnits: {
      year: string;
      month: string;
      hour: string;
      day: string;
      week: string;
    };
    relRecent: string;
    relToday: string;
    relHoursPrefix: string;
    relHoursSuffix: string;
    relYesterday: string;
    relDaysPrefix: string;
    relDaysSuffix: string;
    tailorHeader: {
      role: string;
      company: string;
      portal: string;
      workplace: string;
      location: string;
      skills: string;
      description: string;
      criteria: string;
    };
  };
}

export const TOOLS_UI_TRANSLATIONS: Record<SiteLanguageCode, ToolsUiDictionary> = {
  pt: {
    app: {
      onlineTitle: 'Ligação Restabelecida',
      onlineDesc: 'A ligação à internet foi recuperada.',
      offlineTitle: 'Modo Offline',
      offlineDesc: 'Sem internet. O seu trabalho continua guardado no navegador.',
      wordToastDefault: 'Ficheiro Word (.docx) Descarregado!',
      wordToastLetter: 'Carta de Apresentação em Word (.docx) Oficial Descarregada!',
      wordToastCvPrefix: 'Currículo Word (',
      wordToastCvSuffix: ') Oficial Descarregado com Sucesso!',
      wordToastSub: 'Formatado segundo o padrão internacional de tipografia e margens.',
      pricingDefaultPrompt:
        'Para descarregar o seu currículo em Microsoft Word (.docx) ou PDF limpo sem marcas de água, ative um plano Pro ou Executivo VIP.',
      checkoutConfirmedPrompt:
        'Conta confirmada! Conclua agora a ativação do seu plano para liberar exportação Word (.docx), Radar ATS e traduções.',
      unlockedTitle: 'Acesso Desbloqueado!',
      unlockedSubSuffix: ' pronto para edição.',
      authModelPromptPrefix: 'Crie a sua conta ou inicie sessão para usar o ',
      authModelPromptSuffix: ' e começar a criar.',
      planModelPromptPrefix: 'A edição e download de modelos e exemplos requer subscrição ativa. Escolha o plano Pro ou Executivo VIP via Cartão ou Pix para abrir o ',
      planModelPromptSuffix: '.',
      modelLoadedTitle: 'Modelo Carregado!',
      modelLoadedSubSuffix: ' aberto para edição.',
      authTranslatePrompt:
        'Crie uma conta ou inicie sessão para traduzir o conteúdo do currículo e carta de apresentação.',
      planTranslatePrompt:
        'A tradução integral do currículo e carta para Inglês, Espanhol, Francês ou Alemão é exclusiva para assinantes Pro ou Executivo VIP.',
      langChangedTitle: 'Idioma Alterado',
      langChangedSubPrefix: 'Currículo e carta exibidos em ',
      translatedTitle: 'Conteúdo Traduzido!',
      translatedSubPrefix: 'Currículo e Carta de Apresentação traduzidos para ',
      notifTranslateTitle: 'Tradução Concluída',
      notifTranslateMsgPrefix: 'O seu currículo e carta de apresentação foram traduzidos para ',
      translationErrorTitle: 'Erro na Tradução do Conteúdo',
      translationErrorFallback: 'Não foi possível traduzir o conteúdo neste momento. Tente novamente.',
      authExportPrompt:
        'O registo é obrigatório para descarregar o currículo em formato Word (.docx). Registe-se ou inicie sessão para continuar.',
      planExportPrompt:
        'Os downloads oficiais em formato Microsoft Word (.docx) e PDF de Alta Resolução são exclusivos para subscritores. Ative o seu plano para descarregar o documento oficial sem marca de água.',
      exportLetterTitle: 'Carta de Apresentação Descarregada!',
      exportLetterSubPrefix: 'O ficheiro ',
      exportLetterSubSuffix: ' foi gerado com sucesso sem marcas de água.',
      exportCvTitle: 'Currículo Word Descarregado!',
      exportCvSubPrefix: 'Modelo ',
      exportCvSubSuffix: ' gerado em Word editável pronto a enviar.',
      notifExportTitle: 'Word Descarregado',
      notifExportLetterMsgPrefix: 'Carta de apresentação ',
      notifExportCvMsgPrefix: 'Currículo ',
      exportErrorTitle: 'Erro ao Descarregar',
      exportErrorDesc: 'Não foi possível criar o ficheiro Word. Verifique os dados inseridos.',
      maintenanceBadge: 'Manutenção Programada',
      maintenanceTitle: 'Plataforma Temporariamente em Atualização',
      maintenanceDefaultMsg: 'Estamos a realizar melhorias programadas nos servidores. Voltamos em instantes.',
      maintenanceAdminPrompt: 'Acesso reservado a administradores durante manutenção.',
      maintenanceAdminBtn: 'Acesso Administrador',
      adminMaintTitle: 'Modo de Manutenção ATIVO:',
      adminMaintDesc: 'Utilizadores comuns estão bloqueados. Apenas administradores conseguem aceder.',
      adminMaintBtn: 'Gerir no Admin',
      impersonateTitle: 'Modo de Personificação Ativo:',
      impersonateAs: 'A navegar como',
      impersonateExitBtn: 'Sair e Voltar ao Admin',
      resumeBuilderLabel: 'Criador de Currículo',
      modelLabelPrefix: 'Modelo ',
      authCreateSavePrompt: 'Crie a sua conta gratuita para guardar e baixar os seus currículos.',
      wordBadgeLocked: 'Word 🔒',
      wordBadgeOpen: 'Word'
    },
    multiLangModal: {
      modalTitle: 'Baixar Currículo Noutro Idioma',
      modalSubtitle: 'Traduza o seu currículo completo para candidatar-se noutros países.',
      selectLang: 'Escolha o idioma:',
      langNames: {
        pt: 'Português',
        en: 'Inglês',
        es: 'Espanhol',
        fr: 'Francês',
        de: 'Alemão'
      },
      activeTranslationPrefix: 'Tradução em ',
      activeTranslationSuffix: ' Ativa',
      readyTranslationPrefix: 'Pronto para traduzir para ',
      readyTranslationSuffix: '',
      translating: 'A traduzir...',
      updateTranslation: 'Atualizar Tradução',
      translateAction: 'Traduzir Agora',
      explanation:
        'Mantém os títulos e frases profissionais bem escritos no idioma escolhido, sem estragar o visual do documento.',
      previewTranslated: 'Pré-visualização do Currículo Traduzido',
      exportOptionsLabel: 'Como quer baixar:',
      downloading: 'A preparar...',
      downloadDocx: 'Baixar Word (.docx)',
      openXmlSub: 'Ficheiro Word editável',
      downloadPdf: 'Baixar / Imprimir PDF',
      vectorA4Sub: 'PDF limpo pronto a enviar',
      continueEditingPrompt: 'Quer continuar a editar este currículo no idioma selecionado?',
      applyToEditor: 'Abrir no Editor Principal',
      loadedEditorTitle: 'Currículo Aberto no Editor',
      loadedEditorSubPrefix: 'O editor agora mostra a versão em ',
      unlimitedFooter: '✓ Downloads e traduções ilimitadas no seu plano',
      planRequiredFooter: 'Downloads sem marca requerem plano Pro ou Executivo',
      close: 'Fechar',
      authTranslateReq: 'Precisa de entrar na conta para traduzir o currículo.',
      planTranslateReq:
        'Traduzir o currículo para outros idiomas é exclusivo para assinantes Pro e Executivo VIP.',
      authExportReq: 'Precisa de entrar na conta para baixar o currículo.',
      planExportReq: 'Baixar em Word requer um plano ativo.',
      authPdfReq: 'Precisa de entrar na conta para imprimir ou guardar em PDF.',
      planPdfReq: 'Baixar em PDF limpo requer um plano ativo.',
      translationReadyTitle: 'Tradução Concluída!',
      translationReadySubPrefix: 'Currículo traduzido para ',
      notifTranslateTitle: 'Tradução Concluída',
      notifTranslateMsgPrefix: 'O seu currículo foi traduzido para ',
      translationErrorTitle: 'Erro na Tradução',
      translationErrorFallback: 'Não foi possível traduzir agora. Tente novamente.',
      wordSuccessTitle: 'Word Descarregado!',
      wordSuccessSubPrefix: 'Ficheiro em ',
      wordSuccessSubSuffix: ' descarregado em Word editável.',
      wordErrorTitle: 'Erro ao Descarregar Word',
      wordErrorDesc: 'Não foi possível criar o documento.',
      notifExportTitle: 'Download Concluído',
      notifExportWordPrefix: 'Currículo em ',
      notifExportPdfPrefix: 'Currículo em ',
      notifExportPdfSuffix: ' preparado para imprimir ou guardar em PDF.'
    },
    coverPanel: {
      aiPaused: 'Os recursos de IA estão temporariamente pausados pela administração da plataforma.',
      serverErr: 'Servidor retornou erro na geração.',
      generatedAi: 'Carta de apresentação gerada com inteligência artificial!',
      invalidFormat: 'Formato inválido retornado.',
      generatedFallback: 'Carta gerada com sucesso e adaptada ao seu perfil!',
      planRequiredWord:
        'O download oficial da Carta de Apresentação em formato Word (.docx) requer um plano Pro ou Executive ativo.',
      planRequiredPdf:
        'A impressão e exportação oficial em PDF da Carta de Apresentação requerem um plano Pro ou Executive ativo.',
      recipientPlaceholder: 'Ex: Comité de Seleção',
      orgPlaceholder: 'Ex: Empresa ou Organização Alvo',
      rolePlaceholder: 'Ex: Coordenador de Projetos',
      defaultRecipient: 'Comité de Seleção e Recrutamento',
      defaultOrg: 'Diretoria de Recursos Humanos / Empresa Alvo',
      defaultRole: 'Cargo Pretendido'
    },
    miniPreview: {
      coverSidebarLabel: 'Carta de Apresentação',
      coverHeaderLabel: 'Carta de Motivação Profissional',
      a4Official: 'A4 · Formatação Oficial',
      contacts: 'Contactos',
      competencies: 'Competências',
      profile: 'Perfil Profissional',
      experience: 'Experiência Profissional',
      education: 'Formação Académica',
      europassBadge: 'Europass UE',
      aboutMe: 'Sobre Mim / Perfil',
      educationTraining: 'Educação & Formação',
      langSkills: 'Competências Linguísticas',
      techSummary: '> Resumo Técnico',
      minSummary: '01 / Resumo Executivo',
      stdSummary: 'Resumo Profissional',
      techComp: '> Stack & Competências',
      minComp: '02 / Competências',
      stdComp: 'Competências Nucleares',
      techExp: '> Experiência & Impacto',
      minExp: '03 / Experiência Profissional',
      stdExp: 'Experiência Profissional',
      techEdu: '> Formação Académica',
      minEdu: '04 / Educação',
      stdEdu: 'Formação Académica'
    },
    rawGenerator: {
      title: 'Importar ou Colar Currículo',
      descStandard:
        'Importe ou cole o seu currículo para o organizar num modelo profissional — sem precisar de vaga.',
      descTailored:
        'Coloque os seus dados e o anúncio da vaga para criar um currículo ajustado ao que a empresa procura.',
      clearTitle: 'Limpar tudo e começar do zero',
      clearBtn: 'Limpar Tudo',
      presetsLabel: 'Exemplos Prontos:',
      presetExec: 'Gestão & Operações',
      presetExecTitle: 'Carregar exemplo de Gestão e Operações',
      presetTech: 'Tecnologia & Cloud',
      presetTechTitle: 'Carregar exemplo de Tecnologia',
      presetFin: 'Finanças & Gestão',
      presetFinTitle: 'Carregar exemplo de Finanças',
      targetLabel: 'Estilo do Currículo:',
      stdOnu: 'Clássico Global',
      stdOnuTitle: 'Estilo Clássico Corporativo',
      stdTech: 'Tecnologia / Resultados',
      stdTechTitle: 'Foco em resultados com números claros',
      stdHarvard: 'Clássico Executivo',
      stdHarvardTitle: 'Estilo Executivo Clássico (Harvard)',
      stdEuropass: '📸 Europeu (Com Foto)',
      stdEuropassTitle: 'Formato Europeu com Foto e Idiomas',
      stdAts: 'Simples (Sem Foto)',
      stdAtsTitle: 'Formato simples e direto que todos os sites aceitam',
      modeStandardTitle: 'Criar Apenas o Currículo',
      modeStandardDesc:
        'Ideal se ainda não tem uma vaga específica. Organiza e melhora o seu currículo atual.',
      modeTailoredTitle: 'Adaptar para uma Vaga',
      modeTailoredDesc:
        'Cruza os seus dados com o anúncio da vaga para destacar as palavras que a empresa procura.',
      activeBadge: 'Ativo',
      sec1Title: '1. Os Seus Dados e Textos',
      importFileBtn: 'Enviar Ficheiro',
      importingFileBtn: 'A ler...',
      importFileTitle: 'Carregar PDF, Word (.docx) ou texto com o seu currículo ou notas',
      linkedinTitle: 'Importar do LinkedIn',
      linkedinHowBtn: 'Como funciona?',
      linkedinPlaceholder: 'https://www.linkedin.com/in/o-seu-perfil',
      linkedinExtracting: 'A importar...',
      linkedinExtractBtn: 'Importar Perfil',
      completedSuffix: '% Concluído',
      step1Label: 'A verificar o link do perfil...',
      step2Label: 'A organizar trabalhos, datas e estudos...',
      step4Label: 'Currículo organizado com sucesso!',
      logStart: 'A ler os dados públicos do perfil...',
      logStep2: 'Experiências e competências encontradas.',
      logDone1: 'Ligação ao perfil concluída.',
      logDone2: 'Cargos, datas e resultados organizados automaticamente.',
      logDone3: 'Tudo pronto para usar no seu currículo.',
      rolesExtractedLabel: 'Trabalhos',
      atsSkillsLabel: 'Competências',
      educationsLabel: 'Estudos',
      applyDirectBtn: 'Aplicar Tudo no Currículo',
      pasteRawBtn: 'Colar no Texto',
      linkedinHelperTitle: '💡 Como funciona a importação do LinkedIn:',
      linkedinHelper1: '1. O sistema lê as informações públicas do link indicado.',
      linkedinHelper2:
        '2. Os seus cargos, datas e competências são organizados automaticamente no currículo.',
      linkedinHelper3:
        '3. Clique em "Aplicar Tudo no Currículo" para editar ou descarregar logo de seguida.',
      rawTextareaLabel: 'Cole aqui o seu currículo antigo, notas, trabalhos ou cursos:',
      rawPlaceholder: `Escreva ou cole aqui os seus dados. Exemplo:

NOME COMPLETO
Cargo ou Profissão
Cidade, País | Telefone | E-mail | LinkedIn

EXPERIÊNCIA DE TRABALHO:
- Empresa 1: Cargo, Datas, O que fazia e resultados
- Empresa 2: Cargo, Datas, Ferramentas usadas e conquistas

ESTUDOS E FORMAÇÃO:
- Curso, Escola ou Universidade, Ano

COMPETÊNCIAS:
- Programas, Idiomas e Certificados...`,
      charsInsertedSuffix: 'caracteres inseridos',
      switchToTailoredBtn: 'Tem uma vaga específica? Clique para colar a vaga →',
      sec2Title: '2. Descrição da Vaga (Opcional)',
      importTdrBtn: 'Enviar Ficheiro',
      importingTdrBtn: 'A ler...',
      importTdrTitle: 'Carregar PDF ou Word com a descrição da vaga',
      sampleJobsLabel: 'Exemplos de Vagas:',
      jobChipLabels: {
        'job-1': 'Gestor de Operações',
        'job-2': 'Tecnologia & Cloud',
        'job-3': 'Finanças',
        'job-4': 'Gestão de Projetos'
      },
      jobTextareaLabel: 'Cole aqui o texto do anúncio da vaga:',
      jobTextareaPlaceholder:
        'Cole aqui a descrição da vaga, requisitos e o que a empresa procura...',
      charsInJobSuffix: 'caracteres na vaga',
      switchToStandardBtn: 'Ainda não tenho vaga (criar apenas o CV)',
      bannerDescStandard:
        'O sistema organiza e melhora as suas experiências, estudos e competências no modelo escolhido — pronto para qualquer candidatura.',
      bannerDescTailored:
        'O sistema compara o seu currículo com a vaga e destaca exatamente as palavras e resultados que a empresa procura.',
      generateOnlyBtn: 'Criar Apenas CV',
      generatingStandard: 'A Organizar o seu Currículo...',
      generatingTailored: 'A Adaptar o seu Currículo à Vaga...',
      generateStandardCta: 'Criar Currículo Agora',
      generateTailoredCta: 'Criar CV Adaptado à Vaga',
      msgExecLoaded: 'Exemplo de Gestão e Operações carregado!',
      msgTechLoaded: 'Exemplo de Tecnologia carregado!',
      msgFinLoaded: 'Exemplo de Finanças carregado!',
      msgDocImportedPrefix: 'Ficheiro "',
      msgDocImportedSuffix: '" importado com sucesso!',
      msgJobDocImportedPrefix: 'Descrição da vaga "',
      msgJobDocImportedSuffix: '" importada com sucesso!',
      msgErrExtract: 'Erro ao ler o texto do ficheiro.',
      msgErrNoInput: 'Por favor envie o seu currículo (PDF/Word) ou escreva alguns dados antes de avançar.',
      msgErrNoJob: 'Cole a descrição da vaga ou mude para "Criar Apenas o Currículo".',
      msgAiPausedStandard: 'A IA está em pausa; o seu currículo foi organizado localmente com sucesso!',
      msgAiPausedTailored: 'A IA está em pausa; organização local aplicada com sucesso!',
      msgSuccessStandard: 'Currículo criado e organizado com sucesso!',
      msgSuccessTailored: 'Currículo criado e adaptado com sucesso para a vaga!',
      msgFallbackStandard: 'Currículo organizado com sucesso a partir dos seus dados!',
      msgFallbackTailored: 'Currículo organizado e adaptado para a vaga!',
      msgErrLinkedInUrl: 'Cole o link do seu LinkedIn (ex: https://linkedin.com/in/seu-nome).',
      msgLinkedInSuccess: 'Dados do LinkedIn importados com sucesso!',
      msgLinkedInApplied: 'Currículo atualizado com os dados do LinkedIn!',
      msgLinkedInPasted: 'Dados colados no campo de texto!'
    },
    atsRadar: {
      bannerTitle: 'Compatibilidade com a Vaga',
      statusNoJob:
        'Cole abaixo o texto da vaga (ou escolha um exemplo) para ver o que falta no seu currículo.',
      statusHigh: 'Ótimo! O seu currículo combina muito bem com a vaga.',
      statusMid: 'Bom caminho, mas ainda faltam algumas palavras importantes da vaga.',
      statusLow: 'Atenção: faltam várias palavras importantes que a empresa procura.',
      optimizeAiBtn: 'Melhorar CV p/ Vaga',
      tabAudit: 'Palavras da Vaga',
      tabBotView: 'Como o Sistema Lê',
      tabChecklist: 'Lista de Verificação',
      jobHeader: 'Descrição da Vaga',
      loadSampleLabel: 'Exemplo:',
      jobChips: {
        'job-1': 'Gestor Operações',
        'job-2': 'Tecnologia & Cloud',
        'job-3': 'Finanças',
        'job-4': 'Gestão Projetos'
      },
      jobPlaceholder:
        'Cole aqui o texto do anúncio da vaga (requisitos, competências e funções)...',
      noJobWarning:
        'Sem vaga inserida: cole o anúncio acima ou clique num exemplo para analisar as palavras em falta.',
      activeJobInfo: 'O sistema compara o seu currículo com os requisitos desta vaga.',
      missingTitle: 'Palavras em Falta',
      destLabel: 'Guardar em:',
      destComp: 'Competências',
      destSummary: 'Resumo',
      destExp: 'Último Trabalho',
      destCompTitle: 'Adicionar às Competências do CV',
      destSummaryTitle: 'Adicionar ao Resumo',
      destExpTitle: 'Adicionar ao último trabalho',
      destCompFull: 'Competências',
      destSummaryFull: 'Resumo',
      destExpFull: 'Último Trabalho',
      clickPlusPrefix: 'Toque no',
      clickPlusMiddle: 'para adicionar em',
      addAllBtn: '+ Adicionar Todas',
      waitingJobMsg: 'Cole a descrição da vaga acima para ver o que falta no seu currículo.',
      congratsNoMissing: 'Muito bem! Todas as palavras principais da vaga já estão no seu currículo.',
      insertAriaPrefix: 'Adicionar em',
      matchedTitle: 'Palavras já encontradas no seu CV',
      noMatchedMsg: 'Ainda não há palavras em comum com esta vaga.',
      metricsTitle: 'Números e Resultados no CV',
      metricsHigh: 'Boa quantidade de números e resultados',
      metricsLow: 'Poucos números ou resultados',
      metricsTip:
        'As empresas gostam de ver resultados claros com números (ex: "atendeu 50 clientes por dia", "reduziu atrasos em 30%").',
      verbsTitle: 'Palavras Fortes de Ação',
      verbsSub: 'palavras fortes usadas',
      recsTitle: 'O que Pode Melhorar para Esta Vaga',
      recMissingPrefix: 'Inclua as palavras que faltam: "',
      recMissingSuffix: '" nas competências ou experiências.',
      recMetrics:
        'Adicione números ou quantidades reais nos seus trabalhos (ex: percentagens, nº de clientes, equipa ou prazos).',
      recPassivePrefix: 'Troque expressões fracas como "',
      recPassiveSuffix: '" por verbos diretos ("Liderou", "Organizou", "Melhorou").',
      recSummary:
        'O seu resumo está muito curto. Escreva 3 a 5 linhas a explicar a sua experiência e o que faz melhor.',
      recExcellent: 'Excelente! O seu currículo está bem completo e alinhado com a vaga.',
      botTitle: 'Texto lido pelos sistemas automáticos das empresas',
      copiedBtn: 'Copiado!',
      copyExtractedBtn: 'Copiar Texto Lido',
      ocrReadability: 'Leitura Simples',
      ocrRolesBullets: 'Cargos / Pontos',
      ocrSkills: 'Competências',
      ocrStructurePhoto: 'Formato / Foto',
      twoCols: '2 Colunas',
      oneCol: 'Coluna Única',
      withPhoto: ' · Com Foto',
      botDesc:
        'Abaixo vê exatamente o texto simples que os sites de emprego leem do seu currículo.',
      checklistTitle: 'Verificação de Formato Simples',
      c1Title: 'Texto em Coluna Única (Fácil de Ler)',
      c1Ok: 'Ótimo',
      c1Warn: 'Aviso: 2 Colunas',
      c1Desc: 'Modelos de coluna única são os mais fáceis de ler por qualquer empresa ou site de emprego.',
      c2Title: 'Dados de Contacto Completos',
      c2Ok: 'Completo',
      c2Fail: 'Faltam Dados',
      c2Desc: 'E-mail, telefone com indicativo e cidade devem estar bem visíveis no topo.',
      c3Title: 'Resumo Completo (100+ letras)',
      c3Ok: 'Bom tamanho',
      c3Warn: 'Curto',
      c3Desc: 'Um bom resumo explica logo quem é, quantos anos de experiência tem e o que sabe fazer.',
      c4Title: 'Conquistas com Números e Resultados',
      c4Unit: 'resultados',
      c4Desc: 'Os recrutadores valorizam frases com números reais, quantidades ou percentagens (%).'
    },
    aiTailor: {
      tabFull: 'Adaptar à Vaga',
      tabXyz: 'Escrever Conquista',
      xyzBadge: 'Fórmula Simples de Resultado',
      xyzTitle: 'Criar Frase de Conquista Forte',
      xyzSubtitlePrefix: 'Use a regra simples: ',
      xyzSubtitleStrong: '"O que fez + quanto melhorou (números) + como fez"',
      xyzSubtitleSuffix: ' para impressionar recrutadores.',
      presetsLabel: 'Exemplos Prontos:',
      presetOps: 'Operações',
      presetOpsSub: 'Entregas -28% tempo',
      presetTech: 'Tecnologia',
      presetTechSub: 'Sistema 99.9% ativo',
      presetFin: 'Finanças',
      presetFinSub: 'Contas -75% tempo',
      presetLead: 'Liderança',
      presetLeadSub: 'Equipa +40% retenção',
      xLabel: '1. O que fez ou melhorou?',
      xPlaceholder: 'Ex: Reduziu custos e atrasos nas entregas',
      yLabel: '2. Quanto melhorou? (Números, %, €)',
      yPlaceholder: 'Ex: em 25% em 6 meses',
      zLabel: '3. Como conseguiu?',
      zPlaceholder: 'Ex: organizando melhor as rotas e negociando com fornecedores',
      resultLabel: 'Frase Pronta para o seu Currículo',
      copiedBtn: 'Copiado!',
      copyBtn: 'Copiar Frase',
      insertedBtn: 'Adicionada ao Trabalho!',
      insertBtn: 'Adicionar ao Último Trabalho',
      noExpWarnTitle: 'Sem Trabalhos Adicionados',
      noExpWarnMsg: 'Adicione primeiro um trabalho no Editor antes de inserir esta frase.',
      insertedToastTitle: 'Frase Adicionada',
      insertedToastMsgPrefix: 'Adicionada ao cargo',
      latestRoleFallback: 'mais recente',
      fullTitle: 'Adaptar Currículo à Vaga com IA',
      fullDesc:
        'Reescreve o seu resumo e experiências para combinar melhor com o anúncio da vaga.',
      targetStdLabel: 'Estilo de Escrita',
      standards: {
        exec: 'Liderança & Gestão (Foco em Resultados)',
        tech: 'Tecnologia & Informática (Foco Técnico)',
        harvard: 'Finanças & Gestão Empresarial',
        corp: 'Profissional Geral & Projetos'
      },
      activeJobLabel: 'Vaga Selecionada',
      charsSuffix: 'caracteres',
      noJobDescFallback:
        'Nenhuma vaga colada ainda — a IA vai melhorar o currículo de forma geral (pode colar uma vaga no Verificador CV).',
      runBtn: 'Melhorar Currículo com IA',
      runningBtn: 'A analisar e melhorar...',
      aiPausedErr: 'Os recursos de IA estão temporariamente em pausa pela administração.',
      quotaErr: 'Os seus créditos gratuitos de IA terminaram. Faça upgrade para continuar.',
      localFallbackRec: 'Currículo ajustado localmente com linguagem mais clara e direta.',
      proposalTitle: 'Sugestão de Melhoria',
      proposalDesc: 'Veja as melhorias sugeridas antes de aplicar ao seu currículo.',
      appliedBtn: 'Aplicado!',
      applyBtn: 'Aplicar ao Currículo',
      newSummaryLabel: 'Novo Resumo Sugerido',
      alignedCompLabel: 'Competências Sugeridas',
      optExpLabel: 'Experiências Melhoradas com Resultados',
      matchEstimateLabel: 'Compatibilidade Estimada:'
    },
    interviewSim: {
      badge: 'Preparação para Entrevista',
      title: 'Treino de Entrevista com IA',
      subtitle:
        'Pratique as 5 perguntas mais prováveis para a sua vaga. Escreva ou fale a resposta e receba dicas e exemplos de boas respostas.',
      generatingBtn: 'A criar 5 perguntas...',
      generateBtn: 'Gerar Novas Perguntas',
      simProgress: 'Progresso:',
      answeredSuffix: 'Respondidas',
      readinessAvg: 'Média das Respostas:',
      pending: 'Pendente',
      candidateLabel: 'Candidato:',
      profileActive: 'Perfil Ativo',
      closeErr: 'Fechar',
      qTabPrefix: 'Pergunta',
      draftTitle: 'Rascunho guardado',
      typeBehavioral: 'Comportamento',
      typeTechnical: 'Conhecimento Técnico',
      typeSituational: 'Situação Prática',
      questionWord: 'Pergunta',
      ofWord: 'de',
      prevTitle: 'Pergunta anterior',
      nextTitle: 'Próxima pergunta',
      recruiterSeeks: 'O que a Empresa Quer Saber:',
      recommendedFormula: 'Como Responder Bem:',
      keyCriteria: 'Pontos Importantes:',
      yourAnswerLabel: 'A Sua Resposta:',
      recordingBtn: 'A ouvir...',
      voiceDictateBtn: 'Falar Resposta',
      micTitle: 'Usar o microfone para responder',
      answerPlaceholder:
        'Escreva a sua resposta como se estivesse na entrevista. Conte a situação, o que você fez e qual foi o resultado...',
      charsWord: 'caracteres',
      wordsWord: 'palavras',
      starHint: 'A IA analisa clareza, exemplos reais e resultados.',
      evaluatingBtn: 'A avaliar resposta...',
      evaluateBtn: 'Avaliar a Minha Resposta',
      verdictTitle: 'Avaliação:',
      verdictHigh: 'Excelente resposta! Clara, concreta e convincente.',
      verdictMid: 'Boa resposta, mas tente incluir um exemplo ou número mais concreto.',
      verdictLow: 'Resposta muito curta ou vaga. Veja as dicas abaixo para melhorar.',
      strengthsTitle: 'O que Ficou Bem:',
      improvementsTitle: 'O que Pode Melhorar:',
      modelAnswerTitle: 'Exemplo de Boa Resposta:',
      emptyTitle: 'Nenhuma pergunta criada ainda',
      emptyDesc: 'Toque no botão acima para gerar 5 perguntas de treino para o seu currículo.',
      emptyBtn: 'Gerar Perguntas de Entrevista',
      errAiPausedGen: 'O treino de entrevistas por IA está temporariamente em pausa.',
      errAiPausedEval: 'A avaliação por IA está temporariamente em pausa.',
      errShortAnswer: 'Escreva uma resposta um pouco mais completa (mínimo 15 caracteres) antes de avaliar.',
      errGenDefault: 'Erro ao criar perguntas de entrevista.',
      errEvalDefault: 'Erro ao avaliar a resposta. Tente novamente.'
    },
    jobMatches: {
      title: 'Vagas Compatíveis com o seu CV',
      subtitlePrefix: 'Cruzamento ao vivo em',
      subtitleMiddle: 'para',
      subtitleDefaultProfile: 'o seu perfil',
      refreshBtn: 'Atualizar',
      compatibleJobs: 'Vagas compatíveis',
      indexedPool: 'Base ativa indexada',
      analyzedCriteria: 'Critérios analisados',
      fullProfile: 'Perfil completo',
      configTitle: 'Configurar Preferências de Vagas',
      configSummaryCountries: 'país(es)',
      configSummaryRoles: 'cargo(s)',
      configSummaryContracts: 'contrato(s)',
      configSummaryAuto: '(atualização automática)',
      configSummaryEmpty: 'Personalize países, cargos e tipos de contrato',
      clearTitle: 'Limpar todas as preferências',
      clearBtn: 'Limpar',
      targetRolesLabel: 'Cargos Preferidos',
      rolePlaceholder: 'Adicionar cargo (ex: Product Manager, React Developer)...',
      addBtn: 'Adicionar',
      countriesLabel: 'Países e Regiões Preferidas',
      countries: {
        remoto_global: 'Remoto Global',
        brasil: 'Brasil',
        portugal: 'Portugal',
        angola: 'Angola',
        espanha: 'Espanha',
        reino_unido: 'Reino Unido',
        alemanha: 'Alemanha',
        franca: 'França',
        estados_unidos: 'Estados Unidos',
        canada: 'Canadá',
        europa: 'União Europeia'
      },
      contractsLabel: 'Tipos de Contrato Preferidos',
      contracts: {
        full_time: 'Tempo Integral',
        contract: 'Contrato / PJ / Freelance',
        part_time: 'Meio Período',
        internship: 'Estágio / Trainee'
      },
      workplaces: {
        all: 'Todas modalidades',
        remote: 'Remoto',
        hybrid: 'Híbrido',
        onsite: 'Presencial'
      },
      sources: {
        all: 'Todos os Portais',
        linkedin: 'LinkedIn',
        radar: 'Radar de Vagas',
        remotive: 'Remotive',
        arbeitnow: 'Arbeitnow',
        jobicy: 'Jobicy',
        remoteok: 'RemoteOK'
      },
      externalPortalsTitle: 'Pesquisar o seu perfil diretamente noutros grandes portais:',
      searchPlaceholder: 'Filtrar por cargo, empresa ou competência (ex: React, Finance, SAP)...',
      filterBtn: 'Filtrar',
      clearFilterBtn: 'Limpar',
      retryBtn: 'Tentar Novamente',
      emptyTitle: 'Nenhuma vaga exata encontrada para as preferências selecionadas',
      emptyDesc:
        'Experimente adicionar "Remoto Global" nos países ou alargar os cargos e tipos de contrato selecionados acima.',
      resetFiltersBtn: 'Repor Filtros e Preferências',
      matchLabel: 'match',
      inYourCvLabel: 'No seu CV:',
      salaryLabel: 'Salário:',
      applyBtn: 'Aplicar à Vaga',
      viewOnPrefix: 'Ver no',
      adaptAtsBtn: 'Adaptar CV (ATS)',
      errFetch: 'Erro ao conectar com os portais de vagas.',
      periodUnits: {
        year: '/ano',
        month: '/mês',
        hour: '/hora',
        day: '/dia',
        week: '/semana'
      },
      relRecent: 'Recente',
      relToday: 'Hoje',
      relHoursPrefix: 'Há ',
      relHoursSuffix: 'h',
      relYesterday: 'Ontem',
      relDaysPrefix: 'Há ',
      relDaysSuffix: 'd',
      tailorHeader: {
        role: 'Cargo',
        company: 'Empresa',
        portal: 'Portal',
        workplace: 'Modalidade',
        location: 'Localização',
        skills: 'Competências e Palavras-Chave',
        description: 'Descrição da Vaga',
        criteria: 'Critérios de compatibilidade detetados'
      }
    }
  },
  en: {
    app: {
      onlineTitle: 'Connection Restored',
      onlineDesc: 'Your internet connection is back.',
      offlineTitle: 'Offline Mode',
      offlineDesc: 'No internet connection. Your work remains saved locally.',
      wordToastDefault: 'Word File (.docx) Downloaded!',
      wordToastLetter: 'Official Cover Letter (.docx) Downloaded!',
      wordToastCvPrefix: 'Official Word Resume (',
      wordToastCvSuffix: ') Downloaded!',
      wordToastSub: 'Formatted to international typography and margin standards.',
      pricingDefaultPrompt:
        'Activate a Pro or Executive VIP plan to export clean Microsoft Word (.docx) and high-resolution PDF files without watermarks.',
      checkoutConfirmedPrompt:
        'Account confirmed! Complete your plan activation now to unlock Word (.docx) exports, ATS Radar, and translations.',
      unlockedTitle: 'Access Unlocked!',
      unlockedSubSuffix: ' ready to edit.',
      authModelPromptPrefix: 'Create your account or sign in to use ',
      authModelPromptSuffix: ' and start building.',
      planModelPromptPrefix:
        'Editing and exporting templates requires an active subscription. Choose Pro or Executive VIP via Card or Pix to open ',
      planModelPromptSuffix: '.',
      modelLoadedTitle: 'Template Loaded!',
      modelLoadedSubSuffix: ' opened for editing.',
      authTranslatePrompt: 'Create an account or sign in to translate your resume and cover letter content.',
      planTranslatePrompt:
        'Full AI translation of your resume and cover letter into English, Spanish, French, or German is exclusive to Pro and Executive VIP plans.',
      langChangedTitle: 'Language Changed',
      langChangedSubPrefix: 'Resume and cover letter now shown in ',
      translatedTitle: 'Content Translated!',
      translatedSubPrefix: 'Resume and Cover Letter translated to ',
      notifTranslateTitle: 'Translation Complete',
      notifTranslateMsgPrefix: 'Your resume and cover letter were translated to ',
      translationErrorTitle: 'Translation Error',
      translationErrorFallback: 'Could not translate content right now. Please try again.',
      authExportPrompt: 'Sign in or register to download your resume in Microsoft Word (.docx) format.',
      planExportPrompt:
        'Official Microsoft Word (.docx) and high-resolution PDF downloads are exclusive to subscribers. Activate a plan for watermark-free exports.',
      exportLetterTitle: 'Cover Letter Downloaded!',
      exportLetterSubPrefix: 'File ',
      exportLetterSubSuffix: ' generated cleanly without watermarks.',
      exportCvTitle: 'Word Resume Downloaded!',
      exportCvSubPrefix: 'Template ',
      exportCvSubSuffix: ' generated with native OpenXML formatting and 100% ATS compatibility.',
      notifExportTitle: 'Word Export Complete',
      notifExportLetterMsgPrefix: 'Cover letter ',
      notifExportCvMsgPrefix: 'Resume ',
      exportErrorTitle: 'Export Error',
      exportErrorDesc: 'Unable to compile the Word document. Please check your fields.',
      maintenanceBadge: 'Scheduled Maintenance',
      maintenanceTitle: 'Platform Temporarily Updating',
      maintenanceDefaultMsg: 'We are performing scheduled improvements. We will be back shortly.',
      maintenanceAdminPrompt: 'Access restricted to administrators during maintenance.',
      maintenanceAdminBtn: 'Administrator Access',
      adminMaintTitle: 'Maintenance Mode ACTIVE:',
      adminMaintDesc: 'Regular users are locked out. Only administrators can access.',
      adminMaintBtn: 'Manage in Admin',
      impersonateTitle: 'Impersonation Mode Active:',
      impersonateAs: 'Viewing as',
      impersonateExitBtn: 'Exit & Return to Admin',
      resumeBuilderLabel: 'Resume Builder',
      modelLabelPrefix: 'Template ',
      authCreateSavePrompt: 'Create your free account to save and export your resumes.',
      wordBadgeLocked: 'Word 🔒',
      wordBadgeOpen: 'Word'
    },
    multiLangModal: {
      modalTitle: 'Download Resume in Another Language',
      modalSubtitle: 'Full executive translation for international hiring processes.',
      selectLang: 'Select target language:',
      langNames: {
        pt: 'Portuguese',
        en: 'English',
        es: 'Spanish',
        fr: 'French',
        de: 'German'
      },
      activeTranslationPrefix: 'Translation for ',
      activeTranslationSuffix: ' Active',
      readyTranslationPrefix: 'Ready to translate to ',
      readyTranslationSuffix: '',
      translating: 'Translating with AI...',
      updateTranslation: 'Refresh Translation',
      translateAction: 'Translate with AI',
      explanation:
        'Preserves executive job titles aligned with target markets, upgrades bullet points with strong action verbs, and keeps 100% metric and ATS accuracy.',
      previewTranslated: 'Translated Document Preview',
      exportOptionsLabel: 'Export Options:',
      downloading: 'Exporting...',
      downloadDocx: 'Download Word (.docx)',
      openXmlSub: 'Native OpenXML formatting',
      downloadPdf: 'Download / Print PDF',
      vectorA4Sub: 'Watermark-free vector A4 layout',
      continueEditingPrompt: 'Want to keep editing this resume in the selected language?',
      applyToEditor: 'Load into Main Editor',
      loadedEditorTitle: 'Resume Loaded into Editor',
      loadedEditorSubPrefix: 'Main editor now displays the translated version in ',
      unlimitedFooter: '✓ Unlimited downloads and translations in your plan',
      planRequiredFooter: 'Official downloads require a Pro or Executive plan',
      close: 'Close',
      authTranslateReq: 'Please sign in or register to translate your resume.',
      planTranslateReq:
        'Multi-language executive AI translation (English, Spanish, French, German) is exclusive to Pro and Executive VIP plans.',
      authExportReq: 'Sign in required to export your resume.',
      planExportReq: 'Official Word export requires an active subscription.',
      authPdfReq: 'Sign in required to print or save as PDF.',
      planPdfReq: 'Official PDF export requires an active subscription.',
      translationReadyTitle: 'Translation Complete!',
      translationReadySubPrefix: 'Resume adapted to ',
      notifTranslateTitle: 'Multi-Language Translation Complete',
      notifTranslateMsgPrefix: 'Your resume was translated and adapted to ',
      translationErrorTitle: 'Translation Error',
      translationErrorFallback: 'Could not translate your resume. Please try again later.',
      wordSuccessTitle: 'Word Downloaded!',
      wordSuccessSubPrefix: 'File in ',
      wordSuccessSubSuffix: ' exported with native OpenXML formatting.',
      wordErrorTitle: 'Word Download Error',
      wordErrorDesc: 'Unable to compile the document.',
      notifExportTitle: 'Multi-Language Export Complete',
      notifExportWordPrefix: 'Resume in ',
      notifExportPdfPrefix: 'Resume in ',
      notifExportPdfSuffix: ' prepared for PDF/print.'
    },
    coverPanel: {
      aiPaused: 'AI features are temporarily paused by platform administration.',
      serverErr: 'Server returned a generation error.',
      generatedAi: 'Cover letter generated with AI!',
      invalidFormat: 'Invalid format returned.',
      generatedFallback: 'Cover letter generated and tailored to your profile!',
      planRequiredWord: 'Official Cover Letter export in Word (.docx) requires an active Pro or Executive plan.',
      planRequiredPdf: 'Official PDF print/export of the Cover Letter requires an active Pro or Executive plan.',
      recipientPlaceholder: 'e.g. Hiring Committee',
      orgPlaceholder: 'e.g. Target Company / Organization',
      rolePlaceholder: 'e.g. Operations Director',
      defaultRecipient: 'Hiring & Selection Committee',
      defaultOrg: 'Human Resources / Target Company',
      defaultRole: 'Target Role'
    },
    miniPreview: {
      coverSidebarLabel: 'Cover Letter',
      coverHeaderLabel: 'Executive Motivation Letter',
      a4Official: 'A4 · Official Formatting',
      contacts: 'Contact',
      competencies: 'Skills',
      profile: 'Professional Profile',
      experience: 'Work Experience',
      education: 'Education',
      europassBadge: 'EU Europass',
      aboutMe: 'About Me / Profile',
      educationTraining: 'Education & Training',
      langSkills: 'Language Skills',
      techSummary: '> Technical Summary',
      minSummary: '01 / Executive Summary',
      stdSummary: 'Professional Summary',
      techComp: '> Stack & Skills',
      minComp: '02 / Competencies',
      stdComp: 'Core Competencies',
      techExp: '> Experience & Impact',
      minExp: '03 / Experience',
      stdExp: 'Professional Experience',
      techEdu: '> Education',
      minEdu: '04 / Education',
      stdEdu: 'Academic Background'
    },
    rawGenerator: {
      title: 'ATS Resume Importer & Builder',
      descStandard:
        'Import or paste your resume to structure and polish it into an executive layout — no job description required.',
      descTailored:
        'Paste your career notes and a target job posting to generate an ATS-tailored resume.',
      clearTitle: 'Clear all fields and start blank',
      clearBtn: 'Clear All',
      presetsLabel: 'Quick Career Presets:',
      presetExec: 'Executive & Ops',
      presetExecTitle: 'Load Executive Leadership & Operations profile',
      presetTech: 'Tech Lead & Cloud',
      presetTechTitle: 'Load Tech Lead & Cloud Architecture profile',
      presetFin: 'Finance & CFO',
      presetFinTitle: 'Load Corporate Finance & CFO profile',
      targetLabel: 'Target Standard:',
      stdOnu: 'Global Corporate',
      stdOnuTitle: 'Global Corporate & Multilateral Projects Standard',
      stdTech: 'Big Tech / Google',
      stdTechTitle: 'Google XYZ Quantified Impact Formula',
      stdHarvard: 'Harvard Executive',
      stdHarvardTitle: 'Harvard Business School Executive Format',
      stdEuropass: '📸 European Europass',
      stdEuropassTitle: 'Official European Union Standard (Photo + CEFR)',
      stdAts: 'Pure ATS (No Photo)',
      stdAtsTitle: 'Zero-rejection linear layout for ATS parsers',
      modeStandardTitle: 'Generate Resume Only',
      modeStandardDesc:
        'Ideal when you already imported your resume without a specific posting. Keeps and elevates your actual career.',
      modeTailoredTitle: 'Tailor Resume to a Job',
      modeTailoredDesc:
        'Cross-references your background with a job description or ToR to maximize keywords and ATS match.',
      activeBadge: 'Active',
      sec1Title: '1. Your Information & Background',
      importFileBtn: 'Import File',
      importingFileBtn: 'Extracting...',
      importFileTitle: 'Upload PDF, Word (.docx), or text file with your resume or notes',
      linkedinTitle: 'Connect & Import from LinkedIn',
      linkedinHowBtn: 'How does sync work?',
      linkedinPlaceholder: 'https://www.linkedin.com/in/your-executive-profile',
      linkedinExtracting: 'Running Job...',
      linkedinExtractBtn: 'Extract Profile (Job)',
      completedSuffix: '% Complete',
      step1Label: 'Validating URL and checking public profile headers...',
      step2Label: 'Extracting roles, companies, and academic history...',
      step4Label: 'Career structured successfully in ATS format!',
      logStart: 'Background async extraction worker started.',
      logStep2: 'Career history and core competencies located.',
      logDone1: 'Public profile connection validated.',
      logDone2: 'Roles, dates, and achievements calibrated in Google XYZ format.',
      logDone3: 'Model ready for direct integration.',
      rolesExtractedLabel: 'Roles Extracted',
      atsSkillsLabel: 'ATS Skills',
      educationsLabel: 'Degrees',
      applyDirectBtn: 'Apply Directly to Resume',
      pasteRawBtn: 'Paste into Text',
      linkedinHelperTitle: '💡 How the background worker operates:',
      linkedinHelper1: '1. The worker asynchronously fetches the provided public profile URL.',
      linkedinHelper2: '2. Roles, dates, and skills are extracted and mapped automatically to your CVData structure.',
      linkedinHelper3: '3. Click "Apply Directly to Resume" to open the profile right inside the editor.',
      rawTextareaLabel: 'Paste your notes, previous resume, roles, projects, or skills below:',
      rawPlaceholder: `Paste your professional details here. Example:

FULL NAME
Job Title or Specialty
City, Country | Phone | Email | LinkedIn

WORK EXPERIENCE:
- Company 1: Role, Period, Key responsibilities and quantified impact
- Company 2: Role, Period, Tools used and achievements

EDUCATION:
- Degree, University, Graduation Year

SKILLS:
- Software, Languages, Methodologies & Certifications...`,
      charsInsertedSuffix: 'characters entered',
      switchToTailoredBtn: 'Have a specific job posting? Click to add job description →',
      sec2Title: '2. Target Job Posting / ToR',
      importTdrBtn: 'Import ToR',
      importingTdrBtn: 'Extracting ToR...',
      importTdrTitle: 'Upload PDF or Word (.docx) with Terms of Reference (ToR) or job ad',
      sampleJobsLabel: 'Sample Jobs:',
      jobChipLabels: {
        'job-1': 'COO Operations',
        'job-2': 'Cloud & Tech Lead',
        'job-3': 'VP Finance & M&A',
        'job-4': 'Global Governance'
      },
      jobTextareaLabel: 'Paste the complete job description (requirements, skills, responsibilities):',
      jobTextareaPlaceholder: 'Paste the job posting, Terms of Reference, required competencies...',
      charsInJobSuffix: 'characters in job description',
      switchToStandardBtn: 'No job yet (generate resume only)',
      bannerDescStandard:
        'AI will extract, organize, and refine your experiences, skills, and education cleanly in the selected standard.',
      bannerDescTailored:
        'AI will analyze semantic fit and rewrite your resume emphasizing exact metrics, keywords, and action verbs for this role.',
      generateOnlyBtn: 'Generate Resume Only',
      generatingStandard: 'Structuring Your Resume...',
      generatingTailored: 'Matching & Generating Tailored Resume...',
      generateStandardCta: 'Generate Structured Resume',
      generateTailoredCta: 'Generate Job-Tailored Resume',
      msgExecLoaded: 'Executive Leadership & Strategy preset loaded!',
      msgTechLoaded: 'Tech Lead & Cloud Architect preset loaded!',
      msgFinLoaded: 'Corporate Finance & CFO preset loaded!',
      msgDocImportedPrefix: 'Document "',
      msgDocImportedSuffix: '" imported successfully!',
      msgJobDocImportedPrefix: 'Job / ToR file "',
      msgJobDocImportedSuffix: '" imported successfully!',
      msgErrExtract: 'Error extracting text from file.',
      msgErrNoInput: 'Please upload your resume (PDF/Word) or paste your career details before generating.',
      msgErrNoJob: 'To tailor to a job, paste the job description or switch to "Generate Resume Only".',
      msgAiPausedStandard: 'External AI is paused; your resume was structured locally with success!',
      msgAiPausedTailored: 'External AI is paused; local structuring applied successfully!',
      msgSuccessStandard: 'Resume structured and polished successfully in your chosen standard!',
      msgSuccessTailored: 'Resume generated with AI and tailored for the job posting!',
      msgFallbackStandard: 'Resume structured successfully from your imported data!',
      msgFallbackTailored: 'Resume structured and adapted cleanly for the target role!',
      msgErrLinkedInUrl: 'Enter your public LinkedIn profile URL (e.g. https://linkedin.com/in/your-name).',
      msgLinkedInSuccess: 'LinkedIn career history extracted and formatted!',
      msgLinkedInApplied: 'Resume updated directly from your LinkedIn profile!',
      msgLinkedInPasted: 'Extracted data copied into the raw text editor!'
    },
    atsRadar: {
      bannerTitle: 'ATS Compatibility Score (Applicant Tracking System)',
      statusNoJob: 'Paste the target job description below (or pick a sample) to calculate exact keyword match.',
      statusHigh: 'Excellent! High keyword density and strong alignment with the role.',
      statusMid: 'Good alignment, though decisive technical terms are still missing.',
      statusLow: 'Warning: High risk of automated filtering by ATS screening bots.',
      optimizeAiBtn: 'Optimize w/ AI to 95%+',
      tabAudit: 'Audit & Keywords',
      tabBotView: 'ATS Bot Simulator (Parser)',
      tabChecklist: 'Formatting Checklist',
      jobHeader: 'Terms of Reference / Job Description',
      loadSampleLabel: 'Load Sample:',
      jobChips: {
        'job-1': 'COO Operations',
        'job-2': 'Cloud & Tech Lead',
        'job-3': 'VP Finance & M&A',
        'job-4': 'Global Governance'
      },
      jobPlaceholder: 'Paste the full job description you are applying for (requirements, skills, ToR)...',
      noJobWarning: 'No active job description: paste a posting above or click a sample to run real ATS keyword tracking.',
      activeJobInfo: 'The analyzer compares every line of your resume against the core requirements of this role.',
      missingTitle: 'Missing Keywords',
      destLabel: 'Target:',
      destComp: 'Skills',
      destSummary: 'Summary',
      destExp: 'Latest Role',
      destCompTitle: 'Insert into Resume Core Competencies',
      destSummaryTitle: 'Add to Executive Summary',
      destExpTitle: 'Insert as an achievement in latest role',
      destCompFull: 'Core Competencies',
      destSummaryFull: 'Executive Summary',
      destExpFull: 'Latest Role',
      clickPlusPrefix: 'Click',
      clickPlusMiddle: 'on any term to insert into',
      addAllBtn: '+ Add All',
      waitingJobMsg: 'Waiting for a job description to identify missing keywords in your resume.',
      congratsNoMissing: 'Congratulations! All critical job keywords appear in your resume.',
      insertAriaPrefix: 'Insert into resume under',
      matchedTitle: 'Validated Keywords in Your Resume',
      noMatchedMsg: 'No direct keyword matches validated yet for this posting.',
      metricsTitle: 'Quantifiable Metrics Detected',
      metricsHigh: 'Strong numeric density',
      metricsLow: 'Too few metrics found',
      metricsTip: 'Global corporate recruiters prioritize quantified bullets (e.g. "120+ staff", "32% cost reduction").',
      verbsTitle: 'Executive Action Verbs',
      verbsSub: 'high-impact verbs',
      recsTitle: 'Strategic Recommendations for This Role',
      recMissingPrefix: 'Include critical missing keywords: "',
      recMissingSuffix: '" in your skills or experience bullets.',
      recMetrics: 'Add more quantified metrics (e.g. error rates reduced, team size managed, budget volume, stakeholders).',
      recPassivePrefix: 'Replace passive phrasing like "',
      recPassiveSuffix: '" with strong action verbs ("Led", "Architected", "Automated").',
      recSummary: 'Your Professional Summary is too brief for international standards. Expand to 4-5 lines highlighting authority and tenure.',
      recExcellent: 'Excellent alignment! Your resume meets structural and keyword benchmarks for this role.',
      botTitle: 'ATS Parser Output (Workday / Taleo OCR Engine)',
      copiedBtn: 'Copied!',
      copyExtractedBtn: 'Copy Extracted Text',
      ocrReadability: 'Linear Readability',
      ocrRolesBullets: 'Roles / Bullets',
      ocrSkills: 'Skills',
      ocrStructurePhoto: 'Layout / Photo',
      twoCols: '2 Columns',
      oneCol: 'Single Column',
      withPhoto: ' · Photo',
      botDesc: 'Below is the exact text stream extracted by automated screening engines. Data missing here is invisible to initial filtering.',
      checklistTitle: 'International Algorithmic Compliance Checklist',
      c1Title: 'Single-Column Structure (Zero Complex Tables)',
      c1Ok: 'Compliant',
      c1Warn: 'Notice: Split Layout',
      c1Desc: 'Single-column layouts like Executive Harvard or ATS Compact guarantee 100% parsing accuracy across legacy and modern ATS.',
      c2Title: 'Standardized Contact Header',
      c2Ok: 'Approved',
      c2Fail: 'Missing Info',
      c2Desc: 'Professional email, phone with country code, and location must appear explicitly at the top of the document.',
      c3Title: 'Executive Summary Density (100+ characters)',
      c3Ok: 'Adequate',
      c3Warn: 'Too Short',
      c3Desc: 'Your summary must articulate value proposition, seniority, and domain expertise in precise language.',
      c4Title: 'Proven Impact Metrics (Google XYZ Formula)',
      c4Unit: 'metrics',
      c4Desc: 'Screening algorithms rank candidates higher when bullets contain tangible percentages (%) or volumes.'
    },
    aiTailor: {
      tabFull: 'Full Job Tailor',
      tabXyz: 'Google XYZ Builder',
      xyzBadge: 'Google Executive Formula',
      xyzTitle: 'Quantified Achievement Builder',
      xyzSubtitlePrefix: 'Top recruiters evaluate the ',
      xyzSubtitleStrong: '"Accomplished [X], measured by [Y], by doing [Z]"',
      xyzSubtitleSuffix: ' framework to verify tangible impact.',
      presetsLabel: 'Ready Industry Examples:',
      presetOps: 'Operations',
      presetOpsSub: 'Lead-time -28%',
      presetTech: 'Technology',
      presetTechSub: '99.99% Cloud SLA',
      presetFin: 'Finance',
      presetFinSub: 'Close time -75%',
      presetLead: 'Leadership',
      presetLeadSub: 'Retention +40%',
      xLabel: '1. What did you accomplish? (Action / Result - Strong Verb)',
      xPlaceholder: 'e.g. Reduced cloud infrastructure and OPEX costs',
      yLabel: '2. Measured by how much? (Numeric Metric, %, €, $)',
      yPlaceholder: 'e.g. by 32% ($240K annual savings)',
      zLabel: '3. By doing what? (Methodology, Tooling, Strategy)',
      zPlaceholder: 'e.g. renegotiating vendor contracts and consolidating cluster workloads',
      resultLabel: 'Formatted Resume Output (Executive Bullet)',
      copiedBtn: 'Copied to Clipboard!',
      copyBtn: 'Copy Accomplishment',
      insertedBtn: 'Inserted into Role!',
      insertBtn: 'Insert into Latest Role',
      noExpWarnTitle: 'No Experience Added',
      noExpWarnMsg: 'Add a role in the Editor tab before inserting an accomplishment.',
      insertedToastTitle: 'Accomplishment Inserted',
      insertedToastMsgPrefix: 'Added to role',
      latestRoleFallback: 'latest',
      fullTitle: 'Strategic Optimization Engine (Executive AI)',
      fullDesc:
        'Adapts your profile to explicit job requirements by rewriting your summary, refining skills, and upgrading action verbs for maximum screening score.',
      targetStdLabel: 'Target Institutional Standard',
      standards: {
        exec: 'C-Level Executive & Operations Leadership (Google XYZ Formula)',
        tech: 'Big Tech & Software Engineering (System, Cloud & AI Metrics)',
        harvard: 'Harvard Business School & Corporate Finance (EBITDA, M&A & Valuation)',
        corp: 'Global Corporate & Multilateral Projects (Governance & Strategic Outcomes)'
      },
      activeJobLabel: 'Active Job Context',
      charsSuffix: 'characters',
      noJobDescFallback:
        'No specific job description set — AI will optimize using global best practices for the chosen institutional standard (you can paste a job in ATS Radar).',
      runBtn: 'Run Strategic Job Optimization',
      runningBtn: 'Analyzing Job & Optimizing Resume...',
      aiPausedErr: 'AI features are temporarily paused by platform administration.',
      quotaErr: 'Your free AI credits are exhausted. Upgrade to continue.',
      localFallbackRec: 'Resume harmonized locally with focus on strong impact verbs and ATS readability.',
      proposalTitle: 'Generated Optimization Proposal',
      proposalDesc: 'Review the suggested improvements before applying them to your document.',
      appliedBtn: 'Applied Successfully!',
      applyBtn: 'Apply Changes to Resume',
      newSummaryLabel: 'New Optimized Executive Summary',
      alignedCompLabel: 'Job-Aligned Competencies',
      optExpLabel: 'Optimized Experience — Google XYZ Formula',
      matchEstimateLabel: 'Estimated Match Score:'
    },
    interviewSim: {
      badge: 'Executive Interview Prep',
      title: 'Executive Interview Simulator & AI Scoring',
      subtitle:
        'Practice the 5 most likely behavioral and technical questions for your target role. Get instant scoring, STAR method analysis, and executive model answers.',
      generatingBtn: 'Generating 5 Questions...',
      generateBtn: 'Generate New Questions',
      simProgress: 'Simulation Progress:',
      answeredSuffix: 'Answered',
      readinessAvg: 'Overall Readiness Avg:',
      pending: 'Pending',
      candidateLabel: 'Candidate:',
      profileActive: 'Active Profile',
      closeErr: 'Close',
      qTabPrefix: 'Question',
      draftTitle: 'Draft answer saved',
      typeBehavioral: 'Behavioral (STAR)',
      typeTechnical: 'Technical & Methodology',
      typeSituational: 'Situational Scenario',
      questionWord: 'Question',
      ofWord: 'of',
      prevTitle: 'Previous question',
      nextTitle: 'Next question',
      recruiterSeeks: 'What the Recruiter Looks For:',
      recommendedFormula: 'Recommended Formula:',
      keyCriteria: 'Key Criteria:',
      yourAnswerLabel: 'Your Answer to This Question:',
      recordingBtn: 'Recording...',
      voiceDictateBtn: 'Voice Dictation',
      micTitle: 'Speak answer using microphone',
      answerPlaceholder:
        'Type your response as if speaking to the hiring panel. Describe the real context, the action you personally took, and the quantified result...',
      charsWord: 'characters',
      wordsWord: 'words',
      starHint: 'The engine evaluates clarity, quantified metrics, and STAR structure.',
      evaluatingBtn: 'Evaluating Answer...',
      evaluateBtn: 'Score Answer (STAR Method)',
      verdictTitle: 'Evaluation Verdict:',
      verdictHigh: 'Excellent executive structure with strong interviewer appeal.',
      verdictMid: 'Positive response, though additional metrics would elevate authority.',
      verdictLow: 'Too brief or generic. Apply the improvements below.',
      strengthsTitle: 'Identified Strengths:',
      improvementsTitle: 'Improvement Opportunities:',
      modelAnswerTitle: 'Executive Model Answer Suggestion (STAR Format):',
      emptyTitle: 'No questions generated yet',
      emptyDesc: 'Click the button above to generate 5 tailored questions for your application.',
      emptyBtn: 'Generate Interview Questions',
      errAiPausedGen: 'The AI interview generator is temporarily paused by administration.',
      errAiPausedEval: 'AI answer scoring is temporarily paused by administration.',
      errShortAnswer: 'Please write a more detailed answer (at least 15 characters) before scoring.',
      errGenDefault: 'Error generating interview questions.',
      errEvalDefault: 'Error scoring answer. Please try again.'
    },
    jobMatches: {
      title: 'Jobs Matched to Your Resume',
      subtitlePrefix: 'Live matching across',
      subtitleMiddle: 'for',
      subtitleDefaultProfile: 'your profile',
      refreshBtn: 'Refresh',
      compatibleJobs: 'Compatible jobs',
      indexedPool: 'Indexed active pool',
      analyzedCriteria: 'Analyzed criteria',
      fullProfile: 'Complete profile',
      configTitle: 'Configure Job Preferences',
      configSummaryCountries: 'country(ies)',
      configSummaryRoles: 'role(s)',
      configSummaryContracts: 'contract(s)',
      configSummaryAuto: '(auto-updates)',
      configSummaryEmpty: 'Customize countries, roles, and contract types',
      clearTitle: 'Clear all preferences',
      clearBtn: 'Clear',
      targetRolesLabel: 'Preferred Roles',
      rolePlaceholder: 'Add role (e.g. Product Manager, React Developer)...',
      addBtn: 'Add',
      countriesLabel: 'Preferred Countries & Regions',
      countries: {
        remoto_global: 'Global Remote',
        brasil: 'Brazil',
        portugal: 'Portugal',
        angola: 'Angola',
        espanha: 'Spain',
        reino_unido: 'United Kingdom',
        alemanha: 'Germany',
        franca: 'France',
        estados_unidos: 'United States',
        canada: 'Canada',
        europa: 'European Union'
      },
      contractsLabel: 'Preferred Contract Types',
      contracts: {
        full_time: 'Full-Time',
        contract: 'Contract / Freelance',
        part_time: 'Part-Time',
        internship: 'Internship / Trainee'
      },
      workplaces: {
        all: 'All Workplaces',
        remote: 'Remote',
        hybrid: 'Hybrid',
        onsite: 'On-Site'
      },
      sources: {
        all: 'All Portals',
        linkedin: 'LinkedIn',
        radar: 'Job Radar',
        remotive: 'Remotive',
        arbeitnow: 'Arbeitnow',
        jobicy: 'Jobicy',
        remoteok: 'RemoteOK'
      },
      externalPortalsTitle: 'Search your profile directly on other major portals:',
      searchPlaceholder: 'Filter by role, company, or skill (e.g. React, Finance, SAP)...',
      filterBtn: 'Filter',
      clearFilterBtn: 'Clear',
      retryBtn: 'Try Again',
      emptyTitle: 'No exact jobs found for the selected preferences',
      emptyDesc: 'Try adding "Global Remote" in countries or broadening the selected roles and contract types above.',
      resetFiltersBtn: 'Reset Filters & Preferences',
      matchLabel: 'match',
      inYourCvLabel: 'In your CV:',
      salaryLabel: 'Salary:',
      applyBtn: 'Apply Now',
      viewOnPrefix: 'View on',
      adaptAtsBtn: 'Tailor CV (ATS)',
      errFetch: 'Error connecting to job portals.',
      periodUnits: {
        year: '/yr',
        month: '/mo',
        hour: '/hr',
        day: '/day',
        week: '/wk'
      },
      relRecent: 'Recent',
      relToday: 'Today',
      relHoursPrefix: '',
      relHoursSuffix: 'h ago',
      relYesterday: 'Yesterday',
      relDaysPrefix: '',
      relDaysSuffix: 'd ago',
      tailorHeader: {
        role: 'Role',
        company: 'Company',
        portal: 'Portal',
        workplace: 'Workplace',
        location: 'Location',
        skills: 'Skills & Keywords',
        description: 'Job Description',
        criteria: 'Detected match criteria'
      }
    }
  },
  es: {
    app: {
      onlineTitle: 'Conexión Restablecida',
      onlineDesc: 'Se ha recuperado la conexión a internet.',
      offlineTitle: 'Modo Sin Conexión',
      offlineDesc: 'Sin internet. Tu trabajo sigue guardado en el navegador.',
      wordToastDefault: '¡Archivo Word (.docx) Descargado!',
      wordToastLetter: '¡Carta de Presentación Oficial en Word (.docx) Descargada!',
      wordToastCvPrefix: '¡Currículum Word (',
      wordToastCvSuffix: ') Oficial Descargado con Éxito!',
      wordToastSub: 'Formateado según estándares internacionales de tipografía y márgenes.',
      pricingDefaultPrompt:
        'Para descargar tu currículum en Microsoft Word (.docx) o PDF limpio sin marcas de agua, activa un plan Pro o Ejecutivo VIP.',
      checkoutConfirmedPrompt:
        '¡Cuenta confirmada! Completa ahora la activación de tu plan para desbloquear Word (.docx), Radar ATS y traducciones.',
      unlockedTitle: '¡Acceso Desbloqueado!',
      unlockedSubSuffix: ' listo para editar.',
      authModelPromptPrefix: 'Crea tu cuenta o inicia sesión para usar ',
      authModelPromptSuffix: ' y empezar a diseñar.',
      planModelPromptPrefix:
        'La edición y descarga de plantillas requiere suscripción activa. Elige el plan Pro o Ejecutivo VIP con Tarjeta o Pix para abrir ',
      planModelPromptSuffix: '.',
      modelLoadedTitle: '¡Plantilla Cargada!',
      modelLoadedSubSuffix: ' abierta para editar.',
      authTranslatePrompt: 'Crea una cuenta o inicia sesión para traducir el contenido del currículum y carta.',
      planTranslatePrompt:
        'La traducción integral del currículum y carta a Inglés, Español, Francés o Alemán es exclusiva para planes Pro y Ejecutivo VIP.',
      langChangedTitle: 'Idioma Cambiado',
      langChangedSubPrefix: 'Currículum y carta mostrados en ',
      translatedTitle: '¡Contenido Traducido!',
      translatedSubPrefix: 'Currículum y Carta de Presentación traducidos a ',
      notifTranslateTitle: 'Traducción Completada',
      notifTranslateMsgPrefix: 'Tu currículum y carta de presentación han sido traducidos a ',
      translationErrorTitle: 'Error al Traducir el Contenido',
      translationErrorFallback: 'No se pudo traducir el contenido en este momento. Inténtalo de nuevo.',
      authExportPrompt: 'Regístrate o inicia sesión para descargar el currículum en Word (.docx).',
      planExportPrompt:
        'Las descargas oficiales en Microsoft Word (.docx) y PDF en alta resolución son exclusivas para suscriptores. Activa un plan sin marcas de agua.',
      exportLetterTitle: '¡Carta de Presentación Descargada!',
      exportLetterSubPrefix: 'El archivo ',
      exportLetterSubSuffix: ' se generó correctamente sin marcas de agua.',
      exportCvTitle: '¡Currículum Word Descargado!',
      exportCvSubPrefix: 'Plantilla ',
      exportCvSubSuffix: ' generada con formato OpenXML nativo y 100% compatible con ATS.',
      notifExportTitle: 'Exportación Word Completada',
      notifExportLetterMsgPrefix: 'Carta de presentación ',
      notifExportCvMsgPrefix: 'Currículum ',
      exportErrorTitle: 'Error en la Exportación',
      exportErrorDesc: 'No se pudo compilar el documento Word. Verifica los datos ingresados.',
      maintenanceBadge: 'Mantenimiento Programado',
      maintenanceTitle: 'Plataforma en Actualización Temporal',
      maintenanceDefaultMsg: 'Estamos realizando mejoras programadas en los servidores. Volvemos enseguida.',
      maintenanceAdminPrompt: 'Acceso reservado para administradores durante el mantenimiento.',
      maintenanceAdminBtn: 'Acceso Administrador',
      adminMaintTitle: 'Modo Mantenimiento ACTIVO:',
      adminMaintDesc: 'Usuarios estándar bloqueados. Solo administradores pueden acceder.',
      adminMaintBtn: 'Gestionar en Admin',
      impersonateTitle: 'Modo de Suplantación Activo:',
      impersonateAs: 'Navegando como',
      impersonateExitBtn: 'Salir y Volver al Admin',
      resumeBuilderLabel: 'Constructor de Currículum',
      modelLabelPrefix: 'Plantilla ',
      authCreateSavePrompt: 'Crea tu cuenta gratuita para guardar y exportar tus currículums.',
      wordBadgeLocked: 'Word 🔒',
      wordBadgeOpen: 'Word'
    },
    multiLangModal: {
      modalTitle: 'Descargar CV en Otro Idioma',
      modalSubtitle: 'Traducción ejecutiva completa para procesos de selección internacionales.',
      selectLang: 'Selecciona el idioma de destino:',
      langNames: {
        pt: 'Portugués',
        en: 'Inglés',
        es: 'Español',
        fr: 'Francés',
        de: 'Alemán'
      },
      activeTranslationPrefix: 'Traducción al ',
      activeTranslationSuffix: ' Activa',
      readyTranslationPrefix: 'Listo para traducir al ',
      readyTranslationSuffix: '',
      translating: 'Traduciendo con IA...',
      updateTranslation: 'Actualizar Traducción',
      translateAction: 'Traducir con IA',
      explanation:
        'Conserva cargos ejecutivos adaptados al mercado destino, mejora logros con verbos fuertes y mantiene 100% de precisión en métricas y palabras clave ATS.',
      previewTranslated: 'Vista Previa del Documento Traducido',
      exportOptionsLabel: 'Opciones de Exportación:',
      downloading: 'Exportando...',
      downloadDocx: 'Descargar Word (.docx)',
      openXmlSub: 'Formato nativo OpenXML',
      downloadPdf: 'Descargar / Imprimir PDF',
      vectorA4Sub: 'Diseño A4 vectorial sin marcas',
      continueEditingPrompt: '¿Deseas seguir editando este currículum en el idioma seleccionado?',
      applyToEditor: 'Cargar en el Editor Principal',
      loadedEditorTitle: 'Currículum Cargado en el Editor',
      loadedEditorSubPrefix: 'El editor principal ahora muestra la versión traducida en ',
      unlimitedFooter: '✓ Descargas y traducciones ilimitadas en tu plan',
      planRequiredFooter: 'Las descargas oficiales requieren plan Pro o Ejecutivo',
      close: 'Cerrar',
      authTranslateReq: 'Es necesario iniciar sesión para traducir el currículum.',
      planTranslateReq:
        'La traducción ejecutiva multilingüe con IA (inglés, español, francés, alemán) es exclusiva para planes Pro y Ejecutivo VIP.',
      authExportReq: 'Inicia sesión para exportar tu currículum.',
      planExportReq: 'La exportación oficial a Word requiere un plan activo.',
      authPdfReq: 'Inicia sesión para imprimir o guardar en PDF.',
      planPdfReq: 'La exportación oficial a PDF requiere un plan activo.',
      translationReadyTitle: '¡Traducción Completada!',
      translationReadySubPrefix: 'Currículum adaptado al ',
      notifTranslateTitle: 'Traducción Multilingüe Completada',
      notifTranslateMsgPrefix: 'Tu currículum ha sido traducido y adaptado al ',
      translationErrorTitle: 'Error en la Traducción',
      translationErrorFallback: 'No se pudo traducir el currículum. Inténtalo más tarde.',
      wordSuccessTitle: '¡Word Descargado!',
      wordSuccessSubPrefix: 'Archivo en idioma ',
      wordSuccessSubSuffix: ' exportado con formato nativo OpenXML.',
      wordErrorTitle: 'Error al Descargar Word',
      wordErrorDesc: 'No se pudo compilar el documento.',
      notifExportTitle: 'Exportación Multilingüe Completada',
      notifExportWordPrefix: 'Currículum en ',
      notifExportPdfPrefix: 'Currículum en ',
      notifExportPdfSuffix: ' preparado para impresión/PDF.'
    },
    coverPanel: {
      aiPaused: 'Los recursos de IA están pausados temporalmente por la administración.',
      serverErr: 'El servidor devolvió un error en la generación.',
      generatedAi: '¡Carta de presentación generada con inteligencia artificial!',
      invalidFormat: 'Formato inválido recibido.',
      generatedFallback: '¡Carta generada y adaptada a tu perfil!',
      planRequiredWord: 'La descarga oficial de la Carta de Presentación en Word (.docx) requiere plan Pro o Executive.',
      planRequiredPdf: 'La impresión y exportación oficial en PDF de la Carta requiere plan Pro o Executive.',
      recipientPlaceholder: 'Ej: Comité de Selección',
      orgPlaceholder: 'Ej: Empresa / Organización Destino',
      rolePlaceholder: 'Ej: Coordinador de Proyectos',
      defaultRecipient: 'Comité de Selección y Talento',
      defaultOrg: 'Dirección de Recursos Humanos / Empresa Destino',
      defaultRole: 'Puesto Solicitado'
    },
    miniPreview: {
      coverSidebarLabel: 'Carta de Presentación',
      coverHeaderLabel: 'Carta de Motivación Profesional',
      a4Official: 'A4 · Formato Oficial',
      contacts: 'Contactos',
      competencies: 'Competencias',
      profile: 'Perfil Profesional',
      experience: 'Experiencia Profesional',
      education: 'Formación Académica',
      europassBadge: 'Europass UE',
      aboutMe: 'Sobre Mí / Perfil',
      educationTraining: 'Educación & Formación',
      langSkills: 'Idiomas',
      techSummary: '> Resumen Técnico',
      minSummary: '01 / Resumen Ejecutivo',
      stdSummary: 'Resumen Profesional',
      techComp: '> Stack & Competencias',
      minComp: '02 / Competencias',
      stdComp: 'Competencias Clave',
      techExp: '> Experiencia & Impacto',
      minExp: '03 / Experiencia',
      stdExp: 'Experiencia Profesional',
      techEdu: '> Formación Académica',
      minEdu: '04 / Educación',
      stdEdu: 'Formación Académica'
    },
    rawGenerator: {
      title: 'Importador & Generador de CV ATS',
      descStandard:
        'Importa o pega tu currículum para estructurarlo y perfeccionarlo en un diseño profesional sin necesidad de oferta.',
      descTailored:
        'Ingresa tu información y la oferta deseada para generar un CV adaptado a los requisitos del reclutador.',
      clearTitle: 'Limpiar campos y empezar en blanco',
      clearBtn: 'Limpiar Todo',
      presetsLabel: 'Plantillas de Ejemplo:',
      presetExec: 'Ejecutivo & Operaciones',
      presetExecTitle: 'Cargar perfil Dirección Ejecutiva & Operaciones',
      presetTech: 'Tech Lead & Cloud',
      presetTechTitle: 'Cargar perfil Tech Lead & Arquitectura Cloud',
      presetFin: 'Finanzas & CFO',
      presetFinTitle: 'Cargar perfil Dirección Financiera & Control',
      targetLabel: 'Estándar Objetivo:',
      stdOnu: 'Corporativo Global',
      stdOnuTitle: 'Estándar Corporativo & Proyectos Globales',
      stdTech: 'Big Tech / Google',
      stdTechTitle: 'Fórmula XYZ de Impacto Cuantificable (Google/Meta)',
      stdHarvard: 'Harvard Ejecutivo',
      stdHarvardTitle: 'Formato Ejecutivo Harvard Business School',
      stdEuropass: '📸 Europeo Europass',
      stdEuropassTitle: 'Estándar Oficial Unión Europea (Foto + MCER)',
      stdAts: 'ATS Puro (Sin Foto)',
      stdAtsTitle: 'Diseño lineal de rechazo cero para filtros ATS',
      modeStandardTitle: 'Generar Solo el CV',
      modeStandardDesc:
        'Ideal si ya importaste tu CV sin una vacante concreta. Mantiene y mejora tu trayectoria real.',
      modeTailoredTitle: 'Adaptar CV a una Vacante',
      modeTailoredDesc:
        'Cruza tus datos con un anuncio o TdR para optimizar palabras clave y puntuación ATS.',
      activeBadge: 'Activo',
      sec1Title: '1. Tu Información y Experiencia',
      importFileBtn: 'Importar Archivo',
      importingFileBtn: 'Extrayendo...',
      importFileTitle: 'Subir PDF, Word (.docx) o texto con tu currículum o notas',
      linkedinTitle: 'Conectar & Importar de LinkedIn',
      linkedinHowBtn: '¿Cómo sincronizar?',
      linkedinPlaceholder: 'https://www.linkedin.com/in/tu-perfil-ejecutivo',
      linkedinExtracting: 'Procesando...',
      linkedinExtractBtn: 'Extraer Perfil (Job)',
      completedSuffix: '% Completado',
      step1Label: 'Validando URL y cabeceras públicas del perfil...',
      step2Label: 'Extrayendo historial de cargos, empresas y formación...',
      step4Label: '¡Trayectoria estructurada con éxito en formato ATS!',
      logStart: 'Worker asíncrono iniciado en segundo plano.',
      logStep2: 'Historial profesional y competencias detectadas.',
      logDone1: 'Conexión con perfil público validada.',
      logDone2: 'Cargos, fechas y logros calibrados al estándar Google XYZ.',
      logDone3: 'Modelo listo para integración directa.',
      rolesExtractedLabel: 'Cargos Extraídos',
      atsSkillsLabel: 'Competencias ATS',
      educationsLabel: 'Titulaciones',
      applyDirectBtn: 'Aplicar Directamente al CV',
      pasteRawBtn: 'Pegar en Texto',
      linkedinHelperTitle: '💡 Cómo funciona el worker en segundo plano:',
      linkedinHelper1: '1. El worker consulta de forma asíncrona la URL pública indicada.',
      linkedinHelper2: '2. Cargos, fechas y habilidades se convierten automáticamente a la estructura CVData.',
      linkedinHelper3: '3. Haz clic en "Aplicar Directamente al CV" para abrirlo de inmediato en el editor.',
      rawTextareaLabel: 'Pega aquí tus notas, currículum anterior, cargos, proyectos o competencias:',
      rawPlaceholder: `Ingresa aquí tu información profesional. Ejemplo:

NOMBRE COMPLETO
Título Profesional o Especialidad
Ciudad, País | Teléfono | Email | LinkedIn

EXPERIENCIA PROFESIONAL:
- Empresa 1: Cargo, Período, Responsabilidades principales y logros
- Empresa 2: Cargo, Período, Herramientas utilizadas e impacto

FORMACIÓN ACADÉMICA:
- Titulación, Universidad, Año

COMPETENCIAS:
- Software, Idiomas, Metodologías y Certificaciones...`,
      charsInsertedSuffix: 'caracteres ingresados',
      switchToTailoredBtn: '¿Tienes una oferta específica? Haz clic para añadir la descripción →',
      sec2Title: '2. La Vacante Deseada (Anuncio / TdR)',
      importTdrBtn: 'Importar TdR',
      importingTdrBtn: 'Extrayendo...',
      importTdrTitle: 'Subir PDF o Word (.docx) con Términos de Referencia (TdR) o anuncio',
      sampleJobsLabel: 'Ejemplos de Vacante:',
      jobChipLabels: {
        'job-1': 'COO Operaciones',
        'job-2': 'Cloud & Tech Lead',
        'job-3': 'VP Finanzas & M&A',
        'job-4': 'Gobernanza Global'
      },
      jobTextareaLabel: 'Pega la descripción completa de la vacante (requisitos, competencias, funciones):',
      jobTextareaPlaceholder: 'Pega aquí la oferta de empleo, términos de referencia, requisitos...',
      charsInJobSuffix: 'caracteres en la descripción',
      switchToStandardBtn: 'Aún no tengo vacante (generar solo CV)',
      bannerDescStandard:
        'La IA extraerá, organizará y pulirá tus experiencias, competencias y formación en el estándar elegido.',
      bannerDescTailored:
        'La IA analizará el ajuste semántico y reescribirá tu CV enfatizando métricas, palabras clave y verbos exactos.',
      generateOnlyBtn: 'Generar Solo CV',
      generatingStandard: 'Estructurando tu Currículum...',
      generatingTailored: 'Cruzando Datos y Generando CV Adaptado...',
      generateStandardCta: 'Generar CV Estructurado',
      generateTailoredCta: 'Generar CV Adaptado a esta Vacante',
      msgExecLoaded: '¡Perfil Dirección Ejecutiva & Estrategia cargado!',
      msgTechLoaded: '¡Perfil Tech Lead & Arquitecto Cloud cargado!',
      msgFinLoaded: '¡Perfil Dirección Financiera & Control cargado!',
      msgDocImportedPrefix: '¡Documento "',
      msgDocImportedSuffix: '" importado con éxito!',
      msgJobDocImportedPrefix: '¡Archivo TdR / Oferta "',
      msgJobDocImportedSuffix: '" importado con éxito!',
      msgErrExtract: 'Error al extraer el texto del archivo.',
      msgErrNoInput: 'Por favor importa tu CV (PDF/Word) o pega tu información profesional antes de generar.',
      msgErrNoJob: 'Para adaptar a una vacante, pega la descripción o cambia a "Generar Solo el CV".',
      msgAiPausedStandard: 'La IA externa está pausada; tu currículum se estructuró localmente con éxito.',
      msgAiPausedTailored: 'La IA externa está pausada; estructuración local aplicada con éxito.',
      msgSuccessStandard: '¡Currículum estructurado y optimizado en el estándar seleccionado!',
      msgSuccessTailored: '¡Currículum generado con IA y adaptado para la vacante!',
      msgFallbackStandard: '¡Currículum estructurado con éxito desde tus datos importados!',
      msgFallbackTailored: '¡Currículum estructurado y adaptado con éxito para la vacante!',
      msgErrLinkedInUrl: 'Ingresa la URL pública de tu perfil LinkedIn (ej: https://linkedin.com/in/tu-nombre).',
      msgLinkedInSuccess: '¡Historial de LinkedIn extraído y formateado en el modelo de CV!',
      msgLinkedInApplied: '¡Currículum actualizado directamente desde tu perfil de LinkedIn!',
      msgLinkedInPasted: '¡Datos copiados en el bloque de texto!'
    },
    atsRadar: {
      bannerTitle: 'Tasa de Compatibilidad ATS (Applicant Tracking System)',
      statusNoJob: 'Pega la descripción de la vacante abajo (o elige un ejemplo) para calcular el ajuste de palabras clave.',
      statusHigh: '¡Excelente! Alta densidad de palabras clave y gran ajuste con el puesto.',
      statusMid: 'Buen ajuste, pero faltan términos técnicos decisivos.',
      statusLow: 'Atención: Riesgo de filtro automático por los sistemas de selección.',
      optimizeAiBtn: 'Optimizar c/ IA al 95%+',
      tabAudit: 'Auditoría & Palabras Clave',
      tabBotView: 'Simulador Robot ATS (Parser)',
      tabChecklist: 'Checklist de Formato',
      jobHeader: 'Términos de Referencia / Descripción del Puesto',
      loadSampleLabel: 'Cargar Ejemplo:',
      jobChips: {
        'job-1': 'COO Operaciones',
        'job-2': 'Cloud & Tech Lead',
        'job-3': 'VP Finanzas & M&A',
        'job-4': 'Gobernanza Global'
      },
      jobPlaceholder: 'Pega aquí la descripción completa del puesto (requisitos, habilidades, TdR)...',
      noJobWarning: 'Sin descripción activa: pega una oferta arriba o elige un ejemplo para activar el análisis ATS real.',
      activeJobInfo: 'El analizador compara automáticamente cada línea de tu CV frente a los requisitos de la oferta.',
      missingTitle: 'Palabras Clave Faltantes',
      destLabel: 'Destino:',
      destComp: 'Competencias',
      destSummary: 'Resumen',
      destExp: 'Último Cargo',
      destCompTitle: 'Insertar en Competencias Clave del CV',
      destSummaryTitle: 'Añadir al Resumen Ejecutivo',
      destExpTitle: 'Insertar como logro en el último puesto',
      destCompFull: 'Competencias',
      destSummaryFull: 'Resumen Ejecutivo',
      destExpFull: 'Último Cargo',
      clickPlusPrefix: 'Haz clic en',
      clickPlusMiddle: 'de cada término para insertarlo en',
      addAllBtn: '+ Añadir Todas',
      waitingJobMsg: 'Esperando descripción de la vacante para detectar términos faltantes.',
      congratsNoMissing: '¡Enhorabuena! Todas las palabras clave críticas de la vacante figuran en tu CV.',
      insertAriaPrefix: 'Insertar en CV bajo',
      matchedTitle: 'Palabras Clave Validadas en tu CV',
      noMatchedMsg: 'Aún no hay coincidencias directas validadas para esta vacante.',
      metricsTitle: 'Métricas Cuantificables Detectadas',
      metricsHigh: 'Excelente densidad numérica',
      metricsLow: 'Pocas métricas encontradas',
      metricsTip: 'Los reclutadores globales priorizan logros con cifras concretas (ej: "+120 personas", "reducción del 32% en costos").',
      verbsTitle: 'Verbos de Acción Ejecutiva',
      verbsSub: 'verbos de alto impacto',
      recsTitle: 'Recomendaciones Estratégicas para esta Vacante',
      recMissingPrefix: 'Incluye las palabras clave faltantes: "',
      recMissingSuffix: '" en competencias o logros de experiencia.',
      recMetrics: 'Añade más métricas cuantificables (porcentajes de mejora, tamaño de equipo, presupuesto).',
      recPassivePrefix: 'Sustituye frases pasivas como "',
      recPassiveSuffix: '" por verbos ejecutivos ("Lideró", "Estructuró", "Automatizó").',
      recSummary: 'Tu Resumen Profesional es muy corto para estándares internacionales. Amplíalo a 4-5 líneas.',
      recExcellent: '¡Excelente ajuste! Tu currículum cumple los criterios de estructura y palabras clave.',
      botTitle: 'Vista del Parser ATS (Workday / Taleo OCR Engine)',
      copiedBtn: '¡Copiado!',
      copyExtractedBtn: 'Copiar Texto Extraído',
      ocrReadability: 'Legibilidad Lineal',
      ocrRolesBullets: 'Cargos / Logros',
      ocrSkills: 'Competencias',
      ocrStructurePhoto: 'Estructura / Foto',
      twoCols: '2 Columnas',
      oneCol: 'Columna Única',
      withPhoto: ' · Foto',
      botDesc: 'Esta es la secuencia exacta de texto que leen los robots ATS. Lo que no figure aquí es invisible en la primera criba.',
      checklistTitle: 'Checklist de Cumplimiento Algorítmico Internacional',
      c1Title: 'Estructura de Columna Única (Sin Tablas Complejas)',
      c1Ok: 'Conforme',
      c1Warn: 'Aviso: Diseño Dividido',
      c1Desc: 'Diseños de columna única como Executive Harvard o ATS Compact aseguran 100% de lectura en cualquier ATS.',
      c2Title: 'Encabezado de Contacto Estandarizado',
      c2Ok: 'Aprobado',
      c2Fail: 'Faltan Datos',
      c2Desc: 'Email profesional, teléfono con prefijo y ciudad/país deben aparecer claramente al inicio.',
      c3Title: 'Densidad del Resumen Ejecutivo (100+ caracteres)',
      c3Ok: 'Adecuado',
      c3Warn: 'Corto',
      c3Desc: 'El resumen debe comunicar propuesta de valor, nivel de responsabilidad y especialidad.',
      c4Title: 'Métricas de Impacto Comprobadas (Fórmula Google XYZ)',
      c4Unit: 'métricas',
      c4Desc: 'El algoritmo premia a los candidatos que demuestran resultados con porcentajes (%) o volúmenes tangibles.'
    },
    aiTailor: {
      tabFull: 'Optimizador Completo',
      tabXyz: 'Constructor Google XYZ',
      xyzBadge: 'Fórmula Ejecutiva Google',
      xyzTitle: 'Constructor de Logros Cuantificados',
      xyzSubtitlePrefix: 'Los reclutadores de élite evalúan el método ',
      xyzSubtitleStrong: '"Logró [X], medido por [Y], haciendo [Z]"',
      xyzSubtitleSuffix: ' para verificar impacto real.',
      presetsLabel: 'Ejemplos por Sector:',
      presetOps: 'Operaciones',
      presetOpsSub: 'Lead-time -28%',
      presetTech: 'Tecnología',
      presetTechSub: 'SLA 99.99% Cloud',
      presetFin: 'Finanzas',
      presetFinSub: 'Cierre -75%',
      presetLead: 'Liderazgo',
      presetLeadSub: 'Retención +40%',
      xLabel: '1. ¿Qué lograste? (Acción / Conquista - Verbo Fuerte)',
      xPlaceholder: 'Ej: Redujo costes de infraestructura y OPEX operativo',
      yLabel: '2. ¿Medido por cuánto? (Métrica Numérica, %, €, $)',
      yPlaceholder: 'Ej: en un 32% (ahorro anual de €240K)',
      zLabel: '3. ¿Haciendo qué? (Metodología, Herramienta, Estrategia)',
      zPlaceholder: 'Ej: renegociando contratos y consolidando cargas en cloud',
      resultLabel: 'Resultado Formateado para el CV (Bullet Ejecutivo)',
      copiedBtn: '¡Copiado al Portapapeles!',
      copyBtn: 'Copiar Logro',
      insertedBtn: '¡Insertado en el Cargo!',
      insertBtn: 'Insertar en el Último Cargo',
      noExpWarnTitle: 'Sin Experiencia Registrada',
      noExpWarnMsg: 'Añade primero un puesto en la pestaña Editor antes de insertar un logro.',
      insertedToastTitle: 'Logro Insertado',
      insertedToastMsgPrefix: 'Añadido al cargo',
      latestRoleFallback: 'más reciente',
      fullTitle: 'Motor de Optimización Estratégica (IA Ejecutiva)',
      fullDesc:
        'Adapta tu perfil a los requisitos de la oferta reescribiendo el resumen, afinando competencias y elevando los verbos de acción.',
      targetStdLabel: 'Estándar Institucional Objetivo',
      standards: {
        exec: 'Dirección Ejecutiva C-Level & Operaciones (Fórmula Google XYZ)',
        tech: 'Big Tech & Ingeniería de Software (Métricas Cloud & IA)',
        harvard: 'Harvard Business School & Finanzas Corporativas (EBITDA, M&A)',
        corp: 'Estándar Corporativo & Proyectos Globales (Gobernanza y Resultados)'
      },
      activeJobLabel: 'Contexto de la Vacante Activa',
      charsSuffix: 'caracteres',
      noJobDescFallback:
        'Sin descripción específica de vacante — la IA aplicará las mejores prácticas del estándar seleccionado (puedes pegar una oferta en Radar ATS).',
      runBtn: 'Ejecutar Optimización Estratégica',
      runningBtn: 'Analizando Vacante y Optimizando CV...',
      aiPausedErr: 'Los recursos de Inteligencia Artificial están pausados temporalmente.',
      quotaErr: 'Tus créditos gratuitos de IA se agotaron. Actualiza tu plan para continuar.',
      localFallbackRec: 'Currículum armonizado localmente con foco en verbos de impacto y lectura ATS.',
      proposalTitle: 'Propuesta de Optimización Generada',
      proposalDesc: 'Revisa los ajustes sugeridos antes de aplicarlos al documento.',
      appliedBtn: '¡Aplicado con Éxito!',
      applyBtn: 'Aplicar Cambios al CV',
      newSummaryLabel: 'Nuevo Resumen Ejecutivo Optimizado',
      alignedCompLabel: 'Competencias Alineadas al Puesto',
      optExpLabel: 'Experiencias Optimizadas — Fórmula Google XYZ',
      matchEstimateLabel: 'Tasa de Coincidencia Estimada:'
    },
    interviewSim: {
      badge: 'Preparación de Entrevista Ejecutiva',
      title: 'Simulador de Entrevista Ejecutiva & Evaluación IA',
      subtitle:
        'Practica las 5 preguntas conductuales y técnicas más probables para tu puesto. Obtén puntuación al instante, análisis STAR y respuestas modelo.',
      generatingBtn: 'Generando 5 Preguntas...',
      generateBtn: 'Generar Nuevas Preguntas',
      simProgress: 'Progreso de la Simulación:',
      answeredSuffix: 'Respondidas',
      readinessAvg: 'Media General de Preparación:',
      pending: 'Pendiente',
      candidateLabel: 'Candidato:',
      profileActive: 'Perfil Activo',
      closeErr: 'Cerrar',
      qTabPrefix: 'Pregunta',
      draftTitle: 'Borrador guardado',
      typeBehavioral: 'Conductual (STAR)',
      typeTechnical: 'Técnica & Metodología',
      typeSituational: 'Escenario Situacional',
      questionWord: 'Pregunta',
      ofWord: 'de',
      prevTitle: 'Pregunta anterior',
      nextTitle: 'Siguiente pregunta',
      recruiterSeeks: 'Qué Busca el Reclutador:',
      recommendedFormula: 'Fórmula Recomendada:',
      keyCriteria: 'Criterios Clave:',
      yourAnswerLabel: 'Tu Respuesta a Esta Pregunta:',
      recordingBtn: 'Grabando...',
      voiceDictateBtn: 'Dictado por Voz',
      micTitle: 'Hablar respuesta por micrófono',
      answerPlaceholder:
        'Escribe tu respuesta como si estuvieras ante el comité de selección. Explica la situación real, tu acción directa y los resultados medibles...',
      charsWord: 'caracteres',
      wordsWord: 'palabras',
      starHint: 'El motor evalúa claridad, métricas cuantificadas y estructura STAR.',
      evaluatingBtn: 'Evaluando Respuesta...',
      evaluateBtn: 'Evaluar Respuesta (Método STAR)',
      verdictTitle: 'Veredicto de Evaluación:',
      verdictHigh: 'Excelente estructura ejecutiva con gran impacto ante el entrevistador.',
      verdictMid: 'Respuesta positiva; añadir más cifras elevaría tu autoridad.',
      verdictLow: 'Respuesta breve o genérica. Aplica las mejoras abajo indicadas.',
      strengthsTitle: 'Puntos Fuertes Identificados:',
      improvementsTitle: 'Oportunidades de Mejora:',
      modelAnswerTitle: 'Sugerencia de Respuesta Modelo Ejecutiva (Formato STAR):',
      emptyTitle: 'Aún no se han generado preguntas',
      emptyDesc: 'Pulsa el botón superior para generar 5 preguntas a medida para tu candidatura.',
      emptyBtn: 'Generar Preguntas de Entrevista',
      errAiPausedGen: 'El generador de entrevistas por IA está pausado temporalmente.',
      errAiPausedEval: 'La evaluación por IA está pausada temporalmente.',
      errShortAnswer: 'Por favor redacta una respuesta más detallada (mínimo 15 caracteres) antes de evaluar.',
      errGenDefault: 'Error al generar preguntas de entrevista.',
      errEvalDefault: 'Error al evaluar respuesta. Inténtalo de nuevo.'
    },
    jobMatches: {
      title: 'Vacantes Compatibles con tu CV',
      subtitlePrefix: 'Búsqueda en tiempo real en',
      subtitleMiddle: 'para',
      subtitleDefaultProfile: 'tu perfil',
      refreshBtn: 'Actualizar',
      compatibleJobs: 'Vacantes compatibles',
      indexedPool: 'Base activa indexada',
      analyzedCriteria: 'Criterios analizados',
      fullProfile: 'Perfil completo',
      configTitle: 'Configurar Preferencias de Empleo',
      configSummaryCountries: 'país(es)',
      configSummaryRoles: 'puesto(s)',
      configSummaryContracts: 'contrato(s)',
      configSummaryAuto: '(actualización automática)',
      configSummaryEmpty: 'Personaliza países, puestos y tipos de contrato',
      clearTitle: 'Limpiar todas las preferencias',
      clearBtn: 'Limpiar',
      targetRolesLabel: 'Puestos Preferidos',
      rolePlaceholder: 'Añadir puesto (ej: Product Manager, React Developer)...',
      addBtn: 'Añadir',
      countriesLabel: 'Países y Regiones Preferidas',
      countries: {
        remoto_global: 'Remoto Global',
        brasil: 'Brasil',
        portugal: 'Portugal',
        angola: 'Angola',
        espanha: 'España',
        reino_unido: 'Reino Unido',
        alemanha: 'Alemania',
        franca: 'Francia',
        estados_unidos: 'Estados Unidos',
        canada: 'Canadá',
        europa: 'Unión Europea'
      },
      contractsLabel: 'Tipos de Contrato Preferidos',
      contracts: {
        full_time: 'Tiempo Completo',
        contract: 'Contrato / Freelance',
        part_time: 'Media Jornada',
        internship: 'Prácticas / Trainee'
      },
      workplaces: {
        all: 'Todas las modalidades',
        remote: 'Remoto',
        hybrid: 'Híbrido',
        onsite: 'Presencial'
      },
      sources: {
        all: 'Todos los Portales',
        linkedin: 'LinkedIn',
        radar: 'Radar de Empleo',
        remotive: 'Remotive',
        arbeitnow: 'Arbeitnow',
        jobicy: 'Jobicy',
        remoteok: 'RemoteOK'
      },
      externalPortalsTitle: 'Buscar tu perfil directamente en otros grandes portales:',
      searchPlaceholder: 'Filtrar por puesto, empresa o habilidad (ej: React, Finance, SAP)...',
      filterBtn: 'Filtrar',
      clearFilterBtn: 'Limpiar',
      retryBtn: 'Intentar de Nuevo',
      emptyTitle: 'No se encontraron ofertas exactas con estas preferencias',
      emptyDesc: 'Prueba añadir "Remoto Global" o ampliar los puestos y tipos de contrato seleccionados arriba.',
      resetFiltersBtn: 'Restablecer Filtros y Preferencias',
      matchLabel: 'afinidad',
      inYourCvLabel: 'En tu CV:',
      salaryLabel: 'Salario:',
      applyBtn: 'Postularme',
      viewOnPrefix: 'Ver en',
      adaptAtsBtn: 'Adaptar CV (ATS)',
      errFetch: 'Error al conectar con los portales de empleo.',
      periodUnits: {
        year: '/año',
        month: '/mes',
        hour: '/hora',
        day: '/día',
        week: '/semana'
      },
      relRecent: 'Reciente',
      relToday: 'Hoy',
      relHoursPrefix: 'Hace ',
      relHoursSuffix: 'h',
      relYesterday: 'Ayer',
      relDaysPrefix: 'Hace ',
      relDaysSuffix: 'd',
      tailorHeader: {
        role: 'Puesto',
        company: 'Empresa',
        portal: 'Portal',
        workplace: 'Modalidad',
        location: 'Ubicación',
        skills: 'Competencias y Palabras Clave',
        description: 'Descripción de la Vacante',
        criteria: 'Criterios de afinidad detectados'
      }
    }
  },
  fr: {
    app: {
      onlineTitle: 'Connexion Rétablie',
      onlineDesc: 'La connexion internet est rétablie.',
      offlineTitle: 'Mode Hors Ligne',
      offlineDesc: 'Pas de connexion. Votre travail reste enregistré dans le navigateur.',
      wordToastDefault: 'Fichier Word (.docx) Téléchargé !',
      wordToastLetter: 'Lettre de Motivation Officielle (.docx) Téléchargée !',
      wordToastCvPrefix: 'CV Word Officiel (',
      wordToastCvSuffix: ') Téléchargé avec Succès !',
      wordToastSub: 'Formaté selon les normes internationales de typographie et de marges.',
      pricingDefaultPrompt:
        'Activez un forfait Pro ou Exécutif VIP pour exporter en Microsoft Word (.docx) et PDF haute résolution sans filigrane.',
      checkoutConfirmedPrompt:
        'Compte confirmé ! Finalisez votre abonnement pour débloquer l’export Word (.docx), le Radar ATS et les traductions.',
      unlockedTitle: 'Accès Débloqué !',
      unlockedSubSuffix: ' prêt pour l’édition.',
      authModelPromptPrefix: 'Créez votre compte ou connectez-vous pour utiliser ',
      authModelPromptSuffix: ' et commencer.',
      planModelPromptPrefix:
        'L’édition et le téléchargement des modèles nécessitent un abonnement actif. Choisissez Pro ou Exécutif VIP par Carte ou Pix pour ouvrir ',
      planModelPromptSuffix: '.',
      modelLoadedTitle: 'Modèle Chargé !',
      modelLoadedSubSuffix: ' ouvert pour l’édition.',
      authTranslatePrompt: 'Créez un compte ou connectez-vous pour traduire votre CV et votre lettre de motivation.',
      planTranslatePrompt:
        'La traduction complète du CV et de la lettre en anglais, espagnol, français ou allemand est réservée aux abonnés Pro et Exécutif VIP.',
      langChangedTitle: 'Langue Modifiée',
      langChangedSubPrefix: 'CV et lettre affichés en ',
      translatedTitle: 'Contenu Traduit !',
      translatedSubPrefix: 'CV et Lettre de Motivation traduits en ',
      notifTranslateTitle: 'Traduction Terminée',
      notifTranslateMsgPrefix: 'Votre CV et lettre de motivation ont été traduits en ',
      translationErrorTitle: 'Erreur de Traduction',
      translationErrorFallback: 'Impossible de traduire le contenu pour le moment. Veuillez réessayer.',
      authExportPrompt: 'Connectez-vous ou inscrivez-vous pour télécharger votre CV au format Word (.docx).',
      planExportPrompt:
        'Les téléchargements officiels Microsoft Word (.docx) et PDF haute résolution sont réservés aux abonnés. Activez un forfait sans filigrane.',
      exportLetterTitle: 'Lettre de Motivation Téléchargée !',
      exportLetterSubPrefix: 'Le fichier ',
      exportLetterSubSuffix: ' a été généré sans filigrane.',
      exportCvTitle: 'CV Word Téléchargé !',
      exportCvSubPrefix: 'Modèle ',
      exportCvSubSuffix: ' généré au format OpenXML natif avec 100% de compatibilité ATS.',
      notifExportTitle: 'Export Word Terminé',
      notifExportLetterMsgPrefix: 'Lettre de motivation ',
      notifExportCvMsgPrefix: 'CV ',
      exportErrorTitle: 'Erreur d’Exportation',
      exportErrorDesc: 'Impossible de compiler le document Word. Vérifiez vos informations.',
      maintenanceBadge: 'Maintenance Programmée',
      maintenanceTitle: 'Plateforme en Cours de Mise à Jour',
      maintenanceDefaultMsg: 'Nous effectuons une maintenance planifiée. Nous revenons très vite.',
      maintenanceAdminPrompt: 'Accès réservé aux administrateurs pendant la maintenance.',
      maintenanceAdminBtn: 'Accès Administrateur',
      adminMaintTitle: 'Mode Maintenance ACTIF :',
      adminMaintDesc: 'Les utilisateurs standards sont bloqués. Seuls les administrateurs peuvent accéder.',
      adminMaintBtn: 'Gérer dans l’Admin',
      impersonateTitle: 'Mode Impersonation Actif :',
      impersonateAs: 'Navigation en tant que',
      impersonateExitBtn: 'Quitter et Retour Admin',
      resumeBuilderLabel: 'Créateur de CV',
      modelLabelPrefix: 'Modèle ',
      authCreateSavePrompt: 'Créez votre compte gratuit pour enregistrer et exporter vos CV.',
      wordBadgeLocked: 'Word 🔒',
      wordBadgeOpen: 'Word'
    },
    multiLangModal: {
      modalTitle: 'Télécharger le CV dans une Autre Langue',
      modalSubtitle: 'Traduction exécutive complète pour les processus de recrutement internationaux.',
      selectLang: 'Sélectionnez la langue cible :',
      langNames: {
        pt: 'Portugais',
        en: 'Anglais',
        es: 'Espagnol',
        fr: 'Français',
        de: 'Allemand'
      },
      activeTranslationPrefix: 'Traduction en ',
      activeTranslationSuffix: ' Active',
      readyTranslationPrefix: 'Prêt à traduire en ',
      readyTranslationSuffix: '',
      translating: 'Traduction par IA...',
      updateTranslation: 'Actualiser la Traduction',
      translateAction: 'Traduire avec l’IA',
      explanation:
        'Préserve les titres exécutifs alignés sur le marché visé, renforce les réalisations avec des verbes d’action et conserve 100% de précision ATS.',
      previewTranslated: 'Aperçu du Document Traduit',
      exportOptionsLabel: 'Options d’Exportation :',
      downloading: 'Exportation...',
      downloadDocx: 'Télécharger Word (.docx)',
      openXmlSub: 'Format natif OpenXML',
      downloadPdf: 'Télécharger / Imprimer PDF',
      vectorA4Sub: 'Mise en page A4 vectorielle sans filigrane',
      continueEditingPrompt: 'Souhaitez-vous continuer à modifier ce CV dans cette langue ?',
      applyToEditor: 'Charger dans l’Éditeur Principal',
      loadedEditorTitle: 'CV Chargé dans l’Éditeur',
      loadedEditorSubPrefix: 'L’éditeur principal affiche maintenant la version traduite en ',
      unlimitedFooter: '✓ Téléchargements et traductions illimités inclus',
      planRequiredFooter: 'Les exports officiels nécessitent un forfait Pro ou Exécutif',
      close: 'Fermer',
      authTranslateReq: 'Connexion requise pour traduire votre CV.',
      planTranslateReq:
        'La traduction exécutive multilingue par IA (anglais, espagnol, français, allemand) est réservée aux abonnés Pro et Exécutif VIP.',
      authExportReq: 'Connexion requise pour exporter votre CV.',
      planExportReq: 'L’export Word officiel nécessite un abonnement actif.',
      authPdfReq: 'Connexion requise pour imprimer ou enregistrer en PDF.',
      planPdfReq: 'L’export PDF officiel nécessite un abonnement actif.',
      translationReadyTitle: 'Traduction Terminée !',
      translationReadySubPrefix: 'CV adapté en ',
      notifTranslateTitle: 'Traduction Multilingue Terminée',
      notifTranslateMsgPrefix: 'Votre CV a été traduit et adapté en ',
      translationErrorTitle: 'Erreur de Traduction',
      translationErrorFallback: 'Impossible de traduire le CV pour le moment. Réessayez plus tard.',
      wordSuccessTitle: 'Word Téléchargé !',
      wordSuccessSubPrefix: 'Fichier en ',
      wordSuccessSubSuffix: ' exporté au format natif OpenXML.',
      wordErrorTitle: 'Erreur Word',
      wordErrorDesc: 'Impossible de compiler le document.',
      notifExportTitle: 'Export Multilingue Terminé',
      notifExportWordPrefix: 'CV en ',
      notifExportPdfPrefix: 'CV en ',
      notifExportPdfSuffix: ' prêt pour impression/PDF.'
    },
    coverPanel: {
      aiPaused: 'Les fonctions IA sont temporairement suspendues par l’administration.',
      serverErr: 'Le serveur a renvoyé une erreur lors de la génération.',
      generatedAi: 'Lettre de motivation générée avec l’intelligence artificielle !',
      invalidFormat: 'Format retourné invalide.',
      generatedFallback: 'Lettre générée et adaptée avec succès à votre profil !',
      planRequiredWord: 'Le téléchargement officiel de la lettre en Word (.docx) nécessite un plan Pro ou Executive.',
      planRequiredPdf: 'L’impression et l’export PDF officiel nécessitent un plan Pro ou Executive.',
      recipientPlaceholder: 'Ex : Comité de Recrutement',
      orgPlaceholder: 'Ex : Entreprise / Organisation Cible',
      rolePlaceholder: 'Ex : Directeur des Opérations',
      defaultRecipient: 'Comité de Sélection et Recrutement',
      defaultOrg: 'Direction des Ressources Humaines / Entreprise Cible',
      defaultRole: 'Poste Visé'
    },
    miniPreview: {
      coverSidebarLabel: 'Lettre de Motivation',
      coverHeaderLabel: 'Lettre de Motivation Exécutive',
      a4Official: 'A4 · Mise en Page Officielle',
      contacts: 'Coordonnées',
      competencies: 'Compétences',
      profile: 'Profil Professionnel',
      experience: 'Expérience Professionnelle',
      education: 'Formation',
      europassBadge: 'Europass UE',
      aboutMe: 'À Propos / Profil',
      educationTraining: 'Éducation & Formation',
      langSkills: 'Compétences Linguistiques',
      techSummary: '> Résumé Technique',
      minSummary: '01 / Profil Exécutif',
      stdSummary: 'Profil Professionnel',
      techComp: '> Stack & Compétences',
      minComp: '02 / Compétences',
      stdComp: 'Compétences Clés',
      techExp: '> Expérience & Impact',
      minExp: '03 / Expérience',
      stdExp: 'Expérience Professionnelle',
      techEdu: '> Formation',
      minEdu: '04 / Formation',
      stdEdu: 'Formation Académique'
    },
    rawGenerator: {
      title: 'Importateur & Générateur de CV ATS',
      descStandard:
        'Importez ou collez votre CV pour le structurer dans une mise en page exécutive sans offre requise.',
      descTailored:
        'Saisissez votre parcours et l’offre visée pour générer un CV aligné sur les attentes du recruteur.',
      clearTitle: 'Effacer les champs et recommencer à zéro',
      clearBtn: 'Tout Effacer',
      presetsLabel: 'Profils Exemples :',
      presetExec: 'Exécutif & Opérations',
      presetExecTitle: 'Charger le profil Direction Exécutive & Opérations',
      presetTech: 'Tech Lead & Cloud',
      presetTechTitle: 'Charger le profil Tech Lead & Cloud',
      presetFin: 'Finance & CFO',
      presetFinTitle: 'Charger le profil Direction Financière & CFO',
      targetLabel: 'Norme Cible :',
      stdOnu: 'Corporate Global',
      stdOnuTitle: 'Norme Corporate Internationale & Grands Projets',
      stdTech: 'Big Tech / Google',
      stdTechTitle: 'Formule XYZ d’Impact Quantifié (Google/Meta)',
      stdHarvard: 'Harvard Exécutif',
      stdHarvardTitle: 'Format Exécutif Harvard Business School',
      stdEuropass: '📸 Europass Européen',
      stdEuropassTitle: 'Norme Officielle Union Européenne (Photo + CECRL)',
      stdAts: 'ATS Pur (Sans Photo)',
      stdAtsTitle: 'Mise en page linéaire zéro rejet pour robots ATS',
      modeStandardTitle: 'Générer Uniquement le CV',
      modeStandardDesc:
        'Idéal sans offre spécifique. Conserve et sublime votre véritable parcours professionnel.',
      modeTailoredTitle: 'Adapter le CV à une Offre',
      modeTailoredDesc:
        'Croise vos données avec une offre ou des TdR pour optimiser mots-clés et score ATS.',
      activeBadge: 'Actif',
      sec1Title: '1. Vos Informations & Parcours',
      importFileBtn: 'Importer Fichier',
      importingFileBtn: 'Extraction...',
      importFileTitle: 'Charger un fichier PDF, Word (.docx) ou texte avec votre CV',
      linkedinTitle: 'Connecter & Importer depuis LinkedIn',
      linkedinHowBtn: 'Comment synchroniser ?',
      linkedinPlaceholder: 'https://www.linkedin.com/in/votre-profil',
      linkedinExtracting: 'Extraction en cours...',
      linkedinExtractBtn: 'Extraire le Profil (Job)',
      completedSuffix: '% Terminé',
      step1Label: 'Validation de l’URL et lecture du profil public...',
      step2Label: 'Extraction des postes, entreprises et diplômes...',
      step4Label: 'Parcours structuré avec succès au format ATS !',
      logStart: 'Worker asynchrone démarré en arrière-plan.',
      logStep2: 'Expériences et compétences identifiées.',
      logDone1: 'Connexion au profil public validée.',
      logDone2: 'Postes, dates et réalisations calibrés selon Google XYZ.',
      logDone3: 'Modèle prêt pour intégration directe.',
      rolesExtractedLabel: 'Postes Extraits',
      atsSkillsLabel: 'Compétences ATS',
      educationsLabel: 'Diplômes',
      applyDirectBtn: 'Appliquer Directement au CV',
      pasteRawBtn: 'Coller dans le Texte',
      linkedinHelperTitle: '💡 Fonctionnement du worker en arrière-plan :',
      linkedinHelper1: '1. Le worker interroge de façon asynchrone l’URL publique fournie.',
      linkedinHelper2: '2. Les postes, dates et compétences sont convertis automatiquement en CVData.',
      linkedinHelper3: '3. Cliquez sur « Appliquer Directement au CV » pour l’ouvrir dans l’éditeur.',
      rawTextareaLabel: 'Collez ici vos notes, ancien CV, postes, projets ou compétences :',
      rawPlaceholder: `Saisissez vos informations professionnelles ici. Exemple :

NOM COMPLET
Titre Professionnel ou Spécialité
Ville, Pays | Téléphone | E-mail | LinkedIn

EXPÉRIENCE PROFESSIONNELLE :
- Entreprise 1 : Poste, Période, Responsabilités et résultats chiffrés
- Entreprise 2 : Poste, Période, Outils et réalisations

FORMATION :
- Diplôme, Université, Année

COMPÉTENCES :
- Logiciels, Langues, Méthodologies et Certifications...`,
      charsInsertedSuffix: 'caractères saisis',
      switchToTailoredBtn: 'Vous avez une offre précise ? Ajouter la description du poste →',
      sec2Title: '2. L’Offre d’Emploi Ciblée (Annonce / TdR)',
      importTdrBtn: 'Importer TdR',
      importingTdrBtn: 'Extraction...',
      importTdrTitle: 'Charger un PDF ou Word (.docx) contenant les Termes de Référence ou l’annonce',
      sampleJobsLabel: 'Exemples d’Offres :',
      jobChipLabels: {
        'job-1': 'COO Opérations',
        'job-2': 'Cloud & Tech Lead',
        'job-3': 'VP Finance & M&A',
        'job-4': 'Gouvernance Globale'
      },
      jobTextareaLabel: 'Collez la description complète du poste (prérequis, compétences, missions) :',
      jobTextareaPlaceholder: 'Collez ici l’annonce, les termes de référence, les compétences attendues...',
      charsInJobSuffix: 'caractères dans l’offre',
      switchToStandardBtn: 'Pas encore d’offre (générer le CV seul)',
      bannerDescStandard:
        'L’IA extraira, organisera et affinera vos expériences, compétences et diplômes dans la norme choisie.',
      bannerDescTailored:
        'L’IA analysera l’adéquation sémantique et réécrira votre CV avec les métriques et mots-clés exacts.',
      generateOnlyBtn: 'Générer CV Seul',
      generatingStandard: 'Structuration de votre CV...',
      generatingTailored: 'Croisement & Génération du CV Adapté...',
      generateStandardCta: 'Générer le CV Structuré',
      generateTailoredCta: 'Générer le CV Adapté à l’Offre',
      msgExecLoaded: 'Profil Direction Exécutive & Opérations chargé !',
      msgTechLoaded: 'Profil Tech Lead & Architecte Cloud chargé !',
      msgFinLoaded: 'Profil Direction Financière & CFO chargé !',
      msgDocImportedPrefix: 'Document « ',
      msgDocImportedSuffix: ' » importé avec succès !',
      msgJobDocImportedPrefix: 'Offre / TdR « ',
      msgJobDocImportedSuffix: ' » importé avec succès !',
      msgErrExtract: 'Erreur lors de l’extraction du fichier.',
      msgErrNoInput: 'Veuillez importer votre CV (PDF/Word) ou coller vos informations avant de générer.',
      msgErrNoJob: 'Pour adapter à une offre, collez sa description ou passez à « Générer Uniquement le CV ».',
      msgAiPausedStandard: 'L’IA externe est en pause ; votre CV a été structuré localement avec succès !',
      msgAiPausedTailored: 'L’IA externe est en pause ; structuration locale appliquée avec succès !',
      msgSuccessStandard: 'CV structuré et optimisé avec succès dans la norme sélectionnée !',
      msgSuccessTailored: 'CV généré par IA et adapté avec succès à l’offre !',
      msgFallbackStandard: 'CV structuré avec succès à partir de vos données importées !',
      msgFallbackTailored: 'CV structuré et adapté avec succès pour le poste visé !',
      msgErrLinkedInUrl: 'Saisissez l’URL publique de votre profil LinkedIn (ex : https://linkedin.com/in/nom).',
      msgLinkedInSuccess: 'Parcours LinkedIn extrait et formaté dans le modèle de CV !',
      msgLinkedInApplied: 'CV mis à jour directement depuis votre profil LinkedIn !',
      msgLinkedInPasted: 'Données copiées dans le bloc texte !'
    },
    atsRadar: {
      bannerTitle: 'Taux de Compatibilité ATS (Applicant Tracking System)',
      statusNoJob: 'Collez l’offre d’emploi ci-dessous (ou choisissez un exemple) pour calculer le score ATS exact.',
      statusHigh: 'Excellent ! Forte densité de mots-clés et très bon alignement avec le poste.',
      statusMid: 'Bon alignement, mais certains termes techniques clés manquent.',
      statusLow: 'Attention : Risque de filtrage automatique par les logiciels de tri.',
      optimizeAiBtn: 'Optimiser IA vers 95%+',
      tabAudit: 'Audit & Mots-Clés',
      tabBotView: 'Simulateur Robot ATS',
      tabChecklist: 'Checklist de Formatage',
      jobHeader: 'Termes de Référence / Description du Poste',
      loadSampleLabel: 'Charger un Exemple :',
      jobChips: {
        'job-1': 'COO Opérations',
        'job-2': 'Cloud & Tech Lead',
        'job-3': 'VP Finance & M&A',
        'job-4': 'Gouvernance Globale'
      },
      jobPlaceholder: 'Collez ici la description complète du poste visé (prérequis, compétences, TdR)...',
      noJobWarning: 'Aucune offre active : collez une annonce ci-dessus ou cliquez sur un exemple pour lancer le diagnostic ATS.',
      activeJobInfo: 'L’analyseur compare automatiquement chaque ligne de votre CV aux critères essentiels de ce poste.',
      missingTitle: 'Mots-Clés Manquants',
      destLabel: 'Cible :',
      destComp: 'Compétences',
      destSummary: 'Profil',
      destExp: 'Dernier Poste',
      destCompTitle: 'Insérer dans les Compétences Clés du CV',
      destSummaryTitle: 'Ajouter au Profil Exécutif',
      destExpTitle: 'Insérer comme réalisation du dernier poste',
      destCompFull: 'Compétences',
      destSummaryFull: 'Profil Exécutif',
      destExpFull: 'Dernier Poste',
      clickPlusPrefix: 'Cliquez sur',
      clickPlusMiddle: 'pour insérer dans',
      addAllBtn: '+ Tout Ajouter',
      waitingJobMsg: 'En attente d’une description de poste pour détecter les termes manquants.',
      congratsNoMissing: 'Félicitations ! Tous les mots-clés critiques du poste sont présents dans votre CV.',
      insertAriaPrefix: 'Insérer dans le CV sous',
      matchedTitle: 'Mots-Clés Validés dans votre CV',
      noMatchedMsg: 'Aucune correspondance directe validée pour cette offre pour le moment.',
      metricsTitle: 'Métriques Quantifiables Détectées',
      metricsHigh: 'Excellente densité numérique',
      metricsLow: 'Peu de chiffres détectés',
      metricsTip: 'Les recruteurs privilégient les réalisations chiffrées (ex : « 120+ collaborateurs », « -32% de coûts »).',
      verbsTitle: 'Verbes d’Action Exécutive',
      verbsSub: 'verbes à fort impact',
      recsTitle: 'Recommandations Stratégiques pour ce Poste',
      recMissingPrefix: 'Ajoutez les mots-clés manquants : « ',
      recMissingSuffix: ' » dans vos compétences ou réalisations.',
      recMetrics: 'Ajoutez davantage de métriques chiffrées (taux d’amélioration, budget, taille d’équipe).',
      recPassivePrefix: 'Remplacez les tournures passives telles que « ',
      recPassiveSuffix: ' » par des verbes d’action (« Piloté », « Structuré », « Automatisé »).',
      recSummary: 'Votre Profil Exécutif est trop court selon les standards internationaux. Développez sur 4 à 5 lignes.',
      recExcellent: 'Excellent alignement ! Votre CV répond aux critères structurels et sémantiques du poste.',
      botTitle: 'Sortie du Parser ATS (Moteur OCR Workday / Taleo)',
      copiedBtn: 'Copié !',
      copyExtractedBtn: 'Copier le Texte Extrait',
      ocrReadability: 'Lisibilité Linéaire',
      ocrRolesBullets: 'Postes / Puces',
      ocrSkills: 'Compétences',
      ocrStructurePhoto: 'Structure / Photo',
      twoCols: '2 Colonnes',
      oneCol: 'Colonne Unique',
      withPhoto: ' · Photo',
      botDesc: 'Voici le flux textuel exact lu par les filtres automatiques. Tout élément absent ici est invisible lors du tri initial.',
      checklistTitle: 'Checklist de Conformité Algorithmique Internationale',
      c1Title: 'Structure à Colonne Unique (Sans Tableaux Complexes)',
      c1Ok: 'Conforme',
      c1Warn: 'Avis : Mise en Page Divisée',
      c1Desc: 'Les formats à colonne unique comme Executive Harvard ou ATS Compact garantissent 100% de lecture sur tout ATS.',
      c2Title: 'En-tête de Coordonnées Standardisé',
      c2Ok: 'Validé',
      c2Fail: 'Données Manquantes',
      c2Desc: 'E-mail professionnel, téléphone avec indicatif et ville/pays doivent figurer en haut du document.',
      c3Title: 'Densité du Profil Exécutif (100+ caractères)',
      c3Ok: 'Adéquat',
      c3Warn: 'Court',
      c3Desc: 'Le résumé doit présenter votre proposition de valeur, séniorité et domaine d’expertise.',
      c4Title: 'Métriques d’Impact Prouvées (Formule Google XYZ)',
      c4Unit: 'métriques',
      c4Desc: 'L’algorithme favorise les profils affichant des pourcentages (%) ou volumes tangibles.'
    },
    aiTailor: {
      tabFull: 'Optimiseur Complet',
      tabXyz: 'Générateur Google XYZ',
      xyzBadge: 'Formule Exécutive Google',
      xyzTitle: 'Constructeur de Réalisations Quantifiées',
      xyzSubtitlePrefix: 'Les recruteurs d’élite utilisent la formule ',
      xyzSubtitleStrong: '« Accompli [X], mesuré par [Y], en faisant [Z] »',
      xyzSubtitleSuffix: ' pour mesurer l’impact réel.',
      presetsLabel: 'Exemples par Secteur :',
      presetOps: 'Opérations',
      presetOpsSub: 'Délais -28%',
      presetTech: 'Technologie',
      presetTechSub: 'SLA 99.99% Cloud',
      presetFin: 'Finance',
      presetFinSub: 'Clôture -75%',
      presetLead: 'Leadership',
      presetLeadSub: 'Rétention +40%',
      xLabel: '1. Qu’avez-vous accompli ? (Action / Résultat - Verbe Fort)',
      xPlaceholder: 'Ex : Réduit les coûts d’infrastructure et OPEX',
      yLabel: '2. Mesuré par combien ? (Indicateur, %, €, $)',
      yPlaceholder: 'Ex : de 32% (économie annuelle de 240 K€)',
      zLabel: '3. En faisant quoi ? (Méthode, Outil, Stratégie)',
      zPlaceholder: 'Ex : en renégociant les contrats et en consolidant le cloud',
      resultLabel: 'Résultat Formaté pour le CV (Puce Exécutive)',
      copiedBtn: 'Copié dans le Presse-papiers !',
      copyBtn: 'Copier la Réalisation',
      insertedBtn: 'Inséré dans le Poste !',
      insertBtn: 'Insérer dans le Dernier Poste',
      noExpWarnTitle: 'Aucune Expérience Enregistrée',
      noExpWarnMsg: 'Ajoutez d’abord un poste dans l’onglet Éditeur avant d’insérer.',
      insertedToastTitle: 'Réalisation Insérée',
      insertedToastMsgPrefix: 'Ajoutée au poste',
      latestRoleFallback: 'le plus récent',
      fullTitle: 'Moteur d’Optimisation Stratégique (IA Exécutive)',
      fullDesc:
        'Adapte votre profil aux exigences du poste en réécrivant le résumé, affinant les compétences et renforçant les verbes d’action.',
      targetStdLabel: 'Norme Institutionnelle Cible',
      standards: {
        exec: 'Direction C-Level & Opérations (Formule Google XYZ)',
        tech: 'Big Tech & Ingénierie Logicielle (Métriques Cloud & IA)',
        harvard: 'Harvard Business School & Finance Corporate (EBITDA, M&A)',
        corp: 'Standard Corporate & Projets Globaux (Gouvernance et Impact)'
      },
      activeJobLabel: 'Contexte de l’Offre Active',
      charsSuffix: 'caractères',
      noJobDescFallback:
        'Aucune offre définie — l’IA utilisera les meilleures pratiques du standard sélectionné (collez une offre dans Radar ATS).',
      runBtn: 'Lancer l’Optimisation Stratégique',
      runningBtn: 'Analyse de l’offre & Optimisation en cours...',
      aiPausedErr: 'Les fonctions IA sont temporairement suspendues par l’administration.',
      quotaErr: 'Vos crédits IA gratuits sont épuisés. Passez à un forfait supérieur pour continuer.',
      localFallbackRec: 'CV harmonisé localement avec verbes d’impact et lisibilité ATS.',
      proposalTitle: 'Proposition d’Optimisation Générée',
      proposalDesc: 'Relisez les améliorations suggérées avant de les appliquer au document.',
      appliedBtn: 'Appliqué avec Succès !',
      applyBtn: 'Appliquer au CV',
      newSummaryLabel: 'Nouveau Profil Exécutif Optimisé',
      alignedCompLabel: 'Compétences Alignées sur l’Offre',
      optExpLabel: 'Expériences Optimisées — Formule Google XYZ',
      matchEstimateLabel: 'Score d’Adéquation Estimé :'
    },
    interviewSim: {
      badge: 'Préparation Entretien Exécutif',
      title: 'Simulateur d’Entretien Exécutif & Notation IA',
      subtitle:
        'Entraînez-vous aux 5 questions comportementales et techniques les plus probables. Obtenez un score immédiat, une analyse STAR et des réponses modèles.',
      generatingBtn: 'Génération des 5 Questions...',
      generateBtn: 'Générer de Nouvelles Questions',
      simProgress: 'Progression :',
      answeredSuffix: 'Répondues',
      readinessAvg: 'Score Moyen :',
      pending: 'En attente',
      candidateLabel: 'Candidat :',
      profileActive: 'Profil Actif',
      closeErr: 'Fermer',
      qTabPrefix: 'Question',
      draftTitle: 'Brouillon enregistré',
      typeBehavioral: 'Comportementale (STAR)',
      typeTechnical: 'Technique & Méthodologie',
      typeSituational: 'Mise en Situation',
      questionWord: 'Question',
      ofWord: 'sur',
      prevTitle: 'Question précédente',
      nextTitle: 'Question suivante',
      recruiterSeeks: 'Ce que Recherche le Recruteur :',
      recommendedFormula: 'Structure Recommandée :',
      keyCriteria: 'Critères Clés :',
      yourAnswerLabel: 'Votre Réponse :',
      recordingBtn: 'Enregistrement...',
      voiceDictateBtn: 'Dictée Vocale',
      micTitle: 'Dicter la réponse au micro',
      answerPlaceholder:
        'Rédigez votre réponse comme face au jury. Décrivez le contexte réel, votre action personnelle et le résultat chiffré...',
      charsWord: 'caractères',
      wordsWord: 'mots',
      starHint: 'L’algorithme évalue la clarté, les métriques chiffrées et la méthode STAR.',
      evaluatingBtn: 'Évaluation en cours...',
      evaluateBtn: 'Évaluer la Réponse (Méthode STAR)',
      verdictTitle: 'Verdict d’Évaluation :',
      verdictHigh: 'Excellente structure exécutive très convaincante pour le jury.',
      verdictMid: 'Réponse solide ; davantage de chiffres renforcerait votre impact.',
      verdictLow: 'Réponse trop générale ou courte. Appliquez les conseils ci-dessous.',
      strengthsTitle: 'Points Forts Identifiés :',
      improvementsTitle: 'Axes d’Amélioration :',
      modelAnswerTitle: 'Exemple de Réponse Exécutive (Format STAR) :',
      emptyTitle: 'Aucune question générée pour l’instant',
      emptyDesc: 'Cliquez ci-dessus pour générer 5 questions sur mesure pour votre candidature.',
      emptyBtn: 'Générer les Questions d’Entretien',
      errAiPausedGen: 'Le générateur d’entretiens IA est temporairement en pause.',
      errAiPausedEval: 'L’évaluation par IA est temporairement en pause.',
      errShortAnswer: 'Veuillez saisir une réponse plus détaillée (15 caractères min.) avant d’évaluer.',
      errGenDefault: 'Erreur lors de la génération des questions.',
      errEvalDefault: 'Erreur lors de l’évaluation. Veuillez réessayer.'
    },
    jobMatches: {
      title: 'Offres Compatibles avec votre CV',
      subtitlePrefix: 'Recherche en direct sur',
      subtitleMiddle: 'pour',
      subtitleDefaultProfile: 'votre profil',
      refreshBtn: 'Actualiser',
      compatibleJobs: 'Offres compatibles',
      indexedPool: 'Base active indexée',
      analyzedCriteria: 'Critères analysés',
      fullProfile: 'Profil complet',
      configTitle: 'Configurer vos Préférences d’Emploi',
      configSummaryCountries: 'pays',
      configSummaryRoles: 'poste(s)',
      configSummaryContracts: 'contrat(s)',
      configSummaryAuto: '(mise à jour auto)',
      configSummaryEmpty: 'Personnalisez pays, postes et types de contrat',
      clearTitle: 'Réinitialiser les préférences',
      clearBtn: 'Effacer',
      targetRolesLabel: 'Postes Souhaités',
      rolePlaceholder: 'Ajouter un poste (ex : Product Manager, React Developer)...',
      addBtn: 'Ajouter',
      countriesLabel: 'Pays et Régions Préférés',
      countries: {
        remoto_global: 'Télétravail Global',
        brasil: 'Brésil',
        portugal: 'Portugal',
        angola: 'Angola',
        espanha: 'Espagne',
        reino_unido: 'Royaume-Uni',
        alemanha: 'Allemagne',
        franca: 'France',
        estados_unidos: 'États-Unis',
        canada: 'Canada',
        europa: 'Union Européenne'
      },
      contractsLabel: 'Types de Contrat Préférés',
      contracts: {
        full_time: 'Temps Plein',
        contract: 'Contrat / Freelance',
        part_time: 'Temps Partiel',
        internship: 'Stage / Alternance'
      },
      workplaces: {
        all: 'Tous modes',
        remote: 'Télétravail',
        hybrid: 'Hybride',
        onsite: 'Sur site'
      },
      sources: {
        all: 'Tous les Portails',
        linkedin: 'LinkedIn',
        radar: 'Radar d’Offres',
        remotive: 'Remotive',
        arbeitnow: 'Arbeitnow',
        jobicy: 'Jobicy',
        remoteok: 'RemoteOK'
      },
      externalPortalsTitle: 'Rechercher votre profil directement sur d’autres grands portails :',
      searchPlaceholder: 'Filtrer par poste, entreprise ou compétence (ex : React, Finance, SAP)...',
      filterBtn: 'Filtrer',
      clearFilterBtn: 'Effacer',
      retryBtn: 'Réessayer',
      emptyTitle: 'Aucune offre exacte trouvée pour ces préférences',
      emptyDesc: 'Essayez d’ajouter « Télétravail Global » ou d’élargir les postes et contrats ci-dessus.',
      resetFiltersBtn: 'Réinitialiser Filtres et Préférences',
      matchLabel: 'adéquation',
      inYourCvLabel: 'Dans votre CV :',
      salaryLabel: 'Salaire :',
      applyBtn: 'Postuler',
      viewOnPrefix: 'Voir sur',
      adaptAtsBtn: 'Adapter CV (ATS)',
      errFetch: 'Erreur de connexion aux portails d’emploi.',
      periodUnits: {
        year: '/an',
        month: '/mois',
        hour: '/h',
        day: '/jour',
        week: '/sem'
      },
      relRecent: 'Récent',
      relToday: 'Aujourd’hui',
      relHoursPrefix: 'Il y a ',
      relHoursSuffix: 'h',
      relYesterday: 'Hier',
      relDaysPrefix: 'Il y a ',
      relDaysSuffix: 'j',
      tailorHeader: {
        role: 'Poste',
        company: 'Entreprise',
        portal: 'Portail',
        workplace: 'Mode',
        location: 'Lieu',
        skills: 'Compétences & Mots-Clés',
        description: 'Description du Poste',
        criteria: 'Critères de compatibilité détectés'
      }
    }
  },
  de: {
    app: {
      onlineTitle: 'Verbindung Wiederhergestellt',
      onlineDesc: 'Ihre Internetverbindung ist wieder aktiv.',
      offlineTitle: 'Offline-Modus',
      offlineDesc: 'Keine Internetverbindung. Ihre Änderungen bleiben lokal gespeichert.',
      wordToastDefault: 'Word-Datei (.docx) Heruntergeladen!',
      wordToastLetter: 'Offizielles Anschreiben (.docx) Heruntergeladen!',
      wordToastCvPrefix: 'Offizieller Word-Lebenslauf (',
      wordToastCvSuffix: ') Heruntergeladen!',
      wordToastSub: 'Nach internationalen Typografie- und Seitenrandstandards formatiert.',
      pricingDefaultPrompt:
        'Aktivieren Sie einen Pro- oder Executive-VIP-Plan, um wasserzeichenfreie Word- (.docx) und PDF-Dokumente zu exportieren.',
      checkoutConfirmedPrompt:
        'Konto bestätigt! Schließen Sie Ihre Tarifaktivierung ab, um Word-Exporte, ATS-Radar und Übersetzungen freizuschalten.',
      unlockedTitle: 'Zugang Freigeschaltet!',
      unlockedSubSuffix: ' bereit zur Bearbeitung.',
      authModelPromptPrefix: 'Erstellen Sie ein Konto oder melden Sie sich an, um ',
      authModelPromptSuffix: ' zu nutzen.',
      planModelPromptPrefix:
        'Für Bearbeitung und Export ist ein aktives Abonnement erforderlich. Wählen Sie Pro oder Executive VIP per Karte oder Pix für ',
      planModelPromptSuffix: '.',
      modelLoadedTitle: 'Vorlage Geladen!',
      modelLoadedSubSuffix: ' zur Bearbeitung geöffnet.',
      authTranslatePrompt: 'Melden Sie sich an oder registrieren Sie sich, um Lebenslauf und Anschreiben zu übersetzen.',
      planTranslatePrompt:
        'Die vollständige KI-Übersetzung von Lebenslauf und Anschreiben ist Pro- und Executive-VIP-Abonnenten vorbehalten.',
      langChangedTitle: 'Sprache Geändert',
      langChangedSubPrefix: 'Lebenslauf und Anschreiben angezeigt auf ',
      translatedTitle: 'Inhalt Übersetzt!',
      translatedSubPrefix: 'Lebenslauf und Anschreiben übersetzt ins ',
      notifTranslateTitle: 'Übersetzung Abgeschlossen',
      notifTranslateMsgPrefix: 'Ihr Lebenslauf und Anschreiben wurden übersetzt ins ',
      translationErrorTitle: 'Übersetzungsfehler',
      translationErrorFallback: 'Der Inhalt konnte derzeit nicht übersetzt werden. Bitte erneut versuchen.',
      authExportPrompt: 'Bitte melden Sie sich an, um Ihren Lebenslauf als Word-Datei (.docx) herunterzuladen.',
      planExportPrompt:
        'Offizielle Word- (.docx) und hochauflösende PDF-Downloads erfordern ein aktives Abonnement ohne Wasserzeichen.',
      exportLetterTitle: 'Anschreiben Heruntergeladen!',
      exportLetterSubPrefix: 'Die Datei ',
      exportLetterSubSuffix: ' wurde ohne Wasserzeichen erstellt.',
      exportCvTitle: 'Word-Lebenslauf Heruntergeladen!',
      exportCvSubPrefix: 'Vorlage ',
      exportCvSubSuffix: ' mit nativem OpenXML-Format und 100% ATS-Kompatibilität erstellt.',
      notifExportTitle: 'Word-Export Abgeschlossen',
      notifExportLetterMsgPrefix: 'Anschreiben ',
      notifExportCvMsgPrefix: 'Lebenslauf ',
      exportErrorTitle: 'Exportfehler',
      exportErrorDesc: 'Das Word-Dokument konnte nicht erstellt werden. Bitte überprüfen Sie Ihre Angaben.',
      maintenanceBadge: 'Geplante Wartung',
      maintenanceTitle: 'Plattform Wird Vorübergehend Aktualisiert',
      maintenanceDefaultMsg: 'Wir führen geplante Verbesserungen durch und sind gleich wieder für Sie da.',
      maintenanceAdminPrompt: 'Zugang während der Wartung nur für Administratoren.',
      maintenanceAdminBtn: 'Admin-Zugang',
      adminMaintTitle: 'Wartungsmodus AKTIV:',
      adminMaintDesc: 'Normale Nutzer sind gesperrt. Nur Administratoren haben Zugriff.',
      adminMaintBtn: 'Im Admin Verwalten',
      impersonateTitle: 'Impersonation-Modus Aktiv:',
      impersonateAs: 'Ansicht als',
      impersonateExitBtn: 'Beenden & Zurück zum Admin',
      resumeBuilderLabel: 'Lebenslauf-Editor',
      modelLabelPrefix: 'Vorlage ',
      authCreateSavePrompt: 'Erstellen Sie ein kostenloses Konto zum Speichern und Exportieren.',
      wordBadgeLocked: 'Word 🔒',
      wordBadgeOpen: 'Word'
    },
    multiLangModal: {
      modalTitle: 'Lebenslauf in Anderer Sprache Herunterladen',
      modalSubtitle: 'Vollständige Übersetzung für internationale Bewerbungsverfahren.',
      selectLang: 'Zielsprache auswählen:',
      langNames: {
        pt: 'Portugiesisch',
        en: 'Englisch',
        es: 'Spanisch',
        fr: 'Französisch',
        de: 'Deutsch'
      },
      activeTranslationPrefix: 'Übersetzung ins ',
      activeTranslationSuffix: ' Aktiv',
      readyTranslationPrefix: 'Bereit für Übersetzung ins ',
      readyTranslationSuffix: '',
      translating: 'KI übersetzt...',
      updateTranslation: 'Übersetzung Aktualisieren',
      translateAction: 'Mit KI Übersetzen',
      explanation:
        'Bewahrt Führungstitel passend zum Zielmarkt, stärkt Erfolge mit Aktionsverben und hält 100% ATS-Genauigkeit.',
      previewTranslated: 'Vorschau des Übersetzten Dokuments',
      exportOptionsLabel: 'Exportoptionen:',
      downloading: 'Exportiere...',
      downloadDocx: 'Word (.docx) Laden',
      openXmlSub: 'Natives OpenXML-Format',
      downloadPdf: 'PDF Laden / Drucken',
      vectorA4Sub: 'Wasserzeichenfreies A4-Vektorlayout',
      continueEditingPrompt: 'Möchten Sie diesen Lebenslauf in dieser Sprache weiterbearbeiten?',
      applyToEditor: 'In Haupteditor Übernehmen',
      loadedEditorTitle: 'Lebenslauf Geladen',
      loadedEditorSubPrefix: 'Der Editor zeigt nun die Version auf ',
      unlimitedFooter: '✓ Unbegrenzte Downloads & Übersetzungen enthalten',
      planRequiredFooter: 'Offizielle Downloads erfordern Pro oder Executive',
      close: 'Schließen',
      authTranslateReq: 'Anmeldung erforderlich, um den Lebenslauf zu übersetzen.',
      planTranslateReq: 'Mehrsprachige KI-Übersetzungen sind Pro- und Executive-VIP-Abonnenten vorbehalten.',
      authExportReq: 'Anmeldung für den Export erforderlich.',
      planExportReq: 'Der offizielle Word-Export erfordert ein aktives Abo.',
      authPdfReq: 'Anmeldung zum Drucken oder PDF-Speichern erforderlich.',
      planPdfReq: 'Der offizielle PDF-Export erfordert ein aktives Abo.',
      translationReadyTitle: 'Übersetzung Fertig!',
      translationReadySubPrefix: 'Lebenslauf angepasst für ',
      notifTranslateTitle: 'Mehrsprachige Übersetzung Fertig',
      notifTranslateMsgPrefix: 'Ihr Lebenslauf wurde übersetzt ins ',
      translationErrorTitle: 'Übersetzungsfehler',
      translationErrorFallback: 'Übersetzung fehlgeschlagen. Bitte später erneut versuchen.',
      wordSuccessTitle: 'Word Heruntergeladen!',
      wordSuccessSubPrefix: 'Datei auf ',
      wordSuccessSubSuffix: ' im nativen OpenXML-Format exportiert.',
      wordErrorTitle: 'Word-Downloadfehler',
      wordErrorDesc: 'Dokument konnte nicht erstellt werden.',
      notifExportTitle: 'Mehrsprachiger Export Fertig',
      notifExportWordPrefix: 'Lebenslauf auf ',
      notifExportPdfPrefix: 'Lebenslauf auf ',
      notifExportPdfSuffix: ' für PDF/Druck vorbereitet.'
    },
    coverPanel: {
      aiPaused: 'KI-Funktionen sind vorübergehend durch die Administration pausiert.',
      serverErr: 'Serverfehler bei der Generierung.',
      generatedAi: 'Anschreiben erfolgreich mit KI generiert!',
      invalidFormat: 'Ungültiges Format zurückgegeben.',
      generatedFallback: 'Anschreiben erfolgreich an Ihr Profil angepasst!',
      planRequiredWord: 'Der offizielle Word-Download (.docx) des Anschreibens erfordert Pro oder Executive.',
      planRequiredPdf: 'Der offizielle PDF-Druck/-Export des Anschreibens erfordert Pro oder Executive.',
      recipientPlaceholder: 'z. B. Auswahlausschuss',
      orgPlaceholder: 'z. B. Zielunternehmen / Organisation',
      rolePlaceholder: 'z. B. Betriebsleiter',
      defaultRecipient: 'Personalabteilung & Auswahlgremium',
      defaultOrg: 'Personalabteilung / Zielunternehmen',
      defaultRole: 'Angestrebte Position'
    },
    miniPreview: {
      coverSidebarLabel: 'Anschreiben',
      coverHeaderLabel: 'Exekutives Motivationsschreiben',
      a4Official: 'A4 · Offizielles Format',
      contacts: 'Kontakt',
      competencies: 'Kompetenzen',
      profile: 'Berufsprofil',
      experience: 'Berufserfahrung',
      education: 'Ausbildung',
      europassBadge: 'EU Europass',
      aboutMe: 'Über Mich / Profil',
      educationTraining: 'Ausbildung & Studium',
      langSkills: 'Sprachkenntnisse',
      techSummary: '> Technisches Profil',
      minSummary: '01 / Kurzprofil',
      stdSummary: 'Berufsprofil',
      techComp: '> Stack & Kompetenzen',
      minComp: '02 / Kompetenzen',
      stdComp: 'Kernkompetenzen',
      techExp: '> Erfahrung & Wirkung',
      minExp: '03 / Berufserfahrung',
      stdExp: 'Berufserfahrung',
      techEdu: '> Ausbildung',
      minEdu: '04 / Ausbildung',
      stdEdu: 'Akademischer Werdegang'
    },
    rawGenerator: {
      title: 'ATS-Lebenslauf Import & Generator',
      descStandard:
        'Importieren oder fügen Sie Ihren Lebenslauf ein, um ihn professionell zu strukturieren — ohne Stellenanzeige.',
      descTailored:
        'Geben Sie Ihre Daten und die Zielstelle ein, um einen exakt auf den Recruiter zugeschnittenen Lebenslauf zu erstellen.',
      clearTitle: 'Alle Felder leeren und neu beginnen',
      clearBtn: 'Alles Leeren',
      presetsLabel: 'Beispielprofile:',
      presetExec: 'Executive & Operations',
      presetExecTitle: 'Executive-Leadership- & Operations-Profil laden',
      presetTech: 'Tech Lead & Cloud',
      presetTechTitle: 'Tech-Lead- & Cloud-Architektur-Profil laden',
      presetFin: 'Finanzen & CFO',
      presetFinTitle: 'Corporate-Finance- & CFO-Profil laden',
      targetLabel: 'Zielstandard:',
      stdOnu: 'Global Corporate',
      stdOnuTitle: 'Globaler Konzern- & Projektstandard',
      stdTech: 'Big Tech / Google',
      stdTechTitle: 'Google-XYZ-Formel für messbare Erfolge',
      stdHarvard: 'Harvard Executive',
      stdHarvardTitle: 'Harvard Business School Executive Format',
      stdEuropass: '📸 Europass EU',
      stdEuropassTitle: 'Offizieller EU-Standard (mit Foto & GER)',
      stdAts: 'Reines ATS (Ohne Foto)',
      stdAtsTitle: 'Lineares Layout ohne Ablehnungsrisiko durch ATS-Scanner',
      modeStandardTitle: 'Nur Lebenslauf Erstellen',
      modeStandardDesc:
        'Ideal ohne konkrete Stellenanzeige. Bewahrt und veredelt Ihren echten Werdegang.',
      modeTailoredTitle: 'An Stelle Anpassen',
      modeTailoredDesc:
        'Gleicht Ihre Daten mit Stellenanzeige oder ToR ab, um Keywords und ATS-Score zu maximieren.',
      activeBadge: 'Aktiv',
      sec1Title: '1. Ihre Daten & Werdegang',
      importFileBtn: 'Datei Importieren',
      importingFileBtn: 'Extrahiere...',
      importFileTitle: 'PDF, Word (.docx) oder Textdatei mit Ihrem Lebenslauf hochladen',
      linkedinTitle: 'LinkedIn Verbinden & Importieren',
      linkedinHowBtn: 'Wie funktioniert es?',
      linkedinPlaceholder: 'https://www.linkedin.com/in/ihr-profil',
      linkedinExtracting: 'Extraktion läuft...',
      linkedinExtractBtn: 'Profil Extrahieren (Job)',
      completedSuffix: '% Fertig',
      step1Label: 'URL wird geprüft und öffentliches Profil geladen...',
      step2Label: 'Berufserfahrung, Unternehmen und Ausbildung werden extrahiert...',
      step4Label: 'Werdegang erfolgreich im ATS-Format strukturiert!',
      logStart: 'Asynchroner Hintergrund-Worker gestartet.',
      logStep2: 'Berufsverlauf und Kompetenzen erkannt.',
      logDone1: 'Öffentliches Profil verifiziert.',
      logDone2: 'Positionen und Erfolge nach Google XYZ kalibriert.',
      logDone3: 'Modell bereit zur direkten Übernahme.',
      rolesExtractedLabel: 'Positionen Extrahiert',
      atsSkillsLabel: 'ATS-Kompetenzen',
      educationsLabel: 'Abschlüsse',
      applyDirectBtn: 'Direkt in Lebenslauf Übernehmen',
      pasteRawBtn: 'In Textfeld Kopieren',
      linkedinHelperTitle: '💡 So funktioniert der Hintergrund-Worker:',
      linkedinHelper1: '1. Der Worker ruft die angegebene öffentliche URL asynchron ab.',
      linkedinHelper2: '2. Positionen, Daten und Fähigkeiten werden automatisch in CVData konvertiert.',
      linkedinHelper3: '3. Klicken Sie auf „Direkt in Lebenslauf Übernehmen“, um sofort zu bearbeiten.',
      rawTextareaLabel: 'Fügen Sie hier Notizen, alten Lebenslauf, Positionen oder Kompetenzen ein:',
      rawPlaceholder: `Fügen Sie hier Ihre beruflichen Daten ein. Beispiel:

VOLLSTÄNDIGER NAME
Berufstitel oder Schwerpunkt
Stadt, Land | Telefon | E-Mail | LinkedIn

BERUFSERFAHRUNG:
- Unternehmen 1: Position, Zeitraum, Hauptaufgaben und messbare Erfolge
- Unternehmen 2: Position, Zeitraum, eingesetzte Tools und Resultate

AUSBILDUNG:
- Abschluss, Universität, Jahr

KOMPETENZEN:
- Software, Sprachen, Methoden und Zertifikate...`,
      charsInsertedSuffix: 'Zeichen eingegeben',
      switchToTailoredBtn: 'Konkrete Stelle vorhanden? Stellenbeschreibung hinzufügen →',
      sec2Title: '2. Zielposition (Stellenanzeige / ToR)',
      importTdrBtn: 'ToR Importieren',
      importingTdrBtn: 'Extrahiere...',
      importTdrTitle: 'PDF oder Word (.docx) mit Stellenbeschreibung hochladen',
      sampleJobsLabel: 'Beispielstellen:',
      jobChipLabels: {
        'job-1': 'COO Operations',
        'job-2': 'Cloud & Tech Lead',
        'job-3': 'VP Finanzen & M&A',
        'job-4': 'Global Governance'
      },
      jobTextareaLabel: 'Vollständige Stellenbeschreibung einfügen (Anforderungen, Skills, Aufgaben):',
      jobTextareaPlaceholder: 'Stellenanzeige, Anforderungsprofil oder Leistungsbeschreibung hier einfügen...',
      charsInJobSuffix: 'Zeichen in der Stellenbeschreibung',
      switchToStandardBtn: 'Noch keine Stelle (nur Lebenslauf erstellen)',
      bannerDescStandard:
        'Die KI extrahiert, strukturiert und verfeinert Ihre Erfahrungen und Abschlüsse im gewählten Standard.',
      bannerDescTailored:
        'Die KI analysiert die semantische Passung und formuliert Kennzahlen und Keywords präzise für diese Stelle um.',
      generateOnlyBtn: 'Nur CV Erstellen',
      generatingStandard: 'Strukturiere Lebenslauf...',
      generatingTailored: 'Gleiche ab & Erstelle Angepassten CV...',
      generateStandardCta: 'Strukturierten Lebenslauf Erstellen',
      generateTailoredCta: 'Angepassten Lebenslauf Erstellen',
      msgExecLoaded: 'Executive Leadership & Strategie Profil geladen!',
      msgTechLoaded: 'Tech Lead & Cloud-Architekt Profil geladen!',
      msgFinLoaded: 'Corporate Finance & CFO Profil geladen!',
      msgDocImportedPrefix: 'Dokument "',
      msgDocImportedSuffix: '" erfolgreich importiert!',
      msgJobDocImportedPrefix: 'Stellen-Datei "',
      msgJobDocImportedSuffix: '" erfolgreich importiert!',
      msgErrExtract: 'Fehler beim Auslesen der Datei.',
      msgErrNoInput: 'Bitte laden Sie Ihren Lebenslauf hoch oder fügen Sie Ihre Daten ein.',
      msgErrNoJob: 'Für eine Stellenanpassung fügen Sie bitte die Stellenbeschreibung ein.',
      msgAiPausedStandard: 'Externe KI pausiert; Ihr Lebenslauf wurde lokal strukturiert!',
      msgAiPausedTailored: 'Externe KI pausiert; lokale Strukturierung erfolgreich angewandt!',
      msgSuccessStandard: 'Lebenslauf erfolgreich im gewählten Standard strukturiert!',
      msgSuccessTailored: 'Lebenslauf mit KI erstellt und auf die Stelle zugeschnitten!',
      msgFallbackStandard: 'Lebenslauf erfolgreich aus Ihren Daten strukturiert!',
      msgFallbackTailored: 'Lebenslauf strukturiert und auf die Zielstelle abgestimmt!',
      msgErrLinkedInUrl: 'Geben Sie Ihre öffentliche LinkedIn-Profil-URL ein (z. B. https://linkedin.com/in/name).',
      msgLinkedInSuccess: 'LinkedIn-Verlauf erfolgreich extrahiert und formatiert!',
      msgLinkedInApplied: 'Lebenslauf direkt aus LinkedIn aktualisiert!',
      msgLinkedInPasted: 'Daten in das Textfeld kopiert!'
    },
    atsRadar: {
      bannerTitle: 'ATS-Kompatibilitätswert (Applicant Tracking System)',
      statusNoJob: 'Fügen Sie unten eine Stellenbeschreibung ein (oder wählen Sie ein Beispiel), um den Keyword-Match zu berechnen.',
      statusHigh: 'Hervorragend! Hohe Keyword-Dichte und starke Übereinstimmung mit der Stelle.',
      statusMid: 'Gute Ausrichtung, aber wichtige Fachbegriffe fehlen noch.',
      statusLow: 'Achtung: Hohes Risiko automatischer Aussortierung durch ATS-Filter.',
      optimizeAiBtn: 'Mit KI auf 95%+ Optimieren',
      tabAudit: 'Audit & Keywords',
      tabBotView: 'ATS-Bot-Simulator',
      tabChecklist: 'Format-Checkliste',
      jobHeader: 'Stellenbeschreibung / Anforderungsprofil',
      loadSampleLabel: 'Beispiel Laden:',
      jobChips: {
        'job-1': 'COO Operations',
        'job-2': 'Cloud & Tech Lead',
        'job-3': 'VP Finanzen & M&A',
        'job-4': 'Global Governance'
      },
      jobPlaceholder: 'Vollständige Stellenbeschreibung hier einfügen...',
      noJobWarning: 'Keine aktive Stelle: Anzeige einfügen oder Beispiel wählen für echtes ATS-Keyword-Tracking.',
      activeJobInfo: 'Der Analysator vergleicht jede Zeile Ihres Lebenslaufs mit den Anforderungen dieser Stelle.',
      missingTitle: 'Fehlende Keywords',
      destLabel: 'Ziel:',
      destComp: 'Kompetenzen',
      destSummary: 'Profil',
      destExp: 'Letzte Position',
      destCompTitle: 'In Kernkompetenzen einfügen',
      destSummaryTitle: 'Zum Kurzprofil hinzufügen',
      destExpTitle: 'Als Erfolg in die letzte Position einfügen',
      destCompFull: 'Kernkompetenzen',
      destSummaryFull: 'Kurzprofil',
      destExpFull: 'Letzte Position',
      clickPlusPrefix: 'Klicken Sie auf',
      clickPlusMiddle: ', um einzufügen in',
      addAllBtn: '+ Alle Hinzufügen',
      waitingJobMsg: 'Warte auf Stellenbeschreibung zur Erkennung fehlender Begriffe.',
      congratsNoMissing: 'Glückwunsch! Alle kritischen Keywords der Stelle sind enthalten.',
      insertAriaPrefix: 'In Lebenslauf einfügen unter',
      matchedTitle: 'Validierte Keywords im Lebenslauf',
      noMatchedMsg: 'Noch keine direkten Übereinstimmungen für diese Stelle gefunden.',
      metricsTitle: 'Messbare Kennzahlen Erkannt',
      metricsHigh: 'Sehr gute Zahlendichte',
      metricsLow: 'Wenige Kennzahlen gefunden',
      metricsTip: 'Recruiter bevorzugen quantifizierte Erfolge (z. B. "über 120 Mitarbeitende", "32% Kostensenkung").',
      verbsTitle: 'Starke Aktionsverben',
      verbsSub: 'wirkungsvolle Verben',
      recsTitle: 'Strategische Empfehlungen',
      recMissingPrefix: 'Ergänzen Sie fehlende Keywords: "',
      recMissingSuffix: '" in Ihren Kompetenzen oder Stationen.',
      recMetrics: 'Fügen Sie mehr Zahlen hinzu (Prozentsätze, Teamgröße, Budgetvolumen).',
      recPassivePrefix: 'Ersetzen Sie passive Formulierungen wie "',
      recPassiveSuffix: '" durch aktive Führungsverben ("Leitete", "Entwarf", "Automatisierte").',
      recSummary: 'Ihr Kurzprofil ist zu kurz. Erweitern Sie es auf 4-5 prägnante Zeilen.',
      recExcellent: 'Hervorragende Passung! Ihr Lebenslauf erfüllt Struktur- und Keyword-Vorgaben.',
      botTitle: 'ATS-Parser-Ausgabe (Workday / Taleo OCR-Engine)',
      copiedBtn: 'Kopiert!',
      copyExtractedBtn: 'Extrahierten Text Kopieren',
      ocrReadability: 'Lineare Lesbarkeit',
      ocrRolesBullets: 'Stationen / Punkte',
      ocrSkills: 'Kompetenzen',
      ocrStructurePhoto: 'Struktur / Foto',
      twoCols: '2 Spalten',
      oneCol: 'Einspaltig',
      withPhoto: ' · Foto',
      botDesc: 'Dies ist der exakte Textfluss, den automatische Bewerbersysteme auslesen. Was hier fehlt, bleibt unsichtbar.',
      checklistTitle: 'Internationale Algorithmus-Checkliste',
      c1Title: 'Einspaltige Struktur (Keine Komplexen Tabellen)',
      c1Ok: 'Konform',
      c1Warn: 'Hinweis: Geteiltes Layout',
      c1Desc: 'Einspaltige Layouts wie Executive Harvard oder ATS Compact garantieren 100% Lesbarkeit.',
      c2Title: 'Standardisierte Kontaktzeile',
      c2Ok: 'Bestätigt',
      c2Fail: 'Daten Fehlen',
      c2Desc: 'Geschäftliche E-Mail, Telefon mit Vorwahl und Standort müssen oben stehen.',
      c3Title: 'Profiltiefe (100+ Zeichen)',
      c3Ok: 'Ausreichend',
      c3Warn: 'Zu Kurz',
      c3Desc: 'Das Profil sollte Wertbeitrag, Seniorität und Fachrichtung klar darstellen.',
      c4Title: 'Nachgewiesene Erfolgskennzahlen (Google-XYZ-Formel)',
      c4Unit: 'Kennzahlen',
      c4Desc: 'ATS-Systeme bewerten Profile mit konkreten Prozenten (%) und Zahlen deutlich höher.'
    },
    aiTailor: {
      tabFull: 'Komplett-Optimierer',
      tabXyz: 'Google-XYZ-Baukasten',
      xyzBadge: 'Google Executive Formel',
      xyzTitle: 'Baukasten für Messbare Erfolge',
      xyzSubtitlePrefix: 'Top-Recruiter nutzen die Methode ',
      xyzSubtitleStrong: '„Erreicht [X], gemessen an [Y], durch [Z]“',
      xyzSubtitleSuffix: ', um echte Wirkung zu prüfen.',
      presetsLabel: 'Branchen-Beispiele:',
      presetOps: 'Operations',
      presetOpsSub: 'Durchlaufzeit -28%',
      presetTech: 'Technologie',
      presetTechSub: '99,99% Cloud-SLA',
      presetFin: 'Finanzen',
      presetFinSub: 'Abschluss -75%',
      presetLead: 'Führung',
      presetLeadSub: 'Bindung +40%',
      xLabel: '1. Was wurde erreicht? (Ergebnis - Starkes Verb)',
      xPlaceholder: 'z. B. Senkte Infrastruktur- und Betriebskosten',
      yLabel: '2. Woran gemessen? (Zahl, %, €, $)',
      yPlaceholder: 'z. B. um 32% (240 T€ jährliche Ersparnis)',
      zLabel: '3. Durch welche Maßnahme? (Methode, Tool, Strategie)',
      zPlaceholder: 'z. B. durch Neuverhandlung von Verträgen und Cloud-Konsolidierung',
      resultLabel: 'Formatierter Lebenslauf-Eintrag',
      copiedBtn: 'In Zwischenablage kopiert!',
      copyBtn: 'Erfolg Kopieren',
      insertedBtn: 'In Position Eingefügt!',
      insertBtn: 'In Letzte Position Einfügen',
      noExpWarnTitle: 'Keine Erfahrung Vorhanden',
      noExpWarnMsg: 'Fügen Sie zuerst eine Station im Editor hinzu.',
      insertedToastTitle: 'Erfolg Eingefügt',
      insertedToastMsgPrefix: 'Hinzugefügt zu Position',
      latestRoleFallback: 'aktuellste',
      fullTitle: 'Strategische Optimierungs-Engine (Executive KI)',
      fullDesc:
        'Passt Ihr Profil exakt an die Stellenanforderungen an — mit optimiertem Kurzprofil, Skills und starken Aktionsverben.',
      targetStdLabel: 'Zielstandard',
      standards: {
        exec: 'C-Level Führung & Operations (Google-XYZ-Formel)',
        tech: 'Big Tech & Software Engineering (System-, Cloud- & KI-Metriken)',
        harvard: 'Harvard Business School & Corporate Finance (EBITDA, M&A)',
        corp: 'Global Corporate & Internationale Projekte (Governance & Strategie)'
      },
      activeJobLabel: 'Aktive Stellenbeschreibung',
      charsSuffix: 'Zeichen',
      noJobDescFallback:
        'Keine Stelle definiert — KI optimiert nach Best Practices des gewählten Standards (fügen Sie im ATS-Radar eine Stelle ein).',
      runBtn: 'Strategische Optimierung Starten',
      runningBtn: 'Analysiere Stelle & Optimiere Lebenslauf...',
      aiPausedErr: 'KI-Funktionen sind vorübergehend durch die Administration pausiert.',
      quotaErr: 'Ihr kostenloses KI-Guthaben ist aufgebraucht. Upgraden Sie Ihren Tarif.',
      localFallbackRec: 'Lebenslauf lokal mit Fokus auf Wirkungsverben und ATS-Lesbarkeit harmonisiert.',
      proposalTitle: 'Generierter Optimierungsvorschlag',
      proposalDesc: 'Prüfen Sie die Vorschläge vor der Übernahme in Ihr Dokument.',
      appliedBtn: 'Erfolgreich Übernommen!',
      applyBtn: 'Änderungen Übernehmen',
      newSummaryLabel: 'Neues Optimiertes Kurzprofil',
      alignedCompLabel: 'Auf die Stelle Ausgerichtete Kompetenzen',
      optExpLabel: 'Optimierte Stationen — Google-XYZ-Formel',
      matchEstimateLabel: 'Geschätzte Übereinstimmung:'
    },
    interviewSim: {
      badge: 'Vorbereitung Führungsinterview',
      title: 'KI-Interview-Simulator & Bewertung',
      subtitle:
        'Üben Sie die 5 wahrscheinlichsten Verhaltens- und Fachfragen für Ihre Zielstelle. Mit sofortiger Bewertung, STAR-Analyse und Musterantworten.',
      generatingBtn: 'Erstelle 5 Fragen...',
      generateBtn: 'Neue Fragen Generieren',
      simProgress: 'Fortschritt:',
      answeredSuffix: 'Beantwortet',
      readinessAvg: 'Durchschnittswert:',
      pending: 'Ausstehend',
      candidateLabel: 'Kandidat:',
      profileActive: 'Aktives Profil',
      closeErr: 'Schließen',
      qTabPrefix: 'Frage',
      draftTitle: 'Entwurf gespeichert',
      typeBehavioral: 'Verhalten (STAR)',
      typeTechnical: 'Fachlich & Methodisch',
      typeSituational: 'Situatives Szenario',
      questionWord: 'Frage',
      ofWord: 'von',
      prevTitle: 'Vorherige Frage',
      nextTitle: 'Nächste Frage',
      recruiterSeeks: 'Worauf Recruiter Achten:',
      recommendedFormula: 'Empfohlene Struktur:',
      keyCriteria: 'Schlüsselkriterien:',
      yourAnswerLabel: 'Ihre Antwort:',
      recordingBtn: 'Aufnahme...',
      voiceDictateBtn: 'Spracheingabe',
      micTitle: 'Antwort per Mikrofon einsprechen',
      answerPlaceholder:
        'Formulieren Sie Ihre Antwort wie im echten Gespräch. Beschreiben Sie Ausgangslage, Ihren persönlichen Beitrag und das messbare Ergebnis...',
      charsWord: 'Zeichen',
      wordsWord: 'Wörter',
      starHint: 'Bewertet Klarheit, messbare Ergebnisse und STAR-Struktur.',
      evaluatingBtn: 'Bewerte Antwort...',
      evaluateBtn: 'Antwort Bewerten (STAR)',
      verdictTitle: 'Bewertungsurteil:',
      verdictHigh: 'Hervorragende Struktur mit starker Überzeugungskraft.',
      verdictMid: 'Gute Antwort, mehr konkrete Kennzahlen würden sie noch stärker machen.',
      verdictLow: 'Zu kurz oder allgemein. Nutzen Sie die Hinweise unten.',
      strengthsTitle: 'Erkannte Stärken:',
      improvementsTitle: 'Verbesserungspotenzial:',
      modelAnswerTitle: 'Musterantwort auf Führungsebene (STAR-Format):',
      emptyTitle: 'Noch keine Fragen erstellt',
      emptyDesc: 'Klicken Sie oben, um 5 maßgeschneiderte Fragen für Ihre Bewerbung zu generieren.',
      emptyBtn: 'Interviewfragen Generieren',
      errAiPausedGen: 'Der KI-Fragengenerator ist vorübergehend pausiert.',
      errAiPausedEval: 'Die KI-Antwortbewertung ist vorübergehend pausiert.',
      errShortAnswer: 'Bitte geben Sie eine ausführlichere Antwort (mind. 15 Zeichen) ein.',
      errGenDefault: 'Fehler beim Erstellen der Interviewfragen.',
      errEvalDefault: 'Fehler bei der Bewertung. Bitte erneut versuchen.'
    },
    jobMatches: {
      title: 'Passende Stellen für Ihren Lebenslauf',
      subtitlePrefix: 'Live-Abgleich über',
      subtitleMiddle: 'für',
      subtitleDefaultProfile: 'Ihr Profil',
      refreshBtn: 'Aktualisieren',
      compatibleJobs: 'Passende Stellen',
      indexedPool: 'Indexierter Stellenpool',
      analyzedCriteria: 'Analysierte Kriterien',
      fullProfile: 'Vollständiges Profil',
      configTitle: 'Job-Präferenzen Konfigurieren',
      configSummaryCountries: 'Land/Länder',
      configSummaryRoles: 'Rolle(n)',
      configSummaryContracts: 'Vertrag/Verträge',
      configSummaryAuto: '(automatische Aktualisierung)',
      configSummaryEmpty: 'Länder, Positionen und Vertragsarten anpassen',
      clearTitle: 'Alle Präferenzen zurücksetzen',
      clearBtn: 'Zurücksetzen',
      targetRolesLabel: 'Bevorzugte Positionen',
      rolePlaceholder: 'Position hinzufügen (z. B. Product Manager, React Developer)...',
      addBtn: 'Hinzufügen',
      countriesLabel: 'Bevorzugte Länder & Regionen',
      countries: {
        remoto_global: 'Weltweit Remote',
        brasil: 'Brasilien',
        portugal: 'Portugal',
        angola: 'Angola',
        espanha: 'Spanien',
        reino_unido: 'Vereinigtes Königreich',
        alemanha: 'Deutschland',
        franca: 'Frankreich',
        estados_unidos: 'USA',
        canada: 'Kanada',
        europa: 'Europäische Union'
      },
      contractsLabel: 'Bevorzugte Vertragsarten',
      contracts: {
        full_time: 'Vollzeit',
        contract: 'Vertrag / Freelance',
        part_time: 'Teilzeit',
        internship: 'Praktikum / Trainee'
      },
      workplaces: {
        all: 'Alle Arbeitsmodelle',
        remote: 'Remote',
        hybrid: 'Hybrid',
        onsite: 'Vor Ort'
      },
      sources: {
        all: 'Alle Portale',
        linkedin: 'LinkedIn',
        radar: 'Job-Radar',
        remotive: 'Remotive',
        arbeitnow: 'Arbeitnow',
        jobicy: 'Jobicy',
        remoteok: 'RemoteOK'
      },
      externalPortalsTitle: 'Profil direkt auf weiteren großen Portalen suchen:',
      searchPlaceholder: 'Nach Position, Firma oder Skill filtern (z. B. React, Finance, SAP)...',
      filterBtn: 'Filtern',
      clearFilterBtn: 'Leeren',
      retryBtn: 'Erneut Versuchen',
      emptyTitle: 'Keine genauen Treffer für diese Auswahl gefunden',
      emptyDesc: 'Fügen Sie „Weltweit Remote“ hinzu oder erweitern Sie oben die Positionen und Vertragsarten.',
      resetFiltersBtn: 'Filter & Präferenzen Zurücksetzen',
      matchLabel: 'Match',
      inYourCvLabel: 'In Ihrem CV:',
      salaryLabel: 'Gehalt:',
      applyBtn: 'Bewerben',
      viewOnPrefix: 'Ansehen auf',
      adaptAtsBtn: 'CV Anpassen (ATS)',
      errFetch: 'Verbindung zu den Jobportalen fehlgeschlagen.',
      periodUnits: {
        year: '/Jahr',
        month: '/Monat',
        hour: '/Std',
        day: '/Tag',
        week: '/Woche'
      },
      relRecent: 'Aktuell',
      relToday: 'Heute',
      relHoursPrefix: 'Vor ',
      relHoursSuffix: 'h',
      relYesterday: 'Gestern',
      relDaysPrefix: 'Vor ',
      relDaysSuffix: 'T',
      tailorHeader: {
        role: 'Position',
        company: 'Unternehmen',
        portal: 'Portal',
        workplace: 'Arbeitsmodell',
        location: 'Standort',
        skills: 'Kompetenzen & Keywords',
        description: 'Stellenbeschreibung',
        criteria: 'Erkannte Übereinstimmungskriterien'
      }
    }
  },
  it: {
    app: {
      onlineTitle: 'Connessione Ripristinata',
      onlineDesc: 'La connessione internet è di nuovo attiva.',
      offlineTitle: 'Modalità Offline',
      offlineDesc: 'Nessuna connessione. Il tuo lavoro resta salvato nel browser.',
      wordToastDefault: 'File Word (.docx) Scaricato!',
      wordToastLetter: 'Lettera di Presentazione Ufficiale (.docx) Scaricata!',
      wordToastCvPrefix: 'Curriculum Word Ufficiale (',
      wordToastCvSuffix: ') Scaricato!',
      wordToastSub: 'Formattato secondo standard internazionali di tipografia e margini.',
      pricingDefaultPrompt:
        'Attiva un piano Pro o Executive VIP per esportare in Microsoft Word (.docx) e PDF pulito senza filigrana.',
      checkoutConfirmedPrompt:
        'Account confermato! Completa l’attivazione del piano per sbloccare export Word (.docx), Radar ATS e traduzioni.',
      unlockedTitle: 'Accesso Sbloccato!',
      unlockedSubSuffix: ' pronto per la modifica.',
      authModelPromptPrefix: 'Crea un account o accedi per usare ',
      authModelPromptSuffix: ' e iniziare.',
      planModelPromptPrefix:
        'Modifica ed esportazione dei modelli richiedono un abbonamento attivo. Scegli Pro o Executive VIP con Carta o Pix per aprire ',
      planModelPromptSuffix: '.',
      modelLoadedTitle: 'Modello Caricato!',
      modelLoadedSubSuffix: ' aperto per la modifica.',
      authTranslatePrompt: 'Crea un account o accedi per tradurre il curriculum e la lettera di presentazione.',
      planTranslatePrompt:
        'La traduzione completa con IA in Inglese, Spagnolo, Francese o Tedesco è riservata agli abbonati Pro ed Executive VIP.',
      langChangedTitle: 'Lingua Modificata',
      langChangedSubPrefix: 'Curriculum e lettera mostrati in ',
      translatedTitle: 'Contenuto Tradotto!',
      translatedSubPrefix: 'Curriculum e Lettera tradotti in ',
      notifTranslateTitle: 'Traduzione Completata',
      notifTranslateMsgPrefix: 'Il tuo curriculum e lettera sono stati tradotti in ',
      translationErrorTitle: 'Errore di Traduzione',
      translationErrorFallback: 'Impossibile tradurre il contenuto al momento. Riprova.',
      authExportPrompt: 'Registrati o accedi per scaricare il curriculum in formato Word (.docx).',
      planExportPrompt:
        'I download ufficiali in Microsoft Word (.docx) e PDF ad alta risoluzione sono riservati agli abbonati senza filigrana.',
      exportLetterTitle: 'Lettera di Presentazione Scaricata!',
      exportLetterSubPrefix: 'Il file ',
      exportLetterSubSuffix: ' è stato generato senza filigrana.',
      exportCvTitle: 'Curriculum Word Scaricato!',
      exportCvSubPrefix: 'Modello ',
      exportCvSubSuffix: ' generato in OpenXML nativo con compatibilità ATS 100%.',
      notifExportTitle: 'Esportazione Word Completata',
      notifExportLetterMsgPrefix: 'Lettera di presentazione ',
      notifExportCvMsgPrefix: 'Curriculum ',
      exportErrorTitle: 'Errore di Esportazione',
      exportErrorDesc: 'Impossibile compilare il documento Word. Controlla i dati inseriti.',
      maintenanceBadge: 'Manutenzione Programmata',
      maintenanceTitle: 'Piattaforma Temporaneamente in Aggiornamento',
      maintenanceDefaultMsg: 'Stiamo eseguendo miglioramenti programmati ai server. Torneremo a breve.',
      maintenanceAdminPrompt: 'Accesso riservato agli amministratori durante la manutenzione.',
      maintenanceAdminBtn: 'Accesso Amministratore',
      adminMaintTitle: 'Modalità Manutenzione ATTIVA:',
      adminMaintDesc: 'Gli utenti standard sono bloccati. Solo gli amministratori possono accedere.',
      adminMaintBtn: 'Gestisci nell’Admin',
      impersonateTitle: 'Modalità Impersonificazione Attiva:',
      impersonateAs: 'Navigazione come',
      impersonateExitBtn: 'Esci e Torna all’Admin',
      resumeBuilderLabel: 'Creatore di Curriculum',
      modelLabelPrefix: 'Modello ',
      authCreateSavePrompt: 'Crea il tuo account gratuito per salvare ed esportare i curriculum.',
      wordBadgeLocked: 'Word 🔒',
      wordBadgeOpen: 'Word'
    },
    multiLangModal: {
      modalTitle: 'Scarica il CV in un’Altra Lingua',
      modalSubtitle: 'Traduzione esecutiva completa per selezioni internazionali.',
      selectLang: 'Seleziona la lingua di destinazione:',
      langNames: {
        pt: 'Portoghese',
        en: 'Inglese',
        es: 'Spagnolo',
        fr: 'Francese',
        de: 'Tedesco'
      },
      activeTranslationPrefix: 'Traduzione in ',
      activeTranslationSuffix: ' Attiva',
      readyTranslationPrefix: 'Pronto per tradurre in ',
      readyTranslationSuffix: '',
      translating: 'Traduzione con IA...',
      updateTranslation: 'Aggiorna Traduzione',
      translateAction: 'Traduci con IA',
      explanation:
        'Mantiene i titoli esecutivi allineati al mercato target, valorizza i risultati con verbi forti e garantisce precisione ATS al 100%.',
      previewTranslated: 'Anteprima del Documento Tradotto',
      exportOptionsLabel: 'Opzioni di Esportazione:',
      downloading: 'Esportazione...',
      downloadDocx: 'Scarica Word (.docx)',
      openXmlSub: 'Formattazione nativa OpenXML',
      downloadPdf: 'Scarica / Stampa PDF',
      vectorA4Sub: 'Layout A4 vettoriale senza filigrana',
      continueEditingPrompt: 'Vuoi continuare a modificare questo CV nella lingua selezionata?',
      applyToEditor: 'Carica nell’Editor Principale',
      loadedEditorTitle: 'CV Caricato nell’Editor',
      loadedEditorSubPrefix: 'L’editor principale ora mostra la versione tradotta in ',
      unlimitedFooter: '✓ Download e traduzioni illimitati nel tuo piano',
      planRequiredFooter: 'I download ufficiali richiedono il piano Pro o Executive',
      close: 'Chiudi',
      authTranslateReq: 'Accesso richiesto per tradurre il curriculum.',
      planTranslateReq:
        'La traduzione multilingue con IA è esclusiva per gli abbonati Pro ed Executive VIP.',
      authExportReq: 'Accesso richiesto per esportare il curriculum.',
      planExportReq: 'L’esportazione ufficiale in Word richiede un piano attivo.',
      authPdfReq: 'Accesso richiesto per stampare o salvare in PDF.',
      planPdfReq: 'L’esportazione ufficiale in PDF richiede un piano attivo.',
      translationReadyTitle: 'Traduzione Completata!',
      translationReadySubPrefix: 'Curriculum adattato in ',
      notifTranslateTitle: 'Traduzione Multilingue Completata',
      notifTranslateMsgPrefix: 'Il tuo curriculum è stato tradotto in ',
      translationErrorTitle: 'Errore di Traduzione',
      translationErrorFallback: 'Impossibile tradurre il curriculum. Riprova più tardi.',
      wordSuccessTitle: 'Word Scaricato!',
      wordSuccessSubPrefix: 'File in ',
      wordSuccessSubSuffix: ' esportato in formato nativo OpenXML.',
      wordErrorTitle: 'Errore Download Word',
      wordErrorDesc: 'Impossibile compilare il documento.',
      notifExportTitle: 'Esportazione Multilingue Completata',
      notifExportWordPrefix: 'Curriculum in ',
      notifExportPdfPrefix: 'Curriculum in ',
      notifExportPdfSuffix: ' pronto per stampa/PDF.'
    },
    coverPanel: {
      aiPaused: 'Le funzionalità IA sono temporaneamente sospese dall’amministrazione.',
      serverErr: 'Il server ha restituito un errore durante la generazione.',
      generatedAi: 'Lettera di presentazione generata con intelligenza artificiale!',
      invalidFormat: 'Formato restituito non valido.',
      generatedFallback: 'Lettera generata e adattata al tuo profilo!',
      planRequiredWord: 'Il download ufficiale della lettera in Word (.docx) richiede un piano Pro o Executive.',
      planRequiredPdf: 'La stampa e l’esportazione ufficiale in PDF richiedono un piano Pro o Executive.',
      recipientPlaceholder: 'Es: Comitato di Selezione',
      orgPlaceholder: 'Es: Azienda / Organizzazione Target',
      rolePlaceholder: 'Es: Responsabile Operazioni',
      defaultRecipient: 'Comitato di Selezione e Risorse Umane',
      defaultOrg: 'Direzione Risorse Umane / Azienda Target',
      defaultRole: 'Ruolo Richiesto'
    },
    miniPreview: {
      coverSidebarLabel: 'Lettera di Presentazione',
      coverHeaderLabel: 'Lettera Motivazionale Esecutiva',
      a4Official: 'A4 · Formattazione Ufficiale',
      contacts: 'Contatti',
      competencies: 'Competenze',
      profile: 'Profilo Professionale',
      experience: 'Esperienza Professionale',
      education: 'Formazione Accademica',
      europassBadge: 'Europass UE',
      aboutMe: 'Su di Me / Profilo',
      educationTraining: 'Istruzione e Formazione',
      langSkills: 'Competenze Linguistiche',
      techSummary: '> Profilo Tecnico',
      minSummary: '01 / Profilo Esecutivo',
      stdSummary: 'Profilo Professionale',
      techComp: '> Stack & Competenze',
      minComp: '02 / Competenze',
      stdComp: 'Competenze Chiave',
      techExp: '> Esperienza & Impatto',
      minExp: '03 / Esperienza',
      stdExp: 'Esperienza Professionale',
      techEdu: '> Formazione',
      minEdu: '04 / Istruzione',
      stdEdu: 'Formazione Accademica'
    },
    rawGenerator: {
      title: 'Importatore & Generatore CV ATS',
      descStandard:
        'Importa o incolla il tuo curriculum per strutturarlo in un layout professionale senza bisogno di un annuncio.',
      descTailored:
        'Inserisci i tuoi dati e l’offerta di lavoro per generare un CV allineato ai requisiti del selezionatore.',
      clearTitle: 'Svuota i campi e ricomincia da capo',
      clearBtn: 'Svuota Tutto',
      presetsLabel: 'Profili di Esempio:',
      presetExec: 'Executive & Operazioni',
      presetExecTitle: 'Carica profilo Leadership Esecutiva & Operazioni',
      presetTech: 'Tech Lead & Cloud',
      presetTechTitle: 'Carica profilo Tech Lead & Cloud Architect',
      presetFin: 'Finanza & CFO',
      presetFinTitle: 'Carica profilo Direzione Finanziaria & CFO',
      targetLabel: 'Standard Target:',
      stdOnu: 'Corporate Globale',
      stdOnuTitle: 'Standard Corporate & Progetti Globali',
      stdTech: 'Big Tech / Google',
      stdTechTitle: 'Formula XYZ ad Impatto Quantificabile (Google/Meta)',
      stdHarvard: 'Harvard Executive',
      stdHarvardTitle: 'Formato Esecutivo Harvard Business School',
      stdEuropass: '📸 Europass Europeo',
      stdEuropassTitle: 'Standard Ufficiale Unione Europea (Foto + QCER)',
      stdAts: 'ATS Puro (Senza Foto)',
      stdAtsTitle: 'Layout lineare zero-rifiuto per sistemi ATS',
      modeStandardTitle: 'Genera Solo il CV',
      modeStandardDesc:
        'Ideale se hai già importato il CV senza un annuncio specifico. Mantiene e valorizza la tua esperienza.',
      modeTailoredTitle: 'Adatta CV a un’Offerta',
      modeTailoredDesc:
        'Incrocia il tuo profilo con un annuncio o ToR per ottimizzare parole chiave e punteggio ATS.',
      activeBadge: 'Attivo',
      sec1Title: '1. Le Tue Informazioni & Esperienze',
      importFileBtn: 'Importa File',
      importingFileBtn: 'Estrazione...',
      importFileTitle: 'Carica PDF, Word (.docx) o testo con il tuo curriculum',
      linkedinTitle: 'Connetti & Importa da LinkedIn',
      linkedinHowBtn: 'Come funziona?',
      linkedinPlaceholder: 'https://www.linkedin.com/in/tuo-profilo',
      linkedinExtracting: 'Estrazione in corso...',
      linkedinExtractBtn: 'Estrai Profilo (Job)',
      completedSuffix: '% Completato',
      step1Label: 'Verifica dell’URL e intestazioni pubbliche del profilo...',
      step2Label: 'Estrazione di ruoli, aziende e formazione...',
      step4Label: 'Carriera strutturata con successo in formato ATS!',
      logStart: 'Worker asincrono avviato in background.',
      logStep2: 'Esperienze e competenze rilevate.',
      logDone1: 'Connessione al profilo pubblico validata.',
      logDone2: 'Ruoli, date e risultati calibrati secondo Google XYZ.',
      logDone3: 'Modello pronto per integrazione diretta.',
      rolesExtractedLabel: 'Ruoli Estratti',
      atsSkillsLabel: 'Competenze ATS',
      educationsLabel: 'Titoli',
      applyDirectBtn: 'Applica Direttamente al CV',
      pasteRawBtn: 'Incolla nel Testo',
      linkedinHelperTitle: '💡 Come funziona il worker in background:',
      linkedinHelper1: '1. Il worker interroga in modo asincrono l’URL pubblico indicato.',
      linkedinHelper2: '2. Ruoli, date e competenze vengono convertiti automaticamente in CVData.',
      linkedinHelper3: '3. Clicca su "Applica Direttamente al CV" per aprirlo subito nell’editor.',
      rawTextareaLabel: 'Incolla qui appunti, vecchio CV, ruoli, progetti o competenze:',
      rawPlaceholder: `Inserisci qui le tue informazioni professionali. Esempio:

NOME COMPLETO
Titolo Professionale o Specializzazione
Città, Paese | Telefono | Email | LinkedIn

ESPERIENZA PROFESSIONALE:
- Azienda 1: Ruolo, Periodo, Responsabilità principali e risultati raggiunti
- Azienda 2: Ruolo, Periodo, Strumenti usati e traguardi

FORMAZIONE:
- Laurea, Università, Anno

COMPETENZE:
- Software, Lingue, Metodologie e Certificazioni...`,
      charsInsertedSuffix: 'caratteri inseriti',
      switchToTailoredBtn: 'Hai un’offerta specifica? Aggiungi la descrizione dell’annuncio →',
      sec2Title: '2. Offerta di Lavoro Target (Annuncio / ToR)',
      importTdrBtn: 'Importa ToR',
      importingTdrBtn: 'Estrazione...',
      importTdrTitle: 'Carica PDF o Word (.docx) con i Termini di Riferimento o l’annuncio',
      sampleJobsLabel: 'Esempi di Offerta:',
      jobChipLabels: {
        'job-1': 'COO Operazioni',
        'job-2': 'Cloud & Tech Lead',
        'job-3': 'VP Finanza & M&A',
        'job-4': 'Governance Globale'
      },
      jobTextareaLabel: 'Incolla la descrizione completa dell’offerta (requisiti, competenze, attività):',
      jobTextareaPlaceholder: 'Incolla qui l’annuncio di lavoro, i requisiti o le competenze richieste...',
      charsInJobSuffix: 'caratteri nell’annuncio',
      switchToStandardBtn: 'Nessuna offerta (genera solo CV)',
      bannerDescStandard:
        'L’IA estrarrà, organizzerà e rifinirà le tue esperienze, competenze e studi nello standard scelto.',
      bannerDescTailored:
        'L’IA analizzerà la compatibilità semantica e riscriverà il CV evidenziando metriche e parole chiave esatte.',
      generateOnlyBtn: 'Genera Solo CV',
      generatingStandard: 'Strutturazione del CV...',
      generatingTailored: 'Incrocio Dati & Generazione CV Adattato...',
      generateStandardCta: 'Genera CV Strutturato',
      generateTailoredCta: 'Genera CV Adattato all’Offerta',
      msgExecLoaded: 'Profilo Leadership Esecutiva & Strategia caricato!',
      msgTechLoaded: 'Profilo Tech Lead & Cloud Architect caricato!',
      msgFinLoaded: 'Profilo Direzione Finanziaria & CFO caricato!',
      msgDocImportedPrefix: 'Documento "',
      msgDocImportedSuffix: '" importato con successo!',
      msgJobDocImportedPrefix: 'Documento Offerta / ToR "',
      msgJobDocImportedSuffix: '" importato con successo!',
      msgErrExtract: 'Errore durante l’estrazione del testo.',
      msgErrNoInput: 'Importa il tuo CV (PDF/Word) o incolla i tuoi dati prima di generare.',
      msgErrNoJob: 'Per adattare il CV, incolla la descrizione dell’offerta o passa a "Genera Solo il CV".',
      msgAiPausedStandard: 'L’IA esterna è in pausa; il curriculum è stato strutturato localmente!',
      msgAiPausedTailored: 'L’IA esterna è in pausa; strutturazione locale applicata con successo!',
      msgSuccessStandard: 'Curriculum strutturato e ottimizzato nello standard scelto!',
      msgSuccessTailored: 'Curriculum generato con IA e adattato all’offerta!',
      msgFallbackStandard: 'Curriculum strutturato con successo dai tuoi dati importati!',
      msgFallbackTailored: 'Curriculum strutturato e adattato per il ruolo desiderato!',
      msgErrLinkedInUrl: 'Inserisci l’URL pubblico del profilo LinkedIn (es: https://linkedin.com/in/tuo-nome).',
      msgLinkedInSuccess: 'Storico LinkedIn estratto e formattato nel modello CV!',
      msgLinkedInApplied: 'Curriculum aggiornato direttamente dal profilo LinkedIn!',
      msgLinkedInPasted: 'Dati copiati nell’area di testo!'
    },
    atsRadar: {
      bannerTitle: 'Tasso di Compatibilità ATS (Applicant Tracking System)',
      statusNoJob: 'Incolla la descrizione dell’offerta qui sotto (o scegli un esempio) per calcolare il match.',
      statusHigh: 'Eccellente! Ottima densità di parole chiave e forte allineamento al ruolo.',
      statusMid: 'Buon allineamento, ma mancano ancora termini tecnici decisivi.',
      statusLow: 'Attenzione: Rischio di scarto automatico dai filtri di selezione ATS.',
      optimizeAiBtn: 'Ottimizza con IA al 95%+',
      tabAudit: 'Audit & Parole Chiave',
      tabBotView: 'Simulatore Bot ATS',
      tabChecklist: 'Checklist Formattazione',
      jobHeader: 'Termini di Riferimento / Descrizione Offerta',
      loadSampleLabel: 'Carica Esempio:',
      jobChips: {
        'job-1': 'COO Operazioni',
        'job-2': 'Cloud & Tech Lead',
        'job-3': 'VP Finanza & M&A',
        'job-4': 'Governance Globale'
      },
      jobPlaceholder: 'Incolla qui la descrizione completa della posizione (requisiti, competenze)...',
      noJobWarning: 'Nessun annuncio attivo: incolla un testo sopra o scegli un esempio per l’analisi ATS.',
      activeJobInfo: 'L’analizzatore confronta ogni riga del tuo CV con i requisiti essenziali dell’annuncio.',
      missingTitle: 'Parole Chiave Mancanti',
      destLabel: 'Destinazione:',
      destComp: 'Competenze',
      destSummary: 'Profilo',
      destExp: 'Ultimo Ruolo',
      destCompTitle: 'Inserisci nelle Competenze Chiave',
      destSummaryTitle: 'Aggiungi al Profilo Esecutivo',
      destExpTitle: 'Inserisci come risultato nell’ultimo ruolo',
      destCompFull: 'Competenze',
      destSummaryFull: 'Profilo Esecutivo',
      destExpFull: 'Ultimo Ruolo',
      clickPlusPrefix: 'Clicca su',
      clickPlusMiddle: 'per inserire in',
      addAllBtn: '+ Aggiungi Tutte',
      waitingJobMsg: 'In attesa di una descrizione dell’offerta per rilevare i termini mancanti.',
      congratsNoMissing: 'Complimenti! Tutte le parole chiave critiche sono presenti nel tuo CV.',
      insertAriaPrefix: 'Inserisci nel CV sotto',
      matchedTitle: 'Parole Chiave Validate nel CV',
      noMatchedMsg: 'Nessuna corrispondenza diretta validata al momento.',
      metricsTitle: 'Metriche Quantificabili Rilevate',
      metricsHigh: 'Ottima densità numerica',
      metricsLow: 'Poche metriche trovate',
      metricsTip: 'I selezionatori privilegiano risultati quantificati (es: "120+ persone", "riduzione costi del 32%").',
      verbsTitle: 'Verbi d’Azione Esecutiva',
      verbsSub: 'verbi ad alto impatto',
      recsTitle: 'Raccomandazioni Strategiche',
      recMissingPrefix: 'Includi le parole chiave mancanti: "',
      recMissingSuffix: '" nelle competenze o nei punti esperienza.',
      recMetrics: 'Aggiungi più metriche numeriche (percentuali, dimensione team, budget).',
      recPassivePrefix: 'Sostituisci espressioni passive come "',
      recPassiveSuffix: '" con verbi d’azione ("Ha guidato", "Strutturato", "Automatizzato").',
      recSummary: 'Il tuo Profilo Professionale è troppo breve. Estendilo a 4-5 righe solide.',
      recExcellent: 'Allineamento eccellente! Il CV rispetta struttura e parole chiave richieste.',
      botTitle: 'Output del Parser ATS (Workday / Taleo OCR Engine)',
      copiedBtn: 'Copiato!',
      copyExtractedBtn: 'Copia Testo Estratto',
      ocrReadability: 'Leggibilità Lineare',
      ocrRolesBullets: 'Ruoli / Punti',
      ocrSkills: 'Competenze',
      ocrStructurePhoto: 'Struttura / Foto',
      twoCols: '2 Colonne',
      oneCol: 'Colonna Singola',
      withPhoto: ' · Foto',
      botDesc: 'Ecco il flusso testuale esatto estratto dai sistemi automatici. Ciò che non compare qui è invisibile al filtro.',
      checklistTitle: 'Checklist di Conformità Algoritmica Internazionale',
      c1Title: 'Struttura a Colonna Singola (Zero Tabelle Complesse)',
      c1Ok: 'Conforme',
      c1Warn: 'Avviso: Layout Diviso',
      c1Desc: 'Layout a colonna singola come Executive Harvard o ATS Compact garantiscono lettura al 100%.',
      c2Title: 'Intestazione Contatti Standardizzata',
      c2Ok: 'Approvato',
      c2Fail: 'Dati Mancanti',
      c2Desc: 'Email professionale, telefono con prefisso e località devono apparire in cima al documento.',
      c3Title: 'Densità del Profilo Esecutivo (100+ caratteri)',
      c3Ok: 'Adeguato',
      c3Warn: 'Breve',
      c3Desc: 'Il profilo deve esprimere chiaramente valore, seniority e specializzazione.',
      c4Title: 'Metriche di Impatto Comprovate (Formula Google XYZ)',
      c4Unit: 'metriche',
      c4Desc: 'L’algoritmo premia i candidati che riportano percentuali (%) e volumi tangibili.'
    },
    aiTailor: {
      tabFull: 'Ottimizzatore Completo',
      tabXyz: 'Generatore Google XYZ',
      xyzBadge: 'Formula Esecutiva Google',
      xyzTitle: 'Costruttore di Risultati Quantificati',
      xyzSubtitlePrefix: 'I migliori recruiter usano il metodo ',
      xyzSubtitleStrong: '"Ottenuto [X], misurato da [Y], facendo [Z]"',
      xyzSubtitleSuffix: ' per verificare l’impatto reale.',
      presetsLabel: 'Esempi per Settore:',
      presetOps: 'Operazioni',
      presetOpsSub: 'Lead-time -28%',
      presetTech: 'Tecnologia',
      presetTechSub: 'SLA 99.99% Cloud',
      presetFin: 'Finanza',
      presetFinSub: 'Chiusura -75%',
      presetLead: 'Leadership',
      presetLeadSub: 'Retention +40%',
      xLabel: '1. Cosa hai ottenuto? (Azione / Risultato - Verbo Forte)',
      xPlaceholder: 'Es: Ridotti i costi di infrastruttura e OPEX operativo',
      yLabel: '2. Misurato di quanto? (Metrica Numerica, %, €, $)',
      yPlaceholder: 'Es: del 32% (risparmio annuo di €240K)',
      zLabel: '3. Facendo cosa? (Metodologia, Strumento, Strategia)',
      zPlaceholder: 'Es: rinegoziando contratti fornitori e consolidando i carichi cloud',
      resultLabel: 'Risultato Formattato per il CV (Bullet Esecutivo)',
      copiedBtn: 'Copiato negli Appunti!',
      copyBtn: 'Copia Risultato',
      insertedBtn: 'Inserito nel Ruolo!',
      insertBtn: 'Inserisci nell’Ultimo Ruolo',
      noExpWarnTitle: 'Nessuna Esperienza Inserita',
      noExpWarnMsg: 'Aggiungi prima un ruolo nella scheda Editor.',
      insertedToastTitle: 'Risultato Inserito',
      insertedToastMsgPrefix: 'Aggiunto al ruolo',
      latestRoleFallback: 'più recente',
      fullTitle: 'Motore di Ottimizzazione Strategica (IA Esecutiva)',
      fullDesc:
        'Adatta il tuo profilo ai requisiti espliciti dell’offerta riscrivendo il riepilogo, affinando le competenze e potenziando i verbi.',
      targetStdLabel: 'Standard Istituzionale Target',
      standards: {
        exec: 'Leadership C-Level & Direzione Operazioni (Formula Google XYZ)',
        tech: 'Big Tech & Ingegneria Software (Metriche Cloud & IA)',
        harvard: 'Harvard Business School & Finanza Corporate (EBITDA, M&A)',
        corp: 'Standard Corporate & Progetti Globali (Governance e Risultati)'
      },
      activeJobLabel: 'Contesto Offerta Attiva',
      charsSuffix: 'caratteri',
      noJobDescFallback:
        'Nessuna offerta definita — l’IA userà le migliori pratiche per lo standard scelto (puoi incollare un annuncio in Radar ATS).',
      runBtn: 'Avvia Ottimizzazione Strategica',
      runningBtn: 'Analisi Offerta & Ottimizzazione CV...',
      aiPausedErr: 'Le risorse IA sono temporaneamente sospese dall’amministrazione.',
      quotaErr: 'I tuoi crediti IA gratuiti sono esauriti. Effettua l’upgrade per continuare.',
      localFallbackRec: 'Curriculum armonizzato localmente con focus su verbi d’impatto e leggibilità ATS.',
      proposalTitle: 'Proposta di Ottimizzazione Generata',
      proposalDesc: 'Rivedi le modifiche suggerite prima di applicarle al documento.',
      appliedBtn: 'Applicato con Successo!',
      applyBtn: 'Applica Modifiche al CV',
      newSummaryLabel: 'Nuovo Profilo Esecutivo Ottimizzato',
      alignedCompLabel: 'Competenze Allineate al Ruolo',
      optExpLabel: 'Esperienze Ottimizzate — Formula Google XYZ',
      matchEstimateLabel: 'Tasso di Match Stimato:'
    },
    interviewSim: {
      badge: 'Preparazione Colloquio Esecutivo',
      title: 'Simulatore di Colloquio & Valutazione IA',
      subtitle:
        'Esercitati sulle 5 domande comportamentali e tecniche più probabili. Ricevi punteggio immediato, analisi STAR e risposte modello.',
      generatingBtn: 'Generazione 5 Domande...',
      generateBtn: 'Genera Nuove Domande',
      simProgress: 'Progresso Simulazione:',
      answeredSuffix: 'Risposte',
      readinessAvg: 'Media Idoneità:',
      pending: 'In sospeso',
      candidateLabel: 'Candidato:',
      profileActive: 'Profilo Attivo',
      closeErr: 'Chiudi',
      qTabPrefix: 'Domanda',
      draftTitle: 'Bozza salvata',
      typeBehavioral: 'Comportamentale (STAR)',
      typeTechnical: 'Tecnica & Metodologia',
      typeSituational: 'Scenario Situazionale',
      questionWord: 'Domanda',
      ofWord: 'di',
      prevTitle: 'Domanda precedente',
      nextTitle: 'Prossima domanda',
      recruiterSeeks: 'Cosa Cerca il Selezionatore:',
      recommendedFormula: 'Formula Consigliata:',
      keyCriteria: 'Criteri Chiave:',
      yourAnswerLabel: 'La Tua Risposta:',
      recordingBtn: 'Registrazione...',
      voiceDictateBtn: 'Dettatura Vocale',
      micTitle: 'Parla usando il microfono',
      answerPlaceholder:
        'Scrivi la tua risposta come davanti alla commissione. Descrivi il contesto reale, la tua azione personale e i risultati quantificati...',
      charsWord: 'caratteri',
      wordsWord: 'parole',
      starHint: 'L’algoritmo valuta chiarezza, metriche quantificate e struttura STAR.',
      evaluatingBtn: 'Valutazione in corso...',
      evaluateBtn: 'Valuta Risposta (Metodo STAR)',
      verdictTitle: 'Esito della Valutazione:',
      verdictHigh: 'Ottima struttura esecutiva con forte impatto sul selezionatore.',
      verdictMid: 'Risposta positiva; più numeri e metriche ne aumenterebbero l’autorevolezza.',
      verdictLow: 'Risposta generica o breve. Applica i consigli riportati sotto.',
      strengthsTitle: 'Punti di Forza:',
      improvementsTitle: 'Opportunità di Miglioramento:',
      modelAnswerTitle: 'Suggerimento di Risposta Modello (Formato STAR):',
      emptyTitle: 'Nessuna domanda generata',
      emptyDesc: 'Clicca sopra per generare 5 domande su misura per la tua candidatura.',
      emptyBtn: 'Genera Domande di Colloquio',
      errAiPausedGen: 'Il generatore di colloqui IA è temporaneamente in pausa.',
      errAiPausedEval: 'La valutazione IA è temporaneamente in pausa.',
      errShortAnswer: 'Scrivi una risposta più dettagliata (minimo 15 caratteri) prima di valutare.',
      errGenDefault: 'Errore nella generazione delle domande.',
      errEvalDefault: 'Errore nella valutazione. Riprova.'
    },
    jobMatches: {
      title: 'Offerte Compatibili con il tuo CV',
      subtitlePrefix: 'Incrocio live su',
      subtitleMiddle: 'per',
      subtitleDefaultProfile: 'il tuo profilo',
      refreshBtn: 'Aggiorna',
      compatibleJobs: 'Offerte compatibili',
      indexedPool: 'Database attivo indicizzato',
      analyzedCriteria: 'Criteri analizzati',
      fullProfile: 'Profilo completo',
      configTitle: 'Configura Preferenze di Ricerca',
      configSummaryCountries: 'paese/i',
      configSummaryRoles: 'ruolo/i',
      configSummaryContracts: 'contratto/i',
      configSummaryAuto: '(aggiornamento automatico)',
      configSummaryEmpty: 'Personalizza paesi, ruoli e tipi di contratto',
      clearTitle: 'Cancella tutte le preferenze',
      clearBtn: 'Pulisci',
      targetRolesLabel: 'Ruoli Preferiti',
      rolePlaceholder: 'Aggiungi ruolo (es: Product Manager, React Developer)...',
      addBtn: 'Aggiungi',
      countriesLabel: 'Paesi e Regioni Preferite',
      countries: {
        remoto_global: 'Remoto Globale',
        brasil: 'Brasile',
        portugal: 'Portogallo',
        angola: 'Angola',
        espanha: 'Spagna',
        reino_unido: 'Regno Unito',
        alemanha: 'Germania',
        franca: 'Francia',
        estados_unidos: 'Stati Uniti',
        canada: 'Canada',
        europa: 'Unione Europea'
      },
      contractsLabel: 'Tipi di Contratto Preferiti',
      contracts: {
        full_time: 'Tempo Pieno',
        contract: 'Contratto / P.IVA / Freelance',
        part_time: 'Part-Time',
        internship: 'Stage / Tirocinio'
      },
      workplaces: {
        all: 'Tutte le modalità',
        remote: 'Remoto',
        hybrid: 'Ibrido',
        onsite: 'In Sede'
      },
      sources: {
        all: 'Tutti i Portali',
        linkedin: 'LinkedIn',
        radar: 'Radar Offerte',
        remotive: 'Remotive',
        arbeitnow: 'Arbeitnow',
        jobicy: 'Jobicy',
        remoteok: 'RemoteOK'
      },
      externalPortalsTitle: 'Cerca il tuo profilo direttamente su altri grandi portali:',
      searchPlaceholder: 'Filtra per ruolo, azienda o competenza (es: React, Finance, SAP)...',
      filterBtn: 'Filtra',
      clearFilterBtn: 'Pulisci',
      retryBtn: 'Riprova',
      emptyTitle: 'Nessuna offerta esatta trovata per le preferenze selezionate',
      emptyDesc: 'Prova ad aggiungere "Remoto Globale" nei paesi o ad ampliare ruoli e contratti sopra.',
      resetFiltersBtn: 'Ripristina Filtri e Preferenze',
      matchLabel: 'match',
      inYourCvLabel: 'Nel tuo CV:',
      salaryLabel: 'Stipendio:',
      applyBtn: 'Candidati',
      viewOnPrefix: 'Vedi su',
      adaptAtsBtn: 'Adatta CV (ATS)',
      errFetch: 'Errore di connessione ai portali di lavoro.',
      periodUnits: {
        year: '/anno',
        month: '/mese',
        hour: '/ora',
        day: '/giorno',
        week: '/sett'
      },
      relRecent: 'Recente',
      relToday: 'Oggi',
      relHoursPrefix: '',
      relHoursSuffix: 'h fa',
      relYesterday: 'Ieri',
      relDaysPrefix: '',
      relDaysSuffix: 'g fa',
      tailorHeader: {
        role: 'Ruolo',
        company: 'Azienda',
        portal: 'Portale',
        workplace: 'Modalità',
        location: 'Località',
        skills: 'Competenze e Parole Chiave',
        description: 'Descrizione Offerta',
        criteria: 'Criteri di compatibilità rilevati'
      }
    }
  }
};
