import express from 'express';


const reembolsoRouter = express.Router();

reembolsoRouter.get('/reimbursements', getReimbursements)
reembolsoRouter.post('/reimbursements', postReimbursements)
reembolsoRouter.get('/reimbursements/:id', getReimbursement)
reembolsoRouter.put('/reimbursements/:id', putReimbursement)
reembolsoRouter.post('/reimbursements/:id/submit', submitReimbursement)
reembolsoRouter.post('/reimbursements/:id/approve', approveReimbursement)
reembolsoRouter.post('/reimbursements/:id/approve', approveReimbursement)
reembolsoRouter.post('/reimbursements/:id/reject', rejectReimbursement)
reembolsoRouter.post('/reimbursements/:id/pay', payReimbursement)
reembolsoRouter.get('/reimbursements/:id/history', getReimbursementHistory)
reembolsoRouter.post('/reimbursements/:id/attachments', uploadReimbursementAttachment)
reembolsoRouter.get('/reimbursements/:id/attachments', getReimbursementAttachments)