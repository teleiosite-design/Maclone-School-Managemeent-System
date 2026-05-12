import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, BookOpen, Users, FileText,
  Award, Calendar, MessageSquare, BarChart3, Settings,
  CheckCircle2, ClipboardCheck, FileEdit, Megaphone, Clock, TimerReset,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

const nav = [
  { to: "/dashboard/teacher", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { to: "/dashboard/teacher/clockin-clockout", label: "My Attendance", icon: <TimerReset size={18} /> },
  { to: "/dashboard/teacher/classes", label: "My Classes", icon: <BookOpen size={18} /> },
  { to: "/dashboard/teacher/students", label: "Students", icon: <Users size={18} /> },
  { to: "/dashboard/teacher/attendance", label: "Attendance", icon: <ClipboardCheck size={18} /> },
  { to: "/dashboard/teacher/assignments", label: "Assignments", icon: <FileText size={18} /> },
  { to: "/dashboard/teacher/exams", label: "Exams & Grading", icon: <Award size={18} /> },
  { to: "/dashboard/teacher/timetable", label: "Timetable", icon: <Calendar size={18} /> },
  { to: "/dashboard/teacher/messages", label: "Messages", icon: <MessageSquare size={18} /> },
  { to: "/dashboard/teacher/reports", label: "Reports", icon: <BarChart3 size={18} /> },
  { to: "/dashboard/teacher/settings", label: "Settings", icon: <Settings size={18} /> },
];

export default function TeacherLayout() {
  const { profile } = useAuth();
  return <DashboardLayout role="Teacher" userName={profile?.full_name ?? "Teacher"} userMeta={profile?.role ?? "Staff"} nav={nav} />;
}

export function TeacherDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  // REAL DATA
  const { data: teacherData } = useQuery<any>({
    queryKey: ["teacher-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("teachers").select("id, employee_id, subjects").eq("profile_id", user?.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: attendanceLog, isLoading: loadingStatus } = useQuery<any>({
    queryKey: ["attendance-status", teacherData?.id],
    queryFn: async () => {
      const { data } = await supabase.from("attendance_logs").select("*").eq("teacher_id", teacherData?.id).eq("date", today).order("check_in", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    enabled: !!teacherData?.id
  });

  const clockMutation = useMutation({
    mutationFn: async () => {
      if (!teacherData?.id) return;
      const isClockedInNow = attendanceLog && !(attendanceLog as any).check_out;
      
      if (isClockedInNow) {
        await (supabase.from("attendance_logs") as any).update({ check_out: new Date().toISOString() }).eq("id", (attendanceLog as any).id);
      } else {
        await (supabase.from("attendance_logs") as any).insert({ teacher_id: teacherData.id, check_in: new Date().toISOString(), date: today, status: "present" });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-status"] });
      toast.success(attendanceLog && (attendanceLog as any).check_out ? "Clocked in successfully" : "Clocked out successfully");
    }
  });

  const { data: announcements = [] } = useQuery<any[]>({
    queryKey: ["announcements-teacher"],
    queryFn: async () => {
      const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(3);
      return data ?? [];
    }
  });

  const isClockedIn = !!(attendanceLog && !(attendanceLog as any).check_out);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-display text-3xl font-black text-navy">Teacher Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {profile?.full_name} 👋</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-muted-foreground font-bold tracking-wider">STATUS</div>
            <div className={`text-sm font-bold ${isClockedIn ? "text-emerald-600" : "text-amber-600"}`}>
              {loadingStatus ? "..." : (isClockedIn ? "Clocked In" : "Clocked Out")}
            </div>
          </div>
          <button 
            disabled={clockMutation.isPending || !teacherData}
            onClick={() => clockMutation.mutate()}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-wider transition disabled:opacity-50 ${
              isClockedIn 
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200" 
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {clockMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
            {isClockedIn ? "CLOCK OUT" : "CLOCK IN"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen size={22} />} label="Total Classes" value={teacherData?.subjects?.length?.toString() || "0"} tone="navy" />
        <StatCard icon={<Users size={22} />} label="Student Reach" value="--" tone="green" />
        <StatCard icon={<ClipboardCheck size={22} />} label="My Attendance" value={attendanceLog ? "Present" : "None"} tone="gold" />
        <StatCard icon={<FileText size={22} />} label="Assignments" value="--" tone="orange" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-border p-5">
            <h3 className="font-bold text-navy mb-4">Recent Announcements</h3>
            <div className="space-y-4">
              {announcements.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">No announcements to display.</div>
              ) : (
                announcements.map((a, i) => (
                  <div key={i} className="border-l-4 border-gold bg-secondary/20 p-4">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-navy text-sm">{a.title}</h4>
                      <span className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{a.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-border p-5">
            <h3 className="font-bold text-navy mb-4">My Subject Load</h3>
            <div className="flex flex-wrap gap-2">
              {(teacherData as any)?.subjects?.map((s: string) => (
                <div key={s} className="bg-navy text-gold px-4 py-2 text-xs font-bold tracking-widest uppercase border border-navy shadow-[4px_4px_0px_0px_rgba(28,43,72,0.1)]">
                  {s}
                </div>
              ))}
              {(!(teacherData as any)?.subjects || (teacherData as any).subjects.length === 0) && (
                <div className="text-sm text-muted-foreground">No subjects assigned yet.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-border p-5">
            <h3 className="font-bold text-navy mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => navigate("/dashboard/teacher/attendance")} className="bg-navy text-gold py-2.5 text-xs font-bold tracking-wider flex items-center justify-between px-4 hover:bg-navy/90">
                MARK ATTENDANCE <CheckCircle2 size={14} />
              </button>
              <button onClick={() => navigate("/dashboard/teacher/assignments")} className="bg-navy text-gold py-2.5 text-xs font-bold tracking-wider flex items-center justify-between px-4 hover:bg-navy/90">
                CREATE ASSIGNMENT <FileEdit size={14} />
              </button>
              <button onClick={() => navigate("/dashboard/teacher/messages")} className="border border-navy text-navy py-2.5 text-xs font-bold tracking-wider flex items-center justify-between px-4 hover:bg-navy hover:text-gold">
                MESSAGES <MessageSquare size={14} />
              </button>
            </div>
          </div>

          <div className="bg-white border border-border p-5">
             <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy">Class Progress</h3>
              <BarChart3 size={16} className="text-muted-foreground" />
            </div>
            <div className="space-y-4">
              <div className="text-xs text-center text-muted-foreground py-8 border-2 border-dashed border-border">
                Live academic tracking coming soon in Phase 4.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
