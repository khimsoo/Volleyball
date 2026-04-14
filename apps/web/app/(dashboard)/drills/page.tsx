'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CoachingCue {
  cue_text?: string;
  cueText?: string;
  timestamp_seconds?: number;
  timestampSeconds?: number;
  cue_type?: string;
  cueType?: string;
}

interface VideoEntry {
  url: string;
  title?: string;
}

interface DrillRow {
  id: string;
  name: string;
  description: string;
  instructions: string;
  skill_type: string;
  positions_relevant: string[];
  difficulty: string;
  training_phase_tags: string[];
  equipment_required: string[];
  video_url: string | null;
  video_thumbnail_url: string | null;
  video_duration_seconds: number | null;
  video_urls: VideoEntry[];
  coaching_cues: CoachingCue[];
  is_public: boolean;
  organization_id: string | null;
}

// ─── YouTube helpers ───────────────────────────────────────────────────────────

function getYouTubeEmbedId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.pathname === '/watch') return u.searchParams.get('v');
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null;
    if (u.hostname.includes('youtube.com') && u.pathname.startsWith('/embed/'))
      return u.pathname.replace('/embed/', '') || null;
  } catch { /* ignore */ }
  return null;
}

function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeEmbedId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

function isYouTubeSearchUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.includes('youtube.com') && u.pathname === '/results';
  } catch { return false; }
}

function isValidVideoUrl(url: string): boolean {
  try { new URL(url); return true; } catch { return false; }
}

// ─── Difficulty helpers ────────────────────────────────────────────────────────

function difficultyClass(d: string) {
  switch (d) {
    case 'elite': return 'text-purple-400';
    case 'advanced': return 'text-red-400';
    case 'intermediate': return 'text-yellow-400';
    default: return 'text-green-400';
  }
}

