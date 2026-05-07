import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '../../api/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-toastify';
import pitangLogo from '@/assets/pitang.png';

const loginSchema = z.object({
  email: z.string(({ message: 'E-mail inválido.' })),
  senha: z.string().min(6, { message: 'A senha deve ter no mínimo 6 caracteres.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setLoading(true);
      const response = await api.post('/login', data);
      const { token } = response.data;      
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user = {
        id: payload.id,
        email: payload.email,
        perfil: payload.perfil,
        nome: payload.nome || payload.email.split('@')[0] 
      };

      login(token, user);
      toast.success('Login efetuado com sucesso!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            <img src={pitangLogo} alt="Pitang" className="h-14 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Acesse o sistema de Controle de Solicitações de Reembolso
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
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
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Não tem uma conta? <Link to="/cadastro" className="text-primary hover:underline">Cadastre-se</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}