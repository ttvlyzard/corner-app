import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiRoute } from "@/lib/apiRoute";

// POST { token: string }
export const POST = apiRoute(async (req: Request) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const { data, error } = await supabase
    .from("memberships")
    .update({ profile_id: user.id, joined_at: new Date().toISOString(), invite_token: null })
    .eq("invite_token", token)
    .is("profile_id", null)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "That invite link is no longer valid" }, { status: 404 });
  }

  return NextResponse.json(data);
});
