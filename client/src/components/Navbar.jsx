"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { apiFetch } from "@/lib/api";
import { NotificationProvider } from "@/contexts/NotificationContext";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        // fetch user profile
        const profileRes = await apiFetch("/api/profile/me");
        if (profileRes.ok) {
          const profile = await profileRes.json();
          console.log('Profile data in Navbar:', profile);
          setUser(profile);
        }
      } catch (err) {
        console.error("Navbar fetch error:", err);
      }
    }
    load();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <NotificationProvider userId={user?.id}>
      <div className="sticky top-0 z-50">
        {/* Layered background & subtle gradient border */}
        <div className="relative border-b border-teal-900/5 dark:border-teal-300/10 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-slate-900/60 bg-white/85 dark:bg-slate-900/75 shadow-[0_1px_0_0_rgba(255,255,255,0.6)] dark:shadow-none">
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
            <div className="absolute -top-24 left-0 h-56 w-56 bg-teal-300/20 dark:bg-teal-500/10 blur-3xl" />
            <div className="absolute -bottom-28 right-6 h-64 w-64 bg-indigo-300/20 dark:bg-indigo-500/10 blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-5 md:px-6 py-3.5 flex items-center justify-between gap-6">
            {/* Brand */}
            <div className="flex items-center gap-3 group">
              <div className="flex flex-col leading-tight">
                <span className="text-[18px] md:text-[20px] font-semibold bg-gradient-to-r from-indigo-700 via-indigo-500 to-indigo-400 dark:from-indigo-300 dark:via-indigo-400 dark:to-indigo-500 bg-clip-text text-transparent tracking-tight">
                  Postfolio
                </span>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-5">
              {/* Notifications */}
              {user?.id && (
                <div className="relative">
                  <NotificationBell className="hover:scale-[1.02] transition-transform" />
                </div>
              )}

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 rounded-full pl-1 pr-3 py-1.5 hover:bg-teal-50/80 dark:hover:bg-teal-500/10 transition-colors group ring-1 ring-transparent hover:ring-teal-500/30 dark:hover:ring-teal-400/30">
                    <Avatar className="h-9 w-9 ring-2 ring-white/70 dark:ring-slate-800 shadow-sm group-hover:shadow-teal-500/20 transition-shadow">
                      <AvatarImage src={user?.avatar || '/avatar-placeholder.jpg'} />
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 via-indigo-500 to-amber-400 text-[11px] text-white font-semibold">
                        {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                        {user?.role || 'Member'}
                      </p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border-teal-900/10 dark:border-slate-700/60 shadow-lg">
                  <DropdownMenuItem onClick={() => router.push('/profile')} className="focus:bg-teal-50 dark:focus:bg-teal-500/20 focus:text-teal-700 dark:focus:text-teal-200">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/settings')} className="focus:bg-teal-50 dark:focus:bg-teal-500/20 focus:text-teal-700 dark:focus:text-teal-200">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="focus:bg-rose-50 dark:focus:bg-rose-500/20 focus:text-rose-700 dark:focus:text-rose-300">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </NotificationProvider>
  );
}
