export interface PoolMovie {
  id: string;
  title: string;
  posterUrl?: string;
  contributors?: string[];
}

export interface RoomState {
  roomId: string;
  roomCode?: string;
  theme: string;
  region?: string;
}

export interface TMDBProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface TMDBWatchProviders {
  flatrate?: TMDBProvider[];
  rent?: TMDBProvider[];
  buy?: TMDBProvider[];
}

export interface SequelDetectionResult {
  isSequel: boolean;
  firstTitle?: string;
  series?: string;
  position?: number;
}