"use client";

import { useState, useEffect } from "react";
import { 
  Users, BarChart3, CheckCircle2, 
  Clock, TrendingUp, ShieldCheck, 
  Search, Filter, Loader2, Sparkles,
  PieChart, Building2
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import ApprovalsDashboard from "@/components/approvals/ApprovalsDashboard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/stats"); // Reuse admin stats for now
      setStats(res.data);
    } catch (err) {
      toast.error("Failed to load HR data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">HR Executive Dashboard</h1>
          <p className="page-subtitle">Organizational performance and goal compliance monitoring</p>
        </div>
      </div>

      <div className="flex gap-2 mb-8 border-b border-slate-200 pb-px">
        {["overview", "approvals", "departments", "insights"].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold capitalize transition-all border-b-2 ${activeTab === tab ? 'border-[#0066FF] text-[#0066FF]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "approvals" && (
        <div className="h-[calc(100vh-280px)] animate-fade-in">
          <ApprovalsDashboard />
        </div>
      )}

      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-5 border-slate-200 shadow-sm">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg w-fit mb-3"><Users size={20} /></div>
              <p className="text-2xl font-black text-slate-900">{stats?.totalEmployees || 142}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Employees</p>
            </Card>
            <Card className="p-5 border-slate-200 shadow-sm">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg w-fit mb-3"><CheckCircle2 size={20} /></div>
              <p className="text-2xl font-black text-slate-900">{stats?.completionRate || 76}%</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Goal Completion</p>
            </Card>
            <Card className="p-5 border-slate-200 shadow-sm">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg w-fit mb-3"><Clock size={20} /></div>
              <p className="text-2xl font-black text-slate-900">{stats?.pendingApprovals || 28}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Final HR Approvals</p>
            </Card>
            <Card className="p-5 border-slate-200 shadow-sm">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg w-fit mb-3"><TrendingUp size={20} /></div>
              <p className="text-2xl font-black text-slate-900">{stats?.performanceIndex || 8.8}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Org Performance Index</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-0 overflow-hidden border-slate-200">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Building2 size={16} className="text-blue-600" /> Department Performance
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {[
                  { name: "Engineering", rate: 92, status: "EXCEPTIONAL" },
                  { name: "Marketing", rate: 84, status: "GOOD" },
                  { name: "Sales", rate: 76, status: "ON TRACK" },
                  { name: "Design", rate: 68, status: "AT RISK" },
                ].map((dept, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700">{dept.name}</span>
                      <span className="text-blue-600">{dept.rate}%</span>
                    </div>
                    <div className="progress-bar h-2">
                      <div className="progress-fill bg-blue-600" style={{ width: `${dept.rate}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 border-blue-600 bg-blue-600 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={20} />
                  <h3 className="text-lg font-black uppercase tracking-tight">HR Intelligence</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl">
                    <p className="text-sm font-bold leading-tight">Engineering department has achieved 100% goal submission for Q2.</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl">
                    <p className="text-sm font-bold leading-tight">Recommended: Recognize top performers in the Marketing team to boost morale.</p>
                  </div>
                </div>
              </div>
              <ShieldCheck size={140} className="absolute -bottom-10 -right-10 text-white/10 rotate-12" />
            </Card>
          </div>
        </div>
      )}

      {activeTab === "departments" && (
        <Card className="p-16 text-center border-slate-200">
          <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Departmental Analytics</h3>
          <p className="text-slate-500">Detailed breakdown by department is being generated...</p>
        </Card>
      )}

      {activeTab === "insights" && (
        <Card className="p-16 text-center border-slate-200">
          <PieChart size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">AI Talent Insights</h3>
          <p className="text-slate-500">Predictive performance and talent mapping insights will appear here.</p>
        </Card>
      )}
    </div>
  );
}
