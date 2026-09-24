"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/capture", label: "Capture" },
  { href: "/community", label: "Community" },
  { href: "/talk-exercises", label: "Talk & Exercises" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#080B12]/70 backdrop-blur-md">
      <div className="flex h-[68px] items-center justify-between px-8">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-85">
          <span className="relative inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full shadow-[0_0_22px_rgba(34,211,238,0.65)]">
            <Image src="/figma-home/v21_5778.png" alt="emo logo" fill className="object-cover" />
          </span>
          <span className="font-display text-[20px] font-bold text-[#f1f4fa]">emo</span>
        </Link>
        <nav className="flex items-center gap-1 text-[13px] font-medium">
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  active
                    ? "rounded-full bg-white px-4 py-[9px] text-[#0b1119] transition hover:brightness-95"
                    : "rounded-full px-4 py-[9px] text-white/60 transition hover:bg-white/10 hover:text-white"
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
