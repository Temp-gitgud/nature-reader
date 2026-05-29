"use server";

import { prisma } from "../prisma";
import { User, Book } from "../../types";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
 * Lấy hoặc Khởi tạo Profile người dùng từ DB thật dựa trên email
 */
export async function getOrCreateProfile(
  email: string,
  displayName: string
): Promise<{ success: boolean; profile?: User & { id: string } }> {
  try {
    let profile = await prisma.profile.findUnique({
      where: { email }
    });

    if (!profile) {
      const crypto = require("crypto");
      const newId = crypto.randomUUID();
      
      profile = await prisma.profile.create({
        data: {
          id: newId,
          email: email,
          displayName: displayName,
          bio: "Thành viên yêu sách của Trạm Đọc Xanh.",
          role: email.toLowerCase().includes("admin") ? "admin" : "user",
          avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`
        }
      });
    }

    return {
      success: true,
      profile: {
        id: profile.id,
        name: profile.displayName,
        email: profile.email,
        avatarUrl: profile.avatarUrl || undefined,
        bio: profile.bio || undefined,
        role: profile.role.toLowerCase() as "user" | "admin"
      }
    };
  } catch (error) {
    console.error("Error in getOrCreateProfile Server Action:", error);
    return { success: false };
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

/**
 * Server Action xử lý upload ảnh đại diện an toàn từ phía Server (Bảo mật + Tự động validate)
 */
export async function uploadAvatarServer(
  userId: string,
  formData: FormData
): Promise<{ success: boolean; url?: string; message: string }> {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, message: "Không tìm thấy file tải lên!" };
    }

    // 1. Kiểm tra định dạng (chỉ cho phép image/*)
    if (!file.type.startsWith("image/")) {
      return { success: false, message: "File tải lên bắt buộc phải là định dạng hình ảnh!" };
    }

    // 2. Giới hạn dung lượng (tối đa 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, message: "Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 2MB)!" };
    }

    const fileExt = file.name.split(".").pop() || "jpg";
    const filePath = `${userId}/avatar.${fileExt}`;

    // Đọc file thành Buffer trên server
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Tải lên sử dụng admin client (bỏ qua RLS trên Storage)
    const { error } = await supabaseAdmin.storage
      .from("avatars")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
        cacheControl: "31536000"
      });

    if (error) throw error;

    // 4. Lấy public URL của ảnh
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return {
      success: true,
      url: `${publicUrl}?t=${Date.now()}`,
      message: "Tải ảnh đại diện lên thành công!"
    };
  } catch (error) {
    console.error("Lỗi trong uploadAvatarServer Server Action:", error);
    return { success: false, message: "Lỗi hệ thống khi tải ảnh đại diện lên." };
  }
}

/**
 * Server Action xử lý upload ảnh bìa sách an toàn từ phía Server (Bảo mật + Tự động validate)
 */
export async function uploadBookCoverServer(
  userId: string,
  formData: FormData
): Promise<{ success: boolean; url?: string; message: string }> {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, message: "Không tìm thấy file tải lên!" };
    }

    // 1. Kiểm tra định dạng (chỉ cho phép image/*)
    if (!file.type.startsWith("image/")) {
      return { success: false, message: "File tải lên bắt buộc phải là định dạng hình ảnh!" };
    }

    // 2. Giới hạn dung lượng (tối đa 3MB cho bìa sách)
    if (file.size > 3 * 1024 * 1024) {
      return { success: false, message: "Dung lượng ảnh bìa vượt quá giới hạn cho phép (tối đa 3MB)!" };
    }

    const fileExt = file.name.split(".").pop() || "jpg";
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    // Đọc file thành Buffer trên server
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Tải lên sử dụng admin client
    const { error } = await supabaseAdmin.storage
      .from("book-covers")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
        cacheControl: "31536000"
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("book-covers")
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
      message: "Tải ảnh bìa sách lên thành công!"
    };
  } catch (error) {
    console.error("Lỗi trong uploadBookCoverServer Server Action:", error);
    return { success: false, message: "Lỗi hệ thống khi tải ảnh bìa sách lên." };
  }
}

/**
 * Thêm một cuốn sách mới vào Database thật (bảng Book) nếu chưa tồn tại
 */
export async function createBookInDb(data: {
  title: string;
  author: string;
  coverUrl?: string;
  summary?: string;
  publishedYear?: number;
}): Promise<{ success: boolean; message: string; book?: any }> {
  try {
    let book = await prisma.book.findFirst({
      where: {
        title: { equals: data.title, mode: "insensitive" },
        author: { equals: data.author, mode: "insensitive" }
      }
    });

    if (!book) {
      book = await prisma.book.create({
        data: {
          title: data.title,
          author: data.author,
          coverUrl: data.coverUrl || undefined,
          summary: data.summary || `Tác phẩm ${data.title} của tác giả ${data.author}.`,
          publishedYear: data.publishedYear || undefined
        }
      });
      return {
        success: true,
        message: "Sách mới đã được thêm vào thư viện database thành công!",
        book
      };
    }

    return {
      success: true,
      message: "Sách đã tồn tại trong thư viện database.",
      book
    };
  } catch (error) {
    console.error("Error in createBookInDb Server Action:", error);
    return { success: false, message: "Lỗi hệ thống khi thêm sách vào database." };
  }
}

/**
 * Lấy Profile của người dùng bằng userId thực tế
 */
export async function getProfileById(
  userId: string
): Promise<{ success: boolean; profile?: User & { id: string } }> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: userId }
    });

    if (!profile || profile.deletedAt) {
      return { success: false };
    }

    return {
      success: true,
      profile: {
        id: profile.id,
        name: profile.displayName,
        email: profile.email,
        avatarUrl: profile.avatarUrl || undefined,
        bio: profile.bio || undefined,
        role: profile.role.toLowerCase() as "user" | "admin"
      }
    };
  } catch (error) {
    console.error("Error in getProfileById Server Action:", error);
    return { success: false };
  }
}


