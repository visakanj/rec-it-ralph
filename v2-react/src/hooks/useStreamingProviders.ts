import { useState, useEffect, useRef } from 'react'
import { TMDB_CONFIG } from '../config/tmdb'
import type { StreamingProvider } from '../types/data-adapter'

interface UseStreamingProvidersResult {
  providers: StreamingProvider[]
  loading: boolean
  error: Error | null
}

// In-memory cache to avoid refetching same movie
const providerCache = new Map<number, { data: StreamingProvider[]; timestamp: number }>()

/**
 * Custom hook to fetch streaming providers for a movie from TMDB API
 *
 * @param tmdbId - The TMDB movie ID
 * @param region - Region code (default: 'US')
 * @returns Object containing providers array, loading state, and error
 *
 * Implementation notes:
 * - Caches results for 1 hour to reduce API calls (matches V1 behavior)
 * - Returns only 'flatrate' providers (subscription streaming)
 * - Gracefully handles errors by returning empty array
 * - Auto-fetches when tmdbId changes
 */
export function useStreamingProviders(
  tmdbId: number | undefined,
  region: string = TMDB_CONFIG.defaultRegion
): UseStreamingProvidersResult {
  const [providers, setProviders] = useState<StreamingProvider[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    // Skip if no TMDB ID provided
    if (!tmdbId) {
      setProviders([])
      setLoading(false)
      setError(null)
      return
    }

    // Check cache first
    const cached = providerCache.get(tmdbId)
    if (cached && Date.now() - cached.timestamp < TMDB_CONFIG.cacheExpiry) {
      console.log('[useStreamingProviders] Using cached data for TMDB ID:', tmdbId)
      setProviders(cached.data)
      setLoading(false)
      setError(null)
      return
    }

    // Fetch from TMDB API
    const fetchProviders = async () => {
      setLoading(true)
      setError(null)

      try {
        const url = `${TMDB_CONFIG.baseUrl}/movie/${tmdbId}/watch/providers?api_key=${TMDB_CONFIG.apiKey}`
        console.log('[useStreamingProviders] Fetching providers for TMDB ID:', tmdbId)

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`TMDB API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        // Extract flatrate providers for specified region (e.g., US)
        const regionData = data.results?.[region]
        const flatrateProviders = regionData?.flatrate || []

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setProviders(flatrateProviders)
          setLoading(false)

          // Cache the result
          providerCache.set(tmdbId, {
            data: flatrateProviders,
            timestamp: Date.now()
          })

          console.log(`[useStreamingProviders] Found ${flatrateProviders.length} providers for ${region}:`,
            flatrateProviders.map((p: StreamingProvider) => p.provider_name).join(', ') || 'None')
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error fetching streaming providers')
        console.error('[useStreamingProviders] Error:', error)

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setError(error)
          setProviders([]) // Gracefully fail with empty array
          setLoading(false)
        }
      }
    }

    fetchProviders()
  }, [tmdbId, region])

  return { providers, loading, error }
}
