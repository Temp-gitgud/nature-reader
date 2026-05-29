"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Search, Star, Bold, Italic, Quote, List, Image, Link, Sparkles, Check, ChevronDown, CheckCircle2, FileText, AlertCircle, X 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { User } from "../../types";
import { createArticle } from "../../lib/actions/article";


const DEFAULTS_BOOKS_SUGGESTIONS = [
  {
    title: "Cây Cam Ngọt Của Tôi",
    author: "Jose Mauro de Vasconcelos",
    rating: 4.8,
    category: "Văn học",
    coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9Sv9sXKLZK3S9mqLXi2Jo3yie3zDXyeSCIOQUBp1JS3pWlZqFzHMLnfr4iy9Q5ttGanSrk_vIdA4F-BEi0h48BlC49ntPxrAjniya5MNijR663DsFfDh-dJWR9SUbIvhTesU4jx9TnvELVEM_gepwRsG7AhvfEcIr_kBQd-IhbrvZak5lX8Ou2N9VDBjlL0rLc7-B_dXiuP6iWiBCNK-KwtZjDJUG31uNLK-scrIb8S1gVMpziAkd-S08PdTthNylAURu25agYpM"
  },
  {
    title: "Rừng Na Uy",
    author: "Haruki Murakami",
    rating: 4.5,
    category: "Văn học Nhật Bản",
    coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAw67Onu2lascvtXuHjgxifKQIkZ72dQvls_HNB2RnYpjT6SjlVlrU4xr-IjhkeVYLFQs7NdMkY-0rokP4SveXKSMpv9KCPJ8B17ktgMCkhWnqnAk1LXflgYXPn70NuJ_w8Gc398qqW4bgzbsEKj_4pDQXZ2G4TDKd0iE8YFrpo9Xpqp22evpAiedsVRowzuF3wlzdvj9LGxS3VcITLC7v1Nzcva9GnSubQaRlSC1AsNGGrrVsVvmYcfyIUznOc4qtSson4DwEgXMQ"
  },
  {
    title: "Hoàng tử bé",
    author: "Antoine de Saint-Exupéry",
    rating: 4.9,
    category: "Văn học Pháp",
    coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC2hNIJ_pClRM3Gt_Bz-o9PADpXoH5KlKMx7cvloJsqOg2JzyiYKLtwdGNW5z2IDBZaXS-l3PxdhqTnv2PtKZRpRAG3fl3hWp6gFBsS-RUj_ajFYKDsHLYqLIU-65ZlxrmFQy1zZfYTIYhQXb8BSgm7S947giVOuQJAmfagTe-HF5pXmSOIO__jrmOsd1NfrpwuuQxOkSEmIAV9rGI-5qTMZPuAdw1VofPEjGGpvxzjQSKF1wVpgwKOTJWEcN2rTQ0cPqTMdtpJMAg"
  },
  {
    title: "Nhà giả kim",
    author: "Paulo Coelho",
    rating: 4.7,
    category: "Tiểu thuyết triết lý",
    coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDr3-UiKcOEQpXcjC1OAiMxVKnZeblyVw2-CHeT8uJ0sYpQnd27F0uhLQIOEDrCdjPiRU1dFzQbmwSKGO_4vbaS6nYDuDeEQdpK2dg2fb4xR0oWCsO1NJri7u2hx9ourn6JaNBnGKdy3HlgFIS4WlZynaE2trNvRtEXUxCqsH6MosFoBTmjtKsPmiHo6I7Drkf1r8bn7DyYBEpvngGahkKldXuVi9LQXaXz_pII1w9ztmW6edFfOoRMqQqEZTixnAJzrWKDhiwiMA4"
  },
  {
    title: "Lối Sống Tối Giản",
    author: "Shunmyo Masuno",
    rating: 4.6,
    category: "Lối sống/Kỹ năng",
    coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJ7FsFaU2l14J3IKs3aWxCDraJmhVklxt67rijcdiVy3iojp6wP-6HtDOOzO9raH6Ttgs3IELgeLYP0WiRafUS9wGZPD2C8J0XRUK3GZamHtWR2-PIkzcXl8tm2nYMBljNHZdG47TxnWJbaP4fM-pvNUpeQd8j2E7sAjcVM_y2MFJxHuE0WFsehc8AkMxXonZYayMgamiM0pSFMxZY1lj8qRqFRQivFlUbPQUh4C28GvI6sYgPYjTcWjg6FtyxeAi1awDvRQlO1Eo"
  },
  {
    title: "Tĩnh Lặng Giữa Dòng",
    author: "Thích Nhất Hạnh",
    rating: 4.8,
    category: "Thiền tập/Tâm linh",
    coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBDjR9H59oR1yJ4-iWpGo4m-3MDmpJn2_B-ne2cqwYyOCxJEQGJFZeCmZgGDAaNLXHniALD3WKgrcZo5zm6gBaYh21EOnqSttcI5majz3J7L_58akl3tp_B5b-QenIYHRHmKqhTP_YuE2HMEPtcrCgwtOKO1ymrboABj8FVVQdnwGjcLgwVMpR8YmiLZGQywW8WTaiEI31KcKp6C2IxZxxcy9H9rTMTeO_YebJhLQzUMSN7CGoJN0thhGXiAE1ZGHYj4z5SUs3EZlw"
  }
];

