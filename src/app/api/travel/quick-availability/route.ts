// src/app/api/travel/quick-availability/route.ts
import { NextResponse } from 'next/server';
import { getIATACode, formatDate } from '../../../../services/travel/utils';

// Define TypeScript interfaces for better type safety
// Flight related interfaces
interface FlightSegment {
  carrierCode?: string;
  number?: string;
  departure?: {
    iataCode?: string;
    at?: string;
  };
  arrival?: {
    iataCode?: string;
    at?: string;
  };
}

interface FlightItinerary {
  segments?: FlightSegment[];
  duration?: string;
}

interface FlightPrice {
  total?: string | number;
}

interface FareDetail {
  cabin?: string;
}

interface TravelerPricing {
  fareDetailsBySegment?: FareDetail[];
}

interface FlightOffer {
  id?: string;
  itineraries?: FlightItinerary[];
  price?: FlightPrice;
  travelerPricings?: TravelerPricing[];
}

interface TransformedFlight {
  id: string;
  airline: string;
  flightNumber: string;
  departureAirport: string;
  departureTime: string;
  arrivalAirport: string;
  arrivalTime: string;
  price: number;
  duration: string;
  cabinClass: string;
  stops: number;
}

// Hotel related interfaces
interface HotelAddress {
  lines?: string[];
  cityName?: string;
}

interface HotelDetails {
  hotelId?: string;
  name?: string;
  address?: HotelAddress;
  rating?: number;
  amenities?: string[];
  description?: {
    text?: string;
  };
}

interface HotelOffer {
  price?: {
    total?: string | number;
  };
  checkInDate?: string;
  checkOutDate?: string;
}

interface HotelOfferData {
  hotel?: HotelDetails;
  offers?: HotelOffer[];
}

interface TransformedHotel {
  id: string;
  name: string;
  address: string;
  rating: number;
  pricePerNight: number;
  images: string[];
  amenities: string[];
  description: string;
}

// Activity related interfaces
interface Activity {
  id: string;
  name: string;
  description: string;
  location: string;
  price: number;
  rating: number;
  duration: string;
  images: string[];
  categories: string[];
  availableTimes: string[];
}

// Response interface
interface QuickAvailabilityResponse {
  flights: {
    airlines: string[];
    minPrice: number;
    maxPrice: number;
    cabinClasses: string[];
    availableStops: number[];
  };
  hotels: {
    priceRanges: { min: number; max: number }[];
    categories: string[];
    amenities: string[];
  };
  activities: {
    categories: string[];
    priceRanges: { min: number; max: number }[];
  };
  rawResults: {
    flights: TransformedFlight[];
    hotels: TransformedHotel[];
    activities: Activity[];
  };
  analysis?: {
    hasMultipleAirlines: boolean;
    hasMultipleStops: boolean;
    hasFlexiblePricing: boolean;
    hotelPriceRange: {
      min: number;
      max: number;
    };
    hasHotelVariety: boolean;
    suggestedQuestions: string[];
  };
}

// Amadeus API credentials from server environment variables (secure)
const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com/v2';

// Token cache
let amadeusToken: string | null = null;
let tokenExpiry: Date | null = null;

