// src/app/api/ai/extract-preferences/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TravelPreferences } from '../../../../types/travel';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    console.log("=== EXTRACT PREFERENCES API CALL ===");
    const body = await request.json();
    const { conversation } = body;
    
    if (!conversation || !Array.isArray(conversation)) {
      console.log("Invalid request - missing conversation array");
      return NextResponse.json(
        { error: 'Conversation is required and must be an array' },
        { status: 400 }
      );
    }
    
    // Log the last few messages of conversation for context
    console.log("Last messages in conversation:", 
      JSON.stringify(conversation.slice(-2), null, 2));
    
    // Get current year for date context
    const currentYear = new Date().getFullYear();
    
    // Enhanced extraction prompt with better format requirements
    const extractionPrompt = {
      role: 'system' as const,
      content: `
        Extract travel preferences from the conversation. Today's year is ${currentYear}.
        
        IMPORTANT FORMATTING REQUIREMENTS:
        1. For cities/locations, provide both the user-friendly name AND the 3-letter IATA code
        2. ALL dates must be in YYYY-MM-DD format (e.g., ${currentYear}-06-15 for June 15th)
           - If only month is mentioned (e.g., "June"), use the 1st day of that month in the current year
           - If no year is explicitly mentioned, assume the current year (${currentYear})
        
        You MUST ONLY return a valid JSON object with these fields (leave empty if not mentioned):
        {
          "origin": {
            "name": "", 
            "code": ""  // 3-letter IATA city/airport code (e.g., "MIA" for Miami)
          },
          "destination": {
            "name": "",
            "code": ""  // 3-letter IATA city/airport code (e.g., "PAR" for Paris)
          },
          "dates": {
            "departure": "",  // MUST be YYYY-MM-DD format
            "return": "",     // MUST be YYYY-MM-DD format
            "flexibility": 0
          },
          "budget": {
            "total": 0,
            "priority": ""
          },
          "flights": {
            "airlines": [],
            "class": "",
            "direct": true/false
          },
          "accommodation": {
            "type": "",
            "amenities": [],
            "location": ""
          },
          "activities": {
            "interests": [],
            "pacePreference": ""
          }
        }
        
        For IATA codes, use standard airport/city codes like:
        - New York: NYC
        - Miami: MIA
        - Los Angeles: LAX
        - London: LON
        - Paris: PAR 
        - Bordeaux: BOD
        - Tokyo: TYO
        - Sydney: SYD
        - Frankfurt: FRA
        - Amsterdam: AMS
        
        CRITICAL: Return ONLY the JSON object. DO NOT include any explanations, markdown formatting, code blocks, or additional text. Your entire response must be parseable as JSON.
      `
    };
    
    const messages = [extractionPrompt, ...conversation];
    
    console.log("Sending request to OpenAI for preference extraction...");
    // Add a function call to enhance JSON output reliability
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.1, // Lower temperature for structured output
      response_format: { type: "json_object" } // Force JSON output format
    });
    
    // Always log the complete response
    console.log("OpenAI raw response:", JSON.stringify(response.choices[0].message, null, 2));
    
    try {
      const content = response.choices[0].message.content || '{}';
      console.log("Extracted content:", content);
      
      // Safety check - ensure we're getting JSON
      const rawPreferences = JSON.parse(content);
      
      // Transform the nested structure to flat structure expected by the app
      const preferences: Partial<TravelPreferences> = {
        // Extract city names and codes
        origin: rawPreferences.origin?.name || '',
        originCode: rawPreferences.origin?.code || '',
        destination: rawPreferences.destination?.name || '',
        destinationCode: rawPreferences.destination?.code || '',
        
        // Keep the rest of the structure
        dates: rawPreferences.dates,
        budget: rawPreferences.budget,
        flights: rawPreferences.flights,
        accommodation: rawPreferences.accommodation,
        activities: rawPreferences.activities
      };
      
      console.log("Transformed preferences:", JSON.stringify(preferences, null, 2));
      return NextResponse.json({ data: preferences });
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('Raw content that failed parsing:', response.choices[0].message.content);
      
      // Fallback - return an empty preferences object
      return NextResponse.json({ 
        data: {}, 
        warning: 'Failed to parse preferences, using default values' 
      });
    }
  } catch (error: unknown) {
    console.error('OpenAI API error:', error);
    // Narrow unknown to Error to get a message
    const message =
      error instanceof Error ? error.message : 'Failed to process request';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  } finally {
    console.log("=== END EXTRACT PREFERENCES API CALL ===");
  }
}