export default function CreateArticle() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Form State
  const [selectedBook, setSelectedBook] = useState<typeof DEFAULTS_BOOKS_SUGGESTIONS[0] | null>(null);
  const [bookSearchVal, setBookSearchVal] = useState("");
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [articleTitle, setArticleTitle] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [category, setCategory] = useState("CẢM HỨNG");
  
  // Technical states
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState("");
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [notification, setNotification] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) {
      router.push("/auth");
      return;
    }
    setCurrentUser(JSON.parse(storedUser));
  }, [router]);

  // Outside click close book search suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowBookDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-save simulation
  useEffect(() => {
    if (!articleTitle && !articleContent) return;

    const timer = setTimeout(() => {
      setIsAutoSaving(true);
      setTimeout(() => {
        const now = new Date();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        setLastAutoSavedTime(`${hours}:${minutes}`);
        setIsAutoSaving(false);
      }, 600);
    }, 1500);

    return () => clearTimeout(timer);
  }, [articleTitle, articleContent, selectedBook, rating, category]);

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const getRatingLabel = (stars: number) => {
    const meanings = ["Rất tệ", "Trung bình", "Khá tốt", "Rất hay", "Tuyệt vời"];
    return stars > 0 ? meanings[stars - 1] : "";
  };

  const filteredBooks = DEFAULTS_BOOKS_SUGGESTIONS.filter(
    b => b.title.toLowerCase().includes(bookSearchVal.toLowerCase()) || 
         b.author.toLowerCase().includes(bookSearchVal.toLowerCase())
  );

  const insertMarkdown = (syntax: string) => {
    setArticleContent(prev => prev + syntax);
    triggerToast("Đã chèn ký tự định dạng!");
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const errs = [];
    if (!selectedBook) {
      errs.push("Vui lòng tìm chọn cuốn sách bạn muốn viết review.");
    }
    if (rating === 0) {
      errs.push("Vui lòng đánh giá số sao của cuốn sách.");
    }
    if (!articleTitle.trim()) {
      errs.push("Vui lòng nhập tên bài đăng review.");
    }
    if (!articleContent.trim()) {
      errs.push("Nội dung bài viết review không được để trống.");
    }

    if (errs.length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsAutoSaving(true);
    const userId = currentUser?.id || "5c9f5643-4be9-4e78-8742-892410a8d6e3";

    async function sendToDB() {
      try {
        const result = await createArticle({
          title: articleTitle,
          category: category,
          fullText: articleContent,
          bookTitle: selectedBook?.title || "",
          bookAuthor: selectedBook?.author || "",
          bookCoverUrl: selectedBook?.coverUrl || "",
          userId: userId
        });

        setIsAutoSaving(false);
        if (result.success) {
          alert(result.message);
          router.push("/articles");
        } else {
          alert("Lỗi: " + result.message);
        }
      } catch (err) {
        setIsAutoSaving(false);
        console.error("Error creating article:", err);
        alert("Có lỗi xảy ra khi xuất bản bài đăng review của bạn.");
      }
    }
    sendToDB();
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

      {/* Floating dynamic notification toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-[#004532] text-white border border-[#a6f2cf]/30 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 text-[#a6f2cf] shrink-0" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-8 text-left">
        
        {/* Navigation Toolbar */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <button
            onClick={() => router.back()}
            className="text-xs font-semibold text-gray-500 hover:text-primary-green flex items-center gap-1 bg-transparent border-none cursor-pointer focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang bài viết</span>
          </button>

          {/* Auto saving status bar */}
          <div className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase flex items-center gap-2">
            {isAutoSaving ? (
              <>
                <div className="w-3 h-3 border-2 border-gray-300 border-t-emerald-800 rounded-full animate-spin" />
                <span>Đang tự động lưu...</span>
              </>
            ) : lastAutoSavedTime ? (
              <span>Đã tự động lưu vào lúc {lastAutoSavedTime}</span>
            ) : (
              <span>Tự động lưu chưa kích hoạt</span>
            )}
          </div>
        </div>

        {/* Validation Errors Header container */}
        <AnimatePresence>
          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-250 rounded-2xl p-5 text-red-800 space-y-2 text-xs"
            >
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-red-900">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>Vui lòng hoàn thiện biểu mẫu</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 font-light">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handlePublish} className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-150 shadow-2xs space-y-8">
          
          {/* Section 1: Book Info Autocomplete */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#004532] flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-[#a6f2cf] fill-[#a6f2cf]" />
              <span>Bước 1: Chọn cuốn sách review</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Autocomplete Selector */}
              <div ref={dropdownRef} className="relative space-y-1.5 text-left">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Tìm và chọn cuốn sách
                </label>
                
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={selectedBook ? selectedBook.title : bookSearchVal}
                    onChange={(e) => {
                      setSelectedBook(null);
                      setBookSearchVal(e.target.value);
                      setShowBookDropdown(true);
                    }}
                    onFocus={() => setShowBookDropdown(true)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-250 bg-white focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-primary-green text-sm"
                    placeholder="Nhập tựa sách hoặc tác giả..."
                  />
                  {selectedBook && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBook(null);
                        setBookSearchVal("");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                  {showBookDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute left-0 right-0 mt-2 bg-white border border-gray-250 shadow-xl rounded-xl z-20 overflow-hidden text-xs max-h-56 overflow-y-auto"
                    >
                      {filteredBooks.length > 0 ? (
                        filteredBooks.map((book) => (
                          <div
                            key={book.title}
                            onClick={() => {
                              setSelectedBook(book);
                              setRating(Math.round(book.rating));
                              setShowBookDropdown(false);
                            }}
                            className="px-4 py-3 hover:bg-emerald-50/50 transition-colors flex items-center gap-3 cursor-pointer border-b border-gray-50 last:border-none"
                          >
                            <img src={book.coverUrl} className="w-7 h-10 rounded object-cover shadow-2xs shrink-0 bg-gray-100" />
                            <div className="text-left leading-tight">
                              <p className="font-bold text-gray-800">{book.title}</p>
                              <span className="text-[10px] text-gray-400">{book.author}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-4 text-center text-gray-400 font-light">
                          Không tìm thấy sách mẫu. Bạn có thể tự viết bìa và nội dung review riêng!
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Rating selection stars */}
              <div className="space-y-2 text-left">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none">
                  Số sao bạn đánh giá cuốn sách này
                </label>
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none bg-transparent border-none cursor-pointer"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoveredRating || rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-gray-200"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded ml-2 min-w-20 text-center">
                    {getRatingLabel(hoveredRating || rating) || "Chờ đánh giá"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 2: Review Content Editor */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#004532] flex items-center gap-1.5">
              <FileText className="w-5 h-5 text-[#004532]" />
              <span>Bước 2: Viết nội dung cảm nhận</span>
            </h3>

            {/* Category and Title fields */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4 space-y-1.5 text-left">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Thể loại bài viết
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-250 bg-white focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-primary-green text-sm appearance-none cursor-pointer font-semibold"
                  >
                    <option value="CẢM HỨNG">CẢM HỨNG</option>
                    <option value="TRIẾT HỌC">TRIẾT HỌC</option>
                    <option value="SỐNG XANH">SỐNG XANH</option>
                    <option value="REVIEW SÁCH">REVIEW SÁCH</option>
                  </select>
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </div>
              </div>

              <div className="md:col-span-8 space-y-1.5 text-left">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Tên bài viết review cảm nhận
                </label>
                <input
                  type="text"
                  value={articleTitle}
                  onChange={(e) => setArticleTitle(e.target.value)}
                  placeholder="Ví dụ: Một góc khuất ngọt ngào trong Cây Cam Ngọt..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-250 bg-white focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-primary-green text-sm"
                  required
                />
              </div>
            </div>

            {/* Markdown styling toolbar */}
            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Nội dung chi tiết review cảm hứng
              </label>

              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-[#fefdfa] focus-within:ring-2 focus-within:ring-secondary-container">
                {/* Editor toolbar */}
                <div className="flex flex-wrap gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200 select-none">
                  <button
                    type="button"
                    onClick={() => insertMarkdown("**chữ đậm**")}
                    className="p-2 text-gray-600 hover:text-primary-green hover:bg-emerald-50 rounded-lg cursor-pointer bg-transparent border-none"
                    title="Chữ đậm"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("*chữ nghiêng*")}
                    className="p-2 text-gray-600 hover:text-primary-green hover:bg-emerald-50 rounded-lg cursor-pointer bg-transparent border-none"
                    title="Chữ nghiêng"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("\n> Trích dẫn hay ở đây...")}
                    className="p-2 text-gray-600 hover:text-primary-green hover:bg-emerald-50 rounded-lg cursor-pointer bg-transparent border-none"
                    title="Trích dẫn"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("\n- Ý liệt kê 1...")}
                    className="p-2 text-gray-600 hover:text-primary-green hover:bg-emerald-50 rounded-lg cursor-pointer bg-transparent border-none"
                    title="Danh sách liệt kê"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("![Chú thích ảnh](url_hình_ảnh_ở_đây)")}
                    className="p-2 text-gray-600 hover:text-primary-green hover:bg-emerald-50 rounded-lg cursor-pointer bg-transparent border-none"
                    title="Chèn ảnh"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("[Mô tả link](đường_dẫn_url)")}
                    className="p-2 text-gray-600 hover:text-primary-green hover:bg-emerald-50 rounded-lg cursor-pointer bg-transparent border-none"
                    title="Chèn link"
                  >
                    <Link className="w-4 h-4" />
                  </button>
                </div>

                <textarea
                  value={articleContent}
                  onChange={(e) => setArticleContent(e.target.value)}
                  placeholder="Hãy bắt đầu dòng cảm nghĩ của bạn tại đây... Tối đa 50,000 ký tự"
                  className="w-full px-5 py-4 border-none bg-transparent focus:outline-none text-sm leading-relaxed font-light h-96 resize-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit publishing button container */}
          <button
            type="submit"
            className="w-full py-4 bg-primary-green text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md cursor-pointer hover:bg-primary-container transition-all active:scale-[0.99] border-none"
          >
            Xác nhận xuất bản bài đăng review
          </button>

        </form>
      </main>

      <Footer />
    </div>
  );
}
