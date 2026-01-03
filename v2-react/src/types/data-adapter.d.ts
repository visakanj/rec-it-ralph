/**
 * TypeScript Definitions for DataAdapter
 *
 * Phase 0: Minimal types for core methods
 * Will be expanded incrementally in future phases as we wire more screens
 */

// Contributor interface
export interface Contributor {
  id: string;
  name: string;
  color: string;
  movies: string[];
}

// Movie interface (from Firebase)
export interface Movie {
  title: string;
  tmdbData?: {
    poster_path?: string;
    backdrop_path?: string;
    overview?: string;
    release_date?: string;
    vote_average?: number;
    runtime?: number;
    id?: number;
  };
  suggestedBy: string[];
  addedAt: number;
}

// Watched movie interface
export interface WatchedMovie extends Movie {
  watchedAt: number;
}

// Room data interface (Firebase RTDB schema)
export interface RoomData {
  theme: string;
  contributors: Contributor[];
  moviePool: Movie[];
  watchedMovies: WatchedMovie[];
  tonightPick?: Movie;
}

// Room history item (localStorage)
export interface RoomHistoryItem {
  roomCode: string;
  theme: string;
  lastVisited: number;
  createdAt: number;
}

// DataAdapter class definition
export interface DataAdapter {
  // Ready promise
  readyPromise: Promise<void>;

  // Room management (Phase 0-2)
  getRoomCode(): string | null;
  getRoomData(): RoomData | null;
  fetchRoomData(roomCode: string): Promise<RoomData | null>;
  subscribeRoom(roomCode: string, callback: (data: RoomData) => void): () => void;
  createRoom(theme: string): Promise<string>;
  joinRoom(roomCode: string): Promise<boolean>;
  getRoomHistory(): RoomHistoryItem[];
  getTheme(): string;

  // Contributors (Phase 3)
  addContributor(name: string): Contributor;
  getContributors(): Contributor[];
  removeContributor(contributorId: string): void;

  // Movies (Phase 3)
  addMovie(contributorId: string, title: string): Promise<Movie>;
  getMoviePool(): Movie[];
  removeMovie(movieIndex: number): void;

  // NOTE: Additional methods will be added in future phases:
  // - pickTonightMovie(), getTonightPick(), clearTonightPick() (Phase 4-5)
  // - markWatched(), getWatchedMovies(), undoWatched() (Phase 5-6)
  // - getInviteLink(), copyToClipboard() (Phase 7)
}

// Global window augmentation
declare global {
  interface Window {
    v2Adapter: DataAdapter;
    firebase: any;
    database: any;
    appState: any;
    tmdbService: any;
    RECITRALPH_V2_MODE: boolean;
  }
}

export {};
