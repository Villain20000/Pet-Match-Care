/**
 * Demo data seeder.
 *
 * Loads the "story" used to explore the platform without a real user base:
 *   - demo users across every `Role` (local password auth, pre-verified,
 *     so nobody has to walk the email-verification flow)
 *   - stray reports in every non-EXPIRED status (OPEN → ASSIGNED → RESOLVED)
 *   - shelter pets, an adoption application, favorites, medical records
 *   - light supporting rows (notifications, a foster profile)
 *
 * The seed is idempotent: rows it owns are removed before they are
 * (re-)created, and demo users are recognised by a fixed email domain.
 * Real user data is never touched.
 *
 * Run: npm run prisma:seed
 */
import { hashPassword } from '../src/utils/password';
import { findClosestMunicipality } from '../src/services/municipality.service';
import { prisma } from '../src/config/prisma';
import { env } from '../src/config/env';
import { evaluateBadges } from '../src/services/badges.engine';
import {
  AuthProvider,
  AdoptionStatus,
  BadgeRarity,
  NotificationKind,
  ReportCondition,
  ReportStatus,
  Role,
  Species,
} from '@prisma/client';

/** Shared demo password — printed at the end so devs can log in. */
const DEMO_PASSWORD = 'Demo12345!';

const DEMO_IMAGE_URL = 'https://placehold.co/640x480?text=Pet-Match+Demo';

interface DemoAccount {
  email: string;
  fullName: string;
  role: Role;
  locale: 'el' | 'en';
  homeLat: number;
  homeLng: number;
  karmaPoints: number;
}

const demoAccounts: DemoAccount[] = [
  {
    email: 'admin@petmatch.demo',
    fullName: 'Ιωάννης Διακυνητής',
    role: Role.PLATFORM_ADMIN,
    locale: 'el',
    homeLat: 37.9837,
    homeLng: 23.7275,
    karmaPoints: 250,
  },
  {
    email: 'shelter@petmatch.demo',
    fullName: 'Αγγελία Φιλοζωικής',
    role: Role.SHELTER_ADMIN,
    locale: 'el',
    homeLat: 38.2466,
    homeLng: 21.7346,
    karmaPoints: 80,
  },
  {
    email: 'volunteer@petmatch.demo',
    fullName: 'Κωνσταντίνος Βοηθός',
    role: Role.VOLUNTEER,
    locale: 'el',
    homeLat: 40.6401,
    homeLng: 22.9444,
    karmaPoints: 40,
  },
  {
    email: 'worker@petmatch.demo',
    fullName: 'Ελένη Μητρότητας',
    role: Role.MUNICIPAL_WORKER,
    locale: 'el',
    homeLat: 40.9396,
    homeLng: 24.4012,
    karmaPoints: 20,
  },
  {
    email: 'giannis@petmatch.demo',
    fullName: 'Γιάννης Πετροπούλας',
    role: Role.CITIZEN,
    locale: 'el',
    homeLat: 37.9842,
    homeLng: 23.7351,
    karmaPoints: 120,
  },
  {
    email: 'sophia@petmatch.demo',
    fullName: 'Σοφία Παπαδοπούλου',
    role: Role.CITIZEN,
    locale: 'en',
    homeLat: 39.639,
    homeLng: 22.4191,
    karmaPoints: 10,
  },
];

const demoEmailList = () => demoAccounts.map((account) => account.email);

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

interface StrayReportSeed {
  reporterEmail: string;
  condition: ReportCondition;
  description: string;
  latitude: number;
  longitude: number;
  addressHint: string;
  status: ReportStatus;
  assignedAt?: Date;
  resolvedAt?: Date;
  expiresAt?: Date;
  /** Defaults to ~1 day ago. */
  createdAt?: Date;
}

