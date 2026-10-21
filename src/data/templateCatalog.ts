import { TemplateStyle } from '../types/cv';

export interface CVTemplateInfo {
  id: TemplateStyle;
  name: string;
  shortName: string;
  badge: string;
  category: 'with_photo' | 'without_photo' | 'hybrid';
  hasPhoto: boolean;
  photoRule: 'recommended' | 'strictly_forbidden' | 'optional';
  photoRuleLabel: string;
  photoRuleDescription: string;
  tagline: string;
  whenToUse: string;
  whereToUse: string;
  regions: string[];
  bestForIndustries: string[];
  atsScore: number; // 0 to 100
  atsRatingText: string;
  whyPhotoOrNot: string;
  keyFeatures: string[];
  proTip: string;
  accentColor: string;
  previewThumbnailUrl?: string;
}

export const CV_TEMPLATES: CVTemplateInfo[] = [
  {
    id: 'european_europass',
    name: 'Modelo Europeu Europass (Com Foto)',
    shortName: 'Europeu Europass',
    badge: '📸 Com Foto',
    category: 'with_photo',
    hasPhoto: true,
    photoRule: 'recommended',
    photoRuleLabel: 'Foto Altamente Recomendada',
    photoRuleDescription:
      'Na Europa Continental (Alemanha, França, Portugal, Espanha, Itália), fotos executivas são culturalmente esperadas e valorizadas pelos recrutadores.',
    tagline: 'Padrão oficial da União Europeia com grelha estruturada de competências e idiomas CEFR.',
    whenToUse:
      'Candidaturas a empresas privadas na Europa, programas Erasmus+, bolsas de estudo de matriz europeia, estágios internacionais e vagas em países de língua oficial portuguesa ou espanhola.',
    whereToUse:
      'União Europeia (Alemanha, Portugal, Espanha, França, Suíça, Itália, Áustria, Países Baixos) e empresas multinacionais europeias sediadas em Angola, Moçambique e Brasil.',
    regions: ['União Europeia', 'Portugal & Espanha', 'Alemanha (DACH)', 'França', 'África Lusófona'],
    bestForIndustries: [
      'Empresas Multinacionais Europeias',
      'Saúde, Farmacêutica e Medicina',
      'Engenharia & Construção Civil',
      'Educação, Bolsas e Ensino Superior',
      'Administração Pública e Apoio ao Cliente'
    ],
    atsScore: 88,
    atsRatingText: '88% ATS Score - Estrutura padronizada por blocos da UE',
    whyPhotoOrNot:
      'Culturalmente, no sul da Europa e na região DACH (Alemanha, Áustria, Suíça), uma fotografia profissional recente transmite seriedade, identificação clara do candidato e gera empatia imediata.',
    keyFeatures: [
      'Cabeçalho com foto profissional integrada e dados de cidadania/mobilidade',
      'Bloco de idiomas com classificação pelo Quadro Europeu Comum de Referência (A1 a C2)',
      'Organização em blocos lógicos com destaque para competências operacionais',
      'Padrão reconhecido em todos os 27 estados-membros da União Europeia'
    ],
    proTip:
      'Utilize uma foto profissional com iluminação neutra, fundo claro e vestimenta corporativa. Evite selfies ou fotos de festas.',
    accentColor: '#1d4ed8'
  },
  {
    id: 'creative_split',
    name: 'Modelo Criativo Split (Com Foto & Sidebar)',
    shortName: 'Criativo Split',
    badge: '📸 Com Foto & Painel Lateral',
    category: 'with_photo',
    hasPhoto: true,
    photoRule: 'recommended',
    photoRuleLabel: 'Com Foto em Destaque Visual',
    photoRuleDescription:
      'Design em duas colunas com barra lateral personalizada, ideal para demonstrar senso estético apurado e personal branding.',
    tagline: 'Layout moderno assimétrico em dois painéis para destacar soft skills, portfólio e identidade.',
    whenToUse:
      'Candidaturas em Design, Marketing Digital, UI/UX, Publicidade, Arquitetura, Gestão de Redes Sociais, Audiovisual, Produto e Startups ágeis.',
    whereToUse:
      'Startups inovadoras, agências de publicidade e design, scale-ups tech, estúdios digitais e processos onde o envio é feito diretamente por e-mail ou indicação ao líder da área.',
    regions: ['Brasil & Portugal', 'Ecossistemas de Startups', 'EUA (Agências)', 'Global Remoto'],
    bestForIndustries: [
      'Design UI/UX & Produto',
      'Marketing Digital & Growth',
      'Comunicação Social & Jornalismo',
      'Audiovisual, Moda & Criatividade',
      'Startups e Cultura Ágil'
    ],
    atsScore: 82,
    atsRatingText: '82% ATS Score - Ideal para avaliação visual direta por humanos',
    whyPhotoOrNot:
      'Em funções criativas, a imagem pessoal reflete seu estilo de comunicação e capacidade de criar um portfólio visualmente arrebatador logo nos primeiros 6 segundos.',
    keyFeatures: [
      'Barra lateral com foto em destaque, canais sociais e hard skills com barras de proficiência',
      'Coluna principal ampla com timeline de carreira e realizações cronológicas',
      'Excelente equilíbrio entre densidade de informação e respiro visual',
      'Tags elegantes para ferramentas de ponta (Figma, Adobe, Hubspot, Webflow)'
    ],
    proTip:
      'Excelente para candidaturas via e-mail direto para diretores de arte, CMOs ou fundadores de startups.',
    accentColor: '#7c3aed'
  },
  {
    id: 'hybrid_minimalist',
    name: 'Modelo Minimalista Nórdico (Com/Sem Foto)',
    shortName: 'Minimalista Nórdico',
    badge: '✨ Elegância Clean',
    category: 'hybrid',
    hasPhoto: true,
    photoRule: 'optional',
    photoRuleLabel: 'Foto Opcional / Versátil',
    photoRuleDescription:
      'Estética escandinava focada no essencial: tipografia impecável, espaço em branco equilibrado e leitura prazerosa sem fadiga visual.',
    tagline: 'Elegância contemporânea nórdica com foco na clareza absoluta da narrativa profissional.',
    whenToUse:
      'Profissionais de Recursos Humanos, Gestão de Projetos, Consultoria, Vendas B2B, Relações Públicas ou qualquer especialista que prefira um visual sofisticado e moderno.',
    whereToUse:
      'Países Nórdicos (Suécia, Dinamarca, Noruega), Suíça, Países Baixos, Reino Unido, Brasil e empresas que cultivam design minimalista.',
    regions: ['Países Nórdicos', 'Suíça & Reino Unido', 'Europa Central', 'América Latina'],
    bestForIndustries: [
      'Gestão de Pessoas & Recursos Humanos',
      'Consultoria de Negócios & Operações',
      'Arquitetura, Urbanismo & Interiores',
      'SaaS & Empresas de Tecnologia',
      'Boutiques Financeiras e Jurídicas'
    ],
    atsScore: 92,
    atsRatingText: '92% ATS Score - Altíssima legibilidade por OCR',
    whyPhotoOrNot:
      'Apresenta proporções áureas que funcionam com perfeição tanto com uma foto formal discreta quanto em formato puramente textual se optar por desligar a foto.',
    keyFeatures: [
      'Espaçamento harmonioso com micro-tipografia refinada',
      'Linhas divisórias sutis e cabeçalho arejado',
      'Fácil transição entre modo Com Foto ou Sem Foto com 1 clique',
      'Legibilidade perfeita tanto em ecrãs de telemóvel como em impressão A4'
    ],
    proTip:
      'Se aplicar para empresas nos EUA ou Reino Unido, basta clicar em "Desativar Foto" para torná-lo 100% complacente com as regras anglo-saxónicas.',
    accentColor: '#059669'
  },
  {
    id: 'ats_compact',
    name: 'Modelo Norte-Americano / ATS Estrito (Sem Foto)',
    shortName: 'ATS Estrito EUA/UK',
    badge: '🛡️ 100% Robô ATS',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'strictly_forbidden',
    photoRuleLabel: 'Rigorosamente Sem Foto (Zero Imagens)',
    photoRuleDescription:
      'As leis trabalhistas dos EUA e Reino Unido proíbem fotos para evitar ações de discriminação. Sistemas ATS descartam automaticamente CVs com fotos.',
    tagline: 'Otimizado em 100% para algoritmos de triagem corporativa (Workday, Taleo, Greenhouse, Lever).',
    whenToUse:
      'Candidaturas feitas em portais de grandes corporações mundiais onde o primeiro filtro é realizado por Inteligência Artificial e rastreadores automatizados de palavras-chave.',
    whereToUse:
      'Estados Unidos, Canadá, Reino Unido, Irlanda, Austrália, Nova Zelândia e grandes multinacionais globais com milhares de inscrições.',
    regions: ['Estados Unidos', 'Reino Unido', 'Canadá', 'Austrália & NZ', 'Multinacionais Globais'],
    bestForIndustries: [
      'Big Tech & Startups Globais (Remote)',
      'Bancos Globais & Seguradoras',
      'Farmacêuticas & Biotecnologia',
      'Petróleo, Gás & Energia',
      'Candidaturas pelo LinkedIn Easy Apply e Workday'
    ],
    atsScore: 100,
    atsRatingText: '100% ATS Match Score - Padrão OCR Imbatível',
    whyPhotoOrNot:
      'A legislação da Comissão de Igualdade de Oportunidades no Emprego dos EUA (EEOC) e leis trabalhistas britânicas desaconselham fotos para proteger contra preconceitos de idade, raça ou sexo. Softwares ATS modernos consideram fotos como "ruído de imagem" e desconfiguram o texto.',
    keyFeatures: [
      'Coluna única 100% linear: o leitor de OCR lê de cima para baixo sem erros',
      'Cabeçalhos de secção com termos canónicos que os robôs procuram (EXPERIENCE, EDUCATION)',
      'Zero elementos gráficos flutuantes ou caixas de texto que travam robôs',
      'Densidade ideal de métricas numéricas e verbos de ação'
    ],
    proTip:
      'Utilize os marcadores de palavras-chave do nosso Radar ATS para calibrar seu currículo até atingir mais de 85% de compatibilidade antes de enviar.',
    accentColor: '#0f172a'
  },
  {
    id: 'executive_harvard',
    name: 'Modelo Executivo Harvard Business School (Sem Foto)',
    shortName: 'Harvard Executivo',
    badge: '👑 Ivy League / C-Level',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'strictly_forbidden',
    photoRuleLabel: 'Sem Foto (Padrão Ivy League / Wall Street)',
    photoRuleDescription:
      'Padrão consagrado pelas principais escolas de negócios mundiais. Valoriza densidade intelectual, governança e métricas de retorno sobre investimento.',
    tagline: 'O padrão definitivo para Conselhos de Administração, C-Level, Mercado Financeiro e MBB.',
    whenToUse:
      'Candidaturas a Diretorias, C-Level (CEO, CFO, CTO, COO), Conselhos de Administração, Consultorias Estratégicas (McKinsey, BCG, Bain) e Mercado Financeiro (Private Equity, M&A).',
    whereToUse:
      'Mercado executivo global, Wall Street, Faria Lima, City de Londres, grandes fundos soberanos e corporações multinacionais.',
    regions: ['Global Executivo', 'EUA & Reino Unido', 'Brasil (Faria Lima)', 'Centros Financeiros'],
    bestForIndustries: [
      'Bancos de Investimento & Private Equity',
      'Consultoria Estratégica de Gestão (MBB)',
      'Diretoria Executiva & C-Suite',
      'Fusões & Aquisições (M&A)',
      'Governança Corporativa e Compliance'
    ],
    atsScore: 96,
    atsRatingText: '96% ATS Score - Altíssima pontuação executiva',
    whyPhotoOrNot:
      'No mais alto escalão corporativo global, a inclusão de foto é interpretada como amadorismo. O foco exclusivo deve repousar nos números de EBITDA gerados, reestruturações lideradas e valor patrimonial agregado.',
    keyFeatures: [
      'Tipografia clássica serifada de alta legibilidade (estilo Times New Roman / Garamond)',
      'Linhas divisórias pretas de 0.5pt com cabeçalho centralizado majestoso',
      'Fórmula Harvard em cada bullet: Ação de Impacto + Contexto Estratégico + Resultado Quantificável',
      'Destaque para governança institucional e credenciais acadêmicas de prestígio'
    ],
    proTip:
      'Quantifique cada realização: "Liderou reestruturação de US$ 12M que resultou em aumento de 34% no EBITDA e redução de custos de 18% em 12 meses".',
    accentColor: '#1e293b'
  },
  {
    id: 'tech_modern',
    name: 'Modelo Tech Lead & Engenharia de Software (Sem Foto)',
    shortName: 'Tech Lead & Dev',
    badge: '💻 Tech & Engenharia',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'strictly_forbidden',
    photoRuleLabel: 'Sem Foto / Foco em Stack & Código',
    photoRuleDescription:
      'Recrutadores de tecnologia e Engineering Managers priorizam proficiência em linguagens, links de GitHub, arquitetura distribuída e métricas de sistema.',
    tagline: 'Estruturado para programadores, arquitetos de software, tech leads e especialistas em IA.',
    whenToUse:
      'Candidaturas para Engenheiro de Software, Tech Lead, Engenheiro de Dados, DevOps, Cloud Architect, Cientista de Dados e Especialista em Machine Learning.',
    whereToUse:
      'Big Techs (Google, Amazon, Meta, Microsoft), empresas SaaS, scale-ups internacionais e posições remotas internacionais remuneradas em dólar/euro.',
    regions: ['EUA (Vale do Silício)', 'Europa Tech (Londres, Berlim, Amesterdão)', 'Trabalho Remoto Global'],
    bestForIndustries: [
      'Desenvolvimento de Software & Cloud',
      'Inteligência Artificial & LLMs',
      'Engenharia de Dados & Big Data',
      'Cybersecurity & Infraestrutura DevOps',
      'Fintechs, Cripto & Web3'
    ],
    atsScore: 95,
    atsRatingText: '95% ATS Score - Otimizado para indexadores técnicos',
    whyPhotoOrNot:
      'No ecossistema de software mundial, fotos são desnecessárias. Engenheiros de ponta são avaliados pelo seu repositório de código, capacidade de resolver problemas de escala e domínio do ecossistema.',
    keyFeatures: [
      'Secção de competências dividida por categorias técnicas: Linguagens, Frameworks, Cloud, Bancos de Dados',
      'Espaço de destaque para perfis do GitHub, LinkedIn, StackOverflow e portfólio live',
      'Bullet points formatados com métricas de sistema (ex: 99.99% SLA, redução de 400ms de latência)',
      'Tipografia limpa com toques em fonte mono-espaçada nos termos técnicos'
    ],
    proTip:
      'Inclua o link do seu GitHub ou projeto real no cabeçalho. Recrutadores técnicos clicam diretamente nos links para auditar a qualidade do código.',
    accentColor: '#0284c7'
  },
  {
    id: 'un_classic',
    name: 'Modelo ONU / Cooperação Internacional & ONGs (Diplomático)',
    shortName: 'ONU & ONGs',
    badge: '🏛️ Diplomático / ONU',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'optional',
    photoRuleLabel: 'Padrão Oficial das Agências Internacionais',
    photoRuleDescription:
      'Segue as exigências dos sistemas Inspira da ONU e formulários P11. Destaca financiadores internacionais (donors) e projetos humanitários.',
    tagline: 'O formato diplomático oficial para Nações Unidas, Banco Mundial, doadores e ONGs internacionais.',
    whenToUse:
      'Candidaturas para agências da ONU (UNDP, UNICEF, OMS, WFP, ACNUR, OIT), Bancos Multilaterais (Banco Mundial, BAD, BID), ONGs Internacionais (MSF, Oxfam, Save the Children) e agências bilaterais (USAID, Camões, GIZ, FCDO).',
    whereToUse:
      'África Subsaariana (Angola, Moçambique, RDC), Médio Oriente, Ásia Central, Genebra, Nova Iorque, Roma e capitais diplomáticas.',
    regions: ['África & Lusofonia', 'Sedes da ONU (Genebra, NY, Roma)', 'América Latina & Caraíbas', 'Médio Oriente'],
    bestForIndustries: [
      'Agências das Nações Unidas (ONU)',
      'Ajuda Humanitária & Emergências',
      'Monitoria & Avaliação de Impacto (MEAL)',
      'Bancos Multilaterais de Desenvolvimento',
      'Saúde Pública Global & Direitos Humanos'
    ],
    atsScore: 94,
    atsRatingText: '94% ATS Score - Alinhado aos formulários PHP/P11 da ONU',
    whyPhotoOrNot:
      'As Nações Unidas e doadores internacionais proíbem fotos para garantir estrita igualdade de tratamento em missões multinacionais e respeitar a diversidade cultural dos candidatos.',
    keyFeatures: [
      'Menção explícita a Doadores e Financiadores Internacionais em cada missão (ex: Financiamento Camões / UE / USAID)',
      'Ênfase em sistemas MEAL, Quadros Lógicos, gestão por resultados (RBM) e integridade de dados',
      'Secção rica de idiomas com fluência em relatórios e negociações',
      'Espaço formal para referências institucionais de alto nível com contactos de supervisores'
    ],
    proTip:
      'Sempre cite os nomes dos doadores e fundos internacionais que financiaram as operações que você coordenou. No setor humanitário, isso gera confiança imediata.',
    accentColor: '#0369a1'
  },
  {
    id: 'academic_lattes',
    name: 'Modelo Acadêmico / Investigação Científica & PhD (Sem Foto)',
    shortName: 'Acadêmico & PhD',
    badge: '🎓 Acadêmico & Ciência',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'strictly_forbidden',
    photoRuleLabel: 'Sem Foto / Rigor Científico Formal',
    photoRuleDescription:
      'Focado na produção bibliográfica, publicações indexadas (DOI, Scopus), orientações, bolsas de investigação e docência universitária.',
    tagline: 'Estrutura formal e completa para candidaturas a mestrado, doutoramento, bolsas e cátedras.',
    whenToUse:
      'Candidaturas a concursos públicos de docência no ensino superior, bolsas de doutoramento ou pós-doutoramento, centros de investigação científica e submissão de projetos a agências de fomento (FCT, CNPq, CAPES, Horizon Europe).',
    whereToUse:
      'Universidades públicas e privadas, centros de I&D (CERN, Fiocruz, Max Planck, CNRS), institutos politécnicos e laboratórios científicos.',
    regions: ['Brasil (Padrão Lattes)', 'Portugal & Europa (CiênciaVitae)', 'Universidades Globais'],
    bestForIndustries: [
      'Ensino Superior & Docência Universitária',
      'Investigação Científica e Inovação (I&D)',
      'Bolsas de Mestrado e Doutoramento',
      'Centros de Pesquisa Médica e Biológica',
      'Ciências Sociais, Humanas e Exatas'
    ],
    atsScore: 90,
    atsRatingText: '90% ATS Score - Formato bibliográfico estruturado',
    whyPhotoOrNot:
      'No meio científico internacional, a avaliação baseia-se estritamente no mérito acadêmico, fator de impacto das publicações e histórico de orientações.',
    keyFeatures: [
      'Ordem cronológica reversa formal com títulos de dissertações e nomes de orientadores',
      'Secção dedicada a Artigos Científicos, Capítulos de Livros e Comunicações em Congressos',
      'Registo de Prémios, Distinções Honoríficas e Bolsas de Pesquisa obtidas',
      'Lista de línguas e proficiência acadêmica para escrita de artigos científicos'
    ],
    proTip:
      'Inclua os links diretos para os artigos (DOI) e mencione se a publicação possui indexação no Scopus ou Web of Science.',
    accentColor: '#334155'
  },
  {
    id: 'european_modern',
    name: 'Modelo Corporativo Multinacional (Modern Clean)',
    shortName: 'Corporativo Moderno',
    badge: '💼 Corporativo',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'optional',
    photoRuleLabel: 'Sem Foto / Design Corporativo Dinâmico',
    photoRuleDescription:
      'Design balanceado para empresas de consultoria comercial, telecomunicações e serviços financeiros que procuram sobriedade sem formalismo excessivo.',
    tagline: 'Versatilidade e dinamismo com linhas limpas para posições corporativas gerais.',
    whenToUse:
      'Candidaturas em Telecomunicações, Logística, Vendas Corporativas, Gestão de Operações e Serviços Financeiros.',
    whereToUse:
      'Multinacionais e grandes empresas em Angola, Portugal, Moçambique, Brasil e América Latina.',
    regions: ['Angola & Lusofonia', 'Portugal', 'Brasil', 'América Latina'],
    bestForIndustries: [
      'Telecomunicações & TI',
      'Logística, Cadeia de Suprimentos & Transporte',
      'Comércio Internacional & Exportação',
      'Banca Comercial & Microfinanças',
      'Consultoria Operacional'
    ],
    atsScore: 93,
    atsRatingText: '93% ATS Score - Excelente legibilidade mista',
    whyPhotoOrNot:
      'Versão corporativa enxuta sem foto, perfeita para candidaturas gerais onde não há exigência de imagem pessoal mas requer modernidade visual.',
    keyFeatures: [
      'Cabeçalho dinâmico com realce de contactos e localização',
      'Secção de resumo executivo com barra colorida vertical',
      'Grelha de competências de fácil escaneamento visual pelos recrutadores',
      'Estrutura equilibrada entre texto e respiro'
    ],
    proTip:
      'Ideal para quem busca um currículo contemporâneo sem correr riscos de rejeição por fotos em multinacionais.',
    accentColor: '#0f766e'
  }
];

export interface SampleAvatar {
  id: string;
  name: string;
  category: string;
  url: string;
}

export const SAMPLE_AVATARS: SampleAvatar[] = [
  {
    id: 'exec_male',
    name: 'Executivo Formal',
    category: 'Executivo',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face&auto=format&q=80'
  },
  {
    id: 'exec_female',
    name: 'Executiva Líder',
    category: 'Executivo',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face&auto=format&q=80'
  },
  {
    id: 'tech_pro',
    name: 'Tech / Criativo',
    category: 'Tech & Criativo',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face&auto=format&q=80'
  },
  {
    id: 'intl_female',
    name: 'Consultora Internacional',
    category: 'Internacional',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face&auto=format&q=80'
  }
];

export function getTemplateById(id: TemplateStyle): CVTemplateInfo {
  const found = CV_TEMPLATES.find((t) => t.id === id);
  return found || CV_TEMPLATES[0];
}
