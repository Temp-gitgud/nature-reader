"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import UserNavMenu from "../ui/UserNavMenu";
import { User } from "../../types";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Sync auth state from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Error parsing user from localStorage:", err);
      }
    }

    // Set up a listener for storage events (updates in different tabs)
    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem("currentUser");
      setCurrentUser(updatedUser ? JSON.parse(updatedUser) : null);
    };

    window.addEventListener("storage", handleStorageChange);
    // Custom event listener for same-window login/logout
    window.addEventListener("auth-state-change", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-state-change", handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("accessToken");
    setCurrentUser(null);
    // Trigger auth change event
    window.dispatchEvent(new Event("auth-state-change"));
    router.push("/");
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      {/* Decorative Top Accent Bar */}
      <div className="h-2 w-full bg-gradient-to-r from-[#004532] via-[#065f46] to-[#a6f2cf]" />
      
      <header className="sticky top-0 w-full z-40 bg-[#fcfbf9]/95 backdrop-blur-md border-b border-gray-100 shadow-xs h-20">
        <div className="flex justify-between items-center h-full px-4 sm:px-8 max-w-7xl mx-auto">
          {/* Logo Brand Title */}
          <Link href="/" className="flex items-center space-x-2.5 cursor-pointer">
            <BookOpen className="w-6 h-6 text-[#004532]" />
            <span className="font-serif text-2xl font-bold text-[#004532] tracking-tight italic">
              Trạm Đọc Xanh
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`text-sm font-semibold uppercase tracking-wider transition-colors ${
                isActive("/")
                  ? "text-[#004532] border-b-2 border-[#004532] pb-1 font-bold"
                  : "text-gray-500 hover:text-[#004532]"
              }`}
            >
              Trang chủ
            </Link>
            <Link
              href="/articles"
              className={`text-sm font-semibold uppercase tracking-wider transition-colors ${
                isActive("/articles")
                  ? "text-[#004532] border-b-2 border-[#004532] pb-1 font-bold"
                  : "text-gray-500 hover:text-[#004532]"
              }`}
            >
              Bài viết
            </Link>
            <Link
              href="/bookcase"
              className={`text-sm font-semibold uppercase tracking-wider transition-colors ${
                isActive("/bookcase")
                  ? "text-[#004532] border-b-2 border-[#004532] pb-1 font-bold"
                  : "text-gray-500 hover:text-[#004532]"
              }`}
            >
              Tủ Sách
            </Link>
            <Link
              href="/discover"
              className={`text-sm font-semibold uppercase tracking-wider transition-colors ${
                isActive("/discover")
                  ? "text-[#004532] border-b-2 border-[#004532] pb-1 font-bold"
                  : "text-gray-500 hover:text-[#004532]"
              }`}
            >
              Khám Phá
            </Link>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center space-x-4">
            <UserNavMenu
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </header>
    </>
  );
}
