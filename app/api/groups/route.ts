import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCode } from "@/lib/joinCode";
import { apiRoute } from "@/lib/apiRoute";

// POST { name: string } — creates a group owned by the signed-in parent.
// Idempotent: if this parent already owns a group, returns that one instead
// of creating a duplicate (this is what makes the dashboard's recovery button safe to click more than once).
export const POST = apiRoute(async (req: Request) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const { data: existing } = await supabase
    .from("groups")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return NextResponse.json(existing);

  const { data, error } = await supabase
    .from("groups")
    .insert({ owner_id: user.id, name, join_code: generateCode() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

// GET — returns the signed-in parent's group (auto-refreshing the join code
// if due for rotation), or the child's group if signed in as a child.
export const GET = apiRoute(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // .limit(1) before .maybeSingle() means this never errors even if a
  // duplicate slipped through before the unique constraint existed —
  // it just deterministically picks the most recently created one.
  const { data: ownedGroup, error: ownedError } = await supabase
    .from("groups")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ownedError) return NextResponse.json({ error: ownedError.message }, { status: 500 });

  if (ownedGroup) {
    const { getFreshJoinCode } = await import("@/lib/joinCode");
    const fresh = await getFreshJoinCode(ownedGroup.id);
    return NextResponse.json({ role: "parent", group: fresh });
  }

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("*, groups(*)")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 500 });
  if (!membership) return NextResponse.json({ error: "No group found" }, { status: 404 });
  return NextResponse.json({ role: "child", group: membership.groups, membership });
});
