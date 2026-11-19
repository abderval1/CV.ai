import React, { useState, useRef, useEffect } from 'react';
import { CVData, TemplateStyle } from '../types/cv';
import { SAMPLE_JOB_OFFERS, AGOSTINHO_CV, TECH_LEAD_CV, GENERIC_DEFAULT_CV } from '../data/initialCV';
import portraitManImg from '../assets/images/portrait_executive_man_1794571428722.jpg';
import { useLanguage, SiteLanguageCode } from '../context/LanguageContext';
import { TOOLS_UI_TRANSLATIONS } from '../i18n/toolsUiTranslations';
import { authorizedFetch } from '../utils/authHeaders';
import {
  getStoredPromptSync,
  getStoredPlatformSettingsSync,
  trackFrontendTelemetry,
  logGenerationError
} from '../services/adminModulesService';
import {
  Wand2,
  Upload,
  FileText,
  Target,
  Loader2,
  Check,
  AlertCircle,
  Linkedin,
  HelpCircle,
  Trash2,
  Sparkles,
  Palette,
  Eye,
  ExternalLink,
  Camera
} from 'lucide-react';

interface LinkedInExtractionReport {
  directFetchStatus: string;
  groundingUsed: boolean;
  rawTextUsed: boolean;
  profilePhotoFound: boolean;
  groundingSources?: Array<{ title: string; uri: string }>;
  completenessScore: number;
  needsSupplementalPdfOrPaste?: boolean;
  extractionNotes?: string;
  counts: {
    experiences: number;
    competencies: number;
    educations: number;
    trainings: number;
    languages: number;
    highlightsTotal: number;
  };
}

const LINKEDIN_DEEP_COPY: Record<
  SiteLanguageCode,
  {
    subtitle: string;
    extractAllBtn: string;
    uploadPdfBtn: string;
    uploadPdfTitle: string;
    privateTipTitle: string;
    privateTipBody: string;
    privateTipCta: string;
    completenessLabel: string;
    photoFoundBadge: string;
    highlightsLabel: string;
    certsLabel: string;
    langsLabel: string;
    chooseStyleLabel: string;
    accentColorLabel: string;
    showPhotoLabel: string;
    applyAndViewBtn: string;
    sourcesLabel: string;
    helperPdfTip: string;
    styleOptions: Array<{ id: TemplateStyle; label: string }>;
  }
