import type { Request, Response, NextFunction } from 'express';
import { getUsuarioLogado } from '../../utils/get-usuario-logado';

export function roleMiddleware(perfisPermitidos: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const usuario = getUsuarioLogado(req);

        if (!usuario || !usuario.perfil) {
            return res.status(401).json({ message: 'Usuário não identificado' });
        }

        if (!perfisPermitidos.includes(usuario.perfil)) {
            return res.status(403).json({ message: 'Acesso negado: seu perfil não tem permissão para esta ação' });
        }

        next();
    };
}