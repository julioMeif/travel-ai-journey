// Create a new file: src/types/travelService.ts

// Define interfaces for the parameters
export interface FlightSearchParams {
  origin: string;
  destination: string;
  originCode?: string;
  destinationCode?: string;
  departureDate?: string;
  returnDate?: string;
  travelers?: number;
  class?: string;
  airlines?: string[];
}

export interface HotelSearchParams {
  location: string;
  destinationCode?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  minRating?: number;
  priceRange?: { min: number; max: number };
  amenities?: string[];
  accommodation?: {
    type?: string;
  };
}

export interface ActivitySearchParams {
  destination: string;
  activities?: {
    interests: string[];
  };
}

// Define interfaces for the return types
export interface FlightOption {
  id: string;
  airline: string;
  flightNumber: string;
  departureAirport: string;
  departureTime: string;
  arrivalAirport: string;
  arrivalTime: string;
  price: number;
  duration: string;
  cabinClass: string;
  stops: number;
}

export interface HotelOption {
  id: string;
  name: string;
  address: string;
  rating: number;
  pricePerNight: number;
  images: string[];
  amenities: string[];
  description: string;
}

export interface ActivityOption {
  id: string;
  name: string;
  description: string;
  location: string;
  price: number;
  rating: number;
  duration: string;
  images: string[];
  categories: string[];
  availableTimes: string[];
}

export interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description?: string;
  description?: string;
}