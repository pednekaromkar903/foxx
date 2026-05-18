'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { Target } from 'lucide-react';
import { calculateProgress, UoMType } from '@/lib/progress';

export default function LegacyGoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/intelligence/goals')
      .then((r) => setGoals(r.data.goals || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Target size={24} /> HR Performance Goals
        </h1>
        <p className="text-slate-500 mt-1">Pulled from Atomberg Legacy DB — live Q2 actuals vs targets</p>
      </section>

      {loading ? (
        <section className="flex justify-center h-48">
          <section className="animate-spin h-10 w-10 border-b-2 border-slate-900 rounded-full" />
        </section>
      ) : (
        <section className="grid gap-4">
          {goals.map((g) => {
            const progress = calculateProgress(
              (g.uomType || 'NUMERIC_MIN') as UoMType,
              Number(g.target),
              Number(g.actual)
            );
            return (
              <section key={g.id} className="card">
                <section className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-900">{g.title}</h3>
                  <Badge variant={progress >= 100 ? 'success' : 'info'}>{g.quarter}</Badge>
                </section>
                <p className="text-sm text-slate-500 mb-3">
                  {g.employee?.name} • {g.employee?.department}
                </p>
                <section className="flex justify-between text-sm mb-1">
                  <span>Actual / Target</span>
                  <span className="font-medium">{g.actual} / {g.target}</span>
                </section>
                <Progress value={Math.min(progress, 100)} />
              </section>
            );
          })}
        </section>
      )}
    </section>
  );
}
