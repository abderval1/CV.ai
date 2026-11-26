import { SiteLanguageCode } from './siteTranslations';

export interface StudioTexts {
  gates: {
    raw: {
      title: string;
      subtitleAuth: string;
      subtitleVisitor: string;
      benefits: string[];
    };
    editor: {
      title: string;
      subtitleAuth: string;
      subtitleVisitor: string;
      benefits: string[];
    };
    atsVisitor: {
      title: string;
      subtitle: string;
      benefits: string[];
    };
    atsPro: {
      title: string;
      subtitle: string;
      benefits: string[];
    };
    aiVisitor: {
      title: string;
      subtitle: string;
      benefits: string[];
    };
    aiPro: {
      title: string;
      subtitle: string;
      benefits: string[];
    };
    interviewVisitor: {
      title: string;
      subtitle: string;
      benefits: string[];
    };
    interviewExec: {
      title: string;
      subtitle: string;
      benefits: string[];
    };
    coverVisitor: {
      title: string;
      subtitle: string;
      benefits: string[];
    };
    coverPro: {
      title: string;
      subtitle: string;
      benefits: string[];
    };
  };
  docToolbar: {
    cvContentLangTooltip: string;
    coverContentLangTooltip: string;
    copy: string;
    copied: string;
    zoomOut: string;
    zoomIn: string;
    density: string;
    compact: string;
    normal: string;
    relaxed: string;
    photo: string;
    inlineEdit: string;
    doneEdit: string;
    jsonBackup: string;
    otherLangs: string;
    advisor: string;
    wordBtn: string;
    pdfBtn: string;
    generating: string;
  };
  healthCriteria: {
    contact: { title: string; category: string; passed: string; warning: string; missing: string; rec: string; action: string };
    summary: { title: string; category: string; passed: string; warning: string; missing: string; rec: string; action: string };
    experience: { title: string; category: string; passedSuffix: string; warning: string; missing: string; rec: string; action: string };
    competencies: { title: string; category: string; passedSuffix: string; warning: string; missing: string; rec: string; action: string };
    education: { title: string; category: string; passed: string; warning: string; missing: string; rec: string; action: string };
    global: { title: string; category: string; passed: string; warning: string; missing: string; rec: string; action: string };
  };
  myResumes: {
    title: string;
    cloudActive: string;
    localOnly: string;
    subtitleAuth: string;
    subtitleVisitor: string;
    placeholder: string;
    saveBtn: string;
    savingBtn: string;
    savedBtn: string;
    savedCountLabel: string;
    newBlankBtn: string;
    loadDefaultBtn: string;
  };
  advisor: {
    title: string;
    badge: string;
    subtitle: string;
    goldRulePrefix: string;
    goldRuleText: string;
    whyNoPhotoBtn: string;
    hideRuleBtn: string;
    filterAll: string;
    filterWithPhoto: string;
    filterNoPhoto: string;
    filterExec: string;
    applyBtn: string;
  };
  editorSteps: {
    profile: string;
    career: string;
    credentials: string;
    structure: string;
    prev: string;
    next: string;
    finish: string;
  };
}

