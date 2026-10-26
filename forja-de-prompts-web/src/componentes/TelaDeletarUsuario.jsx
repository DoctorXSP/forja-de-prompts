import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  UserX,
  Trash2,
  CheckSquare,
  Square,
  ShieldAlert,
  X
} from 'lucide-react';
import { CONFIG_REDE } from './config';
import '../estilos/TelaCadastroUsuario.css';
import '../estilos/TelaDeletarUsuario.css';

export default function TelaDeletarUsuario({ usuarioLogado, aoVoltar }) {
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [selecionados, setSelecionados] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);

  const ehAdmin = usuarioLogado?.perfil === 'admin';

  const carregarUsuarios = async () => {
    setCarregando(true);
    try {
      const response = await fetch(`${CONFIG_REDE.URL_BACKEND}/usuarios`);
      if (response.ok) {
        const dados = await response.json();
        setListaUsuarios(dados);
      } else {
        alert('Erro ao carregar lista de usuários.');
      }
    } catch (error) {
      console.error('Erro de conexão:', error);
      alert('Erro de conexão ao tentar buscar os usuários.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (ehAdmin) {
      carregarUsuarios();
    }
  }, [ehAdmin]);

  if (!ehAdmin) {
    return (
      <div className="tela-cadastro-usuario-container">
        <div className="container w-100 text-center" style={{ maxWidth: '500px' }}>
          <div className="card-edicao-forja p-4">
            <ShieldAlert size={48} className="text-danger mb-3 mx-auto" />
            <h4 className="fw-bold text-danger mb-2">Acesso Restrito</h4>
            <p className="text-muted small mb-4">
              Apenas administradores têm permissão para acessar a tela de exclusão de usuários.
            </p>
            <button className="btn botao-forja-vermelho w-100" onClick={aoVoltar}>
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  const toggleSelecionar = (id) => {
    if (Number(id) === Number(usuarioLogado?.id)) {
      alert('Você não pode selecionar a si mesmo para exclusão.');
      return;
    }
    setSelecionados((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSelecionarTodos = () => {
    const idsElegiveis = listaUsuarios.filter((u) => Number(u.id) !== Number(usuarioLogado?.id));
    const todosSelecionados = idsElegiveis.every((u) => selecionados[u.id]);

    const novoEstado = {};
    if (!todosSelecionados) {
      idsElegiveis.forEach((u) => {
        novoEstado[u.id] = true;
      });
    }
    setSelecionados(novoEstado);
  };

  const handleDeleteUnico = async (id, nomeUsuario) => {
    if (Number(id) === Number(usuarioLogado?.id)) {
      alert('Você não pode excluir o seu próprio usuário ativo.');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o usuário "${nomeUsuario}"?`)) {
      return;
    }

    setProcessando(true);
    try {
      const response = await fetch(`${CONFIG_REDE.URL_BACKEND}/usuarios/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Usuário excluído com sucesso!');
        carregarUsuarios();
        setSelecionados((prev) => {
          const copia = { ...prev };
          delete copia[id];
          return copia;
        });
      } else {
        const data = await response.json();
        alert(data.mensagem || 'Erro ao excluir usuário.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro de conexão ao tentar excluir o usuário.');
    } finally {
      setProcessando(false);
    }
  };

  const handleDeleteLote = async () => {
    const idsParaDeletar = Object.keys(selecionados).filter((id) => selecionados[id]);

    if (idsParaDeletar.length === 0) {
      alert('Selecione pelo menos um usuário para exclusão em lote.');
      return;
    }

    if (
      !window.confirm(
        `Tem certeza que deseja excluir permanentemente os ${idsParaDeletar.length} usuários selecionados?`
      )
    ) {
      return;
    }

    setProcessando(true);
    try {
      const promessas = idsParaDeletar.map((id) =>
        fetch(`${CONFIG_REDE.URL_BACKEND}/usuarios/${id}`, { method: 'DELETE' })
      );

      const resultados = await Promise.all(promessas);
      const algumErro = resultados.some((res) => !res.ok);

      if (!algumErro) {
        alert('Usuários selecionados excluídos com sucesso!');
        setSelecionados({});
        carregarUsuarios();
      } else {
        alert('Alguns usuários não puderam ser excluídos.');
        carregarUsuarios();
      }
    } catch (error) {
      console.error('Erro no lote:', error);
      alert('Erro de conexão ao processar exclusão em lote.');
    } finally {
      setProcessando(false);
    }
  };

  const totalSelecionados = Object.keys(selecionados).filter((k) => selecionados[k]).length;
  const idsElegiveis = listaUsuarios.filter((u) => Number(u.id) !== Number(usuarioLogado?.id));
  const todosSelecionados = idsElegiveis.length > 0 && idsElegiveis.every((u) => selecionados[u.id]);

  return (
    <div className="tela-cadastro-usuario-container">
      <div className="container w-100" style={{ maxWidth: '1000px' }}>
        
        {/* Cabeçalho */}
        <div className="cabecalho-cadastro-forja mb-4">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary text-light d-flex align-items-center gap-1"
            onClick={aoVoltar}
          >
            <ArrowLeft size={16} /> Voltar
          </button>

          <h4 className="fw-bold text-danger mb-0 d-flex align-items-center gap-2">
            <UserX size={22} /> Gerenciamento e Exclusão de Usuários
          </h4>
        </div>

        <div className="card-edicao-forja p-4">
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary flex-wrap" style={{ gap: '15px' }}>
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div>
                <span className="text-muted small">Total cadastrados: </span>
                <strong className="text-info">{listaUsuarios.length}</strong>
              </div>

              {/* Botão Selecionar Todos com o estilo .botao-acao-editar solicitado */}
              {idsElegiveis.length > 0 && (
                <button
                  type="button"
                  className="btn d-flex align-items-center gap-1 botao-acao-editar-custom"
                  onClick={toggleSelecionarTodos}
                  title="Selecionar Todos / Desmarcar"
                >
                  <CheckSquare size={16} /> 
                  <span>{todosSelecionados ? 'Desmarcar Todos' : 'Selecionar Todos'}</span>
                </button>
              )}
            </div>

            {totalSelecionados > 0 && (
              <button
                type="button"
                className="btn btn-sm botao-forja-vermelho d-flex align-items-center gap-2 shadow-sm"
                onClick={handleDeleteLote}
                disabled={processando}
                style={{ margin: '15px 0', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                <Trash2 size={16} /> Excluir Selecionados ({totalSelecionados})
              </button>
            )}
          </div>

          {carregando ? (
            <div className="text-center py-5 text-muted">Carregando usuários...</div>
          ) : listaUsuarios.length === 0 ? (
            <div className="text-center py-5 text-muted">Nenhum usuário encontrado na base.</div>
          ) : (
            <div className="d-flex flex-column" style={{ gap: '15px' }}>
              {listaUsuarios.map((u, index) => {
                const eEu = Number(u.id) === Number(usuarioLogado?.id);
                const estaSelecionado = !!selecionados[u.id];

                const corFundoCard = index % 2 === 0 ? 'rgba(31, 41, 55, 0.75)' : 'rgba(17, 24, 39, 0.9)';

                return (
                  <div
                    key={u.id}
                    className="p-3 rounded shadow-sm border border-secondary"
                    style={{
                      backgroundColor: corFundoCard,
                      backdropFilter: 'blur(10px)',
                      opacity: eEu ? 0.85 : 1
                    }}
                  >
                    <div className="linha-card-usuario-forja">
                      
                      {/* Checkbox */}
                      <div className="item-coluna-checkbox">
                        {!eEu ? (
                          <button
                            type="button"
                            className="btn btn-link p-0 text-decoration-none d-flex align-items-center justify-content-center"
                            onClick={() => toggleSelecionar(u.id)}
                            title={estaSelecionado ? 'Desmarcar' : 'Selecionar'}
                          >
                            {estaSelecionado ? (
                              <CheckSquare size={22} className="text-warning" />
                            ) : (
                              <Square size={22} className="text-muted" />
                            )}
                          </button>
                        ) : (
                          <span className="text-muted small" title="Você não pode se excluir">—</span>
                        )}
                      </div>

                      {/* Avatar + Nome + Login */}
                      <div className="item-coluna-dados-usuario">
                        {u.foto_perfil ? (
                          <img
                            src={`${CONFIG_REDE.URL_BACKEND}${u.foto_perfil}`}
                            alt={u.nome}
                            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(6,182,212,0.4)', flexShrink: 0 }}
                          />
                        ) : (
                          <div
                            className="bg-secondary rounded-circle d-flex align-items-center justify-content-center text-light fw-bold small shadow-sm"
                            style={{ width: '42px', height: '42px', minWidth: '42px', flexShrink: 0 }}
                          >
                            {u.nome ? u.nome.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div className="d-flex flex-column justify-content-center text-truncate">
                          <div className="fw-semibold text-light text-truncate" style={{ fontSize: '0.98rem' }}>
                            {u.nome} {eEu && <span className="text-info small ms-1">(Você)</span>}
                          </div>
                          <div className="small text-muted text-truncate">@{u.login}</div>
                        </div>
                      </div>

                      {/* E-mail */}
                      <div className="item-coluna-email">
                        <span className="small text-light text-truncate" title={u.email}>
                          {u.email}
                        </span>
                      </div>

                      {/* Perfil */}
                      <div className="item-coluna-perfil">
                        <span className="badge bg-dark border border-secondary text-uppercase small px-3 py-2">
                          {u.perfil}
                        </span>
                      </div>

                      {/* Botão Excluir */}
                      <div className="item-coluna-acao">
                        {!eEu ? (
                          <button
                            type="button"
                            className="btn btn-sm p-0 d-inline-flex align-items-center justify-content-center shadow-sm transition-all"
                            onClick={() => handleDeleteUnico(u.id, u.nome)}
                            title="Excluir este usuário"
                            disabled={processando}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '0.45rem',
                              backgroundColor: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.6)',
                              color: '#f87171'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#ef4444';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                              e.currentTarget.style.color = '#f87171';
                            }}
                          >
                            <X size={20} strokeWidth={2.5} />
                          </button>
                        ) : (
                          <span className="text-muted small" style={{ width: '36px', textAlign: 'center' }}>—</span>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="d-flex justify-content-end mt-4 pt-3 border-top border-secondary">
            <button type="button" className="btn botao-forja-vermelho px-4" onClick={aoVoltar}>
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}