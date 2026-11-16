import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { CVData } from '../types/cv';
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
  RotateCcw
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
}

const PREFS_STORAGE_KEY = 'cv_job_preferences_v1';

const COUNTRY_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'remoto_global', label: 'Remoto Global' },
  { id: 'brasil', label: 'Brasil' },
  { id: 'portugal', label: 'Portugal' },
  { id: 'angola', label: 'Angola' },
  { id: 'espanha', label: 'Espanha' },
  { id: 'reino_unido', label: 'Reino Unido' },
  { id: 'alemanha', label: 'Alemanha' },
  { id: 'franca', label: 'França' },
  { id: 'estados_unidos', label: 'Estados Unidos' },
  { id: 'canada', label: 'Canadá' },
  { id: 'europa', label: 'União Europeia' }
];

const CONTRACT_TYPE_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'full_time', label: 'Tempo Integral' },
  { id: 'contract', label: 'Contrato / PJ / Freelance' },
  { id: 'part_time', label: 'Meio Período' },
  { id: 'internship', label: 'Estágio / Trainee' }
];

const CONTRACT_LABELS: Record<string, string> = {
  full_time: 'Tempo Integral',
  contract: 'Contrato / PJ',
  part_time: 'Meio Período',
  internship: 'Estágio'
};

const WORKPLACE_LABELS: Record<string, string> = {
  remote: 'Remoto',
  hybrid: 'Híbrido',
  onsite: 'Presencial'
};

const SOURCE_TABS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'Todos os Portais' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'radar', label: 'Radar de Vagas' },
  { id: 'remotive', label: 'Remotive' },
  { id: 'arbeitnow', label: 'Arbeitnow' },
  { id: 'jobicy', label: 'Jobicy' },
  { id: 'remoteok', label: 'RemoteOK' }
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
  salary: MatchedRadarJob['salary']
): string | null {
  if (salary == null) return null;
  if (typeof salary === 'string') return salary.trim() || null;
  if (typeof salary === 'number' && Number.isFinite(salary)) {
    return salary.toLocaleString('pt-PT');
  }
  if (typeof salary === 'object') {
    const { min, max, currency, period } = salary;
    const periodMap: Record<string, string> = {
      year: '/ano',
      annual: '/ano',
      yearly: '/ano',
      month: '/mês',
      monthly: '/mês',
      hour: '/hora',
      hourly: '/hora',
      day: '/dia',
      week: '/semana'
    };
    const pSuffix = period ? periodMap[String(period).toLowerCase()] || `/${period}` : '';
    const curPrefix = currency ? `${String(currency).toUpperCase()} ` : '';
    if (typeof min === 'number' && typeof max === 'number' && min !== max) {
      return `${curPrefix}${min.toLocaleString('pt-PT')} – ${max.toLocaleString('pt-PT')}${pSuffix}`;
    }
    if (typeof min === 'number' || typeof max === 'number') {
      const val = typeof min === 'number' ? min : (max as number);
      return `${curPrefix}${val.toLocaleString('pt-PT')}${pSuffix}`;
    }
  }
  return null;
}

