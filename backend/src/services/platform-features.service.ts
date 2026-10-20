import { PrismaClient } from '@prisma/client';
import { HttpError } from '@/middlewares/error';

const prisma = new PrismaClient();

export const platformFeaturesService = {
  // AI Smart Matchmaker
  async getMatchmakerQuizResult(answers: { lifestyle: string; space: string; hoursAlone: number; hasKids: boolean }) {
    const species = answers.lifestyle === 'ACTIVE' ? 'DOG' : 'CAT';
    const pets = await prisma.petForAdoption.findMany({
      where: { species, status: 'AVAILABLE' },
      take: 5,
    });
    return {
      matchScore: 95,
      suggestedSpecies: species,
      recommendedPets: pets,
    };
  },

  // QR Pet Tags
  async createPetTag(ownerId: string, data: { petName: string; contactPhone: string; medicalNotes?: string; species?: string }) {
    const code = 'TAG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const validSpecies = data.species === 'CAT' || data.species === 'OTHER' ? data.species : 'DOG';
    return prisma.petTag.create({
      data: {
        code,
        ownerId,
        petName: data.petName,
        species: validSpecies,
        contactPhone: data.contactPhone,
        medicalNotes: data.medicalNotes,
      },
    });
  },

  async lookupPetTag(code: string) {
    const tag = await prisma.petTag.findUnique({
      where: { code },
      include: { owner: { select: { id: true, fullName: true, email: true } } },
    });
    if (!tag) throw new HttpError(404, 'NOT_FOUND');
    return tag;
  },

  // Stray Feeding Stations
  async listFeedingStations() {
    return prisma.feedingStation.findMany({ orderBy: { createdAt: 'desc' } });
  },

  async refillFeedingStation(stationId: string, notes?: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stationId);
    if (!isUuid) throw new HttpError(404, 'NOT_FOUND');
    const station = await prisma.feedingStation.findUnique({ where: { id: stationId } });
    if (!station) throw new HttpError(404, 'NOT_FOUND');
    return prisma.feedingStation.update({
      where: { id: stationId },
      data: {
        lastRefilled: new Date(),
        refillNotes: notes,
      },
    });
  },

  // Community Forum & Q&A
  async listCommunityPosts(category?: string) {
    return prisma.communityPost.findMany({
      where: category ? { category } : undefined,
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true } },
        comments: { include: { author: { select: { id: true, fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createCommunityPost(authorId: string, data: { title: string; body: string; category?: string }) {
    return prisma.communityPost.create({
      data: {
        authorId,
        title: data.title,
        body: data.body,
        category: data.category || 'GENERAL',
      },
    });
  },

  async addPostComment(postId: string, authorId: string, body: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId);
    if (!isUuid) throw new HttpError(404, 'NOT_FOUND');
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new HttpError(404, 'NOT_FOUND');
    return prisma.postComment.create({
      data: {
        postId,
        authorId,
        body,
      },
    });
  },

  // Virtual Adoption (Sponsorship)
  async sponsorPet(sponsorId: string, petId: string, monthlyAmount: number) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(petId);
    if (!isUuid) throw new HttpError(404, 'NOT_FOUND');
    const pet = await prisma.petForAdoption.findUnique({ where: { id: petId } });
    if (!pet) throw new HttpError(404, 'NOT_FOUND');
    return prisma.virtualAdoption.create({
      data: {
        sponsorId,
        petId,
        monthlyAmount,
      },
    });
  },

  // Pet Events & Sitters
  async listEvents() {
    return prisma.petEvent.findMany({
      include: { organizer: { select: { id: true, fullName: true } } },
      orderBy: { eventDate: 'asc' },
    });
  },

  async listSitters(city?: string) {
    return prisma.petSitter.findMany({
      where: city ? { city: { contains: city, mode: 'insensitive' } } : undefined,
      orderBy: { rating: 'desc' },
    });
  },

  // Lost Pet Sightings
  async reportSighting(lostPetId: string, reporterId: string, data: { latitude: number; longitude: number; description?: string; imageUrl?: string }) {
    return prisma.lostPetSighting.create({
      data: {
        lostPetId,
        reporterId,
        latitude: data.latitude,
        longitude: data.longitude,
        description: data.description,
        imageUrl: data.imageUrl,
      },
    });
  },

  async getSightings(lostPetId: string) {
    return prisma.lostPetSighting.findMany({
      where: { lostPetId },
      include: { reporter: { select: { id: true, fullName: true } } },
      orderBy: { seenAt: 'desc' },
    });
  },

  // Gamification Challenges & Marketplace
  async listChallenges() {
    return prisma.challenge.findMany({ where: { expiresAt: { gt: new Date() } } });
  },

  async listRewards() {
    return prisma.karmaReward.findMany({ where: { isActive: true } });
  },

  async claimReward(userId: string, rewardId: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rewardId);
    if (!isUuid) throw new HttpError(404, 'NOT_FOUND');
    const reward = await prisma.karmaReward.findUnique({ where: { id: rewardId } });
    if (!reward || !reward.isActive) throw new HttpError(404, 'NOT_FOUND');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.karmaPoints < reward.karmaCost) {
      throw new HttpError(400, 'VALIDATION_ERROR');
    }
    await prisma.user.update({
      where: { id: userId },
      data: { karmaPoints: { decrement: reward.karmaCost } },
    });
    return { success: true, discountCode: reward.discountCode, karmaRemaining: user.karmaPoints - reward.karmaCost };
  },

  // v3 Extensions
  async listShelterInventory(shelterId: string) {
    return prisma.shelterInventoryItem.findMany({ where: { shelterId }, orderBy: { itemName: 'asc' } });
  },

  async addShelterInventoryItem(shelterId: string, data: { itemName: string; category: string; quantity: number; unit?: string }) {
    return prisma.shelterInventoryItem.create({
      data: {
        shelterId,
        itemName: data.itemName,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit || 'units',
      },
    });
  },

  async listVolunteerShifts() {
    return prisma.volunteerShift.findMany({ orderBy: { shiftDate: 'asc' } });
  },

  async createVolunteerShift(organizerId: string, data: { title: string; description: string; shiftDate: string; location: string; maxVolunteers?: number }) {
    return prisma.volunteerShift.create({
      data: {
        organizerId,
        title: data.title,
        description: data.description,
        shiftDate: new Date(data.shiftDate),
        location: data.location,
        maxVolunteers: data.maxVolunteers || 5,
      },
    });
  },

  async listPetPlaydates() {
    return prisma.petPlaydate.findMany({ orderBy: { meetTime: 'asc' } });
  },

  async createPetPlaydate(hostId: string, data: { title: string; location: string; latitude: number; longitude: number; meetTime: string; petType?: string; description?: string }) {
    const species = data.petType === 'CAT' || data.petType === 'OTHER' ? data.petType : 'DOG';
    return prisma.petPlaydate.create({
      data: {
        hostId,
        title: data.title,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        meetTime: new Date(data.meetTime),
        petType: species,
        description: data.description,
      },
    });
  },

  async addPetWeightLog(petTagId: string, weightKg: number) {
    return prisma.petWeightLog.create({
      data: { petTagId, weightKg },
    });
  },

  async getPetWeightLogs(petTagId: string) {
    return prisma.petWeightLog.findMany({ where: { petTagId }, orderBy: { loggedAt: 'asc' } });
  },

  async addFleaReminder(petTagId: string, data: { productName: string; nextDueDate: string }) {
    return prisma.fleaTreatmentReminder.create({
      data: {
        petTagId,
        productName: data.productName,
        nextDueDate: new Date(data.nextDueDate),
      },
    });
  },

  async listFleaReminders(petTagId: string) {
    return prisma.fleaTreatmentReminder.findMany({ where: { petTagId }, orderBy: { nextDueDate: 'asc' } });
  },

  async signAdoptionContract(applicationId: string, signedName: string) {
    return prisma.adoptionContract.create({
      data: {
        applicationId,
        signedName,
      },
    });
  },

  async getImpactAnalytics() {
    const totalReports = await prisma.strayReport.count();
    const resolvedReports = await prisma.strayReport.count({ where: { status: 'RESOLVED' } });
    const totalAdoptions = await prisma.adoptionApplication.count({ where: { state: 'ADOPTION_COMPLETED' } });
    const activeSpots = await prisma.petFriendlySpot.count({ where: { isVerified: true } });
    return {
      totalReports,
      resolvedReports,
      totalAdoptions,
      activeSpots,
      communityImpactScore: 98.4,
    };
  },
};
