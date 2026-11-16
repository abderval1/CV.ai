import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { SubscriptionPlan } from '../types/cv';

export interface MonthlyMrrPoint {
  label: string;
  mrr: number;
  proMrr: number;
  execMrr: number;
  revenue: number;
  aiCost: number;
  activePaid: number;
}

export interface ChurnCohortPoint {
  month: string;
  newUsers: number;
  retainedCount: number;
  churnedCount: number;
  retentionRate: number;
  churnRate: number;
}

export interface TierAiEconomicsPoint {
  tierKey: SubscriptionPlan;
  tierLabel: string;
  subscribers: number;
  totalCalls: number;
  totalAiCostUsd: number;
  avgCostPerSubscriberUsd: number;
  arpuUsd: number;
  netMarginPct: number;
}

export interface SubscriberAiCostRow {
  userId: string;
  name: string;
  shortName: string;
  email: string;
  plan: SubscriptionPlan;
  planLabel: string;
  status: string;
  isPaid: boolean;
  callsCount: number;
  aiCostUsd: number;
  monthlyArpuUsd: number;
  netContributionUsd: number;
  costShareOfArpuPct: number;
}

export interface AdminFinancialChartsProps {
  periodLabel: string;
  mrr: number;
  arr: number;
  proMrr: number;
  execMrr: number;
  proUsers: number;
  executiveUsers: number;
  monthlyGrowthRate: number;
  churnRate: number;
  churnedUsersCount: number;
  paidUsersCount: number;
  totalUsersCount: number;
  monthAiCostUsd: number;
  todayAiCostUsd: number;
  avgAiCostPerPaidSubscriberUsd: number;
  avgAiCostPerRegisteredUserUsd: number;
  costToRevenuePercent: number;
  grossMarginPercent: number;
  monthlyMrrSeries: MonthlyMrrPoint[];
  churnCohortSeries: ChurnCohortPoint[];
  tierAiEconomics: TierAiEconomicsPoint[];
  subscriberAiCostList: SubscriberAiCostRow[];
  onInspectUser?: (userId: string) => void;
}

interface TooltipPayloadEntry {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  valueFormatter?: (value: number, dataKey?: string) => string;
}

