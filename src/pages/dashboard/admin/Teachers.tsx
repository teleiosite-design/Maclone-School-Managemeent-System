import { useState } from "react";
import { Search, Plus, Download, X, Loader2, Wifi, WifiOff } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { downloadCSV } from "@/lib/csv";
import { supabase } from "@/lib/supabase";

type TeacherRow = {
  id: string;
  employee_id: string;
  department: string | null;
  subjects: string[];
  profiles: { full_name: string; email: string; photo_url: string | null } | null;
  attendance_logs: { check_in: string; check_out: string | null }[];
};

export default function AdminTeachers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [viewing, setViewing] = useState<TeacherRow | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", department: "Secondary", subjects: "" });

  const today = new Date().toISOString().split("T")[0];

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select(`
          id, employee_id, department, subjects,
          profiles (full_name, email, photo_url),
          attendance_logs (check_in, check_out)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TeacherRow[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      // 1. Create auth user via admin (requires service role — skip for now, use invite flow)
      // For now: insert profile + teacher record directly for demo
      const fakeId = crypto.randomUUID();
      const { error: profileErr } = await supabase.from("profiles").insert({
        id: fakeId,
        role: "teacher",
        full_name: form.full_name,
        email: form.email,
      });
      if (profileErr) throw profileErr;

      const empId = `T-${Date.now().toString().slice(-4)}`;
      const { error: teacherErr } = await supabase.from("teachers").insert({
        profile_id: fakeId,
        employee_id: empId,
        department: form.department,
        subjects: form.subjects.split(",").map((s) => s.trim()).filter(Boolean),
      });
      if (teacherErr) throw teacherErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teachers"] });
      toast.success(`${form.full_name} added as teacher.`);
      setForm({ full_name: "", email: "", department: "Secondary", subjects: "" });
      setShowAdd(false);
    },
    onError: (e: Error) => toast.error("Failed to add teacher", { description: e.message }),
  });

  const isOnline = (t: TeacherRow) => {
    const todayLog = t.attendance_logs?.find((l) => l.check_in.startsWith(today));
    return todayLog ? !todayLog.check_out : false;
  };

  const getStatus = (t: TeacherRow) => {
    const todayLog = t.attendance_logs?.find((l) => l.check_in.startsWith(today));
    if (!todayLog) return "Not checked in";
    if (!todayLog.check_out) {
      const time = new Date(todayLog.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return `Clocked In (${time})`;
    }
    const time = new Date(todayLog.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `Clocked Out (${time})`;
  };

  const filtered = teachers.filter((t) => {
    const name = t.profiles?.full_name ?? "";
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      t.subjects.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchType = typeFilter === "All" || t.department === typeFilter;
    return matchSearch && matchType;
  });

  const exportCsv = () => {
    downloadCSV("teachers.csv", [
      ["ID", "Name", "Email", "Department", "Subjects", "Status"],
      ...filtered.map((t) => [
        t.employee_id,
        t.profiles?.full_name ?? "",
        t.profiles?.email ?? "",
        t.department ?? "",
        t.subjects.join("; "),
        getStatus(t),
      ]),
    ]);
    toast.success(`Exported ${filtered.length} teachers.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-navy">Teachers</h1>
          <p className="text-muted-foreground text-sm">Manage teaching staff — live clock-in status.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="flex items-center gap-2 border border-navy text-navy px-4 py-2 text-xs font-bold tracking-wider hover:bg-navy hover:text-gold transition">
            <Download size={14} /> EXPORT
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-navy text-gold px-4 py-2 text-xs font-bold tracking-wider hover:bg-navy/90 transition">
            <Plus size={14} /> ADD TEACHER
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Teachers", value: teachers.length, color: "border-t-navy" },
          { label: "Clocked In Today", value: teachers.filter(isOnline).length, color: "border-t-emerald-500" },
          { label: "Not Checked In", value: teachers.filter((t) => !isOnline(t)).length, color: "border-t-amber-400" },
        ].map((s) => (
          <div key={s.label} className={`bg-white border border-border border-t-4 ${s.color} p-5`}>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="font-display text-3xl font-black text-navy mt-1">{isLoading ? "—" : s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-border p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search by name or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border focus:border-navy focus:outline-none text-sm text-navy bg-white"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-border px-3 py-2 text-sm text-navy focus:outline-none focus:border-navy bg-white">
          {["All", "Primary", "Secondary"].map((t) => <option key={t}>{t}</option>)}
        </select>
        <div className="text-xs text-muted-foreground">{filtered.length} teachers</div>
      </div>

      <div className="bg-white border border-border overflow-x-auto">
        {isLoading ? (
          <div className="h-32 grid place-items-center"><Loader2 className="animate-spin text-navy" size={24} /></div>
        ) : filtered.length === 0 ? (
          <div className="h-32 grid place-items-center text-muted-foreground text-sm">No teachers found. Add your first teacher above.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40">
              <tr>
                {["ID", "TEACHER", "SUBJECTS", "DEPARTMENT", "LIVE STATUS", ""].map((h) => (
                  <th key={h} className={`px-5 py-3 text-xs font-bold tracking-wider text-muted-foreground ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-navy divide-y divide-border">
              {filtered.map((t) => {
                const online = isOnline(t);
                const status = getStatus(t);
                const initials = (t.profiles?.full_name ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2);
                return (
                  <tr key={t.id} className="hover:bg-secondary/20 transition">
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{t.employee_id}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gold/20 text-navy flex items-center justify-center text-xs font-bold">{initials}</div>
                        <div>
                          <div className="font-semibold">{t.profiles?.full_name ?? "—"}</div>
                          <div className="text-[11px] text-muted-foreground">{t.profiles?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {t.subjects.map((s) => <span key={s} className="text-[10px] bg-navy/10 text-navy px-2 py-0.5 font-bold">{s}</span>)}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{t.department ?? "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 w-fit ${online ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-muted-foreground"}`}>
                        {online ? <Wifi size={10} /> : <WifiOff size={10} />} {status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => setViewing(t)} className="text-xs font-bold text-navy hover:text-gold transition">VIEW</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate(); }} onClick={(e) => e.stopPropagation()} className="bg-white p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-black text-navy">Add Teacher</h3>
              <button type="button" onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <input required placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full border border-border px-3 py-2 text-sm" />
            <input required type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-border px-3 py-2 text-sm" />
            <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full border border-border px-3 py-2 text-sm bg-white">
              <option>Primary</option><option>Secondary</option>
            </select>
            <input placeholder="Subjects (comma-separated)" value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} className="w-full border border-border px-3 py-2 text-sm" />
            <button type="submit" disabled={addMutation.isPending} className="w-full bg-navy text-gold py-3 font-bold text-xs tracking-wider disabled:opacity-60 flex items-center justify-center gap-2">
              {addMutation.isPending && <Loader2 size={14} className="animate-spin" />} SAVE TEACHER
            </button>
          </form>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-black text-navy">{viewing.profiles?.full_name}</h3>
              <button onClick={() => setViewing(null)}><X size={18} /></button>
            </div>
            <dl className="text-sm space-y-2 text-navy">
              <div className="flex justify-between"><dt className="text-muted-foreground">Employee ID</dt><dd className="font-mono">{viewing.employee_id}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Email</dt><dd>{viewing.profiles?.email}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Department</dt><dd>{viewing.department ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Today's Status</dt><dd>{getStatus(viewing)}</dd></div>
              <div><dt className="text-muted-foreground mb-1">Subjects</dt><dd className="flex flex-wrap gap-1">{viewing.subjects.map((s) => <span key={s} className="text-[10px] bg-navy/10 text-navy px-2 py-0.5 font-bold">{s}</span>)}</dd></div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
