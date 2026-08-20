// Posts a plain-text message to a Discord channel via an incoming webhook.
// Fully optional: if DISCORD_WEBHOOK_URL isn't set in .env.local, this is a no-op.
// Set one up in Discord: Server Settings > Integrations > Webhooks > New Webhook,
// copy the URL it gives you.
export async function notifyDiscord(message: string) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
  } catch {
    // Never let a notification failure break the actual chore action.
  }
}
