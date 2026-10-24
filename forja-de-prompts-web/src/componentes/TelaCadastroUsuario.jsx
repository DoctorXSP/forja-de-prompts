import React, { useState } from 'react';
import { ArrowLeft, UserPlus, Save } from 'lucide-react';
import { CONFIG_REDE } from './config';
import '../estilos/TelaCadastroUsuario.css';

export default function TelaCadastroUsuario({ aoVoltar }) {
  const [nome, setNome] = useState('');
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [perfil, setPerfil] = useState('operador');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const response = await fetch(`${CONFIG_REDE.URL_BACKEND}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, login, email, password, perfil })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Usuário cadastrado com sucesso!');
        aoVoltar();
      } else {
        alert(data.mensagem || 'Erro ao cadastrar usuário.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro de conexão ao tentar cadastrar o usuário.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="tela-cadastro-usuario-container">
      <div className="container w-100" style={{ maxWidth: '600px' }}>
        
        {/* Barra Superior formatada pelo CSS novo */}
        <div className="cabecalho-cadastro-forja">
          <button 
            className="btn btn-sm btn-outline-secondary text-light d-flex align-items-center gap-1" 
            onClick={aoVoltar}
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          
          <h4 className="fw-bold text-info mb-0 d-flex align-items-center gap-2">
            <UserPlus size={22} /> Cadastrar Novo Usuário
          </h4>
        </div>

        {/* Formulário */}
        <div className="card-edicao-forja">
          <form onSubmit={handleSubmit}>
            
            <div className="grupo-campo-forja">
              <label className="form-label">Nome Completo</label>
              <input 
                type="text" 
                className="form-control formulario-input-dark" 
                required 
                placeholder="Ex: Carlos Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="grupo-campo-forja">
              <label className="form-label">E-mail</label>
              <input 
                type="email" 
                className="form-control formulario-input-dark" 
                required 
                placeholder="carlos@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="row">
              <div className="col-12 col-md-6">
                <div className="grupo-campo-forja">
                  <label className="form-label">Login de Acesso</label>
                  <input 
                    type="text" 
                    className="form-control formulario-input-dark" 
                    required 
                    placeholder="carlos.silva"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="col-12 col-md-6">
                <div className="grupo-campo-forja">
                  <label className="form-label">Senha Temporária</label>
                  <input 
                    type="password" 
                    className="form-control formulario-input-dark" 
                    required 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grupo-campo-forja">
              <label className="form-label">Perfil de Acesso</label>
              <select 
                className="form-select formulario-input-dark"
                value={perfil}
                onChange={(e) => setPerfil(e.target.value)}
              >
                <option value="admin">Administrador (Acesso Total)</option>
                <option value="editor">Editor (Pode criar projetos e times)</option>
                <option value="operador">Operador (Uso padrão)</option>
                <option value="visualizador">Visualizador (Apenas leitura)</option>
              </select>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-secondary">
              <button type="button" className="btn botao-forja-vermelho" onClick={aoVoltar}>Cancelar</button>
              <button type="submit" className="btn botao-forja-laranja d-flex align-items-center gap-2" disabled={carregando}>
                <Save size={16} /> {carregando ? 'Cadastrando...' : 'Finalizar Cadastro'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}