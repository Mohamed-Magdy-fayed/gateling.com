"use client";

import { useEffect } from "react";

import { captureAttribution } from "@/lib/utm";

export function AttributionCapture() {
  useEffect(() => {
    captureAttribution(new URLSearchParams(window.location.search));
  }, []);
  return null;
}
