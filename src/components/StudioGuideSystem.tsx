import React from 'react';
import { Lightbulb, ArrowRight, Zap, Check } from 'lucide-react';
import { SiteLanguageCode, useLanguage } from '../context/LanguageContext';

export type StudioCreationMode = 'guided' | 'solo';
export type StudioGuideTab = 'raw' | 'editor' | 'ai' | 'ats' | 'jobs' | 'cover' | 'interview';

const STUDIO_MODE_KEY = 'cv_studio_mode_v1';
const STUDIO_MODE_CHOSEN_KEY = 'cv_studio_mode_chosen_v1';

export function loadStudioModePrefs(): { mode: StudioCreationMode; chosen: boolean } {
  try {
    const modeRaw = localStorage.getItem(STUDIO_MODE_KEY);
    const chosenRaw = localStorage.getItem(STUDIO_MODE_CHOSEN_KEY);
    return {
      mode: modeRaw === 'solo' ? 'solo' : 'guided',
      chosen: chosenRaw === 'true'
    };
  } catch {
    return { mode: 'guided', chosen: false };
  }
}

export function saveStudioModePrefs(mode: StudioCreationMode, chosen: boolean): void {
  try {
    localStorage.setItem(STUDIO_MODE_KEY, mode);
    localStorage.setItem(STUDIO_MODE_CHOSEN_KEY, chosen ? 'true' : 'false');
  } catch {
    // Ignore storage errors
  }
}

interface GuideStepInfo {
  num: number;
  tab: StudioGuideTab;
  label: string;
  clickHint: string;
  nextLabel: string;
}

interface StudioGuideCopy {
  chooseQuestion: string;
  guidedChoiceTitle: string;
  guidedChoiceDesc: string;
  soloChoiceTitle: string;
  soloChoiceDesc: string;
  guidedBadgeLabel: string;
  soloBadgeLabel: string;
  switchToSoloBtn: string;
  switchToGuidedBtn: string;
  nextStepBtn: string;
  exportFinishBtn: string;
  stepPrefix: string;
  whereToClickLabel: string;
  steps: GuideStepInfo[];
  atsHint: string;
  interviewHint: string;
}

