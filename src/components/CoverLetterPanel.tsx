import React, { useState, useEffect } from 'react';
import { CVData } from '../types/cv';
import { useAuth } from '../context/AuthContext';
import { useLanguage, LanguageCode } from '../context/LanguageContext';
import { TOOLS_UI_TRANSLATIONS } from '../i18n/toolsUiTranslations';
import {
  FileText,
  PenLine,
  Copy,
  Check,
  Printer,
  Loader2,
  Download,
  Lock
} from 'lucide-react';
import { generateCoverLetterDocx, triggerDownload } from '../utils/docxExport';
import { authorizedFetch } from '../utils/authHeaders';
import {
  getStoredPromptSync,
  getStoredPlatformSettingsSync,
  trackFrontendTelemetry,
  logGenerationError
} from '../services/adminModulesService';

interface CoverLetterPanelProps {
  cv: CVData;
  jobDescription: string;
  letterBody: string;
  setLetterBody: (body: string) => void;
  onExportWord?: () => void;
  isExportingWord?: boolean;
  onOpenPricingModal?: (promptMessage?: string) => void;
  onSelectLanguage?: (lang: LanguageCode) => void;
  isTranslatingContent?: boolean;
  contentLanguage?: LanguageCode;
}

type SupportedLanguage = 'pt' | 'en' | 'fr' | 'es' | 'de';
type LetterTone = 'executive' | 'un_diplomatic' | 'tech' | 'corporate';

const COVER_PANEL_UI = {
  pt: {
    title: 'Carta de Apresentação & Motivação',
    subtitle: 'Personalize o destinatário, empresa e idioma para redigir uma carta formal alinhada ao currículo.',
    recipientLabel: 'Destinatário (Pessoa / Comité)',
    orgLabel: 'Empresa / Organização Alvo',
    roleLabel: 'Cargo Pretendido na Vaga',
    generatingBtn: 'A Redigir Carta com IA...',
    generateBtn: 'Gerar Carta Adaptada ao Perfil',
    copyBtn: 'Copiar Texto',
    copiedBtn: 'Copiado!',
    wordBtn: 'Descarregar Carta Word (.docx)',
    bodyLabel: 'Conteúdo da Carta de Apresentação (Editável)',
    wordsLabel: 'palavras',
    editHint: 'Pode editar qualquer parágrafo diretamente antes de exportar para Word (.docx).',
    printBtn: 'Imprimir A4'
  },
  en: {
    title: 'Cover Letter & Statement of Motivation',
    subtitle: 'Customize recipient, company, and document language to draft a formal letter aligned with your resume.',
    recipientLabel: 'Recipient (Name / Committee)',
    orgLabel: 'Target Company / Organization',
    roleLabel: 'Target Role',
    generatingBtn: 'Drafting Letter with AI...',
    generateBtn: 'Generate Profile-Tailored Letter',
    copyBtn: 'Copy Text',
    copiedBtn: 'Copied!',
    wordBtn: 'Download Word Letter (.docx)',
    bodyLabel: 'Cover Letter Body (Editable)',
    wordsLabel: 'words',
    editHint: 'You can edit any paragraph directly before exporting to Microsoft Word (.docx).',
    printBtn: 'Print A4'
  },
  es: {
    title: 'Carta de Presentación & Motivación',
    subtitle: 'Personaliza el destinatario, la empresa y el idioma del documento.',
    recipientLabel: 'Destinatario (Persona / Comité)',
    orgLabel: 'Empresa / Organización Destino',
    roleLabel: 'Puesto Solicitado',
    generatingBtn: 'Redactando Carta con IA...',
    generateBtn: 'Generar Carta Adaptada al Perfil',
    copyBtn: 'Copiar Texto',
    copiedBtn: '¡Copiado!',
    wordBtn: 'Descargar Carta Word (.docx)',
    bodyLabel: 'Contenido de la Carta (Editable)',
    wordsLabel: 'palabras',
    editHint: 'Puedes editar cualquier párrafo directamente antes de exportar a Word (.docx).',
    printBtn: 'Imprimir A4'
  },
  fr: {
    title: 'Lettre de Motivation Exécutive',
    subtitle: 'Personnalisez le destinataire, l’entreprise et la langue du document.',
    recipientLabel: 'Destinataire (Personne / Comité)',
    orgLabel: 'Entreprise / Organisation Cible',
    roleLabel: 'Poste Visé',
    generatingBtn: 'Rédaction par l’IA...',
    generateBtn: 'Générer une Lettre Sur Mesure',
    copyBtn: 'Copier le Texte',
    copiedBtn: 'Copié !',
    wordBtn: 'Télécharger en Word (.docx)',
    bodyLabel: 'Contenu de la Lettre (Modifiable)',
    wordsLabel: 'mots',
    editHint: 'Modifiez tout paragraphe avant l’exportation officielle en Word (.docx).',
    printBtn: 'Imprimer A4'
  },
  de: {
    title: 'Exekutives Anschreiben & Motivation',
    subtitle: 'Passen Sie Empfänger, Unternehmen und Dokumentensprache individuell an.',
    recipientLabel: 'Empfänger (Person / Gremium)',
    orgLabel: 'Zielunternehmen / Organisation',
    roleLabel: 'Angestrebte Position',
    generatingBtn: 'Schreibe Anschreiben mit KI...',
    generateBtn: 'Profilbasiertes Anschreiben erstellen',
    copyBtn: 'Text kopieren',
    copiedBtn: 'Kopiert!',
    wordBtn: 'Word-Anschreiben (.docx) laden',
    bodyLabel: 'Inhalt des Anschreibens (Bearbeitbar)',
    wordsLabel: 'Wörter',
    editHint: 'Sie können jeden Absatz vor dem Export in Microsoft Word (.docx) direkt bearbeiten.',
    printBtn: 'A4 Drucken'
  },
  it: {
    title: 'Lettera di Presentazione Esecutiva',
    subtitle: 'Personalizza destinatario, azienda e lingua del documento.',
    recipientLabel: 'Destinatario (Persona / Comitato)',
    orgLabel: 'Azienda / Organizzazione Target',
    roleLabel: 'Ruolo Richiesto',
    generatingBtn: 'Scrittura con IA...',
    generateBtn: 'Genera Lettera Su Misura',
    copyBtn: 'Copia Testo',
    copiedBtn: 'Copiato!',
    wordBtn: 'Scarica Lettera Word (.docx)',
    bodyLabel: 'Contenuto della Lettera (Modificabile)',
    wordsLabel: 'parole',
    editHint: 'Puoi modificare qualsiasi paragrafo prima dell’esportazione in Word (.docx).',
    printBtn: 'Stampa A4'
  }
} as const;

