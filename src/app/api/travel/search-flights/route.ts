// src/app/api/travel/search-flights/route.ts

import { NextResponse } from 'next/server';
import { getIATACode } from '../../../../services/travel/utils';

// --- Amadeus API credentials (secure) ---
const AMADEUS_CLIENT_ID     = process.env.AMADEUS_CLIENT_ID!;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET!;
const AMADEUS_BASE_URL      = 'https://test.api.amadeus.com/v2';

// Token cache
let amadeusToken: string | null = null;
let tokenExpiry: Date   | null = null;

/** Fetch or reuse a valid Amadeus token */
async function getAmadeusToken(): Promise<string> {
  if (amadeusToken && tokenExpiry && new Date() < tokenExpiry) {
    return amadeusToken;
  }
  const resp = await fetch(
    'https://test.api.amadeus.com/v1/security/oauth2/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'client_credentials',
        client_id:     AMADEUS_CLIENT_ID,
        client_secret: AMADEUS_CLIENT_SECRET,
      }),
    }
  );
  if (!resp.ok) throw new Error(`Failed to fetch token: ${resp.statusText}`);
  const payload = (await resp.json()) as { access_token: string; expires_in: number };
  amadeusToken = payload.access_token;
  tokenExpiry  = new Date(Date.now() + (payload.expires_in - 60) * 1000);
  return amadeusToken;
}

// ————————————————————————————————————————————————
// 1) Amadeus raw types
// ————————————————————————————————————————————————
interface FlightOfferSegment {
  carrierCode: string;
  number:      string;
  departure:   { iataCode: string; at: string };
  arrival:     { iataCode: string; at: string };
  duration:    string; // ISO 8601, e.g. "PT2H15M"
}
interface FlightOfferItinerary {
  segments: FlightOfferSegment[];
  duration: string;
}
interface FlightOfferRaw {
  id:                      string;
  itineraries:             FlightOfferItinerary[];
  price:                   { total: string | number };
  validatingAirlineCodes?: string[];
}
interface FlightOfferApiResponse {
  data: FlightOfferRaw[];
}

// ————————————————————————————————————————————————
// 2) Our enriched types
// ————————————————————————————————————————————————
export interface ItinerarySegment {
  departureAirport: string;
  arrivalAirport:   string;
  departureTime:    string;
  arrivalTime:      string;
  carrier:          string;
  flightNumber:     string;
  duration:         string;
}
export type TripType = 'oneWay' | 'roundTrip';

export interface FlightOption {
  id:                     string;
  airline:                string;
  flightNumber:           string;
  departureAirport:       string;
  departureTime:          string;
  arrivalAirport:         string;
  arrivalTime:            string;
  price:                  number;
  duration:               string;
  cabinClass:             string;
  stops:                  number;

  origin:                 string;
  destination:            string;
  tripType:               TripType;
  segments:               ItinerarySegment[];
  validatingAirlineCodes: string[];
  // legacy fallback if you still need a single carrier
  validatingCarrier:      string;
  totalStops:             number;
  totalDuration:          string;
}

// ————————————————————————————————————————————————
// 3) Parsing helper
// ————————————————————————————————————————————————
function parseFlightOffer(
  offer: FlightOfferRaw,
  searchParams: {
    origin:        string;
    destination:   string;
    departureDate: string;
    returnDate?:   string;
    cabinClass:    string;
  }
): FlightOption {
  // 1) flatten all segments
  const segments: ItinerarySegment[] = offer.itineraries.flatMap(it =>
    it.segments.map(seg => ({
      departureAirport: seg.departure.iataCode,
      arrivalAirport:   seg.arrival.iataCode,
      departureTime:    seg.departure.at,
      arrivalTime:      seg.arrival.at,
      carrier:          seg.carrierCode,
      flightNumber:     `${seg.carrierCode}${seg.number}`,
      duration:         seg.duration,
    }))
  );

  // 2) validatingAirlineCodes array (API‐provided)
  const validatingAirlineCodes = Array.isArray(offer.validatingAirlineCodes)
    ? offer.validatingAirlineCodes
    : [];

  // 3) fallback single carrier
  const validatingCarrier = validatingAirlineCodes[0] ?? segments[0]?.carrier ?? '';

  // 4) total stops & duration
  const totalStops    = segments.length - offer.itineraries.length;
  const totalDuration =
    offer.itineraries.length === 1
      ? offer.itineraries[0].duration
      : offer.itineraries.map(it => it.duration).join(' + ');

  // 5) parse price
  const rawPrice = offer.price.total;
  const price    = typeof rawPrice === 'string' ? parseFloat(rawPrice) : rawPrice;

  // 6) legacy top‐level fields
  const firstSeg = offer.itineraries[0].segments[0];
  const lastSeg  = offer.itineraries[0].segments.slice(-1)[0];

  return {
    id:                     offer.id,
    airline:                firstSeg.carrierCode,
    flightNumber:           `${firstSeg.carrierCode}${firstSeg.number}`,
    departureAirport:       firstSeg.departure.iataCode,
    departureTime:          firstSeg.departure.at,
    arrivalAirport:         lastSeg.arrival.iataCode,
    arrivalTime:            lastSeg.arrival.at,
    price,
    duration:               offer.itineraries[0].duration,
    cabinClass:             searchParams.cabinClass,
    stops:                  offer.itineraries[0].segments.length - 1,

    origin:                 searchParams.origin,
    destination:            searchParams.destination,
    tripType:               searchParams.returnDate ? 'roundTrip' : 'oneWay',
    segments,
    validatingAirlineCodes,
    validatingCarrier,
    totalStops,
    totalDuration,
  };
}

