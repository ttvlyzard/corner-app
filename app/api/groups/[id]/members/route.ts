import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { apiRoute } from "@/lib/apiRoute";

// GET — list every member (joined or pending) of this group.
export const GET = apiRoute(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("group_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

// POST { displayName: string } — pre-add a kid/employee before they've signed up.
export const POST = apiRoute(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { displayName } = await req.json();
  if (!displayName) return NextResponse.json({ error: "Missing displayName" }, { status: 400 });

  const inviteToken = randomUUID();

  const { data, error } = await supabase
    .from("memberships")
    .insert({ group_id: id, display_name: displayName, invite_token: inviteToken, profile_id: null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ membership: data, inviteToken });
});
