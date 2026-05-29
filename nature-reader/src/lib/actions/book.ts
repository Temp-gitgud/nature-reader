"use server";

import { prisma } from "../prisma";
import { User, Book } from "../../types";

/**
 * Lấy thống kê tủ sách cá nhân và thông tin Profile của một độc giả từ DB
 */
export async function getBookcaseStats(userId: string): Promise<{
  profile: User | null;
  readCount: number;
  reviewCount: number;
  favoriteBooks: any[];
}> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      include: {
        posts: {
          where: { deletedAt: null },
          include: { book: true }
        },
        likes: {
          include: {
            post: {
              include: { book: true }
            }
          }
        },
        _count: {
          select: {
            posts: true,
            comments: true,
            likes: true
          }
        }
      }
    });

    if (!profile) {
      return { profile: null, readCount: 0, reviewCount: 0, favoriteBooks: [] };
    }

    // 1. Số lượng sách đã đọc = Số cuốn sách độc giả đã đăng review
    const uniqueBooksRead = new Set(profile.posts.map(p => p.bookId));
    const readCount = uniqueBooksRead.size;

    // 2. Số bài review đã viết
    const reviewCount = profile._count.posts;

    // 3. Sách yêu thích = Lấy từ các sách của các bài review độc giả đã thích (PostLikes)
    // kết hợp các sách mà độc giả tự viết review
    const favoriteBooksMap = new Map<string, any>();
    
    // Thêm các sách độc giả tự viết bài
    profile.posts.forEach(p => {
      if (p.book) {
        favoriteBooksMap.set(p.book.id, {
          id: p.book.id,
          title: p.book.title,
          author: p.book.author,
          coverUrl: p.book.coverUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBcAa0VXblj74ZyUhLRe7T-6ckhEgIuaqOC4MGucG8BqL9ipY1VZXQ-94smq_37lqXXyOe3rnks7s6z6-IO6uZ03BKdZou-TNc9cMkfGIxa8x8VMoHFur3H3WHDo3LplR6dlLKRd38temPcoLFvUkuTvOtVTZwcTuuSYSn4z3W5KUos2ROubEfeKLcFY_VQHZhlcWj_LRswe6nrtYLjI0Qqc3BDpH_hpM1akeKySxL6psML-8PBuEkK_JjoxHv0dgmwzgvELjw1fIA",
          rating: 4.8
        });
      }
    });

    // Thêm các sách từ bài viết đã thích
    profile.likes.forEach(l => {
      if (l.post && l.post.book) {
        favoriteBooksMap.set(l.post.book.id, {
          id: l.post.book.id,
          title: l.post.book.title,
          author: l.post.book.author,
          coverUrl: l.post.book.coverUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBcAa0VXblj74ZyUhLRe7T-6ckhEgIuaqOC4MGucG8BqL9ipY1VZXQ-94smq_37lqXXyOe3rnks7s6z6-IO6uZ03BKdZou-TNc9cMkfGIxa8x8VMoHFur3H3WHDo3LplR6dlLKRd38temPcoLFvUkuTvOtVTZwcTuuSYSn4z3W5KUos2ROubEfeKLcFY_VQHZhlcWj_LRswe6nrtYLjI0Qqc3BDpH_hpM1akeKySxL6psML-8PBuEkK_JjoxHv0dgmwzgvELjw1fIA",
          rating: 4.8
        });
      }
    });

    const favoriteBooks = Array.from(favoriteBooksMap.values());

    return {
      profile: {
        name: profile.displayName,
        email: profile.email,
        avatarUrl: profile.avatarUrl || undefined,
        bio: profile.bio || undefined,
        role: profile.role.toLowerCase() as "user" | "admin"
      },
      readCount,
      reviewCount,
      favoriteBooks
    };
  } catch (error) {
    console.error("Error in getBookcaseStats Server Action:", error);
    return { profile: null, readCount: 0, reviewCount: 0, favoriteBooks: [] };
  }
}

