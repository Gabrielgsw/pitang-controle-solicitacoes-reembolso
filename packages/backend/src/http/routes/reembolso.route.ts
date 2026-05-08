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
reembolsoRouter.post('/reimbursements',roleMiddleware(['COLABORADOR']), criarReembolso);
reembolsoRouter.get('/reimbursements/:id',roleMiddleware(['ADMIN','COLABORADOR','GESTOR','FINANCEIRO']), buscarReembolsoPorId);
reembolsoRouter.put('/reimbursements/:id',roleMiddleware(['COLABORADOR']), editarReembolso);
reembolsoRouter.post('/reimbursements/:id/submit',roleMiddleware(['COLABORADOR']), enviarReembolso);
reembolsoRouter.post('/reimbursements/:id/approve',roleMiddleware(['GESTOR']), aprovarReembolso);
reembolsoRouter.post('/reimbursements/:id/reject',roleMiddleware(['GESTOR']),  rejeitarReembolso);
reembolsoRouter.post('/reimbursements/:id/cancel',roleMiddleware(['COLABORADOR']),  cancelarReembolso);
reembolsoRouter.post('/reimbursements/:id/pay',roleMiddleware(['FINANCEIRO']),  pagarReembolso);
reembolsoRouter.get('/reimbursements/:id/history',roleMiddleware(['ADMIN','FINANCEIRO','GESTOR','COLABORADOR']), listarHistoricoReembolso);
reembolsoRouter.post('/reimbursements/:id/attachments',roleMiddleware(['COLABORADOR']), uploadAnexoReembolso);
reembolsoRouter.get('/reimbursements/:id/attachments', listarAnexosReembolso);

export { reembolsoRouter };