// Get Amadeus API token
async function getAmadeusToken(): Promise<string> {
  // Return existing token if valid
  if (amadeusToken && tokenExpiry && new Date() < tokenExpiry) {
    return amadeusToken;
  }
  
  if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
    throw new Error('Amadeus API credentials not configured');
  }
  
  try {
    console.log('Getting new Amadeus API token');
    const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_CLIENT_ID,
        client_secret: AMADEUS_CLIENT_SECRET,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.statusText}`);
    }
    
    const data = await response.json();
    amadeusToken = data.access_token;
    
    // Set token expiry (usually 30 minutes, but subtract 1 minute for safety)
    const expiresIn = (data.expires_in || 1800) - 60;
    tokenExpiry = new Date(Date.now() + expiresIn * 1000);
    
    // At the end, ensure we're returning a non-null value
    if (!amadeusToken) {
        throw new Error('Failed to obtain Amadeus token');
    }

    return amadeusToken;
  } catch (error) {
    console.error('Error getting Amadeus token:', error);
    throw error;
  }
}

// Modify the POST function to fix the variable redeclaration issues

export async function POST(request: Request) {
  try {
    console.log("=== QUICK AVAILABILITY API CALL ===");
    const body = await request.json();
    const { origin, destination, departureDate, returnDate, travelers = 1 } = body;
    
    // Validate required parameters
    if (!origin || !destination || !departureDate) {
      console.log("Missing required parameters");
      return NextResponse.json(
        { error: 'Origin, destination, and departure date are required' },
        { status: 400 }
      );
    }
    
    console.log("Searching for quick availability with params:", {
      origin, destination, departureDate, returnDate, travelers
    });
    
    try {
      // Use provided codes or resolve city names to IATA codes
      const [originCode, destinationCode] = await Promise.all([
        origin.length === 3 ? origin : getIATACode(origin),
        destination.length === 3 ? destination : getIATACode(destination)
      ]);
      
      if (!originCode || !destinationCode) {
        console.log("Could not resolve city codes");
        return NextResponse.json(
          { error: 'Could not resolve city codes for origin or destination' },
          { status: 400 }
        );
      }
      
      console.log(`Resolved cities: ${origin} → ${originCode}, ${destination} → ${destinationCode}`);
      
      // Format dates
      const formattedDepartureDate = formatDate(departureDate);
      const formattedReturnDate = returnDate ? formatDate(returnDate) : '';
      
      // Try to get Amadeus API token
      let token;
      try {
        token = await getAmadeusToken();
      } catch (error) {
        console.error('Failed to get Amadeus token, using mock data:', error);
        return NextResponse.json({
          results: generateMockQuickAvailability(origin, destination)
        });
      }
      
      // Increase max parameter value to get more flight options (from 3 to 8)
      const [flightData, hotelData] = await Promise.allSettled([
        // Flight offers search (with increased max parameter)
        fetch(`${AMADEUS_BASE_URL}/shopping/flight-offers?originLocationCode=${originCode}&destinationLocationCode=${destinationCode}&departureDate=${formattedDepartureDate}${formattedReturnDate ? `&returnDate=${formattedReturnDate}` : ''}&adults=${travelers}&max=8`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(res => {
          if (!res.ok) {
            console.error(`Flight search API returned ${res.status}: ${res.statusText}`);
            return { data: [] };
          }
          return res.json();
        }).catch(err => {
          console.error('Flight search error:', err);
          return { data: [] };
        }),
        
        // Hotel offers search
        fetch(`${AMADEUS_BASE_URL}/shopping/hotel-offers?cityCode=${destinationCode}&checkInDate=${formattedDepartureDate}${formattedReturnDate ? `&checkOutDate=${formattedReturnDate}` : ''}&adults=${travelers}&radius=50&radiusUnit=KM&roomQuantity=1&currency=USD&sort=PRICE&max=5`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(res => {
          if (!res.ok) {
            console.error(`Hotel search API returned ${res.status}: ${res.statusText}`);
            return { data: [] };
          }
          return res.json();
        }).catch(err => {
          console.error('Hotel search error:', err);
          return { data: [] };
        })
      ]);
      
      // Process flight data
      let flightResults: FlightOffer[] = [];
      let transformedFlights: TransformedFlight[] = [];
      
      if (flightData.status === 'fulfilled' && flightData.value?.data?.length > 0) {
        flightResults = flightData.value.data;
        console.log(`Retrieved ${flightResults.length} flight offers`);
        // Log the first flight to debug
        if (flightResults.length > 0) {
          console.log('Sample flight data:', JSON.stringify(flightResults[0], null, 2).substring(0, 500) + '...');
        }
        
        // Transform API flight results
        transformedFlights = flightResults.map((flight: FlightOffer) => {
          // Get the departure segment
          const departureSegment = flight.itineraries?.[0]?.segments?.[0];
          // Get the last segment of the first itinerary
          const arrivalSegment = flight.itineraries?.[0]?.segments?.[
            (flight.itineraries?.[0]?.segments?.length || 1) - 1
          ];
          
          return {
            id: flight.id || `mock-${Math.random().toString(36).substring(2, 11)}`,
            airline: departureSegment?.carrierCode || 'Unknown',
            flightNumber: departureSegment?.number ? 
              `${departureSegment.carrierCode}${departureSegment.number}` : 
              'Unknown',
            departureAirport: departureSegment?.departure?.iataCode || originCode,
            departureTime: departureSegment?.departure?.at || new Date().toISOString(),
            arrivalAirport: arrivalSegment?.arrival?.iataCode || destinationCode,
            arrivalTime: arrivalSegment?.arrival?.at || new Date().toISOString(),
            price: typeof flight.price?.total === 'string' ? 
              parseFloat(flight.price.total) : 
              (typeof flight.price?.total === 'number' ? flight.price.total : 750),
            duration: flight.itineraries?.[0]?.duration || 'PT8H30M',
            cabinClass: flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY',
            stops: (flight.itineraries?.[0]?.segments?.length || 1) - 1,
          };
        });
      } else {
        console.log('Using mock flight data');
        transformedFlights = generateMockFlights(originCode, destinationCode, travelers);
      }
      
      // Process hotel data
      let hotelResults: HotelOfferData[] = [];
      let transformedHotels: TransformedHotel[] = [];
      
      if (hotelData.status === 'fulfilled' && hotelData.value?.data?.length > 0) {
        hotelResults = hotelData.value.data;
        console.log(`Retrieved ${hotelResults.length} hotel offers`);
        
        // Transform API hotel results
        transformedHotels = hotelResults.map((hotel: HotelOfferData) => ({
          id: hotel.hotel?.hotelId || `mock-hotel-${Math.random().toString(36).substring(2, 11)}`,
          name: hotel.hotel?.name || 'Grand Hotel',
          address: hotel.hotel?.address?.lines?.[0] 
                ? `${hotel.hotel.address.lines[0]}, ${hotel.hotel.address.cityName}`
                : `Central ${destination}`,
          rating: hotel.hotel?.rating || 4.5,
          pricePerNight: hotel.offers?.[0]?.price?.total 
                      ? parseFloat(hotel.offers[0].price.total as string) / (hotel.offers[0].checkOutDate 
                        ? Math.max(1, Math.ceil((new Date(hotel.offers[0].checkOutDate).getTime() - new Date(hotel.offers[0].checkInDate as string).getTime()) / (1000 * 60 * 60 * 24)))
                        : 1)
                      : 200,
          images: [`https://source.unsplash.com/featured/?hotel,${destination.toLowerCase()}`],
          amenities: hotel.hotel?.amenities || ['WiFi', 'Breakfast', 'Pool'],
          description: hotel.hotel?.description?.text || `Quality hotel in ${destination}`
        }));
      } else {
        console.log('Using mock hotel data');
        transformedHotels = generateMockHotels(destinationCode);
      }
      
      // Generate mock activities (Amadeus doesn't have an activities API)
      const activityResults = generateMockActivities(destination);
      
      // Process results into the format expected by the application
      
      // Extract all unique airlines from the flight data
      const airlines = [...new Set(flightResults.map((offer: FlightOffer) => 
        offer.itineraries?.[0]?.segments?.[0]?.carrierCode || 'Unknown'
      ))].filter(airline => airline !== 'Unknown');
      
      console.log('Available airlines:', airlines);
      
      // Extract flight prices, ensuring they are numbers
      const flightPrices = flightResults.map((offer: FlightOffer) => {
        const price = offer.price?.total;
        return typeof price === 'string' ? parseFloat(price) : (typeof price === 'number' ? price : 0);
      }).filter((price: number) => price > 0);
      
      console.log('Flight prices:', flightPrices);
      
      const minFlightPrice = flightPrices.length > 0 ? Math.min(...flightPrices) : 500;
      const maxFlightPrice = flightPrices.length > 0 ? Math.max(...flightPrices) : 1200;
      
      // REMOVE THESE DUPLICATE DECLARATIONS
      // const transformedFlights = flightResults.map((flight: FlightOffer) => { ... });
      // const transformedHotels = hotelResults.map((hotel: HotelOfferData) => ({ ... }));
      
      console.log(`Transformed ${transformedFlights.length} flights`);
      
      // Analyze the results to determine what choices are meaningful
      const availabilityAnalysis = {
        hasMultipleAirlines: airlines.length > 1,
        hasMultipleStops: [...new Set(transformedFlights.map((f: TransformedFlight) => f.stops))].length > 1,
        hasFlexiblePricing: maxFlightPrice - minFlightPrice > 100,
        hotelPriceRange: {
          min: Math.min(...transformedHotels.map((h: TransformedHotel) => h.pricePerNight)),
          max: Math.max(...transformedHotels.map((h: TransformedHotel) => h.pricePerNight))
        },
        hasHotelVariety: transformedHotels.length > 1,
        suggestedQuestions: [] as string[]
      };
      
      // Generate suggested follow-up questions based on the analysis
      if (!availabilityAnalysis.hasMultipleAirlines && transformedFlights.length > 0) {
        availabilityAnalysis.suggestedQuestions.push(
          `I see that only ${airlines[0]} offers flights for your trip. Would you prefer a direct flight or are you open to connections?`
        );
      }
      
      if (availabilityAnalysis.hasFlexiblePricing) {
        availabilityAnalysis.suggestedQuestions.push(
          `Flight prices range from $${Math.floor(minFlightPrice)} to $${Math.ceil(maxFlightPrice)}. What's your budget for flights?`
        );
      }
      
      if (availabilityAnalysis.hasHotelVariety) {
        availabilityAnalysis.suggestedQuestions.push(
          `Hotels in ${destination} range from $${Math.floor(availabilityAnalysis.hotelPriceRange.min)} to $${Math.ceil(availabilityAnalysis.hotelPriceRange.max)} per night. What's your accommodation budget?`
        );
      }
      
      // Combine all results
      const results: QuickAvailabilityResponse = {
        flights: {
          airlines,
          minPrice: minFlightPrice,
          maxPrice: maxFlightPrice,
          cabinClasses: ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'],
          availableStops: [...new Set(transformedFlights.map((f: TransformedFlight) => f.stops))]
        },
        hotels: {
          priceRanges: [{
            min: availabilityAnalysis.hotelPriceRange.min,
            max: availabilityAnalysis.hotelPriceRange.max
          }],
          categories: ['luxury', 'boutique', 'budget'],
          amenities: Array.from(new Set(transformedHotels.flatMap((h: TransformedHotel) => h.amenities)))
        },
        activities: {
          categories: Array.from(new Set(activityResults.flatMap(a => a.categories))),
          priceRanges: [{
            min: Math.min(...activityResults.map(a => a.price)),
            max: Math.max(...activityResults.map(a => a.price))
          }]
        },
        rawResults: {
          flights: transformedFlights,
          hotels: transformedHotels,
          activities: activityResults
        },
        analysis: availabilityAnalysis
      };
      
      return NextResponse.json({ results });
    } catch (error: unknown) {
      console.error('Error in quick availability search:', error);
      
      // Fall back to mock data
      return NextResponse.json({
        results: generateMockQuickAvailability(origin, destination)
      });
    }
  } catch (error: unknown) {
    console.error('Error in quick availability API:', error);
    return NextResponse.json(
      { error: typeof error === 'object' && error !== null && 'message' in error ? 
          (error as { message: string }).message : 'Failed to get travel availability' },
      { status: 500 }
    );
  } finally {
    console.log("=== END QUICK AVAILABILITY API CALL ===");
  }
}

