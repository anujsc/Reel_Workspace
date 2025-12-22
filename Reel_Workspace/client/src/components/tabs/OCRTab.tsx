import { Reel } from "../../lib/types";
import { FileText } from "lucide-react";

interface OCRTabProps {
  reel: Reel;
}

export function OCRTab({ reel }: OCRTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Extracted Text from Video
      </h3>
      <div className="calm-card">
        {reel.ocrText ? (
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {reel.ocrText}
          </p>
        ) : (
          <p className="text-muted-foreground italic">
            No text was detected in this video
          </p>
        )}
      </div>
    </div>
  );
}
