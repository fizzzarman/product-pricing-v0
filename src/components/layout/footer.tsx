import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="font-bold text-lg mb-2">
            <span className="text-primary">Daam</span>Koto
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Compare computer &amp; electronics hardware prices and availability across
            Bangladesh&apos;s retailers. Search → Compare → Decide → Visit retailer.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Popular Categories</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/categories/laptop" className="hover:text-foreground">Laptops</Link></li>
            <li><Link href="/categories/gpu" className="hover:text-foreground">Graphics Cards</Link></li>
            <li><Link href="/categories/cpu" className="hover:text-foreground">Processors</Link></li>
            <li><Link href="/categories/monitor" className="hover:text-foreground">Monitors</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">More</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/categories/ssd" className="hover:text-foreground">SSDs</Link></li>
            <li><Link href="/categories/keyboard" className="hover:text-foreground">Keyboards</Link></li>
            <li><Link href="/categories/mouse" className="hover:text-foreground">Mice</Link></li>
            <li><Link href="/retailers" className="hover:text-foreground">All Retailers</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">About</h3>
          <p className="text-sm text-muted-foreground">
            Prices and stock are collected from participating retailers and may change.
            Always confirm final price and availability on the retailer&apos;s own site
            before purchasing.
          </p>
        </div>
      </div>

      <div className="border-t px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} DaamKoto. Not affiliated with any retailer listed.
      </div>
    </footer>
  );
}