// Mock data generation functions
function generateMockQuickAvailability(origin: string, destination: string): QuickAvailabilityResponse {
  // First generate the mock data for all components
  const mockFlights = generateMockFlights(origin, destination, 1);
  const mockHotels = generateMockHotels(destination);
  const mockActivities = generateMockActivities(destination);
  
  return {
    flights: {
      airlines: ['AF', 'AA', 'DL'],
      minPrice: 650,
      maxPrice: 1200,
      cabinClasses: ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'],
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
      flights: mockFlights,
      hotels: mockHotels,
      activities: mockActivities
    }
  };
}

function generateMockFlights(origin: string, destination: string, travelers: number = 1): TransformedFlight[] {
  const airlines = ['AF', 'AA', 'DL', 'UA', 'BA'];
  const mockFlights: TransformedFlight[] = [];
  
  // Generate 3 flights with different prices and times
  for (let i = 0; i < 3; i++) {
    const airline = airlines[i % airlines.length];
    const flightNumber = `${airline}${Math.floor(1000 + Math.random() * 9000)}`;
    const price = (600 + i * 100) * travelers;
    const stops = i % 2; // Alternate between direct and 1-stop
    
    mockFlights.push({
      id: `mock-flight-${i + 1}`,
      airline,
      flightNumber,
      departureAirport: origin.substring(0, 3),
      departureTime: `2023-12-01T${10 + i * 4}:30:00.000Z`,
      arrivalAirport: destination.substring(0, 3),
      arrivalTime: `2023-12-01T${18 + i * 4}:30:00.000Z`,
      price,
      duration: `PT${8 + i}H30M`,
      cabinClass: 'ECONOMY',
      stops,
    });
  }
  
  return mockFlights;
}

