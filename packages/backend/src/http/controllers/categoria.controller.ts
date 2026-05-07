import { Request, Response } from 'express';
import { prisma } from '../../core/PrismaClient';
import { categoriaSchema } from '../../schemas';
import z from 'zod';
import { getUsuarioLogado } from '../../utils/get-usuario-logado';

export async function getCategorias(req: Request, res: Response) {

    try{
        const categorias = await prisma.categoria.findMany();

        res.status(200).json(categorias);
    }catch(error){
        return res.status(500).json({message: 'Erro no servidor',statusCode: '500',error: 'Internal Server Error' })
    }
    
}

export async function postCategoria(req: Request, res: Response) {
    const { data, error } = categoriaSchema.safeParse(req.body);

    if (error) {
        return res.status(400).json({message:z.treeifyError(error).properties, });
    }

    try{
        const buscarCategoria = await prisma.categoria.findFirst({
        where: {
        nome: {
            equals: data.nome,
            mode: "insensitive"
            }
            }
        });

        if (buscarCategoria) {
            return res.status(409).json({ message: "Categoria já existe" });
        }

        const categoria = await prisma.categoria.create({
            data: {
            ...data
            }
        });

        res.status(201).json(categoria);
    }catch(error){
        return res.status(500).json({message: 'Erro no servidor',statusCode: '500',error: 'Internal Server Error' })
      }
    }
    

export async function putCategoria(req: Request, res: Response) {
    const id = parseInt(req.params.id as string, 10);
    const loggedUser = getUsuarioLogado(req);

    if (isNaN(id)) {
        return res.status(400).json({ message: "ID da categoria inválido",statusCode:'400',error: 'Bad Request' });
    }

    const { data, error } = categoriaSchema.safeParse(req.body);

    if (error) {
        return res.status(400).json({message:z.treeifyError(error).properties, statusCode:'400',error: 'Bad Request'});
    }

    try{
        const categoriaExistente = await prisma.categoria.findUnique({
        where: { id }
        });

        if (!categoriaExistente) {
            return res.status(404).json({ message: "Categoria não encontrada",statusCode:'404',error: 'Not Found'});
        }

        if(loggedUser.perfil !== 'ADMIN'){
            return res.status(403).json({message: 'Perfil inválido',statusCode:'403',error: 'Forbidden'})
        }

        const buscarCategoriaExistente= await prisma.categoria.findFirst({
            where: {
                nome: {
                    equals: data.nome,
                    mode: "insensitive"
                },
                id: {
                    not: id
                }
            }
        });

        if (buscarCategoriaExistente) {
            return res.status(409).json({ message: "Já existe uma categoria com este nome" , statusCode:'409',error:'Conflict'});
        }

        const categoriaAtualizada = await prisma.categoria.update({
            where: { id },
            data: {
                ...data
            }
        });

        res.status(200).json(categoriaAtualizada);
    }catch(error){
        return res.status(500).json({message: 'Erro no servidor',statusCode: '500',error: 'Internal Server Error' })
    }
    
}