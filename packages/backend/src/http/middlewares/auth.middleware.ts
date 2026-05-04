import jsonwebtoken from 'jsonwebtoken';
import {environment} from '../../core/EnvVars'
import type {NextFunction, Request, Response } from 'express';

const allowedPaths = {
    GET: [],
    POST: ['/auth/login', '/users'],
    PUT: [],
} as const;


export function authMiddleware(req: Request,res: Response, next: NextFunction){

    const paths: readonly string[] = allowedPaths[req.method as keyof typeof allowedPaths] ?? [];
    
    if (paths.includes(req.path)) {
        return next();
    }

    const { headers: { authorization } } = req;

    if (!authorization) {
        return res.status(401).json({ message: 'Autorização é necessária! ' });
    }

    const [, token = ''] = authorization.split(' ');

    try {
        req.usuarioLogado = jsonwebtoken.verify(token, environment.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ message: 'Não autorizado' });
    }

}


