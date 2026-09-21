import Link from "next/link";
import { LayoutDashboard, Package, Store, Activity, LogOut } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/retailers", label: "Retailers", icon: Store },
  { href: "/admin/data-collection", label: "Data Collection", icon: Activity },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <aside className="w-52 shrink-0">
        <div className="sticky top-20">
          <div className="mb-4 px-2 text-sm font-semibold text-muted-foreground">Admin</div>
          <nav className="space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-secondary"
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <form action="/api/admin/logout" method="POST" className="mt-6">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-secondary"
            >
              <LogOut className="size-4" /> Log out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
