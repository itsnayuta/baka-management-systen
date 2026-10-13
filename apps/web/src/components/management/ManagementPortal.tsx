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
  Building2,
  Landmark,
  Receipt,
  FileSpreadsheet,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Scale,
  Settings,
  SlidersHorizontal,
  Download,
  Printer,
  Eye,
  MoreHorizontal,
  ChevronDown,
  Bell,
  HelpCircle,
  FileText,
  UserCheck,
  ShoppingBag,
  PieChart,
} from 'lucide-react';

export default function ManagementPortal() {
  const { user, logout, switchPortal } = useAuth();

  // Active Main Subsystem (MISA AMIS Core Modules)
  const [activeModule, setActiveModule] = useState<
    'DASHBOARD' | 'FINANCE' | 'PROJECTS' | 'HRM' | 'APPROVALS' | 'SALES' | 'SETTINGS'
  >('DASHBOARD');

  // Work Hub Sub-view (Kanban / EVM / WBS / Heatmap)
  const [workHubView, setWorkHubView] = useState<'KANBAN' | 'EVM' | 'WBS' | 'HEATMAP'>('KANBAN');
  const [selectedProjFilter, setSelectedProjFilter] = useState<string>('ALL');
  const [taskSearchQuery, setTaskSearchQuery] = useState<string>('');

  // Modals state
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showQuickVoucherModal, setShowQuickVoucherModal] = useState(false);
  const [showExportToast, setShowExportToast] = useState(false);

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
  const [entryAmount, setEntryAmount] = useState<number>(15000000);

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

  // Load initial data
  useEffect(() => {
    loadData();
  }, [activeModule]);

  const loadData = async () => {
    try {
      const [projs, ts, emps, hm, fin, apprs, ledg] = await Promise.all([
        api.getProjects().catch(() => []),
        api.getAllTasks().catch(() => []),
        api.getEmployees().catch(() => []),
        api.getWorkloadHeatmap().catch(() => []),
        api.getFinanceDashboard().catch(() => null),
        api.getPendingApprovals().catch(() => []),
        api.getLedger().catch(() => []),
      ]);

      setProjects(projs);
      setTasks(ts);
      setEmployees(emps);
      setHeatmap(hm);
      setFinanceData(fin);
      setPendingApprovals(apprs);
      setLedgerEntries(ledg);

      if (projs.length > 0 && !newTaskProjectId) {
        setNewTaskProjectId(projs[0].id);
      }
      if (emps.length > 0 && !newProjManagerId) {
        setNewProjManagerId(emps[0].id);
        setNewTaskAssigneeId(emps[0].id);
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
      alert('Đã khởi tạo dự án mới thành công trên hệ thống!');
      setShowCreateProjectModal(false);
      setNewProjCode('');
      setNewProjName('');
      setNewProjDesc('');
      loadData();
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
      alert('Đã phân công nhiệm vụ vào WBS thành công!');
      setShowCreateTaskModal(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Tạo nhiệm vụ thất bại');
    }
  };

  // Submit Double-entry Journal Entry
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
      alert('Hạch toán chứng từ kế toán thành công! Sổ cái đã tự động ghi nhận đối ứng Nợ = Có.');
      setJournalDesc('');
      setShowQuickVoucherModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi hạch toán sổ cái');
    }
  };

  // Decide Approval
  const handleDecide = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setApprovingId(id);
    try {
      await api.decideApproval(id, action, action === 'APPROVE' ? 'Phê duyệt qua MISA AMIS Portal' : 'Từ chối duyệt');
      setPendingApprovals((prev) => prev.filter((item) => item.id !== id));
      alert(`Đã ${action === 'APPROVE' ? 'PHÊ DUYỆT' : 'TỪ CHỐI'} chứng từ đề xuất thành công!`);
    } catch (err: any) {
      alert(err.message || 'Thao tác phê duyệt thất bại');
    } finally {
      setApprovingId(null);
    }
  };

  // Run Monthly Payroll
  const handleRunPayroll = async () => {
    setPayrollLoading(true);
    try {
      const results = await api.calculateMonthlyPayroll(selectedMonth, selectedYear);
      setCalculatedPayroll(results);
      alert(`Đã hoàn tất tính lương cho ${results.length} cán bộ nhân viên tháng ${selectedMonth}/${selectedYear} theo Luật Lao Động VN!`);
    } catch (err: any) {
      alert(err.message || 'Lỗi tính toán bảng lương');
    } finally {
      setPayrollLoading(false);
    }
  };

  const triggerExportToast = () => {
    setShowExportToast(true);
    setTimeout(() => setShowExportToast(false), 3000);
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
    const cv = ev - ac;
    const cpi = ac > 0 ? ev / ac : 1.0;

    return {
      totalTasksCount,
      completedTasksCount,
      percentDone: Math.round(percentDone),
      bac,
      ac,
      ev,
      cv,
      cpi: Math.round(cpi * 100) / 100,
      health: cpi >= 1.0 ? 'HEALTHY' : cpi >= 0.85 ? 'WARNING' : 'CRITICAL',
    };
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* ================= 1. MISA ENTERPRISE TOPBAR ================= */}
      <header className="bg-slate-950 border-b border-slate-800 h-14 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-base shadow-md">
              M
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wide text-white flex items-center gap-1.5">
                <span>BAKA AMIS ERP</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                  ENTERPRISE
                </span>
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-2 border-l border-slate-800 pl-4 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-300">CÔNG TY CỔ PHẦN CÔNG NGHỆ BAKA</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Trụ sở Hà Nội (Keangnam Landmark 72)</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-medium">Năm tài chính 2026</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Quick Action Button: + Thêm nhanh */}
          <button
            onClick={() => setShowQuickVoucherModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Chứng Từ Nhanh</span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition">
              <Bell className="w-4 h-4" />
            </button>
            {pendingApprovals.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>

          {/* Switch to Employee Portal */}
          <button
            onClick={() => switchPortal('employee-portal')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-700 transition"
            title="Chuyển sang Cổng Nhân viên ESS"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Cổng Nhân Viên (ESS)</span>
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-2 border-l border-slate-800 pl-3">
            <div className="w-7 h-7 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
              {user?.employee?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <div className="font-semibold text-white leading-tight">{user?.employee?.fullName || user?.email}</div>
              <div className="text-[10px] text-slate-400">{user?.role}</div>
            </div>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition ml-1"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ================= 2. MAIN LAYOUT: SIDEBAR + CONTENT ================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* ================= SIDEBAR (MISA AMIS SUB-SYSTEMS) ================= */}
        <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between hidden md:flex flex-shrink-0">
          <div className="py-3 px-2 space-y-1 overflow-y-auto">
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Phân Hệ Quản Trị MISA
            </div>

            {/* 1. Bàn Điều Hành */}
            <button
              onClick={() => setActiveModule('DASHBOARD')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeModule === 'DASHBOARD'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4" />
                <span>Bàn Điều Hành (Dashboard)</span>
              </div>
            </button>

            {/* 2. Quản Trị Tiến Độ & Dự Án */}
            <button
              onClick={() => setActiveModule('PROJECTS')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeModule === 'PROJECTS'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderKanban className="w-4 h-4" />
                <span>Tiến Độ & Dự Án (WBS)</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {tasks.length}
              </span>
            </button>

            {/* 3. Tài Chính & Kế Toán Kép */}
            <button
              onClick={() => setActiveModule('FINANCE')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeModule === 'FINANCE'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Landmark className="w-4 h-4" />
                <span>Kế Toán & Sổ Cái Kép (VAS)</span>
              </div>
            </button>

            {/* 4. Nhân Sự & Tiền Lương */}
            <button
              onClick={() => setActiveModule('HRM')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeModule === 'HRM'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Nhân Sự & Tiền Lương (HRM)</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {employees.length}
              </span>
            </button>

            {/* 5. Trạm Phê Duyệt Tập Trung */}
            <button
              onClick={() => setActiveModule('APPROVALS')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeModule === 'APPROVALS'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckSquare className="w-4 h-4" />
                <span>Ký Duyệt & Trình Ký (SLA)</span>
              </div>
              {pendingApprovals.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                  {pendingApprovals.length}
                </span>
              )}
            </button>

            {/* 6. Bán Hàng & Hóa Đơn VAT */}
            <button
              onClick={() => setActiveModule('SALES')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeModule === 'SALES'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4" />
                <span>Bán Hàng & Hóa Đơn VAT</span>
              </div>
            </button>

            {/* 7. Danh Mục & Thiết Lập */}
            <button
              onClick={() => setActiveModule('SETTINGS')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeModule === 'SETTINGS'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" />
                <span>Hệ Thống & Danh Mục VAS</span>
              </div>
            </button>
          </div>

          {/* Bottom System Info */}
          <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>CSDL: PostgreSQL 16</span>
              <span className="text-emerald-400 font-mono">Live</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Cache: Redis Cluster</span>
              <span className="text-emerald-400 font-mono">OK</span>
            </div>
            <div className="text-[10px] text-slate-600 pt-1">Baka Enterprise v2.4 (TT200/BTC)</div>
          </div>
        </aside>

        {/* ================= WORKSPACE CONTENT AREA ================= */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900 space-y-6">
          {/* ================= MODULE 1: BÀN ĐIỀU HÀNH TỔNG THỂ (DASHBOARD) ================= */}
          {activeModule === 'DASHBOARD' && (
            <div className="space-y-6">
              {/* Executive Greeting Banner */}
              <div className="bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-950 border border-blue-800/40 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Trung Tâm Chỉ Huy Doanh Nghiệp (CEO Executive Cockpit)</span>
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    Xin chào {user?.employee?.fullName || 'Ban Giám Đốc'}, tổng quan vận hành hôm nay
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Hệ thống đã đồng bộ hóa tức thời chỉ số P&L, Dòng tiền ngân hàng, Tiến độ {projects.length} dự án và Bảng chấm công GPS của {employees.length} cán bộ nhân viên.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={loadData}
                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Làm mới dữ liệu</span>
                  </button>
                  <button
                    onClick={triggerExportToast}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất Báo Cáo Ban Giám Đốc</span>
                  </button>
                </div>
              </div>

              {/* 4 Financial & Operational KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Doanh Thu Lũy Kế (VAS 511)</span>
                    <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 mt-2">
                    {financeData ? Number(financeData.totalRevenue).toLocaleString('vi-VN') + ' ₫' : '1.500.000.000 ₫'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2">So với cùng kỳ: +24%</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Tổng Chi Phí (VAS 641, 642)</span>
                    <span className="p-1 rounded-lg bg-rose-500/10 text-rose-400">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-rose-400 mt-2">
                    {financeData ? Number(financeData.totalExpense).toLocaleString('vi-VN') + ' ₫' : '450.000.000 ₫'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2">Bao gồm lương & chi phí văn phòng</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Lợi Nhuận Thuần (Net Profit)</span>
                    <span className="p-1 rounded-lg bg-blue-500/10 text-blue-400">
                      <PieChart className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-400 mt-2">
                    {financeData ? Number(financeData.netProfit).toLocaleString('vi-VN') + ' ₫' : '1.050.000.000 ₫'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2">Biên lợi nhuận ròng: 70%</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Dòng Tiền Tồn Quỹ (111 + 112)</span>
                    <span className="p-1 rounded-lg bg-amber-500/10 text-amber-400">
                      <Wallet className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-amber-400 mt-2">
                    {financeData ? Number(financeData.cashBalance).toLocaleString('vi-VN') + ' ₫' : '5.200.000.000 ₫'}
                  </div>
                  <div className="text-[11px] text-amber-400/80 mt-2">
                    Runway an toàn: {financeData ? `${financeData.runwayMonths || 12} Tháng` : '18 Tháng'}
                  </div>
                </div>
              </div>

              {/* Grid 2 Columns: Project Progress Summary + Approvals Radar */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2 Cols: Project WBS & EVM Health Overview */}
                <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <FolderKanban className="w-4 h-4 text-blue-400" />
                        <span>Sức Khỏe Tiến Độ Các Dự Án Trọng Điểm</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Kiểm soát theo mô hình Earned Value Management (EVM)
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveModule('PROJECTS')}
                      className="text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center gap-1"
                    >
                      <span>Xem chi tiết</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {projects.map((proj) => {
                      const evm = calculateProjectEVM(proj);
                      return (
                        <div
                          key={proj.id}
                          className="p-3.5 bg-slate-900 rounded-xl border border-slate-800/80 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-blue-400 font-bold">{proj.projectCode}</span>
                              <span className="font-semibold text-white">{proj.name}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                evm.health === 'HEALTHY'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : evm.health === 'WARNING'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              CPI: {evm.cpi} • {evm.health === 'HEALTHY' ? 'Đúng hạn & Chi phí' : 'Cần kiểm soát'}
                            </span>
                          </div>

                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>
                              Ngân sách: <strong>{evm.bac.toLocaleString('vi-VN')} ₫</strong> | Đã chi:{' '}
                              <strong className="text-rose-400">{evm.ac.toLocaleString('vi-VN')} ₫</strong>
                            </span>
                            <span>{evm.percentDone}% Hoàn thành</span>
                          </div>

                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full transition-all"
                              style={{ width: `${evm.percentDone}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 1 Col: Quick Pending Approvals */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-purple-400" />
                        <span>Hồ Sơ Chờ Phê Duyệt</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Cần ký duyệt để giải ngân</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                      {pendingApprovals.length}
                    </span>
                  </div>

                  {pendingApprovals.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">
                      Không có chứng từ nào chờ duyệt.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {pendingApprovals.slice(0, 4).map((req) => (
                        <div
                          key={req.id}
                          className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white truncate max-w-[150px]">{req.title}</span>
                            {req.amount && (
                              <span className="text-emerald-400 font-bold">
                                {Number(req.amount).toLocaleString('vi-VN')} ₫
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center justify-between">
                            <span>Bởi: {req.requester?.fullName}</span>
                            <button
                              onClick={() => handleDecide(req.id, 'APPROVE')}
                              className="text-[10px] px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
                            >
                              Duyệt ngay
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= MODULE 2: TIẾN ĐỘ CÔNG VIỆC & DỰ ÁN (PROJECTS & WBS) ================= */}
          {activeModule === 'PROJECTS' && (
            <div className="space-y-6">
              {/* Header Toolbar */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow">
                <div className="flex items-center space-x-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs w-full md:w-auto">
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
                    <span>Ma Trận EVM Cost</span>
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
                    <span>Phân Rã WBS Tree</span>
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
                    <span>Workload Heatmap</span>
                  </button>
                </div>

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

              {/* Filter bar */}
              {(workHubView === 'KANBAN' || workHubView === 'WBS') && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5" />
                      <span>Lọc Dự Án:</span>
                    </span>
                    <select
                      value={selectedProjFilter}
                      onChange={(e) => setSelectedProjFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
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
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              )}

              {/* KANBAN BOARD */}
              {workHubView === 'KANBAN' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(
                    [
                      { id: 'TODO', title: 'CẦN LÀM', color: 'border-slate-800 bg-slate-950/60' },
                      { id: 'IN_PROGRESS', title: 'ĐANG THỰC HIỆN', color: 'border-blue-900/60 bg-blue-950/20' },
                      { id: 'REVIEW', title: 'CHỜ NGHIỆM THU', color: 'border-purple-900/60 bg-purple-950/20' },
                      { id: 'DONE', title: 'ĐÃ HOÀN THÀNH', color: 'border-emerald-900/60 bg-emerald-950/20' },
                    ] as const
                  ).map((col) => {
                    const columnTasks = filteredTasks.filter((t) => t.status === col.id);

                    return (
                      <div
                        key={col.id}
                        className={`border rounded-2xl p-4 flex flex-col min-h-[520px] ${col.color}`}
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
                            <div className="text-center py-12 text-[11px] text-slate-600">Trống</div>
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

                                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                                    <span className="truncate">
                                      {task.assignees?.[0]?.employee?.fullName || 'Chưa gán'}
                                    </span>
                                    {isOverdue && (
                                      <span className="text-[10px] text-rose-400 font-bold flex items-center gap-0.5">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>Quá hạn</span>
                                      </span>
                                    )}
                                  </div>

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

              {/* EVM VIEW */}
              {workHubView === 'EVM' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
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
                        {projects.map((proj) => {
                          const evm = calculateProjectEVM(proj);
                          return (
                            <tr key={proj.id} className="hover:bg-slate-800/40 transition">
                              <td className="p-3.5 font-mono text-blue-400 font-semibold">{proj.projectCode}</td>
                              <td className="p-3.5 font-medium text-white">{proj.name}</td>
                              <td className="p-3.5 text-slate-400">{proj.manager?.fullName || 'Chưa gán'}</td>
                              <td className="p-3.5 text-right font-medium">{evm.bac.toLocaleString('vi-VN')} ₫</td>
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
                                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  }`}
                                >
                                  {evm.cpi}
                                </span>
                              </td>
                              <td className="p-3.5 text-center font-semibold text-white">
                                {evm.percentDone}% ({evm.completedTasksCount}/{evm.totalTasksCount})
                              </td>
                              <td className="p-3.5 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">
                                  {evm.health === 'HEALTHY' ? 'Tốt' : 'Cảnh báo'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* WBS & HEATMAP VIEWS */}
              {workHubView === 'WBS' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                      Cây Phân Rã Công Việc WBS ({filteredTasks.length} nhiệm vụ)
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="p-3.5">Dự Án</th>
                          <th className="p-3.5">Nhiệm Vụ</th>
                          <th className="p-3.5">Người Phụ Trách</th>
                          <th className="p-3.5">Ưu Tiên</th>
                          <th className="p-3.5 text-right">Dự Toán</th>
                          <th className="p-3.5 text-right">Thực Tế</th>
                          <th className="p-3.5 text-center">Hạn Chót</th>
                          <th className="p-3.5 text-center">Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filteredTasks.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3.5 font-mono text-blue-400">{t.project?.projectCode}</td>
                            <td className="p-3.5 font-medium text-white">{t.title}</td>
                            <td className="p-3.5 text-slate-300">{t.assignees?.[0]?.employee?.fullName || 'Chưa gán'}</td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                                {t.priority || 'MEDIUM'}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">{t.estimatedHours}h</td>
                            <td className="p-3.5 text-right text-emerald-400 font-semibold">{t.actualHours || 0}h</td>
                            <td className="p-3.5 text-center text-slate-400">
                              {t.dueDate ? new Date(t.dueDate).toLocaleDateString('vi-VN') : '--'}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-400">
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {workHubView === 'HEATMAP' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Workload Heatmap: Cân Bằng Tải Nhân Sự 30 Ngày Qua</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {heatmap.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm"
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
                                ? 'bg-rose-500/20 text-rose-400'
                                : item.status === 'UNDERLOAD'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= MODULE 3: TÀI CHÍNH & KẾ TOÁN SỔ CÁI KÉP (FINANCE) ================= */}
          {activeModule === 'FINANCE' && (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-blue-400" />
                    <span>Sổ Nhật Ký Chung & Kế Toán Kép (Hệ Thống VAS Thông Tư 200)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hạch toán đối ứng tài khoản: TK 111 (Tiền mặt), TK 112 (Tiền gửi), TK 511 (Doanh thu), TK 642 (Chi phí QLDN)
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowQuickVoucherModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Lập Chứng Từ Kế Toán</span>
                  </button>
                  <button
                    onClick={triggerExportToast}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700 transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>In Sổ Cái</span>
                  </button>
                </div>
              </div>

              {/* Data Table: General Ledger */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Mã Chứng Từ</th>
                        <th className="p-3.5">Ngày Hạch Toán</th>
                        <th className="p-3.5">Diễn Giải Nghiệp Vụ</th>
                        <th className="p-3.5 text-center">TK Đối Ứng (Nợ/Có)</th>
                        <th className="p-3.5 text-right">Số Tiền (VNĐ)</th>
                        <th className="p-3.5 text-center">Trạng Thái Ghi Sổ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {ledgerEntries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-500">
                            Chưa có bản ghi sổ cái nào.
                          </td>
                        </tr>
                      ) : (
                        ledgerEntries.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3.5 font-mono text-blue-400 font-semibold">{tx.voucherNo}</td>
                            <td className="p-3.5 text-slate-400">
                              {new Date(tx.entryDate).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="p-3.5 font-medium text-white">{tx.description}</td>
                            <td className="p-3.5 text-center font-mono text-[11px] text-slate-300">
                              Nợ: 642 / Có: 112
                            </td>
                            <td className="p-3.5 text-right font-bold text-emerald-400">
                              {Number(tx.totalAmount).toLocaleString('vi-VN')} ₫
                            </td>
                            <td className="p-3.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                                Đã Ghi Sổ (Balanced)
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= MODULE 4: NHÂN SỰ & BẢNG LƯƠNG TỰ ĐỘNG (HRM) ================= */}
          {activeModule === 'HRM' && (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span>Quản Lý Nhân Sự & Engine Tính Lương (MISA HRM)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hồ sơ nhân sự, Hợp đồng, Chấm công GPS, Lương OT 150%, Khấu trừ BHXH 10.5% & Thuế TNCN
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl p-2"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        Tháng {m}/2026
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleRunPayroll}
                    disabled={payrollLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${payrollLoading ? 'animate-spin' : ''}`} />
                    <span>{payrollLoading ? 'Đang tính...' : 'Tính Lương Tự Động'}</span>
                  </button>

                  <button
                    onClick={triggerExportToast}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700 transition"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Xuất Bảng Lương Excel</span>
                  </button>
                </div>
              </div>

              {/* Employee Directory List */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Danh Sách Cán Bộ Nhân Viên ({employees.length} Nhân Sự)
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Mã NV</th>
                        <th className="p-3.5">Họ và Tên</th>
                        <th className="p-3.5">Phòng Ban</th>
                        <th className="p-3.5 text-right">Lương Cơ Bản</th>
                        <th className="p-3.5 text-right">Đơn Giá Giờ (Cost/h)</th>
                        <th className="p-3.5 text-center">Trạng Thái Hợp Đồng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {employees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5 font-mono text-blue-400 font-semibold">{emp.employeeCode}</td>
                          <td className="p-3.5 font-medium text-white">{emp.fullName}</td>
                          <td className="p-3.5 text-slate-400">{emp.department?.name || 'Phòng ban'}</td>
                          <td className="p-3.5 text-right font-medium">
                            {Number(emp.baseSalary || 20000000).toLocaleString('vi-VN')} ₫
                          </td>
                          <td className="p-3.5 text-right text-emerald-400 font-mono">
                            {Number(emp.hourlyCostRate || 120000).toLocaleString('vi-VN')} ₫/h
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                              Chính thức (Full-time)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Calculated Payroll Table */}
              {calculatedPayroll.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow">
                  <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                      Bảng Lương Tháng {selectedMonth}/{selectedYear} Đã Khóa Sổ ({calculatedPayroll.length} Người)
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="p-3">Mã NV</th>
                          <th className="p-3">Họ và Tên</th>
                          <th className="p-3 text-right">Lương Cơ Bản</th>
                          <th className="p-3 text-right">Giờ OT</th>
                          <th className="p-3 text-right">Tiền OT (150%)</th>
                          <th className="p-3 text-right">BHXH (10.5%)</th>
                          <th className="p-3 text-right">Thuế TNCN</th>
                          <th className="p-3 text-right font-bold text-white">Thực Lĩnh (Net)</th>
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

          {/* ================= MODULE 5: KÝ DUYỆT & TRÌNH KÝ (APPROVALS) ================= */}
          {activeModule === 'APPROVALS' && (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-purple-400" />
                    <span>Trung Tâm Phê Duyệt & Trình Ký Điện Tử (MISA Approval)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hạn mức tự động: &lt;10M (Trưởng bộ phận) • &lt;100M (Giám đốc Tài chính) • &ge;100M (Tổng Giám Đốc)
                  </p>
                </div>
                <button
                  onClick={loadData}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-slate-800"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Làm mới</span>
                </button>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                  Không còn chứng từ nào đang chờ phê duyệt. Bạn đã xử lý hết mọi công việc!
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.map((req) => (
                    <div
                      key={req.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow"
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
                          <span>Cấp xét duyệt: Bậc {req.currentTier}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleDecide(req.id, 'APPROVE')}
                          disabled={approvingId === req.id}
                          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow"
                        >
                          <Check className="w-4 h-4" />
                          <span>Ký Phê Duyệt</span>
                        </button>
                        <button
                          onClick={() => handleDecide(req.id, 'REJECT')}
                          disabled={approvingId === req.id}
                          className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow"
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

          {/* ================= MODULE 6: BÁN HÀNG & HÓA ĐƠN VAT (SALES) ================= */}
          {activeModule === 'SALES' && (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-400" />
                    <span>Quản Lý Bán Hàng & Hóa Đơn Điện Tử VAT</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hợp đồng kinh tế, Quản lý công nợ khách hàng (TK 131), Phát hành hóa đơn điện tử
                  </p>
                </div>
                <button
                  onClick={triggerExportToast}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Lập Hợp Đồng / Báo Giá Mới</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Hợp đồng năm 2026</span>
                  <div className="text-xl font-bold text-white mt-1">12 Hợp đồng</div>
                  <div className="text-[11px] text-emerald-400 mt-1">Doanh số: 3.200.000.000 ₫</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Công nợ phải thu (131)</span>
                  <div className="text-xl font-bold text-amber-400 mt-1">680.000.000 ₫</div>
                  <div className="text-[11px] text-slate-400 mt-1">3 khách hàng đến hạn</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Hóa đơn điện tử VAT</span>
                  <div className="text-xl font-bold text-blue-400 mt-1">45 Hóa đơn</div>
                  <div className="text-[11px] text-slate-400 mt-1">100% đã ký số HSM</div>
                </div>
              </div>

              {/* Sample contracts table */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow">
                <div className="p-4 border-b border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Danh Sách Hợp Đồng Dịch Vụ Gần Đây
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Số Hợp Đồng</th>
                        <th className="p-3.5">Khách Hàng (Đối Tác)</th>
                        <th className="p-3.5">Nội Dung Cung Cấp</th>
                        <th className="p-3.5 text-right">Giá Trị Hợp Đồng</th>
                        <th className="p-3.5 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      <tr className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-mono text-blue-400 font-semibold">HD-2026/001</td>
                        <td className="p-3.5 font-medium text-white">Tập Đoàn FPT Telecom</td>
                        <td className="p-3.5 text-slate-400">Triển khai hệ thống ERP Baka Core</td>
                        <td className="p-3.5 text-right font-bold text-emerald-400">1.200.000.000 ₫</td>
                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                            Đang Thực Hiện
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-mono text-blue-400 font-semibold">HD-2026/002</td>
                        <td className="p-3.5 font-medium text-white">Ngân Hàng TMCP Quân Đội (MB)</td>
                        <td className="p-3.5 text-slate-400">Tích hợp cổng thanh toán tự động</td>
                        <td className="p-3.5 text-right font-bold text-emerald-400">850.000.000 ₫</td>
                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-400">
                            Đã Nghiệm Thu
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= MODULE 7: THIẾT LẬP & HỆ THỐNG TÀI KHOẢN (SETTINGS) ================= */}
          {activeModule === 'SETTINGS' && (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-400" />
                  <span>Hệ Thống Danh Mục Tài Khoản Kế Toán (Thông Tư 200/2014/TT-BTC)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cấu hình cây tài khoản mẹ con, thuộc tính theo dõi chi tiết (Đối tượng, Công trình, Dự án)
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Số Hiệu TK</th>
                        <th className="p-3.5">Tên Tài Khoản</th>
                        <th className="p-3.5">Tính Chất</th>
                        <th className="p-3.5">Tài Khoản Mẹ</th>
                        <th className="p-3.5 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {[
                        { code: '111', name: 'Tiền mặt', type: 'Dư Nợ', parent: '--' },
                        { code: '1111', name: 'Tiền Việt Nam (VNĐ)', type: 'Dư Nợ', parent: '111' },
                        { code: '112', name: 'Tiền gửi ngân hàng', type: 'Dư Nợ', parent: '--' },
                        { code: '131', name: 'Phải thu của khách hàng', type: 'Lưỡng tính', parent: '--' },
                        { code: '331', name: 'Phải trả cho người bán', type: 'Lưỡng tính', parent: '--' },
                        { code: '334', name: 'Phải trả người lao động (Tiền lương)', type: 'Lưỡng tính', parent: '--' },
                        { code: '511', name: 'Doanh thu bán hàng và cung cấp dịch vụ', type: 'Không có số dư', parent: '--' },
                        { code: '642', name: 'Chi phí quản lý doanh nghiệp', type: 'Không có số dư', parent: '--' },
                        { code: '911', name: 'Xác định kết quả kinh doanh', type: 'Không có số dư', parent: '--' },
                      ].map((acc) => (
                        <tr key={acc.code} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5 font-mono text-blue-400 font-semibold">{acc.code}</td>
                          <td className="p-3.5 font-medium text-white">{acc.name}</td>
                          <td className="p-3.5 text-slate-400">{acc.type}</td>
                          <td className="p-3.5 font-mono text-slate-500">{acc.parent}</td>
                          <td className="p-3.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                              Đang sử dụng
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= MODAL: QUICK VOUCHER (CHỨNG TỪ NHANH) ================= */}
      {showQuickVoucherModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-400" />
                <span>Lập Chứng Từ Kế Toán Nhanh (VAS)</span>
              </h3>
              <button
                onClick={() => setShowQuickVoucherModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJournal} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Diễn giải nghiệp vụ phát sinh</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Chi thanh toán tiền thuê cloud AWS tháng 10..."
                  value={journalDesc}
                  onChange={(e) => setJournalDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Tài khoản Nợ (Debit)</label>
                  <select
                    value={debitAcc}
                    onChange={(e) => setDebitAcc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="642">642 - Chi phí quản lý doanh nghiệp</option>
                    <option value="641">641 - Chi phí bán hàng</option>
                    <option value="112">112 - Tiền gửi ngân hàng</option>
                    <option value="111">111 - Tiền mặt tại quỹ</option>
                    <option value="131">131 - Phải thu khách hàng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Tài khoản Có (Credit)</label>
                  <select
                    value={creditAcc}
                    onChange={(e) => setCreditAcc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="112">112 - Tiền gửi ngân hàng (Chi tiền)</option>
                    <option value="111">111 - Tiền mặt tại quỹ (Chi tiền)</option>
                    <option value="511">511 - Doanh thu dịch vụ</option>
                    <option value="331">331 - Phải trả người bán</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Số tiền hạch toán (VNĐ)</label>
                <input
                  type="number"
                  step="1000000"
                  required
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-semibold text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowQuickVoucherModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  Hạch Toán & Ghi Sổ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* ================= TOAST NOTIFICATION: EXPORT ================= */}
      {showExportToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>Đã kết xuất báo cáo chuẩn định dạng Excel/PDF thành công!</span>
        </div>
      )}
    </div>
  );
}
