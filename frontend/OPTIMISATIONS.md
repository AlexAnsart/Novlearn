# Optimisations Next.js - 'use client' et Supabase

Ce document résume les optimisations effectuées et les bonnes pratiques à suivre pour le projet NovLearn.

## Résumé des optimisations effectuées

### 1. Client Supabase côté serveur

**Fichier créé** : `app/lib/supabase-server.ts`

Ce nouveau fichier fournit des utilitaires pour accéder à Supabase depuis les Server Components :

```typescript
import {
  createSupabaseServerClient,
  getServerUser,
  getServerProfile,
  getLeaderboardData,
} from "@/app/lib/supabase-server";
```

**Avantages** :

- Les données sont chargées côté serveur (SSR)
- Pas de "flash" de chargement visible
- Meilleur SEO car le contenu est dans le HTML initial
- Moins de JavaScript envoyé au client

### 2. Composants convertis en Server Components

| Composant                            | Avant                        | Après                     | Gain              |
| ------------------------------------ | ---------------------------- | ------------------------- | ----------------- |
| `Logo.tsx`                           | `'use client'` + `useRouter` | `Link` (Server Component) | ~2KB JS           |
| `Footer.tsx`                         | `'use client'`               | Server Component          | ~3KB JS           |
| `cgu/page.tsx`                       | `'use client'`               | Server Component          | Contenu indexable |
| `sitemap/page.tsx`                   | `'use client'`               | Server Component          | Contenu indexable |
| `privacy/page.tsx`                   | `'use client'`               | Server Component          | Contenu indexable |
| `politique-confidentialite/page.tsx` | `'use client'`               | Server Component          | Contenu indexable |

### 3. Page Classement optimisée

La page `/classement` est maintenant un **Server Component hybride** :

- Les données du leaderboard sont pré-chargées côté serveur
- Le composant `MonthlyLeaderboard` reçoit les données via `initialData`
- L'interactivité des onglets reste côté client

```tsx
// Avant: appel Supabase côté client à chaque visite
<MonthlyLeaderboard limit={50} />;

// Après: données pré-chargées côté serveur
const initialLeaderboard = await getLeaderboardData("score", 50);
<MonthlyLeaderboard
  limit={50}
  initialData={initialLeaderboard}
  initialSortBy="score"
/>;
```

---

## Bonnes pratiques à suivre

### Quand utiliser `'use client'` ?

Utilisez `'use client'` **uniquement** quand le composant nécessite :

- Des hooks React (`useState`, `useEffect`, `useContext`, etc.)
- Des event handlers (`onClick`, `onChange`, etc.)
- Des APIs navigateur (`window`, `localStorage`, etc.)

### Quand NE PAS utiliser `'use client'` ?

❌ **Évitez** `'use client'` pour :

- Du contenu statique (CGU, mentions légales, etc.)
- Des liens simples (`<Link>` fonctionne en Server Component)
- Du formatage de dates (`new Date()` fonctionne côté serveur)
- Des icônes/images statiques

### Pattern recommandé : Données pré-chargées

Pour les pages qui affichent des données de Supabase :

```tsx
// page.tsx (Server Component)
import { getLeaderboardData } from "@/app/lib/supabase-server";
import { ClientComponent } from "./ClientComponent";

export default async function Page() {
  // Données chargées côté serveur
  const data = await getLeaderboardData("score", 50);

  // Passées au Client Component
  return <ClientComponent initialData={data} />;
}
```

```tsx
// ClientComponent.tsx (Client Component)
"use client";

export function ClientComponent({ initialData }) {
  // Utilise les données initiales, fetch seulement si nécessaire
  const [data, setData] = useState(initialData);
  // ...
}
```

### Structure des fichiers Supabase

```
app/lib/
├── supabase.ts         # Client pour les Client Components (navigateur)
└── supabase-server.ts  # Client pour les Server Components (serveur)
```

**Règle** :

- Dans un fichier avec `'use client'` → utiliser `supabase.ts`
- Dans un Server Component → utiliser `supabase-server.ts`

---

## Opportunités d'optimisation futures

### 1. Page d'accueil

La page `/page.tsx` utilise actuellement `'use client'` pour :

- `useAuth` (vérification de connexion)
- `useState` (modal de feedback)
- Navigation

**Optimisation possible** : Séparer en composants :

- Server Component pour le layout statique
- Client Component pour les parties interactives

### 2. Composant Layout

Le composant `Layout.tsx` est un Client Component car il utilise :

- `useAuth` pour l'affichage du profil
- `usePathname` pour la navigation active
- `useState` pour la détection mobile

**Optimisation possible** : Créer un `ServerLayout` simplifié pour les pages statiques.

### 3. Page Progression

La page `/progression` fait plusieurs appels Supabase :

- `exercise_attempts`
- `user_competence_scores`
- `exercises`

**Optimisation possible** : Créer une fonction serveur `getProgressData()` et pré-charger.

### 4. Server Actions

Pour les mutations (inscription, soumission d'exercice, etc.), considérer l'utilisation des [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) :

```tsx
// actions.ts
"use server";

export async function submitExercise(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  // ... logique de soumission
}
```

---

## Métriques à surveiller

Après ces optimisations, mesurez :

- **Time to First Byte (TTFB)** : Devrait diminuer pour les pages avec SSR
- **Largest Contentful Paint (LCP)** : Les pages de contenu statique devraient charger plus vite
- **JavaScript Bundle Size** : Devrait diminuer avec moins de `'use client'`

Utilisez `npm run build` pour voir la taille des bundles et les pages statiques vs dynamiques.
