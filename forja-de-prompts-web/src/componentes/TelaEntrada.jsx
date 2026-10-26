// Importa o React e os hooks essenciais:
// - useState: para gerir estados locais da interface (lista de projetos, telas ativas, modais).
// - useEffect: para executar ações automáticas ao carregar a página ou atualizar o usuário.
import React, { useState, useEffect } from 'react';
// Importa os ícones vetoriais da biblioteca 'lucide-react' para compor a interface
import { 
  FolderPlus, Flame, ArrowRight, Code, Megaphone, 
  Users, GraduationCap, Folder, LogOut, Trash2, Edit2, Image as ImageIcon,
  UserPlus, Edit3, UserCheck, User, RefreshCw 
} from 'lucide-react';

// Importa a imagem do logotipo horizontal oficial da aplicação
import logoHorizontal from '../assets/logo916color.png';

// Importa os subcomponentes de ecrãs e modais acessíveis a partir da barra de navegação
import TelaEdicaoProjeto from './TelaEdicaoProjeto';
import TelaCadastroProjeto from './TelaCadastroProjeto';
import TelaCadastroUsuario from './TelaCadastroUsuario'; 
import TelaEditarUsuario from './TelaEditarUsuario';
import TelaDeletarUsuario from './TelaDeletarUsuario';
import TelaFormarTimes from './TelaFormarTimes';

// Importa a folha de estilos CSS específica para o ecrã de entrada
import '../estilos/TelaEntrada.css';

// Importação da configuração centralizada de rede (endereço do backend)
import { CONFIG_REDE } from './config'; 

/**
 * FUNÇÃO / COMPONENTE PRINCIPAL: TelaEntrada
 * -------------------------------------------------------------------------------------
 * O QUE FAZ:
 * Representa o dashboard principal pós-login da aplicação.
 * - Exibe a barra de navegação superior (navbar) com os dados do utilizador logado e botões
 *   de gestão de acordo com o perfil de acesso (Administrador, Editor ou Operador).
 * - Lista todos os projetos aos quais o utilizador tem acesso num formato de cartões visuais.
 * - Gere o roteamento interno (através de flags no estado `telaAtiva`) para abrir ecrãs de
 *   criação/edição de projetos, gestão de utilizadores e formação de equipas.
 */
