"use client";
import ThankYouPage from "@/components/thank-you/ThankYouPage";
import { AccessGate } from "@/components/AccessGate";

export default function ThankYouPageRoute() {
  return (
    <AccessGate>
      <ThankYouPage />
    </AccessGate>
  );
}
