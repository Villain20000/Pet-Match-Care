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
import { hashPassword } from '@/utils/password';
import { findClosestMunicipality } from '@/services/municipality.service';
import { prisma } from '@/config/prisma';
import { env } from '@/config/env';
import {
  AuthProvider,
  AdoptionStatus,
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
  expiresAt: Date;
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

interface DemoFosterProfileSeed {
  city: string;
  maxPets: number;
  preferredSpecies: Species;
  hasGarden: boolean;
  hasOtherPets: boolean;
  notes?: string;
}

const demoFosterProfileSeed: DemoFosterProfileSeed = {
  city: 'Θεσσαλονίκη',
  maxPets: 2,
  preferredSpecies: Species.DOG,
  hasGarden: true,
  hasOtherPets: false,
  notes: 'Έχει μεγάλη αυλή και πρόσβαση σε ηλικωμένο οικόπεδο.',
};

/** Constants shared by every seed step. */
const DEMO_FOSTER = {
  city: 'Θεσσαλονίκη',
  maxPets: 2,
  preferredSpecies: Species.DOG,
  hasGarden: true,
  hasOtherPets: false,
  notes: 'Έχει μεγάλη αυλή και πρόσβαση σε ηλικωμένο οικόπεδο.',
};

// ---------------------------------------------------------------------------
// Seed steps
// ---------------------------------------------------------------------------

/** Children first — `AdoptionApplication` has no ON DELETE action on its
 * `pet` / `applicant` relations, so those rows must be removed before the
 * pets or the applicants themselves can go. The audit + home-check rows
 * cascade along with their application. */
async function deleteDemoRows() {
  await prisma.adoptionApplication.deleteMany({
    where: { applicant: { email: { in: demoEmailList() } } },
  });
  await prisma.petForAdoption.deleteMany({
    where: { shelter: { email: { in: demoEmailList() } } },
  });
  // The user rows themselves survive (their ids stay stable across runs),
  // but every row the seeder owns is removed explicitly.
  await prisma.notification.deleteMany({
    where: { user: { email: { in: demoEmailList() } } },
  });
  await prisma.userBadge.deleteMany({
    where: { user: { email: { in: demoEmailList() } } },
  });
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

    await prisma.adoptionApplication.create({
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

  console.log('\n🐾 Seed complete — demo accounts (password: Demo12345!):');
  for (const account of demoAccounts) {
    console.log(`   - ${account.email.padEnd(32)} ${account.fullName}`);
  }
}

main().catch((error: unknown) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
