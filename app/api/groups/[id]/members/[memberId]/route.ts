import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiRoute } from "@/lib/apiRoute";

export const DELETE = apiRoute(async (req: Request, { params }: { params: Promise<{ id: string; memberId: string }> }) => {
  const { id, memberId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // RLS ("parents manage memberships in their groups") already enforces this
  // is only possible for the group's own owner — this check just gives a
  // clean error message instead of a silent 0-row delete.
  const { data: group } = await supabase.from("groups").select("owner_id").eq("id", id).single();
  if (!group || group.owner_id !== user.id) {
    return NextResponse.json({ error: "Not your group" }, { status: 403 });
  }

  const { error } = await supabase.from("memberships").delete().eq("id", memberId).eq("group_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
