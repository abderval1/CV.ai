import { CVData, CVSectionKey } from '../types/cv';

export interface ActionVerbCategory {
  category: string;
  verbs: string[];
}

export const EXECUTIVE_ACTION_VERBS: ActionVerbCategory[] = [
  {
    category: 'Liderança & Estratégia',
    verbs: [
      'Liderou',
      'Orquestrou',
      'Estruturou',
      'Direcionou',
      'Capacitou',
      'Coordenou',
      'Supervisionou',
      'Mobilizou',
      'Consolidou'
    ]
  },
  {
    category: 'Otimização & Eficiência',
    verbs: [
      'Otimizou',
      'Automatizou',
      'Acelerou',
      'Padronizou',
      'Simplificou',
      'Maximizou',
      'Reduziu',
      'Eliminou gargalos em',
      'Modernizou'
    ]
  },
  {
    category: 'Impacto Financeiro & Resultados',
    verbs: [
      'Alavancou',
      'Gerou economia de',
      'Elevou o faturamento em',
      'Gerenciou orçamento de',
      'Maximizou ROI de',
      'Captou',
      'Rentabilizou'
    ]
  },
  {
    category: 'Governança & Riscos',
    verbs: [
      'Assegurou conformidade com',
      'Mitigou riscos operacionais em',
      'Implementou auditoria de',
      'Estabeleceu KPIs e SLAs para',
      'Validou políticas de'
    ]
  },
  {
    category: 'Inovação & Transformação',
    verbs: [
      'Concebeu',
      'Pioneirou',
      'Implementou',
      'Desenvolveu',
      'Escalou',
      'Arquitetou',
      'Transformou'
    ]
  }
];

export interface CompetencyCluster {
  title: string;
  skills: { category: string; description: string }[];
}

export const POPULAR_COMPETENCY_CLUSTERS: CompetencyCluster[] = [
  {
    title: 'Liderança Executiva & C-Level',
    skills: [
      { category: 'Gestão Estratégica & P&L', description: 'Supervisão integral de orçamentos, definição de metas de crescimento e governança corporativa.' },
      { category: 'Liderança de Equipas Multidisciplinares', description: 'Gestão de talentos, programas de retenção e liderança situacional focada em alta performance.' },
      { category: 'Gestão de Mudança & Transformação', description: 'Condução de reestruturações organizacionais e alinhamento de processos a padrões internacionais.' }
    ]
  },
  {
    title: 'Projetos, Agile & Operações',
    skills: [
      { category: 'Metodologias Ágeis (Scrum / Kanban)', description: 'Implementação de sprints ágeis, gestão de cerimónias e ciclos rápidos de entrega de valor.' },
      { category: 'Gestão de Projetos (PMP / PRINCE2)', description: 'Planeamento de cronogramas, matriz de riscos e controlo de escopo com ferramentas avançadas.' },
      { category: 'Melhoria Contínua (Lean / Six Sigma)', description: 'Otimização de processos operacionais com redução de desperdícios e tempos de resposta.' }
    ]
  },
  {
    title: 'Dados, Análise & Inteligência',
    skills: [
      { category: 'Business Intelligence & Dashboards', description: 'Desenvolvimento de painéis executivos em Power BI e Tableau para monitoria de KPIs em tempo real.' },
      { category: 'Análise de Dados & SQL', description: 'Extração, modelação e análise preditiva para suporte direto a tomadas de decisão estratégicas.' },
      { category: 'Inteligência Artificial & Automação', description: 'Adoção de modelos generativos e scripts automatizados para ganho de produtividade.' }
    ]
  },
  {
    title: 'Tecnologia, Cloud & Arquitetura',
    skills: [
      { category: 'Arquitetura de Software & Cloud', description: 'Desenho de sistemas escaláveis e microsserviços em ambientes AWS, Google Cloud e Azure.' },
      { category: 'Segurança & Compliance (LGPD / GDPR)', description: 'Garantia de segurança da informação, auditorias de vulnerabilidade e proteção de dados sensíveis.' },
      { category: 'DevOps & Integração Contínua (CI/CD)', description: 'Automação de deploys, pipelines de teste e infraestrutura como código (IaC).' }
    ]
  },
  {
    title: 'Finanças, Governança & M&A',
    skills: [
      { category: 'Modelagem Financeira & Valuation', description: 'Projeções de fluxo de caixa descontado, análise de sensibilidade e avaliação de investimentos.' },
      { category: 'Auditoria & Controlo Interno', description: 'Revisão de procedimentos contabilísticos e conformidade com normas IFRS e SOX.' },
      { category: 'Negociação de Contratos & Parcerias', description: 'Fecho de acordos bilaterais de alto valor e relacionamento com investidores institucionais.' }
    ]
  }
];

export interface CVMetrics {
  totalWords: number;
  readingTimeSeconds: number;
  readingTimeFormatted: string;
  estimatedPages: number;
  strengthScore: number; // 0 to 100
  completenessChecklist: {
    label: string;
    completed: boolean;
    recommendation: string;
  }[];
}

