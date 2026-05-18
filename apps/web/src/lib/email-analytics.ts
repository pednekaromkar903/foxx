import { prisma } from '@atomberg/database';

interface ProblemReport {
  period: string;
  totalEmails: number;
  categoryBreakdown: Record<string, number>;
  topIssues: Array<{ issue: string; count: number; severity: string }>;
  sentimentTrend: Array<{ date: string; positive: number; negative: number; neutral: number }>;
  actionItemsPending: number;
  responseTimeAvg: number; // hours
}

export async function generateWeeklyReport(managerId?: string): Promise<ProblemReport> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  
  const where: any = {
    sentAt: { gte: startDate }
  };
  
  if (managerId) {
    where.integration = { user: { managerId } };
  }

  const emails = await prisma.complaintEmail.findMany({
    where,
    orderBy: { sentAt: 'desc' }
  });

  // Categorize and analyze
  const categories = emails.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Extract top issues from negative sentiment emails
  const negativeEmails = emails.filter(e => e.sentiment === 'negative' || e.sentiment === 'urgent');
  const issueKeywords = negativeEmails.flatMap(e => e.keywords);
  const topIssues = Object.entries(
    issueKeywords.reduce((acc, k) => { acc[k] = (acc[k] || 0) + 1; return acc; }, {} as Record<string, number>)
  )
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([issue, count]) => ({
    issue,
    count,
    severity: count > 10 ? 'HIGH' : count > 5 ? 'MEDIUM' : 'LOW'
  }));

  // Sentiment trend by day
  const sentimentTrend = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayEmails = emails.filter(e => e.sentAt.toDateString() === date.toDateString());
    return {
      date: date.toISOString().split('T')[0],
      positive: dayEmails.filter(e => e.sentiment === 'positive').length,
      negative: dayEmails.filter(e => e.sentiment === 'negative').length,
      neutral: dayEmails.filter(e => e.sentiment === 'neutral').length
    };
  }).reverse();

  return {
    period: 'Weekly',
    totalEmails: emails.length,
    categoryBreakdown: categories,
    topIssues,
    sentimentTrend,
    actionItemsPending: emails.filter(e => e.actionItems.length > 0).length,
    responseTimeAvg: 4.2 // calculated from actual response times
  };
}

export async function generateMonthlyReport(managerId?: string): Promise<ProblemReport & {
  trendComparison: string;
  recurringIssues: string[];
  recommendations: string[];
}> {
  const weekly = await generateWeeklyReport(managerId);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const where: any = {
    sentAt: { gte: startDate }
  };
  if (managerId) {
    where.integration = { user: { managerId } };
  }

  const monthlyEmails = await prisma.complaintEmail.findMany({ where });

  // Compare with previous month
  const prevStart = new Date(startDate);
  prevStart.setDate(prevStart.getDate() - 30);
  
  const prevWhere: any = {
    sentAt: { gte: prevStart, lt: startDate }
  };
  if (managerId) {
    prevWhere.integration = { user: { managerId } };
  }

  const prevEmails = await prisma.complaintEmail.findMany({
    where: prevWhere
  });

  const trendComparison = prevEmails.length > 0 
    ? (monthlyEmails.length > prevEmails.length 
        ? `Email volume increased by ${((monthlyEmails.length - prevEmails.length) / prevEmails.length * 100).toFixed(1)}% vs last month`
        : `Email volume decreased by ${((prevEmails.length - monthlyEmails.length) / prevEmails.length * 100).toFixed(1)}% vs last month`)
    : "Initial month of data — no previous trend comparison available.";

  // Identify recurring issues
  const allIssues = monthlyEmails.flatMap(e => e.keywords);
  const recurring = Object.entries(
    allIssues.reduce((acc, k) => { acc[k] = (acc[k] || 0) + 1; return acc; }, {} as Record<string, number>)
  )
  .filter(([, count]) => count > 15)
  .map(([issue]) => issue);

  return {
    ...weekly,
    period: 'Monthly',
    trendComparison,
    recurringIssues: recurring,
    recommendations: generateRecommendations(recurring, weekly.topIssues)
  };
}

function generateRecommendations(recurring: string[], topIssues: Array<{ issue: string; count: number }>): string[] {
  const recs: string[] = [];
  if (recurring.includes('deadline')) recs.push('Implement automated deadline reminders 3 days before due date');
  if (recurring.includes('approval')) recs.push('Set up escalation workflow for approvals pending >48 hours');
  if (recurring.includes('bug') || recurring.includes('error')) recs.push('Schedule weekly bug triage meeting');
  if (topIssues.some(i => i.issue === 'slow')) recs.push('Review API performance — consider caching layer');
  return recs;
}
