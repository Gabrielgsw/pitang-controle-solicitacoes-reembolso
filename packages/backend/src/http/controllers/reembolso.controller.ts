import { Request, Response } from 'express';
import { prisma } from '../../core/PrismaClient';
import { solicitacaoReembolsoSchema, rejeitarSolicitacaoSchema,anexoSchema,categoriaSchema,idCategoriaParamSchema,listarReembolsosQuerySchema,paginacaoQuerySchema,uuidParamSchema, } from '../../schemas';
import z from 'zod';
import { getUsuarioLogado } from '../../utils/get-usuario-logado';
import dayjs from 'dayjs';

export async function criarReembolso(req: Request, res: Response) {
    
    const { data, error } = solicitacaoReembolsoSchema.safeParse(req.body);
    const loggedUser = getUsuarioLogado(req);
       
    if (error) {
        return res.status(400).json({message:z.treeifyError(error).properties, statusCode: 400, 
            error: 'Bad Request'});
    }

    try{
        const validaCategoria = await prisma.categoria.findUnique({where: {id: data?.categoriaId}})
        if(!validaCategoria || !validaCategoria.ativo){
            return res.status(400).json({ 
                message: 'Categoria inválida', 
                statusCode: 400, 
                error: 'Bad Request' 
            });
        }

        const reembolso = await prisma.solicitacaoReembolso.create({
            data: {
                ...data,
                status: 'RASCUNHO',
                solicitanteId: loggedUser.id,
                dataDespesa: dayjs(data.dataDespesa).toISOString(),
                historicos: {
                    create: {
                        acao: 'CREATED',
                        usuarioId: loggedUser.id,
                        observacao: 'Reembolso criado por um '+loggedUser.perfil
                    }
                }
            }
        });

        res.status(201).json(reembolso);
    }catch(error){
        return res.status(500).json({message: 'Erro no servidor',statusCode: '500',error: 'Internal Server Error' })
    }
    
}

export async function listarReembolsos(req: Request, res: Response) {

    const loggedUser = getUsuarioLogado(req);
    
    try{
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
    }catch(error){
        return res.status(500).json({message: 'Erro no servidor',statusCode: '500',error: 'Internal Server Error' })
    }
    
}

export async function buscarReembolsoPorId(req: Request, res: Response) {
    const {id} = uuidParamSchema.parse(req.params);  

    if (!id){
        return res.status(400).json({ message: 'ID inválido',statusCode: '400', error: 'Bad Request' });
    } 

    try{
        const reembolso = await prisma.solicitacaoReembolso.findUnique({
        where: { id },
        include: {
            categoria: true,
            usuario: { select: { nome: true, email: true, perfil: true } },
            historicos: {
                    include: { 
                        
                        usuario: { select: { nome: true, perfil: true } } 
                    },
                    
                    orderBy: { criadoEm: 'desc' } 
                }
        }
        });

        if (!reembolso){
            return res.status(404).json({ message: 'Reembolso não encontrado',statusCode: '404', error: 'Not Found' });
        } 

        res.status(200).json(reembolso);
    }catch(error){
        return res.status(500).json({message: 'Erro no servidor',statusCode: '500',error: 'Internal Server Error' })
    }
    
}

