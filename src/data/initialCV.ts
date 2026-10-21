import { CVData, PricingPlan } from '../types/cv';

// Generic Clean Default Template for SaaS Users
export const GENERIC_DEFAULT_CV: CVData = {
  personalDetails: {
    name: 'SEU NOME COMPLETO',
    title: 'Especialista em Gestão de Projetos & Sistemas de Informação',
    location: 'Luanda, Angola (Disponível para Mobilidade)',
    phone: '+244 923 000 000',
    email: 'seu.email@exemplo.com',
    linkedin: 'linkedin.com/in/seu-perfil',
    website: 'https://seusite-ou-portfolio.com',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face&auto=format&q=80',
    showPhoto: true
  },
  summary:
    'Profissional sênior com sólida experiência no planeamento estratégico, monitoria de resultados e transformação digital em programas multissetoriais. Especialista em desenho de sistemas de informação, garantia da qualidade de dados (DQA) e desenvolvimento de painéis executivos para apoio à tomada de decisões e reporte institucional. Histórico comprovado de liderança técnica em equipas multidisciplinares e articulação com parceiros nacionais e internacionais.',
  competencies: [
    {
      id: 'comp-1',
      category: 'Gestão Orientada para Resultados (RBM)',
      description:
        'Desenho de Quadros Lógicos (Logframes), definição de indicadores de impacto e planos de monitoria e avaliação.'
    },
    {
      id: 'comp-2',
      category: 'Sistemas Digitais & Recolha de Dados',
      description:
        'Implementação de ferramentas móveis (KoboToolbox, ODK), arquitetura de bases de dados relacionais e fluxos automatizados.'
    },
    {
      id: 'comp-3',
      category: 'Business Intelligence & Visualização',
      description:
        'Construção de dashboards interativos em Power BI, análise estatística e relatórios estratégicos para liderança executiva.'
    },
    {
      id: 'comp-4',
      category: 'Garantia de Qualidade & Auditoria de Dados',
      description:
        'Protocolos de validação de dados em tempo real, inquéritos de campo, amostragem e integridade da informação.'
    },
    {
      id: 'comp-5',
      category: 'Coordenação de Consórcios & Capacitação',
      description:
        'Gestão de parcerias com entidades públicas e privadas, formação de equipas e elaboração de manuais operacionais.'
    }
  ],
  experiences: [
    {
      id: 'exp-1',
      company: 'Programa de Desenvolvimento & Resiliência Institucional',
      role: 'Coordenador Sénior de Sistemas de Informação & MEAL',
      period: '2022 – Presente',
      location: 'Luanda & Províncias',
      donor: 'Financiamento Internacional Multilateral',
      highlights: [
        'Liderou a concepção e implementação da plataforma digital colaborativa do sistema de monitoria orientada a resultados.',
        'Estruturou fluxos de dados de campo automatizados, reduzindo em 45% o tempo de processamento e reporte para os financiadores.',
        'Implementou regras de validação e critérios de alerta pré-análise, assegurando a integridade dos dados antes do cálculo de indicadores.',
        'Desenvolveu dashboards analíticos interativos em Power BI para acompanhamento em tempo real de metas operacionais.',
        'Capacitou mais de 80 técnicos e pontos focais provinciais em recolha de dados móvel e padrões de segurança da informação.'
      ]
    },
    {
      id: 'exp-2',
      company: 'Agência Internacional de Cooperação Técnica',
      role: 'Especialista em Gestão de Dados & Análise Estatística',
      period: '2019 – 2022',
      location: 'Luanda, Angola',
      donor: 'Operações Nacionais e Regionais',
      highlights: [
        'Coordenou o desenho de inquéritos de campo e avaliação de impacto para beneficiários em múltiplas províncias.',
        'Automatizou rotinas de limpeza e reconciliação de dados em Python e SQL, eliminando redundâncias e inconsistências.',
        'Elaborou relatórios técnicos periódicos de progresso e apresentações estratégicas para o conselho diretivo.',
        'Geriu fluxos de aquisição e logística de equipamentos de tecnologia para equipas móveis de campo.'
      ]
    }
  ],
  educations: [
    {
      id: 'edu-1',
      degree: 'Mestrado em Gestão de Sistemas de Informação / Informática Aplicada',
      institution: 'Universidade de Referência',
      period: '2020 – 2022'
    },
    {
      id: 'edu-2',
      degree: 'Licenciatura em Engenharia Informática / Ciências da Computação',
      institution: 'Faculdade de Engenharia',
      period: '2015 – 2019',
      gpaOrHonors: 'Com Distinção Académica'
    }
  ],
  trainings: [
    'Gestão de Projetos e Monitoria Orientada para Resultados (Normas Internacionais)',
    'Visualização Avançada de Dados e Modelagem DAX com Microsoft Power BI',
    'Desenho de Inquéritos Eletrónicos e Gestão de Bases de Dados (KoboToolbox, ODK)',
    'Segurança da Informação e Conformidade com Proteção de Dados'
  ],
  languages: [
    {
      language: 'Português',
      level: 'Língua Materna / Fluente'
    },
    {
      language: 'Inglês',
      level: 'Proficiência Profissional (Relatórios e Reuniões de Trabalho)'
    },
    {
      language: 'Francês / Espanhol',
      level: 'Conhecimento Operacional'
    }
  ],
  references: [
    {
      id: 'ref-1',
      name: 'Nome do Supervisor / Referência 1',
      institutionAndPosition: 'Organização Internacional\nDiretor de Programa / Especialista Sénior',
      contact: 'contacto1@organizacao.org'
    },
    {
      id: 'ref-2',
      name: 'Nome do Supervisor / Referência 2',
      institutionAndPosition: 'Instituição de Cooperação Técnica\nCoordenador de Monitoria & Avaliação',
      contact: 'contacto2@organizacao.org'
    }
  ],
  templateStyle: 'un_classic'
};

