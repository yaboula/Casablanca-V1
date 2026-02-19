"use client";

import { motion } from "framer-motion";
import { FileText, CreditCard } from "lucide-react";

interface Props {
  currentStep: 1 | 2;
}

const STEPS = [
  { label: "Pasaporte", icon: FileText },
  { label: "Carnet", icon: CreditCard },
] as const;

export default function CheckInProgressBar({ currentStep }: Props) {
  return (
    <div className="flex items-center gap-3">
      {STEPS.map((s, i) => {
        const stepNum = (i + 1) as 1 | 2;
        const done = stepNum < currentStep;
        const active = stepNum === currentStep;

        return (
          <div key={s.label} className="flex items-center gap-3 flex-1">
            {/* Segment */}
            <div className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
                  ${done ? "bg-brand-success" : active ? "bg-brand-primary" : "bg-slate-100"}`}
              >
                <s.icon
                  className={`w-3.5 h-3.5 ${done || active ? "text-white" : "text-brand-muted"}`}
                />
              </div>
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${done ? "bg-brand-success" : "bg-brand-primary"}`}
                  initial={{ width: "0%" }}
                  animate={{ width: done ? "100%" : active ? "50%" : "0%" }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>

            {/* Connector between segments */}
            {i < STEPS.length - 1 && (
              <div className="w-4 h-px bg-slate-200" />
            )}
          </div>
        );
      })}
    </div>
  );
}
