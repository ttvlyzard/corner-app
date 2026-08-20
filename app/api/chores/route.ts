import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiRoute } from "@/lib/apiRoute";

// GET ?membershipId=... — chores for one member. Omit for the signed-in child's own chores.
export const GET = apiRoute(async (req: Request) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const url = new URL(req.url);
  let membershipId = url.searchParams.get("membershipId");

  if (!membershipId) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!membership) return NextResponse.json({ error: "No membership found" }, { status: 404 });
    membershipId = membership.id;
  }

  const { data, error } = await supabase
    .from("chores")
    .select("*, chore_submissions(*)")
    .eq("membership_id", membershipId)
    .order("due_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

// POST { membershipId, title, description?, requiresPhoto, dueDate, recurrence? }
// "daily"/"weekly" generates real future chore rows (2 weeks ahead), not just a label —
// each gets its own pending submission so the child sees it on the right day.
export const POST = apiRoute(async (req: Request) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const { membershipId, title, description, requiresPhoto, dueDate, recurrence } = body;
  if (!membershipId || !title || !dueDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("group_id")
    .eq("id", membershipId)
    .single();
  if (!membership) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const recurrenceGroupId = recurrence && recurrence !== "once" ? crypto.randomUUID() : null;
  const dueDates: string[] = [dueDate];

  if (recurrence === "daily") {
    for (let i = 1; i < 14; i++) {
      const d = new Date(dueDate + "T00:00:00");
      d.setDate(d.getDate() + i);
      dueDates.push(d.toISOString().slice(0, 10));
    }
  } else if (recurrence === "weekly") {
    for (let i = 1; i < 8; i++) {
      const d = new Date(dueDate + "T00:00:00");
      d.setDate(d.getDate() + i * 7);
      dueDates.push(d.toISOString().slice(0, 10));
    }
  }

  const rows = dueDates.map((d) => ({
    group_id: membership.group_id,
    membership_id: membershipId,
    created_by: user.id,
    title,
    description: description ?? null,
    requires_photo: !!requiresPhoto,
    due_date: d,
    recurrence: recurrence ?? "once",
    recurrence_group_id: recurrenceGroupId,
  }));

  const { data: chores, error } = await supabase.from("chores").insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .from("chore_submissions")
    .insert(chores.map((c) => ({ chore_id: c.id, status: "pending" })));

  return NextResponse.json(recurrenceGroupId ? { count: chores.length, recurrenceGroupId } : chores[0]);
});
