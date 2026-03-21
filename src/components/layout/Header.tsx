import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { AuthButton } from "@/components/auth/AuthButton";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileNav } from "./MobileNav";
import { Logo } from "@/components/ui/Logo";
import { NotificationBellWrapper } from "@/components/notifications/NotificationBellWrapper";
import { SearchBar } from "@/components/search/SearchBar";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AdminLink } from "@/components/admin/AdminLink";

export function Header() {
  const t = useTranslations("navigation");

  const links = [
    { href: "/", label: t("home") },
    { href: "/feed", label: t("community") },
    { href: "/articles", label: t("articles") },
    { href: "/tools", label: t("tools") },
    { href: "/messages", label: t("messages") },
    { href: "/about", label: t("about") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl dark:border-gray-700/80 dark:bg-gray-900/80">
      <Container>
        <div className="relative flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo className="h-8 w-8 transition-transform group-hover:scale-105" />
            <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-xl font-bold tracking-tight text-transparent">
              Synapse
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-primary-50 hover:text-primary-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-primary-400"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <SearchBar />
            <ThemeToggle />
            <NotificationBellWrapper />
            <AdminLink />
            <LocaleSwitcher />
            <AuthButton />
          </div>

          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
