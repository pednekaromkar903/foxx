import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, GoalStatus } from '@atomberg/database';
import { calculateProgress, UoMType } from '@/lib/progress';
import { atombergContext } from '@/lib/company-context';
import { generateWeeklyReport, generateMonthlyReport } from '@/lib/email-analytics';

// Role-based response for forbidden queries
const forbiddenResponse = (role: string, requested: string) => ({
  reply: `As a ${role}, you do not have access to ${requested}. ` +
         `Your permissions: ${getRolePermissions(role)}. ` +
         `Please ask about your domain or contact your manager/admin.`,
  model: 'rule-based',
  restricted: true
});

function getRolePermissions(role: string): string {
  switch(role) {
    case 'EMPLOYEE': return 'personal goals, calendar, company info, your email analytics';
    case 'MANAGER': return 'team data, approvals, department metrics, company info, competitor intel, market trends, team email analytics, reports';
    case 'ADMIN': return 'full system access, all email analytics, audit logs, all reports, company intelligence';
    default: return 'basic access';
  }
}

function getMarketUpdate(role: string): string {
  if (role === 'EMPLOYEE') return '';
  const t = atombergContext.industryTrends;
  const c = atombergContext.competitors;
  const randomTrend = t.current[Math.floor(Math.random() * t.current.length)];
  const randomTech = t.technologies[Math.floor(Math.random() * t.technologies.length)];
  const randomComp = c[Math.floor(Math.random() * c.length)];

  return `\n\n--- 📊 Market & Competitor Update ---\n• **Trend:** ${randomTrend}\n• **Trending Tech:** ${randomTech.name} (${randomTech.impact} impact)\n• **Competitor News (${randomComp.name}):** ${randomComp.recentMoves}`;
}

// Company info handler
function handleCompanyQuestion(m: string): string | null {
  const c = atombergContext;
  
  if (/who is the ceo|about manoj|founder|manoj meena/i.test(m)) {
    return `**${c.ceo.name}** — Co-founder & CEO of Atomberg Technologies\n\n` +
           `• Education: ${c.ceo.background}\n` +
           `• Vision: "${c.ceo.vision}"\n` +
           `• Key Achievements:\n${c.ceo.achievements.map(a => `  - ${a}`).join('\n')}\n\n` +
           `• Leadership Style: ${c.ceo.leadershipStyle}\n` +
           `• Connect: ${c.ceo.publicProfiles.linkedin}`;
  }
  
  if (/what does atomberg do|company|about atomberg|business/i.test(m)) {
    return `**${c.company.name}** (${c.company.founded})\n\n` +
           `• Headquarters: ${c.company.headquarters}\n` +
           `• Employees: ${c.company.employees}\n` +
           `• Core Technology: ${c.technology.core}\n` +
           `• Patents: ${c.technology.patents}\n\n` +
           `**Flagship Products:**\n${c.products.map(p => `• ${p.name} — ${p.type} (${p.tech})`).join('\n')}\n\n` +
           `**Market Position:**\n• Category: ${c.marketPosition.category}\n• Market Share: ${c.marketPosition.marketShare}\n• Growth: ${c.marketPosition.growth}\n• Presence: ${c.marketPosition.presence}`;
  }
  
  if (/products|fans|efficio|renesa|gorilla/i.test(m)) {
    return `**Atomberg Product Portfolio:**\n\n${c.products.map(p => 
      `• **${p.name}** (${p.type})\n  Tech: ${p.tech}\n  ${p.efficiency || p.features || p.target ? `  Highlight: ${p.efficiency || p.features || p.target}` : ''}`
    ).join('\n\n')}`;
  }
  
  if (/technology|bldc|patents|rnd|research/i.test(m)) {
    return `**Atomberg Technology & R&D:**\n\n` +
           `• Core: ${c.technology.core}\n` +
           `• Patents: ${c.technology.patents}\n` +
           `• Manufacturing: ${c.technology.manufacturing}\n\n` +
           `**R&D Focus Areas:**\n${c.technology.rndFocus.map(r => `• ${r}`).join('\n')}`;
  }
  
  return null;
}

