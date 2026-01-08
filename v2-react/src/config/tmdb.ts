/**
 * TMDB API Configuration
 *
 * Configuration for The Movie Database (TMDB) API integration.
 * Used for movie data, posters, and streaming provider information.
 */

export const TMDB_CONFIG = {
  // API Key (from V1 app.js)
  apiKey: 'd226d9cc9623055bff481d969e31c343',

  // Base URLs
  baseUrl: 'https://api.themoviedb.org/3',
  imageBaseUrl: 'https://image.tmdb.org/t/p',

  // Image sizes
  posterSize: 'w342',
  largePosterSize: 'w500',
  backdropSize: 'w780',
  logoSize: 'w92', // For streaming provider logos

  // Cache settings
  cacheExpiry: 60 * 60 * 1000, // 1 hour (same as V1)

  // Default region for streaming providers
  defaultRegion: 'US'
}

/**
 * Helper function to build TMDB image URLs
 */
export function getTMDBImageUrl(path: string | undefined, size: string = 'w342'): string | undefined {
  if (!path) return undefined
  return `${TMDB_CONFIG.imageBaseUrl}/${size}${path}`
}
