'use client';

import { useState } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { X, ZoomIn, ZoomOut } from "lucide-react";

// Fonction pour obtenir la couleur en fonction du score
function getScoreColor(score: number) {
  if (score >= 90) return { text: "text-green-400", bg: "bg-gradient-to-r from-green-500 to-green-400", stroke: "#22c55e" };
  if (score >= 75) return { text: "text-blue-400", bg: "bg-gradient-to-r from-blue-500 to-blue-400", stroke: "#3b82f6" };
  if (score >= 51) return { text: "text-yellow-400", bg: "bg-gradient-to-r from-yellow-500 to-yellow-400", stroke: "#eab308" };
  if (score >= 31) return { text: "text-orange-400", bg: "bg-gradient-to-r from-orange-500 to-orange-400", stroke: "#f97316" };
  return { text: "text-red-400", bg: "bg-gradient-to-r from-red-500 to-red-400", stroke: "#ef4444" };
}

interface HistoryEntry {
  date: string;
  score: number;
  exerciseNumber: number;
}

interface SubjectData {
  subject: string;
  progress: number;
  target: number;
  history: HistoryEntry[];
}

export function ProgressPage() {
  const [selectedSubject, setSelectedSubject] = useState<SubjectData | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // 8 catégories de mathématiques avec progression et historique
  // Génération d'historiques qui montrent toutes les couleurs (rouge, orange, jaune, bleu, vert)
  const data: SubjectData[] = [
    {
      subject: "Suites et limites",
      progress: 88,
      target: 75,
      history: [
        { date: "15/09/2024", score: 0, exerciseNumber: 0 },
        { date: "20/09/2024", score: 28, exerciseNumber: 1 },
        { date: "25/09/2024", score: 45, exerciseNumber: 2 },
        { date: "02/10/2024", score: 62, exerciseNumber: 3 },
        { date: "10/10/2024", score: 77, exerciseNumber: 4 },
        { date: "18/10/2024", score: 88, exerciseNumber: 5 },
      ],
    },
    {
      subject: "Limites et continuité",
      progress: 82,
      target: 75,
      history: [
        { date: "16/09/2024", score: 0, exerciseNumber: 0 },
        { date: "22/09/2024", score: 35, exerciseNumber: 1 },
        { date: "28/09/2024", score: 58, exerciseNumber: 2 },
        { date: "05/10/2024", score: 71, exerciseNumber: 3 },
        { date: "12/10/2024", score: 82, exerciseNumber: 4 },
      ],
    },
    {
      subject: "Dérivabilité",
      progress: 91,
      target: 75,
      history: [
        { date: "17/09/2024", score: 0, exerciseNumber: 0 },
        { date: "21/09/2024", score: 42, exerciseNumber: 1 },
        { date: "26/09/2024", score: 65, exerciseNumber: 2 },
        { date: "03/10/2024", score: 79, exerciseNumber: 3 },
        { date: "11/10/2024", score: 86, exerciseNumber: 4 },
        { date: "19/10/2024", score: 91, exerciseNumber: 5 },
      ],
    },
    {
      subject: "Logarithme néperien",
      progress: 48,
      target: 75,
      history: [
        { date: "18/09/2024", score: 0, exerciseNumber: 0 },
        { date: "24/09/2024", score: 22, exerciseNumber: 1 },
        { date: "01/10/2024", score: 38, exerciseNumber: 2 },
        { date: "08/10/2024", score: 48, exerciseNumber: 3 },
      ],
    },
    {
      subject: "Primitives et équadiff",
      progress: 67,
      target: 75,
      history: [
        { date: "19/09/2024", score: 0, exerciseNumber: 0 },
        { date: "23/09/2024", score: 25, exerciseNumber: 1 },
        { date: "29/09/2024", score: 44, exerciseNumber: 2 },
        { date: "06/10/2024", score: 59, exerciseNumber: 3 },
        { date: "14/10/2024", score: 67, exerciseNumber: 4 },
      ],
    },
    {
      subject: "Convexité",
      progress: 93,
      target: 75,
      history: [
        { date: "20/09/2024", score: 0, exerciseNumber: 0 },
        { date: "24/09/2024", score: 18, exerciseNumber: 1 },
        { date: "27/09/2024", score: 52, exerciseNumber: 2 },
        { date: "04/10/2024", score: 76, exerciseNumber: 3 },
        { date: "13/10/2024", score: 87, exerciseNumber: 4 },
        { date: "20/10/2024", score: 93, exerciseNumber: 5 },
      ],
    },
    {
      subject: "Stats",
      progress: 15,
      target: 75,
      history: [
        { date: "21/09/2024", score: 0, exerciseNumber: 0 },
        { date: "30/09/2024", score: 15, exerciseNumber: 1 },
      ],
    },
    {
      subject: "Probas",
      progress: 80,
      target: 75,
      history: [
        { date: "22/09/2024", score: 0, exerciseNumber: 0 },
        { date: "26/09/2024", score: 32, exerciseNumber: 1 },
        { date: "03/10/2024", score: 55, exerciseNumber: 2 },
        { date: "09/10/2024", score: 72, exerciseNumber: 3 },
        { date: "17/10/2024", score: 80, exerciseNumber: 4 },
      ],
    },
  ];

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.5));
  };

  // Custom tick pour rendre les labels cliquables
  const CustomAngleAxisTick = ({ payload, x, y, cx, cy }: any) => {
    const subject = data.find((d) => d.subject === payload.value);

    return (
      <g>
        <text
          x={x}
          y={y}
          dy={16}
          textAnchor={x > cx ? "start" : x < cx ? "end" : "middle"}
          className="cursor-pointer hover:opacity-80 transition-opacity text-white"
          onClick={() => subject && setSelectedSubject(subject)}
          style={{
            fontSize: "16px",
            fontFamily: "'Fredoka', sans-serif",
            fontWeight: 700,
            fill: "white",
          }}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  if (selectedSubject) {
    const color = getScoreColor(selectedSubject.progress);
    
    return (
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
        <div className="max-w-6xl w-full space-y-4">
          {/* Titre */}
          <div className="text-center">
            <h2
              className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              {selectedSubject.subject}
            </h2>
            <p
              className="text-blue-200 mt-2 drop-shadow-md"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
            >
              Évolution du score au fil du temps
            </p>
          </div>

          {/* Carte avec graphique linéaire */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
            {/* Boutons de contrôle */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setSelectedSubject(null)}
                className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-600/60 rounded-xl px-4 py-2 transition-all"
              >
                <X className="w-5 h-5 text-white" />
                <span
                  className="text-white"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                >
                  Retour
                </span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.5}
                  className="bg-slate-700/50 hover:bg-slate-600/60 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl p-2 transition-all"
                >
                  <ZoomOut className="w-5 h-5 text-white" />
                </button>
                <span
                  className="text-white"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                >
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 2}
                  className="bg-slate-700/50 hover:bg-slate-600/60 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl p-2 transition-all"
                >
                  <ZoomIn className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="bg-slate-900/40 rounded-2xl p-6 md:p-8 overflow-x-auto">
              <div style={{ width: `${100 * zoomLevel}%`, minWidth: "100%" }}>
                <ResponsiveContainer width="100%" height={450}>
                  <LineChart data={selectedSubject.history} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color.stroke} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={color.stroke} stopOpacity={0.3} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" strokeOpacity={0.5} />

                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      tick={{
                        fill: "#e0f2fe",
                        fontSize: 12,
                        fontFamily: "'Fredoka', sans-serif",
                      }}
                    />

                    <YAxis
                      domain={[0, 100]}
                      stroke="#94a3b8"
                      tick={{
                        fill: "#e0f2fe",
                        fontSize: 12,
                        fontFamily: "'Fredoka', sans-serif",
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "12px",
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 600,
                      }}
                      labelStyle={{ color: "#e0f2fe" }}
                    />

                    {/* Lignes de référence pour les paliers de couleur */}
                    <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <ReferenceLine y={50} stroke="#f97316" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <ReferenceLine y={74} stroke="#eab308" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <ReferenceLine y={75} stroke="#f59e0b" strokeWidth={2} strokeOpacity={0.8} label={{ value: "Objectif", fill: "#f59e0b", fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }} />
                    <ReferenceLine y={90} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.5} />

                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke={color.stroke}
                      strokeWidth={3}
                      fill="url(#lineGradient)"
                      dot={{
                        r: 6,
                        fill: color.stroke,
                        strokeWidth: 3,
                        stroke: "#fff",
                      }}
                      activeDot={{
                        r: 8,
                        fill: color.stroke,
                        strokeWidth: 4,
                        stroke: "#fff",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-slate-900/40 rounded-xl p-4 text-center">
                <p
                  className="text-blue-200 mb-1"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
                >
                  Score actuel
                </p>
                <p
                  className={color.text}
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1.5rem" }}
                >
                  {selectedSubject.progress}
                </p>
              </div>
              <div className="bg-slate-900/40 rounded-xl p-4 text-center">
                <p
                  className="text-blue-200 mb-1"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
                >
                  Exercices
                </p>
                <p
                  className="text-white"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1.5rem" }}
                >
                  {selectedSubject.history.length - 1}
                </p>
              </div>
              <div className="bg-slate-900/40 rounded-xl p-4 text-center">
                <p
                  className="text-blue-200 mb-1"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
                >
                  Progression
                </p>
                <p
                  className="text-white"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1.5rem" }}
                >
                  +{selectedSubject.progress}
                </p>
              </div>
              <div className="bg-slate-900/40 rounded-xl p-4 text-center">
                <p
                  className="text-blue-200 mb-1"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
                >
                  Objectif
                </p>
                <p
                  className={selectedSubject.progress >= 75 ? "text-green-400" : "text-orange-400"}
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1.5rem" }}
                >
                  {selectedSubject.progress >= 75 ? "✓" : "75"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
      <div className="max-w-6xl w-full space-y-8">
        {/* Titre avec style 3D */}
        <div className="text-center">
          <h2
            className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Ma progression
          </h2>
          <p
            className="text-blue-200 mt-2 drop-shadow-md"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
          >
            Suivi par matière - Objectif: 75/100 minimum - Cliquez sur un chapitre
          </p>
        </div>

        {/* Carte principale avec le graphique */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
          <div className="bg-slate-900/40 rounded-2xl p-2 md:p-4">
            {/* Graphique radar */}
            <ResponsiveContainer width="100%" height={500}>
              <RadarChart data={data} outerRadius="65%">
                <defs>
                  {data.map((item, index) => {
                    const color = getScoreColor(item.progress);
                    return (
                      <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color.stroke} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={color.stroke} stopOpacity={0.3} />
                      </linearGradient>
                    );
                  })}
                  <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.2} />
                  </linearGradient>
                </defs>

                <PolarGrid
                  stroke="#475569"
                  strokeWidth={1.5}
                  strokeOpacity={0.5}
                />

                <PolarAngleAxis
                  dataKey="subject"
                  tick={CustomAngleAxisTick}
                  tickLine={false}
                />

                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{
                    fill: "#94a3b8",
                    fontSize: 12,
                    fontFamily: "'Fredoka', sans-serif",
                  }}
                  tickCount={6}
                  stroke="#475569"
                  strokeOpacity={0.5}
                />

                {/* Octogone de référence (objectif 75) */}
                <Radar
                  name="Objectif minimum (75)"
                  dataKey="target"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fill="url(#targetGradient)"
                  fillOpacity={0.3}
                  dot={{
                    r: 5,
                    fill: "#f59e0b",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                />

                {/* Progression de l'utilisateur */}
                <Radar
                  name="Ma progression"
                  dataKey="progress"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#gradient-0)"
                  fillOpacity={0.5}
                  dot={(props: any) => {
                    const item = data.find((d) => d.subject === props.payload.subject);
                    const color = item ? getScoreColor(item.progress) : { stroke: "#3b82f6" };
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={6}
                        fill={color.stroke}
                        strokeWidth={3}
                        stroke="#fff"
                      />
                    );
                  }}
                />

                <Legend
                  wrapperStyle={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 600,
                    fontSize: "14px",
                    paddingTop: "20px",
                  }}
                  iconType="circle"
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Liste détaillée des progressions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {data.map((item, index) => {
              const color = getScoreColor(item.progress);
              return (
                <div
                  key={index}
                  onClick={() => setSelectedSubject(item)}
                  className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] cursor-pointer hover:bg-slate-800/60 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-blue-100"
                      style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {item.subject}
                    </span>
                    <span
                      className={color.text}
                      style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 700,
                        fontSize: "1.125rem",
                      }}
                    >
                      {item.progress}/100
                    </span>
                  </div>
                  <div className="relative h-3 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${color.bg}`}
                      style={{ width: `${item.progress}%` }}
                    />
                    {/* Marqueur de l'objectif */}
                    <div
                      className="absolute top-0 h-full w-0.5 bg-orange-400"
                      style={{ left: "75%" }}
                    >
                      <div className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-orange-400 border-2 border-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

