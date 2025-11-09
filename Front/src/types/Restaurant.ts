//defining a resteruant interface
export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  address: {
    street: string;
    city: string;
    number: string;
  };
  rating?: number;
  priceRange?: '$$$$' | '$$$' | '$$' | '$';
  imageUrl?: string;
  phoneNumber?: string;
  website?: string;
  description?: string;
  openingHours?: {
    [key: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
  dietaryOptions?: string[]; // e.g., ['vegetarian', 'vegan', 'gluten-free']
  features?: string[]; // e.g., ['outdoor seating', 'parking', 'wifi', 'reservations']
  maxGuests: number; // Maximum capacity of the restaurant
  currGuests?: number; // Current number of guests (for reservations tracking)
}

//defining a resteruant search interface
export interface RestaruantSerch{
    date: string;
    time: string;
    numGuests: number;
    budget?: '$$$$' | '$$$' | '$$' | '$';
    cuisine?: string;
    location?: string;
    rating?: number;
}

