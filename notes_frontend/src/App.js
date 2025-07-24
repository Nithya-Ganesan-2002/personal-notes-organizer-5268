import React, { useState, useEffect } from "react";
import "./App.css";

/*
  PUBLIC_INTERFACE
  Notes Organizer App: Minimal, responsive notes organizer.
  Main structure: Sidebar (categories/tags), NotesList (main area), NoteEditor (modal), SearchBar.
  Uses localStorage for data persistence.
*/

const DEFAULT_TAGS = ["All notes", "Work", "Personal", "Ideas", "Archived"];
const DEMO_NOTES = [
  {
    id: "1",
    title: "Welcome to Notes!",
    body: "This is your first note. Start organizing your thoughts.",
    tags: ["Personal"],
    lastEdited: new Date().toISOString(),
  },
  {
    id: "2",
    title: "React Conversion Task",
    body: "Implement a minimal notes app using React with local storage.",
    tags: ["Work", "Ideas"],
    lastEdited: new Date().toISOString(),
  },
];

function getInitialNotes() {
  try {
    const stored = window.localStorage.getItem("notes__organizer_notes");
    if (stored) return JSON.parse(stored);
    window.localStorage.setItem(
      "notes__organizer_notes",
      JSON.stringify(DEMO_NOTES)
    );
    return DEMO_NOTES;
  } catch {
    return DEMO_NOTES;
  }
}

function setNotes(notes) {
  window.localStorage.setItem("notes__organizer_notes", JSON.stringify(notes));
}

