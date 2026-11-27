import { LanguageCode } from '../context/LanguageContext';
import { CVData, CVSectionKey, TemplateStyle } from '../types/cv';
import { DEFAULT_SECTION_ORDER } from './executivePhrasing';
import { getTemplateById } from '../data/templateCatalog';

export interface CVLocaleStrings {
  summary: string;
  summaryAcademic: string;
  summaryClassic: string;
  competencies: string;
  competenciesAcademic: string;
  competenciesClassic: string;
  experiences: string;
  experiencesAcademic: string;
  experiencesClassic: string;
  educations: string;
  educationsAcademic: string;
  trainings: string;
  trainingsAcademic: string;
  languages: string;
  languagesAcademic: string;
  references: string;
  referencesAcademic: string;
  tableRefName: string;
  tableRefInstitution: string;
  tableRefContact: string;
  tableRefNameAcademic: string;
  tableRefInstitutionAcademic: string;
  tableRefContactAcademic: string;
  techStack: string;
  cefrLevel: string;
  creativeTag: string;
  contactsLabel: string;
  locationLabel: string;
  phoneLabel: string;
  emailLabel: string;
  websiteLabel: string;
  skillsShort: string;
  languagesShort: string;
  creativeFooter: string;
  europassOfficial: string;
  formalPhoto: string;
  pageBreakEstimate: string;
  translatingLabel: string;
  europassLangCol: string;
  europassCefrCol: string;
  donorLabel: string;
  contactPrefix: string;
}

