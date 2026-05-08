import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/core/PrismaClient';

describe('Testes de Usuarios', () => {
    let tokenDeAcesso: string;
    const emailDeTeste = 'novoteste@pitang.com';

    beforeAll(async () => {
        const respostaLogin = await request(app)
            .post('/login')
            .send({ email: 'admin@pitang.com', senha: 'pitang123' });
        tokenDeAcesso = respostaLogin.body.token;
    });

    afterAll(async () => {
        await prisma.usuario.deleteMany({
            where: { email: emailDeTeste }
        });
        await prisma.$disconnect();
    });

    describe('GET /users', () => {
        test('Deve retornar 401 ao acessar sem token', async () => {
            const resposta = await request(app).get('/users');
            expect(resposta.status).toBe(401);
        });

        test('Deve listar usuarios sem incluir senhas (200)', async () => {
            const resposta = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${tokenDeAcesso}`);

            expect(resposta.status).toBe(200);
            expect(Array.isArray(resposta.body)).toBeTruthy();
            
            if (resposta.body.length > 0) {
                expect(resposta.body[0]).not.toHaveProperty('senha');
            }
        });
    });

    describe('POST /users', () => {
        test('Deve criar usuario com sucesso (201)', async () => {
            const resposta = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${tokenDeAcesso}`)
                .send({
                    nome: 'Usuario de Teste',
                    email: emailDeTeste,
                    senha: 'senha-super-segura',
                    perfil: 'COLABORADOR',
                    apagado: false
                });

            console.log("O motivo do erro 500 é:", resposta.body);

            expect(resposta.status).toBe(201);
            expect(resposta.body).toHaveProperty('id');
            expect(resposta.body.email).toBe(emailDeTeste);
            //expect(resposta.body).toHaveProperty('tokenVerificacao');
        });

        test('Deve barrar criacao de usuario com email existente (409)', async () => {
            const resposta = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${tokenDeAcesso}`)
                .send({
                    nome: 'Outro Nome',
                    email: emailDeTeste,
                    senha: 'outrasenha123',
                    perfil: 'COLABORADOR',
                    apagado: false
                });

            if (resposta.status === 400) console.log('Erro do Zod:', resposta.body);
            expect(resposta.status).toBe(409);
            expect(resposta.body.message).toBe('Usuário já cadastrado');
        });

        test('Deve barrar payload invalido via Zod (400)', async () => {
            const resposta = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${tokenDeAcesso}`)
                .send({
                    email: 'invalido'
                });

            expect(resposta.status).toBe(400);
        });
    });
});