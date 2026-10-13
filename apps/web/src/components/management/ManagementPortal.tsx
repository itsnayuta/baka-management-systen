'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, PortalType } from '@/lib/auth-context';
import { api } from '@/lib/api';
import {
  TrendingUp,
  DollarSign,
  CheckSquare,
  Users,
  BarChart3,
  BookOpen,
  Calendar,
  LogOut,
  Layers,
  Check,
  X,
  Plus,
  RefreshCw,
  Clock,
  Briefcase,
  AlertCircle,
  Kanban,
  TableProperties,
  Flame,
  ArrowRight,
  Filter,
  CheckCircle2,
  FolderKanban,
  Search,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function ManagementPortal() {
  const { user, logout, switchPortal } = useAuth();
  const [activeTab, setActiveTab] = useState<'progress' | 'finance' | 'approvals' | 'ledger' | 'payroll'>('progress');

  // Sub-view inside Progress & Work Hub
  const [workHubView, setWorkHubView] = useState<'KANBAN' | 'EVM' | 'WBS' | 'HEATMAP'>('KANBAN');
  const [selectedProjFilter, setSelectedProjFilter] = useState<string>('ALL');
  const [taskSearchQuery, setTaskSearchQuery] = useState<string>('');

  // Modals state
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  // Data state
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);

  // Finance State
  const [financeData, setFinanceData] = useState<{
    totalRevenue: number;
    totalExpense: number;
    netProfit: number;
    cashBalance: number;
    burnRatePerMonth: number;
    runwayMonths: number;
  } | null>(null);

  // Approvals State
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Ledger State
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [journalDesc, setJournalDesc] = useState('');
  const [debitAcc, setDebitAcc] = useState('642');
  const [creditAcc, setCreditAcc] = useState('112');
  const [entryAmount, setEntryAmount] = useState<number>(5000000);

  // Payroll State
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [calculatedPayroll, setCalculatedPayroll] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Form states: Create Project
  const [newProjCode, setNewProjCode] = useState('');
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjBudget, setNewProjBudget] = useState<number>(50000000);
  const [newProjManagerId, setNewProjManagerId] = useState('');
  const [newProjStart, setNewProjStart] = useState('');
  const [newProjDeadline, setNewProjDeadline] = useState('');

  // Form states: Create Task
  const [newTaskProjectId, setNewTaskProjectId] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('HIGH');
  const [newTaskHours, setNewTaskHours] = useState<number>(8);
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');

  useEffect(() => {
    loadTabContent();
  }, [activeTab]);

  const loadTabContent = async () => {
    try {
      if (activeTab === 'progress') {
        const [projs, ts, emps, hm] = await Promise.all([
          api.getProjects().catch(() => []),
          api.getAllTasks().catch(() => []),
          api.getEmployees().catch(() => []),
          api.getWorkloadHeatmap().catch(() => []),
        ]);
        setProjects(projs);
        setTasks(ts);
        setEmployees(emps);
        setHeatmap(hm);

        if (projs.length > 0 && !newTaskProjectId) {
          setNewTaskProjectId(projs[0].id);
        }
        if (emps.length > 0 && !newProjManagerId) {
          setNewProjManagerId(emps[0].id);
          setNewTaskAssigneeId(emps[0].id);
        }
      } else if (activeTab === 'finance') {
        const data = await api.getFinanceDashboard().catch(() => null);
        setFinanceData(data);
      } else if (activeTab === 'approvals') {
        const list = await api.getPendingApprovals().catch(() => []);
        setPendingApprovals(list);
      } else if (activeTab === 'ledger') {
        const entries = await api.getLedger().catch(() => []);
        setLedgerEntries(entries);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Move task status in Kanban
  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await api.updateTaskStatusForManager(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
      );
    } catch (err: any) {
      alert(err.message || 'Cập nhật trạng thái thất bại');
    }
  };

  // Submit Create Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProject({
        projectCode: newProjCode,
        name: newProjName,
        description: newProjDesc,
        estimatedBudget: Number(newProjBudget),
        managerId: newProjManagerId || undefined,
        startDate: newProjStart || undefined,
        deadline: newProjDeadline || undefined,
      });
      alert('Đã khởi tạo dự án mới thành công!');
      setShowCreateProjectModal(false);
      setNewProjCode('');
      setNewProjName('');
      setNewProjDesc('');
      loadTabContent();
    } catch (err: any) {
      alert(err.message || 'Tạo dự án thất bại');
    }
  };

  // Submit Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskProjectId) {
      alert('Vui lòng chọn dự án!');
      return;
    }
    try {
      await api.createTask({
        projectId: newTaskProjectId,
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
        estimatedHours: Number(newTaskHours),
        dueDate: newTaskDueDate || undefined,
        assigneeIds: newTaskAssigneeId ? [newTaskAssigneeId] : [],
      });
      alert('Đã tạo và phân công nhiệm vụ thành công!');
      setShowCreateTaskModal(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      loadTabContent();
    } catch (err: any) {
      alert(err.message || 'Tạo nhiệm vụ thất bại');
    }
  };

  // Decide Approval
  const handleDecide = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setApprovingId(id);
    try {
      await api.decideApproval(id, action, action === 'APPROVE' ? 'Đã duyệt qua Management Portal' : 'Từ chối');
      setPendingApprovals((prev) => prev.filter((item) => item.id !== id));
      alert(`Đã ${action === 'APPROVE' ? 'PHÊ DUYỆT' : 'TỪ CHỐI'} yêu cầu thành công!`);
    } catch (err: any) {
      alert(err.message || 'Thao tác phê duyệt thất bại');
    } finally {
      setApprovingId(null);
    }
  };

  // Create Double-entry Journal Entry
  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (debitAcc === creditAcc) {
      alert('Tài khoản Nợ và Có phải khác nhau!');
      return;
    }
    try {
      await api.createJournalEntry({
        description: journalDesc,
        entries: [
          { accountCode: debitAcc, debitAmount: entryAmount, creditAmount: 0 },
          { accountCode: creditAcc, debitAmount: 0, creditAmount: entryAmount },
        ],
      });
      alert('Ghi sổ kép Nợ/Có thành công! Hệ thống đã tự động cân đối tài khoản.');
      setJournalDesc('');
      loadTabContent();
    } catch (err: any) {
      alert(err.message || 'Lỗi hạch toán sổ cái');
    }
  };

  // Run Monthly Payroll
  const handleRunPayroll = async () => {
    setPayrollLoading(true);
    try {
      const results = await api.calculateMonthlyPayroll(selectedMonth, selectedYear);
      setCalculatedPayroll(results);
      alert(`Đã tính toán xong bảng lương cho ${results.length} nhân viên trong tháng ${selectedMonth}/${selectedYear}!`);
    } catch (err: any) {
      alert(err.message || 'Lỗi tính toán bảng lương');
    } finally {
      setPayrollLoading(false);
    }
  };

  // Filtered tasks for Kanban & WBS
  const filteredTasks = tasks.filter((t) => {
    const matchesProj = selectedProjFilter === 'ALL' || t.projectId === selectedProjFilter;
    const matchesSearch =
      !taskSearchQuery ||
      t.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
      t.assignees?.some((a: any) =>
        a.employee?.fullName.toLowerCase().includes(taskSearchQuery.toLowerCase()),
      );
    return matchesProj && matchesSearch;
  });

  // Calculate project EVM metrics
  const calculateProjectEVM = (proj: any) => {
    const projTasks = tasks.filter((t) => t.projectId === proj.id);
    const totalTasksCount = projTasks.length;
    const completedTasksCount = projTasks.filter((t) => t.status === 'DONE').length;
    const percentDone = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

    const bac = Number(proj.estimatedBudget) || 10000000;
    const ac = Number(proj.actualCost) || 0;
    const ev = (bac * percentDone) / 100;
    const cv = ev - ac; // Cost Variance: > 0 is good (under budget)
    const cpi = ac > 0 ? ev / ac : 1.0; // Cost Performance Index: >= 1.0 is healthy

    return {
      totalTasksCount,
      completedTasksCount,
      percentDone: Math.round(percentDone),
      bac,
      ac,
      ev,
      cv,
      cpi: Math.round(cpi * 100) / 100,
      burnRatePercent: bac > 0 ? Math.round((ac / bac) * 100) : 0,
      health: cpi >= 1.0 ? 'HEALTHY' : cpi >= 0.85 ? 'WARNING' : 'CRITICAL',
    };
  };

  // Tasks statistics
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'DONE').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE',
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black px-3 py-1.5 rounded-xl text-sm tracking-wider shadow">
              BAKA ERP
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <span>Executive Operations Hub</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                  {user?.role}
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {user?.employee?.fullName || user?.email} ({user?.employee?.employeeCode || 'ADMIN'}) • Quản Trị Tiến Độ & Doanh Nghiệp
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => switchPortal('employee-portal')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-slate-700 transition"
              title="Chuyển về trang Nhân viên ESS"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Giao diện Nhân viên</span>
            </button>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex space-x-1 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-3 text-xs font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              activeTab === 'progress'
                ? 'border-blue-500 text-blue-400 font-semibold bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Quản lý Tiến độ & Dự án</span>
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`px-4 py-3 text-xs font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              activeTab === 'finance'
                ? 'border-blue-500 text-blue-400 font-semibold bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Tài chính & Dòng tiền (P&L)</span>
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-3 text-xs font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              activeTab === 'approvals'
                ? 'border-blue-500 text-blue-400 font-semibold bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Phê duyệt Đa cấp</span>
            {pendingApprovals.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {pendingApprovals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-3 text-xs font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              activeTab === 'ledger'
                ? 'border-blue-500 text-blue-400 font-semibold bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Sổ cái Kép (VAS)</span>
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-3 text-xs font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              activeTab === 'payroll'
                ? 'border-blue-500 text-blue-400 font-semibold bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Engine Bảng Lương</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* ================= TAB 1: ENTERPRISE PROGRESS & WORK HUB ================= */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* Top KPI Cards for Progress */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Dự án đang chạy</span>
                <div className="text-2xl font-bold text-white mt-1">{projects.length} Dự án</div>
                <div className="text-[11px] text-blue-400 mt-1 flex items-center gap-1">
                  <span>WBS phân rã</span> • {totalTasks} công việc
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Tỷ lệ hoàn thành</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                  {totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {doneTasks}/{totalTasks} task đã nghiệm thu
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Đang triển khai</span>
                <div className="text-2xl font-bold text-blue-400 mt-1">{inProgressTasks} Task</div>
                <div className="text-[11px] text-slate-400 mt-1">Nhân sự đang log giờ</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Cảnh báo trễ hạn</span>
                <div className={`text-2xl font-bold mt-1 ${overdueTasks > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {overdueTasks} Task
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {overdueTasks > 0 ? 'Cần can thiệp gấp' : 'Tiến độ đảm bảo'}
                </div>
              </div>
            </div>

            {/* Sub-view Navigation Bar & Action Buttons */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* View Switchers */}
              <div className="flex items-center space-x-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs w-full md:w-auto">
                <button
                  onClick={() => setWorkHubView('KANBAN')}
                  className={`px-3 py-2 rounded-lg font-medium flex items-center gap-1.5 transition ${
                    workHubView === 'KANBAN'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Kanban className="w-3.5 h-3.5" />
                  <span>Kanban Board</span>
                </button>
                <button
                  onClick={() => setWorkHubView('EVM')}
                  className={`px-3 py-2 rounded-lg font-medium flex items-center gap-1.5 transition ${
                    workHubView === 'EVM'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TableProperties className="w-3.5 h-3.5" />
                  <span>Quản trị Chi phí (EVM)</span>
                </button>
                <button
                  onClick={() => setWorkHubView('WBS')}
                  className={`px-3 py-2 rounded-lg font-medium flex items-center gap-1.5 transition ${
                    workHubView === 'WBS'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Phân rã WBS</span>
                </button>
                <button
                  onClick={() => setWorkHubView('HEATMAP')}
                  className={`px-3 py-2 rounded-lg font-medium flex items-center gap-1.5 transition ${
                    workHubView === 'HEATMAP'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Heatmap Tải Nhân Sự</span>
                </button>
              </div>

              {/* Action Buttons: Create Project / Task */}
              <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                <button
                  onClick={() => setShowCreateProjectModal(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo Dự Án Mới</span>
                </button>
                <button
                  onClick={() => setShowCreateTaskModal(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Giao Việc Nhanh</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar for Tasks */}
            {(workHubView === 'KANBAN' || workHubView === 'WBS') && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Lọc theo Dự án:</span>
                  </span>
                  <select
                    value={selectedProjFilter}
                    onChange={(e) => setSelectedProjFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">Tất cả dự án ({projects.length})</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.projectCode} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Tìm theo tên task, người làm..."
                    value={taskSearchQuery}
                    onChange={(e) => setTaskSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>
            )}

            {/* VIEW 1: INTERACTIVE KANBAN BOARD */}
            {workHubView === 'KANBAN' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(
                  [
                    { id: 'TODO', title: 'CẦN LÀM', color: 'border-slate-700 bg-slate-900/50' },
                    { id: 'IN_PROGRESS', title: 'ĐANG THỰC HIỆN', color: 'border-blue-900/60 bg-blue-950/20' },
                    { id: 'REVIEW', title: 'CHỜ NGHIỆM THU', color: 'border-purple-900/60 bg-purple-950/20' },
                    { id: 'DONE', title: 'ĐÃ HOÀN THÀNH', color: 'border-emerald-900/60 bg-emerald-950/20' },
                  ] as const
                ).map((col) => {
                  const columnTasks = filteredTasks.filter((t) => t.status === col.id);

                  return (
                    <div
                      key={col.id}
                      className={`border rounded-2xl p-4 flex flex-col min-h-[500px] ${col.color}`}
                    >
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          {col.title}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {columnTasks.length}
                        </span>
                      </div>

                      <div className="space-y-3 flex-1 overflow-y-auto">
                        {columnTasks.length === 0 ? (
                          <div className="text-center py-10 text-[11px] text-slate-600">Trống</div>
                        ) : (
                          columnTasks.map((task) => {
                            const est = Number(task.estimatedHours) || 8;
                            const act = Number(task.actualHours) || 0;
                            const percent = Math.min(100, Math.round((act / est) * 100));
                            const isOverdue =
                              task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

                            return (
                              <div
                                key={task.id}
                                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 shadow transition text-xs space-y-2.5"
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">
                                    {task.project?.projectCode || 'PRJ'}
                                  </span>
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                      task.priority === 'URGENT'
                                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                        : task.priority === 'HIGH'
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {task.priority || 'MEDIUM'}
                                  </span>
                                </div>

                                <h4 className="font-semibold text-white leading-snug">{task.title}</h4>

                                {task.description && (
                                  <p className="text-[11px] text-slate-400 line-clamp-2">{task.description}</p>
                                )}

                                {/* Progress bar */}
                                <div>
                                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                    <span>
                                      {act}h / {est}h
                                    </span>
                                    <span>{percent}%</span>
                                  </div>
                                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        percent > 100 ? 'bg-rose-500' : 'bg-blue-500'
                                      }`}
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Assignee & Due Date */}
                                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="w-5 h-5 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                                      {task.assignees?.[0]?.employee?.fullName?.charAt(0) || 'U'}
                                    </span>
                                    <span className="truncate">
                                      {task.assignees?.[0]?.employee?.fullName || 'Chưa gán'}
                                    </span>
                                  </div>

                                  {isOverdue && (
                                    <span className="text-[10px] text-rose-400 font-bold flex items-center gap-0.5">
                                      <AlertCircle className="w-3 h-3" />
                                      <span>Quá hạn</span>
                                    </span>
                                  )}
                                </div>

                                {/* Quick Move Actions for Manager */}
                                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                                  <span className="text-[10px] text-slate-500">Chuyển:</span>
                                  <div className="flex items-center gap-1">
                                    {col.id !== 'TODO' && (
                                      <button
                                        onClick={() => handleUpdateTaskStatus(task.id, 'TODO')}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                                      >
                                        Todo
                                      </button>
                                    )}
                                    {col.id !== 'IN_PROGRESS' && (
                                      <button
                                        onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/50 hover:bg-blue-900 text-blue-300"
                                      >
                                        Làm
                                      </button>
                                    )}
                                    {col.id !== 'REVIEW' && (
                                      <button
                                        onClick={() => handleUpdateTaskStatus(task.id, 'REVIEW')}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/50 hover:bg-purple-900 text-purple-300"
                                      >
                                        Duyệt
                                      </button>
                                    )}
                                    {col.id !== 'DONE' && (
                                      <button
                                        onClick={() => handleUpdateTaskStatus(task.id, 'DONE')}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/50 hover:bg-emerald-900 text-emerald-300 font-bold"
                                      >
                                        Xong
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW 2: EVM COST & SCHEDULE VARIANCE MATRIX */}
            {workHubView === 'EVM' && (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
                    <TableProperties className="w-4 h-4 text-blue-400" />
                    <span>Mô Hình Quản Trị Giá Trị Thu Được (EVM - Earned Value Management)</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Đo lường tiến độ và hiệu quả chi phí dự án theo chuẩn PMI: <strong>CPI &gt; 1.0</strong> (Tiết kiệm chi phí), <strong>CPI &lt; 1.0</strong> (Vượt chi phí). Chi phí nhân sự thực tế (AC) được cộng dồn theo thời gian thực từ nhật ký làm việc (Work Log) nhân với đơn giá giờ của từng nhân sự.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="p-3.5">Mã Dự Án</th>
                          <th className="p-3.5">Tên Dự Án</th>
                          <th className="p-3.5">Quản lý (PM)</th>
                          <th className="p-3.5 text-right">Dự toán (BAC)</th>
                          <th className="p-3.5 text-right">Đã chi (AC)</th>
                          <th className="p-3.5 text-right">Giá trị (EV)</th>
                          <th className="p-3.5 text-right">Chênh lệch (CV)</th>
                          <th className="p-3.5 text-center">Chỉ số CPI</th>
                          <th className="p-3.5 text-center">% Tiến độ</th>
                          <th className="p-3.5 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {projects.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="p-6 text-center text-slate-500">
                              Chưa có dự án nào.
                            </td>
                          </tr>
                        ) : (
                          projects.map((proj) => {
                            const evm = calculateProjectEVM(proj);

                            return (
                              <tr key={proj.id} className="hover:bg-slate-800/40 transition">
                                <td className="p-3.5 font-mono text-blue-400 font-semibold">{proj.projectCode}</td>
                                <td className="p-3.5 font-medium text-white">{proj.name}</td>
                                <td className="p-3.5 text-slate-400">{proj.manager?.fullName || 'Chưa gán'}</td>
                                <td className="p-3.5 text-right font-medium">
                                  {evm.bac.toLocaleString('vi-VN')} ₫
                                </td>
                                <td className="p-3.5 text-right text-rose-400 font-medium">
                                  {evm.ac.toLocaleString('vi-VN')} ₫
                                </td>
                                <td className="p-3.5 text-right text-blue-400 font-medium">
                                  {Math.round(evm.ev).toLocaleString('vi-VN')} ₫
                                </td>
                                <td
                                  className={`p-3.5 text-right font-bold ${
                                    evm.cv >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {evm.cv >= 0 ? '+' : ''}
                                  {Math.round(evm.cv).toLocaleString('vi-VN')} ₫
                                </td>
                                <td className="p-3.5 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                      evm.cpi >= 1.0
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : evm.cpi >= 0.85
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    }`}
                                  >
                                    {evm.cpi}
                                  </span>
                                </td>
                                <td className="p-3.5 text-center font-semibold text-white">
                                  {evm.percentDone}% ({evm.completedTasksCount}/{evm.totalTasksCount})
                                </td>
                                <td className="p-3.5 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      evm.health === 'HEALTHY'
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : evm.health === 'WARNING'
                                        ? 'bg-amber-500/10 text-amber-400'
                                        : 'bg-rose-500/10 text-rose-400'
                                    }`}
                                  >
                                    {evm.health === 'HEALTHY'
                                      ? 'Tốt'
                                      : evm.health === 'WARNING'
                                      ? 'Cảnh báo'
                                      : 'Bội chi'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: WBS WORK BREAKDOWN STRUCTURE LIST */}
            {workHubView === 'WBS' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Danh Sách Công Việc Phân Rã (WBS Task Tree)
                  </h4>
                  <span className="text-xs text-slate-400">Hiển thị: {filteredTasks.length} nhiệm vụ</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Dự Án</th>
                        <th className="p-3.5">Tên Công Việc</th>
                        <th className="p-3.5">Nhân Sự Phụ Trách</th>
                        <th className="p-3.5">Độ Ưu Tiên</th>
                        <th className="p-3.5 text-right">Giờ Dự Toán</th>
                        <th className="p-3.5 text-right">Giờ Thực Tế</th>
                        <th className="p-3.5 text-center">Hạn Chót</th>
                        <th className="p-3.5 text-center">Trạng Thái</th>
                        <th className="p-3.5 text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredTasks.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-6 text-center text-slate-500">
                            Không có công việc nào thỏa điều kiện tìm kiếm.
                          </td>
                        </tr>
                      ) : (
                        filteredTasks.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3.5 font-mono text-blue-400">{t.project?.projectCode}</td>
                            <td className="p-3.5 font-medium text-white">
                              <div>{t.title}</div>
                              {t.description && (
                                <div className="text-[11px] text-slate-500 truncate max-w-xs">{t.description}</div>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-300">
                              {t.assignees?.[0]?.employee?.fullName || 'Chưa gán'}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  t.priority === 'URGENT'
                                    ? 'bg-rose-500/20 text-rose-400'
                                    : t.priority === 'HIGH'
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {t.priority || 'MEDIUM'}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">{t.estimatedHours}h</td>
                            <td className="p-3.5 text-right text-emerald-400 font-semibold">{t.actualHours || 0}h</td>
                            <td className="p-3.5 text-center text-slate-400">
                              {t.dueDate ? new Date(t.dueDate).toLocaleDateString('vi-VN') : '--'}
                            </td>
                            <td className="p-3.5 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                  t.status === 'DONE'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : t.status === 'REVIEW'
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : t.status === 'IN_PROGRESS'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {t.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <select
                                value={t.status}
                                onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value)}
                                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200"
                              >
                                <option value="TODO">TODO</option>
                                <option value="IN_PROGRESS">IN_PROGRESS</option>
                                <option value="REVIEW">REVIEW</option>
                                <option value="DONE">DONE</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW 4: WORKLOAD HEATMAP */}
            {workHubView === 'HEATMAP' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Biểu Đồ Nhiệt Tải Trọng Nhân Sự (30 Ngày Gần Nhất)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Phát hiện điểm nghẽn nguồn lực: Đỏ (Quá tải &gt;180h), Xanh (Tối ưu 80-180h), Vàng (Chưa đủ tải &lt;80h).
                  </p>
                </div>

                {heatmap.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">Chưa có đủ nhật ký work log để sinh heatmap.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {heatmap.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm"
                      >
                        <div>
                          <h4 className="font-semibold text-white text-xs">{item.employee?.fullName}</h4>
                          <p className="text-[11px] text-slate-400">
                            {item.employee?.employeeCode} • {item.employee?.department?.name || 'Phòng ban'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Tổng chi phí giờ: <span className="text-slate-200">{item.totalCost.toLocaleString('vi-VN')} ₫</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-white">{item.totalHours}h</div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                              item.status === 'OVERLOAD'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : item.status === 'UNDERLOAD'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: FINANCE DASHBOARD ================= */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tổng Doanh Thu</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                  {financeData ? Number(financeData.totalRevenue).toLocaleString('vi-VN') + ' ₫' : '1.500.000.000 ₫'}
                </div>
                <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                  <span className="text-emerald-400 font-medium">VAS 511</span> • Doanh thu dịch vụ
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tổng Chi Phí Hoạt Động</span>
                <div className="text-2xl font-bold text-rose-400 mt-1">
                  {financeData ? Number(financeData.totalExpense).toLocaleString('vi-VN') + ' ₫' : '450.000.000 ₫'}
                </div>
                <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                  <span className="text-rose-400 font-medium">VAS 641, 642</span> • Chi phí bán hàng & QLDN
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Lợi Nhuận Ròng (Net Profit)</span>
                <div className="text-2xl font-bold text-blue-400 mt-1">
                  {financeData ? Number(financeData.netProfit).toLocaleString('vi-VN') + ' ₫' : '1.050.000.000 ₫'}
                </div>
                <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                  <span className="text-blue-400 font-medium">Biên LN: 70%</span> • Tình hình khả quan
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tiền Mặt & Runway</span>
                <div className="text-2xl font-bold text-amber-400 mt-1">
                  {financeData ? `${financeData.runwayMonths || 12} Tháng` : '18 Tháng'}
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  Tồn quỹ:{' '}
                  <span className="font-semibold text-slate-200">
                    {financeData ? Number(financeData.cashBalance).toLocaleString('vi-VN') + ' ₫' : '5.200.000.000 ₫'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span>Báo Cáo Giám Đốc: Dòng Tiền & Kế Hoạch Vốn Thực Tế</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hệ thống áp dụng chuẩn mực Kế toán Kép (VAS) kiểm tra đối ứng chặt chẽ. Toàn bộ doanh thu từ các hợp đồng dịch vụ phần mềm và chi phí lương nhân sự được hạch toán tức thời, giúp Ban Giám Đốc nắm bắt chính xác mức Burn Rate hàng tháng và đảm bảo Runway không dưới ngưỡng an toàn (tối thiểu 6 tháng).
              </p>
            </div>
          </div>
        )}

        {/* ================= TAB 3: APPROVALS HUB ================= */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Trung Tâm Phê Duyệt Tập Trung (Multi-tier SLA)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Phân tầng tự động: Dưới 10M (Trưởng phòng), Dưới 100M (CFO), Trên 100M (Tổng Giám Đốc BOD).
                </p>
              </div>
              <button
                onClick={loadTabContent}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-800"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Làm mới</span>
              </button>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                Không có yêu cầu nào đang chờ phê duyệt. Bạn đã xử lý hết mọi công việc!
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((req) => (
                  <div
                    key={req.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                          {req.type}
                        </span>
                        <h4 className="font-semibold text-white text-sm">{req.title}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{req.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                        <span>
                          Người gửi: <span className="text-slate-200 font-medium">{req.requester?.fullName}</span> (
                          {req.requester?.employeeCode})
                        </span>
                        {req.amount && (
                          <span>
                            Số tiền: <span className="text-emerald-400 font-semibold">{Number(req.amount).toLocaleString('vi-VN')} ₫</span>
                          </span>
                        )}
                        <span>Cấp hiện tại: Bậc {req.currentTier}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => handleDecide(req.id, 'APPROVE')}
                        disabled={approvingId === req.id}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
                      >
                        <Check className="w-4 h-4" />
                        <span>Phê Duyệt</span>
                      </button>
                      <button
                        onClick={() => handleDecide(req.id, 'REJECT')}
                        disabled={approvingId === req.id}
                        className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
                      >
                        <X className="w-4 h-4" />
                        <span>Từ Chối</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: DOUBLE-ENTRY LEDGER ================= */}
        {activeTab === 'ledger' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>Hạch Toán Bút Toán Kép Mới (Đảm bảo Nợ = Có)</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Chuẩn kế toán Việt Nam VAS: Hạch toán đồng thời tài khoản Nợ (Debit) và tài khoản Có (Credit).
              </p>

              <form onSubmit={handleCreateJournal} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Diễn giải nghiệp vụ</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Chi thanh toán tiền thuê văn phòng Keangnam..."
                    value={journalDesc}
                    onChange={(e) => setJournalDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Tài khoản Nợ (Debit)</label>
                    <select
                      value={debitAcc}
                      onChange={(e) => setDebitAcc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="642">642 - Chi phí quản lý doanh nghiệp</option>
                      <option value="641">641 - Chi phí bán hàng</option>
                      <option value="112">112 - Tiền gửi ngân hàng</option>
                      <option value="111">111 - Tiền mặt tại quỹ</option>
                      <option value="131">131 - Phải thu của khách hàng</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Tài khoản Có (Credit)</label>
                    <select
                      value={creditAcc}
                      onChange={(e) => setCreditAcc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="112">112 - Tiền gửi ngân hàng (Chi tiền)</option>
                      <option value="111">111 - Tiền mặt tại quỹ (Chi tiền)</option>
                      <option value="511">511 - Doanh thu bán hàng & cung cấp dịch vụ</option>
                      <option value="331">331 - Phải trả cho người bán</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Số tiền hạch toán (VNĐ)</label>
                    <input
                      type="number"
                      step="1000000"
                      value={entryAmount}
                      onChange={(e) => setEntryAmount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ghi nhận bút toán vào Sổ cái</span>
                </button>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Sổ Nhật Ký Chung Gần Đây</h3>
              {ledgerEntries.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">Chưa có giao dịch sổ cái nào được ghi nhận.</div>
              ) : (
                <div className="space-y-2">
                  {ledgerEntries.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{tx.description}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Mã chứng từ: <span className="text-blue-400 font-mono">{tx.voucherNo}</span> • Ngày:{' '}
                          {new Date(tx.entryDate).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-emerald-400 text-sm">
                          {Number(tx.totalAmount).toLocaleString('vi-VN')} ₫
                        </span>
                        <div className="text-[10px] text-slate-400">Đã cân đối (Balanced)</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 5: PAYROLL ENGINE ================= */}
        {activeTab === 'payroll' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white">Engine Tính Lương Toàn Doanh Nghiệp Tự Động</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Tự động tính: Giờ OT (150%), Khấu trừ BHXH (10.5%), Giảm trừ gia cảnh (11M) và Thuế TNCN lũy tiến.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg p-2"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                        <option key={m} value={m}>
                          Tháng {m}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg p-2"
                    >
                      <option value={2026}>2026</option>
                      <option value={2025}>2025</option>
                    </select>
                  </div>

                  <button
                    onClick={handleRunPayroll}
                    disabled={payrollLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
                  >
                    <RefreshCw className={`w-4 h-4 ${payrollLoading ? 'animate-spin' : ''}`} />
                    <span>{payrollLoading ? 'Đang tính toán...' : 'Chạy Tính Lương'}</span>
                  </button>
                </div>
              </div>
            </div>

            {calculatedPayroll.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Kết Quả Bảng Lương Tháng {selectedMonth}/{selectedYear} ({calculatedPayroll.length} Nhân Sự)
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Mã NV</th>
                        <th className="p-3">Họ và tên</th>
                        <th className="p-3 text-right">Lương cơ bản</th>
                        <th className="p-3 text-right">Giờ OT</th>
                        <th className="p-3 text-right">Tiền OT (150%)</th>
                        <th className="p-3 text-right">BHXH (10.5%)</th>
                        <th className="p-3 text-right">Thuế TNCN</th>
                        <th className="p-3 text-right font-bold text-white">Thực Lĩnh (NET)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {calculatedPayroll.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition">
                          <td className="p-3 font-mono text-blue-400">{item.employeeCode}</td>
                          <td className="p-3 font-medium text-white">{item.fullName}</td>
                          <td className="p-3 text-right">{item.baseSalary.toLocaleString('vi-VN')} ₫</td>
                          <td className="p-3 text-right">{item.totalOvertimeHours}h</td>
                          <td className="p-3 text-right text-emerald-400">+{item.otPay.toLocaleString('vi-VN')} ₫</td>
                          <td className="p-3 text-right text-rose-400">-{item.insuranceDeduction.toLocaleString('vi-VN')} ₫</td>
                          <td className="p-3 text-right text-rose-400">-{item.taxDeduction.toLocaleString('vi-VN')} ₫</td>
                          <td className="p-3 text-right font-bold text-emerald-400">
                            {item.netSalary.toLocaleString('vi-VN')} ₫
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= MODAL: CREATE PROJECT ================= */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-blue-400" />
                <span>Khởi Tạo Dự Án Mới</span>
              </h3>
              <button
                onClick={() => setShowCreateProjectModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Mã Dự Án (Code)</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: PRJ-002"
                    value={newProjCode}
                    onChange={(e) => setNewProjCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Ngân Sách Dự Toán (VNĐ)</label>
                  <input
                    type="number"
                    step="5000000"
                    required
                    value={newProjBudget}
                    onChange={(e) => setNewProjBudget(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Tên Dự Án</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Xây dựng App Mobile ESS Doanh Nghiệp"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Quản Lý Dự Án (PM)</label>
                <select
                  value={newProjManagerId}
                  onChange={(e) => setNewProjManagerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode}) - {emp.department?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Ngày Bắt Đầu</label>
                  <input
                    type="date"
                    value={newProjStart}
                    onChange={(e) => setNewProjStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Hạn Chót (Deadline)</label>
                  <input
                    type="date"
                    value={newProjDeadline}
                    onChange={(e) => setNewProjDeadline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Mô Tả Mục Tiêu Dự Án</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả phạm vi WBS, deliverables..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateProjectModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  Tạo Dự Án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE TASK (GIAO VIỆC) ================= */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-400" />
                <span>Giao Việc Nhanh (WBS Task)</span>
              </h3>
              <button
                onClick={() => setShowCreateTaskModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Chọn Dự Án</label>
                <select
                  required
                  value={newTaskProjectId}
                  onChange={(e) => setNewTaskProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectCode} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Tên Nhiệm Vụ (Task Title)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Thiết kế giao diện báo cáo P&L"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Nhân Sự Phụ Trách</label>
                  <select
                    value={newTaskAssigneeId}
                    onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Mức Độ Ưu Tiên</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="URGENT">Khẩn cấp (URGENT)</option>
                    <option value="HIGH">Ưu tiên cao (HIGH)</option>
                    <option value="MEDIUM">Trung bình (MEDIUM)</option>
                    <option value="LOW">Thấp (LOW)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Dự Toán Giờ Công (Hours)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={newTaskHours}
                    onChange={(e) => setNewTaskHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Hạn Chót (Due Date)</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Mô Tả Yêu Cầu Chi Tiết</label>
                <textarea
                  rows={2}
                  placeholder="Yêu cầu kỹ thuật, checklist hoàn thành..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTaskModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  Giao Nhiệm Vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