export const SECTION_TITLES_BY_LANG: Record<LanguageCode, CVLocaleStrings> = {
  pt: {
    summary: 'Resumo Profissional',
    summaryAcademic: 'Resumo Académico & Linhas de Investigação',
    summaryClassic: 'Resumo Executivo & Perfil Diplomático',
    competencies: 'Competências & Habilidades Chave',
    competenciesAcademic: 'Áreas de Atuação & Metodologias',
    competenciesClassic: 'Competências Centrais & Expertise Multilateral',
    experiences: 'Experiência Profissional',
    experiencesAcademic: 'Atuação Profissional, Pesquisa & Docência',
    experiencesClassic: 'Experiência Profissional & Missões',
    educations: 'Formação Académica',
    educationsAcademic: 'Formação Académica & Titulações',
    trainings: 'Certificações & Formação Especializada',
    trainingsAcademic: 'Produção Científica, Certificações & Cursos',
    languages: 'Idiomas & Proficiência',
    languagesAcademic: 'Idiomas & Proficiência Académica',
    references: 'Referências Profissionais',
    referencesAcademic: 'Referências Académicas & Bancas Avaliadoras',
    tableRefName: 'Nome',
    tableRefInstitution: 'Instituição & Cargo',
    tableRefContact: 'Contacto',
    tableRefNameAcademic: 'Nome do Avaliador / Pesquisador',
    tableRefInstitutionAcademic: 'Instituição & Departamento',
    tableRefContactAcademic: 'Contacto Institucional',
    techStack: 'Stack Tecnológico & Ferramentas',
    cefrLevel: 'Quadro Europeu CEFR',
    creativeTag: 'Criativo & Inovação',
    contactsLabel: 'Contactos & Redes',
    locationLabel: 'Localização',
    phoneLabel: 'Telefone / WhatsApp',
    emailLabel: 'E-mail',
    websiteLabel: 'Website / Portfólio',
    skillsShort: 'Competências & Tools',
    languagesShort: 'Idiomas',
    creativeFooter: 'Modelo Criativo Split · 2026',
    europassOfficial: 'Padrão Oficial da União Europeia',
    formalPhoto: 'Foto Formal',
    pageBreakEstimate: 'Página 1 (A4) · Quebra Estimada',
    translatingLabel: 'A traduzir...',
    europassLangCol: 'Língua',
    europassCefrCol: 'Nível CEFR / Proficiência',
    donorLabel: 'Projeto / Entidade',
    contactPrefix: 'Contacto'
  },
  en: {
    summary: 'Executive Summary',
    summaryAcademic: 'Academic Summary & Research Lines',
    summaryClassic: 'Executive Summary & Diplomatic Profile',
    competencies: 'Core Competencies & Key Skills',
    competenciesAcademic: 'Research Fields & Methodologies',
    competenciesClassic: 'Core Competencies & Multilateral Expertise',
    experiences: 'Professional Experience',
    experiencesAcademic: 'Professional, Research & Teaching Experience',
    experiencesClassic: 'Professional Experience & Missions',
    educations: 'Education & Qualifications',
    educationsAcademic: 'Academic Qualifications & Degrees',
    trainings: 'Certifications & Specialized Training',
    trainingsAcademic: 'Scientific Production, Certifications & Courses',
    languages: 'Languages & Proficiency',
    languagesAcademic: 'Academic Languages & Proficiency',
    references: 'Professional References',
    referencesAcademic: 'Academic References & Examination Boards',
    tableRefName: 'Name',
    tableRefInstitution: 'Institution & Position',
    tableRefContact: 'Contact',
    tableRefNameAcademic: 'Evaluator / Researcher',
    tableRefInstitutionAcademic: 'Institution & Department',
    tableRefContactAcademic: 'Institutional Contact',
    techStack: 'Technical Stack & Tools',
    cefrLevel: 'CEFR Framework',
    creativeTag: 'Creative & Innovation',
    contactsLabel: 'Contact & Links',
    locationLabel: 'Location',
    phoneLabel: 'Phone / WhatsApp',
    emailLabel: 'Email',
    websiteLabel: 'Website / Portfolio',
    skillsShort: 'Core Skills & Tools',
    languagesShort: 'Languages',
    creativeFooter: 'Creative Split Edition · 2026',
    europassOfficial: 'Official European Union Standard',
    formalPhoto: 'Formal Photo',
    pageBreakEstimate: 'Page 1 (A4) · Estimated Break',
    translatingLabel: 'Translating...',
    europassLangCol: 'Language',
    europassCefrCol: 'CEFR Level / Proficiency',
    donorLabel: 'Program / Project',
    contactPrefix: 'Contact'
  },
  es: {
    summary: 'Resumen Ejecutivo',
    summaryAcademic: 'Resumen Académico & Líneas de Investigación',
    summaryClassic: 'Resumen Ejecutivo & Perfil Diplomático',
    competencies: 'Competencias Clave & Habilidades',
    competenciesAcademic: 'Áreas de Actuación & Metodologías',
    competenciesClassic: 'Competencias Centrales & Experiencia Multilateral',
    experiences: 'Experiencia Profesional',
    experiencesAcademic: 'Actuación Profesional, Investigación & Docencia',
    experiencesClassic: 'Experiencia Profesional & Misiones',
    educations: 'Educación & Formación Académica',
    educationsAcademic: 'Titulaciones & Grados Académicos',
    trainings: 'Certificaciones & Formación Especializada',
    trainingsAcademic: 'Producción Científica, Certificaciones & Cursos',
    languages: 'Idiomas & Nivel de Dominio',
    languagesAcademic: 'Idiomas & Competencia Académica',
    references: 'Referencias Profesionales',
    referencesAcademic: 'Referencias Académicas & Comités de Evaluación',
    tableRefName: 'Nombre',
    tableRefInstitution: 'Institución & Cargo',
    tableRefContact: 'Contacto',
    tableRefNameAcademic: 'Evaluador / Investigador',
    tableRefInstitutionAcademic: 'Institución & Departamento',
    tableRefContactAcademic: 'Contacto Institucional',
    techStack: 'Stack Tecnológico & Herramientas',
    cefrLevel: 'Marco Europeo MCER',
    creativeTag: 'Creativo & Innovación',
    contactsLabel: 'Contacto & Redes',
    locationLabel: 'Ubicación',
    phoneLabel: 'Teléfono / WhatsApp',
    emailLabel: 'Correo Electrónico',
    websiteLabel: 'Sitio Web / Portafolio',
    skillsShort: 'Competencias & Tools',
    languagesShort: 'Idiomas',
    creativeFooter: 'Modelo Creativo Split · 2026',
    europassOfficial: 'Estándar Oficial de la Unión Europea',
    formalPhoto: 'Foto Formal',
    pageBreakEstimate: 'Página 1 (A4) · Salto Estimado',
    translatingLabel: 'Traduciendo...',
    europassLangCol: 'Idioma',
    europassCefrCol: 'Nivel MCER / Dominio',
    donorLabel: 'Proyecto / Programa',
    contactPrefix: 'Contacto'
  },
  fr: {
    summary: 'Profil Professionnel & Synthèse',
    summaryAcademic: 'Synthèse Académique & Axes de Recherche',
    summaryClassic: 'Profil Exécutif & Diplomatique',
    competencies: 'Compétences Clés & Expertise',
    competenciesAcademic: 'Domaines d’Intervention & Méthodologies',
    competenciesClassic: 'Compétences Centrales & Expertise Multilatérale',
    experiences: 'Expérience Professionnelle',
    experiencesAcademic: 'Expérience Professionnelle, Recherche & Enseignement',
    experiencesClassic: 'Expérience Professionnelle & Missions',
    educations: 'Formation & Diplômes',
    educationsAcademic: 'Diplômes & Titres Académiques',
    trainings: 'Certifications & Formations Spécialisées',
    trainingsAcademic: 'Production Scientifique, Certifications & Formations',
    languages: 'Langues & Maîtrise',
    languagesAcademic: 'Langues Académiques & Maîtrise',
    references: 'Références Professionnelles',
    referencesAcademic: 'Références Académiques & Jurys d’Évaluation',
    tableRefName: 'Nom',
    tableRefInstitution: 'Institution & Poste',
    tableRefContact: 'Contact',
    tableRefNameAcademic: 'Évaluateur / Chercheur',
    tableRefInstitutionAcademic: 'Institution & Département',
    tableRefContactAcademic: 'Contact Institutionnel',
    techStack: 'Stack Technique & Outils',
    cefrLevel: 'Cadre Européen CECRL',
    creativeTag: 'Créatif & Innovation',
    contactsLabel: 'Coordonnées & Réseaux',
    locationLabel: 'Localisation',
    phoneLabel: 'Téléphone / WhatsApp',
    emailLabel: 'E-mail',
    websiteLabel: 'Site Web / Portfolio',
    skillsShort: 'Compétences & Outils',
    languagesShort: 'Langues',
    creativeFooter: 'Modèle Créatif Split · 2026',
    europassOfficial: 'Norme Officielle de l’Union Européenne',
    formalPhoto: 'Photo Formelle',
    pageBreakEstimate: 'Page 1 (A4) · Saut Estimé',
    translatingLabel: 'Traduction...',
    europassLangCol: 'Langue',
    europassCefrCol: 'Niveau CECRL / Maîtrise',
    donorLabel: 'Projet / Programme',
    contactPrefix: 'Contact'
  },
  de: {
    summary: 'Exekutiv-Zusammenfassung',
    summaryAcademic: 'Akademische Zusammenfassung & Forschungsschwerpunkte',
    summaryClassic: 'Führungsprofil & Diplomatischer Werdegang',
    competencies: 'Kernkompetenzen & Schlüsselqualifikationen',
    competenciesAcademic: 'Fachgebiete & Methodik',
    competenciesClassic: 'Kernkompetenzen & Multilaterale Expertise',
    experiences: 'Berufserfahrung',
    experiencesAcademic: 'Berufspraxis, Forschung & Lehre',
    experiencesClassic: 'Berufserfahrung & Einsätze',
    educations: 'Ausbildung & Studium',
    educationsAcademic: 'Akademische Abschlüsse & Grade',
    trainings: 'Zertifikate & Weiterbildung',
    trainingsAcademic: 'Wissenschaftliche Publikationen & Zertifikate',
    languages: 'Sprachen & Kenntnisse',
    languagesAcademic: 'Wissenschaftliche Sprachen & Niveau',
    references: 'Berufliche Referenzen',
    referencesAcademic: 'Akademische Referenzen & Prüfungskommissionen',
    tableRefName: 'Name',
    tableRefInstitution: 'Institution & Position',
    tableRefContact: 'Kontakt',
    tableRefNameAcademic: 'Gutachter / Forscher',
    tableRefInstitutionAcademic: 'Institution & Fachbereich',
    tableRefContactAcademic: 'Institutioneller Kontakt',
    techStack: 'Technologie-Stack & Werkzeuge',
    cefrLevel: 'Gemeinsamer Europäischer Referenzrahmen (GER)',
    creativeTag: 'Kreativ & Innovation',
    contactsLabel: 'Kontakt & Links',
    locationLabel: 'Standort',
    phoneLabel: 'Telefon / WhatsApp',
    emailLabel: 'E-Mail',
    websiteLabel: 'Website / Portfolio',
    skillsShort: 'Kompetenzen & Tools',
    languagesShort: 'Sprachen',
    creativeFooter: 'Kreativ-Split-Vorlage · 2026',
    europassOfficial: 'Offizieller EU-Standard',
    formalPhoto: 'Bewerbungsfoto',
    pageBreakEstimate: 'Seite 1 (A4) · Geschätzter Umbruch',
    translatingLabel: 'Übersetze...',
    europassLangCol: 'Sprache',
    europassCefrCol: 'GER-Niveau / Kenntnisse',
    donorLabel: 'Projekt / Programm',
    contactPrefix: 'Kontakt'
  }
};