/**
 * Cập nhật thông tin Profile cá nhân trong Database
 */
export async function updateProfile(
  userId: string,
  data: { displayName: string; bio: string; avatarUrl?: string }
): Promise<{ success: boolean; message: string; profile?: User }> {
  try {
    const updated = await prisma.profile.update({
      where: { id: userId },
      data: {
        displayName: data.displayName,
        bio: data.bio,
        ...(data.avatarUrl ? { avatarUrl: data.avatarUrl } : {})
      }
    });

    return {
      success: true,
      message: "Thông tin cá nhân đã được lưu trữ bền vững vào hệ thống!",
      profile: {
        name: updated.displayName,
        email: updated.email,
        avatarUrl: updated.avatarUrl || undefined,
        bio: updated.bio || undefined,
        role: updated.role.toLowerCase() as "user" | "admin"
      }
    };
  } catch (error) {
    console.error("Error in updateProfile Server Action:", error);
    return { success: false, message: "Không thể lưu thông tin cập nhật vào Database." };
  }
}

/**
 * Lấy toàn bộ danh sách sách từ Thư viện DB
 */
export async function getBooks(): Promise<Book[]> {
  try {
    const books = await prisma.book.findMany({
      orderBy: { title: "asc" }
    });

    return books.map(b => ({
      id: b.id,
      title: b.title,
      author: b.author,
      coverUrl: b.coverUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBcAa0VXblj74ZyUhLRe7T-6ckhEgIuaqOC4MGucG8BqL9ipY1VZXQ-94smq_37lqXXyOe3rnks7s6z6-IO6uZ03BKdZou-TNc9cMkfGIxa8x8VMoHFur3H3WHDo3LplR6dlLKRd38temPcoLFvUkuTvOtVTZwcTuuSYSn4z3W5KUos2ROubEfeKLcFY_VQHZhlcWj_LRswe6nrtYLjI0Qqc3BDpH_hpM1akeKySxL6psML-8PBuEkK_JjoxHv0dgmwzgvELjw1fIA",
      genres: ["Văn học", "Kỹ năng", "Sống xanh"], // Standard default genres
      description: b.summary || "",
      pages: 350,
      readPages: 0,
      reviewCount: 12,
      rating: 4.8
    }));
  } catch (error) {
    console.error("Error in getBooks Server Action:", error);
    return [];
  }
}

/**
 * Lấy danh sách các cuốn sách nổi bật nhất từ DB dựa trên số lượng bài viết review
 */
export async function getFeaturedBooks(): Promise<any[]> {
  try {
    const books = await prisma.book.findMany({
      include: {
        posts: {
          where: { status: "approved", deletedAt: null }
        }
      },
      take: 10
    });

    const sortedBooks = books.sort((a, b) => b.posts.length - a.posts.length);

    return sortedBooks.map(b => ({
      id: b.id,
      title: b.title,
      author: b.author,
      coverUrl: b.coverUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBcAa0VXblj74ZyUhLRe7T-6ckhEgIuaqOC4MGucG8BqL9ipY1VZXQ-94smq_37lqXXyOe3rnks7s6z6-IO6uZ03BKdZou-TNc9cMkfGIxa8x8VMoHFur3H3WHDo3LplR6dlLKRd38temPcoLFvUkuTvOtVTZwcTuuSYSn4z3W5KUos2ROubEfeKLcFY_VQHZhlcWj_LRswe6nrtYLjI0Qqc3BDpH_hpM1akeKySxL6psML-8PBuEkK_JjoxHv0dgmwzgvELjw1fIA",
      genres: ["Văn học", "Kỹ năng", "Sống xanh"],
      description: b.summary || "",
      pages: 350,
      readPages: 0,
      reviewCount: b.posts.length,
      rating: 4.8
    }));
  } catch (error) {
    console.error("Error in getFeaturedBooks Server Action:", error);
    return [];
  }
}
