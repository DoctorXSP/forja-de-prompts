// Importação do React e do hook useState para gestão de estados locais
import React, { useState } from 'react';

// Importação de ícones da biblioteca lucide-react para a interface visual
import { ArrowLeft, Sparkles, Copy, Save, PlusCircle, Layers, Flame } from 'lucide-react';

// Importação do estilo CSS específico desta tela
import '../estilos/TelaGeradorPrompt.css';

// =====================================================================================
// IMPORTAÇÃO DA VARIÁVEL GLOBAL DE CONFIGURAÇÃO DE REDE
// =====================================================================================
// Garante que o componente aponte para a URL correta do backend sem hardcoding.
import { CONFIG_REDE } from './config';

/**
 * COMPONENTE: TelaGeradorPrompt
 * -------------------------------------------------------------------------------------
 * Esta é a "Central de Geração Avançada". Permite ao utilizador selecionar uma IA de destino,
 * fornecer instruções e enviar para o backend (que cruzará a Identidade Visual, Memórias 
 * e Anexos) para gerar um "Super Prompt" otimizado. 
 * Também permite guardar o prompt gerado e a resposta final no Banco de Memórias.
 * 
 * Props recebidas:
 * @param {Object} projeto - O projeto atual contendo o contexto (ID, Título, etc.).
 * @param {Function} aoVoltar - Callback para regressar ao painel do projeto.
 * @param {Function} aoSalvarMemoriaSucesso - Callback executado para atualizar a lista do painel.
 */
