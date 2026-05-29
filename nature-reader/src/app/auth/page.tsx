"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User as UserIcon, ArrowRight, AlertCircle, Sparkles, Leaf, BookOpen, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../../types";
import { getOrCreateProfile, getProfileById } from "../../lib/actions/book";
import { supabase } from "../../lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup" | "recovery">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to home if already logged in / Parse recovery token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    
    if (params.get("mode") === "recovery" || hash.includes("access_token")) {
      setMode("recovery");
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const token = hashParams.get("access_token");
        if (token) {
          localStorage.setItem("accessToken", token);
        }
      }
      return;
    }

    const user = localStorage.getItem("currentUser");
    if (user) {
      router.push("/");
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (!email) {
      setError("Vui lòng nhập địa chỉ email.");
      return;
    }
    if (!email.includes("@")) {
      setError("Địa chỉ email không đúng định dạng.");
      return;
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải chứa ít nhất 6 ký tự.");
      return;
    }

    if (mode === "signup") {
      if (!name) {
        setError("Vui lòng nhập họ và tên của bạn.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Mật khẩu xác nhận không trùng khớp.");
        return;
      }
    }

    setIsLoading(true);

    async function authenticate() {
      try {
        if (mode === "signup") {
          // 1. Gọi API đăng ký qua Supabase Auth
          const registerRes = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              password,
              displayName: name
            })
          });

          const registerData = await registerRes.json();
          if (!registerRes.ok) {
            setIsLoading(false);
            setError(registerData.message || "Đăng ký không thành công.");
            return;
          }
        }

        // 2. Đăng nhập qua Supabase Auth (cả khi đăng nhập trực tiếp hoặc tự động đăng nhập sau khi đăng ký)
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) {
          setIsLoading(false);
          setError(loginData.message || "Tên đăng nhập hoặc mật khẩu không chính xác.");
          return;
        }

        // 3. Lấy thông tin profile đồng bộ chuẩn từ DB dựa trên User ID thực tế của Supabase Auth
        const profileResult = await getProfileById(loginData.user.id);
        
        setIsLoading(false);
        if (profileResult.success && profileResult.profile) {
          localStorage.setItem("currentUser", JSON.stringify(profileResult.profile));
          if (loginData.accessToken) {
            localStorage.setItem("accessToken", loginData.accessToken);
          }
          window.dispatchEvent(new Event("auth-state-change"));
          
          if (profileResult.profile.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/");
          }
        } else {
          setError("Tài khoản đã tạo thành công nhưng lỗi đồng bộ thông tin cá nhân từ Database.");
        }
      } catch (err) {
        setIsLoading(false);
        console.error(err);
        setError("Đã xảy ra lỗi hệ thống khi kết nối database.");
      }
    }
    authenticate();
  };

  const handleQuickLogin = (emailPreset: string) => {
    setEmail(emailPreset);
    setPassword("123456");
    setMode("login");
    setError(null);
  };

  const handleForgotPassword = async () => {
    setError(null);
    if (!email) {
      setError("Vui lòng nhập địa chỉ email của bạn trước để gửi liên kết khôi phục.");
      return;
    }
    if (!email.includes("@")) {
      setError("Địa chỉ email không đúng định dạng.");
      return;
    }
    
    setIsLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=recovery`,
      });
      
      setIsLoading(false);
      if (resetError) {
        setError(resetError.message || "Không thể gửi email khôi phục mật khẩu.");
      } else {
        alert(`Một liên kết khôi phục mật khẩu đã được gửi đến email ${email} của bạn! Vui lòng kiểm tra hộp thư.`);
      }
    } catch (err) {
      setIsLoading(false);
      setError("Lỗi hệ thống khi kết nối đến dịch vụ khôi phục.");
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError("Vui lòng nhập mật khẩu mới.");
      return;
    }
    if (password.length < 8) {
      setError("Mật khẩu phải chứa ít nhất 8 ký tự.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Mật khẩu phải chứa ít nhất một chữ hoa (A-Z).");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError("Mật khẩu phải chứa ít nhất một chữ thường (a-z).");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Mật khẩu phải chứa ít nhất một chữ số (0-9).");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Không tìm thấy mã khôi phục. Vui lòng thử yêu cầu lại liên kết.");
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ password: password })
      });

      const data = await res.json();
      setIsLoading(false);
      if (res.ok) {
        alert("Khôi phục và đặt lại mật khẩu mới thành công! Vui lòng đăng nhập bằng mật khẩu mới của bạn.");
        localStorage.removeItem("accessToken");
        setPassword("");
        setConfirmPassword("");
        setMode("login");
        router.push("/auth");
      } else {
        setError(data.message || "Đặt lại mật khẩu thất bại.");
      }
    } catch (err) {
      setIsLoading(false);
      setError("Lỗi hệ thống khi khôi phục mật khẩu.");
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-[#fcfbf9]">
      
      {/* Back to Home floating button */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-4 left-4 z-50 bg-white/95 text-[#004532] hover:bg-emerald-50 text-xs font-semibold px-4 py-2 rounded-full shadow-md flex items-center gap-1.5 transition-all cursor-pointer border border-gray-150/60"
      >
        <span className="text-xs">← Quay về trang chủ</span>
      </button>

      {/* Auth Form Frame (Left side) */}
      <section className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-20 bg-[#fefdfa] min-h-screen">
        <div className="w-full max-w-md space-y-8 text-left">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold italic text-primary-green tracking-tight">
                Trạm Đọc Xanh
              </h1>
              <div className="bg-secondary-container text-[#00513b] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Next.js Ready</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 font-sans tracking-tight">
              Chào mừng bạn đến với cộng đồng tri thức bền vững.
            </p>
          </div>

          {/* Custom Tab Switcher */}
          {mode !== "recovery" ? (
            <div className="relative bg-gray-100 p-1 rounded-full flex z-10 select-none">
            <button
              type="button"
              className={`flex-1 py-2.5 text-xs font-semibold rounded-full z-10 transition-colors duration-300 relative ${
                mode === "login" ? "text-primary-green font-bold bg-transparent" : "text-gray-500"
              }`}
              onClick={() => {
                setMode("login");
                setError(null);
              }}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 text-xs font-semibold rounded-full z-10 transition-colors duration-300 relative ${
                mode === "signup" ? "text-primary-green font-bold bg-transparent" : "text-gray-500"
              }`}
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
            >
              Đăng ký
            </button>
            
            {/* Sliding Indicator Background */}
            <div
              className="absolute top-1 left-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-xs transition-transform duration-300 ease-out"
              style={{
                transform: mode === "signup" ? "translateX(100%)" : "translateX(0%)",
              }}
            />
          </div>
          ) : (
            <div className="bg-emerald-50/70 border border-emerald-250 text-emerald-850 p-4 rounded-xl flex items-center gap-3 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Khôi phục & đặt lại mật khẩu mới cho tài khoản của bạn.</span>
            </div>
          )}

          {/* Validation Error Alerts */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-red-50 border border-red-250 text-red-705 p-4 rounded-xl flex items-center gap-3 text-xs"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          {mode === "recovery" ? (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-250 bg-white focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-primary-green text-sm font-semibold transition-all"
                    placeholder="Nhập mật khẩu mới..."
                    type={showPassword ? "text" : "password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>

                {/* Password Strength Checklist */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-gray-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span className={password.length >= 8 ? 'text-emerald-700 font-semibold' : ''}>Tối thiểu 8 ký tự</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(password) ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span className={/[A-Z]/.test(password) ? 'text-emerald-700 font-semibold' : ''}>Chữ hoa (A-Z)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(password) ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span className={/[a-z]/.test(password) ? 'text-emerald-700 font-semibold' : ''}>Chữ thường (a-z)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(password) ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span className={/[0-9]/.test(password) ? 'text-emerald-700 font-semibold' : ''}>Chữ số (0-9)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-250 bg-white focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-primary-green text-sm font-semibold transition-all"
                    placeholder="Xác nhận mật khẩu mới..."
                    type={showPassword ? "text" : "password"}
                    required
                  />
                </div>
              </div>

              <button
                disabled={isLoading}
                className={`w-full py-3.5 bg-primary-green text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md cursor-pointer hover:bg-primary-container transition-all active:scale-[0.99] flex items-center justify-center space-x-2 border-none ${
                  isLoading ? "opacity-75 cursor-not-allowed" : ""
                }`}
                type="submit"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Xác nhận mật khẩu mới</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  router.push("/auth");
                }}
                className="w-full text-center text-xs text-primary-green hover:underline font-semibold bg-transparent border-none cursor-pointer mt-2"
              >
                Quay lại Đăng nhập
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="popLayout">
              {/* Full Name input shown only in signup mode */}
              {mode === "signup" && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <UserIcon className="w-4 h-4" />
                    </span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-primary-green text-sm transition-all"
                      placeholder="Nguyễn Văn A"
                      type="text"
                    />
                  </div>
                </motion.div>
              )}

              {/* Email input field */}
              <div key="email-field" className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-primary-green text-sm transition-all"
                    placeholder="example@email.com"
                    type="email"
                  />
                </div>
              </div>

              {/* Password input field */}
              <div key="password-field" className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Mật khẩu
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-primary-green text-sm transition-all"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password input shown only in signup mode */}
              {mode === "signup" && (
                <motion.div
                  key="confirm-password-field"
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-primary-green text-sm transition-all"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forgot password trigger */}
            {mode === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-primary-green hover:underline font-medium hover:text-primary-container bg-transparent border-none cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              disabled={isLoading}
              className={`w-full py-3.5 bg-primary-green text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md cursor-pointer hover:bg-primary-container transition-all active:scale-[0.99] flex items-center justify-center space-x-2 border-none ${
                isLoading ? "opacity-75 cursor-not-allowed" : ""
              }`}
              type="submit"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          )}

          {mode !== "recovery" && (
            <>
              {/* Separator */}
              <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#fefdfa] px-3 text-gray-400 italic">Trải nghiệm nhanh ứng dụng</span>
                </div>
              </div>

              {/* Quick login shortcuts */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleQuickLogin("readers@tramdocxanh.vn")}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-lg hover:border-primary-green text-gray-600 hover:text-primary-green bg-white text-center font-medium transition-all cursor-pointer"
                >
                  Tài khoản Độc giả
                </button>
                <button
                  onClick={() => handleQuickLogin("admin@tramdocxanh.vn")}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-lg hover:border-primary-green text-gray-600 hover:text-primary-green bg-white text-center font-medium transition-all cursor-pointer"
                >
                  Tài khoản Admin
                </button>
              </div>

              {/* Toggle mode */}
              <p className="text-center text-xs text-gray-500">
                {mode === "login" ? (
                  <>
                    Bạn chưa có tài khoản?{" "}
                    <button
                      onClick={() => {
                        setMode("signup");
                        setError(null);
                      }}
                      className="text-primary-green font-bold hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Đăng ký ngay
                    </button>
                  </>
                ) : (
                  <>
                    Bạn đã có tài khoản?{" "}
                    <button
                      onClick={() => {
                        setMode("login");
                        setError(null);
                      }}
                      className="text-primary-green font-bold hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Đăng nhập
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </section>

      {/* Visual Brand Panel Frame (Right side) */}
      <section className="hidden md:flex md:w-1/2 relative bg-primary-container overflow-hidden min-h-screen">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-65 mix-blend-overlay scale-105"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8eqmXpybk6mQy-5k7WLmiiMooUxCz0g759apNrEMoDnqYvEFJ2OYxLLXBT0yz1joyYnfGuBhf_AilUYfQv2SJWbtMxw6ABGJTgMU_7enkYooT1EdhG01C-Wo8eX8V-8CjREk3k9gRbsj65hwqawQY_7RniuYPC_lQl6cAMqCwNWwsEuy3Nqtiury5JLVA1fJw6SVF6OfA0wetv5d-nh3xLDvsSrj0D9wd-X6bW3Avpb9qy_nB37n2maNaWlDJzA582sYNuH7MxNg"
            alt="Lush library natural reading sanctuary"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/95 via-emerald-deep/60 to-transparent" />
        </div>

        <div className="relative z-10 w-full flex flex-col justify-between p-12 lg:p-20 text-white h-full text-left">
          <div className="flex items-center space-x-2 text-xs font-semibold tracking-widest text-[#a6f2cf] uppercase opacity-90">
            <Leaf className="w-4 h-4 animate-pulse text-[#a6f2cf]" />
            <span>Trạm Đọc Xanh • Thư Viện Tri Thức</span>
          </div>

          <div className="my-auto space-y-12 max-w-lg">
            <h2 className="font-serif text-4xl lg:text-5xl font-semibold leading-tight tracking-tight mt-6">
              Nơi tri thức hòa nhịp cùng thiên nhiên
            </h2>

            <div className="space-y-8">
              <div className="flex items-start gap-5 group">
                <div className="w-12 h-12 rounded-full bg-[#a6f2cf]/10 flex items-center justify-center shrink-0 border border-[#a6f2cf]/25 group-hover:bg-[#a6f2cf]/20 transition-all duration-300">
                  <BookOpen className="w-6 h-6 text-[#a6f2cf]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-xl font-medium text-[#a6f2cf] italic">
                    Nuôi dưỡng tâm hồn
                  </h3>
                  <p className="text-sm text-gray-200 leading-relaxed font-light">
                    Tìm thấy sự tĩnh lặng qua từng trang sách trong một không gian số xanh mát và tối giản.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5 group">
                <div className="w-12 h-12 rounded-full bg-[#a6f2cf]/10 flex items-center justify-center shrink-0 border border-[#a6f2cf]/25 group-hover:bg-[#a6f2cf]/20 transition-all duration-300">
                  <Users className="w-6 h-6 text-[#a6f2cf]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-xl font-medium text-[#a6f2cf] italic">
                    Kết nối cộng đồng
                  </h3>
                  <p className="text-sm text-gray-200 leading-relaxed font-light">
                    Chia sẻ góc nhìn, thảo luận và cùng nhau xây dựng cộng đồng người đọc văn minh.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5 group">
                <div className="w-12 h-12 rounded-full bg-[#a6f2cf]/10 flex items-center justify-center shrink-0 border border-[#a6f2cf]/25 group-hover:bg-[#a6f2cf]/20 transition-all duration-300">
                  <Leaf className="w-6 h-6 text-[#a6f2cf]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-xl font-medium text-[#a6f2cf] italic">
                    Bảo tồn tri thức
                  </h3>
                  <p className="text-sm text-gray-200 leading-relaxed font-light">
                    Hướng tới một tương lai bền vững nơi văn hóa đọc được gìn giữ qua nhiều thế hệ.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex gap-12 text-left">
            <div className="space-y-1 transition-all duration-300 hover:translate-y-[-2px]">
              <span className="block font-serif text-3xl font-bold text-[#a6f2cf]">
                15k+
              </span>
              <span className="text-xs tracking-wider text-gray-300 uppercase">
                Thành viên tích cực
              </span>
            </div>
            <div className="space-y-1 transition-all duration-300 hover:translate-y-[-2px]">
              <span className="block font-serif text-3xl font-bold text-[#a6f2cf]">
                500+
              </span>
              <span className="text-xs tracking-wider text-gray-300 uppercase">
                Review chất lượng
              </span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
