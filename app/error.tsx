"use client";

import { useEffect } from "react";
import Link from "next/link";

// Catches any uncaught render/runtime error in this route tree so a real
// user never sees Next's default white-screen error, in production or dev.
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="ticket max-w-sm text-center">
        <p className="eyebrow mb-2">Spilled something</p>
        <p className="font-display text-2xl font-semibold text-espresso">Something went wrong</p>
        <p className="mt-2 font-sans text-sm text-espresso-soft">
          That's on us, not you. Try again, or head back home.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={reset} className="btn-primary">
            Try again
          </button>
          <Link href="/" className="btn-secondary">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
