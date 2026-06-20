import { Request, Response } from 'express';
import { z } from 'zod';
import { AdoptionStatus, Species } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { throwHttp } from "@/utils/http";

const CreatePetSchema = z.object({
  shelterId: z.string().uuid(),
  name: z.string().min(1).max(60),
  species: z.nativeEnum(Species),
  age: z.string().max(40),
  size: z.string().max(40),
  description: z.string().min(5).max(2000),
  imageUrl: z.string().url(),
  isUrgent: z.boolean().default(false),
  isMicrochipped: z.boolean().default(false),
  microchipNumber: z.string().max(40).optional(),
  isVaccinated: z.boolean().default(false),
  isSterilized: z.boolean().default(false),
  healthNotes: z.string().max(2000).optional(),
});

// In-memory registry of "show interest" events. In production you'd model
// this as its own AdoptionInterest table; for the hackathon-version we
// keep it minimal but observable.
const interests = new Map<string, Set<string>>(); // petId -> Set<userId>

export const createPet = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');

  const input = CreatePetSchema.parse(req.body);

  const pet = await prisma.petForAdoption.create({
    data: { ...input, status: AdoptionStatus.AVAILABLE },
  });
  return res.status(201).json({ success: true, pet });
};

export const listPets = async (req: Request, res: Response) => {
  const species = req.query.species ? z.nativeEnum(Species).parse(req.query.species) : undefined;
  const urgent = req.query.urgent === 'true';
  const q = (req.query.q as string | undefined)?.trim();

  const pets = await prisma.petForAdoption.findMany({
    where: {
      status: AdoptionStatus.AVAILABLE,
      species,
      ...(urgent ? { isUrgent: true } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
    take: 120,
    include: { shelter: { select: { id: true, fullName: true } } },
  });

  return res.json({ count: pets.length, pets });
};

export const getPet = async (req: Request, res: Response) => {
  const id = z.string().uuid().parse(req.params.id);
  const pet = await prisma.petForAdoption.findUnique({
    where: { id },
    include: { shelter: true },
  });
  if (!pet) throwHttp(req, 404, 'NOT_FOUND');
  return res.json({ pet, interestedCount: interests.get(id)?.size ?? 0 });
};

export const expressInterest = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');

  const petId = z.string().uuid().parse(req.params.id);
  const pet = await prisma.petForAdoption.findUnique({ where: { id: petId } });
  if (!pet) throwHttp(req, 404, 'NOT_FOUND');

  const set = interests.get(petId) ?? new Set<string>();
  set.add(req.user!.sub);
  interests.set(petId, set);

  return res.json({
    success: true,
    message: 'Η εκδήλωση ενδιαφέροντος καταχωρήθηκε',
    interestedCount: set.size,
  });
};

export const markAdopted = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const id = z.string().uuid().parse(req.params.id);

  const pet = await prisma.petForAdoption.update({
    where: { id },
    data: { status: AdoptionStatus.ADOPTED },
  });

  return res.json({ success: true, pet });
};
