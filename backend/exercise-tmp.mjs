/**
 * TEMPORARY manual exercise harness — deleted after use.
 * Exercises every route group of the real app over HTTP against localhost:4000.
 */
const BASE = 'http://localhost:4000';
const DEMO_PASSWORD = 'Demo12345!';

const accounts = {
  giannis: 'giannis@petmatch.demo',
  tester1: 'tester1@petmatch.demo',
  volunteer: 'volunteer@petmatch.demo',
  worker: 'worker@petmatch.demo',
  shelter: 'shelter@petmatch.demo',
  admin: 'admin@petmatch.demo',
};

let failures = 0;
const seen = new Map();

async function call(method, path, opts = {}) {
  const { token, body, query, note } = opts;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const url = new URL(path, BASE);
  if (query) {
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text.slice(0, 120);
  }
  const label = `${method} ${path}`;
  console.log(`>> ${method} ${path}  -> ${res.status}${note ? `  [${note}]` : ''}`);
  return { status: res.status, data };
}

function check(cond, message) {
  if (!cond) {
    failures += 1;
    console.log(`   !! UNEXPECTED: ${message}`);
  }
}

function summarize(value) {
  if (value === null || value === undefined) return String(value);
  if (Array.isArray(value)) return `${value.length} items`;
  if (typeof value === 'object') {
    const keys = Object.keys(value).slice(0, 6);
    return `{ ${keys.join(', ')} }`;
  }
  return JSON.stringify(value).slice(0, 80);
}

