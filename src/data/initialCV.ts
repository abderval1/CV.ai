import { CVData, PricingPlan } from '../types/cv';
import portraitManImg from '../assets/images/portrait_executive_man_1794571428722.jpg';
import portraitWomanImg from '../assets/images/portrait_executive_woman_1794571428995.jpg';

// High-Converting Modern Default Executive Profile (English Default)
export const GENERIC_DEFAULT_CV: CVData = {
  personalDetails: {
    name: 'ALEXANDER MENDES',
    title: 'Chief Operating Officer (COO) | Global Operations & Digital Transformation',
    location: 'New York, NY / Lisbon (Global Mobility)',
    phone: '+1 (212) 555-0194',
    email: 'alexander.mendes@globalexec.com',
    linkedin: 'linkedin.com/in/alexander-mendes-coo',
    website: 'https://alexandermendes.com',
    photoUrl: portraitManImg,
    showPhoto: false
  },
  summary:
    'Senior operations and corporate strategy executive with 12+ years of experience leading organizational turnarounds, scaling digital products, and driving data-governed P&L performance across multinational enterprises. Proven track record managing $35M+ operating budgets, cutting operational expenses by up to 32%, and leading cross-functional teams of 120+ professionals across North America, Europe, and LATAM.',
  competencies: [
    {
      id: 'comp-1',
      category: 'Strategic Leadership & P&L Governance',
      description:
        'Long-range strategic planning, full P&L accountability, capital allocation, EBITDA margin expansion, and enterprise risk governance.'
    },
    {
      id: 'comp-2',
      category: 'Digital Transformation & Process Automation',
      description:
        'Enterprise data architecture, cloud ERP migrations, AI-assisted workflow automation, and agile delivery at scale.'
    },
    {
      id: 'comp-3',
      category: 'Business Intelligence & Executive KPIs',
      description:
        'Board-level OKRs and KPIs, predictive revenue modeling, and real-time operational dashboards for C-suite decision making.'
    },
    {
      id: 'comp-4',
      category: 'M&A Integration & Global Partnerships',
      description:
        'Operational due diligence, post-merger ERP and team integration, and global enterprise vendor negotiations.'
    },
    {
      id: 'comp-5',
      category: 'Executive Talent & High-Performance Culture',
      description:
        'Leadership coaching, cross-border organizational alignment, and retention-focused incentive architecture.'
    }
  ],
  experiences: [
    {
      id: 'exp-1',
      company: 'OmniVanguard Holdings & Technologies',
      role: 'Chief Operating Officer (COO) & VP of Global Operations',
      period: '2021 – Present',
      location: 'New York & Global Operations',
      highlights: [
        'Directed global operations across 4 regional hubs and 140+ employees, achieving 48% compound annual revenue growth.',
        'Redesigned supply chain and operating workflows, delivering $8.4M in audited OPEX savings within 18 months.',
        'Deployed BI-driven decision governance, compressing new enterprise service launch cycles from 9 months to 11 weeks.',
        'Led post-merger integration of two acquired technology firms, unifying ERP platforms with zero enterprise client downtime.',
        'Lifted corporate Net Promoter Score (NPS) from 54 to 81 through SLA automation and customer success excellence.'
      ]
    },
    {
      id: 'exp-2',
      company: 'Apex Global Strategic Partners',
      role: 'Director of Operational Efficiency & Special Projects',
      period: '2017 – 2021',
      location: 'London / Lisbon',
      highlights: [
        'Managed a portfolio of 16 transformation and automation engagements across financial services, logistics, and telecom.',
        'Built stress-tested cost optimization models delivering an average 320% ROI across multi-site client portfolios.',
        'Established corporate governance and ISO compliance center of excellence with 100% pass rate on external audits.',
        'Coordinated 35 change-management specialists, driving enterprise software adoption above 95% within 90 days.'
      ]
    },
    {
      id: 'exp-3',
      company: 'Continental Business Advisory',
      role: 'Senior Management Consulting Manager',
      period: '2013 – 2017',
      location: 'New York, NY',
      highlights: [
        'Delivered operational diagnostics and process re-engineering programs for publicly traded enterprises.',
        'Authored strategic recommendations and board-ready performance reviews for executive audit committees.'
      ]
    }
  ],
  educations: [
    {
      id: 'edu-1',
      degree: 'Executive MBA (Global Leadership & Corporate Finance)',
      institution: 'INSEAD / Wharton Executive Program',
      period: '2018 – 2020',
      gpaOrHonors: 'With Academic Distinction'
    },
    {
      id: 'edu-2',
      degree: 'B.S. in Industrial Engineering & Operations Management',
      institution: 'Columbia University / USP Exchange',
      period: '2008 – 2013'
    }
  ],
  trainings: [
    'Executive Certificate in AI for Business Strategy – MIT Sloan',
    'Corporate Governance & Board Readiness – NACD / IBGC',
    'Lean Six Sigma Black Belt – Global Operational Excellence',
    'Enterprise Crisis & Business Continuity Management (ISO 22301)'
  ],
  languages: [
    {
      language: 'English',
      level: 'Native / Full Bilingual Proficiency'
    },
    {
      language: 'Portuguese',
      level: 'Native / Full Professional Proficiency'
    },
    {
      language: 'Spanish',
      level: 'Business Fluency'
    }
  ],
  references: [
    {
      id: 'ref-1',
      name: 'Dr. Robert Silveira',
      institutionAndPosition: 'OmniVanguard Holdings\nChairman of the Board',
      contact: 'robert.silveira@omnivanguard.com'
    },
    {
      id: 'ref-2',
      name: 'Mariana Costa, MBA',
      institutionAndPosition: 'Apex Global Partners\nManaging Partner & CEO',
      contact: 'mariana.costa@apexglobal.com'
    }
  ],
  templateStyle: 'executive_harvard'
};

