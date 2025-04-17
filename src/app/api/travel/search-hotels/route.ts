// src/app/api/travel/search-hotels/route.ts
import { NextResponse } from 'next/server';
import { formatDate } from '../../../../services/travel/utils';

const AMADEUS_CLIENT_ID    = process.env.AMADEUS_CLIENT_ID!;
const AMADEUS_CLIENT_SECRET= process.env.AMADEUS_CLIENT_SECRET!;
const AMADEUS_BASE_URL     = 'https://test.api.amadeus.com/v3';

// Define interfaces for API responses
interface AmadeusTokenResponse {
  access_token: string;
  expires_in: number;
}

interface HotelLocation {
  hotelId: string;
  name?: string;
}

interface HotelMedia {
  uri: string;
}

interface HotelDetails {
  hotelId: string;
  name: string;
  rating?: number;
  address: {
    lines: string[];
  };
  media?: HotelMedia[];
  amenities?: string[];
}

interface HotelOffer {
  checkInDate: string;
  checkOutDate: string;
  description?: string;
  price: {
    total: string;
  };
}

interface HotelOfferResponse {
  hotel: HotelDetails;
  offers: HotelOffer[];
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
    
    const data = await response.json() as AmadeusTokenResponse;
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

export async function POST(request: Request) {
  try {
    console.log("=== SEARCH HOTELS API CALL ===");
    const {
      location,
      checkIn,
      checkOut,
      guests = 1,
      rooms  = 1,
      minRating,
      priceRange,
      amenities = [],
      currency    = 'USD',
      maxResults  = 10
    } = await request.json();

    const cityCode          = location;
    const formattedCheckIn  = formatDate(checkIn);
    const formattedCheckOut = checkOut ? formatDate(checkOut) : '';

    // 1) Get a valid token
    let token: string;
    try {
      token = await getAmadeusToken();
    } catch (err) {
      console.error('Failed to get Amadeus token, using mock data:', err);
      const mockHotels = generateMockHotels(location);
      return NextResponse.json({ results: mockHotels });
    }

    // 2) List up to 5 hotels in the city to get their IDs
    const hotelListMax      = 5;
    const hotelsByCityUrl   = `${AMADEUS_BASE_URL}/reference-data/locations/hotels/by-city`
                            + `?cityCode=${cityCode}`
                            + `&radius=50`
                            + `&radiusUnit=KM`;

        // … after you build hotelsByCityUrl …
    console.log('» Hotels by city URL:', hotelsByCityUrl);
    const listResp = await fetch(hotelsByCityUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('» List response status:', listResp.status, listResp.statusText);

    // capture the raw text so you can inspect errors or empty arrays
    const listText = await listResp.text();
    console.log('» List response body:', listText);

    // now parse it
    let listData: { data?: HotelLocation[] };
    try {
      listData = JSON.parse(listText);
    } catch (e:unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('Error parsing hotel list response:', message);
      throw new Error('Failed to JSON‑parse hotel list response: ' + message);
    }
    // … after parsing listData …
    const rawList = listData.data || [];

    // take only the first `hotelListMax` entries, pull out hotelId, and drop any falsy
    const hotelIds: string[] = rawList
      .slice(0, hotelListMax)
      .map((item: HotelLocation) => item.hotelId)
      .filter((id: string) => Boolean(id));

    console.log('» Using hotelIds:', hotelIds);

    if (hotelIds.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // 3) Build the hotel‐offers query parameters
    const queryParams = new URLSearchParams();
    hotelIds.forEach(id => queryParams.append('hotelIds', id));
    queryParams.append('checkInDate',  formattedCheckIn);
    if (formattedCheckOut) {
      queryParams.append('checkOutDate', formattedCheckOut);
    }
    queryParams.append('adults',       String(guests));
    queryParams.append('roomQuantity', String(rooms));
    queryParams.append('currency',     currency);

    // Optional filters
    if (priceRange?.min != null && priceRange?.max != null) {
      queryParams.append('priceRange', `${priceRange.min}-${priceRange.max}`);
    }
    amenities.forEach((a: string) => queryParams.append('amenities', a));
    if (minRating) {
      queryParams.append('ratings', String(minRating));
    }

    // Pagination & sorting
    queryParams.append('max',  String(maxResults));
    queryParams.append('sort', 'PRICE');

    // 4) Fetch the offers
    const offersUrl = `${AMADEUS_BASE_URL}/shopping/hotel-offers?${queryParams.toString()}`;
    console.log(`Calling Amadeus Hotel Offers: ${offersUrl}`);

    const offersResp = await fetch(offersUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!offersResp.ok) {
      throw new Error(`Hotel offers fetch failed: ${offersResp.status} ${offersResp.statusText}`);
    }
    const offersData: { data: HotelOfferResponse[] } = await offersResp.json();
    console.log(`Retrieved ${offersData.data?.length || 0} hotel offers`);

    // 5) Transform to your front‐end shape
    const results = offersData.data.map((hotel: HotelOfferResponse) => {
      const offer = hotel.offers[0];
      const inD = new Date(offer.checkInDate);
      const outD= new Date(offer.checkOutDate);
      const nights = Math.max(1, Math.round((outD.getTime() - inD.getTime()) / (86400e3)));
      const totalPrice = parseFloat(offer.price.total);
      return {
        id: hotel.hotel.hotelId,
        name: hotel.hotel.name,
        address: hotel.hotel.address.lines.join(', '),
        rating: hotel.hotel.rating || 0,
        pricePerNight: totalPrice / nights,
        images: hotel.hotel.media?.map((m: HotelMedia) => m.uri) ||
                [`https://source.unsplash.com/featured/?hotel,${location.toLowerCase()}`],
        amenities: hotel.hotel.amenities || [],
        description: offer.description || `Stay at ${hotel.hotel.name}`
      };
    });

    return NextResponse.json({ results });

  } catch (error: unknown) {
    console.error('Error in hotel search API:', error);

    // Fallback to mock data in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock hotel data for development');
      const mockHotels = generateMockHotels('Paris');
      return NextResponse.json({ results: mockHotels });
    }

    // Propagate the error in production
    return NextResponse.json({ error: 'Failed to search hotels' }, { status: 500 });
  }
}

// Helper function to generate mock hotels for development and fallback
function generateMockHotels(
  location: string
): TransformedHotel[] {
  const mockHotels = [
    {
      id: 'mock-hotel-1',
      name: `Grand Hotel ${location}`,
      address: `Central ${location}`,
      rating: 4.8,
      pricePerNight: 280,
      images: [`https://source.unsplash.com/featured/?hotel,luxury,${location.toLowerCase()}`],
      amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Room Service', 'Fitness Center', 'Air Conditioning'],
      description: `Luxury hotel in the heart of ${location} with top-notch amenities and excellent service.`
    },
    {
      id: 'mock-hotel-2',
      name: `Boutique Stay ${location}`,
      address: `Downtown ${location}`,
      rating: 4.6,
      pricePerNight: 180,
      images: [`https://source.unsplash.com/featured/?hotel,boutique,${location.toLowerCase()}`],
      amenities: ['WiFi', 'Breakfast', 'Bar', 'Air Conditioning'],
      description: `Charming boutique hotel in a vibrant area of ${location} with unique rooms and personalized service.`
    },
    {
      id: 'mock-hotel-3',
      name: `${location} View Inn`,
      address: `Scenic District, ${location}`,
      rating: 4.4,
      pricePerNight: 210,
      images: [`https://source.unsplash.com/featured/?hotel,view,${location.toLowerCase()}`],
      amenities: ['WiFi', 'Restaurant', 'Room Service', 'Fitness Center', 'Parking'],
      description: `Comfortable hotel with stunning views in ${location} offering a perfect balance of comfort and convenience.`
    },
    {
      id: 'mock-hotel-4',
      name: `${location} Budget Stay`,
      address: `East ${location}`,
      rating: 3.9,
      pricePerNight: 120,
      images: [`https://source.unsplash.com/featured/?hotel,budget,${location.toLowerCase()}`],
      amenities: ['WiFi', 'Breakfast', 'Air Conditioning'],
      description: `Affordable accommodation in ${location} that offers good value for money without compromising on essentials.`
    },
    {
      id: 'mock-hotel-5',
      name: `${location} Luxury Suites`,
      address: `Exclusive District, ${location}`,
      rating: 4.9,
      pricePerNight: 350,
      images: [`https://source.unsplash.com/featured/?hotel,suite,${location.toLowerCase()}`],
      amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Room Service', 'Fitness Center', 'Bar', 'Concierge', 'Airport Shuttle'],
      description: `The epitome of luxury in ${location} with spacious suites, premium amenities, and world-class service.`
    }
  ];
  
  return mockHotels;
}