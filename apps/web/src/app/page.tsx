'use client';

import React, { useState } from 'react';
import { useAuth, PortalType } from '@/lib/auth-context';
import EmployeePortal from '@/components/employee/EmployeePortal';
import ManagementPortal from '@/components/management/ManagementPortal';
import { Users, Shield, ArrowRight, CheckCircle2, Lock, Mail, Sparkles } from 'lucide-react';

export default function HomePage() {
  const { user, portal, login, isLoading } = useAuth();

  const [selectedPortal, setSelectedPortal] = useState<PortalType>('employee-portal');
  const [email, setEmail] = useState('dev@company.vn');
  const [password, setPassword] = useState('Admin123@');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Preset Selector
  const selectPreset = (userEmail: string, pass: string, targetPortal: PortalType) => {
    setEmail(userEmail);
    setPassword(pass);
    setSelectedPortal(targetPortal);
    setAuthError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError(null);
    try {
      await login(email, password, selectedPortal);
    } catch (err: any) {
      setAuthError(err.message || 'Đăng nhập không thành công.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm">
        Đang khởi động phiên làm việc...
      </div>
    );
  }

  // If already authenticated, display corresponding portal
  if (user) {
    if (portal === 'employee-portal') {
      return <EmployeePortal />;
    }
    return <ManagementPortal />;
  }

  // Not authenticated: Login page with portal distinction
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full text-blue-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hệ Thống Quản Trị Vận Hành Doanh Nghiệp Toàn Diện</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">BAKA OPERATIONS ERP</h2>
        <p className="mt-2 text-xs text-slate-400">
          Phân tách độc lập: Cổng Nhân Viên Tự Phục Vụ (ESS) & Cổng Quản Trị Điều Hành (BOD)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 border border-slate-800 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 backdrop-blur-xl">
          {/* Portal Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-2xl mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setSelectedPortal('employee-portal');
                setEmail('dev@company.vn');
                setPassword('Admin123@');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                selectedPortal === 'employee-portal'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Cổng Nhân Viên</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedPortal('management-portal');
                setEmail('ceo@company.vn');
                setPassword('Admin123@');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                selectedPortal === 'management-portal'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Cổng Quản Trị</span>
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email tài khoản</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="VD: dev@company.vn, ceo@company.vn..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Mật khẩu</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full text-white font-semibold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition ${
                selectedPortal === 'employee-portal'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-blue-600 hover:bg-blue-500'
              } disabled:opacity-50`}
            >
              <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng nhập vào Hệ thống'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              ⚡ Tài khoản Demo 1-Click:
            </span>
            <div className="space-y-1.5 text-xs">
              <button
                type="button"
                onClick={() => selectPreset('ceo@company.vn', 'Admin123@', 'management-portal')}
                className="w-full text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-850 border border-slate-800 flex items-center justify-between text-slate-300 hover:text-white transition"
              >
                <span>👑 Trần Văn Giám Đốc (CEO - EMP-002)</span>
                <span className="text-[10px] text-blue-400 font-mono">BOD Portal</span>
              </button>
              <button
                type="button"
                onClick={() => selectPreset('cfo@company.vn', 'Admin123@', 'management-portal')}
                className="w-full text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-850 border border-slate-800 flex items-center justify-between text-slate-300 hover:text-white transition"
              >
                <span>💼 Nguyễn Thị Kế Toán Trưởng (CFO - EMP-003)</span>
                <span className="text-[10px] text-purple-400 font-mono">Admin Portal</span>
              </button>
              <button
                type="button"
                onClick={() => selectPreset('dev@company.vn', 'Admin123@', 'employee-portal')}
                className="w-full text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-850 border border-slate-800 flex items-center justify-between text-slate-300 hover:text-white transition"
              >
                <span>💻 Phạm Lập Trình Viên (Senior Dev - EMP-005)</span>
                <span className="text-[10px] text-emerald-400 font-mono">ESS Portal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Audience Scoped JWT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Zero-Trust Zero-IDOR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
