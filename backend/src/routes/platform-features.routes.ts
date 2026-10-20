import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { platformFeaturesController } from '@/controllers/platform-features.controller';

export const platformFeaturesRouter = Router();

// AI Matchmaker
platformFeaturesRouter.post('/matchmaker/quiz', asyncHandler(platformFeaturesController.smartMatchmaker));

// QR Pet Tag
platformFeaturesRouter.post('/pet-tags', requireAuth, asyncHandler(platformFeaturesController.createPetTag));
platformFeaturesRouter.get('/pet-tags/:code', asyncHandler(platformFeaturesController.lookupPetTag));

// Feeding Stations
platformFeaturesRouter.get('/feeding-stations', asyncHandler(platformFeaturesController.listFeedingStations));
platformFeaturesRouter.post(
  '/feeding-stations/:id/refill',
  requireAuth,
  asyncHandler(platformFeaturesController.refillFeedingStation),
);

// Community Forum
platformFeaturesRouter.get('/community/posts', asyncHandler(platformFeaturesController.listPosts));
platformFeaturesRouter.post('/community/posts', requireAuth, asyncHandler(platformFeaturesController.createPost));
platformFeaturesRouter.post(
  '/community/posts/:postId/comments',
  requireAuth,
  asyncHandler(platformFeaturesController.addComment),
);

// Virtual Adoption
platformFeaturesRouter.post('/pets/:petId/sponsor', requireAuth, asyncHandler(platformFeaturesController.sponsorPet));

// Events & Sitters
platformFeaturesRouter.get('/events', asyncHandler(platformFeaturesController.listEvents));
platformFeaturesRouter.get('/sitters', asyncHandler(platformFeaturesController.listSitters));

// Lost Pet Sightings
platformFeaturesRouter.post(
  '/lost-pets/:lostPetId/sightings',
  requireAuth,
  asyncHandler(platformFeaturesController.reportSighting),
);
platformFeaturesRouter.get('/lost-pets/:lostPetId/sightings', asyncHandler(platformFeaturesController.getSightings));

// Gamification Challenges & Marketplace
platformFeaturesRouter.get('/challenges', asyncHandler(platformFeaturesController.listChallenges));
platformFeaturesRouter.get('/rewards', asyncHandler(platformFeaturesController.listRewards));
platformFeaturesRouter.post('/rewards/:rewardId/claim', requireAuth, asyncHandler(platformFeaturesController.claimReward));

// Shelter Inventory Logistics
platformFeaturesRouter.get('/shelter/inventory', requireAuth, asyncHandler(platformFeaturesController.listShelterInventory));
platformFeaturesRouter.post('/shelter/inventory', requireAuth, asyncHandler(platformFeaturesController.addShelterInventoryItem));

// Volunteer Shifts
platformFeaturesRouter.get('/volunteer/shifts', asyncHandler(platformFeaturesController.listVolunteerShifts));
platformFeaturesRouter.post('/volunteer/shifts', requireAuth, asyncHandler(platformFeaturesController.createVolunteerShift));

// Pet Playdates
platformFeaturesRouter.get('/playdates', asyncHandler(platformFeaturesController.listPetPlaydates));
platformFeaturesRouter.post('/playdates', requireAuth, asyncHandler(platformFeaturesController.createPetPlaydate));

// Pet Weight & Flea Reminders
platformFeaturesRouter.post('/pet-tags/:petTagId/weight', requireAuth, asyncHandler(platformFeaturesController.addPetWeightLog));
platformFeaturesRouter.get('/pet-tags/:petTagId/weight', asyncHandler(platformFeaturesController.getPetWeightLogs));
platformFeaturesRouter.post('/pet-tags/:petTagId/flea-reminders', requireAuth, asyncHandler(platformFeaturesController.addFleaReminder));
platformFeaturesRouter.get('/pet-tags/:petTagId/flea-reminders', asyncHandler(platformFeaturesController.listFleaReminders));

// Digital Adoption Contract & Impact Analytics
platformFeaturesRouter.post('/adoption-applications/:applicationId/contract', requireAuth, asyncHandler(platformFeaturesController.signAdoptionContract));
platformFeaturesRouter.get('/analytics/impact', asyncHandler(platformFeaturesController.getImpactAnalytics));
