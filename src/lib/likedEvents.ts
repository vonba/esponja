import { writable } from 'svelte/store';

const STORAGE_KEY = 'likedEvents';

// Utility functions to get and set local storage
function getLocalStorage(key: string): string | null {
   // Ensure this only runs on the client
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(key);
}

function setLocalStorage(key: string, value: string) {
   // Ensure this only runs on the client
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, value);
}

// Retrieve liked events from local storage
export function getLikedEvents(): LikedEvent[] {
  const storedData = getLocalStorage(STORAGE_KEY);
  return storedData ? JSON.parse(storedData) : [];
}

// Save liked events to local storage
function saveLikedEvents(events: LikedEvent[]) {
  setLocalStorage(STORAGE_KEY, JSON.stringify(events));
}

// Svelte store for liked events
export const likedEventsStore = writable<LikedEvent[]>(typeof localStorage !== 'undefined' ? getLikedEvents() : []);

likedEventsStore.subscribe(value => {
  if (typeof localStorage !== 'undefined') {
    saveLikedEvents(value);
  }
});

// Add event to liked events
export function addLikedEvent(event: EventProperties) {
  const eventToAdd: LikedEvent = {
    id: event.id,
    slug: event.slug,
    name: event.name,
    imageKeyLarge: event.imageKeyLarge,
    imageKeySmall: event.imageKeySmall,
    startDate: event.startDate,
    startTime: event.startTime,
    endDate: event.endDate,
    endTime: event.endTime,
  }
  likedEventsStore.update(events => {
    if (!events.find(e => e.id === eventToAdd.id)) {
      return [...events, eventToAdd];
    }
    return events;
  });
}

// Remove event from liked events
export function removeLikedEvent(eventId: number) {
  likedEventsStore.update(events => events.filter(event => event.id !== eventId));
}

// Check if event is liked
export function isEventLiked(eventId: number): boolean {
  const events = getLikedEvents();
  return events.some(event => event.id === eventId);
}

// Toggle event in liked events
export function toggleLikedEvent(event: EventProperties) {
  const events = getLikedEvents();
  if (events.find(e => e.id === event.id)) {
    removeLikedEvent(event.id);
  } else {
    addLikedEvent(event);
  }
}
