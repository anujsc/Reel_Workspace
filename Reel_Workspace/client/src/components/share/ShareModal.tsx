import { useState, useEffect, useCallback } from "react";
import {
  X,
  MessageCircle,
  Facebook as FacebookIcon,
  Twitter,
  Linkedin,
  Send,
  Instagram,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader, InlineLoader } from "@/components/Loader";
import { CopyLinkInput } from "./CopyLinkInput";
import { SocialShareButton } from "./SocialShareButton";
import { ExpirySelector } from "./ExpirySelector";
import { ShareToggle } from "./ShareToggle";
import { ShareAnalytics } from "./ShareAnalytics";
import { useShareAnalytics } from "@/hooks/useShareAnalytics";
import api from "@/services/api";
import { cn } from "@/lib/utils";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
  folderName: string;
}

export function ShareModal({
  isOpen,
  onClose,
  folderId,
  folderName,
}: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(7);
  const { toast } = useToast();
  const { analytics, refetch: refetchAnalytics } = useShareAnalytics(
    folderId,
    isOpen
  );

  // Fetch share status on mount
  useEffect(() => {
    if (isOpen && folderId) {
      fetchShareStatus();
    }
  }, [isOpen, folderId]);

  const fetchShareStatus = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/share/folder/${folderId}/status`);
      if (response.data.data.isShared) {
        setShareUrl(response.data.data.shareUrl);
      } else {
        setShareUrl("");
      }
    } catch (error) {
      console.error("Error fetching share status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateShare = async () => {
    setIsCreating(true);
    try {
      const response = await api.post(`/api/share/folder/${folderId}`, {
        expiresInDays,
      });
      setShareUrl(response.data.data.shareUrl);
      await refetchAnalytics();
      toast({
        title: "Share link created!",
        description: "Your collection is now shareable",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to create share link",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeactivateShare = async () => {
    try {
      await api.delete(`/api/share/folder/${folderId}`);
      setShareUrl("");
      await refetchAnalytics();
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

  const handleToggleShare = async (active: boolean) => {
    if (active && !shareUrl) {
      await handleCreateShare();
    } else if (!active && shareUrl) {
      await handleDeactivateShare();
    }
  };

  const shareOnPlatform = useCallback(
    (platform: string) => {
      if (!shareUrl) return;

      const text = `Check out my "${folderName}" collection!`;
      const encodedUrl = encodeURIComponent(shareUrl);
      const encodedText = encodeURIComponent(text);

      const urls: Record<string, string> = {
        whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
        instagram: `https://www.instagram.com/`,
      };

      if (urls[platform]) {
        window.open(urls[platform], "_blank", "width=600,height=400");
      }
    },
    [shareUrl, folderName]
  );

  const isShared = !!shareUrl;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[480px] p-0 gap-0 overflow-hidden"
        aria-describedby="share-modal-description"
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-white to-slate-50 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="pr-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Share Your Knowledge
            </h2>
            <p className="text-sm text-gray-600" id="share-modal-description">
              Share{" "}
              <span className="font-medium text-gray-900">{folderName}</span>{" "}
              with others
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="md" />
            </div>
          ) : (
            <>
              {/* Share Toggle */}
              <ShareToggle
                isActive={isShared}
                onToggle={handleToggleShare}
                disabled={isCreating}
              />

              {!isShared ? (
                /* Create Share Section */
                <div className="space-y-4">
                  <ExpirySelector
                    value={expiresInDays}
                    onChange={setExpiresInDays}
                    disabled={isCreating}
                  />

                  <Button
                    onClick={handleCreateShare}
                    disabled={isCreating}
                    className="w-full h-12 text-base font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    {isCreating ? (
                      <>
                        <InlineLoader className="mr-2" />
                        Creating Share Link...
                      </>
                    ) : (
                      "Create Share Link"
                    )}
                  </Button>
                </div>
              ) : (
                /* Active Share Section */
                <>
                  {/* Analytics */}
                  {analytics && (
                    <ShareAnalytics
                      viewCount={analytics.viewCount}
                      expiresAt={analytics.expiresAt}
                      createdAt={analytics.createdAt}
                    />
                  )}

                  {/* Copy Link */}
                  <CopyLinkInput url={shareUrl} />

                  {/* Social Media Sharing */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Share on Social Media
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <SocialShareButton
                        icon={MessageCircle}
                        label="WhatsApp"
                        onClick={() => shareOnPlatform("whatsapp")}
                        brandColor="whatsapp"
                      />
                      <SocialShareButton
                        icon={FacebookIcon}
                        label="Facebook"
                        onClick={() => shareOnPlatform("facebook")}
                        brandColor="facebook"
                      />
                      <SocialShareButton
                        icon={Twitter}
                        label="Twitter"
                        onClick={() => shareOnPlatform("twitter")}
                        brandColor="twitter"
                      />
                      <SocialShareButton
                        icon={Linkedin}
                        label="LinkedIn"
                        onClick={() => shareOnPlatform("linkedin")}
                        brandColor="linkedin"
                      />
                      <SocialShareButton
                        icon={Send}
                        label="Telegram"
                        onClick={() => shareOnPlatform("telegram")}
                        brandColor="telegram"
                      />
                      <SocialShareButton
                        icon={Instagram}
                        label="Instagram"
                        onClick={() => shareOnPlatform("instagram")}
                        brandColor="instagram"
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
