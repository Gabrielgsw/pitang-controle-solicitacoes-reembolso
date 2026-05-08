import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../../api/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, ArrowLeft, Users } from 'lucide-react';

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

export function Usuarios() {
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [filterPerfil, setFilterPerfil] = useState('ALL');

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [metadados, setMetadados] = useState<{ total: number; page: number; totalPages: number } | null>(null);

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
      setPaginaAtual(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset de página ao mudar filtros
  useEffect(() => {
    setPaginaAtual(1);
  }, [filterPerfil]);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/users', {
          params: {
            page: paginaAtual,
            limit: 10,
            search: searchDebounced || undefined,
            perfil: filterPerfil !== 'ALL' ? filterPerfil : undefined,
          },
        });
        // Suporte a resposta paginada ({ data, meta }) ou array simples
        if (Array.isArray(response.data)) {
          setUsuarios(response.data);
          setMetadados(null);
        } else {
          setUsuarios(response.data.data);
          setMetadados(response.data.meta);
        }
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsuarios();
  }, [paginaAtual, searchDebounced, filterPerfil]);

  // Filtragem local (fallback quando API não filtra)
  const displayUsuarios = usuarios.filter((u) => {
    if (filterPerfil !== 'ALL' && u.perfil !== filterPerfil) return false;
    if (searchDebounced && !u.nome.toLowerCase().includes(searchDebounced.toLowerCase()) &&
        !u.email.toLowerCase().includes(searchDebounced.toLowerCase())) return false;
    return true;
  });

  const filters = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 border rounded-lg shadow-sm">
      <div>
        <p className="text-sm text-muted-foreground mb-1.5 font-medium">Perfil</p>
        <Select value={filterPerfil} onValueChange={setFilterPerfil}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtrar por Perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os Perfis</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="GESTOR">Gestor</SelectItem>
            <SelectItem value="FINANCEIRO">Financeiro</SelectItem>
            <SelectItem value="COLABORADOR">Colaborador</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1.5 font-medium">Buscar</p>
        <Input
          placeholder="Nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) return <div className="text-center p-8">Carregando usuários...</div>;
    if (error) return <div className="text-center p-8 text-destructive">Erro ao carregar usuários. O backend pode estar offline.</div>;

    if (displayUsuarios.length === 0) return (
      <div className="space-y-4">
        {filters}
        <div className="text-center p-12 border-2 border-dashed rounded-lg bg-gray-50">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nenhum usuário encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">Tente ajustar os filtros de busca.</p>
        </div>
      </div>
    );

    return (
      <div className="space-y-4">
        {filters}
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayUsuarios.map((usuario) => (
                <TableRow key={usuario.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium">{usuario.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{usuario.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={perfilColorMap[usuario.perfil] || 'bg-gray-100 text-gray-800'}>
                      {usuario.perfil}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {usuario.apagado
                      ? <Badge variant="secondary" className="bg-gray-100 text-gray-500">Inativo</Badge>
                      : <Badge variant="secondary" className="bg-green-100 text-green-700">Ativo</Badge>
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/usuarios/${usuario.id}`}>
                      <Button variant="ghost" size="sm">Ver / Editar</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {metadados && metadados.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Página <span className="font-medium">{metadados.page}</span> de{' '}
              <span className="font-medium">{metadados.totalPages}</span>
              {' '}· {metadados.total} usuários no total
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} disabled={paginaAtual === 1}>
                ← Anterior
              </Button>
              {Array.from({ length: metadados.totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === metadados.totalPages || Math.abs(page - paginaAtual) <= 1)
                .reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
                  if (idx > 0 && page - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis'
                    ? <span key={`e-${idx}`} className="px-2 text-muted-foreground">...</span>
                    : <Button key={item} variant={paginaAtual === item ? 'default' : 'outline'} size="sm" className="w-9" onClick={() => setPaginaAtual(item as number)}>{item}</Button>
                )}
              <Button variant="outline" size="sm" onClick={() => setPaginaAtual(p => Math.min(metadados.totalPages, p + 1))} disabled={paginaAtual === metadados.totalPages}>
                Próxima →
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b gap-4">
          <div>
            <h1 className="text-3xl font-bold text-pitang-graphite">Gerenciar Usuários</h1>
            <p className="text-muted-foreground mt-1">Visualize, edite e gerencie os usuários do sistema.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <Link to="/usuarios/novo">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </Link>
          </div>
        </header>

        <section>{renderContent()}</section>
      </div>
    </div>
  );
}
