import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiRoute } from "@/lib/apiRoute";

// PATCH { avatarEmoji?: string, fullName?: string }
export const PATCH = apiRoute(async (req: Request) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.avatarEmoji !== undefined) updates.avatar_emoji = body.avatarEmoji;
  if (body.fullName !== undefined) updates.full_name = body.fullName;

  const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

// GET — the signed-in user's own profile.
export const GET = apiRoute(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});
