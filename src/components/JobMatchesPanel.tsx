import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { CVData } from '../types/cv';
import { useLanguage, SiteLanguageCode } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { authorizedFetch } from '../utils/authHeaders';
import { TOOLS_UI_TRANSLATIONS, ToolsUiDictionary, getIntlLocale } from '../i18n/toolsUiTranslations';
import { LightbulbStepBadge, StudioCreationMode } from './StudioGuideSystem';
import {
  Briefcase,
  ExternalLink,
  RefreshCw,
  Search,
  Target,
  AlertCircle,
  Loader2,
  Globe,
  SlidersHorizontal,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Lightbulb,
  Check,
  ArrowRight,
  Wand2,
  Link2,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export interface MatchedRadarJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string | null;
  workplace: 'remote' | 'hybrid' | 'onsite' | string;
  locations: string[];
  allowedCountries: string[];
  category?: string | null;
  seniority?: string | null;
  employmentType?: string | null;
  salary?:
    | string
    | number
    | { min?: number | null; max?: number | null; currency?: string | null; period?: string | null }
    | null;
  skills: string[];
  tags: string[];
  descriptionSnippet?: string;
  sourcePortal?: string;
  sourceName: string;
  postedAt?: string | null;
  applyUrl: string;
  radarUrl: string;
  matchScore: number;
  matchedKeywords: string[];
  fitReason: string;
}

interface ExternalPortalLink {
  id: string;
  name: string;
  url: string;
  liveCount?: number | null;
}

interface JobMatchResponse {
  sourceUrl: string;
  totalPlatformJobs: number;
  scannedPoolCount: number;
  compatibleCount: number;
  totalCompatibleAllSources?: number;
  sourceCounts?: Record<string, number>;
  matchedJobs: MatchedRadarJob[];
  externalPortals?: ExternalPortalLink[];
  profileQueriesUsed: string[];
  syncedAt: string;
}

export interface JobPreferences {
  countries: string[];
  targetRoles: string[];
  contractTypes: string[];
}

interface JobMatchesPanelProps {
  cv: CVData;
  onApplyJobToTailor: (jobDescriptionText: string, targetTab: 'ats' | 'ai') => void;
  onUpdateCV?: (updatedCV: CVData) => void;
  onSetJobDescription?: (desc: string) => void;
  onOpenAuthModal?: (prompt?: string) => void;
  onOpenPricingModal?: (prompt?: string) => void;
  guideMode?: StudioCreationMode;
}

interface UrlJobAnalysisResult {
  jobTitle: string;
  company: string;
  location: string;
  compatibilityScore: number;
  matchingKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  cleanedJobDescription: string;
  adaptedCV?: {
    summary?: string;
    competencies?: Array<{ category: string; description: string }>;
    experiences?: Array<{ index: number; highlights: string[] }>;
  } | null;
}

interface AppliedJobRecord {
  id: string;
  title: string;
  company: string;
  sourceName: string;
  applyUrl: string;
  appliedAt: string;
  matchScore: number;
}

const PREFS_STORAGE_KEY = 'cv_job_preferences_v1';
const APPLIED_JOBS_STORAGE_KEY = 'cv_applied_jobs_v1';

const APPLY_FLOW_COPY: Record<
  SiteLanguageCode,
  {
    guide1: string;
    guide2: string;
    guide3: string;
    tabMatches: string;
    tabApplied: string;
    applyNowBtn: string;
    appliedBadge: string;
    openPortalBtn: string;
    removeAppliedBtn: string;
    emptyAppliedTitle: string;
    emptyAppliedDesc: string;
    modalTitle: string;
    step1Heading: string;
    step1Desc: string;
    tailorWithAiBtn: string;
    useCurrentCvBtn: string;
    step2Heading: string;
    step2Desc: string;
    openOfficialLinkBtn: string;
    markAppliedBtn: string;
    alreadyAppliedBtn: string;
    backToStep1Btn: string;
    appliedOnLabel: string;
    closeBtn: string;
  }
