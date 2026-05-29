import React from "react";
import Link from "next/link";
import { BookOpen, Github, Mail, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#002116] text-[#e2f1ec] pt-16 pb-12 mt-auto border-t border-emerald-950 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-left mb-12">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center space-x-2.5">
              <BookOpen className="w-6 h-6 text-[#a6f2cf]" />
              <span className="font-serif text-2xl font-bold text-white tracking-tight italic">
                Trạm Đọc Xanh
              </span>
            </div>
            <p className="text-xs text-[#a3c9be] leading-relaxed max-w-sm font-light">
              Dự án phi lợi nhuận hướng tới việc lan tỏa cảm nhận văn học sinh thái, nuôi dưỡng tâm hồn xanh, kiến tạo thói quen đọc sách tích cực vì một tương lai văn minh bền vững.
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <a href="#" className="w-8 h-8 rounded-full bg-emerald-950 flex items-center justify-center hover:bg-[#a6f2cf] hover:text-[#002116] transition-all text-[#a6f2cf]">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-emerald-950 flex items-center justify-center hover:bg-[#a6f2cf] hover:text-[#002116] transition-all text-[#a6f2cf]">
                <Mail className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-emerald-950 flex items-center justify-center hover:bg-[#a6f2cf] hover:text-[#002116] transition-all text-[#a6f2cf]">
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h4 className="font-serif text-sm font-bold text-white tracking-wider uppercase">Chuyển hướng</h4>
            <div className="flex flex-col gap-2.5 text-xs text-[#a3c9be]">
              <Link href="/" className="hover:text-[#a6f2cf] transition-colors">Trang chủ</Link>
              <Link href="/articles" className="hover:text-[#a6f2cf] transition-colors">Bài viết cảm hứng</Link>
              <Link href="/bookcase" className="hover:text-[#a6f2cf] transition-colors">Kệ sách cá nhân</Link>
              <Link href="/discover" className="hover:text-[#a6f2cf] transition-colors">Góc khám phá</Link>
            </div>
          </div>

          {/* Legal / Policy links */}
          <div className="space-y-4">
            <h4 className="font-serif text-sm font-bold text-white tracking-wider uppercase">Điều khoản</h4>
            <div className="flex flex-col gap-2.5 text-xs text-[#a3c9be]">
              <a href="#" className="hover:text-[#a6f2cf] transition-colors">Quy chuẩn kiểm duyệt</a>
              <a href="#" className="hover:text-[#a6f2cf] transition-colors">Chính sách cộng đồng</a>
              <a href="#" className="hover:text-[#a6f2cf] transition-colors">Cam kết quyền bảo mật</a>
              <a href="#" className="hover:text-[#a6f2cf] transition-colors">Liên hệ đóng góp</a>
            </div>
          </div>

        </div>

        {/* Legal Notice bottom line */}
        <div className="pt-8 border-t border-emerald-900/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#719e91] font-light">
          <p>© {new Date().getFullYear()} Trạm Đọc Xanh. Kiến tạo bởi tình yêu thiên nhiên và tri thức.</p>
          <p>Phiên bản phát triển UI Mockup Next.js 16</p>
        </div>
      </div>
    </footer>
  );
}
