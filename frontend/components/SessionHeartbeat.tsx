"use client";

declare const window: any;
declare const document: any;

import { useEffect } from "react";
import { markTabActive } from "../lib/session";

export default function SessionHeartbeat() {
  useEffect(() => {
    markTabActive();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markTabActive();
      }
    };

    const throttledHeartbeat = () => markTabActive();

    window.addEventListener("focus", throttledHeartbeat);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("click", throttledHeartbeat, { passive: true });
    window.addEventListener("keydown", throttledHeartbeat, { passive: true });
    window.addEventListener("mousemove", throttledHeartbeat, { passive: true });
    window.addEventListener("scroll", throttledHeartbeat, { passive: true });

    const intervalId = window.setInterval(markTabActive, 1000);

    return () => {
      window.removeEventListener("focus", throttledHeartbeat);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("click", throttledHeartbeat);
      window.removeEventListener("keydown", throttledHeartbeat);
      window.removeEventListener("mousemove", throttledHeartbeat);
      window.removeEventListener("scroll", throttledHeartbeat);
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}

//  
