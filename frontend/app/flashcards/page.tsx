"use client";

import { Layout } from "@/app/components/Layout";
import {
  BookOpen,
  Edit2,
  Filter,
  Layers,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useTaxonomyStore } from "../store/useTaxonomyStore";

// Type correspondant à votre table DB
interface Flashcard {
  id: string;
  chapter: string;
  question: string;
  answer: string;
  created_at: string;
}

export default function FlashcardsManager() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // État pour le filtre (par défaut "all" pour tout voir)
  const chapters = useTaxonomyStore((state) => state.chapters);

  const [selectedChapter, setSelectedChapter] = useState<string>("all");

  // États du formulaire
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    chapter: "Suites numériques",
    question: "",
    answer: "",
  });

  // Chargement initial
  useEffect(() => {
    checkUserRole();
    fetchFlashcards();
  }, []);

  const checkUserRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin") setIsAdmin(true);
    }
  };

  const fetchFlashcards = async () => {
    try {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFlashcards(data || []);
    } catch (error) {
      console.error("Erreur chargement:", error);
      toast.error("Impossible de charger les cartes.");
    } finally {
      setLoading(false);
    }
  };

  // Logique de filtrage dynamique
  const filteredFlashcards = useMemo(() => {
    let filtered = flashcards;
    if (selectedChapter !== "all") {
      filtered = flashcards.filter((card) => card.chapter === selectedChapter);
    }
    return filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [flashcards, selectedChapter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (
      !formData.question.trim() ||
      !formData.answer.trim() ||
      !formData.chapter
    ) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("flashcards")
          .update(formData)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Flashcard modifiée !");
      } else {
        const { error } = await supabase.from("flashcards").insert([formData]);
        if (error) throw error;
        toast.success("Flashcard créée !");
      }
      closeForm();
      fetchFlashcards();
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("Voulez-vous vraiment supprimer cette carte ?")) return;

    try {
      const { error } = await supabase.from("flashcards").delete().eq("id", id);
      if (error) throw error;
      toast.success("Carte supprimée.");
      setFlashcards((prev) => prev.filter((fc) => fc.id !== id));
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression.");
    }
  };

  const handleEdit = (card: Flashcard) => {
    setFormData({
      chapter: card.chapter,
      question: card.question,
      answer: card.answer,
    });
    setEditingId(card.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreate = () => {
    setFormData({
      chapter: chapters[0] || "Suites numériques",
      question: "",
      answer: "",
    });
    setEditingId(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({
      chapter: chapters[0] || "Suites numériques",
      question: "",
      answer: "",
    });
  };

  const isFormValid =
    formData.question.trim().length > 0 &&
    formData.answer.trim().length > 0 &&
    formData.chapter.length > 0;

  return (
    <Layout>
      <div className="flex-1 px-4 md:px-8 pb-8 overflow-y-auto bg-slate-900">
        <div className="max-w-6xl mx-auto pt-8 space-y-8 animate-in fade-in duration-500">
          {/* EN-TÊTE & ACTIONS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Layers className="text-indigo-500" />
                Flashcards
              </h1>
              <p className="text-slate-400 mt-1">
                {filteredFlashcards.length} cartes disponibles pour réviser
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* SÉLECTEUR / FILTRE PAR CHAPITRE */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Filter className="w-4 h-4" />
                </div>
                <select
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  className="pl-10 pr-10 py-3 bg-slate-950 border border-slate-700 text-slate-200 font-medium rounded-xl hover:border-indigo-500/50 focus:border-indigo-500 transition-all appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 min-w-[240px]"
                >
                  <option value="all">Tous les chapitres</option>
                  <option disabled>──────────</option>
                  {chapters.map((chap) => (
                    <option key={chap} value={chap}>
                      {chap}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>

              {/* BOUTON AJOUTER (Admin) */}
              {isAdmin && !isFormOpen && (
                <button
                  onClick={handleCreate}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all transform hover:scale-105 active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter
                </button>
              )}
            </div>
          </div>

          {/* FORMULAIRE ADMIN */}
          {isFormOpen && isAdmin && (
            <div className="bg-slate-900/80 backdrop-blur-md border border-indigo-500/30 rounded-3xl p-8 shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50" />

              <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  {editingId ? (
                    <Edit2 className="w-6 h-6 text-indigo-400" />
                  ) : (
                    <Plus className="w-6 h-6 text-indigo-400" />
                  )}
                  {editingId ? "Modifier la carte" : "Créer une nouvelle carte"}
                </h2>
                <button
                  onClick={closeForm}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-indigo-300 mb-2 block uppercase tracking-wide">
                    Chapitre
                  </label>
                  <div className="relative">
                    <select
                      value={formData.chapter}
                      onChange={(e) =>
                        setFormData({ ...formData, chapter: e.target.value })
                      }
                      className="w-full p-4 pl-5 rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none cursor-pointer font-medium transition-all"
                    >
                      {chapters.map((chap) => (
                        <option key={chap} value={chap}>
                          {chap}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                      Question (Recto)
                    </label>
                    <textarea
                      required
                      value={formData.question}
                      onChange={(e) =>
                        setFormData({ ...formData, question: e.target.value })
                      }
                      className="w-full h-40 p-4 rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none placeholder:text-slate-600 transition-all"
                      placeholder="Posez la question..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-emerald-400 uppercase tracking-wide">
                      Réponse (Verso)
                    </label>
                    <textarea
                      required
                      value={formData.answer}
                      onChange={(e) =>
                        setFormData({ ...formData, answer: e.target.value })
                      }
                      className="w-full h-40 p-4 rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none placeholder:text-slate-600 transition-all"
                      placeholder="La réponse attendue..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-6 py-3 text-slate-300 hover:bg-slate-800 rounded-xl font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid}
                    className={`px-8 py-3 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all
                    ${isFormValid ? "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 hover:-translate-y-0.5" : "bg-slate-700 cursor-not-allowed opacity-50"}`}
                  >
                    <Save className="w-5 h-5" />
                    {editingId ? "Mettre à jour" : "Enregistrer"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* LISTE DES CARTES */}
          {loading ? (
            <div className="flex justify-center items-center py-32">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
          ) : filteredFlashcards.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-700">
              <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-400">
                Aucune flashcard trouvée
              </h3>
              <p className="text-slate-500 mt-2">
                Essayez de changer de filtre.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFlashcards.map((card) => (
                <div
                  key={card.id}
                  className="group bg-slate-900/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col relative overflow-hidden"
                >
                  {/* Effet de lueur au survol */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="mb-4 relative z-10">
                    <span className="inline-block bg-slate-800 text-indigo-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-slate-700">
                      {card.chapter}
                    </span>
                  </div>

                  <div className="flex-1 space-y-4 relative z-10">
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">
                        Question
                      </h3>
                      <p className="font-bold text-white text-lg leading-relaxed">
                        {card.question}
                      </p>
                    </div>
                    <div className="w-full h-px bg-slate-800" />
                    <div>
                      <h3 className="text-xs font-bold text-emerald-500 uppercase mb-1">
                        Réponse
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        {card.answer}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-slate-800 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity relative z-10">
                      <button
                        onClick={() => handleEdit(card)}
                        className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(card.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
