"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, History, TrendingUp, HelpCircle, ArrowRight, Heart, MessageSquare, FileText } from "lucide-react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import RatingStars from "../../components/ui/RatingStars";
import { getArticles, toggleLikeArticle } from "../../lib/actions/article";

const CATEGORIES = ["Tất cả", "Sống xanh", "Văn học", "Kỹ năng", "Triết học"];

export default function Discover() {
  const router = useRouter();
  const [selectedTag, setSelectedTag] = useState("Tất cả");
  const [searchVal, setSearchVal] = useState("");
  const [dbArticles, setDbArticles] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [recentViewed, setRecentViewed] = useState<any[]>([]);

  // Load current user and dynamic history on mount
  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }

    const storedHistory = localStorage.getItem("recentViewedBooks");
    if (storedHistory) {
      try {
        setRecentViewed(JSON.parse(storedHistory).slice(0, 4));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Fallback: load some suggestions from the DB dynamically
      async function loadSuggestions() {
        try {
          const fetched = await getArticles();
          const suggestions = fetched.slice(0, 4).map(art => ({
            id: art.id,
            title: art.bookTitle || art.title,
            genre: art.category || "Cảm hứng",
            coverUrl: art.bookCoverUrl || art.coverUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBcAa0VXblj74ZyUhLRe7T-6ckhEgIuaqOC4MGucG8BqL9ipY1VZXQ-94smq_37lqXXyOe3rnks7s6z6-IO6uZ03BKdZou-TNc9cMkfGIxa8x8VMoHFur3H3WHDo3LplR6dlLKRd38temPcoLFvUkuTvOtVTZwcTuuSYSn4z3W5KUos2ROubEfeKLcFY_VQHZhlcWj_LRswe6nrtYLjI0Qqc3BDpH_hpM1akeKySxL6psML-8PBuEkK_JjoxHv0dgmwzgvELjw1fIA"
          }));
          setRecentViewed(suggestions);
        } catch (err) {
          console.error(err);
        }
      }
      loadSuggestions();
    }
  }, []);

  // Fetch popular posts from DB dynamically based on category
  useEffect(() => {
    async function fetchPopular() {
      try {
        const catFilter = selectedTag === "Tất cả" ? "ALL" : selectedTag;
        const fetched = await getArticles(catFilter, searchVal);
        // Sort by likes to display popular posts
        const sorted = fetched.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        setDbArticles(sorted);
      } catch (err) {
        console.error("Error loading popular DB articles:", err);
      }
    }
    fetchPopular();
  }, [selectedTag, searchVal]);

  const handleLikeClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const userId = currentUser?.id || "5c9f5643-4be9-4e78-8742-892410a8d6e3";

    try {
      const result = await toggleLikeArticle(id, userId);
      setDbArticles(prev => prev.map(art => art.id === id ? { ...art, likes: result.likesCount } : art));
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const filteredArticles = dbArticles;

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#fcfcf9] selection:bg-[#a6f2cf]">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-12">
        {/* Search header container */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div className="text-left space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-800 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-[#a6f2cf] fill-[#a6f2cf]" />
              <span>Góc khám phá sách</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-gray-900 leading-tight">
              Tìm kiếm nguồn cảm hứng mới
            </h1>
          </div>

          <form onSubmit={handleSearchSubmit} className="w-full md:w-96 flex items-center bg-white rounded-xl shadow-2xs border border-gray-200/80 px-4 py-2">
            <Search className="w-4.5 h-4.5 text-[#004532] mr-2 shrink-0" />
            <input 
              type="text" 
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Tìm theo tựa sách, tác giả, thể loại..." 
              className="w-full bg-transparent border-none text-xs sm:text-sm focus:outline-none placeholder:text-gray-400"
            />
          </form>
        </div>

        {/* Recently viewed horizontal section */}
        <section className="space-y-4 text-left">
          <div className="flex items-center space-x-2 text-[#004532]">
            <History className="w-4.5 h-4.5" />
            <h3 className="font-serif text-lg font-bold">Vừa ghé đọc gần đây</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recentViewed.length > 0 ? (
              recentViewed.map((book) => (
                <div 
                  key={book.id}
                  onClick={() => router.push(`/search?q=${encodeURIComponent(book.title)}`)}
                  className="bg-white rounded-xl p-3 border border-gray-150/75 hover:border-[#a6f2cf] transition-all flex items-center gap-3.5 shadow-2xs hover:shadow-sm cursor-pointer group"
                >
                  <img 
                    src={book.coverUrl} 
                    alt={book.title} 
                    className="w-10 h-14 rounded-md object-cover shadow-2xs shrink-0"
                  />
                  <div className="text-left min-w-0">
                    <h4 className="font-serif font-bold text-xs text-gray-800 line-clamp-1 group-hover:text-primary-green transition-colors">
                      {book.title}
                    </h4>
                    <span className="text-[9px] font-bold text-gray-400 tracking-wider uppercase">
                      {book.genre}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-6 text-center bg-white/40 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-400">Bạn chưa ghé xem cuốn sách nào gần đây.</p>
              </div>
            )}
          </div>
        </section>

        {/* Categories Tab list switcher */}
        <section className="space-y-8 text-left pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3">
            <div className="flex items-center space-x-2 text-[#004532]">
              <TrendingUp className="w-4.5 h-4.5" />
              <h3 className="font-serif text-lg font-bold">Xu hướng bài viết nổi tiếng</h3>
            </div>

            {/* Categories filter tabs list */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedTag(cat)}
                  className={`text-xs font-semibold px-4.5 py-1.5 rounded-full transition-all cursor-pointer border-none ${
                    selectedTag === cat 
                      ? "bg-[#004532] text-white shadow-sm" 
                      : "bg-gray-100 hover:bg-emerald-50/50 text-gray-500 hover:text-[#004532]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Popular reviews rendering grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((art) => (
                <div 
                  key={art.id}
                  onClick={() => router.push(art.id.length > 15 ? `/article/${art.id}` : `/search?q=${encodeURIComponent(art.title)}`)}
                  className="bg-white rounded-2xl border border-gray-150 shadow-2xs hover:shadow-md hover:border-[#a6f2cf] transition-all duration-300 flex flex-col justify-between overflow-hidden group cursor-pointer"
                >
                  {/* Book header image layout */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-50 shrink-0">
                    <img 
                      src={art.coverUrl || art.bookCoverUrl} 
                      alt={art.title} 
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#004532]/90 backdrop-blur-xs text-[#a6f2cf] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {art.genre || art.category}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-bold text-gray-800 flex items-center gap-0.5 shadow-2xs">
                      <RatingStars starClassName="w-3 h-3 text-amber-500 fill-amber-500" rating={art.rating || art.bookRating || 4.8} />
                    </div>
                  </div>

                  {/* Review info content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-serif font-bold text-[#004532] text-base group-hover:underline leading-snug line-clamp-2">
                        {art.title}
                      </h4>
                      <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 font-light">
                        {art.excerpt}
                      </p>
                    </div>

                    {/* Card reviewer specs */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={art.avatarUrl || art.authorAvatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=DocGia"} 
                          alt="reviewer" 
                          className="w-7 h-7 rounded-full bg-gray-100 border border-gray-50 object-cover"
                        />
                        <div className="text-left leading-none">
                          <p className="font-bold text-gray-800 text-[11px]">{art.author || art.authorName || "Độc giả ẩn danh"}</p>
                          <span className="text-[10px] text-gray-400 font-light">{art.readTime || "5 phút đọc"}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-gray-400">
                        <button
                          onClick={(e) => handleLikeClick(art.id, e)}
                          className="flex items-center gap-1 hover:text-red-500 transition-colors focus:outline-none bg-transparent border-none cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                          <span className="font-semibold text-gray-600">{art.likes}</span>
                        </button>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-semibold text-gray-600">{art.comments}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-150 space-y-4 w-full">
                <FileText className="w-12 h-12 text-gray-300 mx-auto" />
                <p className="text-sm text-gray-400 font-light">Chưa có bài viết xu hướng nào trong thể loại này.</p>
              </div>
            )}
          </div>
        </section>

        {/* Recommendation lists section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
          {/* Eco-Reading category recommendations */}
          <div className="bg-[#eff4ff] p-8 rounded-2xl border border-white/50 space-y-6 text-left shadow-2xs">
            <h4 className="font-serif text-lg font-bold text-primary-green">Danh mục đọc sinh thái gợi ý</h4>
            <ul className="space-y-3.5 text-xs text-gray-600 font-light">
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-green shrink-0" />
                <span><strong>Sách nông nghiệp tự nhiên:</strong> Tìm hiểu cốt lõi của canh tác sinh học, nông nghiệp hữu cơ bền vững.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-green shrink-0" />
                <span><strong>Lối sống thuần chay, chữa lành:</strong> Gợi ý các công thức, tư duy ăn uống tự nhiên sạch mát.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-green shrink-0" />
                <span><strong>Khoa học địa chất Việt:</strong> Khám phá sâu xa cội nguồn sông núi, địa lý tự nhiên tổ quốc.</span>
              </li>
            </ul>
          </div>

          {/* User Q&A / community support */}
          <div className="bg-[#fefdfa] p-8 rounded-2xl border border-gray-150 space-y-6 text-left shadow-2xs">
            <div className="flex items-center space-x-2 text-[#004532]">
              <HelpCircle className="w-5 h-5" />
              <h4 className="font-serif text-lg font-bold">Góc giải đáp sách độc</h4>
            </div>
            
            <p className="text-xs text-gray-500 leading-relaxed font-light">
              Bạn đang cần tìm kiếm một cuốn sách cụ thể thuộc thể loại sinh thái hay lối sống xanh? Hãy mô tả tóm tắt nội dung bạn đang tìm kiếm và gửi yêu cầu, cộng đồng Trạm Đọc Xanh sẽ tìm và phản hồi gợi ý chi tiết nhất cho bạn trong 24h!
            </p>

            <button 
              onClick={() => alert("Chức năng đặt câu hỏi cộng đồng đang được phát triển!")}
              className="text-xs font-bold text-[#004532] hover:underline flex items-center gap-1 cursor-pointer group"
            >
              <span>Gửi câu hỏi của bạn</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
