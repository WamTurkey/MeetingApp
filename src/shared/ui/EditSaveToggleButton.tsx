import { Pencil, Check } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/shared/lib/cn";

export interface EditSaveToggleButtonProps {
  isEditing: boolean;
  onToggle: (newIsEditing: boolean) => void;
  className?: string;
}

export function EditSaveToggleButton({
  isEditing,
  onToggle,
  className,
}: EditSaveToggleButtonProps) {
  return (
    <Button
      variant={isEditing ? "primary" : "outline"}
      size="icon"
      className={cn("transition-colors duration-200", className)}
      onClick={() => onToggle(!isEditing)}
      title={isEditing ? "Kaydet" : "Düzenle"}
      icon={
        isEditing ? (
          <Check className="h-4 w-4" />
        ) : (
          <Pencil className="h-4 w-4" />
        )
      }
    />
  );
}
