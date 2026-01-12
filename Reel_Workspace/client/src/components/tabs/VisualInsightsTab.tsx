import { Reel } from "@/types/reel";
import {
  Eye,
  Wrench,
  Globe,
  List,
  BarChart,
  DollarSign,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VisualInsightsTabProps {
  reel: Reel;
}

interface InsightSectionProps {
  icon: React.ReactNode;
  title: string;
  items: Array<{ value: string; context?: string; metadata?: any }>;
  color: string;
  clickable?: boolean;
}

function InsightSection({
  icon,
  title,
  items,
  color,
  clickable,
}: InsightSectionProps) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    orange: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    green: "bg-green-500/10 text-green-600 border-green-500/20",
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  };

  const colorClass =
    colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClass}`}>{icon}</div>
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <Badge variant="outline" className="ml-auto">
          {items.length} {items.length === 1 ? "item" : "items"}
        </Badge>
      </div>

      <ul className="space-y-2.5">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/40 hover:border-primary/30 transition-colors"
          >
            <div className="flex-1">
              {clickable && item.metadata?.url ? (
                <a
                  href={
                    item.metadata.url.startsWith("http")
                      ? item.metadata.url
                      : `https://${item.value}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/90 font-medium hover:text-primary transition-colors underline"
                >
                  {item.value}
                </a>
              ) : (
                <span className="text-foreground/90 font-medium">
                  {item.value}
                </span>
              )}
              {item.context && (
                <p className="text-sm text-muted-foreground mt-1">
                  {item.context}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function VisualInsightsTab({ reel }: VisualInsightsTabProps) {
  const insights = reel.visualInsights;
  const metadata = reel.multimodalMetadata;

  // Check if we have any visual insights
  const hasAnyInsights =
    insights &&
    ((insights.toolsAndPlatforms?.items.length ?? 0) > 0 ||
      (insights.websitesAndUrls?.items.length ?? 0) > 0 ||
      (insights.brandsAndProducts?.items.length ?? 0) > 0 ||
      (insights.listsAndSequences?.items.length ?? 0) > 0 ||
      (insights.numbersAndMetrics?.items.length ?? 0) > 0 ||
      (insights.pricesAndCosts?.items.length ?? 0) > 0 ||
      (insights.recommendations?.items.length ?? 0) > 0);

  if (!metadata?.hasVisualText || !hasAnyInsights) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-full bg-muted/50 mb-4">
          <Eye className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Visual Text Detected</h3>
        <p className="text-muted-foreground max-w-md">
          This reel doesn't contain visible text or on-screen information that
          could be extracted.
        </p>
        {metadata && !metadata.hasVisualText && (
          <p className="text-sm text-muted-foreground mt-2">
            Processed {metadata.frameCount} frames
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <Eye className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Visual Insights</h3>
            <p className="text-sm text-muted-foreground">
              Extracted from {metadata?.frameCount || 0} video frames
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-600/30">
          <Eye className="w-3 h-3 mr-1" />
          On-screen
        </Badge>
      </div>

      {/* Tools & Platforms */}
      {insights.toolsAndPlatforms &&
        insights.toolsAndPlatforms.items.length > 0 && (
          <InsightSection
            icon={<Wrench className="w-5 h-5" />}
            title="Tools & Platforms"
            items={insights.toolsAndPlatforms.items}
            color="blue"
          />
        )}

      {/* Websites & URLs */}
      {insights.websitesAndUrls &&
        insights.websitesAndUrls.items.length > 0 && (
          <InsightSection
            icon={<Globe className="w-5 h-5" />}
            title="Websites & Links"
            items={insights.websitesAndUrls.items}
            color="purple"
            clickable
          />
        )}

      {/* Brands & Products */}
      {insights.brandsAndProducts &&
        insights.brandsAndProducts.items.length > 0 && (
          <InsightSection
            icon={<Lightbulb className="w-5 h-5" />}
            title="Brands & Products"
            items={insights.brandsAndProducts.items}
            color="orange"
          />
        )}

      {/* Lists & Sequences */}
      {insights.listsAndSequences &&
        insights.listsAndSequences.items.length > 0 && (
          <InsightSection
            icon={<List className="w-5 h-5" />}
            title="Key Lists"
            items={insights.listsAndSequences.items}
            color="orange"
          />
        )}

      {/* Numbers & Metrics */}
      {insights.numbersAndMetrics &&
        insights.numbersAndMetrics.items.length > 0 && (
          <InsightSection
            icon={<BarChart className="w-5 h-5" />}
            title="Numbers & Metrics"
            items={insights.numbersAndMetrics.items}
            color="green"
          />
        )}

      {/* Prices & Costs */}
      {insights.pricesAndCosts && insights.pricesAndCosts.items.length > 0 && (
        <InsightSection
          icon={<DollarSign className="w-5 h-5" />}
          title="Prices & Costs"
          items={insights.pricesAndCosts.items}
          color="emerald"
        />
      )}

      {/* Recommendations */}
      {insights.recommendations &&
        insights.recommendations.items.length > 0 && (
          <InsightSection
            icon={<Lightbulb className="w-5 h-5" />}
            title="Recommendations"
            items={insights.recommendations.items}
            color="blue"
          />
        )}
    </div>
  );
}
