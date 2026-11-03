import { useState } from "react";
import { Check, X } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Input } from "@/shared/ui/Input";
import { cn } from "@/shared/lib/cn";
import { REMINDER_LIST_COLORS, REMINDER_LIST_ICONS, reminderListIcon } from "@/shared/lib/reminderAppearance";
import { useCreateReminderList } from "@/entities/reminder-list/api/queries";
import { toast } from "sonner";

interface CreateReminderListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (listId: number) => void;
}

export function CreateReminderListModal({ isOpen, onClose, onCreated }: CreateReminderListModalProps) {
  const createList = useCreateReminderList();
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(REMINDER_LIST_COLORS[5]);
  const [icon, setIcon] = useState("list");
  const Icon = reminderListIcon(icon);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Liste adı yazın");
      return;
    }
    try {
      const created = await createList.mutateAsync({ name: name.trim(), color, icon });
      toast.success("Liste oluşturuldu");
      setName("");
      setColor(REMINDER_LIST_COLORS[5]);
      setIcon("list");
      onCreated?.(created.id);
      onClose();
    } catch {
      toast.error("Liste oluşturulamadı");
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showClose={false} className="bg-[#1c1c1e] dark:bg-[#1c1c1e]">
      <div className="-mx-6 -mt-4 space-y-5 px-1">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-shell-muted hover:bg-white/10" aria-label="Kapat">
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-base font-semibold text-shell-fg">Yeni Liste</h2>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={createList.isPending}
            className="rounded-full p-1.5 text-blue-400 hover:bg-white/10 disabled:opacity-40"
            aria-label="Kaydet"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white/5 px-4 py-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-full text-white" style={{ backgroundColor: color }}>
            <Icon className="h-7 w-7" />
          </span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Liste Adı"
            className="border-0 bg-white/10 text-center"
          />
        </div>

        <div className="grid grid-cols-6 justify-items-center gap-3 rounded-2xl bg-white/5 px-4 py-4">
          {REMINDER_LIST_COLORS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setColor(value)}
              className={cn("h-8 w-8 rounded-full", color === value && "ring-2 ring-white ring-offset-2 ring-offset-[#1c1c1e]")}
              style={{ backgroundColor: value }}
              aria-label={`Renk ${value}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-6 justify-items-center gap-3 rounded-2xl bg-white/5 px-4 py-4">
          {REMINDER_LIST_ICONS.map((item) => {
            const Glyph = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setIcon(item.key)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80",
                  icon === item.key && "bg-white/20 text-white ring-2 ring-white/70",
                )}
                aria-label={item.key}
              >
                <Glyph className="h-5 w-5" />
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
