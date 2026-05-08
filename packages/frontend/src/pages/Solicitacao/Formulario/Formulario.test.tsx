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

jest.mock('axios', () => ({
  get: jest.fn((url) => {
    
    if (url.includes('USD-BRL')) {
      return Promise.resolve({ data: { USDBRL: { bid: '5.20' } } });
    }
    if (url.includes('EUR-BRL')) {
      return Promise.resolve({ data: { EURBRL: { bid: '5.65' } } });
    }
    if (url.includes('ARS-BRL')) {
      return Promise.resolve({ data: { ARSBRL: { bid: '0.006' } } });
    }
    if (url.includes('CNY-BRL')) {
      return Promise.resolve({ data: { CNYBRL: { bid: '0.72' } } });
    }
    
    
    return Promise.resolve({ data: {} });
  })
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
    <select value={value} onChange={(e) => onValueChange(e.target.value)}>
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