import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// ⚠️ Force le non-cache pour voir les nouveaux exercices immédiatement
export const dynamic = 'force-dynamic';

// 1. Client Super-Admin (Contourne RLS avec la clé Service Role)
// Utilisé pour POST et DELETE via le Secret
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- GET : PUBLIC (Lecture des exercices) ---
export async function GET() {
  try {
    const cookieStore = cookies();

    // 2. Client Public (Respecte RLS) avec @supabase/ssr
    // Remplace createRouteHandlerClient
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // Dans un GET, on a rarement besoin de setter des cookies, 
            // mais la méthode est requise par le type.
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // On ignore les erreurs d'écriture de cookies dans un Server Component/Route Handler GET
            }
          },
        },
      }
    );
    
    // Récupération depuis la BDD
    const { data: exercises, error } = await supabase
      .from('exercises')
      .select('id, title, chapter, difficulty, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transformation des données (avec : any pour éviter les erreurs TS)
    const formattedExercises = exercises?.map((ex: any) => ({
      id: ex.id.toString(),
      name: ex.title,       
      title: ex.title,       
      chapter: ex.chapter,
      difficulty: ex.difficulty,
      fileName: `db-${ex.id}`, 
      createdAt: ex.created_at
    })) || [];

    return NextResponse.json({
      success: true,
      exercises: formattedExercises,
      count: formattedExercises.length,
    });

  } catch (error: any) {
    console.error("Erreur API Exercises (GET):", error);
    return NextResponse.json(
      {
        success: false,
        error: "Impossible de lire les exercices",
        message: error.message || "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

// --- POST : SÉCURISÉ (Reste identique car utilise supabaseAdmin) ---
export async function POST(request: Request) {
  const authHeader = request.headers.get('x-admin-secret');
  if (authHeader !== process.env.ADMIN_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    const { data, error } = await supabaseAdmin
      .from('exercises')
      .upsert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error("Erreur API Exercises (POST):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// --- DELETE : SÉCURISÉ (Reste identique car utilise supabaseAdmin) ---
export async function DELETE(request: Request) {
  const authHeader = request.headers.get('x-admin-secret');
  if (authHeader !== process.env.ADMIN_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  try {
    const { error } = await supabaseAdmin
      .from('exercises')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erreur API Exercises (DELETE):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}