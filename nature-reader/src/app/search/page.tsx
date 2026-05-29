"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Sparkles, Star, User as UserIcon, BookCheck, FileText, Heart, MessageSquare, ChevronRight } from "lucide-react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import BookCard from "../../components/ui/BookCard";
import ArticleCard from "../../components/ui/ArticleCard";
import { getArticles } from "../../lib/actions/article";
import { getBooks } from "../../lib/actions/book";
import { getAdminUsers } from "../../lib/actions/admin";

function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchText, setSearchText] = useState(query);
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"books" | "articles" | "users">((tabParam as any) || "books");
  const [dbBooks, setDbBooks] = useState<any[]>([]);
  const [dbArticles, setDbArticles] = useState<any[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);

  // Sync search input and tab with query parameter changes
  useEffect(() => {
    setSearchText(query);
    if (tabParam === "articles" || tabParam === "books" || tabParam === "users") {
      setActiveTab(tabParam);
    }
  }, [query, tabParam]);

  // Load dynamic search data on mount & query change
  useEffect(() => {
    async function loadSearchData() {
      try {
        const books = await getBooks();
        setDbBooks(books);
        
        const articles = await getArticles("ALL", query);
        setDbArticles(articles);

        const users = await getAdminUsers();
        setDbUsers(users);
      } catch (err) {
        console.error("Error loading search DB data:", err);
      }
    }
    loadSearchData();
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchText.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchText.trim())}`);
    }
  };

  // Searching logic
  const matchedBooks = dbBooks.filter(
    b => 
      b.title.toLowerCase().includes(query.toLowerCase()) || 
      b.author.toLowerCase().includes(query.toLowerCase())
  );

  const matchedArticles = dbArticles;

  const matchedUsers = dbUsers.filter(
    u => u.name.toLowerCase().includes(query.toLowerCase()) || u.bio.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8 text-left">
      
      {/* Header bar and search box */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-widest text-emerald-800 uppercase">Kết quả tìm kiếm</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            Từ khóa: &ldquo;{query}&rdquo;
          </h1>
        </div>

        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 flex items-center bg-white rounded-xl border border-gray-200 px-4 py-2 shadow-2xs">
          <Search className="w-4.5 h-4.5 text-[#004532] mr-2 shrink-0" />
          <input 
            type="text" 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Tìm theo sách, review, tác giả..." 
            className="w-full bg-transparent border-none text-xs sm:text-sm focus:outline-none placeholder:text-gray-400"
          />
        </form>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-150">
        <button
          onClick={() => setActiveTab("books")}
          className={`px-6 py-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer bg-transparent border-none ${
            activeTab === "books" 
              ? "text-[#004532] border-[#004532] font-extrabold" 
              : "text-gray-400 hover:text-primary-green border-transparent"
          }`}
        >
          Sách ({matchedBooks.length})
        </button>
        <button
          onClick={() => setActiveTab("articles")}
          className={`px-6 py-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer bg-transparent border-none ${
            activeTab === "articles" 
              ? "text-[#004532] border-[#004532] font-extrabold" 
              : "text-gray-400 hover:text-primary-green border-transparent"
          }`}
        >
          Review bài viết ({matchedArticles.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-6 py-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer bg-transparent border-none ${
            activeTab === "users" 
              ? "text-[#004532] border-[#004532] font-extrabold" 
              : "text-gray-400 hover:text-primary-green border-transparent"
          }`}
        >
          Độc giả ({matchedUsers.length})
        </button>
      </div>

      {/* Tab outputs list */}
      <section className="py-4">
        {activeTab === "books" && (
          matchedBooks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {matchedBooks.map((book) => (
                <BookCard 
                  key={book.id} 
                  book={book}
                  onClick={() => router.push(`/search?q=${encodeURIComponent(book.title)}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-150 space-y-4">
              <UserIcon className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-400 font-light">Không có tác phẩm sách nào phù hợp từ khóa.</p>
            </div>
          )
        )}

        {activeTab === "articles" && (
          matchedArticles.length > 0 ? (
            <div className="max-w-[720px] mx-auto space-y-8">
              {matchedArticles.map((art) => (
                <ArticleCard 
                  key={art.id} 
                  article={art}
                  layout="list"
                  onClick={() => router.push(`/article/${art.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-150 space-y-4">
              <FileText className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-400 font-light">Không tìm thấy bài viết cảm hứng nào.</p>
            </div>
          )
        )}

        {activeTab === "users" && (
          matchedUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matchedUsers.map((user) => (
                <div 
                  key={user.id}
                  className="bg-white rounded-2xl p-6 border border-gray-150 flex gap-4 items-center text-left shadow-2xs hover:shadow-xs transition-all animate-fadeIn"
                >
                  <img 
                    src={user.avatarUrl} 
                    alt="avatar" 
                    className="w-14 h-14 rounded-full border border-gray-100 object-cover shrink-0 bg-gray-50"
                  />
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-serif font-bold text-gray-900 text-base leading-none">
                      {user.name}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-light leading-relaxed line-clamp-1">
                      {user.bio}
                    </p>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-emerald-800 uppercase tracking-widest pt-1">
                      <span>Email: {user.email}</span>
                      <span>Vai trò: {user.role === "admin" ? "Quản trị viên" : "Độc giả"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-150 space-y-4">
              <UserIcon className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-400 font-light">Không có độc giả nào trùng khớp từ khóa.</p>
            </div>
          )
        )}
      </section>

    </main>
  );
}

export default function SearchResults() {
  return (
    <div className="w-full min-h-screen flex flex-col bg-[#fcfcf9] selection:bg-[#a6f2cf]">
      <Header />
      
      {/* Wrapped useSearchParams in Suspense boundary */}
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center bg-[#fcfcf9]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#004532] border-t-transparent" />
        </div>
      }>
        <SearchResultsContent />
      </Suspense>

      <Footer />
    </div>
  );
}
