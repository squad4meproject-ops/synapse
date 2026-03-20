import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { AuthButton } from "@/components/auth/AuthButton";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileNav } from "./MobileNav";

export function Header() {
  const t = useTranslations("navigation");

  const links = [
    { href: "/", label: t("home") },
    { href: "/feed", label: t("community") },
    { href: "/articles", label: t("articles") },
    { href: "/tools", label: t("tools") },
    { href: "/about", label: t("about") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <Container>
        <div className="relative flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary-600">Synapse</span>
          </Link>

          <nav className="hidden items-center space-x-8 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700 transition-colors hover:text-primary-600"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center space-x-4 md:flex">
            <LocaleSwitcher />
            <AuthButton />
          </div>

          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