export default function TelaGeradorPrompt({ projeto, aoVoltar, aoSalvarMemoriaSucesso }) {
  
  // =====================================================================================
  // ESTADOS DE LISTAGEM E SELEÇÃO DE IA
  // =====================================================================================
  // Estrutura de dados inicial com as ferramentas de IA categorizadas
  const [listaIas, definirListaIas] = useState([
    { categoria: 'Assistentes de Texto e Raciocínio (Coringa)', itens: ['ChatGPT (OpenAI)', 'Claude (Anthropic)', 'Gemini (Google)', 'Microsoft Copilot'] },
    { categoria: 'Pesquisa e Busca em Tempo Real', itens: ['Perplexity AI', 'NotebookLM (Google)'] },
    { categoria: 'Produtividade e Reuniões', itens: ['Fireflies.ai', 'Gamma'] },
    { categoria: 'Criação de Imagens, Vídeos e Mídia', itens: ['Midjourney', 'Runway', 'OpusClip', 'Capcut Canvas AI', 'Seedance 2'] },
    { categoria: 'Automação de Processos', itens: ['Make / Zapier / n8n', 'Sono, Flow', 'Nano Banana'] }
  ]);

  const [iaSelecionada, definirIaSelecionada] = useState('Gemini (Google)');
  const [versaoLlm, definirVersaoLlm] = useState('gemini-3.5-flash-lite');
  const [descricaoPedido, definirDescricaoPedido] = useState('');
  
  // =====================================================================================
  // ESTADOS PARA INSERÇÃO DINÂMICA DE NOVAS IAs
  // =====================================================================================
  const [modoAdicionarIa, definirModoAdicionarIa] = useState(false);
  const [novaCategoria, definirNovaCategoria] = useState('Assistentes de Texto e Raciocínio (Coringa)');
  const [novoNomeIa, definirNovoNomeIa] = useState('');

  // =====================================================================================
  // ESTADOS DE RESULTADO E FEEDBACK
  // =====================================================================================
  const [promptGerado, definirPromptGerado] = useState('');
  const [dicaDeUso, definirDicaDeUso] = useState('');
  const [respostaIaExterna, definirRespostaIaExterna] = useState('');
  const [carregando, definirCarregando] = useState(false); // Bloqueia o botão de gerar
  const [salvando, definirSalvando] = useState(false); // Bloqueia o botão de guardar na memória

  /**
   * FUNÇÃO: lidarComGeracaoPrompt
   * -------------------------------------------------------------------------------------
   * Envia as instruções e os dados da IA escolhida para o endpoint de forja no backend.
   * O backend irá juntar este pedido com as memórias e anexos quentes para criar o prompt final.
   */
  async function lidarComGeracaoPrompt(e) {
    e.preventDefault();
    if (!descricaoPedido.trim()) return; // Previne envios vazios
    definirCarregando(true);

    try {
      // Chamada à API utilizando a URL global definida no config.js
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/forjar-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projetoId: projeto.id,
          descricaoPedido,
          // Concatena a IA selecionada com o modelo para passar um alvo exato ao backend
          iaDestino: `${iaSelecionada} [Modelo:${versaoLlm}]`
        })
      });
      
      const dados = await res.json();
      
      if (res.ok) {
        definirPromptGerado(dados.promptCompilado || '');
        definirDicaDeUso(dados.dicaDeUso || '');
      } else {
        alert(dados.mensagem || 'Erro ao gerar o prompt.');
      }
    } catch (err) {
      console.error('Erro de conexão:', err);
      alert('Erro de conexão ao forjar o prompt.');
    } finally {
      definirCarregando(false);
    }
  }

  /**
   * FUNÇÃO: adicionarNovaIaPersonalizada
   * -------------------------------------------------------------------------------------
   * Permite ao utilizador expandir a lista de ferramentas de IA localmente.
   * Modifica a lista complexa de forma imutável (best practice do React).
   */
  function adicionarNovaIaPersonalizada(e) {
    e.preventDefault();
    if (!novoNomeIa.trim()) return;

    // Cria uma cópia da lista original usando o spread operator
    const novaLista = [...listaIas];
    
    // Tenta encontrar a categoria onde a nova IA será inserida
    let catEncontrada = novaLista.find(c => c.categoria === novaCategoria);
    if (catEncontrada) {
      catEncontrada.itens.push(novoNomeIa.trim());
    } else {
      novaLista.push({ categoria: novaCategoria, itens: [novoNomeIa.trim()] });
    }

    definirListaIas(novaLista); // Atualiza o estado com a nova lista
    definirIaSelecionada(novoNomeIa.trim()); // Seleciona automaticamente a nova IA
    definirNovoNomeIa(''); // Limpa o input
    definirModoAdicionarIa(false); // Fecha a interface de adição
  }

  /**
   * FUNÇÃO: salvarNasMemorias
   * -------------------------------------------------------------------------------------
   * Guarda o prompt recém-gerado no Banco de Memórias Quentes do projeto atual,
   * permitindo também anexar o resultado prático obtido da IA externa para referência futura.
   */
  async function salvarNasMemorias() {
    if (!promptGerado) return;
    definirSalvando(true);

    try {
      // Monta o bloco de texto a ser guardado dependendo se o utilizador colou ou não a resposta
      const conteudoMemoria = respostaIaExterna.trim() 
        ? `[Prompt para ${iaSelecionada} -${versaoLlm}]\n${promptGerado}\n\n[Resposta Obtida / Notas]:\n${respostaIaExterna}`
        : `[Prompt para ${iaSelecionada} - ${versaoLlm}]\n${promptGerado}`;

      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/memorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projetoId: projeto.id,
          titulo: `Prompt (${iaSelecionada}):${descricaoPedido.slice(0, 30)}...`, // Trunca o título para exibição compacta
          categoriaMemoria: 'ROTEIRO_TEXTO',
          conteudo: conteudoMemoria,
          promptUsado: descricaoPedido,
          resultadoGerado: promptGerado,
          iaUtilizada: iaSelecionada,
          modeloLlm: versaoLlm,
          etiquetas: 'forja-avancada, prompt-ia'
        })
      });

      if (res.ok) {
        alert('Prompt e registos guardados com sucesso nas Memórias do Projeto!');
        if (aoSalvarMemoriaSucesso) aoSalvarMemoriaSucesso();
        aoVoltar(); // Fecha a janela do gerador e regressa ao painel
      } else {
        alert('Erro ao guardar nas memórias.');
      }
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro de ligação ao tentar conectar com o servidor.');
    } finally {
      definirSalvando(false);
    }
  }

  // =====================================================================================
  // RENDERIZAÇÃO DA INTERFACE (JSX)
  // =====================================================================================
  return (
    <div className="tela-gerador-container">
      <div className="container" style={{ maxWidth: '1200px' }}>
        
        {/* BARRA SUPERIOR DE NAVEGAÇÃO E TÍTULO */}
        <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary flex-wrap gap-3">
          <button className="botao-voltar-projetos" onClick={aoVoltar}>
            <ArrowLeft size={18} />
            <span>Voltar ao Painel</span>
          </button>
          <h4 className="fw-bold text-warning mb-0 d-flex align-items-center gap-2">
            <Flame size={24} strokeWidth={3} className="icone-flame-vermelho" />
            <span>Central de Geração Avançada — {projeto.titulo}</span>
          </h4>
        </div>

        {/* ESTRUTURA DE COLUNAS: Lado a Lado (Grelha Bootstrap) */}
        <div className="row g-4">
          
          {/* ==================== COLUNA ESQUERDA: PARÂMETROS E INPUT ==================== */}
          <div className="col-lg-6">
            <div className="card-gerador-forja h-100">
              <h5 className="text-info mb-4 fw-bold pb-2 border-bottom border-secondary">
                1. Configuração da Ferramenta & Contexto
              </h5>
              
              <form onSubmit={lidarComGeracaoPrompt}>
                
                {/* BLOCO: Seleção ou Adição de IA */}
                <div className="grupo-campo-gerador">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label mb-0">Ferramenta / IA de Destino</label>
                    <button 
                      type="button" 
                      className="btn btn-sm btn-link text-warning p-0 text-decoration-none small d-flex align-items-center gap-1"
                      onClick={() => definirModoAdicionarIa(!modoAdicionarIa)}
                    >
                      <PlusCircle size={14} />
                      <span>{modoAdicionarIa ? 'Cancelar' : 'Adicionar Nova IA/Modelo'}</span>
                    </button>
                  </div>

                  {/* Renderização condicional: Mostra o mini-form para adicionar nova IA ou o Dropdown padrão */}
                  {modoAdicionarIa ? (
                    <div className="p-3 bg-black rounded border border-warning mb-2">
                      <h6 className="small fw-bold text-warning mb-2">Cadastrar Nova IA / Ferramenta</h6>
                      <div className="mb-2">
                        <label className="form-label small text-muted">Categoria</label>
                        <select 
                          className="form-select form-select-sm input-gerador-dark"
                          value={novaCategoria}
                          onChange={(e) => definirNovaCategoria(e.target.value)}
                        >
                          {listaIas.map((cat, idx) => (
                            <option key={idx} value={cat.categoria}>{cat.categoria}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-2">
                        <label className="form-label small text-muted">Nome da Ferramenta / IA</label>
                        <input 
                          type="text" 
                          className="form-control form-control-sm input-gerador-dark"
                          placeholder="Ex: A Minha IA Personalizada"
                          value={novoNomeIa}
                          onChange={(e) => definirNovoNomeIa(e.target.value)}
                        />
                      </div>
                      <button type="button" className="btn btn-sm btn-warning w-100 fw-bold" onClick={adicionarNovaIaPersonalizada}>
                        Adicionar à Lista
                      </button>
                    </div>
                  ) : (
                    // Select construído dinamicamente com optgroups com base no estado da array de objetos
                    <select 
                      className="form-select input-gerador-dark"
                      value={iaSelecionada}
                      onChange={(e) => definirIaSelecionada(e.target.value)}
                    >
                      {listaIas.map((grupo, idx) => (
                        <optgroup key={idx} label={grupo.categoria}>
                          {grupo.itens.map((ia, i) => (
                            <option key={i} value={ia}>{ia}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  )}
                </div>

                {/* BLOCO: Configuração do Modelo Técnico */}
                <div className="grupo-campo-gerador">
                  <label className="form-label">Versão do Modelo / LLM (Parâmetro Interno)</label>
                  <input 
                    type="text" 
                    className="form-control input-gerador-dark"
                    value={versaoLlm}
                    onChange={(e) => definirVersaoLlm(e.target.value)}
                    placeholder="Ex: gemini-3.5-flash-lite, gpt-4o, claude-3-5-sonnet"
                  />
                  <div className="form-text text-muted small">Usado pelo agente para alinhar a sintaxe e as capacidades técnicas da IA escolhida.</div>
                </div>

                {/* BLOCO: Descrição do Pedido / Input do Utilizador */}
                <div className="grupo-campo-gerador">
                  <label className="form-label">O que deseja que a IA produza?</label>
                  <textarea 
                    className="form-control input-gerador-dark"
                    rows="5"
                    placeholder="Descreva detalhadamente o objetivo, tom, estrutura e requisitos do que será construído..."
                    value={descricaoPedido}
                    onChange={(e) => definirDescricaoPedido(e.target.value)}
                    required
                  />
                  <div className="form-text text-info small mt-2">
                    💡 O Gemini analisará automaticamente a <strong>Identidade Visual</strong>, as <strong>Memórias Quentes</strong> e os <strong>Anexos</strong> ativos deste projeto.
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn botao-forja-laranja w-100 py-3 fw-bold d-flex justify-content-center align-items-center gap-2 mt-3"
                  disabled={carregando}
                >
                  <Sparkles size={18} />
                  <span>{carregando ? 'A Cruzar Contexto e Forjar...' : 'Forjar Prompt Contextualizado'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* ==================== COLUNA DIREITA: OUTPUT E GUARDA DE DADOS ==================== */}
          <div className="col-lg-6">
            <div className="card-gerador-forja h-100 d-flex flex-column">
              <h5 className="text-info mb-4 fw-bold pb-2 border-bottom border-secondary">
                2. Super Prompt Gerado & Retorno
              </h5>

              {/* Renderização Condicional: Se ainda não tiver gerado prompt, mostra instrução visual (Empty State) */}
              {!promptGerado ? (
                <div className="text-center text-muted my-auto py-5">
                  <Layers size={52} className="mb-3 opacity-50 text-warning" />
                  <p className="px-4">Preencha os parâmetros e a descrição ao lado e clique em <strong>Forjar Prompt Contextualizado</strong> para gerar o material adaptado para a IA: <strong>{iaSelecionada}</strong>.</p>
                </div>
              ) : (
                /* Se já existir um prompt gerado, exibe os resultados e as opções de cópia/guarda */
                <div className="d-flex flex-column flex-grow-1">
                  
                  {/* Bloco de Dica da IA para a ferramenta alvo */}
                  {dicaDeUso && (
                    <div className="alert alert-info py-2 small mb-3 bg-dark border-info text-info">
                      <strong>Dica do Especialista ({iaSelecionada}):</strong> {dicaDeUso}
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small text-warning fw-bold">Prompt Pronto a Copiar ({iaSelecionada}):</span>
                    
                    {/* Botão de Cópia Automática usando a API Navigator do Browser */}
                    <button 
                      type="button" 
                      className="btn btn-sm btn-outline-info py-1 px-2 d-flex align-items-center gap-1"
                      onClick={() => navigator.clipboard.writeText(promptGerado)}
                    >
                      <Copy size={14} /> Copiar
                    </button>
                  </div>

                  {/* Exibição do Texto com preservação de formatação usando <pre> */}
                  <pre className="caixa-prompt-gerado p-3 rounded mb-3 flex-grow-1">
                    {promptGerado}
                  </pre>

                  {/* INPUT OPCIONAL: O utilizador cola a resposta da outra IA aqui para registo histórico */}
                  <div className="grupo-campo-gerador mb-3">
                    <label className="form-label small text-muted">
                      Deseja registar também a resposta obtida na ferramenta externa? (Opcional)
                    </label>
                    <textarea 
                      className="form-control form-control-sm input-gerador-dark"
                      rows="3"
                      placeholder="Cole aqui o resultado gerado pela IA externa para auditoria e histórico no banco de memórias..."
                      value={respostaIaExterna}
                      onChange={(e) => definirRespostaIaExterna(e.target.value)}
                    />
                  </div>

                  {/* Botão de Submissão para as Memórias */}
                  <button 
                    type="button"
                    className="btn btn-warning w-100 fw-bold d-flex justify-content-center align-items-center gap-2 py-2 mt-auto"
                    onClick={salvarNasMemorias}
                    disabled={salvando}
                  >
                    <Save size={16} />
                    <span>{salvando ? 'A Guardar...' : 'Guardar Prompt e Resposta nas Memórias'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}