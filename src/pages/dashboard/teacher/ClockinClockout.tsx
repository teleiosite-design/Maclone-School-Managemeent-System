import { useEffect, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, Loader2, TriangleAlert } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function TeacherClockInClockOut() {
  const now = useLiveClock();
  const { user } = useAuth();
  const qc = useQueryClient();
  const todayStr = now.toISOString().split("T")[0];

  // Fetch teacher record
  const { data: teacher } = useQuery<any>({
    queryKey: ["teacher-record", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("id")
        .eq("profile_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch today's log
  const { data: todayLog, isLoading } = useQuery<any>({
    queryKey: ["attendance-log-today", teacher?.id, todayStr],
    queryFn: async () => {
      if (!teacher?.id) return null;
      const { data } = await (supabase
        .from("attendance_logs")
        .select("*")
        .eq("teacher_id", teacher.id)
        .eq("date", todayStr)
        .maybeSingle() as any);
      return data;
    },
    enabled: !!teacher?.id,
  });

  // Fetch history (last 14 days)
  const { data: history = [] } = useQuery<any[]>({
    queryKey: ["attendance-history", teacher?.id],
    queryFn: async () => {
      if (!teacher?.id) return [];
      const { data, error } = await (supabase
        .from("attendance_logs")
        .select("*")
        .eq("teacher_id", teacher.id)
        .order("date", { ascending: false })
        .limit(14) as any);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!teacher?.id,
  });

  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!teacher?.id) throw new Error("Teacher record not found");
      const checkInTime = new Date().toISOString();
      const hour = new Date().getHours();
      const status = hour < 9 ? "present" : hour === 9 && new Date().getMinutes() <= 15 ? "late" : "late";
      const { error } = await (supabase.from("attendance_logs") as any).insert({
        teacher_id: teacher.id,
        check_in: checkInTime,
        date: todayStr,
        status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-log-today"] });
      qc.invalidateQueries({ queryKey: ["attendance-history"] });
      toast.success("Signed in successfully!");
    },
    onError: (e: Error) => toast.error("Sign-in failed", { description: e.message }),
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      if (!todayLog?.id) throw new Error("Check-in record not found");
      const { error } = await (supabase.from("attendance_logs") as any)
        .update({ check_out: new Date().toISOString() })
        .eq("id", todayLog.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-log-today"] });
      qc.invalidateQueries({ queryKey: ["attendance-history"] });
      toast.success("Signed out successfully!");
    },
    onError: (e: Error) => toast.error("Sign-out failed", { description: e.message }),
  });

  const fmt = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

  const timeText = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateText = now.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const canCheckIn = !todayLog && !isLoading;
  const canCheckOut = !!todayLog && !todayLog.check_out && !isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-black text-navy">Clockin-Clockout</h1>
        <p className="text-muted-foreground text-sm">Track your daily check-ins and working hours.</p>
      </div>

      <div className="bg-white border border-border p-6 grid lg:grid-cols-[1.4fr_1fr_auto] gap-6 items-center">
        <div>
          <div className="font-display text-5xl font-black text-navy">{timeText}</div>
          <div className="text-muted-foreground mt-1">{dateText}</div>
          <div className="text-accent font-semibold mt-2">Check-in opens at 07:00</div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="border-r border-border pr-4">
            <div className="text-[11px] tracking-wider text-muted-foreground font-bold">CHECK IN</div>
            <div className="text-xl font-black text-navy mt-2">{fmt(todayLog?.check_in)}</div>
          </div>
          <div>
            <div className="text-[11px] tracking-wider text-muted-foreground font-bold">CHECK OUT</div>
            <div className="text-xl font-black text-navy mt-2">{fmt(todayLog?.check_out)}</div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            id="clockin-signin-btn"
            onClick={() => checkInMutation.mutate()}
            disabled={!canCheckIn || checkInMutation.isPending}
            className="w-full bg-navy text-gold px-5 py-3 text-xs font-bold tracking-wider hover:bg-navy/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {checkInMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            SIGN IN
          </button>
          <button
            id="clockin-signout-btn"
            onClick={() => checkOutMutation.mutate()}
            disabled={!canCheckOut || checkOutMutation.isPending}
            className="w-full border border-navy text-navy px-5 py-3 text-xs font-bold tracking-wider hover:bg-navy hover:text-gold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {checkOutMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            SIGN OUT
          </button>
        </div>
      </div>

      <div className="bg-gold/10 border border-gold/30 p-4 text-sm text-navy flex flex-wrap gap-x-6 gap-y-2">
        <span className="flex items-center gap-2"><Clock3 size={15} className="text-accent" /> Sign-in window: <strong>07:00 - 09:00</strong></span>
        <span className="flex items-center gap-2"><TriangleAlert size={15} className="text-amber-600" /> Late after: <strong>09:15</strong> (+15 min grace)</span>
        <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-600" /> Sign-out opens: <strong>04:00 PM</strong></span>
      </div>

      <div className="bg-white border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2 text-navy font-bold">
          <CalendarDays size={16} className="text-accent" /> Recent Attendance History
        </div>
        <div className="grid grid-cols-4 text-[11px] tracking-wider uppercase text-muted-foreground font-bold px-6 py-3 border-b border-border">
          <div>Date</div><div>Check In</div><div>Check Out</div><div>Status</div>
        </div>
        {isLoading ? (
          <div className="h-24 grid place-items-center"><Loader2 className="animate-spin text-navy" size={20} /></div>
        ) : history.length === 0 ? (
          <div className="h-24 grid place-items-center text-muted-foreground">No attendance records yet.</div>
        ) : (
          history.map((log) => (
            <div key={log.id} className="grid grid-cols-4 px-6 py-3 border-b border-border text-sm text-navy hover:bg-secondary/20">
              <div>{log.date}</div>
              <div>{fmt(log.check_in)}</div>
              <div>{fmt(log.check_out)}</div>
              <div>
                <span className={`text-[10px] font-bold px-2 py-1 ${log.status === "present" ? "bg-emerald-100 text-emerald-700" : log.status === "late" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                  {log.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
