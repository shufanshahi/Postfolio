"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, User, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        // fetch user profile
        const profileRes = await apiFetch("/api/profile/me");
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setUser(profile);
        }

        // fetch notifications count
        const notifRes = await apiFetch("/api/notifications/count");
        if (notifRes.ok) {
          const { count } = await notifRes.json();
          setNotifications(count || 0);
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
    <div className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-slate-400 to-slate-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-500 bg-clip-text text-transparent">
            Postfolio
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-rose-300 text-rose-800">
                {notifications}
              </Badge>
            )}
          </Button>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 hover:bg-stone-50 rounded-lg p-2 transition-colors cursor-pointer">
                <Avatar className="h-8 w-8 ring-2 ring-stone-200">
                  <AvatarImage src={user?.avatar || "/avatar-placeholder.jpg"} />
                  <AvatarFallback className="bg-gradient-to-r from-slate-400 to-slate-500 text-white">
                    {user?.name
                      ? user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium">{user?.name || "User"}</p>
                  <p className="text-xs text-stone-500">{user?.role || "Member"}</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