function formatRelativeDate(iso?: string | null): string {
  if (!iso) return 'Recente';
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return 'Recente';
  const diffHours = Math.max(0, Math.floor((Date.now() - ts) / (1000 * 60 * 60)));
  if (diffHours < 1) return 'Hoje';
  if (diffHours < 24) return `Há ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 30) return `Há ${diffDays}d`;
  return new Date(iso).toLocaleDateString('pt-PT');
}

function getSafeExternalHttpUrl(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '#';
  const trimmed = raw.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : '#';
}

export const JobMatchesPanel: React.FC<JobMatchesPanelProps> = ({
  cv,
  onApplyJobToTailor
}) => {
  const [data, setData] = useState<JobMatchResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [workplaceFilter, setWorkplaceFilter] = useState<'all' | 'remote' | 'hybrid' | 'onsite'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [tailoringJobId, setTailoringJobId] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<JobPreferences>(() => loadSavedPreferences());
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(true);
  const [customRoleInput, setCustomRoleInput] = useState<string>('');

  // Persist user preferences cleanly
  useEffect(() => {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Ignore storage quota errors
    }
  }, [preferences]);

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
          throw new Error(json?.error || 'Falha ao buscar vagas nos portais conectados.');
        }
        setData(json as JobMatchResponse);
      } catch (err: any) {
        setError(err?.message || 'Erro ao conectar com os portais de vagas.');
      } finally {
        setIsLoading(false);
      }
    },
    [cv, activeSearch, workplaceFilter, sourceFilter, preferences]
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

  const handleTailorForJob = async (job: MatchedRadarJob) => {
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
        `Cargo: ${job.title}`,
        `Empresa: ${job.company}`,
        `Portal: ${job.sourceName}`,
        `Modalidade: ${WORKPLACE_LABELS[job.workplace] || job.workplace}`,
        job.locations?.length ? `Localização: ${job.locations.join(', ')}` : '',
        skillsLine ? `Competências e Palavras-Chave: ${skillsLine}` : ''
      ]
        .filter(Boolean)
        .join('\n');

      const combinedText = fullDescription
        ? `${headerBlock}\n\nDescrição da Vaga:\n${fullDescription.slice(0, 4000)}`
        : `${headerBlock}\n\nCritérios de compatibilidade detetados: ${job.matchedKeywords.join(', ')}.`;

      onApplyJobToTailor(combinedText, 'ats');
    } finally {
      setTailoringJobId(null);
    }
  };

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
      {/* Header & Live Multi-Portal Count Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-800 shrink-0" />
              <h2 className="text-sm font-bold text-slate-950 tracking-tight">
                Vagas Compatíveis com o seu CV
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Cruzamento ao vivo em{' '}
              <span className="font-semibold text-slate-800">
                LinkedIn, Radar de Vagas, Remotive, Arbeitnow, Jobicy e RemoteOK
              </span>{' '}
              para{' '}
              <span className="font-semibold text-slate-900">
                {preferences.targetRoles.length > 0
                  ? preferences.targetRoles.join(', ')
                  : cv.personalDetails?.title || 'o seu perfil'}
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
            <span>Atualizar</span>
          </button>
        </div>

        {/* Quantitative Readout Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-slate-100 pt-3 gap-3">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">
              Vagas compatíveis
            </span>
            <span className="text-xl font-extrabold text-slate-950 tabular-nums">
              {isLoading && !data ? '—' : compatibleCount}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-500 block">
              Base ativa indexada
            </span>
            <span className="text-xl font-bold text-slate-800 tabular-nums">
              {totalPlatformJobs > 0 ? totalPlatformJobs.toLocaleString('pt-PT') : '—'}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[11px] font-medium text-slate-500 block">
              Critérios analisados
            </span>
            <span className="text-xs font-medium text-slate-700 line-clamp-1 mt-1">
              {data?.profileQueriesUsed?.length
                ? data.profileQueriesUsed.join(', ')
                : cv.personalDetails?.title || 'Perfil completo'}
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
                Configurar Preferências de Vagas
              </span>
              <span className="text-[11px] text-slate-500 block truncate">
                {activePrefCount > 0
                  ? `${preferences.countries.length} país(es) · ${preferences.targetRoles.length} cargo(s) · ${preferences.contractTypes.length} contrato(s) (atualização automática)`
                  : 'Personalize países, cargos e tipos de contrato'}
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
              title="Limpar todas as preferências"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar</span>
            </button>
          )}
        </div>

        {isConfigOpen && (
          <div className="p-4 border-t border-slate-200 space-y-4">
            {/* 1. Target Roles */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Cargos Preferidos
              </label>

              <form onSubmit={handleAddCustomRole} className="flex items-center gap-2">
                <input
                  type="text"
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  placeholder="Adicionar cargo (ex: Product Manager, React Developer)..."
                  className="flex-1 min-w-0 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
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
                Países e Regiões Preferidas
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COUNTRY_OPTIONS.map((country) => {
                  const selected = preferences.countries.includes(country.id);
                  return (
                    <button
                      key={country.id}
                      type="button"
                      onClick={() => toggleCountry(country.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        selected
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {country.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Preferred Contract Types */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Tipos de Contrato Preferidos
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CONTRACT_TYPE_OPTIONS.map((ct) => {
                  const selected = preferences.contractTypes.includes(ct.id);
                  return (
                    <button
                      key={ct.id}
                      type="button"
                      onClick={() => toggleContractType(ct.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        selected
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {ct.label}
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
              Pesquisar o seu perfil diretamente noutros grandes portais:
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
              placeholder="Filtrar por cargo, empresa ou competência (ex: React, Finance, SAP)..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            Filtrar
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
              Limpar
            </button>
          )}
        </form>

        {/* Source Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
          {SOURCE_TABS.map((tab) => {
            const countVal =
              tab.id === 'all' ? totalCompatibleAllSources : sourceCounts[tab.id] ?? 0;
            if (tab.id !== 'all' && data && countVal === 0 && sourceFilter !== tab.id) {
              return null;
            }
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSourceFilter(tab.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                  sourceFilter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
                {data ? ` (${countVal})` : ''}
              </button>
            );
          })}
        </div>

        {/* Workplace Filter */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-100 pt-2">
          {(
            [
              { id: 'all', label: 'Todas modalidades' },
              { id: 'remote', label: 'Remoto' },
              { id: 'hybrid', label: 'Híbrido' },
              { id: 'onsite', label: 'Presencial' }
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setWorkplaceFilter(opt.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                workplaceFilter === opt.id
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {opt.label}
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
            Tentar Novamente
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
              Nenhuma vaga exata encontrada para as preferências selecionadas
            </p>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Experimente adicionar &quot;Remoto Global&quot; nos países ou alargar os cargos e
              tipos de contrato selecionados acima.
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
              Repor Filtros e Preferências
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
            const locationText =
              job.locations && job.locations.length > 0
                ? job.locations.slice(0, 2).map((l) => String(l)).join(', ')
                : WORKPLACE_LABELS[job.workplace] || 'Remoto / Global';
            const contractLabel = job.employmentType
              ? CONTRACT_LABELS[job.employmentType] || String(job.employmentType)
              : null;
            const salaryLabel = formatSalaryDisplay(job.salary);

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
                      <span>{WORKPLACE_LABELS[job.workplace] || String(job.workplace || '')}</span>
                      {contractLabel ? (
                        <>
                          {' · '}
                          <span>{contractLabel}</span>
                        </>
                      ) : null}
                      {' · '}
                      <span>{locationText}</span>
                      {' · '}
                      <span className="tabular-nums">{formatRelativeDate(job.postedAt)}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-sm font-extrabold tabular-nums block ${scoreTone}`}>
                      {job.matchScore}%
                    </span>
                    <span className="text-[11px] text-slate-500 block">match</span>
                  </div>
                </div>

                {(job.matchedKeywords.length > 0 || salaryLabel) && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {job.matchedKeywords.length > 0 && (
                      <span>
                        <span className="font-semibold text-slate-800">No seu CV:</span>{' '}
                        {job.matchedKeywords.map((k) => String(k)).join(', ')}
                      </span>
                    )}
                    {job.matchedKeywords.length > 0 && salaryLabel ? ' · ' : ''}
                    {salaryLabel && (
                      <span className="font-semibold text-slate-800 tabular-nums">
                        Salário: {salaryLabel}
                      </span>
                    )}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <a
                      href={getSafeExternalHttpUrl(job.applyUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Aplicar à Vaga</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {job.radarUrl && job.radarUrl !== job.applyUrl && getSafeExternalHttpUrl(job.radarUrl) !== '#' && (
                      <a
                        href={getSafeExternalHttpUrl(job.radarUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>Ver no {job.sourceName}</span>
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={tailoringJobId === job.id}
                    onClick={() => void handleTailorForJob(job)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    {tailoringJobId === job.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Target className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    <span>Adaptar CV (ATS)</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
