import React from 'react';
import {
  Briefcase,
  Building2,
  Cpu,
  Globe2,
  MapPin,
  Rocket,
  Sparkles,
  X,
  ArrowRight
} from 'lucide-react';
import { SiteLanguageCode } from '../i18n/siteTranslations';
import { useLanguage } from '../context/LanguageContext';
import { ONBOARDING_GOALS, OnboardingGoalId, OnboardingGoalPreset } from '../utils/onboardingGoals';

interface OnboardingGoalModalProps {
  isOpen: boolean;
  onSelectGoal: (preset: OnboardingGoalPreset) => void;
  onClose: () => void;
  selectedGoalId?: OnboardingGoalId | null;
}

const MODAL_COPY: Record<
  SiteLanguageCode,
  {
    kicker: string;
    title: string;
    subtitle: string;
    modelBadgePrefix: string;
    skipBtn: string;
  }
> = {
  pt: {
    kicker: 'Configuração em 1 toque',
    title: 'Escolha seu objetivo',
    subtitle: 'Escolhemos automaticamente o melhor modelo, o idioma ideal e a ordem certa das secções para o seu caso.',
    modelBadgePrefix: 'Modelo:',
    skipBtn: 'Pular por agora'
  },
  en: {
    kicker: '1-tap setup',
    title: 'Choose your goal',
    subtitle: 'We automatically pick the best template, language, and CV structure so you start on the right foot.',
    modelBadgePrefix: 'Template:',
    skipBtn: 'Skip for now'
  },
  es: {
    kicker: 'Configuración en 1 clic',
    title: 'Elige tu objetivo',
    subtitle: 'Elegimos automáticamente la mejor plantilla, el idioma ideal y la estructura más efectiva para ti.',
    modelBadgePrefix: 'Plantilla:',
    skipBtn: 'Omitir por ahora'
  },
  fr: {
    kicker: 'Configuration en 1 clic',
    title: 'Choisissez votre objectif',
    subtitle: 'Nous sélectionnons automatiquement le meilleur modèle, la langue et la structure idéale.',
    modelBadgePrefix: 'Modèle :',
    skipBtn: 'Passer pour le moment'
  },
  de: {
    kicker: '1-Klick-Einrichtung',
    title: 'Wählen Sie Ihr Ziel',
    subtitle: 'Wir wählen automatisch die beste Vorlage, Sprache und Struktur für Ihre Bewerbung.',
    modelBadgePrefix: 'Vorlage:',
    skipBtn: 'Vorerst überspringen'
  },
  it: {
    kicker: 'Configurazione rapida',
    title: 'Scegli il tuo obiettivo',
    subtitle: 'Selezioniamo automaticamente il modello migliore, la lingua e la struttura ideale.',
    modelBadgePrefix: 'Modello:',
    skipBtn: 'Salta per ora'
  }
};

function getGoalIcon(id: OnboardingGoalId) {
  switch (id) {
    case 'quick_job':
      return <Rocket className="w-4 h-4 text-blue-600" />;
    case 'un_ngos':
      return <Globe2 className="w-4 h-4 text-sky-600" />;
    case 'tech':
      return <Cpu className="w-4 h-4 text-teal-600" />;
    case 'government':
      return <Building2 className="w-4 h-4 text-indigo-700" />;
    case 'europe':
      return <MapPin className="w-4 h-4 text-blue-700" />;
    case 'canada':
      return <Briefcase className="w-4 h-4 text-rose-600" />;
    case 'usa':
      return <Briefcase className="w-4 h-4 text-slate-800" />;
  }
}

export const OnboardingGoalModal: React.FC<OnboardingGoalModalProps> = ({
  isOpen,
  onSelectGoal,
  onClose,
  selectedGoalId
}) => {
  const { siteLanguage } = useLanguage();
  const copy = MODAL_COPY[siteLanguage] || MODAL_COPY.pt;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-goal-title"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{copy.kicker}</span>
            </div>
            <h2
              id="onboarding-goal-title"
              className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white tracking-tight"
            >
              {copy.title}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {copy.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={copy.skipBtn}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ONBOARDING_GOALS.map((preset) => {
            const loc = preset.labels[siteLanguage] || preset.labels.pt;
            const isSelected = selectedGoalId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectGoal(preset)}
                className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 group touch-manipulation ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-600'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/60 hover:border-blue-500 hover:bg-slate-50/80 dark:hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {getGoalIcon(preset.id)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {loc.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {loc.subtitle}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {copy.modelBadgePrefix} {preset.templateName}
                  </span>
                  {preset.suggestedLanguage !== 'keep' && (
                    <span className="font-mono uppercase text-[10px] font-bold text-blue-700 dark:text-blue-300 shrink-0">
                      {preset.suggestedLanguage}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors"
          >
            {copy.skipBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
