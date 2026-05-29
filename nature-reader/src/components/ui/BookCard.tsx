import React from "react";
import RatingStars from "./RatingStars";

interface BookCardProps {
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl: string;
    rating?: number;
    genre?: string;
    genres?: string[];
    desc?: string;
    description?: string;
  };
  onClick?: () => void;
}

export default function BookCard({ book, onClick }: BookCardProps) {
  const ratingValue = book.rating || 5.0;
  const genresList = book.genres ? book.genres.join(", ") : book.genre || "";
  const displayDesc = book.desc || book.description || "";

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 border border-[#e8ebd9]/40 hover:border-emerald-800/10 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group cursor-pointer"
    >
      {/* Cover Image Wrapper */}
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-50 mb-3.5 shadow-sm group-hover:shadow-md transition-all duration-300">
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "https://lh3.googleusercontent.com/aida-public/AB6AXuA9Sv9sXKLZK3S9mqLXi2Jo3yie3zDXyeSCIOQUBp1JS3pWlZqFzHMLnfr4iy9Q5ttGanSrk_vIdA4F-BEi0h48BlC49ntPxrAjniya5MNijR663DsFfDh-dJWR9SUbIvhTesU4jx9TnvELVEM_gepwRsG7AhvfEcIr_kBQd-IhbrvZak5lX8Ou2N9VDBjlL0rLc7-B_dXiuP6iWiBCNK-KwtZjDJUG31uNLK-scrIb8S1gVMpziAkd-S08PdTthNylAURu25agYpM";
          }}
        />
        {genresList && (
          <div className="absolute top-2 left-2 bg-[#004532]/90 backdrop-blur-xs text-[#a6f2cf] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            {genresList.split(",")[0]}
          </div>
        )}
      </div>

      {/* Book Metadata */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-1 mb-1">
          <RatingStars rating={ratingValue} />
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
            {ratingValue.toFixed(1)}
          </span>
        </div>

        <h4 className="font-serif font-bold text-gray-800 text-sm group-hover:text-primary-green transition-colors line-clamp-1 mb-0.5">
          {book.title}
        </h4>
        <p className="text-gray-400 text-[10px] font-medium mb-1.5">{book.author}</p>

        {displayDesc && (
          <p className="text-gray-500 text-[10px] leading-relaxed line-clamp-2 mt-auto">
            {displayDesc}
          </p>
        )}
      </div>
    </div>
  );
}