// Competitor intelligence handler
function handleCompetitorQuestion(m: string, role: string): string | null {
  if (role === 'EMPLOYEE') return null; // Employees don't get competitor data
  
  const c = atombergContext;
  
  if (/competitor|competition|market share|orient|crompton|havells/i.test(m)) {
    return `**Competitive Landscape — Premium Fan Segment (India)**\n\n` +
           c.competitors.map(comp => 
             `**${comp.name}** — ${comp.marketShare} market share\n` +
             `• Strengths: ${comp.strengths.join(', ')}\n` +
             `• Weaknesses: ${comp.weaknesses.join(', ')}\n` +
             `• Recent Moves: ${comp.recentMoves}\n`
           ).join('\n') +
           `\n**Atomberg Advantage:** ${c.marketPosition.marketShare} market share with ${c.marketPosition.growth} growth`;
  }
  
  if (/compare with|vs\.?|versus|better than/i.test(m)) {
    const compMatch = m.match(/(orient|crompton|havells)/i);
    if (!compMatch) {
      return `I can compare Atomberg with: Orient Electric, Crompton Greaves, or Havells India.\nWhich competitor would you like to analyze?`;
    }
    const comp = c.competitors.find(x => x.name.toLowerCase().includes(compMatch[1].toLowerCase()));
    if (!comp) return `Competitor not found. Available: Orient Electric, Crompton Greaves, Havells India.`;
    
    return `**Atomberg vs ${comp.name}**\n\n` +
           `| Metric | Atomberg | ${comp.name} |\n` +
           `|--------|----------|--------------|\n` +
           `| Market Share | ${c.marketPosition.marketShare} | ${comp.marketShare} |\n` +
           `| Core Tech | BLDC Motors | ${comp.weaknesses.includes('No BLDC focus') ? 'Induction Motors' : 'Mixed'} |\n` +
           `| Efficiency | 65% less power | Standard |\n` +
           `| IoT/Smart | Native integration | ${comp.strengths.some(s => s.includes('IoT')) ? 'Limited' : 'Minimal'} |\n` +
           `| Growth Rate | ${c.marketPosition.growth} | Slower |\n\n` +
           `**Atomberg's Edge:** ${comp.weaknesses.join('; ')}`;
  }
  
  return null;
}

// Market trends handler
function handleMarketTrends(m: string, role: string): string | null {
  if (role === 'EMPLOYEE') return null;
  
  const t = atombergContext.industryTrends;
  
  if (/trend|market|industry|growth|future/i.test(m)) {
    return `**Industry Trends — Consumer Appliances (2026)**\n\n` +
           `**Current Market Dynamics:**\n${t.current.map(tr => `• ${tr}`).join('\n')}\n\n` +
           `**Emerging Opportunities:**\n${t.emerging.map(tr => `• ${tr}`).join('\n')}\n\n` +
           `**Technology Radar:**\n${t.technologies.map(tech => 
             `• **${tech.name}** — Maturity: ${tech.maturity} | Impact: ${tech.impact}`
           ).join('\n')}`;
  }
  
  if (/new technology|emerging tech|what.*new|latest/i.test(m)) {
    return `**Emerging Technologies for Atomberg's Roadmap**\n\n` +
           t.technologies.map(tech => {
             let detail = '';
             if (tech.name.includes('Edge AI')) detail = ' Enables fans to learn user preferences and auto-adjust without cloud dependency';
             if (tech.name.includes('GaN')) detail = ' 30% more efficient than silicon MOSFETs, smaller form factor';
             if (tech.name.includes('Solid-state')) detail = ' 2x energy density, no fire risk, 10-year lifespan';
             if (tech.name.includes('Matter')) detail = ' Universal smart home protocol — works with Alexa, Google, Apple HomeKit';
             return `• **${tech.name}** [${tech.maturity}]\n  Impact: ${tech.impact}${detail}`;
           }).join('\n\n');
  }
  
  return null;
}

