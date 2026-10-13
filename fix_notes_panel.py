file_path = "/Users/boravarol01gmail.com/Desktop/Toplantı/src/widgets/notes-panel/NotesPanel.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            onClick={(e) => handleRowClick(e, index)}
                            className={`group relative flex items-start gap-2 px-3 py-2 border-b border-surface-100 dark:border-surface-700/50 last:border-0 hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-all ${
                              snapshot.isDragging ? "z-50 opacity-90 shadow-xl ring-2 ring-ring bg-white dark:bg-surface-800" : ""
                            } ${
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
                            <div className="flex-1 flex flex-col gap-2">
                              <div className="flex w-full gap-2">
                                <NoteRow 
                                  note={note} 
                                  editable={editable}
                                  onUpdate={onUpdateNote ? (data) => onUpdateNote(note.id, data) : undefined}
                                  onEnter={() => { setInsertIndex(index); setSelectedIndex(index); }}
                                />
                                {editable && onDeleteNote && (
                                  <div className="w-8 shrink-0 pt-1 opacity-0 transition-opacity group-hover:opacity-100 flex justify-end">
                                    <DeleteNoteButton
                                      note={note}
                                      onDelete={onDeleteNote}
                                    />
                                  </div>
                                )}
                              </div>
                              {insertIndex === index && (
                                <div className="border border-brand-200 dark:border-brand-800 rounded-lg overflow-hidden shadow-sm shadow-brand-100/50 dark:shadow-none bg-white dark:bg-surface-900 mb-2">
                                  <AddNoteForm
                                    meetingId={meetingId}
                                    onSubmit={handleAdd}
                                    onCancel={() => setInsertIndex(null)}
                                  />
                                </div>
                              )}
                            </div>
                          </div>"""

replacement = """                          <div
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
                              <div className="flex-1 flex gap-2">
                                <NoteRow 
                                  note={note} 
                                  editable={editable}
                                  onUpdate={onUpdateNote ? (data) => onUpdateNote(note.id, data) : undefined}
                                  onEnter={() => { setInsertIndex(index); setSelectedIndex(index); }}
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
                            
                            {insertIndex === index && (
                              <div className="w-full">
                                <AddNoteForm
                                  meetingId={meetingId}
                                  onSubmit={handleAdd}
                                  onCancel={() => setInsertIndex(null)}
                                />
                              </div>
                            )}
                          </div>"""

content = content.replace(target, replacement)

bottom_target = """            {/* Add Note Section (Bottom / Default) */}
            {editable && insertIndex === -1 && (
              <div className="px-3 pb-3 pt-1">
                <div className="border border-brand-200 dark:border-brand-800 rounded-lg overflow-hidden shadow-sm shadow-brand-100/50 dark:shadow-none bg-white dark:bg-surface-900">
                  <AddNoteForm
                    meetingId={meetingId}
                    onSubmit={handleAdd}
                    onCancel={() => setInsertIndex(null)}
                  />
                </div>
              </div>
            )}"""

bottom_replacement = """            {/* Add Note Section (Bottom / Default) */}
            {editable && insertIndex === -1 && (
              <div className="w-full">
                <AddNoteForm
                  meetingId={meetingId}
                  onSubmit={handleAdd}
                  onCancel={() => setInsertIndex(null)}
                />
              </div>
            )}"""

content = content.replace(bottom_target, bottom_replacement)

empty_target = """            {editable && insertIndex === -1 && (
              <div className="px-3 pb-3">
                <div className="border border-brand-200 dark:border-brand-800 rounded-lg overflow-hidden shadow-sm shadow-brand-100/50 dark:shadow-none bg-white dark:bg-surface-900">
                  <AddNoteForm
                    meetingId={meetingId}
                    onSubmit={handleAdd}
                    onCancel={() => setInsertIndex(null)}
                  />
                </div>
              </div>
            )}"""

empty_replacement = """            {editable && insertIndex === -1 && (
              <div className="w-full">
                <AddNoteForm
                  meetingId={meetingId}
                  onSubmit={handleAdd}
                  onCancel={() => setInsertIndex(null)}
                />
              </div>
            )}"""

content = content.replace(empty_target, empty_replacement)

with open(file_path, "w") as f:
    f.write(content)
print("Updated NotesPanel layout to un-nest AddNoteForm")
