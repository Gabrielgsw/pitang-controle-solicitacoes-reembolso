import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/core/PrismaClient';
import bcrypt from 'bcryptjs';

describe('Testes de Reembolsos', () => {
    let tokenColaborador: string;
    let tokenGestor: string;
    let tokenFinanceiro: string;
    let categoriaId: number;
    let reembolsoId: string;

    const senhaPadrao = bcrypt.hashSync('senha123', 10);

    beforeAll(async () => {        
        await prisma.usuario.createMany({
            data: [
                { nome: 'Colab Teste', email: 'colab@teste.com', senha: senhaPadrao, perfil: 'COLABORADOR' },
                { nome: 'Gestor Teste', email: 'gestor@teste.com', senha: senhaPadrao, perfil: 'GESTOR' },
                { nome: 'Fin Teste', email: 'fin@teste.com', senha: senhaPadrao, perfil: 'FINANCEIRO' },
            ]
        });

        
        const resColab = await request(app).post('/login').send({ email: 'colab@teste.com', senha: 'senha123' });
        tokenColaborador = resColab.body.token;

        const resGestor = await request(app).post('/login').send({ email: 'gestor@teste.com', senha: 'senha123' });
        tokenGestor = resGestor.body.token;

        const resFin = await request(app).post('/login').send({ email: 'fin@teste.com', senha: 'senha123' });
        tokenFinanceiro = resFin.body.token;

        
        let categoria = await prisma.categoria.findFirst();
        if (!categoria) {
            categoria = await prisma.categoria.create({ data: { nome: 'Alimentação Teste', ativo: true } });
        }
        categoriaId = categoria.id;
    });

    afterAll(async () => {
        
        if (reembolsoId) {
            await prisma.historicoSolicitacao.deleteMany({ where: { solicitacaoId: reembolsoId } });
            await prisma.anexo.deleteMany({ where: { solicitacaoId: reembolsoId } });
            await prisma.solicitacaoReembolso.delete({ where: { id: reembolsoId } });
        }
        
        await prisma.usuario.deleteMany({
            where: { email: { in: ['colab@teste.com', 'gestor@teste.com', 'fin@teste.com'] } }
        });
        
        await prisma.$disconnect();
    });

    describe('Fluxo Completo de Reembolso', () => {
        test('Deve criar um reembolso como COLABORADOR (201)', async () => {
            const resposta = await request(app)
                .post('/reimbursements')
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    categoriaId: categoriaId,
                    descricao: 'Almoço com cliente',
                    valor: 85.50,
                    dataDespesa: new Date().toISOString()
                });

            expect(resposta.status).toBe(201);
            expect(resposta.body.status).toBe('RASCUNHO');
            reembolsoId = resposta.body.id; 
        });

        test('Deve avançar status para ENVIADO como COLABORADOR (200)', async () => {
            const resposta = await request(app)
                .post(`/reimbursements/${reembolsoId}/submit`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            expect(resposta.status).toBe(200);
            expect(resposta.body.status).toBe('ENVIADO');
        });

        test('Deve barrar a aprovação se tentar usar token de COLABORADOR (403)', async () => {
            const resposta = await request(app)
                .post(`/reimbursements/${reembolsoId}/approve`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            
            expect([401, 403]).toContain(resposta.status);
        });

        test('Deve aprovar o reembolso como GESTOR (200)', async () => {
            const resposta = await request(app)
                .post(`/reimbursements/${reembolsoId}/approve`)
                .set('Authorization', `Bearer ${tokenGestor}`);

            expect(resposta.status).toBe(200);
            expect(resposta.body.status).toBe('APROVADO');
        });

        test('Deve pagar o reembolso como FINANCEIRO (200)', async () => {
            const resposta = await request(app)
                .post(`/reimbursements/${reembolsoId}/pay`)
                .set('Authorization', `Bearer ${tokenFinanceiro}`);

            expect(resposta.status).toBe(200);
            expect(resposta.body.status).toBe('PAGO');
        });
    });
});