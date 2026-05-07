import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/core/PrismaClient';

describe('Testes de Categorias', () => {
    let adminToken: string;
    let userToken: string;
    let categoriaTesteId: number;
    const nomeCategoriaOriginal = 'Teste Original';
    const nomeCategoriaNova = 'Teste Nova Categoria';
    
    beforeAll(async () => {        
        const adminLogin = await request(app)
            .post('/login')
            .send({ email: 'admin@pitang.com', senha: 'pitang123' });
        adminToken = adminLogin.body.token;
        
        const userLogin = await request(app)
            .post('/login')
            .send({ email: 'gabriel.germano@pitang.com', senha: 'pitang123' });
        userToken = userLogin.body.token;
    });
    
    afterAll(async () => {
        await prisma.categoria.deleteMany({
            where: {
                nome: { in: [nomeCategoriaOriginal, nomeCategoriaNova, 'Categoria Duplicada'] }
            }
        });
    });

    describe('GET /categories', () => {
        test('Deve listar todas as categorias com sucesso (200)', async () => {            
            const resposta = await request(app)
                .get('/categories')
                .set('Authorization', `Bearer ${userToken}`); 
            
            expect(resposta.status).toBe(200);
            expect(Array.isArray(resposta.body)).toBeTruthy();
        });
    });

    describe('POST /categories', () => {
        test('Deve ser barrado (403) se o usuário NÃO for ADMIN', async () => {
            const resposta = await request(app)
                .post('/categories')
                .set('Authorization', `Bearer ${userToken}`) 
                .send({ nome: 'Categoria Hacker' });

            expect(resposta.status).toBe(403); 
        });

        test('Deve criar uma categoria com sucesso (201) usando ADMIN', async () => {
            const resposta = await request(app)
                .post('/categories')
                .set('Authorization', `Bearer ${adminToken}`) 
                .send({ nome: nomeCategoriaOriginal });

            expect(resposta.status).toBe(201);
            expect(resposta.body).toHaveProperty('id');
            
            categoriaTesteId = resposta.body.id; 
        });

        test('Deve retornar erro ao tentar criar categoria já existente (409)', async () => {
            const resposta = await request(app)
                .post('/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ nome: nomeCategoriaOriginal });

            expect(resposta.status).toBe(409);
        });
    });

    describe('PUT /categories/:id', () => {
        test('Deve ser barrado (403) se o usuário NÃO for ADMIN ao editar', async () => {
            const resposta = await request(app)
                .put(`/categories/${categoriaTesteId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ nome: 'Tentativa de Edição' });

            expect(resposta.status).toBe(403);
        });

        test('Deve atualizar uma categoria com sucesso (200) usando ADMIN', async () => {
            const resposta = await request(app)
                .put(`/categories/${categoriaTesteId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ nome: nomeCategoriaNova });

            expect(resposta.status).toBe(200);
            expect(resposta.body.nome).toBe(nomeCategoriaNova);
        });

        test('Deve retornar erro para categoria inexistente (404)', async () => {
            const resposta = await request(app)
                .put('/categories/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ nome: 'Nome Inexistente' });

            expect(resposta.status).toBe(404);
        });
    });
});