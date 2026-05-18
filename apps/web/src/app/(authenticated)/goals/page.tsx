"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { Target, Plus, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await api.get("/goals");
      setGoals(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load goals. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const submitGoal = async (id: string) => {
    try {
      await api.post(`/goals/${id}/submit`);
      toast.success("Goal submitted for approval", { className: "border-l-4 border-green-500" });
      fetchGoals();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to submit goal");
    }
  };

  const totalWeight = goals.reduce((a, g) => a + g.weightage, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">Draft</span>;
      case "SUBMITTED_TO_MANAGER":
      case "SENT_TO_ADMIN":
      case "SENT_TO_HR":
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">Pending Review</span>;
      case "MANAGER_APPROVED":
      case "ADMIN_APPROVED":
      case "HR_APPROVED":
      case "COMPLETED":
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">Approved</span>;
      case "RETURNED_FOR_REWORK":
      case "MANAGER_REJECTED":
      case "ADMIN_REJECTED":
      case "HR_REJECTED":
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium">Rejected/Returned</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{status.replace(/_/g, " ")}</span>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateStr));
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Goals</h1>
          <p className="page-subtitle">{goals.length} goals • Total weightage: {totalWeight}%</p>
        </div>
        <Link href="/goals/new" className="btn-primary bg-[#0066FF] hover:bg-blue-700">
          <Plus size={16} /> Create Goal
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="card animate-pulse p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-6 w-1/3 bg-slate-200 rounded-md" />
                <div className="h-6 w-20 bg-slate-200 rounded-full" />
              </div>
              <div className="h-4 w-2/3 bg-slate-100 rounded-md" />
              <div className="h-2 w-full bg-slate-100 rounded-full" />
            </div>
          ))
        ) : goals.length === 0 ? (
          <div className="card text-center py-16 px-6">
            <Target size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No goals yet</h3>
            <p className="text-slate-500 mb-4">You haven't created any goals yet. Start by clicking '+ Create Goal' above.</p>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = goal.updates?.[0]?.progressScore ?? 0;
            const isDraft = goal.status === "DRAFT";
            const isReturned = goal.status === "RETURNED" || goal.status === "RETURNED_FOR_REWORK";

            return (
              <div key={goal.id} className="card-hover p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">{goal.title}</h3>
                      {getStatusBadge(goal.status)}
                      {goal.isShared && <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-medium">Shared KPI</span>}
                    </div>
                    
                    <p className="text-sm text-slate-500 mb-3">{goal.description || "Not set"}</p>

                    {isReturned && goal.returnReason && (
                      <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm italic rounded-md flex items-start gap-2 border border-red-100">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <span>↩ Returned: {goal.returnReason}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 mb-4">
                      <span>Thrust: <strong>{goal.thrustArea || "—"}</strong></span>
                      <span>UoM: <strong>{goal.uomType === "PERCENTAGE" ? "Percentage (%)" : goal.uomType.replace(/_/g, " ")}</strong></span>
                      <span>Weightage: <strong>{goal.weightage}%</strong></span>
                      <span>Target: <strong>{goal.target} {goal.uomType === "PERCENTAGE" ? "%" : ""}</strong></span>
                      <span>Due: <strong>{formatDate(goal.deadline)}</strong></span>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-slate-500">Progress</span>
                        <span className="font-semibold text-slate-700">{progress}%</span>
                      </div>
                      <div className="progress-bar bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="progress-fill bg-[#0066FF] h-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col gap-2">
                    {isDraft && (
                      <button onClick={() => submitGoal(goal.id)} className="btn-secondary text-sm px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
                        Submit for Approval
                      </button>
                    )}
                    {isReturned && (
                      <button onClick={() => router.push(`/goals/new?edit=${goal.id}`)} className="btn-secondary text-sm px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
                        Edit & Resubmit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