// Rich Demonstration Profile (Agostinho do Rosário - MEAL, FRESAN / Camões, WFP, INE)
export const AGOSTINHO_CV: CVData = {
  personalDetails: {
    name: 'AGOSTINHO DO ROSÁRIO',
    title: 'MEAL & Information Systems Specialist | Senior Data Expert',
    location: 'Luanda, Angola',
    phone: '+244 930 744 338',
    email: 'rosarioabderval@gmail.com',
    linkedin: 'linkedin.com/in/abderval',
    website: 'https://sgi-fresancamoes.com/',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face&auto=format&q=80',
    showPhoto: true
  },
  summary:
    'Especialista Sénior em Monitoria, Avaliação, Prestação de Contas e Aprendizagem (MEAL) e Arquitetura de Sistemas de Informação, com mais de 7 anos de experiência de liderança técnica em programas de grande escala de cooperação internacional e desenvolvimento comunitário financiados pela União Europeia (FRESAN / Camões, I.P.) e Sistema das Nações Unidas (WFP Angola). Especializado no desenho e colocação em produção de plataformas digitais colaborativas para gestão de informação orientada a resultados (RBM / OCDE CAD), automação de fluxos de recolha de dados móvel (KoboToolbox, ODK, WFP MoDA, Survey Solutions), garantia de qualidade e integridade de dados (DQA), e modelagem analítica em Microsoft Power BI para apoio à tomada de decisões estratégicas de alto nível.',
  competencies: [
    {
      id: 'comp-1',
      category: 'Sistemas MEAL & RBM (OCDE/CAD)',
      description:
        'Concepção de Quadros Lógicos (Logframe), Matrizes de Indicadores PIRS, Planos de Monitoria & Avaliação e relatórios de progresso para doadores internacionais (UE, ONU).'
    },
    {
      id: 'comp-2',
      category: 'Arquitetura de Plataformas Digitais & Web',
      description:
        'Desenvolvimento completo de plataformas colaborativas de gestão de informação (MVP), interfaces públicas e privadas, regras de validação pré-análise e produção (ex: https://sgi-fresancamoes.com/).'
    },
    {
      id: 'comp-3',
      category: 'Recolha Móvel de Dados & DQA',
      description:
        'Estruturação avançada de formulários e questionários digitais (KoboToolbox, ODK, Survey Solutions, MoDA), protocolos de amostragem probabilística e auditorias de qualidade de dados no terreno.'
    },
    {
      id: 'comp-4',
      category: 'Business Intelligence & Análise Estatística',
      description:
        'Modelagem de dashboards analíticos executivos em Power BI, DAX avançado, automação de ETL em Python/R e processamento estatístico em SPSS e STATA.'
    },
    {
      id: 'comp-5',
      category: 'Sistemas de Informação Geográfica (SIG)',
      description:
        'Análise espacial de vulnerabilidade alimentar, mapeamento de beneficiários e infraestruturas comunitárias em ArcGIS e QGIS.'
    },
    {
      id: 'comp-6',
      category: 'Gestão de Consórcios & Capacitação',
      description:
        'Coordenação técnica com ministérios centrais (INE, MINAGRIF) e parceiros de implementação; facilitação de capacitação técnica a mais de 150 pontos focais e supervisores de campo.'
    }
  ],
  experiences: [
    {
      id: 'exp-fresan',
      company: 'Programa FRESAN / Camões, I.P. (Instituto da Cooperação e da Língua)',
      role: 'Consultor Especialista em Desenvolvimento de Software & Sistemas MEAL',
      period: '09/2023 – 11/2023',
      location: 'Lubango, Huíla / Luanda, Angola',
      donor: 'Financiamento: União Europeia (€65 Milhões) | Co-gestão: Camões, I.P., FAO, PNUD e Vall d’Hebron',
      highlights: [
        'Liderou o desenvolvimento integral e entrada em produção do MVP da Plataforma Digital Colaborativa do Sistema de Informação MEAL (disponível em https://sgi-fresancamoes.com/).',
        'Estruturou as interfaces pública e privada para monitoria, avaliação e aprendizagem orientada para resultados, garantindo conformidade com a Política de Segurança da Informação do Camões, I.P.',
        'Automatizou os fluxos descentralizados de receção e processamento de dados provinciais da Huíla, Namibe e Cunene, estabelecendo regras de alerta pré-análise para validação técnica da UIC.',
        'Alinhou o sistema informático com os critérios de avaliação da OCDE/CAD (2019) e forneceu manuais e formação técnica à equipa central de gestão do programa.'
      ]
    },
    {
      id: 'exp-wfp',
      company: 'Programa Alimentar Mundial das Nações Unidas (WFP)',
      role: 'Especialista em Gestão de Dados VAM (Vulnerability Analysis and Mapping) & MEAL',
      period: '2021 – Presente',
      location: 'Luanda & Missões de Campo Provinciais, Angola',
      donor: 'Sistema das Nações Unidas / Resposta Humanitária & Resiliência',
      highlights: [
        'Coordenou inquéritos nacionais de segurança alimentar e nutricional de grande escala, parametrizando questionários complexos em KoboToolbox, ODK e WFP MoDA.',
        'Desenvolveu dashboards interativos em Power BI para acompanhamento em tempo real da distribuição alimentar, assistência financeira e indicadores como FCS (Food Consumption Score) e rCSI.',
        'Conduziu auditorias sistemáticas de Data Quality Assurance (DQA) e limpeza estatística em Python e SPSS, assegurando dados confiáveis para relatórios executivos do Escritório de País.',
        'Formou e supervisionou mais de 100 agentes de recolha de campo e pontos focais provinciais em boas práticas de integridade de dados e proteção de informação pessoal de beneficiários.'
      ]
    },
    {
      id: 'exp-ine',
      company: 'Instituto Nacional de Estatística de Angola (INE)',
      role: 'Especialista em Processamento de Dados & Engenharia de Sistemas',
      period: '2019 – 2021',
      location: 'Luanda, Angola',
      donor: 'Governo de Angola / Banco Mundial',
      highlights: [
        'Atuou no processamento e consistência lógica dos microdados do Recenseamento Agro-Pecuário e Pescas (RAPP) utilizando o sistema CAPI Survey Solutions do Banco Mundial.',
        'Desenvolveu algoritmos de consistência automática e reconciliação entre questionários provinciais, eliminando duplicidades e taxas de omissão.',
        'Participou na reformulação e suporte à infraestrutura do portal oficial de difusão de estatísticas económicas e demográficas de Angola.'
      ]
    }
  ],
  educations: [
    {
      id: 'edu-1',
      degree: 'Mestrado em Informática Aplicada (Especialização em Análise de Dados e Sistemas)',
      institution: 'Universidade de Referência Internacional',
      period: '2023 – 2025'
    },
    {
      id: 'edu-2',
      degree: 'Licenciatura em Engenharia Informática',
      institution: 'Faculdade de Engenharia',
      period: '2014 – 2019',
      gpaOrHonors: 'Média de Conclusão: 4.34 / 5.0 (Excelente)'
    }
  ],
  trainings: [
    'Monitoria e Avaliação Orientada para Resultados (RBM) em Organizações Internacionais',
    'Microsoft Certified: Power BI Data Analyst Associate (Modelagem DAX, Power Query & Dashboards)',
    'Desenho de Inquéritos Complexos e Infraestrutura Eletrónica CAPI (KoboToolbox, ODK, Survey Solutions)',
    'Gestão e Análise de Dados Espaciais em ArcGIS e QGIS para Avaliação Humanitária',
    'Normas de Segurança da Informação e Proteção de Dados (RGPD / Normas Camões, I.P.)'
  ],
  languages: [
    {
      language: 'Português',
      level: 'Língua Materna / Fluente'
    },
    {
      language: 'Inglês',
      level: 'Proficiência Profissional Plena (Relatórios Técnicos e Apresentações Internacionais)'
    },
    {
      language: 'Francês',
      level: 'Conhecimento Operacional'
    }
  ],
  references: [
    {
      id: 'ref-1',
      name: 'Aliou Diouf Mballo',
      institutionAndPosition: 'Escritório da Coordenação Residente das Nações Unidas em Cabo Verde\nEconomista Sénior',
      contact: 'aliou.mballo@un.org | mballoaliou2000@yahoo.fr'
    },
    {
      id: 'ref-2',
      name: 'António Paulo',
      institutionAndPosition: 'Programa FRESAN / Camões, I.P.\nCoordenador de Monitoria & Avaliação (M&A)',
      contact: 'apaulo2007@hotmail.com'
    }
  ],
  templateStyle: 'un_classic'
};

