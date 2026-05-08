import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../../api/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Trash2, UserCheck, AlertTriangle } from 'lucide-react';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'ADMIN' | 'GESTOR' | 'FINANCEIRO' | 'COLABORADOR';
  apagado: boolean;
}

const perfilColorMap: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  GESTOR: 'bg-blue-100 text-blue-800',
  FINANCEIRO: 'bg-yellow-100 text-yellow-800',
  COLABORADOR: 'bg-green-100 text-green-800',
};

export function UsuarioDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Form state
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState('');
  const [senha, setSenha] = useState('');

    

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/users/${id}`);
        const u: Usuario = response.data;
        setUsuario(u);
        setNome(u.nome);
        setEmail(u.email);
        setPerfil(u.perfil);
      } catch (err: any) {
        setError('Usuário não encontrado ou erro ao carregar.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsuario();
  }, [id]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMsg(null);

      const payload: Record<string, string> = { nome, email, perfil };
      if (senha) payload.senha = senha;

      const response = await api.put(`/users/${id}`, payload);
      setUsuario(response.data);
      setSenha('');
      setSuccessMsg('Usuário atualizado com sucesso!');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao salvar alterações.');
    } finally {
      setIsSaving(false);
    }
  };

    const handleReativar = async () => {
        try {
            setIsSaving(true);
            setError(null);
            const response = await api.put(`/users/${id}`, { apagado: false });
            setUsuario(response.data);
            setSuccessMsg('Usuário reativado com sucesso!');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Erro ao reativar usuário.');
        } finally {
            setIsSaving(false);
        }
    };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await api.delete(`/users/${id}`);
      navigate('/usuarios', { state: { deletedSuccess: true } });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao desativar usuário.');
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-muted-foreground">Carregando usuário...</p>
    </div>
  );

  if (!usuario && !isLoading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <p className="text-destructive text-lg">Usuário não encontrado.</p>
      <Link to="/usuarios"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button></Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b gap-4">
          <div>
            <h1 className="text-3xl font-bold text-pitang-graphite">Editar Usuário</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              {usuario?.apagado
                ? <Badge variant="secondary" className="bg-gray-100 text-gray-500">Inativo</Badge>
                : <Badge variant="secondary" className="bg-green-100 text-green-700">Ativo</Badge>
              }
              <Badge variant="secondary" className={perfilColorMap[usuario?.perfil ?? ''] || 'bg-gray-100'}>
                {usuario?.perfil}
              </Badge>
            </p>
          </div>
          <Link to="/usuarios">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </header>

        {/* Feedback */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <UserCheck className="h-4 w-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Form */}
        <div className="bg-white border rounded-lg shadow-sm p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Nome</label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)}  />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">E-mail</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}  />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Perfil</label>
            <Select value={perfil} onValueChange={setPerfil} >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="GESTOR">Gestor</SelectItem>
                <SelectItem value="FINANCEIRO">Financeiro</SelectItem>
                <SelectItem value="COLABORADOR">Colaborador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Nova Senha <span className="text-xs text-gray-400">(deixe em branco para não alterar)</span>
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          {/* Soft Delete / Reativar */}
          {!usuario?.apagado ? (
            !showConfirmDelete ? (
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                onClick={() => setShowConfirmDelete(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Desativar Usuário
              </Button>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg flex-1">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <span className="text-sm text-red-700 flex-1">Confirmar desativação?</span>
                <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Desativando...' : 'Sim, desativar'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowConfirmDelete(false)}>
                  Cancelar
                </Button>
              </div>
            )
          ) : (
            <Button
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                onClick={handleReativar}
                disabled={isSaving}
            >
                <UserCheck className="mr-2 h-4 w-4" />
                {isSaving ? 'Reativando...' : 'Reativar Usuário'}
            </Button>
          )}

          {/* Salvar */}
          <Button onClick={handleSave} disabled={isSaving} className="sm:ml-auto">
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
        </div>
      </div>
    </div>
  );
}
