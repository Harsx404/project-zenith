"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Disable transition for dashboard so it doesn't interrupt the immersive feeling
  // or we can just apply a simple fade-in. Let's do a simple fade-in for all pages.
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex-1 flex flex-col relative w-full h-full"
    >
      {children}
    </motion.div>
  );
}
