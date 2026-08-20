import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiRoute } from "@/lib/apiRoute";

// POST { code: string }
export const POST = apiRoute(async (req: Request) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id")
    .eq("join_code", code.toUpperCase().trim())
    .single();

  if (groupError || !group) {
    return NextResponse.json({ error: "That code doesn't match an active group" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { error: insertError } = await supabase.from("memberships").insert({
    group_id: group.id,
    profile_id: user.id,
    display_name: profile?.full_name ?? "New member",
    joined_at: new Date().toISOString(),
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "You've already joined this group" }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ groupId: group.id });
});
