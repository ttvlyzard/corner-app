"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

// Fades each new route in. Framer Motion's exit animations don't reliably
// fire across Next.js App Router navigations (the old tree unmounts before
// the transition can run), so this focuses on a clean, reliable fade-IN —
// which is what actually reads as "the page arriving" to the user.
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
