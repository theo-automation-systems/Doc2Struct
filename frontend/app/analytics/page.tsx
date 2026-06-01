"use client";

import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { mockChartData } from "@/lib/mock-data";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, FileText, Clock, Target, ArrowUp } from "lucide-react";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-xl shadow-lg p-3">
        <p className="text-xs font-semibold text-foreground mb-1.5">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-muted-foreground">{entry.name}:</span>
            <span className="text-xs font-semibold text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const processingTimeData = [
  { month: "Jul", avg: 3.2 }, { month: "Aug", avg: 2.9 },
  { month: "Sep", avg: 2.7 }, { month: "Oct", avg: 2.4 },
  { month: "Nov", avg: 2.2 }, { month: "Dec", avg: 2.1 },
];

const kpis = [
  { label: "Documents processed", value: "2,847", change: "+18.4%", icon: FileText },
  { label: "Extraction accuracy", value: "96.2%", change: "+2.1pp", icon: Target },
  { label: "Avg processing time", value: "2.1s", change: "−34%", icon: Clock },
  { label: "Automations run", value: "689", change: "+31.2%", icon: TrendingUp },
];

export default function AnalyticsPage() {
  return (
    <MainLayout title="Analytics" subtitle="Processing performance over time">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-10 space-y-10">

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="p-5 rounded-2xl bg-card border border-border"
              >
                <kpi.icon className="w-4 h-4 text-muted-foreground mb-3" />
                <p className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
                <p className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-0.5">
                  <ArrowUp className="w-3 h-3" />{kpi.change}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Weekly activity */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="mb-5">
              <h3 className="text-sm font-semibold">Weekly activity</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Documents processed this week</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={mockChartData.weeklyActivity} barSize={14} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="documents" fill="#6366f1" radius={[4, 4, 0, 0]} name="Documents" />
                <Bar dataKey="extractions" fill="#8b5cf680" radius={[4, 4, 0, 0]} name="Extractions" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                <span className="text-xs text-muted-foreground">Documents</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-violet-500/50" />
                <span className="text-xs text-muted-foreground">Extractions</span>
              </div>
            </div>
          </motion.div>

          {/* Accuracy trend */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold">Extraction accuracy</h3>
                <p className="text-xs text-muted-foreground mt-0.5">6-month trend</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-emerald-500">96.2%</p>
                <p className="text-[10px] text-muted-foreground">Current</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={mockChartData.confidenceTrend}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} domain={[88, 100]} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} fill="url(#accGrad)" name="Accuracy" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Processing time */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold">Processing time</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Average latency (seconds)</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">2.1s</p>
                <p className="text-[10px] text-muted-foreground">Current avg</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={processingTimeData}>
                <defs>
                  <linearGradient id="ptGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2} fill="url(#ptGrad)" name="Avg (s)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

        </div>
      </div>
    </MainLayout>
  );
}
