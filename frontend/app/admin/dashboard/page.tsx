"use client";

import { Layout } from "@/app/components/Layout";
import { useAuth } from "@/app/contexts/AuthContext";
import { supabase } from "@/app/lib/supabase";
import {
  Activity,
  BookOpen,
  Download,
  MessageSquare,
  RefreshCw,
  Swords,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DetailedCharts,
  type AttemptCorrPoint,
  type DauPoint,
  type EngagementPoint,
  type FbCategoryPoint,
  type SuccessRatePoint,
  type UserGrowthPoint,
} from "./DetailedCharts";

// ── Types ─────────────────────────────────────────────────────
interface KpiData {
  exercises: number;
  attempts: number;
  feedbacks: number;
  duels: number;
}
interface DailyAttempt {
  date: string;
  tentatives: number;
  reussies: number;
}
interface ChapterSlice {
  name: string;
  value: number;
  color: string;
}
interface WeeklyTrend {
  week: string;
  tentatives: number;
  duels: number;
  feedbacks: number;
}

// ── Constants ─────────────────────────────────────────────────
const CH_COLORS: Record<string, string> = {
  "Suites numériques": "#6366f1",
  "Limites et continuité": "#3b82f6",
  "Dérivation et Fonctions": "#22d3ee",
  "Logarithme néperien": "#10b981",
  "Primitives et équadiff": "#f59e0b",
  Convexité: "#f97316",
  Stats: "#ec4899",
  Probas: "#8b5cf6",
  Autre: "#64748b",
};
const FB_COLORS = [
  "#6366f1",
  "#3b82f6",
  "#22d3ee",
  "#10b981",
  "#f59e0b",
  "#f97316",
  "#ec4899",
  "#8b5cf6",
  "#64748b",
];
const F = { fontFamily: "'Fredoka', sans-serif" };
const AX = {
  fill: "#94a3b8",
  fontSize: 11,
  fontFamily: "'Fredoka', sans-serif",
};

