const ERROR_MAP: Record<string, string> = {
  // Connexion
  "Invalid login credentials": "Email ou mot de passe incorrect",
  "invalid_credentials": "Email ou mot de passe incorrect",
  "Email not confirmed": "Veuillez confirmer votre adresse email avant de vous connecter",
  "email_not_confirmed": "Veuillez confirmer votre adresse email avant de vous connecter",

  // Inscription
  "User already registered": "Un compte existe déjà avec cette adresse email",
  "user_already_exists": "Un compte existe déjà avec cette adresse email",
  "Email already in use": "Un compte existe déjà avec cette adresse email",
  "Password should be at least 6 characters.": "Le mot de passe doit contenir au moins 6 caractères",
  "Password should be at least 6 characters": "Le mot de passe doit contenir au moins 6 caractères",
  "signup_disabled": "Les inscriptions sont actuellement désactivées",

  // Email
  "Unable to validate email address: invalid format": "Adresse email invalide",
  "invalid_email": "Adresse email invalide",
  "Email rate limit exceeded": "Trop de tentatives, veuillez réessayer plus tard",
  "over_email_send_rate_limit": "Trop de tentatives, veuillez réessayer plus tard",

  // Réseau / serveur
  "Failed to fetch": "Erreur réseau, veuillez vérifier votre connexion",
  "Network request failed": "Erreur réseau, veuillez vérifier votre connexion",
};

export function translateAuthError(message: string | undefined): string {
  if (!message) return "Une erreur inattendue est survenue";

  // Exact match
  if (ERROR_MAP[message]) return ERROR_MAP[message];

  // Partial match (Supabase sometimes wraps messages)
  for (const [key, value] of Object.entries(ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return value;
  }

  return "Une erreur est survenue, veuillez réessayer";
}
