import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth';
import {
  addFavorite,
  listFavoriteIds,
  listFavorites,
  removeFavorite,
} from '@/controllers/favorites.controller';

export const favoritesRouter = Router();

// The /ids route must be declared before /:petId so Express does not treat
// "ids" as a petId path parameter.
favoritesRouter.get('/', requireAuth, listFavorites);
favoritesRouter.get('/ids', requireAuth, listFavoriteIds);
favoritesRouter.post('/:petId', requireAuth, addFavorite);
favoritesRouter.delete('/:petId', requireAuth, removeFavorite);
