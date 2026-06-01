"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, FileText, Target, Zap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  FileText,
  Target,
  Zap,
  Clock,
};

interface MetricCardProps {
  label: string;
  value: string | number;
  change: number;
  changeLabel: string;
  trend: "up" | "down" | "neutral";
  icon: string;
  index?: number;
}

export function MetricCard({ label, value, change, changeLabel, trend, icon, index = 0 }: MetricCardProps) {
  const Icon = iconMap[icon] || FileText;
  const isPositive = trend === "up";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 rounded-xl bg-primary/8 border border-primary/15">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            isPositive ? "text-emerald-600 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
          )}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {isPositive ? "+" : ""}{change}%
          </div>
        </div>

        <div className="mb-1.5">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.08 + 0.2 }}
            className="text-2xl font-bold text-foreground tracking-tight"
          >
            {value}
          </motion.span>
        </div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">{changeLabel}</p>
      </div>
    </motion.div>
  );
}