function getAdminLocaleOverride(lang: LanguageCode): Partial<Record<
  'sectionSummary' | 'sectionExperiences' | 'sectionEducations' | 'sectionCompetencies' | 'sectionLanguages' | 'sectionTrainings' | 'sectionReferences',
  string
>> | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('curriculopro_locales');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.find((l: any) => l?.languageCode === lang) || null;
  } catch {
    return null;
  }
}

export interface ResolvedTemplateStyleProfile {
  isClassic: boolean;
  isHarvard: boolean;
  isAts: boolean;
  isStrictMonoAts: boolean;
  isEuropass: boolean;
  europassVariant?: 'classic' | 'banner' | 'sidebar' | 'framed';
  isCreative: boolean;
  isTech: boolean;
  isMinimalist: boolean;
  isAcademic: boolean;
  isAcademicLattes: boolean;
  isModern: boolean;
  isFinance: boolean;
  isBoard: boolean;
  isProduct: boolean;
  isEditorial: boolean;
  isBlueprint: boolean;
  isSerifFamily: boolean;
  supportsPhoto: boolean;
}

export function resolveTemplateStyleProfile(style: TemplateStyle): ResolvedTemplateStyleProfile {
  const isClassic =
    style === 'un_classic' ||
    style === 'un_agency_cv' ||
    style === 'ngo_humanitarian' ||
    style === 'government_public';
  const isHarvard =
    style === 'executive_harvard' ||
    style === 'consulting_style' ||
    style === 'executive_resume';
  const isStrictMonoAts = style === 'ats_compact';
  const isAts =
    style === 'ats_compact' ||
    style === 'ats_professional' ||
    style === 'reverse_chronological';
  const europassVariant: 'classic' | 'banner' | 'sidebar' | 'framed' | undefined =
    style === 'european_europass'
      ? 'classic'
      : style === 'europass_banner'
      ? 'banner'
      : style === 'europass_sidebar'
      ? 'sidebar'
      : style === 'europass_framed'
      ? 'framed'
      : undefined;
  const isEuropass = Boolean(europassVariant);
  const isCreative = style === 'creative_split' || style === 'creative_resume';
  const isTech =
    style === 'tech_modern' ||
    style === 'tech_professional' ||
    style === 'data_science_ai';
  const isMinimalist =
    style === 'hybrid_minimalist' ||
    style === 'minimalist_professional' ||
    style === 'skills_functional' ||
    style === 'career_change_cv';
  const isAcademicLattes = style === 'academic_lattes';
  const isAcademic =
    style === 'academic_lattes' ||
    style === 'academic_cv' ||
    style === 'research_cv';
  const isModern =
    style === 'european_modern' ||
    style === 'modern_professional' ||
    style === 'international_standard' ||
    style === 'graduate_resume' ||
    style === 'student_cv' ||
    style === 'healthcare_professional' ||
    style === 'sales_professional';
  const isFinance = style === 'finance_wallstreet' || style === 'finance_banking';
  const isBoard = style === 'executive_board';
  const isProduct =
    style === 'product_strategy' ||
    style === 'product_manager' ||
    style === 'business_analyst' ||
    style === 'hybrid_combination' ||
    style === 'project_based' ||
    style === 'freelancer_consultant';
  const isEditorial = style === 'modern_editorial' || style === 'marketing_professional';
  const isBlueprint = style === 'engineering_blueprint' || style === 'engineering_resume';
  const isSerifFamily = isClassic || isHarvard || isAcademic || isFinance || isBoard;

  const meta = getTemplateById(style);
  const supportsPhoto = meta.photoRule !== 'strictly_forbidden';

  return {
    isClassic,
    isHarvard,
    isAts,
    isStrictMonoAts,
    isEuropass,
    europassVariant,
    isCreative,
    isTech,
    isMinimalist,
    isAcademic,
    isAcademicLattes,
    isModern,
    isFinance,
    isBoard,
    isProduct,
    isEditorial,
    isBlueprint,
    isSerifFamily,
    supportsPhoto
  };
}

