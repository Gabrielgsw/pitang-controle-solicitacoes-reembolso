import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Login } from '@/pages/Login';
import { Cadastro } from '@/pages/Cadastro';
import { Dashboard } from '@/pages/Dashboard';
import { SolicitacaoForm } from '@/pages/Solicitacao/Formulario';
import { SolicitacaoDetail } from '@/pages/Solicitacao/Detalhes';
import { Categorias } from '@/pages/Categorias';
import { UsuarioDetalhe } from './pages/Usuario/Detalhes';
import { Usuarios } from './pages/Usuario/User';

function ProtectedRoute({ children, requiredRole }: { children: JSX.Element, requiredRole?: string }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && user?.perfil !== requiredRole) return <Navigate to="/" replace />;
  
  return children;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<ProtectedRoute requiredRole="ADMIN"><Cadastro /></ProtectedRoute>} />

          {/* Rotas Protegidas */}
          <Route 
            path="/" 
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
          />
          
          <Route 
            path="/solicitacao/nova" 
            element={<ProtectedRoute><SolicitacaoForm /></ProtectedRoute>} 
          />
          
          <Route 
            path="/solicitacao/:id" 
            element={<ProtectedRoute><SolicitacaoDetail /></ProtectedRoute>} 
          />
          
          <Route 
            path="/solicitacao/:id/editar" 
            element={<ProtectedRoute><SolicitacaoForm /></ProtectedRoute>} 
          />
          
          {/* Rota Protegida p/ Admin */}
          <Route 
            path="/categorias" 
            element={<ProtectedRoute requiredRole="ADMIN"><Categorias /></ProtectedRoute>} 
          />
          <Route
            path='/usuarios'
            element={<ProtectedRoute requiredRole="ADMIN">< Usuarios/></ProtectedRoute>} 
          />
            
          <Route
          path='/usuarios/:id'
            element={<ProtectedRoute requiredRole="ADMIN"><UsuarioDetalhe /></ProtectedRoute>} 
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <ToastContainer position="top-right" autoClose={3000} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;