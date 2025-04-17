// src/app/api/ai/generate-travel-plan/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    console.log("=== GENERATE TRAVEL PLAN API CALL ===");
    const body = await request.json();
    const { preferences } = body;
    
    if (!preferences) {
      console.log("Invalid request - missing preferences");
      return NextResponse.json(
        { error: 'Travel preferences are required' },
        { status: 400 }
      );
    }
    
    // Log the preferences we're using
    console.log("Generating travel plan with preferences:", JSON.stringify(preferences, null, 2));
    
    const planningPrompt = {
      role: 'system' as const,
      content: `
        Create a comprehensive travel plan based on these preferences:
        ${JSON.stringify(preferences, null, 2)}
        
        Return a JSON object with:
        {
          "flightRequirements": {
            "origin": "${preferences.origin || ''}",
            "destination": "${preferences.destination || ''}",
            "departureDate": "",
            "returnDate": "",
            "airlines": [],
            "class": "",
            "maxStops": 0
          },
          "accommodationRequirements": {
            "location": "",
            "checkIn": "",
            "checkOut": "",
            "type": "",
            "amenities": [],
            "minRating": 0,
            "priceRange": {
              "min": 0,
              "max": 0
            }
          },
          "activityRequirements": {
            "location": "",
            "dates": [],
            "categories": [],
            "maxPricePerActivity": 0,
            "preferredTimeOfDay": ""
          },
          "dailyPlan": [
            {
              "day": 1,
              "date": "",
              "activities": [
                {
                  "type": "",
                  "description": "",
                  "timeSlot": ""
                }
              ]
            }
          ]
        }
        
        CRITICAL: Return ONLY the JSON object. DO NOT include any explanations, markdown formatting, code blocks, or additional text. Your entire response must be parseable as JSON.
      `
    };
    
    console.log("Sending request to OpenAI for travel plan generation...");
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [planningPrompt],
      temperature: 0.2,
      response_format: { type: "json_object" } // Force JSON output format
    });
    
    // Always log the complete response
    console.log("OpenAI raw response:", JSON.stringify(response.choices[0].message, null, 2));
    
    try {
      const content = response.choices[0].message.content || '{}';
      console.log("Travel plan content:", content);
      
      // Safety check - ensure we're getting JSON
      const travelPlan = JSON.parse(content);
      console.log("Parsed travel plan:", JSON.stringify(travelPlan, null, 2));
      
      return NextResponse.json({ data: travelPlan });
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('Raw content that failed parsing:', response.choices[0].message.content);
      
      // Fallback - return a default travel plan
      return NextResponse.json({ 
        data: {
          flightRequirements: {
            origin: preferences.origin || '',
            destination: preferences.destination || '',
          },
          accommodationRequirements: {},
          activityRequirements: {},
          dailyPlan: []
        }, 
        warning: 'Failed to parse travel plan, using default values' 
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
    console.log("=== END GENERATE TRAVEL PLAN API CALL ===");
  }
}