"use client";

import { useState, useEffect } from "react";
import { Download, FileSpreadsheet, Filter, ArrowUpDown, Calendar as CalIcon, LayoutGrid, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function Reports() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [sortField, setSortField] = useState("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/export?format=json");
      setData(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setExporting(format);
    try {
      const res = await api.get(`/reports/export?format=${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `performx-report-${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Report downloaded successfully!`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Export failed: ${err.message}`);
    } finally {
      setExporting(null);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const valA = a[sortField] || "";
    const valB = b[sortField] || "";
    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const chartData = [
    { name: "Q1", completion: 65, active: 120 },
    { name: "Q2", completion: 78, active: 140 },
    { name: "Q3", completion: 82, active: 155 },
    { name: "Q4", completion: 91, active: 110 }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Export and analyze performance data</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleExport('csv')} 
            disabled={exporting !== null}
            className="btn-secondary text-blue-600 border-blue-200 hover:bg-blue-50 disabled:opacity-50"
          >
            {exporting === 'csv' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Export CSV
          </button>
          <button 
            onClick={() => handleExport('xlsx')} 
            disabled={exporting !== null}
            className="btn-secondary text-emerald-600 border-emerald-200 hover:bg-emerald-50 disabled:opacity-50"
          >
            {exporting === 'xlsx' ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            Export Excel
          </button>
        </div>
      </div>

      <div className="card p-4 mb-8 flex flex-wrap gap-4 items-end bg-slate-50 border-slate-200">
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Date Range</label>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700">
            <CalIcon size={16} className="text-[#0066FF]" />
            <span>Last 6 Months</span>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Department</label>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 w-48">
            <LayoutGrid size={16} className="text-[#0066FF]" />
            <select className="bg-transparent border-none outline-none w-full text-slate-700">
              <option>All Departments</option>
              <option>Engineering</option>
              <option>Sales</option>
            </select>
          </div>
        </div>
        <button className="btn-primary ml-auto shadow-none bg-[#0066FF] hover:bg-blue-700">Apply Filters</button>
      </div>

      <div className="card p-6 mb-8 border-slate-200">
        <h3 className="font-bold text-slate-900 mb-6">Quarterly Trends (Completion %)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                itemStyle={{ color: '#0066FF', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="completion" stroke="#0066FF" strokeWidth={3} fillOpacity={1} fill="url(#colorCompletion)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-0 overflow-hidden border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-bold text-slate-900">Data Preview</h2>
        </div>
        <div className="table-wrapper border-0 rounded-none overflow-x-auto">
          <table className="data-table w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["title", "employee", "department", "quarter", "status", "progress"].map(field => (
                  <th key={field} onClick={() => handleSort(field)} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group select-none">
                    <div className="flex items-center gap-1">
                      {field}
                      <ArrowUpDown size={12} className={`${sortField === field ? 'text-[#00D4FF]' : 'text-slate-300 group-hover:text-slate-400'}`} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-4 py-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : sortedData.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500 font-medium">No data available for the selected filters.</td></tr>
              ) : (
                sortedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-semibold text-slate-900">{row.title}</td>
                    <td className="px-4 py-4 text-slate-600">{row.employee}</td>
                    <td className="px-4 py-4 text-slate-600">{row.department}</td>
                    <td className="px-4 py-4"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{row.quarter}</span></td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        row.status === "APPROVED_LOCKED" || row.status === "APPROVED" ? "bg-green-100 text-green-700" :
                        row.status === "COMPLETED" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {row.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="progress-bar w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="progress-fill bg-[#0066FF] h-full" style={{ width: `${row.progress || 0}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-700">{row.progress || 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
