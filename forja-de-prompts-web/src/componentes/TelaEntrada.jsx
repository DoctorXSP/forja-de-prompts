import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, Flame, ArrowRight, Code, Megaphone, 
  Users, GraduationCap, Folder, LogOut, Trash2, Edit2, Image as ImageIcon,
  UserPlus, Edit3, UserCheck, User, RefreshCw 
} from 'lucide-react';
import logoHorizontal from '../assets/logo916color.png';
import TelaEdicaoProjeto from './TelaEdicaoProjeto';
import TelaCadastroProjeto from './TelaCadastroProjeto';
import TelaCadastroUsuario from './TelaCadastroUsuario'; 
import '../estilos/TelaEntrada.css';

// Importação da configuração de rede
import { CONFIG_REDE } from './config'; 

export default function TelaEntrada({ usuarioLogado, aoSelecionarProjeto, aoFazerLogout }) {
  const [listaProjetos, definirListaProjetos] = useState([]);
  const [telaAtiva, definirTelaAtiva] = useState('LISTA'); // 'LISTA', 'CRIAR', 'EDITAR', 'CADASTRAR_USUARIO'
  const [projetoSelecionadoEdicao, definirProjetoSelecionadoEdicao] = useState(null);
  
  // Controle do Modal de Convite (Formar Time)
  const [modalTimeAberto, setModalTimeAberto] = useState(false);
  const [emailConvite, setEmailConvite] = useState('');
  const [projetoSelecionadoParaTime, setProjetoSelecionadoParaTime] = useState('');

  useEffect(() => {
    carregarProjetos();
  }, [usuarioLogado]);

  async function carregarProjetos() {
    try {
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/projetos?usuario_logado_id=${usuarioLogado.id}&perfil_logado=${usuarioLogado.perfil}`);
      const dados = await res.json();
      if (Array.isArray(dados)) {
        definirListaProjetos(dados);
      }
    } catch (err) {
      console.error('Erro ao carregar projetos da API:', err);
    }
  }

  async function excluirProjeto(e, idProjeto) {
    e.stopPropagation(); 
    if (!window.confirm('Tem certeza que deseja excluir este projeto permanentemente?')) return;

    try {
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/projetos/${idProjeto}`, { method: 'DELETE' });
      if (res.ok) {
        carregarProjetos();
      } else {
        alert('Erro ao excluir projeto no backend.');
      }
    } catch (err) {
      alert('Erro de conexão com a API ao tentar excluir.');
    }
  }

  async function acessarProjeto(proj) {
    try {
      await fetch(`${CONFIG_REDE.URL_BACKEND}/projetos/${proj.id}/acesso`, { method: 'PATCH' });
    } catch (err) {
      console.error('Erro ao registar último acesso:', err);
    }
    aoSelecionarProjeto(proj);
  }

  const enviarSolicitacaoTime = async (e) => {
    e.preventDefault();
    if(!projetoSelecionadoParaTime) return alert('Selecione um projeto primeiro.');
    
    try {
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/times/solicitacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projetoId: projetoSelecionadoParaTime,
          remetenteId: usuarioLogado.id,
          identificadorDestino: emailConvite
        })
      });
      const data = await res.json();
      if(res.ok) {
        alert(data.mensagem);
        setModalTimeAberto(false);
        setEmailConvite('');
      } else {
        alert(data.mensagem || 'Erro ao enviar solicitação.');
      }
    } catch (err) {
      alert('Erro de conexão com a API.');
    }
  };

  function obterIconeTipo(tipo) {
    switch (tipo) {
      case 'DESENVOLVIMENTO': return <Code size={22} style={{ color: '#06b6d4' }} />;
      case 'CAMPANHA': return <Megaphone size={22} style={{ color: '#f97316' }} />;
      case 'COORDENACAO': return <Users size={22} style={{ color: '#10b981' }} />;
      case 'SALA_DE_AULA': return <GraduationCap size={22} style={{ color: '#8b5cf6' }} />;
      default: return <Folder size={22} style={{ color: '#9ca3af' }} />;
    }
  }

  // ROTEAMENTO INTERNO
  if (telaAtiva === 'CRIAR') {
    return (
      <TelaCadastroProjeto 
        usuarioLogado={usuarioLogado}
        aoSalvar={() => { definirTelaAtiva('LISTA'); carregarProjetos(); }}
        aoVoltar={() => definirTelaAtiva('LISTA')}
      />
    );
  }

  if (telaAtiva === 'EDITAR') {
    return (
      <TelaEdicaoProjeto 
        usuarioLogado={usuarioLogado}
        projeto={projetoSelecionadoEdicao}
        aoSalvar={() => { definirTelaAtiva('LISTA'); carregarProjetos(); }}
        aoVoltar={() => definirTelaAtiva('LISTA')}
      />
    );
  }

  if (telaAtiva === 'CADASTRAR_USUARIO') {
    return (
      <TelaCadastroUsuario 
        aoVoltar={() => definirTelaAtiva('LISTA')}
      />
    );
  }

  return (
    <div className="entrada-container d-flex flex-column">
      
      {/* NAVBAR SUPERIOR NOVA */}
      <div className="navbar-forja-superior mb-4 container py-3 px-4">
        
        {/* ESQUERDA: Usuário Logado */}
        <div className="d-flex align-items-center gap-3">
          <div className="icone-usuario-avatar">
            <User size={24} className="text-info" />
          </div>
          <div className="d-flex flex-column">
            <span className="text-muted small lh-1 mb-1">Logado como:</span>
            <div className="d-flex align-items-center gap-2">
              <strong className="text-light fs-6 lh-1">{usuarioLogado?.nome}</strong>
              <span className={`badge-perfil perfil-${usuarioLogado?.perfil?.toLowerCase()}`}>
                {usuarioLogado?.perfil}
              </span>
            </div>
          </div>
        </div>

        {/* DIREITA: Ações Baseadas no Perfil */}
        {/* Utilizamos flex-wrap e margens explícitas em cada botão para garantir o espaçamento de 15px na horizontal e na vertical */}
        <div className="d-flex align-items-center flex-wrap botoes-acao-navbar">
          
          {/* Botão Global de Atualizar para todos os usuários */}
          <button 
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" 
            onClick={carregarProjetos}
            title="Atualizar Projetos"
            style={{ marginRight: '15px', marginBottom: '15px' }}
          >
            <RefreshCw size={15} /> <span className="d-none d-md-inline">Atualizar</span>
          </button>

          {/* Apenas Administradores */}
          {usuarioLogado?.perfil === 'admin' && (
            <>
              <button 
                className="btn btn-sm btn-outline-info d-flex align-items-center gap-1" 
                title="Cadastrar Usuário"
                onClick={() => definirTelaAtiva('CADASTRAR_USUARIO')}
                style={{ marginRight: '15px', marginBottom: '15px' }}
              >
                <UserPlus size={15} /> <span className="d-none d-md-inline">Cadastrar Usuário</span>
              </button>
              <button 
                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" 
                title="Deletar Usuário"
                style={{ marginRight: '15px', marginBottom: '15px' }}
              >
                <Trash2 size={15} /> <span className="d-none d-md-inline">Deletar Usuário</span>
              </button>
            </>
          )}

          {/* Administradores e Editores */}
          {(usuarioLogado?.perfil === 'admin' || usuarioLogado?.perfil === 'editor') && (
            <>
              <button 
                className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1" 
                title="Editar Usuário"
                style={{ marginRight: '15px', marginBottom: '15px' }}
              >
                <Edit3 size={15} /> <span className="d-none d-md-inline">Editar Usuário</span>
              </button>
              <button 
                className="btn btn-sm btn-outline-success d-flex align-items-center gap-1" 
                onClick={() => setModalTimeAberto(true)} 
                title="Formar / Editar Time"
                style={{ marginRight: '15px', marginBottom: '15px' }}
              >
                <UserCheck size={15} /> <span className="d-none d-md-inline">Formar Time</span>
              </button>
            </>
          )}

          {/* EXTREMA DIREITA: Botão de Sair */}
          <div className="divisoria-navbar" style={{ marginBottom: '15px' }}>
            <button className="btn btn-sm botao-forja-vermelho d-flex align-items-center gap-1" onClick={aoFazerLogout}>
              <LogOut size={15} /> Sair
            </button>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL (RESTAURADO PARA A ESTRUTURA ORIGINAL) */}
      <div className="container flex-grow-1" style={{ maxWidth: '1350px' }}>
        
        {/* LOGO DA FORJA RESTAURADO AQUI */}
        <div className="mb-4 mt-2">
          <img src={logoHorizontal} alt="Forja de Prompts" style={{ maxWidth: '280px' }} />
        </div>

        <div className="d-flex flex-column mb-4 cabecalho-secao-projetos">
          <h3 className="fw-bold mb-1">Seus Projetos na Forja</h3>
          
          <div className="d-flex align-items-center flex-row">
            <p className="text-muted small mb-0" style={{ display: 'inline-block' }}>
              Selecione um projeto existente ou crie um novo para gerenciar contextos e prompts clicando no botão ao lado.
            </p>
            
            <button 
              className="btn botao-forja-laranja fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
              onClick={() => { definirProjetoSelecionadoEdicao(null); definirTelaAtiva('CRIAR'); }}
              title="Criar Novo Projeto"
              style={{ width: '38px', height: '38px', minWidth: '38px', borderRadius: '50%', marginLeft: '15px', padding: '0' }}
            >
              <FolderPlus size={18} style={{ display: 'block', margin: 'auto' }} />
            </button>
          </div>
        </div>

        {/* GRADE DE PROJETOS ORIGINAL */}
        <div className="row grade-projetos">
          {listaProjetos.map((proj) => (
            <div key={proj.id} className="col-12 mb-4" style={{marginBottom: '15px'}}>
              <div className="cartao-projeto-forja">
                
                <div className="conteudo-principal-cartao" onClick={() => acessarProjeto(proj)}>
                  <div className="moldura-logo-cartao">
                    {proj.logo_url ? (
                      <img src={`${CONFIG_REDE.URL_BACKEND}${proj.logo_url}`} alt="Logo" className="imagem-logo-cartao" />
                    ) : (
                      <ImageIcon size={48} className="text-secondary" />
                    )}
                  </div>

                  <div className="info-cabecalho-cartao">
                    <div className="linha-titulo-cartao">
                      <Flame size={30} strokeWidth={3} className="icone-flame-vermelho" />
                      <h2 className="titulo-principal-cartao">{proj.titulo}</h2>
                      <div className="bloco-tipo-cartao">
                        {obterIconeTipo(proj.tipo_projeto)}
                        <span className="texto-tipo-cartao">{proj.tipo_projeto}</span>
                      </div>
                    </div>
                    <p className="descricao-objetivo-cartao">
                      {proj.objetivo || 'Nenhum objetivo geral definido para este projeto.'}
                    </p>
                  </div>
                </div>

                <div className="rodape-cartao-projeto">
                  <button 
                    className="btn btn-sm botao-acao-acessar d-flex align-items-center gap-1"
                    onClick={() => acessarProjeto(proj)}
                  >
                    <span>Acessar Projeto</span> <ArrowRight size={14} />
                  </button>

                  <div className="d-flex align-items-center">
                    <button 
                      className="btn btn-sm botao-acao-editar d-flex align-items-center gap-1" 
                      onClick={(e) => {
                        e.stopPropagation(); 
                        definirProjetoSelecionadoEdicao(proj);
                        definirTelaAtiva('EDITAR');
                      }}
                      title="Editar Projeto"
                    >
                      <Edit2 size={14} /> <span>Editar</span>
                    </button>
                    {(usuarioLogado.perfil === 'admin' || proj.meu_nivel_acesso === 'DONO') && (
                      <button 
                        className="btn btn-sm botao-acao-excluir d-flex align-items-center gap-1" 
                        onClick={(e) => excluirProjeto(e, proj.id)}
                        title="Excluir Projeto"
                      >
                        <Trash2 size={14} /> <span>Excluir</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))}

          {listaProjetos.length === 0 && (
            <div className="col-12 text-center py-5">
              <p className="text-muted">Nenhum projeto cadastrado ainda. Clique no ícone de mais (+) ao lado para criar um novo projeto!</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL SIMPLES PARA FORMAR TIME */}
      {modalTimeAberto && (
        <div className="modal-overlay-forja">
          <div className="card-edicao-forja p-4 w-100" style={{ maxWidth: '500px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="text-warning mb-0 d-flex align-items-center gap-2">
                <UserCheck size={20} /> Formar Time
              </h5>
            </div>
            
            <form onSubmit={enviarSolicitacaoTime}>
              <div className="mb-3">
                <label className="text-muted small mb-1">Selecione o Projeto</label>
                <select className="form-select formulario-input-dark" required value={projetoSelecionadoParaTime} onChange={(e) => setProjetoSelecionadoParaTime(e.target.value)}>
                  <option value="">-- Escolha --</option>
                  {listaProjetos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="text-muted small mb-1">E-mail ou Login do Usuário</label>
                <input type="text" className="form-control formulario-input-dark" required placeholder="ex: usuario@email.com" value={emailConvite} onChange={(e) => setEmailConvite(e.target.value)} />
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn botao-forja-vermelho" onClick={() => setModalTimeAberto(false)}>Cancelar</button>
                <button type="submit" className="btn botao-forja-laranja">Enviar Convite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}