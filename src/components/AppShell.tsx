"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

export default function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-full">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={`flex min-h-full w-full flex-1 flex-col transition-[margin] duration-200 ${
          collapsed ? "lg:ml-[76px]" : "lg:ml-64"
        }`}
      >
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="inline-flex shrink-0 items-center justify-center rounded-md bg-white px-1.5 py-1">
              <Image
                src="/logo.png"
                alt="Great Lakes Institute of Management, Gurgaon — Finception"
                width={876}
                height={412}
                className="h-7 w-auto"
              />
            </span>
            <span className="font-label truncate text-[10px] text-muted">Neev &ndash; by FINception</span>
          </Link>
        </header>

        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
