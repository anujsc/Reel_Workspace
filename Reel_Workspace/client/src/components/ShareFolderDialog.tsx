import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Check, X } from "lucide-react";
import api from "@/services/api";

interface ShareFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
  folderName: string;
}

export function ShareFolderDialog({
  isOpen,
  onClose,
  folderId,
  folderName,
}: ShareFolderDialogProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(7);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && folderId) {
      fetchShareStatus();
    }
  }, [isOpen, folderId]);

  const fetchShareStatus = async () => {
    try {
      const response = await api.get(`/api/share/folder/${folderId}/status`);
      if (response.data.data.isShared) {
        setShareUrl(response.data.data.shareUrl);
      }
    } catch (error) {
      console.error("Error fetching share status:", error);
    }
  };

  const handleCreateShare = async () => {
    setIsLoading(true);
    try {
      const response = await api.post(`/api/share/folder/${folderId}`, {
        expiresInDays,
      });
      setShareUrl(response.data.data.shareUrl);
      toast({
        title: "Share link created!",
        description: "Your folder is now shareable",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to create share link",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Share link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleDeactivateShare = async () => {
    try {
      await api.delete(`/api/share/folder/${folderId}`);
      setShareUrl("");
      toast({
        title: "Share deactivated",
        description: "The share link is no longer active",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to deactivate share",
        variant: "destructive",
      });
    }
  };

  const shareOnPlatform = (platform: string) => {
    const text = `Check out my "${folderName}" reel collection!`;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(text);

    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      instagram: `https://www.instagram.com/`, // Instagram doesn't support direct sharing via URL
    };

    if (urls[platform]) {
      window.open(urls[platform], "_blank", "width=600,height=400");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share "{folderName}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!shareUrl ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="expires">Link expires in (days)</Label>
                <Input
                  id="expires"
                  type="number"
                  min="1"
                  max="365"
                  value={expiresInDays || ""}
                  onChange={(e) =>
                    setExpiresInDays(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="Never expires"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for permanent link
                </p>
              </div>

              <Button
                onClick={handleCreateShare}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Creating..." : "Create Share Link"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="flex-1" />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Share on Social Media</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => shareOnPlatform("whatsapp")}
                    className="gap-2"
                  >
                    <span>💬</span> WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => shareOnPlatform("facebook")}
                    className="gap-2"
                  >
                    <span>📘</span> Facebook
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => shareOnPlatform("twitter")}
                    className="gap-2"
                  >
                    <span>🐦</span> Twitter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => shareOnPlatform("linkedin")}
                    className="gap-2"
                  >
                    <span>💼</span> LinkedIn
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => shareOnPlatform("telegram")}
                    className="gap-2"
                  >
                    <span>✈️</span> Telegram
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => shareOnPlatform("instagram")}
                    className="gap-2"
                  >
                    <span>📷</span> Instagram
                  </Button>
                </div>
              </div>

              <Button
                variant="destructive"
                onClick={handleDeactivateShare}
                className="w-full gap-2"
              >
                <X className="w-4 h-4" />
                Deactivate Share Link
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
