import { SiteLanguageCode } from './siteTranslations';
import { CVSectionKey, TemplateStyle } from '../types/cv';

export interface LocalizedTemplateMeta {
  name: string;
  shortName: string;
  badge: string;
  photoRuleLabel: string;
  tagline: string;
  whenToUse: string;
  whereToUse: string;
  whyPhotoOrNot: string;
  proTip: string;
  atsRatingText: string;
  regions: string[];
  bestForIndustries: string[];
}

export interface EditorUiDictionary {
  advisor: {
    authPrompt: string;
    pricingPrompt: string;
    modalTitle: string;
    badge: string;
    subtitle: string;
    goldRuleTitle: string;
    goldRuleText: string;
    hideRule: string;
    showRule: string;
    lawTitle: string;
    noPhotoTitle: string;
    noPhotoDesc: string;
    withPhotoTitle: string;
    withPhotoDesc: string;
    filterAll: string;
    filterWithPhoto: string;
    filterNoPhoto: string;
    filterExec: string;
    activeTemplateLabel: string;
    whenToUseLabel: string;
    whereToUseLabel: string;
    photoRuleLabel: string;
    currentModelBtn: string;
    applyModelBtn: string;
    activateModelBtn: string;
    deepWhenTitle: string;
    deepWhereTitle: string;
    deepPhotoTitle: string;
    deepIndustriesTitle: string;
    recruiterTipTitle: string;
    exportCompatNote: string;
    footerValidationNote: string;
    closeBtn: string;
  };
  dropdown: {
    triggerTitle: string;
    withPhotoTag: string;
    noPhotoTag: string;
    whereToUseBtn: string;
    whereToUseTitle: string;
    menuTitle: string;
    menuSubtitle: string;
    fullGuideBtn: string;
    photoGroupTitle: string;
    noPhotoGroupTitle: string;
    footerPrompt: string;
    footerLink: string;
  };
  photoModal: {
    fileTooLargeTitle: string;
    fileTooLargeMsg: string;
    updatedTitle: string;
    updatedMsg: string;
    errorTitle: string;
    errorMsg: string;
    headerTitle: string;
    headerSubtitle: string;
    activePhotoTitle: string;
    loadedLabel: string;
    emptyLabel: string;
    removeBtn: string;
    visibleLabel: string;
    hiddenLabel: string;
    uploadHint: string;
    uploadBtn: string;
    formatsHint: string;
    avatarsTitle: string;
    complianceTipLabel: string;
    complianceTipText: string;
    doneBtn: string;
    avatarNames: Record<string, string>;
  };
  watermark: {
    topLine1: string;
    topLine2: string;
    midLine1: string;
    midLine2: string;
    botLine1: string;
    botLine2: string;
  };
  expertTip: {
    ariaPrefix: string;
    badge: string;
    closeAria: string;
    exampleLabel: string;
  };
  editor: {
    steps: {
      profile: { mobile: string; short: string };
      career: { mobile: string; short: string };
      credentials: { mobile: string; short: string };
      structure: { mobile: string; short: string };
    };
    undoTitle: string;
    undoAria: string;
    redoTitle: string;
    redoAria: string;
    saveTitle: string;
    saving: string;
    save: string;
    words: string;
    pagesA4: string;
    reading: string;
    checklistBtn: string;
    completeAction: string;
    checklistItems: Array<{ label: string; recommendation: string }>;
    toasts: {
      snippetAppliedTitle: string;
      snippetAppliedMsg: string;
      bulletsAddedTitle: string;
      bulletsAddedMsg: string;
      authPromptSave: string;
      pricingPromptSave: string;
      planRequiredTitle: string;
      planRequiredMsg: string;
      defaultCvTitle: string;
      savedTitle: string;
      savedMsg: string;
      saveErrorTitle: string;
      savePermError: string;
      saveGenericError: string;
      orderResetTitle: string;
      orderResetMsg: string;
      copyRoleSuffix: string;
      duplicatedTitle: string;
      duplicatedMsg: string;
      defaultTraining: string;
      clusterPresentTitle: string;
      clusterPresentMsg: string;
      clusterAddedTitle: string;
      clusterAddedMsg: string;
      defaultNewLang: string;
      defaultNewLangLevel: string;
    };
    stage1: {
      idTitle: string;
      idTipTitle: string;
      idTipText: string;
      hidePhoto: string;
      showPhoto: string;
      photoLabel: string;
      addPhoto: string;
      fullName: string;
      fullNamePh: string;
      jobTitle: string;
      jobTitleTipTitle: string;
      jobTitleTipText: string;
      jobTitlePh: string;
      email: string;
      invalidEmail: string;
      emailPh: string;
      phone: string;
      phonePh: string;
      location: string;
      locationPh: string;
      linkedin: string;
      linkedinPh: string;
      website: string;
      websitePh: string;
      addWebsite: string;
      summaryTitle: string;
      summaryTipTitle: string;
      summaryTipText: string;
      summaryTipExample: string;
      examplesBtn: string;
      aiOptimizeBtn: string;
      snippetLibraryTitle: string;
      close: string;
      useTitleSummary: string;
      summaryPh: string;
      wordSingular: string;
      wordPlural: string;
      chars: string;
      lenIdeal: string;
      lenLong: string;
      lenShort: string;
    };
    stage2: {
      title: string;
      tipTitle: string;
      tipText: string;
      achievementsCount: string;
      withMetricsCount: string;
      achievementTemplatesDesktop: string;
      achievementTemplatesMobile: string;
      expandAll: string;
      collapseAll: string;
      addRole: string;
      insertByProfessionTitle: string;
      metricsUnit: string;
      emptyTitle: string;
      emptySubtitle: string;
      addFirstRole: string;
      newRoleFallback: string;
      companyFallback: string;
      pointsUnit: string;
      metricUnit: string;
      moveUpTitle: string;
      moveDownTitle: string;
      duplicateTitle: string;
      expandTitle: string;
      collapseTitle: string;
      deleteRoleTitle: string;
      roleLabel: string;
      rolePh: string;
      companyLabel: string;
      companyPh: string;
      periodLabel: string;
      periodPh: string;
      locationLabel: string;
      locationPh: string;
      donorLabel: string;
      donorPh: string;
      addDonorBtn: string;
      highlightsLabel: string;
      xyzTipTitle: string;
      xyzTipText: string;
      actionVerbsBtn: string;
      addPointBtn: string;
      verbsDrawerTitle: string;
      movePointUpTitle: string;
      movePointDownTitle: string;
      deletePointTitle: string;
      highlightPh: string;
      hasMetricHint: string;
      needsMetricHint: string;
      charsShort: string;
    };
    stage3: {
      tabAcademic: string;
      tabSkills: string;
      eduTitle: string;
      addBtn: string;
      noEdu: string;
      degreeLabel: string;
      degreePh: string;
      institutionLabel: string;
      institutionPh: string;
      periodLabel: string;
      periodPh: string;
      moveUp: string;
      moveDown: string;
      deleteEdu: string;
      honorsPh: string;
      certsTitle: string;
      certInputPh: string;
      noCerts: string;
      certItemPh: string;
      deleteCert: string;
      compTitle: string;
      compTipTitle: string;
      compTipText: string;
      clustersBtn: string;
      clustersDrawerTitle: string;
      noComp: string;
      compCatPh: string;
      compDescPh: string;
      deleteComp: string;
      langTitle: string;
      addLangBtn: string;
      noLang: string;
      langPh: string;
      deleteLang: string;
      cefrLevels: string[];
    };
    stage4: {
      styleTitle: string;
      accentColorLabel: string;
      selectColorAria: string;
      typographyLabel: string;
      densityLabel: string;
      densityCompact: string;
      densityNormal: string;
      densityRelaxed: string;
      sectionsTitle: string;
      sectionsCount: string;
      resetOrderTitle: string;
      resetOrderBtn: string;
      hideSectionTitle: string;
      showSectionTitle: string;
      refsTitle: string;
      noRefs: string;
      refNamePh: string;
      refInstPh: string;
      refContactPh: string;
      deleteRef: string;
      coverCtaTitle: string;
      coverCtaSubtitle: string;
      coverCtaBtn: string;
      accentColors: Record<string, string>;
      fonts: Record<string, { label: string; hint: string }>;
      sectionNames: Record<CVSectionKey, string>;
    };
    footer: {
      prev: string;
      stepOf: string;
      nextPrefix: string;
      finishSave: string;
    };
  };
}

export const TEMPLATE_CATALOG_I18N: Partial<
  Record<SiteLanguageCode, Record<TemplateStyle, LocalizedTemplateMeta>>
