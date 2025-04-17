// src/app/api/ai/search-activities/route.ts
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { TravelPreferences, ApiResponse, Activity } from '../../../../types/travel';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const openai = new OpenAI();

export async function POST(request: Request) {
  try {
    const { preferences } = (await request.json()) as {
      preferences: Partial<TravelPreferences>;
    };

    console.log('=== AI: SEARCH ACTIVITIES ===', JSON.stringify(preferences));

    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are a helpful travel assistant. You will receive user travel preferences and must respond with a strict JSON object.
The object must contain a field "activities" which is an array of 3 to 5 activities. Each activity must include:
- id (string)
- name (string)
- brief (string, one sentence summary)
- description (string, 1 paragraph)
- imageUrl (string, valid Unsplash-style URL)
- estimatedPrice (number in USD)
- rating (number between 0 and 5)`
      },
      {
        role: 'user',
        content: `Suggest activities for the following preferences:
${JSON.stringify(preferences, null, 2)}`
      }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(response.choices[0].message.content!);
    const activities: Activity[] = parsed.activities;

    const payload: ApiResponse<Activity[]> = { data: activities };
    return NextResponse.json(payload);
  } catch (err: unknown) {
    console.error('Error in AI search-activities:', err);
    const message = err instanceof Error ? err.message : 'Failed to suggest activities';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
