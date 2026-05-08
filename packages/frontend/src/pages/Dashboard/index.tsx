import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, FileText, Settings, Users } from 'lucide-react';
import dayjs from 'dayjs';

interface Reimbursement {
  id: string;
  descricao: string;
  valor: number;
  dataDespesa: string;
  status: 'RASCUNHO' | 'ENVIADO' | 'APROVADO' | 'REJEITADO' | 'PAGO' | 'CANCELADO';
  categoriaId: string;
  categoria?: { nome: string };
  usuario?: { nome: string; email: string };
}

const statusColorMap: Record<string, string> = {
  RASCUNHO: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  ENVIADO: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  APROVADO: 'bg-green-100 text-green-800 hover:bg-green-200',
  REJEITADO: 'bg-red-100 text-red-800 hover:bg-red-200',
  PAGO: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  CANCELADO: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
};

export function Dashboard() {
  const { user, logout } = useAuth();
   
  const [data, setData] = useState<Reimbursement[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [dados, setDados] = useState([]);    
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCategoria, setFilterCategoria] = useState<string>('ALL');
  const [searchColaborador, setSearchColaborador] = useState<string>('');
  const [searchDebounced, setSearchDebounced] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>([]);
  const [metadados, setMetadados] = useState<{ total: number; page: number; totalPages: number } | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await api.get<Reimbursement[]>('/reimbursements', {
          params: {
            page: paginaAtual,
            //limit:             
            status: filterStatus !== 'ALL' ? filterStatus : undefined,
            categoriaId: filterCategoria !== 'ALL' ? filterCategoria : undefined,
            search: searchDebounced || undefined,
            sort: sortOrder
          }
        });
        setData(response.data.data);
        setMetadados(response.data.meta);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    
    if (user?.perfil === 'ADMIN') {
      api.get('/categories').then(res => setCategorias(res.data)).catch(console.error);
    }
  }, [user?.perfil, paginaAtual, filterStatus, filterCategoria, searchDebounced, sortOrder]);

  useEffect(() => {
      const timer = setTimeout(() => {
        setSearchDebounced(searchColaborador);
        setPaginaAtual(1); 
      }, 500);

      return () => clearTimeout(timer);
    }, [searchColaborador]);
  

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const renderContent = () => {
  if (isLoading) return <div className="text-center p-8">Carregando solicitações...</div>;
  if (error) return <div className="text-center p-8 text-destructive">Erro ao carregar solicitações. O backend pode estar offline.</div>;

 
  const filters = user?.perfil === 'ADMIN' ? (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 border rounded-lg shadow-sm">
      <div>
        <p className="text-sm text-muted-foreground mb-1.5 font-medium">Status</p>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtrar por Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os Status</SelectItem>
            <SelectItem value="RASCUNHO">Rascunho</SelectItem>
            <SelectItem value="ENVIADO">Enviado</SelectItem>
            <SelectItem value="APROVADO">Aprovado</SelectItem>
            <SelectItem value="REJEITADO">Rejeitado</SelectItem>
            <SelectItem value="PAGO">Pago</SelectItem>
            <SelectItem value="CANCELADO">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1.5 font-medium">Categoria</p>
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtrar por Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas as Categorias</SelectItem>
            {categorias.map(cat => (
              <SelectItem key={cat.id} value={cat.id.toString()}>{cat.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1.5 font-medium">Colaborador</p>
        <Input
          placeholder="Buscar por nome..."
          value={searchColaborador}
          onChange={(e) => setSearchColaborador(e.target.value)}
        />
      </div>
    </div>
  ) : null;

  
  if (!data || data.length === 0) return (
    <div className="space-y-4">
      {filters}
      <div className="text-center p-12 border-2 border-dashed rounded-lg bg-gray-50">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Nenhuma solicitação encontrada</h3>
        <p className="mt-1 text-sm text-gray-500">
          {user?.perfil === 'COLABORADOR'
            ? 'Você ainda não criou nenhuma solicitação de reembolso.'
            : 'Não há solicitações disponíveis para a sua análise no momento.'}
        </p>
        {user?.perfil === 'COLABORADOR' && (
          <div className="mt-6">
            <Link to="/solicitacao/nova">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Solicitação
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

    const filteredData = data.filter(item => {
      if (user?.perfil !== 'ADMIN') return true;
      if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
      if (filterCategoria !== 'ALL' && item.categoriaId?.toString() !== filterCategoria) return false;
      if (searchColaborador && !item.usuario?.nome?.toLowerCase().includes(searchColaborador.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.dataDespesa).getTime();
      const dateB = new Date(b.dataDespesa).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    const totalsByStatus: Record<string, { count: number; total: number }> = {};

    filteredData.forEach(item => {
      const status = item.status;
      const valorNumerico = Number(item.valor) || 0;
      
      if (!totalsByStatus[status]) {
        totalsByStatus[status] = { count: 0, total: 0 };
      }
      
      totalsByStatus[status].count += 1;
      totalsByStatus[status].total += valorNumerico;
    });

    return (
      <div className="space-y-4">
        {filters}
        
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Descrição</TableHead>
              <TableHead>Data da Despesa</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id} className="hover:bg-gray-50/50">
                <TableCell>
                  <div className="font-medium">{item.descricao}</div>
                  {user?.perfil === 'ADMIN' && item.usuario && (
                    <div className="text-xs text-muted-foreground mt-1">Por: {item.usuario.nome}</div>
                  )}
                </TableCell>
                <TableCell>{dayjs(item.dataDespesa).format('DD/MM/YYYY')}</TableCell>
                <TableCell>{formatCurrency(item.valor)}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusColorMap[item.status] || 'bg-gray-100 text-gray-800'}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link to={`/solicitacao/${item.id}`}>
                    <Button variant="ghost" size="sm">Ver detalhes</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {filteredData.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  Nenhuma solicitação encontrada para os filtros aplicados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Totals by Status */}
      {Object.keys(totalsByStatus).length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-pitang-graphite">Totalização por Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(totalsByStatus).map(([status, stats]) => (
              <div key={status} className="bg-white p-4 border rounded-lg shadow-sm flex flex-col items-center justify-center text-center">
                <Badge variant="secondary" className={statusColorMap[status] || 'bg-gray-100 text-gray-800'}>
                  {status}
                </Badge>
                <span className="text-2xl font-bold mt-3">{stats.count}</span>
                <span className="text-sm font-medium text-muted-foreground mt-1">{formatCurrency(stats.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )};

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b gap-4">
          <div>
            <h1 className="text-3xl font-bold text-pitang-graphite">Painel de Reembolsos</h1>
            <p className="text-muted-foreground mt-1">
              Olá, <span className="font-semibold">{user?.nome}</span>. Perfil: <Badge variant="outline">{user?.perfil}</Badge>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user?.perfil === 'COLABORADOR' && (
              <Link to="/solicitacao/nova">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nova Solicitação
                </Button>
              </Link>
            )}
            {user?.perfil === 'ADMIN' && (
              <Link to="/usuarios">
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Usuários
              </Button>
            </Link>)}
             {user?.perfil === 'ADMIN' && (
              <Link to="/categorias">
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Categorias
                </Button>
              </Link>
            )}
            <Button variant="destructive" onClick={logout}>
              Sair
            </Button>
          </div>
        </header>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {user?.perfil === 'COLABORADOR' ? 'Minhas Solicitações' 
               : user?.perfil === 'GESTOR' ? 'Solicitações para Análise'
               : user?.perfil === 'FINANCEIRO' ? 'Solicitações para Pagamento'
               : 'Todas as Solicitações'}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground hidden md:inline">Ordenar:</span>
              <Select value={sortOrder} onValueChange={(v: 'desc' | 'asc') => setSortOrder(v)}>
                <SelectTrigger className="w-40 bg-white">
                  <SelectValue placeholder="Ordenar por data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Mais recentes</SelectItem>
                  <SelectItem value="asc">Mais antigas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {renderContent()}
          {/* Paginação */}
          {metadados && metadados.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Página <span className="font-medium">{metadados.page}</span> de{' '}
                <span className="font-medium">{metadados.totalPages}</span>
                {' '}· {metadados.total} itens no total
              </p>

              <div className="flex items-center gap-1">
                {/* Botão Anterior */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                >
                  ← Anterior
                </Button>

                {/* Números de página */}
                {Array.from({ length: metadados.totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    
                    return (
                      page === 1 ||
                      page === metadados.totalPages ||
                      Math.abs(page - paginaAtual) <= 1
                    );
                  })
                  .reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
                    if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                      acc.push('ellipsis');
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={item}
                        variant={paginaAtual === item ? 'default' : 'outline'}
                        size="sm"
                        className="w-9"
                        onClick={() => setPaginaAtual(item as number)}
                      >
                        {item}
                      </Button>
                    )
                  )}

                {/* Botão Próxima */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaAtual(p => Math.min(metadados.totalPages, p + 1))}
                  disabled={paginaAtual === metadados.totalPages}
                >
                  Próxima →
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}