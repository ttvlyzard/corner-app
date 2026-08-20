import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCode, disableJoinCode } from "@/lib/joinCode";
import { apiRoute } from "@/lib/apiRoute";

// POST { action: "enable_rotation" | "disable_code" }
export const POST = apiRoute(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { action } = await req.json();

  if (action === "disable_code") {
    const { error } = await disableJoinCode(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "enable_rotation") {
    const { data, error } = await supabase
      .from("groups")
      .update({
        code_regenerates: true,
        join_code: generateCode(),
        code_generated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("owner_id", user.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
});
