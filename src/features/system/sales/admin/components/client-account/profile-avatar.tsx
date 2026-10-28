import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  /** Our uploaded copy of the profile picture; initials when absent. */
  src: string | null;
  /** Translated alt text; omit when the name is printed beside it. */
  alt?: string;
  className?: string;
};

/** First letter of the first two words: "SASHA Wedding" → "SW". */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? "")
    .join("")
    .toUpperCase();
}

export function ProfileAvatar({ name, src, alt = "", className }: Props) {
  return (
    <Avatar className={cn("size-12", className)}>
      {src && <AvatarImage src={src} alt={alt} />}
      <AvatarFallback className="font-medium">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
