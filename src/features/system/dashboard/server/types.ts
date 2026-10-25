export type DashboardRecentLead = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: string;
  source: string | null;
  createdAt: string;
};

export type DashboardData = {
  newLeadsThisMonth: number;
  recentLeads: DashboardRecentLead[];
};
