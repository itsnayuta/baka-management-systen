'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import {
  MapPin,
  Clock,
  Briefcase,
  FileText,
  DollarSign,
  Send,
  LogOut,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Layers,
  Play,
  Square,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Filter,
  Building2,
  User,
  Shield,
  ShieldCheck,
  Smartphone,
  Download,
  Printer,
  X,
  Plus,
  Coffee,
  HelpCircle,
  Bell,
  Sparkles,
  QrCode,
  CreditCard,
  FileSpreadsheet,
  Check,
  ChevronDown,
} from 'lucide-react';

export default function EmployeePortal() {
  const { user, logout, switchPortal } = useAuth();

  // Active Main Subsystem (MISA MyAMIS Tabs)
  const [activeTab, setActiveTab] = useState<
    'WORKSPACE' | 'TASKS' | 'ATTENDANCE' | 'PAYSLIP' | 'REQUESTS' | 'PROFILE'
  >('WORKSPACE');

  // Attendance state
  const [geoLoading, setGeoLoading] = useState(false);
  const [attendanceMsg, setAttendanceMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [isCheckInToday, setIsCheckInToday] = useState(false);

  // Tasks state
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'>('ALL');
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [hoursSpent, setHoursSpent] = useState<number>(2);
  const [logDesc, setLogDesc] = useState<string>('');
  const [taskLoading, setTaskLoading] = useState(false);

  // Live Timer Stop-watch state
  const [timerTaskId, setTimerTaskId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Payslip state
  const [payslips, setPayslips] = useState<any[]>([]);
  const [payslipSigned, setPayslipSigned] = useState(false);

  // Requests state
  const [requests, setRequests] = useState<any[]>([]);
  const [reqTitle, setReqTitle] = useState('');
  const [reqType, setReqType] = useState('LEAVE');
  const [reqAmount, setReqAmount] = useState<number>(3000000);
  const [reqDesc, setReqDesc] = useState('');

  // Modals state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Stop-watch interval ticker
  useEffect(() => {
    if (timerTaskId) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerTaskId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    try {
      const [logs, myTasks, slips, reqs] = await Promise.all([
        api.getAttendanceHistory().catch(() => []),
        api.getMyTasks().catch(() => []),
        api.getMyPayslips().catch(() => []),
        api.getMyApprovalRequests().catch(() => []),
      ]);

      setAttendanceLogs(logs);
      setTasks(myTasks);
      setPayslips(slips);
      setRequests(reqs);

      // Check if checked in today
      const todayStr = new Date().toDateString();
      const hasCheckedIn = logs.some((l: any) => new Date(l.workDate).toDateString() === todayStr);
      setIsCheckInToday(hasCheckedIn);

      if (myTasks.length > 0 && !selectedTask) {
        setSelectedTask(myTasks[0].id);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Start stop-watch
  const startTimer = (taskId: string) => {
    setTimerTaskId(taskId);
    setTimerSeconds(0);
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status === 'TODO') {
      handleUpdateStatus(taskId, 'IN_PROGRESS');
    }
    showToast(`Đã bắt đầu bấm giờ công việc: ${task?.title || 'Nhiệm vụ'}`);
  };

  // Stop timer and autofill worklog
  const stopTimerAndFill = (taskId: string) => {
    const elapsedHours = Math.max(0.25, Math.round((timerSeconds / 3600) * 10) / 10);
    setTimerTaskId(null);
    setSelectedTask(taskId);
    setHoursSpent(elapsedHours);
    setLogDesc(`Làm việc theo bấm giờ thực tế (${formatTimer(timerSeconds)})`);
    setShowLogModal(true);
  };

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Update Task Status directly
  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      await api.updateMyTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
      );
      showToast('Đã cập nhật trạng thái tiến độ thành công!');
    } catch (err: any) {
      alert(err.message || 'Cập nhật trạng thái thất bại');
    }
  };

  // GPS Check-in handler
  const handleCheckIn = async (isCheckOut = false) => {
    setGeoLoading(true);
    setAttendanceMsg(null);

    const onCoords = async (lat: number, lng: number, isReal: boolean) => {
      try {
        if (isCheckOut) {
          await api.checkOut(lat, lng);
          setAttendanceMsg({
            type: 'success',
            text: `Check-out tan ca thành công lúc ${new Date().toLocaleTimeString('vi-VN')}! (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          });
          showToast('Đã hoàn thành chấm công tan ca hôm nay!');
        } else {
          await api.checkIn(lat, lng);
          setAttendanceMsg({
            type: 'success',
            text: `Chấm công vào ca thành công! Vị trí Keangnam Landmark 72 (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          });
          setIsCheckInToday(true);
          showToast('Chấm công thành công! Chúc bạn ngày làm việc hiệu quả!');
        }
        loadData();
      } catch (err: any) {
        setAttendanceMsg({ type: 'error', text: err.message || 'Lỗi chấm công.' });
      } finally {
        setGeoLoading(false);
      }
    };

    if (!navigator.geolocation) {
      await onCoords(21.0168, 105.7838, false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => onCoords(pos.coords.latitude, pos.coords.longitude, true),
      () => onCoords(21.0168, 105.7838, false),
      { timeout: 5000, enableHighAccuracy: true },
    );
  };

  // Log work hours
  const handleLogWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setTaskLoading(true);
    try {
      await api.logWork(selectedTask, hoursSpent, logDesc);
      setLogDesc('');
      setShowLogModal(false);
      showToast('Đã ghi nhận giờ làm việc vào dự án!');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Ghi nhận thất bại');
    } finally {
      setTaskLoading(false);
    }
  };

  // Submit Approval Request
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createApprovalRequest({
        title: reqTitle,
        type: reqType,
        amount: reqType === 'ADVANCE_PAYMENT' ? Number(reqAmount) : undefined,
        description: reqDesc,
      });
      setShowRequestModal(false);
      setReqTitle('');
      setReqDesc('');
      showToast('Đã nộp đơn lên cấp trên phê duyệt!');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gửi đơn thất bại');
    }
  };

  const isManagerOrAdmin = ['SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER', 'HR_MANAGER', 'FINANCE_MANAGER'].includes(
    user?.role || '',
  );

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'ALL') return true;
    return t.status === taskFilter;
  });

  const activeTimerTaskObj = tasks.find((t) => t.id === timerTaskId);

  // Summary counts
  const totalMyTasks = tasks.length;
  const inProgressMyTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const doneMyTasks = tasks.filter((t) => t.status === 'DONE').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* ================= 1. MISA MyAMIS TOPBAR ================= */}
      <header className="bg-slate-950 border-b border-slate-800 h-14 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-white text-base shadow-md">
              M
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wide text-white flex items-center gap-1.5">
                <span>BAKA MyAMIS</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
                  NHÂN VIÊN (ESS)
                </span>
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-2 border-l border-slate-800 pl-4 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-300">CÔNG TY CỔ PHẦN CÔNG NGHỆ BAKA</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Văn phòng Keangnam Landmark 72</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>GPS Sẵn Sàng</span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Quick Create Request */}
          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tạo Đơn Nhanh</span>
          </button>

          {/* Switch to Management Portal (if permitted) */}
          {isManagerOrAdmin && (
            <button
              onClick={() => switchPortal('management-portal')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-700 transition"
              title="Chuyển sang Cổng Quản Trị"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cổng Quản Trị (BOD)</span>
            </button>
          )}

          {/* User Profile */}
          <div className="flex items-center space-x-2 border-l border-slate-800 pl-3">
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
              {user?.employee?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <div className="font-semibold text-white leading-tight">
                {user?.employee?.fullName || user?.email}
              </div>
              <div className="text-[10px] text-slate-400">
                {user?.employee?.employeeCode || 'EMP'} • {user?.employee?.department?.name || 'Nhân viên'}
              </div>
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

      {/* ================= STICKY LIVE WORK TIMER BANNER ================= */}
      {timerTaskId && (
        <div className="bg-amber-500 text-slate-950 font-medium text-xs px-4 py-2.5 shadow-lg flex items-center justify-between sticky top-14 z-40 animate-pulse">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="p-1 rounded-full bg-slate-950 text-amber-400">
              <Clock className="w-3.5 h-3.5 animate-spin" />
            </span>
            <span className="truncate">
              Đang bấm giờ: <strong className="font-bold">{activeTimerTaskObj?.title || 'Nhiệm vụ'}</strong>
            </span>
            <span className="font-mono bg-slate-950 text-white px-2 py-0.5 rounded text-[11px] font-bold">
              {formatTimer(timerSeconds)}
            </span>
          </div>
          <button
            onClick={() => stopTimerAndFill(timerTaskId)}
            className="bg-slate-950 hover:bg-slate-900 text-white font-semibold px-3 py-1 rounded-lg text-xs flex items-center gap-1 ml-2 flex-shrink-0 transition"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Dừng & Ghi log</span>
          </button>
        </div>
      )}

      {/* ================= 2. MAIN LAYOUT: SIDEBAR + CONTENT ================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* ================= SIDEBAR (MISA MyAMIS TABS) ================= */}
        <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between hidden md:flex flex-shrink-0">
          <div className="py-3 px-2 space-y-1 overflow-y-auto">
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Cổng Nhân Viên Tự Phục Vụ
            </div>

            {/* 1. Bàn Làm Việc */}
            <button
              onClick={() => setActiveTab('WORKSPACE')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'WORKSPACE'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4" />
                <span>Bàn Làm Việc Cá Nhân</span>
              </div>
            </button>

            {/* 2. Tiến Độ & Công Việc */}
            <button
              onClick={() => setActiveTab('TASKS')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'TASKS'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4" />
                <span>Tiến Độ Công Việc (Kanban)</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {tasks.length}
              </span>
            </button>

            {/* 3. Chấm Công GPS */}
            <button
              onClick={() => setActiveTab('ATTENDANCE')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'ATTENDANCE'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4" />
                <span>Chấm Công GPS Geo-Fence</span>
              </div>
              {isCheckInToday && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Đã check-in hôm nay" />
              )}
            </button>

            {/* 4. Phiếu Lương Điện Tử */}
            <button
              onClick={() => setActiveTab('PAYSLIP')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'PAYSLIP'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4" />
                <span>Phiếu Lương Minh Bạch (e-Payslip)</span>
              </div>
            </button>

            {/* 5. Đơn Từ & Phúc Lợi */}
            <button
              onClick={() => setActiveTab('REQUESTS')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'REQUESTS'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>Đơn Từ & Phúc Lợi (e-Form)</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {requests.length}
              </span>
            </button>

            {/* 6. Hồ Sơ & Hợp Đồng */}
            <button
              onClick={() => setActiveTab('PROFILE')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'PROFILE'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4" />
                <span>Hồ Sơ & Hợp Đồng Lao Động</span>
              </div>
            </button>
          </div>

          {/* Quick Attendance Widget in Sidebar */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/70 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Điểm danh hôm nay:</span>
              <span className={isCheckInToday ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {isCheckInToday ? 'Đã Vào Ca' : 'Chưa Vào'}
              </span>
            </div>
            <button
              onClick={() => handleCheckIn(isCheckInToday)}
              disabled={geoLoading}
              className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow ${
                isCheckInToday
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{geoLoading ? 'Đang định vị...' : isCheckInToday ? 'Tan ca (Check-out)' : 'Vào ca (Check-in)'}</span>
            </button>
          </div>
        </aside>

        {/* ================= WORKSPACE CONTENT AREA ================= */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900 space-y-6">
          {/* ================= TAB 1: BÀN LÀM VIỆC CÁ NHÂN (MY WORKSPACE) ================= */}
          {activeTab === 'WORKSPACE' && (
            <div className="space-y-6">
              {/* Employee ID Card Header */}
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-800/40 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl font-black shadow-lg">
                    {user?.employee?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white leading-tight">
                        {user?.employee?.fullName || user?.email}
                      </h2>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                        {user?.employee?.employeeCode || 'EMP-005'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      {user?.employee?.department?.name || 'Khối Công nghệ'} • Chức vụ: {user?.role}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-emerald-400/90 mt-2">
                      <span>✓ Hợp đồng chính thức</span>
                      <span>•</span>
                      <span>✓ Đóng BHXH đầy đủ</span>
                      <span>•</span>
                      <span>Văn phòng: Keangnam Landmark 72</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => handleCheckIn(isCheckInToday)}
                    disabled={geoLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>{geoLoading ? 'Đang lấy toạ độ...' : isCheckInToday ? 'Check-out Tan Ca' : 'Check-in Vào Ca (GPS)'}</span>
                  </button>
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 transition"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Nộp Đơn Mới</span>
                  </button>
                </div>
              </div>

              {/* 4 Summary Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Nhiệm vụ được giao</span>
                  <div className="text-2xl font-bold text-white mt-1">{totalMyTasks} Task</div>
                  <div className="text-[11px] text-blue-400 mt-1">{inProgressMyTasks} task đang làm</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Đã hoàn thành</span>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">{doneMyTasks} Task</div>
                  <div className="text-[11px] text-slate-500 mt-1">Đã bàn giao nghiệm thu</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Phép năm còn lại</span>
                  <div className="text-2xl font-bold text-purple-400 mt-1">11 / 12 Ngày</div>
                  <div className="text-[11px] text-slate-500 mt-1">Tiêu chuẩn Luật Lao Động</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Công tháng này</span>
                  <div className="text-2xl font-bold text-amber-400 mt-1">
                    {attendanceLogs.length} / 22 Công
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1">Chấm công GPS hợp lệ</div>
                </div>
              </div>

              {/* Quick Work & Tasks in Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-emerald-400" />
                      <span>Công Việc Cần Thực Hiện Hôm Nay</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('TASKS')}
                      className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1"
                    >
                      <span>Xem toàn bộ Kanban</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {tasks.slice(0, 4).map((task) => (
                      <div
                        key={task.id}
                        className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-blue-400 font-bold">{task.project?.name}</span>
                            <span className="font-semibold text-white">{task.title}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            Tiến độ: {task.actualHours || 0}h / {task.estimatedHours}h • Hạn:{' '}
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : '--'}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => startTimer(task.id)}
                            className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Bấm giờ</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTask(task.id);
                              setShowLogModal(true);
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg font-medium transition"
                          >
                            Log giờ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Company Announcements / Bulletin */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Bản Tin Nội Bộ Baka Tech</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                      <div className="font-semibold text-white">Chính sách thưởng dự án Q4/2026</div>
                      <p className="text-[11px] text-slate-400">
                        Ban Giám Đốc thông qua chính sách thưởng 15% doanh thu cho các team bàn giao đúng tiến độ EVM.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                      <div className="font-semibold text-white">Lịch chi trả lương tháng 10/2026</div>
                      <p className="text-[11px] text-slate-400">
                        Phòng Tài chính kế toán sẽ chuyển khoản lương vào ngày 05/11. Vui lòng kiểm tra phiếu lương e-Payslip.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: TIẾN ĐỘ & KANBAN CÁ NHÂN (TASKS) ================= */}
          {activeTab === 'TASKS' && (
            <div className="space-y-6">
              {/* Filter pills */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow">
                <div className="flex items-center space-x-1.5 text-xs overflow-x-auto w-full sm:w-auto">
                  {(['ALL', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setTaskFilter(st)}
                      className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                        taskFilter === st
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st === 'ALL'
                        ? `Tất cả (${tasks.length})`
                        : st === 'TODO'
                        ? 'Cần làm'
                        : st === 'IN_PROGRESS'
                        ? 'Đang làm'
                        : st === 'REVIEW'
                        ? 'Chờ nghiệm thu'
                        : 'Hoàn thành'}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowLogModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ghi Nhận Giờ (Work Log)</span>
                </button>
              </div>

              {/* Tasks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTasks.length === 0 ? (
                  <div className="col-span-full bg-slate-950 rounded-2xl p-12 text-center text-slate-500 text-xs border border-slate-800">
                    Không có công việc nào trong danh mục này.
                  </div>
                ) : (
                  filteredTasks.map((task) => {
                    const isTimerRunningOnThis = timerTaskId === task.id;
                    const est = Number(task.estimatedHours) || 8;
                    const act = Number(task.actualHours) || 0;
                    const percent = Math.min(100, Math.round((act / est) * 100));
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

                    return (
                      <div
                        key={task.id}
                        className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">
                              {task.project?.name || 'Dự án'}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                task.status === 'DONE'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : task.status === 'IN_PROGRESS'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {task.status}
                            </span>
                          </div>

                          <h4 className="font-semibold text-white text-sm">{task.title}</h4>
                          {task.description && (
                            <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
                          )}
                        </div>

                        <div className="space-y-3 pt-3 border-t border-slate-800">
                          <div>
                            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                              <span>
                                Đã làm: <strong>{act}h</strong> / {est}h
                              </span>
                              <span>{percent}%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${percent > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            {isTimerRunningOnThis ? (
                              <button
                                onClick={() => stopTimerAndFill(task.id)}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 text-[11px]"
                              >
                                <Square className="w-3 h-3 fill-current" />
                                <span>Dừng ({formatTimer(timerSeconds)})</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => startTimer(task.id)}
                                disabled={task.status === 'DONE'}
                                className="bg-slate-900 hover:bg-slate-800 text-emerald-400 font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 text-[11px] border border-slate-800 disabled:opacity-40"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Bấm giờ</span>
                              </button>
                            )}

                            {/* Stepper buttons */}
                            <div className="flex items-center gap-1">
                              {task.status === 'TODO' && (
                                <button
                                  onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                                  className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded-lg text-[11px] font-medium"
                                >
                                  Bắt đầu
                                </button>
                              )}
                              {task.status === 'IN_PROGRESS' && (
                                <button
                                  onClick={() => handleUpdateStatus(task.id, 'REVIEW')}
                                  className="bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded-lg text-[11px] font-medium"
                                >
                                  Gửi duyệt
                                </button>
                              )}
                              {task.status === 'REVIEW' && (
                                <span className="text-[10px] text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded">
                                  Chờ nghiệm thu
                                </span>
                              )}
                              {task.status === 'DONE' && (
                                <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded">
                                  ✓ Hoàn tất
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 3: CHẤM CÔNG GPS (ATTENDANCE) ================= */}
          {activeTab === 'ATTENDANCE' && (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 text-center shadow-lg max-w-xl mx-auto space-y-4">
                <div className="inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-400">
                  <MapPin className="w-10 h-10 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Chấm Công Định Vị GPS Geo-Fence</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Bán kính văn phòng: Keangnam Landmark 72 (Phạm vi cho phép 200m).
                  </p>
                </div>

                {attendanceMsg && (
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-center gap-2 text-left ${
                      attendanceMsg.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {attendanceMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                    )}
                    <span>{attendanceMsg.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleCheckIn(false)}
                    disabled={geoLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition shadow-lg disabled:opacity-50 text-xs"
                  >
                    <Clock className="w-4 h-4" />
                    <span>{geoLoading ? 'Đang định vị...' : 'Vào Ca (Check-in)'}</span>
                  </button>
                  <button
                    onClick={() => handleCheckIn(true)}
                    disabled={geoLoading}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition border border-slate-700 disabled:opacity-50 text-xs"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{geoLoading ? 'Đang định vị...' : 'Tan Ca (Check-out)'}</span>
                  </button>
                </div>
              </div>

              {/* Attendance Timesheet Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Nhật Ký Chấm Công Tháng Này ({attendanceLogs.length} Bản Ghi)
                  </h4>
                  <span className="text-xs text-emerald-400 font-semibold">Chuẩn: 22 ngày công</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Ngày Làm Việc</th>
                        <th className="p-3.5">Giờ Vào (Check-in)</th>
                        <th className="p-3.5">Giờ Ra (Check-out)</th>
                        <th className="p-3.5 text-right">Tổng Giờ Làm</th>
                        <th className="p-3.5 text-right">Giờ Tăng Ca OT</th>
                        <th className="p-3.5 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {attendanceLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-500">
                            Chưa có bản ghi chấm công nào.
                          </td>
                        </tr>
                      ) : (
                        attendanceLogs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3.5 font-medium text-white">
                              {new Date(log.workDate).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="p-3.5 text-emerald-400 font-mono">
                              {log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString('vi-VN') : '--:--'}
                            </td>
                            <td className="p-3.5 text-slate-400 font-mono">
                              {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString('vi-VN') : '--:--'}
                            </td>
                            <td className="p-3.5 text-right font-semibold text-white">{log.totalHours || 8}h</td>
                            <td className="p-3.5 text-right text-emerald-400 font-mono">
                              {log.overtimeHours ? `+${log.overtimeHours}h` : '0h'}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                                {log.status || 'Hợp lệ'}
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

          {/* ================= TAB 4: PHIẾU LƯƠNG ĐIỆN TỬ (PAYSLIP) ================= */}
          {activeTab === 'PAYSLIP' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Header card */}
              <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 border border-emerald-800 rounded-3xl p-6 shadow-xl flex items-center justify-between text-white">
                <div>
                  <span className="text-xs uppercase tracking-wider text-emerald-300 font-semibold">
                    Phiếu Lương Điện Tử (e-Payslip)
                  </span>
                  <div className="text-3xl font-black mt-1">
                    {payslips[0]
                      ? Number(payslips[0].netSalary).toLocaleString('vi-VN') + ' ₫'
                      : '22.450.000 ₫'}
                  </div>
                  <p className="text-xs text-emerald-200 mt-1">Thu nhập thực nhận (Take-home net salary)</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setPayslipSigned(true);
                      showToast('Đã ký số điện tử xác nhận phiếu lương thành công!');
                    }}
                    disabled={payslipSigned}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition shadow"
                  >
                    {payslipSigned ? '✓ Đã Ký Nhận' : 'Ký Số Xác Nhận'}
                  </button>
                  <button
                    onClick={() => showToast('Đã tải phiếu lương PDF thành công!')}
                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải PDF</span>
                  </button>
                </div>
              </div>

              {/* Breakdown table */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-bold text-white text-sm">
                    Chi Tiết Thu Nhập & Các Khoản Trích Nộp Tháng 10/2026
                  </span>
                  <span className="font-mono text-emerald-400">Chuẩn Luật Lao Động 2026</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between py-1 border-b border-dashed border-slate-800">
                    <span className="text-slate-400">1. Lương cơ bản theo hợp đồng</span>
                    <span className="font-medium text-white">22.000.000 ₫</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dashed border-slate-800">
                    <span className="text-slate-400">2. Lương làm thêm giờ OT (150% theo luật)</span>
                    <span className="font-medium text-emerald-400">+2.812.500 ₫ (15 giờ OT)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dashed border-slate-800">
                    <span className="text-slate-400">3. Phụ cấp ăn trưa, điện thoại, xăng xe</span>
                    <span className="font-medium text-white">+1.500.000 ₫</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dashed border-slate-800">
                    <span className="text-slate-400">4. Thưởng hiệu quả hoàn thành task</span>
                    <span className="font-medium text-white">+1.000.000 ₫</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-300 font-bold bg-slate-900/60 p-2 rounded-lg">
                    <span>TỔNG THU NHẬP (GROSS)</span>
                    <span>27.312.500 ₫</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-dashed border-slate-800 text-rose-400">
                    <span>5. Trừ BHXH (8%), BHYT (1.5%), BHTN (1%) = 10.5%</span>
                    <span>-2.310.000 ₫</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dashed border-slate-800 text-rose-400">
                    <span>6. Thuế Thu nhập Cá nhân (sau giảm trừ gia cảnh 11M)</span>
                    <span>-2.552.500 ₫</span>
                  </div>

                  <div className="flex justify-between pt-3 text-base font-black text-white bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span>THỰC LĨNH CHUYỂN KHOẢN (NET)</span>
                    <span className="text-emerald-400">22.450.000 ₫</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 5: ĐƠN TỪ & PHÚC LỢI (REQUESTS) ================= */}
          {activeTab === 'REQUESTS' && (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <span>Dịch Vụ Đơn Từ & Đề Xuất Điện Tử (e-Form)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Xin nghỉ phép, Tạm ứng tiền lương, Chi phí công tác • Quy trình phê duyệt online không giấy tờ
                  </p>
                </div>
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Nộp Đơn Mới</span>
                </button>
              </div>

              {/* Requests history */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests.length === 0 ? (
                  <div className="col-span-full bg-slate-950 rounded-2xl p-12 text-center text-slate-500 text-xs border border-slate-800">
                    Bạn chưa nộp đơn từ nào trong hệ thống.
                  </div>
                ) : (
                  requests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-500/20 text-blue-400">
                            {req.type}
                          </span>
                          <h4 className="font-semibold text-white text-sm mt-1">{req.title}</h4>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {req.status === 'APPROVED' ? 'Đã Phê Duyệt' : req.status === 'REJECTED' ? 'Từ Chối' : 'Chờ Duyệt'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400">{req.description}</p>

                      {req.amount && (
                        <div className="text-xs text-slate-300">
                          Số tiền xin duyệt: <strong className="text-emerald-400">{Number(req.amount).toLocaleString('vi-VN')} ₫</strong>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Ngày nộp: {new Date(req.createdAt || new Date()).toLocaleDateString('vi-VN')}</span>
                        <span>Cấp xét duyệt: Bậc {req.currentTier || 1}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 6: HỒ SƠ & HỢP ĐỒNG (PROFILE) ================= */}
          {activeTab === 'PROFILE' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex items-center space-x-4 pb-4 border-b border-slate-800">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl font-black shadow-lg">
                    {user?.employee?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{user?.employee?.fullName || user?.email}</h3>
                    <p className="text-xs text-slate-400">
                      Mã NV: <strong className="text-blue-400 font-mono">{user?.employee?.employeeCode || 'EMP-005'}</strong> • {user?.employee?.department?.name || 'Khối Kỹ Thuật'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400">Email công vụ:</span>
                    <div className="font-semibold text-white">{user?.email}</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400">Loại hợp đồng lao động:</span>
                    <div className="font-semibold text-emerald-400">Hợp đồng không xác định thời hạn (KXDTH)</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400">Số tài khoản nhận lương:</span>
                    <div className="font-semibold text-white font-mono">19036888999 (Techcombank)</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400">Mã số thuế & Số sổ BHXH:</span>
                    <div className="font-semibold text-white font-mono">MST: 8490123456 • BHXH: 01239999</div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                  <p className="text-xs text-emerald-200 leading-relaxed">
                    Hồ sơ nhân sự đã được ký xác thực số bởi Phòng Nhân sự & Ban Giám Đốc Công ty Cổ phần Công nghệ Baka. Mọi quyền lợi về BHYT, BHXH và Thuế TNCN được bảo lưu đầy đủ theo quy định của Pháp luật Việt Nam.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= MODAL: TẠO ĐƠN MỚI (REQUEST MODAL) ================= */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>Nộp Đơn / Đề Xuất Mới (e-Form)</span>
              </h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Loại Đơn Từ</label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="LEAVE">Xin nghỉ phép năm (Annual Leave)</option>
                  <option value="ADVANCE_PAYMENT">Xin tạm ứng tiền lương (Advance Salary)</option>
                  <option value="BUSINESS_TRIP">Đề xuất công tác / Đi khách hàng</option>
                  <option value="EQUIPMENT">Đề xuất mua sắm trang thiết bị làm việc</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Tiêu Đề Đơn</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Xin nghỉ phép thứ 6 tuần này..."
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {reqType === 'ADVANCE_PAYMENT' && (
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Số Tiền Tạm Ứng (VNĐ)</label>
                  <input
                    type="number"
                    step="500000"
                    required
                    value={reqAmount}
                    onChange={(e) => setReqAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Lý Do Chi Tiết</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Nêu rõ lý do trình cấp trên xem xét phê duyệt..."
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Nộp Đơn Trình Duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: GHI NHẬN WORK LOG (LOG MODAL) ================= */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                <span>Ghi Nhận Giờ Công Việc (Work Log)</span>
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogWork} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Chọn Nhiệm Vụ</label>
                <select
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.project?.name || 'Dự án'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Số Giờ Thực Tế (Hours)</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="16"
                  required
                  value={hoursSpent}
                  onChange={(e) => setHoursSpent(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Mô Tả Công Việc Hoàn Thành</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Mô tả công việc đã hoàn thành trong thời gian này..."
                  value={logDesc}
                  onChange={(e) => setLogDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={taskLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
                >
                  {taskLoading ? 'Đang lưu...' : 'Lưu Work Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TOAST NOTIFICATION ================= */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
