export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', credentials: 'include' })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<T>
}

export async function apiJSON<T>(url: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body: any): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<T>
}

// Messages
export async function getMessages(params: { userId: string; listingId?: string; peerId?: string }) {
  const q = new URLSearchParams()
  if (params.listingId) q.set('listingId', params.listingId)
  if (params.peerId) q.set('peerId', params.peerId)
  return apiGet<{ messages: any[] }>(`/api/messages?${q.toString()}`)
}

export async function sendMessage(payload: { listingId: string; senderId: string; recipientId: string; subject?: string; content: string }) {
  return apiJSON<{ message: any }>(`/api/messages`, 'POST', payload)
}

export async function markMessagesRead(ids: string[]) {
  return apiJSON<{ success: boolean }>(`/api/messages`, 'PATCH', { ids })
}

// NDA Requests
export async function listNDARequests(params: { listingId?: string; buyerId?: string; sellerId?: string; status?: string }) {
  const q = new URLSearchParams()
  if (params.listingId) q.set('listingId', params.listingId)
  if (params.buyerId) q.set('buyerId', params.buyerId)
  if (params.sellerId) q.set('sellerId', params.sellerId)
  if (params.status) q.set('status', params.status)
  return apiGet<{ requests: any[] }>(`/api/nda-requests?${q.toString()}`)
}

export async function createNDARequest(payload: { listingId: string; buyerId: string; sellerId: string; message?: string; buyerProfile?: any }) {
  return apiJSON<{ request: any }>(`/api/nda-requests`, 'POST', payload)
}

export async function updateNDAStatus(payload: { id: string; status: 'pending' | 'approved' | 'rejected' }) {
  // Use the new endpoint that handles message creation and email notifications
  return apiJSON<{ request: any }>(`/api/nda-requests/${payload.id}`, 'PATCH', { status: payload.status })
}

// Saved Listings
export async function getSavedListings() {
  return apiGet<{ saved: { id: string; userId: string; listingId: string; notes?: string }[] }>(`/api/saved-listings`)
}

export async function saveListing(payload: { listingId: string; notes?: string }) {
  return apiJSON<{ saved: any }>(`/api/saved-listings`, 'POST', payload)
}

export async function unsaveListing(listingId: string) {
  const q = new URLSearchParams()
  q.set('listingId', listingId)
  const res = await fetch(`/api/saved-listings?${q.toString()}`, { 
    method: 'DELETE',
    credentials: 'include'
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// Listings
export async function getUserListings(params: { status?: string; industry?: string; location?: string; priceMin?: number; priceMax?: number }) {
  const q = new URLSearchParams()
  if (params.status) q.set('status', params.status)
  if (params.industry) q.set('industry', params.industry)
  if (params.location) q.set('location', params.location)
  if (params.priceMin !== undefined) q.set('priceMin', String(params.priceMin))
  if (params.priceMax !== undefined) q.set('priceMax', String(params.priceMax))
  return apiGet<any[]>(`/api/listings?${q.toString()}`)
}

export async function getListingById(id: string) {
  return apiGet<any>(`/api/listings/${id}`)
}

// Buyer Profile
export async function getBuyerProfile(params?: { email?: string }) {
  const q = new URLSearchParams()
  if (params?.email) q.set('email', params.email)
  const queryString = q.toString()
  return apiGet<{ profile: any | null; user: { id: string; email: string; name?: string; role: string } }>(`/api/buyer-profile${queryString ? `?${queryString}` : ''}`)
}

export async function saveBuyerProfile(payload: any) {
  return apiJSON<{ success: boolean; profile: any }>(`/api/buyer-profile`, 'POST', payload)
}

export async function getUserById(id: string) {
  return apiGet<{ user: { id: string; email: string; name?: string; role: string; companyName?: string } }>(`/api/users/${id}`)
}