const strayReportSeeds: StrayReportSeed[] = [
  {
    reporterEmail: 'giannis@petmatch.demo',
    condition: ReportCondition.INJURED,
    description: 'Αδέσπιο σκύλο τύφων — χρειάζεται επείγον βοήθεια.',
    latitude: 37.9842,
    longitude: 23.7351,
    addressHint: 'Πλ. Αγίου Ζωπικιού 12, Αθηνα',
    status: ReportStatus.OPEN,
    expiresAt: daysFromNow(env.STRAY_REPORT_TTL_DAYS),
    createdAt: daysAgo(1),
  },
  {
    reporterEmail: 'volunteer@petmatch.demo',
    condition: ReportCondition.STABLE,
    description: 'Μεταφέρθηκε από τον πεζοδρόμιο στην αυλή του δήμου.',
    latitude: 40.6401,
    longitude: 22.9444,
    addressHint: 'Δ. Χειμερινού 8, Θεσσαλονίκη',
    status: ReportStatus.ASSIGNED,
    assignedAt: daysAgo(10),
    expiresAt: daysFromNow(env.STRAY_REPORT_TTL_DAYS),
    createdAt: daysAgo(12),
  },
  {
    reporterEmail: 'giannis@petmatch.demo',
    condition: ReportCondition.STABLE,
    description: 'Βρέθηκε ήσυχο στην πλατεία — ήρθε η βοήθεια.',
    latitude: 38.2466,
    longitude: 21.7346,
    addressHint: 'Πλ. Εθνικής Αντιστάσεως, Πάτρα',
    status: ReportStatus.RESOLVED,
    resolvedAt: daysAgo(1),
    createdAt: daysAgo(20),
  },
];

interface ShelterPetSeed {
  name: string;
  species: Species;
  age: string;
  size: string;
  description: string;
  status: AdoptionStatus;
  isUrgent?: boolean;
  isMicrochipped?: boolean;
  isVaccinated?: boolean;
  isSterilized?: boolean;
  healthNotes?: string;
}

const shelterPetSeeds: ShelterPetSeed[] = [
  {
    name: 'Λυπάς Βίκος',
    species: Species.DOG,
    age: '2 ετών',
    size: 'Μεγάλος',
    description: 'Χαρούμενος, μαλακός και πολύ δεξιόχειλος. Ήρθε σε εξέταση για τη γόια.',
    status: AdoptionStatus.AVAILABLE,
    isUrgent: true,
    isMicrochipped: true,
    isVaccinated: true,
    isSterilized: true,
    healthNotes: 'Γενικός καλός — μόνο απαιτείται η οικογένεια.',
  },
  {
    name: 'Μηνίτσα',
    species: Species.CAT,
    age: '1 ετή',
    size: 'Μικρή',
    description: 'Φιλική, ήρεμη και ταιριάζει με μικρό διαμέρισμα.',
    status: AdoptionStatus.AVAILABLE,
    isMicrochipped: true,
    isVaccinated: true,
    isSterilized: true,
  },
  {
    name: 'Ουρφές',
    species: Species.OTHER,
    age: '4 ετές',
    size: 'Μικρό',
    description: 'Έλαφος που χρειάζεται σπίτι με μεγάλη αυλή.',
    status: AdoptionStatus.DRAFT,
    healthNotes: 'Draft — αναμένεται επαπόθεση από το καταφύλιο.',
  },
  {
    name: 'Γάτος Διαμάντης',
    species: Species.CAT,
    age: '5 ετών',
    size: 'Μικρό',
    description: 'Μια γάτα με πολυτελή προτίμηση για κυνική οικία.',
    status: AdoptionStatus.ADOPTED,
    isMicrochipped: true,
  },
];

interface MedicalRecordSeed {
  petName: string;
  recordType: string;
  title: string;
  performedAt: Date;
  nextDueDate?: Date;
  vetName?: string;
}

