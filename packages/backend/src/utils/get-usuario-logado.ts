import type { Usuario } from "../generated/prisma/client";
import type {Request} from 'express';

interface AuthenticatedRequest extends Request {
    usuarioLogado: Usuario;
}

export function getUsuarioLogado(req: Request){
    return (req as AuthenticatedRequest).usuarioLogado;
}