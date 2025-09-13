import React, { useEffect, useState } from "react";
import { TMDBWatchProviders } from "@/types";

const TMDB_CONFIG = {
  apiKey: "a0b8875c7b4b0ae623e5b39c0a83b8ea",
  baseUrl: "https://api.themoviedb.org/3",
  imageBaseUrl: "https://image.tmdb.org/t/p/w92",
};

interface WhereToWatchProps {
  title: string;
  region?: string;
}

interface LoadingState {
  loading: boolean;
  error: boolean;
  empty: boolean;
}

export default function WhereToWatch({ title, region = "US" }: WhereToWatchProps) {
  const [providers, setProviders] = useState<TMDBWatchProviders | null>(null);
  const [state, setState] = useState<LoadingState>({ loading: true, error: false, empty: false });

  useEffect(() => {
    let isCancelled = false;

    const fetchProviders = async () => {
      if (!TMDB_CONFIG.apiKey) {
        setState({ loading: false, error: true, empty: false });
        return;
      }

      setState({ loading: true, error: false, empty: false });

      try {
        // First, search for the movie to get its ID
        const searchUrl = `${TMDB_CONFIG.baseUrl}/search/movie?api_key=${TMDB_CONFIG.apiKey}&query=${encodeURIComponent(title)}`;
        const searchResponse = await fetch(searchUrl);
        
        if (!searchResponse.ok) {
          throw new Error("Search failed");
        }

        const searchData = await searchResponse.json();
        
        if (!searchData.results?.length) {
          if (!isCancelled) {
            setState({ loading: false, error: false, empty: true });
          }
          return;
        }

        const movieId = searchData.results[0].id;

        // Then get watch providers for that movie
        const providersUrl = `${TMDB_CONFIG.baseUrl}/movie/${movieId}/watch/providers?api_key=${TMDB_CONFIG.apiKey}`;
        const providersResponse = await fetch(providersUrl);

        if (!providersResponse.ok) {
          throw new Error("Providers fetch failed");
        }

        const providersData = await providersResponse.json();
        const regionProviders = providersData.results?.[region];

        if (!isCancelled) {
          if (regionProviders && (regionProviders.flatrate?.length || regionProviders.rent?.length || regionProviders.buy?.length)) {
            setProviders(regionProviders);
            setState({ loading: false, error: false, empty: false });
          } else {
            setState({ loading: false, error: false, empty: true });
          }
        }
      } catch (error) {
        console.error("Error fetching watch providers:", error);
        if (!isCancelled) {
          setState({ loading: false, error: true, empty: false });
        }
      }
    };

    fetchProviders();

    return () => {
      isCancelled = true;
    };
  }, [title, region]);

  if (state.loading) return <div className="text-sm opacity-70">Fetching where to watch…</div>;
  if (state.error)   return <div className="text-sm text-red-400">Couldn't load availability.</div>;
  if (!providers || (!providers.flatrate?.length && !providers.rent?.length && !providers.buy?.length)) {
    return <div className="text-sm opacity-70">No availability found for your region.</div>;
  }

  const rows = [
    { label: "Stream", items: providers.flatrate || [] },
    { label: "Rent", items: providers.rent || [] },
    { label: "Buy", items: providers.buy || [] }
  ].filter(row => row.items.length > 0).map(row => ({
    label: row.label,
    items: row.items.map((p: any) => ({
      name: p.provider_name,
      logo: `${TMDB_CONFIG.imageBaseUrl}${p.logo_path}`
    }))
  }));

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      {rows.map((row, i) => (
        <div key={i} className={i ? "mt-3 pt-3 border-t border-white/10" : ""}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-2">{row.label}</div>

          {/* providers as compact chips */}
          <div className="flex flex-wrap gap-2">
            {row.items.map((p) => (
              <span
                key={p.name}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-xs"
              >
                {p.logo && (
                  <img
                    src={p.logo}
                    alt=""
                    className="w-6 h-6 object-contain rounded-sm pointer-events-none select-none"
                    loading="lazy"
                  />
                )}
                <span className="whitespace-nowrap">{p.name}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}