> = {
  en: {
    european_europass: {
      name: 'European Europass Model (With Photo)',
      shortName: 'European Europass',
      badge: '📸 With Photo',
      photoRuleLabel: 'Photo Highly Recommended',
      tagline: 'Official EU standard with structured skills grid and CEFR language levels.',
      whenToUse: 'Private companies across Europe, Erasmus+, EU fellowships, international internships.',
      whereToUse: 'European Union (Germany, Portugal, Spain, France, Switzerland, Italy, Austria, Netherlands) and EU multinationals.',
      whyPhotoOrNot: 'In Southern Europe and the DACH region, a recent corporate headshot conveys professionalism and immediate identification.',
      proTip: 'Use a studio-lit portrait with a neutral background and business attire. Avoid selfies or casual photos.',
      atsRatingText: '88% ATS Score - Official EU block structure',
      regions: ['European Union', 'Portugal & Spain', 'Germany (DACH)', 'France', 'Global EU'],
      bestForIndustries: ['EU Multinationals', 'Healthcare & Pharma', 'Engineering & Civil', 'Higher Education', 'Public Administration']
    },
    creative_split: {
      name: 'Creative Split Model (Photo & Sidebar)',
      shortName: 'Creative Split',
      badge: '📸 Photo & Sidebar',
      photoRuleLabel: 'Featured Profile Photo',
      tagline: 'Modern two-column asymmetric layout highlighting soft skills, portfolio, and personal brand.',
      whenToUse: 'Design, Digital Marketing, UI/UX, Advertising, Architecture, Product, and Agile Startups.',
      whereToUse: 'Creative agencies, scale-ups, tech startups, and direct email applications to hiring leads.',
      whyPhotoOrNot: 'In creative disciplines, personal branding signals visual polish within the first 6 seconds.',
      proTip: 'Ideal for direct email outreach to Art Directors, CMOs, or startup founders.',
      atsRatingText: '82% ATS Score - Built for human portfolio review',
      regions: ['Europe & LATAM', 'Startup Hubs', 'Creative Agencies', 'Remote Global'],
      bestForIndustries: ['UI/UX & Product Design', 'Growth & Marketing', 'Media & Comms', 'Architecture & Fashion', 'Agile Startups']
    },
    hybrid_minimalist: {
      name: 'Nordic Minimalist Model (Photo Optional)',
      shortName: 'Nordic Minimalist',
      badge: '✨ Clean Elegance',
      photoRuleLabel: 'Optional / Toggleable Photo',
      tagline: 'Scandinavian aesthetic focused on typography, whitespace balance, and effortless scannability.',
      whenToUse: 'HR, Project Management, Consulting, B2B Sales, PR, and modern specialists.',
      whereToUse: 'Nordics, Switzerland, Netherlands, UK, LATAM, and design-forward organizations.',
      whyPhotoOrNot: 'Balanced proportions work seamlessly with or without a headshot — toggle with one click.',
      proTip: 'Applying to US or UK roles? Simply toggle photo off for full Anglo-Saxon compliance.',
      atsRatingText: '92% ATS Score - High OCR readability',
      regions: ['Nordic Countries', 'Switzerland & UK', 'Central Europe', 'LATAM'],
      bestForIndustries: ['People & HR', 'Management Consulting', 'Architecture', 'SaaS & Tech', 'Boutique Finance']
    },
    ats_compact: {
      name: 'North American / Strict ATS (No Photo)',
      shortName: 'Strict ATS US/UK',
      badge: '🛡️ 100% ATS Robot',
      photoRuleLabel: 'Strictly No Photo (Zero Images)',
      tagline: '100% optimized for enterprise screening parsers (Workday, Taleo, Greenhouse, Lever).',
      whenToUse: 'Corporate portals where automated parsers and keyword screeners evaluate every submission.',
      whereToUse: 'United States, Canada, United Kingdom, Ireland, Australia, New Zealand, and global multinationals.',
      whyPhotoOrNot: 'EEOC and UK equality rules discourage photos to prevent unconscious bias; ATS parsers reject image noise.',
      proTip: 'Run your resume through our ATS Radar to surpass 85% match before submitting.',
      atsRatingText: '100% ATS Match Score - Unbeatable OCR layout',
      regions: ['United States', 'United Kingdom', 'Canada', 'Australia & NZ', 'Global Fortune 500'],
      bestForIndustries: ['Big Tech & Remote', 'Global Banking', 'Pharma & Biotech', 'Energy & Oil', 'Workday / LinkedIn Portals']
    },
    executive_harvard: {
      name: 'Harvard Business School Executive (No Photo)',
      shortName: 'Harvard Executive',
      badge: '👑 Ivy League / C-Level',
      photoRuleLabel: 'No Photo (Ivy League / Wall Street)',
      tagline: 'The definitive format for Boards, C-Suite, Investment Banking, and MBB Consulting.',
      whenToUse: 'VP, C-Level (CEO, CFO, CTO, COO), Board seats, McKinsey/BCG/Bain, and Private Equity.',
      whereToUse: 'Global executive market, Wall Street, City of London, sovereign funds, and multinationals.',
      whyPhotoOrNot: 'At the C-level, photos are avoided so every line highlights EBITDA impact, governance, and P&L ownership.',
      proTip: 'Quantify each achievement: "Led $12M restructuring driving +34% EBITDA and -18% OPEX in 12 months."',
      atsRatingText: '96% ATS Score - Executive board standard',
      regions: ['Global Executive', 'US & UK', 'Financial Centers', 'Multinationals'],
      bestForIndustries: ['Investment Banking & PE', 'Strategy Consulting (MBB)', 'C-Suite & Board', 'M&A Advisory', 'Corporate Governance']
    },
    tech_modern: {
      name: 'Tech Lead & Software Engineering (No Photo)',
      shortName: 'Tech Lead & Dev',
      badge: '💻 Tech & Engineering',
      photoRuleLabel: 'No Photo / Stack & Impact Focus',
      tagline: 'Engineered for Software Engineers, Cloud Architects, Tech Leads, and AI Specialists.',
      whenToUse: 'SWE, Staff Engineer, Tech Lead, Data Engineering, DevOps, Cloud Architect, and ML/AI roles.',
      whereToUse: 'Big Tech, SaaS scale-ups, Berlin/London/SF hubs, and global USD/EUR remote contracts.',
      whyPhotoOrNot: 'Engineering managers evaluate systems architecture, GitHub output, and SLA metrics — not headshots.',
      proTip: 'Add your GitHub or live portfolio link in the header so technical leads can inspect your work.',
      atsRatingText: '95% ATS Score - Tuned for technical parsers',
      regions: ['Silicon Valley (US)', 'London & Berlin', 'Remote Global', 'SaaS Hubs'],
      bestForIndustries: ['Software & Cloud', 'AI & LLMs', 'Data Engineering', 'Cybersecurity & DevOps', 'Fintech & Web3']
    },
    un_classic: {
      name: 'Global Corporate & Programs (Structured)',
      shortName: 'Corporate & Projects',
      badge: '🏛️ Corporate & Programs',
      photoRuleLabel: 'Formal No-Photo / Analytical Rigor',
      tagline: 'Structured executive format for governance, large-scale programs, and multilateral consulting.',
      whenToUse: 'Program Directors, Operations Leads, Infrastructure Contracts, and Multilateral Advisory.',
      whereToUse: 'International organizations, infrastructure groups, development banks, and bilateral programs.',
      whyPhotoOrNot: 'Sober text-first formatting reinforces analytical clarity and impartial governance.',
      proTip: 'Quantify budgets managed, compliance milestones, and multi-country operational scope.',
      atsRatingText: '95% ATS Score - Enterprise compliance ready',
      regions: ['Europe & Americas', 'International Hubs', 'Emerging Markets', 'Global'],
      bestForIndustries: ['Corporate Governance', 'Infrastructure & Contracts', 'Operations & Audit', 'Development Banking', 'Compliance']
    },
    academic_lattes: {
      name: 'Academic / Scientific Research & PhD (No Photo)',
      shortName: 'Academic & PhD',
      badge: '🎓 Academic & Science',
      photoRuleLabel: 'No Photo / Scientific Rigor',
      tagline: 'Formal curriculum vitae highlighting publications (DOI, Scopus), grants, and university teaching.',
      whenToUse: 'Master’s/PhD fellowships, faculty positions, research labs, and Horizon Europe / NIH / CNPq grants.',
      whereToUse: 'Universities, R&D centers (CERN, Max Planck, CNRS), polytechnics, and medical research institutes.',
      whyPhotoOrNot: 'Academic selection committees evaluate strictly by publication impact, peer review, and teaching record.',
      proTip: 'Include DOI links and mention Scopus or Web of Science indexing on key papers.',
      atsRatingText: '90% ATS Score - Structured bibliographic format',
      regions: ['Global Universities', 'Europe (CiênciaVitae)', 'Americas', 'R&D Centers'],
      bestForIndustries: ['Higher Education', 'Scientific R&D', 'PhD & Postdoc Grants', 'Biomedical Research', 'Social & Exact Sciences']
    },
    european_modern: {
      name: 'Multinational Corporate Clean (Modern)',
      shortName: 'Corporate Modern',
      badge: '💼 Corporate',
      photoRuleLabel: 'No Photo / Dynamic Corporate Design',
      tagline: 'Balanced versatility with clean typography for mainstream corporate roles.',
      whenToUse: 'Telecoms, Logistics, Enterprise Sales, Operations Management, and Commercial Banking.',
      whereToUse: 'Multinationals and large enterprises across Europe, Africa, and Latin America.',
      whyPhotoOrNot: 'Clean corporate version without photo for modern firms that prefer zero bias risk.',
      proTip: 'Ideal if you want a contemporary visual edge without ATS photo risks.',
      atsRatingText: '93% ATS Score - Crisp hybrid readability',
      regions: ['Europe', 'Lusophone Markets', 'Latin America', 'Global'],
      bestForIndustries: ['Telecoms & IT', 'Supply Chain & Logistics', 'International Trade', 'Commercial Banking', 'Operations Consulting']
    },
    finance_wallstreet: {
      name: 'Wall Street & M&A Finance (No Photo)',
      shortName: 'Wall Street M&A',
      badge: '🏦 Wall Street & M&A',
      photoRuleLabel: 'Strictly No Photo (Institutional Standard)',
      tagline: 'Institutional double-rule serif format built for Investment Banking, M&A, and Private Equity.',
      whenToUse: 'Investment Banking, Venture Capital, Private Equity, Asset Management, FP&A, and Equity Research.',
      whereToUse: 'Wall Street (NYC), City of London, Frankfurt, Zurich, Singapore, and global financial centers.',
      whyPhotoOrNot: 'Anglo-Saxon institutional finance demands maximum deal-sheet density and zero photos for bias compliance.',
      proTip: 'Lead with deal volume, IRR, EV/EBITDA multiples, and audited transaction outcomes.',
      atsRatingText: '99% ATS Score - Institutional Wall Street standard',
      regions: ['Wall Street (US)', 'City of London', 'Zurich & Frankfurt', 'Singapore & HK'],
      bestForIndustries: ['Investment Banking & M&A', 'Private Equity & VC', 'Asset Management', 'Corporate Finance', 'Hedge Funds']
    },
    executive_board: {
      name: 'C-Suite & Boardroom Editorial (No Photo)',
      shortName: 'Boardroom C-Suite',
      badge: '👔 Board & C-Suite',
      photoRuleLabel: 'No Photo (Corporate Governance)',
      tagline: 'Centered editorial serif header with executive top rule for Board members, CEOs, and VPs.',
      whenToUse: 'Executive search (Korn Ferry, Spencer Stuart), Board seats, and VP/C-Level mandates.',
      whereToUse: 'Public companies, PE-backed enterprises, family-owned conglomerates, and global headquarters.',
      whyPhotoOrNot: 'C-level recruiters evaluate P&L scope, committee governance, and turnaround track records over photos.',
      proTip: 'Quantify mandate scope immediately: revenue managed, country footprint, and headcount led.',
      atsRatingText: '97% ATS Score - Clean executive governance format',
      regions: ['Global C-Suite', 'US & UK', 'European Union', 'Latin America'],
      bestForIndustries: ['Board Advisory', 'CEO / Managing Director', 'Corporate Turnaround', 'Global Operations', 'Institutional Affairs']
    },
    product_strategy: {
      name: 'Product & Growth Lead (Photo Optional)',
      shortName: 'Product & Growth',
      badge: '🚀 Product & Growth',
      photoRuleLabel: 'Photo Optional / Versatile',
      tagline: 'Modern two-column competency grid spotlighting SaaS metrics, ARR growth, and experimentation.',
      whenToUse: 'Product Manager, Head of Product, Growth Lead, PMM, Strategy & Ops, and RevOps.',
      whereToUse: 'SaaS scale-ups, digital marketplaces, Big Tech, and remote global product teams.',
      whyPhotoOrNot: 'Hybrid layout lets you keep a crisp headshot for Europe or toggle it off for US/UK applications.',
      proTip: 'Highlight funnel conversion or revenue lift: e.g., "+22% D7 activation and +$3.4M ARR."',
      atsRatingText: '94% ATS Score - Built for SaaS & product impact',
      regions: ['Remote Global', 'US & Canada', 'Tech Europe', 'LATAM'],
      bestForIndustries: ['Product Management', 'Growth & PLG', 'Product Marketing', 'Strategy & Ops', 'Fintech & SaaS']
    },
    modern_editorial: {
      name: 'Modern Two-Tone Editorial (Photo Optional)',
      shortName: 'Two-Tone Editorial',
      badge: '📰 Two-Tone Editorial',
      photoRuleLabel: 'Integrated Optional Photo',
      tagline: 'High-contrast two-tone editorial header banner paired with a clean single-column ATS body.',
      whenToUse: 'Commercial Leadership, Corporate Comms, Consulting, Brand Management, and Senior Operations.',
      whereToUse: 'Continental Europe, UK (photo off), LATAM, and modern brand-conscious employers.',
      whyPhotoOrNot: 'Combines executive visual presence at the top with a 1-click photo toggle for regional compliance.',
      proTip: 'Pair with charcoal or navy for consulting, or emerald/burgundy for brand leadership.',
      atsRatingText: '91% ATS Score - Editorial banner + linear body',
      regions: ['Continental Europe', 'United Kingdom', 'Latin America', 'Global'],
      bestForIndustries: ['Commercial Leadership', 'Management Consulting', 'Corporate Comms', 'Luxury & Retail', 'Program Delivery']
    },
    engineering_blueprint: {
      name: 'Principal Engineer & Systems (No Photo)',
      shortName: 'Principal Systems',
      badge: '⚙️ Principal & Systems',
      photoRuleLabel: 'No Photo (Technical Rigor)',
      tagline: 'Precision architectural layout with editorial section indices and 2-column tech stack matrix.',
      whenToUse: 'Staff Engineer, Principal Architect, Platform Lead, Principal SRE, and VP of Engineering.',
      whereToUse: 'Big Tech, cloud-native scale-ups, high-frequency fintechs, and global remote engineering teams.',
      whyPhotoOrNot: 'Principal roles are assessed purely on distributed systems scale, SLOs, and architectural leadership.',
      proTip: 'Cite concrete scale metrics: QPS, p99 latency, cloud cost savings, and 99.995% SLA.',
      atsRatingText: '96% ATS Score - Clean stack & systems indexing',
      regions: ['Silicon Valley (US)', 'London & Berlin', 'Zurich & Amsterdam', 'Remote Global'],
      bestForIndustries: ['Distributed Systems', 'Platform & SRE', 'AI / MLOps Infra', 'Core Payments', 'Cloud Architecture']
    }
  },
  es: {
    european_europass: {
      name: 'Modelo Europeo Europass (Con Foto)',
      shortName: 'Europeo Europass',
      badge: '📸 Con Foto',
      photoRuleLabel: 'Foto Muy Recomendada',
      tagline: 'Estándar oficial de la UE con matriz de competencias e idiomas MCER.',
      whenToUse: 'Empresas en Europa, programas Erasmus+, becas y prácticas internacionales.',
      whereToUse: 'Unión Europea (España, Portugal, Alemania, Francia, Suiza, Italia) y multinacionales europeas.',
      whyPhotoOrNot: 'En Europa Continental, una fotografía profesional aporta cercanía, identidad y seriedad.',
      proTip: 'Usa una foto profesional con fondo neutro e iluminación suave. Evita selfies.',
      atsRatingText: '88% ATS Score - Estructura oficial de bloques UE',
      regions: ['Unión Europea', 'España & Portugal', 'Alemania (DACH)', 'Francia', 'Global UE'],
      bestForIndustries: ['Multinacionales Europeas', 'Salud y Farma', 'Ingeniería Civil', 'Educación Superior', 'Administración Pública']
    },
    creative_split: {
      name: 'Modelo Creativo Split (Con Foto y Barra)',
      shortName: 'Creativo Split',
      badge: '📸 Foto & Barra Lateral',
      photoRuleLabel: 'Foto Destacada',
      tagline: 'Diseño moderno en dos columnas para destacar marca personal, portafolio y soft skills.',
      whenToUse: 'Diseño UI/UX, Marketing Digital, Publicidad, Arquitectura, Producto y Startups.',
      whereToUse: 'Agencias creativas, startups tech y envíos directos por correo a responsables de área.',
      whyPhotoOrNot: 'En roles creativos, la imagen refuerza tu propuesta estética en los primeros 6 segundos.',
      proTip: 'Ideal para candidaturas directas por email a Directores de Arte o Fundadores.',
      atsRatingText: '82% ATS Score - Pensado para revisión humana',
      regions: ['España & LATAM', 'Ecosistemas Startup', 'Agencias', 'Remoto Global'],
      bestForIndustries: ['Diseño UI/UX', 'Marketing & Growth', 'Comunicación', 'Arquitectura', 'Startups Ágiles']
    },
    hybrid_minimalist: {
      name: 'Modelo Minimalista Nórdico (Foto Opcional)',
      shortName: 'Minimalista Nórdico',
      badge: '✨ Elegancia Clean',
      photoRuleLabel: 'Foto Opcional / Versátil',
      tagline: 'Estética escandinava centrada en tipografía impecable y lectura sin fricción.',
      whenToUse: 'RR.HH., Gestión de Proyectos, Consultoría, Ventas B2B y perfiles modernos.',
      whereToUse: 'Países Nórdicos, Suiza, Países Bajos, Reino Unido, España y LATAM.',
      whyPhotoOrNot: 'Funciona igual de bien con foto discreta o sin foto con un solo clic.',
      proTip: 'Si aplicas a EE.UU. o Reino Unido, desactiva la foto para cumplir al 100%.',
      atsRatingText: '92% ATS Score - Alta legibilidad OCR',
      regions: ['Países Nórdicos', 'Suiza & UK', 'Europa Central', 'América Latina'],
      bestForIndustries: ['Recursos Humanos', 'Consultoría', 'Arquitectura', 'SaaS & Tech', 'Finanzas Boutique']
    },
    ats_compact: {
      name: 'Modelo Norteamericano / ATS Estricto (Sin Foto)',
      shortName: 'ATS Estricto US/UK',
      badge: '🛡️ 100% Robot ATS',
      photoRuleLabel: 'Estrictamente Sin Foto',
      tagline: 'Optimizado al 100% para filtros corporativos (Workday, Taleo, Greenhouse, Lever).',
      whenToUse: 'Portales corporativos donde los filtros automáticos evalúan palabras clave.',
      whereToUse: 'Estados Unidos, Canadá, Reino Unido, Irlanda, Australia y grandes multinacionales.',
      whyPhotoOrNot: 'Las leyes EEOC y británicas evitan fotos para prevenir sesgos; los ATS descartan imágenes.',
      proTip: 'Calibra tus palabras clave en nuestro Radar ATS hasta superar el 85%.',
      atsRatingText: '100% ATS Match Score - Formato OCR imbatible',
      regions: ['Estados Unidos', 'Reino Unido', 'Canadá', 'Australia', 'Multinacionales'],
      bestForIndustries: ['Big Tech & Remoto', 'Banca Global', 'Farma & Biotech', 'Energía', 'Portales Workday']
    },
    executive_harvard: {
      name: 'Modelo Ejecutivo Harvard (Sin Foto)',
      shortName: 'Harvard Ejecutivo',
      badge: '👑 Ivy League / C-Level',
      photoRuleLabel: 'Sin Foto (Ivy League / Wall Street)',
      tagline: 'El estándar definitivo para Consejos de Administración, C-Level, Banca y MBB.',
      whenToUse: 'Direcciones Generales, CEO/CFO/COO, Consejos, McKinsey/BCG/Bain y Private Equity.',
      whereToUse: 'Mercado ejecutivo global, Wall Street, Londres, Madrid y centros financieros.',
      whyPhotoOrNot: 'En alta dirección se prescinde de foto para centrar todo el foco en EBITDA, P&L y gobierno.',
      proTip: 'Cuantifica cada logro: "Lideró reestructuración de $12M elevando el EBITDA un 34%".',
      atsRatingText: '96% ATS Score - Estándar directivo internacional',
      regions: ['Ejecutivo Global', 'EE.UU. & UK', 'Centros Financieros', 'Multinacionales'],
      bestForIndustries: ['Banca de Inversión', 'Consultoría Estratégica', 'Alta Dirección', 'M&A', 'Gobierno Corporativo']
    },
    tech_modern: {
      name: 'Modelo Tech Lead & Software (Sin Foto)',
      shortName: 'Tech Lead & Dev',
      badge: '💻 Tech & Ingeniería',
      photoRuleLabel: 'Sin Foto / Enfoque en Stack',
      tagline: 'Estructurado para ingenieros de software, arquitectos cloud, tech leads e IA.',
      whenToUse: 'Software Engineer, Tech Lead, Data, DevOps, Cloud Architect y Machine Learning.',
      whereToUse: 'Big Techs, scale-ups SaaS y posiciones remotas en dólares o euros.',
      whyPhotoOrNot: 'En tecnología se evalúa arquitectura, código en GitHub y métricas de latencia o SLA.',
      proTip: 'Incluye enlaces reales a GitHub o portafolio técnico en la cabecera.',
      atsRatingText: '95% ATS Score - Optimizado para indexadores tech',
      regions: ['Silicon Valley', 'Europa Tech', 'Remoto Global', 'Hubs SaaS'],
      bestForIndustries: ['Software & Cloud', 'IA & LLMs', 'Ingeniería de Datos', 'Ciberseguridad', 'Fintech & Web3']
    },
    un_classic: {
      name: 'Modelo Corporativo & Proyectos Globales',
      shortName: 'Corporativo & Proyectos',
      badge: '🏛️ Corporativo & Proyectos',
      photoRuleLabel: 'Sin Foto / Rigor Analítico',
      tagline: 'Formato ejecutivo para gobernanza corporativa, grandes proyectos y consultoría multilateral.',
      whenToUse: 'Directores de Programa, Operaciones, Infraestructura y Contratos Estratégicos.',
      whereToUse: 'Corporaciones globales, banca de desarrollo y agencias multilaterales.',
      whyPhotoOrNot: 'Diseño sobrio orientado a resultados auditados y cumplimiento normativo.',
      proTip: 'Cuantifica presupuestos gestionados, plazos e indicadores estratégicos.',
      atsRatingText: '95% ATS Score - Listo para grandes corporaciones',
      regions: ['Europa & Américas', 'Hubs Globales', 'Mercados Emergentes', 'Multilateral'],
      bestForIndustries: ['Gobierno Corporativo', 'Infraestructura', 'Operaciones y Auditoría', 'Banca de Desarrollo', 'Compliance']
    },
    academic_lattes: {
      name: 'Modelo Académico / Investigación & PhD (Sin Foto)',
      shortName: 'Académico & PhD',
      badge: '🎓 Académico & Ciencia',
      photoRuleLabel: 'Sin Foto / Rigor Científico',
      tagline: 'Formato formal centrado en publicaciones indexadas (DOI, Scopus), becas y docencia.',
      whenToUse: 'Plazas docentes, becas doctorales/posdoctorales y proyectos I+D.',
      whereToUse: 'Universidades, centros de investigación y laboratorios científicos internacionales.',
      whyPhotoOrNot: 'Los comités científicos evalúan méritos académicos, citas e impacto investigador.',
      proTip: 'Añade enlaces DOI e indica indexación Scopus o Web of Science.',
      atsRatingText: '90% ATS Score - Formato bibliográfico estructurado',
      regions: ['Universidades Globales', 'España & Europa', 'América Latina', 'Centros I+D'],
      bestForIndustries: ['Docencia Universitaria', 'Investigación I+D', 'Becas PhD', 'Biomedicina', 'Ciencias']
    },
    european_modern: {
      name: 'Modelo Corporativo Multinacional (Moderno)',
      shortName: 'Corporativo Moderno',
      badge: '💼 Corporativo',
      photoRuleLabel: 'Sin Foto / Diseño Corporativo Limpio',
      tagline: 'Versatilidad con líneas limpias para posiciones corporativas y comerciales.',
      whenToUse: 'Telecomunicaciones, Logística, Ventas Corporativas, Operaciones y Banca.',
      whereToUse: 'Multinacionales y grandes empresas en Europa y América Latina.',
      whyPhotoOrNot: 'Diseño moderno sin foto para evitar cualquier sesgo en procesos corporativos.',
      proTip: 'Ideal para proyectar modernidad sin riesgos ante filtros ATS.',
      atsRatingText: '93% ATS Score - Excelente legibilidad mixta',
      regions: ['Europa', 'España & Portugal', 'América Latina', 'Global'],
      bestForIndustries: ['Telecomunicaciones & TI', 'Logística', 'Comercio Exterior', 'Banca Comercial', 'Consultoría']
    },
    finance_wallstreet: {
      name: 'Banca de Inversión & Wall Street M&A (Sin Foto)',
      shortName: 'Wall Street M&A',
      badge: '🏦 Wall Street & M&A',
      photoRuleLabel: 'Estrictamente Sin Foto',
      tagline: 'Formato serifado institucional con doble línea para Banca de Inversión, M&A y Private Equity.',
      whenToUse: 'Investment Banking, Private Equity, Venture Capital, Asset Management y Equity Research.',
      whereToUse: 'Wall Street, Londres, Frankfurt, Zúrich, Madrid y centros financieros globales.',
      whyPhotoOrNot: 'Las finanzas institucionales exigen máxima densidad de operaciones sin fotografías.',
      proTip: 'Destaca volumen de deals, TIR y múltiplos EV/EBITDA en los primeros puntos.',
      atsRatingText: '99% ATS Score - Estándar financiero institucional',
      regions: ['Wall Street', 'Londres', 'Madrid & Frankfurt', 'Zúrich'],
      bestForIndustries: ['Banca de Inversión & M&A', 'Private Equity & VC', 'Asset Management', 'Finanzas Corporativas', 'Hedge Funds']
    },
    executive_board: {
      name: 'Consejo & C-Suite Editorial (Sin Foto)',
      shortName: 'Consejo & C-Suite',
      badge: '👔 Consejo & C-Suite',
      photoRuleLabel: 'Sin Foto (Gobierno Corporativo)',
      tagline: 'Cabecera editorial centrada con filete superior para Consejeros, CEOs y Vicepresidentes.',
      whenToUse: 'Headhunting ejecutivo, Consejos de Administración y mandatos VP/C-Level.',
      whereToUse: 'Empresas cotizadas, grupos familiares y sedes corporativas internacionales.',
      whyPhotoOrNot: 'Los headhunters evalúan mandato, P&L gestionado y gobierno corporativo sin foto.',
      proTip: 'Cuantifica ingresos bajo gestión, países liderados y tamaño del equipo.',
      atsRatingText: '97% ATS Score - Autoridad ejecutiva limpia',
      regions: ['C-Suite Global', 'EE.UU. & UK', 'Unión Europea', 'América Latina'],
      bestForIndustries: ['Consejos de Administración', 'Dirección General', 'Turnaround', 'Operaciones Globales', 'Asuntos Corporativos']
    },
    product_strategy: {
      name: 'Producto, PM & Growth Lead (Foto Opcional)',
      shortName: 'Producto & Growth',
      badge: '🚀 Producto & Growth',
      photoRuleLabel: 'Foto Opcional / Versátil',
      tagline: 'Diseño moderno con matriz de competencias enfocado en métricas SaaS, ARR y crecimiento.',
      whenToUse: 'Product Manager, Head of Product, Growth Lead, PMM, Strategy & Ops y RevOps.',
      whereToUse: 'Scale-ups SaaS, marketplaces, Big Techs y equipos remotos globales.',
      whyPhotoOrNot: 'Permite mostrar foto en Europa/LATAM u ocultarla con un clic para EE.UU. y UK.',
      proTip: 'Cuantifica impacto en retención o ingresos: "+22% activación y +$3.4M ARR".',
      atsRatingText: '94% ATS Score - Claridad en métricas SaaS',
      regions: ['Remoto Global', 'EE.UU. & Canadá', 'Europa Tech', 'LATAM'],
      bestForIndustries: ['Product Management', 'Growth & PLG', 'Product Marketing', 'Strategy & Ops', 'Fintech & SaaS']
    },
    modern_editorial: {
      name: 'Editorial Dos Tonos (Foto Opcional)',
      shortName: 'Editorial Dos Tonos',
      badge: '📰 Editorial Premium',
      photoRuleLabel: 'Foto Opcional Integrada',
      tagline: 'Cabecera editorial contrastada con cuerpo lineal A4 de alta legibilidad ATS.',
      whenToUse: 'Liderazgo Comercial, Comunicación, Consultoría, Gestión de Marca y Operaciones.',
      whereToUse: 'Europa Continental, Reino Unido (sin foto) y América Latina.',
      whyPhotoOrNot: 'Combina presencia visual en la banda superior con opción rápida sin foto.',
      proTip: 'Usa tonos grafito o azul marino para consultoría y esmeralda para roles de marca.',
      atsRatingText: '91% ATS Score - Banda editorial + cuerpo lineal',
      regions: ['Europa Continental', 'Reino Unido', 'América Latina', 'Global'],
      bestForIndustries: ['Liderazgo Comercial', 'Consultoría', 'Comunicación', 'Retail & Lujo', 'Gestión de Proyectos']
    },
    engineering_blueprint: {
      name: 'Principal Engineer & Sistemas (Sin Foto)',
      shortName: 'Principal Systems',
      badge: '⚙️ Principal & Sistemas',
      photoRuleLabel: 'Sin Foto (Rigor Técnico)',
      tagline: 'Diseño técnico preciso con numeración editorial y matriz de arquitectura cloud.',
      whenToUse: 'Staff Engineer, Principal Architect, Platform Lead, SRE Principal y VP Engineering.',
      whereToUse: 'Big Techs, empresas cloud-native, fintechs y contratos remotos internacionales.',
      whyPhotoOrNot: 'Los perfiles Principal se evalúan por escala distribuida, SLOs y arquitectura.',
      proTip: 'Incluye métricas reales: QPS, latencia p99, ahorro cloud y SLA del 99.995%.',
      atsRatingText: '96% ATS Score - Indexación técnica limpia',
      regions: ['Silicon Valley', 'Londres & Berlín', 'Zúrich', 'Remoto Global'],
      bestForIndustries: ['Sistemas Distribuidos', 'Platform & SRE', 'Infraestructura IA', 'Pagos & Fintech', 'Arquitectura Cloud']
    }
  },
  fr: {
    european_europass: {
      name: 'Modèle Européen Europass (Avec Photo)',
      shortName: 'Européen Europass',
      badge: '📸 Avec Photo',
      photoRuleLabel: 'Photo Fortement Recommandée',
      tagline: 'Standard officiel de l’UE avec grille de compétences et niveaux de langue CECRL.',
      whenToUse: 'Entreprises privées en Europe, programmes Erasmus+, bourses et stages internationaux.',
      whereToUse: 'Union européenne (France, Belgique, Suisse, Allemagne, Espagne, Portugal, Italie).',
      whyPhotoOrNot: 'En Europe continentale, une photo professionnelle inspire confiance et proximité.',
      proTip: 'Utilisez un portrait professionnel sur fond neutre avec une tenue adaptée.',
      atsRatingText: '88% ATS Score - Structure officielle par blocs UE',
      regions: ['Union Européenne', 'France & Suisse', 'Allemagne (DACH)', 'Belgique', 'International'],
      bestForIndustries: ['Multinationales UE', 'Santé & Pharma', 'Ingénierie', 'Enseignement Supérieur', 'Secteur Public']
    },
    creative_split: {
      name: 'Modèle Créatif Split (Photo & Barre Latérale)',
      shortName: 'Créatif Split',
      badge: '📸 Photo & Colonne',
      photoRuleLabel: 'Photo Mise en Valeur',
      tagline: 'Mise en page asymétrique à deux colonnes valorisant soft skills et portfolio.',
      whenToUse: 'Design UI/UX, Marketing Digital, Publicité, Architecture, Produit et Startups.',
      whereToUse: 'Agences créatives, scale-ups tech et candidatures directes par e-mail.',
      whyPhotoOrNot: 'Dans les métiers créatifs, l’identité visuelle fait la différence dès les 6 premières secondes.',
      proTip: 'Idéal pour les envois directs aux Directeurs Artistiques, CMO ou fondateurs.',
      atsRatingText: '82% ATS Score - Pensé pour la lecture humaine',
      regions: ['France & Europe', 'Écosystèmes Startup', 'Agences', 'Télétravail Global'],
      bestForIndustries: ['Design UI/UX', 'Marketing & Growth', 'Communication', 'Architecture', 'Startups Agiles']
    },
    hybrid_minimalist: {
      name: 'Modèle Minimaliste Nordique (Photo Optionnelle)',
      shortName: 'Minimaliste Nordique',
      badge: '✨ Élégance Épurée',
      photoRuleLabel: 'Photo Optionnelle / Modulable',
      tagline: 'Esthétique scandinave axée sur la typographie et la clarté immédiate du parcours.',
      whenToUse: 'RH, Gestion de Projet, Conseil, Ventes B2B et profils polyvalents.',
      whereToUse: 'Pays nordiques, Suisse, France, Royaume-Uni et entreprises modernes.',
      whyPhotoOrNot: 'Équilibre parfait avec ou sans photo en un seul clic.',
      proTip: 'Pour les États-Unis ou le Royaume-Uni, masquez simplement la photo.',
      atsRatingText: '92% ATS Score - Haute lisibilité OCR',
      regions: ['Pays Nordiques', 'Suisse & France', 'Royaume-Uni', 'International'],
      bestForIndustries: ['Ressources Humaines', 'Conseil', 'Architecture', 'SaaS & Tech', 'Finance Boutique']
    },
    ats_compact: {
      name: 'Modèle Nord-Américain / ATS Strict (Sans Photo)',
      shortName: 'ATS Strict US/UK',
      badge: '🛡️ 100% Robot ATS',
      photoRuleLabel: 'Strictement Sans Photo',
      tagline: 'Optimisé à 100% pour les parseurs ATS (Workday, Taleo, Greenhouse, Lever).',
      whenToUse: 'Portails de recrutement automatisés où l’IA filtre les mots-clés.',
      whereToUse: 'États-Unis, Canada, Royaume-Uni, Irlande, Australie et grands groupes.',
      whyPhotoOrNot: 'Les lois américaines (EEOC) et britanniques déconseillent la photo contre les biais.',
      proTip: 'Vérifiez votre taux de correspondance dans notre Radar ATS avant d’envoyer.',
      atsRatingText: '100% ATS Match Score - Format linéaire optimal',
      regions: ['États-Unis', 'Royaume-Uni', 'Canada', 'Australie', 'Multinationales'],
      bestForIndustries: ['Big Tech & Remote', 'Banque Mondiale', 'Pharma & Biotech', 'Énergie', 'Portails Workday']
    },
    executive_harvard: {
      name: 'Modèle Exécutif Harvard (Sans Photo)',
      shortName: 'Harvard Exécutif',
      badge: '👑 Ivy League / C-Level',
      photoRuleLabel: 'Sans Photo (Ivy League / Wall Street)',
      tagline: 'La référence absolue pour Conseils d’Administration, C-Level, Finance et MBB.',
      whenToUse: 'Directions Générales, CEO/CFO/COO, Conseil en Stratégie et Private Equity.',
      whereToUse: 'Marché exécutif mondial, Londres, New York, Paris, Zurich.',
      whyPhotoOrNot: 'Au niveau dirigeant, l’absence de photo met tout le focus sur l’EBITDA et la gouvernance.',
      proTip: 'Chiffrez chaque réalisation : « Piloté une restructuration de 12M$ (+34% d’EBITDA) ».',
      atsRatingText: '96% ATS Score - Standard exécutif mondial',
      regions: ['Exécutif Global', 'US & UK', 'Places Financières', 'Multinationales'],
      bestForIndustries: ['Banque d’Affaires', 'Conseil en Stratégie', 'Direction Générale', 'M&A', 'Gouvernance']
    },
    tech_modern: {
      name: 'Modèle Tech Lead & Ingénierie (Sans Photo)',
      shortName: 'Tech Lead & Dev',
      badge: '💻 Tech & Ingénierie',
      photoRuleLabel: 'Sans Photo / Focus Stack & Impact',
      tagline: 'Conçu pour développeurs, architectes cloud, tech leads et spécialistes IA.',
      whenToUse: 'Software Engineer, Tech Lead, Data, DevOps, Cloud et Machine Learning.',
      whereToUse: 'Big Techs, scale-ups SaaS, hubs européens et postes en télétravail.',
      whyPhotoOrNot: 'Les recruteurs tech évaluent la stack, GitHub et les métriques de fiabilité.',
      proTip: 'Ajoutez votre lien GitHub ou portfolio technique dans l’en-tête.',
      atsRatingText: '95% ATS Score - Adapté aux parseurs tech',
      regions: ['Silicon Valley', 'Europe Tech', 'Télétravail Global', 'Hubs SaaS'],
      bestForIndustries: ['Logiciel & Cloud', 'IA & LLMs', 'Data Engineering', 'Cybersécurité', 'Fintech & Web3']
    },
    un_classic: {
      name: 'Modèle Corporate & Projets Globaux',
      shortName: 'Corporate & Projets',
      badge: '🏛️ Corporate & Projets',
      photoRuleLabel: 'Sans Photo / Rigueur Analytique',
      tagline: 'Structure rigoureuse pour gouvernance, grands projets et conseil multilatéral.',
      whenToUse: 'Directeurs de Programme, Opérations, Grands Contrats et Conseil International.',
      whereToUse: 'Groupes internationaux, banques de développement et organisations multilatérales.',
      whyPhotoOrNot: 'Présentation sobre privilégiant clarté analytique et conformité.',
      proTip: 'Mettez en avant les budgets gérés et les indicateurs audités.',
      atsRatingText: '95% ATS Score - Conforme aux grands groupes',
      regions: ['Europe & Amériques', 'Hubs Mondiaux', 'Marchés Émergents', 'International'],
      bestForIndustries: ['Gouvernance', 'Infrastructure', 'Opérations & Audit', 'Financement', 'Conformité']
    },
    academic_lattes: {
      name: 'Modèle Académique / Recherche & PhD (Sans Photo)',
      shortName: 'Académique & PhD',
      badge: '🎓 Académique & Science',
      photoRuleLabel: 'Sans Photo / Rigueur Scientifique',
      tagline: 'Format dédié aux publications (DOI, Scopus), bourses de recherche et enseignement.',
      whenToUse: 'Postes universitaires, doctorats, post-docs et financements européens Horizon.',
      whereToUse: 'Universités, centres R&D (CERN, CNRS, Max Planck) et laboratoires.',
      whyPhotoOrNot: 'L’évaluation académique repose strictement sur les publications et travaux.',
      proTip: 'Ajoutez les liens DOI et précisez l’indexation Scopus ou Web of Science.',
      atsRatingText: '90% ATS Score - Structure bibliographique claire',
      regions: ['Universités Mondiales', 'France & Europe', 'Amériques', 'Centres R&D'],
      bestForIndustries: ['Enseignement Supérieur', 'Recherche R&D', 'Bourses PhD', 'Biomédecine', 'Sciences']
    },
    european_modern: {
      name: 'Modèle Corporate Multinational (Moderne)',
      shortName: 'Corporate Moderne',
      badge: '💼 Corporate',
      photoRuleLabel: 'Sans Photo / Design Moderne',
      tagline: 'Polyvalence et lisibilité pour postes en entreprise, finance et opérations.',
      whenToUse: 'Télécoms, Logistique, Ventes B2B, Opérations et Banque Commerciale.',
      whereToUse: 'Grandes entreprises et multinationales en Europe et à l’international.',
      whyPhotoOrNot: 'Version sans photo moderne évitant tout filtre discriminatoire.',
      proTip: 'Idéal pour un rendu contemporain sans risque ATS.',
      atsRatingText: '93% ATS Score - Excellente lisibilité',
      regions: ['Europe', 'Francophonie', 'Amériques', 'International'],
      bestForIndustries: ['Télécoms & IT', 'Logistique', 'Commerce International', 'Banque', 'Conseil Opérationnel']
    },
    finance_wallstreet: {
      name: 'Finance Wall Street & M&A (Sans Photo)',
      shortName: 'Wall Street M&A',
      badge: '🏦 Wall Street & M&A',
      photoRuleLabel: 'Strictement Sans Photo',
      tagline: 'Mise en page institutionnelle à double filet pour Banque d’Affaires, M&A et Private Equity.',
      whenToUse: 'Investment Banking, Private Equity, Venture Capital, Asset Management et Equity Research.',
      whereToUse: 'Wall Street, Londres, Paris, Francfort, Zurich et places financières mondiales.',
      whyPhotoOrNot: 'La finance institutionnelle privilégie la densité des transactions sans photo.',
      proTip: 'Mettez en avant le volume de deals, le TRI et les multiples EV/EBITDA.',
      atsRatingText: '99% ATS Score - Standard financier institutionnel',
      regions: ['Wall Street', 'Londres', 'Paris & Francfort', 'Zurich'],
      bestForIndustries: ['Banque d’Affaires & M&A', 'Private Equity & VC', 'Gestion d’Actifs', 'Finance Corporate', 'Hedge Funds']
    },
    executive_board: {
      name: 'Conseil & C-Suite Éditorial (Sans Photo)',
      shortName: 'Conseil & C-Suite',
      badge: '👔 Conseil & C-Suite',
      photoRuleLabel: 'Sans Photo (Gouvernance)',
      tagline: 'En-tête éditorial centré avec filet supérieur pour Administrateurs, CEOs et VPs.',
      whenToUse: 'Chasse de têtes dirigeante, Conseils d’Administration et postes VP/C-Level.',
      whereToUse: 'Groupes cotés, entreprises sous LBO et directions générales internationales.',
      whyPhotoOrNot: 'Les cabinets exécutifs évaluent le P&L géré et la gouvernance sans photo.',
      proTip: 'Précisez le chiffre d’affaires géré, les pays supervisés et la taille d’équipe.',
      atsRatingText: '97% ATS Score - Autorité exécutive épurée',
      regions: ['Exécutif Global', 'US & UK', 'Union Européenne', 'International'],
      bestForIndustries: ['Conseil d’Administration', 'Direction Générale', 'Transformation', 'Opérations Mondiales', 'Affaires Publiques']
    },
    product_strategy: {
      name: 'Produit, PM & Growth Lead (Photo Optionnelle)',
      shortName: 'Produit & Growth',
      badge: '🚀 Produit & Growth',
      photoRuleLabel: 'Photo Optionnelle / Modulable',
      tagline: 'Grille moderne orientée métriques SaaS, croissance ARR et expérimentation produit.',
      whenToUse: 'Product Manager, Head of Product, Growth Lead, PMM, Strategy & Ops et RevOps.',
      whereToUse: 'Scale-ups SaaS, marketplaces, Big Techs et équipes produit en télétravail.',
      whyPhotoOrNot: 'Affichez une photo en Europe ou masquez-la en un clic pour les États-Unis et le UK.',
      proTip: 'Chiffrez l’impact revenu ou rétention : « +22% d’activation et +3,4M$ d’ARR ».',
      atsRatingText: '94% ATS Score - Clarté des métriques SaaS',
      regions: ['Télétravail Global', 'US & Canada', 'Europe Tech', 'International'],
      bestForIndustries: ['Product Management', 'Growth & PLG', 'Product Marketing', 'Strategy & Ops', 'Fintech & SaaS']
    },
    modern_editorial: {
      name: 'Éditorial Deux-Tons (Photo Optionnelle)',
      shortName: 'Éditorial Deux-Tons',
      badge: '📰 Éditorial Premium',
      photoRuleLabel: 'Photo Optionnelle Intégrée',
      tagline: 'Bandeau supérieur contrasté associé à un corps linéaire A4 compatible ATS.',
      whenToUse: 'Direction Commerciale, Communication, Conseil, Marque et Opérations Seniors.',
      whereToUse: 'Europe continentale, Royaume-Uni (sans photo) et marchés internationaux.',
      whyPhotoOrNot: 'Allie présence visuelle immédiate et désactivation facile de la photo.',
      proTip: 'Associez-le à un bleu marine ou anthracite pour le conseil et la direction.',
      atsRatingText: '91% ATS Score - Bandeau éditorial + corps linéaire',
      regions: ['Europe Continentale', 'Royaume-Uni', 'Amériques', 'International'],
      bestForIndustries: ['Direction Commerciale', 'Conseil', 'Communication', 'Luxe & Retail', 'Gestion de Projets']
    },
    engineering_blueprint: {
      name: 'Principal Engineer & Systèmes (Sans Photo)',
      shortName: 'Principal Systems',
      badge: '⚙️ Principal & Systèmes',
      photoRuleLabel: 'Sans Photo (Rigueur Tech)',
      tagline: 'Architecture précise avec numérotation éditoriale et matrice technique à 2 colonnes.',
      whenToUse: 'Staff Engineer, Principal Architect, Platform Lead, SRE Principal et VP Engineering.',
      whereToUse: 'Big Techs, sociétés cloud-native, fintechs et contrats remote internationaux.',
      whyPhotoOrNot: 'Les profils Principal sont jugés sur la scalabilité, les SLOs et l’architecture.',
      proTip: 'Indiquez vos métriques système : QPS, latence p99, économies cloud et SLA 99,995%.',
      atsRatingText: '96% ATS Score - Indexation technique optimale',
      regions: ['Silicon Valley', 'Londres & Berlin', 'Paris & Zurich', 'Télétravail Global'],
      bestForIndustries: ['Systèmes Distribués', 'Platform & SRE', 'Infra IA & MLOps', 'Paiements', 'Architecture Cloud']
    }
  },
  de: {
    european_europass: {
      name: 'Europäisches Europass-Modell (Mit Foto)',
      shortName: 'Europass EU',
      badge: '📸 Mit Foto',
      photoRuleLabel: 'Foto sehr empfohlen',
      tagline: 'Offizieller EU-Standard mit Kompetenzraster und GER-Sprachstufen.',
      whenToUse: 'Bewerbungen in Deutschland, Österreich, der Schweiz und EU-Programmen.',
      whereToUse: 'DACH-Region, gesamte Europäische Union und internationale Konzerne.',
      whyPhotoOrNot: 'Im DACH-Raum vermittelt ein professionelles Bewerbungsfoto Seriosität und Persönlichkeit.',
      proTip: 'Nutzen Sie ein hochwertiges Studio-Porträt mit neutralem Hintergrund.',
      atsRatingText: '88% ATS Score - Strukturierter EU-Standard',
      regions: ['Deutschland (DACH)', 'Europäische Union', 'Schweiz & Österreich', 'Global'],
      bestForIndustries: ['Europäische Konzerne', 'Gesundheit & Pharma', 'Ingenieurwesen', 'Hochschule', 'Öffentlicher Dienst']
    },
    creative_split: {
      name: 'Kreatives Split-Modell (Mit Foto & Sidebar)',
      shortName: 'Kreativ Split',
      badge: '📸 Foto & Seitenleiste',
      photoRuleLabel: 'Präsentes Profilfoto',
      tagline: 'Modernes Zwei-Spalten-Layout für Portfolio, Soft Skills und Personal Branding.',
      whenToUse: 'UI/UX Design, Marketing, Werbung, Architektur, Produkt und Startups.',
      whereToUse: 'Agenturen, Tech-Startups und Direktbewerbungen per E-Mail.',
      whyPhotoOrNot: 'In Kreativberufen unterstreicht ein starkes visuelles Profil Ihren Stil sofort.',
      proTip: 'Ideal für Direktbewerbungen bei Creative Directors oder Startup-Gründern.',
      atsRatingText: '82% ATS Score - Optimiert für Entscheider',
      regions: ['DACH & Europa', 'Startup-Hubs', 'Kreativagenturen', 'Remote Global'],
      bestForIndustries: ['UI/UX & Produktdesign', 'Growth & Marketing', 'Kommunikation', 'Architektur', 'Agile Startups']
    },
    hybrid_minimalist: {
      name: 'Nordisches Minimal-Modell (Foto Optional)',
      shortName: 'Minimalistisch',
      badge: '✨ Klare Eleganz',
      photoRuleLabel: 'Foto optional / umschaltbar',
      tagline: 'Skandinavische Klarheit mit erstklassiger Typografie und ausgewogenem Weißraum.',
      whenToUse: 'HR, Projektmanagement, Beratung, B2B-Vertrieb und moderne Fachkräfte.',
      whereToUse: 'Nordeuropa, DACH, Großbritannien und designorientierte Unternehmen.',
      whyPhotoOrNot: 'Funktioniert perfekt mit oder ohne Foto – per Klick anpassbar.',
      proTip: 'Für USA oder UK einfach das Foto ausblenden.',
      atsRatingText: '92% ATS Score - Hohe OCR-Lesbarkeit',
      regions: ['Nordeuropa', 'DACH & UK', 'Mitteleuropa', 'Global'],
      bestForIndustries: ['Personalwesen & HR', 'Unternehmensberatung', 'Architektur', 'SaaS & Tech', 'Finance Boutiquen']
    },
    ats_compact: {
      name: 'US / Striktes ATS-Modell (Ohne Foto)',
      shortName: 'Striktes ATS US/UK',
      badge: '🛡️ 100% ATS-konform',
      photoRuleLabel: 'Streng ohne Foto',
      tagline: 'Zu 100 % auf Bewerbermanagementsysteme (Workday, Taleo, Greenhouse) ausgelegt.',
      whenToUse: 'Online-Portale internationaler Konzerne mit automatischer Vorselektion.',
      whereToUse: 'USA, Großbritannien, Kanada, Australien und globale Konzerne.',
      whyPhotoOrNot: 'Antidiskriminierungsregeln (EEOC) verbieten Fotos; ATS-Scanner verwerfen Bilder.',
      proTip: 'Prüfen Sie Ihren Lebenslauf im ATS-Radar bis über 85 % Übereinstimmung.',
      atsRatingText: '100% ATS Match Score - Einspaltig & fehlerfrei',
      regions: ['USA', 'Großbritannien', 'Kanada', 'Australien', 'Globale Konzerne'],
      bestForIndustries: ['Big Tech & Remote', 'Globale Banken', 'Pharma & Biotech', 'Energie', 'Workday-Portale']
    },
    executive_harvard: {
      name: 'Harvard Executive Modell (Ohne Foto)',
      shortName: 'Harvard Executive',
      badge: '👑 Ivy League / C-Level',
      photoRuleLabel: 'Ohne Foto (Ivy League Standard)',
      tagline: 'Das maßgebliche Format für Vorstände, C-Level, Investmentbanking und MBB.',
      whenToUse: 'Geschäftsführung, C-Suite (CEO/CFO/COO), Strategieberatung und Private Equity.',
      whereToUse: 'Internationaler Führungskräftemarkt, Frankfurt, London, New York, Zürich.',
      whyPhotoOrNot: 'Auf Vorstandsebene zählt ausschließlich P&L-Verantwortung, EBITDA und Governance.',
      proTip: 'Belegen Sie jeden Punkt mit Zahlen: „Leitete 12-Mio.-Restrukturierung (+34 % EBITDA)“.',
      atsRatingText: '96% ATS Score - Top-Management-Standard',
      regions: ['Global Executive', 'USA & UK', 'Finanzzentren', 'Konzerne'],
      bestForIndustries: ['Investmentbanking', 'Strategieberatung (MBB)', 'Vorstand & C-Suite', 'M&A', 'Corporate Governance']
    },
    tech_modern: {
      name: 'Tech Lead & Software-Engineering (Ohne Foto)',
      shortName: 'Tech Lead & Dev',
      badge: '💻 Tech & Engineering',
      photoRuleLabel: 'Ohne Foto / Fokus auf Tech-Stack',
      tagline: 'Strukturiert für Software-Ingenieure, Cloud-Architekten, Tech Leads und KI-Experten.',
      whenToUse: 'Software Engineer, Tech Lead, Data, DevOps, Cloud und Machine Learning.',
      whereToUse: 'Big Tech, SaaS-Scale-ups, Berlin/München/London und Remote-Positionen.',
      whyPhotoOrNot: 'Tech-Manager bewerten Architektur, GitHub-Projekte und Systemmetriken statt Fotos.',
      proTip: 'Fügen Sie im Kopfbereich Ihren GitHub- oder Portfolio-Link hinzu.',
      atsRatingText: '95% ATS Score - Optimiert für Tech-Parser',
      regions: ['Silicon Valley', 'Berlin & London', 'Remote Global', 'SaaS-Hubs'],
      bestForIndustries: ['Software & Cloud', 'KI & LLMs', 'Data Engineering', 'Cybersecurity', 'Fintech & Web3']
    },
    un_classic: {
      name: 'Corporate & Internationale Projekte',
      shortName: 'Corporate & Projekte',
      badge: '🏛️ Corporate & Projekte',
      photoRuleLabel: 'Ohne Foto / Analytische Präzision',
      tagline: 'Formale Struktur für Governance, Großprojekte und internationale Beratung.',
      whenToUse: 'Programmdirektoren, Operations, Großprojekte und internationale Mandate.',
      whereToUse: 'Internationale Konzerne, Entwicklungsbanken und globale Organisationen.',
      whyPhotoOrNot: 'Sachliche Darstellung unterstreicht Governance und Messbarkeit.',
      proTip: 'Nennen Sie verwaltete Budgets, Fristen und geprüfte Projektkennzahlen.',
      atsRatingText: '95% ATS Score - Konzern- & Compliance-tauglich',
      regions: ['Europa & Amerika', 'Globale Hubs', 'Wachstumsmärkte', 'International'],
      bestForIndustries: ['Corporate Governance', 'Infrastruktur', 'Operations & Audit', 'Finanzierung', 'Compliance']
    },
    academic_lattes: {
      name: 'Akademisch / Forschung & PhD (Ohne Foto)',
      shortName: 'Akademisch & PhD',
      badge: '🎓 Wissenschaft & PhD',
      photoRuleLabel: 'Ohne Foto / Wissenschaftlicher Standard',
      tagline: 'Fokus auf begutachtete Publikationen (DOI, Scopus), Drittmittel und Hochschullehre.',
      whenToUse: 'Professuren, Promotions-/Postdoc-Stipendien und Forschungsinstitute.',
      whereToUse: 'Universitäten, Max-Planck-Institute, CERN und Forschungszentren weltweit.',
      whyPhotoOrNot: 'In der Wissenschaft zählen ausschließlich Publikationsleistung und Forschungserfahrung.',
      proTip: 'Verlinken Sie DOIs und vermerken Sie Scopus- oder Web-of-Science-Indexierung.',
      atsRatingText: '90% ATS Score - Bibliografischer Standard',
      regions: ['Globale Universitäten', 'DACH & Europa', 'Amerika', 'Forschungszentren'],
      bestForIndustries: ['Hochschullehre', 'Forschung & Entwicklung', 'PhD-Stipendien', 'Biomedizin', 'Wissenschaft']
    },
    european_modern: {
      name: 'Multinational Corporate Modern',
      shortName: 'Corporate Modern',
      badge: '💼 Corporate',
      photoRuleLabel: 'Ohne Foto / Modernes Business-Design',
      tagline: 'Klare Linien und vielseitige Struktur für klassische und moderne Business-Rollen.',
      whenToUse: 'Telekommunikation, Logistik, B2B-Vertrieb, Operations und Banking.',
      whereToUse: 'Mittelstand und Großunternehmen in Europa und weltweit.',
      whyPhotoOrNot: 'Moderne Corporate-Variante ohne Foto zur Vermeidung von ATS-Problemen.',
      proTip: 'Ideal für einen zeitgemäßen Auftritt ohne Risiko bei Konzernportalen.',
      atsRatingText: '93% ATS Score - Hervorragende Lesbarkeit',
      regions: ['Europa', 'DACH', 'International', 'Global'],
      bestForIndustries: ['Telekommunikation & IT', 'Logistik', 'Außenhandel', 'Banking', 'Operations-Beratung']
    },
    finance_wallstreet: {
      name: 'Wall Street & M&A Finance (Ohne Foto)',
      shortName: 'Wall Street M&A',
      badge: '🏦 Wall Street & M&A',
      photoRuleLabel: 'Streng ohne Foto',
      tagline: 'Institutionelles Serif-Layout mit Doppellinien für Investmentbanking, M&A & Private Equity.',
      whenToUse: 'Investment Banking, Private Equity, Venture Capital, Asset Management & Research.',
      whereToUse: 'Frankfurt, Zürich, London, Wall Street und internationale Finanzzentren.',
      whyPhotoOrNot: 'Im institutionellen Banking zählt maximale Deal-Dichte ohne Foto.',
      proTip: 'Nennen Sie Transaktionsvolumina, IRR und EV/EBITDA-Multiples direkt am Anfang.',
      atsRatingText: '99% ATS Score - Institutioneller Banking-Standard',
      regions: ['Frankfurt & Zürich', 'London', 'Wall Street', 'Global'],
      bestForIndustries: ['Investmentbanking & M&A', 'Private Equity & VC', 'Asset Management', 'Corporate Finance', 'Hedge Funds']
    },
    executive_board: {
      name: 'Vorstand & C-Suite Editorial (Ohne Foto)',
      shortName: 'Board & C-Suite',
      badge: '👔 Vorstand & C-Suite',
      photoRuleLabel: 'Ohne Foto (Governance)',
      tagline: 'Zentrierter Editorial-Kopf mit oberer Akzentlinie für Vorstände, CEOs & Beiräte.',
      whenToUse: 'Executive Search, Aufsichtsrats- & Beiratsmandate sowie C-Level-Positionen.',
      whereToUse: 'Börsennotierte Konzerne, Familienunternehmen und internationale Zentralen.',
      whyPhotoOrNot: 'Executive Search bewertet P&L-Verantwortung und Governance ohne Bewerbungsfoto.',
      proTip: 'Beziffern Sie Umsatzverantwortung, Länderanzahl und geführte Mitarbeiterzahl.',
      atsRatingText: '97% ATS Score - Klares Vorstands-Format',
      regions: ['Global C-Suite', 'DACH & UK', 'USA', 'Europa'],
      bestForIndustries: ['Vorstand & Beirat', 'Geschäftsführung', 'Restrukturierung', 'Global Operations', 'Corporate Affairs']
    },
    product_strategy: {
      name: 'Produkt, PM & Growth Lead (Foto Optional)',
      shortName: 'Produkt & Growth',
      badge: '🚀 Produkt & Growth',
      photoRuleLabel: 'Foto optional / flexibel',
      tagline: 'Modernes Rasterlayout mit Fokus auf SaaS-Metriken, ARR-Wachstum und Experimente.',
      whenToUse: 'Product Manager, Head of Product, Growth Lead, PMM, Strategy & Ops.',
      whereToUse: 'SaaS-Scale-ups, Marktplätze, Big Tech und internationale Remote-Teams.',
      whyPhotoOrNot: 'Im DACH-Raum mit Foto nutzbar, für USA/UK mit einem Klick ausblendbar.',
      proTip: 'Belegen Sie Funnel- & Umsatzsteigerungen: z. B. „+22 % Aktivierung & +3,4 Mio. $ ARR“.',
      atsRatingText: '94% ATS Score - Klar für SaaS & Produkt',
      regions: ['Remote Global', 'DACH Tech', 'USA & UK', 'Europa'],
      bestForIndustries: ['Product Management', 'Growth & PLG', 'Product Marketing', 'Strategy & Ops', 'Fintech & SaaS']
    },
    modern_editorial: {
      name: 'Modernes Zweiton-Editorial (Foto Optional)',
      shortName: 'Zweiton-Editorial',
      badge: '📰 Editorial Premium',
      photoRuleLabel: 'Integriertes optionales Foto',
      tagline: 'Kontraststarker zweifarbiger Kopfbereich kombiniert mit einspaltigem ATS-Textkörper.',
      whenToUse: 'Vertriebsleitung, Kommunikation, Beratung, Markenführung & Senior Operations.',
      whereToUse: 'Kontinentaleuropa, Großbritannien (ohne Foto) und globale Unternehmen.',
      whyPhotoOrNot: 'Verbindet starke visuelle Präsenz oben mit schnellem Foto-Umschalter.',
      proTip: 'Dunkelblau oder Anthrazit wirkt ideal für Beratung und kaufmännische Leitung.',
      atsRatingText: '91% ATS Score - Editorial-Banner + Linear-Body',
      regions: ['DACH & Europa', 'Großbritannien', 'International', 'Global'],
      bestForIndustries: ['Vertriebsleitung', 'Unternehmensberatung', 'Kommunikation', 'Handel & Luxus', 'Projektmanagement']
    },
    engineering_blueprint: {
      name: 'Principal Engineer & Systeme (Ohne Foto)',
      shortName: 'Principal Systems',
      badge: '⚙️ Principal & Systeme',
      photoRuleLabel: 'Ohne Foto (Tech-Präzision)',
      tagline: 'Präzises Architektur-Layout mit redaktioneller Nummerierung und 2-Spalten-Tech-Matrix.',
      whenToUse: 'Staff Engineer, Principal Architect, Platform Lead, Principal SRE & VP Engineering.',
      whereToUse: 'Big Tech, Cloud-Native-Unternehmen, Fintechs und internationale Remote-Rollen.',
      whyPhotoOrNot: 'Principal-Rollen werden nach verteilter Systemskala, SLOs und Architektur beurteilt.',
      proTip: 'Nennen Sie konkrete Kennzahlen: QPS, p99-Latenz, Cloud-Einsparungen & 99,995 % SLA.',
      atsRatingText: '96% ATS Score - Saubere Stack-Indexierung',
      regions: ['Silicon Valley', 'Berlin & London', 'Zürich & München', 'Remote Global'],
      bestForIndustries: ['Verteilte Systeme', 'Platform & SRE', 'KI & MLOps Infra', 'Payments', 'Cloud-Architektur']
    }
  },
  it: {
    european_europass: {
      name: 'Modello Europeo Europass (Con Foto)',
      shortName: 'Europeo Europass',
      badge: '📸 Con Foto',
      photoRuleLabel: 'Foto Consigliata',
      tagline: 'Standard ufficiale UE con griglia competenze e livelli linguistici QCER.',
      whenToUse: 'Aziende private in Europa, programmi Erasmus+, borse di studio e stage.',
      whereToUse: 'Unione Europea (Italia, Germania, Francia, Spagna, Portogallo, Svizzera).',
      whyPhotoOrNot: 'In Europa continentale un ritratto professionale trasmette affidabilità e cura.',
      proTip: 'Scegli una foto professionale su sfondo neutro con luce morbida. Evita selfie.',
      atsRatingText: '88% ATS Score - Struttura ufficiale a blocchi UE',
      regions: ['Unione Europea', 'Italia & Svizzera', 'Germania (DACH)', 'Francia & Spagna', 'Globale UE'],
      bestForIndustries: ['Multinazionali UE', 'Sanità & Pharma', 'Ingegneria Civile', 'Università', 'Pubblica Amministrazione']
    },
    creative_split: {
      name: 'Modello Creativo Split (Foto & Sidebar)',
      shortName: 'Creativo Split',
      badge: '📸 Foto & Barra Laterale',
      photoRuleLabel: 'Foto in Evidenza',
      tagline: 'Layout moderno a due colonne per valorizzare portfolio, soft skill e brand personale.',
      whenToUse: 'Design UI/UX, Digital Marketing, Pubblicità, Architettura, Prodotto e Startup.',
      whereToUse: 'Agenzie creative, startup tech e invii diretti via email ai responsabili.',
      whyPhotoOrNot: 'Nei ruoli creativi l’impatto visivo comunica subito gusto estetico e personalità.',
      proTip: 'Ottimo per candidature dirette via email ad Art Director, CMO o founder.',
      atsRatingText: '82% ATS Score - Pensato per lettura umana',
      regions: ['Italia & Europa', 'Hub Startup', 'Agenzie Creative', 'Remoto Globale'],
      bestForIndustries: ['Design UI/UX', 'Marketing & Growth', 'Comunicazione', 'Architettura', 'Startup Agili']
    },
    hybrid_minimalist: {
      name: 'Modello Minimalista Nordico (Foto Opzionale)',
      shortName: 'Minimalista Nordico',
      badge: '✨ Eleganza Clean',
      photoRuleLabel: 'Foto Opzionale / Disattivabile',
      tagline: 'Estetica scandinava basata su tipografia impeccabile e respiro visivo.',
      whenToUse: 'HR, Project Management, Consulenza, Vendite B2B e profili moderni.',
      whereToUse: 'Paesi Nordici, Svizzera, Italia, Regno Unito e aziende innovative.',
      whyPhotoOrNot: 'Funziona perfettamente sia con foto discreta sia senza foto in un clic.',
      proTip: 'Per candidature in USA o UK disattiva semplicemente la foto.',
      atsRatingText: '92% ATS Score - Alta leggibilità OCR',
      regions: ['Paesi Nordici', 'Svizzera & Italia', 'Regno Unito', 'Globale'],
      bestForIndustries: ['Risorse Umane', 'Consulenza', 'Architettura', 'SaaS & Tech', 'Finanza Boutique']
    },
    ats_compact: {
      name: 'Modello Nordamericano / ATS Stretto (Senza Foto)',
      shortName: 'ATS Stretto US/UK',
      badge: '🛡️ 100% Robot ATS',
      photoRuleLabel: 'Rigorosamente Senza Foto',
      tagline: 'Ottimizzato al 100% per software di screening (Workday, Taleo, Greenhouse, Lever).',
      whenToUse: 'Portali aziendali dove l’IA filtra automaticamente parole chiave e requisiti.',
      whereToUse: 'Stati Uniti, Canada, Regno Unito, Irlanda, Australia e grandi multinazionali.',
      whyPhotoOrNot: 'Le normative EEOC e britanniche scoraggiano le foto contro i bias; gli ATS scartano immagini.',
      proTip: 'Usa il nostro Radar ATS per superare l’85% di affinità prima di inviare.',
      atsRatingText: '100% ATS Match Score - Struttura lineare perfetta',
      regions: ['Stati Uniti', 'Regno Unito', 'Canada', 'Australia', 'Multinazionali'],
      bestForIndustries: ['Big Tech & Remoto', 'Banche Globali', 'Pharma & Biotech', 'Energia', 'Portali Workday']
    },
    executive_harvard: {
      name: 'Modello Executive Harvard (Senza Foto)',
      shortName: 'Harvard Executive',
      badge: '👑 Ivy League / C-Level',
      photoRuleLabel: 'Senza Foto (Ivy League / Wall Street)',
      tagline: 'Lo standard definitivo per CdA, C-Level, Banche d’Affari e Consulenza MBB.',
      whenToUse: 'Direzioni Generali, CEO/CFO/COO, Consigli di Amministrazione e Private Equity.',
      whereToUse: 'Mercato executive globale, Wall Street, Londra, Milano, Zurigo.',
      whyPhotoOrNot: 'Ai massimi livelli aziendali si evita la foto per concentrare ogni riga su EBITDA e governance.',
      proTip: 'Quantifica ogni risultato: «Guidata ristrutturazione da 12M$ con +34% EBITDA in 12 mesi».',
      atsRatingText: '96% ATS Score - Standard dirigenziale globale',
      regions: ['Executive Globale', 'USA & UK', 'Centri Finanziari', 'Multinazionali'],
      bestForIndustries: ['Investment Banking', 'Consulenza Strategica', 'Alta Direzione', 'M&A', 'Corporate Governance']
    },
    tech_modern: {
      name: 'Modello Tech Lead & Software (Senza Foto)',
      shortName: 'Tech Lead & Dev',
      badge: '💻 Tech & Ingegneria',
      photoRuleLabel: 'Senza Foto / Focus Stack & Codice',
      tagline: 'Progettato per sviluppatori, architetti cloud, tech lead e specialisti IA.',
      whenToUse: 'Software Engineer, Tech Lead, Data, DevOps, Cloud Architect e Machine Learning.',
      whereToUse: 'Big Tech, scale-up SaaS e posizioni remote retribuite in euro o dollari.',
      whyPhotoOrNot: 'I tech manager valutano architettura, link GitHub e metriche di sistema, non la foto.',
      proTip: 'Inserisci il link diretto a GitHub o al portfolio live nell’intestazione.',
      atsRatingText: '95% ATS Score - Ottimizzato per parser tecnici',
      regions: ['Silicon Valley', 'Europa Tech', 'Remoto Globale', 'Hub SaaS'],
      bestForIndustries: ['Software & Cloud', 'IA & LLM', 'Data Engineering', 'Cybersecurity', 'Fintech & Web3']
    },
    un_classic: {
      name: 'Modello Corporate & Progetti Globali',
      shortName: 'Corporate & Progetti',
      badge: '🏛️ Corporate & Progetti',
      photoRuleLabel: 'Senza Foto / Rigore Analitico',
      tagline: 'Formato strutturato per governance, grandi progetti e consulenza multilaterale.',
      whenToUse: 'Program Director, Operations, Grandi Appalti e Consulenze Internazionali.',
      whereToUse: 'Multinazionali, banche di sviluppo e organizzazioni internazionali.',
      whyPhotoOrNot: 'Impaginazione sobria che valorizza chiarezza analitica e risultati verificabili.',
      proTip: 'Quantifica sempre budget gestiti, scadenze rispettate e KPI raggiunti.',
      atsRatingText: '95% ATS Score - Adatto a grandi gruppi',
      regions: ['Europa & Americhe', 'Hub Globali', 'Mercati Emergenti', 'Internazionale'],
      bestForIndustries: ['Corporate Governance', 'Infrastrutture', 'Operations & Audit', 'Banche di Sviluppo', 'Compliance']
    },
    academic_lattes: {
      name: 'Modello Accademico / Ricerca & PhD (Senza Foto)',
      shortName: 'Accademico & PhD',
      badge: '🎓 Accademico & Scienza',
      photoRuleLabel: 'Senza Foto / Rigore Scientifico',
      tagline: 'Struttura dedicata a pubblicazioni (DOI, Scopus), borse di ricerca e docenza.',
      whenToUse: 'Concorsi universitari, dottorati, post-doc e bandi europei Horizon.',
      whereToUse: 'Università, centri R&D (CERN, Max Planck, CNR) e laboratori scientifici.',
      whyPhotoOrNot: 'Le commissioni valutano esclusivamente pubblicazioni, citazioni e attività didattica.',
      proTip: 'Inserisci link DOI e specifica l’indicizzazione Scopus o Web of Science.',
      atsRatingText: '90% ATS Score - Formato bibliografico strutturato',
      regions: ['Università Globali', 'Italia & Europa', 'Americhe', 'Centri R&D'],
      bestForIndustries: ['Docenza Universitaria', 'Ricerca R&D', 'Borse PhD', 'Ricerca Biomedica', 'Scienze']
    },
    european_modern: {
      name: 'Modello Corporate Multinazionale (Moderno)',
      shortName: 'Corporate Moderno',
      badge: '💼 Corporate',
      photoRuleLabel: 'Senza Foto / Design Aziendale Pulito',
      tagline: 'Versatilità e stile moderno per ruoli aziendali, commerciali e operativi.',
      whenToUse: 'Telecomunicazioni, Logistica, Vendite B2B, Operations e Banche Commerciali.',
      whereToUse: 'Grandi aziende e multinazionali in Italia, Europa e America Latina.',
      whyPhotoOrNot: 'Versione aziendale senza foto per evitare rischi nei filtri ATS moderni.',
      proTip: 'Ideale per un profilo contemporaneo sicuro su qualsiasi portale.',
      atsRatingText: '93% ATS Score - Ottima leggibilità',
      regions: ['Italia & Europa', 'Americhe', 'Globale'],
      bestForIndustries: ['Telecomunicazioni & IT', 'Logistica', 'Commercio Estero', 'Banca Commerciale', 'Consulenza']
    },
    finance_wallstreet: {
      name: 'Finanza Wall Street & M&A (Senza Foto)',
      shortName: 'Wall Street M&A',
      badge: '🏦 Wall Street & M&A',
      photoRuleLabel: 'Rigorosamente Senza Foto',
      tagline: 'Layout serif istituzionale a doppia linea per Investment Banking, M&A e Private Equity.',
      whenToUse: 'Investment Banking, Private Equity, Venture Capital, Asset Management ed Equity Research.',
      whereToUse: 'Wall Street, Londra, Milano, Francoforte, Zurigo e centri finanziari globali.',
      whyPhotoOrNot: 'La finanza istituzionale privilegia la densità delle operazioni senza fotografie.',
      proTip: 'Evidenzia volumi di deal, IRR e multipli EV/EBITDA nei primi punti di ogni ruolo.',
      atsRatingText: '99% ATS Score - Standard finanziario istituzionale',
      regions: ['Wall Street', 'Londra', 'Milano & Zurigo', 'Globale'],
      bestForIndustries: ['Investment Banking & M&A', 'Private Equity & VC', 'Asset Management', 'Finanza Aziendale', 'Hedge Funds']
    },
    executive_board: {
      name: 'Consiglio & C-Suite Editoriale (Senza Foto)',
      shortName: 'Board & C-Suite',
      badge: '👔 Board & C-Suite',
      photoRuleLabel: 'Senza Foto (Governance)',
      tagline: 'Intestazione editoriale centrata con filetto superiore per CdA, CEO e Vicepresidenti.',
      whenToUse: 'Executive search, Consigli di Amministrazione e mandati VP/C-Level.',
      whereToUse: 'Società quotate, gruppi industriali e sedi direzionali internazionali.',
      whyPhotoOrNot: 'Gli headhunter executive valutano P&L gestito e governance senza fotografia.',
      proTip: 'Quantifica subito fatturato gestito, paesi supervisionati e dimensione del team.',
      atsRatingText: '97% ATS Score - Formato governance pulito',
      regions: ['C-Suite Globale', 'Italia & Europa', 'USA & UK', 'Internazionale'],
      bestForIndustries: ['Consigli di Amministrazione', 'Direzione Generale', 'Turnaround', 'Operations Globali', 'Affari Istituzionali']
    },
    product_strategy: {
      name: 'Prodotto, PM & Growth Lead (Foto Opzionale)',
      shortName: 'Prodotto & Growth',
      badge: '🚀 Prodotto & Growth',
      photoRuleLabel: 'Foto Opzionale / Versatile',
      tagline: 'Griglia moderna orientata a metriche SaaS, crescita ARR e sperimentazione prodotto.',
      whenToUse: 'Product Manager, Head of Product, Growth Lead, PMM, Strategy & Ops e RevOps.',
      whereToUse: 'Scale-up SaaS, marketplace digitali, Big Tech e team remoti internazionali.',
      whyPhotoOrNot: 'Mostra la foto in Italia/Europa o disattivala con un clic per USA e UK.',
      proTip: 'Evidenzia impatto su conversione o ricavi: es. "+22% attivazione e +3,4M$ ARR".',
      atsRatingText: '94% ATS Score - Chiaro per metriche SaaS',
      regions: ['Remoto Globale', 'Europa Tech', 'USA & Canada', 'Italia'],
      bestForIndustries: ['Product Management', 'Growth & PLG', 'Product Marketing', 'Strategy & Ops', 'Fintech & SaaS']
    },
    modern_editorial: {
      name: 'Editoriale Bicolore (Foto Opzionale)',
      shortName: 'Editoriale Bicolore',
      badge: '📰 Editoriale Premium',
      photoRuleLabel: 'Foto Opzionale Integrata',
      tagline: 'Fascia editoriale ad alto contrasto abbinata a un corpo lineare A4 pronto per ATS.',
      whenToUse: 'Direzione Commerciale, Comunicazione, Consulenza, Brand Management e Operations.',
      whereToUse: 'Europa continentale, Regno Unito (senza foto) e aziende orientate al design.',
      whyPhotoOrNot: 'Unisce forte presenza visiva in alto con rimozione rapida della foto.',
      proTip: 'Abbinalo a blu navy o antracite per consulenza e ruoli manageriali.',
      atsRatingText: '91% ATS Score - Banner editoriale + corpo lineare',
      regions: ['Italia & Europa', 'Regno Unito', 'Americhe', 'Globale'],
      bestForIndustries: ['Direzione Commerciale', 'Consulenza', 'Comunicazione', 'Lusso & Retail', 'Project Management']
    },
    engineering_blueprint: {
      name: 'Principal Engineer & Sistemi (Senza Foto)',
      shortName: 'Principal Systems',
      badge: '⚙️ Principal & Sistemi',
      photoRuleLabel: 'Senza Foto (Rigore Tecnico)',
      tagline: 'Layout architetturale preciso con numerazione editoriale e matrice tecnica a 2 colonne.',
      whenToUse: 'Staff Engineer, Principal Architect, Platform Lead, Principal SRE e VP Engineering.',
      whereToUse: 'Big Tech, aziende cloud-native, fintech e contratti remoti internazionali.',
      whyPhotoOrNot: 'I profili Principal sono valutati su scala distribuita, SLO e leadership tecnica.',
      proTip: 'Cita numeri reali: QPS, latenza p99, risparmi cloud e SLA al 99,995%.',
      atsRatingText: '96% ATS Score - Indicizzazione stack pulita',
      regions: ['Silicon Valley', 'Londra & Berlino', 'Milano & Zurigo', 'Remoto Globale'],
      bestForIndustries: ['Sistemi Distribuiti', 'Platform & SRE', 'Infra AI & MLOps', 'Pagamenti', 'Architettura Cloud']
    }
  }
};