// Tech Lead & Cloud Architect Demonstration Profile
export const TECH_LEAD_CV: CVData = {
  personalDetails: {
    name: 'MANUEL SANTOS SILVA',
    title: 'Lead Software Architect & Engineering Manager | Cloud & AI',
    location: 'Luanda, Angola / Remoto Global',
    phone: '+244 924 111 222',
    email: 'manuel.silva@tech-solutions.io',
    linkedin: 'linkedin.com/in/manuelsilva-tech',
    website: 'https://github.com/manuelsilva-dev'
  },
  summary:
    'Líder Técnico e Arquiteto de Software com 8+ anos de experiência na concepção e escalabilidade de plataformas SaaS de alta disponibilidade, arquiteturas orientadas a eventos e pipelines de inteligência artificial. Histórico comprovado de liderança de equipas de engenharia ágeis, redução de custos de infraestrutura em 40% na cloud (AWS/GCP) e aceleração de ciclos de release com rigorosos padrões de segurança DevSecOps.',
  competencies: [
    {
      id: 'comp-tech-1',
      category: 'Arquitetura de Software & Cloud',
      description: 'Microsserviços, Kubernetes, Docker, AWS (ECS, Lambda, RDS), Terraform e arquiteturas serverless.'
    },
    {
      id: 'comp-tech-2',
      category: 'Engenharia Full Stack & APIs',
      description: 'TypeScript, Node.js, React, Next.js, Python, PostgreSQL, Redis e desenho de APIs RESTful / GraphQL de baixa latência.'
    },
    {
      id: 'comp-tech-3',
      category: 'CI/CD & DevSecOps',
      description: 'Pipelines automatizados no GitHub Actions, monitorização com Datadog/Prometheus e auditorias de segurança OWASP.'
    },
    {
      id: 'comp-tech-4',
      category: 'Liderança Técnica & Mentoria',
      description: 'Gestão de equipas ágeis (Scrum/Kanban), contratação de talentos de engenharia e cultura de código limpo.'
    }
  ],
  experiences: [
    {
      id: 'exp-tech-1',
      company: 'Fintech Nexus International',
      role: 'Staff Software Architect & Lead',
      period: '2022 – Presente',
      location: 'Luanda & Híbrido',
      highlights: [
        'Arquitetou a plataforma de pagamentos multimoeda processando mais de $15M/mês com 99.99% de disponibilidade.',
        'Migrou monolito legado para microsserviços em Kubernetes, diminuindo a latência média de resposta de 420ms para 65ms.',
        'Implementou esteiras automatizadas de CI/CD, aumentando a frequência de deploys de quinzenais para múltiplos deploys diários.',
        'Liderou e mentorou equipa de 14 engenheiros full-stack distribuídos geograficamente.'
      ]
    },
    {
      id: 'exp-tech-2',
      company: 'Digital Systems Enterprise',
      role: 'Senior Full Stack Engineer',
      period: '2019 – 2022',
      highlights: [
        'Desenvolveu sistemas de gestão transacional de alta concorrência em React, Node.js e PostgreSQL.',
        'Otimizou consultas de banco de dados e camadas de cache Redis, reduzindo custos de servidores em 35%.'
      ]
    }
  ],
  educations: [
    {
      id: 'edu-tech-1',
      degree: 'Mestrado em Engenharia de Software e Sistemas Distribuídos',
      institution: 'Universidade de Tecnologia',
      period: '2020 – 2022'
    },
    {
      id: 'edu-tech-2',
      degree: 'Licenciatura em Ciências da Computação',
      institution: 'Faculdade de Ciências',
      period: '2015 – 2019',
      gpaOrHonors: 'Primeiro da Turma com Louvor'
    }
  ],
  trainings: [
    'AWS Certified Solutions Architect – Professional',
    'Kubernetes Certified Administrator (CKA)',
    'Enterprise Cloud Security & ISO 27001'
  ],
  languages: [
    { language: 'Português', level: 'Nativo / Fluente' },
    { language: 'Inglês', level: 'Fluência Plena (Trabalho Internacional diário)' }
  ],
  references: [
    {
      id: 'ref-tech-1',
      name: 'Carlos Oliveira',
      institutionAndPosition: 'Fintech Nexus / Chief Technology Officer (CTO)',
      contact: 'carlos.oliveira@nexus.io'
    }
  ],
  templateStyle: 'european_modern'
};

