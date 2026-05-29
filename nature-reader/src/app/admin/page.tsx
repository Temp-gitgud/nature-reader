"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, BookOpen, Users, CheckCircle, Settings, Bell, Search, 
  ArrowLeft, Check, X, ShieldAlert, Trash2, Edit, AlertCircle, FileText, Calendar, MessageSquare, Heart, Sparkles 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import RatingStars from "../../components/ui/RatingStars";
import { getPendingArticles, moderateArticle, getAdminStats, getAdminUsers } from "../../lib/actions/admin";

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "articles" | "users" | "approval">("dashboard");
  
  // Lists
  const [articles, setArticles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // DB platform stats state
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalApprovedPosts: 0,
    totalPendingPosts: 0,
    totalUsers: 0
  });

  // Approval flow states
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [notification, setNotification] = useState("");

  useEffect(() => {
    // 1. Auth check
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) {
      router.push("/auth");
      return;
    }
    const user = JSON.parse(storedUser);
    if (user.role !== "admin") {
      alert("Tài khoản của bạn không có quyền truy cập trang quản trị!");
      router.push("/");
      return;
    }
    setCurrentUser(user);

    async function fetchAdminData() {
      try {
        // Load articles in PENDING state from PostgreSQL
        const pending = await getPendingArticles();
        setArticles(pending);
        
        // Load live system aggregates
        const systemStats = await getAdminStats();
        setStats(systemStats);

        // Load actual database Profiles
        const dbUsers = await getAdminUsers();
        setUsers(dbUsers);
      } catch (err) {
        console.error("Error loading admin DB data:", err);
      }
    }
    fetchAdminData();
  }, [router]);

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3500);
  };

  const handleSelectApprovalArticle = (art: any) => {
    setSelectedArticle(art);
    setScanResult(null);
  };

  // Stats mapped to database states
  const pendingArticles = articles;
  const approvedArticles = { length: stats.totalApprovedPosts };

  const runAiAudit = () => {
    if (!selectedArticle) return;
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setIsScanning(false);
      setScanResult({
        originality: 94,
        aiProbability: 8,
        readability: "Tốt (8.5/10)"
      });
      triggerToast("Quét AI hoàn tất! Giao diện duyệt an toàn.");
    }, 1500);
  };

  const handleApprove = async (id: string) => {
    const adminId = currentUser?.id || "2a7a4073-7e46-4dfc-8be6-57cb521a086a";
    
    if (id.length > 15) {
      try {
        const result = await moderateArticle(id, adminId, "approved");
        if (result.success) {
          setArticles(prev => prev.filter(art => art.id !== id));
          setSelectedArticle(null);
          setScanResult(null);
          triggerToast(result.message);
          
          // Increment total approved posts in UI state
          setStats(prev => ({
            ...prev,
            totalApprovedPosts: prev.totalApprovedPosts + 1
          }));
        }
      } catch (err) {
        console.error("Error approving article:", err);
      }
    } else {
      // Mock fallback
      const updated = articles.map(art => 
        art.id === id ? { ...art, status: "approved" } : art
      );
      setArticles(updated);
      localStorage.setItem("globalArticles", JSON.stringify(updated));
      setSelectedArticle(null);
      setScanResult(null);
      triggerToast("Đã phê duyệt và xuất bản bài viết thành công!");
    }
  };

  const handleReject = async (id: string) => {
    const adminId = currentUser?.id || "2a7a4073-7e46-4dfc-8be6-57cb521a086a";
    const reason = rejectionReason || "Nội dung bài viết chưa đạt chuẩn kiểm duyệt của Trạm Đọc Xanh.";
    
    if (id.length > 15) {
      try {
        const result = await moderateArticle(id, adminId, "rejected", reason);
        if (result.success) {
          setArticles(prev => prev.filter(art => art.id !== id));
          setSelectedArticle(null);
          setScanResult(null);
          setRejectionReason("");
          triggerToast(result.message);
        }
      } catch (err) {
        console.error("Error rejecting article:", err);
      }
    } else {
      // Mock fallback
      const reason = rejectionReason || "Nội dung bài viết chưa đạt chuẩn kiểm duyệt của Trạm Đọc Xanh.";
      const updated = articles.map(art => 
        art.id === id ? { ...art, status: "rejected", rejectReason: reason } : art
      );
      setArticles(updated);
      localStorage.setItem("globalArticles", JSON.stringify(updated));
      setSelectedArticle(null);
      setScanResult(null);
      setRejectionReason("");
      triggerToast("Đã từ chối bài đăng review sách.");
    }
  };

  const handleDeleteArticle = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn bài đăng review này?")) {
      const updated = articles.filter(art => art.id !== id);
      setArticles(updated);
      localStorage.setItem("globalArticles", JSON.stringify(updated));
      triggerToast("Đã xóa bài đăng review sách.");
    }
  };

  const handleToggleUserRole = (email: string) => {
    const updated = users.map(u => 
      u.email === email ? { ...u, role: u.role === "admin" ? "user" : "admin" } : u
    );
    setUsers(updated);
    localStorage.setItem("mockUsers", JSON.stringify(updated));
    triggerToast("Đã thay đổi quyền tài khoản người dùng.");
  };

  const handleDeleteUser = (email: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản ${email}?`)) {
      const updated = users.filter(u => u.email !== email);
      setUsers(updated);
      localStorage.setItem("mockUsers", JSON.stringify(updated));
      triggerToast("Đã gỡ bỏ tài khoản thành viên.");
    }
  };

  if (!currentUser) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#004532] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#fcfcf9] selection:bg-[#a6f2cf]">
      <Header />

      {/* Floating notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-[#004532] text-white border border-[#a6f2cf]/30 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold"
          >
            <Check className="w-4.5 h-4.5 text-[#a6f2cf] shrink-0" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-10 flex flex-col lg:flex-row gap-8 items-stretch">
        
        {/* Left Sidebar Menu */}
        <aside className="w-full lg:w-64 bg-white border border-gray-150 rounded-3xl p-5 shrink-0 flex flex-col justify-between text-left shadow-2xs h-fit">
          <div className="space-y-6">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-gray-100">
              <ShieldAlert className="w-5 h-5 text-emerald-800" />
              <span className="font-serif text-lg font-bold text-emerald-850">Admin Console</span>
            </div>

            <nav className="flex flex-col gap-1 text-xs font-semibold">
              <button
                onClick={() => { setActiveTab("dashboard"); setSelectedArticle(null); }}
                className={`w-full px-4 py-3 rounded-xl flex items-center space-x-3 transition-colors cursor-pointer border-none ${
                  activeTab === "dashboard" ? "bg-emerald-50/70 text-emerald-800 font-bold" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <LayoutDashboard className="w-4.5 h-4.5" />
                <span>Bảng điều khiển</span>
              </button>
              
              <button
                onClick={() => { setActiveTab("approval"); }}
                className={`w-full px-4 py-3 rounded-xl flex items-center justify-between transition-colors cursor-pointer border-none ${
                  activeTab === "approval" ? "bg-emerald-50/70 text-emerald-800 font-bold" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-4.5 h-4.5" />
                  <span>Duyệt bài đăng</span>
                </div>
                {pendingArticles.length > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    {pendingArticles.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab("articles"); setSelectedArticle(null); }}
                className={`w-full px-4 py-3 rounded-xl flex items-center space-x-3 transition-colors cursor-pointer border-none ${
                  activeTab === "articles" ? "bg-emerald-50/70 text-emerald-800 font-bold" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <BookOpen className="w-4.5 h-4.5" />
                <span>Quản lý bài viết</span>
              </button>

              <button
                onClick={() => { setActiveTab("users"); setSelectedArticle(null); }}
                className={`w-full px-4 py-3 rounded-xl flex items-center space-x-3 transition-colors cursor-pointer border-none ${
                  activeTab === "users" ? "bg-emerald-50/70 text-emerald-800 font-bold" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Users className="w-4.5 h-4.5" />
                <span>Quản lý thành viên</span>
              </button>
            </nav>
          </div>

          <div className="pt-6 border-t border-gray-100 mt-10">
            <button 
              onClick={() => router.push("/")}
              className="text-xs font-bold text-gray-500 hover:text-emerald-800 flex items-center gap-1.5 bg-transparent border-none cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Thoát về trang chủ</span>
            </button>
          </div>
        </aside>

        {/* Right dashboard workspace area */}
        <section className="flex-1 min-w-0">
          
          {/* TAB 1: DASHBOARD METRICS */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 text-left">
              <h2 className="font-serif text-2xl font-bold text-gray-900 leading-none">Bảng phân tích tổng quan</h2>
              
              {/* Bento grid stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Bài viết đã duyệt</span>
                  <p className="font-serif text-3xl font-bold text-gray-900 mt-1">{stats.totalApprovedPosts} bài</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Bài viết chờ duyệt</span>
                  <p className="font-serif text-3xl font-bold text-red-650 mt-1">{stats.totalPendingPosts || pendingArticles.length} bài</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Thư viện sách</span>
                  <p className="font-serif text-3xl font-bold text-gray-900 mt-1">{stats.totalBooks} cuốn</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Thành viên hệ thống</span>
                  <p className="font-serif text-3xl font-bold text-emerald-800 mt-1">{stats.totalUsers || (users.length + 1)} người</p>
                </div>
              </div>

              {/* Recent articles waitlist log */}
              <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-4 shadow-2xs">
                <h3 className="font-serif text-base font-bold text-gray-800">Các bài đăng review mới nhất</h3>
                <div className="divide-y divide-gray-100">
                  {articles.slice(0, 5).map((art) => (
                    <div key={art.id} className="py-3 flex items-center justify-between text-xs gap-4">
                      <div className="min-w-0 text-left">
                        <p className="font-bold text-gray-800 truncate">{art.title}</p>
                        <span className="text-[10px] text-gray-400">{art.authorName || "Độc giả ẩn danh"} • {art.date}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        art.status === "approved" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
                      }`}>
                        {art.status === "approved" ? "Approved" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: POST MODERATION STREAM */}
          {activeTab === "approval" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left items-stretch">
              
              {/* Waiting articles column */}
              <div className="md:col-span-4 bg-white border border-gray-150 rounded-2xl p-5 space-y-4 shadow-2xs">
                <h3 className="font-serif text-base font-bold text-gray-800">Danh sách chờ duyệt ({pendingArticles.length})</h3>
                
                <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
                  {pendingArticles.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => handleSelectApprovalArticle(art)}
                      className={`p-3.5 rounded-xl border text-xs text-left cursor-pointer transition-all ${
                        selectedArticle?.id === art.id 
                          ? "bg-emerald-50 border-emerald-800/20" 
                          : "bg-white border-gray-150 hover:bg-gray-50"
                      }`}
                    >
                      <p className="font-bold text-gray-850 line-clamp-1">{art.title}</p>
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>{art.authorName}</span>
                        <span>{art.date}</span>
                      </div>
                    </div>
                  ))}
                  {pendingArticles.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-10 font-light">Tuyệt vời! Không còn bài nào chờ kiểm duyệt.</p>
                  )}
                </div>
              </div>

              {/* Moderate detail and audit panel */}
              <div className="md:col-span-8 bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs">
                {selectedArticle ? (
                  <div className="space-y-6">
                    <div className="border-b border-gray-100 pb-4">
                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm uppercase">
                        {selectedArticle.category}
                      </span>
                      <h3 className="font-serif text-xl font-bold text-gray-900 mt-2">{selectedArticle.title}</h3>
                      <p className="text-[10px] text-gray-400 mt-1">Người gửi: {selectedArticle.authorName} • Sách review: {selectedArticle.bookTitle}</p>
                    </div>

                    <div className="text-xs text-gray-600 leading-relaxed font-light line-clamp-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100 max-h-48 overflow-y-auto">
                      {selectedArticle.fullText || selectedArticle.excerpt}
                    </div>

                    {/* AI Plagiarism Audit panel mock */}
                    <div className="bg-[#eff4ff]/80 border border-white p-4.5 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-xs font-bold text-primary-green flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-emerald-800" />
                          <span>AI Plagiarism & Quality Scan</span>
                        </h4>
                        
                        {!scanResult && (
                          <button
                            type="button"
                            onClick={runAiAudit}
                            disabled={isScanning}
                            className="bg-[#004532] text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg hover:bg-emerald-900 border-none cursor-pointer focus:outline-none"
                          >
                            {isScanning ? "Đang quét..." : "Quét AI kiểm tra"}
                          </button>
                        )}
                      </div>

                      {scanResult && (
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-white/80 p-3 rounded-xl border border-gray-100">
                            <span className="text-[9px] font-semibold text-gray-400 uppercase">Nguyên bản</span>
                            <p className="font-serif text-lg font-bold text-emerald-850 mt-0.5">{scanResult.originality}%</p>
                          </div>
                          <div className="bg-white/80 p-3 rounded-xl border border-gray-100">
                            <span className="text-[9px] font-semibold text-gray-400 uppercase">Tỷ lệ viết bởi AI</span>
                            <p className="font-serif text-lg font-bold text-red-650 mt-0.5">{scanResult.aiProbability}%</p>
                          </div>
                          <div className="bg-white/80 p-3 rounded-xl border border-gray-100 col-span-1">
                            <span className="text-[9px] font-semibold text-gray-400 uppercase">Đọc dễ hiểu</span>
                            <p className="font-serif text-[10px] font-bold text-gray-800 mt-1">{scanResult.readability}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reject reason input */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Ý kiến phê bình / Lý do từ chối (nếu có)
                      </label>
                      <input 
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Nhập lý do từ chối để gửi ý kiến sửa đổi..."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-250 bg-white focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-primary-green text-xs"
                      />
                    </div>

                    {/* Actions block */}
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => handleReject(selectedArticle.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-5 py-3 rounded-xl flex items-center gap-1 border border-red-200 cursor-pointer focus:outline-none"
                      >
                        <X className="w-4 h-4" />
                        <span>Từ chối</span>
                      </button>
                      <button
                        onClick={() => handleApprove(selectedArticle.id)}
                        className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-6 py-3 rounded-xl flex items-center gap-1 border-none cursor-pointer focus:outline-none"
                      >
                        <Check className="w-4 h-4" />
                        <span>Duyệt & Xuất bản</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-gray-300 space-y-4">
                    <CheckCircle className="w-16 h-16 stroke-[1.5]" />
                    <p className="text-xs text-gray-400 font-light">Hãy bấm chọn một bài viết bên trái để bắt đầu quy trình duyệt AI.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: ARTICLES MANAGEMENT */}
          {activeTab === "articles" && (
            <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs space-y-6 text-left">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <h3 className="font-serif text-base font-bold text-gray-800">Tất cả bài viết cảm nhận</h3>
              </div>

              <div className="divide-y divide-gray-100 max-h-[550px] overflow-y-auto pr-1">
                {articles.map((art) => (
                  <div key={art.id} className="py-4 flex items-center justify-between gap-4 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-850 truncate">{art.title}</p>
                      <div className="flex items-center gap-4 text-[10px] text-gray-400 mt-1">
                        <span>Tác giả: {art.authorName || "Độc giả ẩn danh"}</span>
                        <span>Đã thích: {art.likes}</span>
                        <span>Thể loại: {art.category}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteArticle(art.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50/50 transition-colors focus:outline-none border-none bg-transparent cursor-pointer"
                      title="Gỡ bài đăng"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: USERS ROLE MANAGEMENT */}
          {activeTab === "users" && (
            <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs space-y-6 text-left">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <h3 className="font-serif text-base font-bold text-gray-800">Quản lý tài khoản độc giả</h3>
              </div>

              <div className="divide-y divide-gray-100 max-h-[550px] overflow-y-auto pr-1">
                {users.map((u) => (
                  <div key={u.email} className="py-4 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={u.avatarUrl} className="w-9 h-9 rounded-full bg-gray-50 object-cover" />
                      <div className="text-left min-w-0">
                        <p className="font-bold text-gray-800">{u.name}</p>
                        <span className="text-[10px] text-gray-400 truncate block">{u.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleUserRole(u.email)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer border focus:outline-none ${
                          u.role === "admin" 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                            : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {u.role === "admin" ? "Admin" : "Độc giả"}
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u.email)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50/50 transition-colors focus:outline-none border-none bg-transparent cursor-pointer"
                        title="Ban tài khoản"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>
      </main>

      <Footer />
    </div>
  );
}
