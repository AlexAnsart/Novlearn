"use client";

import { ChevronDown, ChevronRight, Loader2, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import { dsApi } from "../../lib/api";
import { useTaxonomyStore } from "../../store/useTaxonomyStore";

function NouveauDSPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { chapters, chapterEmojis, competencesByChapter, isLoaded, loadData } =
    useTaxonomyStore();

  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!isLoaded) loadData();
  }, [isLoaded, loadData]);

  function toggleChapter(chapter: string) {
    setOpenChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapter)) next.delete(chapter);
      else next.add(chapter);
      return next;
    });
  }

  function toggleCompetence(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllChapter(chapter: string, selectAll: boolean) {
    const comps = competencesByChapter[chapter] || [];
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const c of comps) {
        if (selectAll) next.add(c.id);
        else next.delete(c.id);
      }
      return next;
    });
  }

  function isChapterFullySelected(chapter: string): boolean {
    const comps = competencesByChapter[chapter] || [];
    return comps.length > 0 && comps.every((c) => selectedIds.has(c.id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Le titre est obligatoire");
      return;
    }
    if (!deadline) {
      setError("La date limite est obligatoire");
      return;
    }
    if (new Date(deadline) <= new Date()) {
      setError("La date limite doit être dans le futur");
      return;
    }
    if (selectedIds.size === 0) {
      setError("Sélectionnez au moins une compétence");
      return;
    }

    setSubmitting(true);
    try {
      const ds = await dsApi.createDS(
        title.trim(),
        new Date(deadline).toISOString(),
        Array.from(selectedIds),
      );
      router.push(`/ds/${ds.id}`);
    } catch (e: any) {
      setError(e.message || "Erreur lors de la création du DS");
      setSubmitting(false);
    }
  }

  // Minimum date : demain
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <div className="flex-1 flex flex-col px-4 md:px-8 py-6 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1
            className="text-3xl md:text-4xl tracking-tight bg-gradient-to-r from-white via-violet-100 to-indigo-100 bg-clip-text text-transparent"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Créer un DS
          </h1>
          <p
            className="text-slate-400 text-sm"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            Définissez vos objectifs et compétences à travailler
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Titre */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
          <label
            className="block text-slate-200 text-sm mb-2"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
          >
            Titre du DS
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Révisions Suites et Limites"
            maxLength={100}
            className="w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/70 transition-colors"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          />
        </div>

        {/* Date limite */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
          <label
            className="block text-slate-200 text-sm mb-2"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
          >
            Date limite
          </label>
          <input
            type="date"
            value={deadline}
            min={minDateStr}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/70 transition-colors"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          />
        </div>

        {/* Sélection des compétences */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <label
              className="text-slate-200 text-sm"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              Compétences à travailler
            </label>
            <span
              className="text-xs text-violet-400"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              {selectedIds.size} sélectionnée{selectedIds.size > 1 ? "s" : ""}
            </span>
          </div>

          {!isLoaded ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {chapters.map((chapter) => {
                const comps = competencesByChapter[chapter] || [];
                if (comps.length === 0) return null;
                const isOpen = openChapters.has(chapter);
                const allSelected = isChapterFullySelected(chapter);
                const emoji = chapterEmojis[chapter] || "📚";

                return (
                  <div
                    key={chapter}
                    className="border border-slate-700/40 rounded-xl overflow-hidden"
                  >
                    {/* Accordéon header */}
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-700/30 cursor-pointer select-none"
                      onClick={() => toggleChapter(chapter)}>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <span className="text-base">{emoji}</span>
                      <span
                        className="flex-1 text-slate-200 text-sm"
                        style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                      >
                        {chapter}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAllChapter(chapter, !allSelected);
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                          allSelected
                            ? "bg-violet-600/50 text-violet-200 hover:bg-red-500/30 hover:text-red-300"
                            : "bg-slate-600/50 text-slate-300 hover:bg-violet-600/30 hover:text-violet-200"
                        }`}
                        style={{ fontFamily: "'Fredoka', sans-serif" }}
                      >
                        {allSelected ? "Tout désélect." : "Tout sélect."}
                      </button>
                    </div>

                    {/* Compétences */}
                    {isOpen && (
                      <div className="px-4 py-2 flex flex-col gap-1">
                        {comps.map((comp) => {
                          const checked = selectedIds.has(comp.id);
                          return (
                            <label
                              key={comp.id}
                              className="flex items-center gap-3 py-1.5 cursor-pointer group"
                            >
                              <div
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                                  checked
                                    ? "bg-violet-600 border-violet-500"
                                    : "border-slate-600 group-hover:border-violet-500/50"
                                }`}
                                onClick={() => toggleCompetence(comp.id)}
                              >
                                {checked && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span
                                className={`text-sm transition-colors ${
                                  checked ? "text-white" : "text-slate-400 group-hover:text-slate-300"
                                }`}
                                style={{ fontFamily: "'Fredoka', sans-serif" }}
                                onClick={() => toggleCompetence(comp.id)}
                              >
                                {comp.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div
            className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            ❌ {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pb-6">
          <button
            type="button"
            onClick={() => router.push("/ds")}
            className="px-6 py-3 rounded-xl bg-slate-700/60 text-slate-300 hover:bg-slate-600/60 transition-colors"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg transition-all disabled:opacity-50"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Création…
              </>
            ) : (
              "Créer le DS"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NouveauDSPageWrapper() {
  return (
    <Layout>
      <NouveauDSPage />
    </Layout>
  );
}
