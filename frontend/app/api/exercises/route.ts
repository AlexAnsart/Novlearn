import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; 
export const dynamic = 'force-dynamic';

// --- CONFIGURATION CORS ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Autorise le moteur d'exercice à faire des requêtes
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-secret',
};

// Gère la requête "Preflight" du navigateur pour le CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  });
}

const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase URL or Service Role Key is missing.");
  }
  return createClient(url, key);
};

// --- GET : PUBLIC ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const cookieStore = cookies();
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
       return NextResponse.json({ success: false, error: "Configuration Error" }, { status: 500, headers: corsHeaders });
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    let dataToReturn;

    if (id) {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      dataToReturn = { 
        success: true, 
        data: {
          id: data.id,
          title: data.title,
          appTitle: data.app_title || data.title, 
          chapter: data.chapter,
          difficulty: data.difficulty,
          competences: data.competences || [],
          ...data.content
        } 
      };
    } else {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, title, app_title, chapter, difficulty, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      dataToReturn = {
        success: true,
        exercises: data?.map((ex: any) => ({
          id: ex.id.toString(),
          name: ex.title,       
          title: ex.title,       
          chapter: ex.chapter,
          difficulty: ex.difficulty,
          fileName: `db-${ex.id}`, 
          createdAt: ex.created_at
        })) || [],
        count: data?.length || 0
      };
    }

    return NextResponse.json(dataToReturn, { headers: corsHeaders });

  } catch (error: any) {
    console.error("Erreur API GET:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// --- POST : ADMIN ONLY ---
export async function POST(request: Request) {
  const authHeader = request.headers.get('x-admin-secret');
  if (authHeader !== process.env.ADMIN_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from('exercises')
      .upsert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { headers: corsHeaders });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// --- DELETE : ADMIN ONLY ---
export async function DELETE(request: Request) {
  const authHeader = request.headers.get('x-admin-secret');
  if (authHeader !== process.env.ADMIN_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400, headers: corsHeaders });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from('exercises').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}