export async function enviarReembolso(req: Request, res: Response) {
    const {id} = uuidParamSchema.parse(req.params);  
    const loggedUser = getUsuarioLogado(req);
    if (!id){
        return res.status(400).json({ message: 'ID inválido', 
                statusCode: 400, 
                error: 'Bad Request' });
    } 

    try{
        const reembolso = await prisma.solicitacaoReembolso.findUnique({ where: { id } });
    

    if (!reembolso) {
        return res.status(404).json({ 
            message: 'Reembolso não encontrado', 
            statusCode: 404, 
            error: 'Not Found' 
        });
    }

    if(loggedUser.perfil !== 'ADMIN'){

        if (reembolso.status !== 'RASCUNHO') {
            return res.status(400).json({ 
                message: 'Apenas rascunhos ou rejeitados podem ser enviados', 
                statusCode: 400, 
                error: 'Bad Request' 
            });
        }

        if (reembolso.solicitanteId !== loggedUser.id) {
            return res.status(403).json({ 
                message: 'Você só pode enviar as suas próprias solicitações', 
                statusCode: 403, 
                error: 'Forbidden' 
            });
        }
        }

        const reembolsoEnviado = await prisma.solicitacaoReembolso.update({
            where: { id },
            data: {
                status: 'ENVIADO',
                historicos: {
                    create: { acao: 'SUBMITTED', 
                        usuarioId: loggedUser.id,
                        observacao: 'Reembolso enviado para análise'
                    }
                }
            }
        });

        res.status(200).json(reembolsoEnviado);
    }catch(error){
        return res.status(500).json({message: 'Erro no servidor',statusCode: '500',error: 'Internal Server Error' })
    }
    
}

export async function aprovarReembolso(req: Request, res: Response) {
    const {id} = uuidParamSchema.parse(req.params);    
    const loggedUser = getUsuarioLogado(req);
    const reembolso = await prisma.solicitacaoReembolso.findUnique({ where: { id } });
    if (!id){
        return res.status(400).json({ message: 'ID inválido',statusCode: '400', error: 'Bad Request' });
    } 

    try{
        if (!reembolso){
       return res.status(404).json({ message: 'Reembolso não encontrado' ,statusCode: '404', error: 'Not Found'}); 
    }     

    if(loggedUser.perfil !== 'ADMIN'){

        if (reembolso.status !== 'ENVIADO'){
            return res.status(400).json({ message: 'Apenas reembolsos ENVIADOS podem ser aprovados' ,statusCode: '400', error: 'Bad Request'}); 
        } 

        if (loggedUser.perfil !== 'GESTOR'){
            return res.status(403).json({ message: 'Perfil inválido' ,statusCode: '400', error: 'Bad Request'}); 
        } 
        }

        const reembolsoAprovado = await prisma.solicitacaoReembolso.update({
            where: { id },
            data: {
                status: 'APROVADO',
                historicos: {
                    create: { acao: 'APPROVED',
                        usuarioId: loggedUser.id,
                        observacao: 'Reembolso aprovado por: '+loggedUser.nome
                        }
                }
            }
        });

        res.status(200).json(reembolsoAprovado);
    }catch(error){
        return res.status(500).json({message: 'Erro no servidor',statusCode: '500',error: 'Internal Server Error' })
    }
    
}

export async function rejeitarReembolso(req: Request, res: Response) {
    const {id} = uuidParamSchema.parse(req.params);     
    const loggedUser = getUsuarioLogado(req);
    const { data, error } = rejeitarSolicitacaoSchema.safeParse(req.body);
    if (!id){
        return res.status(400).json({ message: 'ID inválido',statusCode: '400', error: 'Bad Request' });
    } 
    if (error){
        return res.status(400).json({message:z.treeifyError(error).properties,statusCode: '400', error: 'Bad Request' });
    } 

    try{
        const reembolso = await prisma.solicitacaoReembolso.findUnique({ where: { id } });

        if (!reembolso){
            return res.status(404).json({ message: 'Reembolso não encontrado' ,statusCode: '404', error: 'Not Found'});
        } 

        if(loggedUser.perfil !== 'ADMIN'){

            if (reembolso.status !== 'ENVIADO'){
                return res.status(400).json({ message: 'Apenas reembolsos com o status "ENVIADO" e com justificativa podem ser rejeitados' ,statusCode: '400', error: 'Bad Request'});
            }

            if (loggedUser.perfil !== 'GESTOR'){
                return res.status(403).json({ message: 'Perfil inválido' ,statusCode: '403', error: 'Forbidden'});
            }
        }
    
        
        

        const reembolsoRejeitado = await prisma.solicitacaoReembolso.update({
            where: { id },
            data: {
                status: 'REJEITADO',
                historicos: {
                    create: { 
                        acao: 'REJECTED', 
                        usuarioId: loggedUser.id, 
                        observacao: 'Reembolso rejeitado por: '+loggedUser.nome
                    }
                }
            }
        });

        res.status(200).json(reembolsoRejeitado);
    }catch(error){
        return res.status(500).json({message: 'Erro no servidor',statusCode: '500',error: 'Internal Server Error' })
    }
    
}

