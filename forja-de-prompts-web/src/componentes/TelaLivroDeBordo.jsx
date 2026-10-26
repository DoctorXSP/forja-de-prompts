// Importa o React e os hooks essenciais:
// - useState: para gerir estados locais (lista do histórico e filtros ativos).
// - useEffect: para carregar os dados automaticamente ao abrir a tela ou trocar de projeto.
import React, { useState, useEffect } from 'react';

// Importa os ícones vetoriais da biblioteca 'lucide-react'
import { 
  ArrowLeft, BookOpen, Clock, CheckCircle2, PlayCircle, 
  FlaskConical, Users, RefreshCw, Kanban 
} from 'lucide-react';

// Importa a configuração centralizada de rede (URL_BACKEND)
import { CONFIG_REDE } from './config';

// Importa as folhas de estilos CSS correspondentes
import '../estilos/PainelPrincipal.css';
import '../estilos/MissoesELivro.css';

/**
 * FUNÇÃO / COMPONENTE PRINCIPAL: TelaLivroDeBordo
 * -------------------------------------------------------------------------------------
 * O QUE FAZ:
 * Exibe o histórico de atividades e o registo de todas as funções, tarefas e missões que
 * se encontram em execução, em fase de testes ou já concluídas no projeto atual.
 * Permite filtrar os registos por status e visualizar a última data/hora de movimentação
 * ou edição de cada cartão.
 */
export default function TelaLivroDeBordo({ projeto, aoVoltar, aoAbrirMissoes }) {
  // Estados locais para armazenar o histórico de missões e o filtro de status selecionado
  const [listaHistorico, definirListaHistorico] = useState([]);
  const [filtroStatus, definirFiltroStatus] = useState('TODOS');

  // Efeito: Carrega o histórico do livro de bordo sempre que o ID do projeto muda
  useEffect(() => {
    carregarHistoricoLivroDeBordo();
  }, [projeto.id]);

  /**
   * FUNÇÃO: carregarHistoricoLivroDeBordo
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Faz uma requisição `GET` ao backend (`/projetos/:id/missoes`) para buscar todas as missões
   * do projeto. Em seguida, filtra apenas as missões ativas no fluxo de trabalho ou concluídas
   * (`EM_EXECUCAO`, `TESTES`, `CONCLUIDO`) e guarda-as no estado `listaHistorico`.
   */
  async function carregarHistoricoLivroDeBordo() {
    try {
      const resposta = await fetch(`${CONFIG_REDE.URL_BACKEND}/projetos/${projeto.id}/missoes`);
      const dados = await resposta.json();
      if (Array.isArray(dados)) {
        // Filtra apenas funções em execução, testes ou concluídas (histórico ativo do projeto)
        const ativosOuConcluidos = dados.filter((m) =>
          ['EM_EXECUCAO', 'TESTES', 'CONCLUIDO'].includes(m.coluna)
        );
        definirListaHistorico(ativosOuConcluidos);
      }
    } catch (erro) {
      console.error('Erro ao carregar Livro de Bordo:', erro);
    }
  }

  /**
   * FUNÇÃO: renderizarBadgeStatus
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Recebe a string da coluna/status de uma missão e retorna um distintivo visual (`badge`)
   * formatado com cores e ícones apropriados para indicar se está "Em Execução", "Em Testes" ou "Concluído".
   */
  function renderizarBadgeStatus(coluna) {
    switch (coluna) {
      case 'EM_EXECUCAO':
        return (
          <span className="badge bg-primary d-inline-flex align-items-center gap-1 px-3 py-2">
            <PlayCircle size={14} /> Em Execução
          </span>
        );
      case 'TESTES':
        return (
          <span className="badge bg-warning text-dark d-inline-flex align-items-center gap-1 px-3 py-2">
            <FlaskConical size={14} /> Em Testes
          </span>
        );
      case 'CONCLUIDO':
        return (
          <span className="badge bg-success d-inline-flex align-items-center gap-1 px-3 py-2">
            <CheckCircle2 size={14} /> Concluído
          </span>
        );
      default:
        return null;
    }
  }

  // Filtra a lista do histórico de acordo com o botão de filtro selecionado pelo utilizador
  const listaFiltrada = listaHistorico.filter((item) =>
    filtroStatus === 'TODOS' ? true : item.coluna === filtroStatus
  );

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

            <button className="botao-voltar-projetos" onClick={carregarHistoricoLivroDeBordo}>
              <RefreshCw size={18} />
              <span>Atualizar Histórico</span>
            </button>

            {aoAbrirMissoes && (
              <button className="botao-voltar-projetos" onClick={aoAbrirMissoes}>
                <Kanban size={18} />
                <span>Abrir Quadro de Missões</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-2">
          <h3 className="text-light fw-bold mb-1 d-flex align-items-center gap-2">
            <BookOpen size={26} className="text-info" />
            <span>Livro de Bordo — {projeto.titulo}</span>
          </h3>
          <p className="text-muted small mb-0">
            Registo histórico de todas as funções e missões em execução, em fase de testes ou concluídas no projeto.
          </p>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="corpo-workspace-container">
        <section className="painel-coluna-card">
          
          {/* Barra de Filtros Rápidos por Status */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4 pb-3 border-bottom border-secondary">
            <div className="d-flex flex-wrap gap-2">
              {['TODOS', 'EM_EXECUCAO', 'TESTES', 'CONCLUIDO'].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`btn btn-sm ${filtroStatus === status ? 'botao-forja-laranja' : 'btn-outline-secondary'}`}
                  onClick={() => definirFiltroStatus(status)}
                >
                  {status === 'TODOS' && `Todos (${listaHistorico.length})`}
                  {status === 'EM_EXECUCAO' && 'Em Execução'}
                  {status === 'TESTES' && 'Em Testes'}
                  {status === 'CONCLUIDO' && 'Concluídos'}
                </button>
              ))}
            </div>
          </div>

          {/* Listagem Cronológica dos Registos do Livro de Bordo */}
          {listaFiltrada.length === 0 ? (
            <div className="text-center py-5 text-muted">
              Nenhuma missão em execução, teste ou concluída registada até o momento.
            </div>
          ) : (
            <div>
              {listaFiltrada.map((item) => (
                <div key={item.id} className={`item-livro-bordo status-${item.coluna}`}>
                  <div>
                    <h6 className="fw-bold text-light mb-1">{item.titulo}</h6>
                    {item.descricao && (
                      <p className="small text-muted mb-2">{item.descricao}</p>
                    )}

                    <div className="d-flex flex-wrap align-items-center gap-3 small text-secondary">
                      {item.integrantes && (
                        <span className="text-info">
                          <Users size={14} className="me-1" />
                          <strong>Integrantes:</strong> {item.integrantes}
                        </span>
                      )}
                      <span>
                        <Clock size={14} className="me-1 text-warning" />
                        <strong>Última movimentação / edição:</strong>{' '}
                        <span className="text-light">
                          {new Date(item.data_ultima_movimentacao).toLocaleString('pt-PT')}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div>{renderizarBadgeStatus(item.coluna)}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}