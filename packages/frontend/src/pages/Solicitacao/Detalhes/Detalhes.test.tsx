import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SolicitacaoDetail } from './index'; 
import { api } from '../../../api/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';


jest.mock('../../../api/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  }
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  Link: ({ children, to }: any) => <a href={to} data-testid="mock-link">{children}</a>,
}));

const mockId = 'uuid-123';

const mockSolicitacaoRascunho = {
  id: mockId,
  valor: 150.50,
  dataDespesa: '2026-05-10T00:00:00.000Z',
  descricao: 'Uber para o hotel',
  status: 'RASCUNHO',
  solicitanteId: 'user-colab',
  justificativaRejeicao: null,
};

const mockHistorico = [
  {
    id: 'hist-1',
    acao: 'CRIADO',
    criadoEm: '2026-05-10T10:00:00.000Z',
    usuarioId: 'user-colab',
    observacao: 'Solicitação iniciada'
  }
];

describe('SolicitacaoDetail Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ id: mockId });
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  it('deve exibir mensagem de erro se a API falhar ao buscar dados', async () => {
    
    (api.get as jest.Mock).mockRejectedValue(new Error('Erro de conexão'));
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'user-colab', perfil: 'COLABORADOR' } });

    render(<SolicitacaoDetail />);
    
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar detalhes.')).toBeInTheDocument();
    });
  });

  it('deve carregar os detalhes e exibir botões do COLABORADOR se for RASCUNHO', async () => {
    
    (api.get as jest.Mock).mockImplementation((url) => {
      if (url.includes('/history')) return Promise.resolve({ data: mockHistorico });
      return Promise.resolve({ data: mockSolicitacaoRascunho });
    });
    
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'user-colab', perfil: 'COLABORADOR' } });

    render(<SolicitacaoDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Detalhes da Solicitação')).toBeInTheDocument();
      expect(screen.getByText('Uber para o hotel')).toBeInTheDocument();
      expect(screen.getByText('RASCUNHO')).toBeInTheDocument();
    });
   
    expect(screen.getByText('Enviar para Análise')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('deve abrir Modal de Confirmação e enviar solicitação para análise ', async () => {
    (api.get as jest.Mock).mockImplementation((url) => {
      if (url.includes('/history')) return Promise.resolve({ data: mockHistorico });
      return Promise.resolve({ data: mockSolicitacaoRascunho });
    });
    (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'user-colab', perfil: 'COLABORADOR' } });

    render(<SolicitacaoDetail />);
    const user = userEvent.setup();

    
    const btnEnviar = await screen.findByText('Enviar para Análise');
    
    
    await user.click(btnEnviar);

    
    const modalTitle = await screen.findByText('Tem certeza que deseja enviar esta solicitação para análise? Após o envio, você não poderá mais editá-la.');
    expect(modalTitle).toBeInTheDocument();

    const btnConfirmar = screen.getByRole('button', { name: 'Enviar' });
    await user.click(btnConfirmar);

    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(`/reimbursements/${mockId}/submit`, { usuarioId: 'user-colab' });
      expect(toast.success).toHaveBeenCalledWith('Solicitação enviada para análise.');
    });
  });

  it('deve exibir botões do GESTOR e permitir rejeitar com justificativa obrigatória', async () => {
    
    const mockEnviado = { ...mockSolicitacaoRascunho, status: 'ENVIADO' };
    (api.get as jest.Mock).mockImplementation((url) => {
      if (url.includes('/history')) return Promise.resolve({ data: mockHistorico });
      return Promise.resolve({ data: mockEnviado });
    });
    
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'user-gestor', perfil: 'GESTOR' } });
    (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });

    render(<SolicitacaoDetail />);
    const user = userEvent.setup();

    
    const btnRejeitar = await screen.findByText('Rejeitar');
    expect(screen.getByText('Aprovar')).toBeInTheDocument();

    
    await user.click(btnRejeitar);
    
    const textarea = await screen.findByPlaceholderText('Descreva o motivo...');
    await user.type(textarea, 'Nota fiscal ilegível.');

    
    const btnConfirmarRejeicao = screen.getByRole('button', { name: 'Confirmar Rejeição' });
    await user.click(btnConfirmarRejeicao);

    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(`/reimbursements/${mockId}/reject`, {
        justificativaRejeicao: 'Nota fiscal ilegível.',
        usuarioId: 'user-gestor'
      });
      expect(toast.success).toHaveBeenCalledWith('Solicitação rejeitada.');
    });
  });

  it('deve exibir botões do FINANCEIRO apenas se o status for APROVADO', async () => {
    const mockAprovado = { ...mockSolicitacaoRascunho, status: 'APROVADO' };
    (api.get as jest.Mock).mockImplementation((url) => {
      if (url.includes('/history')) return Promise.resolve({ data: mockHistorico });
      return Promise.resolve({ data: mockAprovado });
    });
    
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'user-fin', perfil: 'FINANCEIRO' } });

    render(<SolicitacaoDetail />);

    const btnPagar = await screen.findByText('Marcar como Paga');
    expect(btnPagar).toBeInTheDocument();
    
    expect(screen.queryByText('Aprovar') === null).toBe(false);
    
  });
});