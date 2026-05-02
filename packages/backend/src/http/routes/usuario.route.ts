import express from 'express';


const usuarioRouter = express.Router();

usuarioRouter.post('/users', postUsuario)
usuarioRouter.get('/users', getUsuario)