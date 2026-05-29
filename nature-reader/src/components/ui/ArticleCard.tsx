"use client";

import React from "react";
import { Heart, MessageSquare, ArrowRight } from "lucide-react";
import RatingStars from "./RatingStars";
import { Article } from "../../types";

interface ArticleCardProps {
  article: Article;
  layout?: "featured" | "list" | "simple";
  likesCount?: number;
  onLike?: (id: string, e: React.MouseEvent) => void;
  onClick?: () => void;
  onEdit?: (art: any, e: React.MouseEvent) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  showActions?: boolean;
}

export default function ArticleCard({
  article,
  layout = "list",
  likesCount,
  onLike,
  onClick,
  onEdit,
  onDelete,
  showActions = false
}: ArticleCardProps) {
  const currentLikes = likesCount !== undefined ? likesCount : article.likes;

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLike) {
      onLike(article.id, e);
    }
  };

  if (layout === "featured") {
    return (
      <div
        onClick={onClick}
        className="bg-[#eff4ff] rounded-2xl p-6 sm:p-8 border border-white/40 shadow-xs flex flex-col justify-between group cursor-pointer hover:shadow-sm hover:border-[#a6f2cf] transition-all duration-300"
      >
        <div className="space-y-6 text-left">
          {/* Reviewer Meta Header */}
          <div className="flex items-center gap-3">
            <img
              src={article.authorAvatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Phuong"}
              alt="reviewer avatar"
              className="w-10 h-10 rounded-full border border-gray-100 bg-white"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="font-bold text-[#004532] text-xs">{article.authorName || "Độc giả xanh"}</p>
              <span className="text-gray-400 text-[10px]">{article.date} • 8 phút đọc</span>
            </div>
          </div>

          {/* Title and Excerpt */}
          <div className="space-y-3">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-[#004532] group-hover:underline transition-all">
              {article.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-light line-clamp-4">
              {article.excerpt}
            </p>
          </div>

          {/* Related Book Cover Summary */}
          {article.bookTitle && (
            <div className="flex gap-4 p-4 rounded-xl bg-white/70 border border-gray-100/50">
              <img
                src={article.bookCoverUrl}
                alt={article.bookTitle}
                className="w-12 h-16 rounded-md object-cover shadow-xs shrink-0"
              />
              <div className="flex flex-col justify-between text-left">
                <div>
                  <h4 className="font-serif font-bold text-xs text-gray-800 line-clamp-1">
                    {article.bookTitle}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-medium">{article.bookAuthor}</p>
                </div>
                <div className="flex items-center gap-2">
                  {article.bookRating && <RatingStars starClassName="w-2.5 h-2.5" rating={article.bookRating} />}
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1 rounded-sm">
                    {article.bookRating?.toFixed(1) || "5.0"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card Footer Statistics */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-150/60">
          <div className="flex items-center space-x-6 text-xs text-gray-400">
            <button
              onClick={handleLikeClick}
              className="flex items-center gap-1.5 hover:text-red-500 transition-colors cursor-pointer focus:outline-none bg-transparent border-none"
            >
              <Heart className="w-4 h-4 text-red-400 fill-red-400" />
              <span className="font-semibold text-gray-600">{currentLikes}</span>
            </button>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-gray-600">{article.comments}</span>
            </div>
          </div>

          <div className="text-xs font-bold text-[#004532] group-hover:underline flex items-center gap-1">
            <span>Chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    );
  }

  if (layout === "simple") {
    return (
      <div
        onClick={onClick}
        className="bg-white rounded-2xl p-5 border border-gray-150 shadow-2xs hover:shadow-xs hover:border-[#a6f2cf] transition-all duration-300 flex flex-col justify-between group cursor-pointer text-left"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <img
              src={article.authorAvatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=A"}
              alt="avatar"
              className="w-7 h-7 rounded-full bg-gray-50 border border-gray-100"
            />
            <div className="text-[10px]">
              <p className="font-bold text-gray-800 leading-none">{article.authorName}</p>
              <span className="text-gray-400">{article.date}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-serif font-bold text-[#004532] text-sm group-hover:underline leading-tight line-clamp-2">
              {article.title}
            </h4>
            <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-3 font-light">
              {article.excerpt}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 text-[11px] text-gray-400">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLikeClick}
              className="flex items-center gap-1 hover:text-red-500 transition-colors focus:outline-none"
            >
              <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
              <span>{currentLikes}</span>
            </button>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
              <span>{article.comments}</span>
            </div>
          </div>
          <span className="text-[9px] font-bold text-[#004532] tracking-wider uppercase">
            {article.category || "Cảm hứng"}
          </span>
        </div>
      </div>
    );
  }

  // Default layout: List layout (reading column)
  return (
    <article
      onClick={onClick}
      className="bg-white rounded-2xl p-6 sm:p-10 border border-gray-150 shadow-xs hover:border-[#a6f2cf]/80 hover:shadow-md transition-all duration-300 space-y-4 text-left group relative cursor-pointer"
    >
      {/* Header specs */}
      <div className="flex items-center justify-between">
        <span className="px-3 py-1 bg-[#a6f2cf]/30 text-[#00513b] text-[10px] font-bold rounded-full uppercase tracking-wider">
          {article.category || "TRIẾT HỌC"}
        </span>
        <span className="text-xs text-gray-400 font-sans">{article.date}</span>
      </div>

      {/* Body Content info */}
      <div className="space-y-2">
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-[#004532] transition-colors leading-tight">
          {article.title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-light line-clamp-3">
          {article.excerpt}
        </p>
      </div>

      {/* Footer specs containing upvote and comments + edit/delete buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
        <div className="flex items-center space-x-6 text-xs text-gray-400">
          <button
            onClick={handleLikeClick}
            className="flex items-center gap-1.5 hover:text-red-500 transition-colors cursor-pointer focus:outline-none"
          >
            <Heart className="w-4 h-4 text-red-400 fill-red-400" />
            <span className="font-semibold text-gray-600">{currentLikes}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-gray-600">{article.comments}</span>
          </div>
        </div>

        {showActions && (onEdit || onDelete) ? (
          <div className="flex items-center gap-3">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(article, e);
                }}
                className="text-[#004532] font-semibold text-xs hover:underline flex items-center gap-1 cursor-pointer focus:outline-none"
              >
                <span>Chỉnh sửa</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(article.id, e);
                }}
                className="text-red-400 hover:text-red-600 font-semibold text-xs flex items-center gap-1 cursor-pointer focus:outline-none"
              >
                <span>Xóa</span>
              </button>
            )}
          </div>
        ) : (
          <div className="text-xs font-semibold text-[#004532] group-hover:underline">
            Đọc bài review
          </div>
        )}
      </div>
    </article>
  );
}
