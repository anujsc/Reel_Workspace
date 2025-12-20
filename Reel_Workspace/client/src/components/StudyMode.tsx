import { useState } from "react";
import { Reel, Folder } from "@/types/reel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Search, Copy, Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface StudyModeProps {
  reel: Reel;
  folders: Folder[];
  onBack: () => void;
  onUpdateReel?: (reel: Reel) => void;
}

type TabKey = 'summary' | 'transcript' | 'ocr';

export function StudyMode({ reel, folders, onBack, onUpdateReel }: StudyModeProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'summary', label: 'Summary' },
    { key: 'transcript', label: 'Transcript' },
    { key: 'ocr', label: 'Visual OCR' },
  ];

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-foreground/20 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : part
    );
  };

  const handleCopy = async (text: string, section: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleFolderChange = (folderId: string | null) => {
    if (onUpdateReel) {
      onUpdateReel({ ...reel, folderId: folderId || undefined });
    }
    setShowFolderDropdown(false);
  };

  const currentFolder = folders.find((f) => f.id === reel.folderId);

  const getContent = () => {
    switch (activeTab) {
      case 'summary':
        return (
          <ul className="space-y-2">
            {reel.summary.split('\n').filter(Boolean).map((point, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted-foreground">•</span>
                <span className="text-foreground">{highlightText(point.replace(/^[•-]\s*/, ''), searchQuery)}</span>
              </li>
            ))}
          </ul>
        );
      case 'transcript':
        return (
          <p className="leading-relaxed text-foreground">
            {highlightText(reel.transcript, searchQuery)}
          </p>
        );
      case 'ocr':
        return reel.ocrText ? (
          <pre className="leading-relaxed font-mono text-sm text-foreground whitespace-pre-wrap">
            {highlightText(reel.ocrText, searchQuery)}
          </pre>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No text detected in video frames
          </p>
        );
    }
  };

  const getCurrentText = () => {
    switch (activeTab) {
      case 'summary':
        return reel.summary;
      case 'transcript':
        return reel.transcript;
      case 'ocr':
        return reel.ocrText;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row animate-fade-in">
      {/* Header - Mobile Only */}
      <header className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground truncate flex-1">Study Mode</h1>
        </div>
      </header>

      {/* Left Column - Source Context (30%) */}
      <div className="lg:w-[30%] lg:min-w-[320px] lg:max-w-[400px] lg:h-screen lg:sticky lg:top-0 lg:border-r border-border p-4 lg:p-6">
        {/* Back Button - Desktop Only */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="hidden lg:flex items-center gap-2 mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="calm-card space-y-4">
          {/* Thumbnail */}
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
            <img
              src={reel.thumbnailUrl}
              alt={reel.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Title & Creator */}
          <div>
            <h2 className="font-semibold text-foreground mb-1">{reel.title}</h2>
            <p className="text-sm text-muted-foreground">@{reel.creatorHandle}</p>
          </div>

          {/* Watch on Instagram Button */}
          <Button variant="outline" className="w-full" asChild>
            <a href={reel.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Watch on Instagram
            </a>
          </Button>

          {/* Folder Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFolderDropdown(!showFolderDropdown)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <span>{currentFolder ? currentFolder.name : "No folder"}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            {showFolderDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 py-1">
                <button
                  onClick={() => handleFolderChange(null)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-secondary transition-colors",
                    !reel.folderId && "bg-secondary"
                  )}
                >
                  No folder
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => handleFolderChange(folder.id)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-secondary transition-colors",
                      reel.folderId === folder.id && "bg-secondary"
                    )}
                  >
                    {folder.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Knowledge Base (70%) */}
      <div className="flex-1 lg:h-screen lg:overflow-auto flex flex-col">
        {/* Tabs - Segmented Control */}
        <div className="sticky top-0 z-30 bg-background border-b border-border px-4 lg:px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex gap-1 p-1 bg-secondary rounded-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150",
                    activeTab === tab.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Copy Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(getCurrentText(), activeTab)}
              className="ml-auto"
            >
              {copiedSection === activeTab ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 lg:px-6 pb-2">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in content..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-4 lg:px-6 pb-24">
          <div className="calm-card">{getContent()}</div>
        </div>
      </div>
    </div>
  );
}