const formatUsd = (val: number, decimals = 2): string =>
  `$${Number(val || 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;

const ChartTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  valueFormatter
}) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-slate-900 text-white px-3 py-2.5 rounded-lg border border-slate-700 shadow-xl text-xs min-w-[180px]">
      {label && (
        <p className="font-bold text-slate-200 border-b border-slate-700/80 pb-1.5 mb-1.5">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, idx) => {
          const numericVal = Number(entry.value ?? 0);
          const formatted = valueFormatter
            ? valueFormatter(numericVal, entry.dataKey)
            : numericVal.toLocaleString('pt-PT');
          return (
            <div
              key={`${entry.dataKey || entry.name || idx}`}
              className="flex items-center justify-between gap-4"
            >
              <span className="flex items-center gap-1.5 text-slate-300">
                <span
                  className="w-2 h-2 rounded-xs shrink-0"
                  style={{ backgroundColor: entry.color || '#f59e0b' }}
                />
                <span>{entry.name}</span>
              </span>
              <span className="font-mono font-bold tabular-nums text-white">{formatted}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const AdminFinancialCharts: React.FC<AdminFinancialChartsProps> = ({
  periodLabel,
  mrr,
  arr,
  proMrr,
  execMrr,
  proUsers,
  executiveUsers,
  monthlyGrowthRate,
  churnRate,
  churnedUsersCount,
  paidUsersCount,
  totalUsersCount,
  monthAiCostUsd,
  todayAiCostUsd,
  avgAiCostPerPaidSubscriberUsd,
  avgAiCostPerRegisteredUserUsd,
  costToRevenuePercent,
  grossMarginPercent,
  monthlyMrrSeries,
  churnCohortSeries,
  tierAiEconomics,
  subscriberAiCostList,
  onInspectUser
}) => {
  const [mrrViewMode, setMrrViewMode] = useState<'trend' | 'tier_split'>('trend');
  const [subscriberScope, setSubscriberScope] = useState<'paid' | 'all'>('paid');

  const scopedSubscribers = useMemo(() => {
    const base =
      subscriberScope === 'paid'
        ? subscriberAiCostList.filter((s) => s.isPaid)
        : subscriberAiCostList;
    return base.slice(0, 8);
  }, [subscriberAiCostList, subscriberScope]);

  const displayedTableRows = useMemo(() => {
    const base =
      subscriberScope === 'paid'
        ? subscriberAiCostList.filter((s) => s.isPaid)
        : subscriberAiCostList;
    return base.slice(0, 12);
  }, [subscriberAiCostList, subscriberScope]);

  const retentionRate = Math.max(0, Number((100 - churnRate).toFixed(1)));

  return (
    <div className="space-y-5">
      {/* ========================================================= */}
      {/* ROW A: MRR EVOLUTION + CHURN & RETENTION (RECHARTS) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* CHART 1: MRR (Monthly Recurring Revenue) & Receita vs Custo IA */}
        <div className="xl:col-span-7 bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                MRR (Monthly Recurring Revenue) &amp; Receita vs IA
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
                <span>
                  MRR Atual: <strong className="text-slate-900">{formatUsd(mrr)}/mês</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  ARR: <strong className="text-slate-800">{formatUsd(arr)}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span className={monthlyGrowthRate >= 0 ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                  {monthlyGrowthRate >= 0 ? '+' : ''}
                  {monthlyGrowthRate}% MoM
                </span>
                <span aria-hidden="true">·</span>
                <span>Janela: {periodLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-[11px] shrink-0">
              <button
                type="button"
                onClick={() => setMrrViewMode('trend')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                  mrrViewMode === 'trend'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Evolução MRR
              </button>
              <button
                type="button"
                onClick={() => setMrrViewMode('tier_split')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                  mrrViewMode === 'tier_split'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pro vs VIP
              </button>
            </div>
          </div>

          {/* Sub-summary row */}
          <div className="grid grid-cols-3 gap-3 text-xs border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] text-slate-500 block">MRR Profissional Pro</span>
              <span className="font-mono font-bold tabular-nums text-slate-900 text-sm">
                {formatUsd(proMrr)}{' '}
                <span className="text-[11px] font-normal text-slate-500">({proUsers} ativos)</span>
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">MRR Executivo VIP</span>
              <span className="font-mono font-bold tabular-nums text-slate-900 text-sm">
                {formatUsd(execMrr)}{' '}
                <span className="text-[11px] font-normal text-slate-500">({executiveUsers} ativos)</span>
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Margem Bruta pós-IA</span>
              <span className="font-mono font-bold tabular-nums text-emerald-700 text-sm">
                {grossMarginPercent}%{' '}
                <span className="text-[11px] font-normal text-slate-500">
                  ({costToRevenuePercent}% IA)
                </span>
              </span>
            </div>
          </div>

          {monthlyMrrSeries.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-500">
              Sem histórico financeiro registado para o período selecionado.
            </div>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {mrrViewMode === 'trend' ? (
                  <ComposedChart
                    data={monthlyMrrSeries}
                    margin={{ top: 10, right: 12, left: -8, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="mrrAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `$${v}`}
                    />
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={(val, key) =>
                            key === 'activePaid'
                              ? `${val} subscritores`
                              : formatUsd(val, key === 'aiCost' ? 3 : 2)
                          }
                        />
                      }
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      iconType="square"
                    />
                    <Bar
                      dataKey="revenue"
                      name="Receita Faturada (USD)"
                      fill="#0284c7"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                    <Area
                      type="monotone"
                      dataKey="mrr"
                      name="MRR Recorrente (USD)"
                      stroke="#0f172a"
                      strokeWidth={2.5}
                      fill="url(#mrrAreaGrad)"
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="aiCost"
                      name="Custo APIs IA (USD)"
                      stroke="#d97706"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#d97706' }}
                    />
                  </ComposedChart>
                ) : (
                  <BarChart
                    data={monthlyMrrSeries}
                    margin={{ top: 10, right: 12, left: -8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `$${v}`}
                    />
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={(val) => formatUsd(val, 2)}
                        />
                      }
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      iconType="square"
                    />
                    <Bar
                      dataKey="proMrr"
                      name="MRR Profissional Pro"
                      stackId="mrr"
                      fill="#f59e0b"
                      radius={[0, 0, 0, 0]}
                      maxBarSize={36}
                    />
                    <Bar
                      dataKey="execMrr"
                      name="MRR Executivo VIP"
                      stackId="mrr"
                      fill="#0f172a"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* CHART 2: Taxa de Churn & Retenção de Coortes */}
        <div className="xl:col-span-5 bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="border-b border-slate-100 pb-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Taxa de Churn &amp; Retenção de Subscritores
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
              <span>
                Churn Atual:{' '}
                <strong className={churnRate > 8 ? 'text-rose-700' : 'text-slate-900'}>
                  {churnRate}%
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Retenção: <strong className="text-emerald-700">{retentionRate}%</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Cancelados/Suspensos: <strong className="text-slate-800">{churnedUsersCount}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] text-slate-500 block">Assinantes Ativos</span>
              <span className="font-mono font-bold tabular-nums text-emerald-700 text-sm">
                {paidUsersCount}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Contas Totais</span>
              <span className="font-mono font-bold tabular-nums text-slate-900 text-sm">
                {totalUsersCount}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Churn / Saída</span>
              <span className="font-mono font-bold tabular-nums text-rose-700 text-sm">
                {churnedUsersCount} ({churnRate}%)
              </span>
            </div>
          </div>

          {churnCohortSeries.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-500 text-center px-4">
              Ainda não existem coortes de utilizadores registadas para calcular a curva de churn.
            </div>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={churnCohortSeries}
                  margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    content={
                      <ChartTooltip
                        valueFormatter={(val, key) =>
                          key === 'newUsers' ? `${val} contas` : `${val}%`
                        }
                      />
                    }
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    iconType="square"
                  />
                  <Bar
                    dataKey="retentionRate"
                    name="Retenção Ativa (%)"
                    fill="#16a34a"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={26}
                  />
                  <Bar
                    dataKey="churnRate"
                    name="Taxa de Churn (%)"
                    fill="#dc2626"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={26}
                  />
                  <Line
                    type="monotone"
                    dataKey="newUsers"
                    name="Novas Contas"
                    stroke="#0f172a"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* ROW B: CUSTO DE APIs DE IA POR SUBSCRITOR (RECHARTS + TABLE) */}
      {/* ========================================================= */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Custo de Utilização das APIs de IA por Subscritor (Gemini API)
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
              <span>
                Custo IA Mês: <strong className="text-slate-900">{formatUsd(monthAiCostUsd)}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Custo Hoje: <strong className="text-slate-800">{formatUsd(todayAiCostUsd)}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Média / Assinante Pago:{' '}
                <strong className="text-amber-700">
                  {formatUsd(avgAiCostPerPaidSubscriberUsd, 4)}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Média / Conta Registada:{' '}
                <strong className="text-slate-800">
                  {formatUsd(avgAiCostPerRegisteredUserUsd, 4)}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-[11px] shrink-0">
            <button
              type="button"
              onClick={() => setSubscriberScope('paid')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                subscriberScope === 'paid'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Subscritores Pagos
            </button>
            <button
              type="button"
              onClick={() => setSubscriberScope('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                subscriberScope === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos Utilizadores
            </button>
          </div>
        </div>

        {/* 2 Side-by-Side Recharts Visuals */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Chart: Tier Unit Economics (ARPU vs Avg AI Cost per Subscriber) */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800">
                Unit Economics por Plano (ARPU vs Custo Médio IA)
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">USD / subscritor</span>
            </div>

            {tierAiEconomics.every((t) => t.subscribers === 0) ? (
              <div className="h-[250px] flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-500">
                Sem subscritores registados para comparar planos.
              </div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tierAiEconomics}
                    margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="tierLabel"
                      tick={{ fontSize: 11, fill: '#475569' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `$${v}`}
                    />
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={(val, key) =>
                            key === 'subscribers'
                              ? `${val} contas`
                              : formatUsd(val, key === 'avgCostPerSubscriberUsd' ? 4 : 2)
                          }
                        />
                      }
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                      iconType="square"
                    />
                    <Bar
                      dataKey="arpuUsd"
                      name="Receita Média Mensal (ARPU)"
                      fill="#0f172a"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                    <Bar
                      dataKey="avgCostPerSubscriberUsd"
                      name="Custo Médio IA / Subscritor"
                      fill="#d97706"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Right Chart: Top Subscribers by AI API Cost */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800">
                Ranking de Custo API Gemini por Subscritor (Top 8)
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                {subscriberScope === 'paid' ? 'Planos Pro & VIP' : 'Base Completa'}
              </span>
            </div>

            {scopedSubscribers.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-500 text-center px-4">
                {subscriberScope === 'paid'
                  ? 'Nenhum subscritor pago com chamadas IA registadas ainda. Alterne para "Todos Utilizadores" para ver o consumo gratuito.'
                  : 'Nenhum utilizador com chamadas IA registadas até ao momento.'}
              </div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={scopedSubscribers}
                    layout="vertical"
                    margin={{ top: 4, right: 20, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                      tickFormatter={(v: number) => `$${v.toFixed(4)}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="shortName"
                      width={110}
                      tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={(val, key) =>
                            key === 'callsCount'
                              ? `${val} chamadas`
                              : formatUsd(val, 4)
                          }
                        />
                      }
                    />
                    <Bar
                      dataKey="aiCostUsd"
                      name="Custo Estimado API IA (USD)"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={20}
                    >
                      {scopedSubscribers.map((entry) => (
                        <Cell
                          key={entry.userId}
                          fill={
                            entry.plan === 'executive'
                              ? '#0f172a'
                              : entry.plan === 'pro'
                              ? '#d97706'
                              : '#64748b'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* High-Density Per-Subscriber Cost Ledger Table */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold text-slate-800">
              Detalhamento Financeiro de Consumo IA por Subscritor
            </h4>
            <span className="text-[11px] text-slate-500 font-mono tabular-nums">
              A mostrar {displayedTableRows.length} de{' '}
              {subscriberScope === 'paid'
                ? subscriberAiCostList.filter((s) => s.isPaid).length
                : subscriberAiCostList.length}{' '}
              contas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-2 pr-3">Subscritor</th>
                  <th className="py-2 px-3">Plano</th>
                  <th className="py-2 px-3 text-right">Chamadas IA</th>
                  <th className="py-2 px-3 text-right">Custo API IA</th>
                  <th className="py-2 px-3 text-right">Receita (ARPU)</th>
                  <th className="py-2 px-3 text-right">% Receita em IA</th>
                  <th className="py-2 pl-3 text-right">Margem Líquida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedTableRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-xs text-slate-400">
                      Sem registos de subscritores nesta visualização.
                    </td>
                  </tr>
                ) : (
                  displayedTableRows.map((row) => (
                    <tr
                      key={row.userId}
                      onClick={() => onInspectUser?.(row.userId)}
                      className={`h-10 transition-colors ${
                        onInspectUser ? 'cursor-pointer hover:bg-slate-50' : ''
                      }`}
                    >
                      <td className="py-2 pr-3">
                        <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                          {row.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                          {row.email}
                        </div>
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-700 whitespace-nowrap">
                        {row.planLabel}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-800">
                        {row.callsCount.toLocaleString('pt-PT')}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-amber-700">
                        {formatUsd(row.aiCostUsd, 4)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-800">
                        {formatUsd(row.monthlyArpuUsd, 2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums">
                        <span
                          className={
                            row.costShareOfArpuPct > 25
                              ? 'text-rose-700 font-bold'
                              : 'text-slate-600'
                          }
                        >
                          {row.monthlyArpuUsd > 0 ? `${row.costShareOfArpuPct}%` : '—'}
                        </span>
                      </td>
                      <td className="py-2 pl-3 text-right font-mono tabular-nums font-bold">
                        <span
                          className={
                            row.netContributionUsd >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }
                        >
                          {formatUsd(row.netContributionUsd, 2)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