// Blank template for starting completely fresh
export const BLANK_CV: CVData = {
  personalDetails: {
    name: '',
    title: '',
    location: '',
    phone: '',
    email: '',
    linkedin: '',
    website: ''
  },
  summary: '',
  competencies: [],
  experiences: [],
  educations: [],
  trainings: [],
  languages: [],
  references: [],
  templateStyle: 'un_classic'
};

// SaaS Pricing Plans
export const SAAS_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    tagline: 'Ideal para experimentar e criar o seu primeiro currículo profissional.',
    priceMonthly: 'Grátis',
    priceYearly: 'Grátis para sempre',
    priceMonthlyValue: 0,
    priceYearlyValue: 0,
    currency: 'USD',
    creditsMonthly: 5,
    features: [
      '1 Currículo ativo',
      'Exportação para formato PDF / Impressão',
      'Diagnóstico ATS Básico',
      'Modelos Clássico e Moderno',
      'Editor em tempo real'
    ],
    isPopular: false,
    ctaText: 'Plano Atual'
  },
  {
    id: 'pro',
    name: 'Profissional',
    tagline: 'O plano mais escolhido por candidatos que querem garantir a vaga desejada.',
    priceMonthly: '$29 / Mês',
    priceYearly: '$240 / Ano (Poupe 25%)',
    priceMonthlyValue: 29,
    priceYearlyValue: 240,
    currency: 'USD',
    creditsMonthly: 9999,
    features: [
      'Currículos Ilimitados',
      'Geração e Otimização com IA Gemini Ilimitada',
      'Exportação Direta em Microsoft Word (.docx)',
      'Radar ATS 95%+ com Inserção de Palavras-Chave em 1 Clique',
      'Cartas de Apresentação em Inglês, Português, Francês e Espanhol',
      'Importação Direta de Perfil do LinkedIn',
      'Sincronização Cloud Firestore em Tempo Real'
    ],
    isPopular: true,
    ctaText: 'Subscrever Plano Pro'
  },
  {
    id: 'executive',
    name: 'Executivo VIP',
    tagline: 'Para líderes e consultores que disputam posições de topo no mercado global.',
    priceMonthly: '$49 / Mês',
    priceYearly: '$440 / Ano (Poupe 25%)',
    priceMonthlyValue: 49,
    priceYearlyValue: 440,
    currency: 'USD',
    creditsMonthly: 9999,
    features: [
      'Tudo incluído no Plano Profissional',
      'Modelos Oficiais Nações Unidas (P11 & UN Classic)',
      'Scripts Python para Compilação Local Offline',
      'Auditoria Completa de Perfil LinkedIn por Especialista',
      'Revisão Humana de Candidatura Internacional (ONU / UE)',
      'Consultoria Técnica e Suporte Executivo WhatsApp'
    ],
    isPopular: false,
    ctaText: 'Subscrever Executivo'
  }
];

