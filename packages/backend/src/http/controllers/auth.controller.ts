import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import z from 'zod';
import { environment  } from '../../core/EnvVars';
import { usuarioSchema,loginSchema } from '../../schemas';
import { getUsuarioLogado } from '../../utils/get-usuario-logado';


import {Request,Response} from 'express'
import { prisma } from '../../core/PrismaClient';

export async function login(req: Request, res: Response) {
    const { data, error } = loginSchema.safeParse(req.body);

    if (error) {
        return res.status(400).json(z.treeifyError(error).properties);
    }

    const usuario = await prisma.usuario.findUnique({
        where: { email: data.email }
    });

    if (!usuario) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const senhaValida = bcrypt.compareSync(data.senha, usuario.senha);

    if (!senhaValida) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const payload = {
        id: usuario.id,
        email: usuario.email,
        perfil: usuario.perfil
    };

    const token = jsonwebtoken.sign(payload, environment.JWT_SECRET, {
        expiresIn: '24h'
    });
    
    res.status(200).json({
        token
    });
}