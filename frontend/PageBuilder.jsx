import React, { useState, useEffect, useRef } from "react";
import RGL, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
const GridLayout = WidthProvider(RGL);
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Modal for image preview
function ImageModal({ url, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadein" onClick={onClose}>
      <div
        className="relative flex items-center justify-center"
        style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '1.5rem', boxShadow: '0 0 40px var(--gold-dim)', border: '2px solid var(--gold)', background: 'rgba(0,0,0,0.95)' }}
        onClick={e => e.stopPropagation()}
      >
        <img
          src={url}
          alt="Preview"
          style={{
            maxWidth: '80vw',
            maxHeight: '80vh',
            borderRadius: '1rem',
            boxShadow: '0 0 24px var(--gold-dim)',
            border: '1px solid var(--gold)'
          }}
          className="transition-transform duration-300 scale-100 hover:scale-105"
        />
        <button
          className="absolute top-2 right-2 header-btn px-3 py-1 text-lg bg-black/80 border-gold border-2 rounded"
          onClick={onClose}
          style={{color: 'var(--gold)'}}
        >✕</button>
      </div>
    </div>
  );
}
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const defaultPages = {
  home: [
    { type: "text", content: "Welcome to your homepage! Edit this text." },
  ],
  prices: [],
  creations: [],
  education: [],
  work: [],
  gallery: [],
  contact: [],
  arcade: [],
  media: [
    { type: "text", content: "<h2>Media</h2><p>Add your videos, music, and photos here. Use the Gallery block for multiple images.</p>" },
  ],
  sandbox: [],
  socials: [],
};

