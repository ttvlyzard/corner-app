import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyDiscord } from "@/lib/discord";
import { apiRoute } from "@/lib/apiRoute";

export const POST = apiRoute(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: chore, error: choreError } = await supabase
    .from("chores")
    .select("id, title, requires_photo, membership_id, memberships(profile_id, display_name)")
    .eq("id", id)
    .single();

  if (choreError || !chore) return NextResponse.json({ error: "Chore not found" }, { status: 404 });
  // @ts-expect-error - joined relation shape
  if (chore.memberships.profile_id !== user.id) {
    return NextResponse.json({ error: "Not your chore" }, { status: 403 });
  }

  let photoUrl: string | null = null;

  if (chore.requires_photo) {
    const formData = await req.formData();
    const file = formData.get("photo") as File | null;
    if (!file) {
      return NextResponse.json({ error: "This chore requires a photo" }, { status: 400 });
    }
    const path = `${chore.membership_id}/${chore.id}-${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("chore-photos")
      .upload(path, file, { contentType: file.type });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data: pub } = supabase.storage.from("chore-photos").getPublicUrl(path);
    photoUrl = pub.publicUrl;
  }

  const { error: upsertError } = await supabase
    .from("chore_submissions")
    .upsert(
      { chore_id: chore.id, status: "submitted", photo_url: photoUrl, submitted_at: new Date().toISOString(), review_note: null },
      { onConflict: "chore_id" }
    );

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  // @ts-expect-error - joined relation shape
  await notifyDiscord(`📸 ${chore.memberships.display_name} submitted "${chore.title}" — awaiting review`);

  return NextResponse.json({ status: "submitted", photoUrl });
});