> = {
  pt: {
    guide1: 'Filtre ou pesquise pelo cargo desejado',
    guide2: 'Clique em "Candidatar-se Agora"',
    guide3: 'Adapte o CV ou envie no portal oficial',
    tabMatches: 'Vagas Compatíveis',
    tabApplied: 'Minhas Candidaturas',
    applyNowBtn: 'Candidatar-se Agora',
    appliedBadge: 'Candidatado',
    openPortalBtn: 'Abrir Vaga',
    removeAppliedBtn: 'Remover',
    emptyAppliedTitle: 'Ainda não registou candidaturas',
    emptyAppliedDesc: 'Ao clicar em "Candidatar-se Agora" numa vaga e enviar no portal, clique em "Marcar como Candidatado" para acompanhar tudo aqui.',
    modalTitle: 'Assistente de Candidatura Rápida',
    step1Heading: 'Preparar o seu CV para esta vaga',
    step1Desc: 'Quer adaptar o seu currículo com IA às palavras-chave desta vaga ou avançar diretamente com o seu CV atual?',
    tailorWithAiBtn: 'Adaptar CV com IA (Recomendado)',
    useCurrentCvBtn: 'Avançar com CV Atual',
    step2Heading: 'Enviar candidatura no portal oficial',
    step2Desc: '1) Abra a vaga no site da empresa/portal para enviar o seu CV. 2) Depois confirme abaixo para guardar no seu histórico.',
    openOfficialLinkBtn: 'Abrir Vaga no Portal',
    markAppliedBtn: 'Marcar como Candidatado',
    alreadyAppliedBtn: 'Guardado em Minhas Candidaturas',
    backToStep1Btn: 'Voltar ao Passo 1',
    appliedOnLabel: 'Candidatura registada em',
    closeBtn: 'Fechar'
  },
  en: {
    guide1: 'Filter or search your target role',
    guide2: 'Click "Apply Now" on a match',
    guide3: 'Tailor CV or submit on official portal',
    tabMatches: 'Matched Jobs',
    tabApplied: 'My Applications',
    applyNowBtn: 'Apply Now',
    appliedBadge: 'Applied',
    openPortalBtn: 'Open Role',
    removeAppliedBtn: 'Remove',
    emptyAppliedTitle: 'No applications tracked yet',
    emptyAppliedDesc: 'Click "Apply Now" on any matching job, submit on the company portal, and mark it as Applied to track your progress here.',
    modalTitle: 'Quick Apply Assistant',
    step1Heading: 'Prepare your CV for this role',
    step1Desc: 'Would you like to tailor your resume keywords with AI for this opening or proceed with your current CV?',
    tailorWithAiBtn: 'Tailor CV with AI (Recommended)',
    useCurrentCvBtn: 'Use Current CV & Continue',
    step2Heading: 'Submit on the official job portal',
    step2Desc: '1) Open the official listing below to submit your CV. 2) Mark it as Applied to keep your history organized.',
    openOfficialLinkBtn: 'Open Official Job Posting',
    markAppliedBtn: 'Mark as Applied',
    alreadyAppliedBtn: 'Saved in My Applications',
    backToStep1Btn: 'Back to Step 1',
    appliedOnLabel: 'Applied on',
    closeBtn: 'Close'
  },
  es: {
    guide1: 'Filtra o busca tu puesto ideal',
    guide2: 'Haz clic en "Postular Ahora"',
    guide3: 'Adapta tu CV o envía en el portal',
    tabMatches: 'Vacantes Compatibles',
    tabApplied: 'Mis Postulaciones',
    applyNowBtn: 'Postular Ahora',
    appliedBadge: 'Postulado',
    openPortalBtn: 'Abrir Vacante',
    removeAppliedBtn: 'Quitar',
    emptyAppliedTitle: 'Aún no registraste postulaciones',
    emptyAppliedDesc: 'Haz clic en "Postular Ahora" en cualquier vacante, envía en el portal oficial y márcala como Postulada aquí.',
    modalTitle: 'Asistente de Postulación Rápida',
    step1Heading: 'Prepara tu CV para esta vacante',
    step1Desc: '¿Deseas adaptar tu currículum con IA a los requisitos de esta oferta o continuar con tu CV actual?',
    tailorWithAiBtn: 'Adaptar CV con IA (Recomendado)',
    useCurrentCvBtn: 'Continuar con CV Actual',
    step2Heading: 'Enviar postulación en el portal oficial',
    step2Desc: '1) Abre el enlace oficial abajo para enviar tu CV. 2) Márcalo como Postulado para llevar el seguimiento.',
    openOfficialLinkBtn: 'Abrir Oferta en Portal Oficial',
    markAppliedBtn: 'Marcar como Postulado',
    alreadyAppliedBtn: 'Guardado en Mis Postulaciones',
    backToStep1Btn: 'Volver al Paso 1',
    appliedOnLabel: 'Postulado el',
    closeBtn: 'Cerrar'
  },
  fr: {
    guide1: 'Filtrez ou recherchez votre poste',
    guide2: 'Cliquez sur « Postuler »',
    guide3: 'Adaptez le CV ou envoyez sur le portail',
    tabMatches: 'Offres Compatibles',
    tabApplied: 'Mes Candidatures',
    applyNowBtn: 'Postuler',
    appliedBadge: 'Postulé',
    openPortalBtn: 'Ouvrir l’offre',
    removeAppliedBtn: 'Retirer',
    emptyAppliedTitle: 'Aucune candidature enregistrée',
    emptyAppliedDesc: 'Cliquez sur « Postuler » sur une offre, soumettez votre dossier sur le site officiel puis marquez-la ici.',
    modalTitle: 'Assistant de Candidature Rapide',
    step1Heading: 'Préparer votre CV pour cette offre',
    step1Desc: 'Souhaitez-vous adapter votre CV avec l’IA aux mots-clés de cette offre ou continuer avec votre CV actuel ?',
    tailorWithAiBtn: 'Adapter le CV avec IA (Recommandé)',
    useCurrentCvBtn: 'Continuer avec le CV actuel',
    step2Heading: 'Envoyer sur le portail officiel',
    step2Desc: '1) Ouvrez l’offre officielle ci-dessous. 2) Confirmez ensuite pour suivre cette candidature.',
    openOfficialLinkBtn: 'Ouvrir l’offre officielle',
    markAppliedBtn: 'Marquer comme Postulé',
    alreadyAppliedBtn: 'Enregistré dans Mes Candidatures',
    backToStep1Btn: 'Retour à l’étape 1',
    appliedOnLabel: 'Postulé le',
    closeBtn: 'Fermer'
  },
  de: {
    guide1: 'Nach Wunschposition filtern',
    guide2: 'Auf „Jetzt Bewerben“ klicken',
    guide3: 'CV anpassen & im Portal absenden',
    tabMatches: 'Passende Stellen',
    tabApplied: 'Meine Bewerbungen',
    applyNowBtn: 'Jetzt Bewerben',
    appliedBadge: 'Beworben',
    openPortalBtn: 'Stelle öffnen',
    removeAppliedBtn: 'Entfernen',
    emptyAppliedTitle: 'Noch keine Bewerbungen erfasst',
    emptyAppliedDesc: 'Klicken Sie bei einer Stelle auf „Jetzt Bewerben“, senden Sie Ihren CV ab und speichern Sie den Status hier.',
    modalTitle: 'Schnell-Bewerbungsassistent',
    step1Heading: 'Lebenslauf vorbereiten',
    step1Desc: 'Möchten Sie Ihren Lebenslauf per KI auf diese Stelle zuschneiden oder direkt mit dem aktuellen CV fortfahren?',
    tailorWithAiBtn: 'CV mit KI anpassen (Empfohlen)',
    useCurrentCvBtn: 'Aktuellen CV verwenden',
    step2Heading: 'Im offiziellen Portal bewerben',
    step2Desc: '1) Öffnen Sie die offizielle Stellenanzeige unten. 2) Markieren Sie die Stelle als beworben.',
    openOfficialLinkBtn: 'Offizielle Anzeige öffnen',
    markAppliedBtn: 'Als Beworben markieren',
    alreadyAppliedBtn: 'In Bewerbungen gespeichert',
    backToStep1Btn: 'Zurück zu Schritt 1',
    appliedOnLabel: 'Beworben am',
    closeBtn: 'Schließen'
  },
  it: {
    guide1: 'Filtra o cerca il ruolo target',
    guide2: 'Clicca su "Candidati Ora"',
    guide3: 'Adatta il CV o invia sul portale',
    tabMatches: 'Offerte Compatibili',
    tabApplied: 'Le Mie Candidature',
    applyNowBtn: 'Candidati Ora',
    appliedBadge: 'Candidato',
    openPortalBtn: 'Apri Offerta',
    removeAppliedBtn: 'Rimuovi',
    emptyAppliedTitle: 'Nessuna candidatura salvata',
    emptyAppliedDesc: 'Clicca su "Candidati Ora" su un’offerta, invia la candidatura sul portale ufficiale e salvala qui.',
    modalTitle: 'Assistente Candidatura Rapida',
    step1Heading: 'Prepara il tuo CV per questa offerta',
    step1Desc: 'Vuoi adattare il CV con l’IA per questa posizione o procedere con il tuo CV attuale?',
    tailorWithAiBtn: 'Adatta CV con IA (Consigliato)',
    useCurrentCvBtn: 'Usa CV Attuale e Continua',
    step2Heading: 'Invia sul portale ufficiale',
    step2Desc: '1) Apri l’annuncio ufficiale qui sotto. 2) Conferma per salvare la candidatura nello storico.',
    openOfficialLinkBtn: 'Apri Annuncio Ufficiale',
    markAppliedBtn: 'Segna come Candidato',
    alreadyAppliedBtn: 'Salvato in Candidature',
    backToStep1Btn: 'Torna al Passo 1',
    appliedOnLabel: 'Candidatura del',
    closeBtn: 'Chiudi'
  }
};

const URL_ANALYZER_COPY: Record<
  SiteLanguageCode,
  {
    badge: string;
    title: string;
    subtitle: string;
    urlPh: string;
    pasteToggle: string;
    pasteHide: string;
    pastePh: string;
    analyzeBtn: string;
    analyzingBtn: string;
    compatLabel: string;
    matchedTitle: string;
    missingTitle: string;
    suggestionsTitle: string;
    adaptNowBtn: string;
    adaptedDoneBtn: string;
    adaptedToastTitle: string;
    adaptedToastMsg: string;
    errGeneric: string;
    errEmpty: string;
  }
