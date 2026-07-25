export interface LyricLine {
  /** Line start time in milliseconds. */
  timeMs: number;
  text: string;
}

export interface SyncedLyrics {
  lines: LyricLine[];
}
