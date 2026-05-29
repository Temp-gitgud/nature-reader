export interface User {
  id?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  favoriteBooks?: { id: string; title: string; author: string; coverUrl: string }[];
  isPublicProfile?: boolean;
  emailNotifications?: boolean;
  role?: 'user' | 'admin';
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  genres: string[];
  description: string;
  pages: number;
  readPages: number;
  reviewCount: number;
  rating: number;
  reviewExcerpt?: string;
}

export interface Review {
  id: string;
  bookTitle: string;
  authorName: string;
  authorAvatar: string;
  rating: number;
  content: string;
  date: string;
  likes: number;
}

export interface Article {
  id: string;
  category?: string;
  date: string;
  title: string;
  excerpt: string;
  likes: number;
  comments: number;
  authorName?: string;
  authorAvatar?: string;
  coverUrl?: string;
  fullText?: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookRating?: number;
  bookCategory?: string;
  bookCoverUrl?: string;
  status?: string;
  quote?: string;
  bulletPoints?: string[];
  reviewerLikes?: string;
  reviewerArticles?: string;
}
