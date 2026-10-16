import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth';
import { asyncHandler } from '@/middlewares/asyncHandler';
import {
  addFavorite,
  listFavoriteIds,
  listFavorites,
  removeFavorite,
} from '@/controllers/favorites.controller';

export const favoritesRouter = Router();

// The /ids route must be declared before /:petId so Express does not treat
// "ids" as a petId path parameter.
favoritesRouter.get('/', requireAuth, asyncHandler(listFavorites));
favoritesRouter.get('/ids', requireAuth, asyncHandler(listFavoriteIds));
favoritesRouter.post('/:petId', requireAuth, asyncHandler(addFavorite));
favoritesRouter.delete('/:petId', requireAuth, asyncHandler(removeFavorite));
