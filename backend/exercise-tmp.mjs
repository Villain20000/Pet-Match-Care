/**
 * TEMPORARY manual exercise harness — deleted after use.
 * Exercises every route group of the real app over HTTP against localhost:4000.
 * Usage: node exercise-tmp.mjs <phase>
 * Phases: 1=auth/reports/alerts/spots/adoption/municipalities/favorites/badges/
 *         streaks/foster/chat/donations/lost-pets+notifications 2=volunteer 3=worker
 *         4=shelter 5=platform-admin
 */
const BASE = 'http://localhost:4000';
const DEMO_PASSWORD = 'Demo12345!';

const accounts = {
  giannis: 'giannis@petmatch.demo',
  volunteer: 'volunteer@petmatch.demo',
  worker: 'worker@petmatch.demo',
  shelter: 'shelter@petmatch.demo',
  admin: 'admin@petmatch.demo',
};

let failures = 0;

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
  console.log(`>> ${method} ${path}  -> ${res.status}${note ? `  [${note}]` : ''}`);
  return { status: res.status, data };
}

function check(cond, message) {
  if (!cond) {
    failures += 1;
    console.log(`   !! UNEXPECTED: ${message}`);
  }
}

async function main() {
  const arg = process.argv[2];
  const targetPhase = arg && arg !== 'all' ? Number(arg) : null;
  const runPhase = (p) => targetPhase === null || targetPhase === p;
  let token;
  let userId;
  let reportId;

  // ---------------- Phase 1: citizen (giannis) ----------------
  if (runPhase(1)) {

    // Auth (max 5 req/min on /api/auth — budget: bad login, login, register, me, sessions)
    let r = await call('POST', '/api/auth/login', {
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

    r = await call('POST', '/api/auth/register', {
      body: {
        email: `tester-${Date.now()}@petmatch.demo`,
        password: DEMO_PASSWORD,
        fullName: 'Test User',
      },
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
        description: 'Αδέσπιο σκύλος — χρειάζεται βοήθεια.',
        latitude: 37.9842,
        longitude: 23.7351,
        addressHint: 'Πλ. Αγίου Ζωπικιού 12',
      },
      note: 'create stray report',
    });
    check(r.status === 201 && r.data.report, 'create report should be 201');
    reportId = r.data.report.id;

    r = await call('GET', `/api/reports/${reportId}`, { token, note: 'get one report' });
    check(r.status === 200 && r.data.report.id === reportId, 'get report should be 200');

    r = await call('GET', `/api/reports/${reportId}/timeline`, { token, note: 'report timeline (v2)' });
    check(r.status === 200, 'report timeline should be 200');
    const timelineUpdates = r.data.updates ?? [];
    console.log(`   timeline updates: ${timelineUpdates.length}`);
    check(timelineUpdates.length >= 1, 'timeline should contain the initial OPEN update after report creation');

    // ---- alerts ----
    r = await call('POST', '/api/alerts/poison', {
      token,
      body: { latitude: 37.9842, longitude: 23.7351, description: 'Έλαφος σε δρόμο' },
      note: 'create poison alert',
    });
    check(r.status === 201 && r.data.alert, 'create poison alert should be 201');

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

    // ---- platform features (mounted at /api/<feature>) ----
    r = await call('GET', '/api/feeding-stations', { note: 'feeding stations' });
    check(r.status === 200, 'feeding stations should be 200');

    r = await call('GET', '/api/community/posts', { note: 'community posts' });
    check(r.status === 200, 'community posts should be 200');

    r = await call('GET', '/api/events', { note: 'events' });
    check(r.status === 200, 'events should be 200');

    r = await call('GET', '/api/sitters', { query: { city: 'Αθήνα' }, note: 'sitters' });
    check(r.status === 200, 'sitters should be 200');

    r = await call('GET', '/api/challenges', { note: 'challenges' });
    check(r.status === 200, 'challenges should be 200');

    r = await call('GET', '/api/rewards', { note: 'rewards' });
    check(r.status === 200, 'rewards should be 200');

    r = await call('POST', '/api/matchmaker/quiz', {
      token,
      body: { lifestyle: 'ACTIVE', space: 'MEDIUM', hoursAlone: 4, hasKids: false },
      note: 'smart matchmaker quiz',
    });
    check(r.status === 200, 'matchmaker quiz should be 200');

    console.log(`PHASE1_OK failures=${failures}`);
  }

  // ---------------- Phase 2: volunteer ----------------
  if (runPhase(2)) {
    let vToken;
    let r = await call('POST', '/api/auth/login', {
      body: { email: accounts.volunteer, password: DEMO_PASSWORD },
      note: 'volunteer login',
    });
    check(r.status === 200, 'volunteer login should be 200');
    vToken = r.data.accessToken;
    const volunteerUserId = r.data.user.id;

    if (!userId) {
      const gLogin = await call('POST', '/api/auth/login', {
        body: { email: accounts.giannis, password: DEMO_PASSWORD },
      });
      userId = gLogin.data?.user?.id;
    }

    r = await call('GET', '/api/foster/profile', { token: vToken, note: 'volunteer foster profile' });
    check(r.status === 200, 'volunteer foster profile should be 200');

    r = await call('GET', '/api/foster/search', {
      token: vToken,
      query: { city: 'Θεσσαλονίκη', species: 'DOG' },
      note: 'volunteer foster search',
    });
    check(r.status === 200, 'volunteer foster search should be 200');

    r = await call('GET', '/api/chat/rooms', { token: vToken, note: 'volunteer chat rooms' });
    check(r.status === 200, 'volunteer chat rooms should be 200');

    r = await call('POST', '/api/chat/rooms', {
      token: vToken,
      body: { targetUserId: userId, topic: 'Adoption discussion' },
      note: 'volunteer creates DM room',
    });
    check(r.status === 200, 'chat room create should be 200');
    const roomId = r.data.room?.id ?? r.data.data?.id;

    r = await call('GET', `/api/chat/rooms/${roomId}/messages`, { token: vToken, note: 'chat room messages' });
    check(r.status === 200, 'chat room messages should be 200');

    r = await call('POST', `/api/chat/rooms/${roomId}/messages`, {
      token: vToken,
      body: { text: 'Γεια σου! Θα ήθελα να συζητήσουμε την υιοθεσία.' },
      note: 'send chat message',
    });
    check(r.status === 201, 'chat message send should be 201');

    r = await call('GET', '/api/streaks/me', { token: vToken, note: 'volunteer streak' });
    check(r.status === 200, 'volunteer streak should be 200');

    r = await call('POST', '/api/streaks/check-in', { token: vToken, note: 'volunteer check-in' });
    check(r.status === 200, 'volunteer check-in should be 200');

    r = await call('POST', '/api/ugc/report', {
      token: vToken,
      body: { targetType: 'STRAY_REPORT', targetId: reportId ?? 'b7a99456-aa42-41be-8cc4-4b17a1b66f13', reason: 'Spam', details: 'Test report' },
      note: 'volunteer submits UGC report',
    });
    check(r.status === 201, 'ugc submitReport should be 201');

    r = await call('POST', '/api/ugc/block', {
      token: vToken,
      body: { blockedId: userId },
      note: 'volunteer blocks a user',
    });
    check(r.status === 201, 'ugc blockUser should be 201');

    console.log(`PHASE2_OK failures=${failures}`);
  }

  // ---------------- Phase 3: municipal worker ----------------
  if (runPhase(3)) {
    let wToken;
    let r = await call('POST', '/api/auth/login', {
      body: { email: accounts.worker, password: DEMO_PASSWORD },
      note: 'worker login',
    });
    check(r.status === 200, 'worker login should be 200');
    wToken = r.data.accessToken;

    if (!reportId) {
      const reps = await call('GET', '/api/reports/nearby', {
        token: wToken,
        query: { lat: '37.9842', lng: '23.7351', radius: '10' },
      });
      reportId = reps.data?.reports?.[0]?.id;
    }

    r = await call('GET', '/api/lost-pets/matches', {
      token: wToken,
      query: { lat: '37.9842', lng: '23.7351', species: 'DOG', description: 'σκυλος' },
      note: 'lost pet matches',
    });
    check(r.status === 200, 'lost pet matches should be 200');

    r = await call('PATCH', `/api/reports/${reportId}/status`, {
      token: wToken,
      body: { status: 'IN_PROGRESS' },
      note: 'worker advances report status',
    });
    check(r.status === 200, 'worker report status update should be 200');

    r = await call('POST', `/api/reports/${reportId}/updates`, {
      token: wToken,
      body: { status: 'IN_PROGRESS', body: 'Έχουμε αρκετούς βοηθούς στο σημείο.' },
      note: 'worker posts timeline update',
    });
    check(r.status === 201, 'worker timeline update should be 201');

    r = await call('GET', `/api/reports/${reportId}/timeline`, { token: wToken, note: 'report timeline after update' });
    check(r.status === 200, 'report timeline should be 200');

    console.log(`PHASE3_OK failures=${failures}`);
  }

  // ---------------- Phase 4: shelter admin ----------------
  if (runPhase(4)) {
    let sToken;
    let r = await call('POST', '/api/auth/login', {
      body: { email: accounts.shelter, password: DEMO_PASSWORD },
      note: 'shelter login',
    });
    check(r.status === 200, 'shelter login should be 200');
    sToken = r.data.accessToken;
    const shelterUserId = r.data.user.id;

    if (!token) {
      const gLogin = await call('POST', '/api/auth/login', {
        body: { email: accounts.giannis, password: DEMO_PASSWORD },
      });
      token = gLogin.data?.accessToken;
    }

    r = await call('POST', '/api/adoption', {
      token: sToken,
      body: {
        shelterId: shelterUserId,
        name: 'Demo Cat',
        species: 'CAT',
        age: '1 ετή',
        size: 'Μικρή',
        description: 'Ένας φιλικός γάτα που αναζητά σπίτι.',
        imageUrl: 'https://placehold.co/640x480?text=Pet-Match+Demo',
        isUrgent: false,
        isMicrochipped: true,
        isVaccinated: true,
        isSterilized: true,
      },
      note: 'shelter creates a pet',
    });
    check(r.status === 201, 'shelter create pet should be 201');
    const newPetId = r.data.pet?.id;

    r = await call('GET', '/api/adoption', { token: sToken, note: 'shelter adoption list' });
    check(r.status === 200, 'shelter adoption list should be 200');

    r = await call('GET', '/api/adoption-applications/mine', { token: sToken, note: 'shelter my applications' });
    check(r.status === 200, 'shelter applications mine should be 200');

    r = await call('GET', '/api/adoption-applications/queue', { token: sToken, note: 'shelter application queue' });
    check(r.status === 200, 'shelter application queue should be 200');

    // Citizen (giannis) applies for the new pet; shelter processes it.
    r = await call('POST', '/api/adoption-applications', {
      token: token,
      body: {
        petId: newPetId,
        motivation: 'Θέλω ένα γάτο για το σπίτι μου και την αυλή.',
        homeEnvironment: { hasYard: true, hasKids: 0, hasOtherPets: false, hoursAlone: 3 },
        questionnaire: { previousPetOwners: 'Ναι', dailyRoutine: 'Ελεύθερα', travelFrequency: 'Σπάνια' },
      },
      note: 'citizen submits adoption draft',
    });
    check(r.status === 201, 'adoption draft submit should be 201');
    const draftAppId = r.data.application?.id;

    r = await call('POST', `/api/adoption-applications/${draftAppId}/transition`, {
      token: token,
      body: { to: 'SUBMITTED' },
      note: 'citizen submits draft -> SUBMITTED',
    });
    check(r.status === 200, 'citizen DRAFT->SUBMITTED should be 200');

    r = await call('POST', `/api/adoption-applications/${draftAppId}/transition`, {
      token: sToken,
      body: { to: 'SCREENING' },
      note: 'shelter moves application to SCREENING',
    });
    check(r.status === 200, 'shelter SUBMITTED->SCREENING should be 200');

    r = await call('POST', `/api/adoption-applications/${draftAppId}/home-check`, {
      token: sToken,
      body: { scheduledAt: new Date(Date.now() + 86400000).toISOString(), inspectorName: 'Δρ. Αργύρης Καρβουνά' },
      note: 'shelter schedules home check',
    });
    check(r.status === 200, 'shelter home-check scheduling should be 200');

    r = await call('GET', '/api/adoption-applications/mine', { token: token, note: 'citizen my applications' });
    check(r.status === 200, 'citizen applications mine should be 200');

    r = await call('GET', `/api/adoption-applications/${draftAppId}`, { token: token, note: 'get one application' });
    check(r.status === 200, 'get one application should be 200');

    console.log(`PHASE4_OK failures=${failures}`);
  }

  // ---------------- Phase 5: platform admin ----------------
  if (runPhase(5)) {
    let aToken;
    let r = await call('POST', '/api/auth/login', {
      body: { email: accounts.admin, password: DEMO_PASSWORD },
      note: 'admin login',
    });
    check(r.status === 200, 'admin login should be 200');
    aToken = r.data.accessToken;

    r = await call('GET', '/api/adoption-applications/queue', { token: aToken, note: 'admin application queue' });
    check(r.status === 200, 'admin application queue should be 200');

    r = await call('GET', '/api/admin/pets', { token: aToken, note: 'admin list shelter pets' });
    check(r.status === 200, 'admin list pets should be 200');

    r = await call('GET', '/api/admin/reports', {
      token: aToken,
      query: { municipality: 'Δήμος Αθηναίων' },
      note: 'admin municipal reports',
    });
    check(r.status === 200, 'admin reports should be 200');

    r = await call('POST', '/api/pet-tags', {
      token: aToken,
      body: { petName: 'Λυπάς Βίκος', contactPhone: '2101234567', medicalNotes: 'Γενικός καλός' },
      note: 'admin creates QR pet tag',
    });
    check(r.status === 201, 'pet tag create should be 201');
    const petTagCode = r.data.data?.code ?? r.data.code;

    r = await call('GET', `/api/pet-tags/${petTagCode}`, { note: 'lookup QR pet tag' });
    check(r.status === 200, 'pet tag lookup should be 200');

    r = await call('POST', '/api/community/posts', {
      token: aToken,
      body: { title: 'Best parks in Athens?', body: 'Which parks are pet friendly?', category: 'ADVICE' },
      note: 'admin creates community post',
    });
    check(r.status === 201, 'community post create should be 201');
    const postId = r.data.data?.id ?? r.data.id;

    r = await call('POST', `/api/community/posts/${postId}/comments`, {
      token: aToken,
      body: { body: 'The park near my house is great.' },
      note: 'comment on community post',
    });
    check(r.status === 201, 'community comment should be 201');

    r = await call('GET', '/api/community/posts', { note: 'community posts list' });
    check(r.status === 200, 'community posts list should be 200');

    r = await call('POST', '/api/pets/none/sponsor', {
      token: aToken,
      body: { amount: 15 },
      note: 'sponsor non-existent pet (expect 404)',
    });
    check(r.status === 404, 'sponsor unknown pet should be 404 (invalid test input)');

    r = await call('POST', '/api/feeding-stations/none/refill', {
      token: aToken,
      body: { notes: 'refill' },
      note: 'refill non-existent station (expect 404)',
    });
    check(r.status === 404, 'refill unknown station should be 404 (invalid test input)');

    r = await call('GET', '/api/donations', { note: 'donations list' });
    check(r.status === 200, 'donations should be 200');

    console.log(`PHASE5_OK failures=${failures}`);
  }

  console.log(`ALL_EXERCISES_COMPLETED failures=${failures}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
