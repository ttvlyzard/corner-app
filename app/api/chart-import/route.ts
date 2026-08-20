import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { apiRoute } from "@/lib/apiRoute";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// POST multipart/form-data: photo (file), membershipId (string)
// Returns a list of { title, dueDate, requiresPhoto } for the parent to review
// and confirm before anything is actually written to the chores table.
export const POST = apiRoute(async (req: Request) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("photo") as File | null;
  if (!file) return NextResponse.json({ error: "Missing photo" }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");

  const today = new Date().toISOString().slice(0, 10);

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent([
    {
      inlineData: { mimeType: file.type || "image/jpeg", data: base64 },
    },
    {
      text: `This is a photo of a handwritten or printed chore chart. Today's date is ${today}.
Extract every chore you can identify. For each one, infer a reasonable due date from the
chart's structure (day-of-week columns, dates written down, etc). If a chore looks like it
should be checked/verified visually (e.g. "clean sink", "make bed", "take out trash"), set
requiresPhoto to true; for chores that aren't visually verifiable (e.g. "practice piano 20 min"),
set it to false unless the chart itself implies proof is expected.

Respond with ONLY a JSON array, no other text, in this exact shape:
[{"title": string, "dueDate": "YYYY-MM-DD", "requiresPhoto": boolean}]`,
    },
  ]);

  const text = result.response.text();

  let parsed;
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "Couldn't parse the chart into chores, try a clearer photo" }, { status: 502 });
  }

  // Returned to the client for review/editing — nothing is saved yet.
  return NextResponse.json({ suggestedChores: parsed });
});
