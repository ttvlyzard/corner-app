import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiRoute } from "@/lib/apiRoute";

export const PATCH = apiRoute(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const supabase = await createClient();
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.requiresPhoto !== undefined) updates.requires_photo = body.requiresPhoto;
  if (body.dueDate !== undefined) updates.due_date = body.dueDate;

  const { data, error } = await supabase.from("chores").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const DELETE = apiRoute(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("chores").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
