import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import z from 'zod';
import { environment  } from '../../core/EnvVars';
import { usuarioSchema,loginSchema } from '../../schemas';
import { getUsuarioLogado } from '../../utils/get-usuario-logado';
import { Usuario } from '../../generated/prisma/client';

import {Request,Response} from 'express'
import { prisma } from '../../core/PrismaClient';

export async function getUsuarios(req: Request, res: Response){

    const usuarios = await prisma.usuario.findMany({
        omit: {senha: true},
    })

    res.status(200).json(usuarios);
}

export async function postUsuario(req: Request, res: Response){

    const {data, error} = usuarioSchema.safeParse(req.body);

    if(error){
        return res.status(400).json(z.treeifyError(error).properties);
    }

    let usuario = await prisma.usuario.findUnique({where: {
        email: data.email
    }});

    if(usuario){
        return res.status(409).json({message: 'Usuário já cadastrado'})
    }

    const hash = bcrypt.genSaltSync(10);

    data.senha = await bcrypt.hashSync(data.senha, hash)

    const tokenVerificacao = crypto.randomBytes(32).toString('hex')

    usuario = await prisma.usuario.create({
        data: {...data, tokenVerificacao }
    });

    console.log('Usuario registrado', usuario.nome)

    res.status(201).json(usuario)
}

