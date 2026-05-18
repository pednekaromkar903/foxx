"use client";

import { useState, useEffect } from "react";
import { Users, AlertCircle, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { api } from "@/lib/api";

export default function TeamDashboard() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTeam(); }, []);

  const fetchTeam = async () => {
    try {
      const res = await api.get("/team");
      setTeam(res.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 flex justify-center"><Loader2 className="animate-spin" /></div>;

  const quarterStats = { Q1: { total: 0, completed: 0 }, Q2: { total: 0, completed: 0 }, Q3: { total: 0, completed: 0 }, Q4: { total: 0, completed: 0 } };
  const statusStats: Record<string, number> = {};
  const overdueCheckins: any[] = [];

  team.forEach(member => {
    const goals = member.goals || [];
    goals.forEach((g: any) => {
      const q = g.quarter as "Q1" | "Q2" | "Q3" | "Q4";
      if (quarterStats[q]) {
        quarterStats[q].total++;
        if (g.status === "COMPLETED") quarterStats[q].completed++;
      }
      statusStats[g.status] = (statusStats[g.status] || 0) + 1;
      
      if (g.deadline && new Date(g.deadline) < new Date() && g.status !== "COMPLETED") {
        overdueCheckins.push({ employee: member.name, goalTitle: g.title, deadline: g.deadline });
      }
    });
  });

  const barData = ["Q1", "Q2", "Q3", "Q4"].map(q => ({
    name: q,
    completion: quarterStats[q as "Q1" | "Q2" | "Q3" | "Q4"].total > 0 
      ? Math.round((quarterStats[q as "Q1" | "Q2" | "Q3" | "Q4"].completed / quarterStats[q as "Q1" | "Q2" | "Q3" | "Q4"].total) * 100) 
      : 0
  }));

  const COLORS = ["#0066FF", "#00D4FF", "#cbd5e1", "#f59e0b", "#10b981", "#ef4444"];
  const pieData = Object.keys(statusStats).map(key => ({ name: key.replace(/_/g, " "), value: statusStats[key] }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Dashboard</h1>
          <p className="page-subtitle">Monitor subordinate progress and metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="font-bold text-slate-900 mb-6">Team Completion by Quarter</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#eff6ff' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="completion" name="Completion %" fill="#0066FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card p-6">
          <h3 className="font-bold text-slate-900 mb-6">Goal Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Team Progress Heatmap</h2>
          </div>
          <div className="table-wrapper border-0 rounded-none">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th className="text-center">G1</th>
                  <th className="text-center">G2</th>
                  <th className="text-center">G3</th>
                  <th className="text-center">G4</th>
                  <th className="text-center">G5</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member) => {
                  const goals = member.goals || [];
                  return (
                    <tr key={member.id}>
                      <td className="font-medium text-slate-900 w-1/3 truncate">
                        {member.name}
                      </td>
                      {[0, 1, 2, 3, 4].map(idx => {
                        const g = goals[idx];
                        if (!g) return <td key={idx} className="text-center"><div className="w-8 h-8 mx-auto rounded bg-slate-50"></div></td>;
                        const prog = g.updates?.[0]?.progressScore || 0;
                        const intensity = prog > 80 ? "bg-[#0066FF] text-white" : prog > 40 ? "bg-[#00D4FF] text-white" : "bg-[#eff6ff] text-[#0066FF]";
                        return (
                          <td key={idx} className="text-center" title={g.title}>
                            <div className={`w-8 h-8 mx-auto rounded flex items-center justify-center text-xs font-bold ${intensity}`}>
                              {prog}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-0 h-fit overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-red-50/50">
            <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
              <AlertCircle size={18} /> Overdue Needs Attention
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {overdueCheckins.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No overdue items!</p>
            ) : (
              overdueCheckins.map((item, idx) => (
                <div key={idx} className="p-3 bg-white border-l-4 border-l-red-500 border border-slate-200 rounded-r-lg shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{item.employee}</p>
                  <p className="text-xs text-slate-600 line-clamp-1">{item.goalTitle}</p>
                  <p className="text-xs text-red-500 font-medium mt-1">Due: {new Date(item.deadline).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
