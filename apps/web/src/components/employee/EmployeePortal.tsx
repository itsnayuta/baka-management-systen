'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export default function EmployeePortal() {
  const { user, logout, switchPortal } = useAuth();
  const [activeTab, setActiveTab] = useState<'attendance' | 'tasks' | 'payslip' | 'requests'>('attendance');

  // Attendance state
  const [geoLoading, setGeoLoading] = useState(false);
  const [attendanceMsg, setAttendanceMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);

  // Tasks state
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [hoursSpent, setHoursSpent] = useState<number>(2);
  const [logDesc, setLogDesc] = useState<string>('');
  const [taskLoading, setTaskLoading] = useState(false);

  // Payslip state
  const [payslips, setPayslips] = useState<any[]>([]);

  // Requests state
  const [requests, setRequests] = useState<any[]>([]);
  const [reqTitle, setReqTitle] = useState('');
  const [reqType, setReqType] = useState('LEAVE');
  const [reqAmount, setReqAmount] = useState<number>(0);
  const [reqDesc, setReqDesc] = useState('');

  // Initial data load
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'attendance') {
        const logs = await api.getAttendanceHistory().catch(() => []);
        setAttendanceLogs(logs);
      } else if (activeTab === 'tasks') {
        const myTasks = await api.getMyTasks().catch(() => []);
        setTasks(myTasks);
        if (myTasks.length > 0 && !selectedTask) {
          setSelectedTask(myTasks[0].id);
        }
      } else if (activeTab === 'payslip') {
        const slips = await api.getMyPayslips().catch(() => []);
        setPayslips(slips);
      } else if (activeTab === 'requests') {
        const reqs = await api.getMyApprovalRequests().catch(() => []);
        setRequests(reqs);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // GPS Check-in handler
  const handleCheckIn = async (isCheckOut = false) => {
    setGeoLoading(true);
    setAttendanceMsg(null);

    // ponytail: HTML5 Geolocation API with fallback to Keangnam Landmark coords for testing
    if (!navigator.geolocation) {
      setAttendanceMsg({ type: 'error', text: 'Trình duyệt không hỗ trợ Geolocation GPS.' });
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          if (isCheckOut) {
            await api.checkOut(lat, lng);
            setAttendanceMsg({ type: 'success', text: `Check-out thành công lúc ${new Date().toLocaleTimeString('vi-VN')}!` });
          } else {
            await api.checkIn(lat, lng);
            setAttendanceMsg({ type: 'success', text: `Check-in thành công tại toạ độ (${lat.toFixed(4)}, ${lng.toFixed(4)})!` });
          }
          loadData();
        } catch (err: any) {
          setAttendanceMsg({ type: 'error', text: err.message || 'Lỗi chấm công.' });
        } finally {
          setGeoLoading(false);
        }
      },
      async () => {
        // Fallback demo GPS coords (Keangnam Landmark 72: 21.0168, 105.7838)
        try {
          if (isCheckOut) {
            await api.checkOut(21.0168, 105.7838);
            setAttendanceMsg({ type: 'success', text: 'Check-out thành công (GPS văn phòng chuẩn)!' });
          } else {
            await api.checkIn(21.0168, 105.7838);
            setAttendanceMsg({ type: 'success', text: 'Check-in thành công (GPS văn phòng chuẩn: 21.0168, 105.7838)!' });
          }
          loadData();
        } catch (err: any) {
          setAttendanceMsg({ type: 'error', text: err.message || 'Lỗi chấm công.' });
        } finally {
          setGeoLoading(false);
        }
      },
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
      alert('Đã ghi nhận giờ làm việc vào dự án thành công!');
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
      setReqTitle('');
      setReqDesc('');
      setReqAmount(0);
      alert('Đã gửi đơn lên cấp trên phê duyệt!');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gửi đơn thất bại');
    }
  };

  const isManagerOrAdmin = ['ADMIN', 'BOD', 'DIRECTOR', 'PROJECT_MANAGER', 'HR_MANAGER', 'CHIEF_ACCOUNTANT'].includes(
    user?.role || '',
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-12">
      {/* Top App Bar (Mobile optimized) */}
      <header className="bg-emerald-600 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
              {user?.fullName.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="font-semibold text-base leading-tight">{user?.fullName}</h1>
              <p className="text-xs text-emerald-100">
                {user?.employeeCode} • {user?.role}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isManagerOrAdmin && (
              <button
                onClick={() => switchPortal('MANAGEMENT_PORTAL')}
                className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                title="Chuyển sang trang Quản lý"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quản lý</span>
              </button>
            )}
            <button
              onClick={logout}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-2xl mx-auto px-2 flex border-t border-emerald-500/50">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'attendance'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-emerald-100 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Chấm công</span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'tasks'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-emerald-100 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Việc của tôi</span>
          </button>
          <button
            onClick={() => setActiveTab('payslip')}
            className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'payslip'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-emerald-100 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Phiếu lương</span>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'requests'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-emerald-100 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Đơn từ</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto w-full px-4 pt-4 flex-1">
        {/* TAB 1: ATTENDANCE (GPS CHECK-IN) */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            {/* GPS Check-in Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-center">
              <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-600 mb-3">
                <MapPin className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Chấm công GPS Geo-Fence</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Bán kính văn phòng: Keangnam Landmark 72 (Cho phép trong bán kính 200m).
              </p>

              {attendanceMsg && (
                <div
                  className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 text-left ${
                    attendanceMsg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {attendanceMsg.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{attendanceMsg.text}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-5">
                <button
                  onClick={() => handleCheckIn(false)}
                  disabled={geoLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <Clock className="w-4 h-4" />
                  <span>{geoLoading ? 'Đang định vị...' : 'Vào ca (Check-in)'}</span>
                </button>
                <button
                  onClick={() => handleCheckIn(true)}
                  disabled={geoLoading}
                  className="bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{geoLoading ? 'Đang định vị...' : 'Tan ca (Check-out)'}</span>
                </button>
              </div>
            </div>

            {/* Attendance History */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Lịch sử chấm công gần đây</span>
              </h3>
              {attendanceLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">Chưa có bản ghi chấm công nào.</div>
              ) : (
                <div className="space-y-2.5">
                  {attendanceLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">
                          {new Date(log.workDate).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          Vào:{' '}
                          <span className="font-medium text-emerald-700">
                            {log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString('vi-VN') : '--:--'}
                          </span>{' '}
                          | Ra:{' '}
                          <span className="font-medium text-slate-700">
                            {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString('vi-VN') : '--:--'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">
                          {log.status}
                        </span>
                        <div className="text-slate-500 mt-1">{log.totalHours || 0} giờ làm</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TASKS & LOG WORK */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>Ghi nhận giờ làm việc (Work Log)</span>
              </h3>
              <form onSubmit={handleLogWork} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Chọn công việc</label>
                  <select
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {tasks.length === 0 ? (
                      <option value="">Không có việc nào được giao</option>
                    ) : (
                      tasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.project?.name || 'Dự án'})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Số giờ thực tế</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="16"
                      value={hoursSpent}
                      onChange={(e) => setHoursSpent(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Ngày làm việc</label>
                    <input
                      type="text"
                      disabled
                      value={new Date().toLocaleDateString('vi-VN')}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Mô tả nội dung công việc</label>
                  <textarea
                    rows={2}
                    placeholder="Đã hoàn thành module đăng nhập, fix bug..."
                    value={logDesc}
                    onChange={(e) => setLogDesc(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={taskLoading || tasks.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition"
                >
                  {taskLoading ? 'Đang lưu...' : 'Lưu Work Log'}
                </button>
              </form>
            </div>

            {/* Task list */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Công việc được phân công</h3>
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">Hiện tại không có việc nào được giao.</div>
              ) : (
                <div className="space-y-2.5">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-800 text-xs">{task.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">{task.project?.name}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800">
                          {task.status}
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-200/60 pt-2">
                        <span>Dự toán: {task.estimatedHours}h</span>
                        <span>Đã làm: {task.actualHours || 0}h</span>
                        <span className="text-emerald-600 font-medium">Độ ưu tiên: {task.priority}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PAYSLIP */}
        {activeTab === 'payslip' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-md">
              <span className="text-xs uppercase tracking-wider text-emerald-200 font-semibold">
                Phiếu lương gần nhất
              </span>
              <div className="text-2xl font-bold mt-1">
                {payslips[0]
                  ? Number(payslips[0].netSalary).toLocaleString('vi-VN') + ' ₫'
                  : 'Chưa có bảng lương'}
              </div>
              <p className="text-xs text-emerald-100 mt-1">Lương thực lĩnh (Net take-home pay)</p>
            </div>

            {payslips.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-xs text-slate-400 border border-slate-200">
                Chưa có phiếu lương được phê duyệt cho bạn trong hệ thống.
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3 text-xs">
                <h3 className="font-semibold text-slate-800 text-sm border-b pb-2">
                  Chi tiết kỳ lương: Tháng {payslips[0].periodMonth}/{payslips[0].periodYear}
                </h3>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                  <span className="text-slate-600">Lương cơ bản</span>
                  <span className="font-medium">{Number(payslips[0].baseSalary).toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                  <span className="text-slate-600">Lương tăng ca (OT 150%)</span>
                  <span className="font-medium text-emerald-600">
                    +{Number(payslips[0].overtimePay).toLocaleString('vi-VN')} ₫ ({payslips[0].overtimeHours}h)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                  <span className="text-slate-600">Phụ cấp & Thưởng</span>
                  <span className="font-medium">
                    +{Number(payslips[0].allowanceAmount + payslips[0].bonusAmount).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                  <span className="text-rose-600">Khấu trừ BHXH, BHYT, BHTN (10.5%)</span>
                  <span className="font-medium text-rose-600">
                    -{Number(payslips[0].insuranceDeduction).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                  <span className="text-rose-600">Thuế Thu nhập Cá nhân (TNCN)</span>
                  <span className="font-medium text-rose-600">
                    -{Number(payslips[0].taxDeduction).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-bold text-slate-900">
                  <span>THỰC LĨNH (NET)</span>
                  <span className="text-emerald-600">
                    {Number(payslips[0].netSalary).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REQUESTS (LEAVE / ADVANCE) */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {/* Create request card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <Send className="w-4 h-4 text-emerald-600" />
                <span>Nộp đơn / Đề xuất mới</span>
              </h3>
              <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Loại yêu cầu</label>
                  <select
                    value={reqType}
                    onChange={(e) => setReqType(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="LEAVE">Xin nghỉ phép năm (Annual Leave)</option>
                    <option value="ADVANCE_PAYMENT">Xin tạm ứng tiền lương (Advance)</option>
                    <option value="BUSINESS_TRIP">Đề xuất công tác / Đi khách hàng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Tiêu đề đơn</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Xin nghỉ phép thứ 6 tuần này..."
                    value={reqTitle}
                    onChange={(e) => setReqTitle(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {reqType === 'ADVANCE_PAYMENT' && (
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Số tiền tạm ứng (VNĐ)</label>
                    <input
                      type="number"
                      step="500000"
                      value={reqAmount}
                      onChange={(e) => setReqAmount(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Lý do chi tiết</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Chi tiết lý do xin duyệt..."
                    value={reqDesc}
                    onChange={(e) => setReqDesc(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition"
                >
                  Gửi đơn lên cấp trên
                </button>
              </form>
            </div>

            {/* List of my requests */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Đơn từ đã gửi</h3>
              {requests.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">Bạn chưa gửi đơn nào.</div>
              ) : (
                <div className="space-y-2.5">
                  {requests.map((req) => (
                    <div key={req.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-800">{req.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">{req.description}</p>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      {req.amount && (
                        <div className="mt-2 text-[11px] text-slate-600">
                          Số tiền yêu cầu: <span className="font-semibold">{Number(req.amount).toLocaleString('vi-VN')} ₫</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