export function resolveEffectiveSectionOrder(cv: CVData): CVSectionKey[] {
  const customOrder = cv.sectionOrder && cv.sectionOrder.length > 0 ? cv.sectionOrder : null;
  const isUsingDefaultOrder =
    !customOrder ||
    (customOrder.length === DEFAULT_SECTION_ORDER.length &&
      customOrder.every((k, idx) => k === DEFAULT_SECTION_ORDER[idx]));

  if (!isUsingDefaultOrder && customOrder) {
    return customOrder;
  }

  switch (cv.templateStyle) {
    case 'reverse_chronological':
    case 'executive_resume':
    case 'consulting_style':
    case 'finance_banking':
    case 'finance_wallstreet':
    case 'sales_professional':
      return ['summary', 'experiences', 'competencies', 'educations', 'trainings', 'languages', 'references'];
    case 'graduate_resume':
    case 'student_cv':
    case 'academic_cv':
    case 'research_cv':
    case 'academic_lattes':
      return ['summary', 'educations', 'competencies', 'experiences', 'trainings', 'languages', 'references'];
    case 'career_change_cv':
      return ['summary', 'competencies', 'trainings', 'educations', 'experiences', 'languages', 'references'];
    case 'skills_functional':
      return ['summary', 'competencies', 'educations', 'trainings', 'experiences', 'languages', 'references'];
    default:
      return DEFAULT_SECTION_ORDER;
  }
}

