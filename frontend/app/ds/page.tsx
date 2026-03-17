"use client";

import { CalendarDays, Loader2, Plus, BookOpen, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { dsApi, DS } from "../lib/api";

function formatDeadline(deadline: string): string {
  try {
    const d = new Date(deadline);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return deadline;
  }
}

function timeRemaining(deadline: string): string {
  try {
    const now = new Date();
    const d = new Date(deadline);
    const diff = d.getTime() - now.getTime();
    if (diff <= 0) return "Expiré";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}j ${hours}h restants`;
    return `${hours}h restantes`;
  } catch {
    return "";
  }
}

function DSListPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [dsList, setDsList] = useState<DS[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleDelete(e: React.MouseEvent, dsId: string, dsTitle: string) {
    e.stopPropagation();
    toast(`Supprimer « ${dsTitle} » ?`, {
      action: {
        label: "Supprimer",
        onClick: async () => {
          setDeletingId(dsId);
          try {
            await dsApi.deleteDS(dsId);
            setDsList((prev) => prev.filter((d) => d.id !== dsId));
            toast.success("DS supprimé");
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression");
          } finally {
            setDeletingId(null);
          }
        },
      },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }
    dsApi
      .getDSList()
      .then((res) => setDsList(res.ds))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || (!user && !error)) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const active = dsList.filter((d) => d.status === "active");
  const expired = dsList.filter((d) => d.status === "expired");

  return (
    <div className="flex-1 flex flex-col px-4 md:px-8 py-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1
              className="text-3xl md:text-4xl tracking-tight bg-gradient-to-r from-white via-violet-100 to-indigo-100 bg-clip-text text-transparent"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              Mes DS
            </h1>
            <p
              className="text-slate-400 text-sm"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
            >
              Devoirs Surveillés personnalisés
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push("/ds/nouveau")}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl px-5 py-3 shadow-lg transition-all font-medium"
          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
        >
          <Plus className="w-5 h-5" />
          Créer un DS
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm"
          style={{ fontFamily: "'Fredoka', sans-serif" }}>
          ❌ {error}
        </div>
      )}

      {!loading && !error && dsList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
          <div className="w-20 h-20 bg-slate-800/60 rounded-3xl flex items-center justify-center">
            <span className="text-4xl">📝</span>
          </div>
          <p
            className="text-xl text-slate-300"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
          >
            Aucun DS pour l'instant
          </p>
          <p
            className="text-sm text-slate-500 text-center max-w-xs"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            Créez un DS pour travailler des compétences ciblées avec un moteur de recommandation personnalisé.
          </p>
          <button
            onClick={() => router.push("/ds/nouveau")}
            className="mt-2 flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl px-6 py-3 shadow-lg transition-all"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
          >
            <Plus className="w-5 h-5" />
            Créer mon premier DS
          </button>
        </div>
      )}

      {/* DS actifs */}
      {active.length > 0 && (
        <section className="mb-8">
          <h2
            className="text-lg text-slate-300 mb-3"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
          >
            En cours
          </h2>
          <div className="grid gap-4">
            {active.map((ds) => (
              <DSCard key={ds.id} ds={ds} onClick={() => router.push(`/ds/${ds.id}`)} onDelete={(e) => handleDelete(e, ds.id, ds.title)} />
            ))}
          </div>
        </section>
      )}

      {/* DS expirés */}
      {expired.length > 0 && (
        <section>
          <h2
            className="text-lg text-slate-500 mb-3"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
          >
            Terminés
          </h2>
          <div className="grid gap-4 opacity-70">
            {expired.map((ds) => (
              <DSCard key={ds.id} ds={ds} onClick={() => router.push(`/ds/${ds.id}`)} onDelete={(e) => handleDelete(e, ds.id, ds.title)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DSCard({ ds, onClick, onDelete }: { ds: DS; onClick: () => void; onDelete: (e: React.MouseEvent) => void }) {
  const isActive = ds.status === "active";
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 hover:border-violet-500/50 hover:bg-slate-700/60 transition-all shadow-md group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className="text-white text-lg truncate group-hover:text-violet-200 transition-colors"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
          >
            {ds.title}
          </p>
          <div className="flex items-center gap-4 mt-1">
            <span
              className="flex items-center gap-1 text-slate-400 text-sm"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              {formatDeadline(ds.deadline)}
            </span>
            <span
              className="flex items-center gap-1 text-sm"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">{ds.competence_ids.length} compétence{ds.competence_ids.length > 1 ? "s" : ""}</span>
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isActive
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : "bg-slate-600/40 text-slate-400 border border-slate-600/30"
              }`}
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              {isActive ? "Actif" : "Expiré"}
            </span>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Supprimer ce DS"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {isActive && (
            <span
              className="flex items-center gap-1 text-xs text-amber-400"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              <Clock className="w-3 h-3" />
              {timeRemaining(ds.deadline)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function DSPage() {
  return (
    <Layout>
      <DSListPage />
    </Layout>
  );
}
