// Importa o React e os hooks essenciais:
// - useState: para gerir estados locais (lista de missões, membros, campos do modal).
// - useEffect: para carregar missões e membros da equipa ao abrir o ecrã.
import React, { useState, useEffect } from 'react';

// Importa os ícones vetoriais da biblioteca 'lucide-react'
import { 
  ArrowLeft, PlusCircle, Edit, Trash2, Calendar, Clock, 
  Users, AlertTriangle, CheckCircle2, Kanban, RefreshCw 
} from 'lucide-react';

// Importa a configuração de rede centralizada (URL_BACKEND)
import { CONFIG_REDE } from './config';

// Importa as folhas de estilos CSS correspondentes
import '../estilos/PainelPrincipal.css';
import '../estilos/MissoesELivro.css';

// Definição estática das 4 colunas fixas do quadro Kanban
const COLUNAS_FIXAS = [
  { id: 'A_FAZER', titulo: 'À Fazer', cor: '#9ca3af' },
  { id: 'EM_EXECUCAO', titulo: 'Em Execução', cor: '#38bdf8' },
  { id: 'TESTES', titulo: 'Testes', cor: '#f59e0b' },
  { id: 'CONCLUIDO', titulo: 'Concluído', cor: '#10b981' }
];

/**
 * FUNÇÃO / COMPONENTE PRINCIPAL: TelaMissoes
 * -------------------------------------------------------------------------------------
 * O QUE FAZ:
 * Renderiza o quadro Kanban de missões do projeto com 4 colunas fixas.
 * - Permite arrastar e soltar cartões entre colunas (Drag and Drop).
 * - Calcula automaticamente prazos para destacar bordas a laranja (até 3 dias) ou a vermelho (vencido).
 * - Oferece funcionalidades completas para criar, editar, excluir missões e selecionar integrantes.
 */