function BlockEditor({ block, onChange, onDelete }) {
  // Panel Grid Editor
  if (block.type === 'panelLayout') {
    const cols = block.cols ?? 12;
    const rowHeight = block.rowHeight ?? 30;
    const margin = block.margin ?? [10, 10];
    const layout = Array.isArray(block.layout) ? block.layout : [];
    const panels = block.panels || {};
  const [editing, setEditing] = useState(false);
  const innerRef = useRef(null);

    function addPanel() {
      const id = String(Date.now() % 1e9);
      const nextY = layout.length ? Math.max(...layout.map(l => l.y + l.h)) : 0;
      const item = { i: id, x: 0, y: nextY, w: 4, h: 6 };
      onChange({ ...block, layout: [...layout, item], panels: { ...panels, [id]: { blocks: [] } } });
    }
    function removePanel(id) {
      const newLayout = layout.filter(l => l.i !== id);
      const newPanels = { ...panels }; delete newPanels[id];
      onChange({ ...block, layout: newLayout, panels: newPanels });
    }
    // Persist positions only when drag/resize stops to avoid losing focus in editors
    function onDragStop(_layout, _oldItem, newItem) {
      const nextLayout = layout.map(l => l.i === newItem.i ? { ...l, ...newItem } : l);
      onChange({ ...block, layout: nextLayout });
    }
    function onResizeStop(_layout, _oldItem, newItem) {
      const nextLayout = layout.map(l => l.i === newItem.i ? { ...l, ...newItem } : l);
      onChange({ ...block, layout: nextLayout });
    }
    function addInner(id, type) {
      const p = panels[id] || { blocks: [] };
      const newBlock = type === 'text' ? { type: 'text', content: 'New text' }
        : type === 'image' ? { type: 'image', url: '', width: 300 }
        : type === 'video' ? { type: 'video', url: '', width: 480 }
        : type === 'audio' ? { type: 'audio', url: '' }
        : type === 'gallery' ? { type: 'gallery', images: [''] }
        : type === 'button' ? { type: 'button', label: 'Contact me', action: 'contact', subject: '', message: '' }
        : { type: 'text', content: '' };
      const updated = { ...block, panels: { ...panels, [id]: { blocks: [...(p.blocks || []), newBlock] } } };
      onChange(updated);
    }
    function updateInner(id, idx, newInner) {
      const p = panels[id] || { blocks: [] };
      const updated = { ...block, panels: { ...panels, [id]: { blocks: (p.blocks || []).map((b, i) => i === idx ? newInner : b) } } };
      onChange(updated);
    }
    function deleteInner(id, idx) {
      const p = panels[id] || { blocks: [] };
      const updated = { ...block, panels: { ...panels, [id]: { blocks: (p.blocks || []).filter((_, i) => i !== idx) } } };
      onChange(updated);
    }

    return (
      <div
        className="border border-gold p-2 mb-2 bg-black w-full"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          const tag = e.target?.tagName?.toLowerCase?.();
          const isEditing = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable || e.target?.closest?.('.ql-editor');
          if (isEditing) e.stopPropagation();
        }}
      >
        <style>{`
          /* Disable animated moves/sizing to prevent visual jumps while editing */
          .react-grid-item { transition: none !important; }
          .react-grid-item.react-draggable-dragging { transition: none !important; }
          .react-grid-item.cssTransforms { transition: none !important; }
          .react-resizable-handle { z-index: 5; }
        `}</style>
        <div className="flex items-center justify-between mb-2">
          <div className="text-gold">Panel Grid (drag to move, resize corners)</div>
          <div className="flex gap-2">
            <button className="header-btn" onClick={addPanel}>Add Panel</button>
            <button className="header-btn" onClick={onDelete}>Delete Grid</button>
          </div>
        </div>
        <GridLayout
          className="layout"
          cols={cols}
          rowHeight={rowHeight}
          margin={margin}
          layout={layout}
          onLayoutChange={() => { /* update on stop */ }}
          onDragStop={onDragStop}
          onResizeStop={onResizeStop}
          autoSize
          isResizable={!editing}
          isDraggable={!editing}
          compactType={null}
          preventCollision
          draggableHandle=".panel-drag-handle"
          draggableCancel=".no-drag, .ql-container, .ql-editor, input, textarea, select, button, .header-btn, .order-btn"
          useCSSTransforms={false}
        >
          {layout.map(item => (
            <div key={item.i} className="border border-gold/60 bg-black/70 rounded-sm overflow-auto">
              <div className="flex items-center justify-between px-2 py-1 border-b border-gold/40 sticky top-0 bg-black/80 panel-drag-handle">
                <span className="text-xs text-gold">Panel {item.i} {item.static ? '📌' : ''}</span>
                <div className="flex gap-1">
                  <button
                    className="header-btn text-xs no-drag"
                    title={item.static ? 'Unpin (allow move/resize)' : 'Pin (lock position)'}
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextLayout = layout.map(l => l.i === item.i ? { ...l, static: !l.static } : l);
                      onChange({ ...block, layout: nextLayout });
                    }}
                  >{item.static ? 'Unpin' : 'Pin'}</button>
                  <button className="header-btn text-xs" onClick={() => addInner(item.i, 'text')}>+Text</button>
                  <button className="header-btn text-xs" onClick={() => addInner(item.i, 'image')}>+Image</button>
                  <button className="header-btn text-xs" onClick={() => addInner(item.i, 'video')}>+Video</button>
                  <button className="header-btn text-xs" onClick={() => addInner(item.i, 'audio')}>+Audio</button>
                  <button className="header-btn text-xs" onClick={() => addInner(item.i, 'gallery')}>+Gallery</button>
                  <button className="header-btn text-xs" onClick={() => addInner(item.i, 'button')}>+Button</button>
                  <button className="header-btn text-xs" onClick={() => removePanel(item.i)}>Delete</button>
                </div>
              </div>
              <div
                className="p-2 flex flex-col gap-2 no-drag"
                ref={innerRef}
                onFocusCapture={() => setEditing(true)}
                onBlurCapture={() => {
                  // Delay to allow focus to move within inner content
                  setTimeout(() => {
                    if (!innerRef.current) return setEditing(false);
                    const ae = document.activeElement;
                    if (!ae || !innerRef.current.contains(ae)) setEditing(false);
                  }, 0);
                }}
              >
                {(panels[item.i]?.blocks || []).map((b, idx) => (
                  <BlockEditor key={idx} block={b} onChange={nb => updateInner(item.i, idx, nb)} onDelete={() => deleteInner(item.i, idx)} />
                ))}
              </div>
            </div>
          ))}
        </GridLayout>
      </div>
    );
  }
  if (block.type === "text") {
    return (
      <div className="border border-gold p-2 mb-2 bg-black w-full">
        <ReactQuill
          theme="snow"
          value={block.content}
          onChange={val => onChange({ ...block, content: val })}
          modules={{
            toolbar: [
              [{ 'header': [1, 2, 3, false] }],
              [{ 'font': [] }],
              [{ 'size': [] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'color': [] }, { 'background': [] }],
              [{ 'align': [] }],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              ['blockquote', 'code-block'],
              ['link', 'image'],
              ['clean']
            ]
          }}
          formats={[
            'header', 'font', 'size',
            'bold', 'italic', 'underline', 'strike',
            'color', 'background',
            'align', 'list', 'bullet',
            'blockquote', 'code-block',
            'link', 'image'
          ]}
          style={{ background: 'black', color: 'gold', borderColor: 'gold', minHeight: 120 }}
        />
        <button className="header-btn mt-2" onClick={onDelete}>Delete</button>
      </div>
    );
  }
  if (block.type === "button") {
    return (
      <div className="border border-gold p-2 mb-2 bg-black w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label className="text-gold text-xs">Label</label>
            <input
              className="w-full bg-black text-gold border-b border-gold"
              value={block.label || "Button"}
              onChange={e => onChange({ ...block, label: e.target.value })}
              placeholder="Button label"
            />
          </div>
          <div>
            <label className="text-gold text-xs">Action</label>
            <select
              className="w-full bg-black text-gold border-b border-gold"
              value={block.action || "url"}
              onChange={e => onChange({ ...block, action: e.target.value })}
            >
              <option value="url">Open URL</option>
              <option value="contact">Open Contact form</option>
            </select>
          </div>
          {block.action === 'url' && (
            <div className="md:col-span-2">
              <label className="text-gold text-xs">URL</label>
              <input
                className="w-full bg-black text-gold border-b border-gold"
                value={block.url || ""}
                onChange={e => onChange({ ...block, url: e.target.value })}
                placeholder="https://example.com"
              />
              <div className="flex items-center gap-2 mt-1">
                <input
                  id="btn-newtab"
                  type="checkbox"
                  checked={!!block.newTab}
                  onChange={e => onChange({ ...block, newTab: e.target.checked })}
                />
                <label htmlFor="btn-newtab" className="text-gold text-xs">Open in new tab</label>
              </div>
            </div>
          )}
          {block.action === 'contact' && (
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="text-gold text-xs">Prefill Subject</label>
                <input
                  className="w-full bg-black text-gold border-b border-gold"
                  value={block.subject || ""}
                  onChange={e => onChange({ ...block, subject: e.target.value })}
                  placeholder="Subject"
                />
              </div>
              <div>
                <label className="text-gold text-xs">Prefill Message</label>
                <input
                  className="w-full bg-black text-gold border-b border-gold"
                  value={block.message || ""}
                  onChange={e => onChange({ ...block, message: e.target.value })}
                  placeholder="Message"
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button className="header-btn" onClick={onDelete}>Delete</button>
        </div>
      </div>
    );
  }
  if (block.type === "image") {
    return (
      <div className="border border-gold p-2 mb-2 bg-black w-full">
        <input
          className="flex-1 bg-black text-gold border-b border-gold mb-2"
          value={block.url}
          onChange={e => onChange({ ...block, url: e.target.value })}
          placeholder="Image URL"
        />
        <div className="flex items-center gap-2 mb-2">
          <label className="text-gold text-xs">Width:</label>
          <input
            type="range"
            min="100"
            max="1200"
            value={block.width || 400}
            onChange={e => onChange({ ...block, width: Number(e.target.value) })}
            className="w-32"
          />
          <span className="text-gold text-xs">{block.width || 400}px</span>
        </div>
        {block.url && (
          <img
            src={block.url}
            alt=""
            className="my-2"
            style={{ width: (block.width || 400) + "px", maxWidth: "100%" }}
          />
        )}
        <button className="header-btn" onClick={onDelete}>Delete</button>
      </div>
    );
  }
  if (block.type === "video") {
    return (
      <div className="border border-gold p-2 mb-2 bg-black w-full">
        <div className="flex items-center gap-2 mb-2">
          <input
            className="flex-1 bg-black text-gold border-b border-gold"
            value={block.url || ""}
            onChange={e => onChange({ ...block, url: e.target.value })}
            placeholder="Video URL (.mp4, .webm, etc)"
          />
          <label className="header-btn cursor-pointer">
            Upload
            <input type="file" accept="video/*" className="hidden" onChange={e => onChange({ ...block, __upload: e.target.files?.[0] })} />
          </label>
          <button
            className="header-btn"
            onClick={async () => {
              const file = block.__upload;
              if (!file) return;
              try {
                const token = localStorage.getItem("token");
                const fd = new FormData();
                fd.append("file", file);
                const res = await fetch(`/api/upload/media`, {
                  method: "POST",
                  headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  body: fd,
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || "Upload failed");
                onChange({ ...block, url: data.url, __upload: undefined });
              } catch (e) {
                alert(e.message);
              }
            }}
          >Send</button>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-gold text-xs">Width:</label>
          <input
            type="range"
            min="240"
            max="1280"
            value={block.width || 640}
            onChange={e => onChange({ ...block, width: Number(e.target.value) })}
            className="w-32"
          />
          <span className="text-gold text-xs">{block.width || 640}px</span>
        </div>
        {block.url && (
          <video controls src={block.url} style={{ width: (block.width || 640) + "px", maxWidth: "100%" }} />
        )}
        <button className="header-btn mt-2" onClick={onDelete}>Delete</button>
      </div>
    );
  }
  if (block.type === "audio") {
    return (
      <div className="border border-gold p-2 mb-2 bg-black w-full">
        <div className="flex items-center gap-2 mb-2">
          <input
            className="flex-1 bg-black text-gold border-b border-gold"
            value={block.url || ""}
            onChange={e => onChange({ ...block, url: e.target.value })}
            placeholder="Audio URL (.mp3, .ogg, etc)"
          />
          <label className="header-btn cursor-pointer">
            Upload
            <input type="file" accept="audio/*" className="hidden" onChange={e => onChange({ ...block, __upload: e.target.files?.[0] })} />
          </label>
          <button
            className="header-btn"
            onClick={async () => {
              const file = block.__upload;
              if (!file) return;
              try {
                const token = localStorage.getItem("token");
                const fd = new FormData();
                fd.append("file", file);
                const res = await fetch(`/api/upload/media`, {
                  method: "POST",
                  headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  body: fd,
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || "Upload failed");
                onChange({ ...block, url: data.url, __upload: undefined });
              } catch (e) {
                alert(e.message);
              }
            }}
          >Send</button>
        </div>
        {block.url && (
          <audio controls src={block.url} style={{ width: '100%' }} />
        )}
        <button className="header-btn mt-2" onClick={onDelete}>Delete</button>
      </div>
    );
  }
  if (block.type === "gallery") {
    return (
      <div className="border border-gold p-2 mb-2 bg-black w-full">
        <div className="mb-2 text-gold">Gallery Images:</div>
        {(block.images || []).map((url, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <input
              className="flex-1 bg-black text-gold border-b border-gold"
              value={url}
              onChange={e => {
                const newImages = [...block.images];
                newImages[idx] = e.target.value;
                onChange({ ...block, images: newImages });
              }}
              placeholder={`Image URL #${idx + 1}`}
            />
            <button className="header-btn" onClick={() => {
              const newImages = block.images.filter((_, i) => i !== idx);
              onChange({ ...block, images: newImages });
            }}>Delete</button>
          </div>
        ))}
        <button className="header-btn" onClick={() => onChange({ ...block, images: [...(block.images || []), ""] })}>Add Image URL</button>
        <button className="header-btn ml-2" onClick={onDelete}>Delete Gallery</button>
        <div className="flex flex-wrap gap-2 mt-2">
          {(block.images || []).map((url, idx) => url && (
            <img key={idx} src={url} alt="" style={{ width: '180px', maxWidth: '100%' }} className="my-2 border border-gold" />
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export default function PageBuilder() {
  const [modalImg, setModalImg] = useState(null);
  const [pages, setPages] = useState({ ...defaultPages });
  const [selected, setSelected] = useState("home");
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const fileInputRef = useRef();

  // Always load from backend on mount and when selected changes
  useEffect(() => {
    async function fetchPage() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/pages/${selected}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.content) {
            setPages(p => ({ ...p, [selected]: JSON.parse(data.content) }));
          } else {
            // Fallback: if renaming bio->prices and prices empty, try loading old 'bio'
            if (selected === 'prices') {
              try {
                const legacy = await fetch(`/api/pages/bio`);
                if (legacy.ok) {
                  const legacyData = await legacy.json();
                  if (legacyData.content) {
                    setPages(p => ({ ...p, [selected]: JSON.parse(legacyData.content) }));
                  } else {
                    setPages(p => ({ ...p, [selected]: defaultPages[selected] || [] }));
                  }
                } else {
                  setPages(p => ({ ...p, [selected]: defaultPages[selected] || [] }));
                }
              } catch {
                setPages(p => ({ ...p, [selected]: defaultPages[selected] || [] }));
              }
            } else {
              setPages(p => ({ ...p, [selected]: defaultPages[selected] || [] }));
            }
          }
        } else {
          if (selected === 'prices') {
            try {
              const legacy = await fetch(`/api/pages/bio`);
              if (legacy.ok) {
                const legacyData = await legacy.json();
                if (legacyData.content) {
                  setPages(p => ({ ...p, [selected]: JSON.parse(legacyData.content) }));
                } else {
                  setPages(p => ({ ...p, [selected]: defaultPages[selected] || [] }));
                }
              } else {
                setPages(p => ({ ...p, [selected]: defaultPages[selected] || [] }));
              }
            } catch {
              setPages(p => ({ ...p, [selected]: defaultPages[selected] || [] }));
            }
          } else {
            setPages(p => ({ ...p, [selected]: defaultPages[selected] || [] }));
          }
        }
      } catch {
        if (selected === 'prices') {
          try {
            const legacy = await fetch(`/api/pages/bio`);
            if (legacy.ok) {
              const legacyData = await legacy.json();
              if (legacyData.content) {
                setPages(p => ({ ...p, [selected]: JSON.parse(legacyData.content) }));
              } else {
                setPages(p => ({ ...p, [selected]: defaultPages[selected] || [] }));
              }
            } else {
              setPages(p => ({ ...p, [selected]: defaultPages[selected] || [] }));
            }
          } catch {
            setPages(p => ({ ...p, [selected]: defaultPages[selected] || [] }));
          }
        } else {
          setPages(p => ({ ...p, [selected]: defaultPages[selected] || [] }));
        }
      }
      setLoading(false);
    }
    fetchPage();
    // eslint-disable-next-line
  }, [selected]);

  // Optionally, keep a backup in localStorage (not used for loading)
  useEffect(() => {
    localStorage.setItem("sitePages_backup", JSON.stringify(pages));
  }, [pages]);

  async function saveToBackend() {
    setSaveStatus("Saving...");
    setErrorDetail("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/pages/${selected}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: JSON.stringify(pages[selected]) }),
      });
      if (res.ok) {
        setSaveStatus("Saved!");
        // Fetch latest content from backend after save (public fetch, no token)
        const getRes = await fetch(`/api/pages/${selected}`);
        if (getRes.ok) {
          const data = await getRes.json();
          if (data.content) {
            setPages(p => ({ ...p, [selected]: JSON.parse(data.content) }));
          }
        }
      } else {
        setSaveStatus("Save failed");
        const err = await res.text();
        setErrorDetail(err);
      }
    } catch (e) {
      setSaveStatus("Save failed");
      setErrorDetail(e.message);
    }
    setTimeout(() => { setSaveStatus(""); setErrorDetail(""); }, 4000);
  }

  function addBlock(type) {
    if (type === 'panelLayout') {
      const exists = (pages[selected] || []).some(b => b.type === 'panelLayout');
      if (exists) {
        alert('A Panel Grid already exists on this page.');
        return;
      }
    }
    setPages(p => ({
      ...p,
      [selected]: [...(p[selected] || []),
        type === "text"
          ? { type, content: "New text block" }
          : type === "gallery"
            ? { type, images: [""] }
            : type === "image"
              ? { type, url: "", width: 400 }
              : type === "video"
                ? { type, url: "", width: 640 }
                : type === "button"
                  ? { type, label: "Contact me", action: "contact", subject: "", message: "" }
                  : type === 'panelLayout'
                    ? { type: 'panelLayout', cols: 12, rowHeight: 30, margin: [10,10], layout: [], panels: {} }
                    : { type, url: "" }
      ],
    }));
  }

  function addImages(files) {
    const fileReaders = [];
    let isCancel = false;
    const newBlocks = [];
    Array.from(files).forEach((file, idx) => {
      const reader = new FileReader();
      fileReaders.push(reader);
      reader.onload = e => {
        if (isCancel) return;
        newBlocks.push({ type: "image", url: e.target.result, width: 400 });
        if (newBlocks.length === files.length) {
          setPages(p => ({
            ...p,
            [selected]: [...(p[selected] || []), ...newBlocks],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
    return () => { isCancel = true; fileReaders.forEach(r => r.abort && r.abort()); };
  }

  function onDragEnd(result) {
    if (!result.destination) return;
    const items = Array.from(pages[selected]);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setPages(p => ({ ...p, [selected]: items }));
  }

  // removed duplicate addBlock definition
  function updateBlock(idx, newBlock) {
    setPages(p => ({
      ...p,
      [selected]: p[selected].map((b, i) => (i === idx ? newBlock : b)),
    }));
  }
  function deleteBlock(idx) {
    setPages(p => ({
      ...p,
      [selected]: p[selected].filter((_, i) => i !== idx),
    }));
  }
  function moveBlock(idx, dir) {
    setPages(p => {
      const arr = [...p[selected]];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return p;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return { ...p, [selected]: arr };
    });
  }

  return (
    <div className="relative w-full max-w-8xl mx-auto" style={{height: 'calc(100vh - 5rem)', display: 'flex', flexDirection: 'column', background: 'transparent', minWidth: '700px'}}>
      {/* Static Toolbar */}
      <div className="sticky top-0 z-20 bg-black/90 border-b border-gold flex items-center gap-4 px-4 py-2" style={{backdropFilter: 'blur(6px)'}}>
        <span className="font-bold text-gold text-lg">Page Editor</span>
        <select className="header-btn" value={selected} onChange={e => setSelected(e.target.value)} style={{background: '#000', color: 'var(--gold)', border: '1px solid var(--gold)'}}>
          {Object.keys(pages).map(key => (
            <option key={key} value={key} style={{background: '#000', color: 'var(--gold)'}}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
          ))}
        </select>
        <button className="header-btn" onClick={() => addBlock("text")}>Add Text</button>
  <button className="header-btn" onClick={() => addBlock("image")}>Add Image</button>
  <button className="header-btn" onClick={() => addBlock("video")}>Add Video</button>
  <button className="header-btn" onClick={() => addBlock("audio")}>Add Audio</button>
  <button className="header-btn" onClick={() => addBlock("gallery")}>Add Gallery</button>
  <button className="header-btn" onClick={() => addBlock("button")}>Add Button</button>
  <button className="header-btn" onClick={() => addBlock("panelLayout")}>Add Panel Grid</button>
        <button className="header-btn border-gold border-2" onClick={saveToBackend} disabled={loading}>{loading ? "Loading..." : "Save"}</button>
        <span className="ml-2 text-gold/80">{saveStatus}</span>
        {errorDetail && <span className="ml-4 text-red-400 text-xs">{errorDetail}</span>}
      </div>
      {/* Scrollable Canvas */}
      <div className="flex-1 overflow-y-auto px-2 py-4" style={{background: 'transparent', minHeight: 0}}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="canvas">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="w-full flex flex-col gap-2">
                {pages[selected].map((block, idx) => (
                  <Draggable key={idx} draggableId={String(idx)} index={idx}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`mb-2 w-full ${snapshot.isDragging ? 'ring-2 ring-gold' : ''}`}
                      >
                        <BlockEditor
                          block={block}
                          onChange={b => updateBlock(idx, b)}
                          onDelete={() => deleteBlock(idx)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