const medicalRecordSeeds: MedicalRecordSeed[] = [
  {
    petName: 'Λυπάς Βίκος',
    recordType: 'VACCINE',
    title: 'Ετήσια vaccine κατά του θανάτου',
    performedAt: daysAgo(300),
    nextDueDate: daysFromNow(365),
    vetName: 'Δρ. Αργύρης Καρβουνά',
  },
  {
    petName: 'Λυπάς Βίκος',
    recordType: 'EXAMINATION',
    title: 'Ετήσια οδολογική εξέταση',
    performedAt: daysAgo(30),
    vetName: 'Δρ. Αργύρης Καρβουνά',
  },
  {
    petName: 'Μηνίτσα',
    recordType: 'DEWORMING',
    title: 'Ανάρρωση μετά από νόσο',
    performedAt: daysAgo(90),
    vetName: 'Δρ. Αργύρης Καρβουνά',
  },
];

interface HomeEnvironment {
  hasYard: boolean;
  hasKids: number;
  hasOtherPets: boolean;
  hoursAlone: number;
}

interface AdoptionApplicationSeed {
  petName: string;
  applicantEmail: string;
  state: AdoptionStatus;
  motivation: string;
  homeEnvironment: HomeEnvironment;
  questionnaire: Record<string, string>;
  submittedAt: Date;
}

const adoptionApplicationSeeds: AdoptionApplicationSeed[] = [
  {
    petName: 'Λυπάς Βίκος',
    applicantEmail: 'sophia@petmatch.demo',
    state: AdoptionStatus.SUBMITTED,
    motivation: 'Χρειάζομαι ένα σκύλο που να με συνοδεύει στην καθημερινή διαδρομή.',
    homeEnvironment: { hasYard: true, hasKids: 0, hasOtherPets: false, hoursAlone: 4 },
    questionnaire: {
      previousPetOwners: 'Ναι, δύο χρόνια',
      dailyRoutine: 'Ελεύθερα από τα 08:00',
      travelFrequency: 'Σπάνια',
    },
    submittedAt: daysAgo(2),
  },
  {
    petName: 'Μηνίτσα',
    applicantEmail: 'giannis@petmatch.demo',
    state: AdoptionStatus.HOME_CHECK_SCHEDULED,
    motivation: 'Θα ήθελα τη Μηνίτσα για να κυκλοφορεί στο σπίτι μου.',
    homeEnvironment: { hasYard: true, hasKids: 2, hasOtherPets: true, hoursAlone: 6 },
    questionnaire: {
      previousPetOwners: 'Ναι, ένα σκύλο',
      dailyRoutine: 'Από τα ξύπναρα',
      travelFrequency: 'Σπάνια',
    },
    submittedAt: daysAgo(1),
  },
];

interface DemoNotificationSeed {
  userEmail: string;
  kind: NotificationKind;
  title: string;
  body: string;
}

const demoNotificationSeeds: DemoNotificationSeed[] = [
  {
    userEmail: 'giannis@petmatch.demo',
    kind: NotificationKind.KARMA_REWARD,
    title: '✨ Έλατε 120 karma!',
    body: 'Οι αναφορές και οι ψηφοφορίες σου ενισχύουν την κοινότητα.',
  },
  {
    userEmail: 'sophia@petmatch.demo',
    kind: NotificationKind.GENERAL,
    title: 'Ενημέρωση από το Shelter',
    body: 'Το ζώο που αιτήσατε βρίσκεται πλέον στη λίστα υιοθεσιών.',
  },
];

/** Constants shared by every seed step. */
const DEMO_FOSTER = {
  city: 'Θεσσαλονίκη',
  maxPets: 2,
  preferredSpecies: Species.DOG,
  hasGarden: true,
  hasOtherPets: false,
  notes: 'Έχει μεγάλη αυλή και πρόσβαση σε ηλικωμένο οικόπεδο.',
};

