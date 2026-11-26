import { CVSectionKey, TemplateStyle } from '../types/cv';
import { SiteLanguageCode } from '../i18n/siteTranslations';
import { LanguageCode } from '../context/LanguageContext';

export type OnboardingGoalId =
  | 'quick_job'
  | 'un_ngos'
  | 'tech'
  | 'government'
  | 'europe'
  | 'canada'
  | 'usa';

export interface OnboardingGoalPreset {
  id: OnboardingGoalId;
  templateStyle: TemplateStyle;
  templateName: string;
  accentColor: string;
  showPhoto: boolean;
  suggestedLanguage: LanguageCode | 'keep';
  sectionOrder: CVSectionKey[];
  labels: Record<SiteLanguageCode, { title: string; subtitle: string; reason: string; structureNote: string }>;
}

export const ONBOARDING_GOAL_STORAGE_KEY = 'cv_onboarding_goal_v1';

export const ONBOARDING_GOALS: OnboardingGoalPreset[] = [
  {
    id: 'quick_job',
    templateStyle: 'ats_professional',
    templateName: 'ATS Professional',
    accentColor: '#0f172a',
    showPhoto: false,
    suggestedLanguage: 'keep',
    sectionOrder: ['summary', 'competencies', 'experiences', 'educations', 'trainings', 'languages', 'references'],
    labels: {
      pt: {
        title: 'Conseguir emprego rápido',
        subtitle: 'Passar filtros automáticos e chamar atenção dos RH',
        reason: 'Compatível com ONU, WFP, Workday e empresas internacionais — leitura ATS 100%.',
        structureNote: 'Resumo direto · Competências · Experiências · Educação'
      },
      en: {
        title: 'Get a job fast',
        subtitle: 'Pass automated ATS screening and stand out to recruiters',
        reason: 'Compatible with UN, WFP, Workday, and global employers — 100% ATS readability.',
        structureNote: 'Sharp Summary · Core Skills · Experience · Education'
      },
      es: {
        title: 'Conseguir empleo rápido',
        subtitle: 'Superar filtros ATS y destacar ante reclutadores',
        reason: 'Compatible con ONU, WFP, Workday y empresas internacionales — lectura ATS 100%.',
        structureNote: 'Resumen directo · Competencias · Experiencia · Educación'
      },
      fr: {
        title: 'Trouver un emploi vite',
        subtitle: 'Passer les filtres ATS et convaincre les recruteurs',
        reason: 'Compatible ONU, WFP, Workday et grands groupes — lisibilité ATS 100%.',
        structureNote: 'Profil · Compétences · Expériences · Formation'
      },
      de: {
        title: 'Schnell einen Job finden',
        subtitle: 'ATS-Filter bestehen und Recruiter direkt überzeugen',
        reason: 'Kompatibel mit UN, WFP, Workday und internationalen Unternehmen — 100% ATS.',
        structureNote: 'Kurzprofil · Kompetenzen · Berufserfahrung · Ausbildung'
      },
      it: {
        title: 'Trovare lavoro in fretta',
        subtitle: 'Superare i filtri ATS e convincere i recruiter',
        reason: 'Compatibile con ONU, WFP, Workday e aziende internazionali — lettura ATS 100%.',
        structureNote: 'Profilo · Competenze · Esperienze · Istruzione'
      }
    }
  },
  {
    id: 'un_ngos',
    templateStyle: 'un_agency_cv',
    templateName: 'UN Agency CV',
    accentColor: '#0369a1',
    showPhoto: false,
    suggestedLanguage: 'en',
    sectionOrder: ['summary', 'experiences', 'competencies', 'educations', 'languages', 'trainings', 'references'],
    labels: {
      pt: {
        title: 'ONU & ONGs',
        subtitle: 'Agências das Nações Unidas, WFP, PNUD e setor humanitário',
        reason: 'Compatível com ONU, WFP e organismos internacionais (doadores, projetos e idiomas).',
        structureNote: 'Perfil · Experiência (com Doador/Projeto) · Idiomas · Educação'
      },
      en: {
        title: 'UN & NGOs',
        subtitle: 'United Nations agencies, WFP, UNDP & humanitarian orgs',
        reason: 'Built for UN, WFP, and international agencies with donor/project & language clarity.',
        structureNote: 'Summary · Experience (with Donor/Project) · Languages · Education'
      },
      es: {
        title: 'ONU & ONGs',
        subtitle: 'Naciones Unidas, PMA, PNUD y sector humanitario',
        reason: 'Compatible con ONU, WFP y organismos internacionales.',
        structureNote: 'Perfil · Experiencia (Donante/Proyecto) · Idiomas · Educación'
      },
      fr: {
        title: 'ONU & ONG',
        subtitle: 'Nations Unies, PAM, PNUD et secteur humanitaire',
        reason: 'Adapté aux standards ONU, WFP et organisations internationales.',
        structureNote: 'Profil · Expériences (Bailleur/Projet) · Langues · Formation'
      },
      de: {
        title: 'UN & NGOs',
        subtitle: 'Vereinte Nationen, WFP, UNDP & humanitäre Organisationen',
        reason: 'Optimiert für UN, WFP und internationale Organisationen.',
        structureNote: 'Profil · Erfahrung (Projekt/Geber) · Sprachen · Ausbildung'
      },
      it: {
        title: 'ONU & ONG',
        subtitle: 'Nazioni Unite, WFP, UNDP e organizzazioni umanitarie',
        reason: 'Compatibile con ONU, WFP e agenzie internazionali.',
        structureNote: 'Profilo · Esperienze (Donatore/Progetto) · Lingue · Istruzione'
      }
    }
  },
  {
    id: 'tech',
    templateStyle: 'tech_professional',
    templateName: 'Tech Professional',
    accentColor: '#0f766e',
    showPhoto: false,
    suggestedLanguage: 'en',
    sectionOrder: ['summary', 'competencies', 'experiences', 'educations', 'trainings', 'languages', 'references'],
    labels: {
      pt: {
        title: 'Tecnologia',
        subtitle: 'Engenharia de Software, Dados, IA, Produto & TI',
        reason: 'Destaca stack técnico, arquitetura, entregas quantificadas e leitura limpa para vagas tech.',
        structureNote: 'Resumo · Stack & Competências · Experiência Técnica · Formação'
      },
      en: {
        title: 'Technology',
        subtitle: 'Software Engineering, Data, AI, Product & IT',
        reason: 'Highlights tech stack, measurable shipping impact, and clean ATS parsing for tech roles.',
        structureNote: 'Summary · Tech Stack & Skills · Experience · Education'
      },
      es: {
        title: 'Tecnología',
        subtitle: 'Ingeniería de Software, Datos, IA, Producto y TI',
        reason: 'Destaca stack técnico, impacto medible y lectura ATS limpia para roles tech.',
        structureNote: 'Resumen · Stack Técnico · Experiencia · Educación'
      },
      fr: {
        title: 'Technologie',
        subtitle: 'Développement, Data, IA, Produit & IT',
        reason: 'Met en avant le stack technique, les livrables mesurables et la compatibilité ATS.',
        structureNote: 'Profil · Stack & Compétences · Expériences · Formation'
      },
      de: {
        title: 'Technologie',
        subtitle: 'Software Engineering, Data, KI, Produkt & IT',
        reason: 'Hebt Tech-Stack, messbare Ergebnisse und sauberes ATS-Parsing hervor.',
        structureNote: 'Profil · Tech-Stack · Erfahrung · Ausbildung'
      },
      it: {
        title: 'Tecnologia',
        subtitle: 'Software Engineering, Dati, AI, Prodotto & IT',
        reason: 'Evidenzia stack tecnico, risultati misurabili e lettura ATS pulita.',
        structureNote: 'Profilo · Stack Tecnico · Esperienze · Istruzione'
      }
    }
  },
  {
    id: 'government',
    templateStyle: 'government_public',
    templateName: 'Government / Public Sector',
    accentColor: '#1e3a8a',
    showPhoto: false,
    suggestedLanguage: 'keep',
    sectionOrder: ['summary', 'experiences', 'educations', 'trainings', 'competencies', 'languages', 'references'],
    labels: {
      pt: {
        title: 'Governo',
        subtitle: 'Setor público, concursos, ministérios e instituições',
        reason: 'Estrutura formal, cronológica e transparente exigida por órgãos e concursos públicos.',
        structureNote: 'Resumo · Histórico de Cargos · Formação · Certificações'
      },
      en: {
        title: 'Government',
        subtitle: 'Public sector, civil service & institutional roles',
        reason: 'Formal chronological structure built for public agencies and government tenders.',
        structureNote: 'Summary · Service History · Education · Certifications'
      },
      es: {
        title: 'Gobierno',
        subtitle: 'Sector público, oposiciones e instituciones',
        reason: 'Estructura formal, cronológica y clara para organismos públicos.',
        structureNote: 'Perfil · Trayectoria · Formación · Certificaciones'
      },
      fr: {
        title: 'Secteur Public',
        subtitle: 'Fonction publique, ministères et institutions',
        reason: 'Structure formelle et chronologique adaptée aux concours et administrations.',
        structureNote: 'Profil · Parcours · Formation · Certifications'
      },
      de: {
        title: 'Öffentlicher Dienst',
        subtitle: 'Behörden, Ministerien und Institutionen',
        reason: 'Formale, lückenlose Struktur für Bewerbungen im öffentlichen Sektor.',
        structureNote: 'Profil · Werdegang · Ausbildung · Zertifikate'
      },
      it: {
        title: 'Settore Pubblico',
        subtitle: 'Enti pubblici, concorsi e istituzioni',
        reason: 'Struttura formale e trasparente adatta a concorsi e amministrazioni.',
        structureNote: 'Profilo · Esperienze · Istruzione · Certificazioni'
      }
    }
  },
  {
    id: 'europe',
    templateStyle: 'european_europass',
    templateName: 'Europass CV',
    accentColor: '#1d4ed8',
    showPhoto: true,
    suggestedLanguage: 'keep',
    sectionOrder: ['summary', 'experiences', 'educations', 'languages', 'competencies', 'trainings', 'references'],
    labels: {
      pt: {
        title: 'Europa',
        subtitle: 'Portugal, Espanha, Alemanha, França e União Europeia',
        reason: 'Padrão europeu limpo com níveis de idioma CEFR (A1–C2) e foto opcional.',
        structureNote: 'Perfil · Experiência · Educação · Idiomas CEFR · Competências'
      },
      en: {
        title: 'Europe',
        subtitle: 'Portugal, Spain, Germany, France & European Union',
        reason: 'Clean European standard featuring CEFR language levels (A1–C2) and optional photo.',
        structureNote: 'Summary · Experience · Education · CEFR Languages · Skills'
      },
      es: {
        title: 'Europa',
        subtitle: 'España, Portugal, Alemania, Francia y Unión Europea',
        reason: 'Estándar europeo limpio con niveles de idiomas MCER y foto opcional.',
        structureNote: 'Perfil · Experiencia · Educación · Idiomas · Competencias'
      },
      fr: {
        title: 'Europe',
        subtitle: 'France, Portugal, Espagne, Allemagne & Union Européenne',
        reason: 'Standard européen clair avec niveaux CECRL et photo optionnelle.',
        structureNote: 'Profil · Expériences · Formation · Langues · Compétences'
      },
      de: {
        title: 'Europa',
        subtitle: 'Deutschland, Portugal, Spanien, Frankreich & EU',
        reason: 'Klarer europäischer Standard mit GER-Sprachniveaus und optionalem Foto.',
        structureNote: 'Profil · Erfahrung · Ausbildung · Sprachen · Kompetenzen'
      },
      it: {
        title: 'Europa',
        subtitle: 'Italia, Portogallo, Spagna, Germania e Unione Europea',
        reason: 'Standard europeo pulito con livelli linguistici QCER e foto opzionale.',
        structureNote: 'Profilo · Esperienze · Istruzione · Lingue · Competenze'
      }
    }
  },
  {
    id: 'canada',
    templateStyle: 'reverse_chronological',
    templateName: 'Reverse Chronological',
    accentColor: '#1e293b',
    showPhoto: false,
    suggestedLanguage: 'en',
    sectionOrder: ['summary', 'experiences', 'competencies', 'educations', 'trainings', 'languages', 'references'],
    labels: {
      pt: {
        title: 'Canadá',
        subtitle: 'Formato canadiano sem foto e focado em resultados',
        reason: 'Padrão norte-americano sem foto (regra local) com cronologia inversa direta.',
        structureNote: 'Resumo · Experiência (Sem Foto) · Competências · Educação'
      },
      en: {
        title: 'Canada',
        subtitle: 'Canadian no-photo format focused on impact',
        reason: 'Canadian anti-bias standard (no photo) with clear reverse-chronological impact.',
        structureNote: 'Summary · Experience (No Photo) · Core Skills · Education'
      },
      es: {
        title: 'Canadá',
        subtitle: 'Formato canadiense sin foto centrado en logros',
        reason: 'Estándar canadiense sin foto con cronología inversa y métricas.',
        structureNote: 'Resumen · Experiencia (Sin Foto) · Competencias · Educación'
      },
      fr: {
        title: 'Canada',
        subtitle: 'Format canadien sans photo axé sur les résultats',
        reason: 'Standard canadien sans photo avec chronologie inversée et métriques.',
        structureNote: 'Profil · Expériences (Sans Photo) · Compétences · Formation'
      },
      de: {
        title: 'Kanada',
        subtitle: 'Kanadisches Format ohne Foto mit Fokus auf Wirkung',
        reason: 'Kanadischer Standard ohne Foto mit klarer umgekehrter Chronologie.',
        structureNote: 'Profil · Erfahrung (Ohne Foto) · Kompetenzen · Ausbildung'
      },
      it: {
        title: 'Canada',
        subtitle: 'Formato canadese senza foto orientato ai risultati',
        reason: 'Standard canadese senza foto con cronologia inversa chiara.',
        structureNote: 'Profilo · Esperienze (Senza Foto) · Competenze · Istruzione'
      }
    }
  },
  {
    id: 'usa',
    templateStyle: 'ats_professional',
    templateName: 'ATS Professional',
    accentColor: '#0f172a',
    showPhoto: false,
    suggestedLanguage: 'en',
    sectionOrder: ['summary', 'experiences', 'educations', 'competencies', 'trainings', 'languages', 'references'],
    labels: {
      pt: {
        title: 'EUA',
        subtitle: 'Empresas americanas e trabalho remoto em dólar',
        reason: 'Padrão americano estrito sem foto, coluna única 100% compatível com Workday e Greenhouse.',
        structureNote: 'Resumo · Experiência com Métricas · Educação · Skills (Sem Foto)'
      },
      en: {
        title: 'USA',
        subtitle: 'US employers & high-paying remote roles',
        reason: 'Strict US resume standard (no photo), single-column 100% compatible with Workday & Greenhouse.',
        structureNote: 'Summary · Quantified Experience · Education · Skills (No Photo)'
      },
      es: {
        title: 'EE. UU.',
        subtitle: 'Empresas americanas y trabajo remoto en USD',
        reason: 'Estándar estadounidense sin foto 100% compatible con Workday y Greenhouse.',
        structureNote: 'Resumen · Experiencia con Métricas · Educación · Skills'
      },
      fr: {
        title: 'États-Unis',
        subtitle: 'Entreprises US et télétravail international',
        reason: 'Standard américain strict sans photo, 100% compatible Workday et Greenhouse.',
        structureNote: 'Profil · Expériences chiffrées · Formation · Compétences'
      },
      de: {
        title: 'USA',
        subtitle: 'US-Unternehmen und Remote-Jobs',
        reason: 'Strenger US-Standard ohne Foto, 100% kompatibel mit Workday und Greenhouse.',
        structureNote: 'Profil · Quantifizierte Erfahrung · Ausbildung · Skills'
      },
      it: {
        title: 'USA',
        subtitle: 'Aziende americane e lavoro remoto in USD',
        reason: 'Standard USA rigoroso senza foto, 100% compatibile con Workday e Greenhouse.',
        structureNote: 'Profilo · Esperienze con Metriche · Istruzione · Competenze'
      }
    }
  }
];

export function getSavedOnboardingGoal(): OnboardingGoalId | null {
  try {
    const val = localStorage.getItem(ONBOARDING_GOAL_STORAGE_KEY) as OnboardingGoalId | null;
    if (val && ONBOARDING_GOALS.some((g) => g.id === val)) return val;
  } catch {
    // ignore
  }
  return null;
}

export function saveOnboardingGoal(goalId: OnboardingGoalId): void {
  try {
    localStorage.setItem(ONBOARDING_GOAL_STORAGE_KEY, goalId);
  } catch {
    // ignore
  }
}

export function getGoalPreset(goalId?: OnboardingGoalId | null): OnboardingGoalPreset {
  return ONBOARDING_GOALS.find((g) => g.id === goalId) || ONBOARDING_GOALS[0];
}
