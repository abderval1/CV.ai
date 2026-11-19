import React, { useState, useMemo, useEffect } from 'react';
import {
  Eye,
  ArrowRight,
  FileText,
  Mail,
  Briefcase,
  Lock,
  CheckCircle2,
  X,
  Search
} from 'lucide-react';
import { CVData, TemplateStyle } from '../types/cv';
import { CV_TEMPLATES } from '../data/templateCatalog';
import {
  COVER_LETTER_TEMPLATES,
  CV_EXAMPLES,
  COVER_LETTER_EXAMPLES,
  CoverLetterLayoutStyle
} from '../data/showcaseCatalog';
import { DocumentMiniPreview } from './DocumentMiniPreview';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { getStoredTemplatesSync, getStoredPlansSync } from '../services/adminModulesService';

export type ShowcaseMode = 'models-cv' | 'examples-cv' | 'models-cover' | 'examples-cover';

export interface ShowcaseSelectionPayload {
  targetTab: 'editor' | 'cover';
  label: string;
  templateStyle?: TemplateStyle;
  accentColor?: string;
  cvData?: CVData;
  letterBody?: string;
}

interface ShowcaseGalleryViewProps {
  mode: ShowcaseMode;
  onChangeMode: (mode: ShowcaseMode) => void;
  onUseSelection: (payload: ShowcaseSelectionPayload) => void;
  onOpenPricing: () => void;
}

interface ModalPreviewState {
  title: string;
  subtitle: string;
  metaLine: string;
  description: string;
  highlights: string[];
  selectionPayload: ShowcaseSelectionPayload;
  previewProps:
    | {
        kind: 'cv';
        templateStyle: TemplateStyle;
        accentColor?: string;
        cvData?: CVData;
        hasPhoto?: boolean;
      }
    | {
        kind: 'cover';
        layoutStyle: CoverLetterLayoutStyle;
        accentColor?: string;
        candidateName: string;
        candidateTitle: string;
        location: string;
        email: string;
        phone: string;
        letterBody: string;
      };
}

const SHOWCASE_EXTRA_COPY: Record<
  'pt' | 'en' | 'es' | 'fr' | 'de' | 'it',
  {
    subActive: string;
    plansFrom: string;
    comparePlans: string;
    coverCats: Record<string, string>;
    cvExCats: Record<string, string>;
    coverExCats: Record<string, string>;
    zoomCv: string;
    zoomCover: string;
    zoomExample: string;
    readFullCover: string;
    readBtn: string;
    aboutFormat: string;
    keyHighlights: string;
    freeModalDetail: string;
    useNowEditor: string;
    createAndUse: string;
    activateAndUse: string;
    exploreOthers: string;
    closePreview: string;
    coverExampleDesc: string;
    coverExampleHighlight: string;
  }
