import { useState } from "react";
import { Search, Plus, Filter, Download, X, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { downloadCSV } from "@/lib/csv";
import { supabase } from "@/lib/supabase";

type StudentRow = {
  id: string;
  class: string;
  admission_no: string;
  status: string;
  profiles: { full_name: string; email: string } | null;
};

const CLASSES = ["All", "Nursery 1", "Nursery 2", "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6", "JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"];

export default function AdminStudents() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [viewing, setViewing] = useState<StudentRow | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", class: "Primary 1", admission_no: "" });

  const { data: students = [], isLoading } = useQuery<StudentRow[]>({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, class, admission_no, status, profiles (full_name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StudentRow[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const fakeId = crypto.randomUUID();
      const { error: profileErr } = await (supabase.from("profiles") as any).insert({
        id: fakeId,
        role: "student",
        full_name: form.full_name,
        email: form.email,
      });
      if (profileErr) throw profileErr;

      const admNo = form.admission_no || `MC-${Date.now().toString().slice(-5)}`;
      const { error: studentErr } = await (supabase.from("students") as any).insert({
        profile_id: fakeId,
        class: form.class,
        admission_no: admNo,
        status: "active",
      });
      if (studentErr) throw studentErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success(`${form.full_name} enrolled successfully.`);
      setForm({ full_name: "", email: "", class: "Primary 1", admission_no: "" });
      setShowAdd(false);
    },
    onError: (e: Error) => toast.error("Failed to add student", { description: e.message }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'inactive' | 'graduated' }) => {
      const { error } = await (supabase.from("students") as any).update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student status updated.");
    },
  });

  const filtered = students.filter((s) => {
    const name = s.profiles?.full_name ?? "";
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || s.admission_no.includes(search);
    const matchClass = classFilter === "All" || s.class === classFilter;
    return matchSearch && matchClass;
  });

  const exportCsv = () => {
    downloadCSV("students.csv", [
      ["Admission No", "Name", "Email", "Class", "Status"],
      ...filtered.map((s) => [s.admission_no, s.profiles?.full_name ?? "", s.profiles?.email ?? "", s.class, s.status]),
    ]);
    toast.success(`Exported ${filtered.length} students.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-navy">Students</h1>
          <p className="text-muted-foreground text-sm">Manage all enrolled students across Primary and Secondary.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="flex items-center gap-2 border border-navy text-navy px-4 py-2 text-xs font-bold tracking-wider hover:bg-navy hover:text-gold transition">
            <Download size={14} /> EXPORT
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-navy text-gold px-4 py-2 text-xs font-bold tracking-wider hover:bg-navy/90 transition">
            <Plus size={14} /> ADD STUDENT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Enrolled", value: students.length, color: "border-t-navy" },
          { label: "Active", value: students.filter((s) => s.status === "active").length, color: "border-t-emerald-500" },
          { label: "Inactive / Warning", value: students.filter((s) => s.status !== "active").length, color: "border-t-amber-400" },
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
            placeholder="Search by name or admission no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border focus:border-navy focus:outline-none text-sm text-navy bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="border border-border px-3 py-2 text-sm text-navy focus:outline-none focus:border-navy bg-white">
            {CLASSES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="text-xs text-muted-foreground">{filtered.length} students</div>
      </div>

      <div className="bg-white border border-border overflow-x-auto">
        {isLoading ? (
          <div className="h-32 grid place-items-center"><Loader2 className="animate-spin text-navy" size={24} /></div>
        ) : filtered.length === 0 ? (
          <div className="h-32 grid place-items-center text-muted-foreground text-sm">No students found. Enrol your first student above.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-bold tracking-wider text-muted-foreground">ADM NO</th>
                <th className="text-left px-5 py-3 text-xs font-bold tracking-wider text-muted-foreground">STUDENT</th>
                <th className="text-left px-5 py-3 text-xs font-bold tracking-wider text-muted-foreground">CLASS</th>
                <th className="text-left px-5 py-3 text-xs font-bold tracking-wider text-muted-foreground">EMAIL</th>
                <th className="text-left px-5 py-3 text-xs font-bold tracking-wider text-muted-foreground">STATUS</th>
                <th className="text-right px-5 py-3 text-xs font-bold tracking-wider text-muted-foreground">ACTION</th>
              </tr>
            </thead>
            <tbody className="text-navy divide-y divide-border">
              {filtered.map((s) => {
                const initials = (s.profiles?.full_name ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2);
                return (
                  <tr key={s.id} className="hover:bg-secondary/20 transition">
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{s.admission_no}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-navy/10 text-navy flex items-center justify-center text-xs font-bold">{initials}</div>
                        <span className="font-semibold">{s.profiles?.full_name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">{s.class}</td>
                    <td className="px-5 py-4 text-muted-foreground text-xs">{s.profiles?.email ?? "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 ${s.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {s.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => setViewing(s)} className="text-xs font-bold text-navy hover:text-gold transition">VIEW</button>
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
              <h3 className="font-display text-xl font-black text-navy">Enrol Student</h3>
              <button type="button" onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <input required placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full border border-border px-3 py-2 text-sm" />
            <input required type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-border px-3 py-2 text-sm" />
            <input placeholder="Admission No (auto-generated if blank)" value={form.admission_no} onChange={(e) => setForm({ ...form, admission_no: e.target.value })} className="w-full border border-border px-3 py-2 text-sm" />
            <select value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} className="w-full border border-border px-3 py-2 text-sm bg-white">
              {CLASSES.slice(1).map((c) => <option key={c}>{c}</option>)}
            </select>
            <button type="submit" disabled={addMutation.isPending} className="w-full bg-navy text-gold py-3 font-bold text-xs tracking-wider disabled:opacity-60 flex items-center justify-center gap-2">
              {addMutation.isPending && <Loader2 size={14} className="animate-spin" />} SAVE STUDENT
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
              <div className="flex justify-between"><dt className="text-muted-foreground">Admission No</dt><dd className="font-mono">{viewing.admission_no}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Class</dt><dd>{viewing.class}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Email</dt><dd>{viewing.profiles?.email}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd>{viewing.status}</dd></div>
            </dl>
            <div className="mt-4 flex gap-2">
              {viewing.status === "active" ? (
                <button onClick={() => { updateStatus.mutate({ id: viewing.id, status: "inactive" }); setViewing(null); }} className="flex-1 border border-amber-500 text-amber-600 py-2 text-xs font-bold">MARK INACTIVE</button>
              ) : (
                <button onClick={() => { updateStatus.mutate({ id: viewing.id, status: "active" }); setViewing(null); }} className="flex-1 border border-emerald-500 text-emerald-600 py-2 text-xs font-bold">MARK ACTIVE</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
