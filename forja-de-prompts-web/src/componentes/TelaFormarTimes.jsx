// Importa o React e os hooks essenciais:
// - useState: para gerir estados locais (lista de projetos, membros, campos de formulário).
// - useEffect: para carregar dados automaticamente ao iniciar a tela ou mudar o projeto.
import React, { useState, useEffect } from 'react';

// Importa os ícones vetoriais da biblioteca 'lucide-react'
import {
  ArrowLeft,
  Users,
  UserPlus,
  Trash2,
  Edit2,
  Check,
  ShieldAlert
} from 'lucide-react';

// Importa a configuração de rede centralizada (URL_BACKEND)
import { CONFIG_REDE } from './config';

// Importa as folhas de estilos CSS correspondentes
import '../estilos/TelaCadastroUsuario.css';
import '../estilos/TelaFormarTimes.css';

/**
 * FUNÇÃO / COMPONENTE PRINCIPAL: TelaFormarTimes
 * -------------------------------------------------------------------------------------
 * O QUE FAZ:
 * Permite gerir as equipas e membros associados aos projetos da aplicação.
 * - Administradores podem alternar livremente entre qualquer projeto do sistema.
 * - Editores conseguem gerir os membros dos projetos aos quais estão vinculados.
 * - Permite adicionar novos integrantes por e-mail/login, definir cargos e níveis de acesso,
 *   além de editar funções ou remover utilizadores da equipa.
 */