> = {
  pt: {
    subActive: 'Assinatura Ativa — Edição e Exportação Liberadas',
    plansFrom: 'Planos a partir de',
    comparePlans: 'Comparar planos e formas de pagamento',
    coverCats: { executive: 'Executivo', modern: 'Moderno & Design', ats: 'ATS & Tech', international: 'União Europeia' },
    cvExCats: { tech: 'Tecnologia', executive: 'Direção & COO', finance: 'Finanças', creative: 'Design & UX', health: 'Europa & Saúde', academic: 'Académico' },
    coverExCats: { tech: 'Tecnologia', executive: 'Executivo', product: 'Produto', finance: 'Finanças', entry: 'Primeiro Emprego', transition: 'Mudança de Área' },
    zoomCv: 'Ampliar foto A4',
    zoomCover: 'Ampliar carta',
    zoomExample: 'Ver exemplo completo',
    readFullCover: 'Ler carta completa',
    readBtn: 'Ler',
    aboutFormat: 'Sobre este formato',
    keyHighlights: 'Destaques principais',
    freeModalDetail: 'Para personalizar este modelo, traduzir em 5 idiomas e descarregar em Word (.docx) ou PDF limpo, ative o plano Pro ou Executivo VIP.',
    useNowEditor: 'Usar Agora no Editor',
    createAndUse: 'Criar Conta & Usar Este Modelo',
    activateAndUse: 'Ativar Plano & Usar Este Modelo',
    exploreOthers: 'Explorar outros modelos',
    closePreview: 'Fechar pré-visualização',
    coverExampleDesc: 'Exemplo estruturado em 3 blocos persuasivos: abertura objetiva, resultados mensuráveis e chamada à entrevista.',
    coverExampleHighlight: 'Pronta a adaptar e traduzir em 5 idiomas'
  },
  en: {
    subActive: 'Active Subscription — Editing & Export Unlocked',
    plansFrom: 'Plans starting at',
    comparePlans: 'Compare plans and payment methods',
    coverCats: { executive: 'Executive', modern: 'Modern & Design', ats: 'ATS & Tech', international: 'European Union' },
    cvExCats: { tech: 'Technology', executive: 'Executive & COO', finance: 'Finance', creative: 'Design & UX', health: 'Europe & Healthcare', academic: 'Academic' },
    coverExCats: { tech: 'Technology', executive: 'Executive', product: 'Product', finance: 'Finance', entry: 'Entry Level', transition: 'Career Pivot' },
    zoomCv: 'Zoom A4 preview',
    zoomCover: 'Zoom cover letter',
    zoomExample: 'View full example',
    readFullCover: 'Read full letter',
    readBtn: 'Read',
    aboutFormat: 'About this format',
    keyHighlights: 'Key highlights',
    freeModalDetail: 'To customize this template, translate your resume into 5 languages, and download clean Word (.docx) or PDF files, activate Pro or Executive VIP.',
    useNowEditor: 'Use in Editor Now',
    createAndUse: 'Create Account & Use Template',
    activateAndUse: 'Activate Plan & Use Template',
    exploreOthers: 'Explore other templates',
    closePreview: 'Close preview',
    coverExampleDesc: 'Structured into 3 persuasive blocks: focused opening, measurable outcomes, and clear interview call-to-action.',
    coverExampleHighlight: 'Ready to tailor and translate into 5 languages'
  },
  es: {
    subActive: 'Suscripción Activa — Edición y Exportación Desbloqueadas',
    plansFrom: 'Planes desde',
    comparePlans: 'Comparar planes y métodos de pago',
    coverCats: { executive: 'Ejecutivo', modern: 'Moderno y Diseño', ats: 'ATS y Tech', international: 'Unión Europea' },
    cvExCats: { tech: 'Tecnología', executive: 'Dirección y COO', finance: 'Finanzas', creative: 'Diseño y UX', health: 'Europa y Salud', academic: 'Académico' },
    coverExCats: { tech: 'Tecnología', executive: 'Ejecutivo', product: 'Producto', finance: 'Finanzas', entry: 'Primer Empleo', transition: 'Cambio de Sector' },
    zoomCv: 'Ampliar vista A4',
    zoomCover: 'Ampliar carta',
    zoomExample: 'Ver ejemplo completo',
    readFullCover: 'Leer carta completa',
    readBtn: 'Leer',
    aboutFormat: 'Sobre este formato',
    keyHighlights: 'Puntos clave',
    freeModalDetail: 'Para personalizar esta plantilla, traducir en 5 idiomas y descargar Word (.docx) o PDF limpio, activa Pro o Ejecutivo VIP.',
    useNowEditor: 'Usar en el Editor',
    createAndUse: 'Crear Cuenta y Usar Modelo',
    activateAndUse: 'Activar Plan y Usar Modelo',
    exploreOthers: 'Explorar otras plantillas',
    closePreview: 'Cerrar vista previa',
    coverExampleDesc: 'Ejemplo estructurado en 3 bloques persuasivos: apertura directa, métricas medibles e invitación a entrevista.',
    coverExampleHighlight: 'Lista para adaptar y traducir en 5 idiomas'
  },
  fr: {
    subActive: 'Abonnement Actif — Édition et Export Débloqués',
    plansFrom: 'Formules à partir de',
    comparePlans: 'Comparer les offres et moyens de paiement',
    coverCats: { executive: 'Exécutif', modern: 'Moderne & Design', ats: 'ATS & Tech', international: 'Union Européenne' },
    cvExCats: { tech: 'Technologie', executive: 'Direction & COO', finance: 'Finance', creative: 'Design & UX', health: 'Europe & Santé', academic: 'Académique' },
    coverExCats: { tech: 'Technologie', executive: 'Exécutif', product: 'Produit', finance: 'Finance', entry: 'Premier Emploi', transition: 'Reconversion' },
    zoomCv: 'Agrandir aperçu A4',
    zoomCover: 'Agrandir la lettre',
    zoomExample: 'Voir l’exemple complet',
    readFullCover: 'Lire toute la lettre',
    readBtn: 'Lire',
    aboutFormat: 'À propos de ce format',
    keyHighlights: 'Points forts',
    freeModalDetail: 'Pour personnaliser ce modèle, traduire en 5 langues et exporter en Word (.docx) ou PDF sans filigrane, activez Pro ou Exécutif VIP.',
    useNowEditor: 'Utiliser dans l’Éditeur',
    createAndUse: 'Créer un Compte et Utiliser',
    activateAndUse: 'Activer l’Offre et Utiliser',
    exploreOthers: 'Explorer d’autres modèles',
    closePreview: 'Fermer l’aperçu',
    coverExampleDesc: 'Structurée en 3 blocs convaincants : accroche ciblée, réalisations chiffrées et proposition d’entretien.',
    coverExampleHighlight: 'Prête à adapter et traduire en 5 langues'
  },
  de: {
    subActive: 'Aktives Abonnement — Bearbeitung & Export Freigeschaltet',
    plansFrom: 'Tarife ab',
    comparePlans: 'Tarife & Zahlungsmethoden vergleichen',
    coverCats: { executive: 'Executive', modern: 'Modern & Design', ats: 'ATS & Tech', international: 'Europäische Union' },
    cvExCats: { tech: 'Technologie', executive: 'Geschäftsführung', finance: 'Finanzen', creative: 'Design & UX', health: 'Europa & Gesundheit', academic: 'Akademisch' },
    coverExCats: { tech: 'Technologie', executive: 'Executive', product: 'Produkt', finance: 'Finanzen', entry: 'Berufseinstieg', transition: 'Quereinstieg' },
    zoomCv: 'A4-Ansicht vergrößern',
    zoomCover: 'Anschreiben vergrößern',
    zoomExample: 'Vollständiges Beispiel',
    readFullCover: 'Vollständigen Brief lesen',
    readBtn: 'Lesen',
    aboutFormat: 'Über dieses Format',
    keyHighlights: 'Wesentliche Merkmale',
    freeModalDetail: 'Um diese Vorlage anzupassen, in 5 Sprachen zu übersetzen und als sauberes Word (.docx) oder PDF zu laden, aktivieren Sie Pro oder Executive VIP.',
    useNowEditor: 'Jetzt im Editor nutzen',
    createAndUse: 'Konto erstellen & nutzen',
    activateAndUse: 'Tarif aktivieren & nutzen',
    exploreOthers: 'Weitere Vorlagen ansehen',
    closePreview: 'Vorschau schließen',
    coverExampleDesc: 'In 3 überzeugenden Blöcken aufgebaut: präziser Einstieg, messbare Resultate und Gesprächseinladung.',
    coverExampleHighlight: 'Bereit für 5 Sprachen und Feinschliff'
  },
  it: {
    subActive: 'Abbonamento Attivo — Modifica ed Esportazione Sbloccate',
    plansFrom: 'Piani a partire da',
    comparePlans: 'Confronta piani e metodi di pagamento',
    coverCats: { executive: 'Executive', modern: 'Moderno & Design', ats: 'ATS & Tech', international: 'Unione Europea' },
    cvExCats: { tech: 'Tecnologia', executive: 'Direzione & COO', finance: 'Finanza', creative: 'Design & UX', health: 'Europa & Sanità', academic: 'Accademico' },
    coverExCats: { tech: 'Tecnologia', executive: 'Executive', product: 'Prodotto', finance: 'Finanza', entry: 'Primo Impiego', transition: 'Cambio Carriera' },
    zoomCv: 'Ingrandisci anteprima A4',
    zoomCover: 'Ingrandisci lettera',
    zoomExample: 'Vedi esempio completo',
    readFullCover: 'Leggi tutta la lettera',
    readBtn: 'Leggi',
    aboutFormat: 'Informazioni sul formato',
    keyHighlights: 'Punti di forza',
    freeModalDetail: 'Per personalizzare questo modello, tradurre in 5 lingue ed esportare in Word (.docx) o PDF senza filigrana, attiva Pro o Executive VIP.',
    useNowEditor: 'Usa nell’Editor',
    createAndUse: 'Crea Account e Usa Modello',
    activateAndUse: 'Attiva Piano e Usa Modello',
    exploreOthers: 'Esplora altri modelli',
    closePreview: 'Chiudi anteprima',
    coverExampleDesc: 'Strutturata in 3 blocchi efficaci: apertura mirata, risultati misurabili e invito al colloquio.',
    coverExampleHighlight: 'Pronta da adattare e tradurre in 5 lingue'
  }
};

