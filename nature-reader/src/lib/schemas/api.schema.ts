import { z } from 'zod'

// =====================================
// PROFILE SCHEMAS
// =====================================
export const profileUpdateSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(100, 'Display name is too long').optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  avatarUrl: z.string().url('Avatar URL must be a valid URL').optional().or(z.literal(''))
})

export const changePasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
})

// =====================================
// POST & BOOK SCHEMAS
// =====================================
export const postCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title is too long'),
  contentMarkdown: z.string().min(10, 'Review content must be at least 10 characters').max(50000, 'Content is too long (max 50,000 characters)'),
  bookTitle: z.string().min(1, 'Book title is required').max(200),
  bookAuthor: z.string().min(1, 'Book author is required').max(200),
  bookSummary: z.string().max(2000, 'Book summary must be under 2000 characters').optional(),
  bookCoverUrl: z.string().url('Book cover URL must be a valid URL').optional().or(z.literal('')),
  publishedYear: z.number().int().min(1000).max(new Date().getFullYear() + 1).optional()
})

export const postUpdateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title is too long').optional(),
  contentMarkdown: z.string().min(10, 'Review content must be at least 10 characters').max(50000, 'Content is too long (max 50,000 characters)').optional()
})

// =====================================
// COMMENT SCHEMAS
// =====================================
export const commentCreateSchema = z.object({
  content: z.string().min(1, 'Comment content cannot be empty').max(2000, 'Comment is too long (max 2000 characters)')
})

// =====================================
// REPORT SCHEMAS
// =====================================
export const reportReasonEnum = z.enum([
  'spam',
  'abusive_language',
  'violence',
  'harassment',
  'misleading',
  'copyright',
  'other'
])

export const reportCreateSchema = z.object({
  reason: reportReasonEnum,
  description: z.string().max(1000, 'Description must be under 1000 characters').optional()
}).superRefine((data, ctx) => {
  if (data.reason === 'other') {
    if (!data.description || data.description.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['description'],
        message: 'Description is required and must be at least 10 characters when reason is "other"'
      })
    }
  }
})

// =====================================
// ADMIN MODERATION SCHEMAS
// =====================================
export const adminReportReviewSchema = z.object({
  status: z.enum(['action_taken', 'reviewed', 'rejected']),
  moderationNote: z.string().min(5, 'Moderation note must be at least 5 characters long')
})

export const adminPostReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectReason: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.status === 'rejected') {
    if (!data.rejectReason || data.rejectReason.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rejectReason'],
        message: 'Reject reason is required and must be at least 5 characters when status is "rejected"'
      })
    }
  }
})

export const adminUserUpdateSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  displayName: z.string().min(2).max(100).optional()
})
