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
    pagarReembolso 
} from '../controllers/reembolso.controller';

const reembolsoRouter = express.Router();

reembolsoRouter.get('/reimbursements', listarReembolsos);
reembolsoRouter.post('/reimbursements', criarReembolso);
reembolsoRouter.get('/reimbursements/:id', buscarReembolsoPorId);
reembolsoRouter.put('/reimbursements/:id', editarReembolso);
reembolsoRouter.post('/reimbursements/:id/submit', enviarReembolso);
reembolsoRouter.post('/reimbursements/:id/approve', aprovarReembolso);
reembolsoRouter.post('/reimbursements/:id/reject', rejeitarReembolso);
reembolsoRouter.post('/reimbursements/:id/pay', pagarReembolso);
reembolsoRouter.get('/reimbursements/:id/history', listarHistoricoReembolso);
reembolsoRouter.post('/reimbursements/:id/attachments', uploadAnexoReembolso);
reembolsoRouter.get('/reimbursements/:id/attachments', listarAnexosReembolso);

export { reembolsoRouter };