// src/services/travel/utils.ts
import { parse, format } from 'date-fns';

// Map of common city names to IATA city codes
const cityCodeCache: Record<string, string> = {
  'new york': 'NYC',
  'nyc': 'NYC',
  'paris': 'PAR',
  'london': 'LON',
  'tokyo': 'TYO',
  'rome': 'ROM',
  'los angeles': 'LAX',
  'la': 'LAX',
  'san francisco': 'SFO',
  'berlin': 'BER',
  'madrid': 'MAD',
  'barcelona': 'BCN',
  'miami': 'MIA',
  'chicago': 'CHI',
  'sydney': 'SYD',
  'toronto': 'YTO',
  'bangkok': 'BKK',
  'singapore': 'SIN',
  'hong kong': 'HKG',
  'dubai': 'DXB',
  'las vegas': 'LAS',
  'amsterdam': 'AMS',
  'bordeaux': 'BOD',
  'nice': 'NCE',
  'marseille': 'MRS',
  'lyon': 'LYS',
  'orlando': 'MCO',
  'beijing': 'BJS',
  'shanghai': 'SHA',
  'munich': 'MUC',
  'frankfurt': 'FRA',
  'venice': 'VCE',
  'florence': 'FLR',
  'milan': 'MIL',
  'vienna': 'VIE',
  'seoul': 'SEL',
  'brussels': 'BRU',
  'athens': 'ATH',
  'prague': 'PRG',
  'zurich': 'ZRH',
  'geneva': 'GVA',
  'lisbon': 'LIS',
  'dublin': 'DUB',
};

/**
 * Get IATA city code from city name
 * In a real application, this would call a city/airport lookup API
 * @param cityName Name of the city
 * @returns IATA city code
 */
export async function getIATACode(cityName: string): Promise<string> {
  if (!cityName) return '';
  
  // Convert to lowercase for case-insensitive lookup
  const normalizedCityName = cityName.toLowerCase().trim();
  
  // Check cache first
  if (cityCodeCache[normalizedCityName]) {
    return cityCodeCache[normalizedCityName];
  }
  
  // In a real app, call a city search API if not in cache
  // For example, using Amadeus's City Search API:
  // https://developers.amadeus.com/self-service/category/air/api-doc/city-search
  
  // For this demo, we'll just use a fallback
  console.warn(`City code not found for "${cityName}", using first 3 letters as code`);
  
  // Use first 3 letters as a naive fallback (not recommended for production)
  const fallbackCode = normalizedCityName.slice(0, 3).toUpperCase();
  
  // Save to cache for future use
  cityCodeCache[normalizedCityName] = fallbackCode;
  
  return fallbackCode;
}

/**
 * Format a date string to YYYY-MM-DD format for Amadeus API
 * @param dateString Date string in various formats
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    // Handle common date formats
    let date: Date;
    
    // Check if it's already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Handle month name formats (e.g., "June 2023", "June 15, 2023")
    if (/[a-zA-Z]/.test(dateString)) {
      // Try to parse as month or month/year
      try {
        if (dateString.toLowerCase() === 'june') {
          // If just month name, assume current year and first day of month
          const currentYear = new Date().getFullYear();
          return `${currentYear}-06-01`;
        }
        
        // Try different formats
        const formats = [
          'MMMM yyyy', // "June 2023"
          'MMMM d, yyyy', // "June 15, 2023"
          'MMM yyyy', // "Jun 2023"
          'MMM d, yyyy', // "Jun 15, 2023"
        ];
        
        for (const fmt of formats) {
          try {
            date = parse(dateString, fmt, new Date());
            if (!isNaN(date.getTime())) {
              // If month-year only, set to first day of month
              if (fmt === 'MMMM yyyy' || fmt === 'MMM yyyy') {
                date.setDate(1);
              }
              return format(date, 'yyyy-MM-dd');
            }
          } catch (e:unknown) {
            const message = e instanceof Error ? e.message : String(e);
            console.error(`Error parsing date string "${dateString}": ${message}`);
            continue;
          }
        }
      } catch (e:unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error(`Error parsing date string "${dateString}": ${message}`);
      }
    }
    
    // Try to parse as JavaScript Date
    date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return format(date, 'yyyy-MM-dd');
    }
    
    // If all else fails, return as is
    console.warn(`Could not parse date: ${dateString}, returning as is`);
    return dateString;
  } catch (error) {
    console.error(`Error formatting date "${dateString}":`, error);
    // Return original string if parsing fails
    return dateString;
  }
}