export function calculateCVMetrics(cv: CVData): CVMetrics {
  const textBlocks: string[] = [
    cv.personalDetails.name,
    cv.personalDetails.title,
    cv.personalDetails.location,
    cv.summary,
    ...cv.competencies.map((c) => `${c.category} ${c.description}`),
    ...cv.experiences.flatMap((e) => [e.company, e.role, ...(e.highlights || [])]),
    ...cv.educations.map((ed) => `${ed.degree} ${ed.institution}`),
    ...cv.trainings,
    ...cv.languages.map((l) => `${l.language} ${l.level}`),
    ...cv.references.map((r) => `${r.name} ${r.institutionAndPosition}`)
  ];

  const fullText = textBlocks.filter(Boolean).join(' ');
  const words = fullText.trim().split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  // Average recruiter speed: 450 words per minute during thorough read, ~6 seconds for initial scan
  const readingTimeSeconds = Math.max(10, Math.round((totalWords / 4.5)));
  const minutes = Math.floor(readingTimeSeconds / 60);
  const remainingSecs = readingTimeSeconds % 60;
  const readingTimeFormatted = minutes > 0 ? `${minutes}m ${remainingSecs}s` : `${remainingSecs}s`;

  // Estimate A4 pages: ~380-480 words fits in 1 page (normal density)
  const estimatedPages = totalWords <= 480 ? 1 : totalWords <= 950 ? 2 : Math.ceil(totalWords / 450);

  // Check highlights for quantifiable numbers ($, %, k, M, números)
  const allHighlights = cv.experiences.flatMap((e) => e.highlights || []);
  const numericRegex = /(\d+(\.\d+)?%|\$\d+|\b\d+\s*(milhões|mil|milhoes|k|m|h|dias|semanas|meses|anos)\b|\b\d{2,}\b)/i;
  const quantifiableCount = allHighlights.filter((h) => numericRegex.test(h)).length;

  const checklist = [
    {
      label: 'Dados Pessoais & Contactos',
      completed: Boolean(cv.personalDetails.name && cv.personalDetails.email && cv.personalDetails.phone),
      recommendation: 'Preencha nome completo, e-mail e telefone de contacto direto.'
    },
    {
      label: 'Resumo Profissional Estratégico',
      completed: Boolean(cv.summary && cv.summary.length >= 80),
      recommendation: 'Adicione um resumo executivo com pelo menos 3 linhas sobre a sua proposta de valor.'
    },
    {
      label: 'Experiência Relevante com Conquistas',
      completed: cv.experiences.length >= 2 && allHighlights.length >= 4,
      recommendation: 'Descreva pelo menos 2 cargos com 2 ou mais realizações cada.'
    },
    {
      label: 'Métricas Quantificáveis nos Destaques',
      completed: quantifiableCount >= 2,
      recommendation: 'Adicione percentagens (%) ou números mensuráveis em pelo menos 2 realizações.'
    },
    {
      label: 'Competências Chave Estruturadas',
      completed: cv.competencies.length >= 3,
      recommendation: 'Liste 3 a 6 competências essenciais para a vaga desejada.'
    },
    {
      label: 'Formação Académica',
      completed: cv.educations.length >= 1,
      recommendation: 'Inclua o seu grau académico mais relevante e instituição.'
    },
    {
      label: 'Idiomas & Nível de Proficiência',
      completed: cv.languages.length >= 1,
      recommendation: 'Adicione idiomas e grau de fluência (padrão CEFR ou descritivo).'
    }
  ];

  const completedCount = checklist.filter((c) => c.completed).length;
  const strengthScore = Math.round((completedCount / checklist.length) * 100);

  return {
    totalWords,
    readingTimeSeconds,
    readingTimeFormatted,
    estimatedPages,
    strengthScore,
    completenessChecklist: checklist
  };
}

export const DEFAULT_SECTION_ORDER: CVSectionKey[] = [
  'summary',
  'competencies',
  'experiences',
  'educations',
  'trainings',
  'languages',
  'references'
];

export const SECTION_METADATA: Record<CVSectionKey, { name: string; description: string; iconName: string }> = {
  summary: {
    name: 'Resumo Profissional',
    description: 'Apresentação executiva e proposta de valor',
    iconName: 'FileText'
  },
  competencies: {
    name: 'Competências Chave',
    description: 'Habilidades técnicas, metodologias e ferramentas',
    iconName: 'Sparkles'
  },
  experiences: {
    name: 'Experiência Profissional',
    description: 'Histórico de cargos, organizações e realizações',
    iconName: 'Briefcase'
  },
  educations: {
    name: 'Formação Académica',
    description: 'Graduações, pós-graduações e mestrados',
    iconName: 'GraduationCap'
  },
  trainings: {
    name: 'Certificações & Cursos',
    description: 'Certificações da indústria e formações executivas',
    iconName: 'Award'
  },
  languages: {
    name: 'Idiomas & Proficiência',
    description: 'Fluência linguística e certificações CEFR',
    iconName: 'Globe'
  },
  references: {
    name: 'Referências Profissionais',
    description: 'Contactos institucionais para validação',
    iconName: 'Users'
  }
};