export async function cancelarReembolso(req: Request, res: Response){
    const {id} = uuidParamSchema.parse(req.params);    
    const loggedUser = getUsuarioLogado(req);
    const reembolso = await prisma.solicitacaoReembolso.findUnique({ where: { id } });

    if (!id){
        return res.status(400).json({ message: 'ID inválido',statusCode: '400', error: 'Bad Request' });
    } 

    try{
        if (!reembolso){
       return res.status(404).json({ message: 'Reembolso não encontrado' ,statusCode: '404', error: 'Not Found'}); 
        } 
        
        if(loggedUser.perfil !== 'ADMIN'){

            if (reembolso.status !== 'RASCUNHO'){
                return res.status(400).json({ message: 'Apenas reembolsos em RASCUNHO podem ser cancelados' ,statusCode: '400', error: 'Bad Request'});
            } 

            if(loggedUser.perfil !== 'COLABORADOR'){
                return res.status(403).json({message: 'Perfil inválido', statusCode: '403', error:'Forbidden'})
            }
        }

        const reembolsoCancelado = await prisma.solicitacaoReembolso.update({
            where: { id },
            data: {
                status: 'CANCELADO',
                historicos: {
                    create: { acao: 'CANCELED',
                        usuarioId: loggedUser.id,
                        observacao: 'Reembolso marcado como cancelado por: '+loggedUser.nome

                        }
                }
            }
        });

        res.status(200).json(reembolsoCancelado);
    }catch(error){
        return res.status(500).json({message: 'Erro no servidor',statusCode: '500',error: 'Internal Server Error' })
    }
    
}




export async function pagarReembolso(req: Request, res: Response) {
    const {id} = uuidParamSchema.parse(req.params);    
    const loggedUser = getUsuarioLogado(req);
    const reembolso = await prisma.solicitacaoReembolso.findUnique({ where: { id } });

    if (!id){
        return res.status(400).json({ message: 'ID inválido',statusCode: '400', error: 'Bad Request' });
    } 

    try{
        if (!reembolso){
            return res.status(404).json({ message: 'Reembolso não encontrado' ,statusCode: '404', error: 'Not Found'}); 
        } 
        
        if(loggedUser.perfil !== 'ADMIN'){

            if (reembolso.status !== 'APROVADO'){
                return res.status(400).json({ message: 'Apenas reembolsos APROVADOS podem ser pagos' ,statusCode: '400', error: 'Bad Request'});
            } 

            if(loggedUser.perfil !== 'FINANCEIRO'){
                return res.status(403).json({message: 'Perfil inválido', statusCode: '403', error:'Forbidden'})
            }
        }

        const reembolsoPago = await prisma.solicitacaoReembolso.update({
            where: { id },
            data: {
                status: 'PAGO',
                historicos: {
                    create: { acao: 'PAID',
                        usuarioId: loggedUser.id,
                        observacao: 'Reembolso marcado como pago por: '+loggedUser.nome

                        }
                }
            }
        });

        res.status(200).json(reembolsoPago);
    }catch(error){
        return res.status(500).json({message: 'Erro no servidor',statusCode: '500',error: 'Internal Server Error' })
    }
    
}

