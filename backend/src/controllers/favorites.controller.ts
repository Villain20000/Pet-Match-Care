import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@/config/prisma';
import { throwHttp } from '@/utils/http';

/**
 * Favorites / wishlist for adoption pets.
 * Endpoints:
 *   GET    /api/favorites          — list the caller's favorited pets
 *   POST   /api/favorites/:petId   — add a pet to favorites
 *   DELETE /api/favorites/:petId   — remove a pet from favorites
 *   GET    /api/favorites/ids      — just the petIds (lightweight for heart state)
 */
export const listFavorites = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const userId = req.user!.sub;

  const rows = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      pet: {
        include: { shelter: { select: { id: true, fullName: true } } },
      },
    },
  });

  return res.json({
    count: rows.length,
    pets: rows.map((r) => r.pet),
  });
};

export const listFavoriteIds = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const userId = req.user!.sub;

  const rows = await prisma.favorite.findMany({
    where: { userId },
    select: { petId: true },
  });

  return res.json({ count: rows.length, ids: rows.map((r) => r.petId) });
};

export const addFavorite = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const userId = req.user!.sub;
  const petId = z.string().uuid().parse(req.params.petId);

  const pet = await prisma.petForAdoption.findUnique({ where: { id: petId } });
  if (!pet) throwHttp(req, 404, 'NOT_FOUND');

  // upsert keeps the call idempotent — re-favouriting an already-favourited
  // pet does not error and does not bump createdAt.
  await prisma.favorite.upsert({
    where: { userId_petId: { userId, petId } },
    create: { userId, petId },
    update: {},
  });

  return res.status(201).json({ success: true, petId });
};

export const removeFavorite = async (req: Request, res: Response) => {
  if (!req.user) throwHttp(req, 401, 'UNAUTHORIZED');
  const userId = req.user!.sub;
  const petId = z.string().uuid().parse(req.params.petId);

  await prisma.favorite.deleteMany({ where: { userId, petId } });

  return res.json({ success: true, petId });
};
