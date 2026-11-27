import { TemplateStyle } from '../types/cv';
import portraitManImg from '../assets/images/portrait_executive_man_1794571428722.jpg';
import portraitWomanImg from '../assets/images/portrait_executive_woman_1794571428995.jpg';

export interface CVTemplateInfo {
  id: TemplateStyle;
  name: string;
  shortName: string;
  badge: string;
  category: 'with_photo' | 'without_photo' | 'hybrid';
  hasPhoto: boolean;
  isRecommended?: boolean;
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
  // ============================================================================
  // TOP 5 MAIS RECOMENDADOS ATUALMENTE
  // ============================================================================
  {
    id: 'ats_professional',
    name: 'ATS Professional',
    shortName: 'ATS Professional',
    badge: '⭐ Top 1 · ATS',
    category: 'without_photo',
    hasPhoto: false,
    isRecommended: true,
    photoRule: 'strictly_forbidden',
    photoRuleLabel: 'Sem Foto (Máxima Leitura ATS)',
    photoRuleDescription:
      'Estrutura linear em coluna única desenhada especificamente para passar sem erros nos filtros automáticos de recrutamento.',
    tagline: 'Melhor para passar filtros automáticos de recrutamento (Workday, Taleo, Greenhouse, Gupy).',
    whenToUse:
      'Candidaturas em portais de emprego online, multinacionais e grandes empresas que usam triagem automática.',
    whereToUse: 'Global, EUA, Reino Unido, Canadá, Brasil, Portugal, Angola e candidaturas remotas.',
    regions: ['Global ATS', 'EUA & Reino Unido', 'Europa & Brasil', 'Angola & PALOP'],
    bestForIndustries: ['Tecnologia & SaaS', 'Banca & Finanças', 'Engenharia', 'Operações', 'Vendas B2B'],
    atsScore: 100,
    atsRatingText: '100% ATS Score - Leitura OCR perfeita em coluna única',
    whyPhotoOrNot:
      'Sistemas de leitura automática funcionam melhor com texto puro e hierarquia clara, sem imagens que bloqueiem a leitura.',
    keyFeatures: [
      'Coluna única limpa que garante leitura 100% correta por robôs ATS',
      'Títulos de secção padronizados para indexação automática',
      'Destaque imediato para competências-chave e métricas de impacto',
      'Compatível com exportação Word (.docx) e PDF pesquisável'
    ],
    proTip: 'Use palavras-chave exatas da descrição da vaga nos seus pontos de experiência e competências.',
    accentColor: '#0f172a'
  },
  {
    id: 'modern_professional',
    name: 'Modern Professional',
    shortName: 'Modern Professional',
    badge: '⭐ Top 2 · Moderno',
    category: 'hybrid',
    hasPhoto: true,
    isRecommended: true,
    photoRule: 'optional',
    photoRuleLabel: 'Foto Opcional / Equilibrada',
    photoRuleDescription:
      'Visual atual com barra de destaque e opção rápida de mostrar ou ocultar fotografia consoante o país da vaga.',
    tagline: 'Equilíbrio entre design moderno e profissionalismo para quase qualquer área.',
    whenToUse:
      'Vagas corporativas atuais, startups em crescimento, marketing, produto, gestão e serviços.',
    whereToUse: 'Europa, América Latina, África Lusófona e empresas internacionais flexíveis.',
    regions: ['Portugal & Brasil', 'União Europeia', 'Angola & Moçambique', 'Global'],
    bestForIndustries: ['Corporativo', 'Marketing & Produto', 'RH & Operações', 'Consultoria', 'Tecnologia'],
    atsScore: 95,
    atsRatingText: '95% ATS Score - Design limpo e fácil de ler',
    whyPhotoOrNot:
      'Adapta-se em 1 clique: ative a foto para Europa/LATAM ou desative para portais dos EUA e Reino Unido.',
    keyFeatures: [
      'Cabeçalho contemporâneo com hierarquia clara e leitura rápida em 6 segundos',
      'Secção de resumo profissional com realce visual elegante',
      'Funciona igualmente bem com ou sem fotografia',
      'Excelente equilíbrio entre estética moderna e aprovação ATS'
    ],
    proTip: 'Ideal como modelo principal quando precisa de um currículo bonito, claro e aceitável em qualquer empresa.',
    accentColor: '#2563eb'
  },
  {
    id: 'reverse_chronological',
    name: 'Reverse Chronological',
    shortName: 'Reverse Chronological',
    badge: '⭐ Top 3 · Clássico',
    category: 'without_photo',
    hasPhoto: false,
    isRecommended: true,
    photoRule: 'strictly_forbidden',
    photoRuleLabel: 'Sem Foto (Padrão Preferido por RH)',
    photoRuleDescription:
      'Ordenação da experiência mais recente para a mais antiga em estrutura direta e previsível.',
    tagline: 'O formato mais aceite pelos recrutadores no mundo inteiro para mostrar progressão de carreira.',
    whenToUse:
      'Quando tem histórico profissional contínuo na mesma área e quer evidenciar crescimento de cargos.',
    whereToUse: 'Mundial — aceite por 99% das equipas de Recursos Humanos e headhunters.',
    regions: ['Mundial', 'EUA & Canadá', 'Europa', 'América Latina'],
    bestForIndustries: ['Administração', 'Finanças', 'Engenharia', 'Logística', 'Gestão Comercial'],
    atsScore: 99,
    atsRatingText: '99% ATS Score - Formato universal preferido por recrutadores',
    whyPhotoOrNot:
      'Recrutadores procuram imediatamente o seu cargo atual e evolução nos últimos anos sem distrações visuais.',
    keyFeatures: [
      'Cronologia inversa clara destacando os cargos mais recentes no topo',
      'Datas e empresas alinhadas para leitura rápida',
      'Total transparência de progressão profissional',
      'Zero elementos gráficos pesados — aprovação garantida'
    ],
    proTip: 'Dê mais espaço e 4–5 resultados concretos aos seus dois últimos cargos; resuma experiências com mais de 10 anos.',
    accentColor: '#1e293b'
  },
  {
    id: 'hybrid_combination',
    name: 'Hybrid (Combination)',
    shortName: 'Hybrid (Combination)',
    badge: '⭐ Top 4 · Híbrido',
    category: 'hybrid',
    hasPhoto: true,
    isRecommended: true,
    photoRule: 'optional',
    photoRuleLabel: 'Foto Opcional / Versátil',
    photoRuleDescription:
      'Combina bloco estratégico de competências no topo com histórico cronológico de realizações logo abaixo.',
    tagline: 'Combina experiência e competências em destaque para profissionais versáteis ou seniores.',
    whenToUse:
      'Especialistas multidisciplinares, gestores de projetos, profissionais técnicos e quem quer unir competências e histórico.',
    whereToUse: 'Europa, Brasil, Portugal, EUA (desativando foto) e vagas remotas internacionais.',
    regions: ['Global', 'Europa', 'América Latina', 'Trabalho Remoto'],
    bestForIndustries: ['Gestão de Projetos', 'Produto & Estratégia', 'TI & Dados', 'Consultoria', 'Operações'],
    atsScore: 96,
    atsRatingText: '96% ATS Score - Equilibra palavras-chave e cronologia',
    whyPhotoOrNot:
      'Permite destacar primeiro o que sabe fazer (competências) seguido de onde aplicou essas competências.',
    keyFeatures: [
      'Bloco de competências essenciais visível logo após o resumo',
      'Histórico profissional completo em ordem cronológica inversa',
      'Excelente densidade de palavras-chave técnicas para robôs ATS',
      'Flexibilidade total para ligar ou desligar a fotografia'
    ],
    proTip: 'Alinhe os 4 a 6 blocos de competências do topo exatamente com os requisitos principais da vaga.',
    accentColor: '#0f766e'
  },
  {
    id: 'international_standard',
    name: 'International Standard',
    shortName: 'International Standard',
    badge: '⭐ Top 5 · Global',
    category: 'hybrid',
    hasPhoto: true,
    isRecommended: true,
    photoRule: 'optional',
    photoRuleLabel: 'Foto Opcional / Padrão Global',
    photoRuleDescription:
      'Estrutura padronizada internacionalmente com foco em idiomas, mobilidade geográfica e resultados claros.',
    tagline: 'Adaptado para candidaturas globais, empresas multinacionais e trabalho remoto internacional.',
    whenToUse:
      'Candidaturas fora do seu país de origem, equipas remotas multiculturais e empresas internacionais.',
    whereToUse: 'União Europeia, Reino Unido, América do Norte, Médio Oriente, Ásia e África.',
    regions: ['Global Remoto', 'Europa & UK', 'América do Norte', 'Médio Oriente & Ásia'],
    bestForIndustries: ['Multinacionais', 'Empresas Remotas', 'Comércio Exterior', 'TI Global', 'Consultoria'],
    atsScore: 97,
    atsRatingText: '97% ATS Score - Terminologia e layout reconhecidos globalmente',
    whyPhotoOrNot:
      'Inclui suporte natural a localização internacional e idiomas, permitindo esconder a foto em países anglo-saxónicos.',
    keyFeatures: [
      'Cabeçalho preparado para fuso horário, localização internacional e idiomas',
      'Secções em nomenclatura global limpa e direta',
      'Destaque para certificações e competências interculturais',
      'Suporte nativo para tradução instantânea em 6 idiomas'
    ],
    proTip: 'Ao candidatar-se para outro país, use a opção "Traduzir CV" e adapte o formato da moeda/métricas ao mercado local.',
    accentColor: '#0369a1'
  },

