import { CVData } from '../types/cv';
import portraitManImg from '../assets/images/portrait_executive_man_1794571428722.jpg';
import portraitWomanImg from '../assets/images/portrait_executive_woman_1794571428995.jpg';

export type CoverLetterLayoutStyle =
  | 'classic_bar'
  | 'modern_header'
  | 'split_accent'
  | 'harvard_formal'
  | 'tech_clean'
  | 'europass_blue';

export interface CoverLetterTemplateInfo {
  id: string;
  layoutStyle: CoverLetterLayoutStyle;
  associatedCvTemplate: CVData['templateStyle'];
  name: string;
  shortName: string;
  category: 'executive' | 'modern' | 'ats' | 'international';
  categoryLabel: string;
  accentColor: string;
  fontStyle: 'serif' | 'sans' | 'mono';
  tagline: string;
  description: string;
  regions: string[];
  bestFor: string[];
  sampleCandidateName: string;
  sampleCandidateTitle: string;
  sampleLocation: string;
  sampleEmail: string;
  samplePhone: string;
  sampleLetterBody: string;
}

export interface CVExampleShowcaseItem {
  id: string;
  roleTitle: string;
  industry: string;
  category: 'tech' | 'executive' | 'finance' | 'creative' | 'health' | 'academic';
  experienceLevel: string;
  regionTag: string;
  tagline: string;
  highlightsSummary: string;
  cvData: CVData;
}

export interface CoverLetterExampleShowcaseItem {
  id: string;
  title: string;
  industry: string;
  category: 'tech' | 'executive' | 'product' | 'finance' | 'entry' | 'transition';
  situationTag: string;
  tagline: string;
  templateLayout: CoverLetterLayoutStyle;
  associatedCvTemplate: CVData['templateStyle'];
  accentColor: string;
  candidateName: string;
  candidateTitle: string;
  location: string;
  email: string;
  phone: string;
  letterBody: string;
}

