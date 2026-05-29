"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  BookOpen, Star, Sparkles, ChevronRight, Heart, MessageSquare, Edit3, Trash2, Plus, 
  User as UserIcon, BookCheck, Compass, FileText, Check, Award, X, Camera,
  Lock, AlertCircle, Eye, EyeOff
} from "lucide-react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import RatingStars from "../../components/ui/RatingStars";
import { motion, AnimatePresence } from "motion/react";
import { getBookcaseStats, updateProfile, uploadAvatarServer, uploadBookCoverServer, createBookInDb } from "../../lib/actions/book";

function BookcaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") === "settings" ? "settings" : "profile";

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmNewPass, setShowConfirmNewPass] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [isSubmittingPass, setIsSubmittingPass] = useState(false);

  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [terminateError, setTerminateError] = useState<string | null>(null);
  const [isSubmittingTerminate, setIsSubmittingTerminate] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);

    // Validation
    if (newPassword.length < 8) {
      setSettingsError("Mật khẩu phải chứa ít nhất 8 ký tự.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setSettingsError("Mật khẩu phải chứa ít nhất một ký tự hoa (A-Z).");
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setSettingsError("Mật khẩu phải chứa ít nhất một ký tự thường (a-z).");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setSettingsError("Mật khẩu phải chứa ít nhất một chữ số (0-9).");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setSettingsError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmittingPass(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setSettingsError("Bạn không có quyền thực hiện hành động này. Vui lòng đăng nhập lại.");
        setIsSubmittingPass(false);
        return;
      }

      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });

      const data = await res.json();
      setIsSubmittingPass(false);
      if (res.ok) {
        setNewPassword("");
        setConfirmNewPassword("");
        triggerNotification("Cập nhật mật khẩu mới cực kỳ an toàn thành công!");
      } else {
        if (res.status === 401) {
          setSettingsError("Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng xuất và đăng nhập lại để cập nhật mật khẩu.");
        } else {
          setSettingsError(data.message || "Cập nhật mật khẩu thất bại.");
        }
      }
    } catch (err) {
      setIsSubmittingPass(false);
      setSettingsError("Lỗi hệ thống khi kết nối database.");
    }
  };

  const handleTerminateAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setTerminateError(null);
    setIsSubmittingTerminate(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setTerminateError("Bạn không có quyền thực hiện hành động này. Vui lòng đăng nhập lại.");
        setIsSubmittingTerminate(false);
        return;
      }

      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();
      setIsSubmittingTerminate(false);
      if (res.ok) {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("accessToken");
        window.dispatchEvent(new Event("auth-state-change"));
        router.push("/");
        alert("Tài khoản của bạn đã được xóa hoàn toàn và lưu giữ các bài review dưới dạng ẩn danh.");
      } else {
        if (res.status === 401) {
          setTerminateError("Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng xuất và đăng nhập lại để thực hiện xóa tài khoản.");
        } else {
          setTerminateError(data.message || "Xóa tài khoản thất bại.");
        }
      }
    } catch (err) {
      setIsSubmittingTerminate(false);
      setTerminateError("Lỗi hệ thống khi xóa tài khoản.");
    }
  };

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [recents, setRecents] = useState<any[]>([]);
  
  // Profile inputs
  const [profileName, setProfileName] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempBio, setTempBio] = useState("");
  
  // Storage upload states
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");

  // DB stats state
  const [stats, setStats] = useState({
    readCount: 0,
    reviewCount: 0
  });

  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [newBookRating, setNewBookRating] = useState(5.0);
  const [newBookPublishedYear, setNewBookPublishedYear] = useState("");
  const [newBookSummary, setNewBookSummary] = useState("");

  // Open Library API search states
  const [openLibraryResults, setOpenLibraryResults] = useState<any[]>([]);
  const [isSearchingOL, setIsSearchingOL] = useState(false);
  const [externalCoverUrl, setExternalCoverUrl] = useState("");

  const [notification, setNotification] = useState("");

  useEffect(() => {
    // 1. Fetch user session
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) {
      router.push("/auth");
      return;
    }
    
    const user = JSON.parse(storedUser);
    setCurrentUser(user);
    setProfileName(user.name);
    setProfileBio(user.bio || "“Sách là những chuyến du hành tâm hồn, nơi ta tìm thấy sự bình yên giữa dòng đời hối hả.”");

    const storedRecents = localStorage.getItem("recentViewedBooks");
    if (storedRecents) {
      try {
        setRecents(JSON.parse(storedRecents).slice(0, 4));
      } catch (e) {
        console.error(e);
      }
    }

    async function fetchStats() {
      try {
        const userId = user.id || "5c9f5643-4be9-4e78-8742-892410a8d6e3";
        const res = await getBookcaseStats(userId);
        if (res.profile) {
          setProfileName(res.profile.name);
          setProfileBio(res.profile.bio || "“Sách là những chuyến du hành tâm hồn...”");
          
          const syncedUser = {
            ...user,
            id: userId,
            name: res.profile.name,
            bio: res.profile.bio,
            avatarUrl: res.profile.avatarUrl || user.avatarUrl
          };
          setCurrentUser(syncedUser);
          localStorage.setItem("currentUser", JSON.stringify(syncedUser));
        }
        setStats({
          readCount: res.readCount,
          reviewCount: res.reviewCount
        });

        if (res.favoriteBooks.length > 0) {
          setFavorites(res.favoriteBooks);
        } else {
          // Fallback to local storage mock favorites
          const storedFavs = localStorage.getItem(`favorites_${user.email}`);
          if (storedFavs) {
            setFavorites(JSON.parse(storedFavs));
          } else {
            setFavorites([]);
          }
        }
      } catch (err) {
        console.error("Error loading bookcase DB stats:", err);
      }
    }
    fetchStats();
  }, [router]);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3500);
  };

  const handleEditProfileInit = () => {
    setTempName(profileName);
    setTempBio(profileBio);
    setIsEditingProfile(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedAvatarFile(file);
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
      setAvatarPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCancelEditProfile = () => {
    setIsEditingProfile(false);
    setSelectedAvatarFile(null);
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl("");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim() && currentUser) {
      const userId = currentUser.id || "5c9f5643-4be9-4e78-8742-892410a8d6e3";
      
      try {
        let uploadedAvatarUrl = currentUser.avatarUrl;

        // Tải ảnh lên Supabase Storage thông qua Server Action (an toàn + bypass RLS)
        if (selectedAvatarFile) {
          const uploadFormData = new FormData();
          uploadFormData.append("file", selectedAvatarFile);

          const uploadResult = await uploadAvatarServer(userId, uploadFormData);
          if (uploadResult.success && uploadResult.url) {
            uploadedAvatarUrl = uploadResult.url;
          } else {
            console.error("Lỗi khi tải ảnh đại diện lên server:", uploadResult.message);
            alert("Lỗi tải ảnh: " + uploadResult.message);
            return;
          }
        }

        const result = await updateProfile(userId, {
          displayName: tempName,
          bio: tempBio,
          avatarUrl: uploadedAvatarUrl
        });

        if (result.success && result.profile) {
          const updatedUser = {
            ...currentUser,
            name: result.profile.name,
            bio: result.profile.bio,
            avatarUrl: result.profile.avatarUrl
          };
          
          setCurrentUser(updatedUser);
          setProfileName(tempName);
          setProfileBio(tempBio);
          setIsEditingProfile(false);
          setSelectedAvatarFile(null);
          if (avatarPreviewUrl) {
            URL.revokeObjectURL(avatarPreviewUrl);
            setAvatarPreviewUrl("");
          }
          
          localStorage.setItem("currentUser", JSON.stringify(updatedUser));
          window.dispatchEvent(new Event("auth-state-change"));
          triggerNotification(result.message);
        } else {
          alert("Lỗi: " + result.message);
        }
      } catch (err) {
        console.error("Error updating profile:", err);
        alert("Đã xảy ra lỗi khi cập nhật thông tin cá nhân của bạn.");
      }
    }
  };

  const handleDeleteBook = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa cuốn sách này khỏi mục yêu thích?")) {
      const updated = favorites.filter(b => b.id !== id);
      setFavorites(updated);
      if (currentUser) {
        localStorage.setItem(`favorites_${currentUser.email}`, JSON.stringify(updated));
      }
      triggerNotification("Đã xóa sách khỏi kho yêu thích.");
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedCoverFile(file);
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
      setCoverPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCloseAddBookModal = () => {
    setShowAddBookModal(false);
    setSelectedCoverFile(null);
    setNewBookTitle("");
    setNewBookAuthor("");
    setNewBookRating(5.0);
    setNewBookPublishedYear("");
    setNewBookSummary("");
    setOpenLibraryResults([]);
    setExternalCoverUrl("");
    if (coverPreviewUrl) {
      // Chỉ thu hồi Object URL nếu nó được tạo bởi local preview, tránh lỗi thu hồi link CDN của Open Library
      if (coverPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
      setCoverPreviewUrl("");
    }
  };

  const handleSearchOpenLibrary = async () => {
    if (!newBookTitle.trim()) {
      alert("Vui lòng nhập tên sách cần tìm!");
      return;
    }
    setIsSearchingOL(true);
    setOpenLibraryResults([]);
    try {
      const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(newBookTitle.trim())}&limit=5`);
      const data = await response.json();
      if (data.docs && data.docs.length > 0) {
        const results = data.docs.map((doc: any) => ({
          title: doc.title,
          author: doc.author_name ? doc.author_name[0] : "Chưa rõ tác giả",
          publishYear: doc.first_publish_year || "",
          coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : ""
        }));
        setOpenLibraryResults(results);
      } else {
        triggerNotification("Không tìm thấy kết quả phù hợp trên Open Library.");
      }
    } catch (err) {
      console.error("Lỗi tìm kiếm Open Library:", err);
      triggerNotification("Không thể kết nối đến Open Library API.");
    } finally {
      setIsSearchingOL(false);
    }
  };

  const handleSelectOLSuggestion = (suggestion: any) => {
    setNewBookTitle(suggestion.title);
    setNewBookAuthor(suggestion.author);
    setNewBookPublishedYear(suggestion.publishYear ? String(suggestion.publishYear) : "");
    setNewBookSummary(`Tác phẩm nghệ thuật tuyệt vời "${suggestion.title}" của tác giả ${suggestion.author}. Xuất bản lần đầu năm ${suggestion.publishYear || "chưa rõ"}.`);
    
    if (suggestion.coverUrl) {
      setExternalCoverUrl(suggestion.coverUrl);
      setCoverPreviewUrl(suggestion.coverUrl);
    }
    setOpenLibraryResults([]);
  };

  const handleAddBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle || !newBookAuthor) return;

    let finalCoverUrl = externalCoverUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuAC6GKy2vXIuYrlzg-zB_U6wSFH3uOBBk8kru_6awMKuuwQZXT4TL2lDzOtX4V62TZo60yDJR2WHXHX54LJvxyUfzHxiK7sd_zUMpH7-ia76nz6waYryP1Li5z1Bn_FzG18u0V0z8eP8Yxv5Z8JwtDpJlFBz2-m7YuWl_7snHstQUpPrl7KdydPlVMCVSDuNoJMCWccXPBcbMnzRYw6bA3-Ifr0GP4nkS5TKef6ap64VAEXVS7SvagQQ7LrG3IfH3Y419xSKh4U72Y";

    if (selectedCoverFile && currentUser) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append("file", selectedCoverFile);

        const uploadResult = await uploadBookCoverServer(currentUser.id, uploadFormData);
        if (uploadResult.success && uploadResult.url) {
          finalCoverUrl = uploadResult.url;
          setExternalCoverUrl("");
        } else {
          console.error("Lỗi khi tải ảnh bìa sách lên server:", uploadResult.message);
          alert("Lỗi tải ảnh bìa: " + uploadResult.message);
          return;
        }
      } catch (err) {
        console.error("Error uploading book cover:", err);
      }
    }

    // Chuyển năm xuất bản sang dạng số nguyên
    const pubYearInt = newBookPublishedYear ? parseInt(newBookPublishedYear, 10) : undefined;

    // Thêm sách vào database PostgreSQL thật để cuốn sách thực sự tồn tại trên hệ thống
    let dbBookId = "f-" + Date.now();
    try {
      const dbResult = await createBookInDb({
        title: newBookTitle,
        author: newBookAuthor,
        coverUrl: finalCoverUrl,
        summary: newBookSummary,
        publishedYear: pubYearInt
      });
      if (dbResult.success && dbResult.book) {
        dbBookId = dbResult.book.id;
      }
    } catch (dbErr) {
      console.error("Lỗi khi lưu sách vào database:", dbErr);
    }

    const newBook = {
      id: dbBookId,
      title: newBookTitle,
      author: newBookAuthor,
      rating: newBookRating,
      coverUrl: finalCoverUrl
    };

    const updated = [newBook, ...favorites];
    setFavorites(updated);
    if (currentUser) {
      localStorage.setItem(`favorites_${currentUser.email}`, JSON.stringify(updated));
    }
    
    setShowAddBookModal(false);
    setNewBookTitle("");
    setNewBookAuthor("");
    setNewBookRating(5.0);
    setNewBookPublishedYear("");
    setNewBookSummary("");
    setOpenLibraryResults([]);
    setExternalCoverUrl("");
    setSelectedCoverFile(null);
    if (coverPreviewUrl) {
      if (coverPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
      setCoverPreviewUrl("");
    }
    triggerNotification(`Đã thêm thành công cuốn "${newBookTitle}" vào tủ sách!`);
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

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-12">
        {/* Floating notifications */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="fixed bottom-6 right-6 z-50 bg-[#004532] text-white border border-[#a6f2cf]/30 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold font-sans"
            >
              <Check className="w-4.5 h-4.5 text-[#a6f2cf] shrink-0" />
              <span>{notification}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-150 pb-px gap-6 mb-8 relative">
          <button
            onClick={() => {
              router.push("/bookcase?tab=profile");
            }}
            className={`pb-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all relative flex items-center gap-2 cursor-pointer border-none bg-transparent ${
              activeTab === "profile" 
                ? "text-[#004532] font-bold" 
                : "text-gray-400 hover:text-[#004532]"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Tủ sách & Hồ sơ</span>
            {activeTab === "profile" && (
              <motion.div 
                layoutId="activeTabUnderline" 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#004532]" 
              />
            )}
          </button>
          <button
            onClick={() => {
              router.push("/bookcase?tab=settings");
            }}
            className={`pb-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all relative flex items-center gap-2 cursor-pointer border-none bg-transparent ${
              activeTab === "settings" 
                ? "text-[#004532] font-bold" 
                : "text-gray-400 hover:text-[#004532]"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Cài đặt bảo mật</span>
            {activeTab === "settings" && (
              <motion.div 
                layoutId="activeTabUnderline" 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#004532]" 
              />
            )}
          </button>
        </div>

        {activeTab === "settings" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Col: Info panel */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-2xs text-left">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-[#004532]" />
                </div>
                <h4 className="font-serif text-lg font-bold text-gray-900">Bảo mật tài khoản</h4>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed font-light">
                  Tại đây bạn có thể cập nhật mật khẩu đăng nhập hoặc tiến hành vô hiệu hóa / xóa vĩnh viễn tài khoản của mình khỏi hệ thống.
                </p>
                <div className="mt-4 p-3 bg-amber-50/50 border border-amber-200/50 rounded-xl flex gap-2 text-[11px] text-amber-800">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <p className="leading-relaxed">
                    Mật khẩu mới yêu cầu tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 số để đảm bảo tính an toàn cực đại.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Col: Forms */}
            <div className="lg:col-span-2 space-y-8">
              {/* Form đổi mật khẩu */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-2xs text-left">
                <h4 className="font-serif text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">
                  Đổi mật khẩu mới
                </h4>

                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-250 bg-white focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-primary-green text-sm font-semibold transition-all"
                        placeholder="Nhập mật khẩu mới..."
                        type={showNewPass ? "text" : "password"}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer"
                      >
                        {showNewPass ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>

                    {/* Live Password Strength Checklist */}
                    <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-gray-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 8 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <span className={newPassword.length >= 8 ? 'text-emerald-700 font-semibold' : ''}>Tối thiểu 8 ký tự</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(newPassword) ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <span className={/[A-Z]/.test(newPassword) ? 'text-emerald-700 font-semibold' : ''}>Chữ hoa (A-Z)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(newPassword) ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <span className={/[a-z]/.test(newPassword) ? 'text-emerald-700 font-semibold' : ''}>Chữ thường (a-z)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(newPassword) ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <span className={/[0-9]/.test(newPassword) ? 'text-emerald-700 font-semibold' : ''}>Chữ số (0-9)</span>
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
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-250 bg-white focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-primary-green text-sm font-semibold transition-all"
                        placeholder="Nhập lại mật khẩu mới..."
                        type={showConfirmNewPass ? "text" : "password"}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPass(!showConfirmNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer"
                      >
                        {showConfirmNewPass ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  {settingsError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl flex items-center gap-2.5 text-xs">
                      <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-500" />
                      <span>{settingsError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingPass}
                    className={`bg-[#004532] text-white text-xs font-semibold uppercase tracking-wider py-3 px-6 rounded-xl hover:bg-[#065f46] cursor-pointer transition-all border-none flex items-center gap-2 shadow-2xs ${isSubmittingPass ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSubmittingPass ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4.5 h-4.5" />
                        <span>Cập nhật mật khẩu</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Khu vực Danger Zone xóa tài khoản */}
              <div className="bg-red-50/20 border border-red-200/60 rounded-3xl p-6 sm:p-8 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl" />
                
                <h4 className="font-serif text-lg font-bold text-red-800 border-b border-red-100 pb-3 mb-4 flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-650" />
                  <span>Danger Zone (Vùng nguy hiểm)</span>
                </h4>
                
                <p className="text-xs text-gray-550 leading-relaxed font-light mb-5">
                  Khi thực hiện xóa tài khoản, toàn bộ thông tin cá nhân của bạn sẽ bị gỡ bỏ vĩnh viễn khỏi cơ sở dữ liệu. Các bài viết review và bình luận của bạn sẽ được ẩn danh hoặc tự động gán dưới tên người dùng ẩn danh để bảo toàn tài nguyên tri thức cộng đồng. Hành động này không thể hoàn tác!
                </p>

                <div className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-red-700">
                      Nhập chữ <span className="font-bold select-all bg-red-100/60 px-1 py-0.5 rounded text-red-800">DELETE</span> để xác nhận
                    </label>
                    <input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-550 text-sm font-semibold transition-all"
                      placeholder="DELETE..."
                      type="text"
                    />
                  </div>

                  {terminateError && (
                    <div className="bg-red-50 border border-red-200 text-red-750 p-3.5 rounded-xl flex items-center gap-2.5 text-xs">
                      <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-500" />
                      <span>{terminateError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleTerminateAccount}
                    disabled={deleteConfirmText !== "DELETE" || isSubmittingTerminate}
                    className={`bg-red-600 text-white text-xs font-semibold uppercase tracking-wider py-3 px-6 rounded-xl hover:bg-red-700 cursor-pointer transition-all border-none flex items-center gap-2 shadow-2xs ${deleteConfirmText !== "DELETE" || isSubmittingTerminate ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmittingTerminate ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <AlertCircle className="w-4.5 h-4.5" />
                        <span>Xóa vĩnh viễn tài khoản</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Profile Card Banner */}
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-150 shadow-2xs flex flex-col md:flex-row gap-8 items-start md:items-center relative overflow-hidden">
          {/* Subtle green decoration */}
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#a6f2cf]/10 rounded-full blur-2xl -z-0" />
          
          <div className="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-full shrink-0 z-10 overflow-hidden border-2 border-emerald-800/10 bg-gray-50">
            <img 
              src={avatarPreviewUrl || currentUser.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg?seed=A"} 
              alt="profile avatar"
              className="w-full h-full object-cover"
            />
            {isEditingProfile && (
              <label 
                htmlFor="avatar-upload" 
                className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer select-none"
              >
                <Camera className="w-5 h-5 mb-1 text-white" />
                <span>Thay ảnh</span>
              </label>
            )}
            <input 
              type="file" 
              id="avatar-upload" 
              accept="image/*" 
              className="hidden" 
              onChange={handleAvatarChange}
            />
          </div>

          <div className="flex-1 text-left space-y-4 z-10 w-full">
            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-3.5 max-w-lg">
                <input 
                  type="text" 
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Họ và tên..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-primary-green text-sm font-semibold"
                  required
                />
                <textarea 
                  value={tempBio}
                  onChange={(e) => setTempBio(e.target.value)}
                  placeholder="Tiểu sử / Khẩu hiệu đọc..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-primary-green text-xs font-light leading-relaxed h-20"
                />
                <div className="flex gap-2">
                  <button 
                    type="submit"
                    className="bg-[#004532] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#065f46] cursor-pointer border-none"
                  >
                    Lưu
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCancelEditProfile}
                    className="bg-gray-150 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 cursor-pointer border-none"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 leading-none">
                    {profileName}
                  </h2>
                  <button
                    onClick={handleEditProfileInit}
                    className="p-1.5 text-gray-400 hover:text-primary-green rounded-full hover:bg-emerald-50/50 transition-colors focus:outline-none bg-transparent border-none cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-light italic max-w-2xl">
                  {profileBio}
                </p>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-[10px] sm:text-xs font-semibold text-emerald-800 tracking-wider uppercase">
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-emerald-700 stroke-[1.5]" />
                    <span>Hạng: Độc giả sinh thái</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookCheck className="w-4 h-4 text-emerald-700 stroke-[1.5]" />
                    <span>Mục tiêu đọc năm: 24 cuốn</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Dynamic statistics section */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-2xs">
            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Yêu thích</span>
            <p className="font-serif text-3xl font-bold text-gray-900 mt-1">{favorites.length} cuốn</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-2xs">
            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Đã review</span>
            <p className="font-serif text-3xl font-bold text-gray-900 mt-1">{stats.reviewCount || 0} bài</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-2xs">
            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Sách đã đọc</span>
            <p className="font-serif text-3xl font-bold text-gray-900 mt-1">{stats.readCount || 0} cuốn</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-2xs">
            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Đánh giá chung</span>
            <p className="font-serif text-3xl font-bold text-gray-900 mt-1">4.8 sao</p>
          </div>
        </section>

        {/* Favorite shelf list container */}
        <section className="space-y-6 text-left">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 gap-4">
            <div className="flex items-center space-x-2 text-[#004532]">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              <h3 className="font-serif text-xl font-bold">Kệ sách yêu thích</h3>
            </div>

            <button
              onClick={() => setShowAddBookModal(true)}
              className="bg-[#004532] hover:bg-[#065f46] text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1 cursor-pointer border-none shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm sách</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
            {favorites.length > 0 ? (
              favorites.map((book) => (
                <div 
                  key={book.id}
                  onClick={() => router.push(`/search?q=${encodeURIComponent(book.title)}&tab=articles`)}
                  className="bg-white rounded-2xl p-4 border border-gray-150 hover:border-[#a6f2cf] shadow-2xs hover:shadow-md transition-all flex flex-col group cursor-pointer text-left relative"
                >
                  {/* Delete button float */}
                  <button
                    onClick={(e) => handleDeleteBook(book.id, e)}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 hover:text-red-500 text-gray-400 rounded-full border border-gray-100 shadow-xs opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-50 mb-3">
                    <img 
                      src={book.coverUrl} 
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <RatingStars starClassName="w-3 h-3 text-amber-500 fill-amber-500" rating={book.rating || 5.0} />
                      <span className="text-[9px] font-bold text-gray-400">{(book.rating || 5.0).toFixed(1)}</span>
                    </div>
                    <h4 className="font-serif font-bold text-gray-900 text-sm group-hover:text-primary-green transition-colors truncate">
                      {book.title}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-medium leading-none">{book.author}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200 w-full">
                <Heart className="w-10 h-10 text-red-300 mx-auto animate-pulse" />
                <h4 className="font-serif text-sm font-bold text-gray-800 mt-2">Kệ sách của bạn đang trống</h4>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto leading-relaxed mt-1">
                  Hãy thêm những cuốn sách yêu thích của bạn lên kệ để chia sẻ cảm nhận cùng cộng đồng nhé!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Recent read / progress shelf section */}
        <section className="space-y-6 text-left">
          <div className="flex items-center space-x-2 text-[#004532] border-b border-gray-100 pb-3">
            <Compass className="w-5 h-5" />
            <h3 className="font-serif text-xl font-bold">Vừa tương tác và đọc gần đây</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {recents.length > 0 ? (
              recents.map((book) => (
                <div 
                  key={book.id}
                  onClick={() => router.push(`/search?q=${encodeURIComponent(book.title)}&tab=articles`)}
                  className="bg-white rounded-2xl p-6 border border-gray-150 hover:border-[#a6f2cf] shadow-2xs hover:shadow-xs transition-all flex gap-5 items-stretch group cursor-pointer text-left"
                >
                  <img 
                    src={book.coverUrl} 
                    alt={book.title} 
                    className="w-16 h-24 rounded-lg object-cover shadow-2xs shrink-0 bg-gray-50"
                  />
                  
                  <div className="flex flex-col justify-between py-1 min-w-0">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Vừa ghé xem gần đây
                      </span>
                      <h4 className="font-serif font-bold text-gray-800 text-sm group-hover:text-[#004532] transition-colors leading-snug truncate">
                        {book.title}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-medium leading-none">{book.author}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200 w-full">
                <Compass className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-[11px] text-gray-400 mt-2">Bạn chưa tương tác với cuốn sách nào gần đây.</p>
              </div>
            )}
          </div>
        </section>
        </>
        )}
      </main>

      {/* Add Book Modal Form popup */}
      <AnimatePresence>
        {showAddBookModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop blur click outside */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseAddBookModal}
              className="absolute inset-0 bg-black/45 backdrop-blur-xs" 
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 z-10 shadow-2xl border border-gray-100 text-left font-sans"
            >
              <button
                type="button"
                onClick={handleCloseAddBookModal}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors focus:outline-none cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1 mb-6">
                <h3 className="font-serif text-xl font-bold text-[#004532]">
                  Thêm sách yêu thích
                </h3>
                <p className="text-xs text-gray-400">Thêm những tác phẩm bạn yêu thích lên kệ sách cá nhân.</p>
              </div>

              <form onSubmit={handleAddBookSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Tên cuốn sách
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newBookTitle}
                      onChange={(e) => setNewBookTitle(e.target.value)}
                      placeholder="Cây Cam Ngọt Của Tôi, Suối Nguồn..."
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-250 bg-white focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-primary-green text-sm font-semibold"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSearchOpenLibrary}
                      className="px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-250 cursor-pointer transition-colors shadow-2xs select-none"
                      disabled={isSearchingOL}
                    >
                      {isSearchingOL ? "..." : "Tìm online"}
                    </button>
                  </div>
                </div>

                {/* Open Library Autocomplete Suggestions */}
                <AnimatePresence>
                  {openLibraryResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-2.5 space-y-1 text-xs select-none max-h-40 overflow-y-auto"
                    >
                      <p className="text-[9px] font-bold text-emerald-850 uppercase tracking-widest px-1.5 pb-1 font-sans">Đề xuất từ Open Library API:</p>
                      {openLibraryResults.map((sug) => (
                        <div
                          key={`${sug.title}-${sug.author}`}
                          onClick={() => handleSelectOLSuggestion(sug)}
                          className="px-2.5 py-1.5 hover:bg-white rounded-lg cursor-pointer transition-colors text-left font-sans flex items-center gap-2 border-b border-emerald-100/30 last:border-none"
                        >
                          {sug.coverUrl && <img src={sug.coverUrl} className="w-5 h-7 rounded object-cover shrink-0 shadow-2xs bg-gray-100" />}
                          <div className="min-w-0">
                            <span className="font-bold text-gray-800 line-clamp-1 leading-tight">{sug.title}</span>
                            <span className="text-[10px] text-gray-400 block">{sug.author} {sug.publishYear ? `(${sug.publishYear})` : ""}</span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Tác giả
                    </label>
                    <input 
                      type="text" 
                      value={newBookAuthor}
                      onChange={(e) => setNewBookAuthor(e.target.value)}
                      placeholder="José Mauro..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-250 bg-white focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-primary-green text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Năm xuất bản
                    </label>
                    <input 
                      type="number" 
                      value={newBookPublishedYear}
                      onChange={(e) => setNewBookPublishedYear(e.target.value)}
                      placeholder="1968, 2026..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-250 bg-white focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-primary-green text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Tóm tắt nội dung sách
                  </label>
                  <textarea 
                    value={newBookSummary}
                    onChange={(e) => setNewBookSummary(e.target.value)}
                    placeholder="Mô tả nội dung, thông điệp nổi bật của sách..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-250 bg-white focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-primary-green text-sm h-20 resize-none font-sans leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Đánh giá cá nhân ({newBookRating.toFixed(1)} sao)
                  </label>
                  <input 
                    type="range" 
                    min="1.0" 
                    max="5.0" 
                    step="0.1"
                    value={newBookRating}
                    onChange={(e) => setNewBookRating(parseFloat(e.target.value))}
                    className="w-full accent-primary-green focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-semibold px-0.5">
                    <span>1.0 sao</span>
                    <span>3.0 sao</span>
                    <span>5.0 sao</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Ảnh bìa sách
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-20 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center text-gray-300 shrink-0">
                      {coverPreviewUrl ? (
                        <img src={coverPreviewUrl} className="w-full h-full object-cover" alt="cover preview" />
                      ) : (
                        <BookOpen className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <label 
                      htmlFor="cover-upload" 
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer select-none transition-colors border border-gray-200 animate-fade-in"
                    >
                      Chọn file ảnh bìa
                    </label>
                    <input 
                      type="file" 
                      id="cover-upload" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleCoverChange}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-primary-green text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-primary-container shadow-md transition-all active:scale-[0.99] border-none cursor-pointer block mt-4"
                >
                  Xác nhận thêm sách
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

export default function Bookcase() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen flex items-center justify-center bg-[#fcfcf9]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#004532] border-t-transparent" />
      </div>
    }>
      <BookcaseContent />
    </Suspense>
  );
}
