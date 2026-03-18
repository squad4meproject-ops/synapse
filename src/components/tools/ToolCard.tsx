import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { AiTool } from "@/types";

const pricingVariant = {
  free: "success" as const,
  freemium: "warning" as const,
  paid: "info" as const,
};

export function ToolCard({
  tool,
  translations,
}: {
  tool: AiTool;
  translations: { (key: string): string };
}) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-start gap-4">
        {tool.logo_url ? (
          <img
            src={tool.logo_url}
            alt={tool.name}
            className="h-12 w-12 rounded-lg object-contain"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-lg font-bold text-primary-600">
            {tool.name[0]}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            <Link href={`/tools/${tool.slug}`} className="hover:text-primary-600">
              {tool.name}
            </Link>
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <Badge>{tool.category}</Badge>
            <Badge variant={pricingVariant[tool.pricing]}>
              {translations(tool.pricing)}
            </Badge>
          </div>
        </div>
      </div>
      <p className="mt-3 flex-1 text-sm text-gray-600">{tool.description}</p>
    </Card>
  );
}