// Email analytics handler
async function handleEmailAnalytics(m: string, role: string, userId: string): Promise<string | null> {
  if (!/email|inbox|mail|communication|weekly report|monthly report|problem|issue/i.test(m)) return null;
  
  // Check if user has email integration
  const integration = await prisma.emailIntegration.findFirst({
    where: { userId, isActive: true }
  });
  
  if (!integration) {
    return `📧 **Email Analytics Not Connected**\n\n` +
           `To enable email intelligence, connect your inbox:\n` +
           `• Gmail: /api/email/connect?provider=gmail\n` +
           `• Outlook: /api/email/connect?provider=outlook\n` +
           `• Corporate: /api/email/connect?provider=corporate\n\n` +
           `Once connected, I can analyze:\n` +
           `• Communication patterns and response times\n` +
           `• Problem identification from email sentiment\n` +
           `• Weekly/monthly team health reports\n` +
           `• Action item extraction and tracking`;
  }
  
  // Weekly report
  if (/weekly|last week|this week|7 days/i.test(m)) {
    const report = await generateWeeklyReport(role === 'MANAGER' ? userId : undefined);
    
    return `📊 **Weekly Email Intelligence Report** (${role === 'MANAGER' ? 'Team' : 'Personal'})\n\n` +
           `**Period:** Last 7 days\n` +
           `**Total Emails Analyzed:** ${report.totalEmails}\n` +
           `**Pending Action Items:** ${report.actionItemsPending}\n` +
           `**Avg Response Time:** ${report.responseTimeAvg} hours\n\n` +
           `**Category Breakdown:**\n${Object.entries(report.categoryBreakdown).map(([cat, count]) => 
             `• ${cat}: ${count} emails`
           ).join('\n')}\n\n` +
           `**🔴 Top Issues Detected:**\n${report.topIssues.map((issue, i) => 
             `${i+1}. **${issue.issue}** — ${issue.count} occurrences [${issue.severity}]`
           ).join('\n')}\n\n` +
           `**Sentiment Trend (Last 7 Days):**\n${report.sentimentTrend.map(day => 
             `${day.date}: 😊${day.positive} 😐${day.neutral} 😞${day.negative}`
           ).join('\n')}`;
  }
  
  // Monthly report
  if (/monthly|last month|30 days|trend/i.test(m)) {
    const report = await generateMonthlyReport(role === 'MANAGER' ? userId : undefined);
    
    return `📈 **Monthly Email Intelligence Report** (${role === 'MANAGER' ? 'Team' : 'Personal'})\n\n` +
           `**${report.trendComparison}**\n\n` +
           `**Recurring Issues (30+ mentions):**\n${report.recurringIssues.length > 0 
             ? report.recurringIssues.map(issue => `• ${issue}`).join('\n')
             : 'No recurring issues detected'}\n\n` +
           `**💡 AI Recommendations:**\n${report.recommendations.length > 0
             ? report.recommendations.map((rec, i) => `${i+1}. ${rec}`).join('\n')
             : 'No specific recommendations at this time'}\n\n` +
           `**Weekly Breakdown:**\n${report.sentimentTrend.map(day => 
             `${day.date}: ${day.positive + day.neutral + day.negative} emails`
           ).join('\n')}`;
  }
  
  // General email stats
  return `📧 **Email Analytics Overview**\n\n` +
         `Connected Account: ${integration.email}\n` +
         `Last Sync: ${integration.lastSync.toLocaleString()}\n\n` +
         `Ask me for:\n` +
         `• "Weekly report" — Last 7 days analysis\n` +
         `• "Monthly trends" — 30-day overview with recommendations\n` +
         `• "Top issues" — Problem identification from email sentiment`;
}

