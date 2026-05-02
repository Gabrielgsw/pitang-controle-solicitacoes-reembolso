import z from "zod";

const PerfilEnum = z.enum(["COLABORADOR", "GESTOR", "FINANCEIRO", "ADMIN"]);

export const usuarioSchema = z.object({
    nome: z.string().min(1),
    email: z.string(),
    senha: z.string().min(6),
    perfil: PerfilEnum,
});

export const loginSchema = z.object({
    email: z.string(),
    senha: z.string().min(1),
});

export const categoriaSchema = z.object({
    nome: z.string().min(1),
    ativo: z.boolean().optional(),
});

export const solicitacaoReembolsoSchema = z.object({
    categoriaId: z.number().int().positive(),
    descricao: z.string().min(1),
    valor: z.number().positive(),
    dataDespesa: z.coerce.date(),
});

export const rejeitarSolicitacaoSchema = z.object({
    justificativaRejeicao: z.string().min(1),
});