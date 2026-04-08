"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { Layout } from "@/app/components/Layout";
import ExerciseRenderer from "@/app/components/Exercise/ExerciseRenderer";
import { generateVariables } from "@/app/utils/variableGenerator";
import { Exercise, VariableValues } from "@/app/types/exercise";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ClaudeExercise {
  id: number;
  title: string | null;
  app_title: string | null;
  chapter: string;
  difficulty: string;
  content: { variables: any[]; elements: any[] };
  competences: string[] | null;
  Is_Flash: boolean;
  Need_Calculator: boolean;
  verified: boolean;
  created_at: string;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Facile", medium: "Moyen", hard: "Difficile",
  Facile: "Facile", Moyen: "Moyen", Difficile: "Difficile",
};

const DIFFICULTY_MAP: Record<string, Exercise["difficulty"]> = {
  easy: "Facile", medium: "Moyen", hard: "Difficile",
  Facile: "Facile", Moyen: "Moyen", Difficile: "Difficile",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "bg-green-500/20 text-green-300 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  hard: "bg-red-500/20 text-red-300 border-red-500/30",
  Facile: "bg-green-500/20 text-green-300 border-green-500/30",
  Moyen: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Difficile: "bg-red-500/20 text-red-300 border-red-500/30",
};

function buildExercise(raw: ClaudeExercise): Exercise {
  return {
    id: raw.id,
    title: raw.title ?? "",
    app_title: raw.app_title ?? raw.title ?? "",
    chapter: raw.chapter,
    difficulty: DIFFICULTY_MAP[raw.difficulty] ?? "Facile",
    competences: raw.competences ?? [],
    variables: raw.content?.variables ?? [],
    elements: raw.content?.elements ?? [],
  };
}

// ─────────────────────────────────────────────
// Modale de prévisualisation
// ─────────────────────────────────────────────

function PreviewModal({
  raw,
  onClose,
  onValidate,
  onReject,
  actionLoading,
}: {
  raw: ClaudeExercise;
  onClose: () => void;
  onValidate: () => void;
  onReject: () => void;
  actionLoading: boolean;
}) {
  const exercise = buildExercise(raw);
  const [variables, setVariables] = useState<VariableValues>(() =>
    generateVariables(exercise.variables)
  );

  const reload = useCallback(() => {
    setVariables(generateVariables(exercise.variables));
  }, [exercise.variables]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {raw.title ?? "Sans titre"}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-2">
              {raw.chapter}
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${DIFFICULTY_COLOR[raw.difficulty] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>
                {DIFFICULTY_LABEL[raw.difficulty] ?? raw.difficulty}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none transition-colors"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <ExerciseRenderer exercise={exercise} preGeneratedVariables={variables} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-700 bg-slate-900/50 rounded-b-2xl">
          <button
            onClick={reload}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors"
          >
            ↺ Recharger l&apos;exercice
          </button>
          <div className="flex gap-3">
            <button
              onClick={onReject}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              ✕ Refuser
            </button>
            <button
              onClick={onValidate}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              ✓ Valider
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────

export default function ValidationPage() {
  const { profile, session, loading, profileLoading } = useAuth();
  const router = useRouter();

  const [exercises, setExercises] = useState<ClaudeExercise[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ClaudeExercise | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !profileLoading && profile && profile.role !== "admin") {
      router.replace("/");
    }
  }, [loading, profileLoading, profile, router]);

  const fetchExercises = useCallback(async () => {
    if (!session) return;
    setFetching(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/admin/claude-exercises", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (json.success) {
        setExercises(json.exercises ?? []);
      } else {
        setFetchError(json.error ?? `Erreur HTTP ${res.status}`);
      }
    } catch (e: any) {
      setFetchError(e.message ?? "Erreur réseau");
    } finally {
      setFetching(false);
    }
  }, [session]);

  useEffect(() => {
    if (!loading && !profileLoading && profile?.role === "admin") {
      fetchExercises();
    }
  }, [loading, profileLoading, profile, fetchExercises]);

  async function handleValidate(id: number) {
    if (!session) return;
    setActionId(id);
    try {
      const res = await fetch("/api/admin/claude-exercises", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.success) {
        setExercises((prev) => prev.filter((e) => e.id !== id));
        setPreview(null);
      }
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(id: number) {
    if (!session) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/claude-exercises?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (json.success) {
        setExercises((prev) => prev.filter((e) => e.id !== id));
        setPreview(null);
      }
    } finally {
      setActionId(null);
    }
  }

  if (loading || profileLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-slate-400">Chargement…</p>
        </div>
      </Layout>
    );
  }

  if (!profile || profile.role !== "admin") return null;

  return (
    <Layout>
      <div className="flex-1 px-4 md:px-8 pb-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                🤖 Validation des exercices Claude
              </h1>
              <p className="text-slate-400 mt-1">
                {exercises.length} exercice{exercises.length !== 1 ? "s" : ""} en attente
              </p>
            </div>
            <button
              onClick={fetchExercises}
              title="Rafraîchir"
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <span className={`block text-white text-lg leading-none ${fetching ? "animate-spin" : ""}`}>↺</span>
            </button>
          </div>

          {fetching ? (
            <div className="text-center py-12 text-slate-400">Chargement…</div>
          ) : fetchError ? (
            <div className="text-center py-16 bg-red-900/20 rounded-2xl border border-red-700">
              <p className="text-4xl mb-3">⚠️</p>
              <p className="text-red-400 font-medium">Erreur lors du chargement</p>
              <p className="text-red-500 text-sm mt-1 font-mono">{fetchError}</p>
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-16 bg-slate-800/50 rounded-2xl border border-slate-700">
              <p className="text-4xl mb-3">✓</p>
              <p className="text-slate-400">Aucun exercice en attente de validation.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((ex) => (
                <div
                  key={ex.id}
                  className="bg-slate-800 rounded-xl border border-slate-700 px-5 py-4 flex items-center justify-between gap-4 hover:border-slate-600 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {ex.title ?? <span className="italic text-slate-500">Sans titre</span>}
                    </p>
                    <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{ex.chapter}</span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${DIFFICULTY_COLOR[ex.difficulty] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>
                        {DIFFICULTY_LABEL[ex.difficulty] ?? ex.difficulty}
                      </span>
                      <span>·</span>
                      <span>
                        {new Date(ex.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setPreview(ex)}
                      className="px-3 py-1.5 text-sm text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/20 transition-colors"
                    >
                      Prévisualiser
                    </button>
                    <button
                      onClick={() => handleReject(ex.id)}
                      disabled={actionId === ex.id}
                      className="px-3 py-1.5 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      ✕
                    </button>
                    <button
                      onClick={() => handleValidate(ex.id)}
                      disabled={actionId === ex.id}
                      className="px-3 py-1.5 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {preview && (
        <PreviewModal
          raw={preview}
          onClose={() => setPreview(null)}
          onValidate={() => handleValidate(preview.id)}
          onReject={() => handleReject(preview.id)}
          actionLoading={actionId === preview.id}
        />
      )}
    </Layout>
  );
}
