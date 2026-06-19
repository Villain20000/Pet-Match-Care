import { Request, Response } from 'express';
import { z } from 'zod';
import { SpotCategory } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { httpError } from '@/utils/http';

const CreateSpotSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.nativeEnum(SpotCategory),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address: z.string().max(200).optional(),
});

const VoteSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1)]),
});

export const createSpot = async (req: Request, res: Response) => {
  if (!req.user) throw httpError(401, 'UNAUTHORIZED', 'Απαιτείται σύνδεση');

  const input = CreateSpotSchema.parse(req.body);

  const spot = await prisma.petFriendlySpot.create({
    data: {
      creatorId: req.user.sub,
      name: input.name,
      category: input.category,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address ?? null,
    },
  });

  // Creator starts with an implicit +1 — spots need at least three
  // confirmations to be marked verified.
  await prisma.spotVote.create({
    data: { userId: req.user.sub, spotId: spot.id, value: 1 },
  });
  await prisma.petFriendlySpot.update({
    where: { id: spot.id },
    data: { upvotes: { increment: 1 } },
  });

  return res.status(201).json({ success: true, spot });
};

export const listSpots = async (req: Request, res: Response) => {
  const category = req.query.category
    ? z.nativeEnum(SpotCategory).parse(req.query.category)
    : undefined;

  const spots = await prisma.petFriendlySpot.findMany({
    where: {
      category,
      isFlagged: false,
    },
    orderBy: [{ isVerified: 'desc' }, { upvotes: 'desc' }],
    take: 200,
  });

  return res.json({ count: spots.length, spots });
};

export const voteOnSpot = async (req: Request, res: Response) => {
  if (!req.user) throw httpError(401, 'UNAUTHORIZED', 'Απαιτείται σύνδεση');

  const spotId = z.string().uuid().parse(req.params.id);
  const { value } = VoteSchema.parse(req.body);

  // Upsert the vote atomically and adjust tallies correctly.
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.spotVote.findUnique({
      where: { userId_spotId: { userId: req.user!.sub, spotId } },
    });

    let upvoteDelta = 0;
    let downvoteDelta = 0;

    if (existing) {
      if (existing.value === value) {
        return tx.petFriendlySpot.findUnique({ where: { id: spotId } });
      }
      if (existing.value === 1) upvoteDelta -= 1;
      if (existing.value === -1) downvoteDelta -= 1;
    }

    if (value === 1) upvoteDelta += 1;
    if (value === -1) downvoteDelta += 1;

    const updated = await tx.petFriendlySpot.update({
      where: { id: spotId },
      data: {
        upvotes: { increment: upvoteDelta },
        downvotes: { increment: downvoteDelta },
      },
    });

    await tx.spotVote.upsert({
      where: { userId_spotId: { userId: req.user!.sub, spotId } },
      create: { userId: req.user!.sub, spotId, value },
      update: { value },
    });

    // Community consensus: 3 or more upvotes -> verified.
    if (updated.upvotes >= 3 && !updated.isVerified) {
      return tx.petFriendlySpot.update({
        where: { id: spotId },
        data: { isVerified: true },
      });
    }

    return updated;
  });

  if (!result) throw httpError(404, 'NOT_FOUND', 'Ο χώρος δεν βρέθηκε');

  return res.json({ success: true, spot: result });
};

export const flagSpot = async (req: Request, res: Response) => {
  if (!req.user) throw httpError(401, 'UNAUTHORIZED', 'Απαιτείται σύνδεση');
  const id = z.string().uuid().parse(req.params.id);
  const { reason } = z.object({ reason: z.string().min(3).max(200) }).parse(req.body);

  const updated = await prisma.petFriendlySpot.update({
    where: { id },
    data: { isFlagged: true, flagReason: reason, isVerified: false },
  });

  return res.json({ success: true, spot: updated });
};
