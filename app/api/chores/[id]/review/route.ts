import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyDiscord } from "@/lib/discord";
import { apiRoute } from "@/lib/apiRoute";

const POINTS_PER_CHORE = 10;
const STREAK_BONUS = 5;

export const POST = apiRoute(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { decision, note } = await req.json();
  if (!["approved", "needs_redo"].includes(decision)) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  const { data: submission, error } = await supabase
    .from("chore_submissions")
    .update({ status: decision, review_note: note ?? null, reviewed_at: new Date().toISOString() })
    .eq("chore_id", id)
    .select("*, chores(title, membership_id, due_date, memberships(display_name, points, streak_count, last_full_day_date))")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!submission) return NextResponse.json({ error: "Not found or not yours to review" }, { status: 404 });

 
  const membership = submission.chores.memberships;
  
  const membershipId = submission.chores.membership_id;
  
  const dueDate = submission.chores.due_date;

  if (decision === "approved") {
    let newPoints = (membership.points ?? 0) + POINTS_PER_CHORE;
    let newStreak = membership.streak_count ?? 0;
    let newLastFullDay = membership.last_full_day_date;

    const { data: sameDayChores } = await supabase
      .from("chores")
      .select("id, chore_submissions(status)")
      .eq("membership_id", membershipId)
      .eq("due_date", dueDate);

    const allApproved = (sameDayChores ?? []).every(
      // @ts-expect-error - joined relation shape
      (c) => c.chore_submissions?.[0]?.status === "approved"
    );

    if (allApproved && newLastFullDay !== dueDate) {
      const yesterday = new Date(dueDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const wasConsecutive = newLastFullDay === yesterday.toISOString().slice(0, 10);
      newStreak = wasConsecutive ? newStreak + 1 : 1;
      newPoints += STREAK_BONUS * newStreak;
      newLastFullDay = dueDate;
    }

    await supabase
      .from("memberships")
      .update({ points: newPoints, streak_count: newStreak, last_full_day_date: newLastFullDay })
      .eq("id", membershipId);
  }

  await notifyDiscord(
    decision === "approved"
      // @ts-expect-error - joined relation shape
      ? `✅ ${membership.display_name} — "${submission.chores.title}" approved`
      // @ts-expect-error - joined relation shape
      : `↩️ ${membership.display_name} — "${submission.chores.title}" sent back for redo`
  );

  return NextResponse.json(submission);
});
