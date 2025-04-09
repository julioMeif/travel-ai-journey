// src/hooks/useIsMobile.ts
"use client";

import { useState, useEffect } from "react";

export default function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkWindowSize = () => setIsMobile(window.innerWidth < breakpoint);

    checkWindowSize();
    window.addEventListener("resize", checkWindowSize);
    return () => window.removeEventListener("resize", checkWindowSize);
  }, [breakpoint]);

  return isMobile;
}