export const COVER_LETTER_TEMPLATES: CoverLetterTemplateInfo[] = [
  {
    id: 'cl-classic-exec',
    layoutStyle: 'classic_bar',
    associatedCvTemplate: 'executive_harvard',
    name: 'Carta Executiva Clássica (Cabeçalho Sólido)',
    shortName: 'Clássico Executivo',
    category: 'executive',
    categoryLabel: 'Executivo & Bancos',
    accentColor: '#0f172a',
    fontStyle: 'serif',
    tagline: 'Sobriedade editorial com barra dupla de autoridade e tipografia serifada formal.',
    description:
      'Inspirada nas cartas de motivação de conselhos de administração e instituições financeiras, destaca o nome no topo com linhas limpas e hierarquia impecável.',
    regions: ['Global', 'Brasil (Faria Lima)', 'Portugal', 'EUA & Reino Unido'],
    bestFor: ['Diretoria & C-Level', 'Banca & Investimentos', 'Advocacia & Auditoria'],
    sampleCandidateName: 'ALEXANDRE MENDES',
    sampleCandidateTitle: 'Chief Operating Officer (COO) · Estratégia & Operações',
    sampleLocation: 'São Paulo, Brasil',
    sampleEmail: 'alexandre.mendes@executivoglobal.com',
    samplePhone: '+55 11 98765-4321',
    sampleLetterBody: `Para: Comité de Seleção Executiva
Assunto: Candidatura para Direção de Operações (COO)

Exmos. Senhores Membros do Comité de Seleção,

Apresento a minha candidatura à posição de Chief Operating Officer com mais de 12 anos de liderança na transformação operacional e gestão integral de P&L em grupos multinacionais.

Nas minhas funções mais recentes à frente de 4 subsidiárias e 140 colaboradores, conduzi a reestruturação da cadeia operacional gerando poupança auditada de US$ 8.4M em 18 meses e expansão de 48% na receita anual composta.

Acredito que a combinação de rigor analítico, governança corporativa e execução ágil permitirá acelerar as metas estratégicas da vossa organização desde o primeiro trimestre.

Atenciosamente,

Alexandre Mendes`
  },
  {
    id: 'cl-modern-header',
    layoutStyle: 'modern_header',
    associatedCvTemplate: 'european_modern',
    name: 'Carta Moderna Destaque (Bloco Superior)',
    shortName: 'Moderno Destaque',
    category: 'modern',
    categoryLabel: 'Corporativo & Produto',
    accentColor: '#1d4ed8',
    fontStyle: 'sans',
    tagline: 'Bloco superior em azul corporativo com contactos estruturados e leitura ágil.',
    description:
      'Um layout contemporâneo altamente legível para empresas de tecnologia, consultorias comerciais e vagas corporativas na Europa e América Latina.',
    regions: ['Portugal', 'Brasil', 'América Latina', 'Europa'],
    bestFor: ['Gestão de Produto', 'Consultoria', 'Vendas B2B & Marketing'],
    sampleCandidateName: 'BEATRIZ FONSECA',
    sampleCandidateTitle: 'Head de Estratégia Corporativa & Expansão',
    sampleLocation: 'Lisboa, Portugal',
    sampleEmail: 'beatriz.fonseca@finance-holding.com',
    samplePhone: '+351 912 345 678',
    sampleLetterBody: `Para: Direção de Talento & Liderança
Assunto: Candidatura — Head de Estratégia & Expansão Europeia

Caros Recrutadores,

É com grande entusiasmo que submeto a minha candidatura para liderar a frente de Expansão e Estratégia Corporativa. Ao longo de 10 anos, estruturei transações de M&A superiores a €120M e consolidei operações em três mercados europeus.

O meu foco em modelagem financeira rigorosa aliado à coordenação de equipas multidisciplinares garante decisões rápidas com retorno mensurável sobre o capital investido.

Fico inteiramente disponível para uma conversa inicial onde possa detalhar projetos recentes.

Com os melhores cumprimentos,

Beatriz Fonseca`
  },
  {
    id: 'cl-harvard-formal',
    layoutStyle: 'harvard_formal',
    associatedCvTemplate: 'executive_harvard',
    name: 'Carta Harvard Business Formal (ATS 100%)',
    shortName: 'Harvard Formal',
    category: 'ats',
    categoryLabel: 'ATS Estrito & MBB',
    accentColor: '#1e293b',
    fontStyle: 'serif',
    tagline: 'Formato minimalista 100% textual aceite em portais Workday, Greenhouse e Taleo.',
    description:
      'Zero elementos gráficos que distraiam ou travem sistemas de triagem. Segue exatamente a norma de correspondência comercial americana e britânica.',
    regions: ['EUA', 'Reino Unido', 'Canadá', 'Consultorias MBB'],
    bestFor: ['McKinsey / BCG / Bain', 'Multinacionais EUA/UK', 'Candidaturas em Inglês'],
    sampleCandidateName: 'HENRIQUE VASCONCELOS',
    sampleCandidateTitle: 'Senior Management Consultant · Strategy & M&A',
    sampleLocation: 'Londres, Reino Unido',
    sampleEmail: 'h.vasconcelos@globaladvisory.co.uk',
    samplePhone: '+44 7700 900123',
    sampleLetterBody: `Dear Hiring Committee,

I am writing to express my strong interest in the Principal Consultant role within your European Transformation Practice. Over the past nine years, I have advised Fortune 500 boards on post-merger integration and commercial due diligence across $1.4B in enterprise transactions.

In my current role, I led a cross-border restructuring program across six operating units that delivered £19M in recurring EBITDA improvements within fourteen months.

I welcome the opportunity to discuss how my analytical rigor and stakeholder leadership align with your upcoming client mandates.

Sincerely,

Henrique Vasconcelos`
  },
  {
    id: 'cl-tech-clean',
    layoutStyle: 'tech_clean',
    associatedCvTemplate: 'tech_modern',
    name: 'Carta Tech & Engenharia Minimalista',
    shortName: 'Tech Minimalista',
    category: 'ats',
    categoryLabel: 'Tech & SaaS Global',
    accentColor: '#0284c7',
    fontStyle: 'sans',
    tagline: 'Cabeçalho técnico limpo com realce ciano e espaço para links GitHub/Portfólio.',
    description:
      'Projetada para programadores, arquitetos de software e engenheiros de dados comunicarem impacto de sistema sem floreados corporativos.',
    regions: ['Trabalho Remoto Global', 'EUA (Silicon Valley)', 'Berlim & Amesterdão'],
    bestFor: ['Software Engineers', 'Tech Leads', 'Cloud & Data Architects'],
    sampleCandidateName: 'RAFAEL OLIVEIRA',
    sampleCandidateTitle: 'Staff Software Engineer · Distributed Systems & AI',
    sampleLocation: 'Porto, Portugal (Remoto Global)',
    sampleEmail: 'rafael.oliveira@cloudstack.dev',
    samplePhone: '+351 934 112 890',
    sampleLetterBody: `Para: Equipa de Engenharia & CTO
Assunto: Candidatura — Staff Software Engineer (Plataforma Core)

Olá Equipa,

Acompanho de perto a evolução da vossa arquitetura distribuída e gostaria de contribuir diretamente como Staff Software Engineer. Nos últimos 8 anos projetei APIs de alta disponibilidade que processam mais de 45.000 pedidos/segundo com latência p99 abaixo de 60ms.

Mais recentemente, liderei a migração para microserviços em Go e Kubernetes, reduzindo os custos mensais de infraestrutura AWS em 38% mantendo 99.99% de SLA.

Será um prazer conversar sobre os desafios atuais de escala da vossa plataforma.

Cumprimentos,

Rafael Oliveira`
  },
  {
    id: 'cl-split-accent',
    layoutStyle: 'split_accent',
    associatedCvTemplate: 'creative_split',
    name: 'Carta Lateral Criativa (Barra Vertical)',
    shortName: 'Criativo Lateral',
    category: 'modern',
    categoryLabel: 'Design, UX & Startups',
    accentColor: '#7c3aed',
    fontStyle: 'sans',
    tagline: 'Coluna lateral colorida elegante combinando identidade visual e narrativa clara.',
    description:
      'Ideal para profissionais criativos, Product Designers, Brand Managers e candidatos a startups que valorizam estética e clareza.',
    regions: ['Startups Globais', 'Brasil & Portugal', 'Agências Digitais'],
    bestFor: ['Design UI/UX', 'Marketing Digital', 'Product & Brand'],
    sampleCandidateName: 'CAMILA RIBEIRO',
    sampleCandidateTitle: 'Lead Product Designer · Design Systems & SaaS',
    sampleLocation: 'São Paulo / Remoto',
    sampleEmail: 'camila@studioribeiro.design',
    samplePhone: '+55 11 99123-7744',
    sampleLetterBody: `Para: Liderança de Produto & Design
Assunto: Candidatura — Lead Product Designer

Olá,

Escrevo para manifestar o meu interesse na vaga de Lead Product Designer. Nos últimos sete anos, desenhei produtos B2B utilizados por mais de 2 milhões de utilizadores ativos e escalei Design Systems adotados por cinco equipas de engenharia.

No meu último projeto, redesenhei todo o fluxo de onboarding e ativação, elevando a conversão de contas pagas em 34% em apenas dois trimestres.

Adoraria partilhar o meu portfólio de estudos de caso numa conversa breve.

Um abraço,

Camila Ribeiro`
  },
  {
    id: 'cl-europass-blue',
    layoutStyle: 'europass_blue',
    associatedCvTemplate: 'european_europass',
    name: 'Carta Padrão Europeu Formal',
    shortName: 'Europeu Formal',
    category: 'international',
    categoryLabel: 'União Europeia',
    accentColor: '#1d4ed8',
    fontStyle: 'sans',
    tagline: 'Estrutura formal europeia com bloco de destinatário padronizado e tom institucional.',
    description:
      'Perfeita para candidaturas em Portugal, Alemanha, França, Espanha e instituições europeias onde a etiqueta formal da carta é avaliada em detalhe.',
    regions: ['União Europeia', 'Portugal & Espanha', 'Alemanha & França'],
    bestFor: ['Engenharia & Saúde UE', 'Bolsas & Programas Europeus', 'Administração Pública'],
    sampleCandidateName: 'INÊS CARVALHO',
    sampleCandidateTitle: 'Gestora de Projetos Europeus & Sustentabilidade',
    sampleLocation: 'Coimbra, Portugal',
    sampleEmail: 'ines.carvalho@eu-projects.pt',
    samplePhone: '+351 968 221 094',
    sampleLetterBody: `Exmo.(a) Senhor(a) Diretor(a) de Recursos Humanos,

Venho por este meio apresentar a minha candidatura à função de Gestora de Projetos Internacionais na vossa instituição. Possuo mestrado em Gestão Ambiental e seis anos de experiência na coordenação de consórcios financiados pelo programa Horizon Europe.

Ao longo do meu percurso, geri orçamentos superiores a €4.5M envolvendo parceiros em sete países da União Europeia, assegurando 100% de conformidade nas auditorias da Comissão Europeia.

Agradeço desde já a atenção dispensada e manifesto total disponibilidade para entrevista.

Com os melhores cumprimentos,

Inês Carvalho`
  }
];