> = {
  pt: {
    badge: 'Aplicar a vagas',
    title: 'Cole o link da vaga e adapte o seu CV com IA',
    subtitle: 'Analisamos os requisitos da vaga, calculamos a compatibilidade ATS e ajustamos o seu CV.',
    urlPh: 'https://vaga.com/... (LinkedIn, UNJobs, Indeed, Glassdoor)',
    pasteToggle: 'Ou colar texto da vaga',
    pasteHide: 'Ocultar texto da vaga',
    pastePh: 'Cole aqui a descrição completa ou requisitos da vaga...',
    analyzeBtn: 'Analisar vaga e adaptar CV',
    analyzingBtn: 'A analisar vaga…',
    compatLabel: 'Compatibilidade ATS',
    matchedTitle: 'Pontos fortes no seu CV',
    missingTitle: 'Palavras-chave em falta',
    suggestionsTitle: 'Sugestões rápidas',
    adaptNowBtn: 'Aplicar ajustes ao meu CV',
    adaptedDoneBtn: 'CV adaptado para esta vaga',
    adaptedToastTitle: 'CV adaptado com sucesso',
    adaptedToastMsg: 'Resumo, competências e destaques atualizados para esta vaga.',
    errGeneric: 'Não foi possível analisar a vaga agora.',
    errEmpty: 'Cole o link da vaga ou o texto da descrição.'
  },
  en: {
    badge: 'Apply to jobs',
    title: 'Paste a job link and tailor your CV with AI',
    subtitle: 'We analyze the role requirements, compute ATS compatibility, and adapt your resume.',
    urlPh: 'https://job.com/... (LinkedIn, UNJobs, Indeed, Glassdoor)',
    pasteToggle: 'Or paste job description',
    pasteHide: 'Hide description field',
    pastePh: 'Paste the full job description or requirements here...',
    analyzeBtn: 'Analyze job & tailor CV',
    analyzingBtn: 'Analyzing job…',
    compatLabel: 'ATS Compatibility',
    matchedTitle: 'Matched in your CV',
    missingTitle: 'Missing keywords',
    suggestionsTitle: 'Quick improvements',
    adaptNowBtn: 'Apply tailored updates to CV',
    adaptedDoneBtn: 'CV tailored for this role',
    adaptedToastTitle: 'CV tailored successfully',
    adaptedToastMsg: 'Summary, skills, and bullet highlights updated for this job.',
    errGeneric: 'Could not analyze this job right now.',
    errEmpty: 'Paste a job link or job description first.'
  },
  es: {
    badge: 'Aplicar a vacantes',
    title: 'Pega el enlace de la vacante y adapta tu CV con IA',
    subtitle: 'Analizamos los requisitos, medimos compatibilidad ATS y ajustamos tu currículum.',
    urlPh: 'https://oferta.com/... (LinkedIn, UNJobs, Indeed)',
    pasteToggle: 'O pegar texto de la oferta',
    pasteHide: 'Ocultar texto de la oferta',
    pastePh: 'Pega aquí la descripción o requisitos de la vacante...',
    analyzeBtn: 'Analizar vacante y adaptar CV',
    analyzingBtn: 'Analizando oferta…',
    compatLabel: 'Compatibilidad ATS',
    matchedTitle: 'Coincidencias en tu CV',
    missingTitle: 'Palabras clave faltantes',
    suggestionsTitle: 'Sugerencias rápidas',
    adaptNowBtn: 'Aplicar ajustes a mi CV',
    adaptedDoneBtn: 'CV adaptado para esta vacante',
    adaptedToastTitle: 'CV adaptado con éxito',
    adaptedToastMsg: 'Resumen, competencias y logros actualizados para esta oferta.',
    errGeneric: 'No se pudo analizar la vacante ahora.',
    errEmpty: 'Pega el enlace o la descripción de la vacante.'
  },
  fr: {
    badge: 'Postuler aux offres',
    title: 'Collez le lien de l’offre et adaptez votre CV avec l’IA',
    subtitle: 'Nous analysons les critères du poste, calculons le score ATS et ajustons votre CV.',
    urlPh: 'https://offre.com/... (LinkedIn, UNJobs, Indeed)',
    pasteToggle: 'Ou coller le texte de l’offre',
    pasteHide: 'Masquer le texte',
    pastePh: 'Collez ici la description complète du poste...',
    analyzeBtn: 'Analyser l’offre et adapter le CV',
    analyzingBtn: 'Analyse en cours…',
    compatLabel: 'Compatibilité ATS',
    matchedTitle: 'Points forts de votre CV',
    missingTitle: 'Mots-clés manquants',
    suggestionsTitle: 'Améliorations suggérées',
    adaptNowBtn: 'Appliquer les ajustements au CV',
    adaptedDoneBtn: 'CV adapté pour cette offre',
    adaptedToastTitle: 'CV adapté avec succès',
    adaptedToastMsg: 'Profil, compétences et réalisations mis à jour pour cette offre.',
    errGeneric: 'Impossible d’analyser cette offre maintenant.',
    errEmpty: 'Collez d’abord le lien ou le texte de l’offre.'
  },
  de: {
    badge: 'Auf Stellen bewerben',
    title: 'Stellenlink einfügen & Lebenslauf per KI anpassen',
    subtitle: 'Wir analysieren die Anforderungen, berechnen die ATS-Passung und optimieren Ihren CV.',
    urlPh: 'https://stelle.de/... (LinkedIn, UNJobs, Indeed)',
    pasteToggle: 'Oder Stellenbeschreibung einfügen',
    pasteHide: 'Textfeld ausblenden',
    pastePh: 'Fügen Sie hier die vollständige Stellenanzeige ein...',
    analyzeBtn: 'Stelle analysieren & CV anpassen',
    analyzingBtn: 'Analysiere Stelle…',
    compatLabel: 'ATS-Kompatibilität',
    matchedTitle: 'Im CV vorhanden',
    missingTitle: 'Fehlende Keywords',
    suggestionsTitle: 'Schnelle Tipps',
    adaptNowBtn: 'Anpassungen in CV übernehmen',
    adaptedDoneBtn: 'CV für diese Stelle angepasst',
    adaptedToastTitle: 'Lebenslauf erfolgreich angepasst',
    adaptedToastMsg: 'Profil, Kompetenzen und Erfolge auf diese Stelle zugeschnitten.',
    errGeneric: 'Stelle konnte aktuell nicht analysiert werden.',
    errEmpty: 'Bitte fügen Sie zuerst einen Link oder Text ein.'
  },
  it: {
    badge: 'Candidati alle offerte',
    title: 'Incolla il link dell’offerta e adatta il CV con l’IA',
    subtitle: 'Analizziamo i requisiti del ruolo, calcoliamo il punteggio ATS e adattiamo il tuo CV.',
    urlPh: 'https://offerta.it/... (LinkedIn, UNJobs, Indeed)',
    pasteToggle: 'Oppure incolla il testo dell’offerta',
    pasteHide: 'Nascondi testo',
    pastePh: 'Incolla qui la descrizione completa dell’offerta...',
    analyzeBtn: 'Analizza offerta e adatta CV',
    analyzingBtn: 'Analisi in corso…',
    compatLabel: 'Compatibilità ATS',
    matchedTitle: 'Presenti nel tuo CV',
    missingTitle: 'Parole chiave mancanti',
    suggestionsTitle: 'Suggerimenti rapidi',
    adaptNowBtn: 'Applica modifiche al CV',
    adaptedDoneBtn: 'CV adattato per questa offerta',
    adaptedToastTitle: 'CV adattato con successo',
    adaptedToastMsg: 'Profilo, competenze ed esperienze aggiornati per questa offerta.',
    errGeneric: 'Impossibile analizzare l’offerta ora.',
    errEmpty: 'Incolla prima un link o il testo dell’offerta.'
  }
};

