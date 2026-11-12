import { LanguageCode } from '../context/LanguageContext';
import { TemplateStyle } from '../types/cv';

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

export function getResolvedSectionTitles(lang: LanguageCode, templateStyle: TemplateStyle) {
  const cur = SECTION_TITLES_BY_LANG[lang] || SECTION_TITLES_BY_LANG.pt;
  const isAcademic = templateStyle === 'academic_lattes';
  const isClassic = templateStyle === 'un_classic';

  return {
    summary: isAcademic ? cur.summaryAcademic : isClassic ? cur.summaryClassic : cur.summary,
    competencies: isAcademic ? cur.competenciesAcademic : isClassic ? cur.competenciesClassic : cur.competencies,
    experiences: isAcademic ? cur.experiencesAcademic : isClassic ? cur.experiencesClassic : cur.experiences,
    educations: isAcademic ? cur.educationsAcademic : cur.educations,
    trainings: isAcademic ? cur.trainingsAcademic : cur.trainings,
    languages: isAcademic ? cur.languagesAcademic : cur.languages,
    references: isAcademic ? cur.referencesAcademic : cur.references,
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
