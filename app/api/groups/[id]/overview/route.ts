import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiRoute } from "@/lib/apiRoute";

export const GET = apiRoute(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);

  const { data: members } = await supabase
    .from("memberships")
    .select("id, joined_at")
    .eq("group_id", id);

  const joinedMembers = (members ?? []).filter((m) => m.joined_at);
  const memberIds = joinedMembers.map((m) => m.id);

  const { count: pendingReviewCount } = await supabase
    .from("chore_submissions")
    .select("id, chores!inner(group_id)", { count: "exact", head: true })
    .eq("chores.group_id", id)
    .eq("status", "submitted");

  let choresDueToday = 0;
  let weeklyApproved = 0;
  let weeklyTotal = 0;

  if (memberIds.length > 0) {
    const { data: dueTodayChores } = await supabase
      .from("chores")
      .select("id", { count: "exact" })
      .in("membership_id", memberIds)
      .eq("due_date", today);
    choresDueToday = dueTodayChores?.length ?? 0;

    const { data: weekChores } = await supabase
      .from("chores")
      .select("id, chore_submissions(status)")
      .in("membership_id", memberIds)
      .gte("due_date", weekAgoStr)
      .lte("due_date", today);

    weeklyTotal = weekChores?.length ?? 0;
    weeklyApproved = (weekChores ?? []).filter(
      
      (c) => c.chore_submissions?.[0]?.status === "approved"
    ).length;
  }

  return NextResponse.json({
    membersJoined: joinedMembers.length,
    choresDueToday,
    pendingReviewCount: pendingReviewCount ?? 0,
    weeklyCompletionRate: weeklyTotal > 0 ? Math.round((weeklyApproved / weeklyTotal) * 100) : null,
  });
});
