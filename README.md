# Travel-AI Journey

Travel-AI Journey is a personal, AI-driven demo showcasing end-to-end travel planning. Built with Next.js (v15+ with the new app router), TypeScript, and Tailwind CSS using sleek glassmorphism design, it features a chat interface to capture preferences, a hybrid selection UI (mobile swipe / desktop drag & drop), and an immersive itinerary view. Future enhancements include integration with travel APIs and AI-powered itinerary generation.

## Features

- **Multi-step Experience:**  
  - **Chat Interface:** Capture travel preferences in a modern, glassmorphic chat UI.
  - **Hybrid Selection:**  
    - *Mobile:* Swipe through travel options using react-tinder-card.  
    - *Desktop:* Drag-and-drop travel options via React DnD.
  - **Immersive Timeline:** Displays the final itinerary with elegant visuals.
- **Modern Design:**  
  Sleek glass design with backdrop-blur, semi-transparent overlays, and smooth transitions.
- **Future Enhancements:**  
  Integration with travel provider APIs and AI-driven recommendations.

## Tech Stack

- **Framework:** Next.js (v15+ with app directory)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** React, react-tinder-card, React DnD
- **Future Integrations:** Travel data APIs, AI-powered itinerary generation

## Getting Started

If you're itching to try this out yourself (or perhaps build your own twist), you'll need a few keys handy:

- **OpenAI API Key** – Essential for the chat experience and preference extraction.
- **Amadeus for Developers** – Provides real-time flight options.
- **Unsplash Access Key** – Serves stunning images dynamically, because visuals matter!

Set up your `.env` file:

```env
OPENAI_API_KEY="your_openai_key"
AMADEUS_CLIENT_ID="your_amadeus_client_id"
AMADEUS_CLIENT_SECRET="your_amadeus_secret"
UNSPLASH_ACCESS_KEY="your_unsplash_key"
```

Quick start from GitHub:

```bash
git clone https://github.com/julioMeif/travel-ai-journey.git
cd travel-ai-journey
pnpm install
npm run dev
```

Voilà! You’re ready to explore.
