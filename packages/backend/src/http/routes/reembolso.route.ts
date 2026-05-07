import express from 'express';
import { 
    criarReembolso,
    listarAnexosReembolso,
    listarHistoricoReembolso,
    listarReembolsos,
    buscarReembolsoPorId,
    enviarReembolso,
    aprovarReembolso,
    rejeitarReembolso,
    editarReembolso,
    uploadAnexoReembolso,
    pagarReembolso, 
    cancelarReembolso
} from '../controllers/reembolso.controller';
import { roleMiddleware } from '../middlewares/perfil.middleware';
const reembolsoRouter = express.Router();

reembolsoRouter.get('/reimbursements', listarReembolsos);
reembolsoRouter.post('/reimbursements',roleMiddleware(['COLABORADOR','ADMIN']), criarReembolso);
reembolsoRouter.get('/reimbursements/:id',roleMiddleware(['ADMIN','COLABORADOR','GESTOR','FINANCEIRO']), buscarReembolsoPorId);
reembolsoRouter.put('/reimbursements/:id',roleMiddleware(['COLABORADOR','ADMIN']), editarReembolso);
reembolsoRouter.post('/reimbursements/:id/submit',roleMiddleware(['ADMIN','COLABORADOR']), enviarReembolso);
reembolsoRouter.post('/reimbursements/:id/approve',roleMiddleware(['GESTOR','ADMIN']), aprovarReembolso);
reembolsoRouter.post('/reimbursements/:id/reject',roleMiddleware(['GESTOR','ADMIN']),  rejeitarReembolso);
reembolsoRouter.post('/reimbursements/:id/cancel',roleMiddleware(['COLABORADOR','ADMIN']),  cancelarReembolso);
reembolsoRouter.post('/reimbursements/:id/pay',roleMiddleware(['FINANCEIRO','ADMIN']),  pagarReembolso);
reembolsoRouter.get('/reimbursements/:id/history',roleMiddleware(['ADMIN','FINANCEIRO','GESTOR','COLABORADOR']), listarHistoricoReembolso);
reembolsoRouter.post('/reimbursements/:id/attachments',roleMiddleware(['COLABORADOR','ADMIN']), uploadAnexoReembolso);
reembolsoRouter.get('/reimbursements/:id/attachments', listarAnexosReembolso);

export { reembolsoRouter };