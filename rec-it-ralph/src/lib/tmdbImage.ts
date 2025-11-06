export function tmdbPoster(path?: string, size: "w342"|"w500"|"w780" = "w500") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined;
}