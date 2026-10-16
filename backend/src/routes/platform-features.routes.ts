import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth';
import { platformFeaturesController } from '@/controllers/platform-features.controller';

export const platformFeaturesRouter = Router();

// AI Matchmaker
platformFeaturesRouter.post('/matchmaker/quiz', platformFeaturesController.smartMatchmaker);

// QR Pet Tag
platformFeaturesRouter.post('/pet-tags', requireAuth, platformFeaturesController.createPetTag);
platformFeaturesRouter.get('/pet-tags/:code', platformFeaturesController.lookupPetTag);

// Feeding Stations
platformFeaturesRouter.get('/feeding-stations', platformFeaturesController.listFeedingStations);
platformFeaturesRouter.post('/feeding-stations/:id/refill', requireAuth, platformFeaturesController.refillFeedingStation);

// Community Forum
platformFeaturesRouter.get('/community/posts', platformFeaturesController.listPosts);
platformFeaturesRouter.post('/community/posts', requireAuth, platformFeaturesController.createPost);
platformFeaturesRouter.post('/community/posts/:postId/comments', requireAuth, platformFeaturesController.addComment);

// Virtual Adoption
platformFeaturesRouter.post('/pets/:petId/sponsor', requireAuth, platformFeaturesController.sponsorPet);

// Events & Sitters
platformFeaturesRouter.get('/events', platformFeaturesController.listEvents);
platformFeaturesRouter.get('/sitters', platformFeaturesController.listSitters);

// Lost Pet Sightings
platformFeaturesRouter.post('/lost-pets/:lostPetId/sightings', requireAuth, platformFeaturesController.reportSighting);
platformFeaturesRouter.get('/lost-pets/:lostPetId/sightings', platformFeaturesController.getSightings);

// Gamification Challenges & Marketplace
platformFeaturesRouter.get('/challenges', platformFeaturesController.listChallenges);
platformFeaturesRouter.get('/rewards', platformFeaturesController.listRewards);
