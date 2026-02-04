import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error("ERREUR : SUPABASE_SERVICE_ROLE_KEY manquante");
      return NextResponse.json(
        { error: "Configuration serveur invalide" },
        { status: 500 },
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: verificationError,
    } = await supabaseAdmin.auth.getUser(token);

    if (verificationError || !user) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }

    const userId = user.id;
    console.log(
      `[Delete Account] Nettoyage manuel des données pour ${userId}...`,
    );

    // Suppression manuelle des données publiques pour éviter les blocages FK
    // On utilise Promise.all pour paralléliser, mais on ignore les erreurs si une table est vide/inexistante
    await Promise.all([
      supabaseAdmin.from("profiles").delete().eq("id", userId),
      supabaseAdmin.from("user_progress").delete().eq("user_id", userId),
      supabaseAdmin.from("exercise_attempts").delete().eq("user_id", userId),
      supabaseAdmin.from("friend_codes").delete().eq("user_id", userId),
      supabaseAdmin
        .from("friends")
        .delete()
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
      supabaseAdmin
        .from("friend_requests")
        .delete()
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`),
      supabaseAdmin
        .from("user_competence_scores")
        .delete()
        .eq("user_id", userId),
      supabaseAdmin
        .from("duels")
        .delete()
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`),
      supabaseAdmin.from("duel_attempts").delete().eq("player_id", userId),
    ]);

    console.log(`[Delete Account] Suppression de l'utilisateur Auth...`);

    // Suppression finale de l'utilisateur
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Erreur suppression Supabase:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur inattendue:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
