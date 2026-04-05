'use client';

import { useEffect, useState, useCallback } from 'react';
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
  coaching_cues: CoachingCue[];
  is_public: boolean;
  organization_id: string | null;
}

// ─── Video helpers ─────────────────────────────────────────────────────────────

function getYouTubeEmbedId(url: string): string | null {
  try {
    const u = new URL(url);
    // https://www.youtube.com/watch?v=VIDEO_ID
    if (u.hostname.includes('youtube.com') && u.pathname === '/watch') {
      return u.searchParams.get('v');
    }
    // https://youtu.be/VIDEO_ID
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1) || null;
    }
    // https://www.youtube.com/embed/VIDEO_ID
    if (u.hostname.includes('youtube.com') && u.pathname.startsWith('/embed/')) {
      return u.pathname.replace('/embed/', '') || null;
    }
  } catch {
    // ignore
  }
  return null;
}

function isYouTubeSearchUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.includes('youtube.com') && u.pathname === '/results';
  } catch {
    return false;
  }
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

// ─── Video Player Component ────────────────────────────────────────────────────

function VideoPlayer({ url }: { url: string }) {
  const embedId = getYouTubeEmbedId(url);

  if (embedId) {
    return (
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <iframe
          className="absolute inset-0 w-full h-full rounded-lg"
          src={`https://www.youtube.com/embed/${embedId}?rel=0&modestbranding=1`}
          title="Drill video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isYouTubeSearchUrl(url)) {
    // Show a YouTube-branded search link card
    return (
      <div className="flex flex-col items-center justify-center gap-4 bg-slate-800 rounded-lg py-10 px-6 text-center">
        <svg className="w-12 h-12 text-red-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
        </svg>
        <p className="text-slate-300 text-sm">Watch drill examples on YouTube</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-sm px-6 py-2"
        >
          Search on YouTube ↗
        </a>
      </div>
    );
  }

  // Generic video — try HTML5 player
  return (
    <video
      className="w-full rounded-lg max-h-80"
      src={url}
      controls
      preload="metadata"
    />
  );
}

// ─── Drill Detail Modal ────────────────────────────────────────────────────────

function DrillModal({ drill, onClose }: { drill: DrillRow; onClose: () => void }) {
  // Close on backdrop click or Escape
  const handleBackdrop = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const cues: CoachingCue[] = Array.isArray(drill.coaching_cues) ? drill.coaching_cues : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={handleBackdrop}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-400">
                {capitalize(drill.skill_type)}
              </span>
              <span className="text-slate-600">·</span>
              <span className={`text-xs font-semibold ${difficultyClass(drill.difficulty)}`}>
                {capitalize(drill.difficulty)}
              </span>
            </div>
            <h2 className="text-xl font-black text-white">{drill.name}</h2>
            <p className="text-slate-400 text-sm mt-1">{drill.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors flex-shrink-0 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Video */}
          {drill.video_url && (
            <section>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
                Video
              </h3>
              <VideoPlayer url={drill.video_url} />
            </section>
          )}

          {/* Instructions */}
          <section>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
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

          {/* Coaching Cues */}
          {cues.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
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

          {/* Meta */}
          <section className="grid grid-cols-2 gap-4">
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
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Drill Library</h1>
          <p className="text-slate-400 mt-1">
            {loading
              ? 'Loading drills…'
              : `${systemCount} system drill${systemCount !== 1 ? 's' : ''}${
                  customCount > 0 ? ` · ${customCount} custom` : ''
                } · Click any drill to view details & video`}
          </p>
        </div>
        <button className="btn-primary">+ Add Drill</button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search drills…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2
                     text-white placeholder:text-slate-500 text-sm focus:outline-none
                     focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
        <select
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300"
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
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300"
        >
          <option value="">All Levels</option>
          {['beginner', 'intermediate', 'advanced', 'elite'].map((d) => (
            <option key={d} value={d}>{capitalize(d)}</option>
          ))}
        </select>
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
          {drills.map((drill) => (
            <button
              key={drill.id}
              onClick={() => setSelectedDrill(drill)}
              className="w-full card p-4 flex items-center gap-4 hover:bg-slate-800/50
                         cursor-pointer transition-colors text-left"
            >
              {/* Video indicator */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                drill.video_url ? 'bg-brand-500/20' : 'bg-slate-800'
              }`}>
                {drill.video_url ? (
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
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400">{capitalize(drill.skill_type)}</span>
                  <span className="text-slate-600">·</span>
                  <span className={`text-xs font-semibold ${difficultyClass(drill.difficulty)}`}>
                    {capitalize(drill.difficulty)}
                  </span>
                  {drill.video_url && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="text-xs text-brand-400 font-medium">▶ Video</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    difficultyBadgeClass(drill.difficulty)
                  }`}
                >
                  {capitalize(drill.difficulty)}
                </span>
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                  {drill.organization_id ? 'Custom' : 'System'}
                </span>
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Drill detail modal */}
      {selectedDrill && (
        <DrillModal drill={selectedDrill} onClose={() => setSelectedDrill(null)} />
      )}
    </div>
  );
}
