import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { ToolCard } from "@/components/tools/ToolCard";
import type { AiTool } from "@/types";

export function FeaturedTools({ tools }: { tools: AiTool[] }) {
  const t = useTranslations("home");
  const tt = useTranslations("tools");

  if (!tools.length) return null;

  return (
    <section className="py-16">
      <Container>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">
            {t("featuredTools")}
          </h2>
          <Link
            href="/tools"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {t("viewAllTools")} &rarr;
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} translations={tt} />
          ))}
        </div>
      </Container>
    </section>
  );
}
