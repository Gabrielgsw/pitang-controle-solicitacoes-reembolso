import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../api/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-toastify';

const registerSchema = z.object({
  nome: z.string().min(3, { message: 'O nome deve ter no mínimo 3 caracteres.' }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  senha: z.string().min(6, { message: 'A senha deve ter no mínimo 6 caracteres.' }),
  perfil: z.enum(['COLABORADOR', 'GESTOR', 'FINANCEIRO', 'ADMIN']),
  apagado: z.boolean().default(false)
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function Cadastro() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      perfil: 'COLABORADOR',
      apagado: false
    }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setLoading(true);
      
      await api.post('/users', data);

      toast.success('Cadastro realizado com sucesso! Faça login para continuar.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Cadastro</CardTitle>
          <CardDescription className="text-center">
            Crie sua conta para acessar o sistema
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input 
                id="nome" 
                placeholder="Seu nome" 
                {...register('nome')}
              />
              {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail corporativo</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nome@pitang.com" 
                {...register('email')}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input 
                id="senha" 
                type="password" 
                placeholder="******" 
                {...register('senha')}
              />
              {errors.senha && <p className="text-sm text-destructive">{errors.senha.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Já tem uma conta? <Link to="/login" className="text-primary hover:underline">Faça login</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