export function getResolvedSectionTitles(lang: LanguageCode, templateStyle: TemplateStyle) {
  const cur = SECTION_TITLES_BY_LANG[lang] || SECTION_TITLES_BY_LANG.en;
  const adminOverride = getAdminLocaleOverride(lang);
  const isAcademic =
    templateStyle === 'academic_lattes' ||
    templateStyle === 'academic_cv' ||
    templateStyle === 'research_cv';
  const isClassic =
    templateStyle === 'un_classic' ||
    templateStyle === 'un_agency_cv' ||
    templateStyle === 'ngo_humanitarian';

  return {
    summary: adminOverride?.sectionSummary || (isAcademic ? cur.summaryAcademic : isClassic ? cur.summaryClassic : cur.summary),
    competencies: adminOverride?.sectionCompetencies || (isAcademic ? cur.competenciesAcademic : isClassic ? cur.competenciesClassic : cur.competencies),
    experiences: adminOverride?.sectionExperiences || (isAcademic ? cur.experiencesAcademic : isClassic ? cur.experiencesClassic : cur.experiences),
    educations: adminOverride?.sectionEducations || (isAcademic ? cur.educationsAcademic : cur.educations),
    trainings: adminOverride?.sectionTrainings || (isAcademic ? cur.trainingsAcademic : cur.trainings),
    languages: adminOverride?.sectionLanguages || (isAcademic ? cur.languagesAcademic : cur.languages),
    references: adminOverride?.sectionReferences || (isAcademic ? cur.referencesAcademic : cur.references),
    tableRefName: isAcademic ? cur.tableRefNameAcademic : cur.tableRefName,
    tableRefInstitution: isAcademic ? cur.tableRefInstitutionAcademic : cur.tableRefInstitution,
    tableRefContact: isAcademic ? cur.tableRefContactAcademic : cur.tableRefContact,
    techStack: cur.techStack,
    cefrLevel: cur.cefrLevel,
    chrome: cur
  };
}

