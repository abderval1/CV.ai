import type { SiteLanguageCode } from '../i18n/siteTranslations';
import type { AppTab } from '../components/Header';

export interface SeoRouteMeta {
  title: string;
  description: string;
  keywords: string;
  breadcrumb: string;
}

export interface SeoRouteConfig {
  tab: AppTab;
  path: string;
  priority: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  indexable: boolean;
}

export const SEO_ROUTE_CONFIGS: SeoRouteConfig[] = [
  { tab: 'home', path: '/', priority: '1.0', changefreq: 'weekly', indexable: true },
  { tab: 'models-cv', path: '/modelos-cv', priority: '0.9', changefreq: 'weekly', indexable: true },
  { tab: 'examples-cv', path: '/exemplos-cv', priority: '0.9', changefreq: 'weekly', indexable: true },
  { tab: 'models-cover', path: '/modelos-carta', priority: '0.85', changefreq: 'weekly', indexable: true },
  { tab: 'examples-cover', path: '/exemplos-carta', priority: '0.85', changefreq: 'weekly', indexable: true },
  { tab: 'editor', path: '/editor', priority: '0.9', changefreq: 'weekly', indexable: true },
  { tab: 'raw', path: '/importar-curriculo', priority: '0.8', changefreq: 'monthly', indexable: true },
  { tab: 'ats', path: '/radar-ats', priority: '0.9', changefreq: 'weekly', indexable: true },
  { tab: 'jobs', path: '/vagas', priority: '0.85', changefreq: 'daily', indexable: true },
  { tab: 'ai', path: '/otimizador-ia', priority: '0.85', changefreq: 'weekly', indexable: true },
  { tab: 'cover', path: '/carta-apresentacao', priority: '0.85', changefreq: 'weekly', indexable: true },
  { tab: 'interview', path: '/simulador-entrevista', priority: '0.8', changefreq: 'weekly', indexable: true },
  { tab: 'profile', path: '/conta', priority: '0.2', changefreq: 'monthly', indexable: false }
];

const OG_LOCALE_MAP: Record<SiteLanguageCode, string> = {
  pt: 'pt_PT',
  en: 'en_US',
  es: 'es_ES',
  fr: 'fr_FR',
  de: 'de_DE',
  it: 'it_IT'
};

const ALL_SITE_LANGS: SiteLanguageCode[] = ['pt', 'en', 'es', 'fr', 'de', 'it'];

const SEO_LOCALIZED_DATA: Record<
  SiteLanguageCode,
  {
    brand: string;
    appCategory: string;
    featureList: string[];
    routes: Record<AppTab, SeoRouteMeta>;
  }
