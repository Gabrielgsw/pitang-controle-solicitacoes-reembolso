import bcrypt from 'bcryptjs';
import { prisma } from '../src/core/PrismaClient';
import { Perfil } from '../src/generated/prisma/enums';



function hashPassword(password: string) {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
}

const usuarios = [
    {
        nome: 'João Carlos',
        email: 'admin@pitang.com',
        senha: hashPassword('pitang123'),
        perfil: Perfil.ADMIN,
    },
    {
        nome: 'Gabriel Germano',
        email: 'gabriel.germano@pitang.com',
        senha: hashPassword('pitang123'),
        perfil: Perfil.COLABORADOR,
    },
    {
        nome: 'Maria Santos',
        email: 'gestor@pitang.com',
        senha: hashPassword('pitang123'),
        perfil: Perfil.GESTOR,
    },
    {
        nome: 'João Pedro',
        email: 'financeiro@pitang.com',
        senha: hashPassword('pitang123'),
        perfil: Perfil.FINANCEIRO,
    },
];

const categorias = [
    { nome: 'Hospedagem' },
    { nome: 'Alimentação' },
    { nome: 'Transporte' },
];

async function main() {
    console.log('Iniciando seed de usuários...');

    for (const usuario of usuarios) {
        const existing = await prisma.usuario.findUnique({
            where: { email: usuario.email },
        });

        if (existing) {
            console.log(`Usuário ${usuario.email} já existe, pulando...`);
            continue;
        }

        await prisma.usuario.create({ data: usuario });
        console.log(`Usuário ${usuario.email} criado`);
    }

    console.log('Iniciando seed de categorias...');

    for (const categoria of categorias) {
        const existing = await prisma.categoria.findFirst({
            where: { nome: categoria.nome },
        });

        if (existing) {
            console.log(`Categoria ${categoria.nome} já existe, pulando...`);
            continue;
        }

        await prisma.categoria.create({ data: categoria });
        console.log(`Categoria ${categoria.nome} criada`);
    }

    console.log('Seed concluído');
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());