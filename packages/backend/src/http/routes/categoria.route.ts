import express from 'express';


const categoriaRouter = express.Router();

categoriaRouter.get('/categories', getCategories)
categoriaRouter.post('/categories', postCategories)
categoriaRouter.put('/categories/:id', putCategories)