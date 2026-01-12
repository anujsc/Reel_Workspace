import { useState } from "react";
import { Reel } from "../lib/types";
import { AIInsightsTab } from "./tabs/AIInsightsTab";
import { TranscriptTab } from "./tabs/TranscriptTab";
import { LearnQuizTab } from "./tabs/LearnQuizTab";
import { VisualInsightsTab } from "./tabs/VisualInsightsTab";
import { cn } from "@/lib/utils";
import { Sparkles, FileText, GraduationCap, Eye } from "lucide-react";

interface ReelKnowledgeProps {
  reel: Reel;
}

type TabType = "insights" | "visual" | "learn" | "transcript";

export function ReelKnowledge({ reel }: ReelKnowledgeProps) {
  const [activeTab, setActiveTab] = useState<TabType>("insights");

  const tabs = [
    { id: "insights" as TabType, label: "AI Insights", icon: Sparkles },
    { id: "visual" as TabType, label: "Visual Insights", icon: Eye },
    { id: "learn" as TabType, label: "Learn & Quiz", icon: GraduationCap },
    { id: "transcript" as TabType, label: "Transcript", icon: FileText },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Tabs with Icons */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex gap-1 overflow-x-auto hide-scrollbar px-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 rounded-t-lg",
                  activeTab === tab.id
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content with Animation */}
      <div className="flex-1 py-6 animate-fade-in">
        {activeTab === "insights" && <AIInsightsTab reel={reel} />}
        {activeTab === "visual" && <VisualInsightsTab reel={reel} />}
        {activeTab === "learn" && <LearnQuizTab reel={reel} />}
        {activeTab === "transcript" && <TranscriptTab reel={reel} />}
      </div>
    </div>
  );
}
