import { Request, Response } from 'express';
import { prisma } from '../../core/PrismaClient';
import { solicitacaoReembolsoSchema, rejeitarSolicitacaoSchema } from '../../schemas';
import z from 'zod';
import { getUsuarioLogado } from '../../utils/get-usuario-logado';


export async function criarReembolso(req: Request, res: Response) {
    
    const { data, error } = solicitacaoReembolsoSchema.safeParse(req.body);
    const loggedUser = getUsuarioLogado(req);
    if (error) {
        return res.status(400).json(z.treeifyError(error).properties);
    }

    const reembolso = await prisma.solicitacaoReembolso.create({
        data: {
            ...data,
            status: 'RASCUNHO',
            solicitanteId: loggedUser.id,
            historicos: {
                create: {
                    acao: 'CREATED',
                    usuarioId: loggedUser.id,
                }
            }
        }
    });

    res.status(201).json(reembolso);
}

export async function listarReembolsos(req: Request, res: Response) {

    const loggedUser = getUsuarioLogado(req);
    
    let whereClause = {};
    
    if (loggedUser.perfil === 'COLABORADOR') {
        whereClause = { solicitanteId: loggedUser.id };
    } else if (loggedUser.perfil === 'GESTOR') {
        whereClause = { OR: [{ solicitanteId: loggedUser.id }, { status: 'ENVIADO' }] };
    } else if (loggedUser.perfil === 'FINANCEIRO') {
        whereClause = { OR: [{ solicitanteId: loggedUser.id }, { status: 'APROVADO' }] };
    }
    
    const reembolsos = await prisma.solicitacaoReembolso.findMany({
        where: whereClause,
        include: {
            categoria: true,
            usuario: { select: { nome: true, email: true } }
        },
        orderBy: { criadoEm: 'desc' }
    });

    res.status(200).json(reembolsos);
}

export async function buscarReembolsoPorId(req: Request, res: Response) {
    const id = req.params.id;

    if (!id){
        return res.status(400).json({ message: 'ID inválido' });
    } 
    const reembolso = await prisma.solicitacaoReembolso.findUnique({
        where: { id },
        include: {
            categoria: true,
            usuario: { select: { nome: true, email: true, perfil: true } },
            HistoricoSolicitacao: {
                include: { autor: { select: { nome: true, perfil: true } } },
                orderBy: { criadoEm: 'desc' }
            }
        }
    });

    if (!reembolso){
        return res.status(404).json({ message: 'Reembolso não encontrado' });
    } 

    res.status(200).json(reembolso);
}

export async function enviarReembolso(req: Request, res: Response) {
    const id = req.params.id;
    const loggedUser = getUsuarioLogado(req);
    if (!id){
        return res.status(400).json({ message: 'ID inválido' });
    } 
    const reembolso = await prisma.solicitacaoReembolso.findUnique({ where: { id } });

    if (!reembolso) {
        return res.status(404).json({ 
            message: 'Reembolso não encontrado', 
            statusCode: 404, 
            error: 'Not Found' 
        });
    }

    if (reembolso.status !== 'RASCUNHO' && reembolso.status !== 'REJEITADO') {
        return res.status(400).json({ 
            message: 'Apenas rascunhos ou rejeitados podem ser enviados', 
            statusCode: 400, 
            error: 'Bad Request' 
        });
    }

    const reembolsoEnviado = await prisma.solicitacaoReembolso.update({
        where: { id },
        data: {
            status: 'ENVIADO',
            historicos: {
                create: { acao: 'SUBMITTED', usuarioId: loggedUser.id }
            }
        }
    });

    res.status(200).json(reembolsoEnviado);
}

export async function aprovarReembolso(req: Request, res: Response) {
    const id = req.params.id;    
    const loggedUser = getUsuarioLogado(req);
    const reembolso = await prisma.solicitacaoReembolso.findUnique({ where: { id } });
    if (!id){
        return res.status(400).json({ message: 'ID inválido' });
    } 
    if (!reembolso){
       return res.status(404).json({ message: 'Reembolso não encontrado' },{statusCode: '404'}, {error: 'Not Found'}); 
    } 
    if (reembolso.status !== 'ENVIADO'){
       return res.status(400).json({ message: 'Apenas reembolsos ENVIADOS podem ser aprovados' },{statusCode: '400'}, {error: 'Bad Request'}); 
    } 

    const reembolsoAprovado = await prisma.solicitacaoReembolso.update({
        where: { id },
        data: {
            status: 'APROVADO',
            historicos: {
                create: { acao: 'APPROVED', usuarioId: loggedUser.id }
            }
        }
    });

    res.status(200).json(reembolsoAprovado);
}

export async function rejeitarReembolso(req: Request, res: Response) {
    const id = req.params.id;    
    const loggedUser = getUsuarioLogado(req);
    const { data, error } = rejeitarSolicitacaoSchema.safeParse(req.body);
    if (!id){
        return res.status(400).json({ message: 'ID inválido' });
    } 
    if (error){
        return res.status(400).json(z.treeifyError(error).properties);
    } 

    const reembolso = await prisma.solicitacaoReembolso.findUnique({ where: { id } });

    if (!reembolso){
        return res.status(404).json({ message: 'Reembolso não encontrado' },{statusCode: '404'}, {error: 'Not Found'});
    } 
    if (reembolso.status !== 'ENVIADO'){
        return res.status(400).json({ message: 'Apenas reembolsos ENVIADOS podem ser rejeitados' },{statusCode: '400'}, {error: 'Bad Request'});
    } 
    

    const reembolsoRejeitado = await prisma.solicitacaoReembolso.update({
        where: { id },
        data: {
            status: 'REJEITADO',
            historicos: {
                create: { 
                    acao: 'REJECTED', 
                    usuarioId: loggedUser.id, 
                    justificativa: data.justificativaRejeicao 
                }
            }
        }
    });

    res.status(200).json(reembolsoRejeitado);
}