const demoBadges = [
  {
    code: 'first_report',
    name: 'Πρώτη Αναφορά',
    description: 'Δημιούργησες την πρώτη σου αναφορά για αδέσποτο ζώο.',
    iconEmoji: '🐾',
    rarity: BadgeRarity.COMMON,
    predicate: { kind: 'REPORTS_CREATED', threshold: 1 },
  },
  {
    code: 'poison_sentinel',
    name: 'Άγρυπνος Φρουρός',
    description: 'Ειδοποίησες την κοινότητα για κίνδυνο φόλας.',
    iconEmoji: '🚨',
    rarity: BadgeRarity.RARE,
    predicate: { kind: 'POISONS_REPORTED', threshold: 1 },
  },
  {
    code: 'karma_starter',
    name: 'Φίλος των Ζώων',
    description: 'Συγκέντρωσες 50 πόντους κάρμα βοηθώντας ζώα.',
    iconEmoji: '✨',
    rarity: BadgeRarity.COMMON,
    predicate: { kind: 'KARMA_REACHED', threshold: 50 },
  },
  {
    code: 'karma_champion',
    name: 'Προστάτης των Αδέσποτων',
    description: 'Έφτασες τους 200 πόντους κάρμα προσφέροντας ουσιαστική βοήθεια.',
    iconEmoji: '🏆',
    rarity: BadgeRarity.EPIC,
    predicate: { kind: 'KARMA_REACHED', threshold: 200 },
  },
  {
    code: 'streak_master',
    name: 'Αφοσιωμένος Βοηθός',
    description: 'Διατήρησες καθημερινό σερί για 7 συνεχόμενες ημέρες.',
    iconEmoji: '🔥',
    rarity: BadgeRarity.RARE,
    predicate: { kind: 'STREAK_REACHED', threshold: 7 },
  },
];

const demoFeedingStations = [
  {
    name: 'Σταθμός Σίτισης — Πάρκο Ελευθερίας',
    latitude: 37.9818,
    longitude: 23.7533,
    address: 'Βασιλίσσης Σοφίας, Αθήνα',
    lastRefilled: daysAgo(1),
    refillNotes: 'Γεμάτος με ξηρά τροφή και καθαρό νερό.',
  },
  {
    name: 'Σταθμός Σίτισης — Νέα Παραλία',
    latitude: 40.6120,
    longitude: 22.9560,
    address: 'Μεγάλου Αλεξάνδρου, Θεσσαλονίκη',
    lastRefilled: daysAgo(2),
    refillNotes: 'Χρειάζεται συμπλήρωμα σε κονσέρβες.',
  },
];

const demoDonationCampaigns = [
  {
    title: 'Επείγουσα περίθαλψη & τροφή για 12 κουτάβια',
    description: 'Βρέθηκαν εγκαταλελειμμένα σε κιβώτιο. Χρειάζονται εμβολιασμούς, αποπαρασίτωση και ειδική τροφή.',
    targetAmount: 850,
    raisedAmount: 520,
    neededItems: 'Puppy starter food, Royal Canin Starter, πάνες, αλοιφές',
    isEmergency: true,
  },
  {
    title: 'Αναβάθμιση χώρων φιλοξενίας χειμώνα',
    description: 'Μονώσεις και θερμαντικά σώματα για τα σπιτάκια του καταφυγίου ενόψει χαμηλών θερμοκρασιών.',
    targetAmount: 1500,
    raisedAmount: 980,
    neededItems: 'Κουβέρτες, πλαστικές παλέτες, θερμαντικές λάμπες',
    isEmergency: false,
  },
];

const demoChallenges = [
  {
    title: 'Εβδομαδιαίος Φρουρός',
    description: 'Κάνε 3 αναφορές για αδέσποτα ζώα στην περιοχή σου αυτή την εβδομάδα.',
    karmaReward: 50,
    targetCount: 3,
    kind: 'REPORTS_CREATED',
    expiresAt: daysFromNow(7),
  },
  {
    title: 'Συνεχές Σερί 5 Ημερών',
    description: 'Κάνε check-in στην εφαρμογή για 5 συνεχόμενες ημέρες.',
    karmaReward: 30,
    targetCount: 5,
    kind: 'CHECK_IN_STREAK',
    expiresAt: daysFromNow(14),
  },
];

