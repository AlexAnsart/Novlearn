import { useState } from "react";
import { User, Mail, Calendar, Lock } from "lucide-react";

export function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    birthdate: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    birthdate: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation simple
    const newErrors = {
      name: "",
      email: "",
      birthdate: "",
      password: "",
      confirmPassword: "",
    };

    if (!formData.name) {
      newErrors.name = "Le nom est requis";
    }

    if (!formData.email) {
      newErrors.email = "L'adresse mail est requise";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "L'adresse mail n'est pas valide";
    }

    if (!formData.birthdate) {
      newErrors.birthdate = "La date de naissance est requise";
    }

    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);

    // Si pas d'erreurs, on peut soumettre
    if (!Object.values(newErrors).some((error) => error !== "")) {
      alert("Inscription réussie !");
      // Ici, on pourrait envoyer les données au serveur
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <h2
            className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Inscription
          </h2>
          <p
            className="text-blue-200 mt-2 drop-shadow-md"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
          >
            Rejoignez NovLearn pour réviser vos maths
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] space-y-6"
        >
          {/* Nom */}
          <div>
            <label
              className="flex items-center gap-2 text-blue-200 mb-2"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              <User className="w-5 h-5" />
              Nom
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-900/60 text-white rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
              placeholder="Votre nom"
            />
            {errors.name && (
              <p
                className="text-red-400 mt-1 text-sm"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
              >
                {errors.name}
              </p>
            )}
          </div>

          {/* Adresse mail */}
          <div>
            <label
              className="flex items-center gap-2 text-blue-200 mb-2"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              <Mail className="w-5 h-5" />
              Adresse mail
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-900/60 text-white rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
              placeholder="votre.email@exemple.fr"
            />
            {errors.email && (
              <p
                className="text-red-400 mt-1 text-sm"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
              >
                {errors.email}
              </p>
            )}
          </div>

          {/* Date de naissance */}
          <div>
            <label
              className="flex items-center gap-2 text-blue-200 mb-2"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              <Calendar className="w-5 h-5" />
              Date de naissance
            </label>
            <input
              type="date"
              value={formData.birthdate}
              onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
              className="w-full bg-slate-900/60 text-white rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
            />
            {errors.birthdate && (
              <p
                className="text-red-400 mt-1 text-sm"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
              >
                {errors.birthdate}
              </p>
            )}
          </div>

          {/* Mot de passe */}
          <div>
            <label
              className="flex items-center gap-2 text-blue-200 mb-2"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              <Lock className="w-5 h-5" />
              Mot de passe
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-slate-900/60 text-white rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
              placeholder="••••••••"
            />
            {errors.password && (
              <p
                className="text-red-400 mt-1 text-sm"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
              >
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirmer mot de passe */}
          <div>
            <label
              className="flex items-center gap-2 text-blue-200 mb-2"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              <Lock className="w-5 h-5" />
              Confirmer mot de passe
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full bg-slate-900/60 text-white rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p
                className="text-red-400 mt-1 text-sm"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
              >
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Bouton de soumission */}
          <button
            type="submit"
            className="w-full px-8 py-4 rounded-3xl bg-gradient-to-b from-green-500 to-green-700 text-white shadow-[0_8px_0_0_rgb(21,128,61),0_13px_20px_rgba(34,197,94,0.3)] transform transition-all duration-200 hover:scale-105 active:scale-95 active:shadow-[0_4px_0_0_rgb(21,128,61),0_6px_15px_rgba(34,197,94,0.3)] active:translate-y-1"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1.125rem" }}
          >
            S'inscrire
          </button>
        </form>
      </div>
    </div>
  );
}
