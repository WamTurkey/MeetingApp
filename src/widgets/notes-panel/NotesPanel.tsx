import { useState } from "react";
import { Plus, StickyNote, GripVertical } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { NoteRow } from "@/entities/note/ui/NoteRow";
import { AddNoteForm } from "@/features/note/AddNoteForm";
import { DeleteNoteButton } from "@/features/note/DeleteNoteButton";
import type { Note, NoteCreatePayload } from "@/entities/note/model";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

interface NotesPanelProps {
  notes: Note[];
  meetingId: number;
  editable?: boolean;
  onAddNote?: (data: NoteCreatePayload) => void | Promise<void>;
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
  const [showForm, setShowForm] = useState(false);

  async function handleAdd(data: NoteCreatePayload) {
    await onAddNote?.(data);
    // Form stays open so user can keep adding notes
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
    <div className="rounded-xl border border-border bg-bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-muted px-5 py-4">
        <div className="flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-fg-muted" />
          <h3 className="font-semibold text-fg">
            Notlar & Tutanaklar
          </h3>
          <span className="rounded-full bg-bg-muted px-2 py-0.5 text-xs font-medium text-fg-secondary">
            {notes.length}
          </span>
        </div>
        {editable && !showForm && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setShowForm(true)}
          >
            Not Ekle
          </Button>
        )}
      </div>



      {/* Note list */}
      <div className="p-0">
        {notes.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="Henüz not eklenmemiş"
              description="Toplantı notlarını, kararlarını ve görevlerini buradan ekleyebilirsiniz."
              icon={<StickyNote className="h-8 w-8" />}
            />
          </div>
        ) : (
          <div className="w-full">
            <div className="flex items-center gap-2 bg-surface-100 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700 px-3 py-2 text-xs font-semibold text-surface-500 uppercase tracking-wider">
              {editable && <div className="w-6 shrink-0" />}
              <div className="w-24 shrink-0">Ekleyen</div>
              <div className="flex-1 min-w-[200px]">Karar / Görev metni</div>
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
                            className={`group relative flex items-start gap-2 px-3 py-2 border-b border-surface-100 dark:border-surface-700/50 last:border-0 hover:bg-surface-50 dark:hover:bg-surface-700/30 ${
                              snapshot.isDragging ? "z-50 opacity-90 shadow-xl ring-2 ring-ring bg-white dark:bg-surface-800" : ""
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
                            <div className="flex-1 flex gap-2">
                              <NoteRow 
                                note={note} 
                                editable={editable}
                                onUpdate={onUpdateNote ? (data) => onUpdateNote(note.id, data) : undefined}
                                onEnter={() => setShowForm(true)}
                              />
                            </div>
                            {editable && onDeleteNote && (
                              <div className="w-8 shrink-0 pt-1 opacity-0 transition-opacity group-hover:opacity-100 flex justify-end">
                                <DeleteNoteButton
                                  note={note}
                                  onDelete={onDeleteNote}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {editable && (
                      <div className="mt-1">
                        {!showForm ? (
                          <div 
                            className="flex items-center gap-2 px-3 py-2 text-surface-500 hover:text-brand-600 hover:bg-surface-50 dark:hover:bg-surface-800/50 cursor-pointer rounded-lg text-sm transition-colors border border-transparent border-dashed hover:border-brand-200 dark:hover:border-brand-800"
                            onClick={() => setShowForm(true)}
                          >
                            <Plus className="h-4 w-4" />
                            <span>Yeni not ekle...</span>
                          </div>
                        ) : (
                          <div className="border border-brand-200 dark:border-brand-800 rounded-lg overflow-hidden shadow-sm shadow-brand-100/50 dark:shadow-none bg-white dark:bg-surface-900 mt-1">
                            <AddNoteForm
                              meetingId={meetingId}
                              onSubmit={handleAdd}
                              onCancel={() => setShowForm(false)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}
      </div>
    </div>
  );
}