function generateMockHotels(destination: string): TransformedHotel[] {
  return [
    {
      id: 'mock-hotel-1',
      name: `Grand Hotel ${destination}`,
      address: `Central ${destination}`,
      rating: 4.8,
      pricePerNight: 280,
      images: [`https://source.unsplash.com/featured/?hotel,${destination.toLowerCase()}`],
      amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant'],
      description: `Luxury hotel in the heart of ${destination}`
    },
    {
      id: 'mock-hotel-2',
      name: `Boutique Stay ${destination}`,
      address: `Downtown ${destination}`,
      rating: 4.6,
      pricePerNight: 180,
      images: [`https://source.unsplash.com/featured/?boutique,hotel,${destination.toLowerCase()}`],
      amenities: ['WiFi', 'Breakfast', 'Bar'],
      description: `Charming boutique hotel in a vibrant area of ${destination}`
    },
    {
      id: 'mock-hotel-3',
      name: `${destination} View Inn`,
      address: `Scenic District, ${destination}`,
      rating: 4.4,
      pricePerNight: 210,
      images: [`https://source.unsplash.com/featured/?hotel,view,${destination.toLowerCase()}`],
      amenities: ['WiFi', 'Restaurant', 'Room Service', 'Fitness Center'],
      description: `Comfortable hotel with stunning views in ${destination}`
    }
  ];
}

