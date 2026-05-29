"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, FileText, Heart, MessageSquare, Plus } from "lucide-react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import ArticleCard from "../../components/ui/ArticleCard";
import { getArticles, toggleLikeArticle } from "../../lib/actions/article";

export default function Articles() {
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TẤT CẢ");
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Load current user on mount
  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  // Fetch real articles from PostgreSQL whenever category, search, or sorting changes
  useEffect(() => {
    async function fetchDBArticles() {
      try {
        const catFilter = selectedCategory === "TẤT CẢ" ? "ALL" : selectedCategory;
        const fetched = await getArticles(catFilter, searchTerm);
        
        let sorted = [...fetched];
        if (sortBy === "popular") {
          sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        }

        setArticles(sorted);
      } catch (err) {
        console.error("Error fetching articles from DB:", err);
      }
    }
    fetchDBArticles();
  }, [selectedCategory, searchTerm, sortBy]);

  const handleLike = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const userId = currentUser?.id || "5c9f5643-4be9-4e78-8742-892410a8d6e3";
    
    try {
      const result = await toggleLikeArticle(id, userId);
      setArticles(prev => prev.map(art => art.id === id ? { ...art, likes: result.likesCount } : art));
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleArticleClick = (id: string) => {
    router.push(`/article/${id}`);
  };

  const filtered = articles;

  // Calculate stats
  const totalLikes = articles.reduce((sum, art) => sum + art.likes, 0);
  const totalComments = articles.reduce((sum, art) => sum + art.comments, 0);

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#fcfcf9] text-[#121c2a] selection:bg-[#a6f2cf]">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-10 text-left">
        
        {/* Header toolbar banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-150">
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-800 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-[#a6f2cf] fill-[#a6f2cf]" />
              <span>Góc Cảm hứng Viết</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-gray-900 leading-tight">
              Review và cảm nhận sâu sắc
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input Box */}
            <div className="flex items-center bg-white rounded-xl shadow-2xs border border-gray-200/80 px-4 py-2 w-full sm:w-64">
              <Search className="w-4 h-4 text-[#004532] mr-2 shrink-0" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm cảm nhận..." 
                className="w-full bg-transparent border-none text-xs sm:text-sm focus:outline-none placeholder:text-gray-400"
              />
            </div>

            <button
              onClick={() => router.push("/create-article")}
              className="bg-[#004532] hover:bg-[#065f46] text-white text-xs font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer shrink-0 border-none"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo bài review mới</span>
            </button>
          </div>
        </div>

        {/* Bento-style stats highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#004532] text-white p-6 rounded-2xl flex flex-col justify-between shadow-2xs text-left group hover:scale-[1.01] transition-transform duration-300">
            <FileText className="w-8 h-8 text-[#a6f2cf] stroke-[1.5]" />
            <div className="pt-6">
              <p className="text-[10px] font-bold tracking-widest uppercase text-gray-300">Tổng bài viết</p>
              <h3 className="font-serif text-4xl font-semibold mt-1">{filtered.length} bài</h3>
            </div>
          </div>

          <div className="bg-[#a6f2cf] text-[#00513b] p-6 rounded-2xl flex flex-col justify-between shadow-2xs text-left group hover:scale-[1.01] transition-transform duration-300">
            <Heart className="w-8 h-8 text-[#004532] fill-[#004532] stroke-[1.5]" />
            <div className="pt-6">
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#00513b]/70">Tổng lượt yêu thích</p>
              <h3 className="font-serif text-4xl font-semibold mt-1">{totalLikes} thích</h3>
            </div>
          </div>

          <div className="bg-[#d9e3f6] text-[#004532] p-6 rounded-2xl flex flex-col justify-between shadow-2xs text-left group hover:scale-[1.01] transition-transform duration-300">
            <MessageSquare className="w-8 h-8 text-[#004532] stroke-[1.5]" />
            <div className="pt-6">
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#004532]/70">Tổng ý kiến</p>
              <h3 className="font-serif text-4xl font-semibold mt-1">{totalComments} bình luận</h3>
            </div>
          </div>
        </div>

        {/* Toolbar filter */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-100 pb-4 gap-4 pt-4">
          <div className="flex flex-wrap gap-2">
            {["TẤT CẢ", "REVIEW SÁCH", "TRIẾT HỌC", "SỐNG XANH", "CẢM HỨNG"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all cursor-pointer border-none ${
                  selectedCategory === cat 
                    ? "bg-[#004532] text-white shadow-sm" 
                    : "bg-gray-100 hover:bg-emerald-50/50 text-gray-500 hover:text-[#004532]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-400">
            <span>Sắp xếp:</span>
            <button
              onClick={() => setSortBy("latest")}
              className={`hover:text-primary-green focus:outline-none bg-transparent border-none cursor-pointer ${
                sortBy === "latest" ? "text-primary-green font-bold" : ""
              }`}
            >
              Mới nhất
            </button>
            <span className="text-gray-200">|</span>
            <button
              onClick={() => setSortBy("popular")}
              className={`hover:text-primary-green focus:outline-none bg-transparent border-none cursor-pointer ${
                sortBy === "popular" ? "text-primary-green font-bold" : ""
              }`}
            >
              Yêu thích nhất
            </button>
          </div>
        </div>

        {/* Article list constrained to reading width */}
        <section className="max-w-[720px] mx-auto space-y-8 py-4">
          {filtered.length > 0 ? (
            filtered.map((art) => (
              <ArticleCard 
                key={art.id}
                article={art}
                layout="list"
                onLike={(id, e) => handleLike(id, e)}
                onClick={() => handleArticleClick(art.id)}
              />
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-150 space-y-4">
              <FileText className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-400 font-light">Không có bài viết nào khớp với tìm kiếm của bạn.</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
