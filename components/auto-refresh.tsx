"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type AutoRefreshProps = {
  intervalMs?: number;
};

export function AutoRefresh({ intervalMs = 60000 }: AutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs, router]);

  return null;
}
