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

export const ShowcaseGalleryView: React.FC<ShowcaseGalleryViewProps> = ({
  mode,
  onChangeMode,
  onUseSelection,
  onOpenPricing
}) => {
  const { isAuthenticated, hasActivePlan } = useAuth();
  const { formatPrice, convertFromUSD } = useCurrency();

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

  const modeMeta: Record<
    ShowcaseMode,
    { kicker: string; title: string; subtitle: string }
  > = {
    'models-cv': {
      kicker: 'Galeria Visual de Modelos de CV',
      title: 'Modelos de Currículo Profissionais',
      subtitle:
        'Visualize todos os layouts em tamanho real antes de criar a sua conta. Escolha um modelo calibrado para ATS ou mercado europeu e comece a editar.'
    },
    'examples-cv': {
      kicker: 'Exemplos Reais por Profissão',
      title: 'Exemplos de Currículo Preenchidos',
      subtitle:
        'Inspire-se em currículos reais estruturados com métricas de impacto. Clique em "Usar exemplo" para carregar a estrutura e adaptar aos seus dados.'
    },
    'models-cover': {
      kicker: 'Galeria Visual de Cartas de Apresentação',
      title: 'Modelos de Carta de Apresentação',
      subtitle:
        'Layouts elegantes em formato A4 alinhados ao seu currículo para conquistar recrutadores logo na primeira leitura.'
    },
    'examples-cover': {
      kicker: 'Cartas Prontas por Área & Situação',
      title: 'Exemplos de Carta de Apresentação',
      subtitle:
        'Veja modelos completos de texto para cargos executivos, tecnologia, finanças, primeiro emprego ou mudança de carreira.'
    }
  };

  const handleActionClick = (payload: ShowcaseSelectionPayload) => {
    setActivePreview(null);
    onUseSelection(payload);
  };

  const tabItems: { id: ShowcaseMode; label: string; icon: React.ElementType }[] = [
    { id: 'models-cv', label: 'Modelos de CV', icon: FileText },
    { id: 'examples-cv', label: 'Exemplos de CV', icon: Briefcase },
    { id: 'models-cover', label: 'Modelos de Carta', icon: Mail },
    { id: 'examples-cover', label: 'Exemplos de Carta', icon: CheckCircle2 }
  ];

  const proBrl = convertFromUSD(proUsd, 'BRL').toFixed(2).replace('.', ',');
  const execBrl = convertFromUSD(execUsd, 'BRL').toFixed(2).replace('.', ',');

  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      {/* Top Hero & Mode Navigation */}
      <section className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                {modeMeta[mode].kicker}
              </p>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                {modeMeta[mode].title}
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                {modeMeta[mode].subtitle}
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-xs space-y-1 shrink-0 max-w-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                  {hasActivePlan ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>
                    {hasActivePlan
                      ? 'Subscrição Ativa — Uso Ilimitado'
                      : 'Visualização Gratuita · Edição por Subscrição'}
                  </span>
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Planos <strong>${proUsd} USD</strong> (R$ {proBrl}) e{' '}
                <strong>${execUsd} USD</strong> (R$ {execBrl})/mês · Cartão (Stripe) ou Pix.
              </p>
              {!hasActivePlan && (
                <button
                  type="button"
                  onClick={onOpenPricing}
                  className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 pt-0.5"
                >
                  <span>Ver planos e formas de pagamento</span>
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
                  { id: 'all', label: `Todos (${activeCvTemplates.length})` },
                  { id: 'without_photo', label: 'Sem Foto · ATS' },
                  { id: 'with_photo', label: 'Com Foto · Europa' }
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
                  { id: 'all', label: `Todos (${COVER_LETTER_TEMPLATES.length})` },
                  { id: 'executive', label: 'Executivo' },
                  { id: 'modern', label: 'Moderno & Design' },
                  { id: 'ats', label: 'ATS & Tech' },
                  { id: 'international', label: 'União Europeia' }
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
                  { id: 'all', label: `Todas as Áreas (${CV_EXAMPLES.length})` },
                  { id: 'tech', label: 'Tecnologia' },
                  { id: 'executive', label: 'Direção & COO' },
                  { id: 'finance', label: 'Finanças' },
                  { id: 'creative', label: 'Design & UX' },
                  { id: 'health', label: 'Europa & Saúde' },
                  { id: 'academic', label: 'Académico' }
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
                  { id: 'all', label: `Todas as Situações (${COVER_LETTER_EXAMPLES.length})` },
                  { id: 'tech', label: 'Tecnologia' },
                  { id: 'executive', label: 'Executivo' },
                  { id: 'product', label: 'Produto' },
                  { id: 'finance', label: 'Finanças' },
                  { id: 'entry', label: 'Primeiro Emprego' },
                  { id: 'transition', label: 'Mudança de Área' }
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
              placeholder="Pesquisar área ou modelo..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      </section>

      {/* Main Visual Gallery Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {mode === 'models-cv' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCvTemplates.map((tmpl) => {
              const payload: ShowcaseSelectionPayload = {
                targetTab: 'editor',
                label: `Modelo ${tmpl.shortName}`,
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
                        metaLine: `${tmpl.hasPhoto ? 'Com Foto' : 'Sem Foto · 100% ATS'} · ${tmpl.atsScore}% ATS · ${tmpl.regions.slice(0, 2).join(', ')}`,
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
                      Ampliar foto A4
                    </span>
                  </div>

                  {/* Card Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-medium text-slate-500">
                        {tmpl.hasPhoto ? 'Com Foto' : 'Sem Foto · ATS'} · {tmpl.atsScore}% ATS · {tmpl.regions[0]}
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
                            metaLine: `${tmpl.hasPhoto ? 'Com Foto' : 'Sem Foto · 100% ATS'} · ${tmpl.atsScore}% ATS`,
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
                        <span>Ver</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActionClick(payload)}
                        className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Usar modelo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {mode === 'models-cover' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoverTemplates.map((tpl) => {
              const payload: ShowcaseSelectionPayload = {
                targetTab: 'cover',
                label: `Modelo de Carta ${tpl.shortName}`,
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
                      Ampliar carta
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
                        <span>Ver</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActionClick(payload)}
                        className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Usar modelo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {mode === 'examples-cv' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCvExamples.map((ex) => {
              const payload: ShowcaseSelectionPayload = {
                targetTab: 'editor',
                label: `Exemplo: ${ex.roleTitle}`,
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
                      Ver exemplo completo
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
                        <span>Ver</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActionClick(payload)}
                        className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Usar exemplo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {mode === 'examples-cover' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoverExamples.map((ex) => {
              const payload: ShowcaseSelectionPayload = {
                targetTab: 'cover',
                label: `Exemplo de Carta: ${ex.title}`,
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
                        description:
                          'Exemplo estruturado em 3 blocos persuasivos: abertura objetiva, resultados mensuráveis e chamada à entrevista.',
                        highlights: [ex.industry, ex.situationTag, 'Pronta a adaptar e traduzir em 5 idiomas'],
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
                      Ler carta completa
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
                            description:
                              'Exemplo estruturado em 3 blocos persuasivos: abertura objetiva, resultados mensuráveis e chamada à entrevista.',
                            highlights: [ex.industry, ex.situationTag, 'Pronta a adaptar e traduzir em 5 idiomas'],
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
                        <span>Ler</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActionClick(payload)}
                        className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Usar exemplo</span>
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
                aria-label="Fechar pré-visualização"
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
                      Sobre este formato
                    </h4>
                    <p className="text-sm text-slate-800 font-medium mt-1">{activePreview.subtitle}</p>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{activePreview.description}</p>
                  </div>

                  {activePreview.highlights.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-slate-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Destaques principais
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
                        <span>Visualização gratuita · Edição para assinantes</span>
                      </p>
                      <p className="text-[11px] text-amber-900 leading-relaxed">
                        {!isAuthenticated
                          ? `Ao clicar em "Usar este modelo", será convidado a criar a sua conta e escolher o plano Pro (${formatPrice(proUsd)}/mês) ou Executivo VIP (${formatPrice(execUsd)}/mês) via Cartão (Stripe) ou Pix.`
                          : `Para personalizar este modelo, traduzir e descarregar em Word/PDF sem marca de água, ative o plano Pro (${formatPrice(proUsd)}/mês) ou Executivo VIP (${formatPrice(execUsd)}/mês) via Cartão ou Pix.`}
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
                        ? 'Abrir Agora no Editor'
                        : !isAuthenticated
                        ? 'Criar Conta & Usar Este Modelo'
                        : 'Ativar Plano & Usar Este Modelo'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreview(null)}
                    className="w-full py-2 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Continuar a ver outros modelos
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
