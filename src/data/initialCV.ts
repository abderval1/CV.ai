import { CVData, PricingPlan } from '../types/cv';

// High-Converting Modern Default Executive Profile
export const GENERIC_DEFAULT_CV: CVData = {
  personalDetails: {
    name: 'ALEXANDRE MENDES',
    title: 'Chief Operating Officer (COO) | Head de Operações & Transformação Digital',
    location: 'São Paulo, Brasil (Disponibilidade para Mobilidade Global)',
    phone: '+55 11 98765-4321',
    email: 'alexandre.mendes@executivoglobal.com',
    linkedin: 'linkedin.com/in/alexandre-mendes-coo',
    website: 'https://alexandremendes.com',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face&auto=format&q=80',
    showPhoto: false
  },
  summary:
    'Executivo sênior de operações e estratégia corporativa com mais de 12 anos de experiência liderando reestruturações organizacionais, escalabilidade de produtos digitais e governança orientada a dados em corporações multinacionais e empresas de alto crescimento. Histórico comprovado de gestão de orçamentos superiores a US$ 35M, redução de despesas operacionais em até 32% e liderança de equipas multifuncionais de mais de 120 profissionais em mercados competitivos.',
  competencies: [
    {
      id: 'comp-1',
      category: 'Liderança Estratégica & Gestão P&L',
      description:
        'Planeamento estratégico de longo prazo, gestão integral de demonstrações financeiras (P&L), alocação de capital e governança de risco corporativo.'
    },
    {
      id: 'comp-2',
      category: 'Transformação Digital & Automação de Processos',
      description:
        'Implementação de arquiteturas de dados empresariais, migração para sistemas em nuvem, otimização de fluxos com IA e metodologias ágeis em escala.'
    },
    {
      id: 'comp-3',
      category: 'Business Intelligence & Métricas Executivas',
      description:
        'Definição de OKRs e KPIs estratégicos, modelagem de painéis executivos de tomada de decisão e análise preditiva de receita e rentabilidade.'
    },
    {
      id: 'comp-4',
      category: 'Fusões, Aquisições & Parcerias Globais',
      description:
        'Due diligence operacional em processos de M&A, integração pós-fusão de plataformas e negociação de contratos de fornecimento global.'
    },
    {
      id: 'comp-5',
      category: 'Desenvolvimento de Lideranças & Cultura de Alta Performance',
      description:
        'Formação e retenção de executivos, alinhamento cultural entre departamentos e estruturação de planos de incentivos e retenção de talentos chave.'
    }
  ],
  experiences: [
    {
      id: 'exp-1',
      company: 'OmniVanguard Holdings & Technologies',
      role: 'Chief Operating Officer (COO) & Vice-Presidente de Operações',
      period: '2021 – Presente',
      location: 'São Paulo & Operações Globais',
      highlights: [
        'Liderou a operação global abrangendo 4 centros regionais e mais de 140 colaboradores, alcançando crescimento de 48% na receita anual composta.',
        'Redesenhou a cadeia de valor e processos internos, gerando poupança operacional auditada de US$ 8.4M em 18 meses.',
        'Implantou cultura de tomada de decisão baseada em inteligência de dados, reduzindo o ciclo de lançamento de novos serviços de 9 meses para 11 semanas.',
        'Conduziu a integração operacional de duas empresas adquiridas via M&A, unificando sistemas ERP e equipas sem qualquer interrupção de serviço aos clientes enterprise.',
        'Aumentou o Net Promoter Score (NPS) corporativo de 54 para 81 pontos através de programas de excelência operacional e customer success.'
      ]
    },
    {
      id: 'exp-2',
      company: 'Apex Global Strategic Partners',
      role: 'Diretor de Eficiência Operacional & Projetos Especiais',
      period: '2017 – 2021',
      location: 'São Paulo / Lisboa',
      highlights: [
        'Geriu portfólio de 16 projetos estratégicos de inovação e automação para clientes dos setores financeiro, logística e telecomunicações.',
        'Desenvolveu modelos de simulação financeira e cenários de stress para otimização de custos fixos, com retorno sobre investimento (ROI) médio de 320%.',
        'Estruturou o centro de excelência em governança corporativa e compliance, assegurando 100% de aprovação em auditorias externas independentes.',
        'Coordenou equipa multidisciplinar de 35 especialistas em gestão de mudança, assegurando adoção tecnológica com taxa de adesão superior a 95%.'
      ]
    },
    {
      id: 'exp-3',
      company: 'Continental Business Advisory',
      role: 'Gerente Sénior de Consultoria de Gestão',
      period: '2013 – 2017',
      location: 'São Paulo, Brasil',
      highlights: [
        'Conduziu diagnósticos operacionais e reengenharia de processos para empresas listadas em bolsa.',
        'Elaborou relatórios de recomendação estratégica e apresentações para Conselhos de Administração e comités de auditoria.'
      ]
    }
  ],
  educations: [
    {
      id: 'edu-1',
      degree: 'Executive MBA (Liderança Global & Finanças Corporativas)',
      institution: 'Insead / Fundação Getulio Vargas (FGV)',
      period: '2018 – 2020',
      gpaOrHonors: 'Com Louvor Académico'
    },
    {
      id: 'edu-2',
      degree: 'Licenciatura em Engenharia de Produção & Gestão Industrial',
      institution: 'Universidade de São Paulo (USP)',
      period: '2008 – 2013'
    }
  ],
  trainings: [
    'Certificação Executiva em Inteligência Artificial para Negócios – MIT Sloan',
    'Governança Corporativa e Papel do Conselho de Administração – IBGC',
    'Lean Six Sigma Black Belt – Certificação Internacional de Excelência Operacional',
    'Gestão Estratégica de Crises & Continuidade de Negócios (ISO 22301)'
  ],
  languages: [
    {
      language: 'Português',
      level: 'Língua Materna / Fluente'
    },
    {
      language: 'Inglês',
      level: 'Proficiência Profissional Plena (C-Level & Negociações Internacionais)'
    },
    {
      language: 'Espanhol',
      level: 'Fluência de Negócios'
    }
  ],
  references: [
    {
      id: 'ref-1',
      name: 'Dr. Roberto Silveira',
      institutionAndPosition: 'OmniVanguard Holdings\nPresidente do Conselho de Administração (Chairman)',
      contact: 'roberto.silveira@omnivanguard.com'
    },
    {
      id: 'ref-2',
      name: 'Dra. Mariana Costa',
      institutionAndPosition: 'Apex Global Partners\nManaging Partner & CEO',
      contact: 'mariana.costa@apexglobal.com'
    }
  ],
  templateStyle: 'executive_harvard'
};