export const EDITOR_UI_TRANSLATIONS: Record<SiteLanguageCode, EditorUiDictionary> = {
  pt: {
    advisor: {
      authPrompt: 'Inicie sessão ou crie uma conta para usar este modelo no editor.',
      pricingPrompt:
        'A aplicação de modelos executivos internacionais (Harvard, ATS Estrito, Tech Modern) é exclusiva para assinantes Pro ($8/mês) e Executivo VIP ($12/mês).',
      modalTitle: 'Guia Estratégico & Catálogo de Modelos de CV',
      badge: 'Internacional & ATS 2026',
      subtitle: 'Descubra quando, onde e por que usar cada padrão: com fotos, sem fotos e regras geográficas.',
      goldRuleTitle: 'Regra de Ouro da Foto:',
      goldRuleText:
        'Use foto na Europa Continental e LATAM. Oculte a foto nos EUA, Reino Unido e portais ATS automatizados (Workday, Greenhouse) para evitar desclassificação.',
      hideRule: 'Ocultar Explicação Completa',
      showRule: 'Por que a Foto é Proibida nos EUA?',
      lawTitle: 'Legislação Trabalhista Internacional & Vieses de Contratação',
      noPhotoTitle: 'EUA, Reino Unido, Canadá & Austrália (Sem Foto)',
      noPhotoDesc:
        'A Comissão de Oportunidades Iguais de Emprego (EEOC) dos EUA e a legislação britânica impõem rígidas diretrizes anti-discriminação. Os softwares ATS descartam currículos com fotografia para proteger contra viés inconsciente.',
      withPhotoTitle: 'Europa Continental, Brasil & África Lusófona (Com Foto)',
      withPhotoDesc:
        'Em países como Alemanha, França, Portugal, Espanha e Suíça, o padrão Europass consagra a foto corporativa de estúdio como elemento de identificação, transparência e profissionalismo.',
      filterAll: 'Todos',
      filterWithPhoto: 'Com Foto',
      filterNoPhoto: 'Sem Foto / ATS',
      filterExec: 'Executivos & Setoriais',
      activeTemplateLabel: 'Modelo em uso:',
      whenToUseLabel: '🎯 Quando Usar:',
      whereToUseLabel: '🌍 Onde Usar / Regiões:',
      photoRuleLabel: 'Regra de Fotografia',
      currentModelBtn: 'Modelo Atual',
      applyModelBtn: 'Aplicar Modelo',
      activateModelBtn: 'Ativar Este Modelo no Meu CV',
      deepWhenTitle: 'Quando e Para Quem Usar:',
      deepWhereTitle: 'Onde Usar & Aceitação Regional:',
      deepPhotoTitle: 'Justificativa da Foto (Ou Ausência):',
      deepIndustriesTitle: 'Setores Ideais:',
      recruiterTipTitle: 'Dica de Ouro do Recrutador:',
      exportCompatNote: 'Compatível com exportação Word (.docx) e Impressão PDF sem cortes.',
      footerValidationNote: 'Formatos validados segundo normas internacionais de RH e sistemas ATS.',
      closeBtn: 'Fechar'
    },
    dropdown: {
      triggerTitle: 'Selecionar modelo de currículo com ou sem foto',
      withPhotoTag: 'Com Foto',
      noPhotoTag: 'Sem Foto (ATS)',
      whereToUseBtn: 'Onde Usar?',
      whereToUseTitle: 'Ver guia de quando e onde usar cada modelo de currículo',
      menuTitle: 'Modelos Oficiais de Currículo',
      menuSubtitle: 'Selecione o formato ideal para o país e setor da sua vaga',
      fullGuideBtn: 'Guia Completo',
      photoGroupTitle: 'Modelos Com Foto (Europa Continental & Design)',
      noPhotoGroupTitle: 'Modelos Sem Foto (ATS Estrito EUA/UK & Executivo)',
      footerPrompt: 'Dúvida sobre o país ou ATS da vaga?',
      footerLink: 'Ver Guia Completo'
    },
    photoModal: {
      fileTooLargeTitle: 'Ficheiro Muito Grande',
      fileTooLargeMsg: 'Por favor escolha uma foto com menos de 8MB.',
      updatedTitle: 'Foto Atualizada!',
      updatedMsg: 'A sua fotografia foi otimizada para impressão nítida no documento.',
      errorTitle: 'Erro ao Processar Foto',
      errorMsg: 'Não foi possível carregar a imagem selecionada.',
      headerTitle: 'Foto de Perfil Profissional',
      headerSubtitle: 'Padrão Europeu Europass, Criativo e Minimalista',
      activePhotoTitle: 'Foto ativa no currículo',
      loadedLabel: 'Foto Carregada',
      emptyLabel: 'Sem Foto Configurada',
      removeBtn: 'Remover',
      visibleLabel: 'Visível no CV',
      hiddenLabel: 'Ocultada no CV',
      uploadHint: 'Carregue a sua foto ou escolha um avatar profissional para testar.',
      uploadBtn: 'Carregar Foto do Meu Computador / Telemóvel',
      formatsHint: 'Formatos recomendados: JPG, PNG ou WEBP (máx. 3MB). Fundo neutro e iluminação suave.',
      avatarsTitle: 'Ou selecione um avatar executivo ilustrativo:',
      complianceTipLabel: 'Dica de Conformidade:',
      complianceTipText:
        'A foto será exibida nos modelos Europeu Europass, Criativo Split e Minimalista Nórdico. Se selecionar Harvard ou ATS Estrito, o sistema ocultará a foto para evitar desclassificação nos EUA/UK.',
      doneBtn: 'Concluir & Aplicar',
      avatarNames: {
        exec_male: 'Executivo Formal',
        exec_female: 'Executiva Líder',
        tech_pro: 'Tech / Corporativo',
        intl_female: 'Consultora Internacional'
      }
    },
    watermark: {
      topLine1: 'CURRÍCULO ESTRATÉGICO · PRÉ-VISUALIZAÇÃO',
      topLine2: "DOCUMENTO NÃO LICENCIADO · ATIVE UM PLANO PRO PARA REMOVER A MARCA D'ÁGUA",
      midLine1: 'DOCUMENTO NÃO OFICIAL · SEM VALIDADE EXECUTIVA',
      midLine2: 'DOWNLOADS BLOQUEADOS · REQUER SUBSCRIÇÃO PRO OU EXECUTIVA',
      botLine1: 'CURRÍCULO ESTRATÉGICO · PRÉ-VISUALIZAÇÃO',
      botLine2: 'VERSÃO PROTEGIDA · REGISTO & PLANO ATIVO NECESSÁRIOS PARA DOWNLOAD'
    },
    expertTip: {
      ariaPrefix: 'Dica de Especialista:',
      badge: 'Dica ATS',
      closeAria: 'Fechar dica',
      exampleLabel: 'Exemplo recomendado:'
    },
    editor: {
      steps: {
        profile: { mobile: 'Perfil', short: 'Perfil & Resumo' },
        career: { mobile: 'Cargos', short: 'Experiência' },
        credentials: { mobile: 'Skills', short: 'Formação & Skills' },
        structure: { mobile: 'Estrutura', short: 'Estrutura' }
      },
      undoTitle: 'Desfazer última alteração (Ctrl+Z)',
      undoAria: 'Desfazer',
      redoTitle: 'Refazer alteração (Ctrl+Y)',
      redoAria: 'Refazer',
      saveTitle: 'Guardar currículo na nuvem',
      saving: 'A guardar...',
      save: 'Salvar',
      words: 'palavras',
      pagesA4: 'pág A4',
      reading: 'Leitura',
      checklistBtn: 'Checklist',
      completeAction: 'Completar',
      checklistItems: [
        {
          label: 'Dados Pessoais & Contactos',
          recommendation: 'Preencha nome completo, e-mail e telefone de contacto direto.'
        },
        {
          label: 'Resumo Profissional Estratégico',
          recommendation: 'Adicione um resumo executivo com pelo menos 3 linhas sobre a sua proposta de valor.'
        },
        {
          label: 'Experiência Relevante com Conquistas',
          recommendation: 'Descreva pelo menos 2 cargos com 2 ou mais realizações cada.'
        },
        {
          label: 'Métricas Quantificáveis nos Destaques',
          recommendation: 'Adicione percentagens (%) ou números mensuráveis em pelo menos 2 realizações.'
        },
        {
          label: 'Competências Chave Estruturadas',
          recommendation: 'Liste 3 a 6 competências essenciais para a vaga desejada.'
        },
        {
          label: 'Formação Académica',
          recommendation: 'Inclua o seu grau académico mais relevante e instituição.'
        },
        {
          label: 'Idiomas & Nível de Proficiência',
          recommendation: 'Adicione idiomas e grau de fluência (padrão CEFR ou descritivo).'
        }
      ],
      toasts: {
        snippetAppliedTitle: 'Exemplo Aplicado',
        snippetAppliedMsg: 'Título e resumo preenchidos com o modelo "{name}".',
        bulletsAddedTitle: 'Conquistas Inseridas',
        bulletsAddedMsg: 'Realizações de "{name}" adicionadas ao cargo.',
        authPromptSave: 'Crie uma conta gratuita ou inicie sessão para guardar o seu currículo e progresso na nuvem.',
        pricingPromptSave: 'A gravação de currículos na nuvem e edição avançada requer um plano Pro ou Executivo VIP ativo.',
        planRequiredTitle: 'Plano Requerido',
        planRequiredMsg: 'A gravação e personalização do currículo requer um plano pago ativo.',
        defaultCvTitle: 'Meu Currículo Executivo',
        savedTitle: 'Progresso Salvo!',
        savedMsg: 'Currículo guardado na nuvem ({exps} cargos, {comps} competências).',
        saveErrorTitle: 'Erro ao Salvar',
        savePermError: 'Sem permissão na nuvem para guardar esta versão. Verifique a sua sessão.',
        saveGenericError: 'Não foi possível guardar a nova versão do currículo no momento.',
        orderResetTitle: 'Ordem Restaurada',
        orderResetMsg: 'Secções repostas na ordem executiva recomendada.',
        copyRoleSuffix: '(Cópia)',
        duplicatedTitle: 'Cargo Duplicado',
        duplicatedMsg: 'Pode editar o novo item logo abaixo.',
        defaultTraining: 'Certificação Profissional (Ex: PMP, Scrum, AWS)',
        clusterPresentTitle: 'Competências Já Presentes',
        clusterPresentMsg: 'O pacote "{name}" já está incluído.',
        clusterAddedTitle: 'Pacote Adicionado',
        clusterAddedMsg: '{count} grupo(s) de "{name}" adicionados.',
        defaultNewLang: 'Inglês',
        defaultNewLangLevel: 'C1 - Avançado Profissional'
      },
      stage1: {
        idTitle: 'Identificação & Contactos',
        idTipTitle: 'Cabeçalho & Contactos ATS',
        idTipText: 'Mantenha os contactos limpos, sem ícones gráficos no texto, e garanta consistência com o LinkedIn.',
        hidePhoto: 'Ocultar foto',
        showPhoto: 'Mostrar foto',
        photoLabel: 'Foto',
        addPhoto: 'Adicionar Foto',
        fullName: 'Nome Completo',
        fullNamePh: 'Ex: João da Silva Santos',
        jobTitle: 'Título Profissional',
        jobTitleTipTitle: 'Título Profissional (Headline)',
        jobTitleTipText: 'Espelhe exatamente o título da vaga pretendida para maximizar a relevância nos robôs ATS.',
        jobTitlePh: 'Ex: Diretor de Operações / Head de Produto',
        email: 'E-mail Profissional',
        invalidEmail: 'Formato inválido',
        emailPh: 'Ex: joao.silva@empresa.com',
        phone: 'Telefone / WhatsApp',
        phonePh: 'Ex: +351 912 345 678',
        location: 'Localização (Cidade, País)',
        locationPh: 'Ex: Lisboa, Portugal',
        linkedin: 'LinkedIn',
        linkedinPh: 'Ex: linkedin.com/in/joaosilva',
        website: 'Portfólio ou Website',
        websitePh: 'Ex: joaosantos.com ou github.com/joaosantos',
        addWebsite: 'Adicionar Portfólio ou Website (Opcional)',
        summaryTitle: 'Resumo Executivo',
        summaryTipTitle: 'Sumário de Alto Impacto',
        summaryTipText: 'Escreva 3 a 5 linhas (50–120 palavras) com anos de experiência, especialidade e 1 a 2 resultados mensuráveis.',
        summaryTipExample: 'Diretor de Operações com 12+ anos em logística. Reduziu custos operacionais em 28% via Lean Six Sigma.',
        examplesBtn: 'Exemplos',
        aiOptimizeBtn: 'Otimizar com IA',
        snippetLibraryTitle: 'Biblioteca de Exemplos por Profissão',
        close: 'Fechar',
        useTitleSummary: 'Usar Título & Resumo',
        summaryPh: 'Ex: Profissional com 10+ anos em gestão de operações e transformação digital...',
        wordSingular: 'palavra',
        wordPlural: 'palavras',
        chars: 'caracteres',
        lenIdeal: 'Extensão ideal para leitura e ATS',
        lenLong: 'Tente sintetizar abaixo de 130 palavras',
        lenShort: 'Recomendado: 50 a 120 palavras com métricas'
      },
      stage2: {
        title: 'Experiência Profissional',
        tipTitle: 'Ordem Cronológica Reversa',
        tipText: 'Liste os cargos do mais recente para o mais antigo e priorize realizações com métricas (Google XYZ).',
        achievementsCount: 'realizações',
        withMetricsCount: 'com métricas numéricas',
        achievementTemplatesDesktop: 'Modelos de Conquistas',
        achievementTemplatesMobile: 'Modelos',
        expandAll: 'Expandir todos',
        collapseAll: 'Recolher todos',
        addRole: 'Adicionar Cargo',
        insertByProfessionTitle: 'Inserir Realizações Prontas por Profissão',
        metricsUnit: 'métricas',
        emptyTitle: 'Nenhum cargo registado',
        emptySubtitle: 'Adicione as suas posições mais relevantes dos últimos 10–15 anos.',
        addFirstRole: '+ Adicionar Primeiro Cargo',
        newRoleFallback: 'Novo Cargo',
        companyFallback: 'Empresa',
        pointsUnit: 'pontos',
        metricUnit: 'métrica(s)',
        moveUpTitle: 'Mover cargo para cima',
        moveDownTitle: 'Mover cargo para baixo',
        duplicateTitle: 'Duplicar cargo',
        expandTitle: 'Expandir',
        collapseTitle: 'Recolher',
        deleteRoleTitle: 'Remover cargo',
        roleLabel: 'Cargo',
        rolePh: 'Ex: Diretor de Operações',
        companyLabel: 'Empresa / Instituição',
        companyPh: 'Ex: Global Tech Corp',
        periodLabel: 'Período',
        periodPh: 'Ex: 2021 – Presente',
        locationLabel: 'Localização',
        locationPh: 'Ex: Lisboa, Portugal / Remoto',
        donorLabel: 'Projeto ou Financiador (Opcional)',
        donorPh: 'Ex: Financiado por Banco Mundial / Programa UE',
        addDonorBtn: 'Adicionar Projeto / Financiador',
        highlightsLabel: 'Realizações & Métricas',
        xyzTipTitle: 'Fórmula Google XYZ',
        xyzTipText: "Estruture como: 'Alcancei [X], medido por [Y], através de [Z]'. Use verbos de ação e números.",
        actionVerbsBtn: 'Verbos de Ação',
        addPointBtn: 'Adicionar Ponto',
        verbsDrawerTitle: 'Inserir Verbo Executivo de Impacto',
        movePointUpTitle: 'Mover ponto para cima',
        movePointDownTitle: 'Mover ponto para baixo',
        deletePointTitle: 'Remover ponto',
        highlightPh: 'Ex: Reduziu custos operacionais em 24% ao automatizar fluxos de triagem...',
        hasMetricHint: 'Contém métrica quantificável',
        needsMetricHint: 'Dica: adicione %, $, horas ou nº de equipa',
        charsShort: 'car.'
      },
      stage3: {
        tabAcademic: 'Formação & Cursos',
        tabSkills: 'Skills & Idiomas',
        eduTitle: 'Formação Académica',
        addBtn: 'Adicionar',
        noEdu: 'Nenhuma formação académica adicionada.',
        degreeLabel: 'Grau / Curso',
        degreePh: 'Ex: MBA / Mestrado em Gestão',
        institutionLabel: 'Instituição',
        institutionPh: 'Ex: Universidade Católica',
        periodLabel: 'Período',
        periodPh: 'Ex: 2016 – 2020',
        moveUp: 'Mover para cima',
        moveDown: 'Mover para baixo',
        deleteEdu: 'Remover formação',
        honorsPh: 'Distinção, Média ou Tese (Opcional — ex: Cum Laude · Média 18/20)',
        certsTitle: 'Certificações & Cursos',
        certInputPh: 'Escreva uma certificação e prima Enter (Ex: PMP®, AWS Solutions Architect)...',
        noCerts: 'Nenhuma certificação adicionada.',
        certItemPh: 'Ex: PMP® - Project Management Professional',
        deleteCert: 'Remover curso',
        compTitle: 'Competências-Chave',
        compTipTitle: 'Palavras-Chave ATS',
        compTipText: 'Espelhe as competências técnicas e ferramentas exactas pedidas na vaga.',
        clustersBtn: 'Pacotes por Área',
        clustersDrawerTitle: 'Inserir Grupos de Competências por Área',
        noComp: 'Nenhuma competência adicionada.',
        compCatPh: 'Categoria (Ex: Liderança & Governança)',
        compDescPh: 'Palavras-chave separadas por vírgula (Ex: OKRs, P&L, SAP, Power BI...)',
        deleteComp: 'Remover competência',
        langTitle: 'Idiomas & Proficiência',
        addLangBtn: 'Adicionar Idioma',
        noLang: 'Nenhum idioma adicionado.',
        langPh: 'Ex: Inglês',
        deleteLang: 'Remover idioma',
        cefrLevels: [
          'Nativo / Materno',
          'C2 - Fluência Plena',
          'C1 - Avançado Profissional',
          'B2 - Intermédio Independente',
          'B1 - Intermédio Básico'
        ]
      },
      stage4: {
        styleTitle: 'Modelo, Tipografia & Cor',
        accentColorLabel: 'Cor de destaque:',
        selectColorAria: 'Selecionar cor de destaque',
        typographyLabel: 'Tipografia do Documento (A4 & Word):',
        densityLabel: 'Densidade de Espaçamento:',
        densityCompact: '1 Pág Compacto',
        densityNormal: 'Padrão',
        densityRelaxed: 'Confortável',
        sectionsTitle: 'Ordem & Visibilidade das Secções',
        sectionsCount: 'secções',
        resetOrderTitle: 'Repor ordem executiva recomendada',
        resetOrderBtn: 'Repor',
        hideSectionTitle: 'Ocultar do documento',
        showSectionTitle: 'Exibir no documento',
        refsTitle: 'Referências',
        noRefs: 'Opcional — adicione apenas se a vaga solicitar referências diretas.',
        refNamePh: 'Nome',
        refInstPh: 'Empresa / Cargo',
        refContactPh: 'E-mail ou Telefone',
        deleteRef: 'Remover referência',
        coverCtaTitle: 'Carta de Apresentação Alinhada ao CV',
        coverCtaSubtitle: 'Gere e baixe a carta no mesmo padrão visual do seu currículo.',
        coverCtaBtn: 'Abrir Carta',
        accentColors: {
          '#0f172a': 'Grafite Executivo',
          '#1e3a8a': 'Azul Corporativo',
          '#1d4ed8': 'Azul Europeu',
          '#065f46': 'Verde Esmeralda',
          '#7c3aed': 'Púrpura Criativo',
          '#831843': 'Harvard Burgundy',
          '#0f766e': 'Teal Corporativo'
        },
        fonts: {
          default: { label: 'Padrão do Modelo', hint: 'Automático' },
          jakarta: { label: 'Plus Jakarta Sans', hint: 'Moderna' },
          garamond: { label: 'EB Garamond', hint: 'Editorial' },
          cinzel: { label: 'Cinzel Clássico', hint: 'Executiva' },
          mono: { label: 'IBM Plex Mono', hint: 'Técnica / ATS' }
        },
        sectionNames: {
          summary: 'Resumo Profissional',
          competencies: 'Competências Chave',
          experiences: 'Experiência Profissional',
          educations: 'Formação Académica',
          trainings: 'Certificações & Cursos',
          languages: 'Idiomas & Proficiência',
          references: 'Referências Profissionais'
        }
      },
      footer: {
        prev: 'Anterior',
        stepOf: 'Etapa {current} de {total}',
        nextPrefix: 'Próximo:',
        finishSave: 'Concluir & Salvar'
      }
    }
  },
  en: {
    advisor: {
      authPrompt: 'Sign in or create an account to use this template in the editor.',
      pricingPrompt:
        'Applying international executive templates (Harvard, Strict ATS, Tech Modern) is exclusive to Pro ($8/mo) and Executive VIP ($12/mo) subscribers.',
      modalTitle: 'Strategic Guide & Resume Template Catalog',
      badge: 'International & ATS 2026',
      subtitle: 'Discover when, where, and why to use each format: with photo, no photo, and regional hiring rules.',
      goldRuleTitle: 'Golden Photo Rule:',
      goldRuleText:
        'Use a photo in Continental Europe & LATAM. Hide the photo in the US, UK, and automated ATS portals (Workday, Greenhouse) to avoid automatic filtering.',
      hideRule: 'Hide Full Explanation',
      showRule: 'Why Are Photos Prohibited in the US?',
      lawTitle: 'International Labor Law & Anti-Bias Screening',
      noPhotoTitle: 'US, UK, Canada & Australia (No Photo)',
      noPhotoDesc:
        'US EEOC rules and UK equality regulations enforce strict anti-discrimination standards. HR teams and ATS parsers immediately discard resumes with photos to prevent unconscious bias.',
      withPhotoTitle: 'Continental Europe, Brazil & Lusophone Markets (With Photo)',
      withPhotoDesc:
        'In Germany, France, Portugal, Spain, and Switzerland, the Europass standard treats a clean corporate studio headshot as a mark of professionalism and transparency.',
      filterAll: 'All',
      filterWithPhoto: 'With Photo',
      filterNoPhoto: 'No Photo / ATS',
      filterExec: 'Executive & Tech',
      activeTemplateLabel: 'Active template:',
      whenToUseLabel: '🎯 When to Use:',
      whereToUseLabel: '🌍 Where to Use / Regions:',
      photoRuleLabel: 'Photo Policy',
      currentModelBtn: 'Current Template',
      applyModelBtn: 'Apply Template',
      activateModelBtn: 'Activate This Template on My Resume',
      deepWhenTitle: 'When & Who Should Use It:',
      deepWhereTitle: 'Regions & Market Acceptance:',
      deepPhotoTitle: 'Photo Policy Rationale:',
      deepIndustriesTitle: 'Best For Industries:',
      recruiterTipTitle: 'Recruiter Pro Tip:',
      exportCompatNote: 'Compatible with clean Word (.docx) & A4 PDF export.',
      footerValidationNote: 'Templates validated against international HR standards and ATS parsers.',
      closeBtn: 'Close'
    },
    dropdown: {
      triggerTitle: 'Select resume template with or without photo',
      withPhotoTag: 'With Photo',
      noPhotoTag: 'No Photo (ATS)',
      whereToUseBtn: 'Where to Use?',
      whereToUseTitle: 'View guide on when and where to use each template',
      menuTitle: 'Official Resume Templates',
      menuSubtitle: 'Choose the ideal format for your target country and industry',
      fullGuideBtn: 'Full Guide',
      photoGroupTitle: 'With Photo Templates (Continental Europe & Design)',
      noPhotoGroupTitle: 'No Photo Templates (Strict ATS US/UK & Executive)',
      footerPrompt: 'Unsure about country or ATS rules?',
      footerLink: 'View Full Guide'
    },
    photoModal: {
      fileTooLargeTitle: 'File Too Large',
      fileTooLargeMsg: 'Please select a photo smaller than 8MB.',
      updatedTitle: 'Photo Updated!',
      updatedMsg: 'Your headshot has been optimized for crisp document printing.',
      errorTitle: 'Photo Processing Error',
      errorMsg: 'Could not load the selected image file.',
      headerTitle: 'Professional Profile Photo',
      headerSubtitle: 'European Europass, Creative & Minimalist Standard',
      activePhotoTitle: 'Photo active on resume',
      loadedLabel: 'Photo Uploaded',
      emptyLabel: 'No Photo Configured',
      removeBtn: 'Remove',
      visibleLabel: 'Visible on Resume',
      hiddenLabel: 'Hidden on Resume',
      uploadHint: 'Upload your headshot or select a sample executive avatar to preview.',
      uploadBtn: 'Upload Photo from Computer / Phone',
      formatsHint: 'Recommended: JPG, PNG, or WEBP (max 3MB). Neutral background and soft lighting.',
      avatarsTitle: 'Or select a sample executive avatar:',
      complianceTipLabel: 'Compliance Tip:',
      complianceTipText:
        'Your photo displays on European Europass, Creative Split, and Nordic Minimalist templates. On Harvard or Strict ATS templates, it is automatically hidden for US/UK compliance.',
      doneBtn: 'Done & Apply',
      avatarNames: {
        exec_male: 'Formal Executive',
        exec_female: 'Executive Leader',
        tech_pro: 'Tech / Corporate',
        intl_female: 'Global Consultant'
      }
    },
    watermark: {
      topLine1: 'STRATEGIC RESUME · PREVIEW',
      topLine2: 'UNLICENSED DOCUMENT · ACTIVATE A PRO PLAN TO REMOVE WATERMARK',
      midLine1: 'UNOFFICIAL PREVIEW · NOT FOR SUBMISSION',
      midLine2: 'DOWNLOADS LOCKED · REQUIRES PRO OR EXECUTIVE SUBSCRIPTION',
      botLine1: 'STRATEGIC RESUME · PREVIEW',
      botLine2: 'PROTECTED DRAFT · ACCOUNT & ACTIVE PLAN REQUIRED FOR DOWNLOAD'
    },
    expertTip: {
      ariaPrefix: 'Expert Tip:',
      badge: 'ATS Tip',
      closeAria: 'Close tip',
      exampleLabel: 'Recommended example:'
    },
    editor: {
      steps: {
        profile: { mobile: 'Profile', short: 'Profile & Summary' },
        career: { mobile: 'Roles', short: 'Experience' },
        credentials: { mobile: 'Skills', short: 'Education & Skills' },
        structure: { mobile: 'Layout', short: 'Layout & Style' }
      },
      undoTitle: 'Undo last change (Ctrl+Z)',
      undoAria: 'Undo',
      redoTitle: 'Redo change (Ctrl+Y)',
      redoAria: 'Redo',
      saveTitle: 'Save resume to cloud',
      saving: 'Saving...',
      save: 'Save',
      words: 'words',
      pagesA4: 'p. A4',
      reading: 'Read',
      checklistBtn: 'Checklist',
      completeAction: 'Complete',
      checklistItems: [
        {
          label: 'Personal Details & Contacts',
          recommendation: 'Fill in your full name, email address, and direct phone number.'
        },
        {
          label: 'Strategic Executive Summary',
          recommendation: 'Add a 3+ line executive summary highlighting your value proposition.'
        },
        {
          label: 'Relevant Experience & Achievements',
          recommendation: 'Add at least 2 roles with 2 or more measurable bullet points each.'
        },
        {
          label: 'Quantifiable Metrics in Highlights',
          recommendation: 'Include percentages (%) or concrete numbers in at least 2 bullet points.'
        },
        {
          label: 'Structured Core Competencies',
          recommendation: 'List 3 to 6 core skill groups matching the target job posting.'
        },
        {
          label: 'Academic Education',
          recommendation: 'Include your highest relevant degree and institution.'
        },
        {
          label: 'Languages & Proficiency',
          recommendation: 'Add spoken languages and proficiency levels (CEFR or descriptive).'
        }
      ],
      toasts: {
        snippetAppliedTitle: 'Example Applied',
        snippetAppliedMsg: 'Title and summary pre-filled from "{name}".',
        bulletsAddedTitle: 'Achievements Inserted',
        bulletsAddedMsg: 'Bullet points from "{name}" added to your latest role.',
        authPromptSave: 'Create a free account or sign in to save your resume and progress to the cloud.',
        pricingPromptSave: 'Cloud saving and advanced editing require an active Pro or Executive VIP plan.',
        planRequiredTitle: 'Plan Required',
        planRequiredMsg: 'Saving and customizing resumes requires an active paid plan.',
        defaultCvTitle: 'My Executive Resume',
        savedTitle: 'Progress Saved!',
        savedMsg: 'Resume saved to cloud ({exps} roles, {comps} skills).',
        saveErrorTitle: 'Save Error',
        savePermError: 'Cloud permission error while saving. Please verify your session.',
        saveGenericError: 'Could not save this resume version right now.',
        orderResetTitle: 'Order Restored',
        orderResetMsg: 'Sections restored to the recommended executive order.',
        copyRoleSuffix: '(Copy)',
        duplicatedTitle: 'Role Duplicated',
        duplicatedMsg: 'You can edit the duplicated role right below.',
        defaultTraining: 'Professional Certification (e.g., PMP, Scrum, AWS)',
        clusterPresentTitle: 'Skills Already Present',
        clusterPresentMsg: 'The "{name}" skill bundle is already included.',
        clusterAddedTitle: 'Bundle Added',
        clusterAddedMsg: '{count} skill group(s) from "{name}" added.',
        defaultNewLang: 'English',
        defaultNewLangLevel: 'C1 - Advanced Professional'
      },
      stage1: {
        idTitle: 'Identity & Contact Details',
        idTipTitle: 'ATS Header & Contacts',
        idTipText: 'Keep contact details clean without text icons, and keep them consistent with LinkedIn.',
        hidePhoto: 'Hide photo',
        showPhoto: 'Show photo',
        photoLabel: 'Photo',
        addPhoto: 'Add Photo',
        fullName: 'Full Name',
        fullNamePh: 'e.g., Johnathan Miller',
        jobTitle: 'Professional Headline',
        jobTitleTipTitle: 'Target Role Headline',
        jobTitleTipText: 'Mirror the exact target job title to maximize ATS search relevance.',
        jobTitlePh: 'e.g., Chief Operating Officer / Head of Product',
        email: 'Professional Email',
        invalidEmail: 'Invalid format',
        emailPh: 'e.g., john.miller@company.com',
        phone: 'Phone / WhatsApp',
        phonePh: 'e.g., +1 415 555 0192',
        location: 'Location (City, Country)',
        locationPh: 'e.g., London, UK',
        linkedin: 'LinkedIn',
        linkedinPh: 'e.g., linkedin.com/in/johnmiller',
        website: 'Portfolio or Website',
        websitePh: 'e.g., johnmiller.dev or github.com/johnmiller',
        addWebsite: 'Add Portfolio or Website (Optional)',
        summaryTitle: 'Executive Summary',
        summaryTipTitle: 'High-Impact Summary',
        summaryTipText: 'Write 3–5 lines (50–120 words) covering years of experience, specialty, and 1–2 measurable outcomes.',
        summaryTipExample: 'Operations Director with 12+ years in logistics. Cut operating costs by 28% via Lean Six Sigma.',
        examplesBtn: 'Examples',
        aiOptimizeBtn: 'Optimize with AI',
        snippetLibraryTitle: 'Role Example Library',
        close: 'Close',
        useTitleSummary: 'Use Title & Summary',
        summaryPh: 'e.g., Executive leader with 10+ years driving operations and digital transformation...',
        wordSingular: 'word',
        wordPlural: 'words',
        chars: 'characters',
        lenIdeal: 'Ideal length for recruiters & ATS',
        lenLong: 'Try keeping it concise under 130 words',
        lenShort: 'Recommended: 50–120 words with metrics'
      },
      stage2: {
        title: 'Professional Experience',
        tipTitle: 'Reverse Chronological Order',
        tipText: 'List roles from most recent to oldest and prioritize measurable Google XYZ impact.',
        achievementsCount: 'achievements',
        withMetricsCount: 'with numeric metrics',
        achievementTemplatesDesktop: 'Achievement Snippets',
        achievementTemplatesMobile: 'Snippets',
        expandAll: 'Expand all',
        collapseAll: 'Collapse all',
        addRole: 'Add Role',
        insertByProfessionTitle: 'Insert Pre-Written Achievements by Role',
        metricsUnit: 'metrics',
        emptyTitle: 'No roles added yet',
        emptySubtitle: 'Add your most relevant positions from the past 10–15 years.',
        addFirstRole: '+ Add First Role',
        newRoleFallback: 'New Role',
        companyFallback: 'Company',
        pointsUnit: 'bullets',
        metricUnit: 'metric(s)',
        moveUpTitle: 'Move role up',
        moveDownTitle: 'Move role down',
        duplicateTitle: 'Duplicate role',
        expandTitle: 'Expand',
        collapseTitle: 'Collapse',
        deleteRoleTitle: 'Remove role',
        roleLabel: 'Job Title',
        rolePh: 'e.g., Director of Operations',
        companyLabel: 'Company / Organization',
        companyPh: 'e.g., Global Tech Corp',
        periodLabel: 'Period',
        periodPh: 'e.g., 2021 – Present',
        locationLabel: 'Location',
        locationPh: 'e.g., New York, NY / Remote',
        donorLabel: 'Project or Sponsor (Optional)',
        donorPh: 'e.g., Funded by World Bank / Horizon EU',
        addDonorBtn: 'Add Project / Sponsor',
        highlightsLabel: 'Achievements & Metrics',
        xyzTipTitle: 'Google XYZ Formula',
        xyzTipText: "Structure bullets as: 'Accomplished [X], as measured by [Y], by doing [Z]'. Use strong action verbs and numbers.",
        actionVerbsBtn: 'Action Verbs',
        addPointBtn: 'Add Bullet',
        verbsDrawerTitle: 'Insert High-Impact Action Verb',
        movePointUpTitle: 'Move bullet up',
        movePointDownTitle: 'Move bullet down',
        deletePointTitle: 'Remove bullet',
        highlightPh: 'e.g., Reduced operating costs by 24% by automating screening workflows...',
        hasMetricHint: 'Contains quantifiable metric',
        needsMetricHint: 'Tip: add %, $, hours, or team size',
        charsShort: 'chars'
      },
      stage3: {
        tabAcademic: 'Education & Certs',
        tabSkills: 'Skills & Languages',
        eduTitle: 'Academic Education',
        addBtn: 'Add',
        noEdu: 'No academic education added.',
        degreeLabel: 'Degree / Program',
        degreePh: 'e.g., MBA / M.Sc. in Management',
        institutionLabel: 'Institution',
        institutionPh: 'e.g., London Business School',
        periodLabel: 'Period',
        periodPh: 'e.g., 2016 – 2020',
        moveUp: 'Move up',
        moveDown: 'Move down',
        deleteEdu: 'Remove education',
        honorsPh: 'Honors, GPA, or Thesis (Optional — e.g., Cum Laude · GPA 3.9/4.0)',
        certsTitle: 'Certifications & Courses',
        certInputPh: 'Type a certification and press Enter (e.g., PMP®, AWS Solutions Architect)...',
        noCerts: 'No certifications added.',
        certItemPh: 'e.g., PMP® - Project Management Professional',
        deleteCert: 'Remove course',
        compTitle: 'Core Competencies',
        compTipTitle: 'ATS Keywords',
        compTipText: 'Mirror the exact technical skills and tools requested in the job description.',
        clustersBtn: 'Skill Bundles',
        clustersDrawerTitle: 'Insert Competency Bundles by Area',
        noComp: 'No competencies added.',
        compCatPh: 'Category (e.g., Leadership & Governance)',
        compDescPh: 'Comma-separated keywords (e.g., OKRs, P&L, SAP, Power BI...)',
        deleteComp: 'Remove competency',
        langTitle: 'Languages & Proficiency',
        addLangBtn: 'Add Language',
        noLang: 'No languages added.',
        langPh: 'e.g., English',
        deleteLang: 'Remove language',
        cefrLevels: [
          'Native / Bilingual',
          'C2 - Full Proficiency',
          'C1 - Advanced Professional',
          'B2 - Upper Intermediate',
          'B1 - Intermediate'
        ]
      },
      stage4: {
        styleTitle: 'Template, Typography & Color',
        accentColorLabel: 'Accent color:',
        selectColorAria: 'Select accent color',
        typographyLabel: 'Document Typography (A4 & Word):',
        densityLabel: 'Spacing Density:',
        densityCompact: '1-Page Compact',
        densityNormal: 'Standard',
        densityRelaxed: 'Spacious',
        sectionsTitle: 'Section Order & Visibility',
        sectionsCount: 'sections',
        resetOrderTitle: 'Restore recommended executive order',
        resetOrderBtn: 'Reset',
        hideSectionTitle: 'Hide from document',
        showSectionTitle: 'Show in document',
        refsTitle: 'References',
        noRefs: 'Optional — add only if requested by the employer.',
        refNamePh: 'Name',
        refInstPh: 'Company / Role',
        refContactPh: 'Email or Phone',
        deleteRef: 'Remove reference',
        coverCtaTitle: 'Matching Executive Cover Letter',
        coverCtaSubtitle: 'Draft and export a cover letter matching your resume design.',
        coverCtaBtn: 'Open Cover Letter',
        accentColors: {
          '#0f172a': 'Executive Graphite',
          '#1e3a8a': 'Corporate Navy',
          '#1d4ed8': 'European Blue',
          '#065f46': 'Emerald Green',
          '#7c3aed': 'Creative Violet',
          '#831843': 'Harvard Burgundy',
          '#0f766e': 'Corporate Teal'
        },
        fonts: {
          default: { label: 'Template Default', hint: 'Automatic' },
          jakarta: { label: 'Plus Jakarta Sans', hint: 'Modern' },
          garamond: { label: 'EB Garamond', hint: 'Editorial' },
          cinzel: { label: 'Cinzel Classic', hint: 'Executive' },
          mono: { label: 'IBM Plex Mono', hint: 'Tech / ATS' }
        },
        sectionNames: {
          summary: 'Executive Summary',
          competencies: 'Core Competencies',
          experiences: 'Professional Experience',
          educations: 'Education',
          trainings: 'Certifications & Courses',
          languages: 'Languages & Proficiency',
          references: 'Professional References'
        }
      },
      footer: {
        prev: 'Previous',
        stepOf: 'Step {current} of {total}',
        nextPrefix: 'Next:',
        finishSave: 'Finish & Save'
      }
    }
  },
  es: {
    advisor: {
      authPrompt: 'Inicia sesión o crea una cuenta para usar esta plantilla en el editor.',
      pricingPrompt:
        'Las plantillas ejecutivas internacionales (Harvard, ATS Estricto, Tech Modern) son exclusivas para suscriptores Pro ($8/mes) y Ejecutivo VIP ($12/mes).',
      modalTitle: 'Guía Estratégica y Catálogo de Plantillas de CV',
      badge: 'Internacional & ATS 2026',
      subtitle: 'Descubre cuándo, dónde y por qué usar cada formato: con foto, sin foto y reglas por país.',
      goldRuleTitle: 'Regla de Oro de la Foto:',
      goldRuleText:
        'Usa foto en Europa Continental y LATAM. Oculta la foto en EE.UU., Reino Unido y portales ATS (Workday, Greenhouse) para evitar descartes automáticos.',
      hideRule: 'Ocultar Explicación Completa',
      showRule: '¿Por qué está prohibida la foto en EE.UU.?',
      lawTitle: 'Legislación Laboral Internacional y Sesgos de Selección',
      noPhotoTitle: 'EE.UU., Reino Unido, Canadá y Australia (Sin Foto)',
      noPhotoDesc:
        'Las normas de la EEOC en EE.UU. y la ley británica exigen neutralidad antidiscriminatoria. Los sistemas ATS y RR.HH. descartan CVs con fotografía para evitar sesgos inconscientes.',
      withPhotoTitle: 'Europa Continental, Brasil y LATAM (Con Foto)',
      withPhotoDesc:
        'En Alemania, Francia, España, Portugal y Suiza, el estándar Europass valora una fotografía profesional de estudio como signo de transparencia y presentación.',
      filterAll: 'Todos',
      filterWithPhoto: 'Con Foto',
      filterNoPhoto: 'Sin Foto / ATS',
      filterExec: 'Ejecutivos y Sector',
      activeTemplateLabel: 'Plantilla en uso:',
      whenToUseLabel: '🎯 Cuándo Usar:',
      whereToUseLabel: '🌍 Dónde Usar / Regiones:',
      photoRuleLabel: 'Regla de Fotografía',
      currentModelBtn: 'Plantilla Actual',
      applyModelBtn: 'Aplicar Plantilla',
      activateModelBtn: 'Activar Esta Plantilla en Mi CV',
      deepWhenTitle: 'Cuándo y Para Quién Usar:',
      deepWhereTitle: 'Dónde Usar y Aceptación Regional:',
      deepPhotoTitle: 'Justificación de la Foto (o Ausencia):',
      deepIndustriesTitle: 'Sectores Ideales:',
      recruiterTipTitle: 'Consejo Clave del Reclutador:',
      exportCompatNote: 'Compatible con exportación Word (.docx) e Impresión PDF sin cortes.',
      footerValidationNote: 'Formatos validados según estándares internacionales de RR.HH. y sistemas ATS.',
      closeBtn: 'Cerrar'
    },
    dropdown: {
      triggerTitle: 'Seleccionar plantilla de CV con o sin foto',
      withPhotoTag: 'Con Foto',
      noPhotoTag: 'Sin Foto (ATS)',
      whereToUseBtn: '¿Dónde Usar?',
      whereToUseTitle: 'Ver guía sobre cuándo y dónde usar cada plantilla',
      menuTitle: 'Plantillas Oficiales de Currículum',
      menuSubtitle: 'Elige el formato ideal para el país y sector de tu vacante',
      fullGuideBtn: 'Guía Completa',
      photoGroupTitle: 'Plantillas Con Foto (Europa Continental & Diseño)',
      noPhotoGroupTitle: 'Plantillas Sin Foto (ATS Estricto EE.UU./UK & Ejecutivo)',
      footerPrompt: '¿Dudas sobre el país o ATS de la vacante?',
      footerLink: 'Ver Guía Completa'
    },
    photoModal: {
      fileTooLargeTitle: 'Archivo Muy Grande',
      fileTooLargeMsg: 'Por favor elige una foto inferior a 8MB.',
      updatedTitle: '¡Foto Actualizada!',
      updatedMsg: 'Tu fotografía se optimizó para una impresión nítida.',
      errorTitle: 'Error al Procesar Foto',
      errorMsg: 'No se pudo cargar la imagen seleccionada.',
      headerTitle: 'Foto de Perfil Profesional',
      headerSubtitle: 'Estándar Europeo Europass, Creativo y Minimalista',
      activePhotoTitle: 'Foto activa en el currículum',
      loadedLabel: 'Foto Cargada',
      emptyLabel: 'Sin Foto Configurada',
      removeBtn: 'Eliminar',
      visibleLabel: 'Visible en el CV',
      hiddenLabel: 'Oculta en el CV',
      uploadHint: 'Sube tu foto o elige un avatar ejecutivo para previsualizar.',
      uploadBtn: 'Subir Foto desde Ordenador / Móvil',
      formatsHint: 'Recomendado: JPG, PNG o WEBP (máx. 3MB). Fondo neutro e iluminación suave.',
      avatarsTitle: 'O selecciona un avatar ejecutivo de muestra:',
      complianceTipLabel: 'Consejo de Cumplimiento:',
      complianceTipText:
        'La foto se muestra en Europeo Europass, Creativo Split y Minimalista Nórdico. En Harvard o ATS Estricto se oculta automáticamente para cumplir las normas de EE.UU./UK.',
      doneBtn: 'Listo & Aplicar',
      avatarNames: {
        exec_male: 'Ejecutivo Formal',
        exec_female: 'Ejecutiva Líder',
        tech_pro: 'Tech / Corporativo',
        intl_female: 'Consultora Internacional'
      }
    },
    watermark: {
      topLine1: 'CURRÍCULUM ESTRATÉGICO · VISTA PREVIA',
      topLine2: 'DOCUMENTO SIN LICENCIA · ACTIVA UN PLAN PRO PARA QUITAR LA MARCA DE AGUA',
      midLine1: 'BORRADOR NO OFICIAL · SIN VALIDEZ EJECUTIVA',
      midLine2: 'DESCARGAS BLOQUEADAS · REQUIERE SUSCRIPCIÓN PRO O EJECUTIVA',
      botLine1: 'CURRÍCULUM ESTRATÉGICO · VISTA PREVIA',
      botLine2: 'VERSIÓN PROTEGIDA · REGISTRO Y PLAN ACTIVO REQUERIDOS PARA DESCARGAR'
    },
    expertTip: {
      ariaPrefix: 'Consejo de Experto:',
      badge: 'Consejo ATS',
      closeAria: 'Cerrar consejo',
      exampleLabel: 'Ejemplo recomendado:'
    },
    editor: {
      steps: {
        profile: { mobile: 'Perfil', short: 'Perfil & Resumen' },
        career: { mobile: 'Cargos', short: 'Experiencia' },
        credentials: { mobile: 'Skills', short: 'Formación & Skills' },
        structure: { mobile: 'Diseño', short: 'Diseño & Estilo' }
      },
      undoTitle: 'Deshacer último cambio (Ctrl+Z)',
      undoAria: 'Deshacer',
      redoTitle: 'Rehacer cambio (Ctrl+Y)',
      redoAria: 'Rehacer',
      saveTitle: 'Guardar currículum en la nube',
      saving: 'Guardando...',
      save: 'Guardar',
      words: 'palabras',
      pagesA4: 'pág A4',
      reading: 'Lectura',
      checklistBtn: 'Checklist',
      completeAction: 'Completar',
      checklistItems: [
        {
          label: 'Datos Personales y Contacto',
          recommendation: 'Completa tu nombre completo, correo electrónico y teléfono directo.'
        },
        {
          label: 'Resumen Profesional Estratégico',
          recommendation: 'Añade un resumen ejecutivo de al menos 3 líneas sobre tu propuesta de valor.'
        },
        {
          label: 'Experiencia Relevante con Logros',
          recommendation: 'Describe al menos 2 cargos con 2 o más logros medibles cada uno.'
        },
        {
          label: 'Métricas Cuantificables en Logros',
          recommendation: 'Incluye porcentajes (%) o cifras concretas en al menos 2 logros.'
        },
        {
          label: 'Competencias Clave Estructuradas',
          recommendation: 'Lista de 3 a 6 áreas de competencias clave para el puesto.'
        },
        {
          label: 'Formación Académica',
          recommendation: 'Incluye tu titulación más relevante e institución académica.'
        },
        {
          label: 'Idiomas y Nivel de Dominio',
          recommendation: 'Añade idiomas y nivel de fluidez (estándar MCER o descriptivo).'
        }
      ],
      toasts: {
        snippetAppliedTitle: 'Ejemplo Aplicado',
        snippetAppliedMsg: 'Título y resumen rellenados con el modelo "{name}".',
        bulletsAddedTitle: 'Logros Insertados',
        bulletsAddedMsg: 'Logros de "{name}" añadidos al cargo.',
        authPromptSave: 'Crea una cuenta gratuita o inicia sesión para guardar tu currículum en la nube.',
        pricingPromptSave: 'El guardado en la nube y edición avanzada requieren un plan Pro o Ejecutivo VIP activo.',
        planRequiredTitle: 'Plan Requerido',
        planRequiredMsg: 'Guardar y personalizar el currículum requiere un plan de pago activo.',
        defaultCvTitle: 'Mi Currículum Ejecutivo',
        savedTitle: '¡Progreso Guardado!',
        savedMsg: 'Currículum guardado en la nube ({exps} cargos, {comps} competencias).',
        saveErrorTitle: 'Error al Guardar',
        savePermError: 'Sin permiso en la nube para guardar esta versión. Verifica tu sesión.',
        saveGenericError: 'No se pudo guardar esta versión en este momento.',
        orderResetTitle: 'Orden Restaurado',
        orderResetMsg: 'Secciones restablecidas al orden ejecutivo recomendado.',
        copyRoleSuffix: '(Copia)',
        duplicatedTitle: 'Cargo Duplicado',
        duplicatedMsg: 'Puedes editar el nuevo elemento justo debajo.',
        defaultTraining: 'Certificación Profesional (Ej: PMP, Scrum, AWS)',
        clusterPresentTitle: 'Competencias Ya Presentes',
        clusterPresentMsg: 'El paquete "{name}" ya está incluido.',
        clusterAddedTitle: 'Paquete Añadido',
        clusterAddedMsg: '{count} grupo(s) de "{name}" añadidos.',
        defaultNewLang: 'Inglés',
        defaultNewLangLevel: 'C1 - Avanzado Profesional'
      },
      stage1: {
        idTitle: 'Identificación y Contacto',
        idTipTitle: 'Cabecera y Contacto ATS',
        idTipText: 'Mantén los contactos limpios, sin iconos gráficos en el texto, y coherentes con LinkedIn.',
        hidePhoto: 'Ocultar foto',
        showPhoto: 'Mostrar foto',
        photoLabel: 'Foto',
        addPhoto: 'Añadir Foto',
        fullName: 'Nombre Completo',
        fullNamePh: 'Ej: Carlos Mendoza Ruiz',
        jobTitle: 'Título Profesional',
        jobTitleTipTitle: 'Título Profesional (Headline)',
        jobTitleTipText: 'Usa exactamente el título del puesto solicitado para maximizar la relevancia en ATS.',
        jobTitlePh: 'Ej: Director de Operaciones / Head de Producto',
        email: 'Correo Profesional',
        invalidEmail: 'Formato inválido',
        emailPh: 'Ej: carlos.mendoza@empresa.com',
        phone: 'Teléfono / WhatsApp',
        phonePh: 'Ej: +34 612 345 678',
        location: 'Ubicación (Ciudad, País)',
        locationPh: 'Ej: Madrid, España',
        linkedin: 'LinkedIn',
        linkedinPh: 'Ej: linkedin.com/in/carlosmendoza',
        website: 'Portafolio o Sitio Web',
        websitePh: 'Ej: carlosmendoza.com o github.com/cmendoza',
        addWebsite: 'Añadir Portafolio o Web (Opcional)',
        summaryTitle: 'Resumen Ejecutivo',
        summaryTipTitle: 'Resumen de Alto Impacto',
        summaryTipText: 'Redacta de 3 a 5 líneas (50–120 palabras) con años de experiencia, especialidad y 1 o 2 resultados.',
        summaryTipExample: 'Director de Operaciones con 12+ años en logística. Redujo costes un 28% con Lean Six Sigma.',
        examplesBtn: 'Ejemplos',
        aiOptimizeBtn: 'Optimizar con IA',
        snippetLibraryTitle: 'Biblioteca de Ejemplos por Profesión',
        close: 'Cerrar',
        useTitleSummary: 'Usar Título y Resumen',
        summaryPh: 'Ej: Profesional con 10+ años en gestión de operaciones y transformación digital...',
        wordSingular: 'palabra',
        wordPlural: 'palabras',
        chars: 'caracteres',
        lenIdeal: 'Extensión ideal para lectura y ATS',
        lenLong: 'Intenta resumir por debajo de 130 palabras',
        lenShort: 'Recomendado: 50 a 120 palabras con métricas'
      },
      stage2: {
        title: 'Experiencia Profesional',
        tipTitle: 'Orden Cronológico Inverso',
        tipText: 'Ordena del cargo más reciente al más antiguo y prioriza logros medibles (Google XYZ).',
        achievementsCount: 'logros',
        withMetricsCount: 'con métricas numéricas',
        achievementTemplatesDesktop: 'Plantillas de Logros',
        achievementTemplatesMobile: 'Plantillas',
        expandAll: 'Expandir todo',
        collapseAll: 'Contraer todo',
        addRole: 'Añadir Cargo',
        insertByProfessionTitle: 'Insertar Logros Listos por Profesión',
        metricsUnit: 'métricas',
        emptyTitle: 'Sin cargos registrados',
        emptySubtitle: 'Añade tus posiciones más relevantes de los últimos 10–15 años.',
        addFirstRole: '+ Añadir Primer Cargo',
        newRoleFallback: 'Nuevo Cargo',
        companyFallback: 'Empresa',
        pointsUnit: 'puntos',
        metricUnit: 'métrica(s)',
        moveUpTitle: 'Mover cargo arriba',
        moveDownTitle: 'Mover cargo abajo',
        duplicateTitle: 'Duplicar cargo',
        expandTitle: 'Expandir',
        collapseTitle: 'Contraer',
        deleteRoleTitle: 'Eliminar cargo',
        roleLabel: 'Cargo',
        rolePh: 'Ej: Director de Operaciones',
        companyLabel: 'Empresa / Institución',
        companyPh: 'Ej: Global Tech Corp',
        periodLabel: 'Periodo',
        periodPh: 'Ej: 2021 – Actualidad',
        locationLabel: 'Ubicación',
        locationPh: 'Ej: Madrid, España / Remoto',
        donorLabel: 'Proyecto o Financiador (Opcional)',
        donorPh: 'Ej: Financiado por Banco Mundial / Programa UE',
        addDonorBtn: 'Añadir Proyecto / Financiador',
        highlightsLabel: 'Logros y Métricas',
        xyzTipTitle: 'Fórmula Google XYZ',
        xyzTipText: "Estructura: 'Logré [X], medido por [Y], mediante [Z]'. Usa verbos de acción y cifras.",
        actionVerbsBtn: 'Verbos de Acción',
        addPointBtn: 'Añadir Punto',
        verbsDrawerTitle: 'Insertar Verbo Ejecutivo de Impacto',
        movePointUpTitle: 'Mover punto arriba',
        movePointDownTitle: 'Mover punto abajo',
        deletePointTitle: 'Eliminar punto',
        highlightPh: 'Ej: Redujo costes operativos un 24% al automatizar flujos de gestión...',
        hasMetricHint: 'Contiene métrica cuantificable',
        needsMetricHint: 'Consejo: añade %, $, horas o tamaño de equipo',
        charsShort: 'car.'
      },
      stage3: {
        tabAcademic: 'Formación & Cursos',
        tabSkills: 'Skills & Idiomas',
        eduTitle: 'Formación Académica',
        addBtn: 'Añadir',
        noEdu: 'Ninguna formación académica añadida.',
        degreeLabel: 'Título / Grado',
        degreePh: 'Ej: MBA / Máster en Dirección',
        institutionLabel: 'Institución',
        institutionPh: 'Ej: IE Business School',
        periodLabel: 'Periodo',
        periodPh: 'Ej: 2016 – 2020',
        moveUp: 'Mover arriba',
        moveDown: 'Mover abajo',
        deleteEdu: 'Eliminar formación',
        honorsPh: 'Distinción, Nota Media o Tesis (Opcional — ej: Cum Laude · Nota 9.2/10)',
        certsTitle: 'Certificaciones y Cursos',
        certInputPh: 'Escribe una certificación y pulsa Enter (Ej: PMP®, AWS Solutions Architect)...',
        noCerts: 'Ninguna certificación añadida.',
        certItemPh: 'Ej: PMP® - Project Management Professional',
        deleteCert: 'Eliminar curso',
        compTitle: 'Competencias Clave',
        compTipTitle: 'Palabras Clave ATS',
        compTipText: 'Refleja exactamente las habilidades técnicas y herramientas de la oferta.',
        clustersBtn: 'Paquetes por Área',
        clustersDrawerTitle: 'Insertar Grupos de Competencias por Área',
        noComp: 'Ninguna competencia añadida.',
        compCatPh: 'Categoría (Ej: Liderazgo y Gobernanza)',
        compDescPh: 'Palabras clave separadas por comas (Ej: OKRs, P&L, SAP, Power BI...)',
        deleteComp: 'Eliminar competencia',
        langTitle: 'Idiomas y Dominio',
        addLangBtn: 'Añadir Idioma',
        noLang: 'Ningún idioma añadido.',
        langPh: 'Ej: Inglés',
        deleteLang: 'Eliminar idioma',
        cefrLevels: [
          'Nativo / Materno',
          'C2 - Dominio Pleno',
          'C1 - Avanzado Profesional',
          'B2 - Intermedio Alto',
          'B1 - Intermedio'
        ]
      },
      stage4: {
        styleTitle: 'Plantilla, Tipografía y Color',
        accentColorLabel: 'Color de acento:',
        selectColorAria: 'Seleccionar color de acento',
        typographyLabel: 'Tipografía del Documento (A4 y Word):',
        densityLabel: 'Densidad de Espaciado:',
        densityCompact: '1 Pág Compacto',
        densityNormal: 'Estándar',
        densityRelaxed: 'Amplio',
        sectionsTitle: 'Orden y Visibilidad de Secciones',
        sectionsCount: 'secciones',
        resetOrderTitle: 'Restablecer orden ejecutivo recomendado',
        resetOrderBtn: 'Restablecer',
        hideSectionTitle: 'Ocultar del documento',
        showSectionTitle: 'Mostrar en el documento',
        refsTitle: 'Referencias',
        noRefs: 'Opcional — añade solo si la oferta solicita referencias directas.',
        refNamePh: 'Nombre',
        refInstPh: 'Empresa / Cargo',
        refContactPh: 'Email o Teléfono',
        deleteRef: 'Eliminar referencia',
        coverCtaTitle: 'Carta de Presentación a Juego',
        coverCtaSubtitle: 'Genera y descarga la carta con el mismo diseño de tu CV.',
        coverCtaBtn: 'Abrir Carta',
        accentColors: {
          '#0f172a': 'Grafito Ejecutivo',
          '#1e3a8a': 'Azul Corporativo',
          '#1d4ed8': 'Azul Europeo',
          '#065f46': 'Verde Esmeralda',
          '#7c3aed': 'Púrpura Creativo',
          '#831843': 'Burdeos Harvard',
          '#0f766e': 'Teal Corporativo'
        },
        fonts: {
          default: { label: 'Predeterminada', hint: 'Automático' },
          jakarta: { label: 'Plus Jakarta Sans', hint: 'Moderna' },
          garamond: { label: 'EB Garamond', hint: 'Editorial' },
          cinzel: { label: 'Cinzel Clásico', hint: 'Ejecutiva' },
          mono: { label: 'IBM Plex Mono', hint: 'Técnica / ATS' }
        },
        sectionNames: {
          summary: 'Resumen Profesional',
          competencies: 'Competencias Clave',
          experiences: 'Experiencia Profesional',
          educations: 'Formación Académica',
          trainings: 'Certificaciones y Cursos',
          languages: 'Idiomas y Dominio',
          references: 'Referencias Profesionales'
        }
      },
      footer: {
        prev: 'Anterior',
        stepOf: 'Paso {current} de {total}',
        nextPrefix: 'Siguiente:',
        finishSave: 'Finalizar y Guardar'
      }
    }
  },
  fr: {
    advisor: {
      authPrompt: 'Connectez-vous ou créez un compte pour utiliser ce modèle dans l’éditeur.',
      pricingPrompt:
        'Les modèles exécutifs internationaux (Harvard, ATS Strict, Tech Modern) sont réservés aux abonnés Pro (8$/mois) et Exécutif VIP (12$/mois).',
      modalTitle: 'Guide Stratégique & Catalogue de Modèles de CV',
      badge: 'International & ATS 2026',
      subtitle: 'Découvrez quand et où utiliser chaque format : avec photo, sans photo et règles locales.',
      goldRuleTitle: 'Règle d’Or de la Photo :',
      goldRuleText:
        'Incluez une photo en Europe continentale. Retirez-la aux États-Unis, au Royaume-Uni et sur les portails ATS (Workday, Greenhouse) pour éviter le rejet automatique.',
      hideRule: 'Masquer l’explication complète',
      showRule: 'Pourquoi la photo est-elle déconseillée aux USA ?',
      lawTitle: 'Droit du Travail International & Biais de Recrutement',
      noPhotoTitle: 'USA, Royaume-Uni, Canada & Australie (Sans Photo)',
      noPhotoDesc:
        'Les directives EEOC et britanniques proscrivent la photo pour prévenir toute discrimination. Les parseurs ATS rejettent les fichiers contenant des images.',
      withPhotoTitle: 'Europe Continentale & Pays Francophones (Avec Photo)',
      withPhotoDesc:
        'En France, Suisse, Belgique et Allemagne, le standard Europass valorise un portrait professionnel sobre comme gage de confiance et d’identification.',
      filterAll: 'Tous',
      filterWithPhoto: 'Avec Photo',
      filterNoPhoto: 'Sans Photo / ATS',
      filterExec: 'Exécutifs & Secteurs',
      activeTemplateLabel: 'Modèle actif :',
      whenToUseLabel: '🎯 Quand l’utiliser :',
      whereToUseLabel: '🌍 Où l’utiliser / Régions :',
      photoRuleLabel: 'Règle Photo',
      currentModelBtn: 'Modèle Actuel',
      applyModelBtn: 'Appliquer ce Modèle',
      activateModelBtn: 'Activer ce Modèle sur Mon CV',
      deepWhenTitle: 'Quand et Pour Qui :',
      deepWhereTitle: 'Régions & Acceptation :',
      deepPhotoTitle: 'Justification de la Photo :',
      deepIndustriesTitle: 'Secteurs Idéaux :',
      recruiterTipTitle: 'Conseil d’Or du Recruteur :',
      exportCompatNote: 'Compatible Word (.docx) et export PDF A4 sans coupure.',
      footerValidationNote: 'Formats validés selon les normes RH internationales et systèmes ATS.',
      closeBtn: 'Fermer'
    },
    dropdown: {
      triggerTitle: 'Choisir un modèle de CV avec ou sans photo',
      withPhotoTag: 'Avec Photo',
      noPhotoTag: 'Sans Photo (ATS)',
      whereToUseBtn: 'Où Utiliser ?',
      whereToUseTitle: 'Voir le guide sur quand et où utiliser chaque modèle',
      menuTitle: 'Modèles Officiels de CV',
      menuSubtitle: 'Choisissez le format adapté au pays et au secteur visés',
      fullGuideBtn: 'Guide Complet',
      photoGroupTitle: 'Modèles Avec Photo (Europe Continentale & Design)',
      noPhotoGroupTitle: 'Modèles Sans Photo (ATS Strict US/UK & Exécutif)',
      footerPrompt: 'Un doute sur le pays ou le filtre ATS ?',
      footerLink: 'Voir le Guide Complet'
    },
    photoModal: {
      fileTooLargeTitle: 'Fichier Trop Volumineux',
      fileTooLargeMsg: 'Veuillez choisir une photo de moins de 8 Mo.',
      updatedTitle: 'Photo Mise à Jour !',
      updatedMsg: 'Votre photo a été optimisée pour une impression nette.',
      errorTitle: 'Erreur de Traitement',
      errorMsg: 'Impossible de charger l’image sélectionnée.',
      headerTitle: 'Photo de Profil Professionnelle',
      headerSubtitle: 'Standard Européen Europass, Créatif & Minimaliste',
      activePhotoTitle: 'Photo active sur le CV',
      loadedLabel: 'Photo Chargée',
      emptyLabel: 'Aucune Photo',
      removeBtn: 'Supprimer',
      visibleLabel: 'Visible sur le CV',
      hiddenLabel: 'Masquée sur le CV',
      uploadHint: 'Importez votre photo ou testez avec un portrait exécutif.',
      uploadBtn: 'Importer depuis Ordinateur / Téléphone',
      formatsHint: 'Formats recommandés : JPG, PNG ou WEBP (max 3 Mo). Fond neutre.',
      avatarsTitle: 'Ou sélectionnez un avatar exécutif d’exemple :',
      complianceTipLabel: 'Conseil Conformité :',
      complianceTipText:
        'La photo s’affiche sur Europass, Créatif Split et Minimaliste. Sur Harvard ou ATS Strict, elle est masquée automatiquement pour la conformité US/UK.',
      doneBtn: 'Terminer & Appliquer',
      avatarNames: {
        exec_male: 'Cadre Formel',
        exec_female: 'Dirigeante',
        tech_pro: 'Tech / Corporate',
        intl_female: 'Consultante Globale'
      }
    },
    watermark: {
      topLine1: 'CV STRATÉGIQUE · APERÇU',
      topLine2: 'DOCUMENT NON LICENCIÉ · ACTIVEZ UN FORFAIT PRO POUR RETIRER LE FILIGRANE',
      midLine1: 'APERÇU NON OFFICIEL · VERSION PROTÉGÉE',
      midLine2: 'TÉLÉCHARGEMENTS VERROUILLÉS · ABONNEMENT PRO OU EXÉCUTIF REQUIS',
      botLine1: 'CV STRATÉGIQUE · APERÇU',
      botLine2: 'VERSION PROTÉGÉE · COMPTE & ABONNEMENT ACTIF REQUIS'
    },
    expertTip: {
      ariaPrefix: 'Conseil d’Expert :',
      badge: 'Conseil ATS',
      closeAria: 'Fermer le conseil',
      exampleLabel: 'Exemple recommandé :'
    },
    editor: {
      steps: {
        profile: { mobile: 'Profil', short: 'Profil & Résumé' },
        career: { mobile: 'Postes', short: 'Expérience' },
        credentials: { mobile: 'Atouts', short: 'Formation & Atouts' },
        structure: { mobile: 'Style', short: 'Modèle & Style' }
      },
      undoTitle: 'Annuler la dernière modification (Ctrl+Z)',
      undoAria: 'Annuler',
      redoTitle: 'Rétablir la modification (Ctrl+Y)',
      redoAria: 'Rétablir',
      saveTitle: 'Enregistrer le CV dans le cloud',
      saving: 'Enregistrement...',
      save: 'Enregistrer',
      words: 'mots',
      pagesA4: 'p. A4',
      reading: 'Lecture',
      checklistBtn: 'Checklist',
      completeAction: 'Compléter',
      checklistItems: [
        {
          label: 'Coordonnées Personnelles',
          recommendation: 'Renseignez nom complet, e-mail professionnel et téléphone direct.'
        },
        {
          label: 'Profil Exécutif Stratégique',
          recommendation: 'Ajoutez un résumé d’au moins 3 lignes présentant votre proposition de valeur.'
        },
        {
          label: 'Expériences Pertinentes & Résultats',
          recommendation: 'Décrivez au moins 2 postes avec 2 réalisations mesurables chacun.'
        },
        {
          label: 'Métriques Chiffrées dans les Réalisations',
          recommendation: 'Ajoutez des pourcentages (%) ou chiffres concrets dans au moins 2 points.'
        },
        {
          label: 'Compétences Clés Structurées',
          recommendation: 'Listez 3 à 6 groupes de compétences clés alignés au poste.'
        },
        {
          label: 'Formation Académique',
          recommendation: 'Indiquez votre diplôme principal et l’établissement.'
        },
        {
          label: 'Langues & Niveaux',
          recommendation: 'Ajoutez vos langues et niveaux (échelle CECRL ou descriptif).'
        }
      ],
      toasts: {
        snippetAppliedTitle: 'Exemple Appliqué',
        snippetAppliedMsg: 'Titre et résumé remplis avec le modèle « {name} ».',
        bulletsAddedTitle: 'Réalisations Insérées',
        bulletsAddedMsg: 'Réalisations de « {name} » ajoutées à votre expérience.',
        authPromptSave: 'Créez un compte ou connectez-vous pour enregistrer votre CV dans le cloud.',
        pricingPromptSave: 'La sauvegarde cloud et l’édition avancée nécessitent un abonnement Pro ou Exécutif VIP.',
        planRequiredTitle: 'Abonnement Requis',
        planRequiredMsg: 'L’enregistrement nécessite un forfait actif.',
        defaultCvTitle: 'Mon CV Exécutif',
        savedTitle: 'Enregistré !',
        savedMsg: 'CV sauvegardé dans le cloud ({exps} postes, {comps} compétences).',
        saveErrorTitle: 'Erreur de Sauvegarde',
        savePermError: 'Autorisation cloud refusée. Vérifiez votre session.',
        saveGenericError: 'Impossible d’enregistrer cette version pour le moment.',
        orderResetTitle: 'Ordre Réinitialisé',
        orderResetMsg: 'Sections rétablies dans l’ordre exécutif recommandé.',
        copyRoleSuffix: '(Copie)',
        duplicatedTitle: 'Poste Dupliqué',
        duplicatedMsg: 'Vous pouvez modifier la copie juste en dessous.',
        defaultTraining: 'Certification Professionnelle (ex: PMP, Scrum, AWS)',
        clusterPresentTitle: 'Compétences Déjà Présentes',
        clusterPresentMsg: 'Le pack « {name} » est déjà inclus.',
        clusterAddedTitle: 'Pack Ajouté',
        clusterAddedMsg: '{count} groupe(s) de « {name} » ajoutés.',
        defaultNewLang: 'Anglais',
        defaultNewLangLevel: 'C1 - Avancé Professionnel'
      },
      stage1: {
        idTitle: 'Identité & Coordonnées',
        idTipTitle: 'En-tête & Coordonnées ATS',
        idTipText: 'Gardez vos coordonnées propres, sans icônes dans le texte, et cohérentes avec LinkedIn.',
        hidePhoto: 'Masquer photo',
        showPhoto: 'Afficher photo',
        photoLabel: 'Photo',
        addPhoto: 'Ajouter Photo',
        fullName: 'Nom Complet',
        fullNamePh: 'Ex : Jean-Luc Moreau',
        jobTitle: 'Titre Professionnel',
        jobTitleTipTitle: 'Titre Cible (Headline)',
        jobTitleTipText: 'Reprenez exactement l’intitulé du poste visé pour maximiser le score ATS.',
        jobTitlePh: 'Ex : Directeur des Opérations / Head of Product',
        email: 'E-mail Professionnel',
        invalidEmail: 'Format invalide',
        emailPh: 'Ex : jl.moreau@entreprise.fr',
        phone: 'Téléphone / WhatsApp',
        phonePh: 'Ex : +33 6 12 34 56 78',
        location: 'Localisation (Ville, Pays)',
        locationPh: 'Ex : Paris, France',
        linkedin: 'LinkedIn',
        linkedinPh: 'Ex : linkedin.com/in/jlmoreau',
        website: 'Portfolio ou Site Web',
        websitePh: 'Ex : jlmoreau.fr ou github.com/jlmoreau',
        addWebsite: 'Ajouter un Portfolio ou Site Web (Optionnel)',
        summaryTitle: 'Profil Exécutif',
        summaryTipTitle: 'Résumé à Fort Impact',
        summaryTipText: 'Rédigez 3 à 5 lignes (50–120 mots) avec années d’expérience, expertise et 1–2 résultats chiffrés.',
        summaryTipExample: 'Directeur des Opérations avec 12+ ans en logistique. -28% de coûts opérationnels via Lean Six Sigma.',
        examplesBtn: 'Exemples',
        aiOptimizeBtn: 'Optimiser avec l’IA',
        snippetLibraryTitle: 'Bibliothèque d’Exemples par Métier',
        close: 'Fermer',
        useTitleSummary: 'Utiliser Titre & Résumé',
        summaryPh: 'Ex : Cadre dirigeant avec 10+ ans en pilotage des opérations...',
        wordSingular: 'mot',
        wordPlural: 'mots',
        chars: 'caractères',
        lenIdeal: 'Longueur idéale pour recruteurs & ATS',
        lenLong: 'Essayez de synthétiser sous 130 mots',
        lenShort: 'Recommandé : 50 à 120 mots avec métriques'
      },
      stage2: {
        title: 'Expérience Professionnelle',
        tipTitle: 'Ordre Antéchronologique',
        tipText: 'Listez du poste le plus récent au plus ancien en privilégiant la formule Google XYZ.',
        achievementsCount: 'réalisations',
        withMetricsCount: 'avec métriques chiffrées',
        achievementTemplatesDesktop: 'Modèles de Réalisations',
        achievementTemplatesMobile: 'Modèles',
        expandAll: 'Tout déplier',
        collapseAll: 'Tout replier',
        addRole: 'Ajouter un Poste',
        insertByProfessionTitle: 'Insérer des Réalisations Prêtes par Métier',
        metricsUnit: 'métriques',
        emptyTitle: 'Aucun poste enregistré',
        emptySubtitle: 'Ajoutez vos postes les plus pertinents des 10 à 15 dernières années.',
        addFirstRole: '+ Ajouter le Premier Poste',
        newRoleFallback: 'Nouveau Poste',
        companyFallback: 'Entreprise',
        pointsUnit: 'points',
        metricUnit: 'métrique(s)',
        moveUpTitle: 'Monter le poste',
        moveDownTitle: 'Descendre le poste',
        duplicateTitle: 'Dupliquer le poste',
        expandTitle: 'Déplier',
        collapseTitle: 'Replier',
        deleteRoleTitle: 'Supprimer le poste',
        roleLabel: 'Intitulé du Poste',
        rolePh: 'Ex : Directeur des Opérations',
        companyLabel: 'Entreprise / Organisation',
        companyPh: 'Ex : Global Tech Corp',
        periodLabel: 'Période',
        periodPh: 'Ex : 2021 – Présent',
        locationLabel: 'Lieu',
        locationPh: 'Ex : Paris, France / Hybride',
        donorLabel: 'Projet ou Bailleur (Optionnel)',
        donorPh: 'Ex : Financé par Banque Mondiale / Horizon EU',
        addDonorBtn: 'Ajouter Projet / Bailleur',
        highlightsLabel: 'Réalisations & Métriques',
        xyzTipTitle: 'Formule Google XYZ',
        xyzTipText: "Structurez ainsi : 'Accompli [X], mesuré par [Y], grâce à [Z]'. Utilisez verbes d'action et chiffres.",
        actionVerbsBtn: 'Verbes d’Action',
        addPointBtn: 'Ajouter un Point',
        verbsDrawerTitle: 'Insérer un Verbe Exécutif d’Impact',
        movePointUpTitle: 'Monter le point',
        movePointDownTitle: 'Descendre le point',
        deletePointTitle: 'Supprimer le point',
        highlightPh: 'Ex : Réduit les coûts opérationnels de 24% en automatisant les processus...',
        hasMetricHint: 'Contient une métrique quantifiable',
        needsMetricHint: 'Astuce : ajoutez %, €, heures ou taille d’équipe',
        charsShort: 'car.'
      },
      stage3: {
        tabAcademic: 'Formation & Cours',
        tabSkills: 'Compétences & Langues',
        eduTitle: 'Formation Académique',
        addBtn: 'Ajouter',
        noEdu: 'Aucune formation académique ajoutée.',
        degreeLabel: 'Diplôme / Cursus',
        degreePh: 'Ex : MBA / Master en Management',
        institutionLabel: 'Établissement',
        institutionPh: 'Ex : HEC Paris',
        periodLabel: 'Période',
        periodPh: 'Ex : 2016 – 2020',
        moveUp: 'Monter',
        moveDown: 'Descendre',
        deleteEdu: 'Supprimer la formation',
        honorsPh: 'Mention, Moyenne ou Mémoire (Optionnel — ex : Mention Très Bien)',
        certsTitle: 'Certifications & Formations',
        certInputPh: 'Saisissez une certification et appuyez sur Entrée (Ex : PMP®, AWS)...',
        noCerts: 'Aucune certification ajoutée.',
        certItemPh: 'Ex : PMP® - Project Management Professional',
        deleteCert: 'Supprimer',
        compTitle: 'Compétences Clés',
        compTipTitle: 'Mots-Clés ATS',
        compTipText: 'Reprenez exactement les outils et compétences demandés dans l’annonce.',
        clustersBtn: 'Packs par Domaine',
        clustersDrawerTitle: 'Insérer des Groupes de Compétences',
        noComp: 'Aucune compétence ajoutée.',
        compCatPh: 'Catégorie (Ex : Leadership & Gouvernance)',
        compDescPh: 'Mots-clés séparés par des virgules (Ex : OKR, P&L, SAP, Power BI...)',
        deleteComp: 'Supprimer la compétence',
        langTitle: 'Langues & Niveaux',
        addLangBtn: 'Ajouter une Langue',
        noLang: 'Aucune langue ajoutée.',
        langPh: 'Ex : Anglais',
        deleteLang: 'Supprimer la langue',
        cefrLevels: [
          'Langue Maternelle / Bilingue',
          'C2 - Maîtrise Complète',
          'C1 - Avancé Professionnel',
          'B2 - Intermédiaire Avancé',
          'B1 - Intermédiaire'
        ]
      },
      stage4: {
        styleTitle: 'Modèle, Typographie & Couleur',
        accentColorLabel: 'Couleur d’accent :',
        selectColorAria: 'Sélectionner la couleur d’accent',
        typographyLabel: 'Typographie du Document (A4 & Word) :',
        densityLabel: 'Densité d’Espacement :',
        densityCompact: '1 Page Compact',
        densityNormal: 'Standard',
        densityRelaxed: 'Aéré',
        sectionsTitle: 'Ordre & Visibilité des Sections',
        sectionsCount: 'sections',
        resetOrderTitle: 'Rétablir l’ordre exécutif recommandé',
        resetOrderBtn: 'Réinitialiser',
        hideSectionTitle: 'Masquer du document',
        showSectionTitle: 'Afficher sur le document',
        refsTitle: 'Références',
        noRefs: 'Optionnel — ajoutez uniquement si le recruteur le demande.',
        refNamePh: 'Nom',
        refInstPh: 'Entreprise / Poste',
        refContactPh: 'E-mail ou Téléphone',
        deleteRef: 'Supprimer la référence',
        coverCtaTitle: 'Lettre de Motivation Assortie',
        coverCtaSubtitle: 'Générez et exportez la lettre dans le même style que votre CV.',
        coverCtaBtn: 'Ouvrir la Lettre',
        accentColors: {
          '#0f172a': 'Graphite Exécutif',
          '#1e3a8a': 'Bleu Corporate',
          '#1d4ed8': 'Bleu Européen',
          '#065f46': 'Vert Émeraude',
          '#7c3aed': 'Violet Créatif',
          '#831843': 'Bordeaux Harvard',
          '#0f766e': 'Teal Corporate'
        },
        fonts: {
          default: { label: 'Par Défaut', hint: 'Automatique' },
          jakarta: { label: 'Plus Jakarta Sans', hint: 'Moderne' },
          garamond: { label: 'EB Garamond', hint: 'Éditorial' },
          cinzel: { label: 'Cinzel Classique', hint: 'Exécutif' },
          mono: { label: 'IBM Plex Mono', hint: 'Technique / ATS' }
        },
        sectionNames: {
          summary: 'Profil Exécutif',
          competencies: 'Compétences Clés',
          experiences: 'Expérience Professionnelle',
          educations: 'Formation Académique',
          trainings: 'Certifications & Formations',
          languages: 'Langues & Niveaux',
          references: 'Références Professionnelles'
        }
      },
      footer: {
        prev: 'Précédent',
        stepOf: 'Étape {current} sur {total}',
        nextPrefix: 'Suivant :',
        finishSave: 'Terminer & Enregistrer'
      }
    }
  },
  de: {
    advisor: {
      authPrompt: 'Melden Sie sich an oder registrieren Sie sich, um diese Vorlage zu nutzen.',
      pricingPrompt:
        'Internationale Executive-Vorlagen (Harvard, Striktes ATS, Tech Modern) sind Pro- (8$/Monat) und Executive-VIP-Mitgliedern (12$/Monat) vorbehalten.',
      modalTitle: 'Strategischer Vorlagen-Ratgeber & Katalog',
      badge: 'International & ATS 2026',
      subtitle: 'Wann, wo und warum welches Format überzeugt – mit Foto, ohne Foto und Länderregeln.',
      goldRuleTitle: 'Goldene Foto-Regel:',
      goldRuleText:
        'Foto in Kontinentaleuropa & DACH üblich. In den USA, UK und ATS-Portalen (Workday, Greenhouse) ohne Foto einreichen, um Aussortierung zu vermeiden.',
      hideRule: 'Details ausblenden',
      showRule: 'Warum in den USA kein Foto?',
      lawTitle: 'Internationales Arbeitsrecht & Anti-Bias-Standards',
      noPhotoTitle: 'USA, UK, Kanada & Australien (Ohne Foto)',
      noPhotoDesc:
        'US-EEOC-Vorgaben und britisches Arbeitsrecht verbieten Fotos zur Vermeidung von Diskriminierung. ATS-Systeme filtern Bilddateien oft automatisch heraus.',
      withPhotoTitle: 'DACH-Raum & Kontinentaleuropa (Mit Foto)',
      withPhotoDesc:
        'In Deutschland, Österreich, der Schweiz und Frankreich etabliert der Europass-Standard ein professionelles Business-Foto als Ausdruck von Seriosität.',
      filterAll: 'Alle',
      filterWithPhoto: 'Mit Foto',
      filterNoPhoto: 'Ohne Foto / ATS',
      filterExec: 'Executive & Tech',
      activeTemplateLabel: 'Aktive Vorlage:',
      whenToUseLabel: '🎯 Wann nutzen:',
      whereToUseLabel: '🌍 Regionen:',
      photoRuleLabel: 'Foto-Regel',
      currentModelBtn: 'Aktive Vorlage',
      applyModelBtn: 'Vorlage anwenden',
      activateModelBtn: 'Diese Vorlage aktivieren',
      deepWhenTitle: 'Wann und für wen geeignet:',
      deepWhereTitle: 'Regionale Akzeptanz:',
      deepPhotoTitle: 'Begründung zur Foto-Regel:',
      deepIndustriesTitle: 'Ideale Branchen:',
      recruiterTipTitle: 'Profi-Tipp vom Recruiter:',
      exportCompatNote: 'Sauberer Word- (.docx) & A4-PDF-Export ohne Umbruchfehler.',
      footerValidationNote: 'Geprüft nach internationalen HR- und ATS-Standards.',
      closeBtn: 'Schließen'
    },
    dropdown: {
      triggerTitle: 'Lebenslauf-Vorlage mit oder ohne Foto wählen',
      withPhotoTag: 'Mit Foto',
      noPhotoTag: 'Ohne Foto (ATS)',
      whereToUseBtn: 'Wo nutzen?',
      whereToUseTitle: 'Ratgeber zu Ländern & Einsatzbereichen öffnen',
      menuTitle: 'Offizielle Lebenslauf-Vorlagen',
      menuSubtitle: 'Wählen Sie das passende Format für Land und Branche',
      fullGuideBtn: 'Ratgeber',
      photoGroupTitle: 'Vorlagen mit Foto (Europa & Design)',
      noPhotoGroupTitle: 'Vorlagen ohne Foto (USA/UK ATS & Executive)',
      footerPrompt: 'Unsicher bei Land oder ATS-System?',
      footerLink: 'Vollständigen Ratgeber öffnen'
    },
    photoModal: {
      fileTooLargeTitle: 'Datei zu groß',
      fileTooLargeMsg: 'Bitte wählen Sie ein Foto unter 8 MB.',
      updatedTitle: 'Foto aktualisiert!',
      updatedMsg: 'Ihr Bewerbungsfoto wurde für gestochen scharfen Druck optimiert.',
      errorTitle: 'Fehler beim Bild-Upload',
      errorMsg: 'Die ausgewählte Bilddatei konnte nicht geladen werden.',
      headerTitle: 'Professionelles Bewerbungsfoto',
      headerSubtitle: 'Europass-, Kreativ- und Minimalismus-Standard',
      activePhotoTitle: 'Foto im Lebenslauf aktiv',
      loadedLabel: 'Foto geladen',
      emptyLabel: 'Kein Foto hinterlegt',
      removeBtn: 'Entfernen',
      visibleLabel: 'Im Lebenslauf sichtbar',
      hiddenLabel: 'Im Lebenslauf ausgeblendet',
      uploadHint: 'Laden Sie ein Foto hoch oder testen Sie einen Beispiel-Avatar.',
      uploadBtn: 'Foto vom Gerät hochladen',
      formatsHint: 'Empfohlen: JPG, PNG oder WEBP (max. 3 MB). Neutraler Hintergrund.',
      avatarsTitle: 'Oder Beispiel-Avatar testen:',
      complianceTipLabel: 'Compliance-Hinweis:',
      complianceTipText:
        'Das Foto erscheint in Europass, Kreativ Split und Minimalistisch. Bei Harvard oder Striktes ATS wird es für US/UK-Compliance automatisch ausgeblendet.',
      doneBtn: 'Fertig & Anwenden',
      avatarNames: {
        exec_male: 'Executive Formal',
        exec_female: 'Führungskraft',
        tech_pro: 'Tech / Business',
        intl_female: 'Beraterin Global'
      }
    },
    watermark: {
      topLine1: 'STRATEGISCHER LEBENSLAUF · VORSCHAU',
      topLine2: 'NICHT LIZENZIERT · PRO-TARIF FÜR WASSERZEICHENFREIEN EXPORT AKTIVIEREN',
      midLine1: 'INOFFIZIELLE VORSCHAU · NICHT ZUM VERSAND',
      midLine2: 'DOWNLOADS GESPERRT · PRO- ODER EXECUTIVE-ABO ERFORDERLICH',
      botLine1: 'STRATEGISCHER LEBENSLAUF · VORSCHAU',
      botLine2: 'GESCHÜTZTE VERSION · KONTO & AKTIVES ABO ERFORDERLICH'
    },
    expertTip: {
      ariaPrefix: 'Experten-Tipp:',
      badge: 'ATS-Tipp',
      closeAria: 'Tipp schließen',
      exampleLabel: 'Empfohlenes Beispiel:'
    },
    editor: {
      steps: {
        profile: { mobile: 'Profil', short: 'Profil & Überblick' },
        career: { mobile: 'Praxis', short: 'Berufserfahrung' },
        credentials: { mobile: 'Skills', short: 'Studium & Skills' },
        structure: { mobile: 'Design', short: 'Layout & Design' }
      },
      undoTitle: 'Rückgängig (Strg+Z)',
      undoAria: 'Rückgängig',
      redoTitle: 'Wiederherstellen (Strg+Y)',
      redoAria: 'Wiederherstellen',
      saveTitle: 'Lebenslauf in der Cloud speichern',
      saving: 'Speichert...',
      save: 'Speichern',
      words: 'Wörter',
      pagesA4: 'S. A4',
      reading: 'Lesezeit',
      checklistBtn: 'Checkliste',
      completeAction: 'Ergänzen',
      checklistItems: [
        {
          label: 'Persönliche Daten & Kontakt',
          recommendation: 'Geben Sie vollständigen Namen, E-Mail und Telefonnummer an.'
        },
        {
          label: 'Executive-Zusammenfassung',
          recommendation: 'Ergänzen Sie ein Profil (mind. 3 Zeilen) zu Ihrem Mehrwert.'
        },
        {
          label: 'Relevante Berufserfahrung',
          recommendation: 'Erfassen Sie mindestens 2 Positionen mit je 2+ messbaren Erfolgen.'
        },
        {
          label: 'Messbare Kennzahlen in Erfolgen',
          recommendation: 'Nutzen Sie Prozentwerte (%) oder Zahlen in mindestens 2 Punkten.'
        },
        {
          label: 'Strukturierte Kernkompetenzen',
          recommendation: 'Listen Sie 3 bis 6 zentrale Kompetenzgruppen passend zur Stelle auf.'
        },
        {
          label: 'Ausbildung & Studium',
          recommendation: 'Ergänzen Sie Ihren höchsten relevanten Abschluss samt Hochschule.'
        },
        {
          label: 'Sprachen & GER-Niveau',
          recommendation: 'Geben Sie Ihre Sprachkenntnisse nach GER-Skala (C2, C1, B2) an.'
        }
      ],
      toasts: {
        snippetAppliedTitle: 'Beispiel übernommen',
        snippetAppliedMsg: 'Titel und Profil aus „{name}“ eingefügt.',
        bulletsAddedTitle: 'Erfolge eingefügt',
        bulletsAddedMsg: 'Erfolgsformulierungen aus „{name}“ hinzugefügt.',
        authPromptSave: 'Melden Sie sich an, um Ihren Lebenslauf sicher in der Cloud zu speichern.',
        pricingPromptSave: 'Cloud-Speicherung und volle Bearbeitung erfordern Pro oder Executive VIP.',
        planRequiredTitle: 'Tarif erforderlich',
        planRequiredMsg: 'Das Speichern erfordert ein aktives Abonnement.',
        defaultCvTitle: 'Mein Executive Lebenslauf',
        savedTitle: 'Gespeichert!',
        savedMsg: 'In der Cloud gesichert ({exps} Positionen, {comps} Kompetenzen).',
        saveErrorTitle: 'Speicherfehler',
        savePermError: 'Cloud-Berechtigung fehlt. Bitte Sitzung prüfen.',
        saveGenericError: 'Diese Version konnte aktuell nicht gespeichert werden.',
        orderResetTitle: 'Reihenfolge zurückgesetzt',
        orderResetMsg: 'Sektionen auf die empfohlene Reihenfolge zurückgesetzt.',
        copyRoleSuffix: '(Kopie)',
        duplicatedTitle: 'Position dupliziert',
        duplicatedMsg: 'Sie können die Kopie direkt darunter bearbeiten.',
        defaultTraining: 'Zertifizierung (z. B. PMP, Scrum, AWS)',
        clusterPresentTitle: 'Kompetenzen bereits vorhanden',
        clusterPresentMsg: 'Das Paket „{name}“ ist bereits enthalten.',
        clusterAddedTitle: 'Paket hinzugefügt',
        clusterAddedMsg: '{count} Kompetenzgruppe(n) aus „{name}“ hinzugefügt.',
        defaultNewLang: 'Englisch',
        defaultNewLangLevel: 'C1 - Verhandlungssicher'
      },
      stage1: {
        idTitle: 'Persönliche Daten & Kontakt',
        idTipTitle: 'ATS-Kopfzeile & Kontakt',
        idTipText: 'Halten Sie Kontaktdaten sauber ohne Text-Icons und konsistent mit LinkedIn.',
        hidePhoto: 'Foto ausblenden',
        showPhoto: 'Foto zeigen',
        photoLabel: 'Foto',
        addPhoto: 'Foto hinzufügen',
        fullName: 'Vollständiger Name',
        fullNamePh: 'z. B. Lukas Weber',
        jobTitle: 'Berufstitel / Headline',
        jobTitleTipTitle: 'Zielposition (Headline)',
        jobTitleTipText: 'Übernehmen Sie den exakten Stellentitel für maximale ATS-Relevanz.',
        jobTitlePh: 'z. B. Chief Operating Officer / Head of Product',
        email: 'Geschäftliche E-Mail',
        invalidEmail: 'Ungültiges Format',
        emailPh: 'z. B. lukas.weber@firma.de',
        phone: 'Telefon / WhatsApp',
        phonePh: 'z. B. +49 171 2345678',
        location: 'Standort (Stadt, Land)',
        locationPh: 'z. B. Berlin, Deutschland',
        linkedin: 'LinkedIn',
        linkedinPh: 'z. B. linkedin.com/in/lukasweber',
        website: 'Portfolio oder Website',
        websitePh: 'z. B. lukasweber.de oder github.com/lweber',
        addWebsite: 'Portfolio oder Website hinzufügen (Optional)',
        summaryTitle: 'Executive-Zusammenfassung',
        summaryTipTitle: 'Wirkungsvolles Profil',
        summaryTipText: 'Schreiben Sie 3–5 Zeilen (50–120 Wörter) mit Erfahrung, Fokus und 1–2 Kennzahlen.',
        summaryTipExample: 'Operations Director mit 12+ Jahren Logistikerfahrung. Senkte Betriebskosten um 28 % durch Lean Six Sigma.',
        examplesBtn: 'Beispiele',
        aiOptimizeBtn: 'Mit KI optimieren',
        snippetLibraryTitle: 'Beispiel-Bibliothek nach Beruf',
        close: 'Schließen',
        useTitleSummary: 'Titel & Profil übernehmen',
        summaryPh: 'z. B. Führungskraft mit 10+ Jahren Erfahrung in Operations und digitaler Transformation...',
        wordSingular: 'Wort',
        wordPlural: 'Wörter',
        chars: 'Zeichen',
        lenIdeal: 'Ideale Länge für Recruiter & ATS',
        lenLong: 'Möglichst unter 130 Wörtern bleiben',
        lenShort: 'Empfohlen: 50–120 Wörter mit Metriken'
      },
      stage2: {
        title: 'Berufserfahrung',
        tipTitle: 'Umgekehrt chronologisch',
        tipText: 'Listen Sie die aktuellste Position zuerst und nutzen Sie messbare Google-XYZ-Erfolge.',
        achievementsCount: 'Erfolge',
        withMetricsCount: 'mit Kennzahlen',
        achievementTemplatesDesktop: 'Erfolgs-Vorlagen',
        achievementTemplatesMobile: 'Vorlagen',
        expandAll: 'Alle ausklappen',
        collapseAll: 'Alle einklappen',
        addRole: 'Position hinzufügen',
        insertByProfessionTitle: 'Fertige Erfolge nach Beruf einfügen',
        metricsUnit: 'Metriken',
        emptyTitle: 'Noch keine Position erfasst',
        emptySubtitle: 'Fügen Sie Ihre relevantesten Stationen der letzten 10–15 Jahre hinzu.',
        addFirstRole: '+ Erste Position hinzufügen',
        newRoleFallback: 'Neue Position',
        companyFallback: 'Unternehmen',
        pointsUnit: 'Punkte',
        metricUnit: 'Kennzahl(en)',
        moveUpTitle: 'Nach oben verschieben',
        moveDownTitle: 'Nach unten verschieben',
        duplicateTitle: 'Position duplizieren',
        expandTitle: 'Ausklappen',
        collapseTitle: 'Einklappen',
        deleteRoleTitle: 'Position entfernen',
        roleLabel: 'Position / Titel',
        rolePh: 'z. B. Head of Operations',
        companyLabel: 'Unternehmen / Organisation',
        companyPh: 'z. B. Global Tech GmbH',
        periodLabel: 'Zeitraum',
        periodPh: 'z. B. 2021 – Heute',
        locationLabel: 'Ort',
        locationPh: 'z. B. München, Deutschland / Remote',
        donorLabel: 'Projekt oder Förderer (Optional)',
        donorPh: 'z. B. Gefördert durch Horizon EU',
        addDonorBtn: 'Projekt / Förderer hinzufügen',
        highlightsLabel: 'Erfolge & Kennzahlen',
        xyzTipTitle: 'Google-XYZ-Formel',
        xyzTipText: 'Aufbau: „Erreichte [X], gemessen an [Y], durch [Z]“. Nutzen Sie Aktionsverben und Zahlen.',
        actionVerbsBtn: 'Aktionsverben',
        addPointBtn: 'Punkt hinzufügen',
        verbsDrawerTitle: 'Starkes Aktionsverb einfügen',
        movePointUpTitle: 'Nach oben',
        movePointDownTitle: 'Nach unten',
        deletePointTitle: 'Punkt entfernen',
        highlightPh: 'z. B. Senkte Betriebskosten um 24 % durch Prozessautomatisierung...',
        hasMetricHint: 'Enthält messbare Kennzahl',
        needsMetricHint: 'Tipp: %, €, Stunden oder Teamgröße ergänzen',
        charsShort: 'Z.'
      },
      stage3: {
        tabAcademic: 'Studium & Kurse',
        tabSkills: 'Skills & Sprachen',
        eduTitle: 'Ausbildung & Studium',
        addBtn: 'Hinzufügen',
        noEdu: 'Keine Ausbildung hinzugefügt.',
        degreeLabel: 'Abschluss / Studiengang',
        degreePh: 'z. B. MBA / Master in BWL',
        institutionLabel: 'Hochschule / Institut',
        institutionPh: 'z. B. TU München',
        periodLabel: 'Zeitraum',
        periodPh: 'z. B. 2016 – 2020',
        moveUp: 'Nach oben',
        moveDown: 'Nach unten',
        deleteEdu: 'Eintrag entfernen',
        honorsPh: 'Auszeichnung, Note oder Thesis (Optional — z. B. Mit Auszeichnung)',
        certsTitle: 'Zertifikate & Weiterbildungen',
        certInputPh: 'Zertifikat eingeben und Enter drücken (z. B. PMP®, AWS)...',
        noCerts: 'Keine Zertifikate hinzugefügt.',
        certItemPh: 'z. B. PMP® - Project Management Professional',
        deleteCert: 'Entfernen',
        compTitle: 'Kernkompetenzen',
        compTipTitle: 'ATS-Keywords',
        compTipText: 'Spiegeln Sie exakt die Tools und Skills aus der Stellenanzeige wider.',
        clustersBtn: 'Skill-Pakete',
        clustersDrawerTitle: 'Kompetenz-Pakete nach Bereich einfügen',
        noComp: 'Keine Kompetenzen hinzugefügt.',
        compCatPh: 'Kategorie (z. B. Führung & Governance)',
        compDescPh: 'Kommagetrennte Keywords (z. B. OKRs, P&L, SAP, Power BI...)',
        deleteComp: 'Entfernen',
        langTitle: 'Sprachen & Niveau',
        addLangBtn: 'Sprache hinzufügen',
        noLang: 'Keine Sprache hinzugefügt.',
        langPh: 'z. B. Englisch',
        deleteLang: 'Entfernen',
        cefrLevels: [
          'Muttersprache',
          'C2 - Annähernd muttersprachlich',
          'C1 - Verhandlungssicher',
          'B2 - Fließend',
          'B1 - Gute Kenntnisse'
        ]
      },
      stage4: {
        styleTitle: 'Vorlage, Typografie & Akzentfarbe',
        accentColorLabel: 'Akzentfarbe:',
        selectColorAria: 'Akzentfarbe wählen',
        typographyLabel: 'Dokument-Typografie (A4 & Word):',
        densityLabel: 'Abstands-Dichte:',
        densityCompact: '1 Seite Kompakt',
        densityNormal: 'Standard',
        densityRelaxed: 'Großzügig',
        sectionsTitle: 'Sektionen & Sichtbarkeit',
        sectionsCount: 'Sektionen',
        resetOrderTitle: 'Empfohlene Reihenfolge wiederherstellen',
        resetOrderBtn: 'Zurücksetzen',
        hideSectionTitle: 'Im Dokument ausblenden',
        showSectionTitle: 'Im Dokument anzeigen',
        refsTitle: 'Referenzen',
        noRefs: 'Optional — nur angeben, falls ausdrücklich verlangt.',
        refNamePh: 'Name',
        refInstPh: 'Unternehmen / Position',
        refContactPh: 'E-Mail oder Telefon',
        deleteRef: 'Referenz entfernen',
        coverCtaTitle: 'Passendes Anschreiben',
        coverCtaSubtitle: 'Erstellen Sie ein Anschreiben im selben Design wie Ihr Lebenslauf.',
        coverCtaBtn: 'Anschreiben öffnen',
        accentColors: {
          '#0f172a': 'Executive Graphit',
          '#1e3a8a': 'Corporate Blau',
          '#1d4ed8': 'Europablau',
          '#065f46': 'Smaragdgrün',
          '#7c3aed': 'Kreativ Violett',
          '#831843': 'Harvard Burgund',
          '#0f766e': 'Corporate Petrol'
        },
        fonts: {
          default: { label: 'Vorlagen-Standard', hint: 'Automatisch' },
          jakarta: { label: 'Plus Jakarta Sans', hint: 'Modern' },
          garamond: { label: 'EB Garamond', hint: 'Editorial' },
          cinzel: { label: 'Cinzel Klassisch', hint: 'Executive' },
          mono: { label: 'IBM Plex Mono', hint: 'Tech / ATS' }
        },
        sectionNames: {
          summary: 'Executive-Zusammenfassung',
          competencies: 'Kernkompetenzen',
          experiences: 'Berufserfahrung',
          educations: 'Ausbildung & Studium',
          trainings: 'Zertifikate & Weiterbildung',
          languages: 'Sprachen & Niveau',
          references: 'Referenzen'
        }
      },
      footer: {
        prev: 'Zurück',
        stepOf: 'Schritt {current} von {total}',
        nextPrefix: 'Weiter:',
        finishSave: 'Abschließen & Speichern'
      }
    }
  },
  it: {
    advisor: {
      authPrompt: 'Accedi o crea un account per utilizzare questo modello nell’editor.',
      pricingPrompt:
        'I modelli executive internazionali (Harvard, ATS Stretto, Tech Modern) sono riservati agli abbonati Pro ($8/mese) ed Executive VIP ($12/mese).',
      modalTitle: 'Guida Strategica & Catalogo Modelli CV',
      badge: 'Internazionale & ATS 2026',
      subtitle: 'Scopri quando, dove e perché scegliere ogni formato: con foto, senza foto e norme locali.',
      goldRuleTitle: 'Regola d’Oro della Foto:',
      goldRuleText:
        'Usa la foto in Europa Continentale. Rimuovila negli USA, Regno Unito e portali ATS (Workday, Greenhouse) per evitare scarti automatici.',
      hideRule: 'Nascondi spiegazione completa',
      showRule: 'Perché la foto è sconsigliata negli USA?',
      lawTitle: 'Normative del Lavoro & Screening Anti-Bias',
      noPhotoTitle: 'USA, Regno Unito, Canada & Australia (Senza Foto)',
      noPhotoDesc:
        'Le norme EEOC statunitensi e britanniche scoraggiano le foto per prevenire discriminazioni. I parser ATS scartano i CV con immagini per evitare errori di lettura.',
      withPhotoTitle: 'Europa Continentale & Italia (Con Foto)',
      withPhotoDesc:
        'In Italia, Germania, Francia, Spagna e Svizzera, lo standard Europass valorizza una foto professionale in studio come segno di trasparenza e cura.',
      filterAll: 'Tutti',
      filterWithPhoto: 'Con Foto',
      filterNoPhoto: 'Senza Foto / ATS',
      filterExec: 'Executive & Tech',
      activeTemplateLabel: 'Modello in uso:',
      whenToUseLabel: '🎯 Quando Usare:',
      whereToUseLabel: '🌍 Dove Usare / Regioni:',
      photoRuleLabel: 'Regola Fotografia',
      currentModelBtn: 'Modello Attuale',
      applyModelBtn: 'Applica Modello',
      activateModelBtn: 'Attiva Questo Modello sul Mio CV',
      deepWhenTitle: 'Quando e Per Chi Usarlo:',
      deepWhereTitle: 'Dove Usarlo & Accettazione:',
      deepPhotoTitle: 'Motivazione sulla Foto:',
      deepIndustriesTitle: 'Settori Ideali:',
      recruiterTipTitle: 'Consiglio d’Oro del Recruiter:',
      exportCompatNote: 'Compatibile con esportazione Word (.docx) e Stampa PDF A4 perfetta.',
      footerValidationNote: 'Formati validati secondo standard HR internazionali e sistemi ATS.',
      closeBtn: 'Chiudi'
    },
    dropdown: {
      triggerTitle: 'Seleziona modello CV con o senza foto',
      withPhotoTag: 'Con Foto',
      noPhotoTag: 'Senza Foto (ATS)',
      whereToUseBtn: 'Dove Usarlo?',
      whereToUseTitle: 'Apri la guida su quando e dove usare ogni modello',
      menuTitle: 'Modelli Ufficiali di CV',
      menuSubtitle: 'Scegli il formato ideale per il paese e il settore dell’offerta',
      fullGuideBtn: 'Guida Completa',
      photoGroupTitle: 'Modelli Con Foto (Europa Continentale & Design)',
      noPhotoGroupTitle: 'Modelli Senza Foto (ATS Stretto US/UK & Executive)',
      footerPrompt: 'Dubbi su paese o filtri ATS?',
      footerLink: 'Vedi Guida Completa'
    },
    photoModal: {
      fileTooLargeTitle: 'File Troppo Grande',
      fileTooLargeMsg: 'Scegli una foto inferiore a 8MB.',
      updatedTitle: 'Foto Aggiornata!',
      updatedMsg: 'La tua fotografia è stata ottimizzata per una stampa nitida.',
      errorTitle: 'Errore Elaborazione Foto',
      errorMsg: 'Impossibile caricare l’immagine selezionata.',
      headerTitle: 'Foto Profilo Professionale',
      headerSubtitle: 'Standard Europeo Europass, Creativo e Minimalista',
      activePhotoTitle: 'Foto attiva sul curriculum',
      loadedLabel: 'Foto Caricata',
      emptyLabel: 'Nessuna Foto',
      removeBtn: 'Rimuovi',
      visibleLabel: 'Visibile sul CV',
      hiddenLabel: 'Nascosta sul CV',
      uploadHint: 'Carica la tua foto o prova un avatar executive di esempio.',
      uploadBtn: 'Carica Foto da Computer / Telefono',
      formatsHint: 'Formati consigliati: JPG, PNG o WEBP (max 3MB). Sfondo neutro.',
      avatarsTitle: 'Oppure scegli un avatar executive di esempio:',
      complianceTipLabel: 'Consiglio Conformità:',
      complianceTipText:
        'La foto è visibile nei modelli Europass, Creativo Split e Minimalista. Sui modelli Harvard o ATS Stretto viene nascosta automaticamente per conformità US/UK.',
      doneBtn: 'Concludi & Applica',
      avatarNames: {
        exec_male: 'Executive Formale',
        exec_female: 'Executive Leader',
        tech_pro: 'Tech / Corporate',
        intl_female: 'Consulente Globale'
      }
    },
    watermark: {
      topLine1: 'CURRICULUM STRATEGICO · ANTEPRIMA',
      topLine2: 'DOCUMENTO NON LICENZIATO · ATTIVA UN PIANO PRO PER RIMUOVERE LA FILIGRANA',
      midLine1: 'ANTEPRIMA NON UFFICIALE · NON VALIDO PER INVIO',
      midLine2: 'DOWNLOAD BLOCCATI · RICHIESTO ABBONAMENTO PRO O EXECUTIVE',
      botLine1: 'CURRICULUM STRATEGICO · ANTEPRIMA',
      botLine2: 'VERSIONE PROTETTA · ACCOUNT E PIANO ATTIVO NECESSARI'
    },
    expertTip: {
      ariaPrefix: 'Consiglio Esperto:',
      badge: 'Tip ATS',
      closeAria: 'Chiudi suggerimento',
      exampleLabel: 'Esempio consigliato:'
    },
    editor: {
      steps: {
        profile: { mobile: 'Profilo', short: 'Profilo & Sommario' },
        career: { mobile: 'Esper.', short: 'Esperienze' },
        credentials: { mobile: 'Skills', short: 'Studi & Skills' },
        structure: { mobile: 'Stile', short: 'Modello & Stile' }
      },
      undoTitle: 'Annulla ultima modifica (Ctrl+Z)',
      undoAria: 'Annulla',
      redoTitle: 'Ripeti modifica (Ctrl+Y)',
      redoAria: 'Ripeti',
      saveTitle: 'Salva curriculum nel cloud',
      saving: 'Salvataggio...',
      save: 'Salva',
      words: 'parole',
      pagesA4: 'pag A4',
      reading: 'Lettura',
      checklistBtn: 'Checklist',
      completeAction: 'Completa',
      checklistItems: [
        {
          label: 'Dati Personali & Contatti',
          recommendation: 'Inserisci nome completo, email professionale e numero di telefono.'
        },
        {
          label: 'Profilo Executive Strategico',
          recommendation: 'Aggiungi un sommario di almeno 3 righe sul tuo valore professionale.'
        },
        {
          label: 'Esperienze Rilevanti con Risultati',
          recommendation: 'Descrivi almeno 2 ruoli con 2 o più risultati misurabili ciascuno.'
        },
        {
          label: 'Metriche Quantificabili nei Risultati',
          recommendation: 'Inserisci percentuali (%) o numeri concreti in almeno 2 punti.'
        },
        {
          label: 'Competenze Chiave Strutturate',
          recommendation: 'Elenca da 3 a 6 gruppi di competenze essenziali per il ruolo.'
        },
        {
          label: 'Formazione Accademica',
          recommendation: 'Includi il tuo titolo di studio principale e l’istituto.'
        },
        {
          label: 'Lingue & Livello QCER',
          recommendation: 'Aggiungi le lingue conosciute e il livello (QCER o descrittivo).'
        }
      ],
      toasts: {
        snippetAppliedTitle: 'Esempio Applicato',
        snippetAppliedMsg: 'Titolo e sommario compilati dal modello «{name}».',
        bulletsAddedTitle: 'Risultati Inseriti',
        bulletsAddedMsg: 'Risultati di «{name}» aggiunti all’esperienza.',
        authPromptSave: 'Crea un account o accedi per salvare il tuo curriculum nel cloud.',
        pricingPromptSave: 'Il salvataggio nel cloud e l’editor avanzato richiedono un piano Pro o Executive VIP.',
        planRequiredTitle: 'Piano Richiesto',
        planRequiredMsg: 'Il salvataggio richiede un piano a pagamento attivo.',
        defaultCvTitle: 'Il Mio Curriculum Executive',
        savedTitle: 'Progresso Salvato!',
        savedMsg: 'Curriculum salvato nel cloud ({exps} ruoli, {comps} competenze).',
        saveErrorTitle: 'Errore di Salvataggio',
        savePermError: 'Permessi cloud insufficienti. Verifica la sessione.',
        saveGenericError: 'Impossibile salvare questa versione al momento.',
        orderResetTitle: 'Ordine Ripristinato',
        orderResetMsg: 'Sezioni ripristinate nell’ordine executive consigliato.',
        copyRoleSuffix: '(Copia)',
        duplicatedTitle: 'Ruolo Duplicato',
        duplicatedMsg: 'Puoi modificare la copia subito sotto.',
        defaultTraining: 'Certificazione Professionale (es: PMP, Scrum, AWS)',
        clusterPresentTitle: 'Competenze Già Presenti',
        clusterPresentMsg: 'Il pacchetto «{name}» è già incluso.',
        clusterAddedTitle: 'Pacchetto Aggiunto',
        clusterAddedMsg: '{count} gruppo/i da «{name}» aggiunti.',
        defaultNewLang: 'Inglese',
        defaultNewLangLevel: 'C1 - Avanzato Professionale'
      },
      stage1: {
        idTitle: 'Identità & Contatti',
        idTipTitle: 'Intestazione & Contatti ATS',
        idTipText: 'Mantieni i contatti puliti senza icone nel testo e coerenti con LinkedIn.',
        hidePhoto: 'Nascondi foto',
        showPhoto: 'Mostra foto',
        photoLabel: 'Foto',
        addPhoto: 'Aggiungi Foto',
        fullName: 'Nome Completo',
        fullNamePh: 'Es: Marco Rossi',
        jobTitle: 'Titolo Professionale',
        jobTitleTipTitle: 'Titolo Target (Headline)',
        jobTitleTipText: 'Rispecchia esattamente il titolo dell’annuncio per massimizzare la rilevanza ATS.',
        jobTitlePh: 'Es: Chief Operating Officer / Head of Product',
        email: 'Email Professionale',
        invalidEmail: 'Formato non valido',
        emailPh: 'Es: marco.rossi@azienda.it',
        phone: 'Telefono / WhatsApp',
        phonePh: 'Es: +39 345 678 9012',
        location: 'Località (Città, Paese)',
        locationPh: 'Es: Milano, Italia',
        linkedin: 'LinkedIn',
        linkedinPh: 'Es: linkedin.com/in/marcorossi',
        website: 'Portfolio o Sito Web',
        websitePh: 'Es: marcorossi.it o github.com/mrossi',
        addWebsite: 'Aggiungi Portfolio o Sito Web (Opzionale)',
        summaryTitle: 'Profilo Executive',
        summaryTipTitle: 'Sommario ad Alto Impatto',
        summaryTipText: 'Scrivi 3–5 righe (50–120 parole) con anni di esperienza, specializzazione e 1–2 risultati.',
        summaryTipExample: 'Operations Director con 12+ anni nella logistica. Ridotti costi operativi del 28% con Lean Six Sigma.',
        examplesBtn: 'Esempi',
        aiOptimizeBtn: 'Ottimizza con IA',
        snippetLibraryTitle: 'Libreria Esempi per Professione',
        close: 'Chiudi',
        useTitleSummary: 'Usa Titolo & Sommario',
        summaryPh: 'Es: Dirigente con oltre 10 anni nella gestione operativa e trasformazione digitale...',
        wordSingular: 'parola',
        wordPlural: 'parole',
        chars: 'caratteri',
        lenIdeal: 'Lunghezza ideale per recruiter & ATS',
        lenLong: 'Prova a restare sotto le 130 parole',
        lenShort: 'Consigliato: 50–120 parole con metriche'
      },
      stage2: {
        title: 'Esperienze Professionali',
        tipTitle: 'Ordine Cronologico Inverso',
        tipText: 'Elenca dal ruolo più recente al meno recente privilegiando la formula Google XYZ.',
        achievementsCount: 'risultati',
        withMetricsCount: 'con metriche numeriche',
        achievementTemplatesDesktop: 'Modelli Risultati',
        achievementTemplatesMobile: 'Modelli',
        expandAll: 'Espandi tutto',
        collapseAll: 'Comprimi tutto',
        addRole: 'Aggiungi Ruolo',
        insertByProfessionTitle: 'Inserisci Risultati Pronti per Professione',
        metricsUnit: 'metriche',
        emptyTitle: 'Nessun ruolo inserito',
        emptySubtitle: 'Aggiungi le posizioni più rilevanti degli ultimi 10–15 anni.',
        addFirstRole: '+ Aggiungi Primo Ruolo',
        newRoleFallback: 'Nuovo Ruolo',
        companyFallback: 'Azienda',
        pointsUnit: 'punti',
        metricUnit: 'metrica/e',
        moveUpTitle: 'Sposta ruolo su',
        moveDownTitle: 'Sposta ruolo giù',
        duplicateTitle: 'Duplica ruolo',
        expandTitle: 'Espandi',
        collapseTitle: 'Comprimi',
        deleteRoleTitle: 'Rimuovi ruolo',
        roleLabel: 'Ruolo / Posizione',
        rolePh: 'Es: Direttore Operazioni',
        companyLabel: 'Azienda / Organizzazione',
        companyPh: 'Es: Global Tech S.p.A.',
        periodLabel: 'Periodo',
        periodPh: 'Es: 2021 – Presente',
        locationLabel: 'Sede',
        locationPh: 'Es: Milano, Italia / Remoto',
        donorLabel: 'Progetto o Ente Finanziatore (Opzionale)',
        donorPh: 'Es: Finanziato da Horizon Europe',
        addDonorBtn: 'Aggiungi Progetto / Finanziatore',
        highlightsLabel: 'Risultati & Metriche',
        xyzTipTitle: 'Formula Google XYZ',
        xyzTipText: 'Struttura così: «Ottenuto [X], misurato da [Y], tramite [Z]». Usa verbi d’azione e cifre.',
        actionVerbsBtn: 'Verbi d’Azione',
        addPointBtn: 'Aggiungi Punto',
        verbsDrawerTitle: 'Inserisci Verbo Esecutivo d’Impatto',
        movePointUpTitle: 'Sposta punto su',
        movePointDownTitle: 'Sposta punto giù',
        deletePointTitle: 'Rimuovi punto',
        highlightPh: 'Es: Ridotti i costi operativi del 24% automatizzando i flussi...',
        hasMetricHint: 'Contiene metrica quantificabile',
        needsMetricHint: 'Suggerimento: aggiungi %, €, ore o team',
        charsShort: 'car.'
      },
      stage3: {
        tabAcademic: 'Studi & Corsi',
        tabSkills: 'Skills & Lingue',
        eduTitle: 'Formazione Accademica',
        addBtn: 'Aggiungi',
        noEdu: 'Nessuna formazione accademica inserita.',
        degreeLabel: 'Titolo / Corso di Laurea',
        degreePh: 'Es: MBA / Laurea Magistrale in Management',
        institutionLabel: 'Istituto / Università',
        institutionPh: 'Es: Università Bocconi',
        periodLabel: 'Periodo',
        periodPh: 'Es: 2016 – 2020',
        moveUp: 'Sposta su',
        moveDown: 'Sposta giù',
        deleteEdu: 'Rimuovi formazione',
        honorsPh: 'Lode, Voto o Tesi (Opzionale — es: 110 e Lode)',
        certsTitle: 'Certificazioni & Corsi',
        certInputPh: 'Scrivi una certificazione e premi Invio (Es: PMP®, AWS)...',
        noCerts: 'Nessuna certificazione aggiunta.',
        certItemPh: 'Es: PMP® - Project Management Professional',
        deleteCert: 'Rimuovi',
        compTitle: 'Competenze Chiave',
        compTipTitle: 'Parole Chiave ATS',
        compTipText: 'Includi strumenti e competenze esattamente come richiesti nell’annuncio.',
        clustersBtn: 'Pacchetti per Area',
        clustersDrawerTitle: 'Inserisci Gruppi di Competenze per Area',
        noComp: 'Nessuna competenza aggiunta.',
        compCatPh: 'Categoria (Es: Leadership & Governance)',
        compDescPh: 'Parole chiave separate da virgola (Es: OKR, P&L, SAP, Power BI...)',
        deleteComp: 'Rimuovi competenza',
        langTitle: 'Lingue & Livello',
        addLangBtn: 'Aggiungi Lingua',
        noLang: 'Nessuna lingua aggiunta.',
        langPh: 'Es: Inglese',
        deleteLang: 'Rimuovi lingua',
        cefrLevels: [
          'Madrelingua',
          'C2 - Padronanza Piena',
          'C1 - Avanzato Professionale',
          'B2 - Intermedio Superiore',
          'B1 - Intermedio'
        ]
      },
      stage4: {
        styleTitle: 'Modello, Tipografia & Colore',
        accentColorLabel: 'Colore di accento:',
        selectColorAria: 'Seleziona colore di accento',
        typographyLabel: 'Tipografia Documento (A4 & Word):',
        densityLabel: 'Densità Spaziatura:',
        densityCompact: '1 Pag Compatto',
        densityNormal: 'Standard',
        densityRelaxed: 'Ampio',
        sectionsTitle: 'Ordine & Visibilità Sezioni',
        sectionsCount: 'sezioni',
        resetOrderTitle: 'Ripristina ordine consigliato',
        resetOrderBtn: 'Ripristina',
        hideSectionTitle: 'Nascondi dal documento',
        showSectionTitle: 'Mostra nel documento',
        refsTitle: 'Referenze',
        noRefs: 'Opzionale — aggiungi solo se espressamente richiesto.',
        refNamePh: 'Nome',
        refInstPh: 'Azienda / Ruolo',
        refContactPh: 'Email o Telefono',
        deleteRef: 'Rimuovi referenza',
        coverCtaTitle: 'Lettera di Presentazione Coordinata',
        coverCtaSubtitle: 'Genera e scarica la lettera con lo stesso stile visivo del CV.',
        coverCtaBtn: 'Apri Lettera',
        accentColors: {
          '#0f172a': 'Grafite Executive',
          '#1e3a8a': 'Blu Corporate',
          '#1d4ed8': 'Blu Europeo',
          '#065f46': 'Verde Smeraldo',
          '#7c3aed': 'Viola Creativo',
          '#831843': 'Bordeaux Harvard',
          '#0f766e': 'Teal Corporate'
        },
        fonts: {
          default: { label: 'Predefinito', hint: 'Automatico' },
          jakarta: { label: 'Plus Jakarta Sans', hint: 'Moderna' },
          garamond: { label: 'EB Garamond', hint: 'Editoriale' },
          cinzel: { label: 'Cinzel Classico', hint: 'Executive' },
          mono: { label: 'IBM Plex Mono', hint: 'Tecnica / ATS' }
        },
        sectionNames: {
          summary: 'Profilo Executive',
          competencies: 'Competenze Chiave',
          experiences: 'Esperienza Professionale',
          educations: 'Formazione Accademica',
          trainings: 'Certificazioni & Corsi',
          languages: 'Lingue & Livello',
          references: 'Referenze Professionali'
        }
      },
      footer: {
        prev: 'Indietro',
        stepOf: 'Fase {current} di {total}',
        nextPrefix: 'Avanti:',
        finishSave: 'Concludi & Salva'
      }
    }
  }
};
