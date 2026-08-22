import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiRoute } from "@/lib/apiRoute";

export const GET = apiRoute(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const supabase = await createClient();

  const { data: members, error: membersError } = await supabase
    .from("memberships")
    .select("id, display_name, points, streak_count")
    .eq("group_id", id)
    .not("joined_at", "is", null);

  if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 });

  const stats = await Promise.all(
    (members ?? []).map(async (m) => {
      const { data: chores } = await supabase
        .from("chores")
        .select("id, chore_submissions(status)")
        .eq("membership_id", m.id);

      const total = chores?.length ?? 0;
      // @ts-expect-error - joined relation shape
      const approved = (chores ?? []).filter((c) => c.chore_submissions?.[0]?.status === "approved").length;
      const redos = (chores ?? []).filter(
        // @ts-expect-error - joined relation shape
        (c) => c.chore_submissions?.[0]?.status === "needs_redo"
      ).length;

      return {
        membershipId: m.id,
        displayName: m.display_name,
        points: m.points,
        streak: m.streak_count,
        total,
        approved,
        redos,
        completionRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      };
    })
  );

  return NextResponse.json(stats);
});
