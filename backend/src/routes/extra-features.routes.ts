import { Router } from 'express';
import { requireAuth, requireRole } from '@/middlewares/auth';
import {
  adminController,
  fosterController,
  medicalRecordsController,
  chatController,
  donationsController,
  appleOAuthController,
} from '@/controllers/extra-features.controller';

export const extraFeaturesRouter = Router();

// Admin / Shelter / Municipal
extraFeaturesRouter.get('/admin/pets', requireAuth, requireRole('SHELTER_ADMIN', 'PLATFORM_ADMIN'), adminController.getPets);
extraFeaturesRouter.post('/admin/pets', requireAuth, requireRole('SHELTER_ADMIN', 'PLATFORM_ADMIN'), adminController.createPet);
extraFeaturesRouter.patch('/admin/pets/:id', requireAuth, requireRole('SHELTER_ADMIN', 'PLATFORM_ADMIN'), adminController.updatePet);
extraFeaturesRouter.delete('/admin/pets/:id', requireAuth, requireRole('SHELTER_ADMIN', 'PLATFORM_ADMIN'), adminController.deletePet);

extraFeaturesRouter.get('/admin/reports', requireAuth, requireRole('MUNICIPAL_WORKER', 'PLATFORM_ADMIN'), adminController.getReports);
extraFeaturesRouter.patch('/admin/reports/:id', requireAuth, requireRole('MUNICIPAL_WORKER', 'PLATFORM_ADMIN'), adminController.updateReport);

// Foster care
extraFeaturesRouter.get('/foster/profile', requireAuth, fosterController.getMyProfile);
extraFeaturesRouter.post('/foster/profile', requireAuth, fosterController.updateMyProfile);
extraFeaturesRouter.get('/foster/search', requireAuth, fosterController.searchProfiles);

// Medical records
extraFeaturesRouter.get('/pets/:petId/medical-records', requireAuth, medicalRecordsController.listRecords);
extraFeaturesRouter.post('/pets/:petId/medical-records', requireAuth, medicalRecordsController.addRecord);
extraFeaturesRouter.delete('/medical-records/:id', requireAuth, medicalRecordsController.deleteRecord);

// Chat
extraFeaturesRouter.get('/chat/rooms', requireAuth, chatController.listRooms);
extraFeaturesRouter.post('/chat/rooms', requireAuth, chatController.createRoom);
extraFeaturesRouter.get('/chat/rooms/:roomId/messages', requireAuth, chatController.getMessages);
extraFeaturesRouter.post('/chat/rooms/:roomId/messages', requireAuth, chatController.sendMessage);

// Donations
extraFeaturesRouter.get('/donations', donationsController.listCampaigns);
extraFeaturesRouter.post('/donations', requireAuth, donationsController.createCampaign);
extraFeaturesRouter.post('/donations/:id/donate', requireAuth, donationsController.donate);

// Apple OAuth
extraFeaturesRouter.post('/auth/apple', appleOAuthController.appleAuth);
