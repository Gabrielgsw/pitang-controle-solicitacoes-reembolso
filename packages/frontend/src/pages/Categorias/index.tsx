import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ArrowLeft, PlusCircle, Edit } from 'lucide-react';

interface Categoria {
  id: number;
  nome: string;
  ativo: boolean;
}

export function Categorias() {
  const navigate = useNavigate();
  const [data, setData] = useState<Categoria[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await api.get<Categoria[]>('/categories');
      console.log(response)
      setData(response.data);
    } catch (err: any) {
      setError(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Categoria | null>(null);
  const [nome, setNome] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleOpenModal = (cat?: Categoria) => {
    if (cat) {
      setEditingCat(cat);
      setNome(cat.nome);
      setAtivo(cat.ativo);
    } else {
      setEditingCat(null);
      setNome('');
      setAtivo(true);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      toast.warning('O nome da categoria é obrigatório.');
      return;
    }

    try {
      setLoading(true);
      if (editingCat) {
        await api.put(`/categories/${editingCat.id}`, { nome, ativo });
        toast.success('Categoria atualizada com sucesso!');
      } else {
        await api.post('/categories', { nome, ativo });
        toast.success('Categoria criada com sucesso!');
      }
      fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar categoria.');
    } finally {
      setLoading(false);
    }
  };

  if (error) return <div className="p-8 text-center text-destructive">Erro ao carregar categorias.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex justify-between items-center pb-6 border-b">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')} className="px-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-pitang-graphite">Categorias</h1>
              <p className="text-muted-foreground mt-1">Gerenciamento de categorias do sistema</p>
            </div>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Nova Categoria
          </Button>
        </header>

        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!data ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">Carregando...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhuma categoria encontrada.</TableCell>
                </TableRow>
              ) : (
                data.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.nome}</TableCell>
                    <TableCell>
                      <Badge variant={cat.ativo ? "default" : "secondary"} className={cat.ativo ? "bg-pitang-green" : "bg-gray-300 text-gray-700"}>
                        {cat.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(cat)}>
                        <Edit className="h-4 w-4 mr-1" /> Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCat ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
              <DialogDescription>
                Informe o nome da categoria e se ela está ativa para novas solicitações.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input 
                  id="nome" 
                  value={nome} 
                  onChange={(e) => setNome(e.target.value)} 
                  placeholder="Ex: Transporte, Alimentação..."
                />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id="ativo" 
                  checked={ativo} 
                  onChange={(e) => setAtivo(e.target.checked)} 
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                />
                <Label htmlFor="ativo" className="cursor-pointer">Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
