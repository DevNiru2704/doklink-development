"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Bed,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  Activity,
  LogOut,
  Building2,
  UserCircle,
  Shield,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  // Dynamic navigation based on user role
  const getNavigation = () => {
    const baseNavigation = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ];

    // SuperAdmin sees only their dashboard
    if (session?.user?.role === "SuperAdmin") {
      return [
        { name: "Super Admin", href: "/superadmin", icon: Shield },
        { name: "Manage Users", href: "/users", icon: UserCog },
      ];
    }

    // HospitalAdmin sees hospital operations + user management
    if (session?.user?.role === "HospitalAdmin") {
      return [
        ...baseNavigation,
        { name: "Bed Management", href: "/beds", icon: Bed },
        { name: "Patients", href: "/patients", icon: Users },
        { name: "Insurance & Claims", href: "/claims", icon: FileText },
        { name: "Manage Users", href: "/users", icon: UserCog },
      ];
    }

    // BasicUser sees only hospital operations
    return [
      ...baseNavigation,
      { name: "Bed Management", href: "/beds", icon: Bed },
      { name: "Patients", href: "/patients", icon: Users },
      { name: "Insurance & Claims", href: "/claims", icon: FileText },
    ];
  };

  const navigation = getNavigation();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-black border-r border-white/10 transition-all duration-300 animate-slide-in-left",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Logo */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center space-x-3 group">
            <div className="relative">
              <Activity className="h-10 w-10 text-white group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 h-10 w-10 bg-white/20 rounded-full blur-lg group-hover:bg-white/30 transition-all duration-300"></div>
            </div>
            <span className="font-black text-2xl text-white">DokLink</span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto relative group">
            <Activity className="h-10 w-10 text-white group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 h-10 w-10 bg-white/20 rounded-full blur-lg group-hover:bg-white/30 transition-all duration-300"></div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200 group"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      {/* Hospital & User Info */}
      {session && !collapsed && (
        <div className="px-6 py-6 border-b border-white/10 bg-white/5">
          {session.user.role !== "SuperAdmin" && (
            <div className="flex items-center space-x-3 mb-4">
              <Building2 className="h-5 w-5 text-white" />
              <span className="text-sm font-bold text-white truncate">
                {session.user.hospitalName}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <UserCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-white/70 truncate">
                {session.user.role}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group animate-slide-in-left hover-lift relative",
                isActive
                  ? "bg-white text-black shadow-lg transform scale-105"
                  : "text-white hover:bg-white/10 hover:text-white",
                collapsed ? "justify-center" : "justify-start"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <item.icon
                className={cn(
                  "h-6 w-6 transition-all duration-300 group-hover:scale-110 flex-shrink-0",
                  isActive ? "text-black" : "text-white"
                )}
              />
              {!collapsed && (
                <span className="ml-4 font-semibold">{item.name}</span>
              )}
              {isActive && !collapsed && (
                <div className="absolute right-2 w-2 h-2 bg-black rounded-full animate-scale-in"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10">
        {session && (
          <button
            onClick={handleLogout}
            className="w-full h-14 flex items-center justify-center hover:bg-red-500/20 hover:text-red-200 transition-all duration-300 text-white group"
            title="Logout"
          >
            <LogOut className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
            {!collapsed && <span className="ml-4 text-sm font-semibold">Logout</span>}
          </button>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full h-14 flex items-center justify-center border-t border-white/10 hover:bg-white/10 transition-all duration-300 text-white group"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 group-hover:scale-110 transition-transform" />
          ) : (
            <ChevronLeft className="h-5 w-5 group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>
    </div>
  );
}
