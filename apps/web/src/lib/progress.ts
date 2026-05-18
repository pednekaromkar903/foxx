/**
 * Progress Calculation Engine — PerformX
 * Verified with test data:
 * NUMERIC_MIN (target=20, achievement=15) → 75%
 * NUMERIC_MAX (target=100, achievement=200) → 50%
 * ZERO_BASED  (achievement=0) → 100%, (achievement=5) → 0%
 * PERCENTAGE  (achievement=85) → 85%
 * TIMELINE    (completedOnTime) → 100%
 */
export type UoMType = "NUMERIC_MIN" | "NUMERIC_MAX" | "PERCENTAGE" | "TIMELINE" | "ZERO_BASED";

export function calculateProgress(
  uomType: UoMType,
  target: number,
  achievement: number,
  deadlineDate?: Date,
  completionDate?: Date
): number {
  switch (uomType) {
    case "NUMERIC_MIN":
      if (target <= 0) return 0;
      return (achievement / target) * 100;

    case "NUMERIC_MAX":
      if (achievement === 0) return 100;
      if (achievement <= target) return 100;
      return (target / achievement) * 100;

    case "PERCENTAGE":
      return achievement;

    case "ZERO_BASED":
      return achievement === 0 ? 100 : 0;

    case "TIMELINE":
      if (!deadlineDate) return achievement > 0 ? 100 : 0;
      if (!completionDate) {
        const now = new Date();
        return now <= deadlineDate ? 50 : 0;
      }
      const onTime = completionDate <= deadlineDate;
      const delayDays = (completionDate.getTime() - deadlineDate.getTime()) / (24 * 60 * 60 * 1000);
      const delayPenalty = (delayDays / 30) * 100;
      return onTime ? 100 : Math.max(0, 100 - delayPenalty);

    default:
      return 0;
  }
}

/**
 * Validate goal weightages for a set of goals
 */
export function validateWeightages(weightages: number[]): {
  valid: boolean;
  total: number;
  errors: string[];
} {
  const errors: string[] = [];
  const total = weightages.reduce((sum, w) => sum + w, 0);

  if (weightages.length > 8) {
    errors.push("Maximum 8 goals allowed per employee.");
  }
  if (Math.abs(total - 100) > 0.01) {
    errors.push(`Total weightage must equal exactly 100%. Current total: ${total}%.`);
  }
  for (const w of weightages) {
    if (w < 10) {
      errors.push(`Minimum weightage per goal is 10%. Found: ${w}%.`);
      break;
    }
  }

  return { valid: errors.length === 0, total, errors };
}
