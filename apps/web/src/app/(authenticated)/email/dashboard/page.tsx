"use client";

import { useState, useEffect } from "react";
import { 
  Mail, MessageSquare, AlertTriangle, CheckCircle, 
  TrendingUp, RefreshCw, BarChart3, PieChart, 
  Map, Calendar, ArrowRight, Sparkles, Filter, 
  Search, Loader2, Download, Minus
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export default function ComplaintIntelligencePage() {
  const [stats, setStats] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, complaintsRes] = await Promise.all([
        api.get("/email/stats"),
        api.get("/email/complaints")
      ]);
      setStats(statsRes.data);
      setComplaints(complaintsRes.data);
    } catch (err) {
      toast.error("Failed to load complaint data");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.post("/email/sync");
      toast.success("Email synchronization completed");
      fetchData();
    } catch (err) {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="page-header">
        <div>
          <h1 className="page-title text-2xl font-black">Complaint Intelligence</h1>
          <p className="page-subtitle">AI-powered customer feedback and product defect analytics</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSync} 
            disabled={syncing}
            className="btn-secondary flex items-center gap-2 bg-white border-slate-200"
          >
            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing..." : "Sync Emails"}
          </button>
          <button className="btn-primary flex items-center gap-2 bg-[#0066FF] hover:bg-blue-700">
            <Download size={16} /> Export Reports
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Mail size={20} /></div>
            <Badge className="bg-green-50 text-green-600 border-green-100">+{stats?.growth}%</Badge>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats?.total}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Complaints</p>
        </Card>
        <Card className="p-5 border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><AlertTriangle size={20} /></div>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats?.pending}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Unresolved Issues</p>
        </Card>
        <Card className="p-5 border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle size={20} /></div>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats?.resolved}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resolved Cases</p>
        </Card>
        <Card className="p-5 border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Sparkles size={20} /></div>
          </div>
          <p className="text-2xl font-black text-slate-900">8.4</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Product Health Score</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Complaint Log */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={16} className="text-blue-600" /> Recent Complaints
              </h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input className="input py-1.5 pl-9 text-xs w-48" placeholder="Search complaints..." />
                </div>
                <button className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100"><Filter size={14} /></button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="text-[10px] uppercase font-black">Customer / Subject</th>
                    <th className="text-[10px] uppercase font-black">Category</th>
                    <th className="text-[10px] uppercase font-black">Sentiment</th>
                    <th className="text-[10px] uppercase font-black">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                      <td className="max-w-xs">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{c.subject}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{c.sender}</p>
                      </td>
                      <td>
                        <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200 text-slate-600 bg-slate-50">
                          {c.category || "General"}
                        </Badge>
                      </td>
                      <td>
                        <Badge className={
                          c.sentiment === "negative" ? "bg-red-50 text-red-600" : 
                          c.sentiment === "positive" ? "bg-green-50 text-green-600" : 
                          "bg-slate-50 text-slate-600"
                        }>
                          {c.sentiment?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="text-[10px] font-mono text-slate-400">
                        {new Date(c.sentAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
              <button className="text-xs font-bold text-blue-600 hover:underline">View All Complaints</button>
            </div>
          </Card>

          {/* Issue Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 border-slate-200">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-600" /> Top Issues
              </h3>
              <div className="space-y-4">
                {stats?.categories.map((cat: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-600 uppercase">{cat.name}</span>
                      <span className="text-slate-900">{cat.count}</span>
                    </div>
                    <div className="progress-bar h-2">
                      <div className="progress-fill bg-blue-600" style={{ width: `${(cat.count / stats.total) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 border-slate-200">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Map size={16} className="text-blue-600" /> Regional Hotspots
              </h3>
              <div className="space-y-3">
                {[
                  { region: "Mumbai", count: 124, trend: "UP" },
                  { region: "Bangalore", count: 98, trend: "STABLE" },
                  { region: "Delhi", count: 86, trend: "DOWN" },
                  { region: "Chennai", count: 42, trend: "STABLE" },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50">
                    <span className="text-xs font-bold text-slate-700">{r.region}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-slate-900">{r.count}</span>
                      {r.trend === "UP" ? <TrendingUp size={14} className="text-red-500" /> : <Minus size={14} className="text-slate-300" />}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* AI Sidebar */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight">AI Insights</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Critical Defect Alert</p>
                <p className="text-sm font-bold leading-tight">Rising motor noise complaints in SmartFan X5 models (Batch #42).</p>
                <button className="mt-3 text-[10px] font-black flex items-center gap-1 hover:underline">
                  INVESTIGATE BATCH <ArrowRight size={10} />
                </button>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Process Optimization</p>
                <p className="text-sm font-bold leading-tight">40% of installation issues are related to WiFi pairing. Recommend improving app onboarding UI.</p>
              </div>
            </div>
          </div>

          <Card className="p-5 border-slate-200">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <PieChart size={16} className="text-blue-600" /> Severity Analysis
            </h3>
            <div className="flex justify-around items-end h-32 gap-2">
              {[
                { label: "Critical", height: "h-[80%]", color: "bg-red-500" },
                { label: "High", height: "h-[60%]", color: "bg-orange-500" },
                { label: "Medium", height: "h-[40%]", color: "bg-amber-500" },
                { label: "Low", height: "h-[20%]", color: "bg-blue-500" },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div className={`w-full rounded-t-lg ${s.color} ${s.height}`}></div>
                  <span className="text-[8px] font-black uppercase mt-2 text-slate-400">{s.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 border-blue-600 bg-blue-600 text-white">
            <h3 className="text-sm font-black uppercase tracking-widest mb-2">Weekly Summary</h3>
            <p className="text-xs leading-relaxed opacity-90 mb-4">Complaint volume decreased by 4% compared to last week. Motor noise remains the primary driver of negative sentiment.</p>
            <button className="w-full py-2 bg-white text-blue-600 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-colors">
              Full Report
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