export default function TelaMissoes({ projeto, usuarioLogado, aoVoltar, aoAbrirLivroDeBordo }) {
  // Estados locais para armazenar missões, membros da equipa e controle de arrasto
  const [listaMissoes, definirListaMissoes] = useState([]);
  const [membrosEquipe, definirMembrosEquipe] = useState([]);
  const [colunaDragOver, definirColunaDragOver] = useState(null);

  // Estados de controlo do modal de criação e edição de missões
  const [modalAberto, definirModalAberto] = useState(false);
  const [missaoEditando, definirMissaoEditando] = useState(null);

  // Estados dos campos do formulário da missão
  const [titulo, definirTitulo] = useState('');
  const [integrantes, definirIntegrantes] = useState('');
  const [descricao, definirDescricao] = useState('');
  const [observacao, definirObservacao] = useState('');
  const [colunaSelecionada, definirColunaSelecionada] = useState('A_FAZER');
  const [dataCriacao, definirDataCriacao] = useState('');
  const [tempoEstimadoDias, definirTempoEstimadoDias] = useState(3);

  // Efeito: Carrega as missões e os membros do projeto ao montar o componente ou mudar o ID do projeto
  useEffect(() => {
    carregarMissoes();
    carregarMembrosProjeto();
  }, [projeto.id]);

  /**
   * FUNÇÃO: carregarMissoes
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Faz uma requisição `GET` ao backend (`/projetos/:id/missoes`) para obter todas as
   * missões associadas ao projeto atual e atualiza o estado `listaMissoes`.
   */
  async function carregarMissoes() {
    try {
      const resposta = await fetch(`${CONFIG_REDE.URL_BACKEND}/projetos/${projeto.id}/missoes`);
      const dados = await resposta.json();
      if (Array.isArray(dados)) definirListaMissoes(dados);
    } catch (erro) {
      console.error('Erro ao carregar missões:', erro);
    }
  }

  /**
   * FUNÇÃO: carregarMembrosProjeto
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Faz uma requisição `GET` ao backend (`/projetos/:id/membros`) para recolher a lista
   * de membros da equipa do projeto, populando o estado `membrosEquipe`.
   */
  async function carregarMembrosProjeto() {
    try {
      const resposta = await fetch(`${CONFIG_REDE.URL_BACKEND}/projetos/${projeto.id}/membros`);
      const dados = await resposta.json();
      if (Array.isArray(dados)) definirMembrosEquipe(dados);
    } catch (erro) {
      console.error('Erro ao carregar membros:', erro);
    }
  }

  /**
   * FUNÇÃO: obterDataHojeFormatada
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Retorna a data atual formatada estritamente como `YYYY-MM-DD`, compatível com o
   * elemento de formulário `<input type="date">`.
   */
  function obterDataHojeFormatada() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * FUNÇÃO: abrirModalNovaMissao
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Reseta os campos do formulário para o estado inicial de registo, define a coluna
   * padrão de destino, atribui o nome do utilizador logado como integrante inicial e abre o modal.
   */
  function abrirModalNovaMissao(colunaPadrao = 'A_FAZER') {
    definirMissaoEditando(null);
    definirTitulo('');
    definirIntegrantes(usuarioLogado?.nome || '');
    definirDescricao('');
    definirObservacao('');
    definirColunaSelecionada(colunaPadrao);
    definirDataCriacao(obterDataHojeFormatada());
    definirTempoEstimadoDias(5);
    definirModalAberto(true);
  }

  /**
   * FUNÇÃO: abrirModalEdicao
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Configura o modal para o modo de edição, populando os campos com os valores atuais
   * da missão selecionada (título, integrantes, descrição, observação, coluna, data e prazo).
   */
  function abrirModalEdicao(missao) {
    definirMissaoEditando(missao);
    definirTitulo(missao.titulo || '');
    definirIntegrantes(missao.integrantes || '');
    definirDescricao(missao.descricao || '');
    definirObservacao(missao.observacao || '');
    definirColunaSelecionada(missao.coluna || 'A_FAZER');
    const dataFormatada = missao.data_criacao 
      ? new Date(missao.data_criacao).toISOString().split('T')[0] 
      : obterDataHojeFormatada();
    definirDataCriacao(dataFormatada);
    definirTempoEstimadoDias(missao.tempo_estimado_dias || 1);
    definirModalAberto(true);
  }

  /**
   * FUNÇÃO: adicionarIntegranteDaLista
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Adiciona o nome de um membro selecionado da equipa ao campo de texto de integrantes,
   * separando os nomes por vírgula e evitando repetições.
   */
  function adicionarIntegranteDaLista(nomeMembro) {
    const listaAtual = integrantes
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);
    if (!listaAtual.includes(nomeMembro)) {
      listaAtual.push(nomeMembro);
      definirIntegrantes(listaAtual.join(', '));
    }
  }

  /**
   * FUNÇÃO: aoSalvarMissao (antiga salvarMissao)
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Processa a submissão do formulário do modal (criação ou atualização).
   * Envia um pedido `POST` (se for nova missão) ou `PUT` (se for edição) para o backend
   * e, em caso de sucesso, fecha o modal e recarrega o quadro de missões.
   */
  async function aoSalvarMissao(e) {
    e.preventDefault();
    const payload = {
      projetoId: projeto.id,
      criadorId: usuarioLogado?.id,
      titulo,
      integrantes,
      descricao,
      observacao,
      coluna: colunaSelecionada,
      dataCriacao,
      tempoEstimadoDias
    };

    try {
      const url = missaoEditando 
        ? `${CONFIG_REDE.URL_BACKEND}/missoes/${missaoEditando.id}` 
        : `${CONFIG_REDE.URL_BACKEND}/missoes`;
      const metodo = missaoEditando ? 'PUT' : 'POST';

      const resposta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (resposta.ok) {
        definirModalAberto(false);
        carregarMissoes();
      } else {
        alert('Erro ao salvar a missão.');
      }
    } catch (erro) {
      alert('Erro de conexão ao salvar missão.');
    }
  }

  /**
   * FUNÇÃO: aoExcluirMissao (antiga excluirMissao)
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Solicita confirmação ao utilizador e envia um pedido `DELETE` para apagar uma
   * missão permanentemente do sistema, atualizando o quadro em seguida.
   */
  async function aoExcluirMissao(idMissao) {
    if (!window.confirm('Tem certeza que deseja excluir permanentemente esta missão?')) return;
    try {
      const resposta = await fetch(`${CONFIG_REDE.URL_BACKEND}/missoes/${idMissao}`, {
        method: 'DELETE'
      });
      if (resposta.ok) carregarMissoes();
    } catch (erro) {
      alert('Erro ao excluir missão.');
    }
  }

  // =========================================================================
  // LÓGICA DE DRAG AND DROP (ARRASTAR E SOLTAR ENTRE COLUNAS)
  // =========================================================================

  /**
   * FUNÇÃO: aoIniciarArrasto
   * O QUE FAZ: Armazena o ID da missão no objeto `dataTransfer` quando o utilizador começa a arrastar o cartão.
   */
  function aoIniciarArrasto(e, missaoId) {
    e.dataTransfer.setData('text/plain', String(missaoId));
  }

  /**
   * FUNÇÃO: aoPassarPorCimaDaColuna
   * O QUE FAZ: Permite que uma coluna aceite o elemento arrastado e atualiza o estado visual de destaque (*drop zone*).
   */
  function aoPassarPorCimaDaColuna(e, idColuna) {
    e.preventDefault();
    if (colunaDragOver !== idColuna) {
      definirColunaDragOver(idColuna);
    }
  }

  /**
   * FUNÇÃO: aoSoltarNaColuna
   * O QUE FAZ:
   * Executada ao soltar o cartão numa nova coluna. Atualiza o estado local de forma otimizada
   * e envia uma requisição `PATCH` para o backend (`/missoes/:id/coluna`) para persistir a mudança.
   */
  async function aoSoltarNaColuna(e, novaColuna) {
    e.preventDefault();
    definirColunaDragOver(null);
    const idMissao = Number(e.dataTransfer.getData('text/plain'));
    if (!idMissao) return;

    const missaoAlvo = listaMissoes.find((m) => m.id === idMissao);
    if (!missaoAlvo || missaoAlvo.coluna === novaColuna) return;

    // Atualização otimista na interface
    definirListaMissoes((prev) =>
      prev.map((m) => (m.id === idMissao ? { ...m, coluna: novaColuna } : m))
    );

    try {
      await fetch(`${CONFIG_REDE.URL_BACKEND}/missoes/${idMissao}/coluna`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coluna: novaColuna })
      });
      carregarMissoes();
    } catch (erro) {
      alert('Erro ao mover o cartão de coluna.');
      carregarMissoes();
    }
  }

  // =========================================================================
  // CÁLCULO DE PRAZO E COR DA BORDA (3 DIAS = LARANJA | VENCIDO = VERMELHO)
  // =========================================================================

  /**
   * FUNÇÃO: calcularEstadoPrazo
   * O QUE FAZ:
   * Calcula o tempo restante até ao vencimento da missão com base na data de criação e nos
   * dias estimados. Retorna a classe CSS correspondente para colorir a borda do cartão:
   * - `borda-concluida` (se concluído)
   * - `borda-alerta-vermelha` (se prazo vencido)
   * - `borda-alerta-laranja` (se faltarem 3 dias ou menos)
   */
  function calcularEstadoPrazo(missao) {
    if (missao.coluna === 'CONCLUIDO') {
      return { classeBorda: 'borda-concluida', textoPrazo: 'Concluído', diasRestantes: null };
    }

    const inicio = new Date(missao.data_criacao);
    inicio.setHours(0, 0, 0, 0);

    const dataVencimento = new Date(inicio);
    dataVencimento.setDate(dataVencimento.getDate() + Number(missao.tempo_estimado_dias || 1));

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const diferencaTempo = dataVencimento.getTime() - hoje.getTime();
    const diasRestantes = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) {
      return {
        classeBorda: 'borda-alerta-vermelha',
        textoPrazo: `Vencido há ${Math.abs(diasRestantes)} dia(s)`,
        diasRestantes
      };
    } else if (diasRestantes <= 3) {
      return {
        classeBorda: 'borda-alerta-laranja',
        textoPrazo: diasRestantes === 0 ? 'Vence hoje!' : `Vence em ${diasRestantes} dia(s)`,
        diasRestantes
      };
    }

    return {
      classeBorda: '',
      textoPrazo: `${diasRestantes} dia(s) restantes`,
      diasRestantes
    };
  }

  // ===================================================================================
  // RENDERIZAÇÃO DA INTERFACE PRINCIPAL
  // ===================================================================================
  return (
    <div className="painel-workspace">
      {/* Cabeçalho do Ecrã */}
      <header className="barra-topo-workspace">
        <div className="linha-navegacao-topo">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button className="botao-voltar-projetos" onClick={aoVoltar}>
              <ArrowLeft size={18} />
              <span>Voltar ao Painel do Projeto</span>
            </button>

            <button className="botao-voltar-projetos" onClick={carregarMissoes}>
              <RefreshCw size={18} />
              <span>Atualizar Quadro</span>
            </button>

            {aoAbrirLivroDeBordo && (
              <button className="botao-voltar-projetos" onClick={aoAbrirLivroDeBordo}>
                <Clock size={18} />
                <span>Ir para Livro de Bordo</span>
              </button>
            )}
          </div>

          <button 
            type="button" 
            className="btn botao-forja-laranja d-flex align-items-center gap-2"
            onClick={() => abrirModalNovaMissao('A_FAZER')}
          >
            <PlusCircle size={18} />
            <span>Nova Missão</span>
          </button>
        </div>

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mt-0 mb-0" style={{marginBottom: '0'}}>
          <div>
            <h3 className="text-light fw-bold mb-1 d-flex align-items-center gap-2">
              <Kanban size={26} className="text-warning" />
              <span>Quadro de Missões — {projeto.titulo}</span>
            </h3>
            <p className="text-muted small mb-0">
              Arraste e solte os cartões entre as colunas. Bordas <strong className="text-warning">laranjas</strong> indicam prazo em até 3 dias e <strong className="text-danger">vermelhas</strong> indicam prazo vencido.
            </p>
          </div>
        </div>
      </header>

      {/* Quadro Kanban de 4 Colunas Fixas */}
      <main className="corpo-workspace-container mt-0" style={{marginTop: '-50px'}}>
        <div className="grade-kanban-missoes">
          {COLUNAS_FIXAS.map((col) => {
            const missoesDaColuna = listaMissoes.filter((m) => m.coluna === col.id);

            return (
              <div
                key={col.id}
                className={`coluna-kanban-forja ${colunaDragOver === col.id ? 'coluna-drag-over' : ''}`}
                onDragOver={(e) => aoPassarPorCimaDaColuna(e, col.id)}
                onDragLeave={() => definirColunaDragOver(null)}
                onDrop={(e) => aoSoltarNaColuna(e, col.id)}
              >
                <div className="cabecalho-coluna-kanban">
                  <h6 className="titulo-coluna-kanban">
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: col.cor, display: 'inline-block' }} />
                    {col.titulo}
                  </h6>
                  <span className="contador-coluna-kanban">{missoesDaColuna.length}</span>
                </div>

                {/* Lista de Cartões da Coluna */}
                <div className="flex-grow-1">
                  {missoesDaColuna.map((missao) => {
                    const infoPrazo = calcularEstadoPrazo(missao);

                    return (
                      <div
                        key={missao.id}
                        draggable
                        onDragStart={(e) => aoIniciarArrasto(e, missao.id)}
                        className={`cartao-missao-kanban ${infoPrazo.classeBorda}`}
                      >
                        {/* Título posicionado no topo do cartão */}
                        <div className="mb-0">
                          <h6 className="fw-bold text-light mb-0 mt-0" style={{ fontSize: '0.95rem', lineHeight: '1.2', marginTop: '0', marginBottom: '15px' }}>
                            {missao.titulo}
                          </h6>
                        </div>

                        {/* Integrantes Responsáveis */}
                        {missao.integrantes && (
                          <div className="mb-2" style={{marginTop: '0'}}>
                            {missao.integrantes.split(',').map((nome, idx) => (
                              <span key={idx} className="pilula-integrante-missao">
                                <Users size={11} className="me-1" />
                                {nome.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Descrição da Missão */}
                        {missao.descricao && (
                          <p className="small text-light mb-2" style={{ whiteSpace: 'pre-wrap', fontSize: '0.82rem' }}>
                            {missao.descricao}
                          </p>
                        )}

                        {/* Observações */}
                        {missao.observacao && (
                          <div className="p-2 rounded bg-dark border border-secondary mb-2 small text-warning" style={{ fontSize: '0.76rem' }}>
                            <strong>Obs:</strong> {missao.observacao}
                          </div>
                        )}

                        {/* Rodapé do Cartão contendo as Datas/Prazos e os Botões de Ação alinhados à direita */}
                        <div className="border-top border-secondary pt-2 mt-2 d-flex justify-content-between align-items-center flex-wrap gap-2 small">
                          <span className="text-secondary" style={{ fontSize: '0.72rem' }}>
                            <Calendar size={12} className="me-1" />
                            Criado: {new Date(missao.data_criacao).toLocaleDateString('pt-PT')} ({missao.tempo_estimado_dias}d)
                          </span>

                          <div className="d-flex align-items-center gap-2">
                            <span 
                              className={`fw-bold ${
                                infoPrazo.classeBorda === 'borda-alerta-vermelha'
                                  ? 'text-danger'
                                  : infoPrazo.classeBorda === 'borda-alerta-laranja'
                                  ? 'text-warning'
                                  : infoPrazo.classeBorda === 'borda-concluida'
                                  ? 'text-success'
                                  : 'text-info'
                              }`}
                              style={{ fontSize: '0.73rem' }}
                            >
                              {infoPrazo.classeBorda && infoPrazo.classeBorda !== 'borda-concluida' && (
                                <AlertTriangle size={12} className="me-1" />
                              )}
                              {infoPrazo.classeBorda === 'borda-concluida' && (
                                <CheckCircle2 size={12} className="me-1" />
                              )}
                              {infoPrazo.textoPrazo}
                            </span>

                            {/* Botões de Ação (Editar Laranja e Excluir Vermelho) alinhados à direita no rodapé */}
                            <div className="acoes-icone-cartao" style={{marginLeft: '70%'}}>
                              <button
                                type="button"
                                className="botao-icone-laranja"
                                title="Editar missão"
                                onClick={() => abrirModalEdicao(missao)}
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                type="button"
                                className="botao-icone-vermelho"
                                title="Excluir missão"
                                onClick={() => aoExcluirMissao(missao.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Botão rápido para adicionar cartão diretamente na coluna respetiva com padding 10px, border-radius 15px e a cor da bolinha do topo da coluna */}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary w-100 mt-2 d-flex align-items-center justify-content-center gap-1"
                  style={{
                    padding: '10px',
                    borderRadius: '15px',
                    borderColor: col.cor,
                    color: '#f3f4f6',
                    backgroundColor: col.cor,
                  }}
                  onClick={() => abrirModalNovaMissao(col.id)}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.cor}} />
                  <PlusCircle size={14} style={{fontWeight: 'bold', color: '#000'}}/>
                  <span style={{fontWeight: 'bold', color: '#000'}}>  Adicionar em {col.titulo}</span>
                </button>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal de Criação e Edição de Missão */}
      {modalAberto && (
        <div className="fundo-modal-forja">
          <div className="caixa-modal-forja">
            <h5 className="fw-bold text-light mb-3 border-bottom border-secondary pb-2">
              {missaoEditando ? 'Editar Missão' : 'Criar Nova Missão'}
            </h5>

            <form onSubmit={aoSalvarMissao}>
              <div className="mb-3">
                <label className="form-label small text-info fw-bold">Nome da Missão *</label>
                <input
                  type="text"
                  className="form-control formulario-input-workspace"
                  value={titulo}
                  onChange={(e) => definirTitulo(e.target.value)}
                  placeholder="Ex: Implementar autenticação JWT..."
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small text-info fw-bold">Integrante(s) Responsável(is)</label>
                <input
                  type="text"
                  className="form-control formulario-input-workspace mb-2"
                  value={integrantes}
                  onChange={(e) => definirIntegrantes(e.target.value)}
                  placeholder="Nomes separados por vírgula..."
                />
                {membrosEquipe.length > 0 && (
                  <div className="d-flex flex-wrap gap-1 align-items-center">
                    <small className="text-muted me-1">Adicionar da equipa:</small>
                    {membrosEquipe.map((membro) => (
                      <button
                        key={membro.usuario_id}
                        type="button"
                        className="btn btn-sm btn-outline-info py-0 px-2"
                        style={{ fontSize: '0.72rem' }}
                        onClick={() => adicionarIntegranteDaLista(membro.nome)}
                      >
                        + {membro.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label small text-info fw-bold">Coluna / Status</label>
                  <select
                    className="form-select formulario-input-workspace"
                    value={colunaSelecionada}
                    onChange={(e) => definirColunaSelecionada(e.target.value)}
                  >
                    {COLUNAS_FIXAS.map((c) => (
                      <option key={c.id} value={c.id}>{c.titulo}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label small text-info fw-bold">Data de Criação</label>
                  <input
                    type="date"
                    className="form-control formulario-input-workspace"
                    value={dataCriacao}
                    onChange={(e) => definirDataCriacao(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label small text-info fw-bold">Tempo Estimado (Dias)</label>
                  <select
                    className="form-select formulario-input-workspace"
                    value={tempoEstimadoDias}
                    onChange={(e) => definirTempoEstimadoDias(Number(e.target.value))}
                  >
                    {[1, 2, 3, 5, 7, 10, 14, 21, 30, 45, 60].map((d) => (
                      <option key={d} value={d}>{d} {d === 1 ? 'dia' : 'dias'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small text-info fw-bold">Descrição da Missão</label>
                <textarea
                  rows="3"
                  className="form-control formulario-input-workspace"
                  value={descricao}
                  onChange={(e) => definirDescricao(e.target.value)}
                  placeholder="Descreva os passos ou requisitos da missão..."
                />
              </div>

              <div className="mb-4">
                <label className="form-label small text-info fw-bold">Observação</label>
                <textarea
                  rows="2"
                  className="form-control formulario-input-workspace"
                  value={observacao}
                  onChange={(e) => definirObservacao(e.target.value)}
                  placeholder="Avisos importantes, bloqueios ou links úteis..."
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => definirModalAberto(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn botao-forja-laranja">
                  Salvar Missão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
