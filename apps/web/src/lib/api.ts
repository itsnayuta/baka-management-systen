// ponytail: Lightweight fetch wrapper with zero external HTTP client dependencies (Axios-free)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface UserProfile {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  role: string;
  departmentName?: string;
  portal?: 'EMPLOYEE_PORTAL' | 'MANAGEMENT_PORTAL';
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(errorData.message || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  // Auth endpoints
  async login(employeeCode: string, password: string, portal: 'EMPLOYEE_PORTAL' | 'MANAGEMENT_PORTAL') {
    return this.request<{ accessToken: string; user: UserProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ employeeCode, password, portal }),
    });
  }

  // Attendance endpoints
  async checkIn(latitude: number, longitude: number) {
    return this.request('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude }),
    });
  }

  async checkOut(latitude: number, longitude: number) {
    return this.request('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude }),
    });
  }

  async getAttendanceHistory() {
    return this.request<any[]>('/attendance/history');
  }

  // Tasks & EVM endpoints
  async getMyTasks() {
    return this.request<any[]>('/tasks/my-tasks');
  }

  async logWork(taskId: string, hoursSpent: number, description?: string) {
    return this.request('/tasks/worklog', {
      method: 'POST',
      body: JSON.stringify({ taskId, hoursSpent, description }),
    });
  }

  async getProjects() {
    return this.request<any[]>('/tasks/projects');
  }

  async getWorkloadHeatmap() {
    return this.request<any[]>('/tasks/workload/heatmap');
  }

  // Finance endpoints
  async getFinanceDashboard() {
    return this.request<{
      totalRevenue: number;
      totalExpense: number;
      netProfit: number;
      cashBalance: number;
      burnRatePerMonth: number;
      runwayMonths: number;
    }>('/finance/dashboard');
  }

  async getLedger() {
    return this.request<any[]>('/finance/ledger');
  }

  async createJournalEntry(dto: {
    description: string;
    referenceCode?: string;
    entries: Array<{ accountCode: string; debitAmount: number; creditAmount: number }>;
  }) {
    return this.request('/finance/journal-entry', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  // Payroll endpoints
  async getMyPayslips() {
    return this.request<any[]>('/payroll/my-payslips');
  }

  async calculateMonthlyPayroll(month: number, year: number) {
    return this.request<any[]>(`/payroll/calculate?month=${month}&year=${year}`, {
      method: 'POST',
    });
  }

  // Approvals endpoints
  async getMyApprovalRequests() {
    return this.request<any[]>('/approvals/my-requests');
  }

  async createApprovalRequest(dto: {
    title: string;
    type: string;
    amount?: number;
    description: string;
  }) {
    return this.request('/approvals/request', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async getPendingApprovals() {
    return this.request<any[]>('/approvals/pending');
  }

  async decideApproval(requestId: string, action: 'APPROVE' | 'REJECT', comments?: string) {
    return this.request(`/approvals/${requestId}/decide`, {
      method: 'POST',
      body: JSON.stringify({ action, comments }),
    });
  }
}

export const api = new ApiClient();
