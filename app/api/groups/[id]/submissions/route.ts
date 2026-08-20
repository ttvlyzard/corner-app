import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiRoute } from "@/lib/apiRoute";

export const GET = apiRoute(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chore_submissions")
    .select("*, chores!inner(id, title, description, due_date, group_id, memberships(display_name))")
    .eq("chores.group_id", id)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});
