"use server";

import { prisma } from "../prisma";
import { Article } from "../../types";
import { PostStatus } from "@prisma/client";

// Helper to dynamically map category based on book title or fallback
function mapCategory(bookTitle: string): string {
  const title = bookTitle.toLowerCase();
  if (title.includes("cam ngọt") || title.includes("văn học") || title.includes("cây cam")) {
    return "REVIEW SÁCH";
  }
  if (title.includes("tối giản") || title.includes("triết học") || title.includes("sasaki")) {
    return "TRIẾT HỌC";
  }
  if (title.includes("bền vững") || title.includes("xanh") || title.includes("sinh thái")) {
    return "SỐNG XANH";
  }
  return "CỘNG ĐỒNG";
}

/**
 * Lấy danh sách các bài viết đã được phê duyệt từ Database
 */
export async function getArticles(category?: string, query?: string): Promise<Article[]> {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: PostStatus.approved,
        deletedAt: null,
        ...(query ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { contentMarkdown: { contains: query, mode: "insensitive" } },
            { book: { title: { contains: query, mode: "insensitive" } } },
            { book: { author: { contains: query, mode: "insensitive" } } }
          ]
        } : {})
      },
      include: {
        user: true,
        book: true,
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    let mappedArticles: Article[] = posts.map(post => {
      const cat = mapCategory(post.book.title);
      return {
        id: post.id,
        category: cat,
        date: post.createdAt.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        }),
        title: post.title,
        excerpt: post.contentMarkdown.length > 180 
          ? post.contentMarkdown.substring(0, 180).trim() + "..." 
          : post.contentMarkdown,
        likes: post._count.likes,
        comments: post._count.comments,
        authorName: post.user?.displayName || "Độc giả ẩn danh",
        authorAvatar: post.user?.avatarUrl || undefined,
        coverUrl: post.book.coverUrl || undefined,
        fullText: post.contentMarkdown,
        bookTitle: post.book.title,
        bookAuthor: post.book.author,
        bookRating: 4.8, // Mocked rating
        bookCategory: cat,
        bookCoverUrl: post.book.coverUrl || undefined,
        status: post.status.toUpperCase()
      };
    });

    // Lọc theo thể loại nếu được yêu cầu
    if (category && category !== "ALL" && category !== "TẤT CẢ") {
      mappedArticles = mappedArticles.filter(art => 
        art.category?.toUpperCase() === category.toUpperCase()
      );
    }

    return mappedArticles;
  } catch (error) {
    console.error("Error in getArticles Server Action:", error);
    return [];
  }
}

/**
 * Lấy chi tiết bài viết kèm danh sách các bình luận thật
 */
export async function getArticleById(id: string): Promise<any | null> {
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: true,
        book: true,
        comments: {
          where: { deletedAt: null },
          include: { user: true },
          orderBy: { createdAt: "asc" }
        },
        likes: true,
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });

    if (!post || post.deletedAt) return null;

    const cat = mapCategory(post.book.title);
    return {
      id: post.id,
      category: cat,
      date: post.createdAt.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }),
      title: post.title,
      excerpt: post.contentMarkdown.substring(0, 180),
      likes: post._count.likes,
      comments: post._count.comments,
      authorName: post.user?.displayName || "Độc giả ẩn danh",
      authorAvatar: post.user?.avatarUrl || undefined,
      coverUrl: post.book.coverUrl || undefined,
      fullText: post.contentMarkdown,
      bookTitle: post.book.title,
      bookAuthor: post.book.author,
      bookRating: 4.8,
      bookCategory: cat,
      bookCoverUrl: post.book.coverUrl || undefined,
      status: post.status.toUpperCase(),
      likesList: post.likes.map(l => l.userId), // Trả về danh sách user đã thích bài viết
      commentsList: post.comments.map(c => ({
        id: c.id,
        author: c.user?.displayName || "Bạn đọc ẩn danh",
        avatar: c.user?.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg?seed=" + encodeURIComponent(c.user?.displayName || "DocGia"),
        content: c.content,
        time: c.createdAt.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      }))
    };
  } catch (error) {
    console.error("Error in getArticleById Server Action:", error);
    return null;
  }
}