export const ShowcaseGalleryView: React.FC<ShowcaseGalleryViewProps> = ({
  mode,
  onChangeMode,
  onUseSelection,
  onOpenPricing
}) => {
  const { isAuthenticated, hasActivePlan } = useAuth();
  const { formatPrice } = useCurrency();
  const { siteText, siteLanguage } = useLanguage();
  const s = siteText.showcase;
  const l = siteText.landing;
  const extra = SHOWCASE_EXTRA_COPY[siteLanguage] || SHOWCASE_EXTRA_COPY.pt;

  const [cvFilter, setCvFilter] = useState<'all' | 'without_photo' | 'with_photo'>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activePreview, setActivePreview] = useState<ModalPreviewState | null>(null);
  const [adminTemplates, setAdminTemplates] = useState(() => getStoredTemplatesSync());
  const [adminPlans, setAdminPlans] = useState(() => getStoredPlansSync());

  useEffect(() => {
    const syncConfig = () => {
      setAdminTemplates(getStoredTemplatesSync());
      setAdminPlans(getStoredPlansSync());
    };
    window.addEventListener('admin-config-updated', syncConfig);
    window.addEventListener('storage', syncConfig);
    return () => {
      window.removeEventListener('admin-config-updated', syncConfig);
      window.removeEventListener('storage', syncConfig);
    };
  }, []);

  useEffect(() => {
    setSectorFilter('all');
    setSearchTerm('');
  }, [mode]);

  const proPlan = adminPlans.find((p) => p.id === 'pro') || adminPlans[0];
  const execPlan = adminPlans.find((p) => p.id === 'executive') || adminPlans[1];
  const proUsd = proPlan?.priceMonthlyValue ?? 8;
  const execUsd = execPlan?.priceMonthlyValue ?? 12;

  const activeCvTemplates = useMemo(() => {
    const adminMap = new Map(adminTemplates.map((t) => [t.id, t]));
    return CV_TEMPLATES.filter((t) => {
      const cfg = adminMap.get(t.id);
      return !cfg || cfg.isActive !== false;
    })
      .map((t) => {
        const cfg = adminMap.get(t.id);
        return {
          ...t,
          shortName: cfg?.shortName || t.shortName,
          atsScore: cfg?.atsScore ?? t.atsScore,
          displayOrder: cfg?.displayOrder ?? 99
        };
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [adminTemplates]);

  const filteredCvTemplates = activeCvTemplates.filter((tmpl) => {
    if (cvFilter === 'without_photo' && tmpl.hasPhoto) return false;
    if (cvFilter === 'with_photo' && !tmpl.hasPhoto) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        tmpl.name.toLowerCase().includes(q) ||
        tmpl.shortName.toLowerCase().includes(q) ||
        tmpl.tagline.toLowerCase().includes(q) ||
        tmpl.regions.some((r) => r.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredCoverTemplates = COVER_LETTER_TEMPLATES.filter((tpl) => {
    if (sectorFilter !== 'all' && tpl.category !== sectorFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        tpl.name.toLowerCase().includes(q) ||
        tpl.shortName.toLowerCase().includes(q) ||
        tpl.tagline.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredCvExamples = CV_EXAMPLES.filter((ex) => {
    if (sectorFilter !== 'all' && ex.category !== sectorFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        ex.roleTitle.toLowerCase().includes(q) ||
        ex.industry.toLowerCase().includes(q) ||
        ex.tagline.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredCoverExamples = COVER_LETTER_EXAMPLES.filter((ex) => {
    if (sectorFilter !== 'all' && ex.category !== sectorFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        ex.title.toLowerCase().includes(q) ||
        ex.industry.toLowerCase().includes(q) ||
        ex.tagline.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const currentModeText = s.modes[mode];

  const handleActionClick = (payload: ShowcaseSelectionPayload) => {
    setActivePreview(null);
    onUseSelection(payload);
  };

  const tabItems: { id: ShowcaseMode; label: string; icon: React.ElementType }[] = [
    { id: 'models-cv', label: s.modes['models-cv'].tabLabel, icon: FileText },
    { id: 'examples-cv', label: s.modes['examples-cv'].tabLabel, icon: Briefcase },
    { id: 'models-cover', label: s.modes['models-cover'].tabLabel, icon: Mail },
    { id: 'examples-cover', label: s.modes['examples-cover'].tabLabel, icon: CheckCircle2 }
  ];

  const currentResultCount =
    mode === 'models-cv'
      ? filteredCvTemplates.length
      : mode === 'models-cover'
      ? filteredCoverTemplates.length
      : mode === 'examples-cv'
      ? filteredCvExamples.length
      : filteredCoverExamples.length;

  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      {/* Top Hero & Mode Navigation */}
      <section className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                {currentModeText.kicker}
              </p>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                {currentModeText.title}
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                {currentModeText.subtitle}
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-xs space-y-1.5 shrink-0 max-w-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                  {hasActivePlan ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  <span>
                    {hasActivePlan ? extra.subActive : s.previewFreeBadge}
                  </span>
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed tabular-nums">
                {extra.plansFrom} <strong>{formatPrice(proUsd)}</strong> &middot;{' '}
                <strong>{formatPrice(execUsd)}</strong>/{siteText.billingCycles.monthly.shortUnit} · {l.cardAndPix}
              </p>
              {!hasActivePlan && (
                <button
                  type="button"
                  onClick={onOpenPricing}
                  className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 pt-0.5"
                >
                  <span>{extra.comparePlans}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* 4-Way Segmented Showcase Navigation */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {tabItems.map((item) => {
              const Icon = item.icon;
              const isActive = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChangeMode(item.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="bg-white border-b border-slate-200 sticky top-15 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {mode === 'models-cv' && (
              <>
                {[
                  { id: 'all', label: `${s.allModels} (${activeCvTemplates.length})` },
                  { id: 'without_photo', label: s.noPhotoAts },
                  { id: 'with_photo', label: s.withPhotoEu }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCvFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      cvFilter === f.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </>
            )}

            {mode === 'models-cover' && (
              <>
                {[
                  { id: 'all', label: `${s.allModels} (${COVER_LETTER_TEMPLATES.length})` },
                  { id: 'executive', label: extra.coverCats.executive },
                  { id: 'modern', label: extra.coverCats.modern },
                  { id: 'ats', label: extra.coverCats.ats },
                  { id: 'international', label: extra.coverCats.international }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSectorFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      sectorFilter === f.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </>
            )}

            {mode === 'examples-cv' && (
              <>
                {[
                  { id: 'all', label: `${s.allSectors} (${CV_EXAMPLES.length})` },
                  { id: 'tech', label: extra.cvExCats.tech },
                  { id: 'executive', label: extra.cvExCats.executive },
                  { id: 'finance', label: extra.cvExCats.finance },
                  { id: 'creative', label: extra.cvExCats.creative },
                  { id: 'health', label: extra.cvExCats.health },
                  { id: 'academic', label: extra.cvExCats.academic }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSectorFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      sectorFilter === f.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </>
            )}

            {mode === 'examples-cover' && (
              <>
                {[
                  { id: 'all', label: `${s.allSectors} (${COVER_LETTER_EXAMPLES.length})` },
                  { id: 'tech', label: extra.coverExCats.tech },
                  { id: 'executive', label: extra.coverExCats.executive },
                  { id: 'product', label: extra.coverExCats.product },
                  { id: 'finance', label: extra.coverExCats.finance },
                  { id: 'entry', label: extra.coverExCats.entry },
                  { id: 'transition', label: extra.coverExCats.transition }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSectorFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      sectorFilter === f.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={s.searchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      </section>

      {/* Main Visual Gallery Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {currentResultCount === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
            <p className="text-sm font-medium text-slate-600">{s.emptyState}</p>
            <button
              type="button"
              onClick={() => {
                setCvFilter('all');
                setSectorFilter('all');
                setSearchTerm('');
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              {s.clearFilters}
            </button>
          </div>
        )}

        {mode === 'models-cv' && currentResultCount > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCvTemplates.map((tmpl) => {
              const payload: ShowcaseSelectionPayload = {
                targetTab: 'editor',
                label: tmpl.shortName,
                templateStyle: tmpl.id,
                accentColor: tmpl.accentColor
              };

              return (
                <article
                  key={tmpl.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:border-slate-300 hover:shadow-md transition-all group"
                >
                  {/* Visual A4 Photo Thumbnail */}
                  <div
                    onClick={() =>
                      setActivePreview({
                        title: tmpl.name,
                        subtitle: tmpl.tagline,
                        metaLine: `${tmpl.hasPhoto ? l.badgeWithPhoto : l.badgeNoPhotoAts} · ${tmpl.atsScore}% ATS · ${tmpl.regions.slice(0, 2).join(', ')}`,
                        description: tmpl.whenToUse,
                        highlights: tmpl.keyFeatures,
                        selectionPayload: payload,
                        previewProps: {
                          kind: 'cv',
                          templateStyle: tmpl.id,
                          accentColor: tmpl.accentColor,
                          hasPhoto: tmpl.hasPhoto
                        }
                      })
                    }
                    className="bg-slate-100 p-5 sm:p-6 flex items-center justify-center relative cursor-pointer border-b border-slate-200"
                  >
                    <div className="w-full max-w-[230px] aspect-[210/297] bg-white shadow-[0_12px_30px_-8px_rgba(15,23,42,0.2)] border border-slate-200 rounded-xs overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]">
                      <DocumentMiniPreview
                        kind="cv"
                        templateStyle={tmpl.id}
                        accentColor={tmpl.accentColor}
                        hasPhoto={tmpl.hasPhoto}
                        size="sm"
                      />
                    </div>
                    <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-slate-900/90 text-white text-[11px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {extra.zoomCv}
                    </span>
                  </div>

                  {/* Card Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-medium text-slate-500">
                        {tmpl.hasPhoto ? l.badgeWithPhoto : l.badgeNoPhotoAts} · {tmpl.atsScore}% ATS · {tmpl.regions[0]}
                      </p>
                      <h2 className="text-base font-bold text-slate-900">{tmpl.shortName}</h2>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{tmpl.tagline}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() =>
                          setActivePreview({
                            title: tmpl.name,
                            subtitle: tmpl.tagline,
                            metaLine: `${tmpl.hasPhoto ? l.badgeWithPhoto : l.badgeNoPhotoAts} · ${tmpl.atsScore}% ATS`,
                            description: tmpl.whenToUse,
                            highlights: tmpl.keyFeatures,
                            selectionPayload: payload,
                            previewProps: {
                              kind: 'cv',
                              templateStyle: tmpl.id,
                              accentColor: tmpl.accentColor,
                              hasPhoto: tmpl.hasPhoto
                            }
                          })
                        }
                        className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{s.inspectBtn}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActionClick(payload)}
                        className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>{s.useBtn}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {mode === 'models-cover' && currentResultCount > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoverTemplates.map((tpl) => {
              const payload: ShowcaseSelectionPayload = {
                targetTab: 'cover',
                label: tpl.shortName,
                templateStyle: tpl.associatedCvTemplate,
                accentColor: tpl.accentColor,
                letterBody: tpl.sampleLetterBody
              };

              return (
                <article
                  key={tpl.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:border-slate-300 hover:shadow-md transition-all group"
                >
                  <div
                    onClick={() =>
                      setActivePreview({
                        title: tpl.name,
                        subtitle: tpl.tagline,
                        metaLine: `${tpl.categoryLabel} · ${tpl.regions.slice(0, 2).join(', ')}`,
                        description: tpl.description,
                        highlights: tpl.bestFor,
                        selectionPayload: payload,
                        previewProps: {
                          kind: 'cover',
                          layoutStyle: tpl.layoutStyle,
                          accentColor: tpl.accentColor,
                          candidateName: tpl.sampleCandidateName,
                          candidateTitle: tpl.sampleCandidateTitle,
                          location: tpl.sampleLocation,
                          email: tpl.sampleEmail,
                          phone: tpl.samplePhone,
                          letterBody: tpl.sampleLetterBody
                        }
                      })
                    }
                    className="bg-slate-100 p-5 sm:p-6 flex items-center justify-center relative cursor-pointer border-b border-slate-200"
                  >
                    <div className="w-full max-w-[230px] aspect-[210/297] bg-white shadow-[0_12px_30px_-8px_rgba(15,23,42,0.2)] border border-slate-200 rounded-xs overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]">
                      <DocumentMiniPreview
                        kind="cover"
                        layoutStyle={tpl.layoutStyle}
                        accentColor={tpl.accentColor}
                        candidateName={tpl.sampleCandidateName}
                        candidateTitle={tpl.sampleCandidateTitle}
                        location={tpl.sampleLocation}
                        email={tpl.sampleEmail}
                        phone={tpl.samplePhone}
                        letterBody={tpl.sampleLetterBody}
                        size="sm"
                      />
                    </div>
                    <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-slate-900/90 text-white text-[11px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {extra.zoomCover}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-medium text-slate-500">
                        {tpl.categoryLabel} · {tpl.regions[0]}
                      </p>
                      <h2 className="text-base font-bold text-slate-900">{tpl.shortName}</h2>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{tpl.tagline}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() =>
                          setActivePreview({
                            title: tpl.name,
                            subtitle: tpl.tagline,
                            metaLine: `${tpl.categoryLabel} · ${tpl.regions.slice(0, 2).join(', ')}`,
                            description: tpl.description,
                            highlights: tpl.bestFor,
                            selectionPayload: payload,
                            previewProps: {
                              kind: 'cover',
                              layoutStyle: tpl.layoutStyle,
                              accentColor: tpl.accentColor,
                              candidateName: tpl.sampleCandidateName,
                              candidateTitle: tpl.sampleCandidateTitle,
                              location: tpl.sampleLocation,
                              email: tpl.sampleEmail,
                              phone: tpl.samplePhone,
                              letterBody: tpl.sampleLetterBody
                            }
                          })
                        }
                        className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{s.inspectBtn}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActionClick(payload)}
                        className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>{s.useBtn}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {mode === 'examples-cv' && currentResultCount > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCvExamples.map((ex) => {
              const payload: ShowcaseSelectionPayload = {
                targetTab: 'editor',
                label: ex.roleTitle,
                cvData: ex.cvData,
                templateStyle: ex.cvData.templateStyle,
                accentColor: ex.cvData.accentColor
              };

              return (
                <article
                  key={ex.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:border-slate-300 hover:shadow-md transition-all group"
                >
                  <div
                    onClick={() =>
                      setActivePreview({
                        title: ex.roleTitle,
                        subtitle: ex.tagline,
                        metaLine: `${ex.industry} · ${ex.experienceLevel} · ${ex.regionTag}`,
                        description: ex.highlightsSummary,
                        highlights: ex.cvData.experiences[0]?.highlights || [],
                        selectionPayload: payload,
                        previewProps: {
                          kind: 'cv',
                          templateStyle: ex.cvData.templateStyle,
                          accentColor: ex.cvData.accentColor,
                          cvData: ex.cvData,
                          hasPhoto: Boolean(ex.cvData.personalDetails.showPhoto)
                        }
                      })
                    }
                    className="bg-slate-100 p-5 sm:p-6 flex items-center justify-center relative cursor-pointer border-b border-slate-200"
                  >
                    <div className="w-full max-w-[230px] aspect-[210/297] bg-white shadow-[0_12px_30px_-8px_rgba(15,23,42,0.2)] border border-slate-200 rounded-xs overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]">
                      <DocumentMiniPreview
                        kind="cv"
                        templateStyle={ex.cvData.templateStyle}
                        accentColor={ex.cvData.accentColor}
                        cvData={ex.cvData}
                        hasPhoto={Boolean(ex.cvData.personalDetails.showPhoto)}
                        size="sm"
                      />
                    </div>
                    <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-slate-900/90 text-white text-[11px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {extra.zoomExample}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-medium text-slate-500">
                        {ex.industry} · {ex.experienceLevel}
                      </p>
                      <h2 className="text-base font-bold text-slate-900">{ex.roleTitle}</h2>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{ex.tagline}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() =>
                          setActivePreview({
                            title: ex.roleTitle,
                            subtitle: ex.tagline,
                            metaLine: `${ex.industry} · ${ex.experienceLevel} · ${ex.regionTag}`,
                            description: ex.highlightsSummary,
                            highlights: ex.cvData.experiences[0]?.highlights || [],
                            selectionPayload: payload,
                            previewProps: {
                              kind: 'cv',
                              templateStyle: ex.cvData.templateStyle,
                              accentColor: ex.cvData.accentColor,
                              cvData: ex.cvData,
                              hasPhoto: Boolean(ex.cvData.personalDetails.showPhoto)
                            }
                          })
                        }
                        className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{s.inspectBtn}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActionClick(payload)}
                        className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>{s.useBtn}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {mode === 'examples-cover' && currentResultCount > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoverExamples.map((ex) => {
              const payload: ShowcaseSelectionPayload = {
                targetTab: 'cover',
                label: ex.title,
                templateStyle: ex.associatedCvTemplate,
                accentColor: ex.accentColor,
                letterBody: ex.letterBody
              };

              return (
                <article
                  key={ex.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:border-slate-300 hover:shadow-md transition-all group"
                >
                  <div
                    onClick={() =>
                      setActivePreview({
                        title: ex.title,
                        subtitle: ex.tagline,
                        metaLine: `${ex.industry} · ${ex.situationTag}`,
                        description: extra.coverExampleDesc,
                        highlights: [ex.industry, ex.situationTag, extra.coverExampleHighlight],
                        selectionPayload: payload,
                        previewProps: {
                          kind: 'cover',
                          layoutStyle: ex.templateLayout,
                          accentColor: ex.accentColor,
                          candidateName: ex.candidateName,
                          candidateTitle: ex.candidateTitle,
                          location: ex.location,
                          email: ex.email,
                          phone: ex.phone,
                          letterBody: ex.letterBody
                        }
                      })
                    }
                    className="bg-slate-100 p-5 sm:p-6 flex items-center justify-center relative cursor-pointer border-b border-slate-200"
                  >
                    <div className="w-full max-w-[230px] aspect-[210/297] bg-white shadow-[0_12px_30px_-8px_rgba(15,23,42,0.2)] border border-slate-200 rounded-xs overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]">
                      <DocumentMiniPreview
                        kind="cover"
                        layoutStyle={ex.templateLayout}
                        accentColor={ex.accentColor}
                        candidateName={ex.candidateName}
                        candidateTitle={ex.candidateTitle}
                        location={ex.location}
                        email={ex.email}
                        phone={ex.phone}
                        letterBody={ex.letterBody}
                        size="sm"
                      />
                    </div>
                    <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-slate-900/90 text-white text-[11px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {extra.readFullCover}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-medium text-slate-500">
                        {ex.industry} · {ex.situationTag}
                      </p>
                      <h2 className="text-base font-bold text-slate-900">{ex.title}</h2>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{ex.tagline}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() =>
                          setActivePreview({
                            title: ex.title,
                            subtitle: ex.tagline,
                            metaLine: `${ex.industry} · ${ex.situationTag}`,
                            description: extra.coverExampleDesc,
                            highlights: [ex.industry, ex.situationTag, extra.coverExampleHighlight],
                            selectionPayload: payload,
                            previewProps: {
                              kind: 'cover',
                              layoutStyle: ex.templateLayout,
                              accentColor: ex.accentColor,
                              candidateName: ex.candidateName,
                              candidateTitle: ex.candidateTitle,
                              location: ex.location,
                              email: ex.email,
                              phone: ex.phone,
                              letterBody: ex.letterBody
                            }
                          })
                        }
                        className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{extra.readBtn}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActionClick(payload)}
                        className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>{s.useBtn}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Free Visual Lightbox Modal */}
      {activePreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-amber-400 truncate">{activePreview.metaLine}</p>
                <h3 className="text-base sm:text-lg font-bold truncate">{activePreview.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePreview(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                aria-label={extra.closePreview}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
              {/* Large A4 Document Preview */}
              <div className="lg:col-span-7 bg-slate-100 p-4 sm:p-6 flex items-start justify-center border-b lg:border-b-0 lg:border-r border-slate-200">
                <div className="w-full max-w-[540px] aspect-[210/297] bg-white shadow-xl border border-slate-200 rounded-xs overflow-hidden">
                  <DocumentMiniPreview {...activePreview.previewProps} size="lg" />
                </div>
              </div>

              {/* Details & Paid Action Sidebar */}
              <div className="lg:col-span-5 p-6 flex flex-col justify-between space-y-6 bg-white">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {extra.aboutFormat}
                    </h4>
                    <p className="text-sm text-slate-800 font-medium mt-1">{activePreview.subtitle}</p>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{activePreview.description}</p>
                  </div>

                  {activePreview.highlights.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-slate-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {extra.keyHighlights}
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-700">
                        {activePreview.highlights.slice(0, 4).map((h, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!hasActivePlan && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-1.5">
                      <p className="font-bold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>{s.previewFreeBadge}</span>
                      </p>
                      <p className="text-[11px] text-amber-900 leading-relaxed tabular-nums">
                        {extra.freeModalDetail} ({formatPrice(proUsd)} / {formatPrice(execUsd)})
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleActionClick(activePreview.selectionPayload)}
                    className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <span>
                      {hasActivePlan
                        ? extra.useNowEditor
                        : !isAuthenticated
                        ? extra.createAndUse
                        : extra.activateAndUse}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreview(null)}
                    className="w-full py-2 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    {extra.exploreOthers}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
