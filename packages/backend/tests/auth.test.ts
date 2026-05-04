import request from 'supertest';
import { app } from '../src/app'; 

describe('Autenticação (POST /login)', () => {
    
    test('Deve fazer login com sucesso usando credenciais corretas', async () => {
        const response = await request(app)
            .post('/login')
            .send({
                email: 'admin@pitang.com',
                senha: 'pitang123'
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(typeof response.body.token).toBe('string');
    });

    test('Deve retornar erro 401 ao usar senha incorreta', async () => {
        const response = await request(app)
            .post('/login')
            .send({
                email: 'admin@pitang.com',
                senha: 'senhaerrada123'
            });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
    });

    test('Deve retornar erro 404/401 ao tentar logar com email inexistente', async () => {
        const response = await request(app)
            .post('/login')
            .send({
                email: 'naoexiste@pitang.com',
                senha: 'pitang123'
            });

        expect([401, 404]).toContain(response.status); 
    });

    test('Deve ser barrado pelo Zod (400) ao enviar payload inválido', async () => {
        const response = await request(app)
            .post('/login')
            .send({
                email: 'email-invalido', 
                senha: '' 
            });

        expect(response.status).toBe(400);
    });
});