export const CoverLetterPanel: React.FC<CoverLetterPanelProps> = ({
  cv,
  jobDescription,
  letterBody,
  setLetterBody,
  onExportWord,
  isExportingWord = false,
  onOpenPricingModal,
  onSelectLanguage,
  isTranslatingContent = false,
  contentLanguage = 'en'
}) => {
  const { isAuthenticated, hasActivePlan, incrementCvGenerated } = useAuth();
  const { siteLanguage } = useLanguage();
  const ui = COVER_PANEL_UI[siteLanguage] || COVER_PANEL_UI.en;
  const coverUi = (TOOLS_UI_TRANSLATIONS[siteLanguage] || TOOLS_UI_TRANSLATIONS.en).coverPanel;
  const [recipient, setRecipient] = useState<string>(coverUi.defaultRecipient);
  const [targetOrg, setTargetOrg] = useState<string>(coverUi.defaultOrg);
  const [targetRole, setTargetRole] = useState<string>(
    cv.personalDetails.title || coverUi.defaultRole
  );
  const [letterLanguage, setLetterLanguage] = useState<SupportedLanguage>(contentLanguage || 'en');
  const [letterTone] = useState<LetterTone>('executive');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [platformSettings, setPlatformSettings] = useState(() => getStoredPlatformSettingsSync());

  useEffect(() => {
    const syncHandler = () => setPlatformSettings(getStoredPlatformSettingsSync());
    window.addEventListener('admin-config-updated', syncHandler);
    return () => window.removeEventListener('admin-config-updated', syncHandler);
  }, []);

  useEffect(() => {
    if (contentLanguage) {
      setLetterLanguage(contentLanguage);
    }
  }, [contentLanguage]);

  const handleLanguageClick = (lang: SupportedLanguage) => {
    setLetterLanguage(lang);
    onSelectLanguage?.(lang);
  };

  // Dynamic template generator based on user's actual profile and inputs
  const buildDynamicLetter = (
    lang: SupportedLanguage,
    _tone: LetterTone,
    candName: string,
    candTitle: string,
    candPhone: string,
    candEmail: string,
    candLocation: string,
    org: string,
    rec: string,
    role: string,
    topExp?: string
  ): string => {
    const locale =
      lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : lang === 'de' ? 'de-DE' : lang === 'es' ? 'es-ES' : 'pt-PT';
    const today = new Date().toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (lang === 'en') {
      return `To: ${rec}
${org}
${candLocation || 'Luanda, Angola'} | ${today}

Subject: Application for the Position of ${role}

Dear Members of the Selection Committee,

It is with high enthusiasm and strong professional commitment that I submit my application for the position of ${role}. With extensive progressive experience in strategic execution, high-impact project delivery, and cross-functional leadership, I offer a proven track record of delivering measurable outcomes in complex organizational environments.

Throughout my career as ${candTitle}${topExp ? `, including notable leadership at ${topExp}` : ''}, I have spearheaded initiatives that optimized processes, increased operational efficiency, and ensured strict alignment with international quality standards. My approach combines technical rigor with strong stakeholder engagement, enabling multidisciplinary teams to exceed performance targets consistently.

Furthermore, my dedication to continuous improvement and evidence-based decision-making aligns directly with the mission and values of ${org}. Driven by the strategic impact of your work, and fully prepared for immediate deployment, I welcome the opportunity to discuss my qualifications in greater detail during a technical interview.

Thank you for your time and consideration.

Sincerely,

${candName || 'Seu Nome Completo'}
${candTitle || 'Profissional Executivo'}
${[candPhone, candEmail].filter(Boolean).join(' | ')}`;
    }

    if (lang === 'fr') {
      return `À l'attention du : ${rec}
${org}
${candLocation || 'Luanda, Angola'} | ${today}

Objet : Candidature au poste de ${role}

Madame, Monsieur les Membres du Comité de Sélection,

C'est avec un vif intérêt et un profond engagement professionnel que je vous soumets ma candidature au poste de ${role}. Fort d'un parcours solide dans le pilotage de projets stratégiques, le déploiement de solutions opérationnelles et le leadership d'équipes multidisciplinaires, j'apporte une expertise éprouvée dans l'atteinte d'objectifs ambitieux.

Tout au long de mes responsabilités en tant que ${candTitle}${topExp ? `, notamment au sein de ${topExp}` : ''}, j'ai coordonné des initiatives à fort impact, optimisé les processus de travail et garanti une stricte conformité avec les normes de qualité les plus exigeantes. Ma capacité à conjuguer rigueur technique et concertation stratégique permet aux organisations d'accélérer leurs résultats.

Résolument motivé par les missions et la vision de ${org}, et immédiatement disponible, je me tiens à votre entière disposition pour tout entretien technique afin d'approfondir la pertinence de mon profil.

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${candName || 'Seu Nome Completo'}
${candTitle || 'Spécialiste Exécutif'}
${[candPhone, candEmail].filter(Boolean).join(' | ')}`;
    }

    if (lang === 'es') {
      return `A la atención de: ${rec}
${org}
${candLocation || 'Luanda, Angola'} | ${today}

Asunto: Candidatura al puesto de ${role}

Estimados Miembros del Comité de Selección:

Es con gran interés y sólido compromiso profesional que presento mi candidatura al puesto de ${role}. Con una destacada trayectoria en la ejecución de proyectos estratégicos, optimización de operaciones y liderazgo de equipos de alto rendimiento, pongo a su disposición una sólida experiencia en la consecución de resultados cuantificables.

En mis funciones como ${candTitle}${topExp ? `, en especial en ${topExp}` : ''}, he liderado iniciativas transformadoras, optimizado flujos de trabajo e implementado rigurosos estándares de calidad y gobernanza. Mi enfoque combina solidez metodológica y gestión colaborativa, garantizando entregas de máxima excelencia.

Motivado por el impacto y el prestigio de ${org}, y con plena disponibilidad para incorporación inmediata, quedo a su disposición para profundizar en mis competencias en una entrevista técnica.

Agradeciendo de antemano su atención, les saluda atentamente,

${candName || 'Seu Nome Completo'}
${candTitle || 'Profesional Ejecutivo'}
${[candPhone, candEmail].filter(Boolean).join(' | ')}`;
    }

    if (lang === 'de') {
      return `An: ${rec}
${org}
${candLocation || 'Berlin, Deutschland'} | ${today}

Betreff: Bewerbung als ${role}

Sehr geehrte Mitglieder des Auswahlausschusses,

mit großem Interesse und höchstem professionellem Engagement reiche ich meine Bewerbung für die Position als ${role} ein. Mit meiner langjährigen Führungserfahrung in der strategischen Umsetzung, Prozessoptimierung und Leitung interdisziplinärer Teams bringe ich eine nachweisbare Erfolgsbilanz messbarer Resultate in komplexen Unternehmensstrukturen mit.

In meiner bisherigen Tätigkeit als ${candTitle}${topExp ? `, insbesondere bei ${topExp}` : ''} habe ich strategische Initiativen vorangetrieben, Arbeitsabläufe effizienter gestaltet und höchste internationale Qualitäts- und Governance-Standards sichergestellt.

Überzeugt von der Vision und dem nachhaltigen Wachstum von ${org} stehe ich kurzfristig zur Verfügung und freue mich auf ein persönliches Gespräch.

Mit freundlichen Grüßen

${candName || 'Ihr Name'}
${candTitle || 'Führungskraft'}
${[candPhone, candEmail].filter(Boolean).join(' | ')}`;
    }

    // Default: Portuguese
    return `A/C: ${rec}
${org}
${candLocation || 'Luanda, Angola'} | ${today}

Assunto: Candidatura à posição de ${role}

Exmos. Senhores Membros do Comité de Seleção,

É com elevado interesse e sentido de compromisso institucional que apresento a minha candidatura à posição de ${role}. Com uma trajetória sólida e progressiva no planeamento estratégico, liderança técnica de projetos e transformação de processos operacionais, trago a experiência comprovada de entrega de resultados de alto impacto em ambientes complexos.

Ao longo da minha atuação como ${candTitle}${topExp ? `, com destaque para as realizações em ${topExp}` : ''}, liderei iniciativas que otimizaram fluxos de trabalho, elevaram os índices de qualidade e garantiram a conformidade estrita com normas internacionais de reporte e governança. O meu perfil conjuga rigor metodológico, capacidade analítica e liderança colaborativa de equipas multidisciplinares.

Motivado pela visão estratégica e impacto dos projetos de ${org}, e com plena prontidão para mobilização imediata, coloco-me à inteira disposição para detalhar a aplicabilidade prática das minhas competências numa entrevista técnica.

Agradecendo desde já a vossa atenção, apresento os meus melhores cumprimentos.

${candName || 'Seu Nome Completo'}
${candTitle || 'Especialista Executivo'}
${[candPhone, candEmail].filter(Boolean).join(' | ')}`;
  };

  // Generate Letter with AI
  const handleGenerateWithAI = async () => {
    if (platformSettings.enableAiFeaturesGlobally === false) {
      setStatusMessage(coverUi.aiPaused);
      return;
    }

    setIsGenerating(true);
    setStatusMessage(null);

    const topExpName = cv.experiences[0]?.company;
    const adminPromptConfig = getStoredPromptSync('coverLetter');

    try {
      const response = await authorizedFetch('/api/cover-letter', {
        method: 'POST',
        body: JSON.stringify({
          cvData: {
            name: cv.personalDetails.name,
            title: cv.personalDetails.title,
            email: cv.personalDetails.email,
            phone: cv.personalDetails.phone,
            location: cv.personalDetails.location,
            linkedin: cv.personalDetails.linkedin,
            summary: cv.summary,
            experiences: cv.experiences
          },
          jobDescription: jobDescription || targetRole,
          recipientName: recipient,
          organizationName: targetOrg,
          language:
            letterLanguage === 'en'
              ? 'English (Inglês Internacional)'
              : letterLanguage === 'fr'
              ? 'Français (Francês Diplomático)'
              : letterLanguage === 'es'
              ? 'Español (Espanhol Internacional)'
              : letterLanguage === 'de'
              ? 'Deutsch (Alemão Corporativo Formal)'
              : 'Português (Institucional)',
          adminPromptConfig
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error || coverUi.serverErr);
      }

      const data = await response.json();
      if (data && data.letterBody) {
        setLetterBody(data.letterBody);
        setStatusMessage(coverUi.generatedAi);
        trackFrontendTelemetry({ type: 'ai_called', feature: 'coverLetter', tokens: 1200 });
        void incrementCvGenerated(1, { skipServerIncrement: true });
      } else {
        throw new Error(coverUi.invalidFormat);
      }
    } catch (err: any) {
      logGenerationError({
        timestamp: new Date().toISOString(),
        userEmail: cv.personalDetails.email || 'anonymous',
        operationType: 'gemini_ai_call',
        errorMessage: `[CoverLetter] ${err?.message || 'Fallback local aplicado'}`,
        modelUsed: adminPromptConfig?.preferredModel || 'gemini-4-hydrogen',
        resolved: false
      });
      // Heuristic dynamic fallback tailored to user's real data
      const generated = buildDynamicLetter(
        letterLanguage,
        letterTone,
        cv.personalDetails.name,
        targetRole || cv.personalDetails.title,
        cv.personalDetails.phone,
        cv.personalDetails.email,
        cv.personalDetails.location,
        targetOrg,
        recipient,
        targetRole,
        topExpName
      );
      setLetterBody(generated);
      setStatusMessage(coverUi.generatedFallback);
      void incrementCvGenerated(1, { skipServerIncrement: false });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(letterBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadWordLocal = async () => {
    if (!isAuthenticated || !hasActivePlan) {
      onOpenPricingModal?.(coverUi.planRequiredWord);
      return;
    }
    if (onExportWord) {
      onExportWord();
    } else {
      try {
        const blob = await generateCoverLetterDocx(cv, letterBody, true, letterLanguage);
        const nameClean = cv.personalDetails.name.trim().replace(/\s+/g, '_') || 'Carta';
        triggerDownload(blob, `Carta_Apresentacao_${nameClean}.docx`);
        void incrementCvGenerated(1, { eventType: 'word_exported' });
      } catch (err) {
        console.error('Erro ao exportar carta:', err);
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Configuration Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              <span>{ui.title}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {ui.subtitle}
            </p>
          </div>

          {/* Language Selector (translates existing letter + CV content immediately) */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
            {([
              { code: 'pt', flag: '🇵🇹', label: 'PT' },
              { code: 'en', flag: '🇬🇧', label: 'EN' },
              { code: 'es', flag: '🇪🇸', label: 'ES' },
              { code: 'fr', flag: '🇫🇷', label: 'FR' },
              { code: 'de', flag: '🇩🇪', label: 'DE' }
            ] as const).map((item) => (
              <button
                key={item.code}
                type="button"
                disabled={isTranslatingContent}
                onClick={() => handleLanguageClick(item.code)}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors disabled:opacity-60 flex items-center gap-1 ${
                  letterLanguage === item.code ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{item.flag}</span>
                <span>{item.label}</span>
              </button>
            ))}
            {isTranslatingContent && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-700 mx-1" />
            )}
          </div>
        </div>

        {/* Inputs: Destinatário, Empresa e Cargo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              {ui.recipientLabel}
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={coverUi.recipientPlaceholder}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 font-medium text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              {ui.orgLabel}
            </label>
            <input
              type="text"
              value={targetOrg}
              onChange={(e) => setTargetOrg(e.target.value)}
              placeholder={coverUi.orgPlaceholder}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 font-medium text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              {ui.roleLabel}
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder={coverUi.rolePlaceholder}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 font-medium text-slate-900"
            />
          </div>
        </div>

        {/* Generate Button & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateWithAI}
              disabled={isGenerating}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{ui.generatingBtn}</span>
                </>
              ) : (
                <>
                  <PenLine className="w-3.5 h-3.5 text-amber-400" />
                  <span>{ui.generateBtn}</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? ui.copiedBtn : ui.copyBtn}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadWordLocal}
              disabled={isExportingWord}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-2xs whitespace-nowrap ${
                !isAuthenticated || !hasActivePlan
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-900'
              }`}
            >
              {!isAuthenticated || !hasActivePlan ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{ui.wordBtn}</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Letter Editor Text Area */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <span>{ui.bodyLabel}</span>
          </label>
          <span className="text-[11px] text-slate-400 font-mono">
            {letterBody.split(/\s+/).filter(Boolean).length} {ui.wordsLabel}
          </span>
        </div>

        <textarea
          rows={18}
          value={letterBody}
          onChange={(e) => setLetterBody(e.target.value)}
          className="w-full p-4 bg-slate-50/70 border border-slate-200 rounded-xl font-serif text-[14px] leading-relaxed text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all shadow-inner resize-y"
          placeholder="..."
        />

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>{ui.editHint}</span>
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated || !hasActivePlan) {
                onOpenPricingModal?.(coverUi.planRequiredPdf);
                return;
              }
              window.print();
            }}
            className="text-slate-700 hover:text-slate-950 font-semibold underline flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{ui.printBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