const demoRewards = [
  {
    title: 'Έκπτωση 15% σε Pet Shop',
    description: 'Έκπτωση 15% σε αγορές τροφών και αξεσουάρ στο Pet City.',
    partnerName: 'Pet City',
    karmaCost: 100,
    discountCode: 'PETMATCH15',
    isActive: true,
  },
  {
    title: 'Δωρεάν Σετ Περιποίησης',
    description: 'Ένα πλήρες σετ βούρτσισμα και σαμπουάν για το κατοικίδιό σου.',
    partnerName: 'Care4Pets',
    karmaCost: 200,
    discountCode: 'FREECARE2026',
    isActive: true,
  },
];

const demoCommunityPosts = [
  {
    authorEmail: 'giannis@petmatch.demo',
    title: 'Ποια είναι τα καλύτερα πάρκα για σκύλους στην Αθήνα;',
    body: 'Ψάχνω περιφραγμένους χώρους όπου μπορεί να τρέξει ελεύθερα ο σκύλος μου χωρίς κίνδυνο.',
    category: 'ADVICE',
    comment: {
      authorEmail: 'volunteer@petmatch.demo',
      body: 'Το πάρκο σκύλων στο Πάρκο Τρίτση είναι εξαιρετικό και πολύ μεγάλο!',
    },
  },
  {
    authorEmail: 'shelter@petmatch.demo',
    title: 'Συμβουλές για τις πρώτες μέρες μετά την υιοθεσία',
    body: 'Δώστε χρόνο στο νέο σας κατοικίδιο να προσαρμοστεί. Ο κανόνας 3-3-3 είναι καθοριστικός.',
    category: 'VET_QA',
    comment: {
      authorEmail: 'sophia@petmatch.demo',
      body: 'Πολύ χρήσιμες οδηγίες, βοήθησαν πάρα πολύ με τη δική μας υιοθεσία!',
    },
  },
];

const demoPetTag = {
  ownerEmail: 'giannis@petmatch.demo',
  code: 'TAG-PMC001',
  petName: 'Ρεξ',
  species: Species.DOG,
  contactPhone: '6971234567',
  medicalNotes: 'Αλλεργία στο κοτόπουλο. Πλήρως εμβολιασμένος.',
};

const demoPetEvent = {
  organizerEmail: 'shelter@petmatch.demo',
  title: 'Ημέρα Υιοθεσίας & Ενημέρωσης',
  description: 'Γνωρίστε τα αδέσποτα ζωάκια μας που αναζητούν παντοτινό σπίτι.',
  eventDate: daysFromNow(5),
  location: 'Ζάππειο, Αθήνα',
  latitude: 37.9715,
  longitude: 23.7371,
};

const demoPetSitters = [
  {
    name: 'Μαρία Γεωργίου',
    city: 'Αθήνα',
    services: 'DOG_WALKING, PET_SITTING',
    ratePerHour: 12.0,
    phone: '6981112233',
    rating: 4.9,
  },
  {
    name: 'Νίκος Παπαδάκης',
    city: 'Θεσσαλονίκη',
    services: 'DOG_WALKING, FOSTER_CARE',
    ratePerHour: 10.0,
    phone: '6984445566',
    rating: 4.8,
  },
];

// ---------------------------------------------------------------------------
// Seed steps
// ---------------------------------------------------------------------------

