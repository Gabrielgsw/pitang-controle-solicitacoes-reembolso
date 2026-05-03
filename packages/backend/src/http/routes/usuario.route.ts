import express from 'express';
import { getUsuarios,postUsuario } from '../controllers/usuario.controller';

const usuarioRouter = express.Router();

usuarioRouter.post('/users', postUsuario)
usuarioRouter.get('/users', getUsuarios)

export {usuarioRouter}