export const SAMPLE_JOB_OFFERS = [
  {
    id: 'job-fresan',
    title: 'FRESAN / Camões, I.P. - TdR Desenvolvimento Software MVP MEAL',
    organization: 'União Europeia & Camões, I.P.',
    description: `TERMOS DE REFERÊNCIA (TdR):
AQUISIÇÃO DE SERVIÇO DE DESENVOLVIMENTO DE SOFTWARE PARA O DESENVOLVIMENTO DE UM MVP (MINIMUM VIABLE PRODUCT) E CONFIGURAÇÃO DA PLATAFORMA DIGITAL (INTERFACE PÚBLICA E PRIVADA) DO SISTEMA DE INFORMAÇÃO | MONITORIA, AVALIAÇÃO E APRENDIZAGEM ORIENTADA PARA RESULTADOS, NO ÂMBITO DO PROJETO FORTALECIMENTO DA RESILIÊNCIA E DA SEGURANÇA ALIMENTAR E NUTRICIONAL EM ANGOLA | FRESAN/CAMÕES, I.P.

1. ENQUADRAMENTO:
O programa FRESAN, iniciativa do Governo de Angola financiada pela União Europeia (€65M) e co-gerido pelo Camões, I.P. em articulação com FAO e PNUD, tem por objetivo reduzir a fome e pobreza nas províncias do sul de Angola (Cunene, Huíla e Namibe).
O Sistema de Informação (SI) da Unidade de Implementação do Camões, I.P. (UIC) sediada no Lubango envolve a recolha, gestão, processamento e visualização contínua de informação para tomada de decisão e reporte institucional.

2. OBJETIVOS ESPECÍFICOS DA ASSISTÊNCIA TÉCNICA:
- Desenvolver um MVP responsivo associado à configuração da Plataforma Digital Colaborativa (interfaces pública e privada) em https://sgi-fresancamoes.com/.
- Estruturar os fluxos automatizados de recolha e validação de dados de campo das províncias da Huíla, Namibe e Cunene.
- Implementar regras de alerta pré-análise para apoiar a equipa de Monitoria e Avaliação (M&A).
- Assegurar conformidade com as orientações da OCDE/CAD (2019) e com a Política de Segurança da Informação do Camões, I.P.`
  },
  {
    id: 'job-1',
    title: 'Organização Internacional - Coordenador de Projetos & Sistemas MEAL',
    organization: 'Agência Internacional de Desenvolvimento',
    description: `Cargo: Coordenador de Sistemas de Informação e Monitoria (MEAL)
Localização: Luanda, Angola (com deslocações provinciais)
Tipo de Contrato: Consultoria / Contrato Internacional

Responsabilidades Principais:
- Liderar o desenho e implementação do Plano de Monitoria, Avaliação, Prestação de Contas e Aprendizagem (MEAL) e Quadro Lógico do projeto.
- Conceber a arquitetura da plataforma digital colaborativa do sistema de gestão de informação.
- Estruturar inquéritos móveis (KoboToolbox, ODK, Survey Solutions) e garantir protocolos de qualidade de dados (DQA).
- Desenvolver dashboards executivos em Power BI para suporte a decisões estratégicas e reporte a financiadores internacionais.
- Assegurar conformidade com normas internacionais OECD/DAC e políticas de segurança da informação.
- Coordenar com entidades governamentais, parceiros do consórcio e equipas multidisciplinares de campo.

Requisitos:
- Formação superior (Mestrado preferencial) em Engenharia Informática, Gestão de Sistemas de Informação, Estatística ou áreas afins.
- Mínimo de 3 a 5 anos de experiência comprovada em programas de cooperação internacional ou grandes projetos de desenvolvimento.
- Domínio prático de ferramentas de BI (Power BI), recolha móvel (Kobo) e análise de dados.
- Fluência oral e escrita em Português e Inglês.`
  },
  {
    id: 'job-2',
    title: 'ONU / Nações Unidas - Especialista em Dados & Avaliação de Impacto',
    organization: 'Sistema das Nações Unidas',
    description: `Position: Senior Data & Monitoring Specialist
Organization: United Nations Agency
Duty Station: Country Office / Regional Bureau

Responsibilities:
- Lead the design, operationalization, and maintenance of project indicator tracking tables and results frameworks.
- Oversee electronic mobile data collection pipelines, sample design, and statistical data cleaning.
- Model executive interactive monitoring dashboards in Power BI and geospatial analysis in GIS.
- Train and mentor provincial monitoring focal points and survey enumerators on data integrity standards.
- Prepare technical briefing notes and annual donor analytical reports.

Requirements:
- Advanced degree in Computer Science, Data Engineering, Statistics, or Development Economics.
- Minimum 4 years of relevant professional experience with UN or EU-funded interventions.
- Professional fluency in English and Portuguese.`
  },
  {
    id: 'job-3',
    title: 'Empresa de Tecnologia & Dados - Arquiteto de Dados e BI Lead',
    organization: 'Tech & Enterprise Analytics',
    description: `Cargo: Lead de Engenharia de Dados & Business Intelligence
Regime: Híbrido / Internacional

Responsabilidades:
- Arquitetar pipelines modernos de dados e automação de fluxos analíticos (ETL/ELT).
- Estruturar relatórios executivos em Power BI e modelagem dimensional em SQL.
- Liderar a transição digital e garantir governação e privacidade dos dados institucionais.
- Colaborar estreitamente com diretores executivos na tomada de decisões estratégicas baseadas em dados.`
  }
];
