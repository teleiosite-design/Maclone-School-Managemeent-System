import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Users, ClipboardCheck, Award, CreditCard,
  MessageSquare, Calendar, FileText, Settings,
  TrendingUp, Wallet, Megaphone, Loader2
} from "lucide-react";

const nav = [
  { to: "/dashboard/parent", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { to: "/dashboard/parent/children", label: "My Children", icon: <Users size={18} /> },
  { to: "/dashboard/parent/attendance", label: "Attendance", icon: <ClipboardCheck size={18} /> },
  { to: "/dashboard/parent/results", label: "Results", icon: <Award size={18} /> },
  { to: "/dashboard/parent/fees", label: "Fees & Payments", icon: <CreditCard size={18} /> },
  { to: "/dashboard/parent/messages", label: "Messages", icon: <MessageSquare size={18} /> },
  { to: "/dashboard/parent/calendar", label: "Calendar", icon: <Calendar size={18} /> },
  { to: "/dashboard/parent/reports", label: "Reports", icon: <FileText size={18} /> },
  { to: "/dashboard/parent/settings", label: "Settings", icon: <Settings size={18} /> },
];

export default function ParentLayout() {
  const { profile } = useAuth();
  return <DashboardLayout role="Parent" userName={profile?.full_name ?? "Parent"} userMeta="Guardian Portal" nav={nav} />;
}

export function ParentDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // REAL DATA
  const { data: parentData, isLoading: loadingParent } = useQuery<any>({
    queryKey: ["parent-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("parents").select("id").eq("profile_id", user?.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: announcements = [] } = useQuery<any[]>({
    queryKey: ["announcements-parent"],
    queryFn: async () => {
      const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(3);
      return data ?? [];
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-3xl font-black text-navy">Parent Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {profile?.full_name} 👋</p>
        </div>
        {loadingParent && <Loader2 className="animate-spin text-navy" size={20} />}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={22} />} label="My Children" value="--" hint="Enrolled" tone="navy" />
        <StatCard icon={<ClipboardCheck size={22} />} label="Avg. Attendance" value="--" tone="green" />
        <StatCard icon={<TrendingUp size={22} />} label="Avg. Performance" value="--" tone="purple" />
        <StatCard icon={<Wallet size={22} />} label="Fee Balance" value="₦--" hint="Check Fees" tone="gold" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-border p-5">
            <h3 className="font-bold text-navy mb-4">Latest Announcements</h3>
            <div className="space-y-4">
              {announcements.length === 0 ? (
                <div className="text-sm text-muted-foreground italic p-8 text-center border-2 border-dashed border-border">
                  No active announcements for parents.
                </div>
              ) : (
                announcements.map((a, i) => (
                  <div key={i} className="flex gap-4 p-4 border border-border hover:shadow-lg transition group">
                    <div className="w-10 h-10 bg-navy text-gold flex items-center justify-center shrink-0">
                      <Megaphone size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-navy text-sm group-hover:text-gold transition">{a.title}</h4>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{a.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy">Child Performance Overview</h3>
              <Link to="/dashboard/parent/results" className="text-xs text-navy font-semibold hover:text-gold">View Results</Link>
            </div>
            <div className="p-8 text-center border-2 border-dashed border-border text-muted-foreground text-sm italic">
               Connect your children's profiles to see their live grades and attendance records here.
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-navy text-white p-6 shadow-xl">
            <p className="text-gold text-[10px] font-bold tracking-[0.2em] uppercase mb-1">Payments</p>
            <div className="font-display text-3xl font-black mb-1">₦0.00</div>
            <div className="text-white/60 text-[11px]">Outstanding balance for this session.</div>
            <button onClick={() => navigate("/dashboard/parent/fees")} className="w-full mt-6 bg-gold text-navy py-3 font-bold tracking-widest text-xs hover:bg-white transition uppercase">GO TO FEE PORTAL →</button>
          </div>

          <div className="bg-white border border-border p-5">
            <h3 className="font-bold text-navy mb-3">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => navigate("/dashboard/parent/messages")} className="bg-navy text-gold py-3 text-xs font-bold tracking-wider hover:bg-navy/90 text-left px-4 flex justify-between items-center transition">
                MESSAGE TEACHER <MessageSquare size={16} />
              </button>
              <button onClick={() => navigate("/dashboard/parent/calendar")} className="bg-navy text-gold py-3 text-xs font-bold tracking-wider hover:bg-navy/90 text-left px-4 flex justify-between items-center transition">
                SCHOOL CALENDAR <Calendar size={16} />
              </button>
              <button onClick={() => navigate("/dashboard/parent/reports")} className="border border-navy text-navy py-3 text-xs font-bold tracking-wider hover:bg-navy hover:text-gold text-left px-4 flex justify-between items-center transition">
                DOWNLOAD REPORTS <FileText size={16} />
              </button>
            </div>
          </div>

          <div className="bg-white border border-border p-5">
            <h3 className="font-bold text-navy mb-3">Upcoming Events</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gold/20 flex flex-col items-center justify-center text-navy shrink-0">
                  <span className="text-[9px] font-bold">JUN</span>
                  <span className="text-sm font-black leading-none">10</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-navy">Mid-Term Break</div>
                  <div className="text-[10px] text-muted-foreground">School holiday begins</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
