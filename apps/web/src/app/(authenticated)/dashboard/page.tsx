"use client";

import { useState, useEffect } from "react";
import { Target, CheckCircle2, Clock, AlertTriangle, Play, ChevronRight, Check, CheckSquare, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function Dashboard() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await api.get("/goals");
      setGoals(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard data");
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

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="h-12 w-64 bg-slate-100 rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-slate-50 rounded-xl border border-slate-100" />
          ))}
        </div>
        <div className="h-96 bg-slate-50 rounded-xl border border-slate-100" />
      </div>
    );
  }

  const filteredGoals = filter === "ALL" ? goals : goals.filter(g => g.quarter === filter);

  const stats = {
    active: goals.filter(g => ["MANAGER_APPROVED", "ADMIN_APPROVED", "HR_APPROVED", "COMPLETED"].includes(g.status)).length,
    pending: goals.filter(g => ["SUBMITTED_TO_MANAGER", "SENT_TO_ADMIN", "SENT_TO_HR"].includes(g.status)).length,
    completed: goals.filter(g => g.status === "COMPLETED").length,
    drafts: goals.filter(g => ["DRAFT", "RETURNED_FOR_REWORK", "MANAGER_REJECTED", "ADMIN_REJECTED", "HR_REJECTED"].includes(g.status)).length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">Draft</span>;
      case "SUBMITTED_TO_MANAGER":
      case "SENT_TO_ADMIN":
      case "SENT_TO_HR":
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase">Pending</span>;
      case "MANAGER_APPROVED":
      case "ADMIN_APPROVED":
      case "HR_APPROVED":
      case "COMPLETED":
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase">Approved</span>;
      case "RETURNED_FOR_REWORK":
      case "MANAGER_REJECTED":
      case "ADMIN_REJECTED":
      case "HR_REJECTED":
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase">Rejected/Returned</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{status.replace(/_/g, " ")}</span>;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title text-2xl font-bold text-slate-900">Employee Dashboard</h1>
          <p className="page-subtitle text-slate-500">Track your quarterly goals and achievements</p>
        </div>
        <Link href="/goals/new" className="btn-primary bg-[#0066FF] hover:bg-blue-700 flex items-center gap-2">
          <CheckSquare size={16} />
          Create Goal
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="stat-icon p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Play size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Goals</p>
          </div>
        </div>
        <div className="stat-card bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="stat-icon p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Awaiting Approval</p>
          </div>
        </div>
        <div className="stat-card bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="stat-icon p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</p>
          </div>
        </div>
        <div className="stat-card bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="stat-icon p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.drafts}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Drafts / Rework</p>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden bg-white border border-slate-200 shadow-sm rounded-2xl">
        <div className="p-4 md:p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-lg font-bold text-slate-900">Your Goals</h2>
          <div className="flex gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
            {["ALL", "Q1", "Q2", "Q3", "Q4"].map((q) => (
              <button
                key={q}
                onClick={() => setFilter(q)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                  filter === q ? "bg-white text-[#0066FF] shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrapper border-0 rounded-none overflow-x-auto">
          <table className="data-table w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Goal Title</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Quarter</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-48">Progress</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGoals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-400 font-medium">
                    No goals found for this filter.
                  </td>
                </tr>
              ) : (
                filteredGoals.map((g) => {
                  const progress = g.updates?.[0]?.progressScore || 0;
                  return (
                    <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{g.title}</div>
                        <div className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-tight">
                          {g.thrustArea || "Performance"} • Weightage: {g.weightage}%
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{g.quarter}</span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(g.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="progress-bar bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="progress-fill bg-[#0066FF] h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(g.status === "DRAFT" || g.status === "RETURNED_FOR_REWORK" || g.status === "RETURNED") && (
                          <button onClick={() => submitGoal(g.id)} className="px-4 py-1.5 bg-[#0066FF] text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
                            Submit
                          </button>
                        )}
                        {["MANAGER_APPROVED", "ADMIN_APPROVED", "HR_APPROVED", "COMPLETED"].includes(g.status) && (
                          <Link href={`/check-in?goalId=${g.id}`} className="px-4 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors">
                            Check-in
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