/** Children first — clean up any existing demo rows idempotently. */
async function deleteDemoRows() {
  const emails = demoEmailList();

  await prisma.favorite.deleteMany({
    where: { user: { email: { in: emails } } },
  });
  await prisma.virtualAdoption.deleteMany({
    where: { sponsor: { email: { in: emails } } },
  });
  await prisma.applicationHomeCheck.deleteMany({
    where: { application: { applicant: { email: { in: emails } } } },
  });
  await prisma.applicationAudit.deleteMany({
    where: { application: { applicant: { email: { in: emails } } } },
  });
  await prisma.adoptionApplication.deleteMany({
    where: {
      OR: [
        { applicant: { email: { in: emails } } },
        { pet: { shelter: { email: { in: emails } } } },
      ],
    },
  });
  await prisma.petMedicalRecord.deleteMany({
    where: { pet: { shelter: { email: { in: emails } } } },
  });
  await prisma.petForAdoption.deleteMany({
    where: { shelter: { email: { in: emails } } },
  });
  await prisma.notification.deleteMany({
    where: { user: { email: { in: emails } } },
  });
  await prisma.userBadge.deleteMany({
    where: { user: { email: { in: emails } } },
  });
  await prisma.strayReportUpdate.deleteMany({
    where: { report: { reporter: { email: { in: emails } } } },
  });
  await prisma.strayReport.deleteMany({
    where: { reporter: { email: { in: emails } } },
  });
  await prisma.fosterProfile.deleteMany({
    where: { user: { email: { in: emails } } },
  });
  await prisma.donationCampaign.deleteMany({
    where: { shelter: { email: { in: emails } } },
  });
  await prisma.petTag.deleteMany({
    where: { owner: { email: { in: emails } } },
  });
  await prisma.postComment.deleteMany({
    where: { author: { email: { in: emails } } },
  });
  await prisma.communityPost.deleteMany({
    where: { author: { email: { in: emails } } },
  });
  await prisma.petEvent.deleteMany({
    where: { organizer: { email: { in: emails } } },
  });

  await prisma.feedingStation.deleteMany({});
  await prisma.challenge.deleteMany({});
  await prisma.karmaReward.deleteMany({});
  await prisma.petSitter.deleteMany({});
}

/** Creates the demo users. Returns each account's id for later steps. */
async function ensureUsers(): Promise<Map<string, { id: string }>> {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const usersByEmail = new Map<string, { id: string }>();

  for (const account of demoAccounts) {
    const email = account.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Already seeded on an earlier run — keep the same id so the
      // references created by later steps stay valid.
      usersByEmail.set(email, { id: existing.id });
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email,
        // Pre-verified on purpose — the seeder never sends mail.
        emailVerifiedAt: new Date(),
        passwordHash,
        fullName: account.fullName,
        role: account.role,
        locale: account.locale,
        homeLatitude: account.homeLat,
        homeLongitude: account.homeLng,
        karmaPoints: account.karmaPoints,
        authProviders: {
          create: { provider: AuthProvider.LOCAL, providerSubjectId: `local:${email}` },
        },
      },
    });
    usersByEmail.set(email, { id: user.id });
  }

  return usersByEmail;
}

async function createStrayReports(
  usersByEmail: Map<string, { id: string }>,
): Promise<void> {
  for (const seed of strayReportSeeds) {
    const reporterId = usersByEmail.get(seed.reporterEmail)?.id;
    if (!reporterId) {
      throw new Error(`Stray report seeder: unknown reporter ${seed.reporterEmail}`);
    }

    const municipality = findClosestMunicipality(seed.latitude, seed.longitude);

    await prisma.strayReport.create({
      data: {
        reporterId,
        imageUrl: DEMO_IMAGE_URL,
        condition: seed.condition,
        description: seed.description,
        latitude: seed.latitude,
        longitude: seed.longitude,
        addressHint: seed.addressHint,
        status: seed.status,
        assignedMunicipality: municipality.name,
        assignedAt: seed.assignedAt,
        resolvedAt: seed.resolvedAt,
        expiresAt: seed.expiresAt,
        createdAt: seed.createdAt ?? daysAgo(1),
      },
    });
  }
}

function findPetId(
  petsByName: Map<string, { id: string }>,
  petName: string,
): string | undefined {
  const pet = petsByName.get(petName);
  return pet?.id;
}

