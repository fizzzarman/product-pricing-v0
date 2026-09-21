import Link from "next/link";
import { Scale, Store } from "lucide-react";
import { SearchBar } from "@/components/search/search-bar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold text-lg">
          <span className="text-primary">Daam</span>
          <span>Koto</span>
        </Link>

        <div className="hidden flex-1 md:block">
          <SearchBar />
        </div>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/compare">
              <Scale /> Compare
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/retailers">
              <Store /> Retailers
            </Link>
          </Button>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile search row — always visible, per spec's "search bar stays accessible on mobile" */}
      <div className="border-t px-4 py-2 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
