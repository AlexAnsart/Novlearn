"""
Paramètres configurables de l'algo de recommandation d'exercices.
À modifier ici sans toucher à la logique.
"""

# Seuils de streak global (signé : négatif = série d'échecs, positif = série de succès)
STREAK_VERY_LOW = -5   # en dessous : remettre en confiance (exos les plus faciles)
STREAK_LOW = -1        # en dessous : confiance légère
STREAK_MID = 2         # en dessous : progression moyenne ; au-dessus : défi (compétence la plus faible)

# Confiance -> niveau de difficulté (0=facile, 1=moyen, 2=difficile)
CONF_EASY_MAX_VERY_LOW = 0.5
CONF_MEDIUM_MAX_VERY_LOW = 0.9

CONF_EASY_MAX_LOW = 0.4
CONF_MEDIUM_MAX_LOW = 0.8

CONF_EASY_MAX_MID = 0.2
CONF_MEDIUM_MAX_MID = 0.65

CONF_MEDIUM_MAX_HIGH = 0.3   # branche défi (acquises) : que moyen/difficile
CONF_EASY_MAX_HIGH = 0.4
CONF_MEDIUM_MAX_HIGH = 0.8

# Nombre de dernières tentatives pour calculer le streak global
GLOBAL_STREAK_WINDOW = 20

# Valeurs difficulty en base (exercises.difficulty)
DIFFICULTY_EASY = "easy"
DIFFICULTY_MEDIUM = "medium"
DIFFICULTY_HARD = "hard"
DIFFICULTY_BY_LEVEL = (DIFFICULTY_EASY, DIFFICULTY_MEDIUM, DIFFICULTY_HARD)
