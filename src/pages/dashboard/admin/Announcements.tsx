import { useEffect } from "react";
import { Megaphone, Send, Loader2, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import type { Announcement } from "@/lib/database.types";

const AUDIENCE_MAP: Record<string, ('admin' | 'teacher' | 'student' | 'parent')[]> = {
  "All":             ["admin", "teacher", "student", "parent"],
  "Students":        ["student"],
  "Parents":         ["parent"],
  "Teachers":        ["teacher"],
  "Students & Parents": ["student", "parent"],
  "Staff Only":      ["admin", "teacher"],
};

export default function AdminAnnouncements() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audienceKey, setAudienceKey] = useState("All");

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Real-time: new announcements push to the list
  useEffect(() => {
    const channel = supabase
      .channel("announcements-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => {
        qc.invalidateQueries({ queryKey: ["announcements"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("announcements").insert({
        title,
        body,
        audience: AUDIENCE_MAP[audienceKey],
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success(`Announcement sent to ${audienceKey}.`);
      setTitle(""); setBody(""); setAudienceKey("All");
    },
    onError: (e: Error) => toast.error("Failed to send", { description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement deleted.");
    },
  });

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });

  const audienceLabel = (audience: string[]) => {
    const key = Object.entries(AUDIENCE_MAP).find(([, v]) =>
      v.length === audience.length && v.every((x) => audience.includes(x))
    );
    return key ? key[0] : audience.join(", ");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-black text-navy">Announcements</h1>
        <p className="text-muted-foreground text-sm">Post notices to students, parents, or teachers. Updates in real-time.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Compose */}
        <div className="lg:col-span-2 bg-white border border-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <Megaphone size={20} className="text-gold" />
            <h3 className="font-bold text-navy">New Announcement</h3>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); sendMutation.mutate(); }} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold tracking-[0.2em] text-navy mb-2">SEND TO</label>
              <select value={audienceKey} onChange={(e) => setAudienceKey(e.target.value)} className="w-full border border-border px-3 py-2 text-sm focus:border-navy focus:outline-none bg-white text-navy">
                {Object.keys(AUDIENCE_MAP).map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-[0.2em] text-navy mb-2">TITLE</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-border px-3 py-2 text-sm focus:border-navy focus:outline-none text-navy" placeholder="Announcement title..." />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-[0.2em] text-navy mb-2">MESSAGE</label>
              <textarea required rows={5} value={body} onChange={(e) => setBody(e.target.value)} className="w-full border border-border px-3 py-2 text-sm focus:border-navy focus:outline-none text-navy resize-none" placeholder="Write your announcement..." />
            </div>
            <button type="submit" disabled={sendMutation.isPending} className="w-full bg-navy text-gold py-3 font-bold text-xs tracking-wider hover:bg-navy/90 transition flex items-center justify-center gap-2 disabled:opacity-60">
              {sendMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              SEND ANNOUNCEMENT
            </button>
          </form>
        </div>

        {/* History */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="font-bold text-navy">Recent Announcements</h3>
          {isLoading ? (
            <div className="h-24 grid place-items-center"><Loader2 className="animate-spin text-navy" size={20} /></div>
          ) : announcements.length === 0 ? (
            <div className="bg-white border border-border p-8 text-center text-muted-foreground text-sm">No announcements yet. Compose your first one.</div>
          ) : (
            announcements.map((a: Announcement & { profiles?: { full_name: string } | null }) => (
              <div key={a.id} className="bg-white border border-border p-5 group">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="font-bold text-navy">{a.title}</h4>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold bg-navy/10 text-navy px-2 py-0.5">{audienceLabel(a.audience)}</span>
                    <button onClick={() => deleteMutation.mutate(a.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{a.body}</p>
                <div className="text-[11px] text-muted-foreground">
                  Posted by {(a as any).profiles?.full_name ?? "Admin"} · {fmtDate(a.created_at)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