export async function editarReembolso(req: Request, res: Response) {
    const {id} = uuidParamSchema.parse(req.params);     
    const loggedUser = getUsuarioLogado(req);
    if (!id){
        return res.status(400).json({ message: 'ID inválido',statusCode: '400', error: 'Bad Request'  });
    } 

    const { data, error } = solicitacaoReembolsoSchema.safeParse(req.body);

    if (error) {
        return res.status(400).json({message:z.treeifyError(error).properties,statusCode: '400', error: 'Bad Request' });
    }

    try{
        const reembolso = await prisma.solicitacaoReembolso.findUnique({ where: { id } });

        if (!reembolso){
        return res.status(404).json({ message: 'Reembolso não encontrado' ,statusCode: '404', error: 'Not Found'}); 
        } 

        if(loggedUser.perfil !== 'ADMIN'){

            if (reembolso.solicitanteId !== loggedUser.id) {
            return res.status(403).json({ message: 'Você só pode editar suas próprias solicitações' ,statusCode: '403', error: 'Forbidden'});
            }

            if (reembolso.status !== 'RASCUNHO') {
                return res.status(400).json({ message: 'Apenas solicitações em rascunho ou rejeitadas podem ser editadas' ,statusCode: '400', error: 'Bad Request'});
            }
        }
        
        

        const reembolsoAtualizado = await prisma.solicitacaoReembolso.update({
            where: { id },
            data: {
                ...data,
                dataDespesa:dayjs(data.dataDespesa).toISOString(),
                historicos: {
                    create: { acao: 'UPDATED', 
                        usuarioId: loggedUser.id,
                        observacao: 'Reembolso atualizado por: '+loggedUser.nome
                    }
                }
            }
        });

        res.status(200).json(reembolsoAtualizado);
    }catch(error){
        return res.status(500).json({message: 'Erro no servidor',statusCode: '500',error: 'Internal Server Error' })
    }
    
}

export async function listarHistoricoReembolso(req: Request, res: Response) {
    const {id} = uuidParamSchema.parse(req.params);  

    if (!id){
       return res.status(400).json({ message: 'ID inválido' ,statusCode: '400', error: 'Bad Request'});
    } 

    try{
        const reembolso = await prisma.solicitacaoReembolso.findUnique({ where: { id } });
        if (!reembolso){
        return res.status(404).json({ message: 'Reembolso não encontrado' ,statusCode: '404', error: 'Not Found'});
    
        } 
        const historicos = await prisma.historicoSolicitacao.findMany({
            where: { solicitacaoId: id },
            include: { 
                usuario: { select: { nome: true, perfil: true } } 
            },
            orderBy: { criadoEm: 'desc' }
        });

        res.status(200).json(historicos);
    }catch(error){
        return res.status(500).json({message: 'Erro no servidor',statusCode: '500',error: 'Internal Server Error' })
    }
    
}

export async function listarAnexosReembolso(req: Request, res: Response) {
    const {id} = uuidParamSchema.parse(req.params);  

    if (!id){
      return res.status(400).json({ message: 'ID inválido',statusCode: '400', error: 'Bad Request'});  
    } 

    try{
        const anexos = await prisma.anexo.findMany({
        where: { solicitacaoId: id }
        });

        res.status(200).json(anexos);
    }catch(error){
        return res.status(500).json({message: 'Erro no servidor',statusCode: '500',error: 'Internal Server Error' })
    }
    
}

export async function uploadAnexoReembolso(req: Request, res: Response) {
    const {id} = uuidParamSchema.parse(req.params);  
    const loggedUser = getUsuarioLogado(req);
    

    if (!id){
      return res.status(400).json({ message: 'ID inválido' ,statusCode: '400', error: 'Bad Request'});  
    } 
    
    const { nomeArquivo, url,tipoArquivo } = req.body; 

    if (!nomeArquivo || !url) {
        return res.status(400).json({ message: 'Nome do arquivo e URL são obrigatórios' ,statusCode: '400', error: 'Bad Request'});
    }

    try{
        const reembolso = await prisma.solicitacaoReembolso.findUnique({ where: { id } });
    
        if (!reembolso){
        return res.status(404).json({ message: 'Reembolso não encontrado' ,statusCode: '404',error: 'Not Found'});  
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
                usuarioId: loggedUser.id,
                observacao: 'Anexo criado por: '+loggedUser.nome           
            }
        });

        res.status(201).json(anexo);
    }catch(error){
        return res.status(500).json({message: 'Erro no servidor',statusCode: '500',error: 'Internal Server Error' })
    }
    
}