export async function pagarReembolso(req: Request, res: Response) {
    const id = req.params.id;    
    const loggedUser = getUsuarioLogado(req);
    const reembolso = await prisma.solicitacaoReembolso.findUnique({ where: { id } });

    if (!id){
        return res.status(400).json({ message: 'ID inválido' });
    } 

    if (!reembolso){
       return res.status(404).json({ message: 'Reembolso não encontrado' },{statusCode: '404'}, {error: 'Not Found'}); 
    } 
    if (reembolso.status !== 'APROVADO'){
       return res.status(400).json({ message: 'Apenas reembolsos APROVADOS podem ser pagos' },{statusCode: '400'}, {error: 'Bad Request'});
    } 

    const reembolsoPago = await prisma.solicitacaoReembolso.update({
        where: { id },
        data: {
            status: 'PAGO',
            historicos: {
                create: { acao: 'PAID', usuarioId: loggedUser.id }
            }
        }
    });

    res.status(200).json(reembolsoPago);
}

export async function editarReembolso(req: Request, res: Response) {
    const id = req.params.id;    
    const loggedUser = getUsuarioLogado(req);
    if (!id){
        return res.status(400).json({ message: 'ID inválido' });
    } 

    const { data, error } = solicitacaoReembolsoSchema.safeParse(req.body);

    if (error) {
        return res.status(400).json(z.treeifyError(error).properties);
    }

    const reembolso = await prisma.solicitacaoReembolso.findUnique({ where: { id } });

    if (!reembolso){
       return res.status(404).json({ message: 'Reembolso não encontrado' },{statusCode: '404'}, {error: 'Not Found'}); 
    } 
    
    if (reembolso.solicitanteId !== loggedUser.id) {
        return res.status(403).json({ message: 'Você só pode editar suas próprias solicitações' },{statusCode: '403'}, {error: 'Forbidden'});
    }

    if (reembolso.status !== 'RASCUNHO' && reembolso.status !== 'REJEITADO') {
        return res.status(400).json({ message: 'Apenas solicitações em rascunho ou rejeitadas podem ser editadas' },{statusCode: '400'}, {error: 'Bad Request'});
    }

    const reembolsoAtualizado = await prisma.solicitacaoReembolso.update({
        where: { id },
        data: {
            ...data,
            historicos: {
                create: { acao: 'UPDATED', usuarioId: loggedUser.id }
            }
        }
    });

    res.status(200).json(reembolsoAtualizado);
}

export async function listarHistoricoReembolso(req: Request, res: Response) {
    const id = req.params.id;

    if (!id){
       return res.status(400).json({ message: 'ID inválido' },{statusCode: '400'}, {error: 'Bad Request'});
    } 

    
    const reembolso = await prisma.solicitacaoReembolso.findUnique({ where: { id } });
    if (!reembolso){
      return res.status(404).json({ message: 'Reembolso não encontrado' },{statusCode: '404'}, {error: 'Not Found'});
  
    } 
    const historicos = await prisma.historicoSolicitacao.findMany({
        where: { solicitacaoId: id },
        include: { 
            usuario: { select: { nome: true, perfil: true } } 
        },
        orderBy: { criadoEm: 'desc' }
    });

    res.status(200).json(historicos);
}

export async function listarAnexosReembolso(req: Request, res: Response) {
    const id = req.params.id;

    if (!id){
      return res.status(400).json({ message: 'ID inválido' },{statusCode: '400'}, {error: 'Bad Request'});  
    } 

    const anexos = await prisma.anexo.findMany({
        where: { solicitacaoId: id }
    });

    res.status(200).json(anexos);
}

export async function uploadAnexoReembolso(req: Request, res: Response) {
    const id = req.params.id;
    const loggedUser = getUsuarioLogado(req);

    if (!id){
      return res.status(400).json({ message: 'ID inválido' },{statusCode: '400'}, {error: 'Bad Request'});  
    } 
    
    const { nomeArquivo, url,tipoArquivo } = req.body; 

    if (!nomeArquivo || !url) {
        return res.status(400).json({ message: 'Nome do arquivo e URL são obrigatórios' },{statusCode: '400'}, {error: 'Bad Request'});
    }

    const reembolso = await prisma.solicitacaoReembolso.findUnique({ where: { id } });
    
    if (!reembolso){
      return res.status(404).json({ message: 'Reembolso não encontrado' },{statusCode: '404'}, {error: 'Not Found'});  
    } 

    const anexo = await prisma.anexo.create({
        data: {
            solicitacaoId: id,
            nomeArquivo,
            urlArquivo: url,
            tipoArquivo,
        }
    });
    
    await prisma.historicoSolicitacao.create({
        data: {
            solicitacaoId: id,
            acao: 'UPDATED', 
            usuarioId: loggedUser.id           
        }
    });

    res.status(201).json(anexo);
}