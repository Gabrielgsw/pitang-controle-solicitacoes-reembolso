import { render, screen, waitFor, fireEvent,cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SolicitacaoForm } from './index'; 
import { api } from '../../../api/api';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';



jest.mock('../../../api/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));


jest.mock('@/components/ui/select', () => ({
  Select: ({ onValueChange, children, value }: any) => (
    <select data-testid="mock-select" value={value} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ placeholder }: any) => <option value="">{placeholder}</option>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}));


describe('SolicitacaoForm Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useParams as jest.Mock).mockReturnValue({ id: undefined });

    // Mock para quando o componente montar e pedir as categorias
    (api.get as jest.Mock).mockResolvedValue({
      data: [
        { id: '1', nome: 'Alimentação', ativo: true },
        { id: '2', nome: 'Transporte', ativo: true },
      ],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('deve renderizar o formulário da Solicitação de Reembolso', async () => {
    render(<SolicitacaoForm />);

    expect(screen.getByText('Nova Solicitação')).toBeInTheDocument();
    expect(screen.getByLabelText(/Descrição da Despesa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Valor/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/categories');
    });
  });

  it('deve exibir mensagens de erro do Zod ao tentar enviar o formulário vazio', async () => {
    render(<SolicitacaoForm />);
    const user = userEvent.setup();

    await waitFor(() => {
      const select = screen.getByTestId('mock-select');
      expect(select.children.length).toBeGreaterThan(0); 
    });

    const submitButton = screen.getByRole('button', { name: /Salvar Solicitação/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('A descrição deve ter no mínimo 5 caracteres.')).toBeInTheDocument();
      expect(screen.getByText('O valor deve ser maior que zero.')).toBeInTheDocument();
      expect(screen.getByText('A data da despesa é obrigatória.')).toBeInTheDocument();
      expect(screen.getByText('Selecione uma categoria.')).toBeInTheDocument();
    });

    expect(api.post).not.toHaveBeenCalled();
  });

  

  it('deve carregar dados existentes para edição', async () => {
    (useParams as jest.Mock).mockReturnValue({ id: '999' });

    (api.get as jest.Mock).mockImplementation((url) => {
      if (url === '/categories') {
        return Promise.resolve({ data: [{ id: '1', nome: 'Alimentação', ativo: true }] });
      }
      if (url === '/reimbursements/999') {
        return Promise.resolve({
          data: {
            descricao: 'Despesa Antiga',
            valor: 100,
            dataDespesa: '2025-05-01T00:00:00.000Z',
            categoriaId: 1,
          }
        });
      }
    });

    render(<SolicitacaoForm />);

    expect(screen.getByText('Editar Solicitação')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText(/Descrição da Despesa/i)).toHaveValue('Despesa Antiga');
      expect(screen.getByLabelText(/Valor/i)).toHaveValue(100);
      expect(screen.getByLabelText(/Data da Despesa/i)).toHaveValue('2025-05-01');
    });
  });
});