const STUDIO_GUIDE_COPY: Record<SiteLanguageCode, StudioGuideCopy> = {
  pt: {
    chooseQuestion: 'Como prefere construir o seu currículo hoje?',
    guidedChoiceTitle: 'Passo a Passo Guiado',
    guidedChoiceDesc: 'Lâmpadas numeradas (1 a 5) mostram onde clicar em cada etapa.',
    soloChoiceTitle: 'Fazer Sozinho',
    soloChoiceDesc: 'Estúdio livre e direto, sem avisos de guia.',
    guidedBadgeLabel: 'Modo Guiado Ativo (Passos 1–5)',
    soloBadgeLabel: 'Modo Livre · Fazer Sozinho',
    switchToSoloBtn: 'Fazer Sozinho',
    switchToGuidedBtn: 'Ativar Guia com Lâmpada',
    nextStepBtn: 'Próximo Passo',
    exportFinishBtn: 'Exportar CV Final',
    stepPrefix: 'Passo',
    whereToClickLabel: 'Onde clicar agora:',
    steps: [
      {
        num: 1,
        tab: 'raw',
        label: 'Começar',
        clickHint: 'Envie um PDF/Word (.docx), importe o LinkedIn ou cole o texto para preencher o editor.',
        nextLabel: 'Ir para Passo 2: Editar'
      },
      {
        num: 2,
        tab: 'editor',
        label: 'Editar',
        clickHint: 'Preencha ou ajuste os seus dados nas 4 abas (Perfil, Experiência, Competências, Modelo).',
        nextLabel: 'Ir para Passo 3: Otimizar IA'
      },
      {
        num: 3,
        tab: 'ai',
        label: 'Otimizar IA',
        clickHint: 'Cole uma vaga alvo (opcional) e clique em Adaptar CV para elevar a nota ATS.',
        nextLabel: 'Ir para Passo 4: Vagas'
      },
      {
        num: 4,
        tab: 'jobs',
        label: 'Vagas',
        clickHint: 'Filtre vagas compatíveis com o seu perfil e clique em "Candidatar-se Agora".',
        nextLabel: 'Ir para Passo 5: Carta & Exportar'
      },
      {
        num: 5,
        tab: 'cover',
        label: 'Finalizar',
        clickHint: 'Gere a Carta de Apresentação ou clique em Baixar CV / PDF no topo.',
        nextLabel: 'Exportar CV Final'
      }
    ],
    atsHint: 'Veja a sua nota ATS (0–100%) e clique para corrigir palavras-chave em falta, depois avance para Vagas.',
    interviewHint: 'Pratique perguntas reais para a sua vaga e depois avance para Carta & Exportação.'
  },
  en: {
    chooseQuestion: 'How would you like to build your resume today?',
    guidedChoiceTitle: 'Step-by-Step Guided',
    guidedChoiceDesc: 'Numbered lightbulbs (1 to 5) show exactly where to click next.',
    soloChoiceTitle: 'Do It Myself (Solo)',
    soloChoiceDesc: 'Clean self-service workspace without guided prompts.',
    guidedBadgeLabel: 'Guided Mode Active (Steps 1–5)',
    soloBadgeLabel: 'Solo Workspace · Self-Service',
    switchToSoloBtn: 'Do It Myself',
    switchToGuidedBtn: 'Turn On Lightbulb Guide',
    nextStepBtn: 'Next Step',
    exportFinishBtn: 'Export Final CV',
    stepPrefix: 'Step',
    whereToClickLabel: 'Where to click now:',
    steps: [
      {
        num: 1,
        tab: 'raw',
        label: 'Start',
        clickHint: 'Upload a PDF/Word (.docx) file, pull LinkedIn, or paste text to prefill the editor.',
        nextLabel: 'Go to Step 2: Edit'
      },
      {
        num: 2,
        tab: 'editor',
        label: 'Edit',
        clickHint: 'Review your details across the 4 tabs (Profile, Experience, Skills, Design).',
        nextLabel: 'Go to Step 3: AI Tailor'
      },
      {
        num: 3,
        tab: 'ai',
        label: 'AI Tailor',
        clickHint: 'Paste a job description (optional) and click Tailor to boost ATS keyword match.',
        nextLabel: 'Go to Step 4: Jobs'
      },
      {
        num: 4,
        tab: 'jobs',
        label: 'Apply Jobs',
        clickHint: 'Filter openings matched to your CV and click "Apply Now" on any role.',
        nextLabel: 'Go to Step 5: Letter & Export'
      },
      {
        num: 5,
        tab: 'cover',
        label: 'Finish',
        clickHint: 'Generate your Cover Letter or download your finished resume / PDF at the top.',
        nextLabel: 'Export Final CV'
      }
    ],
    atsHint: 'Check your ATS score (0–100%), fix missing keywords, then jump to Matched Jobs.',
    interviewHint: 'Rehearse role-specific interview questions, then finalize your Cover Letter & Export.'
  },
  es: {
    chooseQuestion: '¿Cómo prefieres crear tu currículum hoy?',
    guidedChoiceTitle: 'Paso a Paso Guiado',
    guidedChoiceDesc: 'Bombillas numeradas (1 a 5) te muestran dónde hacer clic en cada paso.',
    soloChoiceTitle: 'Hacerlo Solo',
    soloChoiceDesc: 'Estudio libre y directo sin indicaciones de guía.',
    guidedBadgeLabel: 'Modo Guiado Activo (Pasos 1–5)',
    soloBadgeLabel: 'Modo Libre · Por Mi Cuenta',
    switchToSoloBtn: 'Hacerlo Solo',
    switchToGuidedBtn: 'Activar Guía',
    nextStepBtn: 'Siguiente Paso',
    exportFinishBtn: 'Exportar CV Final',
    stepPrefix: 'Paso',
    whereToClickLabel: 'Dónde hacer clic ahora:',
    steps: [
      {
        num: 1,
        tab: 'raw',
        label: 'Empezar',
        clickHint: 'Sube un PDF/Word (.docx), importa LinkedIn o pega tu texto para rellenar el editor.',
        nextLabel: 'Ir al Paso 2: Editar'
      },
      {
        num: 2,
        tab: 'editor',
        label: 'Editar',
        clickHint: 'Completa o revisa tus datos en las 4 pestañas (Perfil, Experiencia, Habilidades, Modelo).',
        nextLabel: 'Ir al Paso 3: IA'
      },
      {
        num: 3,
        tab: 'ai',
        label: 'Optimizar IA',
        clickHint: 'Pega una oferta (opcional) y pulsa Adaptar CV para subir la puntuación ATS.',
        nextLabel: 'Ir al Paso 4: Empleos'
      },
      {
        num: 4,
        tab: 'jobs',
        label: 'Postular',
        clickHint: 'Filtra vacantes compatibles con tu perfil y haz clic en "Postular Ahora".',
        nextLabel: 'Ir al Paso 5: Carta y Exportar'
      },
      {
        num: 5,
        tab: 'cover',
        label: 'Finalizar',
        clickHint: 'Genera tu Carta de Presentación o descarga tu currículum / PDF arriba.',
        nextLabel: 'Exportar CV Final'
      }
    ],
    atsHint: 'Revisa tu puntuación ATS (0–100%), añade palabras clave y pasa a Empleos.',
    interviewHint: 'Practica preguntas de entrevista reales y finaliza tu exportación.'
  },
  fr: {
    chooseQuestion: 'Comment souhaitez-vous créer votre CV aujourd’hui ?',
    guidedChoiceTitle: 'Pas à Pas Guidé',
    guidedChoiceDesc: 'Des ampoules numérotées (1 à 5) indiquent où cliquer à chaque étape.',
    soloChoiceTitle: 'Faire Seul',
    soloChoiceDesc: 'Espace libre sans guide ni suggestions pas à pas.',
    guidedBadgeLabel: 'Mode Guidé Actif (Étapes 1–5)',
    soloBadgeLabel: 'Mode Libre · Autonome',
    switchToSoloBtn: 'Faire Seul',
    switchToGuidedBtn: 'Activer le Guide',
    nextStepBtn: 'Étape Suivante',
    exportFinishBtn: 'Exporter le CV Final',
    stepPrefix: 'Étape',
    whereToClickLabel: 'Où cliquer maintenant :',
    steps: [
      {
        num: 1,
        tab: 'raw',
        label: 'Démarrer',
        clickHint: 'Importez un fichier PDF/Word (.docx), votre LinkedIn ou collez votre texte pour remplir l’éditeur.',
        nextLabel: 'Aller à l’Étape 2 : Éditer'
      },
      {
        num: 2,
        tab: 'editor',
        label: 'Éditer',
        clickHint: 'Complétez vos informations dans les 4 onglets (Profil, Expérience, Compétences, Modèle).',
        nextLabel: 'Aller à l’Étape 3 : IA'
      },
      {
        num: 3,
        tab: 'ai',
        label: 'Adapter IA',
        clickHint: 'Collez une offre (optionnel) et lancez l’adaptation pour maximiser le score ATS.',
        nextLabel: 'Aller à l’Étape 4 : Offres'
      },
      {
        num: 4,
        tab: 'jobs',
        label: 'Postuler',
        clickHint: 'Filtrez les offres alignées avec votre profil et cliquez sur « Postuler ».',
        nextLabel: 'Aller à l’Étape 5 : Lettre & Export'
      },
      {
        num: 5,
        tab: 'cover',
        label: 'Finaliser',
        clickHint: 'Générez votre Lettre de Motivation ou téléchargez votre CV / PDF en haut.',
        nextLabel: 'Exporter le CV Final'
      }
    ],
    atsHint: 'Vérifiez votre score ATS et passez aux offres d’emploi correspondantes.',
    interviewHint: 'Préparez vos réponses d’entretien puis exportez votre dossier.'
  },
  de: {
    chooseQuestion: 'Wie möchten Sie Ihren Lebenslauf heute erstellen?',
    guidedChoiceTitle: 'Schritt-für-Schritt Geführt',
    guidedChoiceDesc: 'Nummerierte Glühbirnen (1–5) zeigen genau, wo Sie klicken müssen.',
    soloChoiceTitle: 'Selbst Erstellen',
    soloChoiceDesc: 'Direkter Workspace ohne Schritt-für-Schritt-Hinweise.',
    guidedBadgeLabel: 'Geführter Modus (Schritte 1–5)',
    soloBadgeLabel: 'Freier Modus · Selbstständig',
    switchToSoloBtn: 'Selbst Erstellen',
    switchToGuidedBtn: 'Glühbirnen-Guide Aktivieren',
    nextStepBtn: 'Nächster Schritt',
    exportFinishBtn: 'Finalen CV Exportieren',
    stepPrefix: 'Schritt',
    whereToClickLabel: 'Jetzt klicken:',
    steps: [
      {
        num: 1,
        tab: 'raw',
        label: 'Starten',
        clickHint: 'Laden Sie eine PDF/Word-Datei (.docx) hoch, importieren Sie LinkedIn oder fügen Sie Text ein.',
        nextLabel: 'Zu Schritt 2: Bearbeiten'
      },
      {
        num: 2,
        tab: 'editor',
        label: 'Bearbeiten',
        clickHint: 'Prüfen Sie Ihre Daten in den 4 Reitern (Profil, Erfahrung, Skills, Design).',
        nextLabel: 'Zu Schritt 3: KI-Anpassung'
      },
      {
        num: 3,
        tab: 'ai',
        label: 'KI-Tuning',
        clickHint: 'Stellenanzeige einfügen (optional) und ATS-Keywords automatisch optimieren.',
        nextLabel: 'Zu Schritt 4: Jobs'
      },
      {
        num: 4,
        tab: 'jobs',
        label: 'Bewerben',
        clickHint: 'Passende Stellen filtern und auf „Jetzt Bewerben“ klicken.',
        nextLabel: 'Zu Schritt 5: Anschreiben & Export'
      },
      {
        num: 5,
        tab: 'cover',
        label: 'Abschließen',
        clickHint: 'Anschreiben generieren oder fertigen Lebenslauf / PDF oben herunterladen.',
        nextLabel: 'Finalen CV Exportieren'
      }
    ],
    atsHint: 'Prüfen Sie Ihren ATS-Score und wechseln Sie anschließend zu den passenden Jobs.',
    interviewHint: 'Üben Sie Interviewfragen und exportieren Sie Ihre Unterlagen.'
  },
  it: {
    chooseQuestion: 'Come preferisci creare il tuo CV oggi?',
    guidedChoiceTitle: 'Passo Dopo Passo Guidato',
    guidedChoiceDesc: 'Lampadine numerate (1–5) mostrano dove cliccare in ogni fase.',
    soloChoiceTitle: 'Fai da Te',
    soloChoiceDesc: 'Spazio diretto e libero senza suggerimenti guidati.',
    guidedBadgeLabel: 'Modalità Guidata Attiva (Fasi 1–5)',
    soloBadgeLabel: 'Modalità Libera · Fai da Te',
    switchToSoloBtn: 'Fai da Te',
    switchToGuidedBtn: 'Attiva Guida Lampadina',
    nextStepBtn: 'Passo Successivo',
    exportFinishBtn: 'Esporta CV Finale',
    stepPrefix: 'Passo',
    whereToClickLabel: 'Dove cliccare ora:',
    steps: [
      {
        num: 1,
        tab: 'raw',
        label: 'Inizia',
        clickHint: 'Carica un PDF/Word (.docx), importa LinkedIn o incolla il testo per compilare l’editor.',
        nextLabel: 'Vai al Passo 2: Modifica'
      },
      {
        num: 2,
        tab: 'editor',
        label: 'Modifica',
        clickHint: 'Aggiorna i dati nelle 4 schede (Profilo, Esperienza, Competenze, Modello).',
        nextLabel: 'Vai al Passo 3: Ottimizza IA'
      },
      {
        num: 3,
        tab: 'ai',
        label: 'Ottimizza IA',
        clickHint: 'Incolla un annuncio (opzionale) e adatta il CV per aumentare il punteggio ATS.',
        nextLabel: 'Vai al Passo 4: Offerte'
      },
      {
        num: 4,
        tab: 'jobs',
        label: 'Candidati',
        clickHint: 'Filtra le offerte in linea con il profilo e clicca su "Candidati Ora".',
        nextLabel: 'Vai al Passo 5: Lettera ed Esporta'
      },
      {
        num: 5,
        tab: 'cover',
        label: 'Completa',
        clickHint: 'Genera la Lettera di Presentazione o scarica il tuo CV / PDF in alto.',
        nextLabel: 'Esporta CV Finale'
      }
    ],
    atsHint: 'Controlla il punteggio ATS e poi passa alle offerte di lavoro compatibili.',
    interviewHint: 'Simula le domande di colloquio e completa l’esportazione.'
  }
};

