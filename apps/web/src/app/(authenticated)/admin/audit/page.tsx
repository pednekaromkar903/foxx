'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Shield, Clock, User, FileText, ArrowLeftRight } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/audit-logs').then((res) => {
      setLogs(res.data.logs || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield size={24} className="text-red-600" /> Goal Audit Trail
          </h1>
          <p className="text-slate-500 mt-1">Detailed history of all modifications to locked and approved goals.</p>
        </div>
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-100 text-sm font-medium">
          IPO-Compliance Mode: ACTIVE
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-slate-100 rounded-lg w-full mb-6"></div>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="h-6 w-32 bg-slate-100 rounded"></div>
                  <div className="h-10 w-48 bg-slate-100 rounded"></div>
                  <div className="h-10 flex-1 bg-slate-100 rounded"></div>
                  <div className="h-8 w-64 bg-slate-100 rounded"></div>
                  <div className="h-6 w-24 bg-slate-100 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Changed By</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Goal / Field</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Changes</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-900 font-mono">
                        <Clock size={14} className="text-slate-400" />
                        {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black uppercase">
                          {log.changedBy?.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{log.changedBy?.name || 'System'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{log.changedBy?.role || 'SYSTEM'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{log.entityType}</p>
                        <p className="text-xs font-bold text-slate-700">{log.fieldName || 'Action'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {log.oldValue && (
                          <span className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded border border-red-100 line-through opacity-70">
                            {log.oldValue}
                          </span>
                        )}
                        {log.oldValue && log.newValue && <ArrowLeftRight size={12} className="text-slate-300" />}
                        {log.newValue && (
                          <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 font-bold">
                            {log.newValue}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${
                        log.newValue === 'APPROVED_LOCKED' ? 'bg-green-100 text-green-700' : 
                        log.newValue === 'RETURNED_FOR_REWORK' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {log.fieldName || 'LOG'}
                      </span>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      <FileText size={48} className="mx-auto mb-3 opacity-20" />
                      <p>No audit records found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
