// src/app/api/ai/travel-insights/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// ——— Define explicit types for all of quickAvailability ———

interface FlightAvailability {
  airlines?: string[];
  minPrice?: number;
  maxPrice?: number;
  availableStops?: number[];
}

interface HotelPriceRange {
  min: number;
  max: number;
}
interface HotelAvailability {
  priceRanges?: HotelPriceRange[];
  amenities?: string[];
}

interface ActivityPriceRange {
  min: number;
  max: number;
}
interface ActivityAvailability {
  categories?: string[];
  priceRanges?: ActivityPriceRange[];
}

interface AvailabilityAnalysis {
  hasMultipleAirlines?: boolean;
  hasMultipleStops?: boolean;
  hasHotelVariety?: boolean;
}

interface QuickAvailability {
  flights?: FlightAvailability;
  hotels?: HotelAvailability;
  activities?: ActivityAvailability;
  analysis?: AvailabilityAnalysis;
}

// (Optional) if you want to type preferences too:
interface TravelPreferences {
  origin?: string;
  destination?: string;
  dates?: { departure?: string; return?: string };
  travelers?: number;
}

// ——— Initialize OpenAI client ———
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    console.log("=== TRAVEL INSIGHTS API CALL ===");
    const body = await request.json() as {
      preferences: TravelPreferences;
      quickAvailability: QuickAvailability;
    };

    const { preferences, quickAvailability } = body;
    if (!preferences || !quickAvailability) {
      return NextResponse.json(
        { error: 'Both preferences and quickAvailability are required' },
        { status: 400 }
      );
    }

    const systemPrompt = `
      You are a travel advisor providing insights about travel options based on available data.
      Analyze the travel options data and provide a concise, helpful message to the user about their choices.
      [...]
    `;
    const availabilityInfo = formatQuickAvailabilityForAI(quickAvailability);

    const userMessage = `
      User's travel preferences:
      - Origin: ${preferences.origin || 'Not specified'}
      - Destination: ${preferences.destination || 'Not specified'}
      - Departure date: ${preferences.dates?.departure || 'Not specified'}
      - Return date: ${preferences.dates?.return || 'Not specified'}
      - Number of travelers: ${preferences.travelers ?? 1}

      Available travel options data:
      ${availabilityInfo}

      Based on this data, provide a helpful summary...
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
    });

    const insightMessage = response.choices[0].message.content;
    console.log("Generated travel insights:", insightMessage);
    return NextResponse.json({ message: insightMessage });
  } catch (error: unknown) {
    console.error('Error in travel insights API:', error);
    const message = error instanceof Error
      ? error.message
      : 'Failed to generate travel insights';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    console.log("=== END TRAVEL INSIGHTS API CALL ===");
  }
}

// ——— Helper with proper types ———
function formatQuickAvailabilityForAI(q: QuickAvailability): string {
  let result = '';

  // FLIGHTS
  if (q.flights) {
    result += "FLIGHTS:\n";

    if (q.flights.airlines?.length) {
      result += `- Available airlines: ${q.flights.airlines.join(', ')}\n`;
    }
    if (
      typeof q.flights.minPrice === 'number' &&
      typeof q.flights.maxPrice === 'number'
    ) {
      result += `- Price range: $${Math.floor(q.flights.minPrice)} to $${Math.ceil(q.flights.maxPrice)}\n`;
    }
    if (q.flights.availableStops?.length) {
      const stopsText = q.flights.availableStops
        .map(s => (s === 0 ? 'Direct flights' : `Flights with ${s} stop(s)`))
        .join(', ');
      result += `- Connection types: ${stopsText}\n`;
    }
    result += "\n";
  }

  // HOTELS
  if (q.hotels) {
    result += "HOTELS:\n";
    const ranges = q.hotels.priceRanges;
    if (ranges && ranges.length > 0) {
      const minPrice = Math.min(...ranges.map(r => r.min));
      const maxPrice = Math.max(...ranges.map(r => r.max));
      result += `- Price range per night: $${Math.floor(minPrice)} to $${Math.ceil(maxPrice)}\n`;
    }
    if (q.hotels.amenities?.length) {
      result += `- Available amenities: ${q.hotels.amenities.join(', ')}\n`;
    }
    result += "\n";
  }

  // ACTIVITIES
  if (q.activities) {
    result += "ACTIVITIES:\n";
    if (q.activities.categories?.length) {
      result += `- Categories: ${q.activities.categories.join(', ')}\n`;
    }
    const actRanges = q.activities.priceRanges;
    if (actRanges && actRanges.length > 0) {
      const minPrice = Math.min(...actRanges.map(r => r.min));
      const maxPrice = Math.max(...actRanges.map(r => r.max));
      result += `- Price range: $${Math.floor(minPrice)} to $${Math.ceil(maxPrice)}\n`;
    }
    result += "\n";
  }

  // ANALYSIS
  if (q.analysis) {
    result += "ANALYSIS:\n";
    if (!q.analysis.hasMultipleAirlines && q.flights?.airlines?.length) {
      result += `- Limited airline options: Only ${q.flights.airlines[0]} serves this route directly\n`;
    }
    if (!q.analysis.hasMultipleStops && q.flights?.availableStops?.length) {
      const stops = q.flights.availableStops[0]!;
      result += `- Connection options: All flights have ${stops === 0 ? 'no' : stops} stop(s)\n`;
    }
    if (!q.analysis.hasHotelVariety) {
      result += "- Limited hotel options available\n";
    }
  }

  return result;
}
