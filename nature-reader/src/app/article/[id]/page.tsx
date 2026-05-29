"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Heart, MessageSquare, Bookmark, Share2, 
  CornerDownRight, CheckCircle2, Star, Sparkles 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import RatingStars from "../../../components/ui/RatingStars";
import { getArticleById, toggleLikeArticle, addComment } from "../../../lib/actions/article";


interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
  likes: number;
}

export default function ArticleDetail({ params }: { params: any }) {
  const router = useRouter();
  const [unwrappedParams, setUnwrappedParams] = useState<any>(null);
  const [article, setArticle] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  
  const [notification, setNotification] = useState("");

  // Load current user and params
  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }

    Promise.resolve(params).then((res) => {
      setUnwrappedParams(res);
    });
  }, [params]);

  // Load article from PostgreSQL
  useEffect(() => {
    if (!unwrappedParams) return;
    const { id } = unwrappedParams;

    async function loadDBArticle() {
      setLoading(true);
      try {
        const fetched = await getArticleById(id);
        if (fetched) {
          setArticle(fetched);
          setLikes(fetched.likes);
          setCommentsList(fetched.commentsList || []);
          
          // Check if the current user liked this post
          const userStr = localStorage.getItem("currentUser");
          if (userStr) {
            const u = JSON.parse(userStr);
            setIsLiked(fetched.likesList?.includes(u.id) || false);
          }
        } else {
          setArticle(null);
        }
      } catch (err) {
        console.error("Error loading article from DB:", err);
        setArticle(null);
      } finally {
        setLoading(false);
      }
    }
    loadDBArticle();
  }, [unwrappedParams]);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleLikeClick = async () => {
    const { id } = unwrappedParams || {};
    const userId = currentUser?.id || "5c9f5643-4be9-4e78-8742-892410a8d6e3";

    if (id) {
      try {
        const result = await toggleLikeArticle(id, userId);
        setLikes(result.likesCount);
        setIsLiked(result.isLiked);
        triggerNotification(result.isLiked ? "Yêu thích bài viết thành công!" : "Đã bỏ yêu thích bài viết.");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleBookmarkClick = () => {
    setIsBookmarked(!isBookmarked);
    triggerNotification(isBookmarked ? "Đã gỡ bài viết đánh dấu." : "Đã lưu trữ bài viết thành công!");
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const { id } = unwrappedParams || {};
    const userId = currentUser?.id || "5c9f5643-4be9-4e78-8742-892410a8d6e3";

    if (id) {
      try {
        const result = await addComment(id, userId, newCommentText.trim());
        if (result.success) {
          setCommentsList(prev => [...prev, result.comment]);
          setNewCommentText("");
          triggerNotification("Đăng ý kiến đóng góp thành công!");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#004532] border-t-transparent" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="w-full min-h-screen flex flex-col bg-[#fcfcf9]">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 space-y-6">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 shadow-sm animate-pulse">
            <Sparkles className="w-10 h-10 text-emerald-800" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-gray-900">Bài cảm nhận không tìm thấy</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Bài viết này không tồn tại, đã bị gỡ bỏ hoặc bạn không có quyền truy cập. Hãy quay lại trang chủ để khám phá thêm nhiều bài viết hấp dẫn khác nhé!
            </p>
          </div>
          <button
            onClick={() => router.push("/articles")}
            className="bg-[#004532] text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#065f46] shadow-sm transition-all cursor-pointer border-none"
          >
            Quay lại Danh sách Bài viết
          </button>
        </main>
        <Footer />
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
            className="fixed bottom-6 right-6 z-50 bg-[#004532] text-white border border-[#a6f2cf]/30 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 text-[#a6f2cf] shrink-0" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10 space-y-8 text-left">
        
        {/* Navigation Toolbar */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <button
            onClick={() => router.back()}
            className="text-xs font-semibold text-gray-500 hover:text-primary-green flex items-center gap-1.5 bg-transparent border-none cursor-pointer focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang danh sách</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleBookmarkClick}
              className={`p-2.5 rounded-full border transition-all cursor-pointer focus:outline-none ${
                isBookmarked 
                  ? "bg-emerald-50 border-emerald-800/10 text-emerald-800" 
                  : "bg-white border-gray-200 text-gray-400 hover:text-gray-600"
              }`}
              title="Đánh dấu lưu trữ"
            >
              <Bookmark className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                triggerNotification("Đã sao chép liên kết bài review!");
              }}
              className="p-2.5 rounded-full border border-gray-200 bg-white text-gray-400 hover:text-gray-600 transition-all cursor-pointer focus:outline-none"
              title="Chia sẻ liên kết"
            >
              <Share2 className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Detailed Review Article */}
        <article className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-150 shadow-2xs space-y-6">
          {/* Header specs */}
          <div className="space-y-4">
            <span className="inline-block px-3 py-1 bg-[#a6f2cf]/30 text-[#00513b] text-[10px] font-bold rounded-full uppercase tracking-wider">
              {article.category}
            </span>
            <h1 className="font-serif text-2xl sm:text-4.5xl font-bold text-gray-900 leading-tight">
              {article.title}
            </h1>
            
            {/* Writer info */}
            <div className="flex items-center justify-between gap-4 pt-2 border-b border-gray-105 pb-4">
              <div className="flex items-center gap-3">
                <img 
                  src={article.authorAvatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=A"} 
                  alt="author avatar" 
                  className="w-10 h-10 rounded-full border border-gray-100 bg-gray-50 object-cover"
                />
                <div className="text-left leading-tight text-xs">
                  <p className="font-bold text-gray-900">{article.authorName || "Độc giả xanh"}</p>
                  <span className="text-gray-400 text-[10px]">{article.date} • 8 phút đọc</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsFollowing(!isFollowing);
                  triggerNotification(isFollowing ? "Đã hủy theo dõi độc giả." : "Đã theo dõi độc giả thành công!");
                }}
                className={`text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-full border transition-all cursor-pointer focus:outline-none ${
                  isFollowing 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                    : "bg-white border-gray-200 text-gray-500 hover:border-[#004532] hover:text-[#004532]"
                }`}
              >
                {isFollowing ? "Đang theo dõi" : "Theo dõi"}
              </button>
            </div>
          </div>

          {/* Full content display */}
          <div className="text-sm sm:text-base text-gray-700 leading-relaxed font-light text-left whitespace-pre-line py-4 space-y-4">
            {article.fullText || article.excerpt}
          </div>

          {/* Connected Book Detail Summary */}
          {article.bookTitle && (
            <div className="flex flex-col sm:flex-row gap-5 p-6 rounded-2xl bg-[#eff4ff]/80 border border-white/50 text-left items-start sm:items-center">
              <img 
                src={article.bookCoverUrl} 
                alt={article.bookTitle} 
                className="w-20 h-28 rounded-xl object-cover shadow-xs shrink-0 bg-gray-50"
              />
              <div className="space-y-2 flex-1 min-w-0">
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                    Cuốn sách được đánh giá
                  </span>
                  <h4 className="font-serif font-bold text-gray-950 text-base leading-snug truncate mt-0.5">
                    {article.bookTitle}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium leading-none">{article.bookAuthor}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  {article.bookRating && <RatingStars starClassName="w-3.5 h-3.5" rating={article.bookRating} />}
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm">
                    {article.bookRating?.toFixed(1) || "5.0"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Floating toolbar action */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <div className="flex items-center gap-6 text-xs text-gray-400">
              <button
                onClick={handleLikeClick}
                className="flex items-center gap-2 hover:text-red-500 transition-colors focus:outline-none bg-transparent border-none cursor-pointer"
              >
                <Heart className={`w-5 h-5 ${isLiked ? "text-red-500 fill-red-500 animate-pulse" : "text-gray-400"}`} />
                <span className="font-semibold text-gray-600">{likes} thích</span>
              </button>
              
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <span className="font-semibold text-gray-600">{commentsList.length} bình luận</span>
              </div>
            </div>
          </div>
        </article>

        {/* Comments section */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-150 shadow-2xs space-y-6 text-left">
          <h3 className="font-serif text-lg font-bold text-gray-950">
            Ý kiến độc giả ({commentsList.length})
          </h3>

          <form onSubmit={handleCommentSubmit} className="flex gap-4 items-start">
            <img 
              src="https://api.dicebear.com/7.x/adventurer/svg?seed=DocGia" 
              alt="my avatar" 
              className="w-9 h-9 rounded-full bg-gray-50 object-cover shrink-0"
            />
            <div className="flex-1 flex gap-3">
              <input 
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Chia sẻ quan điểm của bạn về bài viết này..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-250 bg-white focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-primary-green text-xs"
                required
              />
              <button
                type="submit"
                className="bg-[#004532] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#065f46] cursor-pointer border-none shadow-2xs shrink-0"
              >
                Gửi ý kiến
              </button>
            </div>
          </form>

          <div className="space-y-4 pt-2">
            {commentsList.map((c) => (
              <div key={c.id} className="flex gap-4 items-start text-xs border-b border-gray-50 pb-4 last:border-none last:pb-0">
                <img src={c.avatar} alt="commenter avatar" className="w-8 h-8 rounded-full bg-gray-55 border border-gray-100 shrink-0 object-cover" />
                
                <div className="space-y-1 w-full text-left">
                  <div className="flex justify-between items-baseline gap-2">
                    <p className="font-bold text-gray-900">{c.author}</p>
                    <span className="text-[9px] text-gray-400 font-light">{c.time}</span>
                  </div>
                  <p className="text-gray-600 font-light leading-relaxed">{c.content}</p>
                  
                  {/* Subtle reply layout indicator */}
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold cursor-pointer hover:text-primary-green">
                    <CornerDownRight className="w-3 h-3" />
                    <span>Phản hồi</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
