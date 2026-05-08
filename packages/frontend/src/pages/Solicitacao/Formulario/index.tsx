import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../../api/api';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, X, UploadCloud } from 'lucide-react';

const solicitacaoSchema = z.object({
  descricao: z.string().min(5, { message: 'A descrição deve ter no mínimo 5 caracteres.' }),
  valor: z.coerce.number().positive({ message: 'O valor deve ser maior que zero.' }),
  dataDespesa: z.string()
    .nonempty({ message: 'A data da despesa é obrigatória.' })
    .refine((val) => {
      const data = new Date(val);
      return data.getFullYear() >= 2004;
    }, { message: 'A data não pode ser anterior a 2004.' })
    .refine((val) => {
      const data = new Date(val);
      const hoje = new Date();
      hoje.setHours(23, 59, 59, 999);
      return data <= hoje;
    }, { message: 'A data não pode ser uma data futura.' }),
  categoriaId: z.string().nonempty({ message: 'Selecione uma categoria.' }),
  
});

type SolicitacaoFormValues = z.infer<typeof solicitacaoSchema>;

interface Categoria {
  id: string;
  nome: string;
  ativo: boolean;
}

export function SolicitacaoForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [solicitacaoAtual, setSolicitacaoAtual] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
 const [cotacao, setCotacao] = useState<number | null>(null);
  const [moeda, setMoeda] = useState<'BRL' | 'USD' | 'ARS' | 'EUR' | 'CNY'>('BRL');
  const [loadingCambio, setLoadingCambio] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors }, reset, control } = useForm<SolicitacaoFormValues>({
    resolver: zodResolver(solicitacaoSchema) as any,    
    defaultValues: {
      descricao: '',
      valor: 0,
      dataDespesa: '',
      categoriaId: '' 
    }
  });

  const converterMoeda = async (valorOriginal: number) => {
    if (moeda === 'BRL' || !valorOriginal || isNaN(valorOriginal)) return;
    try {
      setLoadingCambio(true);
      const response = await axios.get(`https://economia.awesomeapi.com.br/json/last/${moeda}-BRL`);
      const chave = `${moeda}BRL`;
      const taxa = parseFloat(response.data[chave].bid);
      setCotacao(taxa);     
      setValue('valor', parseFloat((valorOriginal * taxa).toFixed(2)));    
      
    } catch (err) {
      toast.error('Erro ao buscar cotação.');
    } finally {
      setLoadingCambio(false);
    }
  };

  

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await api.get('/categories');
        setCategorias(res.data);
      } catch (err) {
        console.error('Erro ao buscar categorias', err);
      }
    };
    fetchCategorias();
  }, []);

  useEffect(() => {
    if (isEditing) {
      const fetchSolicitacao = async () => {
        try {
          const res = await api.get(`/reimbursements/${id}`);
          setSolicitacaoAtual(res.data);
          reset({
            descricao: res.data.descricao,
            valor: res.data.valor,
            dataDespesa: res.data.dataDespesa.split('T')[0], 
            categoriaId: res.data.categoriaId?.toString()
          });
        } catch (err) {
          console.error('Erro ao buscar solicitação', err);
        }
      };
      fetchSolicitacao();
    }
  }, [id, isEditing, reset]);

  const onSubmit = async (data: SolicitacaoFormValues) => {
    try {
      setLoading(true);
      let valorFinal = data.valor
      if (moeda !== 'BRL') {
      try {
        const response = await axios.get(`https://economia.awesomeapi.com.br/json/last/${moeda}-BRL`);
        const chave = `${moeda}BRL`;
        const taxa = parseFloat(response.data[chave].bid);
        setCotacao(taxa);
        valorFinal = parseFloat((data.valor * taxa).toFixed(2));
      } catch {
        toast.error('Erro ao buscar cotação. Tente novamente.');
        setLoading(false);
        return; 
      }
    }
      const payload = {
        ...data,
        valor: valorFinal,
        categoriaId: Number(data.categoriaId)
      };

      let currentSolicitacaoId = id; 
      
      
      if (isEditing) {
        await api.put(`/reimbursements/${currentSolicitacaoId}`, payload);
      } else {
        const response = await api.post('/reimbursements', payload);
        currentSolicitacaoId = response.data.id; 
      }

      
      if (selectedFile && currentSolicitacaoId) {
        const anexoPayload = {
          nome: 'comprovante.pdf',
          url: '/solicitacao_reembolso.pdf',
          nomeArquivo: 'comprovante.pdf', 
          urlArquivo: '/solicitacao_reembolso.pdf',       
          tipoArquivo: 'PDF'              
        };
        
        await api.post(`/reimbursements/${currentSolicitacaoId}/attachments`, anexoPayload);
      }

      toast.success(isEditing ? 'Solicitação atualizada com sucesso!' : 'Solicitação criada com sucesso!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar a solicitação.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{isEditing ? 'Editar Solicitação' : 'Nova Solicitação'}</CardTitle>
            <CardDescription>
              Preencha os dados da despesa para solicitar reembolso.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição da Despesa</Label>
                <Textarea
                  id="descricao"
                  placeholder="Ex: Almoço com cliente, Táxi para o aeroporto..."
                  {...register('descricao')}
                />
                {errors.descricao && <p className="text-sm text-destructive">{errors.descricao.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor</Label>
                <div className="flex gap-2">
                  <Select value={moeda} onValueChange={(v: 'BRL' | 'USD' | 'ARS' | 'EUR' | 'CNY') => {
                    setMoeda(v);
                    setCotacao(null);
                    
                  }}>
                    <SelectTrigger className="w-28 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">R$ BRL</SelectItem>
                      <SelectItem value="USD">$ USD</SelectItem>
                      <SelectItem value="EUR">€ EUR</SelectItem>
                      <SelectItem value="ARS">$ ARS</SelectItem>
                      <SelectItem value="CNY">¥ CNY</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('valor', {                      
                    })}
                  />
                </div>

                {/* Exibe a cotação usada */}
                {moeda !== 'BRL' && cotacao && (
                  <p className="text-xs text-muted-foreground">
                    Cotação: <span className="font-medium">1 {moeda} = R$ {cotacao.toFixed(4)}</span>
                    {loadingCambio && ' · Atualizando...'}
                  </p>
                )}
                {moeda !== 'BRL' && loadingCambio && !cotacao && (
                  <p className="text-xs text-muted-foreground">Buscando cotação...</p>
                )}

                {errors.valor && <p className="text-sm text-destructive">{errors.valor.message}</p>}
              </div>

                <div className="space-y-2">
                  <Label htmlFor="dataDespesa">Data da Despesa</Label>
                  <Input
                    id="dataDespesa"
                    type="date"
                    min="2004-01-01"
                    max={new Date().toISOString().split('T')[0]}
                    {...register('dataDespesa')}
                  />
                  {errors.dataDespesa && <p className="text-sm text-destructive">{errors.dataDespesa.message}</p>}
                </div>
             

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Controller
                  name="categoriaId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ? String(field.value) : undefined}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias?.filter(c => c.ativo).map(categoria => (
                          <SelectItem key={categoria.id} value={String(categoria.id)}>
                            {categoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoriaId && <p className="text-sm text-destructive">{errors.categoriaId.message}</p>}
              </div>

              <div className="space-y-2 pt-2">
                <Label>Comprovante (Opcional)</Label>
                
                {!selectedFile ? (
                  <div className="relative border-2 border-dashed border-gray-300 hover:border-primary bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg p-8 text-center cursor-pointer">
                    <Input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      accept=".pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <div className="bg-white p-3 rounded-full mb-3 shadow-sm border">
                        <UploadCloud className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-pitang-graphite">Clique para anexar um arquivo</span>
                      <span className="text-xs text-muted-foreground mt-1">Apenas arquivos PDF (Simulação)</span>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 space-y-4 bg-gray-50/50 shadow-sm">
                    <div className="flex items-center justify-between bg-white p-3 rounded-md border shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-red-100 text-red-600 p-2 rounded shrink-0">
                          <span className="font-bold text-xs">PDF</span>
                        </div>
                        <span className="text-sm font-medium truncate" title={selectedFile.name}>
                          {selectedFile.name}
                        </span>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setSelectedFile(null)} 
                        className="text-muted-foreground hover:text-red-600 hover:bg-red-50 shrink-0 h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="w-full h-[400px] border rounded-md overflow-hidden bg-gray-200">
                      <iframe 
                        src="/solicitacao_reembolso.pdf" 
                        className="w-full h-full"
                        title="Simulated PDF Preview"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/')}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Solicitação'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