async function main() {
  // ---------------- Phase 1: citizen (giannis) ----------------
  let token;
  let userId;

  // (The auth router is rate-limited to 5 requests/minute, so this phase
  // deliberately makes only 5 requests against /api/auth.)

  r = await call('POST', '/api/auth/login', {
    body: { email: accounts.giannis, password: 'WrongPass123!' },
    note: 'bad login (expect 401)',
  });
  check(r.status === 401, 'bad login must be 401');

  r = await call('POST', '/api/auth/login', {
    body: { email: accounts.giannis, password: DEMO_PASSWORD },
    note: 'demo account login',
  });
  check(r.status === 200, 'login should be 200');
  token = r.data.accessToken;
  userId = r.data.user.id;
  console.log(`   userId=${userId} locale=${r.data.user.locale}`);

  r = await call('POST', '/api/auth/register', {
    body: { email: accounts.tester1, password: DEMO_PASSWORD, fullName: 'Test User' },
    note: 'register a brand-new citizen',
  });
  check(r.status === 201, 'register should be 201');
  const testerToken = r.data.accessToken;

  r = await call('GET', '/api/auth/me', { token, note: 'authenticated me' });
  check(r.status === 200 && r.data.user.email === accounts.giannis, 'me should return the user');

  r = await call('GET', '/api/auth/sessions', { token, note: 'authenticated sessions' });
  check(r.status === 200 && Array.isArray(r.data.sessions), 'sessions should be a list');

  // ---- reports ----
  r = await call('GET', '/api/reports/nearby', {
    token,
    query: { lat: '37.9842', lng: '23.7351', radius: '10' },
    note: 'nearby reports',
  });
  check(r.status === 200 && Array.isArray(r.data.reports), 'nearby must be 200 with reports list');

  r = await call('POST', '/api/reports', {
    token,
    body: {
      imageUrl: 'https://placehold.co/640x480?text=Demo+Report',
      condition: 'INJURED',
      description: 'Αδέσπιο σκύλο — χρειάζεται βοήθεια.',
      latitude: 37.9842,
      longitude: 23.7351,
      addressHint: 'Πλ. Αγίου Ζωπικιού 12',
    },
    note: 'create stray report',
  });
  check(r.status === 201 && r.data.report, 'create report should be 201');
  const reportId = r.data.report.id;

  r = await call('GET', `/api/reports/${reportId}`, { token, note: 'get one report' });
  check(r.status === 200 && r.data.report.id === reportId, 'get report should be 200');

  r = await call('GET', `/api/reports/${reportId}/timeline`, { token, note: 'report timeline (v2)' });
  check(r.status === 200, 'report timeline should be 200');
  const timelineUpdates = r.data.updates ?? [];
  console.log(`   timeline updates: ${timelineUpdates.length}`);

  // ---- alerts ----
  r = await call('POST', '/api/alerts/poison', {
    token,
    body: { latitude: 37.9842, longitude: 23.7351, description: 'Έλαφος σε δρόμο' },
    note: 'create poison alert',
  });
  check(r.status === 201 && r.data.alert, 'create poison alert should be 201');
  const poisonId = r.data.alert.id;

  r = await call('GET', '/api/alerts/poison/active', {
    token,
    query: { lat: '37.9842', lng: '23.7351', radius: '2' },
    note: 'active poison alerts',
  });
  check(r.status === 200 && Array.isArray(r.data.alerts), 'active alerts should be 200');

  // ---- spots ----
  r = await call('GET', '/api/spots', { note: 'spots list (optional auth)' });
  check(r.status === 200 && Array.isArray(r.data.spots), 'spots list should be 200');

  r = await call('POST', '/api/spots', {
    token,
    body: { name: 'Demo Park', category: 'PARK', latitude: 38.0, longitude: 23.7, address: 'Demo street' },
    note: 'create spot',
  });
  check(r.status === 201 && r.data.spot, 'create spot should be 201');
  const spotId = r.data.spot.id;

  r = await call('POST', `/api/spots/${spotId}/vote`, { token, body: { value: 1 } });
  check(r.status === 200, 'vote should be 200');

  r = await call('POST', `/api/spots/${spotId}/vote`, { token, body: { value: -1 } });
  check(r.status === 200, 'downvote should be 200');

  // ---- adoption ----
  r = await call('GET', '/api/adoption', { note: 'adoption list (optional auth)' });
  check(r.status === 200 && Array.isArray(r.data.pets), 'adoption list should be 200');
  const pets = r.data.pets;
  const petId = pets[0]?.id;

  r = await call('GET', `/api/adoption/${petId}`, { token, note: 'get one pet' });
  check(r.status === 200 && r.data.pet, 'get pet should be 200');

  r = await call('POST', `/api/adoption/${petId}/interest`, { token });
  check(r.status === 200, 'express interest should be 200');

  // ---- municipalities ----
  r = await call('GET', '/api/municipalities', { note: 'municipalities list' });
  check(r.status === 200 && Array.isArray(r.data.municipalities), 'municipalities should be 200');

  r = await call('GET', '/api/municipalities/closest', {
    query: { lat: '37.9842', lng: '23.7351' },
    note: 'closest municipality',
  });
  check(r.status === 200 && r.data.name, 'closest municipality should be 200');

  // ---- lost pets ----
  r = await call('GET', '/api/lost-pets', { note: 'lost pets list (optional auth)' });
  check(r.status === 200 && Array.isArray(r.data.pets), 'lost pets list should be 200');

  // ---- notifications ----
  r = await call('GET', '/api/notifications/inbox', { token, note: 'inbox' });
  check(r.status === 200 && Array.isArray(r.data.items), 'inbox should be 200');

  r = await call('GET', '/api/notifications/unread', { token, note: 'unread count' });
  check(r.status === 200, 'unread should be 200');

  // ---- favorites ----
  r = await call('GET', '/api/favorites', { token, note: 'favorites list' });
  check(r.status === 200 && Array.isArray(r.data.pets), 'favorites should be 200');

  r = await call('GET', '/api/favorites/ids', { token, note: 'favorites ids' });
  check(r.status === 200 && Array.isArray(r.data.ids), 'favorites ids should be 200');

  r = await call('POST', `/api/favorites/${petId}`, { token, body: {} });
  check(r.status === 201, 'add favorite should be 201');

  // ---- badges / streaks / notifications ----
  r = await call('GET', '/api/badges', { note: 'all badges' });
  check(r.status === 200 && Array.isArray(r.data.badges), 'badges list should be 200');

  r = await call('GET', '/api/badges/mine', { token, note: 'my badges' });
  check(r.status === 200, 'my badges should be 200');

  r = await call('GET', '/api/badges/leaderboard/municipality', {
    query: { municipality: 'Δήμος Αθηναίων' },
    token,
    note: 'municipality leaderboard',
  });
  check(r.status === 200, 'leaderboard should be 200');

  r = await call('GET', '/api/streaks/me', { token, note: 'my streak' });
  check(r.status === 200, 'streak status should be 200');

  // ---- extra features ----
  r = await call('GET', '/api/foster/profile', { token, note: 'my foster profile' });
  check(r.status === 200, 'foster profile should be 200');

  r = await call('GET', '/api/foster/search', {
    token,
    query: { city: 'Θεσσαλονίκη', species: 'DOG' },
    note: 'foster search',
  });
  check(r.status === 200, 'foster search should be 200');

  r = await call('GET', `/api/pets/${petId}/medical-records`, { token, note: 'medical records' });
  check(r.status === 200, 'medical records should be 200');

  r = await call('GET', '/api/chat/rooms', { token, note: 'chat rooms' });
  check(r.status === 200, 'chat rooms should be 200');

  r = await call('GET', '/api/donations', { note: 'donation campaigns' });
  check(r.status === 200, 'donations should be 200');

  r = await call('GET', '/api/platform-features/feeding-stations', { note: 'feeding stations' });
  check(r.status === 200, 'feeding stations should be 200');

  r = await call('GET', '/api/platform-features/community/posts', { note: 'community posts' });
  check(r.status === 200, 'community posts should be 200');

  r = await call('GET', '/api/platform-features/events', { note: 'events' });
  check(r.status === 200, 'events should be 200');

  r = await call('GET', '/api/platform-features/sitters', {
    query: { city: 'Αθήνα' },
    note: 'sitters',
  });
  check(r.status === 200, 'sitters should be 200');

  r = await call('GET', '/api/platform-features/challenges', { note: 'challenges' });
  check(r.status === 200, 'challenges should be 200');

  r = await call('GET', '/api/platform-features/rewards', { note: 'rewards' });
  check(r.status === 200, 'rewards should be 200');

  console.log(`phase1 done, failures so far: ${failures}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
