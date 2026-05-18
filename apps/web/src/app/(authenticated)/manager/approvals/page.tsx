"use client";

import ApprovalsDashboard from "@/components/approvals/ApprovalsDashboard";

export default function ApprovalsQueue() {
  return (
    <div className="h-[calc(100vh-100px)] flex flex-col animate-fade-in">
      <div className="page-header shrink-0">
        <div>
          <h1 className="page-title">Manager Approval Queue</h1>
          <p className="page-subtitle">Review and manage team goals through the workflow</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ApprovalsDashboard />
      </div>
    </div>
  );
}

