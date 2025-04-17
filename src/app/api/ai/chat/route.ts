// src/app/api/ai/chat/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client with server-side environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Regular env var, not exposed to client
});

export async function POST(request: Request) {
  try {
    console.log("=== CHAT API CALL ===");
    const body = await request.json();
    const { messages, temperature = 0.7, preferences = {} } = body;
    
    if (!messages || !Array.isArray(messages)) {
      console.log("Invalid request - missing messages array");
      return NextResponse.json(
        { error: 'Messages are required and must be an array' },
        { status: 400 }
      );
    }
    
    // Log the last few messages for context
    console.log("Last messages in conversation:", 
      JSON.stringify(messages.slice(-2), null, 2));
    
    // Create a system prompt that checks for missing travel information
    // and instructs the AI to ask follow-up questions
    const missingInfo = [];
    if (!preferences.origin) missingInfo.push("origin location (where the user is traveling from)");
    if (preferences.destination && !preferences.origin) missingInfo.push("origin location is particularly important to plan the trip");
    if (!preferences.dates?.return && preferences.dates?.departure) missingInfo.push("return date");
    if (!preferences.activities?.interests?.length) missingInfo.push("activities or points of interest");
    
    const systemPrompt = {
      role: 'system' as const,
      content: `You are a helpful and friendly travel assistant. Provide informative and engaging responses about travel destinations, accommodations, and activities.

${missingInfo.length > 0 ? `In this conversation, ask about the following missing information in a natural, conversational way:
- ${missingInfo.join('\n- ')}

Make sure to ask specifically about the missing origin location if the user has mentioned a destination but not where they're traveling from.` : ''}

Focus on being helpful and precise. Don't overwhelm the user with too much information at once.`
    };
    
    // Add the system prompt to the beginning of the messages array
    const messagesWithPrompt = [systemPrompt, ...messages];
    
    console.log("System prompt added:", systemPrompt.content);
    console.log("Sending request to OpenAI for chat response...");
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messagesWithPrompt,
      temperature,
    });
    
    // Always log the complete response
    console.log("OpenAI chat response:", JSON.stringify(response.choices[0].message, null, 2));
    
    return NextResponse.json({ data: response.choices[0].message });
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
    console.log("=== END CHAT API CALL ===");
  }
}