import { Request, Response } from 'express';
import { prisma } from '../../core/PrismaClient';
import { categoriaSchema } from '../../schemas';
import z from 'zod';

export async function getCategorias(req: Request, res: Response) {
    const categorias = await prisma.categoria.findMany();

    res.status(200).json(categorias);
}

export async function postCategoria(req: Request, res: Response) {
    const { data, error } = categoriaSchema.safeParse(req.body);

    if (error) {
        return res.status(400).json(z.treeifyError(error).properties);
    }

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
}

export async function putCategoria(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        return res.status(400).json({ message: "ID da categoria inválido" });
    }

    const { data, error } = categoriaSchema.safeParse(req.body);

    if (error) {
        return res.status(400).json(z.treeifyError(error).properties);
    }

    const categoriaExistente = await prisma.categoria.findUnique({
        where: { id }
    });

    if (!categoriaExistente) {
        return res.status(404).json({ message: "Categoria não encontrada" });
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
        return res.status(409).json({ message: "Já existe uma categoria com este nome" });
    }

    const categoriaAtualizada = await prisma.categoria.update({
        where: { id },
        data: {
            ...data
        }
    });

    res.status(200).json(categoriaAtualizada);
}