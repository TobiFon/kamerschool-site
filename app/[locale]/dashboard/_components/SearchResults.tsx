import { SearchResult } from "@/types/search";
import { CommandItem } from "@/components/ui/command";
import { CalendarDays, Megaphone, GraduationCap, User } from "lucide-react";

interface SearchResultItemProps {
  result: SearchResult;
  onSelect: (result: SearchResult) => void;
}

export function SearchResultItem({ result, onSelect }: SearchResultItemProps) {
  const getIcon = () => {
    switch (result.type) {
      case "announcement":
        return <Megaphone className="mr-2 h-4 w-4" />;
      case "calendar_event":
        return <CalendarDays className="mr-2 h-4 w-4" />;
      case "class":
        return <GraduationCap className="mr-2 h-4 w-4" />;
      case "student":
        return <User className="mr-2 h-4 w-4" />;
    }
  };

  const getLabel = () => {
    if (result.title) return result.title;
    if (result.full_name) return result.full_name;
    if (result.name) return result.name;
    return "";
  };

  const getSecondaryText = () => {
    if (result.type === "student" && result.matricule) {
      return (
        <span className="text-sm text-muted-foreground ml-6">
          {result.matricule}
        </span>
      );
    }
    if (result.type === "subject" && result.code) {
      return (
        <span className="text-sm text-muted-foreground ml-6">
          {result.code}
        </span>
      );
    }
    return null;
  };

  return (
    <CommandItem
      key={`${result.type}-${result.id}`}
      onSelect={() => onSelect(result)}
      className="flex items-center justify-between"
    >
      <div className="flex items-center">
        {getIcon()}
        <span>{getLabel()}</span>
      </div>
      {getSecondaryText()}
    </CommandItem>
  );
}
