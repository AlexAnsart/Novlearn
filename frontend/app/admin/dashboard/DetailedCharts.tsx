"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const F = { fontFamily: "'Fredoka', sans-serif" };
const AX = {
  fill: "#94a3b8",
  fontSize: 11,
  fontFamily: "'Fredoka', sans-serif",
};

function CT({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-xl px-4 py-3 shadow-xl text-sm">
      <p className="text-slate-400 mb-1" style={F}>
        {label}
      </p>
      {payload.map((p: any) => (
        <p
          key={p.dataKey}
          className="font-bold"
          style={{ color: p.color, ...F }}
        >
          {p.name} : {p.value}
        </p>
      ))}
    </div>
  );
}

/* ── types ─────────────────────────────────────────────────── */
export interface FbCategoryPoint {
  date: string;
  bug: number;
  suggestion: number;
  content_error: number;
  other: number;
}
export interface SuccessRatePoint {
  chapter: string;
  taux: number;
  total: number;
}
export interface AttemptCorrPoint {
  date: string;
  correctes: number;
  incorrectes: number;
}
export interface DauPoint {
  date: string;
  dau: number;
}
export interface UserGrowthPoint {
  week: string;
  nouveaux: number;
  cumul: number;
}
export interface EngagementPoint {
  week: string;
  moyAttempts: number;
  tauxReussite: number;
}

