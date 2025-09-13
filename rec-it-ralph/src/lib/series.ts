import seriesMap from "@/data/seriesMap.json";
import { SequelDetectionResult } from "@/types";

/**
 * Detects if a movie is a sequel and returns information about its series
 */
export function detectSequel(title: string, customSeriesMap?: Record<string, string[]>): SequelDetectionResult {
  const map = customSeriesMap || seriesMap;
  
  // Normalize title for comparison
  const normalizedTitle = title.toLowerCase().trim();

  // 1. Check series mapping first
  for (const [series, movies] of Object.entries(map)) {
    const movieIndex = findMovieInSeries(normalizedTitle, movies);
    if (movieIndex !== -1) {
      const isSequel = movieIndex > 0;
      return {
        isSequel,
        firstTitle: isSequel ? movies[0] : undefined,
        series,
        position: movieIndex + 1,
      };
    }
  }

  // 2. Heuristic detection for common sequel patterns
  const heuristicResult = detectSequelHeuristically(normalizedTitle);
  if (heuristicResult.isSequel) {
    return heuristicResult;
  }

  return { isSequel: false };
}

/**
 * Finds a movie in a series array using fuzzy matching
 */
function findMovieInSeries(title: string, movies: string[]): number {
  const normalizedTitle = title.toLowerCase().trim();

  // First try exact match
  for (let i = 0; i < movies.length; i++) {
    if (movies[i].toLowerCase().trim() === normalizedTitle) {
      return i;
    }
  }

  // Then try partial matches (for cases like "Toy Story" matching "Toy Story (1995)")
  for (let i = 0; i < movies.length; i++) {
    const movieTitle = movies[i].toLowerCase().trim();
    if (normalizedTitle.includes(movieTitle) || movieTitle.includes(normalizedTitle)) {
      // Additional check to avoid false matches
      const shorterTitle = normalizedTitle.length < movieTitle.length ? normalizedTitle : movieTitle;
      const longerTitle = normalizedTitle.length >= movieTitle.length ? normalizedTitle : movieTitle;
      
      // If the shorter title is a significant portion of the longer title, consider it a match
      if (longerTitle.startsWith(shorterTitle) || longerTitle.includes(shorterTitle)) {
        return i;
      }
    }
  }

  return -1;
}

/**
 * Uses heuristics to detect sequels based on common patterns
 */
function detectSequelHeuristically(title: string): SequelDetectionResult {
  // Remove common prefixes/suffixes for better matching
  let cleanTitle = title
    .replace(/^(the|a|an)\s+/i, "")
    .replace(/\s+(movie|film)$/i, "")
    .trim();

  // Pattern 1: Numbers (2, 3, etc.)
  const numberMatch = cleanTitle.match(/\s+(\d+)$/);
  if (numberMatch) {
    const num = parseInt(numberMatch[1]);
    if (num > 1) {
      const baseTitle = cleanTitle.replace(/\s+\d+$/, "").trim();
      return {
        isSequel: true,
        firstTitle: baseTitle,
        series: baseTitle,
        position: num,
      };
    }
  }

  // Pattern 2: Roman numerals
  const romanMatch = cleanTitle.match(/\s+(ii|iii|iv|v|vi|vii|viii|ix|x)$/i);
  if (romanMatch) {
    const romanNumerals = { ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };
    const position = romanNumerals[romanMatch[1].toLowerCase() as keyof typeof romanNumerals];
    const baseTitle = cleanTitle.replace(/\s+(ii|iii|iv|v|vi|vii|viii|ix|x)$/i, "").trim();
    
    return {
      isSequel: true,
      firstTitle: baseTitle,
      series: baseTitle,
      position,
    };
  }

  // Pattern 3: "Part X" or "Part Two"
  const partMatch = cleanTitle.match(/\s+part\s+(two|three|four|five|six|seven|eight|nine|ten|\d+)$/i);
  if (partMatch) {
    const partWords = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
    let position = 1;
    
    const partValue = partMatch[1].toLowerCase();
    if (partWords[partValue as keyof typeof partWords]) {
      position = partWords[partValue as keyof typeof partWords];
    } else if (/^\d+$/.test(partValue)) {
      position = parseInt(partValue);
    }

    if (position > 1) {
      const baseTitle = cleanTitle.replace(/\s+part\s+(two|three|four|five|six|seven|eight|nine|ten|\d+)$/i, "").trim();
      return {
        isSequel: true,
        firstTitle: baseTitle,
        series: baseTitle,
        position,
      };
    }
  }

  // Pattern 4: Colon-separated titles (often indicate sequels)
  const colonMatch = cleanTitle.match(/^([^:]+):\s*(.+)$/);
  if (colonMatch) {
    const baseTitle = colonMatch[1].trim();
    const subtitle = colonMatch[2].trim();
    
    // Check if subtitle suggests it's a sequel
    if (subtitle.match(/(return|revenge|rise|strikes back|awakens|continues|returns|reloaded|revolutions|resurrections)/i)) {
      return {
        isSequel: true,
        firstTitle: baseTitle,
        series: baseTitle,
        position: 2, // We can't determine exact position without more info
      };
    }
  }

  return { isSequel: false };
}