> = {
  pt: {
    brand: 'Currículo Estratégico',
    appCategory: 'BusinessApplication',
    featureList: [
      'Modelos de Currículo A4 Executivos, Harvard e Europass compatíveis com ATS',
      'Radar ATS em tempo real com pontuação contra Workday, Greenhouse e Taleo',
      'Otimização com IA na fórmula Google XYZ e tradução integral em 5 idiomas',
      'Exportação nativa editável em Word (.docx) e PDF de alta resolução',
      'Gerador de Carta de Apresentação Executiva e Simulador de Entrevista STAR'
    ],
    routes: {
      home: {
        title: 'Currículo Estratégico — Estúdio de Currículo & ATS',
        description:
          'Crie currículos A4 executivos e cartas de apresentação com Radar ATS, fórmula Google XYZ, tradução em 5 idiomas e exportação nativa Word (.docx) e PDF.',
        keywords:
          'curriculo ats, criador de curriculo executivo, modelo harvard cv, europass word docx, radar ats, carta de apresentacao ia',
        breadcrumb: 'Início'
      },
      'models-cv': {
        title: 'Modelos de Currículo ATS & Harvard A4 — Currículo Estratégico',
        description:
          'Explore modelos de currículo executivo A4 aprovados em filtros ATS Workday, Greenhouse e Taleo. Formatos Harvard, Moderno e Europass editáveis em Word e PDF.',
        keywords:
          'modelos de curriculo, modelo harvard cv, modelo europass word, template curriculo ats, curriculo executivo a4',
        breadcrumb: 'Modelos de Currículo'
      },
      'examples-cv': {
        title: 'Exemplos Reais de Currículo Executivo — Currículo Estratégico',
        description:
          'Veja exemplos reais de currículos aprovados para Direção, Tecnologia, Finanças, Saúde e Academia com métricas quantificáveis e estrutura Google XYZ.',
        keywords:
          'exemplos de curriculo pronto, exemplo curriculo diretor, exemplo curriculo ti, curriculo com metricas xyz',
        breadcrumb: 'Exemplos de Currículo'
      },
      'models-cover': {
        title: 'Modelos de Carta de Apresentação A4 — Currículo Estratégico',
        description:
          'Modelos de carta de apresentação executiva e corporativa prontos a personalizar, traduzir em 5 idiomas e exportar em Word (.docx) e PDF.',
        keywords:
          'modelo carta de apresentacao, cover letter executiva, carta de motivacao word, carta candidatura profissional',
        breadcrumb: 'Modelos de Carta'
      },
      'examples-cover': {
        title: 'Exemplos de Carta de Apresentação — Currículo Estratégico',
        description:
          'Inspire-se com exemplos prontos de carta de apresentação para tecnologia, finanças, liderança, mudança de área e primeiro emprego.',
        keywords:
          'exemplos carta de apresentacao, carta motivacao pronta, carta apresentacao emprego',
        breadcrumb: 'Exemplos de Carta'
      },
      editor: {
        title: 'Editor de Currículo A4 em Tempo Real — Currículo Estratégico',
        description:
          'Edite o seu currículo em folha A4 com pré-visualização instantânea, ajuste de densidade, tradução em 5 idiomas e download direto em Word (.docx) e PDF.',
        keywords:
          'editor de curriculo online, fazer curriculo a4, exportar curriculo word docx, editar cv ats',
        breadcrumb: 'Editor de Currículo'
      },
      raw: {
        title: 'Importar LinkedIn ou Texto para CV — Currículo Estratégico',
        description:
          'Transforme automaticamente o seu perfil do LinkedIn, PDF antigo ou texto livre num currículo executivo estruturado e compatível com sistemas ATS.',
        keywords:
          'importar linkedin para curriculo, converter pdf em curriculo editavel, gerador cv com ia',
        breadcrumb: 'Importar Dados'
      },
      ats: {
        title: 'Radar ATS & Compatibilidade de Vaga — Currículo Estratégico',
        description:
          'Analise o seu currículo contra a descrição da vaga, descubra palavras-chave em falta e aumente a taxa de aprovação em filtros ATS como Workday e Taleo.',
        keywords:
          'radar ats, testar curriculo ats, compatibilidade vaga curriculo, analisador ats online',
        breadcrumb: 'Radar ATS'
      },
      jobs: {
        title: 'Vagas Compatíveis com o seu CV — Currículo Estratégico',
        description:
          'Encontre vagas remotas e internacionais alinhadas com as competências do seu currículo e adapte a candidatura com um clique.',
        keywords:
          'vagas compativeis curriculo, vagas remotas internacionais, match vagas ia',
        breadcrumb: 'Vagas Compatíveis'
      },
      ai: {
        title: 'Otimizador IA Google XYZ para CV — Currículo Estratégico',
        description:
          'Reescreva responsabilidades em conquistas mensuráveis usando verbos de ação executivos e a fórmula Google XYZ com inteligência artificial.',
        keywords:
          'otimizador curriculo ia, formula google xyz curriculo, melhorar conquistas cv',
        breadcrumb: 'Otimizador IA'
      },
      cover: {
        title: 'Gerador de Carta de Apresentação IA — Currículo Estratégico',
        description:
          'Gere cartas de apresentação personalizadas para qualquer vaga em segundos, traduza em 5 idiomas e exporte em Word (.docx) e PDF.',
        keywords:
          'gerador carta de apresentacao ia, carta motivacao personalizada, exportar carta word',
        breadcrumb: 'Carta de Apresentação'
      },
      interview: {
        title: 'Simulador de Entrevista STAR com IA — Currículo Estratégico',
        description:
          'Treine perguntas comportamentais e executivas baseadas no seu currículo e receba feedback estruturado no método STAR.',
        keywords:
          'simulador entrevista ia, metodo star entrevista, preparacao entrevista executiva',
        breadcrumb: 'Simulador de Entrevista'
      },
      profile: {
        title: 'Minha Conta & Preferências — Currículo Estratégico',
        description:
          'Gerencie os seus currículos guardados, assinatura, faturas e preferências de notificação na sua conta Currículo Estratégico.',
        keywords: 'minha conta curriculo estrategico, gerir assinatura',
        breadcrumb: 'Minha Conta'
      }
    }
  },
  en: {
    brand: 'Currículo Estratégico',
    appCategory: 'BusinessApplication',
    featureList: [
      'Executive, Harvard & Europass A4 Resume Templates built for ATS parsers',
      'Real-time ATS Radar scoring against Workday, Greenhouse & Taleo',
      'AI bullet rewriting with Google XYZ formula and 5-language translation',
      'Native editable Word (.docx) and high-resolution PDF exports',
      'AI Cover Letter Builder and STAR Behavioral Interview Simulator'
    ],
    routes: {
      home: {
        title: 'Currículo Estratégico — Executive Resume & ATS Studio',
        description:
          'Build ATS-ready A4 executive resumes and cover letters with ATS Radar, Google XYZ AI rewriting, 5-language translation, and native Word (.docx) & PDF export.',
        keywords:
          'ats resume builder, executive cv studio, harvard resume template, europass docx, google xyz resume, cover letter ai',
        breadcrumb: 'Home'
      },
      'models-cv': {
        title: 'ATS & Harvard A4 Resume Templates — Currículo Estratégico',
        description:
          'Browse ATS-verified executive A4 resume templates built for Workday, Greenhouse, and Taleo. Harvard, Modern, and Europass layouts in Word & PDF.',
        keywords:
          'ats resume templates, harvard cv template, europass resume template, executive resume layout',
        breadcrumb: 'Resume Templates'
      },
      'examples-cv': {
        title: 'Executive Resume Examples by Sector — Currículo Estratégico',
        description:
          'Inspect real-world executive resume examples across Tech, C-Suite, Finance, Healthcare, and Academia formatted with quantifiable Google XYZ metrics.',
        keywords:
          'executive resume examples, c-level cv sample, tech director resume example, finance cv sample',
        breadcrumb: 'Resume Examples'
      },
      'models-cover': {
        title: 'Executive Cover Letter Templates — Currículo Estratégico',
        description:
          'Clean A4 executive and ATS cover letter templates ready to tailor, translate into 5 languages, and export as Word (.docx) or PDF.',
        keywords:
          'executive cover letter template, ats cover letter format, professional cover letter docx',
        breadcrumb: 'Cover Letter Templates'
      },
      'examples-cover': {
        title: 'Professional Cover Letter Examples — Currículo Estratégico',
        description:
          'Explore proven cover letter samples for technology, finance, executive leadership, career transition, and entry-level roles.',
        keywords:
          'cover letter examples, executive cover letter sample, career change cover letter',
        breadcrumb: 'Cover Letter Examples'
      },
      editor: {
        title: 'Live A4 Resume Editor & Word Export — Currículo Estratégico',
        description:
          'Edit your A4 resume with live page preview, typography spacing controls, 5-language AI translation, and instant Word (.docx) and PDF export.',
        keywords:
          'online resume editor, live a4 cv builder, export resume to word docx',
        breadcrumb: 'Resume Editor'
      },
      raw: {
        title: 'Import LinkedIn or PDF to Resume — Currículo Estratégico',
        description:
          'Convert LinkedIn profiles, legacy PDFs, or raw career notes into a structured, ATS-compliant executive resume in seconds.',
        keywords:
          'linkedin to resume converter, pdf to editable cv, ai resume parser',
        breadcrumb: 'Import Resume'
      },
      ats: {
        title: 'ATS Radar & Job Match Checker — Currículo Estratégico',
        description:
          'Scan your resume against any job description, uncover missing keywords, and boost your ATS match score for Workday, Greenhouse, and Taleo.',
        keywords:
          'ats resume checker, job match score, ats keyword analyzer, workday ats test',
        breadcrumb: 'ATS Radar'
      },
      jobs: {
        title: 'Matched Jobs for Your Resume — Currículo Estratégico',
        description:
          'Discover remote and global job openings matched to your resume skills and tailor your application in one click.',
        keywords:
          'matched remote jobs, resume job matching, executive job search',
        breadcrumb: 'Job Matches'
      },
      ai: {
        title: 'Google XYZ AI Resume Optimizer — Currículo Estratégico',
        description:
          'Transform passive job duties into high-impact achievements using executive action verbs and the Google XYZ formula.',
        keywords:
          'ai resume optimizer, google xyz formula bullets, executive resume writer',
        breadcrumb: 'AI Optimizer'
      },
      cover: {
        title: 'AI Executive Cover Letter Builder — Currículo Estratégico',
        description:
          'Generate tailored executive cover letters matched to any job posting, translate across 5 languages, and export in Word (.docx) or PDF.',
        keywords:
          'ai cover letter generator, executive motivation letter, cover letter word export',
        breadcrumb: 'Cover Letter'
      },
      interview: {
        title: 'AI STAR Interview Simulator — Currículo Estratégico',
        description:
          'Practice behavioral and leadership interview questions tailored to your CV with structured STAR method feedback.',
        keywords:
          'ai interview simulator, star method practice, executive interview prep',
        breadcrumb: 'Interview Simulator'
      },
      profile: {
        title: 'My Account & Settings — Currículo Estratégico',
        description:
          'Manage saved resumes, subscription billing, and notification preferences in your Currículo Estratégico account.',
        keywords: 'account settings, saved resumes',
        breadcrumb: 'My Account'
      }
    }
  },
  es: {
    brand: 'Currículo Estratégico',
    appCategory: 'BusinessApplication',
    featureList: [
      'Plantillas de CV A4 Ejecutivas, Harvard y Europass compatibles con ATS',
      'Radar ATS en tiempo real frente a Workday, Greenhouse y Taleo',
      'Optimización IA con fórmula Google XYZ y traducción en 5 idiomas',
      'Exportación nativa editable a Word (.docx) y PDF de alta resolución',
      'Generador de Carta de Presentación y Simulador de Entrevista STAR'
    ],
    routes: {
      home: {
        title: 'Currículo Estratégico — Estudio de CV Ejecutivo & ATS',
        description:
          'Crea currículums A4 ejecutivos y cartas de presentación con Radar ATS, fórmula Google XYZ, traducción en 5 idiomas y descarga en Word (.docx) y PDF.',
        keywords:
          'curriculum ats, creador cv ejecutivo, plantilla harvard cv, europass word docx, radar ats, carta presentacion ia',
        breadcrumb: 'Inicio'
      },
      'models-cv': {
        title: 'Plantillas de Currículum ATS & Harvard — Currículo Estratégico',
        description:
          'Explora plantillas de CV A4 aprobadas en filtros ATS Workday y Taleo. Formatos Harvard, Moderno y Europass listos para Word (.docx) y PDF.',
        keywords:
          'plantillas curriculum ats, modelo harvard cv, plantilla europass word, curriculum ejecutivo a4',
        breadcrumb: 'Plantillas de CV'
      },
      'examples-cv': {
        title: 'Ejemplos de Currículum Ejecutivo — Currículo Estratégico',
        description:
          'Consulta ejemplos reales de currículums para Tecnología, Dirección, Finanzas y Salud estructurados con métricas cuantificables Google XYZ.',
        keywords:
          'ejemplos curriculum vitae, ejemplo cv director, ejemplo cv tecnologia, curriculum con metricas',
        breadcrumb: 'Ejemplos de CV'
      },
      'models-cover': {
        title: 'Plantillas de Carta de Presentación — Currículo Estratégico',
        description:
          'Modelos de carta de presentación ejecutiva en formato A4 listos para personalizar, traducir en 5 idiomas y exportar en Word y PDF.',
        keywords:
          'plantilla carta de presentacion, modelo carta motivacion word, cover letter ejecutiva',
        breadcrumb: 'Plantillas de Carta'
      },
      'examples-cover': {
        title: 'Ejemplos de Carta de Presentación — Currículo Estratégico',
        description:
          'Inspírate con ejemplos reales de carta de presentación para tecnología, finanzas, liderazgo y cambio profesional.',
        keywords:
          'ejemplos carta presentacion, carta motivacion profesional, carta candidatura',
        breadcrumb: 'Ejemplos de Carta'
      },
      editor: {
        title: 'Editor de CV A4 en Tiempo Real — Currículo Estratégico',
        description:
          'Edita tu currículum A4 con vista previa instantánea, control de espaciado, traducción en 5 idiomas y descarga nativa en Word (.docx) y PDF.',
        keywords:
          'editor curriculum online, hacer cv a4, exportar curriculum word docx',
        breadcrumb: 'Editor de CV'
      },
      raw: {
        title: 'Importar LinkedIn o PDF a CV — Currículo Estratégico',
        description:
          'Convierte tu perfil de LinkedIn, PDF antiguo o texto libre en un currículum ejecutivo estructurado y compatible con ATS.',
        keywords:
          'importar linkedin a curriculum, convertir pdf en cv editable, generador cv ia',
        breadcrumb: 'Importar Datos'
      },
      ats: {
        title: 'Radar ATS & Compatibilidad de Puesto — Currículo Estratégico',
        description:
          'Analiza tu currículum frente a cualquier oferta laboral, detecta palabras clave faltantes y supera filtros ATS como Workday y Taleo.',
        keywords:
          'radar ats, comprobar curriculum ats, compatibilidad puesto cv',
        breadcrumb: 'Radar ATS'
      },
      jobs: {
        title: 'Ofertas Compatibles con tu CV — Currículo Estratégico',
        description:
          'Encuentra vacantes remotas e internacionales alineadas con las competencias de tu currículum y postula con mayor precisión.',
        keywords:
          'ofertas compatibles curriculum, empleo remoto internacional, match empleo ia',
        breadcrumb: 'Vacantes'
      },
      ai: {
        title: 'Optimizador IA Google XYZ para CV — Currículo Estratégico',
        description:
          'Reescribe responsabilidades en logros medibles usando verbos de acción ejecutivos y la fórmula Google XYZ con inteligencia artificial.',
        keywords:
          'optimizador curriculum ia, formula google xyz cv, mejorar logros curriculum',
        breadcrumb: 'Optimizador IA'
      },
      cover: {
        title: 'Generador de Carta de Presentación IA — Currículo Estratégico',
        description:
          'Crea cartas de presentación personalizadas para cualquier vacante, tradúcelas en 5 idiomas y expórtalas en Word (.docx) y PDF.',
        keywords:
          'generador carta presentacion ia, carta motivacion personalizada, exportar carta word',
        breadcrumb: 'Carta de Presentación'
      },
      interview: {
        title: 'Simulador de Entrevista STAR con IA — Currículo Estratégico',
        description:
          'Practica preguntas conductuales y ejecutivas basadas en tu currículum con retroalimentación guiada por el método STAR.',
        keywords:
          'simulador entrevista ia, metodo star entrevista, preparacion entrevista ejecutiva',
        breadcrumb: 'Simulador de Entrevista'
      },
      profile: {
        title: 'Mi Cuenta y Preferencias — Currículo Estratégico',
        description:
          'Gestiona tus currículums guardados, suscripción y preferencias de notificación en Currículo Estratégico.',
        keywords: 'mi cuenta curriculum estrategico, gestionar suscripcion',
        breadcrumb: 'Mi Cuenta'
      }
    }
  },
  fr: {
    brand: 'Currículo Estratégico',
    appCategory: 'BusinessApplication',
    featureList: [
      'Modèles de CV A4 Exécutifs, Harvard et Europass compatibles ATS',
      'Radar ATS en temps réel face à Workday, Greenhouse et Taleo',
      'Optimisation IA Google XYZ et traduction intégrale en 5 langues',
      'Export natif Word (.docx) modifiable et PDF haute résolution',
      'Générateur de Lettre de Motivation et Simulateur d’Entretien STAR'
    ],
    routes: {
      home: {
        title: 'Currículo Estratégico — Studio CV Exécutif & ATS',
        description:
          'Créez des CV A4 exécutifs et lettres de motivation avec Radar ATS, méthode Google XYZ, traduction en 5 langues et export Word (.docx) & PDF.',
        keywords:
          'cv ats, createur cv executif, modele cv harvard, europass word docx, radar ats, lettre de motivation ia',
        breadcrumb: 'Accueil'
      },
      'models-cv': {
        title: 'Modèles de CV ATS & Harvard A4 — Currículo Estratégico',
        description:
          'Parcourez nos modèles de CV A4 validés pour Workday, Greenhouse et Taleo. Formats Harvard, Moderne et Europass exportables en Word et PDF.',
        keywords:
          'modeles de cv ats, modele cv harvard, modele cv europass word, cv cadre direction',
        breadcrumb: 'Modèles de CV'
      },
      'examples-cv': {
        title: 'Exemples de CV Exécutifs par Secteur — Currículo Estratégico',
        description:
          'Consultez des exemples réels de CV pour Tech, Direction, Finance et Santé rédigés avec des résultats chiffrés Google XYZ.',
        keywords:
          'exemples de cv, exemple cv directeur, exemple cv informatique, cv chiffre xyz',
        breadcrumb: 'Exemples de CV'
      },
      'models-cover': {
        title: 'Modèles de Lettre de Motivation A4 — Currículo Estratégico',
        description:
          'Modèles de lettres de motivation exécutives A4 prêts à adapter, traduire en 5 langues et exporter en Word (.docx) et PDF.',
        keywords:
          'modele lettre de motivation, lettre motivation cadre, cover letter word docx',
        breadcrumb: 'Modèles de Lettre'
      },
      'examples-cover': {
        title: 'Exemples de Lettres de Motivation — Currículo Estratégico',
        description:
          'Découvrez des exemples de lettres de motivation pour la tech, la finance, le leadership et la reconversion professionnelle.',
        keywords:
          'exemples lettre de motivation, lettre candidature cadre, lettre reconversion',
        breadcrumb: 'Exemples de Lettre'
      },
      editor: {
        title: 'Éditeur de CV A4 en Temps Réel — Currículo Estratégico',
        description:
          'Éditez votre CV A4 avec aperçu en direct, contrôle d’espacement, traduction en 5 langues et export direct Word (.docx) et PDF.',
        keywords:
          'editeur cv en ligne, creer cv a4, exporter cv word docx',
        breadcrumb: 'Éditeur de CV'
      },
      raw: {
        title: 'Importer LinkedIn ou PDF vers CV — Currículo Estratégico',
        description:
          'Transformez un profil LinkedIn, un ancien PDF ou du texte brut en un CV exécutif structuré et compatible ATS.',
        keywords:
          'importer linkedin en cv, convertir pdf en cv modifiable, generateur cv ia',
        breadcrumb: 'Importer des Données'
      },
      ats: {
        title: 'Radar ATS & Adéquation au Poste — Currículo Estratégico',
        description:
          'Analysez votre CV face à une offre d’emploi, identifiez les mots-clés manquants et optimisez votre score ATS Workday et Taleo.',
        keywords:
          'radar ats, tester cv ats, score compatibilite emploi, analyseur ats',
        breadcrumb: 'Radar ATS'
      },
      jobs: {
        title: 'Offres d’Emploi Compatibles CV — Currículo Estratégico',
        description:
          'Trouvez des postes en télétravail et internationaux alignés avec les compétences de votre CV et adaptez votre candidature.',
        keywords:
          'offres emploi compatibles cv, emploi remote international, matching emploi ia',
        breadcrumb: 'Offres d’Emploi'
      },
      ai: {
        title: 'Optimiseur IA Google XYZ pour CV — Currículo Estratégico',
        description:
          'Transformez vos missions en réalisations mesurables grâce aux verbes d’action exécutifs et à la formule Google XYZ.',
        keywords:
          'optimiseur cv ia, methode google xyz cv, rediger realisations cv',
        breadcrumb: 'Optimiseur IA'
      },
      cover: {
        title: 'Générateur de Lettre de Motivation IA — Currículo Estratégico',
        description:
          'Générez une lettre de motivation personnalisée pour chaque poste, traduisez-la en 5 langues et exportez en Word (.docx) ou PDF.',
        keywords:
          'generateur lettre motivation ia, lettre motivation sur mesure, exporter lettre word',
        breadcrumb: 'Lettre de Motivation'
      },
      interview: {
        title: 'Simulateur d’Entretien STAR avec IA — Currículo Estratégico',
        description:
          'Entraînez-vous aux questions comportementales et de direction basées sur votre CV avec évaluation selon la méthode STAR.',
        keywords:
          'simulateur entretien ia, methode star entretien, preparation entretien cadre',
        breadcrumb: 'Simulateur d’Entretien'
      },
      profile: {
        title: 'Mon Compte & Préférences — Currículo Estratégico',
        description:
          'Gérez vos CV enregistrés, votre abonnement et vos préférences de notification sur Currículo Estratégico.',
        keywords: 'mon compte, cv enregistres',
        breadcrumb: 'Mon Compte'
      }
    }
  },
  de: {
    brand: 'Currículo Estratégico',
    appCategory: 'BusinessApplication',
    featureList: [
      'A4-Lebenslauf-Vorlagen im Executive-, Harvard- und Europass-Stil (ATS-konform)',
      'Echtzeit-ATS-Radar gegen Workday, Greenhouse und Taleo',
      'KI-Optimierung nach Google-XYZ-Formel und Übersetzung in 5 Sprachen',
      'Nativer bearbeitbarer Word- (.docx) und hochauflösender PDF-Export',
      'KI-Anschreiben-Generator und STAR-Interview-Simulator'
    ],
    routes: {
      home: {
        title: 'Currículo Estratégico — Executive Lebenslauf & ATS-Studio',
        description:
          'Erstellen Sie ATS-konforme A4-Lebensläufe und Anschreiben mit ATS-Radar, Google-XYZ-KI, 5-Sprachen-Übersetzung sowie Word- (.docx) & PDF-Export.',
        keywords:
          'ats lebenslauf, executive cv vorlage, harvard lebenslauf, europass word docx, ats radar, anschreiben ki',
        breadcrumb: 'Startseite'
      },
      'models-cv': {
        title: 'ATS & Harvard A4-Lebenslauf-Vorlagen — Currículo Estratégico',
        description:
          'Entdecken Sie ATS-geprüfte A4-Lebenslauf-Vorlagen für Workday, Greenhouse und Taleo. Harvard-, Modern- und Europass-Designs für Word & PDF.',
        keywords:
          'ats lebenslauf vorlagen, harvard lebenslauf vorlage, europass vorlage word, executive lebenslauf',
        breadcrumb: 'Lebenslauf-Vorlagen'
      },
      'examples-cv': {
        title: 'Executive-Lebenslauf-Beispiele — Currículo Estratégico',
        description:
          'Sehen Sie praxisnahe Lebenslauf-Beispiele für Tech, Geschäftsführung, Finanzen und Gesundheitswesen mit messbaren Google-XYZ-Erfolgen.',
        keywords:
          'lebenslauf beispiele, executive lebenslauf muster, tech direktor lebenslauf',
        breadcrumb: 'Lebenslauf-Beispiele'
      },
      'models-cover': {
        title: 'Anschreiben-Vorlagen im A4-Format — Currículo Estratégico',
        description:
          'Professionelle Executive-Anschreiben-Vorlagen im A4-Format zum Anpassen, Übersetzen in 5 Sprachen und Exportieren als Word (.docx) oder PDF.',
        keywords:
          'anschreiben vorlage, motivationsschreiben muster word, executive cover letter',
        breadcrumb: 'Anschreiben-Vorlagen'
      },
      'examples-cover': {
        title: 'Professionelle Anschreiben-Beispiele — Currículo Estratégico',
        description:
          'Überzeugende Anschreiben-Beispiele für IT, Finanzen, Management, Quereinstieg und Berufseinstieg.',
        keywords:
          'anschreiben beispiele, bewerbungsschreiben muster, quereinstieg anschreiben',
        breadcrumb: 'Anschreiben-Beispiele'
      },
      editor: {
        title: 'Live A4-Lebenslauf-Editor & Word-Export — Currículo Estratégico',
        description:
          'Bearbeiten Sie Ihren A4-Lebenslauf mit Live-Vorschau, Abstandsregelung, 5-Sprachen-Übersetzung und direktem Word- (.docx) und PDF-Export.',
        keywords:
          'lebenslauf editor online, a4 cv erstellen, lebenslauf als word docx exportieren',
        breadcrumb: 'Lebenslauf-Editor'
      },
      raw: {
        title: 'LinkedIn oder PDF in Lebenslauf importieren — Currículo Estratégico',
        description:
          'Verwandeln Sie Ihr LinkedIn-Profil, alte PDFs oder Rohtext in Sekunden in einen strukturierten, ATS-konformen Lebenslauf.',
        keywords:
          'linkedin zu lebenslauf, pdf in bearbeitbaren lebenslauf umwandeln, ki lebenslauf parser',
        breadcrumb: 'Daten importieren'
      },
      ats: {
        title: 'ATS-Radar & Stellenabgleich — Currículo Estratégico',
        description:
          'Prüfen Sie Ihren Lebenslauf gegen Stellenanzeigen, finden Sie fehlende Keywords und steigern Sie Ihren ATS-Score für Workday und Taleo.',
        keywords:
          'ats lebenslauf check, stellenabgleich lebenslauf, ats keyword analyse',
        breadcrumb: 'ATS-Radar'
      },
      jobs: {
        title: 'Passende Stellen für Ihren Lebenslauf — Currículo Estratégico',
        description:
          'Finden Sie internationale Remote- und Führungspositionen passend zu Ihren Kompetenzen im Lebenslauf.',
        keywords:
          'passende jobs lebenslauf, remote stellen international, job matching ki',
        breadcrumb: 'Stellenangebote'
      },
      ai: {
        title: 'Google-XYZ KI-Lebenslauf-Optimierer — Currículo Estratégico',
        description:
          'Formulieren Sie Aufgaben mit starken Aktionsverben und der Google-XYZ-Formel in messbare Executive-Erfolge um.',
        keywords:
          'ki lebenslauf optimierer, google xyz formel lebenslauf, erfolge formulieren',
        breadcrumb: 'KI-Optimierer'
      },
      cover: {
        title: 'KI-Anschreiben-Generator — Currículo Estratégico',
        description:
          'Erstellen Sie maßgeschneiderte Anschreiben für jede Stelle, übersetzen Sie in 5 Sprachen und exportieren Sie als Word (.docx) oder PDF.',
        keywords:
          'ki anschreiben generator, bewerbungsschreiben erstellen, anschreiben word export',
        breadcrumb: 'Anschreiben'
      },
      interview: {
        title: 'KI STAR-Interview-Simulator — Currículo Estratégico',
        description:
          'Trainieren Sie Verhaltens- und Führungsfragen passend zu Ihrem Lebenslauf mit strukturiertem STAR-Feedback.',
        keywords:
          'ki interview simulator, star methode vorstellungsgespraech, executive interview',
        breadcrumb: 'Interview-Simulator'
      },
      profile: {
        title: 'Mein Konto & Einstellungen — Currículo Estratégico',
        description:
          'Verwalten Sie gespeicherte Lebensläufe, Ihr Abonnement und Benachrichtigungen in Ihrem Konto.',
        keywords: 'mein konto, gespeicherte lebenslaeufe',
        breadcrumb: 'Mein Konto'
      }
    }
  },
  it: {
    brand: 'Currículo Estratégico',
    appCategory: 'BusinessApplication',
    featureList: [
      'Modelli di CV A4 Executive, Harvard ed Europass compatibili con ATS',
      'Radar ATS in tempo reale per Workday, Greenhouse e Taleo',
      'Ottimizzazione IA Google XYZ e traduzione completa in 5 lingue',
      'Esportazione nativa modificabile in Word (.docx) e PDF alta risoluzione',
      'Generatore Lettera di Presentazione e Simulatore Colloquio STAR'
    ],
    routes: {
      home: {
        title: 'Currículo Estratégico — Studio CV Executive & ATS',
        description:
          'Crea CV A4 executive e lettere di presentazione con Radar ATS, formula Google XYZ, traduzione in 5 lingue ed export Word (.docx) e PDF.',
        keywords:
          'curriculum ats, creatore cv executive, modello cv harvard, europass word docx, radar ats, lettera presentazione ia',
        breadcrumb: 'Home'
      },
      'models-cv': {
        title: 'Modelli CV ATS & Harvard A4 — Currículo Estratégico',
        description:
          'Esplora modelli di CV A4 ottimizzati per Workday, Greenhouse e Taleo. Layout Harvard, Moderno ed Europass pronti in Word e PDF.',
        keywords:
          'modelli cv ats, modello cv harvard, modello europass word, curriculum executive a4',
        breadcrumb: 'Modelli CV'
      },
      'examples-cv': {
        title: 'Esempi di CV Executive per Settore — Currículo Estratégico',
        description:
          'Scopri esempi reali di CV per Tech, Direzione, Finanza e Sanità strutturati con metriche quantificabili Google XYZ.',
        keywords:
          'esempi curriculum vitae, esempio cv dirigente, esempio cv it, curriculum con metriche',
        breadcrumb: 'Esempi CV'
      },
      'models-cover': {
        title: 'Modelli Lettera di Presentazione A4 — Currículo Estratégico',
        description:
          'Modelli di lettera di presentazione executive in formato A4 pronti da personalizzare, tradurre in 5 lingue ed esportare in Word e PDF.',
        keywords:
          'modello lettera presentazione, lettera motivazionale word, cover letter executive',
        breadcrumb: 'Modelli Lettera'
      },
      'examples-cover': {
        title: 'Esempi di Lettera di Presentazione — Currículo Estratégico',
        description:
          'Esempi efficaci di lettera di presentazione per tecnologia, finanza, leadership e cambio di carriera.',
        keywords:
          'esempi lettera presentazione, lettera motivazionale lavoro, candidatura executive',
        breadcrumb: 'Esempi Lettera'
      },
      editor: {
        title: 'Editor CV A4 in Tempo Reale — Currículo Estratégico',
        description:
          'Modifica il tuo CV A4 con anteprima dal vivo, controllo spaziature, traduzione in 5 lingue ed export immediato in Word (.docx) e PDF.',
        keywords:
          'editor cv online, creare curriculum a4, esportare cv word docx',
        breadcrumb: 'Editor CV'
      },
      raw: {
        title: 'Importa LinkedIn o PDF in CV — Currículo Estratégico',
        description:
          'Trasforma il profilo LinkedIn, vecchi PDF o testo libero in un curriculum executive strutturato e compatibile con i sistemi ATS.',
        keywords:
          'importare linkedin in cv, convertire pdf in curriculum modificabile, generatore cv ia',
        breadcrumb: 'Importa Dati'
      },
      ats: {
        title: 'Radar ATS & Compatibilità Offerta — Currículo Estratégico',
        description:
          'Analizza il tuo CV rispetto all’annuncio di lavoro, individua le parole chiave mancanti e migliora il punteggio ATS su Workday e Taleo.',
        keywords:
          'radar ats, verifica cv ats, compatibilita lavoro cv, analizzatore ats',
        breadcrumb: 'Radar ATS'
      },
      jobs: {
        title: 'Offerte Compatibili con il tuo CV — Currículo Estratégico',
        description:
          'Scopri posizioni remote e internazionali in linea con le competenze del tuo CV e adatta la candidatura in un clic.',
        keywords:
          'offerte lavoro compatibili cv, lavoro remoto internazionale, matching lavoro ia',
        breadcrumb: 'Offerte di Lavoro'
      },
      ai: {
        title: 'Ottimizzatore IA Google XYZ per CV — Currículo Estratégico',
        description:
          'Trasforma le mansioni in risultati misurabili usando verbi d’azione executive e la formula Google XYZ con intelligenza artificiale.',
        keywords:
          'ottimizzatore cv ia, formula google xyz curriculum, migliorare risultati cv',
        breadcrumb: 'Ottimizzatore IA'
      },
      cover: {
        title: 'Generatore Lettera di Presentazione IA — Currículo Estratégico',
        description:
          'Genera lettere di presentazione su misura per ogni annuncio, traducile in 5 lingue ed esportale in Word (.docx) e PDF.',
        keywords:
          'generatore lettera presentazione ia, lettera motivazionale personalizzata, export word',
        breadcrumb: 'Lettera di Presentazione'
      },
      interview: {
        title: 'Simulatore Colloquio STAR con IA — Currículo Estratégico',
        description:
          'Esercitati su domande comportamentali ed executive basate sul tuo CV con feedback strutturato secondo il metodo STAR.',
        keywords:
          'simulatore colloquio ia, metodo star colloquio, preparazione colloquio executive',
        breadcrumb: 'Simulatore Colloquio'
      },
      profile: {
        title: 'Il Mio Account & Preferenze — Currículo Estratégico',
        description:
          'Gestisci i tuoi CV salvati, l’abbonamento e le preferenze di notifica nel tuo account Currículo Estratégico.',
        keywords: 'mio account, curriculum salvati',
        breadcrumb: 'Il Mio Account'
      }
    }
  }
};

