// src/app/page.tsx
// Purpose: Main entry point for the application
// Used as: The root page component in Next.js app directory structure

'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled for components that use browser APIs
const TravelWizard = dynamic(() => import('../components/TravelWizard'), { ssr: false });

export default function Home() {
  return (
    <main>
      <TravelWizard />
    </main>
  );
}