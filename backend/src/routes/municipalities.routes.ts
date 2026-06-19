import { Router } from 'express';
import { z } from 'zod';
import { findClosestMunicipality, listMunicipalities } from '@/services/municipality.service';

export const municipalitiesRouter = Router();

municipalitiesRouter.get('/', (_req, res) => {
  res.json({ municipalities: listMunicipalities() });
});

municipalitiesRouter.get('/closest', (req, res) => {
  const lat = z.coerce.number().min(-90).max(90).parse(req.query.lat);
  const lng = z.coerce.number().min(-180).max(180).parse(req.query.lng);
  res.json(findClosestMunicipality(lat, lng));
});