function loadAppliedJobs(): AppliedJobRecord[] {
  try {
    const raw = localStorage.getItem(APPLIED_JOBS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return [];
}

const COUNTRY_IDS = [
  'remoto_global',
  'brasil',
  'portugal',
  'angola',
  'espanha',
  'reino_unido',
  'alemanha',
  'franca',
  'estados_unidos',
  'canada',
  'europa'
] as const;

const CONTRACT_TYPE_IDS = ['full_time', 'contract', 'part_time', 'internship'] as const;

const SOURCE_IDS: Array<'all' | 'linkedin' | 'radar' | 'remotive' | 'arbeitnow' | 'jobicy' | 'remoteok'> = [
  'all',
  'linkedin',
  'radar',
  'remotive',
  'arbeitnow',
  'jobicy',
  'remoteok'
];

function loadSavedPreferences(): JobPreferences {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        countries: Array.isArray(parsed?.countries) ? parsed.countries.map(String) : [],
        targetRoles: Array.isArray(parsed?.targetRoles) ? parsed.targetRoles.map(String) : [],
        contractTypes: Array.isArray(parsed?.contractTypes) ? parsed.contractTypes.map(String) : []
      };
    }
  } catch {
    // Fallback to empty defaults
  }
  return { countries: [], targetRoles: [], contractTypes: [] };
}

function formatSalaryDisplay(
  salary: MatchedRadarJob['salary'],
  periodUnits: ToolsUiDictionary['jobMatches']['periodUnits'],
  locale: string
): string | null {
  if (salary == null) return null;
  if (typeof salary === 'string') return salary.trim() || null;
  if (typeof salary === 'number' && Number.isFinite(salary)) {
    return salary.toLocaleString(locale);
  }
  if (typeof salary === 'object') {
    const { min, max, currency, period } = salary;
    const periodMap: Record<string, string> = {
      year: periodUnits.year,
      annual: periodUnits.year,
      yearly: periodUnits.year,
      month: periodUnits.month,
      monthly: periodUnits.month,
      hour: periodUnits.hour,
      hourly: periodUnits.hour,
      day: periodUnits.day,
      week: periodUnits.week
    };
    const pSuffix = period ? periodMap[String(period).toLowerCase()] || `/${period}` : '';
    const curPrefix = currency ? `${String(currency).toUpperCase()} ` : '';
    if (typeof min === 'number' && typeof max === 'number' && min !== max) {
      return `${curPrefix}${min.toLocaleString(locale)} – ${max.toLocaleString(locale)}${pSuffix}`;
    }
    if (typeof min === 'number' || typeof max === 'number') {
      const val = typeof min === 'number' ? min : (max as number);
      return `${curPrefix}${val.toLocaleString(locale)}${pSuffix}`;
    }
  }
  return null;
}

function formatRelativeDate(
  iso: string | null | undefined,
  ui: ToolsUiDictionary['jobMatches'],
  locale: string
): string {
  if (!iso) return ui.relRecent;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return ui.relRecent;
  const diffHours = Math.max(0, Math.floor((Date.now() - ts) / (1000 * 60 * 60)));
  if (diffHours < 1) return ui.relToday;
  if (diffHours < 24) return `${ui.relHoursPrefix}${diffHours}${ui.relHoursSuffix}`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return ui.relYesterday;
  if (diffDays < 30) return `${ui.relDaysPrefix}${diffDays}${ui.relDaysSuffix}`;
  return new Date(iso).toLocaleDateString(locale);
}

function getSafeExternalHttpUrl(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '#';
  const trimmed = raw.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : '#';
}

