import { Request, Response } from 'express';
import { z } from 'zod';
import { Species } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { throwHttp } from "@/middlewares/error";
import { findMatches, notifyMatches } from '@/services/lost-pets.service';
import { evaluateBadges } from '@/services/badges.engine';

const CreateSchema = z.object({
  name: z.string().min(2).max(60),
  species: z.nativeEnum(Species),
  breed: z.string().max(80).optional(),
  microchipId: z.string().max(40).optional(),
  description: z.string().min(5).max(2000),
  imageUrl: z.string().url(),
  lastSeenAt: z.string().datetime().or(z.string()),
  lastSeenLat: z.coerce.number().min(-90).max(90),
  lastSeenLng: z.coerce.number().min(-180).max(180),
  addressHint: z.string().max(200).optional(),
  reward: z.string().max(120).optional(),
});

export const createLostPet = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const input = CreateSchema.parse(req.body);
  const pet = await prisma.lostPet.create({
    data: {
      ownerId: req.user!.sub,
      name: input.name,
      species: input.species,
      breed: input.breed ?? null,
      microchipId: input.microchipId ?? null,
      description: input.description,
      imageUrl: input.imageUrl,
      lastSeenAt: new Date(input.lastSeenAt),
      lastSeenLat: input.lastSeenLat,
      lastSeenLng: input.lastSeenLng,
      addressHint: input.addressHint ?? null,
      reward: input.reward ?? null,
    },
  });
  await evaluateBadges(req.user!.sub);
  return res.status(201).json({ success: true, pet });
};

export const listLostPets = async (req: Request, res: Response) => {
  const species = req.query.species ? z.nativeEnum(Species).parse(req.query.species) : undefined;
  const pets = await prisma.lostPet.findMany({
    where: { species, isFound: false },
    orderBy: { createdAt: 'desc' },
    take: 80,
    include: { owner: { select: { id: true, fullName: true } } },
  });
  return res.json({ count: pets.length, pets });
};

export const markFound = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const id = z.string().uuid().parse(req.params.id);
  const pet = await prisma.lostPet.findUnique({ where: { id } });
  if (!pet) throwHttp(req, 404, 'NOT_FOUND');
  if (pet!.ownerId !== req.user!.sub) throwHttp(req, 403, 'FORBIDDEN');

  const updated = await prisma.lostPet.update({
    where: { id },
    data: { isFound: true, foundAt: new Date() },
  });
  return res.json({ success: true, pet: updated });
};

export const findMatchesForReport = async (req: Request, res: Response) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const species = (req.query.species as Species) ?? Species.DOG;
  const description = String(req.query.description ?? '');

  const matches = await findMatches(lat, lng, species, description);
  return res.json({ count: matches.length, matches });
};

/** Internal helper exported for other controllers. */
export const notifyMatchesForReport = notifyMatches;