async function createAdoptionData(
  usersByEmail: Map<string, { id: string }>,
): Promise<void> {
  const shelterId = usersByEmail.get('shelter@petmatch.demo')?.id;
  if (!shelterId) {
    throw new Error('Adoption seeder: no shelter user was created');
  }

  const petsByName = new Map<string, { id: string }>();
  for (const seed of shelterPetSeeds) {
    const pet = await prisma.petForAdoption.create({
      data: {
        shelterId,
        name: seed.name,
        species: seed.species,
        age: seed.age,
        size: seed.size,
        description: seed.description,
        imageUrl: DEMO_IMAGE_URL,
        status: seed.status,
        isUrgent: seed.isUrgent ?? false,
        isMicrochipped: seed.isMicrochipped ?? false,
        isVaccinated: seed.isVaccinated ?? false,
        isSterilized: seed.isSterilized ?? false,
        healthNotes: seed.healthNotes,
      },
    });
    petsByName.set(pet.name, { id: pet.id });
  }

  for (const seed of medicalRecordSeeds) {
    const petId = findPetId(petsByName, seed.petName);
    if (!petId) {
      throw new Error(`Medical record seeder: unknown pet ${seed.petName}`);
    }

    await prisma.petMedicalRecord.create({
      data: {
        petId,
        recordType: seed.recordType,
        title: seed.title,
        performedAt: seed.performedAt,
        nextDueDate: seed.nextDueDate,
        vetName: seed.vetName,
      },
    });
  }

  for (const seed of adoptionApplicationSeeds) {
    const petId = findPetId(petsByName, seed.petName);
    const applicantId = usersByEmail.get(seed.applicantEmail)?.id;
    if (!petId || !applicantId) {
      throw new Error(
        `Adoption application seeder: unknown pet or applicant for ${seed.petName}`,
      );
    }

    const app = await prisma.adoptionApplication.create({
      data: {
        petId,
        applicantId,
        shelterId,
        state: seed.state,
        motivation: seed.motivation,
        homeEnvironment: seed.homeEnvironment,
        questionnaire: seed.questionnaire,
        submittedAt: seed.submittedAt,
      },
    });

    if (seed.state === AdoptionStatus.HOME_CHECK_SCHEDULED) {
      await prisma.applicationHomeCheck.create({
        data: {
          applicationId: app.id,
          scheduledAt: daysFromNow(2),
          inspectorName: 'Δρ. Αργύρης Καρβουνά',
          inspectorNotes: 'Προγραμματισμένος έλεγχος χώρου και αυλής.',
        },
      });
    }
  }

  // Giannis marks Λυπάς Βίκος as a favorite — a different user can
  // express interest in the same pet while that application is pending.
  const favoritePetId = findPetId(petsByName, 'Λυπάς Βίκος');
  const favoriteUserId = usersByEmail.get('giannis@petmatch.demo')?.id;
  if (favoritePetId && favoriteUserId) {
    await prisma.favorite.create({
      data: { userId: favoriteUserId, petId: favoritePetId },
    });
  }
}

async function createSupportingData(
  usersByEmail: Map<string, { id: string }>,
): Promise<void> {
  for (const seed of demoNotificationSeeds) {
    const userId = usersByEmail.get(seed.userEmail)?.id;
    if (!userId) {
      throw new Error(`Notification seeder: unknown user ${seed.userEmail}`);
    }

    await prisma.notification.create({
      data: {
        userId,
        kind: seed.kind,
        title: seed.title,
        body: seed.body,
        data: {},
      },
    });
  }

  const volunteerId = usersByEmail.get('volunteer@petmatch.demo')?.id;
  if (!volunteerId) {
    throw new Error('Foster profile seeder: no volunteer user was created');
  }

  await prisma.fosterProfile.create({
    data: {
      userId: volunteerId,
      city: DEMO_FOSTER.city,
      maxPets: DEMO_FOSTER.maxPets,
      preferredSpecies: DEMO_FOSTER.preferredSpecies,
      hasGarden: DEMO_FOSTER.hasGarden,
      hasOtherPets: DEMO_FOSTER.hasOtherPets,
      notes: DEMO_FOSTER.notes,
    },
  });
}

