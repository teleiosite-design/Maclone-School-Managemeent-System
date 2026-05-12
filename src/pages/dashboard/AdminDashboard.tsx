import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Users, GraduationCap, UserCog, FileText,
  Banknote, CalendarCheck, BookOpenCheck, Megaphone, Calendar,
  ShieldCheck, Wallet, TrendingUp, Loader2
} from "lucide-react";

const nav = [
  { to: "/dashboard/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { to: "/dashboard/admin/students", label: "Students", icon: <GraduationCap size={18} /> },
  { to: "/dashboard/admin/teachers", label: "Teachers", icon: <UserCog size={18} /> },
  { to: "/dashboard/admin/admissions", label: "Admissions", icon: <FileText size={18} /> },
  { to: "/dashboard/admin/fees", label: "Fee Management", icon: <Banknote size={18} /> },
  { to: "/dashboard/admin/attendance", label: "Attendance", icon: <CalendarCheck size={18} /> },
  { to: "/dashboard/admin/academics", label: "Academics", icon: <BookOpenCheck size={18} /> },
  { to: "/dashboard/admin/timetable", label: "Timetable", icon: <Calendar size={18} /> },
  { to: "/dashboard/admin/announcements", label: "Announcements", icon: <Megaphone size={18} /> },
];

export default function AdminLayout() {
  const { profile } = useAuth();
  return <DashboardLayout role="Admin" userName={profile?.full_name ?? "Super Admin"} userMeta="Administrator" nav={nav} />;
}

export function AdminDashboard() {
  const navigate = useNavigate();

  // REAL DATA FETCHING
  const { data: studentCount = 0, isLoading: loadingStudents } = useQuery<number>({
    queryKey: ["count-students"],
    queryFn: async () => {
      const { count } = await supabase.from("students").select("*", { count: "exact", head: true });
      return count ?? 0;
    }
  });

  const { data: teacherCount = 0, isLoading: loadingTeachers } = useQuery<number>({
    queryKey: ["count-teachers"],
    queryFn: async () => {
      const { count } = await supabase.from("teachers").select("*", { count: "exact", head: true });
      return count ?? 0;
    }
  });

  const { data: recentActivity = [] } = useQuery<any[]>({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      // Get recent announcements and attendance logs
      const { data: ann } = await supabase.from("announcements").select("title, created_at, profiles(full_name)").order("created_at", { ascending: false }).limit(3);
      const { data: att } = await supabase.from("attendance_logs").select("status, check_in, teachers(profiles(full_name))").order("check_in", { ascending: false }).limit(3);
      
      const activities = [
        ...((ann as any[])?.map(a => ({ name: a.profiles?.full_name || "Admin", action: a.title, time: a.created_at })) || []),
        ...((att as any[])?.map(a => ({ name: a.teachers?.profiles?.full_name || "Staff", action: `Clocked in (${a.status})`, time: a.check_in })) || [])
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

      return activities;
    }
  });

  const { data: feeStats = { total: 0, pending: 0 } } = useQuery<any>({
    queryKey: ["fee-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("fee_records").select("amount, status");
      const total = (data as any[])?.filter(f => f.status === 'paid').reduce((acc, f) => acc + Number(f.amount), 0) || 0;
      const pending = (data as any[])?.filter(f => f.status === 'pending').length || 0;
      return { total, pending };
    }
  });

  const fmtTime = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff/60)} hours ago`;
    return new Date(iso).toLocaleDateString();
  };

  const attendance = [62, 70, 74, 80, 92]; // Keeping visual charts for now, but wiring labels
  const months = ["May 1", "May 8", "May 15", "May 22", "May 29"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-black text-navy">Dashboard Overview</h1>
          <p className="text-muted-foreground text-sm">Welcome back — here's what's happening today.</p>
        </div>
        {(loadingStudents || loadingTeachers) && <Loader2 className="animate-spin text-navy" size={20} />}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={22} />} label="Total Students" value={loadingStudents ? "..." : studentCount.toString()} tone="navy" />
        <StatCard icon={<GraduationCap size={22} />} label="Teachers" value={loadingTeachers ? "..." : teacherCount.toString()} tone="green" />
        <StatCard icon={<ShieldCheck size={22} />} label="Pass Rate" value="92%" tone="gold" />
        <StatCard icon={<Wallet size={22} />} label="Fees Collected" value={`₦${(feeStats.total / 1000000).toFixed(1)}M`} tone="purple" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
          {/* Attendance Chart */}
          <div className="bg-white border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy">Attendance Overview</h3>
              <span className="text-xs text-muted-foreground">This Month</span>
            </div>
            <svg viewBox="0 0 320 160" className="w-full h-40">
              {[0, 25, 50, 75, 100].map((y, i) => (
                <line key={i} x1="30" y1={20 + i * 30} x2="310" y2={20 + i * 30} stroke="#e5e7eb" strokeDasharray="2 4" />
              ))}
              <polyline fill="none" stroke="hsl(var(--navy))" strokeWidth="2.5" points={attendance.map((v, i) => `${30 + i * 70},${140 - v}`).join(" ")} />
              {attendance.map((v, i) => (
                <circle key={i} cx={30 + i * 70} cy={140 - v} r="4" fill="hsl(var(--gold))" stroke="hsl(var(--navy))" strokeWidth="2" />
              ))}
              {months.map((m, i) => (
                <text key={i} x={30 + i * 70} y="158" fontSize="9" textAnchor="middle" fill="#6b7280">{m}</text>
              ))}
            </svg>
          </div>

          {/* Fees Collection */}
          <div className="bg-white border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy">Recent Fee Stats</h3>
              <span className="text-xs text-muted-foreground">Persisted in DB</span>
            </div>
            <div className="flex items-end justify-between h-40 gap-2">
              <div className="flex-1 bg-navy/10 rounded-t h-[40%] group relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-navy opacity-0 group-hover:opacity-100 transition">₦{feeStats.total}</div>
                <div className="h-full w-full bg-navy" style={{ height: '100%' }}></div>
                <div className="text-[10px] mt-2 text-center text-muted-foreground">Collected</div>
              </div>
              <div className="flex-1 bg-amber-100 rounded-t h-[20%] group relative">
                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-amber-600 opacity-0 group-hover:opacity-100 transition">{feeStats.pending} Records</div>
                <div className="h-full w-full bg-amber-400" style={{ height: '100%' }}></div>
                <div className="text-[10px] mt-2 text-center text-muted-foreground">Pending</div>
              </div>
            </div>
          </div>

          {/* Recent Activity (Live from Supabase) */}
          <div className="bg-white border border-border p-5 md:col-span-2">
            <h3 className="font-bold text-navy mb-4">Recent System Activity</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {recentActivity.length === 0 ? (
                <div className="text-xs text-muted-foreground py-4">No recent activity detected.</div>
              ) : (
                recentActivity.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm p-2 border-b border-border/50 last:border-0">
                    <div className="w-8 h-8 bg-navy text-gold flex items-center justify-center text-xs font-bold shrink-0">
                      {(r.name as string)[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-navy font-bold truncate">{r.action}</div>
                      <div className="text-[11px] text-muted-foreground">{r.name as string}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground whitespace-nowrap">{fmtTime(r.time as string)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="bg-white border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy">System Health</h3>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5">ONLINE</span>
            </div>
            <div className="text-xs text-muted-foreground mb-1">Database Performance</div>
            <div className="font-display text-4xl font-black text-emerald-600 my-2 flex items-center gap-2">
              99.9% <TrendingUp size={20} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-border">
              <div><div className="text-[11px] text-muted-foreground">Live Sessions</div><div className="font-bold text-navy text-xl">1</div></div>
              <div><div className="text-[11px] text-muted-foreground">API Latency</div><div className="font-bold text-navy text-xl">24ms</div></div>
            </div>
          </div>

          <div className="bg-white border border-border p-5">
            <h3 className="font-bold text-navy mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => navigate("/dashboard/admin/students")} className="bg-navy text-gold py-2.5 text-xs font-bold tracking-wider hover:bg-navy/90 text-left px-4 flex justify-between items-center">
                ENROL NEW STUDENT <Users size={14} />
              </button>
              <button onClick={() => navigate("/dashboard/admin/announcements")} className="bg-navy text-gold py-2.5 text-xs font-bold tracking-wider hover:bg-navy/90 text-left px-4 flex justify-between items-center">
                POST ANNOUNCEMENT <Megaphone size={14} />
              </button>
              <button onClick={() => navigate("/dashboard/admin/attendance")} className="border border-navy text-navy py-2.5 text-xs font-bold tracking-wider hover:bg-navy hover:text-gold text-left px-4 flex justify-between items-center">
                VIEW ATTENDANCE <CalendarCheck size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
