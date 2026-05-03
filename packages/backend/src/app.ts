import express from 'express';
import cors from 'cors';

import { authMiddleware } from "./http/middlewares/auth.middleware";
import { authRouter } from './http/routes/auth.route';
import { categoriaRouter } from './http/routes/categoria.route';
import { reembolsoRouter } from './http/routes/reembolso.route';
import { usuarioRouter } from './http/routes/usuario.route';

const app = express();

app.use(express.json());
app.use(
    cors({
        allowedHeaders: ['Content-Type', 'Authorization'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        origin: '*',
    }),
);


app.use(authRouter); 

// Rota de teste
app.get('/', (req, res) => {
    res.send({ message: 'Hello world! API de Reembolsos online.' });
});


app.use(authMiddleware);


app.use(categoriaRouter);
app.use(reembolsoRouter);
app.use(usuarioRouter);

export { app };