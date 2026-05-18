"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Target, ArrowLeft, Loader2, Save, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

type GoalData = {
  title: string;
  description: string;
  thrustArea: string;
  quarter: string;
  uomType: string;
  target: number;
  weightage: number;
  deadline: string;
};

export default function NewGoalWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [allocated, setAllocated] = useState(0);

  const [formData, setFormData] = useState<GoalData>({
    title: "",
    description: "",
    thrustArea: "Performance",
    quarter: "Q2",
    uomType: "PERCENTAGE",
    target: 100,
    weightage: 0,
    deadline: "",
  });

  const searchParams = useSearchParams();
  const editId = searchParams?.get?.("edit") || null;

  useEffect(() => {
    const fetchExistingWeightage = async () => {
      try {
        const res = await api.get(`/goals?quarter=${encodeURIComponent(formData.quarter)}`);
        const goals = res.data || [];
        const total = goals
          .filter((g: any) => g.status !== "ARCHIVED")
          .reduce((sum: number, g: any) => sum + (Number(g.weightage) || 0), 0);
        setAllocated(total);
      } catch (err) { console.error("Failed to fetch goals", err); }
    };

    const fetchEditGoal = async (id: string) => {
      try {
        const res = await api.get(`/goals/${id}`);
        const g = res.data;
        if (g) {
          setFormData({
            title: g.title || "",
            description: g.description || "",
            thrustArea: g.thrustArea || "Performance",
            quarter: g.quarter || "Q2",
            uomType: g.uomType || "PERCENTAGE",
            target: g.target ?? 100,
            weightage: g.weightage ?? 0,
            deadline: g.deadline ? g.deadline.split("T")[0] : "",
          });
        }
      } catch (err) { console.error("Failed to load goal for edit", err); }
    };

    fetchExistingWeightage();
    if (editId) fetchEditGoal(editId);
  }, [formData.quarter]);

  const remaining = 100 - allocated;
  const isOverAllocated = allocated + formData.weightage > 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? 0 : Number(value)) : value
    }));
  };

  const validateStep1 = () => {
    if (!formData.title.trim() || formData.title.length < 5) {
      toast.error("Title must be at least 5 characters", { className: "border-l-4 border-red-500" });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.target <= 0) {
      toast.error("Target must be greater than 0", { className: "border-l-4 border-red-500" });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (formData.weightage < 10 || formData.weightage > 100) {
      toast.error("Weightage must be between 10% and 100%", { className: "border-l-4 border-red-500" });
      return false;
    }
    if (isOverAllocated) {
      toast.error(`Cannot exceed 100%. You have ${remaining}% remaining.`, { className: "border-l-4 border-red-500" });
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const onSubmit = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    try {
      if (editId) {
        await api.put(`/goals/${editId}`, formData);
        toast.success("✅ Goal updated and saved as Draft.", { className: "border-l-4 border-green-500" });
      } else {
        await api.post("/goals", formData);
        toast.success("✅ Goal saved as Draft. Submit it for manager approval when ready.", { className: "border-l-4 border-green-500" });
      }

      setTimeout(() => {
        router.push("/goals");
      }, 800);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to create/update goal", { className: "border-l-4 border-red-500" });
    } finally {
      setLoading(false);
    }
  };

  const totalAllocated = Math.min(100, allocated + formData.weightage);
  const progressBarColor = totalAllocated < 80 ? "bg-green-500" : totalAllocated < 100 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard" className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create New Goal</h1>
          <p className="text-sm text-slate-500">Wizard - Step {step} of 3</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8 px-4">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#0066FF]' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-[#0066FF] text-white shadow-blue-glow' : 'bg-slate-100'}`}>1</div>
          <span className="font-semibold text-sm">Details</span>
        </div>
        <div className="flex-1 h-[2px] mx-4 bg-slate-100"><div className={`h-full bg-[#0066FF] transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} /></div>
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#0066FF]' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-[#0066FF] text-white shadow-blue-glow' : 'bg-slate-100'}`}>2</div>
          <span className="font-semibold text-sm">Target & UoM</span>
        </div>
        <div className="flex-1 h-[2px] mx-4 bg-slate-100"><div className={`h-full bg-[#0066FF] transition-all ${step >= 3 ? 'w-full' : 'w-0'}`} /></div>
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[#0066FF]' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-[#0066FF] text-white shadow-blue-glow' : 'bg-slate-100'}`}>3</div>
          <span className="font-semibold text-sm">Weightage</span>
        </div>
      </div>

      <div className="card p-6 min-h-[300px]">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="label">Goal Title *</label>
              <input name="title" value={formData.title} onChange={handleChange} className="input" placeholder="e.g., Reduce API latency by 20%" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} className="input h-24 resize-none" placeholder="Elaborate on the goal..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Thrust Area</label>
                <select name="thrustArea" value={formData.thrustArea} onChange={handleChange} className="input bg-white">
                  <option value="Performance">Performance</option>
                  <option value="Quality">Quality</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Security">Security</option>
                  <option value="Growth">Growth</option>
                </select>
              </div>
              <div>
                <label className="label">Quarter *</label>
                <select name="quarter" value={formData.quarter} onChange={handleChange} className="input bg-white">
                  <option value="Q1">Q1 (May)</option>
                  <option value="Q2">Q2 (July)</option>
                  <option value="Q3">Q3 (October)</option>
                  <option value="Q4">Q4 (January)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="label">Measurement Type (UoM) *</label>
              <select name="uomType" value={formData.uomType} onChange={handleChange} className="input bg-white">
                <option value="NUMERIC_MIN">Numeric (Min - Higher is better)</option>
                <option value="NUMERIC_MAX">Numeric (Max - Lower is better)</option>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="TIMELINE">Timeline (Date-based)</option>
                <option value="ZERO_BASED">Zero-based (Achieve 0)</option>
              </select>
            </div>
            <div>
              <label className="label">Target Value *</label>
              <input type="number" step="0.01" name="target" value={formData.target} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="label">Deadline</label>
              <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} className="input" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-4 bg-[#eff6ff] rounded-xl border border-[#bfdbfe]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-[#1e40af]">Weightage Calculator</span>
                <span className="text-sm font-bold text-[#00D4FF]">Allocated: {allocated}% | Remaining: {remaining}%</span>
              </div>
              <div className="progress-bar bg-[#dbeafe] h-2 rounded-full overflow-hidden">
                <div className={`progress-fill ${progressBarColor} h-full transition-all`} style={{ width: `${totalAllocated}%` }}></div>
              </div>
              <p className="text-xs text-slate-500 mt-2">You have {remaining}% remaining for this cycle.</p>
            </div>

            <div>
              <label className="label">Weightage (%) *</label>
              <input type="number" name="weightage" value={formData.weightage} onChange={handleChange} className="input" placeholder="Min 10%" />
              <p className="text-xs text-slate-500 mt-2">Minimum weightage per goal is 10%.</p>
              {isOverAllocated && (
                <p className="text-sm text-red-500 mt-1 font-medium">Cannot exceed 100%. You have {remaining}% remaining.</p>
              )}
            </div>
          </div>
        )}

        <div className="pt-8 mt-8 border-t border-slate-100 flex justify-between">
          <button onClick={prevStep} disabled={step === 1} className="btn-secondary disabled:opacity-0">
            Back
          </button>
          {step < 3 ? (
            <button onClick={nextStep} className="btn-primary bg-[#0066FF]">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={onSubmit} disabled={loading || isOverAllocated} className={`btn-primary bg-[#0066FF] ${isOverAllocated ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
              Save Draft
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