/*
  Sidebar component: Tags and "New Note"
*/
function Sidebar({ tags, onSelectTag, selectedTag, onNewNote }) {
  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <div className="app-title">Notes</div>
      </header>
      <div className="sidebar-tags">
        {tags.map((tag) => (
          <button
            key={tag}
            className={
              "sidebar-tag" + (tag === selectedTag ? " sidebar-tag--active" : "")
            }
            onClick={() => onSelectTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      <button className="sidebar-new-btn" onClick={onNewNote}>
        + New Note
      </button>
      <div className="sidebar-spacer"></div>
    </aside>
  );
}

/*
  SearchBar component
*/
function SearchBar({ value, onChange }) {
  return (
    <div className="notes-searchbar">
      <input
        className="notes-search-input"
        type="text"
        placeholder="Search notes..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search notes"
      />
    </div>
  );
}

/*
  NotesList: Show filtered list of notes
*/
function NotesList({ notes, onSelect, activeId }) {
  if (notes.length === 0) {
    return (
      <div className="notes-list-empty">
        <span>No notes found.</span>
      </div>
    );
  }
  return (
    <ul className="notes-list">
      {notes.map((note) => (
        <li
          className={
            "notes-list-item" +
            (note.id === activeId ? " notes-list-item--active" : "")
          }
          key={note.id}
          onClick={() => onSelect(note.id)}
          tabIndex={0}
        >
          <div className="notes-list-title">{note.title || "Untitled"}</div>
          <div className="notes-list-meta">
            <span className="notes-list-tags">
              {note.tags && note.tags.length > 0
                ? note.tags.join(", ")
                : "No tags"}
            </span>
            <span className="notes-list-date">
              {note.lastEdited
                ? new Date(note.lastEdited).toLocaleDateString()
                : ""}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/*
  TagList (for note editor)
*/
function TagList({ allTags, noteTags, onToggleTag }) {
  return (
    <div className="tag-list-editor">
      {allTags.map((tag) => (
        <button
          key={tag}
          className={
            noteTags.includes(tag)
              ? "tag-badge tag-badge--active"
              : "tag-badge"
          }
          type="button"
          onClick={() => onToggleTag(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

/*
  Modal note editor
*/
function NoteEditor({ open, note, tags, onSave, onClose, onDelete }) {
  const [title, setTitle] = useState(note ? note.title : "");
  const [body, setBody] = useState(note ? note.body : "");
  const [noteTags, setNoteTags] = useState(note ? note.tags || [] : []);
  useEffect(() => {
    setTitle(note ? note.title : "");
    setBody(note ? note.body : "");
    setNoteTags(note ? note.tags || [] : []);
  }, [note, open]);

  function handleSave(e) {
    e.preventDefault();
    if (!title.trim() && !body.trim()) {
      // Prevent saving completely empty notes.
      return;
    }
    onSave({
      ...note,
      title: title.trim(),
      body: body.trim(),
      tags: noteTags,
      lastEdited: new Date().toISOString(),
    });
  }
  function handleToggleTag(tag) {
    setNoteTags((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag]
    );
  }

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose} tabIndex={-1}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        tabIndex={0}
        aria-modal="true"
        role="dialog"
      >
        <form className="modal-form" onSubmit={handleSave}>
          <input
            className="modal-title-input"
            type="text"
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            autoFocus
          />
          <textarea
            className="modal-body-input"
            placeholder="Write your note..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            maxLength={4000}
          ></textarea>
          <TagList
            allTags={tags.filter((t) => t !== "All notes")}
            noteTags={noteTags}
            onToggleTag={handleToggleTag}
          />
          <div className="modal-actions">
            <button type="submit" className="modal-save-btn">
              Save
            </button>
            {note && (
              <button
                type="button"
                className="modal-delete-btn"
                onClick={() => onDelete(note)}
              >
                Delete
              </button>
            )}
            <button type="button" className="modal-cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/*
  Main App
*/
function App() {
  // THEME HANDLING (preserve light, allow for future dark theme)
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Note/Tag State
  const [notes, setNotesState] = useState(() => getInitialNotes());
  const [selectedTag, setSelectedTag] = useState("All notes");
  const [search, setSearch] = useState("");
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorNote, setEditorNote] = useState(null);

  // Extract tags from notes (union)
  const allTagsFromNotes = Array.from(
    new Set(
      notes.flatMap((n) => (n.tags && n.tags.length > 0 ? n.tags : []))
    )
  ).filter((tag) => tag && tag.trim().length > 0);
  const allTags = ["All notes", ...new Set([...DEFAULT_TAGS, ...allTagsFromNotes])];

  // Filter notes
  const filtered = notes.filter((n) => {
    const tagOk =
      selectedTag === "All notes" ||
      (n.tags && n.tags.includes(selectedTag));
    const found =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.body.toLowerCase().includes(search.toLowerCase());
    return tagOk && (search.trim() === "" || found);
  });

  // NOTE CRUD handlers
  function handleSelectTag(tag) {
    setSelectedTag(tag);
    setActiveNoteId(null);
  }
  function handleSelectNote(noteId) {
    setActiveNoteId(noteId);
    setEditorOpen(false);
  }
  function handleNewNote() {
    setEditorNote({
      id: Math.random().toString(36).slice(2),
      title: "",
      body: "",
      tags: [],
    });
    setEditorOpen(true);
  }
  function handleEditNote(noteId) {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      setEditorNote(note);
      setEditorOpen(true);
    }
  }
  function handleSaveNote(note) {
    let newNotes;
    if (notes.some((n) => n.id === note.id)) {
      newNotes = notes.map((n) => (n.id === note.id ? note : n));
    } else {
      newNotes = [note, ...notes];
    }
    setNotesState(newNotes);
    setNotes(newNotes);
    setEditorOpen(false);
    setEditorNote(null);
    setActiveNoteId(note.id);
  }
  function handleDeleteNote(note) {
    const newNotes = notes.filter((n) => n.id !== note.id);
    setNotesState(newNotes);
    setNotes(newNotes);
    setEditorOpen(false);
    setEditorNote(null);
    setActiveNoteId(null);
  }

  // Save notes to localStorage when notes state changes
  useEffect(() => {
    setNotes(notes);
  }, [notes]);

  // Render
  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  return (
    <div className={`main-app-container${theme === "light" ? "" : " theme-dark"}`}>
      <Sidebar
        tags={allTags}
        onSelectTag={handleSelectTag}
        selectedTag={selectedTag}
        onNewNote={handleNewNote}
      />
      <main className="main-area">
        <div className="main-header">
          <SearchBar value={search} onChange={setSearch} />
          <button
            className="theme-toggle"
            onClick={() =>
              setTheme((prev) => (prev === "light" ? "dark" : "light"))
            }
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            title="Switch theme"
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
        <NotesList
          notes={filtered}
          onSelect={(id) => {
            setActiveNoteId(id);
          }}
          activeId={activeNoteId}
        />
        <div className="main-note-actions">
          <button className="main-edit-btn" onClick={() => activeNote && handleEditNote(activeNote.id)} disabled={!activeNote}>
            Edit
          </button>
          <button className="main-new-btn" onClick={handleNewNote}>+ New Note</button>
        </div>
        {/* Show active note content if selected */}
        {activeNote && (
          <div className="main-note-content" tabIndex={0}>
            <h2 className="main-note-title">{activeNote.title || "Untitled"}</h2>
            <div className="main-note-tags">
              {(activeNote.tags || []).map((tag) => (
                <span className="tag-badge" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
            <p className="main-note-body">
              {activeNote.body || <span style={{ color: "#999" }}>No content.</span>}
            </p>
            <div className="main-note-date">
              Last edited:{" "}
              {activeNote.lastEdited &&
                new Date(activeNote.lastEdited).toLocaleString()}
            </div>
          </div>
        )}
      </main>
      {/* Modal Note Editor */}
      <NoteEditor
        open={editorOpen}
        note={editorNote}
        tags={allTags}
        onSave={handleSaveNote}
        onClose={() => {
          setEditorOpen(false);
          setEditorNote(null);
        }}
        onDelete={handleDeleteNote}
      />
    </div>
  );
}

export default App;
