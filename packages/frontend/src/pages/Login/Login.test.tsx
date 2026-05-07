import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from './index'; 
import { api } from '../../api/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

jest.mock('../../api/api', () => ({
  api: {
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
  useNavigate: jest.fn(),
  Link: ({ children, to }: any) => <a href={to} data-testid="mock-link">{children}</a>,
}));

jest.mock('@/assets/pitang.png', () => ({ default: 'logo-pitang-mock.png' }));


const generateFakeJWT = (payloadObj: any) => {
  const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'; 
  const payload = btoa(JSON.stringify(payloadObj)); 
  const signature = 'fake-signature-123';
  return `${header}.${payload}.${signature}`;
};

describe('Login Component', () => {
  const mockLogin = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ login: mockLogin });
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  
  afterEach(() => {
    cleanup();
  });

  it('deve renderizar a tela de login', () => {
    render(<Login />);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail corporativo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('deve exibir mensagens de erro do Zod ao tentar entrar com campos vazios/inválidos', async () => {
    render(<Login />);
    const user = userEvent.setup();

    const submitButton = screen.getByRole('button', { name: 'Entrar' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('E-mail inválido.')).toBeInTheDocument();
      expect(screen.getByText('A senha deve ter no mínimo 6 caracteres.')).toBeInTheDocument();
    });

    expect(api.post).not.toHaveBeenCalled();
  });

  it('deve exibir toast de erro quando a API rejeitar o login', async () => {
    
    (api.post as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Credenciais inválidas.' } }
    });

    render(<Login />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/E-mail corporativo/i), 'gabriel.germano@pitang.com');
    await user.type(screen.getByLabelText(/Senha/i), 'senhaErrada123');
    
    const submitButton = screen.getByRole('button', { name: 'Entrar' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/login', {
        email: 'gabriel.germano@pitang.com',
        senha: 'senhaErrada123'
      });
      expect(toast.error).toHaveBeenCalledWith('Credenciais inválidas.');
      expect(mockLogin).not.toHaveBeenCalled(); 
      expect(mockNavigate).not.toHaveBeenCalled(); 
    });
  });

  it('deve decodificar o token, chamar o auth context e redirecionar no login com sucesso', async () => {   
    const userData = {
      id: 'uuid-999',
      email: 'gabriel.germano@pitang.com',
      perfil: 'COLABORADOR',
      nome: 'Gabriel Germano'
    };
    const fakeToken = generateFakeJWT(userData);
    
    (api.post as jest.Mock).mockResolvedValue({
      data: { token: fakeToken }
    });

    render(<Login />);
    const user = userEvent.setup();
   
    await user.type(screen.getByLabelText(/E-mail corporativo/i), 'gabriel.germano@pitang.com');
    await user.type(screen.getByLabelText(/Senha/i), 'senhaForte123!');
    
    const submitButton = screen.getByRole('button', { name: 'Entrar' });
    await user.click(submitButton);
   
    await waitFor(() => {
      
      expect(api.post).toHaveBeenCalledWith('/login', {
        email: 'gabriel.germano@pitang.com',
        senha: 'senhaForte123!'
      });
      
      expect(mockLogin).toHaveBeenCalledWith(fakeToken, {
        id: 'uuid-999',
        email: 'gabriel.germano@pitang.com',
        perfil: 'COLABORADOR',
        nome: 'Gabriel Germano' 
      });
      
      expect(toast.success).toHaveBeenCalledWith('Login efetuado com sucesso!');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});