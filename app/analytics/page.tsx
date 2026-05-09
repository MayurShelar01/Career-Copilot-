"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CardSkeleton } from "@/components/shared/Skeleton";
import { storage } from "@/lib/storage/storage";
import { ApplicationStats } from "@/types";
import { LockKeyhole } from "lucide-react";
import {
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
  LabelList
} from "recharts";

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number | string }[];
  label?: string;
}

// Shared Tooltip Styling Component
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "#1A1A1A",
          border: "1px solid #262626",
          borderRadius: "8px",
          color: "#FAFAFA",
          fontSize: "13px",
          padding: "10px",
        }}
      >
        <p style={{ color: "#A1A1AA", marginBottom: "4px" }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: "#FAFAFA", margin: 0 }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Colors for status mapping
const statusColors: Record<string, string> = {
  Saved: "#8B5CF6", // violet-500
  Applied: "#3B82F6", // blue-500
  Interviewing: "#F59E0B", // amber-500
  Offer: "#10B981", // emerald-500
  Rejected: "#EF4444", // red-500
};

const matchColors: Record<string, string> = {
  Strong: "#10B981",
  Partial: "#F59E0B",
  Weak: "#EF4444",
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const data = await storage.getApplicationStats();
        if (mounted) {
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
      <div className="bg-[#111111] border border-[#262626] rounded-xl p-10 max-w-md w-full flex flex-col items-center space-y-6">
        <LockKeyhole className="w-12 h-12 text-violet-500" />
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Your analytics are locked</h2>
          <p className="text-muted-foreground text-sm">
            Apply to 3+ jobs and your analytics will unlock automatically.
          </p>
        </div>
        <Link href="/parse">
          <button className="bg-violet-500 hover:bg-violet-600 text-white font-medium py-2.5 px-6 rounded-full transition-colors">
            Parse a JD →
          </button>
        </Link>
        <p className="text-xs text-muted-foreground">
          You have {stats?.totalApplications || 0} applications saved.
        </p>
      </div>
    </div>
  );

  const renderLoadingState = () => (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      <div className="space-y-2">
        <div className="h-8 bg-[#262626] rounded w-64 animate-pulse" />
        <div className="h-4 bg-[#262626] rounded w-48 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-[300px]">
            <CardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        {renderLoadingState()}
      </main>
    );
  }

  if (!stats || stats.totalApplications < 3) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        {renderEmptyState()}
      </main>
    );
  }

  const funnelChartData = [
    {
      name: "Funnel",
      Saved: stats.funnelData.saved,
      Applied: stats.funnelData.applied,
      Interviewing: stats.funnelData.interviewing,
      Offer: stats.funnelData.offer,
      Rejected: stats.funnelData.rejected,
    },
  ];

  const avgDaysData = stats.avgDaysPerStage.map((s) => ({
    ...s,
    fill: statusColors[s.stage] || "#A78BFA",
  }));

  const pieData = stats.matchLabelDistribution.map((m) => ({
    name: m.label,
    value: m.count,
    fill: matchColors[m.label] || "#A78BFA",
  }));

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 w-full">
        
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Your Job Search Analytics</h1>
          <p className="text-muted-foreground">Patterns in your applications</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111111] border border-[#262626] rounded-xl p-6 flex flex-col justify-between">
            <span className="text-xs font-semibold tracking-wider text-[#A1A1AA] uppercase">Total Applications</span>
            <span className="text-3xl font-bold text-[#FAFAFA] mt-2 mb-1">{stats.totalApplications}</span>
            <span className="text-xs text-[#A1A1AA]">Across {stats.topCompanies.length} companies</span>
          </div>

          <div className="bg-[#111111] border border-[#262626] rounded-xl p-6 flex flex-col justify-between">
            <span className="text-xs font-semibold tracking-wider text-[#A1A1AA] uppercase">Active Pipeline</span>
            <span className="text-3xl font-bold text-[#FAFAFA] mt-2 mb-1">{stats.activePipeline}</span>
            <span className="text-xs text-[#A1A1AA]">{stats.activePipeline} not yet decided</span>
          </div>

          <div className="bg-[#111111] border border-[#262626] rounded-xl p-6 flex flex-col justify-between">
            <span className="text-xs font-semibold tracking-wider text-[#A1A1AA] uppercase">Response Rate</span>
            <span className="text-3xl font-bold text-[#FAFAFA] mt-2 mb-1">{stats.responseRate.toFixed(1)}%</span>
            <span className="text-xs text-[#A1A1AA]">Past initial application</span>
          </div>

          <div className="bg-[#111111] border border-[#262626] rounded-xl p-6 flex flex-col justify-between">
            <span className="text-xs font-semibold tracking-wider text-[#A1A1AA] uppercase">Days Since Last</span>
            <span className="text-3xl font-bold text-[#FAFAFA] mt-2 mb-1">
              {stats.daysSinceLastApplication === null 
                ? "—" 
                : stats.daysSinceLastApplication === 0 
                  ? "Today" 
                  : stats.daysSinceLastApplication === 1 
                    ? "Yesterday" 
                    : `${stats.daysSinceLastApplication} days`}
            </span>
            {stats.daysSinceLastApplication !== null && (
              <span className="text-xs text-[#A1A1AA]">
                {stats.daysSinceLastApplication <= 7 ? "On a streak" : "Keep momentum going"}
              </span>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Apps per Week */}
          <div className="bg-[#111111] border border-[#262626] rounded-xl p-6 h-[350px] flex flex-col">
            <h3 className="text-sm font-semibold text-foreground mb-6">Applications per Week</h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.applicationsPerWeek} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="weekStart" stroke="#52525B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.slice(5)} />
                  <YAxis stroke="#52525B" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#262626', opacity: 0.4 }} />
                  <Bar dataKey="count" name="Applications" fill="#A78BFA" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Funnel */}
          <div className="bg-[#111111] border border-[#262626] rounded-xl p-6 h-[350px] flex flex-col">
            <h3 className="text-sm font-semibold text-foreground mb-6">Funnel</h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelChartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="Saved" stackId="a" fill={statusColors.Saved} radius={[4, 0, 0, 4]}>
                     <LabelList dataKey="Saved" position="center" fill="#fff" fontSize={12} formatter={(val: unknown) => val && Number(val) > 0 ? String(val) : ''} />
                  </Bar>
                  <Bar dataKey="Applied" stackId="a" fill={statusColors.Applied}>
                     <LabelList dataKey="Applied" position="center" fill="#fff" fontSize={12} formatter={(val: unknown) => val && Number(val) > 0 ? String(val) : ''} />
                  </Bar>
                  <Bar dataKey="Interviewing" stackId="a" fill={statusColors.Interviewing}>
                     <LabelList dataKey="Interviewing" position="center" fill="#fff" fontSize={12} formatter={(val: unknown) => val && Number(val) > 0 ? String(val) : ''} />
                  </Bar>
                  <Bar dataKey="Offer" stackId="a" fill={statusColors.Offer}>
                     <LabelList dataKey="Offer" position="center" fill="#fff" fontSize={12} formatter={(val: unknown) => val && Number(val) > 0 ? String(val) : ''} />
                  </Bar>
                  <Bar dataKey="Rejected" stackId="a" fill={statusColors.Rejected} radius={[0, 4, 4, 0]}>
                     <LabelList dataKey="Rejected" position="center" fill="#fff" fontSize={12} formatter={(val: unknown) => val && Number(val) > 0 ? String(val) : ''} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Avg Days/Stage */}
          <div className="bg-[#111111] border border-[#262626] rounded-xl p-6 h-[350px] flex flex-col">
            <h3 className="text-sm font-semibold text-foreground mb-6">Avg Days per Stage</h3>
            <div className="flex-1">
              {stats.avgDaysPerStage.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Not enough data across stages yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={avgDaysData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                    <XAxis type="number" stroke="#52525B" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="stage" stroke="#52525B" fontSize={12} tickLine={false} axisLine={false} width={80} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#262626', opacity: 0.4 }} />
                    <Bar dataKey="days" name="Avg Days" radius={[0, 4, 4, 0]}>
                      {avgDaysData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top 5 Companies */}
          <div className="bg-[#111111] border border-[#262626] rounded-xl p-6 h-[350px] flex flex-col">
            <h3 className="text-sm font-semibold text-foreground mb-6">Top Companies</h3>
            <div className="flex-1">
              {stats.topCompanies.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No companies recorded yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topCompanies} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                    <XAxis type="number" stroke="#52525B" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="company" stroke="#52525B" fontSize={12} tickLine={false} axisLine={false} width={100} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#262626', opacity: 0.4 }} />
                    <Bar dataKey="count" name="Applications" fill="#A78BFA" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Match Distribution */}
          <div className="bg-[#111111] border border-[#262626] rounded-xl p-6 h-[350px] flex flex-col lg:col-span-2 max-w-2xl mx-auto w-full">
            <h3 className="text-sm font-semibold text-foreground mb-2 text-center">Match Distribution</h3>
            <div className="flex-1 relative">
              {stats.matchLabelDistribution.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No gap analyses found</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-[#FAFAFA]">
                      {pieData.reduce((acc, curr) => acc + curr.value, 0)}
                    </span>
                    <span className="text-xs text-[#A1A1AA] uppercase tracking-wider">Total</span>
                  </div>
                  {/* Legend below */}
                  <div className="flex items-center justify-center gap-6 mt-2 pb-2">
                    {pieData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                        <span className="text-sm text-[#FAFAFA]">{entry.name}</span>
                        <span className="text-sm text-[#A1A1AA]">({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