> = {
  pt: {
    subtitle:
      'Cole o URL do seu perfil (ou anexe o PDF do LinkedIn) para importar 100% dos cargos, conquistas, competências, formações, certificações, projetos e idiomas num CV bonito.',
    extractAllBtn: 'Puxar Tudo do LinkedIn',
    uploadPdfBtn: 'PDF do LinkedIn',
    uploadPdfTitle: 'No LinkedIn, clique em "Mais → Guardar como PDF" e anexe aqui para importar 100% mesmo se o perfil for privado',
    privateTipTitle: 'LinkedIn ocultou secções privadas via URL público',
    privateTipBody:
      'Extraímos os dados públicos indexados, mas para puxar 100% de todos os seus cargos, competências e certificações, abra o seu LinkedIn → "Mais" → "Guardar como PDF" e anexe o ficheiro aqui ou cole o texto abaixo.',
    privateTipCta: 'Anexar PDF do LinkedIn Agora',
    completenessLabel: 'Cobertura do Perfil',
    photoFoundBadge: 'Foto importada',
    highlightsLabel: 'Conquistas',
    certsLabel: 'Certificados & Projetos',
    langsLabel: 'Idiomas',
    chooseStyleLabel: 'Escolha o layout bonito do seu CV:',
    accentColorLabel: 'Cor de destaque:',
    showPhotoLabel: 'Incluir foto no CV',
    applyAndViewBtn: 'Aplicar Tudo e Abrir CV Bonito',
    sourcesLabel: 'Fontes públicas verificadas:',
    helperPdfTip: 'Dica Pro: Se o seu LinkedIn for privado, vá ao seu perfil → "Mais" → "Guardar como PDF" e clique em "PDF do LinkedIn" acima para puxar literalmente tudo.',
    styleOptions: [
      { id: 'executive_harvard', label: 'Harvard Executivo' },
      { id: 'tech_modern', label: 'Tech Moderno' },
      { id: 'creative_split', label: 'Criativo Split' },
      { id: 'un_classic', label: 'Corporativo' },
      { id: 'european_europass', label: 'Europass' },
      { id: 'ats_compact', label: 'ATS Puro' }
    ]
  },
  en: {
    subtitle:
      'Paste your profile URL (or attach your LinkedIn PDF) to pull 100% of your roles, achievements, skills, education, certifications, projects, and languages into a polished CV.',
    extractAllBtn: 'Pull Full LinkedIn Profile',
    uploadPdfBtn: 'LinkedIn PDF',
    uploadPdfTitle: 'On LinkedIn click "More → Save to PDF" and upload it here to extract 100% of private sections',
    privateTipTitle: 'LinkedIn hid private sections from public URL',
    privateTipBody:
      'We extracted all publicly indexed info, but to pull 100% of every job bullet, skill, and certificate, go to your LinkedIn → "More" → "Save to PDF" and upload it here.',
    privateTipCta: 'Upload LinkedIn PDF Now',
    completenessLabel: 'Profile Coverage',
    photoFoundBadge: 'Photo imported',
    highlightsLabel: 'Bullet Points',
    certsLabel: 'Certs & Projects',
    langsLabel: 'Languages',
    chooseStyleLabel: 'Choose your polished CV design:',
    accentColorLabel: 'Accent color:',
    showPhotoLabel: 'Include photo',
    applyAndViewBtn: 'Apply Full Profile & Open Beautiful CV',
    sourcesLabel: 'Verified public sources:',
    helperPdfTip: 'Pro Tip: If your profile has private sections, open LinkedIn → "More" → "Save to PDF" and click "LinkedIn PDF" above to pull literally everything.',
    styleOptions: [
      { id: 'executive_harvard', label: 'Harvard Executive' },
      { id: 'tech_modern', label: 'Tech Modern' },
      { id: 'creative_split', label: 'Creative Split' },
      { id: 'un_classic', label: 'Corporate Classic' },
      { id: 'european_europass', label: 'Europass' },
      { id: 'ats_compact', label: 'ATS Pure' }
    ]
  },
  es: {
    subtitle:
      'Pega la URL de tu perfil (o adjunta el PDF de LinkedIn) para importar el 100% de cargos, logros, competencias, formación, certificaciones, proyectos e idiomas en un CV profesional.',
    extractAllBtn: 'Extraer Todo de LinkedIn',
    uploadPdfBtn: 'PDF de LinkedIn',
    uploadPdfTitle: 'En LinkedIn haz clic en "Más → Guardar en PDF" y súbelo aquí para importar el 100%',
    privateTipTitle: 'LinkedIn ocultó secciones privadas en la URL pública',
    privateTipBody:
      'Extrajimos los datos públicos indexados. Para importar el 100% de tus puestos, habilidades y certificados, abre tu LinkedIn → "Más" → "Guardar en PDF" y adjúntalo aquí.',
    privateTipCta: 'Adjuntar PDF de LinkedIn Ahora',
    completenessLabel: 'Cobertura del Perfil',
    photoFoundBadge: 'Foto importada',
    highlightsLabel: 'Logros',
    certsLabel: 'Certificados y Proyectos',
    langsLabel: 'Idiomas',
    chooseStyleLabel: 'Elige el diseño elegante de tu CV:',
    accentColorLabel: 'Color de acento:',
    showPhotoLabel: 'Incluir foto',
    applyAndViewBtn: 'Aplicar Todo y Ver CV Elegante',
    sourcesLabel: 'Fuentes públicas verificadas:',
    helperPdfTip: 'Consejo Pro: Si tu perfil es privado, abre LinkedIn → "Más" → "Guardar en PDF" y súbelo con el botón "PDF de LinkedIn".',
    styleOptions: [
      { id: 'executive_harvard', label: 'Harvard Ejecutivo' },
      { id: 'tech_modern', label: 'Tech Moderno' },
      { id: 'creative_split', label: 'Creativo Split' },
      { id: 'un_classic', label: 'Corporativo' },
      { id: 'european_europass', label: 'Europass' },
      { id: 'ats_compact', label: 'ATS Puro' }
    ]
  },
  fr: {
    subtitle:
      'Collez l’URL de votre profil (ou importez votre PDF LinkedIn) pour récupérer 100 % de vos postes, réalisations, compétences, formations, certifications, projets et langues.',
    extractAllBtn: 'Tout Importer de LinkedIn',
    uploadPdfBtn: 'PDF LinkedIn',
    uploadPdfTitle: 'Sur LinkedIn, cliquez sur « Plus → Enregistrer au format PDF » et importez-le ici',
    privateTipTitle: 'LinkedIn a masqué des sections privées sur l’URL publique',
    privateTipBody:
      'Nous avons récupéré les données publiques indexées. Pour importer 100 % de vos expériences et certificats, ouvrez LinkedIn → « Plus » → « Enregistrer au format PDF » et importez-le ici.',
    privateTipCta: 'Importer le PDF LinkedIn',
    completenessLabel: 'Couverture du Profil',
    photoFoundBadge: 'Photo importée',
    highlightsLabel: 'Réalisations',
    certsLabel: 'Certificats & Projets',
    langsLabel: 'Langues',
    chooseStyleLabel: 'Choisissez le design de votre CV :',
    accentColorLabel: 'Couleur d’accent :',
    showPhotoLabel: 'Inclure la photo',
    applyAndViewBtn: 'Appliquer Tout et Ouvrir le Beau CV',
    sourcesLabel: 'Sources publiques vérifiées :',
    helperPdfTip: 'Astuce Pro : Si votre profil est privé, ouvrez LinkedIn → « Plus » → « Enregistrer au format PDF » puis cliquez sur « PDF LinkedIn ».',
    styleOptions: [
      { id: 'executive_harvard', label: 'Harvard Exécutif' },
      { id: 'tech_modern', label: 'Tech Moderne' },
      { id: 'creative_split', label: 'Créatif Split' },
      { id: 'un_classic', label: 'Corporate' },
      { id: 'european_europass', label: 'Europass' },
      { id: 'ats_compact', label: 'ATS Pur' }
    ]
  },
  de: {
    subtitle:
      'Fügen Sie Ihre Profil-URL ein (oder laden Sie Ihr LinkedIn-PDF hoch), um 100 % Ihrer Positionen, Erfolge, Skills, Abschlüsse, Zertifikate, Projekte und Sprachen in einen starken Lebenslauf zu übernehmen.',
    extractAllBtn: 'Alles von LinkedIn Laden',
    uploadPdfBtn: 'LinkedIn-PDF',
    uploadPdfTitle: 'Auf LinkedIn „Mehr → Als PDF speichern“ wählen und hier hochladen für 100 % Import',
    privateTipTitle: 'LinkedIn hat private Bereiche über die öffentliche URL verborgen',
    privateTipBody:
      'Öffentlich indexierte Daten wurden extrahiert. Für 100 % aller Positionen und Zertifikate öffnen Sie LinkedIn → „Mehr“ → „Als PDF speichern“ und laden es hier hoch.',
    privateTipCta: 'LinkedIn-PDF jetzt hochladen',
    completenessLabel: 'Profilabdeckung',
    photoFoundBadge: 'Foto importiert',
    highlightsLabel: 'Erfolge',
    certsLabel: 'Zertifikate & Projekte',
    langsLabel: 'Sprachen',
    chooseStyleLabel: 'Wählen Sie Ihr CV-Design:',
    accentColorLabel: 'Akzentfarbe:',
    showPhotoLabel: 'Foto einfügen',
    applyAndViewBtn: 'Alles Übernehmen & Schönes CV Öffnen',
    sourcesLabel: 'Verifizierte öffentliche Quellen:',
    helperPdfTip: 'Pro-Tipp: Bei privaten Profilen auf LinkedIn „Mehr → Als PDF speichern“ klicken und oben als „LinkedIn-PDF“ hochladen.',
    styleOptions: [
      { id: 'executive_harvard', label: 'Harvard Executive' },
      { id: 'tech_modern', label: 'Tech Modern' },
      { id: 'creative_split', label: 'Kreativ Split' },
      { id: 'un_classic', label: 'Corporate' },
      { id: 'european_europass', label: 'Europass' },
      { id: 'ats_compact', label: 'ATS Pur' }
    ]
  },
  it: {
    subtitle:
      'Incolla l’URL del tuo profilo (o allega il PDF di LinkedIn) per importare il 100% di ruoli, risultati, competenze, formazione, certificazioni, progetti e lingue in un CV curato.',
    extractAllBtn: 'Importa Tutto da LinkedIn',
    uploadPdfBtn: 'PDF LinkedIn',
    uploadPdfTitle: 'Su LinkedIn clicca "Altro → Salva come PDF" e caricalo qui per importare tutto al 100%',
    privateTipTitle: 'LinkedIn ha nascosto alcune sezioni private dall’URL pubblico',
    privateTipBody:
      'Abbiamo estratto i dati pubblici indicizzati. Per importare il 100% di ruoli e certificazioni, apri LinkedIn → "Altro" → "Salva come PDF" e caricalo qui.',
    privateTipCta: 'Carica PDF LinkedIn Ora',
    completenessLabel: 'Copertura Profilo',
    photoFoundBadge: 'Foto importata',
    highlightsLabel: 'Risultati',
    certsLabel: 'Certificati & Progetti',
    langsLabel: 'Lingue',
    chooseStyleLabel: 'Scegli il layout elegante del tuo CV:',
    accentColorLabel: 'Colore accento:',
    showPhotoLabel: 'Includi foto',
    applyAndViewBtn: 'Applica Tutto e Apri CV Curato',
    sourcesLabel: 'Fonti pubbliche verificate:',
    helperPdfTip: 'Consiglio Pro: Se il profilo è privato, apri LinkedIn → "Altro" → "Salva come PDF" e usa il pulsante "PDF LinkedIn" qui sopra.',
    styleOptions: [
      { id: 'executive_harvard', label: 'Harvard Esecutivo' },
      { id: 'tech_modern', label: 'Tech Moderno' },
      { id: 'creative_split', label: 'Creativo Split' },
      { id: 'un_classic', label: 'Corporate' },
      { id: 'european_europass', label: 'Europass' },
      { id: 'ats_compact', label: 'ATS Puro' }
    ]
  }
};

