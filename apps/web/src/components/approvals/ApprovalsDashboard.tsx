"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Check, X, Undo2, Loader2, User, ArrowRight, ShieldCheck, History, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/Badge";

type Goal = {
  id: string;
  title: string;
  employeeId: string;
  employee: { name: string; email: string; department: { name: string } };
  thrustArea: string;
  status: string;
  target: number;
  weightage: number;
  returnReason?: string;
  updatedAt: string;
  approvals: any[];
};

export default function ApprovalsDashboard() {
  const { user } = useAuthStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [returnReasonId, setReturnReasonId] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState("");

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await api.get("/manager/pending");
      setGoals(res.data);
    } catch (err) {
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: "approve" | "reject" | "return" | "forward", reason = "") => {
    setActionLoading(`${id}-${action}`);
    try {
      await api.post(`/goals/${id}/${action}`, { reason, comment: reason });
      toast.success(`Action successful`);
      setReturnReasonId(null);
      setReasonText("");
      fetchGoals();
    } catch (err: any) {
      toast.error(`Action failed: ${err.response?.data?.error || "Unknown error"}`);
    } finally {
      setActionLoading(null);
    }
  };

  const role = user?.role as string;

  const getColumns = () => {
    if (role === "MANAGER") {
      return [
        { id: "pending", label: "Pending Your Review", color: "border-amber-400", statuses: ["SUBMITTED_TO_MANAGER"] },
        { id: "approved", label: "Approved by You", color: "border-green-400", statuses: ["MANAGER_APPROVED", "SENT_TO_ADMIN"] },
        { id: "rejected", label: "Rejected", color: "border-red-500", statuses: ["MANAGER_REJECTED"] },
        { id: "returned", label: "Returned for Rework", color: "border-amber-600", statuses: ["RETURNED_FOR_REWORK"] },
      ];
    }
    if (role === "ADMIN") {
      return [
        { id: "pending", label: "Pending Admin Approval", color: "border-amber-500", statuses: ["MANAGER_APPROVED", "SENT_TO_ADMIN"] },
        { id: "hr_pending", label: "Pending HR Approval", color: "border-blue-400", statuses: ["ADMIN_APPROVED", "SENT_TO_HR"] },
        { id: "approved", label: "Fully Approved", color: "border-green-500", statuses: ["HR_APPROVED", "COMPLETED"] },
        { id: "rejected", label: "Rejected by Admin", color: "border-red-600", statuses: ["ADMIN_REJECTED"] }];
    }
    if (role === "HR") {
      return [
        { id: "pending", label: "Pending HR Approval", color: "border-purple-500", statuses: ["ADMIN_APPROVED", "SENT_TO_HR"] },
        { id: "approved", label: "Fully Approved", color: "border-green-600", statuses: ["HR_APPROVED", "COMPLETED"] },
        { id: "rejected", label: "Rejected by HR", color: "border-red-700", statuses: ["HR_REJECTED"] },
      ];
    }
    return [];
  };

  if (loading) {
    return (
      <div className="flex gap-6 overflow-hidden p-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="min-w-[320px] w-[320px] h-[600px] bg-slate-50 rounded-xl border border-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  const columns = getColumns();

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 px-2">
        {columns.map((col) => {
          const filteredGoals = goals.filter(g => col.statuses.includes(g.status));
          return (
            <div key={col.id} className="min-w-[340px] w-[340px] flex flex-col bg-slate-50/50 rounded-xl border border-slate-200 p-4">
              <h3 className={`font-bold text-slate-700 mb-4 pb-2 border-b-2 ${col.color} flex justify-between items-center`}>
                <span className="text-sm uppercase tracking-wider">{col.label}</span>
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{filteredGoals.length}</span>
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                {filteredGoals.map(g => (
                  <div key={g.id} className="card p-4 hover:shadow-lg bg-white border border-slate-200 group transition-all duration-200 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{g.employee?.name}</p>
                          <p className="text-[10px] text-blue-600 font-medium">{g.employee?.department?.name}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0">
                        {g.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 mb-2 leading-tight">{g.title}</h4>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <p className="text-[9px] uppercase font-bold text-slate-400">Target</p>
                        <p className="text-xs font-bold text-slate-900">{g.target}</p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <p className="text-[9px] uppercase font-bold text-slate-400">Weight</p>
                        <p className="text-xs font-bold text-slate-900">{g.weightage}%</p>
                      </div>
                    </div>

                    {g.returnReason && (
                      <div className="mb-4 text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-100">
                        <span className="font-bold">Reason:</span> {g.returnReason}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-4 pb-2 border-b border-slate-100">
                      <span className="flex items-center gap-1"><Clock size={10} /> {new Date(g.updatedAt).toLocaleDateString()}</span>
                      {g.approvals?.[0] && (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <ShieldCheck size={10} /> Last by {g.approvals[0].manager?.name}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons based on Role and Status */}
                    {col.id === "pending" && (
                      <div className="space-y-2">
                        {returnReasonId === g.id ? (
                          <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                            <textarea
                              className="input text-xs h-16 resize-none p-2 border-amber-200 focus:ring-amber-500"
                              placeholder="Reason for return/rejection..."
                              autoFocus
                              value={reasonText}
                              onChange={(e) => setReasonText(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleAction(g.id, 'return', reasonText)}
                                className="flex-1 py-1.5 rounded text-xs font-bold text-white bg-amber-500 hover:bg-amber-600"
                              >
                                Confirm Return
                              </button>
                              <button 
                                onClick={() => handleAction(g.id, 'reject', reasonText)}
                                className="flex-1 py-1.5 rounded text-xs font-bold text-white bg-red-500 hover:bg-red-600"
                              >
                                Reject
                              </button>
                              <button onClick={() => setReturnReasonId(null)} className="p-1.5 bg-slate-100 rounded text-slate-400"><X size={14} /></button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button 
                              disabled={!!actionLoading}
                              onClick={() => handleAction(g.id, 'approve')}
                              className="flex-1 flex justify-center items-center gap-1 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-all shadow-sm"
                            >
                              {actionLoading === `${g.id}-approve` ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Approve
                            </button>
                            
                            {role !== "HR" && (
                              <button 
                                disabled={!!actionLoading}
                                onClick={() => handleAction(g.id, 'forward')}
                                className="flex-1 flex justify-center items-center gap-1 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
                              >
                                {actionLoading === `${g.id}-forward` ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />} Forward
                              </button>
                            )}

                            <button 
                              onClick={() => setReturnReasonId(g.id)}
                              className="flex-1 flex justify-center items-center gap-1 py-1.5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all"
                            >
                              <Undo2 size={12} /> Return/Reject
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {filteredGoals.length === 0 && (
                  <div className="text-center py-12 px-6 text-slate-300 text-sm border-2 border-dashed border-slate-200 rounded-xl bg-white/30">
                    <Check size={20} className="mx-auto mb-2 opacity-20" />
                    All caught up!
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