/**
 * Đăng bài cảm nhận mới (Đẩy lên trạng thái PENDING chờ duyệt)
 */
export async function createArticle(data: {
  title: string;
  category: string;
  fullText: string;
  bookTitle: string;
  bookAuthor: string;
  bookCoverUrl: string;
  userId: string;
}): Promise<any> {
  try {
    // 1. Tìm sách đã tồn tại hoặc tạo mới
    let book = await prisma.book.findFirst({
      where: {
        title: { equals: data.bookTitle, mode: "insensitive" },
        author: { equals: data.bookAuthor, mode: "insensitive" }
      }
    });

    if (!book) {
      book = await prisma.book.create({
        data: {
          title: data.bookTitle,
          author: data.bookAuthor,
          coverUrl: data.bookCoverUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBcAa0VXblj74ZyUhLRe7T-6ckhEgIuaqOC4MGucG8BqL9ipY1VZXQ-94smq_37lqXXyOe3rnks7s6z6-IO6uZ03BKdZou-TNc9cMkfGIxa8x8VMoHFur3H3WHDo3LplR6dlLKRd38temPcoLFvUkuTvOtVTZwcTuuSYSn4z3W5KUos2ROubEfeKLcFY_VQHZhlcWj_LRswe6nrtYLjI0Qqc3BDpH_hpM1akeKySxL6psML-8PBuEkK_JjoxHv0dgmwzgvELjw1fIA",
          summary: `Tác phẩm ${data.bookTitle} của tác giả ${data.bookAuthor}.`
        }
      });
    }

    // 2. Tạo bài viết ở trạng thái PENDING (chờ duyệt)
    const newPost = await prisma.post.create({
      data: {
        userId: data.userId,
        bookId: book.id,
        title: data.title,
        contentMarkdown: data.fullText,
        status: PostStatus.pending
      }
    });

    return {
      success: true,
      postId: newPost.id,
      message: "Bài cảm nhận đã được ghi nhận và đang chờ kiểm duyệt bởi Ban quản trị Trạm Đọc Xanh!"
    };
  } catch (error) {
    console.error("Error in createArticle Server Action:", error);
    return { success: false, message: "Đã xảy ra lỗi hệ thống khi xuất bản bài viết." };
  }
}

/**
 * Tương tác Thích / Bỏ thích bài viết
 */
export async function toggleLikeArticle(postId: string, userId: string): Promise<{ likesCount: number; isLiked: boolean }> {
  try {
    const existingLike = await prisma.postLike.findUnique({
      where: {
        unique_post_like: {
          userId,
          postId
        }
      }
    });

    if (existingLike) {
      // Hủy thích
      await prisma.postLike.delete({
        where: { id: existingLike.id }
      });
    } else {
      // Thêm lượt thích
      await prisma.postLike.create({
        data: {
          userId,
          postId
        }
      });
    }

    // Lấy lại tổng số lượt thích mới
    const likesCount = await prisma.postLike.count({
      where: { postId }
    });

    return {
      likesCount,
      isLiked: !existingLike
    };
  } catch (error) {
    console.error("Error in toggleLikeArticle Server Action:", error);
    return { likesCount: 0, isLiked: false };
  }
}

/**
 * Bình luận trực tiếp vào bài viết
 */
export async function addComment(postId: string, userId: string, content: string): Promise<any> {
  try {
    if (!content.trim()) return { success: false, message: "Nội dung bình luận không được để trống." };

    const newComment = await prisma.comment.create({
      data: {
        postId,
        userId,
        content
      },
      include: {
        user: true
      }
    });

    return {
      success: true,
      comment: {
        id: newComment.id,
        author: newComment.user?.displayName || "Bạn đọc ẩn danh",
        avatar: newComment.user?.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg?seed=" + encodeURIComponent(newComment.user?.displayName || "DocGia"),
        content: newComment.content,
        time: newComment.createdAt.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      }
    };
  } catch (error) {
    console.error("Error in addComment Server Action:", error);
    return { success: false, message: "Đã xảy ra lỗi khi đăng bình luận." };
  }
}
