import express from 'express';
import { getCategorias,postCategoria,putCategoria } from '../controllers/categoria.controller';

const categoriaRouter = express.Router();

categoriaRouter.get('/categories', getCategorias)
categoriaRouter.post('/categories', postCategoria)
categoriaRouter.put('/categories/:id', putCategoria)

export {categoriaRouter}