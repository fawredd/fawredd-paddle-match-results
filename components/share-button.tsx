import { Share } from "lucide-react";
import { Button } from "./ui/button";

interface ShareButtonProps {
    url: string;
    text?: string; // Optional text to include in the share message
}

const ShareButton = ({ url, text}:ShareButtonProps) => {
  const handleShare = () => {
    const encodedText = encodeURIComponent(text ? `${text} ${url}` : url);
    window.open(`https://wa.me/?text=${encodedText}`, "_blank");
  };

  return (
      <Button variant="outline" size="sm" onClick={handleShare} className="flex items-center gap-1">
        <Share className="h-4 w-4" />
        <span>Share</span>
      </Button>
  )
};

export default ShareButton;
