"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UserCheck, Settings, LogOut, Sparkles, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../../types";

interface UserNavMenuProps {
  currentUser: User | null;
  onJoinClick?: () => void;
  onLogout: () => void;
  onEditProfile?: (tab: "profile" | "settings") => void;
  onAdminPanelClick?: () => void;
}

export default function UserNavMenu({
  currentUser,
  onJoinClick,
  onLogout,
  onEditProfile,
  onAdminPanelClick
}: UserNavMenuProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  if (currentUser) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center space-x-2 bg-gray-50 hover:bg-emerald-50/50 px-3 py-1.5 rounded-full border border-gray-200 transition-all cursor-pointer text-left focus:outline-none"
          id="user-profile-button"
        >
          <img 
            src={currentUser.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBm1NO2J5n_OAKNopwHMrS_C4XsuYWm_weWx9KD2GZ3L1Zv10E5s9bnRuTGANTpO0UmK6X7Nf3YkZ87n_A2A_Szy35kUpKNRwwWOYBwSlK0zCUnKPe5LcQOer9wJfq3CjNu9Xj428EEPV5Pqhpt1LA-tuJsHvhMUpWM9zSAM_SlWPkFWVO-ZliwMJYsry9NWBekHypZfH75mxrmd4NYLqqbi-nrJefMWGJ2dKz84Vq2kHtphBbqCTowIWkDwgdfgzHtyQ9WTbhYGXI"} 
            alt={currentUser.name} 
            className="w-7 h-7 rounded-full border border-emerald-800/20 object-cover shrink-0"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "https://lh3.googleusercontent.com/aida-public/AB6AXuBm1NO2J5n_OAKNopwHMrS_C4XsuYWm_weWx9KD2GZ3L1Zv10E5s9bnRuTGANTpO0UmK6X7Nf3YkZ87n_A2A_Szy35kUpKNRwwWOYBwSlK0zCUnKPe5LcQOer9wJfq3CjNu9Xj428EEPV5Pqhpt1LA-tuJsHvhMUpWM9zSAM_SlWPkFWVO-ZliwMJYsry9NWBekHypZfH75mxrmd4NYLqqbi-nrJefMWGJ2dKz84Vq2kHtphBbqCTowIWkDwgdfgzHtyQ9WTbhYGXI";
            }}
          />
          <div className="hidden sm:block text-left text-xs font-sans">
            <p className="font-semibold text-gray-800 line-clamp-1 max-w-[90px]">{currentUser.name}</p>
          </div>
          <span className="text-[8px] text-gray-400 select-none">▼</span>
        </button>

        {/* Click outside backdrop for profile dropdown */}
        {showProfileMenu && (
          <div className="fixed inset-0 z-30" onClick={() => setShowProfileMenu(false)} />
        )}

        {/* Dropdown Options */}
        <AnimatePresence>
          {showProfileMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-gray-200 shadow-lg py-2.5 z-40 text-left font-sans"
            >
              <div className="px-4 py-2 border-b border-gray-50 mb-1.5">
                <p className="text-xs font-bold text-gray-800 line-clamp-1">{currentUser.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{currentUser.email || "docgia@tramdocxanh.vn"}</p>
              </div>

              {currentUser.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full px-4 py-2.5 text-xs flex items-center space-x-2.5 text-emerald-800 bg-emerald-50/50 hover:bg-[#e6f4f1] transition-colors cursor-pointer font-bold border-none"
                >
                  <Shield className="w-4 h-4 text-[#004532]" />
                  <span>Trang quản trị (Admin)</span>
                </Link>
              )}

              {onEditProfile ? (
                <button
                  type="button"
                  onClick={() => {
                    onEditProfile("profile");
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-xs flex items-center space-x-2.5 text-gray-700 hover:bg-[#f6faf8] hover:text-[#004532] transition-colors cursor-pointer font-medium border-none bg-transparent"
                >
                  <UserCheck className="w-4 h-4 text-[#004532]" />
                  <span>Chỉnh sửa cá nhân</span>
                </button>
              ) : (
                <Link
                  href="/bookcase?tab=profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full px-4 py-2 text-xs flex items-center space-x-2.5 text-gray-700 hover:bg-[#f6faf8] hover:text-[#004532] transition-colors cursor-pointer font-medium border-none bg-transparent"
                >
                  <UserCheck className="w-4 h-4 text-[#004532]" />
                  <span>Chỉnh sửa cá nhân</span>
                </Link>
              )}

              {onEditProfile ? (
                <button
                  type="button"
                  onClick={() => {
                    onEditProfile("settings");
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-xs flex items-center space-x-2.5 text-gray-700 hover:bg-[#f6faf8] hover:text-[#004532] transition-colors cursor-pointer font-medium border-none bg-transparent"
                >
                  <Settings className="w-4 h-4 text-[#065f46]" />
                  <span>Cài đặt bảo mật</span>
                </button>
              ) : (
                <Link
                  href="/bookcase?tab=settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full px-4 py-2 text-xs flex items-center space-x-2.5 text-gray-700 hover:bg-[#f6faf8] hover:text-[#004532] transition-colors cursor-pointer font-medium border-none bg-transparent"
                >
                  <Settings className="w-4 h-4 text-[#065f46]" />
                  <span>Cài đặt bảo mật</span>
                </Link>
              )}

              <hr className="my-1.5 border-gray-100" />

              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  onLogout();
                }}
                className="w-full px-4 py-2 text-xs flex items-center space-x-2.5 text-red-650 hover:bg-red-50/50 transition-colors cursor-pointer font-bold border-none bg-transparent"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return onJoinClick ? (
    <button 
      type="button"
      onClick={onJoinClick}
      className="bg-[#004532] hover:bg-[#065f46] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer selection:bg-[#a6f2cf]"
    >
      <Sparkles className="w-3.5 h-3.5 text-[#a6f2cf]" />
      <span>Tham gia ngay</span>
    </button>
  ) : (
    <Link 
      href="/auth"
      className="bg-[#004532] hover:bg-[#065f46] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer selection:bg-[#a6f2cf]"
    >
      <Sparkles className="w-3.5 h-3.5 text-[#a6f2cf]" />
      <span>Tham gia ngay</span>
    </Link>
  );
}