export const CV_EXAMPLES: CVExampleShowcaseItem[] = [
  {
    id: 'ex-cv-tech',
    roleTitle: 'Staff Software Engineer / Tech Lead',
    industry: 'Tecnologia & Cloud',
    category: 'tech',
    experienceLevel: 'Sénior (8+ anos)',
    regionTag: 'EUA / Remoto Global · Sem Foto',
    tagline: 'Currículo técnico calibrado para Big Techs com foco em escala, latência e arquitetura.',
    highlightsSummary: '98% ATS Match · Métricas SLA & Latência · 100% Textual',
    cvData: {
      personalDetails: {
        name: 'RAFAEL OLIVEIRA',
        title: 'Staff Software Engineer | Arquitetura Distribuída, Cloud & IA',
        location: 'Porto, Portugal (Disponível Remoto Global)',
        phone: '+351 934 112 890',
        email: 'rafael.oliveira@cloudstack.dev',
        linkedin: 'linkedin.com/in/rafael-oliveira-staff',
        website: 'github.com/rafaeloliveira-dev',
        showPhoto: false
      },
      summary:
        'Engenheiro de Software Staff com mais de 8 anos de experiência na construção de sistemas distribuídos de alta disponibilidade, microserviços em Go/TypeScript e pipelines de IA em produção. Reduziu custos de nuvem AWS em 38% e escalou arquiteturas para mais de 45.000 pedidos por segundo com 99.99% de uptime.',
      competencies: [
        {
          id: 'tc-1',
          category: 'Linguagens & Backend',
          description: 'TypeScript, Go (Golang), Python, Node.js, gRPC, GraphQL e APIs REST de baixa latência.'
        },
        {
          id: 'tc-2',
          category: 'Cloud, Containers & Observabilidade',
          description: 'AWS (EKS, RDS, Lambda), Kubernetes, Docker, Terraform, Prometheus, Grafana e OpenTelemetry.'
        },
        {
          id: 'tc-3',
          category: 'Bases de Dados & Mensageria',
          description: 'PostgreSQL, Redis, Apache Kafka, DynamoDB, Elasticsearch e modelagem orientada a eventos.'
        }
      ],
      experiences: [
        {
          id: 'te-1',
          company: 'NovaScale Cloud Technologies',
          role: 'Staff Software Engineer & Tech Lead',
          period: '2022 – Presente',
          location: 'Remoto (Europa / EUA)',
          highlights: [
            'Arquitetou motor de processamento em Go e Kafka que elevou a capacidade para 45.000 req/s reduzindo a latência p99 de 380ms para 54ms.',
            'Liderou a migração multi-região em AWS EKS, cortando despesas mensais de computação em 38% (poupança de $210K/ano).',
            'Mentoreou 14 engenheiros seniores e instituiu padrões automatizados de testes de carga e CI/CD.'
          ]
        },
        {
          id: 'te-2',
          company: 'FinPay Global',
          role: 'Senior Backend Engineer',
          period: '2019 – 2022',
          location: 'Lisboa, Portugal',
          highlights: [
            'Desenvolveu gateway de liquidação de pagamentos em tempo real com 99.995% de SLA processando €18M/mês.',
            'Eliminou gargalos de consulta em PostgreSQL através de particionamento e cache Redis, reduzindo erros de timeout em 94%.'
          ]
        }
      ],
      educations: [
        {
          id: 'ted-1',
          degree: 'Mestrado em Engenharia Informática e Computação',
          institution: 'Universidade do Porto (FEUP)',
          period: '2014 – 2019',
          gpaOrHonors: 'Média 17/20'
        }
      ],
      trainings: ['AWS Certified Solutions Architect – Professional', 'Certified Kubernetes Administrator (CKA)'],
      languages: [
        { language: 'Português', level: 'Nativo' },
        { language: 'Inglês', level: 'Fluente (C2 · Trabalho diário EUA/UK)' }
      ],
      references: [],
      templateStyle: 'tech_modern',
      accentColor: '#0284c7'
    }
  },
  {
    id: 'ex-cv-coo',
    roleTitle: 'Diretor de Operações (COO) / Executivo',
    industry: 'Gestão & Operações',
    category: 'executive',
    experienceLevel: 'Executivo / C-Level',
    regionTag: 'Padrão Harvard · Sem Foto',
    tagline: 'Formato Ivy League orientado a resultados de EBITDA, P&L e reestruturação operacional.',
    highlightsSummary: 'Fórmula Google XYZ · Foco P&L & M&A · Harvard Classic',
    cvData: {
      personalDetails: {
        name: 'ALEXANDRE MENDES',
        title: 'Chief Operating Officer (COO) | Head de Operações & Estratégia',
        location: 'São Paulo, Brasil',
        phone: '+55 11 98765-4321',
        email: 'alexandre.mendes@executivoglobal.com',
        linkedin: 'linkedin.com/in/alexandre-mendes-coo',
        showPhoto: false
      },
      summary:
        'Executivo de operações com 12+ anos liderando transformações corporativas, escalabilidade de negócios e governança de P&L acima de US$ 35M. Histórico comprovado em integrações M&A, expansão de margem EBITDA e redução de custos operacionais em 32%.',
      competencies: [
        {
          id: 'ec-1',
          category: 'Gestão Executiva & P&L',
          description: 'Planeamento estratégico, reestruturação de custos fixos, governança corporativa e alocação de capital.'
        },
        {
          id: 'ec-2',
          category: 'M&A e Excelência Operacional',
          description: 'Due diligence operacional, integração pós-fusão de ERPs e implementação de OKRs corporativos.'
        }
      ],
      experiences: [
        {
          id: 'ee-1',
          company: 'OmniVanguard Holdings',
          role: 'Chief Operating Officer (COO)',
          period: '2021 – Presente',
          location: 'São Paulo, Brasil',
          highlights: [
            'Liderou operação abrangendo 4 centros regionais e 140 colaboradores, gerando crescimento de 48% na receita anual composta.',
            'Redesenhou cadeia logística e fluxos internos, entregando poupança operacional auditada de US$ 8.4M em 18 meses.',
            'Elevou o NPS corporativo de 54 para 81 pontos através de automação de atendimento e SLA rigoroso.'
          ]
        },
        {
          id: 'ee-2',
          company: 'Apex Global Partners',
          role: 'Diretor de Eficiência Operacional',
          period: '2017 – 2021',
          location: 'São Paulo / Lisboa',
          highlights: [
            'Conduziu 16 programas de transformação digital em bancos e operadoras com ROI médio de 320%.'
          ]
        }
      ],
      educations: [
        {
          id: 'eed-1',
          degree: 'Executive MBA — Liderança Global & Finanças',
          institution: 'INSEAD / FGV',
          period: '2018 – 2020',
          gpaOrHonors: 'Distinção Académica'
        }
      ],
      trainings: ['Lean Six Sigma Black Belt', 'Governança Corporativa — IBGC'],
      languages: [
        { language: 'Português', level: 'Nativo' },
        { language: 'Inglês', level: 'Fluente (C2)' },
        { language: 'Espanhol', level: 'Avançado' }
      ],
      references: [],
      templateStyle: 'executive_harvard',
      accentColor: '#0f172a'
    }
  },
  {
    id: 'ex-cv-finance',
    roleTitle: 'VP Finanças Corporativas & M&A',
    industry: 'Finanças & Banca',
    category: 'finance',
    experienceLevel: 'Sénior / Direção',
    regionTag: 'EUA / Europa · ATS 100%',
    tagline: 'Estrutura compacta para Banca de Investimento, Private Equity e Controladoria.',
    highlightsSummary: '100% ATS · Valuation DCF & IFRS · Zero Gráficos',
    cvData: {
      personalDetails: {
        name: 'BEATRIZ FONSECA',
        title: 'Vice-Presidente de Finanças Corporativas & M&A',
        location: 'Lisboa, Portugal',
        phone: '+351 912 345 678',
        email: 'beatriz.fonseca@finance-holding.com',
        linkedin: 'linkedin.com/in/beatriz-fonseca-exec',
        showPhoto: false
      },
      summary:
        'Líder financeira com 10 anos de trajetória em estruturação de capital, fusões e aquisições superiores a €120M e reporte segundo IFRS e US GAAP. Especialista em otimização de tesouraria, modelagem financeira avançada e relação com investidores institucionais.',
      competencies: [
        {
          id: 'fc-1',
          category: 'Finanças Corporativas & Valuation',
          description: 'Modelagem DCF, LBO, M&A buy-side/sell-side, gestão de dívida e análise de retorno (IRR/NPV).'
        },
        {
          id: 'fc-2',
          category: 'Contabilidade & Regulação',
          description: 'Normas IFRS, US GAAP, auditoria externa, SOX compliance e gestão de risco cambial.'
        }
      ],
      experiences: [
        {
          id: 'fe-1',
          company: 'EuroCapital Holding SGPS',
          role: 'VP de Estratégia Financeira & M&A',
          period: '2020 – Presente',
          location: 'Lisboa / Madrid',
          highlights: [
            'Liderou captação de €60M em dívida estruturada reduzindo o custo médio ponderado de capital (WACC) em 140 bps.',
            'Coordenou a aquisição de 3 ativos logísticos na Península Ibérica totalizando €125M com integração fiscal plena.'
          ]
        }
      ],
      educations: [
        {
          id: 'fed-1',
          degree: 'Mestrado em Finanças (Master in Finance)',
          institution: 'Nova School of Business and Economics',
          period: '2014 – 2016',
          gpaOrHonors: 'Top 5% da Turma'
        }
      ],
      trainings: ['CFA Level III Charterholder', 'Certificação IFRS Avançada'],
      languages: [
        { language: 'Português', level: 'Nativo' },
        { language: 'Inglês', level: 'Fluente (C2)' }
      ],
      references: [],
      templateStyle: 'ats_compact',
      accentColor: '#0f172a'
    }
  },
  {
    id: 'ex-cv-design',
    roleTitle: 'Lead Product Designer (UI/UX)',
    industry: 'Design, Produto & Criativo',
    category: 'creative',
    experienceLevel: 'Sénior (7 anos)',
    regionTag: 'Criativo Split · Com Foto',
    tagline: 'Layout assimétrico em 2 colunas com fotografia executiva e barra lateral visual.',
    highlightsSummary: 'Com Foto · Design Systems & Conversão · Sidebar Roxa',
    cvData: {
      personalDetails: {
        name: 'CAMILA RIBEIRO',
        title: 'Lead Product Designer | UX Strategy & Design Systems',
        location: 'São Paulo, Brasil',
        phone: '+55 11 99123-7744',
        email: 'camila@studioribeiro.design',
        linkedin: 'linkedin.com/in/camila-ribeiro-ux',
        website: 'behance.net/camilaribeiro',
        photoUrl: portraitWomanImg,
        showPhoto: true
      },
      summary:
        'Product Designer com 7 anos criando produtos SaaS B2B e aplicativos móveis utilizados por mais de 2 milhões de utilizadores. Especialista em pesquisa com utilizadores, prototipagem rápida no Figma e Design Systems escaláveis que aceleraram entregas em 40%.',
      competencies: [
        {
          id: 'cc-1',
          category: 'Design de Produto & Ferramentas',
          description: 'Figma, Design Tokens, Design Systems, Prototipagem Interativa e Arquitetura de Informação.'
        },
        {
          id: 'cc-2',
          category: 'UX Research & Product Growth',
          description: 'Testes de usabilidade, funis de onboarding, análise de retenção e colaboração com Product Managers.'
        }
      ],
      experiences: [
        {
          id: 'ce-1',
          company: 'PulseFlow SaaS',
          role: 'Lead Product Designer',
          period: '2021 – Presente',
          location: 'São Paulo (Híbrido)',
          highlights: [
            'Redesenhou o fluxo completo de onboarding, elevando a conversão de contas pagas em 34% em 2 trimestres.',
            'Construiu Design System multi-marca em Figma adotado por 5 squads de engenharia.'
          ]
        }
      ],
      educations: [
        {
          id: 'ced-1',
          degree: 'Bacharelado em Design Digital',
          institution: 'ESPM São Paulo',
          period: '2014 – 2018'
        }
      ],
      trainings: ['NN/g UX Management Certification'],
      languages: [
        { language: 'Português', level: 'Nativo' },
        { language: 'Inglês', level: 'Avançado (C1)' }
      ],
      references: [],
      templateStyle: 'creative_split',
      accentColor: '#7c3aed'
    }
  },
  {
    id: 'ex-cv-europass',
    roleTitle: 'Gestora de Projetos Europeus / Saúde & UE',
    industry: 'Europa & Multinacionais',
    category: 'health',
    experienceLevel: 'Pleno / Sénior',
    regionTag: 'Europass UE · Com Foto',
    tagline: 'Modelo oficial europeu com foto formal, bloco de idiomas CEFR e grelha limpa.',
    highlightsSummary: 'Padrão União Europeia · Com Foto · Idiomas CEFR',
    cvData: {
      personalDetails: {
        name: 'INÊS CARVALHO',
        title: 'Gestora de Projetos Europeus & Inovação Clínica',
        location: 'Coimbra, Portugal (Mobilidade União Europeia)',
        phone: '+351 968 221 094',
        email: 'ines.carvalho@eu-projects.pt',
        linkedin: 'linkedin.com/in/ines-carvalho-eu',
        photoUrl: portraitWomanImg,
        showPhoto: true
      },
      summary:
        'Gestora de projetos europeus com 6 anos de experiência em coordenação de consórcios internacionais financiados pelo Horizon Europe e programas de saúde pública. Sólido histórico na gestão financeira de subvenções acima de €4.5M e cumprimento integral de auditorias da Comissão Europeia.',
      competencies: [
        {
          id: 'euc-1',
          category: 'Gestão de Financiamento Europeu',
          description: 'Horizon Europe, Erasmus+, elaboração de relatórios técnicos/financeiros e auditoria de despesas.'
        },
        {
          id: 'euc-2',
          category: 'Coordenação Multipaís',
          description: 'Alinhamento de parceiros académicos e clínicos em 7 países, gestão de prazos e entregas.'
        }
      ],
      experiences: [
        {
          id: 'eue-1',
          company: 'Centro Europeu de Inovação em Saúde',
          role: 'Coordenadora de Projetos Europeus',
          period: '2020 – Presente',
          location: 'Coimbra / Bruxelas',
          highlights: [
            'Coordenou consórcio de 12 instituições europeias em projeto de €4.5M com 100% de execução orçamental aprovada.'
          ]
        }
      ],
      educations: [
        {
          id: 'eued-1',
          degree: 'Mestrado em Gestão de Serviços de Saúde',
          institution: 'Universidade de Coimbra',
          period: '2016 – 2018'
        }
      ],
      trainings: ['Certificação PMP – Project Management Professional'],
      languages: [
        { language: 'Português', level: 'C2 (Nativo)' },
        { language: 'Inglês', level: 'C1 (Utilizador Proficiente)' },
        { language: 'Francês', level: 'B2 (Independente)' }
      ],
      references: [],
      templateStyle: 'european_europass',
      accentColor: '#1d4ed8'
    }
  },
  {
    id: 'ex-cv-academic',
    roleTitle: 'Investigador Científico & Docente (PhD)',
    industry: 'Académico & I&D',
    category: 'academic',
    experienceLevel: 'Doutoramento / Pós-Doc',
    regionTag: 'CiênciaVitae / Lattes · Sem Foto',
    tagline: 'Estrutura formal dedicada a docência, publicações indexadas, bolsas e investigação.',
    highlightsSummary: 'Artigos DOI & Scopus · Bolsas & Docência · Rigor Académico',
    cvData: {
      personalDetails: {
        name: 'DR. TIAGO ALMEIDA',
        title: 'Investigador Principal (PhD) | Ciência de Dados & Energia Sustentável',
        location: 'Aveiro, Portugal',
        phone: '+351 914 556 320',
        email: 'tiago.almeida@research-institute.pt',
        linkedin: 'orcid.org/0000-0002-1825-0097',
        showPhoto: false
      },
      summary:
        'Doutor em Engenharia Energética e Investigador com 14 publicações em revistas indexadas (Q1 Scopus / Web of Science) e €1.2M captados em bolsas competitivas FCT e Horizon Europe. Experiência em docência universitária e orientação de teses de mestrado.',
      competencies: [
        {
          id: 'ac-1',
          category: 'Investigação & Publicação Científica',
          description: 'Modelação numérica, Python científico, escrita de propostas FCT/ERC e revisão por pares.'
        },
        {
          id: 'ac-2',
          category: 'Docência & Orientação Académica',
          description: 'Unidades curriculares de Termodinâmica e Ciência de Dados; orientação de 9 dissertações.'
        }
      ],
      experiences: [
        {
          id: 'ae-1',
          company: 'Instituto de Investigação em Energia',
          role: 'Investigador Auxiliar & Professor Convidado',
          period: '2020 – Presente',
          location: 'Aveiro, Portugal',
          highlights: [
            'Publicou 9 artigos como primeiro autor em periódicos Q1 (Fator de Impacto médio 6.4).',
            'Liderou candidatura vencedora de financiamento nacional FCT no valor de €480.000.'
          ]
        }
      ],
      educations: [
        {
          id: 'aed-1',
          degree: 'Doutoramento (PhD) em Sistemas Sustentáveis de Energia',
          institution: 'Universidade de Aveiro',
          period: '2016 – 2020',
          gpaOrHonors: 'Aprovado com Distinção e Louvor'
        }
      ],
      trainings: ['Prémio Jovem Investigador 2023', 'Revisor Científico IEEE & Elsevier'],
      languages: [
        { language: 'Português', level: 'Nativo' },
        { language: 'Inglês', level: 'C2 (Escrita Científica Académica)' }
      ],
      references: [],
      templateStyle: 'academic_lattes',
      accentColor: '#334155'
    }
  }
];