export const STUDIO_TRANSLATIONS: Record<SiteLanguageCode, StudioTexts> = {
  pt: {
    gates: {
      raw: {
        title: 'Importar e Criar Currículo',
        subtitleAuth:
          'Criar novos currículos e importar dados do LinkedIn, PDF ou Word é exclusivo para assinantes Pro ou Executivo VIP. Ative o seu plano para desbloquear.',
        subtitleVisitor:
          'Criar currículos e importar dados do LinkedIn ou documentos requer uma conta com plano ativo. Crie a sua conta e ative o plano para continuar.',
        benefits: [
          'Importação rápida de LinkedIn, PDF e Word (.docx)',
          'Organização automática em modelos profissionais',
          'Acesso completo aos 14 modelos do site',
          'Guarda e edições ilimitadas na nuvem'
        ]
      },
      editor: {
        title: 'Editor de Currículo Passo a Passo',
        subtitleAuth:
          'Editar todos os campos do currículo e guardar alterações na nuvem é exclusivo para assinantes Pro e Executivo VIP. Ative o seu plano para editar.',
        subtitleVisitor:
          'Crie a sua conta e ative o plano Pro ou Executivo VIP para editar o seu currículo passo a passo e guardar na nuvem.',
        benefits: [
          'Preenchimento simples passo a passo',
          'Dicas práticas e exemplos prontos para cada secção',
          'Ajuda para descrever conquistas com resultados claros',
          'Guarda automática na nuvem',
          'Download em Word (.docx) e PDF sem marca de água'
        ]
      },
      atsVisitor: {
        title: 'Verificador de Currículo para Vagas',
        subtitle:
          'Veja se o seu currículo tem as palavras importantes da vaga e passa nos filtros automáticos das empresas.',
        benefits: [
          'Nota de compatibilidade com a vaga',
          'Lista de palavras importantes que faltam no CV',
          'Sugestões fáceis para adicionar com 1 toque',
          'Ligado diretamente aos seus currículos guardados'
        ]
      },
      atsPro: {
        title: 'Verificador Completo de Compatibilidade',
        subtitle:
          'Compara o seu currículo diretamente com a descrição da vaga para garantir que não fica de fora nos sistemas de seleção das empresas.',
        benefits: [
          'Cálculo rápido de compatibilidade com a vaga',
          'Identificação automática do que a empresa mais procura',
          'Dicas para reforçar resultados e números',
          'Verificações ilimitadas no Plano Profissional Pro'
        ]
      },
      aiVisitor: {
        title: 'Melhorar Conquistas com IA',
        subtitle: 'Reescreve as suas experiências para mostrar resultados reais e chamar a atenção dos recrutadores.',
        benefits: [
          'Frases mais fortes focadas em resultados',
          'Linguagem profissional clara e direta',
          'Remove expressões vagas ou repetidas',
          'Incluído nos planos Pro ($8/mês) e Executivo VIP ($12/mês)'
        ]
      },
      aiPro: {
        title: 'Adaptar Currículo à Vaga com IA',
        subtitle:
          'Reescreve o seu resumo e experiências para destacar exatamente o que a empresa procura na vaga.',
        benefits: [
          'Melhoria rápida das suas experiências profissionais',
          'Adaptação automática ao anúncio da vaga',
          'Sugestões com números e resultados concretos',
          'Download imediato em Word (.docx)'
        ]
      },
      interviewVisitor: {
        title: 'Treino de Entrevista com IA',
        subtitle:
          'Pratique as perguntas mais prováveis para a sua vaga e receba conselhos simples para responder melhor.',
        benefits: [
          '5 perguntas personalizadas para a sua vaga',
          'Pode responder escrevendo ou falando ao microfone',
          'Feedback claro sobre pontos fortes e o que melhorar',
          'Exemplos de boas respostas para estudar antes da entrevista'
        ]
      },
      interviewExec: {
        title: 'Treino de Entrevista por Texto e Voz',
        subtitle:
          'O treino completo de entrevistas com perguntas personalizadas e avaliação por IA é exclusivo para assinantes Executivo VIP.',
        benefits: [
          '5 perguntas personalizadas para qualquer vaga',
          'Pode ditar a resposta usando o microfone',
          'Nota de 0 a 100 e exemplo de boa resposta',
          'Treino ilimitado antes das suas entrevistas'
        ]
      },
      coverVisitor: {
        title: 'Carta de Apresentação',
        subtitle: 'Crie cartas de apresentação claras e personalizadas para acompanhar o seu currículo.',
        benefits: [
          'Estrutura formal pronta a enviar',
          'Liga os seus pontos fortes ao que a empresa precisa',
          'Download em Word (.docx) e PDF'
        ]
      },
      coverPro: {
        title: 'Carta de Apresentação Automática',
        subtitle:
          'Crie cartas de apresentação personalizadas para cada candidatura em poucos segundos.',
        benefits: [
          'Cartas ilimitadas adaptadas a cada vaga',
          'Tradução fácil para 5 idiomas',
          'Download imediato em Word (.docx) e PDF'
        ]
      }
    },
    docToolbar: {
      cvContentLangTooltip: 'Traduzir currículo e carta de apresentação',
      coverContentLangTooltip: 'Traduzir carta e currículo',
      copy: 'Copiar',
      copied: 'Copiado!',
      zoomOut: 'Diminuir texto',
      zoomIn: 'Aumentar texto',
      density: 'Espaço na folha',
      compact: 'Compacto',
      normal: 'Normal',
      relaxed: 'Folha ampla',
      photo: 'Foto',
      inlineEdit: 'Editar Texto',
      doneEdit: 'Concluir',
      jsonBackup: 'Guardar Cópia',
      otherLangs: 'Baixar noutro idioma',
      advisor: 'Modelos',
      wordBtn: 'Word (.docx)',
      pdfBtn: 'PDF',
      generating: 'A Gerar...'
    },
    healthCriteria: {
      contact: {
        title: 'Nome e Contactos',
        category: 'Cabeçalho',
        passed: 'Cabeçalho completo com nome, cargo e contactos.',
        warning: 'Falta LinkedIn ou indicativo do país no telefone.',
        missing: 'Faltam contactos essenciais.',
        rec: 'Inclua nome completo, cargo desejado, e-mail, telefone com indicativo e LinkedIn.',
        action: 'Completar Contactos'
      },
      summary: {
        title: 'Resumo / Sobre Mim',
        category: 'Apresentação',
        passed: 'Resumo claro com experiência e valor entregue.',
        warning: 'Resumo muito curto; escreva mais 2 ou 3 frases para destacar o seu perfil.',
        missing: 'Resumo em falta. Ajuda os recrutadores a conhecê-lo rapidamente.',
        rec: 'Escreva 3 a 5 linhas com anos de experiência, área principal e conquistas.',
        action: 'Melhorar Resumo'
      },
      experience: {
        title: 'Experiência e Resultados',
        category: 'Resultados',
        passedSuffix: 'conquistas com números ou resultados claros.',
        warning: 'Tente incluir mais números ou resultados reais nas experiências.',
        missing: 'Nenhuma experiência profissional adicionada.',
        rec: 'Explique o que fez, quanto melhorou (em % ou números) e como conseguiu.',
        action: 'Melhorar Experiências'
      },
      competencies: {
        title: 'Competências e Palavras da Vaga',
        category: 'Competências',
        passedSuffix: 'grupos de competências bem organizados.',
        warning: 'Poucas competências listadas; adicione ferramentas e conhecimentos da sua área.',
        missing: 'Nenhuma competência adicionada.',
        rec: 'Liste ferramentas, programas e competências que correspondam às vagas da sua área.',
        action: 'Verificar Competências'
      },
      education: {
        title: 'Estudos e Formação',
        category: 'Estudos',
        passed: 'Cursos e escolas bem preenchidos.',
        warning: 'Falta o nome da escola ou o ano em alguma formação.',
        missing: 'Nenhuma formação adicionada.',
        rec: 'Indique o nome do curso, a escola/universidade e os anos.',
        action: 'Preencher Estudos'
      },
      global: {
        title: 'Idiomas e Certificados',
        category: 'Extra',
        passed: 'Idiomas com nível claro e cursos ou certificados incluídos.',
        warning: 'Adicione um certificado ou outro idioma com o seu nível (ex: Básico, Intermédio, Avançado).',
        missing: 'Nenhum idioma ou certificado adicionado.',
        rec: 'Indique os idiomas que fala, o nível em cada um e os seus certificados.',
        action: 'Adicionar Idiomas'
      }
    },
    myResumes: {
      title: 'Os Meus Currículos Salvos',
      cloudActive: 'Nuvem Ativa',
      localOnly: 'Armazenamento Local',
      subtitleAuth: 'Os seus currículos estão armazenados com segurança na nuvem associados ao seu e-mail.',
      subtitleVisitor: 'Inicie sessão ou crie uma conta para sincronizar os seus currículos permanentemente na nuvem.',
      placeholder: 'Dar um nome à versão atual (ex: CV Executivo COO 2026, CV Tech Lead)...',
      saveBtn: 'Guardar Versão',
      savingBtn: 'A guardar...',
      savedBtn: 'Guardado na Nuvem!',
      savedCountLabel: 'Currículos Guardados',
      newBlankBtn: '+ Começar em Branco',
      loadDefaultBtn: 'Carregar Modelo Padrão'
    },
    advisor: {
      title: 'Guia Estratégico & Catálogo de Modelos de CV',
      badge: 'Internacional & ATS',
      subtitle: 'Descubra quando, onde e por que usar cada padrão: com fotos, sem fotos e regras geográficas.',
      goldRulePrefix: 'Regra de Ouro da Foto:',
      goldRuleText:
        'Use foto na Europa Continental e LATAM. Oculte a foto nos EUA, Reino Unido e portais ATS automatizados (Workday, Greenhouse).',
      whyNoPhotoBtn: 'Por que a Foto é Proibida nos EUA?',
      hideRuleBtn: 'Ocultar Explicação',
      filterAll: 'Todos',
      filterWithPhoto: 'Com Foto (Europa)',
      filterNoPhoto: 'Sem Foto (EUA / ATS)',
      filterExec: 'Executivos & Tech',
      applyBtn: 'Aplicar Modelo'
    },
    editorSteps: {
      profile: 'Perfil & Resumo',
      career: 'Experiência',
      credentials: 'Formação & Skills',
      structure: 'Modelo & Design',
      prev: 'Anterior',
      next: 'Próximo',
      finish: 'Ver Documento'
    }
  },
  en: {
    gates: {
      raw: {
        title: 'Structured Resume Creation & Import',
        subtitleAuth:
          'Creating new resumes and smart importing from LinkedIn, PDF, and Word are exclusive to Pro or Executive VIP subscribers.',
        subtitleVisitor:
          'Resume creation and LinkedIn/document extraction require an active subscription. Create an account and choose a plan to unlock.',
        benefits: [
          'Smart import from LinkedIn, PDF, and Word (.docx)',
          'Automatic structuring to international hiring standards',
          'Full access to Harvard, Tech, and Executive templates',
          'Unlimited cloud storage and versioning'
        ]
      },
      editor: {
        title: 'Strategic Resume Editor & ATS Builder',
        subtitleAuth:
          'Field-by-field editing and guided resume building are exclusive to Pro and Executive VIP subscribers. Activate a plan to edit and sync to the cloud.',
        subtitleVisitor:
          'Create an account and activate Pro or Executive VIP to unlock the official editor, Google XYZ rewrites, and cloud sync.',
        benefits: [
          'Step-by-step guided editing across all sections',
          'Expert action verbs engineered for ATS parsing',
          'Impact metrics built with the Google XYZ formula',
          'Real-time encrypted cloud backup',
          'Watermark-free Word (.docx) & PDF export'
        ]
      },
      atsVisitor: {
        title: 'Semantic Job & ATS Radar',
        subtitle: 'Deep compatibility diagnostics for Workday, Taleo, Greenhouse, and SAP SuccessFactors.',
        benefits: [
          'ATS compatibility scoring with keyword density check',
          'Critical role keyword gap mapping',
          'Missing executive terminology suggestions',
          'Synced with all your saved resume versions'
        ]
      },
      atsPro: {
        title: 'Advanced ATS Radar & Semantic Match',
        subtitle:
          'Compare your profile directly against any job posting using AI to ensure your resume passes automated screening.',
        benefits: [
          'Percentage match and keyword density analysis',
          'Smart extraction of recruiter requirements',
          'Highlights missing quantifiable metrics',
          'Unlimited job scans on Professional Pro'
        ]
      },
      aiVisitor: {
        title: 'AI Achievement Optimizer',
        subtitle: 'Rewrite work history bullets using the Google XYZ formula and executive action verbs.',
        benefits: [
          'Metric-driven achievement bullet generation',
          'Executive tone calibration for global roles',
          'Automatic removal of weak filler phrases',
          'Included in Pro ($8/mo) and Executive VIP ($12/mo)'
        ]
      },
      aiPro: {
        title: 'AI Achievement & Executive Bullet Optimizer',
        subtitle:
          'Unlock precision rewrites calibrated for senior leadership roles with strong action verbs and measurable ROI.',
        benefits: [
          'Unlimited AI bullet optimizations',
          'Job-description-aware keyword alignment',
          'Financial impact framing (P&L, EBITDA, OPEX)',
          'Unrestricted Word (.docx) downloads'
        ]
      },
      interviewVisitor: {
        title: 'AI Interview Simulator',
        subtitle: 'Practice realistic interviews with role-specific questions and receive STAR scoring.',
        benefits: [
          '5 tailored technical & behavioral interview questions',
          'Live voice dictation and transcription',
          'Strength breakdown and model answers',
          'Stress-free preparation before the real panel'
        ]
      },
      interviewExec: {
        title: 'AI STAR Interview Simulator & Voice Prep',
        subtitle: 'Interactive interview room with tailored questions and STAR scoring is exclusive to Executive VIP.',
        benefits: [
          'AI-generated behavioral & technical interview loops',
          'Real-time Web Speech voice dictation',
          '0–100 STAR rubric score with model executive answer',
          'Unlimited practice for any target job description'
        ]
      },
      coverVisitor: {
        title: 'Executive Cover Letter',
        subtitle: 'Generate persuasive, custom cover letters tailored to your target company and role.',
        benefits: [
          'Formal structure designed for hiring committees',
          'Connects directly to your top resume metrics',
          'Instant Microsoft Word (.docx) & PDF export'
        ]
      },
      coverPro: {
        title: 'AI Executive Cover Letter Builder',
        subtitle: 'Draft compelling, company-specific cover letters aligned with each role and culture.',
        benefits: [
          'Unlimited strategic cover letter drafts',
          'Tailored for leadership and specialist roles',
          'Native Word (.docx) and clean PDF export'
        ]
      }
    },
    docToolbar: {
      cvContentLangTooltip: 'Translate full resume and cover letter content',
      coverContentLangTooltip: 'Translate cover letter and resume content',
      copy: 'Copy',
      copied: 'Copied!',
      zoomOut: 'Zoom Out',
      zoomIn: 'Zoom In',
      density: 'Spacing',
      compact: 'Compact',
      normal: 'Normal',
      relaxed: 'Spacious',
      photo: 'Photo',
      inlineEdit: 'Edit Text',
      doneEdit: 'Done',
      jsonBackup: 'JSON Backup',
      otherLangs: 'Other Languages',
      advisor: 'Templates',
      wordBtn: 'Word (.docx)',
      pdfBtn: 'PDF',
      generating: 'Exporting...'
    },
    healthCriteria: {
      contact: {
        title: 'Header & Contact Details',
        category: 'Header',
        passed: 'Complete header with name, title, and professional contacts.',
        warning: 'Missing LinkedIn profile or international phone prefix.',
        missing: 'Essential contact fields are empty.',
        rec: 'ATS parsers require full name, target title, email, phone with country code, and LinkedIn.',
        action: 'Complete Contacts'
      },
      summary: {
        title: 'Executive Summary',
        category: 'Positioning',
        passed: 'Concise summary focused on seniority and measurable value.',
        warning: 'Short summary (< 140 chars); expand for stronger ATS indexing.',
        missing: 'Missing summary. Recruiters scan the top fold in 6 seconds.',
        rec: 'Write 3–5 concise lines covering years of experience, domain, and quantified outcomes.',
        action: 'Optimize Summary'
      },
      experience: {
        title: 'Experience & Metrics (Google XYZ)',
        category: 'Impact',
        passedSuffix: 'achievements quantified with metrics or percentages.',
        warning: 'Roles lack sufficient numerical metrics and measurable outcomes.',
        missing: 'No work experience entries found.',
        rec: 'Apply the Google XYZ formula: "Accomplished [X], as measured by [Y], by doing [Z]".',
        action: 'Optimize Achievements'
      },
      competencies: {
        title: 'Core Skills & ATS Keywords',
        category: 'Indexing',
        passedSuffix: 'competency clusters structured for ATS matching.',
        warning: 'Too few skills listed to match typical job filter criteria.',
        missing: 'No core competencies added yet.',
        rec: 'Map tools, frameworks, and domain skills using exact job-posting phrasing.',
        action: 'Audit in ATS Radar'
      },
      education: {
        title: 'Academic Education',
        category: 'Credentials',
        passed: 'Degrees and institutions properly formatted.',
        warning: 'Education entry missing institution or graduation dates.',
        missing: 'No education history recorded.',
        rec: 'Include full degree title, accredited institution, and completion timeframe.',
        action: 'Add Education'
      },
      global: {
        title: 'Languages & Certifications',
        category: 'Differentiator',
        passed: 'CEFR language levels and professional certifications included.',
        warning: 'Add certifications or a second language with CEFR level.',
        missing: 'No languages or certifications listed.',
        rec: 'Use standardized CEFR levels (C2, C1, B2) and official certification acronyms.',
        action: 'Add Languages'
      }
    },
    myResumes: {
      title: 'My Saved Resumes',
      cloudActive: 'Cloud Active',
      localOnly: 'Local Storage',
      subtitleAuth: 'Your resumes are securely synced in the cloud under your account.',
      subtitleVisitor: 'Sign in or register to permanently sync your resume versions in the cloud.',
      placeholder: 'Name this version (e.g. Executive COO 2026, Tech Lead CV)...',
      saveBtn: 'Save Version',
      savingBtn: 'Saving...',
      savedBtn: 'Saved to Cloud!',
      savedCountLabel: 'Saved Resumes',
      newBlankBtn: '+ Start Blank',
      loadDefaultBtn: 'Load Sample Template'
    },
    advisor: {
      title: 'Strategic Template Guide & International Rules',
      badge: 'Global & ATS',
      subtitle: 'Learn when and where to use each format: photo policies, ATS rules, and regional standards.',
      goldRulePrefix: 'Golden Photo Rule:',
      goldRuleText:
        'Use a headshot in Continental Europe & LATAM. Remove photos in the US, UK, and automated ATS portals (Workday, Greenhouse).',
      whyNoPhotoBtn: 'Why are photos avoided in the US?',
      hideRuleBtn: 'Hide Details',
      filterAll: 'All',
      filterWithPhoto: 'With Photo (EU)',
      filterNoPhoto: 'No Photo (US / ATS)',
      filterExec: 'Executive & Tech',
      applyBtn: 'Apply Template'
    },
    editorSteps: {
      profile: 'Profile & Summary',
      career: 'Experience',
      credentials: 'Education & Skills',
      structure: 'Template & Style',
      prev: 'Back',
      next: 'Next',
      finish: 'Preview A4'
    }
  },
  es: {
    gates: {
      raw: {
        title: 'Creación e Importación Estructurada de CV',
        subtitleAuth:
          'La creación de nuevos currículums y la importación inteligente (LinkedIn, PDF y Word) son exclusivas de los planes Pro o Ejecutivo VIP.',
        subtitleVisitor:
          'La creación de CVs y extracción desde LinkedIn o documentos requiere una cuenta activa. Regístrate y activa tu plan.',
        benefits: [
          'Importación inteligente desde LinkedIn, PDF y Word (.docx)',
          'Estructuración según estándares internacionales de selección',
          'Acceso total a plantillas Harvard, Tech y Ejecutiva',
          'Versiones ilimitadas guardadas en la nube'
        ]
      },
      editor: {
        title: 'Editor Estratégico de CV & Constructor ATS',
        subtitleAuth:
          'La edición guiada por secciones y sincronización en la nube son exclusivas de Pro y Ejecutivo VIP. Activa tu plan para editar.',
        subtitleVisitor:
          'Crea tu cuenta y activa Pro o Ejecutivo VIP para editar todas las secciones, aplicar la fórmula Google XYZ y exportar sin marcas.',
        benefits: [
          'Edición guiada paso a paso de todas las secciones',
          'Verbos de acción recomendados para filtros ATS',
          'Redacción de logros con la fórmula Google XYZ',
          'Guardado seguro en tiempo real en la nube',
          'Exportación oficial en Word (.docx) y PDF sin marca de agua'
        ]
      },
      atsVisitor: {
        title: 'Radar ATS Semántico & Vacantes',
        subtitle: 'Diagnóstico profundo de compatibilidad con Workday, Taleo, Greenhouse y SAP SuccessFactors.',
        benefits: [
          'Cálculo de puntuación ATS y densidad de palabras clave',
          'Mapeo de competencias críticas de la oferta',
          'Sugerencias de términos ejecutivos ausentes',
          'Sincronización con todos tus CVs guardados'
        ]
      },
      atsPro: {
        title: 'Radar ATS Avanzado & Análisis Semántico',
        subtitle:
          'Compara tu perfil directamente con la descripción del puesto mediante IA para superar los filtros automáticos.',
        benefits: [
          'Puntuación porcentual y densidad de palabras clave',
          'Extracción inteligente de requisitos del reclutador',
          'Detección de métricas cuantificables faltantes',
          'Escaneos ilimitados en el Plan Profesional Pro'
        ]
      },
      aiVisitor: {
        title: 'Optimizador IA de Logros',
        subtitle: 'Reescribe tus experiencias con la fórmula Google XYZ y verbos de acción ejecutivos.',
        benefits: [
          'Generación de logros orientados a métricas reales',
          'Ajuste de tono formal para estándares corporativos',
          'Eliminación automática de frases débiles',
          'Incluido en Pro ($8/mes) y Ejecutivo VIP ($12/mes)'
        ]
      },
      aiPro: {
        title: 'Optimizador IA de Logros & Impacto Ejecutivo',
        subtitle:
          'Desbloquea reescrituras de alta precisión calibradas para puestos sénior con métricas de negocio medibles.',
        benefits: [
          'Optimizaciones ilimitadas de experiencia profesional',
          'Alineación automática con el puesto objetivo',
          'Enfoque en impacto financiero (P&L, EBITDA, OPEX)',
          'Exportación en Word (.docx) sin restricciones'
        ]
      },
      interviewVisitor: {
        title: 'Simulador de Entrevistas (IA)',
        subtitle: 'Practica entrevistas reales con preguntas a medida y recibe evaluación método STAR.',
        benefits: [
          '5 preguntas técnicas y conductuales personalizadas',
          'Grabación y transcripción por voz en tiempo real',
          'Análisis de fortalezas y respuestas recomendadas',
          'Entrenamiento sin presión antes de la entrevista real'
        ]
      },
      interviewExec: {
        title: 'Simulador de Entrevistas STAR con IA y Voz',
        subtitle: 'La sala de simulación con evaluación STAR personalizada es exclusiva de Ejecutivo VIP.',
        benefits: [
          'Generación de 5 preguntas técnicas y conductuales con IA',
          'Dictado por voz en tiempo real',
          'Puntuación STAR de 0 a 100 con respuesta modelo',
          'Práctica ilimitada para cualquier oferta laboral'
        ]
      },
      coverVisitor: {
        title: 'Carta de Presentación Estratégica',
        subtitle: 'Crea cartas de motivación ejecutivas adaptadas a la empresa y al puesto deseado.',
        benefits: [
          'Estructura formal para comités de selección',
          'Conexión con los logros de tu currículum',
          'Exportación directa en Microsoft Word (.docx)'
        ]
      },
      coverPro: {
        title: 'Carta de Presentación con Inteligencia Artificial',
        subtitle: 'Redacta cartas persuasivas y personalizadas para cada postulación.',
        benefits: [
          'Generación ilimitada de cartas estratégicas',
          'Adaptación para liderazgo y perfiles especialistas',
          'Exportación instantánea en Word (.docx) y PDF'
        ]
      }
    },
    docToolbar: {
      cvContentLangTooltip: 'Traducir el contenido completo del CV y carta de presentación',
      coverContentLangTooltip: 'Traducir contenido de la carta y CV',
      copy: 'Copiar',
      copied: '¡Copiado!',
      zoomOut: 'Alejar',
      zoomIn: 'Acercar',
      density: 'Espaciado',
      compact: 'Compacto',
      normal: 'Normal',
      relaxed: 'Amplio',
      photo: 'Foto',
      inlineEdit: 'Editar Texto',
      doneEdit: 'Listo',
      jsonBackup: 'Respaldo JSON',
      otherLangs: 'Otros Idiomas',
      advisor: 'Plantillas',
      wordBtn: 'Word (.docx)',
      pdfBtn: 'PDF',
      generating: 'Generando...'
    },
    healthCriteria: {
      contact: {
        title: 'Identificación & Contacto',
        category: 'Encabezado',
        passed: 'Encabezado completo con nombre, cargo y contacto profesional.',
        warning: 'Falta LinkedIn o prefijo internacional en el teléfono.',
        missing: 'Faltan campos esenciales de contacto.',
        rec: 'Los sistemas ATS exigen nombre completo, cargo objetivo, correo, teléfono y LinkedIn.',
        action: 'Completar Contacto'
      },
      summary: {
        title: 'Resumen Ejecutivo',
        category: 'Posicionamiento',
        passed: 'Resumen conciso enfocado en antigüedad y valor aportado.',
        warning: 'Resumen corto (< 140 caracteres); amplíalo para mejor indexación ATS.',
        missing: 'Sin resumen. Los reclutadores revisan la parte superior en 6 segundos.',
        rec: 'Usa 3 a 5 líneas con años de experiencia, especialidad y logros medibles.',
        action: 'Optimizar Resumen'
      },
      experience: {
        title: 'Experiencia & Métricas (Google XYZ)',
        category: 'Impacto',
        passedSuffix: 'logros cuantificados con cifras o porcentajes.',
        warning: 'Las experiencias carecen de métricas numéricas suficientes.',
        missing: 'No hay cargos registrados en experiencia laboral.',
        rec: 'Aplica la fórmula Google XYZ: "Logró [X], medido por [Y], mediante [Z]".',
        action: 'Optimizar Logros'
      },
      competencies: {
        title: 'Competencias & Palabras Clave ATS',
        category: 'Indexación',
        passedSuffix: 'grupos de competencias listos para filtros ATS.',
        warning: 'Pocas competencias para coincidir con filtros de vacantes.',
        missing: 'Ninguna competencia añadida aún.',
        rec: 'Incluye herramientas y metodologías tal como aparecen en la oferta.',
        action: 'Auditar en Radar ATS'
      },
      education: {
        title: 'Formación Académica',
        category: 'Credenciales',
        passed: 'Títulos e instituciones correctamente estructurados.',
        warning: 'Falta institución o fechas de graduación.',
        missing: 'No hay formación académica registrada.',
        rec: 'Indica título completo, institución y período.',
        action: 'Añadir Formación'
      },
      global: {
        title: 'Idiomas & Certificaciones',
        category: 'Diferencial',
        passed: 'Idiomas en escala MCER y certificaciones profesionales incluidas.',
        warning: 'Añade certificaciones o un segundo idioma con nivel MCER.',
        missing: 'Sin idiomas ni certificaciones declaradas.',
        rec: 'Usa niveles estándar (C2, C1, B2) y siglas oficiales de certificaciones.',
        action: 'Añadir Idiomas'
      }
    },
    myResumes: {
      title: 'Mis Currículums Guardados',
      cloudActive: 'Nube Activa',
      localOnly: 'Almacenamiento Local',
      subtitleAuth: 'Tus currículums se sincronizan de forma segura en la nube.',
      subtitleVisitor: 'Inicia sesión para guardar múltiples versiones en la nube.',
      placeholder: 'Nombra esta versión (ej: CV Director Operaciones 2026)...',
      saveBtn: 'Guardar Versión',
      savingBtn: 'Guardando...',
      savedBtn: '¡Guardado!',
      savedCountLabel: 'Currículums Guardados',
      newBlankBtn: '+ Empezar en Blanco',
      loadDefaultBtn: 'Cargar Ejemplo Base'
    },
    advisor: {
      title: 'Guía Estratégica de Plantillas de CV',
      badge: 'Internacional & ATS',
      subtitle: 'Descubre cuándo usar cada formato según el país y las reglas de fotografía.',
      goldRulePrefix: 'Regla de Oro de la Foto:',
      goldRuleText:
        'Incluye foto en Europa Continental y LATAM. Omite la foto en EE. UU., Reino Unido y portales ATS.',
      whyNoPhotoBtn: '¿Por qué no usar foto en EE. UU.?',
      hideRuleBtn: 'Ocultar explicación',
      filterAll: 'Todos',
      filterWithPhoto: 'Con Foto (Europa)',
      filterNoPhoto: 'Sin Foto (EE. UU. / ATS)',
      filterExec: 'Ejecutivos & Tech',
      applyBtn: 'Aplicar Plantilla'
    },
    editorSteps: {
      profile: 'Perfil & Resumen',
      career: 'Experiencia',
      credentials: 'Formación & Skills',
      structure: 'Diseño & Estilo',
      prev: 'Anterior',
      next: 'Siguiente',
      finish: 'Ver Documento'
    }
  },
  fr: {
    gates: {
      raw: {
        title: 'Création & Import Structuré de CV',
        subtitleAuth:
          'La création de nouveaux CV et l’import intelligent (LinkedIn, PDF, Word) sont réservés aux abonnés Pro et Exécutif VIP.',
        subtitleVisitor:
          'Créez votre compte et activez un abonnement pour importer votre profil LinkedIn, PDF ou Word.',
        benefits: [
          'Import intelligent depuis LinkedIn, PDF et Word (.docx)',
          'Structuration conforme aux normes internationales',
          'Accès complet aux modèles Harvard, Tech & Exécutif',
          'Sauvegarde illimitée dans le cloud'
        ]
      },
      editor: {
        title: 'Éditeur Stratégique de CV & Constructeur ATS',
        subtitleAuth:
          'L’édition guidée section par section est réservée aux abonnés Pro et Exécutif VIP.',
        subtitleVisitor:
          'Créez un compte et activez Pro ou Exécutif VIP pour éditer votre CV, appliquer la formule Google XYZ et exporter sans filigrane.',
        benefits: [
          'Édition guidée étape par étape',
          'Verbes d’action optimisés pour les lecteurs ATS',
          'Formulation d’impact Google XYZ',
          'Synchronisation cloud en temps réel',
          'Export Word (.docx) & PDF sans filigrane'
        ]
      },
      atsVisitor: {
        title: 'Radar ATS Sémantique & Emplois',
        subtitle: 'Audit approfondi de compatibilité avec Workday, Taleo, Greenhouse et SAP.',
        benefits: [
          'Score ATS et analyse de densité de mots-clés',
          'Cartographie des compétences clés du poste',
          'Suggestions de termes exécutifs manquants',
          'Synchronisé avec vos CV enregistrés'
        ]
      },
      atsPro: {
        title: 'Radar ATS Avancé & Analyse Sémantique',
        subtitle: 'Comparez directement votre profil à l’offre d’emploi pour passer tous les filtres ATS.',
        benefits: [
          'Score de correspondance et mots-clés requis',
          'Extraction intelligente des critères recruteur',
          'Détection des métriques manquantes',
          'Analyses illimitées dans Professionnel Pro'
        ]
      },
      aiVisitor: {
        title: 'Optimiseur IA de Réalisations',
        subtitle: 'Réécrivez vos expériences avec la méthode Google XYZ et des verbes d’impact.',
        benefits: [
          'Réalisations chiffrées axées sur les résultats',
          'Ton formel adapté aux grands groupes',
          'Suppression des formulations faibles',
          'Inclus dans Pro (8$/mois) et Exécutif VIP (12$/mois)'
        ]
      },
      aiPro: {
        title: 'Optimiseur IA d’Impact Exécutif',
        subtitle: 'Débloquez des réécritures de haute précision orientées P&L, EBITDA et KPI.',
        benefits: [
          'Optimisations IA illimitées',
          'Alignement sur le descriptif du poste',
          'Mise en valeur de l’impact financier',
          'Téléchargements Word (.docx) illimités'
        ]
      },
      interviewVisitor: {
        title: 'Simulateur d’Entretien (IA)',
        subtitle: 'Entraînez-vous avec des questions sur mesure et obtenez une note méthode STAR.',
        benefits: [
          '5 questions techniques et comportementales ciblées',
          'Dictée vocale et transcription en direct',
          'Évaluation des points forts et réponse modèle',
          'Préparation sereine avant l’entretien réel'
        ]
      },
      interviewExec: {
        title: 'Simulateur d’Entretien STAR IA & Audio',
        subtitle: 'La salle de simulation avec notation STAR est exclusive aux membres Exécutif VIP.',
        benefits: [
          '5 questions générées selon votre CV et le poste',
          'Reconnaissance vocale en temps réel',
          'Score STAR sur 100 avec réponse recommandée',
          'Entraînement illimité pour chaque offre'
        ]
      },
      coverVisitor: {
        title: 'Lettre de Motivation Exécutive',
        subtitle: 'Créez des lettres de motivation ciblées et convaincantes pour chaque poste.',
        benefits: [
          'Structure formelle pour comités de recrutement',
          'Appuyée sur vos résultats clés',
          'Export direct Microsoft Word (.docx)'
        ]
      },
      coverPro: {
        title: 'Lettre de Motivation avec IA',
        subtitle: 'Rédigez des lettres de motivation percutantes alignées avec l’entreprise visée.',
        benefits: [
          'Génération illimitée de lettres sur mesure',
          'Adaptée aux cadres et spécialistes',
          'Export Word (.docx) & PDF instantané'
        ]
      }
    },
    docToolbar: {
      cvContentLangTooltip: 'Traduire tout le contenu du CV et de la lettre',
      coverContentLangTooltip: 'Traduire la lettre et le CV',
      copy: 'Copier',
      copied: 'Copié !',
      zoomOut: 'Dézoomer',
      zoomIn: 'Zoomer',
      density: 'Espacement',
      compact: 'Compact',
      normal: 'Normal',
      relaxed: 'Aéré',
      photo: 'Photo',
      inlineEdit: 'Éditer Texte',
      doneEdit: 'Terminer',
      jsonBackup: 'Backup JSON',
      otherLangs: 'Autres Langues',
      advisor: 'Modèles',
      wordBtn: 'Word (.docx)',
      pdfBtn: 'PDF',
      generating: 'Exportation...'
    },
    healthCriteria: {
      contact: {
        title: 'Coordonnées & En-tête',
        category: 'En-tête',
        passed: 'En-tête complet avec nom, poste visé et contacts.',
        warning: 'Lien LinkedIn ou indicatif téléphonique manquant.',
        missing: 'Champs de contact essentiels absents.',
        rec: 'Les ATS exigent nom complet, titre cible, e-mail, téléphone et LinkedIn.',
        action: 'Compléter Contact'
      },
      summary: {
        title: 'Profil Exécutif',
        category: 'Positionnement',
        passed: 'Résumé concis mettant en valeur séniorité et résultats.',
        warning: 'Résumé court (< 140 car.) ; enrichissez-le pour l’ATS.',
        missing: 'Résumé manquant. Les recruteurs lisent le haut en 6 secondes.',
        rec: 'Rédigez 3 à 5 lignes claires avec expérience et chiffres clés.',
        action: 'Optimiser Résumé'
      },
      experience: {
        title: 'Expérience & Métriques (Google XYZ)',
        category: 'Impact',
        passedSuffix: 'réalisations quantifiées par des chiffres ou pourcentages.',
        warning: 'Expériences dépourvues de métriques chiffrées suffisantes.',
        missing: 'Aucune expérience professionnelle enregistrée.',
        rec: 'Appliquez la formule Google XYZ : « Réalisé [X], mesuré par [Y], en faisant [Z] ».',
        action: 'Optimiser Réalisations'
      },
      competencies: {
        title: 'Compétences & Mots-clés ATS',
        category: 'Indexation',
        passedSuffix: 'groupes de compétences structurés pour l’ATS.',
        warning: 'Trop peu de compétences pour correspondre aux filtres.',
        missing: 'Aucune compétence ajoutée.',
        rec: 'Utilisez les termes exacts d’outils et méthodologies de l’offre.',
        action: 'Auditer dans Radar ATS'
      },
      education: {
        title: 'Formation & Diplômes',
        category: 'Diplômes',
        passed: 'Diplômes et établissements structurés correctement.',
        warning: 'Établissement ou dates de formation incomplets.',
        missing: 'Aucune formation enregistrée.',
        rec: 'Précisez l’intitulé du diplôme, l’établissement et les dates.',
        action: 'Ajouter Formation'
      },
      global: {
        title: 'Langues & Certifications',
        category: 'Atouts',
        passed: 'Langues sur l’échelle CECRL et certifications incluses.',
        warning: 'Ajoutez vos certifications ou niveaux de langue CECRL.',
        missing: 'Aucune langue ni certification renseignée.',
        rec: 'Indiquez les niveaux CECRL (C2, C1, B2) et sigles officiels.',
        action: 'Ajouter Langues'
      }
    },
    myResumes: {
      title: 'Mes CV Enregistrés',
      cloudActive: 'Cloud Actif',
      localOnly: 'Stockage Local',
      subtitleAuth: 'Vos CV sont sauvegardés en toute sécurité dans le cloud.',
      subtitleVisitor: 'Connectez-vous pour synchroniser vos versions dans le cloud.',
      placeholder: 'Nommer cette version (ex: CV Directeur Opérations 2026)...',
      saveBtn: 'Enregistrer',
      savingBtn: 'Enregistrement...',
      savedBtn: 'Enregistré !',
      savedCountLabel: 'CV Enregistrés',
      newBlankBtn: '+ Partir de zéro',
      loadDefaultBtn: 'Charger Modèle Base'
    },
    advisor: {
      title: 'Guide Stratégique des Modèles de CV',
      badge: 'International & ATS',
      subtitle: 'Choisissez le bon format selon le pays et la politique de photographie.',
      goldRulePrefix: 'Règle d’Or Photo :',
      goldRuleText:
        'Photo conseillée en Europe continentale. Sans photo aux États-Unis, Royaume-Uni et portails ATS.',
      whyNoPhotoBtn: 'Pourquoi sans photo aux USA ?',
      hideRuleBtn: 'Masquer l’explication',
      filterAll: 'Tous',
      filterWithPhoto: 'Avec Photo (Europe)',
      filterNoPhoto: 'Sans Photo (USA / ATS)',
      filterExec: 'Exécutifs & Tech',
      applyBtn: 'Appliquer ce Modèle'
    },
    editorSteps: {
      profile: 'Profil & Résumé',
      career: 'Expérience',
      credentials: 'Formation & Atouts',
      structure: 'Modèle & Style',
      prev: 'Précédent',
      next: 'Suivant',
      finish: 'Aperçu A4'
    }
  },
  de: {
    gates: {
      raw: {
        title: 'Strukturierte Lebenslauf-Erstellung & Import',
        subtitleAuth:
          'Die Erstellung neuer Lebensläufe und der Smart-Import (LinkedIn, PDF, Word) sind Pro und Executive VIP vorbehalten.',
        subtitleVisitor:
          'Erstellen Sie ein Konto und aktivieren Sie einen Tarif, um LinkedIn-, PDF- oder Word-Daten zu importieren.',
        benefits: [
          'Intelligenter Import aus LinkedIn, PDF & Word (.docx)',
          'Strukturierung nach internationalen Standards',
          'Voller Zugriff auf Harvard-, Tech- & Executive-Vorlagen',
          'Unbegrenzte Cloud-Speicherung'
        ]
      },
      editor: {
        title: 'Strategischer Lebenslauf-Editor & ATS-Builder',
        subtitleAuth:
          'Die geführte Bearbeitung aller Sektionen und Cloud-Speicherung erfordern ein Pro- oder Executive-VIP-Abo.',
        subtitleVisitor:
          'Registrieren Sie sich und aktivieren Sie Pro oder Executive VIP für volle Bearbeitung und saubere Exporte.',
        benefits: [
          'Geführte Schritt-für-Schritt-Bearbeitung',
          'ATS-optimierte Aktionsverben & Google-XYZ-Formel',
          'Sichere Echtzeit-Cloud-Synchronisation',
          'Wasserzeichenfreier Word- (.docx) & PDF-Export'
        ]
      },
      atsVisitor: {
        title: 'Semantisches ATS-Radar',
        subtitle: 'Kompatibilitätsprüfung für Workday, Taleo, Greenhouse und SAP SuccessFactors.',
        benefits: [
          'ATS-Score und Keyword-Dichteanalyse',
          'Erkennung fehlender Stellenanforderungen',
          'Executive-Formulierungs-Vorschläge',
          'Abgleich mit Ihren gespeicherten Lebensläufen'
        ]
      },
      atsPro: {
        title: 'Erweitertes ATS-Radar & KI-Analyse',
        subtitle: 'Vergleichen Sie Ihren Lebenslauf direkt mit der Stellenanzeige.',
        benefits: [
          'Prozentuale Übereinstimmung & Keyword-Prüfung',
          'Hervorhebung fehlender Kennzahlen',
          'Unbegrenzte Analysen im Tarif Professional Pro'
        ]
      },
      aiVisitor: {
        title: 'KI-Erfolgsoptimierer',
        subtitle: 'Formulieren Sie Berufserfahrungen nach der Google-XYZ-Methode mit klaren Kennzahlen neu.',
        benefits: [
          'Kennzahlenbasierte Erfolgsformulierungen',
          'Professioneller Executive-Stil',
          'Inklusive in Pro ($8/Monat) & Executive VIP ($12/Monat)'
        ]
      },
      aiPro: {
        title: 'KI-Optimierer für Executive-Erfolge',
        subtitle: 'Präzise Formulierungen mit messbarer P&L-, EBITDA- und OPEX-Wirkung.',
        benefits: [
          'Unbegrenzte KI-Optimierungen',
          'Abstimmung auf jede Zielposition',
          'Uneingeschränkter Word-Export (.docx)'
        ]
      },
      interviewVisitor: {
        title: 'KI-Interview-Simulator',
        subtitle: 'Trainieren Sie reale Vorstellungsgespräche mit individuellen Fragen und STAR-Bewertung.',
        benefits: [
          '5 maßgeschneiderte Fach- und Verhaltensfragen',
          'Echtzeit-Spracheingabe und Transkription',
          'STAR-Auswertung inkl. Musterantwort'
        ]
      },
      interviewExec: {
        title: 'KI-STAR-Interview-Simulator mit Sprache',
        subtitle: 'Der interaktive Interview-Trainer ist exklusiv für Executive-VIP-Mitglieder.',
        benefits: [
          'KI-generierte Interview-Runden nach Stellenprofil',
          'Web-Speech-Sprachdiktat in Echtzeit',
          '0–100 STAR-Score mit perfekter Beispielantwort',
          'Unbegrenztes Training für jede Bewerbung'
        ]
      },
      coverVisitor: {
        title: 'Strategisches Anschreiben',
        subtitle: 'Erstellen Sie überzeugende, auf Unternehmen und Position zugeschnittene Anschreiben.',
        benefits: [
          'Formale Struktur für Auswahlgremien',
          'Verknüpft mit den Kennzahlen Ihres Lebenslaufs',
          'Direkter Word- (.docx) & PDF-Export'
        ]
      },
      coverPro: {
        title: 'KI-Anschreiben-Generator',
        subtitle: 'Verfassen Sie maßgeschneiderte Bewerbungsschreiben mit höchster Überzeugungskraft.',
        benefits: [
          'Unbegrenzte strategische Anschreiben',
          'Abgestimmt auf Fach- & Führungspositionen',
          'Sofortiger Word- (.docx) & PDF-Export'
        ]
      }
    },
    docToolbar: {
      cvContentLangTooltip: 'Gesamten Inhalt von Lebenslauf und Anschreiben übersetzen',
      coverContentLangTooltip: 'Inhalt von Anschreiben und Lebenslauf übersetzen',
      copy: 'Kopieren',
      copied: 'Kopiert!',
      zoomOut: 'Verkleinern',
      zoomIn: 'Vergrößern',
      density: 'Abstand',
      compact: 'Kompakt',
      normal: 'Normal',
      relaxed: 'Großzügig',
      photo: 'Foto',
      inlineEdit: 'Text bearbeiten',
      doneEdit: 'Fertig',
      jsonBackup: 'JSON-Backup',
      otherLangs: 'Andere Sprachen',
      advisor: 'Vorlagen',
      wordBtn: 'Word (.docx)',
      pdfBtn: 'PDF',
      generating: 'Export...'
    },
    healthCriteria: {
      contact: {
        title: 'Kopfzeile & Kontaktdaten',
        category: 'Kopfzeile',
        passed: 'Vollständige Kontaktdaten inkl. Titel und LinkedIn.',
        warning: 'LinkedIn oder internationale Vorwahl fehlt.',
        missing: 'Wesentliche Kontaktfelder sind leer.',
        rec: 'ATS-Systeme benötigen vollständigen Namen, Zielposition, E-Mail, Telefon und LinkedIn.',
        action: 'Kontakt vervollständigen'
      },
      summary: {
        title: 'Executive-Zusammenfassung',
        category: 'Positionierung',
        passed: 'Prägnante Zusammenfassung mit Fokus auf Seniorität und Impact.',
        warning: 'Kurz (< 140 Zeichen); für bessere ATS-Indexierung erweitern.',
        missing: 'Keine Zusammenfassung vorhanden.',
        rec: 'Formulieren Sie 3–5 prägnante Zeilen mit Erfahrung und messbaren Ergebnissen.',
        action: 'Profil optimieren'
      },
      experience: {
        title: 'Berufserfahrung & Metriken (Google XYZ)',
        category: 'Wirkung',
        passedSuffix: 'Erfolge mit konkreten Zahlen oder Prozentwerten belegt.',
        warning: 'Positionen enthalten zu wenige messbare Zahlen.',
        missing: 'Keine Berufserfahrung eingetragen.',
        rec: 'Nutzen Sie die Google-XYZ-Formel: „Erreichte [X], gemessen an [Y], durch [Z]“.',
        action: 'Erfolge optimieren'
      },
      competencies: {
        title: 'Kernkompetenzen & ATS-Keywords',
        category: 'Indexierung',
        passedSuffix: 'Kompetenzgruppen optimal für ATS-Filter strukturiert.',
        warning: 'Zu wenige Kompetenzen für automatische Stellenabgleiche.',
        missing: 'Noch keine Kernkompetenzen hinzugefügt.',
        rec: 'Übernehmen Sie Tools und Methoden wortgetreu aus der Stellenanzeige.',
        action: 'Im ATS-Radar prüfen'
      },
      education: {
        title: 'Ausbildung & Studium',
        category: 'Abschlüsse',
        passed: 'Abschlüsse und Hochschulen korrekt erfasst.',
        warning: 'Einrichtung oder Zeitraum unvollständig.',
        missing: 'Keine Ausbildung eingetragen.',
        rec: 'Geben Sie Abschluss, Institution und Zeitraum vollständig an.',
        action: 'Ausbildung ergänzen'
      },
      global: {
        title: 'Sprachen & Zertifikate',
        category: 'Profilplus',
        passed: 'Sprachen nach GER-Skala und Zertifikate enthalten.',
        warning: 'Fügen Sie Zertifikate oder eine weitere Sprache mit GER-Stufe hinzu.',
        missing: 'Keine Sprachen oder Zertifikate angegeben.',
        rec: 'Nutzen Sie standardisierte GER-Niveaus (C2, C1, B2) und offizielle Kürzel.',
        action: 'Sprachen hinzufügen'
      }
    },
    myResumes: {
      title: 'Meine Gespeicherten Lebensläufe',
      cloudActive: 'Cloud Aktiv',
      localOnly: 'Lokaler Speicher',
      subtitleAuth: 'Ihre Lebensläufe sind sicher mit Ihrem Konto in der Cloud synchronisiert.',
      subtitleVisitor: 'Melden Sie sich an, um Versionen dauerhaft in der Cloud zu speichern.',
      placeholder: 'Versionsname eingeben (z. B. COO Lebenslauf 2026)...',
      saveBtn: 'Speichern',
      savingBtn: 'Speichert...',
      savedBtn: 'Gespeichert!',
      savedCountLabel: 'Gespeicherte Lebensläufe',
      newBlankBtn: '+ Neu beginnen',
      loadDefaultBtn: 'Beispiel laden'
    },
    advisor: {
      title: 'Strategischer Vorlagen-Ratgeber',
      badge: 'Global & ATS',
      subtitle: 'Wann und wo welches Format überzeugt – inkl. Länderregeln zu Bewerbungsfotos.',
      goldRulePrefix: 'Goldene Foto-Regel:',
      goldRuleText:
        'Foto in Kontinentaleuropa üblich. In den USA, UK und ATS-Portalen (Workday) besser ohne Foto.',
      whyNoPhotoBtn: 'Warum in den USA ohne Foto?',
      hideRuleBtn: 'Details ausblenden',
      filterAll: 'Alle',
      filterWithPhoto: 'Mit Foto (Europa)',
      filterNoPhoto: 'Ohne Foto (USA / ATS)',
      filterExec: 'Executive & Tech',
      applyBtn: 'Vorlage anwenden'
    },
    editorSteps: {
      profile: 'Profil & Überblick',
      career: 'Berufserfahrung',
      credentials: 'Studium & Skills',
      structure: 'Layout & Design',
      prev: 'Zurück',
      next: 'Weiter',
      finish: 'A4-Vorschau'
    }
  },
  it: {
    gates: {
      raw: {
        title: 'Creazione & Importazione Strutturata CV',
        subtitleAuth:
          'La creazione di nuovi CV e l’importazione da LinkedIn, PDF e Word sono riservate agli abbonati Pro ed Executive VIP.',
        subtitleVisitor:
          'Crea un account e attiva un piano per importare dati da LinkedIn, PDF o Word.',
        benefits: [
          'Importazione intelligente da LinkedIn, PDF e Word (.docx)',
          'Strutturazione secondo standard internazionali',
          'Accesso completo a modelli Harvard, Tech ed Executive',
          'Salvataggio illimitato nel cloud'
        ]
      },
      editor: {
        title: 'Editor Strategico CV & Costruttore ATS',
        subtitleAuth:
          'La modifica guidata di tutte le sezioni e il cloud sync richiedono un abbonamento Pro o Executive VIP.',
        subtitleVisitor:
          'Registrati e attiva Pro o Executive VIP per modificare il CV, applicare la formula Google XYZ ed esportare senza filigrana.',
        benefits: [
          'Modifica guidata passo passo di ogni sezione',
          'Verbi d’azione calibrati per i filtri ATS',
          'Formula Google XYZ per risultati quantificabili',
          'Salvataggio sicuro nel cloud in tempo reale',
          'Esportazione pulita in Word (.docx) e PDF'
        ]
      },
      atsVisitor: {
        title: 'Radar ATS Semantico',
        subtitle: 'Diagnostica di compatibilità con Workday, Taleo, Greenhouse e SAP.',
        benefits: [
          'Calcolo punteggio ATS e densità parole chiave',
          'Analisi delle competenze richieste dall’annuncio',
          'Suggerimenti di termini executive mancanti',
          'Sincronizzato con i tuoi CV salvati'
        ]
      },
      atsPro: {
        title: 'Radar ATS Avanzato & Analisi Semantica',
        subtitle: 'Confronta il tuo CV direttamente con l’offerta di lavoro grazie all’IA.',
        benefits: [
          'Percentuale di affinità e parole chiave critiche',
          'Individuazione automatica dei requisiti',
          'Segnalazione metriche mancanti',
          'Analisi illimitate nel piano Pro'
        ]
      },
      aiVisitor: {
        title: 'Ottimizzatore IA Risultati',
        subtitle: 'Riscrivi le esperienze usando la formula Google XYZ e metriche di impatto.',
        benefits: [
          'Frasi orientate ai risultati numerici',
          'Tono esecutivo per posizioni senior',
          'Incluso nei piani Pro ($8/mese) ed Executive VIP ($12/mese)'
        ]
      },
      aiPro: {
        title: 'Ottimizzatore IA Impatto Executive',
        subtitle: 'Riscritture ad alta precisione focalizzate su P&L, EBITDA e KPI.',
        benefits: [
          'Ottimizzazioni IA illimitate',
          'Allineamento diretto all’offerta target',
          'Esportazione illimitata in Word (.docx)'
        ]
      },
      interviewVisitor: {
        title: 'Simulatore di Colloquio (IA)',
        subtitle: 'Allenati con domande realistiche e ricevi valutazioni con metodo STAR.',
        benefits: [
          '5 domande tecniche e comportamentali su misura',
          'Dettatura vocale e trascrizione in diretta',
          'Analisi punti di forza e risposta modello'
        ]
      },
      interviewExec: {
        title: 'Simulatore Colloquio STAR IA & Voce',
        subtitle: 'La sala di simulazione interattiva è riservata agli abbonati Executive VIP.',
        benefits: [
          'Domande generate su misura dal tuo CV e annuncio',
          'Riconoscimento vocale in tempo reale',
          'Punteggio STAR 0–100 con risposta ideale',
          'Allenamento illimitato'
        ]
      },
      coverVisitor: {
        title: 'Lettera di Presentazione Strategica',
        subtitle: 'Crea lettere persuasive su misura per l’azienda e il ruolo desiderato.',
        benefits: [
          'Struttura formale per comitati di selezione',
          'Collegata ai risultati chiave del tuo CV',
          'Esportazione diretta in Word (.docx)'
        ]
      },
      coverPro: {
        title: 'Lettera di Presentazione con IA',
        subtitle: 'Redigi lettere personalizzate e convincenti per ogni candidatura.',
        benefits: [
          'Generazione illimitata di lettere mirate',
          'Adatta a ruoli dirigenziali e specialistici',
          'Esportazione immediata Word (.docx) e PDF'
        ]
      }
    },
    docToolbar: {
      cvContentLangTooltip: 'Traduci tutto il contenuto del CV e della lettera',
      coverContentLangTooltip: 'Traduci il contenuto della lettera e del CV',
      copy: 'Copia',
      copied: 'Copiato!',
      zoomOut: 'Riduci Zoom',
      zoomIn: 'Aumenta Zoom',
      density: 'Spaziatura',
      compact: 'Compatto',
      normal: 'Normale',
      relaxed: 'Ampio',
      photo: 'Foto',
      inlineEdit: 'Modifica Testo',
      doneEdit: 'Fine',
      jsonBackup: 'Backup JSON',
      otherLangs: 'Altre Lingue',
      advisor: 'Modelli',
      wordBtn: 'Word (.docx)',
      pdfBtn: 'PDF',
      generating: 'Esportazione...'
    },
    healthCriteria: {
      contact: {
        title: 'Intestazione & Contatti',
        category: 'Intestazione',
        passed: 'Intestazione completa con nome, titolo e recapiti.',
        warning: 'Manca LinkedIn o prefisso internazionale.',
        missing: 'Campi di contatto essenziali vuoti.',
        rec: 'I sistemi ATS richiedono nome completo, titolo target, email, telefono e LinkedIn.',
        action: 'Completa Contatti'
      },
      summary: {
        title: 'Profilo Executive',
        category: 'Posizionamento',
        passed: 'Sommario conciso focalizzato su seniority e valore.',
        warning: 'Profilo breve (< 140 caratteri); amplialo per l’ATS.',
        missing: 'Profilo assente. I recruiter leggono l’alto pagina in 6 secondi.',
        rec: 'Scrivi 3–5 righe con anni di esperienza e risultati misurabili.',
        action: 'Ottimizza Profilo'
      },
      experience: {
        title: 'Esperienze & Metriche (Google XYZ)',
        category: 'Impatto',
        passedSuffix: 'risultati quantificati con numeri o percentuali.',
        warning: 'Le esperienze mancano di sufficienti metriche numeriche.',
        missing: 'Nessuna esperienza lavorativa inserita.',
        rec: 'Applica la formula Google XYZ: «Ottenuto [X], misurato da [Y], tramite [Z]».',
        action: 'Ottimizza Risultati'
      },
      competencies: {
        title: 'Competenze & Parole Chiave ATS',
        category: 'Indicizzazione',
        passedSuffix: 'aree di competenza strutturate per i filtri ATS.',
        warning: 'Poche competenze elencate per i filtri dell’offerta.',
        missing: 'Nessuna competenza aggiunta.',
        rec: 'Includi strumenti e metodologie esattamente come nell’annuncio.',
        action: 'Analizza nel Radar ATS'
      },
      education: {
        title: 'Formazione Accademica',
        category: 'Titoli',
        passed: 'Titoli e atenei formattati correttamente.',
        warning: 'Istituzione o periodo incompleti.',
        missing: 'Nessuna formazione registrata.',
        rec: 'Indica titolo completo, istituto e periodo.',
        action: 'Aggiungi Formazione'
      },
      global: {
        title: 'Lingue & Certificazioni',
        category: 'Plus',
        passed: 'Lingue su scala QCER e certificazioni incluse.',
        warning: 'Aggiungi certificazioni o una seconda lingua con livello QCER.',
        missing: 'Nessuna lingua o certificazione indicata.',
        rec: 'Usa livelli standard QCER (C2, C1, B2) e sigle ufficiali.',
        action: 'Aggiungi Lingue'
      }
    },
    myResumes: {
      title: 'I Miei CV Salvati',
      cloudActive: 'Cloud Attivo',
      localOnly: 'Archivio Locale',
      subtitleAuth: 'I tuoi CV sono salvati in sicurezza nel cloud sul tuo account.',
      subtitleVisitor: 'Accedi o registrati per salvare i tuoi CV nel cloud.',
      placeholder: 'Dai un nome alla versione (es: CV Operations Director 2026)...',
      saveBtn: 'Salva Versione',
      savingBtn: 'Salvataggio...',
      savedBtn: 'Salvato!',
      savedCountLabel: 'CV Salvati',
      newBlankBtn: '+ Inizia da Zero',
      loadDefaultBtn: 'Carica Esempio Base'
    },
    advisor: {
      title: 'Guida Strategica ai Modelli di CV',
      badge: 'Internazionale & ATS',
      subtitle: 'Scopri quando usare ogni formato in base a paese, settore e foto.',
      goldRulePrefix: 'Regola d’Oro della Foto:',
      goldRuleText:
        'Usa la foto in Europa Continentale. Rimuovila negli USA, Regno Unito e portali ATS (Workday).',
      whyNoPhotoBtn: 'Perché evitare la foto negli USA?',
      hideRuleBtn: 'Nascondi dettagli',
      filterAll: 'Tutti',
      filterWithPhoto: 'Con Foto (Europa)',
      filterNoPhoto: 'Senza Foto (USA / ATS)',
      filterExec: 'Executive & Tech',
      applyBtn: 'Applica Modello'
    },
    editorSteps: {
      profile: 'Profilo & Sommario',
      career: 'Esperienze',
      credentials: 'Studi & Skills',
      structure: 'Modello & Stile',
      prev: 'Indietro',
      next: 'Avanti',
      finish: 'Vedi A4'
    }
  }
};