export const COVER_CHROME_LABELS: Record<LanguageCode, {
  toolbarTitle: string;
  toolbarSub: string;
  footerLabel: string;
  standardLabel: string;
  translating: string;
}> = {
  pt: {
    toolbarTitle: 'Carta de Apresentação Executiva',
    toolbarSub: 'Formato Padrão A4 Oficial',
    footerLabel: 'Carta de Apresentação Estratégica',
    standardLabel: 'Padrão Corporativo & ATS',
    translating: 'A traduzir...'
  },
  en: {
    toolbarTitle: 'Executive Cover Letter',
    toolbarSub: 'Official A4 Format',
    footerLabel: 'Strategic Cover Letter',
    standardLabel: 'Corporate & ATS Standard',
    translating: 'Translating...'
  },
  es: {
    toolbarTitle: 'Carta de Presentación Ejecutiva',
    toolbarSub: 'Formato Estándar A4 Oficial',
    footerLabel: 'Carta de Presentación Estratégica',
    standardLabel: 'Estándar Corporativo & ATS',
    translating: 'Traduciendo...'
  },
  fr: {
    toolbarTitle: 'Lettre de Motivation Exécutive',
    toolbarSub: 'Format Officiel A4',
    footerLabel: 'Lettre de Motivation Stratégique',
    standardLabel: 'Standard Corporatif & ATS',
    translating: 'Traduction...'
  },
  de: {
    toolbarTitle: 'Exekutives Anschreiben',
    toolbarSub: 'Offizielles A4-Format',
    footerLabel: 'Strategisches Anschreiben',
    standardLabel: 'Unternehmens- & ATS-Standard',
    translating: 'Übersetze...'
  }
};