function difficultyBadgeClass(d: string) {
  switch (d) {
    case 'elite': return 'bg-purple-500/20 text-purple-400';
    case 'advanced': return 'bg-red-500/20 text-red-400';
    case 'intermediate': return 'bg-yellow-500/20 text-yellow-400';
    default: return 'bg-green-500/20 text-green-400';
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

// ─── Single Video Player ───────────────────────────────────────────────────────

function VideoPlayer({ url, title }: { url: string; title?: string }) {
  const embedId = getYouTubeEmbedId(url);

  if (embedId) {
    return (
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <iframe
          key={embedId}          // remount when video changes
          className="absolute inset-0 w-full h-full rounded-xl"
          src={`https://www.youtube.com/embed/${embedId}?rel=0&modestbranding=1`}
          title={title ?? 'Drill video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isYouTubeSearchUrl(url)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 bg-slate-800 rounded-xl py-10 px-6 text-center">
        <svg className="w-12 h-12 text-red-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
        </svg>
        <p className="text-slate-300 text-sm">Watch drill examples on YouTube</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm px-6 py-2">
          Search on YouTube ↗
        </a>
      </div>
    );
  }

  return (
    <video className="w-full rounded-xl max-h-80" src={url} controls preload="metadata" />
  );
}

// ─── Video Carousel ────────────────────────────────────────────────────────────

function VideoCarousel({
  videos,
  drillId,
  canEdit,
  onVideosUpdated,
}: {
  videos: VideoEntry[];
  drillId: string;
  canEdit: boolean;
  onVideosUpdated: (updated: VideoEntry[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Clamp index when videos list changes
  const safeIndex = Math.min(index, Math.max(0, videos.length - 1));

  // Keyboard left/right navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!containerRef.current?.closest('[data-drill-modal]')) return;
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(videos.length - 1, i + 1));
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [videos.length]);

  async function handleAddVideo(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    if (!isValidVideoUrl(newUrl.trim())) {
      setAddError('Please enter a valid URL.');
      return;
    }
    setAdding(true);
    const entry: VideoEntry = { url: newUrl.trim(), title: newTitle.trim() || undefined };
    const updated = [...videos, entry];

    const { error } = await supabase
      .from('drills')
      .update({ video_urls: updated })
      .eq('id', drillId);

    setAdding(false);
    if (error) {
      setAddError(error.message);
    } else {
      onVideosUpdated(updated);
      setNewUrl('');
      setNewTitle('');
      setShowAddInput(false);
      setIndex(updated.length - 1);  // jump to newly added video
    }
  }

  async function handleRemoveCurrent() {
    if (!confirm('Remove this video from the drill?')) return;
    const updated = videos.filter((_, i) => i !== safeIndex);
    await supabase.from('drills').update({ video_urls: updated }).eq('id', drillId);
    onVideosUpdated(updated);
    setIndex(Math.max(0, safeIndex - 1));
  }

  if (videos.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-8 text-center">
        <svg className="w-10 h-10 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
        </svg>
        <p className="text-slate-500 text-sm mb-3">No videos yet</p>
        {canEdit && (
          <button
            onClick={() => setShowAddInput(true)}
            className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
          >
            + Add YouTube URL
          </button>
        )}
        {showAddInput && canEdit && (
          <AddVideoForm
            newUrl={newUrl} setNewUrl={setNewUrl}
            newTitle={newTitle} setNewTitle={setNewTitle}
            adding={adding} addError={addError}
            onSubmit={handleAddVideo}
            onCancel={() => { setShowAddInput(false); setAddError(''); }}
          />
        )}
      </div>
    );
  }

  const current = videos[safeIndex];
  const hasPrev = safeIndex > 0;
  const hasNext = safeIndex < videos.length - 1;

  return (
    <div className="space-y-3">
      {/* Video counter + title */}
      <div className="flex items-center justify-between">
        <div>
          {current.title && (
            <p className="text-sm font-semibold text-white">{current.title}</p>
          )}
          {videos.length > 1 && (
            <p className="text-xs text-slate-500">
              {current.title ? '' : `Video `}{safeIndex + 1} of {videos.length}
            </p>
          )}
        </div>
        {canEdit && (
          <button
            onClick={handleRemoveCurrent}
            className="text-xs text-slate-600 hover:text-red-400 transition-colors"
            title="Remove this video"
          >
            Remove
          </button>
        )}
      </div>

      {/* Player with arrow buttons */}
      <div className="relative group">
        <VideoPlayer url={current.url} title={current.title} />

        {/* Prev arrow */}
        {hasPrev && (
          <button
            onClick={() => setIndex(safeIndex - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-sm"
            aria-label="Previous video"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
        )}

        {/* Next arrow */}
        {hasNext && (
          <button
            onClick={() => setIndex(safeIndex + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-sm"
            aria-label="Next video"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        )}
      </div>

      {/* Thumbnail strip (2+ videos) */}
      {videos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {videos.map((v, i) => {
            const thumb = getYouTubeThumbnail(v.url);
            const active = i === safeIndex;
            return (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  active ? 'border-brand-500 scale-105' : 'border-slate-700 hover:border-slate-500 opacity-60 hover:opacity-100'
                }`}
                style={{ width: 88, height: 50 }}
                title={v.title ?? `Video ${i + 1}`}
              >
                {thumb ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={thumb} alt={v.title ?? `Video ${i + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                )}
              </button>
            );
          })}

          {/* Add video thumbnail button */}
          {canEdit && (
            <button
              onClick={() => setShowAddInput((v) => !v)}
              className="shrink-0 rounded-lg border-2 border-dashed border-slate-600 hover:border-brand-500 text-slate-500 hover:text-brand-400 flex items-center justify-center transition-colors"
              style={{ width: 88, height: 50 }}
              title="Add video URL"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Dot indicators (compact, below thumbnails) */}
      {videos.length > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {videos.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`rounded-full transition-all ${
                i === safeIndex
                  ? 'w-4 h-1.5 bg-brand-500'
                  : 'w-1.5 h-1.5 bg-slate-600 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      )}

      {/* Add video form */}
      {showAddInput && canEdit && (
        <AddVideoForm
          newUrl={newUrl} setNewUrl={setNewUrl}
          newTitle={newTitle} setNewTitle={setNewTitle}
          adding={adding} addError={addError}
          onSubmit={handleAddVideo}
          onCancel={() => { setShowAddInput(false); setAddError(''); setNewUrl(''); setNewTitle(''); }}
        />
      )}

      {/* Add video button (when no thumbnail strip visible) */}
      {videos.length === 1 && canEdit && !showAddInput && (
        <button
          onClick={() => setShowAddInput(true)}
          className="w-full py-2 rounded-lg border border-dashed border-slate-700 hover:border-brand-500 text-xs text-slate-500 hover:text-brand-400 transition-colors"
        >
          + Add another video
        </button>
      )}
    </div>
  );
}

// ─── Add Video Form (shared) ───────────────────────────────────────────────────

function AddVideoForm({
  newUrl, setNewUrl, newTitle, setNewTitle,
  adding, addError, onSubmit, onCancel,
}: {
  newUrl: string; setNewUrl: (v: string) => void;
  newTitle: string; setNewTitle: (v: string) => void;
  adding: boolean; addError: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="bg-slate-800/60 rounded-xl p-4 space-y-3 border border-slate-700">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Add Video URL</p>
      {addError && (
        <p className="text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg">{addError}</p>
      )}
      <input
        type="url"
        className="input w-full text-sm"
        placeholder="https://www.youtube.com/watch?v=..."
        value={newUrl}
        onChange={(e) => setNewUrl(e.target.value)}
        required
        autoFocus
      />
      <input
        className="input w-full text-sm"
        placeholder="Label (optional) — e.g. Float Serve Technique"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
      />
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary text-xs flex-1 py-1.5">
          Cancel
        </button>
        <button type="submit" disabled={adding} className="btn-primary text-xs flex-1 py-1.5">
          {adding ? 'Adding…' : 'Add Video'}
        </button>
      </div>
    </form>
  );
}

// ─── Drill Detail Modal ────────────────────────────────────────────────────────

function DrillModal({
  drill: initialDrill,
  onClose,
}: {
  drill: DrillRow;
  onClose: () => void;
}) {
  const [drill, setDrill] = useState(initialDrill);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); },
    [onClose],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const cues: CoachingCue[] = Array.isArray(drill.coaching_cues) ? drill.coaching_cues : [];

  // Build video list: prefer video_urls array, fall back to legacy video_url
  const videos: VideoEntry[] = drill.video_urls?.length
    ? drill.video_urls
    : drill.video_url
    ? [{ url: drill.video_url, title: 'Drill Demo' }]
    : [];

  // Coaches can edit org drills but not system drills
  const canEdit = !!drill.organization_id;

  const videoCount = videos.length;

  return (
    <div
      data-drill-modal
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.80)' }}
      onClick={handleBackdrop}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-800 shrink-0">
          <div className="flex-1 pr-4 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-400">
                {capitalize(drill.skill_type)}
              </span>
              <span className="text-slate-600">·</span>
              <span className={`text-xs font-semibold ${difficultyClass(drill.difficulty)}`}>
                {capitalize(drill.difficulty)}
              </span>
              {videoCount > 0 && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-brand-400 font-medium">
                    ▶ {videoCount} video{videoCount !== 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">{drill.name}</h2>
            <p className="text-slate-400 text-sm mt-1 line-clamp-2">{drill.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors flex-shrink-0 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6">
          {/* ── Video Carousel ─────────────────────────────────────────── */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Videos
              {videoCount > 1 && (
                <span className="ml-2 text-slate-600 normal-case font-normal">
                  Use arrows or thumbnails to navigate · ← → keys supported
                </span>
              )}
            </h3>
            <VideoCarousel
              videos={videos}
              drillId={drill.id}
              canEdit={canEdit}
              onVideosUpdated={(updated) =>
                setDrill((d) => ({ ...d, video_urls: updated }))
              }
            />
          </section>

          {/* ── Instructions ───────────────────────────────────────────── */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Instructions
            </h3>
            <ol className="space-y-2">
              {drill.instructions.split('\n').filter(Boolean).map((step, i) => {
                const clean = step.replace(/^\d+\.\s*/, '');
                return (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-brand-500/20 text-brand-400 text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-slate-300 text-sm">{clean}</span>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* ── Coaching Cues ───────────────────────────────────────────── */}
          {cues.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Coaching Cues
              </h3>
              <ul className="space-y-2">
                {cues.map((cue, i) => {
                  const text = cue.cue_text ?? cue.cueText ?? String(cue);
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-brand-400 mt-0.5">›</span>
                      <span>{text}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* ── Meta ───────────────────────────────────────────────────── */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {drill.equipment_required.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Equipment
                </h3>
                <div className="flex flex-wrap gap-1">
                  {drill.equipment_required.map((e) => (
                    <span key={e} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                      {capitalize(e)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {drill.positions_relevant.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Positions
                </h3>
                <div className="flex flex-wrap gap-1">
                  {drill.positions_relevant.map((p) => (
                    <span key={p} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                      {capitalize(p)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DrillLibraryPage() {
  const [drills, setDrills] = useState<DrillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [selectedDrill, setSelectedDrill] = useState<DrillRow | null>(null);

  useEffect(() => {
    async function fetchDrills() {
      setLoading(true);
      let query = supabase
        .from('drills')
        .select('*')
        .is('deleted_at', null)
        .order('skill_type')
        .order('name');

      if (skillFilter) query = query.eq('skill_type', skillFilter);
      if (difficultyFilter) query = query.eq('difficulty', difficultyFilter);
      if (search) query = query.ilike('name', `%${search}%`);

      const { data, error } = await query;
      if (!error && data) setDrills(data as DrillRow[]);
      setLoading(false);
    }
    fetchDrills();
  }, [search, skillFilter, difficultyFilter]);

  const systemCount = drills.filter((d) => !d.organization_id).length;
  const customCount = drills.filter((d) => d.organization_id).length;

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Drill Library</h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            {loading
              ? 'Loading drills…'
              : `${systemCount} system drill${systemCount !== 1 ? 's' : ''}${
                  customCount > 0 ? ` · ${customCount} custom` : ''
                } · Click any drill to view details & videos`}
          </p>
        </div>
        <button className="btn-primary shrink-0">+ Add Drill</button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
        <input
          type="text"
          placeholder="Search drills…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2
                     text-white placeholder:text-slate-500 text-sm focus:outline-none
                     focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
        <div className="flex gap-3">
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300"
          >
            <option value="">All Skills</option>
            {['serving', 'passing', 'setting', 'attacking', 'blocking', 'defense',
              'conditioning', 'strength', 'mobility'].map((s) => (
              <option key={s} value={s}>{capitalize(s)}</option>
            ))}
          </select>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300"
          >
            <option value="">All Levels</option>
            {['beginner', 'intermediate', 'advanced', 'elite'].map((d) => (
              <option key={d} value={d}>{capitalize(d)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Drill list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 h-16 animate-pulse bg-slate-800" />
          ))}
        </div>
      ) : drills.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg">No drills found.</p>
          <p className="text-sm mt-1">
            {search || skillFilter || difficultyFilter
              ? 'Try adjusting your filters.'
              : 'Run the drill_library.sql seed in Supabase to populate drills.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {drills.map((drill) => {
            const videoCount = drill.video_urls?.length
              || (drill.video_url ? 1 : 0);
            return (
              <button
                key={drill.id}
                onClick={() => setSelectedDrill(drill)}
                className="w-full card p-4 flex items-center gap-4 hover:bg-slate-800/50 cursor-pointer transition-colors text-left"
              >
                {/* Video indicator */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    videoCount > 0 ? 'bg-brand-500/20' : 'bg-slate-800'
                  }`}
                >
                  {videoCount > 0 ? (
                    <svg className="w-5 h-5 text-brand-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{drill.name}</h3>
                  <div className="flex items-center flex-wrap gap-2 mt-0.5">
                    <span className="text-xs text-slate-400">{capitalize(drill.skill_type)}</span>
                    <span className="text-slate-600">·</span>
                    <span className={`text-xs font-semibold ${difficultyClass(drill.difficulty)}`}>
                      {capitalize(drill.difficulty)}
                    </span>
                    {videoCount > 0 && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs text-brand-400 font-medium">
                          ▶ {videoCount} video{videoCount !== 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${difficultyBadgeClass(drill.difficulty)}`}>
                    {capitalize(drill.difficulty)}
                  </span>
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded hidden sm:inline">
                    {drill.organization_id ? 'Custom' : 'System'}
                  </span>
                  <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Drill detail modal */}
      {selectedDrill && (
        <DrillModal
          drill={selectedDrill}
          onClose={() => setSelectedDrill(null)}
        />
      )}
    </div>
  );
}