async function createPlatformFeaturesData(
  usersByEmail: Map<string, { id: string }>,
): Promise<void> {
  // 1. Badges (upsert to ensure idempotent uniqueness)
  for (const b of demoBadges) {
    await prisma.badge.upsert({
      where: { code: b.code },
      update: {
        name: b.name,
        description: b.description,
        iconEmoji: b.iconEmoji,
        rarity: b.rarity,
        predicate: b.predicate,
      },
      create: {
        code: b.code,
        name: b.name,
        description: b.description,
        iconEmoji: b.iconEmoji,
        rarity: b.rarity,
        predicate: b.predicate,
      },
    });
  }

  // 2. Feeding Stations
  for (const station of demoFeedingStations) {
    await prisma.feedingStation.create({ data: station });
  }

  // 3. Donation Campaigns
  const shelterId = usersByEmail.get('shelter@petmatch.demo')?.id;
  if (shelterId) {
    for (const campaign of demoDonationCampaigns) {
      await prisma.donationCampaign.create({
        data: {
          shelterId,
          title: campaign.title,
          description: campaign.description,
          targetAmount: campaign.targetAmount,
          raisedAmount: campaign.raisedAmount,
          neededItems: campaign.neededItems,
          isEmergency: campaign.isEmergency,
        },
      });
    }
  }

  // 4. Challenges & Rewards
  for (const challenge of demoChallenges) {
    await prisma.challenge.create({ data: challenge });
  }

  for (const reward of demoRewards) {
    await prisma.karmaReward.create({ data: reward });
  }

  // 5. Community Posts & Comments
  for (const postSeed of demoCommunityPosts) {
    const authorId = usersByEmail.get(postSeed.authorEmail)?.id;
    if (!authorId) continue;
    const post = await prisma.communityPost.create({
      data: {
        authorId,
        title: postSeed.title,
        body: postSeed.body,
        category: postSeed.category,
      },
    });

    const commentAuthorId = usersByEmail.get(postSeed.comment.authorEmail)?.id;
    if (commentAuthorId) {
      await prisma.postComment.create({
        data: {
          postId: post.id,
          authorId: commentAuthorId,
          body: postSeed.comment.body,
        },
      });
    }
  }

  // 6. QR Pet Tag
  const tagOwnerId = usersByEmail.get(demoPetTag.ownerEmail)?.id;
  if (tagOwnerId) {
    await prisma.petTag.create({
      data: {
        ownerId: tagOwnerId,
        code: demoPetTag.code,
        petName: demoPetTag.petName,
        species: demoPetTag.species,
        contactPhone: demoPetTag.contactPhone,
        medicalNotes: demoPetTag.medicalNotes,
      },
    });
  }

  // 7. Pet Events & Sitters
  const organizerId = usersByEmail.get(demoPetEvent.organizerEmail)?.id;
  if (organizerId) {
    await prisma.petEvent.create({
      data: {
        organizerId,
        title: demoPetEvent.title,
        description: demoPetEvent.description,
        eventDate: demoPetEvent.eventDate,
        location: demoPetEvent.location,
        latitude: demoPetEvent.latitude,
        longitude: demoPetEvent.longitude,
      },
    });
  }

  for (const sitter of demoPetSitters) {
    await prisma.petSitter.create({ data: sitter });
  }

  // 8. Evaluate initial badges for demo users
  const giannisId = usersByEmail.get('giannis@petmatch.demo')?.id;
  if (giannisId) {
    await evaluateBadges(giannisId);
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('🌱 Seeding demo data…');

  await deleteDemoRows();
  const usersByEmail = await ensureUsers();
  await createStrayReports(usersByEmail);
  await createAdoptionData(usersByEmail);
  await createSupportingData(usersByEmail);
  await createPlatformFeaturesData(usersByEmail);

  console.log('\n🐾 Seed complete — demo accounts (password: Demo12345!):');
  for (const account of demoAccounts) {
    console.log(`   - ${account.email.padEnd(32)} ${account.fullName}`);
  }
}

main().catch((error: unknown) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