export function getRouteConfigForTab(tab: AppTab): SeoRouteConfig {
  return SEO_ROUTE_CONFIGS.find((r) => r.tab === tab) || SEO_ROUTE_CONFIGS[0];
}

export function getPathnameForTab(tab: AppTab): string {
  return getRouteConfigForTab(tab).path;
}

export function getTabFromPathname(pathname: string): AppTab {
  const normalized = pathname === '/' ? '/' : pathname.replace(/\/+$/, '').toLowerCase();
  const match = SEO_ROUTE_CONFIGS.find((r) => r.path === normalized);
  return match ? match.tab : 'home';
}

function upsertMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLinkTag(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export interface ApplyPageSeoParams {
  tab: AppTab;
  language: SiteLanguageCode;
  faqs?: Array<{ q: string; a: string }>;
  brandName?: string;
}

export function applyPageSeo({ tab, language, faqs, brandName }: ApplyPageSeoParams): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const langData = SEO_LOCALIZED_DATA[language] || SEO_LOCALIZED_DATA.pt;
  const routeConfig = getRouteConfigForTab(tab);
  const routeMeta = langData.routes[tab] || langData.routes.home;
  const resolvedBrand = brandName || langData.brand;

  const origin = window.location.origin;
  const canonicalPath = routeConfig.path;
  const canonicalUrl = `${origin}${canonicalPath}`;
  const ogImageUrl = `${origin}/og-preview.jpg`;
  const robotsDirective = routeConfig.indexable
    ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    : 'noindex, nofollow';

  document.documentElement.lang = language;
  document.title = routeMeta.title;

  upsertMetaTag('name', 'description', routeMeta.description);
  upsertMetaTag('name', 'keywords', routeMeta.keywords);
  upsertMetaTag('name', 'robots', robotsDirective);
  upsertMetaTag('name', 'application-name', resolvedBrand);

  // OpenGraph
  upsertMetaTag('property', 'og:type', 'website');
  upsertMetaTag('property', 'og:site_name', resolvedBrand);
  upsertMetaTag('property', 'og:title', routeMeta.title);
  upsertMetaTag('property', 'og:description', routeMeta.description);
  upsertMetaTag('property', 'og:url', canonicalUrl);
  upsertMetaTag('property', 'og:locale', OG_LOCALE_MAP[language] || 'pt_PT');
  upsertMetaTag('property', 'og:image', ogImageUrl);
  upsertMetaTag('property', 'og:image:secure_url', ogImageUrl);
  upsertMetaTag('property', 'og:image:alt', routeMeta.title);

  // Twitter / X
  upsertMetaTag('name', 'twitter:card', 'summary_large_image');
  upsertMetaTag('name', 'twitter:title', routeMeta.title);
  upsertMetaTag('name', 'twitter:description', routeMeta.description);
  upsertMetaTag('name', 'twitter:image', ogImageUrl);
  upsertMetaTag('name', 'twitter:image:alt', routeMeta.title);

  // Canonical & multilingual hreflang alternates
  upsertLinkTag('canonical', canonicalUrl);
  for (const langCode of ALL_SITE_LANGS) {
    const langUrl = langCode === 'pt' ? `${origin}${canonicalPath}` : `${origin}${canonicalPath}?lang=${langCode}`;
    upsertLinkTag('alternate', langUrl, langCode);
  }
  upsertLinkTag('alternate', `${origin}${canonicalPath}`, 'x-default');

  // Schema.org JSON-LD @graph
  const graph: Array<Record<string, unknown>> = [
    {
      '@type': 'Organization',
      '@id': `${origin}/#organization`,
      name: resolvedBrand,
      url: `${origin}/`,
      logo: {
        '@type': 'ImageObject',
        url: ogImageUrl,
        width: 1200,
        height: 630
      }
    },
    {
      '@type': 'WebSite',
      '@id': `${origin}/#website`,
      url: `${origin}/`,
      name: resolvedBrand,
      inLanguage: ALL_SITE_LANGS,
      publisher: { '@id': `${origin}/#organization` }
    },
    {
      '@type': 'WebApplication',
      '@id': `${canonicalUrl}#app`,
      name: resolvedBrand,
      url: canonicalUrl,
      description: routeMeta.description,
      applicationCategory: langData.appCategory,
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript. Modern desktop or mobile browser.',
      inLanguage: language,
      screenshot: ogImageUrl,
      featureList: langData.featureList,
      publisher: { '@id': `${origin}/#organization` },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        lowPrice: '0',
        highPrice: '20',
        offerCount: '3'
      }
    }
  ];

  // BreadcrumbList for current view
  const homeCrumbLabel = langData.routes.home.breadcrumb;
  const breadcrumbItems: Array<Record<string, unknown>> = [
    {
      '@type': 'ListItem',
      position: 1,
      name: homeCrumbLabel,
      item: `${origin}/`
    }
  ];
  if (tab !== 'home') {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: routeMeta.breadcrumb,
      item: canonicalUrl
    });
  }
  graph.push({
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems
  });

  // FAQPage structured data when on landing page and FAQs are provided
  if (tab === 'home' && faqs && faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a
        }
      }))
    });
  }

  let scriptEl = document.head.querySelector<HTMLScriptElement>('script#seo-jsonld-graph');
  if (!scriptEl) {
    // Replace any legacy static ld+json scripts so there are no duplicates
    document.head.querySelectorAll('script[type="application/ld+json"]').forEach((el) => el.remove());
    scriptEl = document.createElement('script');
    scriptEl.id = 'seo-jsonld-graph';
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }
  scriptEl.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph
  });
}
