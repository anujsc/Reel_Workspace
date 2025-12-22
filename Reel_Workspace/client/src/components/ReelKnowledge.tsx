import { useState } from "react";
import { Reel } from "../lib/types";
import { AIInsightsTab } from "./tabs/AIInsightsTab";
import { TranscriptTab } from "./tabs/TranscriptTab";
import { LearnQuizTab } from "./tabs/LearnQuizTab";
import { OCRTab } from "./tabs/OCRTab";
import { cn } from "@/lib/utils";

interface ReelKnowledgeProps {
  reel: Reel;
}

type TabType = "insights" | "transcript" | "learn" | "ocr";

export function ReelKnowledge({ reel }: ReelKnowledgeProps) {
  const [activeTab, setActiveTab] = useState<TabType>("insights");

  const tabs = [
    { id: "insights" as TabType, label: "AI Insights" },
    { id: "transcript" as TabType, label: "Transcript" },
    { id: "learn" as TabType, label: "Learn & Quiz" },
    { id: "ocr" as TabType, label: "OCR & Visuals" },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {activeTab === "insights" && <AIInsightsTab reel={reel} />}
        {activeTab === "transcript" && <TranscriptTab reel={reel} />}
        {activeTab === "learn" && <LearnQuizTab reel={reel} />}
        {activeTab === "ocr" && <OCRTab reel={reel} />}
      </div>
    </div>
  );
}
