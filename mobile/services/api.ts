import * as SecureStore from 'expo-secure-store';

// API URL - använd lokal för utveckling, produktion för release
const API_BASE_URL = __DEV__
  ? process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
  : 'https://bolaxo-production.up.railway.app';

// För fysisk enhet, ersätt localhost med din dators IP
// Exempel: 'http://192.168.1.100:3000'
// Hitta din IP: ifconfig | grep "inet " | grep -v 127.0.0.1

async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

export async function apiCall(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API Error: ${response.status}`);
  }

  return response.json();
}

// API Endpoints
export const api = {
  // Auth
  auth: {
    sendMagicLink: (email: string) =>
      apiCall('/api/auth/magic-link/send', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    verifyMagicLink: (token: string) =>
      apiCall('/api/auth/magic-link/verify', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
  },

  // Buyer Profile
  buyerProfile: {
    get: (userId: string) =>
      apiCall(`/api/buyer-profile?userId=${userId}`),
    update: (data: any) =>
      apiCall('/api/buyer-profile', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Listings
  listings: {
    getAll: (params?: { status?: string; userId?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return apiCall(`/api/listings${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiCall(`/api/listings/${id}`),
    create: (data: any) =>
      apiCall('/api/listings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiCall(`/api/listings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // NDA Requests
  ndaRequests: {
    getAll: (params?: { userId?: string; role?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return apiCall(`/api/nda-requests${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiCall(`/api/nda-requests/${id}`),
    create: (data: any) =>
      apiCall('/api/nda-requests', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, status: 'approved' | 'rejected') =>
      apiCall(`/api/nda-requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  // Messages
  messages: {
    getAll: (params?: { userId?: string; listingId?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return apiCall(`/api/messages${query ? `?${query}` : ''}`);
    },
    send: (data: any) =>
      apiCall('/api/messages', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Matches
  matches: {
    getForSeller: (sellerId: string) =>
      apiCall(`/api/matches?sellerId=${sellerId}`),
  },

  // Saved Listings
  savedListings: {
    getAll: (userId: string) =>
      apiCall(`/api/saved-listings?userId=${userId}`),
    save: (listingId: string, userId: string) =>
      apiCall('/api/saved-listings', {
        method: 'POST',
        body: JSON.stringify({ listingId, userId }),
      }),
    remove: (listingId: string, userId: string) =>
      apiCall('/api/saved-listings', {
        method: 'DELETE',
        body: JSON.stringify({ listingId, userId }),
      }),
  },
};

