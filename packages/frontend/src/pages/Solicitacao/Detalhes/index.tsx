import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../../api/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, CreditCard, Send, Edit, Trash, FileText, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const statusColorMap: Record<string, string> = {
  RASCUNHO: 'bg-gray-200 text-gray-800',
  ENVIADO: 'bg-blue-100 text-blue-800',
  APROVADO: 'bg-green-100 text-green-800',
  REJEITADO: 'bg-red-100 text-red-800',
  PAGO: 'bg-yellow-100 text-yellow-800',
  CANCELADO: 'bg-gray-100 text-gray-600',
};

export function SolicitacaoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();  
  const [loadingAction, setLoadingAction] = useState(false);
  
 
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [justificativa, setJustificativa] = useState('');
  const [cancel, setCancel] = useState(false);

  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    actionEndpoint: string;
    successMsg: string;
    title: string;
    description: string;
    confirmText: string;
  }>({
    isOpen: false,
    actionEndpoint: '',
    successMsg: '',
    title: '',
    description: '',
    confirmText: 'Confirmar'
  });

  const openConfirmModal = (actionEndpoint: string, successMsg: string, title: string, description: string, confirmText: string = 'Confirmar') => {
    setConfirmModal({ isOpen: true, actionEndpoint, successMsg, title, description, confirmText });
  };

  const [solicitacao, setSolicitacao] = useState<any>(null);
  const [historico, setHistorico] = useState<any>(null);
  const [anexos, setAnexos] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  const fetchDados = useCallback(async () => {
    try {
      const [resSolicitacao, resHistorico, resAnexos] = await Promise.all([
        api.get(`/reimbursements/${id}`),
        api.get(`/reimbursements/${id}/history`),
        api.get(`/reimbursements/${id}/attachments`)
      ]);
      setSolicitacao(resSolicitacao.data);
      console.log("DADOS DA SOLICITAÇÃO:", resSolicitacao.data);
      setHistorico(resHistorico.data);
      setAnexos(resAnexos.data)
    } catch (err: any) {
      setError(err);
    }
  }, [id]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const handleAction = async (actionEndpoint: string, successMsg: string, payload: any = {}) => {
    try {
      setLoadingAction(true);
      await api.post(`/reimbursements/${id}/${actionEndpoint}`, payload);
      toast.success(successMsg);
      fetchDados(); 
      if (isRejectModalOpen) setIsRejectModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao realizar ação.');
    } finally {
      setLoadingAction(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (error) return <div className="p-8 text-center text-destructive">Erro ao carregar detalhes.</div>;
  if (!solicitacao) return <div className="p-8 text-center">Carregando...</div>;

  const isDono = user?.id === solicitacao.solicitanteId || user?.perfil === 'COLABORADOR'; // simplificação pro frontend
  const isRascunho = solicitacao.status === 'RASCUNHO';
  const isEnviado = solicitacao.status === 'ENVIADO';
  const isAprovado = solicitacao.status === 'APROVADO';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Badge className={statusColorMap[solicitacao.status] + " text-sm px-3 py-1"}>
            {solicitacao.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Detalhes da Solicitação</CardTitle>
                <CardDescription>ID: {solicitacao.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="text-lg font-bold text-pitang-graphite">{formatCurrency(solicitacao.valor)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data da Despesa</p>
                    <p className="text-lg font-semibold">{dayjs(solicitacao.dataDespesa).format('DD/MM/YYYY')}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="mt-1">{solicitacao.descricao}</p>
                </div>
                {solicitacao.justificativaRejeicao && (
                  <div className="bg-red-50 p-4 border-l-4 border-pitang-red rounded-r-md">
                    <p className="text-sm font-semibold text-pitang-red">Justificativa de Rejeição:</p>
                    <p className="text-sm mt-1">{solicitacao.justificativaRejeicao}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trilha de Auditoria (Histórico)</CardTitle>
              </CardHeader>
              <CardContent>
                {historico && historico.length > 0 ? (
                  <ul className="space-y-4 border-l-2 border-gray-200 ml-3">
                    {historico.map((h: any) => (
                      <li key={h.id} className="relative pl-6">
                        <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary ring-4 ring-white" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{h.acao}</span>
                          <span className="text-xs text-muted-foreground">{dayjs(h.criadoEm).format('DD/MM/YYYY HH:mm')} - Por usuário {h.usuarioId}</span>
                          {h.observacao && <span className="text-sm mt-1 text-gray-600">{h.observacao}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum histórico registrado.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Disponíveis</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {user?.perfil === 'COLABORADOR' && isDono && isRascunho && (
                  <>
                    <Link to={`/solicitacao/${id}/editar`}>
                      <Button className="w-full" variant="outline">
                        <Edit className="mr-2 h-4 w-4" /> Editar Rascunho
                      </Button>
                    </Link>
                    <Button 
                      className="w-full bg-pitang-blue hover:bg-pitang-blue/90 text-white"
                      disabled={loadingAction}
                      onClick={() => openConfirmModal('submit', 'Solicitação enviada para análise.', 'Enviar para Análise', 'Tem certeza que deseja enviar esta solicitação para análise? Após o envio, você não poderá mais editá-la.', 'Enviar')}
                    >
                      <Send className="mr-2 h-4 w-4" /> Enviar para Análise
                    </Button>
                    <Button 
                      className="w-full bg-pitang-red hover:bg-pitang-red/90 text-white"
                      disabled={loadingAction}
                      onClick={() => openConfirmModal('cancel', 'Solicitação cancelada.', 'Cancelar', 'Tem certeza que deseja cancelar esta solicitação?.', 'Enviar')}
                    >
                      Cancelar
                    </Button>
                  </>
                )}

                

                {user?.perfil === 'GESTOR' && isEnviado && (
                  <>
                    <Button 
                      className="w-full bg-pitang-green hover:bg-pitang-green/90 text-white"
                      disabled={loadingAction}
                      onClick={() => openConfirmModal('approve', 'Solicitação aprovada.', 'Aprovar Solicitação', 'Tem certeza que deseja aprovar esta solicitação de reembolso?', 'Aprovar')}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Aprovar
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="destructive"
                      onClick={() => setIsRejectModalOpen(true)}
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Rejeitar
                    </Button>
                  </>
                )}

                {user?.perfil === 'FINANCEIRO' && isAprovado && (
                  <Button 
                    className="w-full bg-pitang-yellow hover:bg-pitang-yellow/90 text-black"
                    disabled={loadingAction}
                    onClick={() => openConfirmModal('pay', 'Solicitação marcada como paga.', 'Marcar como Paga', 'Tem certeza que deseja marcar esta solicitação como paga?', 'Confirmar Pagamento')}
                  >
                    <CreditCard className="mr-2 h-4 w-4" /> Marcar como Paga
                  </Button>
                )}

                {/* Placeholder quando nenhuma ação está disponível */}
                {((user?.perfil === 'COLABORADOR' && !isRascunho) || 
                  (user?.perfil === 'GESTOR' && !isEnviado) || 
                  (user?.perfil === 'FINANCEIRO' && !isAprovado) || 
                  user?.perfil === 'ADMIN') && (
                  <p className="text-sm text-center text-muted-foreground">Nenhuma ação pendente ou permitida para o seu perfil no status atual.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>                

        
        <Card className="mt-6 shadow-sm border-t-4 border-t-red-400">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-pitang-graphite">
              <FileText className="h-5 w-5 text-red-500" /> 
              Comprovante Digital
            </CardTitle>
            <CardDescription>Visualização do documento anexo</CardDescription>
          </CardHeader>
          <CardContent>            
            {anexos && anexos.length > 0 ? (
              anexos.map((anexo: any) => {                
                const urlReal = anexo.urlArquivo || anexo.url || '';
                const nomeReal = anexo.nomeArquivo || anexo.nome || 'Documento';

                return (
                  <div key={anexo.id} className="space-y-4">
                    <div className="flex items-center justify-between p-2.5 border rounded-md bg-gray-50/50">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="bg-red-100 text-red-600 p-1.5 rounded">
                          <FileText className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-medium truncate" title={nomeReal}>
                          {nomeReal}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">
                        {anexo.tipoArquivo || 'PDF'}
                      </Badge>
                    </div>

                    <div className="w-full aspect-[4/5] border-2 border-gray-100 rounded-lg overflow-hidden bg-gray-200 shadow-inner">
                      {urlReal ? (
                        <iframe
                          src={urlReal} 
                          className="w-full h-full"
                          title="Preview do Comprovante"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                          URL do arquivo não encontrada.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-lg bg-gray-50/50">
                <XCircle className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum comprovante anexado.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal Rejeição */}
        <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeitar Solicitação</DialogTitle>
              <DialogDescription>
                Por favor, informe o motivo da rejeição. Este campo é obrigatório.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea 
                placeholder="Descreva o motivo..." 
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>Cancelar</Button>
              <Button 
                variant="destructive" 
                onClick={() => handleAction('reject', 'Solicitação rejeitada.', { justificativaRejeicao: justificativa, usuarioId:user?.id })}
                disabled={!justificativa.trim() || loadingAction}
              >
                {loadingAction ? 'Rejeitando...' : 'Confirmar Rejeição'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmação Genérico */}
        <Dialog open={confirmModal.isOpen} onOpenChange={(isOpen) => setConfirmModal(prev => ({ ...prev, isOpen }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmModal.title}</DialogTitle>
              <DialogDescription>
                {confirmModal.description}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>Cancelar</Button>
              <Button 
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={() => {
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  handleAction(confirmModal.actionEndpoint, confirmModal.successMsg,{usuarioId:user?.id});
                }}
                disabled={loadingAction}
              >
                {loadingAction ? 'Processando...' : confirmModal.confirmText}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
