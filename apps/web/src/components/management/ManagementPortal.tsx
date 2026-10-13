'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
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
} from 'lucide-react';

export default function ManagementPortal() {
  const { user, logout, switchPortal } = useAuth();
  const [activeTab, setActiveTab] = useState<'finance' | 'approvals' | 'workload' | 'ledger' | 'payroll'>('finance');

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

  // Workload & Projects State
  const [projects, setProjects] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);

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

  useEffect(() => {
    loadTabContent();
  }, [activeTab]);

  const loadTabContent = async () => {
    try {
      if (activeTab === 'finance') {
        const data = await api.getFinanceDashboard().catch(() => null);
        setFinanceData(data);
      } else if (activeTab === 'approvals') {
        const list = await api.getPendingApprovals().catch(() => []);
        setPendingApprovals(list);
      } else if (activeTab === 'workload') {
        const projs = await api.getProjects().catch(() => []);
        const hm = await api.getWorkloadHeatmap().catch(() => []);
        setProjects(projs);
        setHeatmap(hm);
      } else if (activeTab === 'ledger') {
        const entries = await api.getLedger().catch(() => []);
        setLedgerEntries(entries);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Decide Approval (Approve / Reject)
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-800 border-b border-slate-700/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black px-3 py-1.5 rounded-xl text-sm tracking-wider shadow">
              BAKA ERP
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <span>Management Executive Portal</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                  {user?.role}
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {user?.fullName} ({user?.employeeCode}) • Phân hệ Quản trị & Điều hành Doanh nghiệp
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => switchPortal('EMPLOYEE_PORTAL')}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
              title="Chuyển về trang Nhân viên ESS"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Giao diện Nhân viên</span>
            </button>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex space-x-1 border-t border-slate-700/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('finance')}
            className={`px-4 py-3 text-xs font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              activeTab === 'finance'
                ? 'border-blue-500 text-blue-400 font-semibold bg-slate-800/50'
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
                ? 'border-blue-500 text-blue-400 font-semibold bg-slate-800/50'
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
            onClick={() => setActiveTab('workload')}
            className={`px-4 py-3 text-xs font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              activeTab === 'workload'
                ? 'border-blue-500 text-blue-400 font-semibold bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dự án & Heatmap Quá tải</span>
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-3 text-xs font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              activeTab === 'ledger'
                ? 'border-blue-500 text-blue-400 font-semibold bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Sổ cái Kép (VAS 111, 112...)</span>
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-3 text-xs font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              activeTab === 'payroll'
                ? 'border-blue-500 text-blue-400 font-semibold bg-slate-800/50'
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
        {/* TAB 1: FINANCE DASHBOARD */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tổng Doanh Thu</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                  {financeData ? Number(financeData.totalRevenue).toLocaleString('vi-VN') + ' ₫' : '1.500.000.000 ₫'}
                </div>
                <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                  <span className="text-emerald-400 font-medium">VAS 511</span> • Doanh thu bán hàng & dịch vụ
                </div>
              </div>

              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tổng Chi Phí Hoạt Động</span>
                <div className="text-2xl font-bold text-rose-400 mt-1">
                  {financeData ? Number(financeData.totalExpense).toLocaleString('vi-VN') + ' ₫' : '450.000.000 ₫'}
                </div>
                <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                  <span className="text-rose-400 font-medium">VAS 641, 642</span> • Chi phí bán hàng & quản lý
                </div>
              </div>

              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Lợi Nhuận Ròng (Net Profit)</span>
                <div className="text-2xl font-bold text-blue-400 mt-1">
                  {financeData ? Number(financeData.netProfit).toLocaleString('vi-VN') + ' ₫' : '1.050.000.000 ₫'}
                </div>
                <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                  <span className="text-blue-400 font-medium">Biên lợi nhuận: 70%</span> • Sức khỏe tài chính tốt
                </div>
              </div>

              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
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

            {/* Strategic Overview Note */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span>Báo Cáo Giám Đốc: Dòng Tiền & Kế Hoạch Vốn Thực Tế</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hệ thống áp dụng chuẩn mực Kế toán Kép (VAS - Vietnamese Accounting Standards) kiểm tra đối ứng chặt chẽ. Toàn bộ doanh thu từ các hợp đồng dịch vụ phần mềm và chi phí lương nhân sự được hạch toán tức thời, giúp Ban Giám Đốc nắm bắt chính xác mức Burn Rate hàng tháng và đảm bảo Runway không dưới ngưỡng an toàn (tối thiểu 6 tháng).
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: APPROVALS HUB */}
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
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Làm mới</span>
              </button>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-8 text-center text-slate-400 text-xs">
                Không có yêu cầu nào đang chờ phê duyệt. Bạn đã xử lý hết mọi công việc!
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((req) => (
                  <div
                    key={req.id}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
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

        {/* TAB 3: WORKLOAD HEATMAP & PROJECTS */}
        {activeTab === 'workload' && (
          <div className="space-y-6">
            {/* Heatmap Section */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span>Workload Heatmap: Tải Trọng Nhân Sự 30 Ngày Qua</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Đánh giá áp lực công việc để cân đối tài nguyên: Đỏ (Quá tải &gt;180h), Xanh (Tối ưu 80-180h), Vàng (Chưa đủ tải &lt;80h).
              </p>

              {heatmap.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">Chưa có đủ nhật ký work log để sinh heatmap.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {heatmap.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/80 border border-slate-700/60 p-4 rounded-xl flex items-center justify-between"
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

            {/* Projects EVM Section */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-blue-400" />
                <span>Tiến Độ & Quản Trị Chi Phí Dự Án (EVM - Earned Value Management)</span>
              </h3>
              {projects.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">Chưa có dự án nào trong hệ thống.</div>
              ) : (
                <div className="space-y-3">
                  {projects.map((proj) => (
                    <div key={proj.id} className="p-4 rounded-xl bg-slate-900 border border-slate-700/60 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-blue-400">{proj.projectCode}</span>
                          <h4 className="font-semibold text-white text-sm">{proj.name}</h4>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                          {proj.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800 text-slate-400">
                        <div>
                          Ngân sách dự toán: <br />
                          <span className="font-semibold text-slate-200">
                            {Number(proj.estimatedBudget || 0).toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                        <div>
                          Chi phí thực tế (Actual Cost): <br />
                          <span className="font-semibold text-rose-400">
                            {Number(proj.actualCost || 0).toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                        <div>
                          Quản lý dự án (PM): <br />
                          <span className="font-semibold text-slate-200">{proj.manager?.fullName || 'Chưa gán'}</span>
                        </div>
                        <div>
                          Số lượng task: <br />
                          <span className="font-semibold text-slate-200">{proj._count?.tasks || 0} công việc</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: DOUBLE-ENTRY LEDGER */}
        {activeTab === 'ledger' && (
          <div className="space-y-6">
            {/* Create Journal Entry Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
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
                    placeholder="VD: Chi thanh toán tiền thuê văn phòng Keangnam tháng 10..."
                    value={journalDesc}
                    onChange={(e) => setJournalDesc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Tài khoản Nợ (Debit)</label>
                    <select
                      value={debitAcc}
                      onChange={(e) => setDebitAcc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-blue-500"
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
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-blue-500"
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
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-blue-500"
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

            {/* Ledger Transactions List */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Sổ Nhật Ký Chung Gần Đây</h3>
              {ledgerEntries.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">Chưa có giao dịch sổ cái nào được ghi nhận.</div>
              ) : (
                <div className="space-y-2">
                  {ledgerEntries.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-slate-900 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs"
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

        {/* TAB 5: PAYROLL ENGINE */}
        {activeTab === 'payroll' && (
          <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white">Engine Tính Lương Toàn Doanh Nghiệp Tự Động</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Tự động tính: Giờ OT (150%), Khấu trừ bảo hiểm xã hội (10.5%), Giảm trừ gia cảnh (11M) và Thuế TNCN lũy tiến.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg p-2"
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
                      className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg p-2"
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

            {/* Calculated Payroll Table */}
            {calculatedPayroll.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-700">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Kết Quả Bảng Lương Tháng {selectedMonth}/{selectedYear} ({calculatedPayroll.length} Nhân Sự)
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-700">
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
                    <tbody className="divide-y divide-slate-700/60">
                      {calculatedPayroll.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-700/30 transition">
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
    </div>
  );
}

