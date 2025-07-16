interface ShareButtonProps {
    url: string;
    text?: string; // Optional text to include in the share message
}

const ShareButton = ({ url, text}:ShareButtonProps) => {
  const handleShare = () => {
    const encodedText = encodeURIComponent(text ? `${text} ${url}` : url);
    window.open(`https://wa.me/?text=${encodedText}`, "_blank");
  };

  return <button onClick={handleShare}>Share</button>;
};

export default ShareButton;
