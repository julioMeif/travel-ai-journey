// src/app/api/travel/search-flights/route.ts - Updated to use IATA codes and strict typing
import { NextResponse } from 'next/server';
import { getIATACode } from '../../../../services/travel/utils';

// --- Amadeus API credentials (secure) ---
const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID!;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET!;
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com/v2';

// Token cache
let amadeusToken: string | null = null;
let tokenExpiry: Date | null = null;

// Fetch or reuse a valid Amadeus token
async function getAmadeusToken(): Promise<string> {
  if (amadeusToken && tokenExpiry && new Date() < tokenExpiry) {
    return amadeusToken;
  }
  const response = await fetch(
    'https://test.api.amadeus.com/v1/security/oauth2/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_CLIENT_ID,
        client_secret: AMADEUS_CLIENT_SECRET,
      }),
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch token: ${response.statusText}`);
  }
  const payload = (await response.json()) as { access_token: string; expires_in: number };
  amadeusToken = payload.access_token;
  tokenExpiry = new Date(Date.now() + (payload.expires_in - 60) * 1000);
  return amadeusToken;
}

// --- Amadeus flight-offer response types ---
interface FlightOfferSegment {
  carrierCode: string;
  number: string;
  departure: { iataCode: string; at: string };
  arrival: { iataCode: string; at: string };
}
interface FlightOfferItinerary {
  segments: FlightOfferSegment[];
  duration: string;
}
interface FlightOfferRaw {
  id: string;
  itineraries: FlightOfferItinerary[];
  price: { total: string | number };
}
interface FlightOfferApiResponse {
  data: FlightOfferRaw[];
}

export async function POST(request: Request) {
  try {
    console.log('=== SEARCH FLIGHTS API CALL ===');
    const body = (await request.json()) as {
      origin?: string;
      originCode?: string;
      destination?: string;
      destinationCode?: string;
      departureDate: string;
      returnDate?: string;
      travelers?: number;
      cabinClass?: string;
      nonStop?: boolean;
      currency?: string;
      maxResults?: number;
      airlines?: string[];
      excludedAirlineCodes?: string[];
    };

    const {
      origin,
      originCode,
      destination,
      destinationCode,
      departureDate,
      returnDate,
      travelers = 1,
      cabinClass = 'ECONOMY',
      nonStop = false,
      currency = 'USD',
      maxResults = 10,
      airlines,
      excludedAirlineCodes,
    } = body;

    if ((!origin && !originCode) || (!destination && !destinationCode) || !departureDate) {
      return NextResponse.json(
        { error: 'Origin/originCode, destination/destinationCode, and departureDate are required' },
        { status: 400 }
      );
    }

    // Resolve IATA codes
    let finalOriginCode = originCode;
    let finalDestinationCode = destinationCode;
    if (!finalOriginCode && origin) {
      finalOriginCode = origin.length === 3 ? origin : await getIATACode(origin);
    }
    if (!finalDestinationCode && destination) {
      finalDestinationCode = destination.length === 3 ? destination : await getIATACode(destination);
    }
    if (!finalOriginCode || !finalDestinationCode) {
      return NextResponse.json(
        { error: 'Could not resolve city codes' },
        { status: 400 }
      );
    }

    // Obtain token
    const token = await getAmadeusToken();

    // Build query string
    const params = new URLSearchParams({
      originLocationCode: finalOriginCode,
      destinationLocationCode: finalDestinationCode,
      departureDate,
      adults: travelers.toString(),
      max: maxResults.toString(),
      currencyCode: currency,
    });
    if (returnDate) params.append('returnDate', returnDate);
    if (nonStop) params.append('nonStop', 'true');
    if (cabinClass) params.append('travelClass', cabinClass);
    if (Array.isArray(airlines) && airlines.length) {
      params.append('includedAirlineCodes', airlines.join(','));
    }
    if (Array.isArray(excludedAirlineCodes) && excludedAirlineCodes.length) {
      params.append('excludedAirlineCodes', excludedAirlineCodes.join(','));
    }

    const url = `${AMADEUS_BASE_URL}/shopping/flight-offers?${params.toString()}`;
    console.log(`Calling Amadeus API: ${url}`);

    const apiRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!apiRes.ok) {
      const errPayload = await apiRes.json();
      console.error('Amadeus flight search error:', errPayload);
      if (process.env.NODE_ENV === 'development') {
        console.log('Returning mock flights for development');
        return NextResponse.json({ results: generateMockFlights(finalOriginCode, finalDestinationCode, departureDate, returnDate, cabinClass, travelers) });
      }
      return NextResponse.json(
        { error: 'Failed to search flights', details: errPayload },
        { status: apiRes.status }
      );
    }

    const data = (await apiRes.json()) as FlightOfferApiResponse;
    console.log(`Retrieved ${data.data.length} flight offers`);

    // Transform to application format
    const results = data.data.map((flight) => {
      const depSeg = flight.itineraries[0].segments[0];
      const arrSeg = flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1];
      const priceRaw = flight.price.total;
      const price = typeof priceRaw === 'string' ? parseFloat(priceRaw) : priceRaw;

      return {
        id: flight.id,
        airline: depSeg.carrierCode,
        flightNumber: `${depSeg.carrierCode}${depSeg.number}`,
        departureAirport: depSeg.departure.iataCode,
        departureTime: depSeg.departure.at,
        arrivalAirport: arrSeg.arrival.iataCode,
        arrivalTime: arrSeg.arrival.at,
        price,
        duration: flight.itineraries[0].duration,
        cabinClass,
        stops: flight.itineraries[0].segments.length - 1,
      };
    });

    return NextResponse.json({ results });
  } catch (err: unknown) {
    console.error('Error in flight search API:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  } finally {
    console.log('=== END SEARCH FLIGHTS API CALL ===');
  }
}

// Generate mock flights for fallback
function generateMockFlights(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string | undefined,
  cabinClass: string,
  travelers: number
) {
  const flights = [];
  let departureObj: Date;
  try {
    const [y, m, d] = departureDate.split('-').map(Number);
    departureObj = new Date(y, m - 1, d);
    if (isNaN(departureObj.getTime())) {
      throw new Error();
    }
  } catch {
    departureObj = new Date();
    departureObj.setDate(departureObj.getDate() + 30);
  }

  for (let i = 0; i < 5; i++) {
    const dep = new Date(departureObj);
    dep.setHours(6 + Math.floor(Math.random() * 12));
    dep.setMinutes(Math.floor(Math.random() * 60));
    const durH = 7 + Math.floor(Math.random() * 6);
    const durM = Math.floor(Math.random() * 60);
    const arr = new Date(dep);
    arr.setHours(arr.getHours() + durH);
    arr.setMinutes(arr.getMinutes() + durM);

    flights.push({
      id: `mock-${i + 1}`,
      airline: ['AF','AA','DL','UA','BA'][i % 5],
      flightNumber: `XX${1000 + i}`,
      passengers: travelers,
      departureAirport: origin,
      departureTime: dep.toISOString(),
      arrivalAirport: destination,
      arrivalTime: arr.toISOString(),
      price: 400 + i * 50,
      duration: `PT${durH}H${durM}M`,
      cabinClass,
      stops: Math.floor(Math.random() * 2),
    });
  }
  return flights;
}
