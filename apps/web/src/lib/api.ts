// ponytail: Lightweight fetch wrapper with zero external HTTP client dependencies (Axios-free)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  employee?: {
    id: string;
    employeeCode: string;
    fullName: string;
    department?: {
      name: string;
    };
  };
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
      const msg = Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message;
      throw new Error(msg || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  // ================= Auth Endpoints =================
  async login(email: string, password: string, portal: 'employee-portal' | 'management-portal') {
    return this.request<{ accessToken: string; portal: string; user: UserProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, portal }),
    });
  }

  // ================= Attendance Endpoints (Self / ESS) =================
  async checkIn(latitude: number, longitude: number) {
    return this.request('/self/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude }),
    });
  }

  async checkOut(latitude: number, longitude: number) {
    return this.request('/self/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude }),
    });
  }

  async getAttendanceHistory() {
    return this.request<any[]>('/self/attendance/history');
  }

  // ================= Tasks & Progress Management (Employee) =================
  async getMyTasks() {
    return this.request<any[]>('/self/tasks');
  }

  async updateMyTaskStatus(taskId: string, status: string) {
    return this.request(`/self/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async logWork(taskId: string, hours: number, description?: string) {
    return this.request(`/self/tasks/${taskId}/work-log`, {
      method: 'POST',
      body: JSON.stringify({ hours, description }),
    });
  }

  // ================= Tasks & Progress Management (Management Operations) =================
  async getProjects() {
    return this.request<any[]>('/management/operations/projects');
  }

  async createProject(dto: {
    projectCode: string;
    name: string;
    description?: string;
    managerId?: string;
    estimatedBudget: number;
    startDate?: string;
    deadline?: string;
  }) {
    return this.request('/management/operations/projects', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async getAllTasks(projectId?: string) {
    const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return this.request<any[]>(`/management/operations/tasks${qs}`);
  }

  async createTask(dto: {
    projectId: string;
    title: string;
    description?: string;
    priority?: string;
    estimatedHours: number;
    dueDate?: string;
    assigneeIds?: string[];
  }) {
    return this.request('/management/operations/tasks', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateTaskStatusForManager(taskId: string, status: string) {
    return this.request(`/management/operations/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getEmployees() {
    return this.request<any[]>('/management/operations/employees');
  }

  async getWorkloadHeatmap() {
    return this.request<any[]>('/management/operations/workload-heatmap');
  }

  // ================= Finance Endpoints =================
  async getFinanceDashboard() {
    return this.request<{
      totalRevenue: number;
      totalExpense: number;
      netProfit: number;
      cashBalance: number;
      burnRatePerMonth: number;
      runwayMonths: number;
    }>('/management/finance/dashboard');
  }

  async getLedger() {
    return this.request<any[]>('/management/finance/ledger');
  }

  async createJournalEntry(dto: {
    description: string;
    referenceCode?: string;
    entries: Array<{ accountCode: string; debitAmount: number; creditAmount: number }>;
  }) {
    return this.request('/management/finance/journal-entry', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  // ================= Payroll Endpoints =================
  async getMyPayslips() {
    return this.request<any[]>('/self/payroll/my-payslips');
  }

  async calculateMonthlyPayroll(month: number, year: number) {
    return this.request<any[]>(`/management/payroll/calculate?month=${month}&year=${year}`, {
      method: 'POST',
    });
  }

  // ================= Approvals Endpoints =================
  async getMyApprovalRequests() {
    return this.request<any[]>('/self/approvals/my-requests');
  }

  async createApprovalRequest(dto: {
    title: string;
    type: string;
    amount?: number;
    description: string;
  }) {
    return this.request('/self/approvals/requests', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async getPendingApprovals() {
    return this.request<any[]>('/management/approvals/pending');
  }

  async decideApproval(requestId: string, action: 'APPROVE' | 'REJECT', comments?: string) {
    return this.request(`/management/approvals/${requestId}/decide`, {
      method: 'POST',
      body: JSON.stringify({ action, comments }),
    });
  }
}

export const api = new ApiClient();
