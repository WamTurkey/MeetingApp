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
  onAddNote?: (data: NoteCreatePayload) => void;
  onDeleteNote?: (noteId: number) => void;
  onReorderNotes?: (reorderedNotes: Note[]) => void;
}

export function NotesPanel({
  notes,
  meetingId,
  editable = true,
  onAddNote,
  onDeleteNote,
  onReorderNotes,
}: NotesPanelProps) {
  const [showForm, setShowForm] = useState(false);

  function handleAdd(data: NoteCreatePayload) {
    onAddNote?.(data);
    setShowForm(false);
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

      {/* Add form */}
      {showForm && (
        <div className="border-b border-border-muted px-5 py-4">
          <AddNoteForm
            meetingId={meetingId}
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Note list */}
      <div className="p-4">
        {notes.length === 0 ? (
          <EmptyState
            title="Henüz not eklenmemiş"
            description="Toplantı notlarını, kararlarını ve görevlerini buradan ekleyebilirsiniz."
            icon={<StickyNote className="h-8 w-8" />}
          />
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="notes-list">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
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
                          className={`group relative flex gap-2 ${
                            snapshot.isDragging ? "z-50 opacity-90 shadow-xl ring-2 ring-ring rounded-lg" : ""
                          }`}
                        >
                          {editable && (
                            <div
                              {...provided.dragHandleProps}
                              className="flex items-center justify-center px-1 text-fg-muted/50 hover:text-fg-muted cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="h-5 w-5" />
                            </div>
                          )}
                          <div className="flex-1">
                            <NoteRow note={note} />
                          </div>
                          {editable && onDeleteNote && (
                            <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
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
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
