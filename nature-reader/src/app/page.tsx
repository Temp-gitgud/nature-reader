"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Heart, MessageSquare, Award, CheckCircle2, Shield, Sparkles } from "lucide-react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BookCard from "../components/ui/BookCard";
import ArticleCard from "../components/ui/ArticleCard";
import { getArticles, toggleLikeArticle } from "../lib/actions/article";
import { getFeaturedBooks } from "../lib/actions/book";

export default function Home() {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState("");
  const [articles, setArticles] = useState<any[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const fetchedArticles = await getArticles();
        setArticles(fetchedArticles);
        const fetchedBooks = await getFeaturedBooks();
        setFeaturedBooks(fetchedBooks.slice(0, 5));
      } catch (err) {
        console.error("Error loading homepage DB data:", err);
      }
      
      const userStr = localStorage.getItem("currentUser");
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
    }
    loadData();
  }, []);

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#fcfcf9] selection:bg-[#a6f2cf] selection:text-[#004532]">
      {/* Dynamic Navigation Header */}
      <Header />

      {/* Hero Section Banner */}
      <section className="relative min-h-[580px] flex items-center overflow-hidden py-16 px-4 md:px-8">
        <div className="absolute inset-0 z-0">
          <img 
            alt="Hero background" 
            className="w-full h-full object-cover brightness-[0.93] scale-102 transition-transform duration-1000" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuYVcwWNVQgZQ39xwRWubQYlH6tfm2-yHYW_9ZbvMbNYqRUEwxL2I_5eTdumdBTdoz_Yn7BUte6Ib46JPySKkhzYfm3MzVw1SU7UR-ryIcBoEEw3fTUSb6Pfd6XBE4w0POkk6hcvvpj4f0WPfQ3cyKBjX3nvHw2dDFApDIBZWlDo1JcHihlsVjOnAVcLWTP3im23r8L2fLHebhij3Ja8e6NNM6udScy9295L2seZ_rjQyd9KA1l0YNPEWsHnbhJRaMGgB9y6NN6gU"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#fcfcf9]/95 via-[#fcfcf9]/75 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="max-w-2xl text-left space-y-6">
            <div className="inline-block bg-[#a6f2cf] text-[#004532] text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full">
              Chào mừng bạn đến với Trạm đọc xanh
            </div>
            
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-[#004532] leading-tight tracking-tight">
              Nuôi dưỡng tâm hồn qua những trang sách xanh
            </h1>
            
            <p className="font-sans text-sm sm:text-base text-gray-600 leading-relaxed font-light">
              Khám phá cộng đồng review sách văn minh, nơi tri thức được bảo tồn và những giá trị nhân văn được lan tỏa. Tìm thấy những cuốn sách thay đổi góc nhìn của bạn ngay hôm nay.
            </p>

            {/* In-Hero Dynamic Interactive Search Box */}
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 pt-3">
              <div className="flex-1 flex items-center bg-white rounded-xl shadow-2xs border border-gray-200/80 px-4 py-2.5 focus-within:ring-2 focus-within:ring-[#a6f2cf]">
                <Search className="w-5 h-5 text-[#004532] mr-2 shrink-0" />
                <input 
                  type="text" 
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Bạn muốn tìm cuốn sách nào?" 
                  className="w-full bg-transparent border-none text-xs sm:text-sm focus:outline-none placeholder:text-gray-400"
                />
              </div>
              <button 
                type="submit"
                className="bg-[#004532] cursor-pointer hover:bg-[#065f46] text-white text-xs font-semibold px-8 py-3.5 rounded-xl block transition-all shrink-0 uppercase tracking-wider border-none"
              >
                Khám phá
              </button>
            </form>

            {/* Live feedback stack */}
            <div className="flex items-center gap-3 pt-4">
              <div className="flex -space-x-3">
                <img className="w-8 h-8 rounded-full border-2 border-white bg-gray-50 object-cover" src="https://api.dicebear.com/7.x/adventurer/svg?seed=A" alt="vietnam user" referrerPolicy="no-referrer" />
                <img className="w-8 h-8 rounded-full border-2 border-white bg-gray-50 object-cover" src="https://api.dicebear.com/7.x/adventurer/svg?seed=B" alt="vietnam user" referrerPolicy="no-referrer" />
                <img className="w-8 h-8 rounded-full border-2 border-white bg-gray-50 object-cover" src="https://api.dicebear.com/7.x/adventurer/svg?seed=C" alt="vietnam user" referrerPolicy="no-referrer" />
              </div>
              <p className="text-xs text-gray-500 italic">
                Cùng hơn <strong className="text-[#004532] font-semibold">2,000+ bạn đọc</strong> đang thảo luận cực kỳ sôi nổi hôm nay
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Book Section Grid */}
      <section className="py-20 bg-[#eff4ff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
            <div className="text-left">
              <h2 className="font-serif text-3xl font-semibold text-[#004532]">
                Sách nổi bật hôm nay
              </h2>
              <p className="text-xs text-gray-500 font-sans tracking-tight mt-1">
                Những tác phẩm chất lượng cao được cộng đồng trân quý và chia sẻ
              </p>
            </div>
            
            <Link 
              href="/discover"
              className="text-xs font-bold text-[#004532] hover:underline flex items-center gap-1 cursor-pointer group uppercase tracking-wider"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Book Cards Columns */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full">
            {featuredBooks.length > 0 ? (
              featuredBooks.map((book) => (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  onClick={() => router.push(`/search?q=${encodeURIComponent(book.title)}`)}
                />
              ))
            ) : (
              <div className="col-span-full py-10 text-center bg-white/40 rounded-2xl border border-dashed border-gray-200 w-full">
                <p className="text-xs text-gray-400">Chưa có cuốn sách nổi bật nào hôm nay.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Recent Reviews Bento Grid Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center space-y-2 mb-14">
            <h2 className="font-serif text-3xl font-semibold text-[#004532]">
              Bài viết nổi bật gần đây
            </h2>
            <p className="text-xs text-gray-500 max-w-lg mx-auto leading-relaxed">
              Góc nhìn sâu sắc, chân thực từ các độc giả xanh, nuôi dưỡng trí tuệ và mở lối cho lối sống hài hòa cùng thiên nhiên.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {articles.length > 0 ? (
              articles.length >= 3 ? (
                <>
                  {/* Main Featured Review Card (Left, Wide Grid) */}
                  <div className="md:col-span-7 flex">
                    <ArticleCard 
                      article={articles[0]}
                      layout="featured"
                      likesCount={articles[0].likes}
                      onLike={(id, e) => handleLike(id, e)}
                      onClick={() => router.push(`/article/${articles[0].id}`)}
                    />
                  </div>

                  {/* Right Sub Cards Column (List of 2 smaller reviews) */}
                  <div className="md:col-span-5 flex flex-col gap-6">
                    <ArticleCard 
                      article={articles[1]}
                      layout="simple"
                      likesCount={articles[1].likes}
                      onLike={(id, e) => handleLike(id, e)}
                      onClick={() => router.push(`/article/${articles[1].id}`)}
                    />
                    <ArticleCard 
                      article={articles[2]}
                      layout="simple"
                      likesCount={articles[2].likes}
                      onLike={(id, e) => handleLike(id, e)}
                      onClick={() => router.push(`/article/${articles[2].id}`)}
                    />
                  </div>
                </>
              ) : articles.length === 2 ? (
                <>
                  <div className="md:col-span-7 flex">
                    <ArticleCard 
                      article={articles[0]}
                      layout="featured"
                      likesCount={articles[0].likes}
                      onLike={(id, e) => handleLike(id, e)}
                      onClick={() => router.push(`/article/${articles[0].id}`)}
                    />
                  </div>
                  <div className="md:col-span-5 flex flex-col gap-6">
                    <ArticleCard 
                      article={articles[1]}
                      layout="simple"
                      likesCount={articles[1].likes}
                      onLike={(id, e) => handleLike(id, e)}
                      onClick={() => router.push(`/article/${articles[1].id}`)}
                    />
                  </div>
                </>
              ) : (
                <div className="md:col-span-12 flex justify-center">
                  <div className="max-w-3xl w-full">
                    <ArticleCard 
                      article={articles[0]}
                      layout="featured"
                      likesCount={articles[0].likes}
                      onLike={(id, e) => handleLike(id, e)}
                      onClick={() => router.push(`/article/${articles[0].id}`)}
                    />
                  </div>
                </div>
              )
            ) : (
              <div className="md:col-span-12 py-16 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 p-8 space-y-4 w-full">
                <Sparkles className="w-10 h-10 text-[#a6f2cf] mx-auto" />
                <h3 className="font-serif text-lg font-bold text-gray-800">Chưa có bài cảm nhận nào</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Cộng đồng của chúng tôi đang chờ đợi những dòng chia sẻ đầu tiên từ bạn. Hãy trở thành người truyền cảm hứng sống xanh đầu tiên nhé!
                </p>
                <Link href="/create-article" className="inline-block bg-[#004532] text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-[#065f46] transition-colors decoration-none">
                  Viết cảm nhận ngay
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Brand Values / Eco-Philosophy section */}
      <section className="py-24 bg-[#FCF9F2] border-t border-b border-[#ebdcb9]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center space-y-16">
          <div className="max-w-xl mx-auto space-y-3">
            <span className="text-[10px] font-bold tracking-widest text-emerald-800 uppercase">Giá trị cốt lõi</span>
            <h2 className="font-serif text-3xl font-bold text-gray-900 leading-tight">
              Tại sao bạn sẽ yêu quý Trạm Đọc Xanh?
            </h2>
            <p className="text-xs text-gray-500 font-light">
              Mỗi tính năng và không gian của chúng tôi đều được thiết kế hướng tới môi trường lành mạnh, khuyến khích các độc giả kết nối và sẻ chia một cách văn minh nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Item 1 */}
            <div className="bg-white/80 backdrop-blur-xs p-8 rounded-2xl border border-[#ebdcb9]/40 space-y-4 text-left shadow-2xs">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-primary-green">
                <CheckCircle2 className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-gray-900">Nội dung văn minh, chọn lọc</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-light">
                Hệ thống kiểm duyệt bài viết chuyên nghiệp từ admin đảm bảo bài đăng có chiều sâu trí tuệ, loại bỏ rác mạng xã hội, tôn vinh ngọn lửa kiến thức xanh đích thực.
              </p>
            </div>

            {/* Feature Item 2 */}
            <div className="bg-white/80 backdrop-blur-xs p-8 rounded-2xl border border-[#ebdcb9]/40 space-y-4 text-left shadow-2xs">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-primary-green">
                <Award className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-gray-900">Bảo tồn và tôn vinh tri thức</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-light">
                Xây dựng thư viện bài đánh giá đa dạng các thể loại. Giúp độc giả dễ dàng lưu trữ sách yêu thích vào tủ sách cá nhân và thảo luận sâu sắc dưới mỗi tác phẩm.
              </p>
            </div>

            {/* Feature Item 3 */}
            <div className="bg-white/80 backdrop-blur-xs p-8 rounded-2xl border border-[#ebdcb9]/40 space-y-4 text-left shadow-2xs">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-primary-green">
                <Shield className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-gray-900">Không gian an lành, bảo mật</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-light">
                Cam kết xây dựng không gian bảo mật tài khoản an toàn tuyệt đối. Mở ra môi trường tôn trọng sự khác biệt, cùng nhau hướng tới lối sống xanh bền vững lành mạnh.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Join Call Section */}
      <section className="py-24 bg-[#004532] text-white text-center relative overflow-hidden">
        {/* Decorative dynamic shape */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-800/20 rounded-full blur-3xl -z-0" />
        
        <div className="relative z-10 max-w-2xl mx-auto px-4 space-y-8 text-center">
          <div className="inline-flex items-center gap-1.5 bg-[#a6f2cf]/20 text-[#a6f2cf] text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mx-auto">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nuôi dưỡng tâm hồn xanh hôm nay</span>
          </div>

          <h2 className="font-serif text-4xl sm:text-5xl font-bold leading-tight">
            Sẵn sàng mở rộng hành trình đọc của bạn?
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed font-light max-w-lg mx-auto">
            Gia nhập cộng đồng Trạm Đọc Xanh ngay để viết nên cảm nhận của bạn, sở hữu một tủ sách online phong cách và cùng nhau kiến tạo các thói quen đọc lành mạnh nhất.
          </p>

          <Link 
            href="/auth"
            className="inline-block bg-[#a6f2cf] hover:bg-[#87e3bc] text-[#004532] text-xs font-bold px-8 py-4 rounded-full transition-all uppercase tracking-wider shadow-sm hover:shadow-md cursor-pointer decoration-none"
          >
            Đăng ký tham gia ngay
          </Link>
        </div>
      </section>

      {/* Reusable footer */}
      <Footer />
    </div>
  );
}
