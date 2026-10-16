import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { findClosestMunicipality, listMunicipalities } from '@/services/municipality.service';

export const municipalitiesRouter = Router();

municipalitiesRouter.get('/', asyncHandler((_req, res) => {
  res.json({ municipalities: listMunicipalities() });
}));

municipalitiesRouter.get(
  '/closest',
  asyncHandler((req, res) => {
    const lat = z.coerce.number().min(-90).max(90).parse(req.query.lat);
    const lng = z.coerce.number().min(-180).max(180).parse(req.query.lng);
    return res.json(findClosestMunicipality(lat, lng));
  }),
);