function dd(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function ww(d: Date) {
  return `${d.getDate()} ${d.toLocaleString("fr-FR", { month: "short" })}`;
}

type TimeRange = "7d" | "14d" | "30d" | "60d" | "all";
const RANGES: { id: TimeRange; label: string; days: number }[] = [
  { id: "7d", label: "Semaine", days: 7 },
  { id: "14d", label: "14 jours", days: 14 },
  { id: "30d", label: "Mois", days: 30 },
  { id: "60d", label: "2 mois", days: 60 },
  { id: "all", label: "Toujours", days: 180 },
];

// ── Micro-components ──────────────────────────────────────────
function SkCard() {
  return (
    <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50 animate-pulse h-36" />
  );
}
function SkChart({ h = 260 }: { h?: number }) {
  return (
    <div
      className="bg-slate-800/60 rounded-2xl border border-slate-700/50 animate-pulse"
      style={{ height: h }}
    />
  );
}
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
function KpiCard({
  label,
  value,
  icon,
  grad,
  border,
  sub,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  grad: string;
  border: string;
  sub?: string;
}) {
  return (
    <div
      className={`relative bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border ${border} overflow-hidden hover:scale-[1.02] transition-transform`}
    >
      <div
        className={`absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-2xl ${grad}`}
      />
      <div className="relative z-10">
        <div
          className={`inline-flex p-3 rounded-xl ${grad} bg-opacity-20 mb-4`}
        >
          {icon}
        </div>
        <p
          className="text-4xl font-bold text-white"
          style={{ ...F, fontWeight: 700 }}
        >
          {value.toLocaleString("fr-FR")}
        </p>
        <p className="text-sm text-slate-400 mt-1" style={F}>
          {label}
        </p>
        {sub && (
          <p className="text-xs text-slate-500 mt-0.5" style={F}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState<KpiData>({
    exercises: 0,
    attempts: 0,
    feedbacks: 0,
    duels: 0,
  });
  const [daily, setDaily] = useState<DailyAttempt[]>([]);
  const [pie, setPie] = useState<ChapterSlice[]>([]);
  const [weekly, setWeekly] = useState<WeeklyTrend[]>([]);
  // detailed
  const [fbCat, setFbCat] = useState<FbCategoryPoint[]>([]);
  const [successRate, setSuccessRate] = useState<SuccessRatePoint[]>([]);
  const [attemptCorr, setAttemptCorr] = useState<AttemptCorrPoint[]>([]);
  // investor metrics
  const [dau, setDau] = useState<DauPoint[]>([]);
  const [dauNoAdmin, setDauNoAdmin] = useState<DauPoint[]>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowthPoint[]>([]);
  const [engagement, setEngagement] = useState<EngagementPoint[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [retentionPct, setRetentionPct] = useState(0);
  const [avgAttemptsPerUser, setAvgAttemptsPerUser] = useState(0);
  const [range, setRange] = useState<TimeRange>("30d");

  const fetchAll = useCallback(
    async (r: TimeRange = range) => {
      setLoading(true);
      try {
        const rangeItem = RANGES.find((x) => x.id === r)!;
        let days = rangeItem.days;
        let since = new Date();
        if (r === "all") {
          since = new Date(2026, 0, 31);
          days = Math.max(
            1,
            Math.ceil(
              (new Date().getTime() - since.getTime()) / (1000 * 3600 * 24),
            ) + 1,
          );
        } else {
          since.setDate(since.getDate() - (days - 1));
        }
        since.setHours(0, 0, 0, 0);
        const sinceIso = since.toISOString();
        const useDay = days <= 30;
        const monOf = (s: string) => {
          const d = new Date(s);
          const dw = d.getDay() === 0 ? 6 : d.getDay() - 1;
          d.setDate(d.getDate() - dw);
          d.setHours(0, 0, 0, 0);
          return d.toISOString().slice(0, 10);
        };
        const nW = Math.ceil(days / 7) + 1;
        const mkDay = <T,>(f: () => T) => {
          const m = new Map<string, T>();
          for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            m.set(d.toISOString().slice(0, 10), f());
          }
          return m;
        };
        const mkWeek = <T,>(f: () => T) => {
          const m = new Map<string, T>();
          for (let i = nW - 1; i >= 0; i--) {
            const d = new Date();
            const dw = d.getDay() === 0 ? 6 : d.getDay() - 1;
            d.setDate(d.getDate() - dw - i * 7);
            d.setHours(0, 0, 0, 0);
            m.set(d.toISOString().slice(0, 10), f());
          }
          return m;
        };
        const mkB = <T,>(f: () => T) => (useDay ? mkDay(f) : mkWeek(f));
        const gKey = (s: string, m: Map<string, any>) => {
          const k = useDay ? s.slice(0, 10) : monOf(s);
          return m.has(k) ? k : null;
        };
        const lbl = (iso: string) =>
          useDay ? dd(new Date(iso)) : ww(new Date(iso));
        const mkey = (s: string, m: Map<string, any>) => {
          const k = monOf(s);
          return m.has(k) ? k : null;
        };
        // KPIs (all-time)
        const [exR, attR, fbR, dR] = await Promise.all([
          supabase
            .from("exercises")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("exercise_attempts")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("feedbacks")
            .select("id", { count: "exact", head: true }),
          supabase.from("duels").select("id", { count: "exact", head: true }),
        ]);
        setKpi({
          exercises: exR.count ?? 0,
          attempts: attR.count ?? 0,
          feedbacks: fbR.count ?? 0,
          duels: dR.count ?? 0,
        });
        // attempts
        const { data: attRaw } = await supabase
          .from("exercise_attempts")
          .select("attempted_at,is_correct,user_id,exercise_id")
          .gte("attempted_at", sinceIso)
          .order("attempted_at", { ascending: true });
        const dMap = mkB(() => ({ t: 0, c: 0 }));
        (attRaw ?? []).forEach((a) => {
          const k = gKey(a.attempted_at, dMap);
          if (k) {
            const v = dMap.get(k)!;
            v.t++;
            if (a.is_correct) v.c++;
          }
        });
        setDaily(
          Array.from(dMap.entries()).map(([iso, v]) => ({
            date: lbl(iso),
            tentatives: v.t,
            reussies: v.c,
          })),
        );
        const cMap = mkB(() => ({ ok: 0, ko: 0 }));
        (attRaw ?? []).forEach((a) => {
          const k = gKey(a.attempted_at, cMap);
          if (k) {
            const v = cMap.get(k)!;
            if (a.is_correct) v.ok++;
            else v.ko++;
          }
        });
        setAttemptCorr(
          Array.from(cMap.entries()).map(([iso, v]) => ({
            date: lbl(iso),
            correctes: v.ok,
            incorrectes: v.ko,
          })),
        );
        // exercises pie (all-time)
        const { data: exRaw } = await supabase
          .from("exercises")
          .select("chapter");
        const chMap = new Map<string, number>();
        (exRaw ?? []).forEach((e) => {
          const c = e.chapter ?? "Autre";
          chMap.set(c, (chMap.get(c) ?? 0) + 1);
        });
        setPie(
          Array.from(chMap.entries()).map(([n, v], i) => ({
            name: n,
            value: v,
            color: CH_COLORS[n] ?? FB_COLORS[i % FB_COLORS.length],
          })),
        );
        // weekly trends chart
        const [waR, wdR, wfR] = await Promise.all([
          supabase
            .from("exercise_attempts")
            .select("attempted_at")
            .gte("attempted_at", sinceIso),
          supabase
            .from("duels")
            .select("created_at")
            .gte("created_at", sinceIso),
          supabase
            .from("feedbacks")
            .select("created_at")
            .gte("created_at", sinceIso),
        ]);
        const tMap = mkWeek(() => ({ tentatives: 0, duels: 0, feedbacks: 0 }));
        (waR.data ?? []).forEach((r) => {
          const k = mkey(r.attempted_at, tMap);
          if (k) tMap.get(k)!.tentatives++;
        });
        (wdR.data ?? []).forEach((r) => {
          const k = mkey(r.created_at, tMap);
          if (k) tMap.get(k)!.duels++;
        });
        (wfR.data ?? []).forEach((r) => {
          const k = mkey(r.created_at, tMap);
          if (k) tMap.get(k)!.feedbacks++;
        });
        setWeekly(
          Array.from(tMap.entries()).map(([iso, v]) => ({
            week: ww(new Date(iso)),
            ...v,
          })),
        );
        // feedback by category
        const { data: fbRaw } = await supabase
          .from("feedbacks")
          .select("created_at,category")
          .gte("created_at", sinceIso);
        const fbMap = mkB(() => ({
          bug: 0,
          suggestion: 0,
          content_error: 0,
          other: 0,
        }));
        (fbRaw ?? []).forEach((f) => {
          const k = gKey(f.created_at, fbMap);
          if (!k) return;
          const v = fbMap.get(k)!;
          if (f.category === "bug") v.bug++;
          else if (f.category === "suggestion" || f.category === "feature")
            v.suggestion++;
          else if (f.category === "content_error" || f.category === "content")
            v.content_error++;
          else v.other++;
        });
        setFbCat(
          Array.from(fbMap.entries()).map(([iso, v]) => ({
            date: lbl(iso),
            ...v,
          })),
        );
        // success rate + investor metrics
        const { data: allAtt } = await supabase
          .from("exercise_attempts")
          .select("exercise_id,is_correct,user_id,attempted_at")
          .gte("attempted_at", sinceIso);
        if (allAtt && allAtt.length > 0) {
          const exIds = [
            ...new Set(allAtt.map((a) => a.exercise_id).filter(Boolean)),
          ];
          const { data: exCh } = await supabase
            .from("exercises")
            .select("id,chapter")
            .in("id", exIds as number[]);
          const exChMap = new Map<number, string>(
            (exCh ?? []).map((e) => [e.id, e.chapter ?? "Autre"]),
          );
          const byChap = new Map<string, { ok: number; total: number }>();
          allAtt.forEach((a) => {
            const ch = exChMap.get(a.exercise_id) ?? "Autre";
            if (!byChap.has(ch)) byChap.set(ch, { ok: 0, total: 0 });
            const v = byChap.get(ch)!;
            v.total++;
            if (a.is_correct) v.ok++;
          });
          setSuccessRate(
            Array.from(byChap.entries())
              .map(([ch, v]) => ({
                chapter: ch.length > 14 ? ch.slice(0, 14) + "…" : ch,
                taux: v.total > 0 ? Math.round((v.ok / v.total) * 100) : 0,
                total: v.total,
              }))
              .sort((a, b) => b.taux - a.taux),
          );
          const dauMap = mkB(() => new Set<string>());
          allAtt.forEach((a) => {
            const k = gKey(a.attempted_at, dauMap);
            if (k && a.user_id) dauMap.get(k)!.add(a.user_id);
          });
          setDau(
            Array.from(dauMap.entries()).map(([iso, s]) => ({
              date: lbl(iso),
              dau: s.size,
            })),
          );
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id,created_at,role");
          const adminIds = new Set(
            (profiles ?? []).filter((p) => p.role === "admin").map((p) => p.id),
          );
          const dauNoAdminMap = mkB(() => new Set<string>());
          allAtt.forEach((a) => {
            const k = gKey(a.attempted_at, dauNoAdminMap);
            if (k && a.user_id && !adminIds.has(a.user_id))
              dauNoAdminMap.get(k)!.add(a.user_id);
          });
          setDauNoAdmin(
            Array.from(dauNoAdminMap.entries()).map(([iso, s]) => ({
              date: lbl(iso),
              dau: s.size,
            })),
          );
          const totalU = profiles?.length ?? 0;
          setTotalUsers(totalU);
          setAvgAttemptsPerUser(
            totalU > 0 ? Math.round(allAtt.length / totalU) : 0,
          );
          const s7 = new Date();
          s7.setDate(s7.getDate() - 6);
          s7.setHours(0, 0, 0, 0);
          const act30 = new Set(
            allAtt.filter((a) => a.user_id).map((a) => a.user_id),
          );
          const act7 = new Set(
            allAtt
              .filter((a) => a.attempted_at >= s7.toISOString() && a.user_id)
              .map((a) => a.user_id),
          );
          setRetentionPct(
            act30.size > 0 ? Math.round((act7.size / act30.size) * 100) : 0,
          );
          const gMap = mkWeek(() => ({ nouveaux: 0, cumul: 0 }));
          const eMap = mkWeek(() => ({
            attTotal: 0,
            okTotal: 0,
            users: new Set<string>(),
          }));
          (profiles ?? []).forEach((p) => {
            const k = mkey(p.created_at, gMap);
            if (k) gMap.get(k)!.nouveaux++;
          });
          let cum = (profiles ?? []).filter(
            (p) =>
              p.created_at < ([...gMap.keys()].sort()[0] ?? "") + "T00:00:00Z",
          ).length;
          [...gMap.keys()].sort().forEach((k) => {
            cum += gMap.get(k)!.nouveaux;
            gMap.get(k)!.cumul = cum;
          });
          setUserGrowth(
            [...gMap.keys()]
              .sort()
              .map((k) => ({ week: ww(new Date(k)), ...gMap.get(k)! })),
          );
          allAtt.forEach((a) => {
            const k = mkey(a.attempted_at, eMap);
            if (!k) return;
            const v = eMap.get(k)!;
            v.attTotal++;
            if (a.is_correct) v.okTotal++;
            if (a.user_id) v.users.add(a.user_id);
          });
          setEngagement(
            [...eMap.keys()].sort().map((k) => {
              const v = eMap.get(k)!;
              return {
                week: ww(new Date(k)),
                moyAttempts:
                  v.users.size > 0 ? Math.round(v.attTotal / v.users.size) : 0,
                tauxReussite:
                  v.attTotal > 0
                    ? Math.round((v.okTotal / v.attTotal) * 100)
                    : 0,
              };
            }),
          );
        }
      } catch (e) {
        console.error("[Dashboard]", e);
      } finally {
        setLoading(false);
      }
    },
    [range],
  );

  useEffect(() => {
    if (!authLoading && user) fetchAll(range);
  }, [authLoading, user, range, fetchAll]);

  // PDF export
  const exportPdf = async () => {
    if (!printRef.current) return;
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      // Fix gradient text issue in html2canvas and hide buttons
      const titleEl = document.getElementById("dashboard-admin-title");
      const buttonsEl = document.getElementById("dashboard-admin-buttons");
      const gradClasses = [
        "bg-gradient-to-r",
        "from-white",
        "via-blue-200",
        "to-indigo-300",
        "bg-clip-text",
        "text-transparent",
      ];

      if (titleEl) {
        titleEl.classList.remove(...gradClasses);
        titleEl.classList.add("text-indigo-300");
      }
      if (buttonsEl) buttonsEl.style.display = "none";

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        backgroundColor: "#020817",
        useCORS: true,
        windowWidth: 1440,
      });

      if (titleEl) {
        titleEl.classList.add(...gradClasses);
        titleEl.classList.remove("text-indigo-300");
      }
      if (buttonsEl) buttonsEl.style.display = "flex";

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(
        `novlearn-dashboard-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } catch (e) {
      console.error("PDF export failed", e);
    } finally {
      setExporting(false);
    }
  };

  if (authLoading)
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="flex-1 pb-12 overflow-y-auto">
        <div
          ref={printRef}
          className="max-w-7xl mx-auto px-6 md:px-10 pt-8 pb-8 space-y-8 bg-[#020817]"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1
                  id="dashboard-admin-title"
                  className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-indigo-300 bg-clip-text text-transparent"
                  style={{ ...F, fontWeight: 700 }}
                >
                  Dashboard Admin
                </h1>
                <p className="text-slate-400 mt-1 text-sm" style={F}>
                  Suivi en temps réel des indicateurs Novlearn
                </p>
              </div>
              <div id="dashboard-admin-buttons" className="flex gap-3">
                <button
                  onClick={() => fetchAll(range)}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-700/80 hover:bg-slate-600/80 disabled:opacity-50 rounded-xl border border-slate-600/50 transition-all text-white text-sm"
                  style={F}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />{" "}
                  Actualiser
                </button>
                <button
                  onClick={exportPdf}
                  disabled={exporting || loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600/80 hover:bg-indigo-500/80 disabled:opacity-50 rounded-xl border border-indigo-500/50 transition-all text-white text-sm shadow-lg shadow-indigo-900/30"
                  style={F}
                >
                  <Download
                    className={`w-4 h-4 ${exporting ? "animate-bounce" : ""}`}
                  />
                  {exporting ? "Export..." : "Exporter PDF"}
                </button>
              </div>
            </div>
            {/* Range selector */}
            <div className="flex gap-1 bg-slate-800/80 rounded-xl p-1 border border-slate-700/50 w-fit">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRange(r.id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${range === r.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40" : "text-slate-400 hover:text-white hover:bg-slate-700/50"}`}
                  style={F}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {loading ? (
              <>
                <SkCard />
                <SkCard />
                <SkCard />
                <SkCard />
              </>
            ) : (
              <>
                <KpiCard
                  label="Exercices créés"
                  value={kpi.exercises}
                  icon={<BookOpen className="w-5 h-5 text-indigo-300" />}
                  grad="bg-indigo-500"
                  border="border-indigo-500/30"
                  sub="Total dans la base"
                />
                <KpiCard
                  label="Tentatives totales"
                  value={kpi.attempts}
                  icon={<Zap className="w-5 h-5 text-cyan-300" />}
                  grad="bg-cyan-500"
                  border="border-cyan-500/30"
                  sub="Toutes sessions"
                />
                <KpiCard
                  label="Feedbacks reçus"
                  value={kpi.feedbacks}
                  icon={<MessageSquare className="w-5 h-5 text-emerald-300" />}
                  grad="bg-emerald-500"
                  border="border-emerald-500/30"
                  sub="Retours utilisateurs"
                />
                <KpiCard
                  label="Duels lancés"
                  value={kpi.duels}
                  icon={<Swords className="w-5 h-5 text-pink-300" />}
                  grad="bg-pink-500"
                  border="border-pink-500/30"
                  sub="Défis entre joueurs"
                />
              </>
            )}
          </div>

          {/* Row 1 : bar + pie */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-2 mb-5">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h2
                  className="text-lg font-bold text-white"
                  style={{ ...F, fontWeight: 700 }}
                >
                  Tentatives –{" "}
                  {RANGES.find((r) => r.id === range)?.label ?? range}
                </h2>
              </div>
              {loading ? (
                <SkChart />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={daily} barGap={2}>
                    <defs>
                      <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#22d3ee"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#0e7490"
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                      <linearGradient id="gO" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#34d399"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#065f46"
                          stopOpacity={0.6}
                        />
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
                      interval={Math.max(
                        0,
                        Math.floor(
                          (RANGES.find((r) => r.id === range)?.days ?? 30) / 8,
                        ) - 1,
                      )}
                    />
                    <YAxis
                      tick={AX}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={<CT />}
                      cursor={{ fill: "rgba(148,163,184,0.08)" }}
                    />
                    <Legend
                      wrapperStyle={{ ...F, fontSize: 13, paddingTop: 12 }}
                      iconType="circle"
                    />
                    <Bar
                      dataKey="tentatives"
                      name="Tentatives"
                      fill="url(#gT)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="reussies"
                      name="Réussies"
                      fill="url(#gO)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-2 mb-5">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h2
                  className="text-lg font-bold text-white"
                  style={{ ...F, fontWeight: 700 }}
                >
                  Exercices par chapitre
                </h2>
              </div>
              {loading ? (
                <SkChart />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pie}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pie.map((e, i) => (
                        <Cell key={i} fill={e.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0];
                        return (
                          <div className="bg-slate-900/95 border border-slate-700 rounded-xl px-3 py-2 text-sm shadow-xl">
                            <p className="font-bold text-white" style={F}>
                              {d.name}
                            </p>
                            <p className="text-slate-300" style={F}>
                              {d.value} exercices
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ ...F, fontSize: 11, paddingTop: 8 }}
                      iconType="circle"
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Row 2 : weekly multi-line */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <h2
                className="text-lg font-bold text-white"
                style={{ ...F, fontWeight: 700 }}
              >
                Tendances – {RANGES.find((r) => r.id === range)?.label ?? range}
              </h2>
            </div>
            {loading ? (
              <SkChart h={300} />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weekly}>
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
                    tick={AX}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<CT />}
                    cursor={{
                      stroke: "#475569",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ ...F, fontSize: 13, paddingTop: 16 }}
                    iconType="circle"
                  />
                  <Line
                    type="monotone"
                    dataKey="tentatives"
                    name="Tentatives"
                    stroke="#22d3ee"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#22d3ee",
                      strokeWidth: 2,
                      stroke: "#0f172a",
                    }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="duels"
                    name="Duels"
                    stroke="#f472b6"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#f472b6",
                      strokeWidth: 2,
                      stroke: "#0f172a",
                    }}
                    activeDot={{ r: 6 }}
                    strokeDasharray="6 3"
                  />
                  <Line
                    type="monotone"
                    dataKey="feedbacks"
                    name="Feedbacks"
                    stroke="#34d399"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#34d399",
                      strokeWidth: 2,
                      stroke: "#0f172a",
                    }}
                    activeDot={{ r: 6 }}
                    strokeDasharray="2 4"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Detailed section */}
          {!loading && (
            <DetailedCharts
              fbCategory={fbCat}
              successRate={successRate}
              attemptCorr={attemptCorr}
              dau={dau}
              dauNoAdmin={dauNoAdmin}
              userGrowth={userGrowth}
              engagement={engagement}
              totalUsers={totalUsers}
              retentionPct={retentionPct}
              avgAttemptsPerUser={avgAttemptsPerUser}
            />
          )}

          <p className="text-center text-slate-600 text-xs pb-4" style={F}>
            Données en direct depuis Supabase · Réservé aux administrateurs
          </p>
        </div>
      </div>
    </Layout>
  );
}
