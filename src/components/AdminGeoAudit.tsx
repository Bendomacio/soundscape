import { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Loader,
  Check,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import type { SongLocation } from '../types';
import {
  batchAuditGeo,
  type GeoAuditResult,
  type GeoAuditProgress,
  type GeoAuditConfig,
  type GeoSeverity,
} from '../lib/geocode';
import { formatDistance } from '../lib/geo';

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

const CACHE_KEY = 'soundscape_geo_audit_results';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedAudit {
  timestamp: number;
  results: Array<[string, GeoAuditResult]>;
}

function loadCache(): Map<string, GeoAuditResult> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedAudit = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return new Map(cached.results);
  } catch {
    return null;
  }
}

function saveCache(results: Map<string, GeoAuditResult>) {
  try {
    const payload: CachedAudit = {
      timestamp: Date.now(),
      results: [...results.entries()],
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage full — ignore
  }
}

// ---------------------------------------------------------------------------
// Severity helpers
// ---------------------------------------------------------------------------

const SEVERITY_COLORS: Record<GeoSeverity, string> = {
  ok: '#10b981',
  suspicious: '#f59e0b',
  bad: '#ef4444',
};

const SEVERITY_LABELS: Record<GeoSeverity, string> = {
  ok: 'OK',
  suspicious: 'Suspicious',
  bad: 'Bad',
};

const SEVERITY_ICONS: Record<GeoSeverity, typeof Check> = {
  ok: Check,
  suspicious: AlertTriangle,
  bad: XCircle,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AdminGeoAuditProps {
  songs: SongLocation[];
  onUpdateSong: (songId: string, updates: Partial<SongLocation>) => void | Promise<void>;
  onRefreshSongs?: () => void;
}

type FilterMode = 'all' | 'suspicious' | 'bad';

export function AdminGeoAudit({ songs, onUpdateSong, onRefreshSongs }: AdminGeoAuditProps) {
  const [results, setResults] = useState<Map<string, GeoAuditResult>>(new Map());
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<GeoAuditProgress | null>(null);
  const [threshold, setThreshold] = useState(50);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  // Track which candidate index is chosen per song (default 0 = best)
  const [candidateChoice, setCandidateChoice] = useState<Map<string, number>>(new Map());

  // Load cached results on mount
  useEffect(() => {
    const cached = loadCache();
    if (cached && cached.size > 0) {
      setResults(cached);
    }
  }, []);

  // ---- Scan ----

  const handleScan = useCallback(async () => {
    setScanning(true);
    setProgress(null);
    setSelectedIds(new Set());
    setCandidateChoice(new Map());

    const config: GeoAuditConfig = {
      suspiciousThresholdKm: threshold,
      badThresholdKm: Math.max(threshold * 10, 500),
    };

    const auditResults = await batchAuditGeo(
      songs,
      (p) => setProgress(p),
      config
    );

    setResults(auditResults);
    saveCache(auditResults);
    setScanning(false);
    setProgress(null);
  }, [songs, threshold]);

  // ---- Derived data ----

  const resultList = [...results.values()];
  const okCount = resultList.filter((r) => r.severity === 'ok').length;
  const suspiciousCount = resultList.filter((r) => r.severity === 'suspicious').length;
  const badCount = resultList.filter((r) => r.severity === 'bad').length;
  const flaggedCount = suspiciousCount + badCount;

  const filteredResults = resultList.filter((r) => {
    if (filter === 'suspicious') return r.severity === 'suspicious';
    if (filter === 'bad') return r.severity === 'bad';
    return r.severity !== 'ok'; // 'all' = show only flagged
  });

  // ---- Selection helpers ----

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFlagged = () => {
    setSelectedIds(new Set(filteredResults.map((r) => r.songId)));
  };

  const deselectAll = () => setSelectedIds(new Set());

  // ---- Apply fixes ----

  const applyFixes = useCallback(async () => {
    setApplying(true);
    for (const id of selectedIds) {
      const result = results.get(id);
      if (!result || result.severity === 'ok') continue;

      const choiceIdx = candidateChoice.get(id) ?? 0;
      const candidate = result.candidates[choiceIdx];
      if (!candidate) continue;

      await onUpdateSong(id, {
        latitude: candidate.latitude,
        longitude: candidate.longitude,
      });
    }

    // Clear fixed songs from results (mark as ok)
    setResults((prev) => {
      const next = new Map(prev);
      for (const id of selectedIds) {
        const existing = next.get(id);
        if (existing) {
          const choiceIdx = candidateChoice.get(id) ?? 0;
          const candidate = existing.candidates[choiceIdx];
          if (candidate) {
            next.set(id, {
              ...existing,
              severity: 'ok',
              distanceKm: 0,
              suggestedLat: candidate.latitude,
              suggestedLng: candidate.longitude,
              suggestedPlaceName: candidate.placeName,
              currentLat: candidate.latitude,
              currentLng: candidate.longitude,
            });
          }
        }
      }
      saveCache(next);
      return next;
    });

    setSelectedIds(new Set());
    setApplying(false);
    onRefreshSongs?.();
  }, [selectedIds, results, candidateChoice, onUpdateSong, onRefreshSongs]);

  // ---- Render ----

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
      {/* Config + Scan */}
      <div style={{
        padding: '16px',
        background: 'var(--color-dark-lighter)',
        borderRadius: '12px',
        marginBottom: '16px',
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 8px 0' }}>
          Geolocation Audit
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 12px 0' }}>
          Geocode each song's location name via Google Maps and compare against stored coordinates.
          Songs with large mismatches are flagged for correction.
        </p>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '13px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Threshold:
            <input
              type="number"
              min={1}
              max={1000}
              value={threshold}
              onChange={(e) => setThreshold(Math.max(1, parseInt(e.target.value) || 50))}
              style={{
                width: '70px',
                padding: '6px 10px',
                background: 'var(--color-dark-card)',
                border: '1px solid var(--color-dark-card)',
                borderRadius: '6px',
                color: 'var(--color-text)',
                fontSize: '13px',
              }}
            />
            km
          </label>

          <button
            onClick={handleScan}
            disabled={scanning || songs.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: scanning ? 'var(--color-dark-card)' : 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: scanning ? 'not-allowed' : 'pointer',
              opacity: scanning ? 0.6 : 1,
            }}
          >
            {scanning ? (
              <>
                <Loader size={16} className="animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <MapPin size={16} />
                Scan All Songs ({songs.length})
              </>
            )}
          </button>

          {results.size > 0 && !scanning && (
            <button
              onClick={() => {
                setResults(new Map());
                localStorage.removeItem(CACHE_KEY);
                setSelectedIds(new Set());
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                background: 'var(--color-dark-card)',
                color: 'var(--color-text-muted)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={14} />
              Clear Results
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {scanning && progress && (
        <div style={{
          padding: '16px',
          background: 'var(--color-dark-lighter)',
          borderRadius: '12px',
          marginBottom: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
            Geocoding: {progress.songTitle}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
            {progress.current} / {progress.total}
          </div>
          <div style={{
            width: '100%',
            height: '4px',
            background: 'var(--color-dark-card)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${(progress.current / progress.total) * 100}%`,
              height: '100%',
              background: 'var(--color-primary)',
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      )}

      {/* Stats */}
      {results.size > 0 && !scanning && (
        <>
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}>
            <div style={{
              padding: '12px 16px',
              background: 'var(--color-dark-card)',
              borderRadius: '8px',
              flex: 1,
              minWidth: '80px',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>{okCount}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>OK</div>
            </div>
            <div style={{
              padding: '12px 16px',
              background: 'var(--color-dark-card)',
              borderRadius: '8px',
              flex: 1,
              minWidth: '80px',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>{suspiciousCount}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Suspicious</div>
            </div>
            <div style={{
              padding: '12px 16px',
              background: 'var(--color-dark-card)',
              borderRadius: '8px',
              flex: 1,
              minWidth: '80px',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>{badCount}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Bad</div>
            </div>
          </div>

          {/* Filter + Bulk actions */}
          {flaggedCount > 0 && (
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '12px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}>
              {/* Severity filter */}
              {(['all', 'suspicious', 'bad'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '6px 12px',
                    background: filter === f ? 'var(--color-dark-lighter)' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: filter === f ? 'white' : 'var(--color-text-muted)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {f === 'all' ? 'All Flagged' : f}
                </button>
              ))}

              <div style={{ flex: 1 }} />

              <button
                onClick={selectAllFlagged}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Select All ({filteredResults.length})
              </button>
              <button
                onClick={deselectAll}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Deselect All
              </button>
            </div>
          )}

          {/* Results list */}
          {flaggedCount > 0 ? (
            <div style={{
              border: '1px solid var(--color-dark-card)',
              borderRadius: '8px',
              marginBottom: '16px',
              maxHeight: '400px',
              overflowY: 'auto',
            }}>
              {filteredResults.map((result, idx) => {
                const Icon = SEVERITY_ICONS[result.severity];
                const color = SEVERITY_COLORS[result.severity];
                const isExpanded = expandedId === result.songId;
                const choiceIdx = candidateChoice.get(result.songId) ?? 0;

                return (
                  <div
                    key={result.songId}
                    style={{
                      borderBottom: idx < filteredResults.length - 1 ? '1px solid var(--color-dark-card)' : 'none',
                    }}
                  >
                    {/* Row */}
                    <div style={{
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: result.severity === 'bad' ? 'rgba(239, 68, 68, 0.05)' :
                                  result.severity === 'suspicious' ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(result.songId)}
                        onChange={() => toggleSelect(result.songId)}
                        style={{ cursor: 'pointer', flexShrink: 0 }}
                      />
                      <Icon size={16} style={{ color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.songTitle}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.songArtist} &middot; {result.locationName}
                        </div>
                      </div>
                      {/* Distance badge */}
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 10px',
                        borderRadius: '4px',
                        background: `${color}22`,
                        color,
                        whiteSpace: 'nowrap',
                        fontWeight: 600,
                      }}>
                        {formatDistance(result.distanceKm)}
                      </span>
                      {/* Expand button */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : result.songId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--color-text-muted)',
                          padding: '4px',
                          flexShrink: 0,
                        }}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div style={{
                        padding: '12px 12px 12px 50px',
                        background: 'var(--color-dark-card)',
                        fontSize: '13px',
                      }}>
                        <div style={{ display: 'flex', gap: '24px', marginBottom: '12px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '11px', marginBottom: '2px' }}>Current Coords</div>
                            <div>{result.currentLat.toFixed(5)}, {result.currentLng.toFixed(5)}</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '11px', marginBottom: '2px' }}>Suggested Coords</div>
                            <div>{result.suggestedLat.toFixed(5)}, {result.suggestedLng.toFixed(5)}</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '11px', marginBottom: '2px' }}>Suggested Place</div>
                            <div>{result.suggestedPlaceName || '—'}</div>
                          </div>
                        </div>

                        {/* Candidates list */}
                        {result.candidates.length > 1 && (
                          <div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '11px', marginBottom: '6px' }}>
                              Candidates ({result.candidates.length})
                            </div>
                            {result.candidates.map((c, ci) => (
                              <label
                                key={ci}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  background: choiceIdx === ci ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`candidate-${result.songId}`}
                                  checked={choiceIdx === ci}
                                  onChange={() => {
                                    setCandidateChoice((prev) => {
                                      const next = new Map(prev);
                                      next.set(result.songId, ci);
                                      return next;
                                    });
                                  }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {c.placeName}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                    {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                                    {c.types.length > 0 && <>{' '}&middot; {c.types.slice(0, 2).join(', ')}</>}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}

                        {result.error && (
                          <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>
                            Error: {result.error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              background: 'var(--color-dark-card)',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              All songs have correct coordinates!
            </div>
          )}

          {/* Apply fixes button */}
          {selectedIds.size > 0 && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={applyFixes}
                disabled={applying}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: applying ? 'not-allowed' : 'pointer',
                  opacity: applying ? 0.6 : 1,
                }}
              >
                {applying ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Apply Fixes ({selectedIds.size})
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {results.size === 0 && !scanning && (
        <div style={{
          padding: '32px',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: '13px',
        }}>
          Click "Scan All Songs" to check coordinates against location names.
          {loadCache() && (
            <div style={{ marginTop: '8px', color: 'var(--color-primary)', cursor: 'pointer' }}
              onClick={() => {
                const cached = loadCache();
                if (cached) setResults(cached);
              }}
            >
              Load cached results
            </div>
          )}
        </div>
      )}
    </div>
  );
}
