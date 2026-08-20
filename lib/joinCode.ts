import { createClient } from "@/lib/supabase/server";

// Codes are short, unambiguous (no 0/O/1/I), and easy to read aloud/type on a phone.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const REGEN_INTERVAL_HOURS = 48; // "every 2 days"

export function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

// Call this whenever a group is read/loaded. If code_regenerates is true and
// more than REGEN_INTERVAL_HOURS have passed, mint a new code and save it.
// If code_regenerates is false, the existing code is left alone (parent turned
// off rotation, or turned the code off entirely by setting join_code to null).
export async function getFreshJoinCode(groupId: string) {
  const supabase = await createClient();

  const { data: group, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (error || !group) throw error ?? new Error("Group not found");
  if (!group.code_regenerates) return group;

  const hoursSince =
    (Date.now() - new Date(group.code_generated_at).getTime()) / 36e5;

  if (hoursSince < REGEN_INTERVAL_HOURS) return group;

  // Retry on the rare unique-constraint collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const newCode = generateCode();
    const { data: updated, error: updateError } = await supabase
      .from("groups")
      .update({ join_code: newCode, code_generated_at: new Date().toISOString() })
      .eq("id", groupId)
      .select()
      .single();

    if (!updateError) return updated;
    if (updateError.code !== "23505") throw updateError; // not a uniqueness conflict
  }
  throw new Error("Could not generate a unique join code, try again");
}

// Parent explicitly turns the code off — children can no longer join by code,
// only via direct invite.
export async function disableJoinCode(groupId: string) {
  const supabase = await createClient();
  return supabase
    .from("groups")
    .update({ join_code: null, code_regenerates: false })
    .eq("id", groupId);
}