const LINKEDIN_ACCENT_PALETTE = [
  { hex: '#0f172a', label: 'Obsidian' },
  { hex: '#1e3a8a', label: 'Navy' },
  { hex: '#0f766e', label: 'Emerald' },
  { hex: '#4338ca', label: 'Indigo' },
  { hex: '#7c2d12', label: 'Burgundy' }
];

interface RawInputGeneratorProps {
  onCVGenerated: (generatedCV: CVData) => void;
  currentJobDescription: string;
  onUpdateJobDescription: (desc: string) => void;
  onOpenPreview: () => void;
}

export const RawInputGenerator: React.FC<RawInputGeneratorProps> = ({
  onCVGenerated,
  currentJobDescription,
  onUpdateJobDescription,
  onOpenPreview
}) => {
  const { siteLanguage } = useLanguage();
  const ui = (TOOLS_UI_TRANSLATIONS[siteLanguage] || TOOLS_UI_TRANSLATIONS.pt).rawGenerator;
  const [generationMode, setGenerationMode] = useState<'standard' | 'tailored'>(() => {
    try {
      const savedJob = localStorage.getItem('curriculo_job_draft_v1');
      if (savedJob && savedJob.trim().length > 20 && !SAMPLE_JOB_OFFERS.some((j) => j.description === savedJob)) {
        return 'tailored';
      }
    } catch {
      // ignore storage errors
    }
    return 'standard';
  });
  const [candidateRawText, setCandidateRawText] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>(
    currentJobDescription || SAMPLE_JOB_OFFERS[0].description
  );
  const [linkedInUrl, setLinkedInUrl] = useState<string>('');
  const [showLinkedInHelper, setShowLinkedInHelper] = useState<boolean>(false);
  const [showPresets, setShowPresets] = useState<boolean>(false);
  const [isLinkedInConnecting, setIsLinkedInConnecting] = useState<boolean>(false);
  const [isLinkedInExtracting, setIsLinkedInExtracting] = useState<boolean>(false);
  const lkUi = LINKEDIN_DEEP_COPY[siteLanguage] || LINKEDIN_DEEP_COPY.pt;
  const [linkedInJobState, setLinkedInJobState] = useState<{
    jobId: string;
    step: number;
    stepLabel: string;
    percent: number;
    extractedCV: CVData | null;
    extractionReport?: LinkedInExtractionReport;
    logs: string[];
  } | null>(null);
  const [lkSelectedStyle, setLkSelectedStyle] = useState<TemplateStyle>('executive_harvard');
  const [lkSelectedAccent, setLkSelectedAccent] = useState<string>('#0f172a');
  const [lkIncludePhoto, setLkIncludePhoto] = useState<boolean>(false);
  const [targetStandard, setTargetStandard] = useState<
    'onu' | 'tech' | 'harvard' | 'ats' | 'europass'
  >('onu');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [platformSettings, setPlatformSettings] = useState(() => getStoredPlatformSettingsSync());

  useEffect(() => {
    const syncHandler = () => setPlatformSettings(getStoredPlatformSettingsSync());
    window.addEventListener('admin-config-updated', syncHandler);
    return () => window.removeEventListener('admin-config-updated', syncHandler);
  }, []);

  const candidateFileInputRef = useRef<HTMLInputElement>(null);
  const linkedInPdfInputRef = useRef<HTMLInputElement>(null);
  const jobFileInputRef = useRef<HTMLInputElement>(null);
  const [isExtractingCandidateFile, setIsExtractingCandidateFile] = useState<boolean>(false);
  const [isExtractingJobFile, setIsExtractingJobFile] = useState<boolean>(false);

  // Load Executive Preset Profile
  const handleLoadExecutiveProfile = () => {
    const presetText = `${AGOSTINHO_CV.personalDetails.name}
${AGOSTINHO_CV.personalDetails.title}
${AGOSTINHO_CV.personalDetails.location} | ${AGOSTINHO_CV.personalDetails.phone} | ${AGOSTINHO_CV.personalDetails.email} | ${AGOSTINHO_CV.personalDetails.linkedin}
Website/Portfolio: ${AGOSTINHO_CV.personalDetails.website || 'https://beatrizfonseca.io'}

RESUMO PROFISSIONAL:
${AGOSTINHO_CV.summary}

EXPERIÊNCIAS PROFISSIONAIS:
1. ${AGOSTINHO_CV.experiences[0].company}
Cargo: ${AGOSTINHO_CV.experiences[0].role} (${AGOSTINHO_CV.experiences[0].period})
Principais entregas:
${AGOSTINHO_CV.experiences[0].highlights.map((h: string) => `- ${h}`).join('\n')}

2. ${AGOSTINHO_CV.experiences[1].company}
Cargo: ${AGOSTINHO_CV.experiences[1].role} (${AGOSTINHO_CV.experiences[1].period})
${AGOSTINHO_CV.experiences[1].highlights.map((h: string) => `- ${h}`).join('\n')}

FORMAÇÃO ACADÉMICA:
${AGOSTINHO_CV.educations.map((e: any) => `- ${e.degree}, ${e.institution} (${e.period})`).join('\n')}

COMPETÊNCIAS & FERRAMENTAS:
Estratégia Corporativa, M&A, Finanças Globais, Due Diligence, Governança, Power BI, IFRS, Gestão de Stakeholders.`;

    setCandidateRawText(presetText);
    setLinkedInUrl(AGOSTINHO_CV.personalDetails.linkedin || 'https://linkedin.com/in/beatriz-fonseca-exec');
    setTargetStandard('onu');
    setSuccessMessage(ui.msgExecLoaded);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Load Tech Lead Profile
  const handleLoadTechLeadProfile = () => {
    const presetText = `${TECH_LEAD_CV.personalDetails.name}
${TECH_LEAD_CV.personalDetails.title}
${TECH_LEAD_CV.personalDetails.location} | ${TECH_LEAD_CV.personalDetails.phone} | ${TECH_LEAD_CV.personalDetails.email} | ${TECH_LEAD_CV.personalDetails.linkedin}
Portfolio: ${TECH_LEAD_CV.personalDetails.website}

RESUMO PROFISSIONAL:
${TECH_LEAD_CV.summary}

EXPERIÊNCIAS PROFISSIONAIS:
1. ${TECH_LEAD_CV.experiences[0].company}
Cargo: ${TECH_LEAD_CV.experiences[0].role} (${TECH_LEAD_CV.experiences[0].period})
${TECH_LEAD_CV.experiences[0].highlights.map((h: string) => `- ${h}`).join('\n')}

2. ${TECH_LEAD_CV.experiences[1].company}
Cargo: ${TECH_LEAD_CV.experiences[1].role} (${TECH_LEAD_CV.experiences[1].period})
${TECH_LEAD_CV.experiences[1].highlights.map((h: string) => `- ${h}`).join('\n')}

FORMAÇÃO ACADÉMICA:
${TECH_LEAD_CV.educations.map((e: any) => `- ${e.degree}, ${e.institution} (${e.period})`).join('\n')}

COMPETÊNCIAS & STACK TÉCNICA:
Kubernetes, Docker, AWS (ECS, Lambda), Node.js, TypeScript, React, Python, PostgreSQL, Redis, CI/CD, DevSecOps, Microserviços.`;

    setCandidateRawText(presetText);
    setLinkedInUrl(TECH_LEAD_CV.personalDetails.linkedin || 'https://linkedin.com/in/manuelsilva-tech');
    setTargetStandard('tech');
    setSuccessMessage(ui.msgTechLoaded);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Load Finance Executive Profile
  const handleLoadFinanceProfile = () => {
    const presetText = `ISABEL AFONSO CARDOSO
Diretora Financeira & Controller de Risco | CFO Corporativo
Luanda, Angola | +244 923 888 999 | isabel.cardoso@financas.ao | linkedin.com/in/isabelcardoso-cfo

RESUMO PROFISSIONAL:
Executiva de finanças corporativas com 10+ anos de experiência na liderança de controladoria, auditoria externa, planeamento tributário e gestão de tesouraria de grande porte. Histórico comprovado de reestruturação de custos, negociação de linhas de crédito bancárias e reporte executivo segundo as normas IFRS/NIRF.

EXPERIÊNCIAS PROFISSIONAIS:
1. Grupo Empresarial Horizonte S.A.
Cargo: Diretora de Finanças & Contabilidade (2020 – Presente)
- Liderou equipa de 20 analistas financeiros e contabilistas gerindo orçamento anual superior a $45M USD.
- Implementou sistema ERP SAP S/4HANA Finance, reduzindo o tempo de fecho mensal de 15 para 4 dias úteis.
- Otimizou o capital de giro e tesouraria, reduzindo custos financeiros bancários em 28%.

2. Consultoria & Auditoria Big Four
Cargo: Gerente Sénior de Auditoria & Governação (2016 – 2020)
- Conduziu auditorias de demonstrações financeiras em bancos comerciais e multinacionais petrolíferas.
- Elaborou relatórios de conformidade tributária e prevenção contra branqueamento de capitais.

FORMAÇÃO ACADÉMICA:
- Mestrado Executivo em Finanças Corporativas (2018)
- Licenciatura em Economia e Gestão de Empresas (2012)

COMPETÊNCIAS CHAVE:
IFRS, Controladoria, Modelagem Financeira, SAP ERP, Auditoria, Governação Corporativa, Análise de Risco.`;

    setCandidateRawText(presetText);
    setLinkedInUrl('https://linkedin.com/in/isabelcardoso-cfo');
    setTargetStandard('harvard');
    setSuccessMessage(ui.msgFinLoaded);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Clear all fields to start completely fresh
  const handleClearAll = () => {
    setCandidateRawText('');
    setLinkedInUrl('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Helper to extract clean text from TXT, MD, JSON, PDF, DOCX, DOC, or RTF
  const extractTextFromFile = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const plainTextExts = ['txt', 'md', 'json', 'csv'];

    if (plainTextExts.includes(ext)) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve((event.target?.result as string) || '');
        reader.onerror = () => reject(new Error('Falha ao ler ficheiro de texto.'));
        reader.readAsText(file, 'UTF-8');
      });
    }

    // Binary or rich document (.pdf, .docx, .doc, .rtf): send base64 to /api/extract-document
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve((event.target?.result as string) || '');
      reader.onerror = () => reject(new Error('Falha ao carregar ficheiro.'));
      reader.readAsDataURL(file);
    });

    const response = await authorizedFetch('/api/extract-document', {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        base64Data
      })
    });

    const data = await response.json();
    if (!response.ok || !data.text) {
      throw new Error(data.error || ui.msgErrExtract);
    }

    return data.text;
  };

  // File upload reader for Candidate Text / Document
  const handleCandidateFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingCandidateFile(true);
    setErrorMessage(null);
    try {
      const text = await extractTextFromFile(file);
      if (text) {
        setCandidateRawText((prev) =>
          prev ? `${prev}\n\n--- IMPORTED (${file.name}) ---\n${text}` : text
        );
        setSuccessMessage(`${ui.msgDocImportedPrefix} "${file.name}" ${ui.msgDocImportedSuffix}`);
        setTimeout(() => setSuccessMessage(null), 3500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || ui.msgErrExtract);
    } finally {
      setIsExtractingCandidateFile(false);
      e.target.value = '';
    }
  };

  // File upload reader for Job Description / TdR / ToR Document
  const handleJobFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingJobFile(true);
    setErrorMessage(null);
    try {
      const text = await extractTextFromFile(file);
      if (text) {
        setJobDescription(text);
        onUpdateJobDescription(text);
        setSuccessMessage(`${ui.msgJobDocImportedPrefix} "${file.name}" ${ui.msgJobDocImportedSuffix}`);
        setTimeout(() => setSuccessMessage(null), 3500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || ui.msgErrExtract);
    } finally {
      setIsExtractingJobFile(false);
      e.target.value = '';
    }
  };

  // Public LinkedIn Full Profile Deep Extraction Job (URL + Public HTML/JSON-LD + Web Grounding + Optional PDF/Text)
  const handleExtractLinkedInBackgroundJob = async (overrideRawText?: string) => {
    const effectiveRawText = typeof overrideRawText === 'string' ? overrideRawText : candidateRawText;
    if (!linkedInUrl.trim() && !effectiveRawText.trim()) {
      setErrorMessage(ui.msgErrLinkedInUrl);
      return;
    }

    setIsLinkedInExtracting(true);
    setErrorMessage(null);

    const initialJobId = `job_lk_${Math.random().toString(36).substring(2, 8)}`;
    setLinkedInJobState({
      jobId: initialJobId,
      step: 1,
      stepLabel: ui.step1Label,
      percent: 25,
      extractedCV: null,
      logs: [ui.logStart]
    });

    const stepTimer1 = setTimeout(() => {
      setLinkedInJobState((prev) =>
        prev && prev.percent < 60
          ? {
              ...prev,
              step: 2,
              stepLabel: ui.step2Label,
              percent: 58,
              logs: [...prev.logs, ui.logStep2]
            }
          : prev
      );
    }, 650);

    const stepTimer2 = setTimeout(() => {
      setLinkedInJobState((prev) =>
        prev && prev.percent < 85
          ? {
              ...prev,
              step: 3,
              stepLabel: ui.generatingStandard,
              percent: 82,
              logs: prev.logs
            }
          : prev
      );
    }, 2200);

    try {
      const res = await authorizedFetch('/api/extract-linkedin', {
        method: 'POST',
        body: JSON.stringify({
          url: linkedInUrl.trim(),
          rawText: effectiveRawText,
          targetStandard,
          language: siteLanguage
        })
      });

      const data = await res.json();
      if (!res.ok && !data.extractedCV) {
        throw new Error(data.error || ui.msgErrExtract);
      }

      const extractedCV: CVData = data.extractedCV;
      setLkSelectedStyle(extractedCV.templateStyle || 'executive_harvard');
      setLkSelectedAccent(extractedCV.accentColor || '#0f172a');
      setLkIncludePhoto(Boolean(extractedCV.personalDetails?.photoUrl && extractedCV.personalDetails?.showPhoto));

      setLinkedInJobState({
        jobId: data.jobId || initialJobId,
        step: 4,
        stepLabel: ui.step4Label,
        percent: 100,
        extractedCV,
        extractionReport: data.extractionReport,
        logs: data.logs || [ui.logDone1, ui.logDone2, ui.logDone3]
      });

      setSuccessMessage(ui.msgLinkedInSuccess);
    } catch (err: any) {
      console.error('Erro na extração do LinkedIn:', err);
      setErrorMessage(err.message || ui.msgErrExtract);
      setLinkedInJobState(null);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsLinkedInExtracting(false);
    }
  };

  // One-click LinkedIn PDF ("More -> Save to PDF") uploader & immediate full extractor
  const handleLinkedInPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLinkedInExtracting(true);
    setErrorMessage(null);
    try {
      const text = await extractTextFromFile(file);
      if (text) {
        setCandidateRawText(text);
        await handleExtractLinkedInBackgroundJob(text);
      }
    } catch (err: any) {
      setErrorMessage(err.message || ui.msgErrExtract);
      setIsLinkedInExtracting(false);
    } finally {
      e.target.value = '';
    }
  };

  // Apply styled LinkedIn CV directly and jump to beautiful A4 preview
  const handleApplyLinkedInCV = (openPreviewImmediately = true) => {
    if (!linkedInJobState?.extractedCV) return;
    const base = linkedInJobState.extractedCV;
    const finalCV: CVData = {
      ...base,
      templateStyle: lkSelectedStyle,
      accentColor: lkSelectedAccent,
      fontFamily: lkSelectedStyle === 'executive_harvard' || lkSelectedStyle === 'un_classic' ? 'garamond' : 'jakarta',
      personalDetails: {
        ...base.personalDetails,
        photoUrl: base.personalDetails.photoUrl || undefined,
        showPhoto: Boolean(
          base.personalDetails.photoUrl &&
            (lkIncludePhoto || lkSelectedStyle === 'european_europass')
        )
      }
    };
    onCVGenerated(finalCV);
    setSuccessMessage(ui.msgLinkedInApplied);
    if (openPreviewImmediately) {
      setTimeout(() => onOpenPreview(), 250);
    }
  };

  // Quick fallback link sync
  const handleConnectLinkedIn = () => {
    void handleExtractLinkedInBackgroundJob();
  };

  // Heuristic parser fallback in case server API is offline or disabled
  const parseRawTextToCV = (
    rawText: string,
    jobDesc: string,
    mode: 'standard' | 'tailored'
  ): CVData => {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('--- DOCUMENTO IMPORTADO'));
    const firstLine = lines[0] || 'NOVO PROFISSIONAL';
    const secondLine = lines[1] || 'Especialista Profissional';

    const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : '';

    const phoneMatch = rawText.match(/(\+?\d[\d\s()-]{7,}\d)/);
    const phone = phoneMatch ? phoneMatch[0].trim() : '';

    const lMatch = rawText.match(/(https?:\/\/[^\s]*linkedin\.com\/[^\s]+|linkedin\.com\/in\/[^\s]+)/i);
    const linkedin = lMatch ? lMatch[0] : linkedInUrl || 'linkedin.com/in/perfil';

    const siteMatch = rawText.match(/https?:\/\/(?![^\s]*linkedin\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*/i);
    const website = siteMatch ? siteMatch[0] : undefined;

    const bulletLines = lines
      .filter((l) => /^[-•*]\s+/.test(l))
      .map((l) => l.replace(/^[-•*]\s+/, '').trim())
      .filter((l) => l.length > 8);

    const resolvedTemplateStyle =
      targetStandard === 'harvard'
        ? 'executive_harvard'
        : targetStandard === 'tech'
        ? 'tech_modern'
        : targetStandard === 'ats'
        ? 'ats_compact'
        : targetStandard === 'europass'
        ? 'european_europass'
        : 'un_classic';

    return {
      personalDetails: {
        name: firstLine.replace(/[:|].*$/, '').toUpperCase().slice(0, 60),
        title: secondLine.slice(0, 90),
        location: 'Cidade, País',
        phone,
        email,
        linkedin,
        website,
        photoUrl:
          targetStandard === 'europass'
            ? portraitManImg
            : undefined,
        showPhoto: targetStandard === 'europass'
      },
      summary:
        mode === 'tailored' && jobDesc.trim()
          ? `Profissional com sólida experiência prática em ${secondLine}, com perfil alinhado às exigências de ${jobDesc
              .slice(0, 90)
              .replace(/\n/g, ' ')}. Histórico comprovado de entregas com rigor técnico, colaboração e foco em resultados.`
          : `Profissional com experiência na área de ${secondLine}, focado em qualidade de execução, organização técnica, melhoria contínua e entrega consistente de resultados.`,
      competencies: [
        {
          id: 'comp-1',
          category: 'Competências Principais',
          description:
            lines
              .slice(2, 12)
              .filter((l) => l.length < 90 && !l.includes('@'))
              .slice(0, 3)
              .join(', ') || 'Gestão de Processos, Comunicação Profissional e Execução Técnica'
        },
        {
          id: 'comp-2',
          category: 'Ferramentas & Metodologias',
          description: 'Planeamento operacional, reporte estruturado, análise de dados e garantia de qualidade.'
        }
      ],
      experiences: [
        {
          id: 'exp-1',
          company: 'Experiência Extraída do Documento',
          role: secondLine.slice(0, 80),
          period: 'Período Profissional',
          highlights:
            bulletLines.length > 0
              ? bulletLines.slice(0, 5)
              : lines.slice(2, 6).filter((l) => l.length > 15).slice(0, 3).length > 0
              ? lines.slice(2, 6).filter((l) => l.length > 15).slice(0, 3)
              : [
                  'Execução de atividades técnicas e operacionais conforme o histórico importado.',
                  'Colaboração com equipas multidisciplinares para o cumprimento de metas e prazos.'
                ]
        }
      ],
      educations: [
        {
          id: 'edu-1',
          degree: 'Formação Académica (Rever/Editar no Editor)',
          institution: 'Instituição de Ensino',
          period: 'Conclusão'
        }
      ],
      trainings: ['Certificações e Formações Extraídas'],
      languages: [
        { language: 'Português', level: 'Fluente / Nativo' },
        { language: 'Inglês', level: 'Intermédio / Profissional' }
      ],
      references: [],
      templateStyle: resolvedTemplateStyle
    };
  };

  // Generate CV (either Standard CV only OR Tailored to a specific job)
  const handleGenerateCV = async (overrideMode?: 'standard' | 'tailored') => {
    const activeMode = overrideMode || generationMode;
    if (overrideMode && overrideMode !== generationMode) {
      setGenerationMode(overrideMode);
    }

    if (!candidateRawText.trim() && !linkedInUrl.trim()) {
      setErrorMessage(ui.msgErrNoInput);
      return;
    }

    if (activeMode === 'tailored' && !jobDescription.trim()) {
      setErrorMessage(ui.msgErrNoJob);
      return;
    }

    if (platformSettings.enableAiFeaturesGlobally === false) {
      const fallbackCV = parseRawTextToCV(candidateRawText, jobDescription, activeMode);
      onCVGenerated(fallbackCV);
      setSuccessMessage(
        activeMode === 'standard'
          ? ui.msgAiPausedStandard
          : ui.msgAiPausedTailored
      );
      setTimeout(() => onOpenPreview(), 900);
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const adminPromptConfig = getStoredPromptSync('resumeSummary');

    try {
      const response = await authorizedFetch('/api/generate-from-raw', {
        method: 'POST',
        body: JSON.stringify({
          generationMode: activeMode,
          rawCandidateInfo: candidateRawText,
          jobDescription: activeMode === 'tailored' ? jobDescription : '',
          candidateLinkedIn: linkedInUrl,
          targetStandard:
            targetStandard === 'tech'
              ? 'Big Tech & Google XYZ Formula (Quantified Accomplishments)'
              : targetStandard === 'harvard'
              ? 'Harvard Business School Executive & Corporate Finance'
              : targetStandard === 'ats'
              ? 'Universal ATS Keyword Density (Zero-Rejection)'
              : targetStandard === 'europass'
              ? 'Padrão Europeu Europass com Foto e CEFR (União Europeia)'
              : 'Padrão Corporativo & Projetos Globais (Governança e Resultados Estratégicos)',
          adminPromptConfig
        })
      });

      if (!response.ok) {
        throw new Error(`Erro do servidor (${response.status})`);
      }

      const generatedData = await response.json();
      trackFrontendTelemetry({ type: 'ai_called', feature: 'rawImport', tokens: 2100 });

      if (generatedData && generatedData.personalDetails) {
        const fullCV: CVData = {
          personalDetails: {
            name: generatedData.personalDetails.name || 'SEU NOME COMPLETO',
            title: generatedData.personalDetails.title || 'Especialista Profissional',
            location: generatedData.personalDetails.location || 'Cidade, País',
            phone: generatedData.personalDetails.phone || '',
            email: generatedData.personalDetails.email || '',
            linkedin: generatedData.personalDetails.linkedin || linkedInUrl || 'linkedin.com/in/seu-perfil',
            website: generatedData.personalDetails.website,
            photoUrl:
              targetStandard === 'europass'
                ? portraitManImg
                : undefined,
            showPhoto: targetStandard === 'europass'
          },
          summary: generatedData.summary || GENERIC_DEFAULT_CV.summary,
          competencies:
            generatedData.competencies && generatedData.competencies.length > 0
              ? generatedData.competencies
              : GENERIC_DEFAULT_CV.competencies,
          experiences:
            generatedData.experiences && generatedData.experiences.length > 0
              ? generatedData.experiences
              : GENERIC_DEFAULT_CV.experiences,
          educations:
            generatedData.educations && generatedData.educations.length > 0
              ? generatedData.educations
              : GENERIC_DEFAULT_CV.educations,
          trainings:
            generatedData.trainings && generatedData.trainings.length > 0
              ? generatedData.trainings
              : GENERIC_DEFAULT_CV.trainings,
          languages:
            generatedData.languages && generatedData.languages.length > 0
              ? generatedData.languages
              : GENERIC_DEFAULT_CV.languages,
          references: Array.isArray(generatedData.references)
            ? generatedData.references
            : GENERIC_DEFAULT_CV.references,
          templateStyle:
            targetStandard === 'harvard'
              ? 'executive_harvard'
              : targetStandard === 'tech'
              ? 'tech_modern'
              : targetStandard === 'ats'
              ? 'ats_compact'
              : targetStandard === 'europass'
              ? 'european_europass'
              : 'un_classic'
        };

        onCVGenerated(fullCV);
        setSuccessMessage(
          activeMode === 'standard'
            ? ui.msgSuccessStandard
            : ui.msgSuccessTailored
        );
        setTimeout(() => {
          onOpenPreview();
        }, 1200);
      } else {
        throw new Error('Formato retornado inválido.');
      }
    } catch (err: any) {
      console.warn('API indisponível ou em fallback, acionando gerador estruturado inteligente:', err);
      logGenerationError({
        timestamp: new Date().toISOString(),
        userEmail: 'raw-generator@client',
        operationType: 'gemini_ai_call',
        errorMessage: `[RawInputGenerator] ${err?.message || 'Fallback acionado'}`,
        modelUsed: adminPromptConfig?.preferredModel || 'gemini-4-hydrogen',
        resolved: false
      });
      // Smart client-side fallback parsing the actual candidate's input
      const fallbackCV = parseRawTextToCV(candidateRawText, jobDescription, activeMode);
      onCVGenerated(fallbackCV);
      setSuccessMessage(
        activeMode === 'standard'
          ? ui.msgFallbackStandard
          : ui.msgFallbackTailored
      );
      setTimeout(() => {
        onOpenPreview();
      }, 1000);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Compact Header & Mode / Standard Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {ui.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Compact Mode Switcher */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setGenerationMode('standard');
                  setErrorMessage(null);
                }}
                title={ui.modeStandardDesc}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                  generationMode === 'standard'
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {ui.modeStandardTitle}
              </button>
              <button
                type="button"
                onClick={() => {
                  setGenerationMode('tailored');
                  setErrorMessage(null);
                }}
                title={ui.modeTailoredDesc}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                  generationMode === 'tailored'
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {ui.modeTailoredTitle}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowPresets((prev) => !prev)}
              title={ui.presetsLabel}
              className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                showPresets
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {ui.presetsLabel}
            </button>

            {candidateRawText && (
              <button
                type="button"
                onClick={handleClearAll}
                className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                title={ui.clearTitle}
                aria-label={ui.clearBtn}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Career Presets */}
        {showPresets && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => {
                handleLoadExecutiveProfile();
                setShowPresets(false);
              }}
              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 transition-colors"
              title={ui.presetExecTitle}
            >
              {ui.presetExec}
            </button>
            <button
              type="button"
              onClick={() => {
                handleLoadTechLeadProfile();
                setShowPresets(false);
              }}
              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 transition-colors"
              title={ui.presetTechTitle}
            >
              {ui.presetTech}
            </button>
            <button
              type="button"
              onClick={() => {
                handleLoadFinanceProfile();
                setShowPresets(false);
              }}
              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 transition-colors"
              title={ui.presetFinTitle}
            >
              {ui.presetFin}
            </button>
          </div>
        )}

        {/* Compact Target Standard Selector */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 font-medium">{ui.targetLabel}</span>
          <div className="flex flex-wrap items-center gap-1">
            {(
              [
                { id: 'onu', label: ui.stdOnu, title: ui.stdOnuTitle },
                { id: 'tech', label: ui.stdTech, title: ui.stdTechTitle },
                { id: 'harvard', label: ui.stdHarvard, title: ui.stdHarvardTitle },
                { id: 'europass', label: ui.stdEuropass, title: ui.stdEuropassTitle },
                { id: 'ats', label: ui.stdAts, title: ui.stdAtsTitle }
              ] as const
            ).map((std) => (
              <button
                key={std.id}
                type="button"
                onClick={() => setTargetStandard(std.id)}
                title={std.title}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors ${
                  targetStandard === std.id
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-950'
                }`}
              >
                {std.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Layout: Full Width in Standard Mode, 2-Column Split in Tailored Mode */}
      <div className={`grid grid-cols-1 ${generationMode === 'tailored' ? 'xl:grid-cols-2' : ''} gap-5`}>
        {/* COLUMN 1: O Seu Histórico / Informações / LinkedIn */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-800" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {ui.sec1Title}
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Upload text or document button */}
                <input
                  type="file"
                  ref={candidateFileInputRef}
                  onChange={handleCandidateFileUpload}
                  accept=".txt,.md,.json,.pdf,.docx,.doc,.rtf"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isExtractingCandidateFile}
                  onClick={() => candidateFileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-md transition-colors"
                  title={ui.importFileTitle}
                >
                  {isExtractingCandidateFile ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Upload className="w-3 h-3" />
                  )}
                  <span>{isExtractingCandidateFile ? ui.importingFileBtn : ui.importFileBtn}</span>
                </button>
              </div>
            </div>

            {/* LinkedIn Full Profile Deep Extractor & Beautiful CV Builder */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200/90 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <Linkedin className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>{ui.linkedinTitle}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLinkedInHelper(!showLinkedInHelper)}
                  className="text-[11px] text-blue-700 hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{ui.linkedinHowBtn}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                {lkUi.subtitle}
              </p>

              <input
                type="file"
                ref={linkedInPdfInputRef}
                onChange={handleLinkedInPdfUpload}
                accept=".pdf,.txt,.docx,.doc,.rtf"
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={linkedInUrl}
                  onChange={(e) => setLinkedInUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleExtractLinkedInBackgroundJob();
                    }
                  }}
                  placeholder={ui.linkedinPlaceholder}
                  className="flex-1 text-xs px-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 text-slate-800 placeholder:text-slate-400"
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => linkedInPdfInputRef.current?.click()}
                    disabled={isLinkedInExtracting}
                    title={lkUi.uploadPdfTitle}
                    className="px-3 py-2 text-xs font-semibold text-blue-800 bg-white hover:bg-blue-100/60 border border-blue-300 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{lkUi.uploadPdfBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleExtractLinkedInBackgroundJob()}
                    disabled={isLinkedInExtracting}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs flex items-center justify-center gap-1.5"
                  >
                    {isLinkedInExtracting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{ui.linkedinExtracting}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>{lkUi.extractAllBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Background Extraction Job Tracker & Instant Beautiful CV Styler */}
              {linkedInJobState && (
                <div className="p-3.5 bg-white rounded-xl border border-blue-300 shadow-xs space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {linkedInJobState.percent < 100 ? (
                        <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                      )}
                      <span className="font-bold text-slate-900 font-mono text-[11px]">
                        {linkedInJobState.extractedCV?.personalDetails?.name || `ID: ${linkedInJobState.jobId}`}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {linkedInJobState.extractionReport
                        ? `${lkUi.completenessLabel}: ${linkedInJobState.extractionReport.completenessScore}%`
                        : `${linkedInJobState.percent}% ${ui.completedSuffix}`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${linkedInJobState.percent}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-600 font-medium">
                    {linkedInJobState.stepLabel}
                  </p>

                  {/* Extracted Data Breakdown + Beauty Layout Picker */}
                  {linkedInJobState.extractedCV && (
                    <div className="pt-2.5 border-t border-slate-100 space-y-3">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-2 text-slate-700">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {linkedInJobState.extractedCV.personalDetails.name}
                            </p>
                            <p className="text-slate-600 truncate">
                              {linkedInJobState.extractedCV.personalDetails.title}
                            </p>
                          </div>
                          {linkedInJobState.extractionReport?.profilePhotoFound && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold shrink-0">
                              <Camera className="w-3 h-3" />
                              <span>{lkUi.photoFoundBadge}</span>
                            </span>
                          )}
                        </div>

                        {/* Complete Section Counts Grid */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center pt-1">
                          <div className="px-1.5 py-1 bg-white rounded border border-slate-200">
                            <p className="font-bold text-slate-900 tabular-nums">
                              {linkedInJobState.extractedCV.experiences.length}
                            </p>
                            <p className="text-[9px] text-slate-500 truncate">{ui.rolesExtractedLabel}</p>
                          </div>
                          <div className="px-1.5 py-1 bg-white rounded border border-slate-200">
                            <p className="font-bold text-slate-900 tabular-nums">
                              {linkedInJobState.extractionReport?.counts?.highlightsTotal ??
                                linkedInJobState.extractedCV.experiences.reduce((s, e) => s + e.highlights.length, 0)}
                            </p>
                            <p className="text-[9px] text-slate-500 truncate">{lkUi.highlightsLabel}</p>
                          </div>
                          <div className="px-1.5 py-1 bg-white rounded border border-slate-200">
                            <p className="font-bold text-slate-900 tabular-nums">
                              {linkedInJobState.extractedCV.competencies.length}
                            </p>
                            <p className="text-[9px] text-slate-500 truncate">{ui.atsSkillsLabel}</p>
                          </div>
                          <div className="px-1.5 py-1 bg-white rounded border border-slate-200">
                            <p className="font-bold text-slate-900 tabular-nums">
                              {linkedInJobState.extractedCV.educations.length}
                            </p>
                            <p className="text-[9px] text-slate-500 truncate">{ui.educationsLabel}</p>
                          </div>
                          <div className="px-1.5 py-1 bg-white rounded border border-slate-200">
                            <p className="font-bold text-slate-900 tabular-nums">
                              {linkedInJobState.extractedCV.trainings.length}
                            </p>
                            <p className="text-[9px] text-slate-500 truncate">{lkUi.certsLabel}</p>
                          </div>
                          <div className="px-1.5 py-1 bg-white rounded border border-slate-200">
                            <p className="font-bold text-slate-900 tabular-nums">
                              {linkedInJobState.extractedCV.languages.length}
                            </p>
                            <p className="text-[9px] text-slate-500 truncate">{lkUi.langsLabel}</p>
                          </div>
                        </div>
                      </div>

                      {/* Honest Authwall Notice with 1-Click PDF Fallback if LinkedIn blocked private fields */}
                      {linkedInJobState.extractionReport?.needsSupplementalPdfOrPaste && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-2">
                          <p className="font-bold flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>{lkUi.privateTipTitle}</span>
                          </p>
                          <p className="leading-relaxed text-amber-800">{lkUi.privateTipBody}</p>
                          <button
                            type="button"
                            onClick={() => linkedInPdfInputRef.current?.click()}
                            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-md text-[11px] inline-flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{lkUi.privateTipCta}</span>
                          </button>
                        </div>
                      )}

                      {/* Verified Public Sources (when Google Search grounding returned sources) */}
                      {linkedInJobState.extractionReport?.groundingSources &&
                        linkedInJobState.extractionReport.groundingSources.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                            <span className="font-semibold">{lkUi.sourcesLabel}</span>
                            {linkedInJobState.extractionReport.groundingSources.slice(0, 4).map((src) => (
                              <a
                                key={src.uri}
                                href={src.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 truncate max-w-[180px]"
                              >
                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{src.title}</span>
                              </a>
                            ))}
                          </div>
                        )}

                      {/* Beautiful Visual Layout & Color Styler */}
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5 text-amber-600" />
                            <span>{lkUi.chooseStyleLabel}</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500">{lkUi.accentColorLabel}</span>
                            {LINKEDIN_ACCENT_PALETTE.map((c) => (
                              <button
                                key={c.hex}
                                type="button"
                                onClick={() => setLkSelectedAccent(c.hex)}
                                title={c.label}
                                className={`w-4 h-4 rounded-full border transition-transform ${
                                  lkSelectedAccent === c.hex
                                    ? 'scale-125 border-slate-900 ring-2 ring-amber-400'
                                    : 'border-white/70 opacity-80 hover:opacity-100'
                                }`}
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {lkUi.styleOptions.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setLkSelectedStyle(opt.id)}
                              className={`px-2 py-1 rounded-md text-[10px] font-semibold border transition-colors ${
                                lkSelectedStyle === opt.id
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                          <label className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-white border border-slate-200 text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={lkIncludePhoto}
                              onChange={(e) => setLkIncludePhoto(e.target.checked)}
                              className="rounded border-slate-300"
                            />
                            <span>{lkUi.showPhotoLabel}</span>
                          </label>
                        </div>
                      </div>

                      {/* Primary Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => handleApplyLinkedInCV(true)}
                          className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>{lkUi.applyAndViewBtn}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (linkedInJobState.extractedCV) {
                              const cv = linkedInJobState.extractedCV;
                              const text = `${cv.personalDetails.name}\n${cv.personalDetails.title}\n${[
                                cv.personalDetails.location,
                                cv.personalDetails.phone,
                                cv.personalDetails.email,
                                cv.personalDetails.linkedin,
                                cv.personalDetails.website
                              ]
                                .filter(Boolean)
                                .join(' | ')}\n\nRESUMO:\n${cv.summary}\n\nEXPERIÊNCIAS:\n${cv.experiences
                                .map(
                                  (e) =>
                                    `${e.role} @ ${e.company} (${e.period}${e.location ? ` · ${e.location}` : ''})\n${e.highlights
                                      .map((h) => `- ${h}`)
                                      .join('\n')}`
                                )
                                .join('\n\n')}\n\nCOMPETÊNCIAS:\n${cv.competencies
                                .map((c) => `- ${c.category}: ${c.description}`)
                                .join('\n')}\n\nFORMAÇÃO ACADÉMICA:\n${cv.educations
                                .map((ed) => `- ${ed.degree}, ${ed.institution} (${ed.period})`)
                                .join('\n')}\n\nCERTIFICAÇÕES, PROJETOS & CURSOS:\n${cv.trainings
                                .map((t) => `- ${t}`)
                                .join('\n')}\n\nIDIOMAS:\n${cv.languages
                                .map((l) => `- ${l.language}: ${l.level}`)
                                .join('\n')}`;
                              setCandidateRawText(text);
                              setSuccessMessage(ui.msgLinkedInPasted);
                            }
                          }}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                        >
                          {ui.pasteRawBtn}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showLinkedInHelper && (
                <div className="text-[11px] text-blue-900/90 bg-white p-3 rounded-lg border border-blue-200 space-y-1.5">
                  <p className="font-semibold text-blue-950">{ui.linkedinHelperTitle}</p>
                  <p>{ui.linkedinHelper1}</p>
                  <p>{ui.linkedinHelper2}</p>
                  <p>{ui.linkedinHelper3}</p>
                  <p className="pt-1 font-medium text-blue-800">{lkUi.helperPdfTip}</p>
                </div>
              )}
            </div>

            {/* Candidate Raw Text Area */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {ui.rawTextareaLabel}
              </label>
              <textarea
                rows={7}
                value={candidateRawText}
                onChange={(e) => setCandidateRawText(e.target.value)}
                placeholder={ui.rawPlaceholder}
                className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 leading-relaxed font-sans placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span>{candidateRawText.length} {ui.charsInsertedSuffix}</span>
            {generationMode === 'standard' && (
              <button
                type="button"
                onClick={() => setGenerationMode('tailored')}
                className="text-slate-600 hover:text-slate-900 font-semibold underline underline-offset-2"
              >
                {ui.switchToTailoredBtn}
              </button>
            )}
          </div>
        </div>

        {/* COLUMN 2: A Vaga Pretendida & TdR (Only shown in tailored mode) */}
        {generationMode === 'tailored' && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-slate-800" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {ui.sec2Title}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    ref={jobFileInputRef}
                    onChange={handleJobFileUpload}
                    accept=".txt,.md,.pdf,.docx,.doc,.rtf"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isExtractingJobFile}
                    onClick={() => jobFileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-md transition-colors"
                    title={ui.importTdrTitle}
                  >
                    {isExtractingJobFile ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    <span>{isExtractingJobFile ? ui.importingTdrBtn : ui.importTdrBtn}</span>
                  </button>
                </div>
              </div>

              {/* Presets Row */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] text-slate-400">{ui.sampleJobsLabel}</span>
                {SAMPLE_JOB_OFFERS.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => {
                      setJobDescription(job.description);
                      onUpdateJobDescription(job.description);
                    }}
                    className={`px-2.5 py-1 text-[11px] rounded-md transition-colors border ${
                      jobDescription.includes(job.title.split(' - ')[0])
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {ui.jobChipLabels[job.id as keyof typeof ui.jobChipLabels] || job.title}
                  </button>
                ))}
              </div>

              {/* Job Text Area */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {ui.jobTextareaLabel}
                </label>
                <textarea
                  rows={8}
                  value={jobDescription}
                  onChange={(e) => {
                    setJobDescription(e.target.value);
                    onUpdateJobDescription(e.target.value);
                  }}
                  placeholder={ui.jobTextareaPlaceholder}
                  className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 leading-relaxed font-sans placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              <span>{jobDescription.length} {ui.charsInJobSuffix}</span>
              <button
                type="button"
                onClick={() => setGenerationMode('standard')}
                className="text-slate-600 hover:text-slate-900 font-semibold underline underline-offset-2"
              >
                {ui.switchToStandardBtn}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Trigger Action Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            {generationMode === 'standard'
              ? ui.bannerDescStandard
              : ui.bannerDescTailored}
          </div>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            {generationMode === 'tailored' && (
              <button
                type="button"
                onClick={() => handleGenerateCV('standard')}
                disabled={isGenerating}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{ui.generateOnlyBtn}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleGenerateCV(generationMode)}
              disabled={isGenerating}
              className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg whitespace-nowrap shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>
                    {generationMode === 'standard'
                      ? ui.generatingStandard
                      : ui.generatingTailored}
                  </span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 text-amber-400" />
                  <span>
                    {generationMode === 'standard'
                      ? ui.generateStandardCta
                      : ui.generateTailoredCta}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