  // ============================================================================
  // MODELOS SOLICITADOS ESPECIALIZADOS & SETORIAIS (+ EUROPASS SEM SELO NO CABEÇALHO)
  // ============================================================================
  {
    id: 'european_europass',
    name: 'Europass Classic (2 Colunas)',
    shortName: 'Europass Classic',
    badge: '🇪🇺 Europass 1 · Clássico',
    category: 'with_photo',
    hasPhoto: true,
    photoRule: 'recommended',
    photoRuleLabel: 'Foto Recomendada na Europa',
    photoRuleDescription:
      'Formato europeu tradicional em duas colunas (títulos e datas à esquerda, conteúdo à direita e níveis CEFR) sem selo escrito "Europass" no cabeçalho.',
    tagline: 'O modelo europeu mais utilizado com coluna lateral de títulos/datas e níveis de idioma CEFR.',
    whenToUse:
      'Candidaturas na Europa Continental, programas Erasmus+, instituições europeias e empresas em Portugal, Espanha, Alemanha ou França.',
    whereToUse: 'União Europeia (Portugal, Espanha, França, Alemanha, Itália, Bélgica) e empresas europeias.',
    regions: ['União Europeia', 'Portugal & Espanha', 'Alemanha & França', 'Suíça & Itália'],
    bestForIndustries: ['Empresas Europeias', 'Saúde & Educação', 'Engenharia', 'Administração Pública', 'Turismo & Serviços'],
    atsScore: 92,
    atsRatingText: '92% ATS Score - Layout europeu clássico e organizado',
    whyPhotoOrNot:
      'Mantém a clareza visual do modelo europeu e níveis CEFR (A1–C2) sem o carimbo "Europass" no cabeçalho.',
    keyFeatures: [
      'Coluna esquerda dedicada para datas e títulos de secção em azul institucional',
      'Cabeçalho limpo com foto circular opcional sem rótulo "Europass"',
      'Etiquetas de proficiência linguística CEFR (A1 a C2)',
      'Compatível com exportação PDF e Word (.docx)'
    ],
    proTip: 'Use uma fotografia formal com fundo neutro. Se preferir um visual neutro para o Reino Unido, desative a foto.',
    accentColor: '#1d4ed8'
  },
  {
    id: 'europass_banner',
    name: 'Europass Banner (Tabela Idiomas)',
    shortName: 'Europass Banner',
    badge: '🇪🇺 Europass 2 · Banner',
    category: 'with_photo',
    hasPhoto: true,
    photoRule: 'recommended',
    photoRuleLabel: 'Foto Circular no Banner Superior',
    photoRuleDescription:
      'Faixa superior cinza suave com foto, contactos e resumo integrados, seguida de tabela completa de idiomas CEFR.',
    tagline: 'Cabeçalho cinza limpo com foto, bio no topo e matriz detalhada de idiomas (Compreensão, Oral e Escrita).',
    whenToUse:
      'Candidaturas europeias onde precisa de apresentar vários idiomas em tabela detalhada e leitura imediata.',
    whereToUse: 'União Europeia, Bélgica, Luxemburgo, Portugal, Espanha e instituições multinacionais.',
    regions: ['União Europeia', 'Bruxelas & Luxemburgo', 'Portugal & Espanha', 'Alemanha'],
    bestForIndustries: ['Administração Europeia', 'Tradução & Comunicação', 'Comércio & Logística', 'Engenharia', 'Educação'],
    atsScore: 94,
    atsRatingText: '94% ATS Score - Secções em coluna única com matriz CEFR',
    whyPhotoOrNot:
      'Combina apresentação visual europeia no topo com corpo em coluna única altamente legível.',
    keyFeatures: [
      'Faixa superior em cinza suave com foto circular, contactos e resumo integrados',
      'Secções em coluna única limpa para experiência e formação',
      'Tabela completa de idiomas CEFR (Compreensão, Expressão Oral e Escrita)',
      'Sem texto "Europass" no cabeçalho'
    ],
    proTip: 'Ideal quando fala 2 ou mais idiomas e quer mostrar os níveis CEFR em tabela estruturada.',
    accentColor: '#1e293b'
  },
  {
    id: 'europass_sidebar',
    name: 'Europass Sidebar (Coluna Cinza)',
    shortName: 'Europass Sidebar',
    badge: '🇪🇺 Europass 3 · Sidebar',
    category: 'with_photo',
    hasPhoto: true,
    photoRule: 'recommended',
    photoRuleLabel: 'Foto em Destaque na Coluna Lateral',
    photoRuleDescription:
      'Barra lateral cinza clara com foto e contactos à esquerda, e linha do tempo cronológica com pontos azuis à direita.',
    tagline: 'Design europeu elegante com barra lateral clara para contactos e linha do tempo cronológica à direita.',
    whenToUse:
      'Vagas corporativas modernas na Europa, agências, hotelaria, saúde, design e cargos técnicos.',
    whereToUse: 'Europa Ocidental, Portugal, França, Espanha, Itália e Alemanha.',
    regions: ['União Europeia', 'Portugal & França', 'Espanha & Itália', 'Suíça'],
    bestForIndustries: ['Serviços Corporativos', 'Design & Comunicação', 'Tecnologia', 'Turismo', 'Consultoria'],
    atsScore: 89,
    atsRatingText: '89% ATS Score - Leitura moderna em 2 colunas',
    whyPhotoOrNot:
      'A barra lateral cinza separa contactos e perfil pessoal para deixar a experiência respirar na coluna principal.',
    keyFeatures: [
      'Barra lateral cinza suave com foto circular centralizada e ícones de contacto',
      'Linha do tempo vertical azul para experiência e formação',
      'Blocos limpos para competências linguísticas CEFR',
      'Visual contemporâneo sem carimbo "Europass"'
    ],
    proTip: 'Excelente escolha se quer um currículo europeu mais moderno e visualmente equilibrado.',
    accentColor: '#2563eb'
  },
  {
    id: 'europass_framed',
    name: 'Europass Modern Frame (Moldura Azul)',
    shortName: 'Europass Frame',
    badge: '🇪🇺 Europass 4 · Moldura',
    category: 'with_photo',
    hasPhoto: true,
    photoRule: 'recommended',
    photoRuleLabel: 'Foto Circular com Cabeçalho Aberto',
    photoRuleDescription:
      'Página A4 com cantos em azul europeu, foto e contactos em 2 colunas no topo e idiomas lado a lado.',
    tagline: 'Estilo europeu com cantos em moldura azul, cargo em destaque e grelha de idiomas em duas colunas.',
    whenToUse:
      'Candidaturas na Europa, estágios, bolsas académicas e envio direto por e-mail a recrutadores.',
    whereToUse: 'União Europeia, Erasmus+, universidades europeias e empresas internacionais.',
    regions: ['União Europeia', 'Erasmus+ & Bolsas', 'Portugal & Espanha', 'Itália & Alemanha'],
    bestForIndustries: ['Educação & Bolsas', 'Comunicação & Média', 'Engenharia', 'Saúde', 'Empresas Europeias'],
    atsScore: 91,
    atsRatingText: '91% ATS Score - Estrutura limpa com destaque visual azul',
    whyPhotoOrNot:
      'Dá destaque imediato ao cargo pretendido ("Posição") e organiza os idiomas lado a lado para poupar espaço.',
    keyFeatures: [
      'Cantos discretos em moldura azul institucional europeia',
      'Secção dedicada ao cargo pretendido e perfil pessoal no topo',
      'Grelha de idiomas em 2 colunas para caber confortavelmente em 1–2 páginas',
      'Visual limpo sem a palavra "Europass" impressa'
    ],
    proTip: 'Ótimo para manter o currículo compacto quando tem várias experiências e idiomas.',
    accentColor: '#3b82f6'
  },
  {
    id: 'executive_resume',
    name: 'Executive Resume',
    shortName: 'Executive Resume',
    badge: '👔 Executivo',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'strictly_forbidden',
    photoRuleLabel: 'Sem Foto (Padrão Diretoria)',
    photoRuleDescription:
      'Tipografia de autoridade para cargos de direção, gerência sénior e liderança estratégica.',
    tagline: 'Ideal para cargos de gestão e liderança, com foco em orçamento, equipas e resultados de negócio.',
    whenToUse: 'Vagas de Diretor, Head, Gerente Sénior, VP e liderança de unidades de negócio.',
    whereToUse: 'Empresas de médio e grande porte, headhunters e recrutamento executivo.',
    regions: ['Global', 'Portugal & Brasil', 'EUA & Reino Unido', 'Europa'],
    bestForIndustries: ['Direção & Gestão', 'Operações', 'Comercial Sénior', 'Indústria', 'Serviços Corporativos'],
    atsScore: 97,
    atsRatingText: '97% ATS Score - Hierarquia executiva de alto impacto',
    whyPhotoOrNot:
      'Em cargos de liderança, o foco deve estar 100% no escopo da operação, equipas lideradas e retorno financeiro gerado.',
    keyFeatures: [
      'Resumo executivo focado em mandato, P&L e metas atingidas',
      'Tipografia clássica de alta credibilidade',
      'Destaque claro para liderança de equipas e projetos estratégicos',
      'Leitura direta para diretores de RH e headhunters'
    ],
    proTip: 'Comece o resumo indicando quantos anos de gestão possui, dimensão das equipas e impacto financeiro alcançado.',
    accentColor: '#1e293b'
  },
  {
    id: 'minimalist_professional',
    name: 'Minimalist Professional',
    shortName: 'Minimalist Pro',
    badge: '✨ Minimalista',
    category: 'hybrid',
    hasPhoto: true,
    photoRule: 'optional',
    photoRuleLabel: 'Foto Opcional Discreta',
    photoRuleDescription:
      'Design arejado, tipografia limpa e bastante espaço branco para facilitar a leitura sem poluição visual.',
    tagline: 'Simples, elegante e focado no conteúdo — leitura imediata sem elementos desnecessários.',
    whenToUse: 'Para quem quer um currículo discreto, moderno e elegante em qualquer setor profissional.',
    whereToUse: 'Europa, América Latina, startups, consultorias e empresas modernas.',
    regions: ['Europa', 'Brasil & Portugal', 'EUA & UK', 'Global'],
    bestForIndustries: ['Recursos Humanos', 'Consultoria', 'Arquitetura', 'Comunicação', 'Tecnologia'],
    atsScore: 94,
    atsRatingText: '94% ATS Score - Clareza visual máxima',
    whyPhotoOrNot:
      'Espaçamento limpo funciona com naturalidade tanto com foto discreta quanto totalmente sem imagem.',
    keyFeatures: [
      'Muito espaço em branco para evitar cansaço visual do recrutador',
      'Linhas subtis e tipografia contemporânea',
      'Fácil leitura em telemóvel e impressão A4',
      'Modo Com Foto ou Sem Foto em 1 clique'
    ],
    proTip: 'Mantenha frases curtas e diretas — num modelo minimalista, cada palavra ganha mais destaque.',
    accentColor: '#334155'
  },
  {
    id: 'skills_functional',
    name: 'Skills-Based (Functional)',
    shortName: 'Skills-Based (Functional)',
    badge: '🎯 Por Competências',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'optional',
    photoRuleLabel: 'Sem Foto / Foco em Habilidades',
    photoRuleDescription:
      'Coloca as Competências e Habilidades Chave antes da Experiência Profissional para valorizar o que sabe fazer.',
    tagline: 'Destaca competências em vez da experiência cronológica — ideal para valorizar habilidades práticas.',
    whenToUse:
      'Mudança de área, intervalos na carreira, profissionais polivalentes ou funções muito baseadas em competências técnicas.',
    whereToUse: 'Global — útil quando o histórico de cargos não conta toda a sua capacidade atual.',
    regions: ['Global', 'Europa', 'Brasil & Portugal', 'EUA & UK'],
    bestForIndustries: ['Tecnologia', 'Atendimento & Operações', 'Freelancers', 'Transição de Carreira', 'Educação'],
    atsScore: 92,
    atsRatingText: '92% ATS Score - Prioriza competências no topo do documento',
    whyPhotoOrNot:
      'Organiza automaticamente o CV colocando a secção de Competências imediatamente após o resumo profissional.',
    keyFeatures: [
      'Secção de Competências & Habilidades promovida para o topo do currículo',
      'Agrupamento claro de capacidades técnicas e comportamentais',
      'Experiência profissional apresentada de forma objetiva logo abaixo',
      'Reduz o peso de lacunas no histórico ou trocas de setor'
    ],
    proTip: 'Descreva provas práticas em cada competência (ex: ferramenta usada e resultado entregue).',
    accentColor: '#059669'
  },
  {
    id: 'tech_professional',
    name: 'Tech Professional',
    shortName: 'Tech Professional',
    badge: '💻 TI & Software',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'strictly_forbidden',
    photoRuleLabel: 'Sem Foto / Stack & GitHub',
    photoRuleDescription:
      'Otimizado para recrutadores técnicos, com grelha de tecnologias em 2 colunas e formato Cargo @ Empresa.',
    tagline: 'Para TI, software, dados e engenharia — foco em stack técnica, arquitetura e entregas.',
    whenToUse: 'Desenvolvedores, Tech Leads, DevOps, QA, Cloud, Cibersegurança e Engenheiros de Software.',
    whereToUse: 'Empresas de tecnologia, startups, consultorias de TI e vagas remotas internacionais.',
    regions: ['Global Remoto', 'EUA & Europa', 'Portugal & Brasil', 'Hubs Tech'],
    bestForIndustries: ['Desenvolvimento Web/Mobile', 'Cloud & DevOps', 'Cibersegurança', 'Infraestrutura TI', 'SaaS'],
    atsScore: 97,
    atsRatingText: '97% ATS Score - Alta indexação de linguagens e frameworks',
    whyPhotoOrNot:
      'Em tecnologia, links de GitHub, portfólio e domínio técnico têm prioridade absoluta sobre fotografia.',
    keyFeatures: [
      'Grelha de competências técnicas organizada por linguagens, cloud e ferramentas',
      'Cabeçalho preparado para links de GitHub, LinkedIn e Portfólio',
      'Destaque limpo de Cargo @ Empresa e períodos',
      'Leitura perfeita em plataformas como Greenhouse, Lever e Ashby'
    ],
    proTip: 'Inclua métricas técnicas sempre que possível (latência, utilizadores ativos, uptime, redução de custos cloud).',
    accentColor: '#0284c7'
  },
  {
    id: 'data_science_ai',
    name: 'Data Science & AI',
    shortName: 'Data Science & AI',
    badge: '🤖 Dados & IA',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'strictly_forbidden',
    photoRuleLabel: 'Sem Foto / Projetos & Modelos',
    photoRuleDescription:
      'Estrutura analítica com foco em modelos preditivos, pipelines de dados, Python/SQL e impacto de negócio.',
    tagline: 'Focado em projetos, analytics e IA — ideal para Cientistas de Dados, ML Engineers e BI.',
    whenToUse: 'Vagas de Data Science, Machine Learning, Engenharia de Dados, Business Intelligence e IA.',
    whereToUse: 'Bancos, fintechs, big techs, consultorias de analytics e equipas remotas.',
    regions: ['Global Tech', 'EUA & Reino Unido', 'União Europeia', 'Brasil & Portugal'],
    bestForIndustries: ['Inteligência Artificial', 'Ciência de Dados', 'Analytics & BI', 'Engenharia de Dados', 'Fintech'],
    atsScore: 96,
    atsRatingText: '96% ATS Score - Estruturado para termos de Dados, ML e Estatística',
    whyPhotoOrNot:
      'Destaca stack analítica (Python, SQL, Spark, PyTorch, Power BI) e métricas reais de precisão ou receita gerada.',
    keyFeatures: [
      'Grelha de ferramentas analíticas, frameworks de ML e plataformas de dados',
      'Ênfase em projetos aplicados e resultados quantificáveis',
      'Tipografia técnica limpa com leitura ATS impecável',
      'Espaço para certificações, Kaggle, GitHub ou publicações'
    ],
    proTip: 'Mostre o impacto de negócio dos seus modelos (ex: "Modelo de churn reduziu cancelamentos em 14%").',
    accentColor: '#0f766e'
  },
  {
    id: 'project_based',
    name: 'Project-Based',
    shortName: 'Project-Based',
    badge: '📋 Por Projetos',
    category: 'hybrid',
    hasPhoto: true,
    photoRule: 'optional',
    photoRuleLabel: 'Foto Opcional / Entregas',
    photoRuleDescription:
      'Evidencia projetos entregues, financiadores/clientes, prazos e resultados alcançados em cada iniciativa.',
    tagline: 'Organizado por projetos e resultados — ideal para gestores de projeto, PMO e consultores.',
    whenToUse: 'Gestores de Projetos, Scrum Masters, Engenheiros de Obra, PMO e profissionais que trabalham por entregas.',
    whereToUse: 'Consultorias, construção, TI, agências e programas internacionais.',
    regions: ['Global', 'Europa', 'África Lusófona', 'América Latina'],
    bestForIndustries: ['PMO & Gestão de Projetos', 'Engenharia & Obras', 'Implementação ERP', 'TI Ágil', 'Consultoria'],
    atsScore: 94,
    atsRatingText: '94% ATS Score - Clareza de escopo, prazo e entregas',
    whyPhotoOrNot:
      'Realça automaticamente o campo de projeto/cliente/financiador de cada experiência para evidenciar portfólio de entregas.',
    keyFeatures: [
      'Destaque visível para nome do projeto, cliente ou entidade parceira',
      'Foco em orçamento, prazo, metodologia e entregas concluídas',
      'Compatível com certificações PMP, PRINCE2 e Scrum',
      'Foto opcional com 1 clique'
    ],
    proTip: 'Indique o orçamento ou dimensão de cada projeto e se foi entregue dentro do prazo e orçamento previstos.',
    accentColor: '#2563eb'
  },
  {
    id: 'consulting_style',
    name: 'Consulting Style',
    shortName: 'Consulting Style',
    badge: '📊 Consultoria',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'strictly_forbidden',
    photoRuleLabel: 'Sem Foto (Padrão Consultoria)',
    photoRuleDescription:
      'Layout estruturado e direto usado pelas principais consultorias estratégicas e de gestão.',
    tagline: 'Estrutura orientada para impacto e métricas — clara, objetiva e altamente analítica.',
    whenToUse: 'Consultoria estratégica, gestão de negócios, transformação digital e estratégia corporativa.',
    whereToUse: 'Big 4 (Deloitte, PwC, EY, KPMG), MBB (McKinsey, BCG, Bain) e boutiques de consultoria.',
    regions: ['Global', 'Europa & UK', 'EUA', 'Brasil & Portugal'],
    bestForIndustries: ['Consultoria Estratégica', 'Big 4 & Auditoria', 'Strategy & Ops', 'Transformação Digital', 'Corporate'],
    atsScore: 98,
    atsRatingText: '98% ATS Score - Formato analítico clássico de consultoria',
    whyPhotoOrNot:
      'Consultorias avaliam capacidade de estruturação lógica, impacto mensurável e clareza de comunicação.',
    keyFeatures: [
      'Formato compacto e elegante com foco total em métricas de impacto',
      'Estrutura inspirada no método Problema → Ação → Resultado quantificado',
      'Hierarquia nítida entre formação académica, projetos e competências',
      'Leitura perfeita em triagens de consultorias internacionais'
    ],
    proTip: 'Comece todos os pontos de experiência com verbos de ação fortes e termine com percentagens ou valores concretos.',
    accentColor: '#1e3a8a'
  },
  {
    id: 'product_manager',
    name: 'Product Manager',
    shortName: 'Product Manager',
    badge: '🚀 Produto',
    category: 'hybrid',
    hasPhoto: true,
    photoRule: 'optional',
    photoRuleLabel: 'Foto Opcional / SaaS & Tech',
    photoRuleDescription:
      'Layout moderno orientado a roadmap, métricas de produto (ARR, retenção, NPS) e colaboração multidisciplinar.',
    tagline: 'Evidencia liderança de produto e resultados — ideal para PMs, POs e Product Leads.',
    whenToUse: 'Product Manager, Product Owner, Group PM, Head of Product e Product Operations.',
    whereToUse: 'Empresas de software, fintechs, e-commerce, apps mobile e scale-ups globais.',
    regions: ['Global Tech', 'Europa', 'Brasil & LATAM', 'EUA & Canadá'],
    bestForIndustries: ['Product Management', 'SaaS & Marketplaces', 'Fintech & Apps', 'E-commerce', 'Growth'],
    atsScore: 95,
    atsRatingText: '95% ATS Score - Otimizado para métricas de produto',
    whyPhotoOrNot:
      'Funciona com foto em processos europeus/LATAM e sem foto em Big Techs norte-americanas.',
    keyFeatures: [
      'Bloco de resumo estratégico em destaque no topo',
      'Competências organizadas em grelha (Discovery, Analytics, Roadmap, Growth)',
      'Clareza visual para métricas de ativação, retenção e receita',
      'Fácil alternância entre modo com ou sem fotografia'
    ],
    proTip: 'Mostre claramente o "porquê" e o impacto de cada funcionalidade lançada (ex: "+18% conversão no checkout").',
    accentColor: '#2563eb'
  },
  {
    id: 'business_analyst',
    name: 'Business Analyst',
    shortName: 'Business Analyst',
    badge: '📈 Análise de Negócios',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'optional',
    photoRuleLabel: 'Sem Foto / Foco Analítico',
    photoRuleDescription:
      'Equilibra levantamento de requisitos, melhoria de processos e análise de indicadores de negócio.',
    tagline: 'Destaque para análise e resolução de problemas entre equipas de negócio e tecnologia.',
    whenToUse: 'Business Analyst, Analista de Processos, Analista Funcional, ERP Analyst e Operações.',
    whereToUse: 'Banca, seguradoras, consultorias, varejo, telecomunicações e empresas de tecnologia.',
    regions: ['Global', 'Portugal & Brasil', 'Europa', 'EUA & UK'],
    bestForIndustries: ['Análise de Negócios', 'Sistemas & ERP', 'Banca & Seguros', 'Processos & Qualidade', 'BI'],
    atsScore: 96,
    atsRatingText: '96% ATS Score - Excelente cobertura de requisitos e KPIs',
    whyPhotoOrNot:
      'Foca na ponte entre estratégia de negócio, dados (SQL, Excel, BI) e execução técnica sem distrações.',
    keyFeatures: [
      'Secção clara de competências analíticas, ferramentas e metodologias',
      'Formato limpo para detalhar melhorias de eficiência e redução de custos',
      'Compatível com sistemas ATS corporativos',
      'Legibilidade superior tanto no telemóvel como em PDF impresso'
    ],
    proTip: 'Destaque horas poupadas, erros reduzidos ou melhorias percentuais de SLA geradas pelas suas análises.',
    accentColor: '#0369a1'
  },
  {
    id: 'finance_banking',
    name: 'Finance & Banking',
    shortName: 'Finance & Banking',
    badge: '🏦 Finanças & Banca',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'strictly_forbidden',
    photoRuleLabel: 'Sem Foto (Padrão Financeiro)',
    photoRuleDescription:
      'Visual sóbrio institucional com dupla linha clássica para transmitir rigor, confiança e precisão.',
    tagline: 'Adequado para finanças e auditoria, banca comercial, contabilidade, controlo de gestão e FP&A.',
    whenToUse: 'Contabilistas, Auditores, Analistas Financeiros, Controllers, Tesouraria e Banca.',
    whereToUse: 'Bancos, sociedades auditoras, departamentos financeiros e fundos de investimento.',
    regions: ['Global', 'Europa & UK', 'Angola & Lusofonia', 'América Latina & EUA'],
    bestForIndustries: ['Banca & Crédito', 'Contabilidade & Fiscalidade', 'Auditoria & Risco', 'Controlo de Gestão', 'FP&A'],
    atsScore: 99,
    atsRatingText: '99% ATS Score - Padrão tradicional de alta credibilidade',
    whyPhotoOrNot:
      'O setor financeiro e de auditoria prefere documentos sóbrios, sem fotos e ricos em rigor numérico e certificações.',
    keyFeatures: [
      'Tipografia serifada clássica com filete duplo institucional',
      'Espaço claro para certificações (CFA, ACCA, TOC/OCC, CRC, CPA)',
      'Estrutura linear compatível com portais bancários',
      'Alta legibilidade de períodos e responsabilidades financeiras'
    ],
    proTip: 'Inclua o volume financeiro gerido, orçamentos auditados e sistemas dominados (SAP, Primavera, IFRS).',
    accentColor: '#0f172a'
  },
  {
    id: 'academic_cv',
    name: 'Academic CV',
    shortName: 'Academic CV',
    badge: '🎓 Académico',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'strictly_forbidden',
    photoRuleLabel: 'Sem Foto (Padrão Universitário)',
    photoRuleDescription:
      'Dá prioridade à formação académica, cátedras, docência, orientações e mérito científico.',
    tagline: 'Para universidades e investigação — ideal para docentes, pós-graduados e concursos académicos.',
    whenToUse: 'Concursos para professores, candidaturas a mestrados, doutoramentos, pós-doc e comités académicos.',
    whereToUse: 'Universidades, politécnicos, faculdades e instituições de ensino em todo o mundo.',
    regions: ['Global Académico', 'Europa (CiênciaVitae)', 'Brasil', 'EUA & UK'],
    bestForIndustries: ['Ensino Superior', 'Docência & Tutoria', 'Bolsas de Estudo', 'Gestão Académica', 'I&D'],
    atsScore: 92,
    atsRatingText: '92% ATS Score - Hierarquia académica tradicional',
    whyPhotoOrNot:
      'Prioriza automaticamente a Formação Académica junto ao topo e utiliza terminologia própria do meio universitário.',
    keyFeatures: [
      'Formação Académica posicionada com destaque logo após o resumo',
      'Numeração romana formal nos títulos das secções',
      'Secção dedicada a certificações, publicações e eventos científicos',
      'Espaço tabular limpo para referências académicas'
    ],
    proTip: 'Mencione títulos de teses, nomes de orientadores, bolsas conquistadas e unidades curriculares lecionadas.',
    accentColor: '#334155'
  },
  {
    id: 'research_cv',
    name: 'Research CV',
    shortName: 'Research CV',
    badge: '🔬 Investigação',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'strictly_forbidden',
    photoRuleLabel: 'Sem Foto (Foco em Publicações)',
    photoRuleDescription:
      'Focado em projetos de investigação, publicações científicas, laboratórios, patentes e bolsas.',
    tagline: 'Orientado para publicações e estudos científicos em centros de pesquisa e laboratórios.',
    whenToUse: 'Investigadores, bolseiros de pesquisa, candidatos a PhD e projetos Horizon Europe / FCT / CNPq.',
    whereToUse: 'Centros de investigação, laboratórios farmacêuticos, institutos científicos e universidades.',
    regions: ['União Europeia', 'Brasil', 'EUA & Reino Unido', 'Centros Globais I&D'],
    bestForIndustries: ['Investigação Científica', 'Biotecnologia & Lab', 'Ciências Sociais', 'Engenharia I&D', 'Saúde Pública'],
    atsScore: 91,
    atsRatingText: '91% ATS Score - Estruturado para comités de investigação',
    whyPhotoOrNot:
      'Avaliadores científicos analisam produção indexada (DOI, Scopus), metodologias laboratoriais e financiamento obtido.',
    keyFeatures: [
      'Destaque inicial para áreas de investigação e qualificações académicas',
      'Espaço para artigos publicados, conferências e revisões por pares',
      'Campo de financiador/bolsa visível nas experiências de pesquisa',
      'Estrutura sóbria e formal sem distrações visuais'
    ],
    proTip: 'Adicione links DOI, índice-h se aplicável e cite os programas que financiaram as suas pesquisas.',
    accentColor: '#1e293b'
  },
  {
    id: 'graduate_resume',
    name: 'Graduate Resume',
    shortName: 'Graduate Resume',
    badge: '🎓 Recém-Formado',
    category: 'hybrid',
    hasPhoto: true,
    photoRule: 'optional',
    photoRuleLabel: 'Foto Opcional / Primeiro Emprego',
    photoRuleDescription:
      'Coloca a Formação Académica e Competências logo no início para compensar experiência curta.',
    tagline: 'Para recém-formados e programas de trainees — valoriza diploma, estágios e projetos académicos.',
    whenToUse: 'Primeiro emprego qualificado, programas Trainee, estágios profissionais e início de carreira.',
    whereToUse: 'Empresas de recrutamento jovem, multinacionais (programas Graduate) e startups.',
    regions: ['Portugal & Brasil', 'Europa', 'Angola & PALOP', 'Global'],
    bestForIndustries: ['Programas Trainee', 'Estágios Profissionais', 'Consultoria Júnior', 'TI Júnior', 'Engenharia'],
    atsScore: 95,
    atsRatingText: '95% ATS Score - Valoriza diploma, notas e estágios',
    whyPhotoOrNot:
      'Move a secção de Formação Académica para antes da Experiência Profissional para destacar logo o seu curso.',
    keyFeatures: [
      'Formação Académica posicionada logo abaixo do resumo de objetivos',
      'Destaque para média final, honras académicas e trabalho de fim de curso',
      'Valorização de estágios, voluntariado e projetos universitários',
      'Layout moderno e acolhedor, com ou sem foto'
    ],
    proTip: 'Inclua projetos académicos relevantes, associações de estudantes e ferramentas aprendidas durante a licenciatura/mestrado.',
    accentColor: '#2563eb'
  },
  {
    id: 'student_cv',
    name: 'Student CV',
    shortName: 'Student CV',
    badge: '📚 Estudante',
    category: 'hybrid',
    hasPhoto: true,
    photoRule: 'optional',
    photoRuleLabel: 'Foto Opcional / Estágios',
    photoRuleDescription:
      'Dá prioridade máxima à educação atual, habilidades e idiomas para quem ainda está a estudar.',
    tagline: 'Para estudantes sem muita experiência — ideal para estágios curriculares, part-time e bolsas.',
    whenToUse: 'Candidaturas a estágios de verão, emprego part-time, intercâmbios (Erasmus) e bolsas.',
    whereToUse: 'Universidades, programas de estágio, comércio, serviços e empresas tecnológicas.',
    regions: ['Portugal & Brasil', 'União Europeia', 'Angola & Moçambique', 'Global'],
    bestForIndustries: ['Estágios', 'Part-Time & Atendimento', 'Iniciação Científica', 'Bolsas & Intercâmbio', 'Júnior'],
    atsScore: 94,
    atsRatingText: '94% ATS Score - Estruturado para início de percurso',
    whyPhotoOrNot:
      'Coloca Educação e Competências antes de Experiência para que o currículo fique completo mesmo com poucos empregos.',
    keyFeatures: [
      'Educação atual e previsão de conclusão em primeiro plano',
      'Realce para idiomas, cursos extracurriculares e competências digitais',
      'Aceita projetos escolares, monitoria ou voluntariado como experiência',
      'Visual leve e confiante para o primeiro currículo'
    ],
    proTip: 'Mesmo sem emprego formal, liste trabalhos de grupo importantes, voluntariado, cursos online ou atividades desportivas de liderança.',
    accentColor: '#0284c7'
  },
  {
    id: 'career_change_cv',
    name: 'Career Change CV',
    shortName: 'Career Change CV',
    badge: '🔄 Transição',
    category: 'hybrid',
    hasPhoto: true,
    photoRule: 'optional',
    photoRuleLabel: 'Foto Opcional / Competências Transferíveis',
    photoRuleDescription:
      'Destaca o resumo de transição, formações recentes e competências transferíveis antes dos cargos antigos.',
    tagline: 'Para transição de carreira — foca no novo objetivo e liga a experiência anterior à nova área.',
    whenToUse: 'Mudança de setor ou profissão (ex: migrar para TI, gestão, vendas ou áreas digitais).',
    whereToUse: 'Empresas abertas a novos perfis, bootcamps, startups e processos por competências.',
    regions: ['Global', 'Portugal & Brasil', 'Europa', 'Trabalho Remoto'],
    bestForIndustries: ['Transição para Tech', 'Gestão & Operações', 'Educação para Corporativo', 'Marketing', 'Vendas'],
    atsScore: 93,
    atsRatingText: '93% ATS Score - Realça habilidades transferíveis e nova formação',
    whyPhotoOrNot:
      'Promove Competências Chave e Certificações antes do histórico anterior para que o recrutador veja o perfil futuro primeiro.',
    keyFeatures: [
      'Resumo desenhado para explicar claramente a motivação e valor da mudança',
      'Competências transferíveis em destaque no topo do documento',
      'Certificações e cursos da nova área bem visíveis',
      'Histórico anterior reformulado com resultados úteis para o novo cargo'
    ],
    proTip: 'No resumo inicial, deixe claro qual é o seu cargo-alvo atual e 2 competências do passado que trazem vantagem na nova área.',
    accentColor: '#7c3aed'
  },
  {
    id: 'government_public',
    name: 'Government/Public Sector',
    shortName: 'Public Sector',
    badge: '🏛️ Setor Público',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'optional',
    photoRuleLabel: 'Sem Foto / Formal Institucional',
    photoRuleDescription:
      'Estrutura formal, clara e detalhada alinhada com concursos públicos, ministérios e entidades estatais.',
    tagline: 'Adaptado ao setor público, concursos, administração estatal, autarquias e institutos públicos.',
    whenToUse: 'Concursos públicos, administrações municipais, ministérios, agências reguladoras e fundações.',
    whereToUse: 'Administração pública nacional, regional ou municipal.',
    regions: ['Portugal', 'Brasil', 'Angola & PALOP', 'União Europeia'],
    bestForIndustries: ['Administração Pública', 'Autarquias', 'Ministérios & Agências', 'Empresas Públicas', 'Regulação'],
    atsScore: 95,
    atsRatingText: '95% ATS Score - Formato institucional claro e auditável',
    whyPhotoOrNot:
      'Concursos públicos e processos estatais valorizam imparcialidade, clareza documental e datas exatas de serviço.',
    keyFeatures: [
      'Formatação formal com ênfase em enquadramento legal, cargos e prazos exatos',
      'Secção dedicada a formação certificada e habilitações literárias',
      'Clareza tabular para referências institucionais',
      'Total legibilidade para avaliação documental por júris'
    ],
    proTip: 'Indique datas exatas (mês/ano) de início e fim e mencione formações oficiais ou certificações exigidas no edital.',
    accentColor: '#1e3a8a'
  },
  {
    id: 'ngo_humanitarian',
    name: 'NGO/Humanitarian CV',
    shortName: 'NGO / Humanitarian',
    badge: '🌍 ONGs & Social',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'optional',
    photoRuleLabel: 'Foto Opcional / Projetos & Idiomas',
    photoRuleDescription:
      'Destaca projetos no terreno, entidades financiadoras, línguas faladas e impacto comunitário.',
    tagline: 'Para ONGs e organismos internacionais — focado em missões de terreno, projetos e impacto social.',
    whenToUse: 'Candidaturas a ONGs nacionais e internacionais, fundações, projetos sociais e cooperação.',
    whereToUse: 'Médicos Sem Fronteiras, Cruz Vermelha, Oxfam, Save the Children, fundações e associações.',
    regions: ['África & PALOP', 'América Latina', 'Europa', 'Missões Internacionais'],
    bestForIndustries: ['ONGs Internacionais', 'Cooperação & Desenvolvimento', 'Ação Humanitária', 'Sustentabilidade & ESG', 'Impacto Social'],
    atsScore: 94,
    atsRatingText: '94% ATS Score - Estruturado para projetos, financiadores e idiomas',
    whyPhotoOrNot:
      'Em cooperação e ação humanitária, idiomas locais/internacionais e experiência com financiadores (UE, USAID, etc.) são decisivos.',
    keyFeatures: [
      'Destaque claro do financiador/programa em cada experiência de terreno',
      'Ênfase para línguas e disponibilidade de mobilidade geográfica',
      'Estrutura limpa orientada a beneficiários alcançados e metas de projeto',
      'Espaço para referências institucionais verificáveis'
    ],
    proTip: 'Mencione sempre os financiadores dos projetos (ex: UE, Banco Mundial, USAID) e o número de beneficiários impactados.',
    accentColor: '#0f766e'
  },
  {
    id: 'un_agency_cv',
    name: 'UN Agency CV',
    shortName: 'UN Agency CV',
    badge: '🇺🇳 ONU & Agências',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'strictly_forbidden',
    photoRuleLabel: 'Sem Foto (Padrão ONU / Inspira)',
    photoRuleDescription:
      'Inspirado na estrutura de candidaturas da ONU (P11/Inspira): idiomas, missões, programas e referências.',
    tagline: 'Estrutura adequada para ONU e agências parceiras (UNICEF, PNUD, OMS, ACNUR, FAO, Banco Mundial).',
    whenToUse: 'Vagas P2–P5, consultorias ONU, UNV, agências das Nações Unidas e bancos multilaterais.',
    whereToUse: 'Sistema Inspira da ONU, PNUD, UNICEF, OMS, FAO, Banco Mundial, BAD e agências parceiras.',
    regions: ['Sedes ONU (NY, Genebra, Viena)', 'Escritórios Regionais', 'África & Américas', 'Global'],
    bestForIndustries: ['Nações Unidas & Agências', 'Bancos Multilaterais', 'Políticas Públicas', 'Saúde Global', 'Monitoria & Avaliação (M&E)'],
    atsScore: 96,
    atsRatingText: '96% ATS Score - Alinhado com critérios de competências da ONU',
    whyPhotoOrNot:
      'As diretrizes de recrutamento das Nações Unidas rejeitam fotografias pessoais para garantir diversidade e seleção neutra.',
    keyFeatures: [
      'Cabeçalho centrado formal de governança e programas internacionais',
      'Destaque explícito para programas, doadores e resultados mensuráveis',
      'Bloco claro de proficiência em idiomas oficiais da ONU',
      'Tabela estruturada de 3 referências profissionais com contacto direto'
    ],
    proTip: 'Alinhe o seu texto com os valores fundamentais da ONU (Integridade, Profissionalismo, Respeito pela Diversidade) e liste línguas oficiais com nível real.',
    accentColor: '#0369a1'
  },
  {
    id: 'healthcare_professional',
    name: 'Healthcare Professional',
    shortName: 'Healthcare Pro',
    badge: '🩺 Saúde & Clínica',
    category: 'hybrid',
    hasPhoto: true,
    photoRule: 'optional',
    photoRuleLabel: 'Foto Opcional / Cédula & Clínica',
    photoRuleDescription:
      'Organizado para médicos, enfermeiros, farmacêuticos e especialistas clínicos destacarem licenças e hospitais.',
    tagline: 'Para saúde e áreas clínicas — clareza em especialidades, registos profissionais e prática clínica.',
    whenToUse: 'Médicos, Enfermeiros, Farmacêuticos, Fisioterapeutas, Psicólogos, Dentistas e Gestão Hospitalar.',
    whereToUse: 'Hospitais públicos e privados, clínicas, farmacêuticas e sistemas nacionais de saúde.',
    regions: ['Europa & Portugal', 'Brasil & LATAM', 'Angola & Moçambique', 'Reino Unido & Global'],
    bestForIndustries: ['Medicina & Especialidades', 'Enfermagem', 'Farmácia & Análises', 'Saúde Mental', 'Gestão Hospitalar'],
    atsScore: 95,
    atsRatingText: '95% ATS Score - Clareza de registos clínicos e certificações',
    whyPhotoOrNot:
      'Facilita a leitura imediata de especialidade, número de ordem/cédula profissional e experiência hospitalar ou clínica.',
    keyFeatures: [
      'Destaque para habilitações clínicas, internatos e certificações (BLS/ACLS)',
      'Secção limpa de competências clínicas e equipamentos médicos',
      'Experiência detalhada por unidade hospitalar/clínica e volume de atendimento',
      'Opção flexível para usar ou ocultar foto conforme o país'
    ],
    proTip: 'Coloque o seu número de inscrição na Ordem/Conselho Profissional e especialidade logo no título ou resumo inicial.',
    accentColor: '#0f766e'
  },
  {
    id: 'engineering_resume',
    name: 'Engineering Resume',
    shortName: 'Engineering Resume',
    badge: '⚙️ Engenharia',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'optional',
    photoRuleLabel: 'Sem Foto / Obras & Sistemas',
    photoRuleDescription:
      'Estrutura técnica precisa para Engenharia Civil, Mecânica, Eletrotécnica, Química e Industrial.',
    tagline: 'Para engenheiros e áreas técnicas — realce de normas ISO, software CAD/BIM, obras e produção.',
    whenToUse: 'Engenharia Civil, Mecânica, Elétrica, Industrial, Energia, Petróleo & Gás e Manutenção.',
    whereToUse: 'Construtoras, indústrias, petrolíferas, energia renovável e empresas de projetos.',
    regions: ['Global', 'Europa', 'Angola & Moçambique', 'Brasil & América Latina'],
    bestForIndustries: ['Engenharia Civil & Obras', 'Energia, Petróleo & Gás', 'Indústria & Manufatura', 'Eletrotécnica & Automação', 'HSE / Segurança'],
    atsScore: 96,
    atsRatingText: '96% ATS Score - Excelente indexação técnica e normativa',
    whyPhotoOrNot:
      'Recrutadores de engenharia procuram certificações técnicas, domínio de software (AutoCAD, Revit, SAP) e normas cumpridas.',
    keyFeatures: [
      'Grelha de competências técnicas (Software CAD/BIM, Normas ISO/HSE, Gestão de Obra)',
      'Estrutura clara por projetos industriais ou obras lideradas',
      'Destaque para redução de falhas, segurança no trabalho e eficiência produtiva',
      'Leitura limpa em PDF e Word'
    ],
    proTip: 'Mencione normas técnicas e segurança (ex: ISO 9001, ISO 45001, NR) e o porte técnico das obras ou linhas industriais.',
    accentColor: '#0369a1'
  },
  {
    id: 'sales_professional',
    name: 'Sales Professional',
    shortName: 'Sales Professional',
    badge: '💼 Vendas & Metas',
    category: 'hybrid',
    hasPhoto: true,
    photoRule: 'optional',
    photoRuleLabel: 'Foto Opcional / Quotas & Receita',
    photoRuleDescription:
      'Projetado para evidenciar atingimento de metas, expansão de carteira e receita gerada logo acima da dobra.',
    tagline: 'Focado em metas, vendas e resultados — ideal para Executivos de Contas, SDRs e Diretores Comerciais.',
    whenToUse: 'Vendas B2B/B2C, Key Account Manager, Business Development, Real Estate e Gestão Comercial.',
    whereToUse: 'Empresas SaaS, retalho, banca, farmacêutica, imobiliário e distribuidoras.',
    regions: ['Global', 'Portugal & Brasil', 'Europa', 'Angola & América Latina'],
    bestForIndustries: ['Vendas B2B & Enterprise', 'Key Account Management', 'Imobiliário & Seguros', 'SaaS Sales', 'Retalho & Distribuição'],
    atsScore: 94,
    atsRatingText: '94% ATS Score - Orientado a KPIs comerciais e CRM',
    whyPhotoOrNot:
      'Em funções comerciais orientadas ao cliente na Europa e LATAM uma foto confiante ajuda; nos EUA desative em 1 clique.',
    keyFeatures: [
      'Resumo de alto impacto focado em volume de vendas e superação de quotas',
      'Destaque natural para ferramentas de CRM (Salesforce, HubSpot, Pipedrive)',
      'Estrutura perfeita para listar % de atingimento de metas anuais',
      'Aparência dinâmica e persuasiva sem perder aprovação ATS'
    ],
    proTip: 'Vendas falam por números: escreva sempre percentagens de meta batida (ex: "128% da quota anual por 3 anos seguidos").',
    accentColor: '#b91c1c'
  },
  {
    id: 'marketing_professional',
    name: 'Marketing Professional',
    shortName: 'Marketing Pro',
    badge: '📣 Marketing & Digital',
    category: 'with_photo',
    hasPhoto: true,
    photoRule: 'optional',
    photoRuleLabel: 'Com Foto / Marca & ROI',
    photoRuleDescription:
      'Estética moderna com cabeçalho de destaque para profissionais de Marketing Digital, Social Media e Branding.',
    tagline: 'Adequado para marketing digital e comunicação — combina imagem profissional com ROI de campanhas.',
    whenToUse: 'Marketing Digital, Tráfego Pago, SEO, Social Media, Branding, Relações Públicas e Conteúdo.',
    whereToUse: 'Agências digitais, marcas de consumo, e-commerce, startups e equipas de comunicação.',
    regions: ['Portugal & Brasil', 'Europa', 'Global Remoto', 'América Latina'],
    bestForIndustries: ['Marketing Digital & Performance', 'Social Media & Conteúdo', 'Branding & PR', 'E-commerce', 'Eventos'],
    atsScore: 91,
    atsRatingText: '91% ATS Score - Equilíbrio entre visual moderno e leitura limpa',
    whyPhotoOrNot:
      'Combina cabeçalho editorial de destaque com corpo em coluna única para passar em sistemas ATS enquanto mostra bom gosto visual.',
    keyFeatures: [
      'Cabeçalho editorial colorido personalizável com a sua cor preferida',
      'Espaço claro para links de portfólio, campanhas e métricas de ROAS/CAC',
      'Corpo linear legível em qualquer ecrã ou sistema de triagem',
      'Foto integrada opcional no cabeçalho'
    ],
    proTip: 'Inclua resultados de campanhas: crescimento de leads, ROAS, redução de CAC ou alcance orgânico conquistado.',
    accentColor: '#7c3aed'
  },
  {
    id: 'creative_resume',
    name: 'Creative Resume',
    shortName: 'Creative Resume',
    badge: '🎨 Criativo',
    category: 'with_photo',
    hasPhoto: true,
    photoRule: 'recommended',
    photoRuleLabel: 'Com Foto & Barra Lateral',
    photoRuleDescription:
      'Layout em duas colunas com barra lateral colorida para destacar portfólio, foto e ferramentas criativas.',
    tagline: 'Design diferenciado para áreas criativas como Design Gráfico, UI/UX, Arquitetura e Audiovisual.',
    whenToUse: 'Designers, Arquitetos, Editores de Vídeo, Fotógrafos, Diretores de Arte e Criadores Digitais.',
    whereToUse: 'Estúdios criativos, agências, produtoras, startups e envio direto para líderes de equipa.',
    regions: ['Global Criativo', 'Europa', 'Brasil & Portugal', 'EUA (Agências)'],
    bestForIndustries: ['Design Gráfico & UI/UX', 'Arquitetura & Moda', 'Audiovisual & Cinema', 'Publicidade', 'Artes & Cultura'],
    atsScore: 84,
    atsRatingText: '84% ATS Score - Desenhado para impressionar revisão humana e portfólio',
    whyPhotoOrNot:
      'Em carreiras visuais, o próprio currículo serve como demonstração imediata do seu cuidado estético e identidade.',
    keyFeatures: [
      'Coluna lateral contrastante com foto, contactos e competências visuais',
      'Coluna principal limpa com linha do tempo profissional',
      'Destaque imediato para link do portfólio (Behance, Dribbble, website)',
      'Personalizável com paleta de cores executiva'
    ],
    proTip: 'Inclua o link do seu portfólio online no cabeçalho e mantenha o texto curto e visualmente equilibrado.',
    accentColor: '#7c3aed'
  },
  {
    id: 'freelancer_consultant',
    name: 'Freelancer/Consultant CV',
    shortName: 'Freelancer / Consultant',
    badge: '🚀 Freelancer & Consultor',
    category: 'hybrid',
    hasPhoto: true,
    photoRule: 'optional',
    photoRuleLabel: 'Foto Opcional / Clientes & Serviços',
    photoRuleDescription:
      'Valoriza clientes atendidos, projetos entregues e serviços especializados em vez de vínculos fixos.',
    tagline: 'Destaque para clientes e projetos — perfeito para profissionais independentes e consultores externos.',
    whenToUse: 'Freelancers, prestadores de serviços, consultores independentes e contratos B2B/PJ.',
    whereToUse: 'Plataformas globais, clientes diretos, agências parceiras e consultorias.',
    regions: ['Global Remoto', 'Europa', 'Brasil & Portugal', 'EUA & UK'],
    bestForIndustries: ['Consultoria Independente', 'Freelance TI & Design', 'Marketing & Copywriting', 'Formação & Coaching', 'Serviços B2B'],
    atsScore: 93,
    atsRatingText: '93% ATS Score - Estruturado para propostas de clientes e contratos',
    whyPhotoOrNot:
      'Permite destacar rapidamente quem já confiou no seu trabalho, quais projetos entregou e onde ver o seu portfólio.',
    keyFeatures: [
      'Secção de competências em formato de serviços e ferramentas dominadas',
      'Realce para nome do cliente ou projeto contratado',
      'Espaço limpo para website comercial e portfólio',
      'Foto profissional opcional para gerar proximidade com novos clientes'
    ],
    proTip: 'Agrupe pequenos trabalhos freelance por tipo de serviço ou cliente principal para mostrar solidez e continuidade.',
    accentColor: '#0f766e'
  },