// Rich Executive Demonstration Profile (Beatriz Fonseca - VP Estratégia & Finanças)
export const EXECUTIVE_DEMO_CV: CVData = {
  personalDetails: {
    name: 'BEATRIZ FONSECA',
    title: 'Vice-Presidente de Estratégia Corporativa & Finanças Globais',
    location: 'Lisboa, Portugal / Disponibilidade para Viagens Internacionais',
    phone: '+351 912 345 678',
    email: 'beatriz.fonseca@finance-holding.com',
    linkedin: 'linkedin.com/in/beatriz-fonseca-exec',
    website: 'https://beatrizfonseca.io',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face&auto=format&q=80',
    showPhoto: false
  },
  summary:
    'Líder executiva com mais de 10 anos de experiência em estruturação de capital, expansão internacional e governança financeira para corporações globais e fundos de investimento. Especialista na condução de transações complexas de M&A superiores a €120M, otimização de liquidez corporativa e reporte analítico segundo as normas IFRS/US GAAP. Reconhecida pela capacidade de integrar estratégias de negócio com ferramentas modernas de automação analítica e modelos preditivos em larga escala.',
  competencies: [
    {
      id: 'comp-1',
      category: 'Engenharia Financeira & Estruturação de Capital',
      description:
        'Planeamento orçamental multianual, estruturação de dívida corporativa, emissão de obrigações e gestão de risco cambial e de taxas de juro.'
    },
    {
      id: 'comp-2',
      category: 'Fusões, Aquisições (M&A) & Joint Ventures',
      description:
        'Condução de processos de valuation DCF e múltiplos, coordenação de auditorias legais/financeiras e integração patrimonial.'
    },
    {
      id: 'comp-3',
      category: 'Governança Corporativa & Compliance IFRS',
      description:
        'Reporte financeiro a comités de auditoria, relações com investidores (IR) e garantia de conformidade com padrões Sarbanes-Oxley (SOX).'
    },
    {
      id: 'comp-4',
      category: 'Modelagem Preditiva & Business Intelligence',
      description:
        'Desenho de arquitetura analítica em Power BI, integração de pipelines SQL/Python e automação de reconciliações contábeis.'
    },
    {
      id: 'comp-5',
      category: 'Liderança de Negociações Internacionais',
      description:
        'Articulação junto a bancos de investimento internacionais, agências multilaterais e sindicatos bancários de crédito.'
    }
  ],
  experiences: [
    {
      id: 'exp-1',
      company: 'Aura Capital Global Partners',
      role: 'Vice-Presidente de Finanças Estratégicas & Investimentos',
      period: '2021 – Presente',
      location: 'Lisboa & Londres',
      highlights: [
        'Geriu a alocação de um fundo de investimento estratégico de €85M com taxa interna de rentabilidade (TIR) de 24.6% ao ano.',
        'Liderou a estruturação e fecho financeiro de 3 operações de aquisição internacional totalizando €140M em valor transacionado.',
        'Redesenhou a arquitetura de tesouraria do grupo, reduzindo despesas de juros em 22% através de estratégias ativas de hedging.',
        'Desenvolveu modelos analíticos de avaliação de risco que anteciparam volatilidades de mercado e protegeram a carteira patrimonial.',
        'Apresentou trimestralmente relatórios de desempenho e tesouraria para investidores institucionais e agências de rating.'
      ]
    },
    {
      id: 'exp-2',
      company: 'Meridian Corporation International',
      role: 'Diretora Sénior de Planeamento Financeiro & Análise (FP&A)',
      period: '2017 – 2021',
      location: 'Lisboa / Luanda / Madrid',
      highlights: [
        'Supervisionou o planeamento financeiro consolidado de 5 subsidiárias com faturação combinada de €210M.',
        'Automatizou os processos de encerramento mensal com ferramentas de BI, diminuindo o tempo de consolidação de 14 para 3 dias úteis.',
        'Implementou programa corporativo de gestão de custos que libertou €9.2M em capital de giro em 24 meses.',
        'Capacitou e geriu uma equipa internacional de 18 analistas e controllers seniores.'
      ]
    },
    {
      id: 'exp-3',
      company: 'Deloitte Corporate Finance Advisory',
      role: 'Gerente de Auditoria & Transações Financeiras',
      period: '2014 – 2017',
      location: 'Lisboa, Portugal',
      highlights: [
        'Conduziu auditorias abrangentes de demonstrações financeiras consolidadas para grupos cotados no índice PSI-20.',
        'Elaborou relatórios de due diligence financeira e identificou contingências fiscais em transações estratégicas.'
      ]
    }
  ],
  educations: [
    {
      id: 'edu-1',
      degree: 'Mestrado em Finanças e Mercados de Capitais',
      institution: 'Nova School of Business and Economics (Nova SBE)',
      period: '2012 – 2014',
      gpaOrHonors: 'Média de Conclusão: 18/20 (Summa Cum Laude)'
    },
    {
      id: 'edu-2',
      degree: 'Licenciatura em Economia e Gestão de Empresas',
      institution: 'Universidade Católica Portuguesa',
      period: '2008 – 2012'
    }
  ],
  trainings: [
    'Chartered Financial Analyst (CFA) – Charterholder',
    'Modelagem Financeira Avançada e Fusões & Aquisições – Wall Street Prep',
    'Governança de Risco em Instituições Financeiras – London Business School',
    'Power BI & Modelagem DAX para Direção Financeira'
  ],
  languages: [
    { language: 'Português', level: 'Língua Materna / Fluente' },
    { language: 'Inglês', level: 'Fluência Plena (Trabalho Executivo Internacional Diário)' },
    { language: 'Francês', level: 'Proficiência Profissional' }
  ],
  references: [
    {
      id: 'ref-1',
      name: 'Gonçalo Vasconcelos',
      institutionAndPosition: 'Aura Capital Global Partners\nManaging Partner & CEO',
      contact: 'g.vasconcelos@auracapital.com'
    },
    {
      id: 'ref-2',
      name: 'Sofia Henriques',
      institutionAndPosition: 'Meridian Corporation\nChief Financial Officer (CFO)',
      contact: 'sofia.henriques@meridiancorp.com'
    }
  ],
  templateStyle: 'ats_compact'
};

