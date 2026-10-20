import type { Request, Response, NextFunction } from 'express';
import { platformFeaturesService } from '@/services/platform-features.service';

export const platformFeaturesController = {
  async smartMatchmaker(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await platformFeaturesService.getMatchmakerQuizResult(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async createPetTag(req: Request, res: Response, next: NextFunction) {
    try {
      const tag = await platformFeaturesService.createPetTag(req.user!.sub, req.body);
      res.status(201).json({ success: true, data: tag });
    } catch (err) {
      next(err);
    }
  },

  async lookupPetTag(req: Request, res: Response, next: NextFunction) {
    try {
      const tag = await platformFeaturesService.lookupPetTag(req.params.code);
      res.json({ success: true, data: tag });
    } catch (err) {
      next(err);
    }
  },

  async listFeedingStations(_req: Request, res: Response, next: NextFunction) {
    try {
      const stations = await platformFeaturesService.listFeedingStations();
      res.json({ success: true, data: stations });
    } catch (err) {
      next(err);
    }
  },

  async refillFeedingStation(req: Request, res: Response, next: NextFunction) {
    try {
      const station = await platformFeaturesService.refillFeedingStation(req.params.id, req.body.notes);
      res.json({ success: true, data: station });
    } catch (err) {
      next(err);
    }
  },

  async listPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const posts = await platformFeaturesService.listCommunityPosts(req.query.category as string);
      res.json({ success: true, data: posts });
    } catch (err) {
      next(err);
    }
  },

  async createPost(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await platformFeaturesService.createCommunityPost(req.user!.sub, req.body);
      res.status(201).json({ success: true, data: post });
    } catch (err) {
      next(err);
    }
  },

  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const comment = await platformFeaturesService.addPostComment(req.params.postId, req.user!.sub, req.body.body);
      res.status(201).json({ success: true, data: comment });
    } catch (err) {
      next(err);
    }
  },

  async sponsorPet(req: Request, res: Response, next: NextFunction) {
    try {
      const sponsorship = await platformFeaturesService.sponsorPet(req.user!.sub, req.params.petId, req.body.amount || 15);
      res.status(201).json({ success: true, data: sponsorship });
    } catch (err) {
      next(err);
    }
  },

  async listEvents(_req: Request, res: Response, next: NextFunction) {
    try {
      const events = await platformFeaturesService.listEvents();
      res.json({ success: true, data: events });
    } catch (err) {
      next(err);
    }
  },

  async listSitters(req: Request, res: Response, next: NextFunction) {
    try {
      const sitters = await platformFeaturesService.listSitters(req.query.city as string);
      res.json({ success: true, data: sitters });
    } catch (err) {
      next(err);
    }
  },

  async reportSighting(req: Request, res: Response, next: NextFunction) {
    try {
      const sighting = await platformFeaturesService.reportSighting(req.params.lostPetId, req.user!.sub, req.body);
      res.status(201).json({ success: true, data: sighting });
    } catch (err) {
      next(err);
    }
  },

  async getSightings(req: Request, res: Response, next: NextFunction) {
    try {
      const sightings = await platformFeaturesService.getSightings(req.params.lostPetId);
      res.json({ success: true, data: sightings });
    } catch (err) {
      next(err);
    }
  },

  async listChallenges(_req: Request, res: Response, next: NextFunction) {
    try {
      const challenges = await platformFeaturesService.listChallenges();
      res.json({ success: true, data: challenges });
    } catch (err) {
      next(err);
    }
  },

  async listRewards(_req: Request, res: Response, next: NextFunction) {
    try {
      const rewards = await platformFeaturesService.listRewards();
      res.json({ success: true, data: rewards });
    } catch (err) {
      next(err);
    }
  },

  async claimReward(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await platformFeaturesService.claimReward(req.user!.sub, req.params.rewardId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async listShelterInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await platformFeaturesService.listShelterInventory(req.user!.sub);
      res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  },

  async addShelterInventoryItem(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await platformFeaturesService.addShelterInventoryItem(req.user!.sub, req.body);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  },

  async listVolunteerShifts(_req: Request, res: Response, next: NextFunction) {
    try {
      const shifts = await platformFeaturesService.listVolunteerShifts();
      res.json({ success: true, data: shifts });
    } catch (err) {
      next(err);
    }
  },

  async createVolunteerShift(req: Request, res: Response, next: NextFunction) {
    try {
      const shift = await platformFeaturesService.createVolunteerShift(req.user!.sub, req.body);
      res.status(201).json({ success: true, data: shift });
    } catch (err) {
      next(err);
    }
  },

  async listPetPlaydates(_req: Request, res: Response, next: NextFunction) {
    try {
      const playdates = await platformFeaturesService.listPetPlaydates();
      res.json({ success: true, data: playdates });
    } catch (err) {
      next(err);
    }
  },

  async createPetPlaydate(req: Request, res: Response, next: NextFunction) {
    try {
      const playdate = await platformFeaturesService.createPetPlaydate(req.user!.sub, req.body);
      res.status(201).json({ success: true, data: playdate });
    } catch (err) {
      next(err);
    }
  },

  async addPetWeightLog(req: Request, res: Response, next: NextFunction) {
    try {
      const log = await platformFeaturesService.addPetWeightLog(req.params.petTagId, req.body.weightKg);
      res.status(201).json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  },

  async getPetWeightLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await platformFeaturesService.getPetWeightLogs(req.params.petTagId);
      res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  },

  async addFleaReminder(req: Request, res: Response, next: NextFunction) {
    try {
      const reminder = await platformFeaturesService.addFleaReminder(req.params.petTagId, req.body);
      res.status(201).json({ success: true, data: reminder });
    } catch (err) {
      next(err);
    }
  },

  async listFleaReminders(req: Request, res: Response, next: NextFunction) {
    try {
      const reminders = await platformFeaturesService.listFleaReminders(req.params.petTagId);
      res.json({ success: true, data: reminders });
    } catch (err) {
      next(err);
    }
  },

  async signAdoptionContract(req: Request, res: Response, next: NextFunction) {
    try {
      const contract = await platformFeaturesService.signAdoptionContract(req.params.applicationId, req.body.signedName);
      res.status(201).json({ success: true, data: contract });
    } catch (err) {
      next(err);
    }
  },

  async getImpactAnalytics(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await platformFeaturesService.getImpactAnalytics();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  },
};
