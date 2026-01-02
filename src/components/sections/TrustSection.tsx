"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, Lock, FileCheck, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TrustSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const certifications = [
    { icon: Shield, label: "SOC 2 Type II", color: "text-white" },
    { icon: Lock, label: "GDPR Compliant", color: "text-electric" },
    { icon: FileCheck, label: "ISO 27001", color: "text-orange-400" },
    { icon: Shield, label: "HIPAA Ready", color: "text-green-400" },
  ];

  const testimonials = [
    {
      company: "TechCorp",
      role: "VP of Sales",
      quote: "Incrementamos conversión 280% en 60 días",
      name: "Roberto García",
    },
    {
      company: "SalesHub",
      role: "CEO",
      quote: "La mejor inversión que hicimos este año",
      name: "María Fernández",
    },
    {
      company: "GrowthCo",
      role: "Director Comercial",
      quote: "ROI positivo desde el primer mes",
      name: "Carlos Ruiz",
    },
  ];

  return <></>;
}
