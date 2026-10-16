import type { Request, Response, NextFunction } from 'express';
import { adminPetsService, adminReportsService } from '@/services/admin.service';
import { fosterService } from '@/services/foster.service';
import { medicalRecordsService } from '@/services/medical-records.service';
import { chatService } from '@/services/chat.service';
import { donationsService } from '@/services/donations.service';
import { processAppleToken } from '@/services/oauth.service';
import { loginOrRegisterOAuth } from '@/services/auth.service';

export const adminController = {
  async getPets(req: Request, res: Response, next: NextFunction) {
    try {
      const pets = await adminPetsService.listShelterPets(req.user!.sub);
      res.json({ success: true, data: pets });
    } catch (err) {
      next(err);
    }
  },

  async createPet(req: Request, res: Response, next: NextFunction) {
    try {
      const pet = await adminPetsService.createPet(req.user!.sub, req.body);
      res.status(201).json({ success: true, data: pet });
    } catch (err) {
      next(err);
    }
  },

  async updatePet(req: Request, res: Response, next: NextFunction) {
    try {
      const pet = await adminPetsService.updatePet(req.user!.sub, req.params.id, req.body);
      res.json({ success: true, data: pet });
    } catch (err) {
      next(err);
    }
  },

  async deletePet(req: Request, res: Response, next: NextFunction) {
    try {
      await adminPetsService.deletePet(req.user!.sub, req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async getReports(req: Request, res: Response, next: NextFunction) {
    try {
      const municipality = (req.query.municipality as string) || 'Αθήνα';
      const reports = await adminReportsService.listMunicipalReports(municipality);
      res.json({ success: true, data: reports });
    } catch (err) {
      next(err);
    }
  },

  async updateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, body, photoUrl } = req.body;
      const update = await adminReportsService.updateReportStatus(req.user!.sub, req.params.id, status, body, photoUrl);
      res.json({ success: true, data: update });
    } catch (err) {
      next(err);
    }
  },
};

export const fosterController = {
  async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await fosterService.getProfile(req.user!.sub);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  },

  async updateMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await fosterService.upsertProfile(req.user!.sub, req.body);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  },

  async searchProfiles(req: Request, res: Response, next: NextFunction) {
    try {
      const { city, species } = req.query;
      const profiles = await fosterService.searchProfiles({
        city: city as string,
        species: typeof species === 'string' ? (species as 'DOG' | 'CAT' | 'OTHER') : undefined,
      });
      res.json({ success: true, data: profiles });
    } catch (err) {
      next(err);
    }
  },
};

export const medicalRecordsController = {
  async listRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const records = await medicalRecordsService.listForPet(req.params.petId);
      res.json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  },

  async addRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await medicalRecordsService.addRecord(req.user!.sub, req.params.petId, req.body);
      res.status(201).json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  },

  async deleteRecord(req: Request, res: Response, next: NextFunction) {
    try {
      await medicalRecordsService.deleteRecord(req.user!.sub, req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};

export const chatController = {
  async listRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const rooms = await chatService.listUserRooms(req.user!.sub);
      res.json({ success: true, data: rooms });
    } catch (err) {
      next(err);
    }
  },

  async createRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const { targetUserId, topic } = req.body;
      const room = await chatService.createOrGetRoom(req.user!.sub, targetUserId, topic);
      res.json({ success: true, data: room });
    } catch (err) {
      next(err);
    }
  },

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const messages = await chatService.getMessages(req.user!.sub, req.params.roomId);
      res.json({ success: true, data: messages });
    } catch (err) {
      next(err);
    }
  },

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const msg = await chatService.sendMessage(req.user!.sub, req.params.roomId, req.body.text);
      res.status(201).json({ success: true, data: msg });
    } catch (err) {
      next(err);
    }
  },
};

export const donationsController = {
  async listCampaigns(_req: Request, res: Response, next: NextFunction) {
    try {
      const campaigns = await donationsService.listCampaigns();
      res.json({ success: true, data: campaigns });
    } catch (err) {
      next(err);
    }
  },

  async createCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await donationsService.createCampaign(req.user!.sub, req.body);
      res.status(201).json({ success: true, data: campaign });
    } catch (err) {
      next(err);
    }
  },

  async donate(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await donationsService.recordDonation(req.params.id, req.body.amount || 10);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
};

export const appleOAuthController = {
  async appleAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken, userPayload } = req.body;
      const profile = await processAppleToken(idToken, userPayload);
      const authData = await loginOrRegisterOAuth('APPLE', profile.sub, profile.email, profile.name);
      res.json({ success: true, data: authData });
    } catch (err) {
      next(err);
    }
  },
};