export function getStudioTabStepNumber(tab: StudioGuideTab): number | null {
  switch (tab) {
    case 'raw':
      return 1;
    case 'editor':
      return 2;
    case 'ai':
      return 3;
    case 'jobs':
      return 4;
    case 'cover':
      return 5;
    default:
      return null;
  }
}

export const LightbulbStepBadge: React.FC<{
  step: number;
  active?: boolean;
  completed?: boolean;
  size?: 'xs' | 'sm';
}> = ({ step, active = false, completed = false, size = 'xs' }) => {
  const padClass = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-1 py-0.5 text-[9px]';
  const colorClass = active
    ? 'bg-amber-400 text-slate-950 font-extrabold shadow-2xs'
    : completed
    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold'
    : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold';

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md tabular-nums leading-none shrink-0 ${padClass} ${colorClass}`}
    >
      {completed && !active ? (
        <Check className="w-2.5 h-2.5 shrink-0" />
      ) : (
        <Lightbulb className="w-2.5 h-2.5 shrink-0" />
      )}
      <span>{step}</span>
    </span>
  );
};

interface StudioGuideBarProps {
  mode: StudioCreationMode;
  hasChosenMode: boolean;
  onSelectMode: (mode: StudioCreationMode) => void;
  activeTab: StudioGuideTab;
  onNavigateTab: (tab: StudioGuideTab) => void;
  onExportFinal?: () => void;
}

export const StudioGuideBar: React.FC<StudioGuideBarProps> = ({
  mode,
  hasChosenMode,
  onSelectMode,
  activeTab,
  onNavigateTab,
  onExportFinal
}) => {
  const { siteLanguage } = useLanguage();
  const copy = STUDIO_GUIDE_COPY[siteLanguage] || STUDIO_GUIDE_COPY.en;

  const activeStepIdx = copy.steps.findIndex((s) => s.tab === activeTab);
  const currentStep = activeStepIdx >= 0 ? copy.steps[activeStepIdx] : null;
  const nextStep =
    activeStepIdx >= 0 && activeStepIdx < copy.steps.length - 1
      ? copy.steps[activeStepIdx + 1]
      : activeTab === 'ats'
      ? copy.steps[3]
      : activeTab === 'interview'
      ? copy.steps[4]
      : null;

  const activeHint =
    currentStep?.clickHint ||
    (activeTab === 'ats' ? copy.atsHint : activeTab === 'interview' ? copy.interviewHint : copy.steps[0].clickHint);

  return (
    <div className="shrink-0 bg-amber-50/80 dark:bg-slate-900/95 border-b border-amber-200/80 dark:border-slate-800 px-3 sm:px-4 py-2 space-y-2">
      {/* First-visit quick mode selector: Guided vs Self-Service */}
      {!hasChosenMode && (
        <div className="bg-white dark:bg-slate-950 border border-amber-300/80 dark:border-slate-700 rounded-lg p-2.5 space-y-2">
          <p className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{copy.chooseQuestion}</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onSelectMode('guided')}
              className={`text-left p-2 rounded-lg border transition-colors flex items-start gap-2 ${
                mode === 'guided'
                  ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-400 text-slate-950 dark:text-white'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-300'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold block leading-tight">{copy.guidedChoiceTitle}</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block leading-snug mt-0.5">
                  {copy.guidedChoiceDesc}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectMode('solo')}
              className={`text-left p-2 rounded-lg border transition-colors flex items-start gap-2 ${
                mode === 'solo'
                  ? 'bg-slate-900 dark:bg-slate-800 border-slate-900 text-white'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
              }`}
            >
              <Zap className="w-4 h-4 text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold block leading-tight">{copy.soloChoiceTitle}</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block leading-snug mt-0.5">
                  {copy.soloChoiceDesc}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {mode === 'guided' ? (
        <div className="space-y-1.5">
          {/* Header Row: 5 Numbered Lightbulb Pills + Switch to Solo */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar min-w-0">
              {copy.steps.map((step) => {
                const isActive = activeTab === step.tab;
                const isCompleted = activeStepIdx > -1 && step.num < activeStepIdx + 1;
                return (
                  <button
                    key={step.num}
                    type="button"
                    onClick={() => onNavigateTab(step.tab)}
                    className={`px-1.5 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-bold'
                        : 'bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-amber-200/80 dark:border-slate-700 hover:border-amber-400'
                    }`}
                  >
                    <LightbulbStepBadge step={step.num} active={isActive} completed={isCompleted} />
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onSelectMode('solo')}
              className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white underline underline-offset-2 whitespace-nowrap shrink-0"
            >
              {copy.switchToSoloBtn}
            </button>
          </div>

          {/* Where to click now + 1-click Next Step action */}
          <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-950 border border-amber-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5">
            <div className="flex items-start gap-1.5 min-w-0 text-[11px]">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-slate-700 dark:text-slate-300 leading-snug">
                <span className="font-bold text-slate-950 dark:text-white mr-1">
                  {currentStep ? `${copy.stepPrefix} ${currentStep.num}:` : copy.whereToClickLabel}
                </span>
                <span>{activeHint}</span>
              </p>
            </div>

            {nextStep ? (
              <button
                type="button"
                onClick={() => onNavigateTab(nextStep.tab)}
                className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-md text-[11px] font-bold inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
              >
                <span>{copy.nextStepBtn} ({nextStep.num})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : onExportFinal ? (
              <button
                type="button"
                onClick={onExportFinal}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[11px] font-bold inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
              >
                <span>{copy.exportFinishBtn}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{copy.soloBadgeLabel}</span>
          </span>
          <button
            type="button"
            onClick={() => onSelectMode('guided')}
            className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-900 dark:text-amber-300 font-semibold rounded-md inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
          >
            <Lightbulb className="w-3 h-3" />
            <span>{copy.switchToGuidedBtn}</span>
          </button>
        </div>
      )}
    </div>
  );
};