export default function TelaEntrada({ usuarioLogado, aoSelecionarProjeto, aoFazerLogout }) {
  // Estados locais para gerir a sessão, lista de projetos e navegação por ecrãs
  const [usuarioSessao, definirUsuarioSessao] = useState(usuarioLogado);
  const [listaProjetos, definirListaProjetos] = useState([]);
  const [telaAtiva, definirTelaAtiva] = useState('LISTA'); // Valores possíveis: 'LISTA', 'CRIAR', 'EDITAR', 'CADASTRAR_USUARIO', 'EDITAR_USUARIO', 'DELETAR_USUARIO', 'FORMAR_TIMES'
  const [projetoSelecionadoEdicao, definirProjetoSelecionadoEdicao] = useState(null);
  
  // Estados de controlo do modal de convite para equipas (Formar Time)
  const [modalTimeAberto, definirModalTimeAberto] = useState(false);
  const [emailConvite, definirEmailConvite] = useState('');
  const [projetoSelecionadoParaTime, definirProjetoSelecionadoParaTime] = useState('');
  
  // Atualiza o estado da sessão sempre que a prop 'usuarioLogado' é modificada externamente
  useEffect(() => {
    definirUsuarioSessao(usuarioLogado);
  }, [usuarioLogado]);
  
  // Carrega a lista de projetos do servidor sempre que o utilizador logado é atualizado
  useEffect(() => {
    carregarProjetos();
  }, [usuarioLogado]);

  /**
   * FUNÇÃO: carregarProjetos
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Faz uma requisição HTTP `GET` ao backend passando o ID e o perfil do utilizador logado
   * (`CONFIG_REDE.URL_BACKEND/projetos`) para obter a lista filtrada de projetos autorizados
   * e guardá-la no estado `listaProjetos`.
   */
  async function carregarProjetos() {
    try {
      const resposta = await fetch(`${CONFIG_REDE.URL_BACKEND}/projetos?usuario_logado_id=${usuarioLogado.id}&perfil_logado=${usuarioLogado.perfil}`);
      const dados = await resposta.json();
      if (Array.isArray(dados)) {
        definirListaProjetos(dados);
      }
    } catch (erro) {
      console.error('Erro ao carregar projetos da API:', erro);
    }
  }

  /**
   * FUNÇÃO: excluirProjeto
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Intercepta o clique no botão de exclusão de um cartão de projeto (`e.stopPropagation()`
   * evita acionar o clique do cartão), exibe um alerta de confirmação e envia uma requisição
   * `DELETE` para o backend para apagar permanentemente o projeto, recarregando a lista em seguida.
   */
  async function excluirProjeto(e, idProjeto) {
    e.stopPropagation(); 
    if (!window.confirm('Tem certeza que deseja excluir este projeto permanentemente?')) return;

    try {
      const resposta = await fetch(`${CONFIG_REDE.URL_BACKEND}/projetos/${idProjeto}`, { method: 'DELETE' });
      if (resposta.ok) {
        carregarProjetos();
      } else {
        alert('Erro ao excluir projeto no backend.');
      }
    } catch (erro) {
      alert('Erro de conexão com a API ao tentar excluir.');
    }
  }

  /**
   * FUNÇÃO: acessarProjeto
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Regista o último acesso ao projeto selecionado enviando um pedido `PATCH` ao servidor
   * (`/projetos/:id/acesso`) e, em seguida, invoca a função `aoSelecionarProjeto(proj)`
   * recebida via props para abrir o painel principal do projeto.
   */
  async function acessarProjeto(proj) {
    try {
      await fetch(`${CONFIG_REDE.URL_BACKEND}/projetos/${proj.id}/acesso`, { method: 'PATCH' });
    } catch (erro) {
      console.error('Erro ao registar último acesso:', erro);
    }
    aoSelecionarProjeto(proj);
  }

  /**
   * FUNÇÃO: enviarSolicitacaoTime
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Envia um pedido HTTP `POST` para o endpoint `/times/solicitacao` do backend com o ID
   * do projeto escolhido, o ID do utilizador remetente e o e-mail/login do destinatário
   * para convidá-lo a integrar a equipa do projeto.
   */
  const enviarSolicitacaoTime = async (e) => {
    e.preventDefault();
    if (!projetoSelecionadoParaTime) return alert('Selecione um projeto primeiro.');
    
    try {
      const resposta = await fetch(`${CONFIG_REDE.URL_BACKEND}/times/solicitacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projetoId: projetoSelecionadoParaTime,
          remetenteId: usuarioLogado.id,
          identificadorDestino: emailConvite
        })
      });
      const conteudo = await resposta.json();
      if (resposta.ok) {
        alert(conteudo.mensagem);
        definirModalTimeAberto(false);
        definirEmailConvite('');
      } else {
        alert(conteudo.mensagem || 'Erro ao enviar solicitação.');
      }
    } catch (erro) {
      alert('Erro de conexão com a API.');
    }
  };

  /**
   * FUNÇÃO: obterIconeTipo
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Analisa a string do tipo de projeto e retorna o ícone vetorial correspondente da
   * biblioteca `lucide-react` com a cor característica de cada categoria.
   */
  function obterIconeTipo(tipo) {
    switch (tipo) {
      case 'DESENVOLVIMENTO': return <Code size={22} style={{ color: '#06b6d4' }} />;
      case 'CAMPANHA': return <Megaphone size={22} style={{ color: '#f97316' }} />;
      case 'COORDENACAO': return <Users size={22} style={{ color: '#10b981' }} />;
      case 'SALA_DE_AULA': return <GraduationCap size={22} style={{ color: '#8b5cf6' }} />;
      default: return <Folder size={22} style={{ color: '#9ca3af' }} />;
    }
  }

  // ===================================================================================
  // ROTEAMENTO INTERNO DE ECRÃS (SPA Approach)
  // ===================================================================================
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

  if (telaAtiva === 'DELETAR_USUARIO') {
    return (
      <TelaDeletarUsuario 
        usuarioLogado={usuarioLogado}
        aoVoltar={() => definirTelaAtiva('LISTA')}
      />
    );
  }

  if (telaAtiva === 'EDITAR_USUARIO') {
    return (
      <TelaEditarUsuario 
        usuarioLogado={usuarioSessao}
        aoVoltar={() => definirTelaAtiva('LISTA')}
        aoAtualizarUsuarioLogado={(usuarioAtualizado) => {
          // Atualiza o estado local da sessão para refletir a nova foto e nome na navbar instantaneamente
          const novoObj = { ...usuarioSessao, ...usuarioAtualizado };
          definirUsuarioSessao(novoObj);
          // Garante a propagação na referência original se necessário
          Object.assign(usuarioLogado, usuarioAtualizado);
        }}
      />
    );
  }

  if (telaAtiva === 'FORMAR_TIMES') {
    return (
      <TelaFormarTimes 
        usuarioLogado={usuarioSessao}
        aoVoltar={() => definirTelaAtiva('LISTA')}
      />
    );
  }

  // ===================================================================================
  // RENDERIZAÇÃO DA TELA PRINCIPAL (LISTA DE PROJETOS E NAVBAR)
  // ===================================================================================
  return (
    <div className="entrada-container d-flex flex-column">
      
      {/* NAVBAR SUPERIOR */}
      <div className="navbar-forja-superior mb-4 container py-3 px-4">
        
        {/* LADO ESQUERDO: Avatar e Informações do Utilizador Logado */}
        <div className="d-flex align-items-center gap-3">
          <div className="icone-usuario-avatar" style={{ overflow: 'hidden' }}>
            {usuarioSessao?.foto_perfil ? (
              <img 
                src={`${CONFIG_REDE.URL_BACKEND}${usuarioSessao.foto_perfil}?t=${Date.now()}`} 
                alt={usuarioSessao.nome} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
              />
            ) : (
              <User size={24} className="text-info" />
            )}
          </div>
          <div className="d-flex flex-column">
            <span className="text-muted small lh-1 mb-1">Logado como:</span>
            <div className="d-flex align-items-center gap-2">
              <strong className="text-light fs-6 lh-1">{usuarioSessao?.nome}</strong>
              <span className={`badge-perfil perfil-${usuarioSessao?.perfil?.toLowerCase()}`}>
                {usuarioSessao?.perfil}
              </span>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: Botões de Ação Dinâmicos Baseados no Perfil */}
        <div className="d-flex align-items-center flex-wrap botoes-acao-navbar">
          
          {/* Botão Global de Atualizar Listagem */}
          <button 
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" 
            onClick={carregarProjetos}
            title="Atualizar Projetos"
            style={{ marginRight: '15px', marginBottom: '15px' }}
          >
            <RefreshCw size={15} /> <span className="d-none d-md-inline">Atualizar</span>
          </button>

          {/* Ações Exclusivas para Administradores */}
          {usuarioLogado?.perfil === 'admin' && (
            <>
              <button 
                className="btn btn-sm btn-outline-info d-flex align-items-center gap-1" 
                title="Cadastrar Utilizador"
                onClick={() => definirTelaAtiva('CADASTRAR_USUARIO')}
                style={{ marginRight: '15px', marginBottom: '15px' }}
              >
                <UserPlus size={15} /> <span className="d-none d-md-inline">Cadastrar Utilizador</span>
              </button>
              <button 
                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" 
                title="Deletar Utilizador"
                onClick={() => definirTelaAtiva('DELETAR_USUARIO')}
                style={{ marginRight: '15px', marginBottom: '15px' }}
              >
                <Trash2 size={15} /> <span className="d-none d-md-inline">Deletar Utilizador</span>
              </button>
            </>
          )}

          {/* Botão de Editar Perfil (Disponível para Admin ou Utilizador Comum) */}
          <button 
            className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1" 
            title={usuarioLogado?.perfil === 'admin' ? 'Editar Utilizador' : 'Editar Meu Perfil'}
            onClick={() => definirTelaAtiva('EDITAR_USUARIO')}
            style={{ marginRight: '15px', marginBottom: '15px' }}
          >
            <Edit3 size={15} />{' '}
            <span className="d-none d-md-inline">
              {usuarioLogado?.perfil === 'admin' ? 'Editar Utilizador' : 'Meu Perfil'}
            </span>
          </button>

          {/* Ações para Administradores e Editores: Formar Equipa */}
          {(usuarioLogado?.perfil === 'admin' || usuarioLogado?.perfil === 'editor') && (
            <button 
              className="btn btn-sm btn-outline-success d-flex align-items-center gap-1" 
              onClick={() => definirTelaAtiva('FORMAR_TIMES')} 
              title="Formar / Editar Equipa"
              style={{ marginRight: '15px', marginBottom: '15px' }}
            >
              <UserCheck size={15} /> <span className="d-none d-md-inline">Formar Equipa</span>
            </button>
          )}

          {/* EXTREMA DIREITA: Botão de Terminar Sessão (Logout) */}
          <div className="divisoria-navbar" style={{ marginBottom: '15px' }}>
            <button className="btn btn-sm botao-forja-vermelho d-flex align-items-center gap-1" onClick={aoFazerLogout}>
              <LogOut size={15} /> Sair
            </button>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL (LISTAGEM DE PROJETOS) */}
      <div className="container flex-grow-1" style={{ maxWidth: '1350px' }}>
        
        {/* LOGOTIPO DA FORJA DE PROMPTS */}
        <div className="mb-4 mt-2">
          <img src={logoHorizontal} alt="Forja de Prompts" style={{ maxWidth: '280px' }} />
        </div>

        <div className="d-flex flex-column mb-4 cabecalho-secao-projetos">
          <h3 className="fw-bold mb-1">Seus Projetos na Forja</h3>
          
          <div className="d-flex align-items-center flex-row">
            <p className="text-muted small mb-0" style={{ display: 'inline-block' }}>
              Selecione um projeto existente ou crie um novo para gerenciar contextos e prompts clicando no botão ao lado.
            </p>
            
            {/* Botão Circular Laranja para Criar Novo Projeto */}
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

        {/* GRADE DE CARTÕES DE PROJETOS */}
        <div className="row grade-projetos">
          {listaProjetos.map((proj) => (
            <div key={proj.id} className="col-12 mb-4" style={{ marginBottom: '15px' }}>
              <div className="cartao-projeto-forja">
                
                {/* Corpo do Cartão (Clica para Acessar o Projeto) */}
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

                {/* Rodapé do Cartão com Ações de Acesso, Edição e Exclusão */}
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

          {/* Mensagem exibida caso não existam projetos cadastrados */}
          {listaProjetos.length === 0 && (
            <div className="col-12 text-center py-5">
              <p className="text-muted">Nenhum projeto cadastrado ainda. Clique no ícone de mais (+) ao lado para criar um novo projeto!</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PARA CONVIDAR / FORMAR EQUIPA */}
      {modalTimeAberto && (
        <div className="modal-overlay-forja">
          <div className="card-edicao-forja p-4 w-100" style={{ maxWidth: '500px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="text-warning mb-0 d-flex align-items-center gap-2">
                <UserCheck size={20} /> Formar Equipa
              </h5>
            </div>
            
            <form onSubmit={enviarSolicitacaoTime}>
              <div className="mb-3">
                <label className="text-muted small mb-1">Selecione o Projeto</label>
                <select className="form-select formulario-input-dark" required value={projetoSelecionadoParaTime} onChange={(e) => definirProjetoSelecionadoParaTime(e.target.value)}>
                  <option value="">-- Escolha --</option>
                  {listaProjetos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="text-muted small mb-1">E-mail ou Login do Utilizador</label>
                <input type="text" className="form-control formulario-input-dark" required placeholder="ex: utilizador@email.com" value={emailConvite} onChange={(e) => definirEmailConvite(e.target.value)} />
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn botao-forja-vermelho" onClick={() => definirModalTimeAberto(false)}>Cancelar</button>
                <button type="submit" className="btn botao-forja-laranja">Enviar Convite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}