interface Props {
  fbCategory: FbCategoryPoint[];
  successRate: SuccessRatePoint[];
  attemptCorr: AttemptCorrPoint[];
  dau: DauPoint[];
  dauNoAdmin: DauPoint[];
  userGrowth: UserGrowthPoint[];
  engagement: EngagementPoint[];
  totalUsers: number;
  retentionPct: number; // % users active in last 7d vs last 30d
  avgAttemptsPerUser: number;
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 ${className}`}
    >
      {children}
    </div>
  );
}
function Title({
  icon,
  title,
  sub,
}: {
  icon: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h2
          className="text-lg font-bold text-white"
          style={{ ...F, fontWeight: 700 }}
        >
          {title}
        </h2>
      </div>
      {sub && (
        <p className="text-slate-500 text-xs mt-0.5 ml-8" style={F}>
          {sub}
        </p>
      )}
    </div>
  );
}

function StatBadge({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1 bg-slate-900/50 rounded-xl px-5 py-4 border border-slate-700/50 min-w-[140px]">
      <p className="text-xs text-slate-400 uppercase tracking-wide" style={F}>
        {label}
      </p>
      <p
        className="text-3xl font-bold"
        style={{ color, ...F, fontWeight: 700 }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs text-slate-500" style={F}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function DetailedCharts({
  fbCategory,
  successRate,
  attemptCorr,
  dau,
  dauNoAdmin,
  userGrowth,
  engagement,
  totalUsers,
  retentionPct,
  avgAttemptsPerUser,
}: Props) {
  const dauNoAdminMap = new Map(dauNoAdmin.map((d) => [d.date, d.dau]));
  const dauData = dau.map((d) => ({
    ...d,
    dauNoAdmin: dauNoAdminMap.get(d.date) ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* ── Row 1 : DAU + KPI badges ──────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <Title
            icon="👥"
            title="Utilisateurs actifs par jour (DAU)"
            sub="Nombre de joueurs distincts ayant fait ≥1 tentative"
          />
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={dauData}>
              <defs>
                <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dauNoAdminGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                strokeOpacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={AX}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={AX}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CT />} />
              <Legend
                wrapperStyle={{ ...F, fontSize: 12, paddingTop: 10 }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="dau"
                name="DAU"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#dauGrad)"
                dot={false}
                activeDot={{ r: 5 }}
              />
              <Area
                type="monotone"
                dataKey="dauNoAdmin"
                name="DAU (hors admins)"
                stroke="#22d3ee"
                strokeWidth={2.5}
                fill="url(#dauNoAdminGrad)"
                dot={false}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Retention KPI panel */}
        <Card>
          <Title
            icon="📌"
            title="Indicateurs clés"
            sub="Santé de la plateforme"
          />
          <div className="flex flex-col gap-3 mt-2">
            <StatBadge
              label="Utilisateurs inscrits"
              value={totalUsers.toLocaleString("fr-FR")}
              color="#a5b4fc"
              sub="Total des comptes créés"
            />
            <StatBadge
              label="Rétention 7j / 30j"
              value={`${retentionPct}%`}
              color={
                retentionPct >= 40
                  ? "#34d399"
                  : retentionPct >= 20
                    ? "#f59e0b"
                    : "#f87171"
              }
              sub="Actifs cette semaine / ce mois"
            />
            <StatBadge
              label="Moy. tentatives / user"
              value={avgAttemptsPerUser.toLocaleString("fr-FR")}
              color="#22d3ee"
              sub="Engagement moyen par inscrit"
            />
          </div>
        </Card>
      </div>

      {/* ── Row 2 : User growth + Engagement ──────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* User growth – bars + cumul line */}
        <Card>
          <Title
            icon="📈"
            title="Croissance des inscrits"
            sub="Nouveaux comptes par semaine"
          />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={userGrowth}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                strokeOpacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tick={AX}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="l"
                tick={AX}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="r"
                orientation="right"
                tick={AX}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<CT />}
                cursor={{ fill: "rgba(148,163,184,0.07)" }}
              />
              <Legend
                wrapperStyle={{ ...F, fontSize: 12, paddingTop: 10 }}
                iconType="circle"
              />
              <Bar
                yAxisId="l"
                dataKey="nouveaux"
                name="Nouveaux"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                opacity={0.85}
              />
              <Line
                yAxisId="r"
                type="monotone"
                dataKey="cumul"
                name="Cumul"
                stroke="#22d3ee"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#22d3ee" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Engagement – avg attempts + success rate dual axis */}
        <Card>
          <Title
            icon="⚡"
            title="Engagement & Qualité"
            sub="Moy. tentatives et taux de réussite par semaine"
          />
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={engagement}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                strokeOpacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tick={AX}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="l"
                tick={AX}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="r"
                orientation="right"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={AX}
                tickLine={false}
                axisLine={false}
              />
              <ReferenceLine
                yAxisId="r"
                y={50}
                stroke="#475569"
                strokeDasharray="4 4"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-slate-900/95 border border-slate-700 rounded-xl px-4 py-3 shadow-xl text-sm">
                      <p className="text-slate-400 mb-1" style={F}>
                        {label}
                      </p>
                      {payload.map((p: any) => (
                        <p
                          key={p.dataKey}
                          className="font-bold"
                          style={{ color: p.color, ...F }}
                        >
                          {p.name} : {p.value}
                          {p.dataKey === "tauxReussite" ? "%" : ""}
                        </p>
                      ))}
                    </div>
                  );
                }}
                cursor={{ stroke: "#475569", strokeDasharray: "4 4" }}
              />
              <Legend
                wrapperStyle={{ ...F, fontSize: 12, paddingTop: 10 }}
                iconType="circle"
              />
              <Line
                yAxisId="l"
                type="monotone"
                dataKey="moyAttempts"
                name="Moy. tentatives"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{
                  r: 3,
                  fill: "#f59e0b",
                  strokeWidth: 2,
                  stroke: "#0f172a",
                }}
                activeDot={{ r: 5 }}
              />
              <Line
                yAxisId="r"
                type="monotone"
                dataKey="tauxReussite"
                name="Taux de réussite"
                stroke="#34d399"
                strokeWidth={2.5}
                dot={{
                  r: 3,
                  fill: "#34d399",
                  strokeWidth: 2,
                  stroke: "#0f172a",
                }}
                activeDot={{ r: 5 }}
                strokeDasharray="6 3"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Row 3 : feedback category + success rate ──────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <Title
            icon="💬"
            title="Feedbacks par catégorie – 30 jours"
            sub="Détail des retours utilisateurs"
          />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={fbCategory} barSize={10}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                strokeOpacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={AX}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={AX}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<CT />}
                cursor={{ fill: "rgba(148,163,184,0.07)" }}
              />
              <Legend
                wrapperStyle={{ ...F, fontSize: 12, paddingTop: 10 }}
                iconType="circle"
              />
              <Bar dataKey="bug" name="Bug" stackId="a" fill="#ef4444" />
              <Bar
                dataKey="suggestion"
                name="Suggestion"
                stackId="a"
                fill="#6366f1"
              />
              <Bar
                dataKey="content_error"
                name="Contenu"
                stackId="a"
                fill="#a855f7"
              />
              <Bar
                dataKey="other"
                name="Autre"
                stackId="a"
                fill="#64748b"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <Title
            icon="🎯"
            title="Taux de réussite par chapitre"
            sub="Indicateur de qualité pédagogique"
          />
          {successRate.length === 0 ? (
            <div
              className="flex items-center justify-center h-48 text-slate-500 text-sm"
              style={F}
            >
              Aucune donnée
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={successRate} layout="vertical" barSize={14}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  strokeOpacity={0.4}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={AX}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  dataKey="chapter"
                  type="category"
                  tick={{ ...AX, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const sr = successRate.find((s) => s.chapter === label);
                    return (
                      <div className="bg-slate-900/95 border border-slate-700 rounded-xl px-4 py-3 text-sm shadow-xl">
                        <p className="text-white font-bold" style={F}>
                          {label}
                        </p>
                        <p className="text-emerald-400" style={F}>
                          {payload[0].value}% réussite
                        </p>
                        {sr && (
                          <p className="text-slate-400" style={F}>
                            {sr.total} tentatives
                          </p>
                        )}
                      </div>
                    );
                  }}
                  cursor={{ fill: "rgba(148,163,184,0.07)" }}
                />
                <Bar dataKey="taux" name="Taux (%)" radius={[0, 4, 4, 0]}>
                  {successRate.map((s, i) => (
                    <Cell
                      key={i}
                      fill={
                        s.taux >= 70
                          ? "#34d399"
                          : s.taux >= 40
                            ? "#f59e0b"
                            : "#f87171"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ── Row 4 : correctes vs incorrectes ─────────────────── */}
      <Card>
        <Title
          icon="✅"
          title="Correctes vs Incorrectes – 14 jours"
          sub="Qualité des réponses au fil du temps"
        />
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={attemptCorr}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              strokeOpacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={AX}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis
              tick={AX}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={<CT />}
              cursor={{ stroke: "#475569", strokeDasharray: "4 4" }}
            />
            <Legend
              wrapperStyle={{ ...F, fontSize: 12, paddingTop: 12 }}
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="correctes"
              name="Correctes"
              stroke="#34d399"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="incorrectes"
              name="Incorrectes"
              stroke="#f87171"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
              strokeDasharray="5 3"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