// ————————————————————————————————————————————————
// 4) The POST handler
// ————————————————————————————————————————————————
export async function POST(request: Request) {
  try {
    console.log('=== SEARCH FLIGHTS API CALL ===');
    const body = (await request.json()) as {
      origin?:               string;
      originCode?:           string;
      destination?:          string;
      destinationCode?:      string;
      departureDate:         string;
      returnDate?:           string;
      travelers?:            number;
      cabinClass?:           string;
      nonStop?:              boolean;
      currency?:             string;
      maxResults?:           number;
      airlines?:             string[];
      excludedAirlineCodes?: string[];
    };

    const {
      origin,
      originCode,
      destination,
      destinationCode,
      departureDate,
      returnDate,
      travelers            = 1,
      cabinClass           = 'ECONOMY',
      nonStop              = false,
      currency             = 'USD',
      maxResults           = 10,
      airlines,
      excludedAirlineCodes,
    } = body;

    if ((!origin && !originCode) ||
        (!destination && !destinationCode) ||
         !departureDate) {
      return NextResponse.json(
        { error: 'Origin/originCode, destination/destinationCode, and departureDate are required' },
        { status: 400 }
      );
    }

    // resolve IATA codes
    let finalOriginCode      = originCode;
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

    // fetch token
    const token = await getAmadeusToken();

    // build Amadeus query
    const params = new URLSearchParams({
      originLocationCode:      finalOriginCode,
      destinationLocationCode: finalDestinationCode,
      departureDate,
      adults:                  travelers.toString(),
      max:                     maxResults.toString(),
      currencyCode:            currency,
    });
    if (returnDate)            params.append('returnDate',       returnDate);
    if (nonStop)               params.append('nonStop',          'true');
    if (cabinClass)            params.append('travelClass',      cabinClass);
    if (airlines?.length)      params.append('includedAirlineCodes', airlines.join(','));
    if (excludedAirlineCodes?.length)
                                params.append('excludedAirlineCodes', excludedAirlineCodes.join(','));

    const url = `${AMADEUS_BASE_URL}/shopping/flight-offers?${params}`;
    console.log(`Calling Amadeus API: ${url}`);

    const apiRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!apiRes.ok) {
      const errPayload = await apiRes.json();
      console.error('Amadeus flight search error:', errPayload);
      if (process.env.NODE_ENV === 'development') {
        console.log('Returning mock flights for development');
        return NextResponse.json({
          results: generateMockFlights(
            finalOriginCode,
            finalDestinationCode,
            departureDate,
            returnDate,
            cabinClass
          )
        });
      }
      return NextResponse.json(
        { error: 'Failed to search flights', details: errPayload },
        { status: apiRes.status }
      );
    }

    const data = (await apiRes.json()) as FlightOfferApiResponse;
    console.log('Raw flight API response:', data);

    const results = data.data.map(offer =>
      parseFlightOffer(offer, {
        origin:        finalOriginCode!,
        destination:   finalDestinationCode!,
        departureDate,
        returnDate,
        cabinClass,
      })
    );
    console.log(`Parsed ${results.length} flight offers`);

    return NextResponse.json({ results });
  } catch (err: unknown) {
    console.error('Error in flight search API:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    console.log('=== END SEARCH FLIGHTS API CALL ===');
  }
}

// ————————————————————————————————————————————————
// 5) Mock fallback (unchanged)
// ————————————————————————————————————————————————
function generateMockFlights(
  origin:       string,
  destination:  string,
  departureDate:string,
  returnDate:   string | undefined,
  cabinClass:   string
): FlightOption[] {
  const flights: FlightOption[] = [];
  let depDate: Date;
  try {
    const [y, m, d] = departureDate.split('-').map(Number);
    depDate = new Date(y, m - 1, d);
    if (isNaN(depDate.getTime())) throw new Error();
  } catch {
    depDate = new Date();
    depDate.setDate(depDate.getDate() + 30);
  }

  for (let i = 0; i < 5; i++) {
    const dep = new Date(depDate);
    dep.setHours(6 + Math.floor(Math.random() * 12));
    dep.setMinutes(Math.floor(Math.random() * 60));
    const durH = 7 + Math.floor(Math.random() * 6);
    const durM = Math.floor(Math.random() * 60);
    const arr = new Date(dep);
    arr.setHours(arr.getHours() + durH);
    arr.setMinutes(arr.getMinutes() + durM);

    flights.push({
      id:              `mock-${i+1}`,
      airline:         ['AF','AA','DL','UA','BA'][i%5],
      flightNumber:    `XX${1000 + i}`,
      departureAirport:origin,
      departureTime:   dep.toISOString(),
      arrivalAirport:  destination,
      arrivalTime:     arr.toISOString(),
      price:           400 + i*50,
      duration:        `PT${durH}H${durM}M`,
      cabinClass,
      stops:           Math.floor(Math.random()*2),
      origin,
      destination,
      tripType:        returnDate ? 'roundTrip' : 'oneWay',
      segments:        [],
      validatingAirlineCodes: [],
      validatingCarrier: '',
      totalStops:      0,
      totalDuration:   '',
    });
  }
  return flights;
}
