"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "../solana/WalletButton";

export const Header = () => {
  const pathname = usePathname();
  const navElements = [
    {
      name: "Home",
      href: "/",
    },
    {
      name: "About",
      href: "/about",
    },
    {
      name: "Contact",
      href: "/contact",
    },
  ];

  return (
    <header className="flex w-full justify-between items-center px-5 py-3">
      <nav className="space-x-5">
        {navElements.map((navElement) => (
          <Link
            key={navElement.href}
            className={`link ${pathname === navElement.href ? "active" : ""}`}
            href={navElement.href}
          >
            {navElement.name}
          </Link>
        ))}
      </nav>

      <WalletButton />
    </header>
  );
};