export const COVER_LETTER_EXAMPLES: CoverLetterExampleShowcaseItem[] = [
  {
    id: 'ex-cl-tech',
    title: 'Engenheiro de Software Sénior / Tech Lead',
    industry: 'Tecnologia & SaaS',
    category: 'tech',
    situationTag: 'Com experiência + Métricas de Sistema',
    tagline: 'Mostra impacto mensurável em latência, SLA e redução de custos cloud logo no 2.º parágrafo.',
    templateLayout: 'tech_clean',
    associatedCvTemplate: 'tech_modern',
    accentColor: '#0284c7',
    candidateName: 'RAFAEL OLIVEIRA',
    candidateTitle: 'Staff Software Engineer · Sistemas Distribuídos',
    location: 'Porto, Portugal',
    email: 'rafael.oliveira@cloudstack.dev',
    phone: '+351 934 112 890',
    letterBody: `Para: Engineering Manager & CTO
Assunto: Candidatura para Staff Software Engineer — Arquitetura Core

Exma. Equipa de Engenharia,

Acompanho o crescimento técnico da vossa plataforma e apresento a minha candidatura para a função de Staff Software Engineer. Com 8 anos de experiência na construção de sistemas distribuídos em Go, TypeScript e Kubernetes, o meu foco consiste em transformar gargalos de escala em infraestruturas previsíveis e de baixo custo.

Na minha posição atual, liderei a reescrita do pipeline principal de eventos, aumentando o débito para 45.000 pedidos/segundo e reduzindo a latência p99 para 54ms. Paralelamente, otimizei clusters em AWS EKS gerando uma poupança recorrente de 38% ao ano com 99.99% de disponibilidade.

Ficaria muito satisfeito em conversar sobre como esta experiência pode apoiar o vosso roadmap de escala para os próximos trimestres.

Com os melhores cumprimentos,

Rafael Oliveira`
  },
  {
    id: 'ex-cl-exec',
    title: 'Diretor de Operações / Liderança Executiva',
    industry: 'Direção & C-Level',
    category: 'executive',
    situationTag: 'Cargo Executivo · P&L & EBITDA',
    tagline: 'Tom institucional de alto nível com foco imediato em margem, governança e escalabilidade.',
    templateLayout: 'classic_bar',
    associatedCvTemplate: 'executive_harvard',
    accentColor: '#0f172a',
    candidateName: 'ALEXANDRE MENDES',
    candidateTitle: 'Chief Operating Officer (COO)',
    location: 'São Paulo, Brasil',
    email: 'alexandre.mendes@executivoglobal.com',
    phone: '+55 11 98765-4321',
    letterBody: `Para: Conselho de Administração & Comité Executivo
Assunto: Candidatura — Direção Geral de Operações (COO)

Exmos. Senhores Conselheiros,

Apresento a minha candidatura à liderança executiva de operações, trazendo mais de doze anos de atuação na condução de reestruturações operacionais, fusões e aquisições e gestão integral de P&L em organizações multinacionais.

Recentemente, estive à frente de quatro unidades regionais com 140 profissionais, período em que redesenhámos a cadeia de valor gerando US$ 8.4M em eficiência auditada e crescimento composto de 48% na receita anual.

Coloco-me à disposição do Comité para detalhar de que forma posso acelerar os indicadores estratégicos de rentabilidade e governança da empresa.

Atenciosamente,

Alexandre Mendes`
  },
  {
    id: 'ex-cl-product',
    title: 'Gestor de Produto (Product Manager)',
    industry: 'Produto Digital & Startups',
    category: 'product',
    situationTag: 'Foco em Conversão & Discovery',
    tagline: 'Conecta pesquisa com clientes, priorização de roadmap e impacto direto em receita (ARR).',
    templateLayout: 'modern_header',
    associatedCvTemplate: 'european_modern',
    accentColor: '#1d4ed8',
    candidateName: 'MARIANA TAVARES',
    candidateTitle: 'Senior Product Manager · B2B SaaS',
    location: 'Lisboa / Remoto',
    email: 'mariana.tavares@productmail.com',
    phone: '+351 918 773 210',
    letterBody: `Para: Head of Product
Assunto: Candidatura para Senior Product Manager (Growth & Ativação)

Olá Equipa de Produto,

Escrevo para me candidatar à posição de Senior Product Manager. Nos últimos seis anos conduzi equipas multifuncionais em produtos SaaS B2B desde a descoberta contínua até ao lançamento de funcionalidades que elevaram o ARR em mais de €3.2M.

No meu ciclo recente, identifiquei o principal ponto de abandono no fluxo de ativação através de 40 entrevistas qualitativas e testes A/B, aumentando a retenção aos 90 dias de 61% para 84%.

Terei todo o gosto em apresentar os estudos de caso de produto numa entrevista inicial.

Cumprimentos,

Mariana Tavares`
  },
  {
    id: 'ex-cl-finance',
    title: 'Analista / Diretor Financeiro (M&A)',
    industry: 'Banca & Finanças',
    category: 'finance',
    situationTag: 'Padrão Harvard · Rigor Analítico',
    tagline: 'Direto ao ponto, formal e sem adjetivos vazios — ideal para bancos e fundos.',
    templateLayout: 'harvard_formal',
    associatedCvTemplate: 'ats_compact',
    accentColor: '#1e293b',
    candidateName: 'BEATRIZ FONSECA',
    candidateTitle: 'VP Finanças Corporativas & M&A',
    location: 'Lisboa, Portugal',
    email: 'beatriz.fonseca@finance-holding.com',
    phone: '+351 912 345 678',
    letterBody: `Exmo. Comité de Recrutamento,

Submeto a minha candidatura à posição de Direção Financeira & Estratégia de Capital. Ao longo de dez anos na estruturação financeira corporativa, conduzi operações de M&A acima de €120M e processos de emissão de dívida institucional em conformidade com as normas IFRS e US GAAP.

No último exercício, liderei a renegociação de passivos no montante de €60M, alcançando uma redução de 140 pontos base no custo financeiro anual e assegurando aprovação unânime em auditoria externa.

Agradeço a atenção e permaneço disponível para entrevista em data conveniente.

Atenciosamente,

Beatriz Fonseca`
  },
  {
    id: 'ex-cl-entry',
    title: 'Primeiro Emprego / Estágio Profissional',
    industry: 'Recém-Licenciados',
    category: 'entry',
    situationTag: 'Sem experiência prévia formal',
    tagline: 'Transforma projetos académicos, mérito e proatividade numa candidatura persuasiva.',
    templateLayout: 'europass_blue',
    associatedCvTemplate: 'european_europass',
    accentColor: '#1d4ed8',
    candidateName: 'DIOGO FERREIRA',
    candidateTitle: 'Recém-Licenciado em Gestão & Análise de Dados',
    location: 'Braga, Portugal',
    email: 'diogo.ferreira@alumni.pt',
    phone: '+351 925 334 118',
    letterBody: `Exmos. Senhores Responsáveis pelo Programa de Talentos,

Com a recente conclusão da licenciatura em Gestão com média final de 17 valores, apresento a minha candidatura para o programa de Estágio Corporativo na área de Análise de Negócio.

Durante o percurso académico, coordenei a associação de estudantes de finanças (120 membros) e desenvolvi um projeto aplicado em Power BI e Python que otimizou o controlo de stock de uma PME local, reduzindo desperdícios em 19% durante seis meses.

Procuro integrar uma equipa exigente onde possa aplicar a minha capacidade analítica e contribuir com dedicação desde o primeiro dia.

Com os melhores cumprimentos,

Diogo Ferreira`
  },
  {
    id: 'ex-cl-transition',
    title: 'Transição de Carreira (Ex: Operações para UX/Produto)',
    industry: 'Mudança de Área',
    category: 'transition',
    situationTag: 'Competências transferíveis',
    tagline: 'Explica claramente o porquê da transição e prova competência prática com entregas reais.',
    templateLayout: 'split_accent',
    associatedCvTemplate: 'creative_split',
    accentColor: '#7c3aed',
    candidateName: 'CAMILA RIBEIRO',
    candidateTitle: 'Product Designer · Ex-Consultora de Processos',
    location: 'São Paulo, Brasil',
    email: 'camila@studioribeiro.design',
    phone: '+55 11 99123-7744',
    letterBody: `Para: Diretoria de Design & Produto
Assunto: Candidatura — Product Designer (Experiência Prévia em Processos & UX)

Olá Equipa,

Após quatro anos a mapear jornadas de clientes e otimizar processos operacionais no setor financeiro, direcionei a minha carreira para Product Design — unindo visão estratégica de negócio à prática em UI/UX no Figma.

Nos últimos 12 meses concluí três projetos reais end-to-end para fintechs, realizando entrevistas com utilizadores, arquitetura de informação e protótipos validados que reduziram o tempo médio de preenchimento de propostas em 42%.

Acredito que a minha base analítica combinada com sensibilidade visual agrega uma perspetiva valiosa para a vossa equipa de produto.

Atenciosamente,

Camila Ribeiro`
  }
];
