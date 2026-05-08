import express from 'express';
import { deleteUsuario, getUsuarios,postUsuario, putUsuario,getUsuario } from '../controllers/usuario.controller';
import { roleMiddleware } from '../middlewares/perfil.middleware';

const usuarioRouter = express.Router();

usuarioRouter.post('/users', postUsuario)
usuarioRouter.get('/users', roleMiddleware(['ADMIN']),getUsuarios)
usuarioRouter.get('/users/:id', roleMiddleware(['ADMIN']),getUsuario)
usuarioRouter.put('/users/:id',roleMiddleware(['ADMIN']),putUsuario)
usuarioRouter.delete('/users/:id',roleMiddleware(['ADMIN']),deleteUsuario)

export {usuarioRouter}