export function normalizeHex(hex?: string, fallback = '0F172A'): string {
  const raw = (hex || fallback).trim().replace(/^#/, '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw.padEnd(6, '0').slice(0, 6);
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return fallback.replace(/^#/, '').toUpperCase();
  }
  return full.toUpperCase();
}

export function isLightHexColor(hex?: string): boolean {
  const full = normalizeHex(hex, '0F172A');
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance > 0.26;
}

function blendHex(hexA: string, hexB: string, ratioB: number): string {
  const a = normalizeHex(hexA);
  const b = normalizeHex(hexB);
  const ch = (idx: number) => {
    const va = parseInt(a.slice(idx, idx + 2), 16);
    const vb = parseInt(b.slice(idx, idx + 2), 16);
    return Math.min(255, Math.max(0, Math.round(va * (1 - ratioB) + vb * ratioB)))
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
  };
  return `${ch(0)}${ch(2)}${ch(4)}`;
}

export interface SurfaceContrastPalette {
  isLight: boolean;
  bgHex: string;
  text: string;
  textHex: string;
  mutedText: string;
  mutedHex: string;
  subtleText: string;
  subtleHex: string;
  borderColor: string;
  borderHex: string;
  cardBg: string;
  cardHex: string;
}

export function getSurfaceContrastPalette(bgColor?: string): SurfaceContrastPalette {
  const bgHex = normalizeHex(bgColor, '0F172A');
  const isLight = isLightHexColor(bgHex);
  if (isLight) {
    return {
      isLight: true,
      bgHex,
      text: '#0f172a',
      textHex: '0F172A',
      mutedText: '#334155',
      mutedHex: '334155',
      subtleText: '#475569',
      subtleHex: '475569',
      borderColor: 'rgba(15, 23, 42, 0.18)',
      borderHex: blendHex(bgHex, '0F172A', 0.18),
      cardBg: 'rgba(15, 23, 42, 0.07)',
      cardHex: blendHex(bgHex, '0F172A', 0.07)
    };
  }
  return {
    isLight: false,
    bgHex,
    text: '#ffffff',
    textHex: 'FFFFFF',
    mutedText: 'rgba(255, 255, 255, 0.90)',
    mutedHex: 'E2E8F0',
    subtleText: 'rgba(255, 255, 255, 0.72)',
    subtleHex: 'CBD5E1',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderHex: blendHex(bgHex, 'FFFFFF', 0.28),
    cardBg: 'rgba(255, 255, 255, 0.12)',
    cardHex: blendHex(bgHex, 'FFFFFF', 0.12)
  };
}

export function extractCefrGrade(level: string): string {
  const explicit = level.match(/\b(C2|C1|B2|B1|A2|A1)\b/i);
  if (explicit) return explicit[1].toUpperCase();
  const lower = level.toLowerCase();
  if (/nativ|matern|mother|fluen|biling|proficien|muttersprach/.test(lower)) return 'C2';
  if (/avan[cç]|advanc|superior|verhandlungssicher|courant/.test(lower)) return 'C1';
  if (/interm|indep|m[eé]di|flie[ßs]end/.test(lower)) return 'B2';
  if (/b[aá]sic|elem|inici|grund/.test(lower)) return 'A2';
  return 'B2';
}

export const EUROPASS_UI_LABELS: Record<
  LanguageCode,
  {
    position: string;
    aboutMyself: string;
    contact: string;
    understanding: string;
    listening: string;
    reading: string;
    speaking: string;
    spokenProd: string;
    spokenInter: string;
    writing: string;
    cefrNote: string;
    address: string;
  }
> = {
  pt: {
    position: 'Cargo Pretendido',
    aboutMyself: 'Sobre Mim',
    contact: 'Contacto',
    understanding: 'Compreensão',
    listening: 'Oral',
    reading: 'Leitura',
    speaking: 'Expressão Oral',
    spokenProd: 'Produção oral',
    spokenInter: 'Interação oral',
    writing: 'Escrita',
    cefrNote: 'Níveis: A1 e A2: Utilizador básico · B1 e B2: Utilizador independente · C1 e C2: Utilizador proficiente',
    address: 'Morada'
  },
  en: {
    position: 'Position',
    aboutMyself: 'About Myself',
    contact: 'Contact',
    understanding: 'Understanding',
    listening: 'Listening',
    reading: 'Reading',
    speaking: 'Speaking',
    spokenProd: 'Spoken production',
    spokenInter: 'Spoken interaction',
    writing: 'Writing',
    cefrNote: 'Levels: A1 and A2: Basic user · B1 and B2: Independent user · C1 and C2: Proficient user',
    address: 'Address'
  },
  es: {
    position: 'Puesto Solicitado',
    aboutMyself: 'Sobre Mí',
    contact: 'Contacto',
    understanding: 'Comprensión',
    listening: 'Auditiva',
    reading: 'Lectura',
    speaking: 'Expresión Oral',
    spokenProd: 'Producción oral',
    spokenInter: 'Interacción oral',
    writing: 'Expresión escrita',
    cefrNote: 'Niveles: A1 y A2: Usuario básico · B1 y B2: Usuario independiente · C1 y C2: Usuario competente',
    address: 'Dirección'
  },
  fr: {
    position: 'Poste Recherché',
    aboutMyself: 'À Propos de Moi',
    contact: 'Contact',
    understanding: 'Compréhension',
    listening: 'Écouter',
    reading: 'Lire',
    speaking: 'Parler',
    spokenProd: 'Production orale',
    spokenInter: 'Interaction orale',
    writing: 'Écrire',
    cefrNote: 'Niveaux : A1 et A2 : Utilisateur élémentaire · B1 et B2 : Utilisateur indépendant · C1 et C2 : Utilisateur expérimenté',
    address: 'Adresse'
  },
  de: {
    position: 'Angestrebte Position',
    aboutMyself: 'Über Mich',
    contact: 'Kontakt',
    understanding: 'Verstehen',
    listening: 'Hören',
    reading: 'Lesen',
    speaking: 'Sprechen',
    spokenProd: 'Zusammenhängendes Sprechen',
    spokenInter: 'An Gesprächen teilnehmen',
    writing: 'Schreiben',
    cefrNote: 'Stufen: A1 und A2: Elementare Sprachverwendung · B1 und B2: Selbstständige Sprachverwendung · C1 und C2: Kompetente Sprachverwendung',
    address: 'Anschrift'
  }
};