export const JobMatchesPanel: React.FC<JobMatchesPanelProps> = ({
  cv,
  onApplyJobToTailor,
  onUpdateCV,
  onSetJobDescription,
  onOpenAuthModal,
  onOpenPricingModal,
  guideMode = 'guided'
}) => {
  const { siteLanguage } = useLanguage();
  const { showSuccess } = useToast();
  const ui = (TOOLS_UI_TRANSLATIONS[siteLanguage] || TOOLS_UI_TRANSLATIONS.en).jobMatches;
  const applyUi = APPLY_FLOW_COPY[siteLanguage] || APPLY_FLOW_COPY.en;
  const analyzerUi = URL_ANALYZER_COPY[siteLanguage] || URL_ANALYZER_COPY.en;
  const intlLocale = getIntlLocale(siteLanguage);
  const [data, setData] = useState<JobMatchResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [workplaceFilter, setWorkplaceFilter] = useState<'all' | 'remote' | 'hybrid' | 'onsite'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [tailoringJobId, setTailoringJobId] = useState<string | null>(null);

  // Hero "Aplicar a vagas" URL/Description AI Analyzer state
  const [jobUrlInput, setJobUrlInput] = useState<string>('');
  const [pastedJobText, setPastedJobText] = useState<string>('');
  const [showPasteField, setShowPasteField] = useState<boolean>(false);
  const [isAnalyzingJob, setIsAnalyzingJob] = useState<boolean>(false);
  const [urlAnalysisError, setUrlAnalysisError] = useState<string | null>(null);
  const [urlAnalysisResult, setUrlAnalysisResult] = useState<UrlJobAnalysisResult | null>(null);
  const [hasAppliedUrlAdaptation, setHasAppliedUrlAdaptation] = useState<boolean>(false);

  const [viewTab, setViewTab] = useState<'matches' | 'applied'>('matches');
  const [appliedJobs, setAppliedJobs] = useState<AppliedJobRecord[]>(() => loadAppliedJobs());
  const [quickApplyJob, setQuickApplyJob] = useState<MatchedRadarJob | null>(null);
  const [quickApplyStep, setQuickApplyStep] = useState<1 | 2>(1);

  const [preferences, setPreferences] = useState<JobPreferences>(() => loadSavedPreferences());
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [customRoleInput, setCustomRoleInput] = useState<string>('');

  // Persist user preferences cleanly
  useEffect(() => {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Ignore storage quota errors
    }
  }, [preferences]);

  useEffect(() => {
    try {
      localStorage.setItem(APPLIED_JOBS_STORAGE_KEY, JSON.stringify(appliedJobs));
    } catch {
      // Ignore storage quota errors
    }
  }, [appliedJobs]);

  const suggestedRoles = useMemo(() => {
    const rawList = [
      cv.personalDetails?.title || '',
      ...(cv.experiences || []).slice(0, 4).map((e) => e.role || '')
    ]
      .map((s) => s.trim())
      .filter((s) => s.length >= 2);
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const r of rawList) {
      const k = r.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        deduped.push(r);
      }
    }
    return deduped.slice(0, 5);
  }, [cv]);

  const profileSignature = useMemo(() => {
    const title = cv.personalDetails?.title || '';
    const loc = cv.personalDetails?.location || '';
    const comps = (cv.competencies || []).map((c) => c.category).join('|');
    const roles = (cv.experiences || []).slice(0, 3).map((e) => e.role).join('|');
    return `${title}::${loc}::${comps}::${roles}`;
  }, [cv]);

  const prefsSignature = useMemo(
    () =>
      `${preferences.countries.join(',')}::${preferences.targetRoles.join(',')}::${preferences.contractTypes.join(',')}`,
    [preferences]
  );

  const fetchMatches = useCallback(
    async (
      queryOverride?: string,
      workplaceOverride?: 'all' | 'remote' | 'hybrid' | 'onsite',
      sourceOverride?: string,
      prefsOverride?: JobPreferences
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/jobs/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cv,
            search: queryOverride !== undefined ? queryOverride : activeSearch,
            workplace: workplaceOverride !== undefined ? workplaceOverride : workplaceFilter,
            source: sourceOverride !== undefined ? sourceOverride : sourceFilter,
            preferences: prefsOverride !== undefined ? prefsOverride : preferences
          })
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || ui.errFetch);
        }
        setData(json as JobMatchResponse);
      } catch (err: any) {
        setError(err?.message || ui.errFetch);
      } finally {
        setIsLoading(false);
      }
    },
    [cv, activeSearch, workplaceFilter, sourceFilter, preferences, ui.errFetch]
  );

  // Automatic debounced personalization whenever CV, filters, or user preferences change
  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMatches();
    }, 300);
    return () => clearTimeout(timer);
  }, [profileSignature, prefsSignature, workplaceFilter, activeSearch, sourceFilter]);

  const toggleCountry = (id: string) => {
    setPreferences((prev) => {
      const exists = prev.countries.includes(id);
      return {
        ...prev,
        countries: exists ? prev.countries.filter((c) => c !== id) : [...prev.countries, id]
      };
    });
  };

  const toggleContractType = (id: string) => {
    setPreferences((prev) => {
      const exists = prev.contractTypes.includes(id);
      return {
        ...prev,
        contractTypes: exists
          ? prev.contractTypes.filter((t) => t !== id)
          : [...prev.contractTypes, id]
      };
    });
  };

  const toggleTargetRole = (roleLabel: string) => {
    const trimmed = roleLabel.trim();
    if (!trimmed) return;
    setPreferences((prev) => {
      const exists = prev.targetRoles.some((r) => r.toLowerCase() === trimmed.toLowerCase());
      return {
        ...prev,
        targetRoles: exists
          ? prev.targetRoles.filter((r) => r.toLowerCase() !== trimmed.toLowerCase())
          : [...prev.targetRoles, trimmed]
      };
    });
  };

  const handleAddCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = customRoleInput.trim();
    if (!cleaned) return;
    setPreferences((prev) => {
      if (prev.targetRoles.some((r) => r.toLowerCase() === cleaned.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        targetRoles: [...prev.targetRoles, cleaned]
      };
    });
    setCustomRoleInput('');
  };

  const handleResetPreferences = () => {
    setPreferences({ countries: [], targetRoles: [], contractTypes: [] });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
  };

  const handleTailorForJob = async (job: MatchedRadarJob, targetTab: 'ats' | 'ai' = 'ats') => {
    setTailoringJobId(job.id);
    try {
      let fullDescription = job.descriptionSnippet ? String(job.descriptionSnippet).trim() : '';

      if (
        !fullDescription &&
        (job.sourcePortal === 'radar' || job.sourcePortal === 'linkedin' || !job.sourcePortal)
      ) {
        try {
          const res = await fetch(`/api/jobs/detail?id=${encodeURIComponent(job.id)}`);
          if (res.ok) {
            const detail = await res.json();
            if (detail?.description) {
              fullDescription = String(detail.description)
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            }
          }
        } catch {
          // Fallback cleanly below
        }
      }

      const skillsLine = [...(job.skills || []), ...(job.tags || [])]
        .filter(Boolean)
        .slice(0, 12)
        .join(', ');
      const headerBlock = [
        `${ui.tailorHeader.role} ${job.title}`,
        `${ui.tailorHeader.company} ${job.company}`,
        `${ui.tailorHeader.portal} ${job.sourceName}`,
        `${ui.tailorHeader.workplace} ${ui.workplaces[job.workplace as keyof typeof ui.workplaces] || job.workplace}`,
        job.locations?.length ? `${ui.tailorHeader.location} ${job.locations.join(', ')}` : '',
        skillsLine ? `${ui.tailorHeader.skills} ${skillsLine}` : ''
      ]
        .filter(Boolean)
        .join('\n');

      const combinedText = fullDescription
        ? `${headerBlock}\n\n${ui.tailorHeader.description}\n${fullDescription.slice(0, 4000)}`
        : `${headerBlock}\n\n${ui.tailorHeader.criteria} ${job.matchedKeywords.join(', ')}.`;

      onApplyJobToTailor(combinedText, targetTab);
    } finally {
      setTailoringJobId(null);
    }
  };

  const handleMarkAsApplied = (job: MatchedRadarJob) => {
    setAppliedJobs((prev) => {
      if (prev.some((item) => item.id === job.id)) return prev;
      return [
        {
          id: job.id,
          title: job.title,
          company: job.company,
          sourceName: job.sourceName,
          applyUrl: job.applyUrl,
          appliedAt: new Date().toISOString(),
          matchScore: job.matchScore
        },
        ...prev
      ];
    });
  };

  const handleRemoveApplied = (jobId: string) => {
    setAppliedJobs((prev) => prev.filter((item) => item.id !== jobId));
  };

  const handleAnalyzeJobLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = jobUrlInput.trim();
    const cleanText = pastedJobText.trim();
    if (!cleanUrl && cleanText.length < 20) {
      setUrlAnalysisError(analyzerUi.errEmpty);
      return;
    }

    setIsAnalyzingJob(true);
    setUrlAnalysisError(null);
    setHasAppliedUrlAdaptation(false);
    try {
      const res = await authorizedFetch('/api/jobs/analyze-url', {
        method: 'POST',
        body: JSON.stringify({
          jobUrl: cleanUrl || undefined,
          pastedJobText: cleanText || undefined,
          cvData: cv,
          language: siteLanguage,
          adaptCv: true
        })
      });
      const json = await res.json().catch(() => ({}));

      if (res.status === 401) {
        if (onOpenAuthModal) onOpenAuthModal(analyzerUi.subtitle);
        return;
      }
      if (res.status === 402 || res.status === 403) {
        if (onOpenPricingModal) {
          onOpenPricingModal(json?.error || analyzerUi.subtitle);
        } else {
          setUrlAnalysisError(json?.error || analyzerUi.errGeneric);
        }
        return;
      }
      if (json?.needsManualPaste) {
        setShowPasteField(true);
        setUrlAnalysisError(json?.reason || json?.error || analyzerUi.errGeneric);
        return;
      }
      if (!res.ok) {
        throw new Error(json?.error || analyzerUi.errGeneric);
      }

      const result = json as UrlJobAnalysisResult;
      setUrlAnalysisResult(result);
      if (result.cleanedJobDescription && onSetJobDescription) {
        onSetJobDescription(result.cleanedJobDescription);
      }
    } catch (err: any) {
      setUrlAnalysisError(err?.message || analyzerUi.errGeneric);
    } finally {
      setIsAnalyzingJob(false);
    }
  };

  const handleApplyUrlAdaptationToCv = () => {
    if (!urlAnalysisResult?.adaptedCV) return;
    const adapted = urlAnalysisResult.adaptedCV;
    const nextSummary =
      typeof adapted.summary === 'string' && adapted.summary.trim()
        ? adapted.summary.trim()
        : cv.summary;
    const nextComps =
      Array.isArray(adapted.competencies) && adapted.competencies.length > 0
        ? adapted.competencies
            .filter((c) => c && (c.category || c.description))
            .map((c, idx) => ({
              id: cv.competencies[idx]?.id || `comp-job-${Date.now()}-${idx}`,
              category: String(c.category || ''),
              description: String(c.description || '')
            }))
        : cv.competencies;

    const expPatchMap = new Map<number, string[]>();
    if (Array.isArray(adapted.experiences)) {
      for (const item of adapted.experiences) {
        if (typeof item?.index === 'number' && Array.isArray(item.highlights) && item.highlights.length > 0) {
          expPatchMap.set(item.index, item.highlights.map(String).filter(Boolean));
        }
      }
    }
    const nextExperiences = cv.experiences.map((exp, idx) => {
      const patched = expPatchMap.get(idx);
      return patched ? { ...exp, highlights: patched } : exp;
    });

    if (onUpdateCV) {
      onUpdateCV({
        ...cv,
        summary: nextSummary,
        competencies: nextComps,
        experiences: nextExperiences
      });
    }
    if (urlAnalysisResult.cleanedJobDescription && onSetJobDescription) {
      onSetJobDescription(urlAnalysisResult.cleanedJobDescription);
    }
    setHasAppliedUrlAdaptation(true);
    showSuccess(analyzerUi.adaptedToastTitle, analyzerUi.adaptedToastMsg);
  };

  const appliedJobIds = useMemo(() => new Set(appliedJobs.map((j) => j.id)), [appliedJobs]);

  const activePrefCount =
    preferences.countries.length +
    preferences.targetRoles.length +
    preferences.contractTypes.length;

  const compatibleCount = data?.compatibleCount ?? 0;
  const totalCompatibleAllSources = data?.totalCompatibleAllSources ?? compatibleCount;
  const totalPlatformJobs = data?.totalPlatformJobs ?? 0;
  const jobs = data?.matchedJobs ?? [];
  const sourceCounts = data?.sourceCounts ?? {};
  const externalPortals = data?.externalPortals ?? [];

  return (
    <div className="space-y-4">
      {/* HERO CONVERSION FEATURE: APLICAR A VAGAS POR LINK OU TEXTO */}
      <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/70 rounded-xl p-4 sm:p-5 space-y-3 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{analyzerUi.badge}</span>
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-950 dark:text-white tracking-tight">
            {analyzerUi.title}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {analyzerUi.subtitle}
          </p>
        </div>

        <form onSubmit={handleAnalyzeJobLink} className="space-y-2.5">
          <div className="relative flex items-center">
            <Link2 className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="url"
              value={jobUrlInput}
              onChange={(e) => setJobUrlInput(e.target.value)}
              placeholder={analyzerUi.urlPh}
              className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowPasteField((prev) => !prev)}
              className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-950 underline"
            >
              {showPasteField ? analyzerUi.pasteHide : analyzerUi.pasteToggle}
            </button>
          </div>

          {showPasteField && (
            <textarea
              rows={4}
              value={pastedJobText}
              onChange={(e) => setPastedJobText(e.target.value)}
              placeholder={analyzerUi.pastePh}
              className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
            />
          )}

          {urlAnalysisError && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{urlAnalysisError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isAnalyzingJob}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs touch-manipulation"
          >
            {isAnalyzingJob ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <Wand2 className="w-4 h-4 shrink-0" />
            )}
            <span>{isAnalyzingJob ? analyzerUi.analyzingBtn : analyzerUi.analyzeBtn}</span>
          </button>
        </form>

        {urlAnalysisResult && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-slate-950 dark:text-white truncate">
                  {urlAnalysisResult.jobTitle}
                </p>
                {(urlAnalysisResult.company || urlAnalysisResult.location) && (
                  <p className="text-xs text-slate-500 truncate">
                    {[urlAnalysisResult.company, urlAnalysisResult.location].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-mono font-bold tabular-nums shrink-0">
                {analyzerUi.compatLabel}: {urlAnalysisResult.compatibilityScore}/100
              </div>
            </div>

            {urlAnalysisResult.matchingKeywords.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-emerald-700 block">
                  {analyzerUi.matchedTitle}
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {urlAnalysisResult.matchingKeywords.slice(0, 8).join(', ')}
                </p>
              </div>
            )}

            {urlAnalysisResult.missingKeywords.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-amber-700 block">
                  {analyzerUi.missingTitle}
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {urlAnalysisResult.missingKeywords.slice(0, 8).join(', ')}
                </p>
              </div>
            )}

            {urlAnalysisResult.suggestions.length > 0 && (
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                {urlAnalysisResult.suggestions.slice(0, 3).map((tip, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            )}

            {urlAnalysisResult.adaptedCV && onUpdateCV && (
              <button
                type="button"
                onClick={handleApplyUrlAdaptationToCv}
                disabled={hasAppliedUrlAdaptation}
                className={`w-full min-h-[42px] px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                  hasAppliedUrlAdaptation
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {hasAppliedUrlAdaptation ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 shrink-0" />
                )}
                <span>
                  {hasAppliedUrlAdaptation ? analyzerUi.adaptedDoneBtn : analyzerUi.adaptNowBtn}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3-Step Guided Application Helper (Visible in Guided Mode) */}
      {guideMode === 'guided' && (
        <div className="bg-amber-50/90 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
            <LightbulbStepBadge step={1} active />
            <span className="leading-snug">{applyUi.guide1}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
            <LightbulbStepBadge step={2} active />
            <span className="leading-snug">{applyUi.guide2}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
            <LightbulbStepBadge step={3} active />
            <span className="leading-snug">{applyUi.guide3}</span>
          </div>
        </div>
      )}

      {/* Clean View Switcher: Matched Jobs vs My Applications */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
        <button
          type="button"
          onClick={() => setViewTab('matches')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-colors whitespace-nowrap tabular-nums ${
            viewTab === 'matches'
              ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-950'
          }`}
        >
          {applyUi.tabMatches} ({compatibleCount})
        </button>
        <button
          type="button"
          onClick={() => setViewTab('applied')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-colors whitespace-nowrap tabular-nums ${
            viewTab === 'applied'
              ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-950'
          }`}
        >
          {applyUi.tabApplied} ({appliedJobs.length})
        </button>
      </div>

      {viewTab === 'applied' ? (
        appliedJobs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center space-y-2.5">
            <Briefcase className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-900 dark:text-white">{applyUi.emptyAppliedTitle}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {applyUi.emptyAppliedDesc}
            </p>
            <button
              type="button"
              onClick={() => setViewTab('matches')}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold transition-colors"
            >
              {applyUi.tabMatches}
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
            {appliedJobs.map((item) => (
              <div key={item.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      <Check className="w-3 h-3" />
                      <span>{applyUi.appliedBadge}</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                      {item.matchScore}%
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-950 dark:text-white mt-1 truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {item.company} · {item.sourceName} · {applyUi.appliedOnLabel}{' '}
                    {new Date(item.appliedAt).toLocaleDateString(intlLocale)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={getSafeExternalHttpUrl(item.applyUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>{applyUi.openPortalBtn}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveApplied(item.id)}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    {applyUi.removeAppliedBtn}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <>
      {/* Header & Live Multi-Portal Count Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0" />
              <h2 className="text-sm font-bold text-slate-950 dark:text-white tracking-tight">
                {ui.title}
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {ui.subtitlePrefix}{' '}
              <span className="font-semibold text-slate-800">
                LinkedIn, {ui.sources.radar}, Remotive, Arbeitnow, Jobicy & RemoteOK
              </span>{' '}
              {ui.subtitleMiddle}{' '}
              <span className="font-semibold text-slate-900">
                {preferences.targetRoles.length > 0
                  ? preferences.targetRoles.join(', ')
                  : cv.personalDetails?.title || ui.subtitleDefaultProfile}
              </span>
              .
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchMatches()}
            disabled={isLoading}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 flex items-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{ui.refreshBtn}</span>
          </button>
        </div>

        {/* Quantitative Readout Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-slate-100 pt-3 gap-3">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">
              {ui.compatibleJobs}
            </span>
            <span className="text-xl font-extrabold text-slate-950 tabular-nums">
              {isLoading && !data ? '—' : compatibleCount}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-500 block">
              {ui.indexedPool}
            </span>
            <span className="text-xl font-bold text-slate-800 tabular-nums">
              {totalPlatformJobs > 0 ? totalPlatformJobs.toLocaleString(intlLocale) : '—'}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[11px] font-medium text-slate-500 block">
              {ui.analyzedCriteria}
            </span>
            <span className="text-xs font-medium text-slate-700 line-clamp-1 mt-1">
              {data?.profileQueriesUsed?.length
                ? data.profileQueriesUsed.join(', ')
                : cv.personalDetails?.title || ui.fullProfile}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Configuration Panel: Countries, Roles & Contract Types */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between gap-2 bg-slate-50/70">
          <button
            type="button"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="flex items-center gap-2 text-left min-w-0 flex-1"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-800 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-950 block">
                {ui.configTitle}
              </span>
              <span className="text-[11px] text-slate-500 block truncate">
                {activePrefCount > 0
                  ? `${preferences.countries.length} ${ui.configSummaryCountries} · ${preferences.targetRoles.length} ${ui.configSummaryRoles} · ${preferences.contractTypes.length} ${ui.configSummaryContracts} ${ui.configSummaryAuto}`
                  : ui.configSummaryEmpty}
              </span>
            </div>
            {isConfigOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-500 shrink-0 ml-auto" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-auto" />
            )}
          </button>

          {activePrefCount > 0 && (
            <button
              type="button"
              onClick={handleResetPreferences}
              className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-950 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              title={ui.clearTitle}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{ui.clearBtn}</span>
            </button>
          )}
        </div>

        {isConfigOpen && (
          <div className="p-4 border-t border-slate-200 space-y-4">
            {/* 1. Target Roles */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                {ui.targetRolesLabel}
              </label>

              <form onSubmit={handleAddCustomRole} className="flex items-center gap-2">
                <input
                  type="text"
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  placeholder={ui.rolePlaceholder}
                  className="flex-1 min-w-0 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{ui.addBtn}</span>
                </button>
              </form>

              {(preferences.targetRoles.length > 0 || suggestedRoles.length > 0) && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {preferences.targetRoles.map((role) => (
                    <button
                      key={`active-role-${role}`}
                      type="button"
                      onClick={() => toggleTargetRole(role)}
                      className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors hover:bg-slate-800"
                    >
                      <span>{role}</span>
                      <X className="w-3 h-3 text-slate-300" />
                    </button>
                  ))}

                  {suggestedRoles
                    .filter(
                      (sug) =>
                        !preferences.targetRoles.some(
                          (r) => r.toLowerCase() === sug.toLowerCase()
                        )
                    )
                    .map((sug) => (
                      <button
                        key={`sug-role-${sug}`}
                        type="button"
                        onClick={() => toggleTargetRole(sug)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3 text-slate-500" />
                        <span>{sug}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* 2. Preferred Countries / Regions */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                {ui.countriesLabel}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COUNTRY_IDS.map((countryId) => {
                  const selected = preferences.countries.includes(countryId);
                  return (
                    <button
                      key={countryId}
                      type="button"
                      onClick={() => toggleCountry(countryId)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        selected
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {ui.countries[countryId] || countryId}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Preferred Contract Types */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                {ui.contractsLabel}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CONTRACT_TYPE_IDS.map((ctId) => {
                  const selected = preferences.contractTypes.includes(ctId);
                  return (
                    <button
                      key={ctId}
                      type="button"
                      onClick={() => toggleContractType(ctId)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        selected
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {ui.contracts[ctId] || ctId}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Direct Pre-filled Links for LinkedIn, Indeed, Glassdoor, Gupy, InfoJobs, Wellfound */}
      {externalPortals.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-700">
              {ui.externalPortalsTitle}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {externalPortals
              .filter((portal) => getSafeExternalHttpUrl(portal.url) !== '#')
              .map((portal) => (
              <a
                key={portal.id}
                href={getSafeExternalHttpUrl(portal.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <span>{portal.name}</span>
                {typeof portal.liveCount === 'number' && portal.liveCount > 0 && (
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    ({portal.liveCount})
                  </span>
                )}
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search Bar + Portal Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={ui.searchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            {ui.filterBtn}
          </button>
          {activeSearch && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setActiveSearch('');
              }}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-950 whitespace-nowrap shrink-0"
            >
              {ui.clearFilterBtn}
            </button>
          )}
        </form>

        {/* Source Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
          {SOURCE_IDS.map((tabId) => {
            const countVal =
              tabId === 'all' ? totalCompatibleAllSources : sourceCounts[tabId] ?? 0;
            if (tabId !== 'all' && data && countVal === 0 && sourceFilter !== tabId) {
              return null;
            }
            return (
              <button
                key={tabId}
                type="button"
                onClick={() => setSourceFilter(tabId)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                  sourceFilter === tabId
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {ui.sources[tabId] || tabId}
                {data ? ` (${countVal})` : ''}
              </button>
            );
          })}
        </div>

        {/* Workplace Filter */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-100 pt-2">
          {(['all', 'remote', 'hybrid', 'onsite'] as const).map((wpId) => (
            <button
              key={wpId}
              type="button"
              onClick={() => setWorkplaceFilter(wpId)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                workplaceFilter === wpId
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {ui.workplaces[wpId]}
            </button>
          ))}
        </div>
      </div>

      {/* Results List / States */}
      {error ? (
        <div className="bg-white border border-rose-200 rounded-xl p-5 text-center space-y-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-900">{error}</p>
          <button
            type="button"
            onClick={() => void fetchMatches()}
            className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            {ui.retryBtn}
          </button>
        </div>
      ) : isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="p-4 space-y-2 animate-pulse">
              <div className="flex items-center justify-between gap-4">
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-200 rounded w-16" />
              </div>
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3">
          <Globe className="w-6 h-6 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900">
              {ui.emptyTitle}
            </p>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              {ui.emptyDesc}
            </p>
          </div>
          {(activeSearch || workplaceFilter !== 'all' || sourceFilter !== 'all' || activePrefCount > 0) && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setActiveSearch('');
                setWorkplaceFilter('all');
                setSourceFilter('all');
                handleResetPreferences();
              }}
              className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              {ui.resetFiltersBtn}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden">
          {jobs.map((job) => {
            const scoreTone =
              job.matchScore >= 72
                ? 'text-emerald-700'
                : job.matchScore >= 52
                ? 'text-amber-700'
                : 'text-slate-700';
            const wpLabel = ui.workplaces[job.workplace as keyof typeof ui.workplaces] || String(job.workplace || '');
            const locationText =
              job.locations && job.locations.length > 0
                ? job.locations.slice(0, 2).map((l) => String(l)).join(', ')
                : wpLabel || ui.workplaces.remote;
            const contractLabel = job.employmentType
              ? ui.contracts[job.employmentType] || String(job.employmentType)
              : null;
            const salaryLabel = formatSalaryDisplay(job.salary, ui.periodUnits, intlLocale);

            return (
              <article
                key={job.id}
                className="p-4 hover:bg-slate-50/70 transition-colors space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <a
                      href={getSafeExternalHttpUrl(job.applyUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-slate-950 hover:text-blue-700 transition-colors leading-snug block"
                    >
                      {String(job.title || '')}
                    </a>
                    <p className="text-xs text-slate-600 mt-1">
                      <span className="font-semibold text-slate-800">{String(job.company || '')}</span>
                      {' · '}
                      <span className="font-semibold text-slate-700">{String(job.sourceName || '')}</span>
                      {' · '}
                      <span>{wpLabel}</span>
                      {contractLabel ? (
                        <>
                          {' · '}
                          <span>{contractLabel}</span>
                        </>
                      ) : null}
                      {' · '}
                      <span>{locationText}</span>
                      {' · '}
                      <span className="tabular-nums">{formatRelativeDate(job.postedAt, ui, intlLocale)}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-sm font-extrabold tabular-nums block ${scoreTone}`}>
                      {job.matchScore}%
                    </span>
                    <span className="text-[11px] text-slate-500 block">{ui.matchLabel}</span>
                  </div>
                </div>

                {(job.matchedKeywords.length > 0 || salaryLabel) && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {job.matchedKeywords.length > 0 && (
                      <span>
                        <span className="font-semibold text-slate-800">{ui.inYourCvLabel}</span>{' '}
                        {job.matchedKeywords.map((k) => String(k)).join(', ')}
                      </span>
                    )}
                    {job.matchedKeywords.length > 0 && salaryLabel ? ' · ' : ''}
                    {salaryLabel && (
                      <span className="font-semibold text-slate-800 tabular-nums">
                        {ui.salaryLabel} {salaryLabel}
                      </span>
                    )}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQuickApplyJob(job);
                        setQuickApplyStep(appliedJobIds.has(job.id) ? 2 : 1);
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                        appliedJobIds.has(job.id)
                          ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-2xs'
                      }`}
                    >
                      {appliedJobIds.has(job.id) ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{applyUi.appliedBadge}</span>
                        </>
                      ) : (
                        <>
                          {guideMode === 'guided' && <Lightbulb className="w-3.5 h-3.5" />}
                          <span>{applyUi.applyNowBtn}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>

                    <a
                      href={getSafeExternalHttpUrl(job.applyUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>{applyUi.openPortalBtn}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <button
                    type="button"
                    disabled={tailoringJobId === job.id}
                    onClick={() => void handleTailorForJob(job, 'ats')}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    {tailoringJobId === job.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Target className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    <span>{ui.adaptAtsBtn}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* 2-Step Quick Apply Assistant Modal */}
      {quickApplyJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2 min-w-0">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                <h3 className="text-sm font-bold text-slate-950 dark:text-white truncate">
                  {applyUi.modalTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickApplyJob(null)}
                aria-label={applyUi.closeBtn}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Role summary header */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-950 dark:text-white leading-snug">
                    {quickApplyJob.title}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {quickApplyJob.company} · {quickApplyJob.sourceName}
                  </p>
                </div>
                <span className="font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-400 shrink-0 tabular-nums">
                  {quickApplyJob.matchScore}%
                </span>
              </div>

              {/* 2-Step Lightbulb Stepper */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setQuickApplyStep(1)}
                  className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                    quickApplyStep === 1
                      ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-400 text-slate-950 dark:text-white font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <LightbulbStepBadge step={1} active={quickApplyStep === 1} completed={quickApplyStep === 2} />
                  <span className="truncate">{applyUi.step1Heading}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQuickApplyStep(2)}
                  className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                    quickApplyStep === 2
                      ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-400 text-slate-950 dark:text-white font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <LightbulbStepBadge step={2} active={quickApplyStep === 2} completed={appliedJobIds.has(quickApplyJob.id)} />
                  <span className="truncate">{applyUi.step2Heading}</span>
                </button>
              </div>

              {quickApplyStep === 1 ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {applyUi.step1Desc}
                  </p>

                  {quickApplyJob.matchedKeywords.length > 0 && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{ui.inYourCvLabel}</span>{' '}
                      {quickApplyJob.matchedKeywords.join(', ')}
                    </p>
                  )}

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      disabled={tailoringJobId === quickApplyJob.id}
                      onClick={() => {
                        const targetJob = quickApplyJob;
                        setQuickApplyJob(null);
                        void handleTailorForJob(targetJob, 'ai');
                      }}
                      className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Wand2 className="w-4 h-4 shrink-0" />
                      <span>{applyUi.tailorWithAiBtn}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuickApplyStep(2)}
                      className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>{applyUi.useCurrentCvBtn}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {applyUi.step2Desc}
                  </p>

                  <div className="space-y-2 pt-1">
                    <a
                      href={getSafeExternalHttpUrl(quickApplyJob.applyUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>{applyUi.openOfficialLinkBtn} ({quickApplyJob.sourceName})</span>
                      <ExternalLink className="w-4 h-4 shrink-0" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        handleMarkAsApplied(quickApplyJob);
                        setQuickApplyJob(null);
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                        appliedJobIds.has(quickApplyJob.id)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900'
                      }`}
                    >
                      <Check className="w-4 h-4 shrink-0" />
                      <span>
                        {appliedJobIds.has(quickApplyJob.id)
                          ? applyUi.alreadyAppliedBtn
                          : applyUi.markAppliedBtn}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuickApplyStep(1)}
                      className="w-full py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      {applyUi.backToStep1Btn}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
