import { useState, useEffect } from "react";
import { Plus, StickyNote, GripVertical, Mic } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { NoteRow } from "@/entities/note/ui/NoteRow";
import { AddNoteForm } from "@/features/note/AddNoteForm";
import { DeleteNoteButton } from "@/features/note/DeleteNoteButton";
import type { Note, NoteCreatePayload } from "@/entities/note/model";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { VoiceRecorderPanel } from "@/features/voice-note";
import { SavedVoiceNotesPanel } from "@/widgets/voice-notes";
import { Modal } from "@/shared/ui/Modal";
import { useIsMobile } from "@/shared/hooks/useIsMobile";

interface NotesPanelProps {
  notes: Note[];
  meetingId: number;
  editable?: boolean;
  onAddNote?: (data: NoteCreatePayload, insertIndex?: number) => void | Promise<void>;
  onUpdateNote?: (noteId: number, data: Partial<NoteCreatePayload>) => void;
  onDeleteNote?: (noteId: number) => void;
  onReorderNotes?: (reorderedNotes: Note[]) => void;
}

export function NotesPanel({
  notes,
  meetingId,
  editable = true,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onReorderNotes,
}: NotesPanelProps) {
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [draftNoteContent, setDraftNoteContent] = useState("");
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && selectedIndex !== null) {
        // Only handle if not already handled by a textarea
        if (document.activeElement?.tagName !== "TEXTAREA") {
          setInsertIndex(selectedIndex);
        }
      } else if (e.key === "Escape") {
        setSelectedIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex]);

  const handleRowClick = (e: React.MouseEvent, index: number) => {
    const target = e.target as HTMLElement;
    if (["INPUT", "TEXTAREA", "SELECT", "BUTTON", "SVG", "PATH"].some(tag => target.closest(tag))) {
      if (selectedIndex !== index) setSelectedIndex(index);
      return;
    }
    setSelectedIndex(selectedIndex === index ? null : index);
  };

  async function handleAdd(data: NoteCreatePayload) {
    if (insertIndex !== null && insertIndex >= 0) {
      await onAddNote?.(data, insertIndex + 1);
      setInsertIndex(isMobile ? null : insertIndex + 1);
    } else {
      await onAddNote?.(data);
      if (isMobile) setInsertIndex(null);
    }
    setDraftNoteContent("");
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    
    const startIndex = result.source.index;
    const endIndex = result.destination.index;
    
    if (startIndex === endIndex) return;

    const reordered = Array.from(notes);
    const [removed] = reordered.splice(startIndex, 1);
    if (removed) reordered.splice(endIndex, 0, removed);
    
    onReorderNotes?.(reordered);
  }

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border-muted px-4 py-3 md:px-5 md:py-4">
        <div className="flex min-w-0 items-center gap-2">
          <StickyNote className="h-5 w-5 shrink-0 text-fg-muted" />
          <h3 className="font-semibold text-fg">Notlar</h3>
          <span className="rounded-full bg-bg-muted px-2 py-0.5 text-xs font-medium text-fg-secondary">
            {notes.length}
          </span>
        </div>
        {editable && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setInsertIndex(-1)}
          >
            Not Ekle
          </Button>
        )}
      </div>

      <div className="p-0">
        {notes.length === 0 ? (
          <div className="flex flex-col">
            <div className="p-4">
              <EmptyState
                title="Henüz not eklenmemiş"
                description="Toplantı notlarını, kararlarını ve görevlerini buradan ekleyebilirsiniz."
                icon={<StickyNote className="h-8 w-8" />}
              />
            </div>
            {editable && !isMobile && insertIndex === -1 && (
              <div className="w-full">
                <AddNoteForm
                  meetingId={meetingId}
                  initialContent={draftNoteContent}
                  onSubmit={handleAdd}
                  onCancel={() => {
                    setInsertIndex(null);
                    setDraftNoteContent("");
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="w-full min-w-0">
            <div className="hidden items-center gap-2 border-b border-surface-200 bg-surface-100 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-surface-500 md:flex dark:border-surface-700 dark:bg-surface-800/50">
              {editable && <div className="w-6 shrink-0" />}
              <div className="w-24 shrink-0">Ekleyen</div>
              <div className="min-w-0 flex-1">Karar / Görev metni</div>
              <div className="w-24 shrink-0 text-center">ID</div>
              <div className="w-28 shrink-0">Tür</div>
              <div className="w-64 shrink-0">Termin & Sorumlu</div>
              {editable && onDeleteNote && <div className="w-8 shrink-0" />}
            </div>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="notes-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex flex-col"
                  >
                    {notes.map((note, index) => (
                      <Draggable
                        key={note.id.toString()}
                        draggableId={note.id.toString()}
                        index={index}
                        isDragDisabled={!editable}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`group relative flex flex-col transition-all ${
                              snapshot.isDragging ? "z-50 opacity-90 shadow-xl ring-2 ring-ring bg-white dark:bg-surface-800" : ""
                            }`}
                          >
                            <div 
                              onClick={(e) => handleRowClick(e, index)}
                              className={`flex items-start gap-2 px-3 py-2 border-b border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-all ${
                                selectedIndex === index ? "ring-1 ring-inset ring-brand-500 bg-brand-50/30 dark:bg-brand-900/20 z-10" : ""
                              }`}
                            >
                              {editable && (
                                <div
                                  {...provided.dragHandleProps}
                                  className="w-6 shrink-0 pt-1.5 flex justify-center text-surface-300 hover:text-surface-500 cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <NoteRow 
                                  note={note} 
                                  editable={editable}
                                  onUpdate={onUpdateNote ? (data) => onUpdateNote(note.id, data) : undefined}
                                  onEnter={() => { setInsertIndex(index); setSelectedIndex(index); }}
                                />
                              </div>
                              {editable && onDeleteNote && (
                                <div className="w-8 shrink-0 pt-1 flex justify-end opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                                  <DeleteNoteButton
                                    note={note}
                                    onDelete={onDeleteNote}
                                  />
                                </div>
                              )}
                            </div>
                            
                            {!isMobile && insertIndex === index && (
                              <div className="w-full">
                                <AddNoteForm
                                  meetingId={meetingId}
                                  onSubmit={handleAdd}
                                  onCancel={() => setInsertIndex(null)}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            
            {/* Add Note Section (Bottom / Default) */}
            {editable && !isMobile && insertIndex === -1 && (
              <div className="w-full">
                <AddNoteForm
                  meetingId={meetingId}
                  initialContent={draftNoteContent}
                  onSubmit={handleAdd}
                  onCancel={() => {
                    setInsertIndex(null);
                    setDraftNoteContent("");
                  }}
                />
              </div>
            )}
          </div>
        )}

      </div>

      <div className="space-y-3 border-t border-border-muted px-4 py-3">
        {editable && (
          <>
            <button
              type="button"
              onClick={() => setShowVoiceRecorder((open) => !open)}
              className="flex items-center gap-2 text-left text-sm text-surface-600 dark:text-slate-200"
            >
              <Mic className="h-4 w-4 shrink-0 text-rose-500" />
              Sesli notu dikte edebilirsiniz
            </button>
            {showVoiceRecorder && (
              <VoiceRecorderPanel
                meetingId={meetingId}
                onTransferText={(text) => {
                  setDraftNoteContent(text);
                  setInsertIndex(-1);
                }}
                onSaveAsNote={async (text) => {
                  await onAddNote?.({ content: text, noteType: "NOTE" });
                }}
                onClose={() => setShowVoiceRecorder(false)}
              />
            )}
          </>
        )}
        <SavedVoiceNotesPanel
          meetingId={meetingId}
          editable={editable}
          embedded
          onAddToNotes={async (text) => {
            await onAddNote?.({ content: text, noteType: "NOTE" });
          }}
        />
      </div>

      {isMobile && insertIndex !== null && (
        <Modal
          isOpen
          onClose={() => {
            setInsertIndex(null);
            setDraftNoteContent("");
          }}
          title="Not Ekle"
          size="md"
        >
          <AddNoteForm
            meetingId={meetingId}
            layout="stacked"
            initialContent={draftNoteContent}
            onSubmit={handleAdd}
            onCancel={() => {
              setInsertIndex(null);
              setDraftNoteContent("");
            }}
          />
        </Modal>
      )}
    </div>
  );
}