// Main handler
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message } = await req.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 });
  }

  const m = message.toLowerCase();
  const role = session.user.role as string;
  const userId = session.user.id as string;

  const sendResponse = (reply: string, domain: string = 'general') => {
    return NextResponse.json({ 
      reply: reply + getMarketUpdate(role), 
      model: 'rule-based',
      domain
    });
  };

  try {
    // --- PRIORITY 1: Company Context (All Roles) ---
    const companyAnswer = handleCompanyQuestion(m);
    if (companyAnswer) {
      return sendResponse(companyAnswer, 'company-info');
    }

    // --- PRIORITY 2: Competitor Intelligence (Manager + Admin) ---
    const competitorAnswer = handleCompetitorQuestion(m, role);
    if (competitorAnswer) {
      return sendResponse(competitorAnswer, 'competitor');
    }

    // --- PRIORITY 3: Market Trends (Manager + Admin) ---
    const trendsAnswer = handleMarketTrends(m, role);
    if (trendsAnswer) {
      return sendResponse(trendsAnswer, 'trends');
    }

    // --- PRIORITY 4: Email Analytics (Role-Filtered) ---
    const emailAnswer = await handleEmailAnalytics(m, role, userId);
    if (emailAnswer) {
      return sendResponse(emailAnswer, 'analytics');
    }

    // --- PRIORITY 5: Personal Goals (All Roles) ---
    if (/my goals|my progress|how am i doing|my achievements/i.test(m)) {
      const goals = await prisma.goal.findMany({
        where: { employeeId: userId },
        include: { updates: { orderBy: { updatedAt: 'desc' }, take: 1 } }
      });
      
      if (goals.length === 0) {
        return sendResponse('You have no goals assigned yet. Create your first goal from the dashboard.\n\nI can also tell you about Atomberg, our CEO Manoj Meena, or industry trends (if you have access).');
      }

      const lines = goals.map(g => {
        const u = g.updates[0];
        const progress = u ? calculateProgress(g.uomType as UoMType, g.target, u.achievement || 0).toFixed(1) : '0.0';
        return `• ${g.title}: ${progress}% (${u?.status || 'NOT_STARTED'}) — Target: ${g.target}, Achievement: ${u?.achievement || 0} [${g.uomType}]`;
      });

      const avg = (goals.reduce((sum, g) => {
        const u = g.updates[0];
        return sum + (u ? calculateProgress(g.uomType as UoMType, g.target, u.achievement || 0) : 0);
      }, 0) / goals.length).toFixed(1);

      return sendResponse(`Your Goals (${goals.length} total):\n\n${lines.join('\n')}\n\nOverall completion: ${avg}%\n\n💡 Tip: Ask me "weekly report" for email insights or "market trends" for industry updates.`, 'personal-goals');
    }

    // --- PRIORITY 6: Specific Goal (All Roles) ---
    const specificMatch = m.match(/progress on (.+)|status of (.+)|how is (.+) going/i);
    if (specificMatch) {
      const searchTerm = specificMatch[1] || specificMatch[2] || specificMatch[3];
      const where: any = {
        title: { contains: searchTerm.trim(), mode: 'insensitive' }
      };
      
      if (role === 'EMPLOYEE') where.employeeId = userId;
      else if (role === 'MANAGER') where.employee = { managerId: userId };

      const goal = await prisma.goal.findFirst({
        where,
        include: { updates: { orderBy: { updatedAt: 'desc' }, take: 1 }, employee: true }
      });

      if (!goal) {
        return sendResponse(`No goal found matching '${searchTerm}'.\n\nI can help with:\n• Your personal goals and progress\n• Atomberg company information\n• ${role !== 'EMPLOYEE' ? 'Team data, competitors, market trends\n• ' : ''}Email analytics (if connected)`);
      }

      const u = goal.updates[0];
      const progress = u ? calculateProgress(goal.uomType as UoMType, goal.target, u.achievement || 0).toFixed(1) : '0.0';
      const calc = u ? `Calculation: ${u.achievement} / ${goal.target} × 100 = ${progress}%` : 'No check-in submitted yet.';

      return sendResponse(`'${goal.title}' — Progress: ${progress}%\n• Target: ${goal.target} [${goal.uomType}]\n• Achievement: ${u?.achievement || 'N/A'}\n• Status: ${goal.status}\n• Deadline: ${goal.deadline?.toLocaleDateString() || 'N/A'}\n• ${calc}\n• Last Update: ${u?.comment || 'None'}\n\n${role === 'MANAGER' ? `👤 Assigned to: ${goal.employee.name}` : ''}`, 'goal-detail');
    }

    // --- PRIORITY 7: Team Progress (Manager + Admin) ---
    if (/team progress|my team|how is my team doing|team average|subordinates/i.test(m)) {
      if (role === 'EMPLOYEE') {
        return NextResponse.json(forbiddenResponse(role, 'team performance data'));
      }

      const where = role === 'MANAGER' ? { managerId: userId } : {};
      const employees = await prisma.user.findMany({
        where: { ...where, role: 'EMPLOYEE' },
        include: { goals: { include: { updates: { orderBy: { updatedAt: 'desc' }, take: 1 } } } }
      });

      if (employees.length === 0) {
        return sendResponse('No team members found under your management.');
      }

      const memberLines = employees.map(emp => {
        const goalLines = emp.goals.map(g => {
          const u = g.updates[0];
          const p = u ? calculateProgress(g.uomType as UoMType, g.target, u.achievement || 0).toFixed(1) : '0.0';
          return `  • ${g.title}: ${p}% (${u?.status || 'NOT_STARTED'})`;
        });
        const avg = emp.goals.length > 0 
          ? (emp.goals.reduce((sum, g) => sum + (g.updates[0] ? calculateProgress(g.uomType as UoMType, g.target, g.updates[0].achievement || 0) : 0), 0) / emp.goals.length).toFixed(1)
          : '0.0';
        return `[${emp.name}]\n${goalLines.join('\n')}\nAverage: ${avg}%`;
      });

      const allProgress = employees.flatMap(e => e.goals.map(g => g.updates[0] ? calculateProgress(g.uomType as UoMType, g.target, g.updates[0].achievement || 0) : 0));
      const teamAvg = allProgress.length > 0 ? (allProgress.reduce((a,b) => a+b, 0) / allProgress.length).toFixed(1) : '0.0';

      return sendResponse(`Your Team Performance:\n\n${memberLines.join('\n\n')}\n\nTeam Overall Average: ${teamAvg}%\n\n💡 Market Insight: Atomberg holds ${atombergContext.marketPosition.marketShare} market share with ${atombergContext.marketPosition.growth} growth.`, 'team-performance');
    }

    // --- PRIORITY 8: Pending Approvals (Manager + Admin) ---
    if (/pending approvals|goals to review|waiting for approval|approve/i.test(m)) {
      if (role === 'EMPLOYEE') {
        return NextResponse.json(forbiddenResponse(role, 'approval queue data'));
      }

      const where: any = {
        status: { in: ['SUBMITTED', 'RETURNED_FOR_REWORK'] }
      };
      if (role === 'MANAGER') {
        where.employee = { managerId: userId };
      }

      const pending = await prisma.goal.findMany({
        where,
        include: { employee: true, approvals: { orderBy: { timestamp: 'desc' }, take: 1 } }
      });

      if (pending.length === 0) {
        return sendResponse('✅ No goals pending your approval!\n\nWhile you wait, check market trends: "What are competitors doing?"');
      }

      const lines = pending.map((g, i) => {
        const lastAction = g.approvals[0];
        return `${i+1}. '${g.title}' — [${g.employee.name}]\n   Status: ${g.status} | Weightage: ${g.weightage}% | Target: ${g.target}\n   Last Action: ${lastAction?.action || 'SUBMITTED'} on ${lastAction?.timestamp?.toLocaleDateString() || 'N/A'}`;
      });

      return sendResponse(`⏳ You have ${pending.length} goals pending approval:\n\n${lines.join('\n\n')}\n\n⚡ Quick Action: Visit /manager/approvals to review.`, 'approvals');
    }

    // --- PRIORITY 9: Department Performance (Manager + Admin) ---
    if (/department performance|engineering performance|design team|marketing metrics/i.test(m)) {
      if (role === 'EMPLOYEE') {
        return NextResponse.json(forbiddenResponse(role, 'department performance metrics'));
      }

      const deptNameMatch = m.match(/(engineering|design|marketing|sales|hr)/i);
      const deptFilter: any = deptNameMatch 
        ? { name: { contains: deptNameMatch[1], mode: 'insensitive' } }
        : role === 'MANAGER' 
          ? { id: session.user.departmentId }
          : {};

      const dept = await prisma.department.findFirst({
        where: deptFilter,
        include: { users: { where: { role: 'EMPLOYEE' }, include: { goals: { include: { updates: { take: 1 } } } } } }
      });

      if (!dept) {
        return sendResponse('Department not found. Specify: Engineering, Design, Marketing, Sales, or HR.');
      }

      const totalGoals = dept.users.reduce((sum, u) => sum + u.goals.length, 0);
      const completedGoals = dept.users.reduce((sum, u) => sum + u.goals.filter(g => g.status === GoalStatus.APPROVED_LOCKED).length, 0);
      const inProgress = dept.users.reduce((sum, u) => sum + u.goals.filter(g => g.status === GoalStatus.APPROVED_LOCKED || g.status === GoalStatus.SUBMITTED).length, 0); // Simplified status check
      
      const allProgress = dept.users.flatMap(u => u.goals.map(g => g.updates[0] ? calculateProgress(g.uomType as UoMType, g.target, g.updates[0].achievement || 0) : 0));
      const avgProgress = allProgress.length > 0 ? (allProgress.reduce((a,b) => a+b, 0) / allProgress.length).toFixed(1) : '0.0';

      const performers = dept.users
        .map(u => ({ 
          name: u.name, 
          avg: u.goals.length > 0 ? u.goals.reduce((sum, g) => sum + (g.updates[0] ? calculateProgress(g.uomType as UoMType, g.target, g.updates[0].achievement || 0) : 0), 0) / u.goals.length : 0 
        }))
        .sort((a,b) => b.avg - a.avg);

      const topPerformer = performers[0];
      const needsAttention = performers[performers.length - 1];

      return sendResponse(`[${dept.name}] Department Performance:\n• Total Goals: ${totalGoals}\n• Approved & Locked: ${completedGoals}\n• In Progress: ${inProgress}\n• Average Completion: ${avgProgress}%\n• Top Performer: ${topPerformer?.name || 'N/A'} (${topPerformer?.avg.toFixed(1) || 0}%)\n• Needs Attention: ${needsAttention?.name || 'N/A'} (${needsAttention?.avg.toFixed(1) || 0}%)\n• Team Members: ${dept.users.length}\n\n📊 Market Context: ${atombergContext.industryTrends.current[0]}`, 'department-performance');
    }

    // --- PRIORITY 10: Innovation Hub (Manager + Admin) ---
    if (/innovation|ideas submitted|new technology/i.test(m)) {
      if (role === 'EMPLOYEE') {
        return sendResponse('💡 Innovation data is available to Managers and Admins. Submit your ideas through the Innovation Hub page.\n\nDid you know? Atomberg holds 25+ patents in BLDC motor design and IoT.');
      }

      const innovations = await prisma.innovation.findMany({
        include: { submittedBy: true },
        orderBy: { createdAt: 'desc' }
      });

      if (innovations.length === 0) {
        return sendResponse('No innovations submitted yet. Encourage your team to submit ideas!\n\n🔥 Trending: ' + atombergContext.industryTrends.emerging[0]);
      }

      const lines = innovations.map(i => 
        `[${i.status}] ${i.title} — [${i.submittedBy?.name || 'Unknown'}]\nCategory: ${i.category} | Impact: ${i.impact} | Submitted: ${i.createdAt.toLocaleDateString()}`
      );

      return sendResponse(`🔬 Innovation Hub — ${innovations.length} Ideas:\n\n${lines.join('\n\n')}\n\n💡 R&D Focus: ${atombergContext.technology.rndFocus[0]}`, 'innovation');
    }

    // --- PRIORITY 11: Tech Radar (Manager + Admin) ---
    if (/tech radar|technology|adopt|trial|assess|hold/i.test(m)) {
      if (role === 'EMPLOYEE') {
        return NextResponse.json(forbiddenResponse(role, 'tech radar data'));
      }

      const items = await prisma.techRadarItem.findMany({ orderBy: { quadrant: 'asc' } });
      
      if (items.length === 0) {
        return sendResponse('Tech Radar is being configured. Check back soon!\n\n📡 Emerging Tech: ' + atombergContext.industryTrends.technologies.map(t => t.name).join(', '));
      }

      const grouped = items.reduce((acc, item) => {
        acc[item.quadrant] = acc[item.quadrant] || [];
        acc[item.quadrant].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      const lines = Object.entries(grouped).map(([quadrant, items]) => 
        `[${quadrant}]\n${items.map((i: any) => `• ${i.name} (${i.ring}) — ${i.description}`).join('\n')}`
      );

      return sendResponse(`📡 Tech Radar Overview:\n\n${lines.join('\n\n')}\n\n🚀 Recommendation: Consider ${atombergContext.industryTrends.technologies[0].name} for next quarter — Impact: ${atombergContext.industryTrends.technologies[0].impact}`, 'tech-radar');
    }

    // --- PRIORITY 12: Audit Logs (Admin Only) ---
    if (/audit logs|who changed|what happened|history/i.test(m)) {
      if (role !== 'ADMIN') {
        return NextResponse.json(forbiddenResponse(role, 'audit logs'));
      }

      const logs = await prisma.auditLog.findMany({
        take: 20,
        orderBy: { timestamp: 'desc' },
        include: { changedBy: true }
      });

      if (logs.length === 0) {
        return sendResponse('No audit activity found. System is clean!\n\n💡 Tip: Monitor for unauthorized access attempts.');
      }

      const lines = logs.map(l => 
        `[${l.timestamp.toLocaleString()}] ${l.changedBy.name} (${l.changedBy.role})\n→ Changed '${l.fieldName}' on ${l.entityType} '${l.entityId}'\n  FROM: ${l.oldValue || 'N/A'} → TO: ${l.newValue || 'N/A'}`
      );

      return sendResponse(`🔒 Recent Audit Activity (Last 20):\n\n${lines.join('\n\n')}\n\n⚠️ Security: Review any suspicious activity immediately.`, 'audit');
    }

    // --- PRIORITY 13: Calendar / Events (All Roles, Filtered) ---
    if (/calendar|events|when is|upcoming|deadline|meeting/i.test(m)) {
      const userGoalIds = role === 'EMPLOYEE' 
        ? (await prisma.goal.findMany({ where: { employeeId: userId }, select: { id: true } })).map(g => g.id)
        : role === 'MANAGER'
          ? (await prisma.goal.findMany({ where: { employee: { managerId: userId } }, select: { id: true } })).map(g => g.id)
          : [];

      const where: any = role === 'ADMIN' ? {} : {
        OR: [
          { type: 'MEETING' },
          { relatedId: { in: userGoalIds } }
        ]
      };

      const events = await prisma.calendarEvent.findMany({
        where,
        orderBy: { date: 'asc' },
        take: 10
      });

      if (events.length === 0) {
        return sendResponse('No upcoming events found.\n\n📅 Tip: Schedule regular 1:1s with your team to track goal progress.');
      }

      const lines = events.map(e => 
        `[${e.date.toLocaleString()}] ${e.title} — ${e.type}\n${e.description}${e.relatedId ? ` (Related to goal: ${e.relatedId})` : ''}`
      );

      return sendResponse(`📅 Upcoming Events:\n\n${lines.join('\n\n')}\n\n⏰ Next check-in deadline approaching. Don't forget to update your goals!`, 'calendar');
    }

    // --- PRIORITY 14: Weightage Validation (Admin + Manager) ---
    if (/weightage|total weight|100 percent|goal distribution/i.test(m)) {
      if (role === 'EMPLOYEE') {
        return NextResponse.json(forbiddenResponse(role, 'weightage validation reports'));
      }

      const employees = await prisma.user.findMany({
        where: role === 'MANAGER' ? { managerId: userId } : { role: 'EMPLOYEE' },
        include: { goals: true }
      });

      const lines = employees.map(emp => {
        const total = emp.goals.reduce((sum, g) => sum + g.weightage, 0);
        const valid = total === 100 && emp.goals.every(g => g.weightage >= 10) && emp.goals.length <= 8;
        const dist = emp.goals.map(g => `${g.weightage}%`).join(', ');
        const issues = [];
        if (total !== 100) issues.push(`Total is ${total}% (should be 100%)`);
        if (emp.goals.some(g => g.weightage < 10)) issues.push('Some goals <10%');
        if (emp.goals.length > 8) issues.push('Too many goals (>8)');
        
        return `[${emp.name}] — ${emp.goals.length} goals, Total: ${total}% ${valid ? '✅' : '❌'}\n  Distribution: ${dist}${issues.length > 0 ? '\n  ⚠️ Issues: ' + issues.join(', ') : ''}`;
      });

      const invalidCount = lines.filter(l => l.includes('❌')).length;

      return sendResponse(`⚖️ Weightage Validation Report:\n\n${lines.join('\n\n')}\n\n${invalidCount > 0 ? `⚠️ ${invalidCount} employee(s) need weightage correction.` : '✅ All weightages are valid!'}`, 'weightage');
    }

    // --- PRIORITY 15: Cycle Windows (Admin Only) ---
    if (/cycle|goal period|quarter|window/i.test(m)) {
      if (role !== 'ADMIN') {
        return NextResponse.json(forbiddenResponse(role, 'cycle configuration'));
      }

      const cycles = await prisma.cycleWindow.findMany({
        orderBy: { startDate: 'desc' },
        take: 5
      });

      const lines = cycles.map(c => 
        `[${c.phase}] ${c.startDate.toLocaleDateString()} → ${c.endDate.toLocaleDateString()}\nStatus: ${c.isActive ? 'ACTIVE' : 'INACTIVE'} | Quarter: ${c.quarter}`
      );

      return sendResponse(`🔄 Goal Cycle Windows:\n\n${lines.join('\n\n')}\n\n💡 Tip: Ensure all goals are aligned with the current cycle before locking.`, 'cycles');
    }

    // --- FALLBACK: Unknown Question with Smart Suggestions ---
    const snippets = [
      `Atomberg Technologies, founded in 2012 by Manoj Meena and Sibiraj Pradhan, is pioneering BLDC motor technology in India.`,
      `Our CEO, Manoj Meena (IIT Bombay alumnus), envisions making energy-efficient appliances accessible to every Indian household.`,
      `Atomberg's core technology, BLDC, allows our fans to use 65% less power than conventional induction motor fans.`,
      `With 25+ patents and a fully automated manufacturing facility in Mumbai, Atomberg is at the forefront of appliance innovation.`
    ];
    const randomSnippet = snippets[Math.floor(Math.random() * snippets.length)];

    return sendResponse(`I don't have access to that specific information. Please ask regarding your domain (Goals, Team, Department) or Atomberg company data.\n\n**Did you know?** ${randomSnippet}\n\nHere is what I can help you with based on your ${role} role:\n\n` +
             (role === 'EMPLOYEE' 
               ? `📋 **Personal Data:**\n• Your goals and progress\n• Calendar events and deadlines\n• Email analytics (if connected)\n\n🏢 **Company Info:**\n• About Atomberg and our CEO Manoj Meena\n• Products and technology\n\n❓ Try asking: "my goals", "who is the CEO", or "calendar"`
               : role === 'MANAGER'
               ? `📊 **Team Management:**\n• Team progress and performance\n• Pending approvals\n• Department metrics\n• Weightage validation\n\n🌐 **Market Intelligence:**\n• Competitor analysis (Orient, Crompton, Havells)\n• Industry trends and emerging tech\n\n📧 **Email Analytics:**\n• Weekly/monthly team reports\n• Problem identification\n\n❓ Try asking: "team progress", "competitors", or "weekly report"`
               : `🔧 **System Administration:**\n• Audit logs and history\n• All departments and users\n\n🌐 **Market Intelligence:**\n• Competitor analysis\n• Industry trends\n\n❓ Try asking: "audit logs", "department performance", or "monthly trends"`), 'fallback');

  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json({ 
      error: 'Failed to process request. Please try again or contact support.' 
    }, { status: 500 });
  }
}
