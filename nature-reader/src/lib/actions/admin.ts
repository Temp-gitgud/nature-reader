"use server";

import { prisma } from "../prisma";
import { PostStatus, ModerationAction, UserRole } from "@prisma/client";
import { Article } from "../../types";

// Helper to dynamically map category based on book title
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
 * Lấy danh sách các bài viết đang chờ kiểm duyệt (Pending Queue)
 */
export async function getPendingArticles(): Promise<Article[]> {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: PostStatus.pending,
        deletedAt: null
      },
      include: {
        user: true,
        book: true
      },
      orderBy: {
        createdAt: "asc" // Hiển thị bài viết gửi trước ở đầu hàng đợi
      }
    });

    return posts.map(post => {
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
        excerpt: post.contentMarkdown.substring(0, 180).trim() + "...",
        likes: 0,
        comments: 0,
        authorName: post.user?.displayName || "Độc giả ẩn danh",
        authorAvatar: post.user?.avatarUrl || undefined,
        coverUrl: post.book.coverUrl || undefined,
        fullText: post.contentMarkdown,
        bookTitle: post.book.title,
        bookAuthor: post.book.author,
        bookRating: 4.5,
        bookCategory: cat,
        bookCoverUrl: post.book.coverUrl || undefined,
        status: post.status.toUpperCase()
      };
    });
  } catch (error) {
    console.error("Error in getPendingArticles Server Action:", error);
    return [];
  }
}

/**
 * Phê duyệt hoặc Từ chối bài viết + Ghi log kiểm duyệt
 */
export async function moderateArticle(
  postId: string,
  adminId: string,
  status: "approved" | "rejected",
  notes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Cập nhật bài viết
    const isApproved = status === "approved";
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: isApproved ? PostStatus.approved : PostStatus.rejected,
        approvedBy: isApproved ? adminId : null,
        approvedAt: isApproved ? new Date() : null,
        rejectReason: isApproved ? null : (notes || "Không đạt tiêu chuẩn kiểm duyệt.")
      }
    });

    // 2. Ghi Moderation Log vào DB thật
    await prisma.moderationLog.create({
      data: {
        postId,
        adminId,
        action: isApproved ? ModerationAction.approved : ModerationAction.rejected,
        reason: notes || (isApproved ? "Phê duyệt phát hành" : "Từ chối phát hành")
      }
    });

    return {
      success: true,
      message: isApproved 
        ? "Đã phê duyệt và xuất bản bài cảm nhận sách thành công lên hệ thống Trạm Đọc Xanh!" 
        : "Đã từ chối bài cảm nhận sách và lưu vết lý do thành công."
    };
  } catch (error) {
    console.error("Error in moderateArticle Server Action:", error);
    return { success: false, message: "Lỗi hệ thống: Không thể xử lý phê duyệt bài viết." };
  }
}

/**
 * Lấy số liệu phân tích và tổng hợp của hệ thống cho Admin Console
 */
export async function getAdminStats(): Promise<{
  totalBooks: number;
  totalApprovedPosts: number;
  totalPendingPosts: number;
  totalUsers: number;
}> {
  try {
    const totalBooks = await prisma.book.count();
    const totalApprovedPosts = await prisma.post.count({
      where: { status: PostStatus.approved, deletedAt: null }
    });
    const totalPendingPosts = await prisma.post.count({
      where: { status: PostStatus.pending, deletedAt: null }
    });
    const totalUsers = await prisma.profile.count({
      where: { deletedAt: null }
    });

    return {
      totalBooks,
      totalApprovedPosts,
      totalPendingPosts,
      totalUsers
    };
  } catch (error) {
    console.error("Error in getAdminStats Server Action:", error);
    return { totalBooks: 0, totalApprovedPosts: 0, totalPendingPosts: 0, totalUsers: 0 };
  }
}

/**
 * Lấy danh sách tất cả các tài khoản người dùng/Profiles thật từ DB cho Admin Console
 */
export async function getAdminUsers(): Promise<{
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
  bio: string;
}[]> {
  try {
    const profiles = await prisma.profile.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" }
    });

    return profiles.map(p => ({
      id: p.id,
      name: p.displayName,
      email: p.email,
      role: p.role.toLowerCase(),
      avatarUrl: p.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(p.displayName)}`,
      bio: p.bio || "Thành viên yêu sách của Trạm Đọc Xanh."
    }));
  } catch (error) {
    console.error("Error in getAdminUsers Server Action:", error);
    return [];
  }
}

/**
 * Thay đổi vai trò người dùng (User <-> Admin) trong DB
 */
export async function toggleUserRoleInDb(
  userId: string,
  currentRole: string
): Promise<{ success: boolean; message: string; newRole?: string }> {
  try {
    const newRole = currentRole.toLowerCase() === "admin" ? "user" : "admin";
    const prismaRole = newRole === "admin" ? UserRole.admin : UserRole.user;

    await prisma.profile.update({
      where: { id: userId },
      data: { role: prismaRole }
    });

    return {
      success: true,
      message: `Đã thay đổi vai trò thành viên sang ${newRole.toUpperCase()} bền vững trên hệ thống!`,
      newRole
    };
  } catch (error) {
    console.error("Error in toggleUserRoleInDb:", error);
    return { success: false, message: "Lỗi hệ thống: Không thể cập nhật vai trò người dùng." };
  }
}

/**
 * Xóa vĩnh viễn tài khoản người dùng khỏi DB
 */
export async function deleteUserInDb(
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.profile.delete({
      where: { id: userId }
    });

    return {
      success: true,
      message: "Đã gỡ bỏ tài khoản thành viên vĩnh viễn khỏi hệ thống DB!"
    };
  } catch (error) {
    console.error("Error in deleteUserInDb:", error);
    return { success: false, message: "Lỗi hệ thống: Không thể xóa tài khoản." };
  }
}
