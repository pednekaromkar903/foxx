"use client";

import { useState, useEffect } from "react";
import { 
  Radar, TrendingUp, Users, Target, Zap, 
  ArrowUpRight, ArrowDownRight, Minus, 
  Activity, Search, Filter, Loader2, Sparkles,
  BarChart3, Globe, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export default function TechRadarPage() {
  const [activeTab, setActiveTab] = useState("competitors");
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, prodRes, trendRes, insightRes] = await Promise.all([
        api.get("/tech-radar/competitors"),
        api.get("/tech-radar/products"),
        api.get("/tech-radar/trends"),
        api.get("/tech-radar/insights")
      ]);
      setCompetitors(compRes.data);
      setProducts(prodRes.data);
      setTrends(trendRes.data);
      setInsights(insightRes.data);
    } catch (err) {
      toast.error("Failed to load intelligence data");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "competitors", label: "Competitors", icon: Users },
    { id: "products", label: "Top Products", icon: Target },
    { id: "trends", label: "Global Trends", icon: Globe },
    { id: "radar", label: "Tech Radar", icon: Radar },
    { id: "ai", label: "AI Insights", icon: Sparkles },
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="page-header">
        <div>
          <h1 className="page-title">Enterprise Intelligence</h1>
          <p className="page-subtitle">Tech Radar & Competitor Monitoring Dashboard</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 flex gap-1 items-center">
            <Activity size={12} /> Live Market Data
          </Badge>
          <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100 flex gap-1 items-center">
            <Sparkles size={12} /> AI Analysis Active
          </Badge>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-px sticky top-0 bg-slate-50/80 backdrop-blur-md z-10 px-2 -mx-2">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "competitors" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {competitors.map(comp => (
            <Card key={comp.id} className="p-0 overflow-hidden group hover:shadow-xl transition-all border-slate-200">
              <div className="p-5 border-b border-slate-100 bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400">
                      {comp.name[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{comp.name}</h3>
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">{comp.marketPosition}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900">{comp.marketImpact}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Impact Score</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {comp.smartFeatures.map((f: string, i: number) => (
                    <Badge key={i} variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] font-bold">
                      {f}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="p-5 bg-slate-50/50">
                <p className="text-[10px] uppercase font-black text-slate-400 mb-3 tracking-widest">Featured Products</p>
                <div className="space-y-3">
                  {comp.products.slice(0, 2).map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <p className="text-sm font-bold text-slate-800">{p.name}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-500">{p.monthlySales.toLocaleString()} / mo</span>
                        <ArrowUpRight size={14} className="text-green-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "products" && (
        <div className="card p-0 overflow-hidden animate-in fade-in duration-500">
          <table className="data-table">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-[10px] font-black uppercase">Product Model</th>
                <th className="text-[10px] font-black uppercase">Company</th>
                <th className="text-[10px] font-black uppercase">Est. Monthly Sales</th>
                <th className="text-[10px] font-black uppercase">Market Share</th>
                <th className="text-[10px] font-black uppercase">Trend</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="font-bold text-slate-900">{p.name}</td>
                  <td><Badge variant="secondary" className="bg-slate-100 text-slate-600">{p.competitor.name}</Badge></td>
                  <td className="font-mono font-bold">{p.monthlySales.toLocaleString()}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="progress-bar w-24">
                        <div className="progress-fill bg-blue-600" style={{ width: `${p.marketShare * 5}%` }}></div>
                      </div>
                      <span className="text-xs font-bold">{p.marketShare}%</span>
                    </div>
                  </td>
                  <td>
                    {p.demandTrend === "UP" ? (
                      <Badge className="bg-green-50 text-green-700 border-green-100 flex items-center gap-1">
                        <ArrowUpRight size={12} /> GROWING
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-700 border-amber-100 flex items-center gap-1">
                        <Minus size={12} /> STABLE
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "trends" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in zoom-in-95 duration-500">
          {trends.map(trend => (
            <Card key={trend.id} className="p-5 border-slate-200 hover:border-blue-300 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  {trend.category === "IoT" ? <Zap size={24} /> : <BarChart3 size={24} />}
                </div>
                <Badge className={trend.impactScore > 9 ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}>
                  {trend.impactScore} IMPACT
                </Badge>
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">{trend.name}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase mb-4 tracking-widest">{trend.category}</p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-500">ADOPTION RATE</span>
                    <span className="text-blue-600">{trend.adoptionRate}%</span>
                  </div>
                  <div className="progress-bar h-1.5">
                    <div className="progress-fill bg-blue-600" style={{ width: `${trend.adoptionRate}%` }}></div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {trend.regions.map((r: string, i: number) => (
                    <span key={i} className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">{r}</span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "radar" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm animate-in fade-in duration-500">
          <div className="grid grid-cols-2 gap-8 relative">
            {/* Center Axis Labels */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 -translate-y-1/2 z-0"></div>
            <div className="absolute left-1/2 top-0 w-px h-full bg-slate-200 -translate-x-1/2 z-0"></div>
            
            {["ADOPT", "TRIAL", "ASSESS", "HOLD"].map((q) => (
              <div key={q} className="h-[300px] border border-slate-100 rounded-2xl p-6 bg-slate-50/30 relative overflow-hidden group">
                <h3 className="text-[10px] font-black text-slate-300 tracking-[0.2em] mb-4">{q}</h3>
                <div className="flex flex-wrap gap-3">
                  {trends.slice(0, 3).map((t, i) => (
                    <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer z-10">
                      <p className="text-[10px] font-black text-slate-900">{t.name}</p>
                      <p className="text-[8px] text-blue-500 font-bold uppercase">{t.category}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">EMERGING</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">GROWING</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-200"></div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">MATURE</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "ai" && (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-200">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Sparkles size={24} />
                </div>
                <h2 className="text-2xl font-black">Strategic AI Insights</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {insights.map(insight => (
                  <div key={insight.id} className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl hover:bg-white/20 transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={insight.severity === "HIGH" ? "bg-red-400 text-white" : "bg-blue-400 text-white"}>
                        {insight.severity}
                      </Badge>
                      <span className="text-[10px] font-bold tracking-widest opacity-60 uppercase">{insight.type}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2">{insight.title}</h3>
                    <p className="text-sm text-white/80 leading-relaxed">{insight.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <Sparkles size={300} className="absolute -bottom-20 -right-20 text-white/5 rotate-12" />
          </div>
          
          <Card className="p-6 border-blue-100 bg-blue-50/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Recommended Strategic Shift</h3>
                <p className="text-sm text-slate-600">Based on competitive pressure from Havells in BLDC motors, we recommend accelerating the release of SmartFan Pro by 2 months.</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
