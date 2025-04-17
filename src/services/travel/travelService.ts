// src/services/travel/travelService.ts
import { TravelPreferences } from '../../types/travel';
import {
  FlightSearchParams,
  HotelSearchParams,
  ActivitySearchParams,
  FlightOption,
  HotelOption,
  ActivityOption,
  UnsplashImage
} from '../../types/travelService';

class TravelService {
  // Quick availability search using server-side API endpoint
  async getQuickAvailability(preferences: Partial<TravelPreferences>) {
    console.log('Getting quick availability for:', preferences);
    
    if (!preferences.origin || !preferences.destination || !preferences.dates?.departure) {
      throw new Error('Origin, destination, and departure date are required for availability search');
    }
    
    try {
      // Call our server-side API endpoint that handles Amadeus credentials securely
      const response = await fetch('/api/travel/quick-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: preferences.origin,
          destination: preferences.destination,
          // Pass IATA codes if available
          originCode: preferences.originCode,
          destinationCode: preferences.destinationCode,
          departureDate: preferences.dates.departure,
          returnDate: preferences.dates.return || '',
          travelers: preferences.travelers || 1
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Quick availability search failed: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Quick availability search failed:', error);
      // Fallback to mock data if API call fails
      return this.generateMockQuickAvailability(preferences);
    }
  }
  
  // Search flights using server-side API
  async searchFlights(flightParams: FlightSearchParams): Promise<FlightOption[]> {
    console.log('Searching flights with params:', flightParams);
    
    try {
      const response = await fetch('/api/travel/search-flights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flightParams),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Flight search failed: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Flight search failed:', error);
      // Fallback to mock data if API call fails
      return this.generateMockFlights(flightParams);
    }
  }
  
  // Search hotels using server-side API
  async searchHotels(hotelParams: HotelSearchParams): Promise<HotelOption[]> {
    console.log('Searching hotels with params:', hotelParams);
    
    try {
      const response = await fetch('/api/travel/search-hotels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hotelParams),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Hotel search failed: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Hotel search failed:', error);
      // Fallback to mock data if API call fails
      return this.generateMockHotels(hotelParams);
    }
  }
  
  // Search activities using server-side API
  async searchActivities(activityParams: ActivitySearchParams): Promise<ActivityOption[]> {
    console.log('Searching activities with params:', activityParams);
    
    try {
      const response = await fetch('/api/travel/search-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityParams),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Activity search failed: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Activity search failed:', error);
      // Fallback to mock data if API call fails
      return this.generateMockActivities(activityParams);
    }
  }

  async fetchUnsplashImages(query: string, count: number = 1): Promise<UnsplashImage[]> {
    const res = await fetch(`/api/unsplash/search-images?query=${encodeURIComponent(query)}&count=${count}`);
  
    if (!res.ok) {
      throw new Error('Failed to fetch images');
    }
  
    const data = await res.json();
    return data.results; // array of images
  };
  
  
  // Mock data generation functions (as fallbacks)
  private generateMockQuickAvailability(preferences: Partial<TravelPreferences>) {
    const destination = preferences.destination || 'Paris';
    const origin = preferences.origin || 'New York';
    const destinationCode = preferences.destinationCode || this.getDefaultCityCode(destination);
    const originCode = preferences.originCode || this.getDefaultCityCode(origin);
    
    return {
      flights: {
        airlines: ['Air France', 'American Airlines', 'Delta'],
        minPrice: 650,
        maxPrice: 1200,
        cabinClasses: ['economy', 'business', 'first'],
        availableStops: [0, 1]
      },
      hotels: {
        priceRanges: [{ min: 120, max: 450 }],
        categories: ['luxury', 'boutique', 'budget'],
        amenities: ['WiFi', 'Pool', 'Breakfast', 'Spa', 'Fitness Center']
      },
      activities: {
        categories: ['sightseeing', 'museum', 'cruise', 'tour', 'adventure'],
        priceRanges: [{ min: 20, max: 200 }]
      },
      rawResults: {
        flights: this.generateMockFlights({
          origin, 
          destination,
          originCode,
          destinationCode
        } as FlightSearchParams),
        hotels: this.generateMockHotels({
          location: destination,
          destinationCode
        } as HotelSearchParams),
        activities: this.generateMockActivities({
          destination
        } as ActivitySearchParams)
      }
    };
  }
  
  // Helper to get default city code
  private getDefaultCityCode(cityName: string): string {
    const cityCodes: Record<string, string> = {
      'New York': 'NYC',
      'NYC': 'NYC',
      'Paris': 'PAR',
      'London': 'LON',
      'Tokyo': 'TYO',
      'Rome': 'ROM',
      'Los Angeles': 'LAX',
      'LA': 'LAX',
      'San Francisco': 'SFO',
      'Berlin': 'BER',
      'Madrid': 'MAD',
      'Barcelona': 'BCN',
      'Miami': 'MIA',
      'Chicago': 'CHI',
      'Sydney': 'SYD',
      'Toronto': 'YTO',
      'Bangkok': 'BKK',
      'Singapore': 'SIN',
      'Hong Kong': 'HKG',
      'Dubai': 'DXB',
      'Las Vegas': 'LAS',
      'Amsterdam': 'AMS',
      'Bordeaux': 'BOD',
    };
    
    // Try to match as-is first
    if (cityCodes[cityName]) {
      return cityCodes[cityName];
    }
    
    // Try case-insensitive match
    const normalizedCityName = cityName.toLowerCase();
    for (const [key, value] of Object.entries(cityCodes)) {
      if (key.toLowerCase() === normalizedCityName) {
        return value;
      }
    }
    
    // Fallback to first 3 letters
    return cityName.substring(0, 3).toUpperCase();
  }
  
  // Helper methods to generate mock data (unchanged from original)
  private generateMockFlights(preferences: Partial<FlightSearchParams>): FlightOption[] {
    const destination = preferences.destination || 'Paris';
    const origin = preferences.origin || 'New York';
    const destinationCode = preferences.destinationCode || this.getDefaultCityCode(destination);
    const originCode = preferences.originCode || this.getDefaultCityCode(origin);
    const airlines = preferences.airlines || ['Air France', 'American Airlines', 'Delta'];
    
    return [
      {
        id: 'flight-1',
        airline: airlines[0],
        flightNumber: 'AF1234',
        departureAirport: originCode,
        departureTime: '10:30 AM',
        arrivalAirport: destinationCode,
        arrivalTime: '6:30 AM',
        price: 750,
        duration: '10h 30m',
        cabinClass: preferences.class || 'economy',
        stops: 0,
      },
      {
        id: 'flight-2',
        airline: airlines[1],
        flightNumber: 'AA789',
        departureAirport: originCode,
        departureTime: '1:15 PM',
        arrivalAirport: destinationCode,
        arrivalTime: '9:30 AM',
        price: 820,
        duration: '11h 15m',
        cabinClass: preferences.class || 'economy',
        stops: 1,
      },
      {
        id: 'flight-3',
        airline: airlines[2],
        flightNumber: 'DL456',
        departureAirport: originCode,
        departureTime: '7:45 PM',
        arrivalAirport: destinationCode,
        arrivalTime: '3:50 AM',
        price: 690,
        duration: '9h 45m',
        cabinClass: preferences.class || 'economy',
        stops: 1,
      }
    ];
  }
  
  private generateMockHotels(preferences: Partial<HotelSearchParams>): HotelOption[] {
    const destination = preferences.location || 'Paris';
    const hotelTypes = preferences.accommodation?.type?.toLowerCase() || '';
    
    let hotelList = [
      {
        id: 'hotel-1',
        name: destination === 'Paris' ? 'Grand Hotel Paris' : 'Luxury Central Hotel',
        address: 'Central ' + destination,
        rating: 4.8,
        pricePerNight: 280,
        images: [`https://source.unsplash.com/featured/?hotel,${destination.toLowerCase()}`],
        amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant'],
        description: `Luxury hotel in the heart of ${destination}`,
      },
      {
        id: 'hotel-2',
        name: destination === 'Paris' ? 'Boutique Montmartre' : 'Downtown Suites',
        address: destination === 'Paris' ? 'Montmartre' : 'Downtown',
        rating: 4.6,
        pricePerNight: 180,
        images: [`https://source.unsplash.com/featured/?boutique,hotel,${destination.toLowerCase()}`],
        amenities: ['WiFi', 'Breakfast', 'Bar'],
        description: `Charming boutique hotel in a vibrant area of ${destination}`,
      },
      {
        id: 'hotel-3',
        name: destination === 'Paris' ? 'Seine River View' : 'Harbor View Inn',
        address: destination === 'Paris' ? 'Seine Riverbank' : 'Harbor District',
        rating: 4.4,
        pricePerNight: 210,
        images: [`https://source.unsplash.com/featured/?hotel,view,${destination.toLowerCase()}`],
        amenities: ['WiFi', 'Restaurant', 'Room Service', 'Fitness Center'],
        description: `Comfortable hotel with stunning views in ${destination}`,
      }
    ];
    
    // Filter by hotel type if specified
    if (hotelTypes.includes('budget') || hotelTypes.includes('cheap')) {
      hotelList = hotelList.filter(h => h.pricePerNight < 200);
    } else if (hotelTypes.includes('luxury')) {
      hotelList = hotelList.filter(h => h.pricePerNight > 250);
    }
    
    return hotelList;
  }
  
  private generateMockActivities(preferences: Partial<ActivitySearchParams>): ActivityOption[] {
    const destination = preferences.destination || 'Paris';
    const interests = preferences.activities?.interests || [];
    
    // Initialize with proper type annotation and use const instead of let
    const defaultActivities: ActivityOption[] = [
      {
        id: 'activity-1',
        name: destination === 'Paris' ? 'Eiffel Tower Tour' : 'City Landmark Tour',
        description: `Visit the famous landmark of ${destination}`,
        location: 'Central ' + destination,
        price: 25,
        rating: 4.7,
        duration: '2 hours',
        images: [`https://source.unsplash.com/featured/?${destination.toLowerCase()},landmark`],
        categories: ['sightseeing', 'landmark'],
        availableTimes: ['9:00 AM', '1:00 PM', '5:00 PM'],
      },
      {
        id: 'activity-2',
        name: destination === 'Paris' ? 'Seine River Cruise' : 'Harbor Cruise',
        description: `Relaxing cruise in ${destination}`,
        location: 'Waterfront, ' + destination,
        price: 35,
        rating: 4.5,
        duration: '1.5 hours',
        images: [`https://source.unsplash.com/featured/?${destination.toLowerCase()},river,cruise`],
        categories: ['cruise', 'sightseeing'],
        availableTimes: ['10:00 AM', '2:00 PM', '6:00 PM'],
      },
      {
        id: 'activity-3',
        name: destination === 'Paris' ? 'Louvre Museum' : 'National Museum',
        description: `Explore the famous museum of ${destination}`,
        location: 'Museum District, ' + destination,
        price: 20,
        rating: 4.9,
        duration: '3 hours',
        images: [`https://source.unsplash.com/featured/?${destination.toLowerCase()},museum`],
        categories: ['culture', 'museum', 'art'],
        availableTimes: ['9:00 AM', '12:00 PM', '3:00 PM'],
      }
    ];
    
    // Create a new array that includes the default activities
    const allActivities = [...defaultActivities];
    
    // Add interest-specific activities
    if (interests.length > 0) {
      interests.forEach((interest: string, index: number) => {
        allActivities.push({
          id: `activity-custom-${index}`,
          name: `${interest} in ${destination}`,
          description: `Enjoy ${interest} experiences in ${destination}`,
          location: 'Various locations in ' + destination,
          price: 45 + (index * 10),
          rating: 4.4,
          duration: '3 hours',
          images: [`https://source.unsplash.com/featured/?${destination.toLowerCase()},${interest}`],
          categories: [interest.toLowerCase()],
          availableTimes: ['9:00 AM', '1:00 PM'],
        });
      });
    }
    
    return allActivities;
  }
}

export const travelService = new TravelService();