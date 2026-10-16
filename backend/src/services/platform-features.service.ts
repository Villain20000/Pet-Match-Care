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
  async createPetTag(ownerId: string, data: { petName: string; contactPhone: string; medicalNotes?: string }) {
    const code = 'TAG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    return prisma.petTag.create({
      data: {
        code,
        ownerId,
        petName: data.petName,
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
};
