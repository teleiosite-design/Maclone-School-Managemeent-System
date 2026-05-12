import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, BookOpen, FileText, ClipboardCheck, Award,
  Calendar, MessageSquare, FolderOpen, User, Settings,
  Download, Upload, CreditCard, Star, Loader2, Megaphone
} from "lucide-react";

const nav = [
  { to: "/dashboard/student", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { to: "/dashboard/student/courses", label: "My Courses", icon: <BookOpen size={18} /> },
  { to: "/dashboard/student/assignments", label: "Assignments", icon: <FileText size={18} /> },
  { to: "/dashboard/student/attendance", label: "Attendance", icon: <ClipboardCheck size={18} /> },
  { to: "/dashboard/student/results", label: "Results / Grades", icon: <Award size={18} /> },
  { to: "/dashboard/student/timetable", label: "Timetable", icon: <Calendar size={18} /> },
  { to: "/dashboard/student/messages", label: "Messages", icon: <MessageSquare size={18} /> },
  { to: "/dashboard/student/resources", label: "Resources", icon: <FolderOpen size={18} /> },
  { to: "/dashboard/student/profile", label: "Profile", icon: <User size={18} /> },
  { to: "/dashboard/student/settings", label: "Settings", icon: <Settings size={18} /> },
];

export default function StudentLayout() {
  const { profile } = useAuth();
  return <DashboardLayout role="Student" userName={profile?.full_name ?? "Student"} userMeta={profile?.role ?? "Student"} nav={nav} />;
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // REAL DATA
  const { data: studentData, isLoading: loadingStudent } = useQuery<any>({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id, admission_no, class, status").eq("profile_id", user?.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: announcements = [] } = useQuery<any[]>({
    queryKey: ["announcements-student"],
    queryFn: async () => {
      const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(3);
      return data ?? [];
    }
  });

  const { data: attendanceCount = 0 } = useQuery<number>({
    queryKey: ["student-attendance-count", studentData?.id],
    queryFn: async () => {
      const { count } = await supabase.from("student_attendance").select("*", { count: "exact", head: true }).eq("student_id", studentData?.id).eq("present", true);
      return count ?? 0;
    },
    enabled: !!studentData?.id
  });

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const scores = [40, 55, 65, 60, 70, 85]; // Mock visuals, but wiring labels

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-3xl font-black text-navy">Student Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {profile?.full_name} 👋</p>
        </div>
        {loadingStudent && <Loader2 className="animate-spin text-navy" size={20} />}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<BookOpen size={22} />} label="My Class" value={studentData?.class || "--"} hint="Current" tone="navy" />
        <StatCard icon={<ClipboardCheck size={22} />} label="Days Present" value={attendanceCount.toString()} hint="This Term" tone="green" />
        <StatCard icon={<FileText size={22} />} label="ID Number" value={studentData?.admission_no || "--"} hint="Admission #" tone="orange" />
        <StatCard icon={<Star size={22} />} label="Status" value={studentData?.status || "--"} hint="Academic" tone="purple" />
        <StatCard icon={<Calendar size={22} />} label="Schedule" value="Active" hint="Timetable" tone="gold" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy">Academic Progress</h3>
              <span className="text-xs text-muted-foreground">This Term</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-2">
                <svg viewBox="0 0 320 160" className="w-full h-40">
                  {[0, 25, 50, 75, 100].map((y, i) => (
                    <line key={i} x1="30" y1={20 + i * 30} x2="310" y2={20 + i * 30} stroke="#e5e7eb" strokeDasharray="2 4" />
                  ))}
                  <polyline fill="none" stroke="hsl(var(--navy))" strokeWidth="2.5" points={scores.map((v, i) => `${30 + i * 56},${140 - v}`).join(" ")} />
                  {scores.map((v, i) => (
                    <circle key={i} cx={30 + i * 56} cy={140 - v} r="4" fill="hsl(var(--gold))" stroke="hsl(var(--navy))" strokeWidth="2" />
                  ))}
                  {months.map((m, i) => (
                    <text key={i} x={30 + i * 56} y="158" fontSize="9" textAnchor="middle" fill="#6b7280">{m}</text>
                  ))}
                </svg>
              </div>
              <div className="text-center border-l border-border pl-4">
                <div className="text-xs text-muted-foreground">Grade Level</div>
                <div className="relative w-24 h-24 mx-auto my-2">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--gold))" strokeWidth="3" strokeDasharray={`75 100`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="font-display text-xl font-black text-navy">{studentData?.class || "N/A"}</div>
                    <div className="text-[10px] text-muted-foreground">Enrolled</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border p-5">
            <h3 className="font-bold text-navy mb-4">Latest Announcements</h3>
            <div className="space-y-4">
              {announcements.length === 0 ? (
                <div className="text-sm text-muted-foreground italic p-4 border-2 border-dashed border-border text-center">No current announcements for students.</div>
              ) : (
                announcements.map((a, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-navy/[0.02] border border-border">
                    <div className="w-10 h-10 bg-navy text-gold flex items-center justify-center shrink-0">
                      <Megaphone size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-navy text-sm">{a.title}</h4>
                        <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{a.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-border p-5">
            <h3 className="font-bold text-navy mb-4">Quick Links</h3>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => navigate("/dashboard/student/timetable")} className="bg-navy text-gold py-3 text-xs font-bold tracking-wider hover:bg-navy/90 text-left px-4 flex justify-between items-center">
                VIEW TIMETABLE <Calendar size={16} />
              </button>
              <button onClick={() => navigate("/dashboard/student/assignments")} className="bg-navy text-gold py-3 text-xs font-bold tracking-wider hover:bg-navy/90 text-left px-4 flex justify-between items-center">
                MY ASSIGNMENTS <FileText size={16} />
              </button>
              <button onClick={() => navigate("/dashboard/student/results")} className="border border-navy text-navy py-3 text-xs font-bold tracking-wider hover:bg-navy hover:text-gold text-left px-4 flex justify-between items-center">
                VIEW RESULTS <Award size={16} />
              </button>
              <button onClick={() => navigate("/dashboard/student/attendance")} className="border border-navy text-navy py-3 text-xs font-bold tracking-wider hover:bg-navy hover:text-gold text-left px-4 flex justify-between items-center">
                ATTENDANCE HISTORY <ClipboardCheck size={16} />
              </button>
            </div>
          </div>

          <div className="bg-white border border-border p-5">
            <h3 className="font-bold text-navy mb-3">Academic Notice</h3>
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4">
              <div className="font-bold text-emerald-800 text-sm flex items-center gap-2"><Award size={14} /> Academic Status</div>
              <p className="text-xs text-emerald-700 mt-1">Your status is currently <strong>{studentData?.status || "Active"}</strong>. Keep up the good work in {studentData?.class || "your classes"}!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