// Portuguese Executive Profile for interactive PT/EN Hero preview toggle
export const GENERIC_DEFAULT_CV_PT: CVData = {
  personalDetails: {
    name: 'ALEXANDRE MENDES',
    title: 'Chief Operating Officer (COO) | Head de Operações & Transformação Digital',
    location: 'São Paulo, Brasil (Disponibilidade para Mobilidade Global)',
    phone: '+55 11 98765-4321',
    email: 'alexandre.mendes@executivoglobal.com',
    linkedin: 'linkedin.com/in/alexandre-mendes-coo',
    website: 'https://alexandremendes.com',
    photoUrl: portraitManImg,
    showPhoto: false
  },
  summary:
    'Executivo sênior de operações e estratégia corporativa com mais de 12 anos de experiência liderando reestruturações organizacionais, escalabilidade de produtos digitais e governança orientada a dados em corporações multinacionais e empresas de alto crescimento. Histórico comprovado de gestão de orçamentos superiores a US$ 35M, redução de despesas operacionais em até 32% e liderança de equipas multifuncionais de mais de 120 profissionais.',
  competencies: [
    {
      id: 'comp-pt-1',
      category: 'Liderança Estratégica & Gestão P&L',
      description:
        'Planeamento estratégico de longo prazo, gestão integral de demonstrações financeiras (P&L), alocação de capital e governança de risco.'
    },
    {
      id: 'comp-pt-2',
      category: 'Transformação Digital & Automação',
      description:
        'Arquiteturas de dados empresariais, migração cloud ERP, fluxos com IA e metodologias ágeis em escala.'
    }
  ],
  experiences: [
    {
      id: 'exp-pt-1',
      company: 'OmniVanguard Holdings & Technologies',
      role: 'Chief Operating Officer (COO) & Vice-Presidente de Operações',
      period: '2021 – Presente',
      location: 'São Paulo & Operações Globais',
      highlights: [
        'Liderou a operação global abrangendo 4 centros regionais e 140 colaboradores, alcançando crescimento de 48% na receita anual.',
        'Redesenhou a cadeia de valor e processos internos, gerando poupança operacional auditada de US$ 8.4M em 18 meses.'
      ]
    },
    {
      id: 'exp-pt-2',
      company: 'Apex Global Strategic Partners',
      role: 'Diretor de Eficiência Operacional & Projetos Especiais',
      period: '2017 – 2021',
      location: 'São Paulo / Lisboa',
      highlights: [
        'Geriu portfólio de 16 projetos estratégicos de automação e eficiência financeira com ROI médio de 320%.'
      ]
    }
  ],
  educations: [
    {
      id: 'edu-pt-1',
      degree: 'Executive MBA (Liderança Global & Finanças Corporativas)',
      institution: 'INSEAD / Fundação Getulio Vargas (FGV)',
      period: '2018 – 2020'
    }
  ],
  trainings: ['Lean Six Sigma Black Belt', 'Governança Corporativa – IBGC'],
  languages: [
    { language: 'Português', level: 'Língua Materna' },
    { language: 'Inglês', level: 'Fluência Plena (C-Level)' }
  ],
  references: [],
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
    photoUrl: portraitWomanImg,
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
    name: 'Professional Pro',
    tagline: 'Ideal for professionals aiming to pass ATS filters and accelerate interview callbacks.',
    priceMonthly: '$8 / Month',
    priceYearly: '$72 / Year (Save 25%)',
    priceMonthlyValue: 8,
    priceQuarterlyValue: 21.6,
    priceSemiannualValue: 39.36,
    priceYearlyValue: 72,
    currency: 'USD',
    creditsMonthly: 9999,
    features: [
      'Instant Clean Download Unlock (PDF & Word .docx)',
      '100% Watermark-Free Executive Documents',
      'Unlimited Resumes, Tailored Versions & Cover Letters',
      'Unlimited AI Impact & XYZ Optimization',
      '95%+ ATS Radar with Semantic Job Matching',
      'Profile-Matched Live Job Radar & Direct Apply Links',
      'Full 5-Language Translation (EN, PT, ES, FR, DE)',
      'Real-Time Cloud Sync Across Devices'
    ],
    isPopular: true,
    ctaText: 'Subscribe to Pro'
  },
  {
    id: 'executive',
    name: 'Executive VIP',
    tagline: 'Built for leaders, directors, and global consultants competing for top-tier roles.',
    priceMonthly: '$12 / Month',
    priceYearly: '$108 / Year (Save 25%)',
    priceMonthlyValue: 12,
    priceQuarterlyValue: 32.4,
    priceSemiannualValue: 59.04,
    priceYearlyValue: 108,
    currency: 'USD',
    creditsMonthly: 9999,
    features: [
      'Everything included in Professional Pro',
      'Unlimited Official PDF & Word (.docx) Exports',
      'Voice/Text STAR Interview Simulator & Scoring',
      'All C-Level, Harvard, Wall Street, UN & Big Tech Layouts',
      'Advanced LinkedIn Profile Audit',
      'Priority Executive Support & Advisory'
    ],
    isPopular: false,
    ctaText: 'Subscribe to Executive VIP'
  }
];

export const SAMPLE_JOB_OFFERS = [
  {
    id: 'job-1',
    title: 'Chief Operating Officer (COO) & VP of Global Operations',
    organization: 'Global Enterprise Technology & Services Group',
    description: `Role: Chief Operating Officer (COO)
Location: Hybrid / International
Type: Full-Time Executive Mandate

Key Responsibilities:
- Lead global operations across multi-region hubs, overseeing operational scalability, SLA efficiency, and multi-unit P&L governance.
- Design and execute digital transformation and workflow automation roadmaps backed by real-time analytics.
- Manage consolidated annual operating budgets exceeding $30M with strict governance, compliance, and ROI discipline.
- Lead operational due diligence in M&A transactions and direct post-merger ERP and cross-border team integration.
- Mentor functional VPs across Technology, Finance, Operations, and Product to sustain a high-performance culture.

Requirements:
- Bachelor's in Engineering, Business, or Economics; Executive MBA strongly preferred.
- 8–10+ years of proven leadership scaling complex international operations.
- Mastery of corporate financial management (P&L, EBITDA, CAPEX/OPEX) and data-driven governance (BI, OKRs).
- Full professional proficiency in English (international stakeholder negotiation experience).`
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
