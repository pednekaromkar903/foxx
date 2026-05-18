"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Users, CheckCircle2, Loader2, Target, Mail, Briefcase } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function TeamPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchTeam();
    }
  }, [session]);

  const fetchTeam = async () => {
    try {
      const res = await api.get("/team");
      setMembers(res.data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-slate-300" size={40} /></div>;

  const isManager = session?.user?.role === "MANAGER" || session?.user?.role === "ADMIN";

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Team Overview</h1>
          <p className="text-slate-500 mt-1">Manage team members and their goals</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-2">
          <Users size={20} className="text-[#0066FF]" />
          <span className="text-sm font-bold text-[#0066FF]">{members.length} Members</span>
        </div>
      </div>

      {!isManager ? (
        <div className="bg-white border border-slate-200 p-16 rounded-2xl text-center shadow-sm">
          <Users size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h3>
          <p className="text-slate-500">This view is restricted to Team Managers and Administrators.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {members.map(member => {
            const goals = member.goals || [];
            const totalGoals = goals.length;
            const completed = goals.filter((g:any) => g.status === "COMPLETED").length;
            const rate = totalGoals > 0 ? (completed / totalGoals) * 100 : 0;
            
            return (
              <div key={member.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-6 border-b border-slate-50 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#00D4FF] flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-blue-100">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-slate-400"><Mail size={12} /> {member.email}</span>
                        <span className="flex items-center gap-1 text-xs text-[#0066FF] font-bold bg-blue-50 px-1.5 py-0.5 rounded"><Briefcase size={12} /> {member.department?.name || 'Engineering'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Completion Rate</p>
                    <p className="text-2xl font-black text-emerald-500">{rate.toFixed(0)}%</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assigned Goals</h4>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{totalGoals} Total</span>
                  </div>
                  
                  {goals.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-50 rounded-xl">
                      <Target size={24} className="mx-auto text-slate-200 mb-2" />
                      <p className="text-xs text-slate-400 font-medium">No goals assigned yet.</p>
                    </div>
                  ) : (
                    goals.map((goal: any) => (
                      <div key={goal.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center group hover:border-blue-200 transition-colors">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{goal.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-100 px-1.5 py-0.5 rounded uppercase">{goal.quarter}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{goal.status.replace(/_/g, ' ')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {goal.status === "COMPLETED" ? (
                            <div className="bg-emerald-500 text-white p-1 rounded-full"><CheckCircle2 size={16} /></div>
                          ) : (
                            <div className="text-right">
                              <p className="text-xs font-black text-[#0066FF]">{goal.progress || 0}%</p>
                              <div className="w-12 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-[#0066FF]" style={{ width: `${goal.progress || 0}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