  // ============================================================================
  // MODELOS ESPECIALIZADOS ADICIONAIS DO CATÁLOGO ORIGINAL (PRESERVADOS)
  // ============================================================================
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
    name: 'Modelo Corporativo & Projetos Globais (Estruturado)',
    shortName: 'Corporativo & Projetos',
    badge: '🏛️ Corporativo & Projetos',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'optional',
    photoRuleLabel: 'Padrão Formal Sem Foto / Rigor Analítico',
    photoRuleDescription:
      'Estrutura rigorosa focada em governança, conformidade regulatória, gestão por resultados e prestação de contas executiva.',
    tagline: 'O formato executivo para governança corporativa, projetos de grande porte e consultoria multilateral.',
    whenToUse:
      'Candidaturas para Diretorias de Projetos, Gestão de Operações Multissetoriais, Programas de Investimento, Consultorias Internacionais e Contratos Estratégicos.',
    whereToUse:
      'Mercado corporativo internacional, multinacionais de infraestrutura e serviços, grupos empresariais e agências bilaterais de cooperação.',
    regions: ['Europa & Américas', 'África Lusófona & Global', 'Mercados Emergentes', 'Hubs Globais'],
    bestForIndustries: [
      'Governança Corporativa & Gestão de Projetos',
      'Infraestrutura & Gestão de Contratos',
      'Operações Multissetoriais e Auditoria',
      'Bancos de Desenvolvimento e Financiamento Estruturado',
      'Transformação Institucional & Compliance'
    ],
    atsScore: 95,
    atsRatingText: '95% ATS Score - Alinhado aos padrões de triagem de grandes corporações',
    whyPhotoOrNot:
      'Em funções de governança e auditoria executiva, layouts textuais sóbrios sem imagens desnecessárias são valorizados pela clareza analítica e conformidade imparcial.',
    keyFeatures: [
      'Menção a programas de investimento e indicadores de resultado auditados',
      'Destaque para governança corporativa, matrizes de risco e integridade de dados',
      'Secção detalhada de idiomas com fluência técnica e negociação de contratos',
      'Espaço formal para referências executivas com contatos institucionais diretos'
    ],
    proTip:
      'Sempre quantifique os resultados dos projetos liderados em termos de orçamento gerido, prazos cumpridos e metas estratégicas atingidas.',
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
  },
  {
    id: 'finance_wallstreet',
    name: 'Modelo Banca & Wall Street M&A (Sem Foto)',
    shortName: 'Wall Street M&A',
    badge: '🏦 Wall Street & M&A',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'strictly_forbidden',
    photoRuleLabel: 'Rigorosamente Sem Foto (Padrão Institucional)',
    photoRuleDescription:
      'Bancos de investimento, Private Equity e boutiques de M&A exigem layout compacto de página única em serifada institucional sem fotografias.',
    tagline: 'Estética institucional com dupla linha tipográfica para Banca de Investimento, M&A e Private Equity.',
    whenToUse:
      'Candidaturas a Investment Banking, Venture Capital, Private Equity, Asset Management, FP&A Sênior e Equity Research.',
    whereToUse:
      'Wall Street (Nova Iorque), City de Londres, Frankfurt, Zurique, Singapura e centros financeiros internacionais.',
    regions: ['Wall Street (EUA)', 'City de Londres', 'Zurique & Frankfurt', 'Singapura & Hong Kong'],
    bestForIndustries: [
      'Investment Banking & M&A',
      'Private Equity & Venture Capital',
      'Asset & Wealth Management',
      'Corporate Finance & Tesouraria',
      'Hedge Funds & Equity Research'
    ],
    atsScore: 99,
    atsRatingText: '99% ATS Score - Padrão OCR institucional de Wall Street',
    whyPhotoOrNot:
      'Em finanças institucionais anglo-saxónicas, qualquer foto reduz a densidade de transações (Deal Sheet) e infringe normas de triagem neutra.',
    keyFeatures: [
      'Tipografia serifada clássica com linhas duplas institucionais de alto contraste',
      'Leitura linear de 1 coluna com 99% de compatibilidade em Workday e Taleo',
      'Alinhamento tabular preciso de períodos, mandatos e transações financeiras',
      'Máxima densidade de métricas de ROI, IRR, múltiplos EV/EBITDA e volume de deals'
    ],
    proTip:
      'Destaque o volume total de transações assessoradas e métricas de retorno auditadas logo nos dois primeiros bullets de cada cargo.',
    accentColor: '#0f172a'
  },
  {
    id: 'executive_board',
    name: 'Modelo Conselho & C-Suite Editorial (Sem Foto)',
    shortName: 'Conselho & C-Suite',
    badge: '👔 Conselho & C-Suite',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'strictly_forbidden',
    photoRuleLabel: 'Sem Foto (Governança Corporativa)',
    photoRuleDescription:
      'Projetado para membros de Conselhos de Administração, CEOs, VPs e conselheiros independentes que precisam transmitir autoridade serena.',
    tagline: 'Cabeçalho editorial centrado com filete superior de autoridade para Conselhos e Alta Direção.',
    whenToUse:
      'Processos de headhunting executivo (Korn Ferry, Spencer Stuart, Egon Zehnder), assentos em Conselhos e posições VP/C-Level.',
    whereToUse:
      'Empresas listadas em bolsa, grupos familiares em profissionalização, fundos de investimento e diretorias globais.',
    regions: ['Global C-Suite', 'EUA & Reino Unido', 'União Europeia', 'América Latina'],
    bestForIndustries: [
      'Conselhos de Administração & Advisory',
      'Direção Geral (CEO / MD / GM)',
      'Transformação Corporativa & Turnaround',
      'Operações Globais & Supply Chain',
      'Assuntos Corporativos & Relações Institucionais'
    ],
    atsScore: 97,
    atsRatingText: '97% ATS Score - Autoridade executiva com parser limpo',
    whyPhotoOrNot:
      'Headhunters C-Level avaliam mandato, P&L gerido e governança em comitês, preferindo sobriedade editorial sem fotografias.',
    keyFeatures: [
      'Filete superior executivo e cabeçalho centralizado em tipografia de prestígio',
      'Hierarquia clara para resumos de mandato, P&L e liderança multi-país',
      'Estrutura linear compatível com portais executivos e arquivos PDF arquiváveis',
      'Equilíbrio refinado entre autoridade visual e facilidade de leitura rápida'
    ],
    proTip:
      'Inclua no resumo executivo a dimensão exata do seu mandato: receita sob gestão, número de países e equipa liderada.',
    accentColor: '#1e3a8a'
  },
  {
    id: 'product_strategy',
    name: 'Modelo Produto, PM & Growth Lead (Foto Opcional)',
    shortName: 'Produto & Growth',
    badge: '🚀 Produto & Growth',
    category: 'hybrid',
    hasPhoto: true,
    photoRule: 'optional',
    photoRuleLabel: 'Foto Opcional / Versátil',
    photoRuleDescription:
      'Funciona com foto discreta para empresas europeias/LATAM ou sem foto para Big Techs dos EUA com apenas um clique.',
    tagline: 'Layout moderno em grelha de competências orientado a métricas de produto, ARR e experimentação.',
    whenToUse:
      'Candidaturas a Product Manager, Head of Product, Growth Lead, Product Marketing, Strategy & Ops e Revenue Operations.',
    whereToUse:
      'Scale-ups SaaS, marketplaces digitais, Big Techs e equipas remotas internacionais de produto.',
    regions: ['Global Remoto', 'EUA & Canadá', 'Europa Tech', 'Brasil & LATAM'],
    bestForIndustries: [
      'Product Management & Strategy',
      'Growth, PLG & Monetização SaaS',
      'Product Marketing (PMM)',
      'Business Operations & Strategy',
      'Marketplaces, Fintechs & Consumer Tech'
    ],
    atsScore: 94,
    atsRatingText: '94% ATS Score - Clareza de métricas SaaS e produto',
    whyPhotoOrNot:
      'Por ser híbrido, permite exibir um retrato clean na Europa ou ocultá-lo instantaneamente para vagas nos EUA e Reino Unido.',
    keyFeatures: [
      'Bloco de resumo estratégico em destaque com fundo suave de alta legibilidade',
      'Grelha de competências em 2 colunas para frameworks de produto, analytics e growth',
      'Tipografia geométrica contemporânea otimizada para leitura em ecrã e PDF',
      'Destaque natural para métricas de conversão, retenção, NRR e lançamento de features'
    ],
    proTip:
      'Mencione sempre o impacto no funil ou na receita: ex. "Elevou ativação D7 em +22% e adicionou $3.4M em ARR via onboarding self-serve".',
    accentColor: '#2563eb'
  },
  {
    id: 'modern_editorial',
    name: 'Modelo Editorial Dois-Tons (Foto Opcional)',
    shortName: 'Editorial Dois-Tons',
    badge: '📰 Editorial Premium',
    category: 'hybrid',
    hasPhoto: true,
    photoRule: 'optional',
    photoRuleLabel: 'Foto Opcional Integrada',
    photoRuleDescription:
      'Cabeçalho editorial em faixa sólida contrastante com corpo A4 em coluna única limpa — impacto visual sem sacrificar leitura ATS.',
    tagline: 'Faixa superior editorial de alto contraste aliada a um corpo de leitura linear impecável.',
    whenToUse:
      'Candidaturas em Liderança Comercial, Comunicação Corporativa, Consultoria, Arquitetura, Gestão de Marca e Papéis Sênior.',
    whereToUse:
      'Europa Continental, Reino Unido (sem foto), América Latina e empresas inovadoras que valorizam apresentação diferenciada.',
    regions: ['Europa Continental', 'Reino Unido', 'América Latina', 'Global'],
    bestForIndustries: [
      'Liderança Comercial & Parcerias',
      'Consultoria & Gestão de Clientes',
      'Comunicação Corporativa & Marca',
      'Hospitalidade de Luxo & Varejo',
      'Gestão de Projetos & Operações'
    ],
    atsScore: 91,
    atsRatingText: '91% ATS Score - Faixa editorial + corpo linear A4',
    whyPhotoOrNot:
      'Combina presença executiva imediata na faixa superior com opção rápida de remover a foto quando exigido pelo país.',
    keyFeatures: [
      'Banner superior dois-tons personalizável com a cor executiva do seu setor',
      'Corpo em coluna única garantindo leitura cronológica limpa por recrutadores e OCR',
      'Equilíbrio elegante entre identidade visual marcante e formalidade corporativa',
      'Exportação fiel para PDF e Word (.docx) mantendo o bloco de cabeçalho sombreado'
    ],
    proTip:
      'Combine este modelo com tons grafite ou azul-marinho para consultoria e bordô ou verde-esmeralda para posições de liderança criativa.',
    accentColor: '#334155'
  },
  {
    id: 'engineering_blueprint',
    name: 'Modelo Principal Engineer & Arquitetura (Sem Foto)',
    shortName: 'Principal Systems',
    badge: '⚙️ Principal & Arquitetura',
    category: 'without_photo',
    hasPhoto: false,
    photoRule: 'strictly_forbidden',
    photoRuleLabel: 'Sem Foto (Rigor Técnico)',
    photoRuleDescription:
      'Focado exclusivamente em sistemas distribuídos, arquitetura cloud, fiabilidade e impacto técnico em produção.',
    tagline: 'Estética técnica precisa com numeração editorial e matriz de arquitetura para Staff & Principal Engineers.',
    whenToUse:
      'Vagas de Staff Engineer, Principal Architect, Platform Engineering Lead, SRE Principal e VP/Director of Engineering.',
    whereToUse:
      'Big Techs, empresas cloud-native, fintechs de alta escala e contratos remotos internacionais.',
    regions: ['Vale do Silício (EUA)', 'Londres & Berlim', 'Amesterdão & Zurique', 'Remoto Global'],
    bestForIndustries: [
      'Arquitetura Cloud & Sistemas Distribuídos',
      'Platform Engineering & SRE',
      'Infraestrutura de IA & MLOps',
      'Pagamentos & Core Banking',
      'Engenharia de Alta Concorrência'
    ],
    atsScore: 96,
    atsRatingText: '96% ATS Score - Indexação limpa de stack e escala',
    whyPhotoOrNot:
      'Em cargos de Principal e Staff Engineering, avalia-se apenas capacidade técnica, escala de sistemas, SLOs e liderança arquitetural.',
    keyFeatures: [
      'Numeração editorial limpa (01, 02, 03) combinada com acentos técnicos subtis',
      'Matriz de capacidades técnicas em 2 colunas para Cloud, Linguagens, Dados e Observabilidade',
      'Formato direto de Cargo @ Empresa com destaque tabular para prazos e impacto',
      'Zero elementos supérfluos — otimizado para comités técnicos e sistemas Greenhouse/Lever'
    ],
    proTip:
      'Especifique ordens de grandeza reais: QPS, latência p99, orçamento cloud otimizado e disponibilidade (ex: 99.995% SLA).',
    accentColor: '#0369a1'
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
    url: portraitManImg
  },
  {
    id: 'exec_female',
    name: 'Executiva Líder',
    category: 'Executivo',
    url: portraitWomanImg
  },
  {
    id: 'tech_pro',
    name: 'Tech / Corporativo',
    category: 'Tech & Criativo',
    url: portraitManImg
  },
  {
    id: 'intl_female',
    name: 'Consultora Internacional',
    category: 'Internacional',
    url: portraitWomanImg
  }
];

export function getTemplateById(id: TemplateStyle): CVTemplateInfo {
  const found = CV_TEMPLATES.find((t) => t.id === id);
  return found || CV_TEMPLATES[0];
}
