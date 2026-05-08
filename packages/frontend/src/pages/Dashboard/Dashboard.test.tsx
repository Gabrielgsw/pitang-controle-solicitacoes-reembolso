import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from './index';
import { api } from '../../api/api';
import { useAuth } from '@/contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

jest.mock('../../api/api', () => ({
  api: {
    get: jest.fn(),
  }
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ onValueChange, children, value }: any) => (
    <select data-testid="mock-select" value={value || ''} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ placeholder }: any) => <option value="">{placeholder}</option>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}));

const mockReimbursements = [
  {
    id: '1',
    descricao: 'Almoço SP',
    valor: 150,
    dataDespesa: '2026-05-10',
    status: 'RASCUNHO',
    categoriaId: '1',
    usuario: { nome: 'Gabriel Germano' }
  },
  {
    id: '2',
    descricao: 'Passagem Aérea',
    valor: 1200,
    dataDespesa: '2026-05-08',
    status: 'ENVIADO',
    categoriaId: '2',
    usuario: { nome: 'Maria Silva' }
  }
];

const mockCategorias = [
  { id: '1', nome: 'Alimentação' },
  { id: '2', nome: 'Transporte' }
];

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Dashboard Component', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
  });

  describe('Perfil: COLABORADOR', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({ 
        user: { nome: 'Gabriel Germano', perfil: 'COLABORADOR' }, 
        logout: mockLogout 
      });
    });

    it('deve exibir o título correto e o botão "Nova Solicitação"', async () => {
      renderWithRouter(<Dashboard />);
      expect(await screen.findByText('Minhas Solicitações')).toBeInTheDocument();      
      expect(screen.getAllByText('Nova Solicitação').length).toBeGreaterThan(0); 
    });

    it('deve exibir mensagem de estado vazio para colaborador', async () => {
      renderWithRouter(<Dashboard />);
      expect(await screen.findByText('Nenhuma solicitação encontrada')).toBeInTheDocument();
      expect(screen.getByText('Você ainda não criou nenhuma solicitação de reembolso.')).toBeInTheDocument();
    });

    
  });

  describe('Perfis: GESTOR e FINANCEIRO', () => {
    it('deve exibir o título correto para o GESTOR e ocultar Nova Solicitação', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: { nome: 'Chefe', perfil: 'GESTOR' }, logout: mockLogout });
      renderWithRouter(<Dashboard />);
      
      expect(await screen.findByText('Solicitações para Análise')).toBeInTheDocument();
      expect(screen.queryByText('Nova Solicitação')).not.toBeInTheDocument();
    });

    it('deve exibir o título correto para o FINANCEIRO e ocultar Nova Solicitação', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: { nome: 'Caixa', perfil: 'FINANCEIRO' }, logout: mockLogout });
      renderWithRouter(<Dashboard />);
      
      expect(await screen.findByText('Solicitações para Pagamento')).toBeInTheDocument();
      expect(screen.queryByText('Nova Solicitação')).not.toBeInTheDocument();
    });
  });

  describe('Perfil: ADMIN', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({ user: { nome: 'Super', perfil: 'ADMIN' }, logout: mockLogout });
      (api.get as jest.Mock).mockImplementation((url) => {
        if (url === '/categories') return Promise.resolve({ data: mockCategorias });
        return Promise.resolve({  data: { 
          data: mockReimbursements,  
          meta: { total: 2, page: 1, totalPages: 1 }
        } });
      });
    });

    it('deve exibir botão de Categorias', async () => {
      renderWithRouter(<Dashboard />);
      expect(await screen.findByText('Categorias')).toBeInTheDocument();
    });

    it('deve renderizar a tabela, os nomes dos usuários e a totalização', async () => {
      renderWithRouter(<Dashboard />);

      expect(await screen.findByText('Almoço SP')).toBeInTheDocument();
      expect(screen.getByText('Por: Gabriel Germano')).toBeInTheDocument();
      expect(screen.getByText('Totalização por Status')).toBeInTheDocument();
    });

    
  });

  it('deve chamar a função de logout ao clicar no botão Sair', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { perfil: 'COLABORADOR' }, logout: mockLogout });
    renderWithRouter(<Dashboard />);
    const user = userEvent.setup();
   
    const btnSair = screen.getByRole('button', { name: 'Sair' });
    await user.click(btnSair);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});