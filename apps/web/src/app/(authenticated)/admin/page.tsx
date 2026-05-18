"use client";

import { useState, useEffect } from "react";
import { Settings, Shield, Users, BarChart3, Clock, Power, Play, CheckCircle2, UserCheck, Timer, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import ApprovalsDashboard from "@/components/approvals/ApprovalsDashboard";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<any>(null);
  const [cycles, setCycles] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [managerScores, setManagerScores] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, logsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/audit-logs")
      ]);
      setStats(statsRes.data);
      setManagerScores(statsRes.data.managerScores || []);
      setUsers(usersRes.data.users || []);
      setAuditLogs(logsRes.data.logs || []);
      
      // Mock cycles for now since API might not be ready
      setCycles([
        { id: "c1", name: "Q1", isActive: false },
        { id: "c2", name: "Q2", isActive: true },
        { id: "c3", name: "Q3", isActive: false },
        { id: "c4", name: "Q4", isActive: false },
      ]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const toggleCycle = (id: string) => {
    setCycles(cycles.map(c => c.id === id ? { ...c, isActive: true } : { ...c, isActive: false }));
  };

  return (
    <div>
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">System configuration and monitoring</p>
        </div>
      </div>

      <div className="flex gap-2 mb-8 border-b border-slate-200 pb-px">
        {["overview", "cycles", "users", "audit"].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold capitalize transition-all border-b-2 ${activeTab === tab ? 'border-[#0066FF] text-[#0066FF]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat-card">
              <div className="stat-icon bg-blue-50 text-[#0066FF]"><Play size={24} /></div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats?.submissionRate}%</p>
                <p className="text-sm font-medium text-slate-500">Submission Rate</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-green-50 text-green-600"><CheckCircle2 size={24} /></div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats?.approvalRate}%</p>
                <p className="text-sm font-medium text-slate-500">Approval Rate</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-cyan-50 text-[#00D4FF]"><Clock size={24} /></div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats?.checkinRate}%</p>
                <p className="text-sm font-medium text-slate-500">Check-in Rate</p>
              </div>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Timer size={20} className="text-[#0066FF]" /> Manager Effectiveness Leaderboard
              </h2>
            </div>
            <div className="table-wrapper border-0 rounded-none">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Manager Name</th>
                    <th>Goals Approved</th>
                    <th>Avg Approval Time</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {managerScores.sort((a, b) => a.avgHours - b.avgHours).map((m, i) => (
                    <tr key={m.id}>
                      <td className="font-semibold text-slate-900">
                        {i === 0 && <span className="text-amber-500 mr-2">★</span>}
                        {m.name}
                      </td>
                      <td>{m.approvedCount}</td>
                      <td><span className="font-mono">{m.avgHours.toFixed(1)} hrs</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="progress-bar w-24">
                            <div className="progress-fill bg-[#00D4FF]" style={{ width: `${Math.max(10, 100 - (m.avgHours / 72) * 100)}%` }}></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "cycles" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cycles.map(c => (
              <div key={c.id} className={`card p-6 border-2 transition-all ${c.isActive ? 'border-[#0066FF] shadow-blue-glow' : 'border-slate-200'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-slate-900">{c.name} Cycle</h3>
                  <button 
                    onClick={() => toggleCycle(c.id)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${c.isActive ? 'bg-[#0066FF]' : 'bg-slate-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${c.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  {c.isActive ? 'Currently active. Employees can submit goals and check-ins.' : 'Inactive. Locked for edits.'}
                </p>
                <div className="flex gap-2">
                  <span className={`badge ${c.isActive ? 'badge-blue' : 'badge-slate'}`}>
                    {c.isActive ? 'ACTIVE' : 'LOCKED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="card p-0 overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900">User Management</h2>
            <div className="flex gap-2">
              <select className="input py-1.5 px-3 text-sm w-32">
                <option value="">All Depts</option>
                <option value="Engineering">Engineering</option>
                <option value="IT">IT</option>
              </select>
            </div>
          </div>
          <div className="table-wrapper border-0 rounded-none">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="font-medium text-slate-900">
                      {u.name}
                      <div className="text-xs text-slate-500 font-normal">{u.email}</div>
                    </td>
                    <td><span className="badge-slate">{u.department}</span></td>
                    <td>
                      <select className="input py-1 px-2 text-xs w-28 bg-slate-50" defaultValue={u.role}>
                        <option value="EMPLOYEE">Employee</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td>
                      <button className="text-xs font-semibold text-[#0066FF] hover:underline">Save</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="card p-0 overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Shield size={20} className="text-[#0066FF]" /> System Audit Trail
            </h2>
          </div>
          <div className="table-wrapper border-0 rounded-none">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Changes</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td className="font-mono text-xs text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="font-medium text-slate-700">{log.changedBy?.name || 'System'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase">
                        {log.entityType} • {log.fieldName?.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-xs">
                        {log.oldValue && (
                          <span className="line-through text-red-400 bg-red-50 px-1.5 py-0.5 rounded">
                            {log.oldValue.replace(/_/g, ' ')}
                          </span>
                        )}
                        <span className="text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">
                          {log.newValue?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

