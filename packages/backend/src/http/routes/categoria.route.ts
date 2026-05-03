import express from 'express';
import { getCategorias,postCategoria,putCategoria } from '../controllers/categoria.controller';
import { roleMiddleware } from '../middlewares/perfil.middleware';

const categoriaRouter = express.Router();

categoriaRouter.get('/categories', getCategorias)
categoriaRouter.post('/categories',roleMiddleware(['ADMIN']), postCategoria)
categoriaRouter.put('/categories/:id',roleMiddleware(['ADMIN']), putCategoria)

export {categoriaRouter}