export default function TelaFormarTimes({ usuarioLogado, aoVoltar }) {
  // Estados locais para projetos, projeto ativo selecionado e lista de membros
  const [projetos, definirProjetos] = useState([]);
  const [projetoSelecionado, definirProjetoSelecionado] = useState(null);
  const [membros, definirMembros] = useState([]);
  const [carregando, definirCarregando] = useState(true);
  const [erroTela, definirErroTela] = useState(null);

  // Estados do formulário de adição de novos membros
  const [identificador, definirIdentificador] = useState('');
  const [funcao, definirFuncao] = useState('');
  const [nivelAcesso, definirNivelAcesso] = useState('VISUALIZADOR');
  const [editandoMembro, definirEditandoMembro] = useState(null);

  // Constantes de verificação de permissões do utilizador logado
  const ehAdmin = usuarioLogado?.perfil === 'admin';
  const ehAdminOuEditor = usuarioLogado?.perfil === 'admin' || usuarioLogado?.perfil === 'editor';

  // Efeito 1: Carrega a lista de projetos acessíveis pelo utilizador ao abrir o ecrã
  useEffect(() => {
    const carregarProjetos = async () => {
      definirCarregando(true);
      try {
        const resposta = await fetch(
          `${CONFIG_REDE.URL_BACKEND}/projetos?usuario_logado_id=${usuarioLogado.id}&perfil_logado=${usuarioLogado.perfil}`
        );
        if (resposta.ok) {
          const dados = await resposta.json();
          if (Array.isArray(dados)) {
            definirProjetos(dados);
            if (dados.length > 0) {
              definirProjetoSelecionado(dados[0]);
            }
          }
        }
      } catch (erro) {
        console.error('Erro ao carregar projetos:', erro);
        definirErroTela('Erro de conexão ao carregar projetos.');
      } finally {
        definirCarregando(false);
      }
    };
    carregarProjetos();
  }, [usuarioLogado]);

  // Efeito 2: Carrega os membros sempre que o projeto selecionado muda
  useEffect(() => {
    if (projetoSelecionado?.id) {
      carregarMembros(projetoSelecionado.id);
    }
  }, [projetoSelecionado]);

  /**
   * FUNÇÃO: carregarMembros
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Faz uma requisição `GET` ao backend para buscar todos os membros integrados no
   * projeto informado (`/projetos/:projId/membros`) e atualiza o estado `membros`.
   */
  const carregarMembros = async (projId) => {
    try {
      const resposta = await fetch(`${CONFIG_REDE.URL_BACKEND}/projetos/${projId}/membros`);
      if (resposta.ok) {
        const dados = await resposta.json();
        if (Array.isArray(dados)) {
          definirMembros(dados);
        } else {
          definirMembros([]);
        }
      } else {
        definirMembros([]);
      }
    } catch (erro) {
      console.error('Erro ao carregar membros:', erro);
      definirMembros([]);
    }
  };

  /**
   * FUNÇÃO: aoAdicionarMembro (antiga handleAdicionarMembro)
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Processa a submissão do formulário para adicionar um novo integrante ao projeto ativo.
   * Envia uma requisição `POST` para `/projetos/:id/membros` contendo o identificador
   * (e-mail ou login), a função e o nível de acesso. Atualiza a lista em caso de sucesso.
   */
  const aoAdicionarMembro = async (e) => {
    e.preventDefault();
    if (!projetoSelecionado) return;

    try {
      const resposta = await fetch(
        `${CONFIG_REDE.URL_BACKEND}/projetos/${projetoSelecionado.id}/membros`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identificador,
            funcao,
            nivelAcesso
          })
        }
      );
      
      const conteudo = await resposta.json().catch(() => ({}));

      if (resposta.ok) {
        alert('Membro adicionado com sucesso!');
        definirIdentificador('');
        definirFuncao('');
        carregarMembros(projetoSelecionado.id);
      } else {
        alert(conteudo.mensagem || 'Erro ao adicionar membro.');
      }
    } catch (erro) {
      console.error('Erro:', erro);
      alert('Erro de conexão com a API ao tentar adicionar membro.');
    }
  };

  /**
   * FUNÇÃO: aoRemoverMembro (antiga handleRemoverMembro)
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Remove um membro da equipa do projeto após confirmação via janela pop-up nativa.
   * Envia uma requisição `DELETE` para `/projetos/:id/membros/:usuarioId` e recarrega a lista.
   */
  const aoRemoverMembro = async (usuarioId, nome) => {
    if (!window.confirm(`Deseja remover "${nome}" deste projeto?`)) return;

    try {
      const resposta = await fetch(
        `${CONFIG_REDE.URL_BACKEND}/projetos/${projetoSelecionado.id}/membros/${usuarioId}`,
        { method: 'DELETE' }
      );
      if (resposta.ok) {
        alert('Membro removido com sucesso!');
        carregarMembros(projetoSelecionado.id);
      } else {
        const conteudo = await resposta.json().catch(() => ({}));
        alert(conteudo.mensagem || 'Erro ao remover membro.');
      }
    } catch (erro) {
      console.error('Erro:', erro);
      alert('Erro de conexão.');
    }
  };

  /**
   * FUNÇÃO: aoSalvarFuncao (antiga handleSalvarFuncao)
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Atualiza a função (cargo) e o nível de permissão de um membro na equipa.
   * Envia um pedido `PUT` para `/projetos/:id/membros/:usuarioId` e fecha o modo de edição.
   */
  const aoSalvarFuncao = async (usuarioId, novaFuncao, novoNivel) => {
    try {
      const resposta = await fetch(
        `${CONFIG_REDE.URL_BACKEND}/projetos/${projetoSelecionado.id}/membros/${usuarioId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ funcao: novaFuncao, nivelAcesso: novoNivel })
        }
      );
      if (resposta.ok) {
        alert('Função atualizada com sucesso!');
        definirEditandoMembro(null);
        carregarMembros(projetoSelecionado.id);
      } else {
        alert('Erro ao atualizar função.');
      }
    } catch (erro) {
      console.error('Erro:', erro);
    }
  };

  // Se houver um erro crítico no ecrã, exibe uma mensagem formatada
  if (erroTela) {
    return (
      <div className="tela-cadastro-usuario-container">
        <div className="container w-100 text-center" style={{ maxWidth: '500px' }}>
          <div className="card-edicao-forja p-4">
            <ShieldAlert size={48} className="text-danger mb-3 mx-auto" />
            <h4 className="fw-bold text-danger mb-2">Erro</h4>
            <p className="text-muted small mb-4">{erroTela}</p>
            <button className="btn botao-forja-vermelho w-100" onClick={aoVoltar}>
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================================================================================
  // RENDERIZAÇÃO DA INTERFACE PRINCIPAL
  // ===================================================================================
  return (
    <div className="tela-cadastro-usuario-container">
      <div className="container w-100" style={{ maxWidth: '1000px' }}>
        
        {/* Cabeçalho do Ecrã */}
        <div className="cabecalho-cadastro-forja mb-4">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary text-light d-flex align-items-center gap-1"
            onClick={aoVoltar}
          >
            <ArrowLeft size={16} /> Voltar
          </button>

          <h4 className="fw-bold text-info mb-0 d-flex align-items-center gap-2">
            <Users size={22} /> Formar e Gerenciar Equipas do Projeto
          </h4>
        </div>

        <div className="card-edicao-forja p-4 mb-4">
          {/* Seletor de Projeto: Administradores escolhem livremente; Editores veem o projeto associado */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom border-secondary gap-3">
            <div>
              <span className="text-muted small d-block">Projeto Ativo Associado:</span>
              <h3 className="text-warning fw-bold mb-0">
                {projetoSelecionado ? projetoSelecionado.titulo : 'Nenhum projeto selecionado'}
              </h3>
            </div>

            {projetos.length > 0 && (
              <div>
                {ehAdmin ? (
                  <select
                    className="form-select formulario-input-dark"
                    value={projetoSelecionado?.id || ''}
                    onChange={(e) => {
                      const proj = projetos.find((item) => Number(item.id) === Number(e.target.value));
                      definirProjetoSelecionado(proj);
                    }}
                  >
                    {projetos.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.titulo}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="badge bg-dark border border-info text-info p-2">
                    Projeto Vinculado: {projetoSelecionado?.titulo}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Formulário para Adicionar Integrante (Disponível apenas para Administradores ou Editores) */}
          {ehAdminOuEditor ? (
            <div className="mb-4 p-3 rounded border border-info bg-dark bg-opacity-50">
              <h4 className="text-info fw-semibold mb-3 d-flex align-items-center gap-2">
                <UserPlus size={18} /> Adicionar Integrante ao Projeto
              </h4>
              <form onSubmit={aoAdicionarMembro} className="row g-3 align-items-end">
                <div className="col-12 col-md-4">
                  <label className="form-label text-muted small">E-mail ou Login do Utilizador</label>
                  <input
                    type="text"
                    className="form-control formulario-input-dark"
                    required
                    placeholder="ex: utilizador@email.com"
                    value={identificador}
                    onChange={(e) => definirIdentificador(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label text-muted small">Função / Cargo</label>
                  <input
                    type="text"
                    className="form-control formulario-input-dark"
                    required
                    placeholder="ex: Desenvolvedor Front-end"
                    value={funcao}
                    onChange={(e) => definirFuncao(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label text-muted small">Nível de Acesso</label>
                  <select
                    className="form-select formulario-input-dark"
                    value={nivelAcesso}
                    onChange={(e) => definirNivelAcesso(e.target.value)}
                  >
                    <option value="VISUALIZADOR">Visualizador</option>
                    <option value="EDITOR">Editor</option>
                    <option value="ADMINISTRADOR">Administrador</option>
                  </select>
                </div>
                <div className="col-12 col-md-2" style={{ marginTop: '15px' }}>
                  <button type="submit" className="btn botao-forja-laranja w-100 fw-bold">
                    Adicionar
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="alert alert-info py-2 small mb-4">
              Você está a visualizar os membros da equipa deste projeto. Apenas Administradores e Editores podem adicionar ou editar integrantes.
            </div>
          )}

          {/* Listagem de Membros Integrantes do Projeto */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="text-light fw-bold mb-0">Membros Integrantes da Equipa</h4>
            <span className="text-muted small" style={{ marginBottom: '15px' }}>Total: <strong>{membros.length}</strong></span>
          </div>

          {carregando ? (
            <div className="text-center py-4 text-muted">A carregar membros...</div>
          ) : membros.length === 0 ? (
            <div className="text-center py-4 text-muted">Nenhum membro cadastrado neste projeto ainda.</div>
          ) : (
            <div className="d-flex flex-column" style={{ gap: '15px' }}>
              {membros.map((m, index) => {
                const emEdicao = editandoMembro === m.usuario_id;
                const corFundoCard = index % 2 === 0 ? 'rgba(31, 41, 55, 0.75)' : 'rgba(17, 24, 39, 0.9)';

                return (
                  <div
                    key={m.usuario_id}
                    className="p-3 rounded shadow-sm border border-secondary"
                    style={{
                      backgroundColor: corFundoCard,
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div className="linha-card-membro-forja">
                      
                      {/* Avatar, Nome e Login */}
                      <div className="item-membro-dados">
                        {m.foto_perfil ? (
                          <img
                            src={`${CONFIG_REDE.URL_BACKEND}${m.foto_perfil}`}
                            alt={m.nome}
                            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(6,182,212,0.4)', flexShrink: 0 }}
                          />
                        ) : (
                          <div
                            className="bg-secondary rounded-circle d-flex align-items-center justify-content-center text-light fw-bold small shadow-sm"
                            style={{ width: '42px', height: '42px', minWidth: '42px', flexShrink: 0 }}
                          >
                            {m.nome ? m.nome.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div className="d-flex flex-column justify-content-center text-truncate">
                          <div className="fw-semibold text-light text-truncate" style={{ fontSize: '0.98rem' }}>
                            {m.nome}
                          </div>
                          <div className="small text-muted text-truncate">@{m.login}</div>
                        </div>
                      </div>

                      {/* Endereço de E-mail */}
                      <div className="item-membro-email">
                        <span className="small text-light text-truncate" title={m.email}>
                          {m.email}
                        </span>
                      </div>

                      {/* Cargo / Função e Nível de Acesso */}
                      <div className="item-membro-funcao">
                        {emEdicao && ehAdminOuEditor ? (
                          <ItemMembroEdicao 
                            membroInicial={m} 
                            onSalvar={(novaFunc, novoNiv) => aoSalvarFuncao(m.usuario_id, novaFunc, novoNiv)}
                            onCancelar={() => definirEditandoMembro(null)}
                          />
                        ) : (
                          <div>
                            <span className="text-info fw-semibold">Função: {m.funcao || 'Membro'}</span>
                            <div className="small text-muted">Perfil: {m.nivel_acesso}</div>
                          </div>
                        )}
                      </div>

                      {/* Botões de Ação (Editar Função e Remover Membro) */}
                      <div className="item-membro-acoes">
                        {ehAdminOuEditor && !emEdicao && (
                          <>
                            <button
                              type="button"
                              className="btn botao-forja-laranja botao-acao-membro-tabela"
                              onClick={() => definirEditandoMembro(m.usuario_id)}
                              title="Editar Função"
                            >
                              <Edit2 size={16} />
                            </button>

                            <button
                              type="button"
                              className="btn botao-forja-vermelho botao-acao-membro-tabela"
                              onClick={() => aoRemoverMembro(m.usuario_id, m.nome)}
                              title="Remover da Equipa"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="d-flex justify-content-end mt-4 pt-3 border-top border-secondary"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * COMPONENTE INTERNO: ItemMembroEdicao
 * -------------------------------------------------------------------------------------
 * O QUE FAZ:
 * Renderiza os campos de edição em linha (input de texto para a função e seletor dropdown
 * para o nível de acesso) juntamente com os botões de confirmação e cancelamento.
 */
function ItemMembroEdicao({ membroInicial, onSalvar, onCancelar }) {
  const [novaFunc, definirNovaFunc] = useState(membroInicial.funcao || '');
  const [novoNiv, definirNovoNiv] = useState(membroInicial.nivel_acesso || 'VISUALIZADOR');

  return (
    <div className="d-flex flex-column gap-2 w-100">
      <input
        type="text"
        className="form-control form-control-sm formulario-input-dark"
        value={novaFunc}
        onChange={(e) => definirNovaFunc(e.target.value)}
        placeholder="Função"
      />
      <div className="d-flex gap-2 mb-5" style={{ marginBottom: '15px' }}>
        <select
          className="form-select form-select-sm formulario-input-dark"
          value={novoNiv}
          onChange={(e) => definirNovoNiv(e.target.value)}
        >
          <option value="VISUALIZADOR">Visualizador</option>
          <option value="EDITOR">Editor</option>
          <option value="ADMINISTRADOR">Admin</option>
        </select>
        <button
          type="button"
          className="btn btn-sm btn-success px-2"
          onClick={() => onSalvar(novaFunc, novoNiv)}
          title="Salvar"
        >
          <Check size={14} />
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary px-2"
          onClick={onCancelar}
          title="Cancelar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}