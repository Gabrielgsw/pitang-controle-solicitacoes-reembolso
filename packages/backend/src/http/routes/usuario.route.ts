import express from 'express';
import { getUsuarios,postUsuario } from '../controllers/usuario.controller';
import { roleMiddleware } from '../middlewares/perfil.middleware';

const usuarioRouter = express.Router();

usuarioRouter.post('/users', postUsuario)
usuarioRouter.get('/users', roleMiddleware(['ADMIN']),getUsuarios)

export {usuarioRouter}