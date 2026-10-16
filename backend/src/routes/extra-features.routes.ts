import { Router } from 'express';
import { requireAuth, requireRole } from '@/middlewares/auth';
import { asyncHandler } from '@/middlewares/asyncHandler';
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
extraFeaturesRouter.get('/admin/pets', requireAuth, requireRole('SHELTER_ADMIN', 'PLATFORM_ADMIN'), asyncHandler(adminController.getPets));
extraFeaturesRouter.post('/admin/pets', requireAuth, requireRole('SHELTER_ADMIN', 'PLATFORM_ADMIN'), asyncHandler(adminController.createPet));
extraFeaturesRouter.patch('/admin/pets/:id', requireAuth, requireRole('SHELTER_ADMIN', 'PLATFORM_ADMIN'), asyncHandler(adminController.updatePet));
extraFeaturesRouter.delete('/admin/pets/:id', requireAuth, requireRole('SHELTER_ADMIN', 'PLATFORM_ADMIN'), asyncHandler(adminController.deletePet));

extraFeaturesRouter.get('/admin/reports', requireAuth, requireRole('MUNICIPAL_WORKER', 'PLATFORM_ADMIN'), asyncHandler(adminController.getReports));
extraFeaturesRouter.patch('/admin/reports/:id', requireAuth, requireRole('MUNICIPAL_WORKER', 'PLATFORM_ADMIN'), asyncHandler(adminController.updateReport));

// Foster care
extraFeaturesRouter.get('/foster/profile', requireAuth, asyncHandler(fosterController.getMyProfile));
extraFeaturesRouter.post('/foster/profile', requireAuth, asyncHandler(fosterController.updateMyProfile));
extraFeaturesRouter.get('/foster/search', requireAuth, asyncHandler(fosterController.searchProfiles));

// Medical records
extraFeaturesRouter.get('/pets/:petId/medical-records', requireAuth, asyncHandler(medicalRecordsController.listRecords));
extraFeaturesRouter.post('/pets/:petId/medical-records', requireAuth, asyncHandler(medicalRecordsController.addRecord));
extraFeaturesRouter.delete('/medical-records/:id', requireAuth, asyncHandler(medicalRecordsController.deleteRecord));

// Chat
extraFeaturesRouter.get('/chat/rooms', requireAuth, asyncHandler(chatController.listRooms));
extraFeaturesRouter.post('/chat/rooms', requireAuth, asyncHandler(chatController.createRoom));
extraFeaturesRouter.get('/chat/rooms/:roomId/messages', requireAuth, asyncHandler(chatController.getMessages));
extraFeaturesRouter.post('/chat/rooms/:roomId/messages', requireAuth, asyncHandler(chatController.sendMessage));

// Donations
extraFeaturesRouter.get('/donations', donationsController.listCampaigns);
extraFeaturesRouter.post('/donations', requireAuth, asyncHandler(donationsController.createCampaign));
extraFeaturesRouter.post('/donations/:id/donate', requireAuth, asyncHandler(donationsController.donate));

// Apple OAuth
extraFeaturesRouter.post('/auth/apple', requireAuth, asyncHandler(appleOAuthController.appleAuth));
