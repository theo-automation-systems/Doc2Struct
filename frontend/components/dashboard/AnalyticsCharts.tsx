"use client";

import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { mockChartData } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-xl shadow-lg p-3">
        <p className="text-xs font-semibold text-foreground mb-1.5">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-muted-foreground capitalize">{entry.name}:</span>
            <span className="text-xs font-semibold text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function WeeklyActivityChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-2xl p-5 border border-border shadow-sm"
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Weekly Activity</h3>
        <p className="text-xs text-muted-foreground">Documents processed this week</p>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={mockChartData.weeklyActivity} barSize={12} barGap={3}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="documents" fill="#6366f1" radius={[4, 4, 0, 0]} name="Documents" />
          <Bar dataKey="extractions" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Extractions" />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
          <span className="text-xs text-muted-foreground">Documents</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-violet-500" />
          <span className="text-xs text-muted-foreground">Extractions</span>
        </div>
      </div>
    </motion.div>
  );
}

export function AccuracyTrendChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-card rounded-2xl p-5 border border-border shadow-sm"
    >
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Extraction Accuracy</h3>
            <p className="text-xs text-muted-foreground">6-month accuracy trend</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-emerald-500">96.2%</p>
            <p className="text-[10px] text-muted-foreground">Current</p>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={mockChartData.confidenceTrend}>
          <defs>
            <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            domain={[88, 100]}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="accuracy"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#accuracyGradient)"
            name="Accuracy"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function DocumentTypesChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-card rounded-2xl p-5 border border-border shadow-sm"
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Document Types</h3>
        <p className="text-xs text-muted-foreground">Distribution by category</p>
      </div>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={mockChartData.documentTypes}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={55}
              paddingAngle={3}
              dataKey="value"
            >
              {mockChartData.documentTypes.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {mockChartData.documentTypes.map((type, i) => {
            const total = mockChartData.documentTypes.reduce((a, b) => a + b.value, 0);
            const pct = Math.round((type.value / total) * 100);
            return (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: type.color }} />
                <span className="text-xs text-muted-foreground flex-1">{type.name}</span>
                <span className="text-xs font-semibold text-foreground">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
