import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase URL or Service Role Key is missing.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
};

async function verifyAdmin(request: Request): Promise<{ error: NextResponse } | { userId: string }> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return { error: NextResponse.json({ error: "Non autorisé" }, { status: 401 }) };
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = getSupabaseAdmin();

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { error: NextResponse.json({ error: "Token invalide" }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) };
  }

  return { userId: user.id };
}

// GET — liste tous les exercices Claude en attente
export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("exercises_claude")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, exercises: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST — valide un exercice (le déplace vers exercises) ou action batch
export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    const supabase = getSupabaseAdmin();

    // Récupérer l'exercice depuis exercises_claude
    const { data: claudeEx, error: fetchError } = await supabase
      .from("exercises_claude")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !claudeEx) {
      return NextResponse.json({ error: "Exercice introuvable" }, { status: 404 });
    }

    // Insérer dans exercises (sans id, verified, created_at — laisse BIGSERIAL et defaults)
    const { id: _id, verified: _verified, created_at: _created, ...exerciseData } = claudeEx;
    const { error: insertError } = await supabase
      .from("exercises")
      .insert(exerciseData);

    if (insertError) throw insertError;

    // Supprimer de exercises_claude
    const { error: deleteError } = await supabase
      .from("exercises_claude")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE — rejette un exercice (suppression)
export async function DELETE(request: Request) {
  const auth = await verifyAdmin(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("exercises_claude")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
