import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="ticket max-w-sm text-center">
        <p className="eyebrow mb-2">404</p>
        <p className="font-display text-3xl font-semibold text-espresso">Nothing on this shelf</p>
        <p className="mt-2 font-sans text-sm text-espresso-soft">
          That page doesn't exist — check the address, or head back home.
        </p>
        <Link href="/" className="btn-primary mt-6 inline-flex">
          Back to Corner
        </Link>
      </div>
    </main>
  );
}
