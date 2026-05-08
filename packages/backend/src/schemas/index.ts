import z, { optional } from "zod";
import dayjs from 'dayjs';
const PerfilEnum = z.enum(["COLABORADOR", "GESTOR", "FINANCEIRO", "ADMIN"]);
export const StatusReembolsoEnum = z.enum(["RASCUNHO", "ENVIADO", "APROVADO", "REJEITADO", "PAGO"]);
const TipoArquivoEnum = z.enum(["PDF","PNG","JPG"]);

export const usuarioSchema = z.object({
    nome: z.string().min(1),
    email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    tokenVerificacao: z.string().optional(),
    senha: z.string().min(6),
    perfil: PerfilEnum,
    apagado: z.boolean()
});

export const loginSchema = z.object({
    email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
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
    dataDespesa: z.string().refine((data) => dayjs(data).isValid(), {
        message: "Data inválida",
    }).refine((data) => !dayjs(data).isAfter(dayjs()), {
        message: "A data da despesa não pode ser no futuro",
    })
});

export const anexoSchema = z.object({
    solicitacaoId: z.string().uuid(),
    nomeArquivo: z.string(),
    urlArquivo: z.string(),
    tipoArquivo: TipoArquivoEnum
});

export const rejeitarSolicitacaoSchema = z.object({
    justificativaRejeicao: z.string().min(1),
});



export const idCategoriaParamSchema = z.object({
    id: z.coerce.number().int().positive({ message: "O ID deve ser um número positivo" })
});

export const uuidParamSchema = z.object({
    id: z.string().uuid({ message: "Formato de ID inválido. Esperado um UUID." })
});

export const paginacaoQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
});

export const listarReembolsosQuerySchema = paginacaoQuerySchema.extend({
  status: StatusReembolsoEnum.optional(),
  categoriaId: z.string().optional(), 
  search: z.string().optional(),      
  sort: z.enum(['asc', 'desc']).optional().default('desc') 
});