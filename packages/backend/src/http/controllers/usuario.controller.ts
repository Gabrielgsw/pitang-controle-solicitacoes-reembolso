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

    try{
        const usuarios = await prisma.usuario.findMany({        
        omit: {senha: true},
    })

    res.status(200).json(usuarios);
    }catch(error){
        return res.status(500).json({message: 'Erro no servidor',statusCode: '500',error: 'Internal Server Error' })
    }
    
}

export async function getUsuario(req: Request, res: Response){

    const {id} = req.params;

    if(!id){
        return res.status(404).json({message: 'ID inválido',statusCode: '404',error: 'Not Found' })
    }

    

    try{
        const usuarios = await prisma.usuario.findUnique({
        where:{
            id: id
        },
        omit: {senha: true},
    })

        if (!usuarios) {
            return res.status(404).json({ message: 'Usuário não encontrado', statusCode: '404' });
        }

    res.status(200).json(usuarios);
    }catch(error){
        return res.status(500).json({message: 'Erro no servidor',statusCode: '500',error: 'Internal Server Error' })
    }
    
}

export async function postUsuario(req: Request, res: Response) {
    try {
        const { data, error } = usuarioSchema.safeParse(req.body);

        if (error) {
            return res.status(400).json(z.treeifyError(error).properties);
        }

        let usuario = await prisma.usuario.findUnique({
            where: {
                email: data.email
            }
        });

        if (usuario) {
            return res.status(409).json({ message: 'Usuário já cadastrado' });
        }

        const hash = bcrypt.genSaltSync(10);
        const senhaCriptografada = bcrypt.hashSync(data.senha, hash);

        usuario = await prisma.usuario.create({
            data: {
                ...data,
                senha: senhaCriptografada
            },
            omit: {senha: true}
        });

        return res.status(201).json(usuario);
    } catch (erro) {
        return res.status(500).json({ erro: String(erro) });
    }
}

export async function putUsuario(req: Request, res: Response) {
    try {
        const { id } = req.params;
       
        const updateSchema = usuarioSchema.partial();
        const { data, error } = updateSchema.safeParse(req.body);

        if (error) {
            return res.status(400).json(z.treeifyError(error).properties);
        }

        const usuarioExistente = await prisma.usuario.findUnique({
            where: { id }
        });

        if (!usuarioExistente) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Se vier nova senha, recriptografar
        if (data.senha) {
            const hash = bcrypt.genSaltSync(10);
            data.senha = bcrypt.hashSync(data.senha, hash);
        }

        // Se vier novo email, verificar duplicidade
        if (data.email && data.email !== usuarioExistente.email) {
            const emailEmUso = await prisma.usuario.findUnique({
                where: { email: data.email }
            });
            if (emailEmUso) {
                return res.status(409).json({ message: 'Email já está em uso' });
            }
        }

        const usuarioAtualizado = await prisma.usuario.update({
            where: { id },
            data,
            omit: { senha: true }
        });

        return res.status(200).json(usuarioAtualizado);
    } catch (erro) {
        return res.status(500).json({ erro: String(erro) });
    }
}

export async function deleteUsuario(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const usuarioExistente = await prisma.usuario.findUnique({
            where: { id, apagado: false }
        });

        if (!usuarioExistente) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        await prisma.usuario.update({
            where: { id },
            data: { apagado: true }
        });

        return res.status(204).send();
    } catch (erro) {
        return res.status(500).json({ erro: String(erro) });
    }
}