// Alias for backwards compatibility with any remaining references
export const AGOSTINHO_CV: CVData = EXECUTIVE_DEMO_CV;

// Tech Lead & Cloud Architect Demonstration Profile
export const TECH_LEAD_CV: CVData = {
  personalDetails: {
    name: 'MANUEL SANTOS SILVA',
    title: 'Lead Software Architect & Engineering Manager | Cloud & AI Systems',
    location: 'São Paulo, Brasil / Trabalho Remoto Internacional',
    phone: '+55 11 99123-4567',
    email: 'manuel.silva@tech-systems.io',
    linkedin: 'linkedin.com/in/manuelsilva-tech',
    website: 'https://github.com/manuelsilva-dev'
  },
  summary:
    'Líder Técnico e Arquiteto de Software com mais de 8 anos de experiência na concepção e escalabilidade de plataformas SaaS de alta disponibilidade, arquiteturas orientadas a eventos e integração de pipelines de inteligência artificial. Histórico comprovado de liderança de equipas de engenharia ágeis, redução de custos de infraestrutura em 42% na cloud (AWS/GCP) e aceleração de ciclos de release com rigorosos padrões de segurança DevSecOps.',
  competencies: [
    {
      id: 'comp-tech-1',
      category: 'Arquitetura de Software & Cloud Distribuída',
      description: 'Microsserviços, Kubernetes, Docker, AWS (ECS, Lambda, RDS), Terraform e arquiteturas serverless resilientes.'
    },
    {
      id: 'comp-tech-2',
      category: 'Engenharia Full Stack & APIs de Baixa Latência',
      description: 'TypeScript, Node.js, React, Next.js, Python, PostgreSQL, Redis e desenho de APIs RESTful / GraphQL com SLA 99.99%.'
    },
    {
      id: 'comp-tech-3',
      category: 'CI/CD, Observabilidade & DevSecOps',
      description: 'Pipelines automatizados no GitHub Actions, monitorização com Datadog/Prometheus e auditorias de segurança OWASP.'
    },
    {
      id: 'comp-tech-4',
      category: 'Liderança Técnica & Mentoria de Engenharia',
      description: 'Gestão de equipas ágeis (Scrum/Kanban), contratação de talentos de engenharia e cultura de código limpo e testes automatizados.'
    }
  ],
  experiences: [
    {
      id: 'exp-tech-1',
      company: 'Fintech Nexus International',
      role: 'Staff Software Architect & Engineering Lead',
      period: '2022 – Presente',
      location: 'Remoto Global',
      highlights: [
        'Arquitetou a plataforma de pagamentos multimoeda processando mais de $25M/mês com 99.99% de disponibilidade.',
        'Migrou monólito legado para microsserviços em Kubernetes, diminuindo a latência média de resposta de 420ms para 58ms.',
        'Implementou esteiras automatizadas de CI/CD, aumentando a frequência de deploys de quinzenais para múltiplos deploys diários.',
        'Liderou e mentorou equipa de 14 engenheiros full-stack distribuídos em 4 fusos horários.'
      ]
    },
    {
      id: 'exp-tech-2',
      company: 'Digital Systems Enterprise',
      role: 'Senior Full Stack Engineer',
      period: '2019 – 2022',
      highlights: [
        'Desenvolveu sistemas de gestão transacional de alta concorrência em React, Node.js e PostgreSQL.',
        'Otimizou consultas de banco de dados e camadas de cache Redis, reduzindo custos de servidores em 38%.'
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
      institution: 'Faculdade de Ciências da Computação',
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
    { language: 'Inglês', level: 'Fluência Plena (Trabalho Internacional Diário)' }
  ],
  references: [
    {
      id: 'ref-tech-1',
      name: 'Carlos Oliveira',
      institutionAndPosition: 'Fintech Nexus / Chief Technology Officer (CTO)',
      contact: 'carlos.oliveira@nexus.io'
    }
  ],
  templateStyle: 'tech_modern'
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
  templateStyle: 'executive_harvard'
};

// SaaS Pricing Plans - Strictly Paid Plans (No Free Tier)
export const SAAS_PLANS: PricingPlan[] = [
  {
    id: 'pro',
    name: 'Profissional Pro',
    tagline: 'O plano ideal para profissionais que querem acelerar convites de entrevista com ATS.',
    priceMonthly: '$29 / Mês',
    priceYearly: '$240 / Ano (Poupe 31%)',
    priceMonthlyValue: 29,
    priceYearlyValue: 240,
    currency: 'USD',
    creditsMonthly: 9999,
    features: [
      'Desbloqueio Imediato de Download Oficial (PDF & Word .docx)',
      'Documentos 100% Limpos e sem Marca de Água',
      'Criação & Edição de Currículos Ilimitados',
      'Otimização com Inteligência Artificial Ilimitada',
      'Radar ATS 95%+ com Análise Semântica de Vagas',
      'Cartas de Apresentação Estratégicas com IA',
      'Extração de Dados de PDF, Word e LinkedIn',
      'Sincronização Cloud Firestore em Tempo Real'
    ],
    isPopular: true,
    ctaText: 'Subscrever Plano Pro'
  },
  {
    id: 'executive',
    name: 'Executivo VIP',
    tagline: 'Para líderes, diretores e consultores que disputam posições de topo no mercado global.',
    priceMonthly: '$49 / Mês',
    priceYearly: '$440 / Ano (Poupe 25%)',
    priceMonthlyValue: 49,
    priceYearlyValue: 440,
    currency: 'USD',
    creditsMonthly: 9999,
    features: [
      'Tudo incluído no Plano Profissional Pro',
      'Downloads Ilimitados Oficiais em PDF e Word (.docx)',
      'Simulador de Entrevista STAR com Ditado por Voz & Scoring',
      'Todos os Modelos Executivos C-Level, Harvard, Europass e Big Tech',
      'Scripts Python para Compilação e Automação Offline',
      'Auditoria Avançada de Perfil LinkedIn',
      'Consultoria & Suporte Executivo Prioritário'
    ],
    isPopular: false,
    ctaText: 'Subscrever Executivo VIP'
  }
];

export const SAMPLE_JOB_OFFERS = [
  {
    id: 'job-1',
    title: 'Chief Operating Officer (COO) & Diretor de Operações Globais',
    organization: 'Multinacional de Tecnologia & Serviços Corporativos',
    description: `Cargo: Chief Operating Officer (COO)
Localização: Modelo Híbrido / Internacional
Regime: Contrato Executivo Sénior

Responsabilidades Principais:
- Liderar as operações globais da companhia, supervisionando processos de escalabilidade, eficiência operacional e gestão de P&L multissetorial.
- Conceber e executar a estratégia de transformação digital e automação de fluxos corporativos com inteligência analítica.
- Gerir orçamentos anuais consolidados superiores a US$ 30M, garantindo rigorosa governança, compliance e retorno sobre capital investido.
- Coordenar processos de due diligence em operações de M&A e liderar a integração pós-fusão de plataformas e equipas internacionais.
- Liderar, mentorar e desenvolver diretores funcionais (Tecnologia, Finanças, Operações e Produto), promovendo uma cultura de alta performance e excelência.

Requisitos:
- Formação superior em Engenharia, Administração ou Economia; MBA Executivo de escola de referência internacional altamente valorizado.
- Mínimo de 8 a 10 anos de experiência comprovada em liderança de operações de grande escala.
- Domínio de gestão financeira corporativa (P&L, EBITDA, CAPEX/OPEX) e governança baseada em dados (BI e OKRs).
- Fluência oral e escrita em Português e Inglês (capacidade comprovada de negociação internacional).`
  },
  {
    id: 'job-2',
    title: 'Lead Cloud Architect & Engineering Director (SaaS & AI)',
    organization: 'Global Tech & Cloud Enterprise',
    description: `Cargo: Lead Cloud Architect & Diretor de Engenharia de Sistemas
Regime: Remoto Global / Híbrido

Responsabilidades Principais:
- Definir a arquitetura técnica global de produtos SaaS corporativos de alta concorrência e missão crítica.
- Liderar a transição para ambientes multicloud (AWS/GCP), microserviços e contêineres gerenciados com Kubernetes.
- Implementar padrões corporativos de observabilidade, segurança cibernética (OWASP, ISO 27001) e práticas ágeis DevSecOps.
- Gerir e expandir a equipa técnica internacional de desenvolvedores, engenheiros de dados e especialistas em IA.
- Reduzir a latência do ecossistema e otimizar custos de computação em nuvem em larga escala.

Requisitos:
- Bacharelado ou Mestrado em Ciências da Computação, Engenharia de Software ou área equivalente.
- Mínimo de 7 anos de experiência com sistemas distribuídos, arquitetura serverless e microsserviços.
- Certificações de nuvem (AWS Solutions Architect Professional, CKA ou GCP Cloud Architect).
- Fluência plena em Inglês.`
  },
  {
    id: 'job-3',
    title: 'Vice-Presidente de Estratégia Corporativa & Finanças (CFO / VP Finance)',
    organization: 'Holding de Investimentos & Private Equity',
    description: `Cargo: Vice-Presidente de Finanças e Estratégia
Localização: Centro Financeiro / Internacional

Responsabilidades Principais:
- Conduzir o planeamento financeiro estratégico de longo prazo, tesouraria corporativa, estrutura de capital e relações com investidores institucionais.
- Liderar processos de modelagem financeira, valuation (DCF) e transações de M&A de grande porte.
- Garantir a conformidade das demonstrações financeiras segundo as normas IFRS e US GAAP, respondendo perante o Conselho de Administração.
- Implantar soluções modernas de BI para acompanhamento em tempo real de KPIs de margem, fluxo de caixa e rentabilidade.

Requisitos:
- Formação sólida em Economia, Finanças ou Engenharia; credencial CFA ou Mestrado em Finanças altamente valorizados.
- Mínimo de 8 anos de experiência em bancos de investimento, consultorias estratégicas (MBB) ou direção financeira corporativa.
- Capacidade demonstrada de liderança de equipas de alto nível e negociações com parceiros globais.`
  },
  {
    id: 'job-4',
    title: 'Diretor de Programas Estratégicos & Governança Global',
    organization: 'Agência Multilateral & Gestão de Projetos Internacionais',
    description: `Cargo: Diretor de Programas & Governança Estratégica
Regime: Internacional

Responsabilidades Principais:
- Gerir portfólios multissetoriais complexos de investimento e governança orientada a resultados.
- Coordenar sistemas de monitoria de metas de impacto, garantia de qualidade e auditoria independente.
- Elaborar relatórios analíticos periódicos de prestação de contas para comités diretivos e parceiros institucionais.
- Liderar equipas multidisciplinares e articulação com governos, bancos de desenvolvimento e consórcios internacionais.

Requisitos:
- Pós-graduação em Gestão de Projetos, Economia ou Relações Internacionais.
- Experiência comprovada em programas de cooperação internacional ou gestão corporativa de grande dimensão.
- Fluência comprovada em Inglês e Português.`
  }
];