function generateMockActivities(destination: string): Activity[] {
  const activities = [
    {
      id: 'act-1',
      name: `${destination} City Tour`,
      description: `Explore the highlights of ${destination} with an expert local guide.`,
      location: `Downtown ${destination}`,
      price: 40,
      rating: 4.5,
      duration: '3 hours',
      images: [`https://source.unsplash.com/featured/?city,tour,${destination.toLowerCase()}`],
      categories: ['sightseeing', 'tour'],
      availableTimes: ['9:00 AM', '1:00 PM', '3:00 PM']
    },
    {
      id: 'act-2',
      name: `${destination} Food Experience`,
      description: `Taste the local cuisine and discover the culinary secrets of ${destination}.`,
      location: `Various locations in ${destination}`,
      price: 65,
      rating: 4.7,
      duration: '3 hours',
      images: [`https://source.unsplash.com/featured/?food,${destination.toLowerCase()}`],
      categories: ['food', 'tour', 'culture'],
      availableTimes: ['11:00 AM', '5:00 PM']
    },
    {
      id: 'act-3',
      name: `${destination} Museum Pass`,
      description: `Access to the top museums and cultural attractions in ${destination}.`,
      location: `Cultural District, ${destination}`,
      price: 25,
      rating: 4.8,
      duration: '1 day',
      images: [`https://source.unsplash.com/featured/?museum,${destination.toLowerCase()}`],
      categories: ['culture', 'museum', 'art'],
      availableTimes: ['9:00 AM']
    }
  ];
  
  return activities;
}