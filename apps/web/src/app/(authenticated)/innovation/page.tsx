"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Lightbulb, Plus, X, Check, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function InnovationHub() {
  const { data: session } = useSession();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("Software");
  const [impact, setImpact] = useState("MEDIUM");

  const isManagerOrAdmin = session?.user?.role === "MANAGER" || session?.user?.role === "ADMIN";

  useEffect(() => {
    fetchIdeas();
  }, [session]);

  const fetchIdeas = async () => {
    try {
      if (!isManagerOrAdmin) { setLoading(false); return; }
      const res = await api.get("/innovation");
      setIdeas(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/innovation", { title, description: desc, category, impact });
      toast.success("Idea submitted!");
      setIsModalOpen(false);
      setTitle(""); setDesc("");
      fetchIdeas();
    } catch (e) { console.error(e); }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch("/innovation", { id, status });
      toast.success(`Idea ${status.toLowerCase()}`);
      fetchIdeas();
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Innovation Hub</h1>
          <p className="page-subtitle">Submit and review breakthrough ideas</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={16} /> Submit Idea
        </button>
      </div>

      {!isManagerOrAdmin && (
        <div className="card p-12 text-center">
          <Lightbulb size={48} className="mx-auto text-amber-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Have a great idea?</h3>
          <p className="text-slate-500">Click the button above to submit your innovation to the management team.</p>
        </div>
      )}

      {isManagerOrAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 text-slate-500 text-center py-12">Loading...</div>
          ) : (
            ideas.map((idea) => (
              <div key={idea.id} className="card-hover p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="badge-cyan">{idea.category}</span>
                  <span className={`badge ${
                    idea.status === "APPROVED" ? "badge-green" :
                    idea.status === "REJECTED" ? "badge-red" : "badge-amber"
                  }`}>{idea.status}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{idea.title}</h3>
                <p className="text-sm text-slate-500 flex-1">{idea.description}</p>
                
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Submitted by</p>
                    <p className="text-sm font-medium text-slate-700">{idea.submittedBy?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Impact</p>
                    <p className="text-sm font-semibold text-blue-600">{idea.impact}</p>
                  </div>
                </div>

                {idea.status === "PENDING" && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button onClick={() => handleUpdateStatus(idea.id, "APPROVED")} className="btn-success btn-sm">
                      <Check size={14} /> Approve
                    </button>
                    <button onClick={() => handleUpdateStatus(idea.id, "REJECTED")} className="btn-danger btn-sm">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
            <div className="modal-header">
              <h3 className="text-lg font-bold text-slate-900">Submit Innovation</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body space-y-5">
                <div>
                  <label className="label">Title</label>
                  <input required value={title} onChange={e=>setTitle(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea required value={desc} onChange={e=>setDesc(e.target.value)} rows={4} className="input resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Category</label>
                    <select value={category} onChange={e=>setCategory(e.target.value)} className="input bg-white">
                      <option>Software</option><option>Hardware</option><option>AI/ML</option><option>IoT</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Impact</label>
                    <select value={impact} onChange={e=>setImpact(e.target.value)} className="input bg-white">
                      <option>LOW</option><option>MEDIUM</option><option>HIGH</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Submit Idea</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
