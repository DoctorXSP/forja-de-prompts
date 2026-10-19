// Importa os hooks essenciais do React:
// - useState: para gerir variáveis que, ao mudarem, atualizam a interface.
// - useEffect: para executar código em momentos específicos (ex: quando a página carrega).
// - useRef: para criar referências diretas a elementos HTML reais no DOM (ex: medir alturas).
import React, { useState, useEffect, useRef } from 'react';

// Importa ícones vetoriais da biblioteca 'lucide-react' para compor a interface de forma leve
import { 
  Flame, ArrowLeft, Archive, CheckCircle2, 
  Sparkles, ToggleLeft, ToggleRight, Edit3,
  Code, Megaphone, Users, GraduationCap, Folder, Image as ImageIcon,
  Palette, Music, Video, Eye, Upload, Edit 
} from 'lucide-react';

// Importa os subcomponentes (telas e modais) que serão renderizados dentro deste painel
import TelaEdicaoProjeto from './TelaEdicaoProjeto';
import TelaIdentidadeVisual from './TelaIdentidadeVisual';
import GaleriaIdentidadeVisual, { ModalVisualizadorMidia } from './GaleriaIdentidadeVisual';
import TelaImportacaoJson from './TelaImportacaoJson';
import TelaGeradorPrompt from './TelaGeradorPrompt';
import TelaEdicaoMemoria from './TelaEdicaoMemoria';

// Importa as folhas de estilo CSS específicas do painel principal e da galeria
import '../estilos/PainelPrincipal.css';
import '../estilos/GaleriaIdentidadeVisual.css';

// =====================================================================================
// IMPORTAÇÃO DA VARIÁVEL GLOBAL DE CONFIGURAÇÃO DE REDE
// =====================================================================================
// Importa o objeto centralizado de rede. Modificando o arquivo config.js, 
// a URL/IP do backend mudará automaticamente em todo o projeto.
import { CONFIG_REDE } from './config';

/**
 * COMPONENTE INTERNO: CartaoMemoriaItem
 * -------------------------------------------------------------------------------------
 * Exibe individualmente cada "Memória" (prompt/contexto) na lista.
 * Possui lógica interna para abas (Contexto vs Solução) e um botão "Mais detalhes"
 * que só aparece se o texto for muito longo.
 */
function CartaoMemoriaItem({ mem, alternarStatusMemoria, moverParaArquivoMorto, aoIniciarEdicao }) {
  // Estado local da aba ativa neste cartão específico
  const [abaInterna, definirAbaInterna] = useState('CONTEXTO'); 
  // Controla se o texto está expandido para mostrar tudo
  const [expandido, definirExpandido] = useState(false);
  // Controla se o botão "Mais detalhes" deve ser renderizado
  const [exibirBotaoDetalhes, definirExibirBotaoDetalhes] = useState(false);
  
  // Cria uma referência para medir a altura real da div que contém o texto
  const refConteudo = useRef(null);

  // Hook que corre sempre que a memória muda ou a aba interna é trocada.
  // Serve para calcular se o texto ultrapassa a altura limite, ativando o botão "Mais detalhes".
  useEffect(() => {
    // Um pequeno timeout garante que o DOM (HTML) já foi desenhado antes de medirmos a altura
    const timer = setTimeout(() => {
      if (refConteudo.current) {
        const alturaLimite = 95; // Altura em pixels definida no CSS antes de cortar o texto
        definirExibirBotaoDetalhes(refConteudo.current.scrollHeight > alturaLimite);
      }
    }, 50);

    // Limpa o timer para evitar fugas de memória (memory leaks) caso o componente seja desmontado
    return () => clearTimeout(timer);
  }, [mem, abaInterna]);

  return (
    // Alterna a classe CSS baseada no estado de arquivamento (muda cores e opacidade)
    <div className={mem.esta_arquivado ? 'cartao-memoria-arquivado' : 'cartao-memoria-ativo'}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="badge bg-secondary px-2 py-1">{mem.categoria_memoria}</span>
        
        {/* Renderização Condicional: Só mostra o botão de Ativo/Ignorado se NÃO estiver arquivado */}
        {!mem.esta_arquivado && (
          <button type="button" className="btn btn-sm botao-veja-mais-midias btn-link p-0 text-info text-decoration-none small fw-bold" style={{marginLeft: '15px'}} onClick={() => alternarStatusMemoria(mem.id, mem.eh_relevante, mem.esta_arquivado)}>
            {mem.eh_relevante ? '● Ativo no Prompt' : '○ Ignorado no Prompt'}
          </button>
        )}
      </div>

      <h6 className="fw-bold mb-2 text-light">{mem.titulo}</h6>

      {/* Controladores das Abas Internas */}
      <div className="bloco-abas-card-memoria">
        <button 
          type="button" 
          className={`botao-aba-interno ${abaInterna === 'CONTEXTO' ? 'ativo' : ''}`}
          onClick={() => { definirAbaInterna('CONTEXTO'); definirExpandido(false); }}
        >
          Contexto / Detalhes
        </button>
        <button 
          type="button" 
          className={`botao-aba-interno ${abaInterna === 'SOLUCAO' ? 'ativo' : ''}`}
          onClick={() => { definirAbaInterna('SOLUCAO'); definirExpandido(false); }}
        >
          Solução / Resposta
        </button>
      </div>

      {/* Recipiente do Conteúdo (Usa a referência refConteudo para medir a altura dinamicamente) */}
      <div ref={refConteudo} className={`conteudo-caixa-memoria ${expandido ? 'expandido' : ''}`}>
        {abaInterna === 'CONTEXTO' ? (
          <div>
            {mem.prompt_usado && (
              <div className="mb-2 p-2 rounded bg-black small text-info">
                <strong>Prompt:</strong> {mem.prompt_usado}
              </div>
            )}
            <p className="small text-muted mb-0">{mem.conteudo || 'Nenhum conteúdo detalhado informado.'}</p>
          </div>
        ) : (
          <div>
            <div className="p-2 rounded bg-dark small text-warning mb-1">
              <strong>Solução Registrada / Resposta Gerada:</strong>
            </div>
            {/* whiteSpace: 'pre-wrap' respeita as quebras de linha digitadas pelo utilizador */}
            <p className="small text-light mb-0" style={{ whiteSpace: 'pre-wrap' }}>
              {mem.resultado_gerado || mem.conteudo || 'Nenhuma resposta de solução registrada para esta memória.'}
            </p>
          </div>
        )}
      </div>

      {/* Renderiza o botão expansor apenas se o texto for comprido demais */}
      {exibirBotaoDetalhes && (
        <button 
          type="button" 
          className="botao-detalhes-memoria" 
          onClick={() => definirExpandido(!expandido)}
        >
          {expandido ? 'Menos detalhes' : 'Mais detalhes'}
        </button>
      )}
      
      {/* Rodapé do Cartão */}
      <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top border-secondary">
        <div className="d-flex align-items-center gap-2">
          <small className="text-secondary">IA: {mem.ia_utilizada || 'Manual'}</small>
          <button 
            type="button" 
            className="btn btn-sm botao-forja-laranja py-0 px-2 d-inline-flex align-items-center gap-1"
            style={{ fontSize: '0.75rem', margin: '15px' }}
            onClick={() => aoIniciarEdicao(mem)} // Injeta os dados da memória no componente pai para abrir o formulário
            title="Editar memória"
          >
            <Edit size={12} /> Editar
          </button>
        </div>
        
        <button type="button" className="btn btn-sm btn-link botao-aba-arquivo text-decoration-none p-0 fw-semibold" onClick={() => moverParaArquivoMorto(mem.id, mem.esta_arquivado)}>
          {mem.esta_arquivado ? 'Restaurar para Quente' : 'Mover para Arquivo Morto'}
        </button>
      </div>
    </div>
  );
}

/**
 * COMPONENTE INTERNO: CartaoAnexoItem
 * -------------------------------------------------------------------------------------
 * Apresenta ficheiros ou imagens anexadas ao projeto. Suporta redimensionamento na íntegra
 * (objectFit: 'contain') para que imagens grandes não sejam cortadas.
 */
function CartaoAnexoItem({ anexo, alternarRelevanciaAnexo }) {
  const [expandido, definirExpandido] = useState(false);
  const [exibirBotaoDetalhes, definirExibirBotaoDetalhes] = useState(false);
  const refConteudoAnexo = useRef(null);

  // Calcula a altura da descrição para exibir ou ocultar o botão "Mais detalhes"
  useEffect(() => {
    const timer = setTimeout(() => {
      if (refConteudoAnexo.current) {
        const alturaLimite = 70;
        definirExibirBotaoDetalhes(refConteudoAnexo.current.scrollHeight > alturaLimite);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [anexo]);

  return (
    <div className="cartao-anexo-item">
      {/* Só renderiza a estrutura de imagem se for efetivamente uma IMAGEM */}
      {anexo.tipo_arquivo === 'IMAGEM' && (
        <div style={{ width: '100%', backgroundColor: '#000', borderRadius: '0.5rem', marginBottom: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
          <img 
            src={`${CONFIG_REDE.URL_BACKEND}${anexo.caminho_arquivo}`} 
            alt={anexo.nome_arquivo} 
            style={{ width: '100%', height: 'auto', maxHeight: '300px', objectFit: 'contain' }} 
          />
        </div>
      )}
      
      {/* Cabeçalho do Anexo com Toggle Button */}
      <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
        <span className="fw-bold text-truncate small text-light">{anexo.nome_arquivo}</span>
        <button type="button" className="btn btn-sm p-0 border-0" onClick={() => alternarRelevanciaAnexo(anexo.id, anexo.eh_relevante)}>
          {anexo.eh_relevante ? <ToggleRight size={24} className="text-info" /> : <ToggleLeft size={24} className="text-secondary" />}
        </button>
      </div>

      {/* Descrição Manual e IA */}
      <div ref={refConteudoAnexo} className={`conteudo-caixa-memoria ${expandido ? 'expandido' : ''}`}>
        {anexo.descricao_manual && (
          <p className="text-warning mb-1 small" style={{ fontSize: '0.8rem' }}>
            <strong>Legenda:</strong> {anexo.descricao_manual}
          </p>
        )}
        <p className="text-muted mb-0" style={{ fontSize: '0.78rem' }}>
          {anexo.descricao_ia ? `IA: ${anexo.descricao_ia}` : 'Sem análise descritiva automática.'}
        </p>
      </div>

      {exibirBotaoDetalhes && (
        <button 
          type="button" 
          className="botao-detalhes-memoria" 
          onClick={() => definirExpandido(!expandido)}
        >
          {expandido ? 'Menos detalhes' : 'Mais detalhes'}
        </button>
      )}
    </div>
  );
}

/**
 * COMPONENTE PRINCIPAL: PainelPrincipal
 * -------------------------------------------------------------------------------------
 * Orquestra todo o workspace do projeto selecionado.
 * Em vez de utilizar bibliotecas como o React Router, este componente gere a navegação
 * com "Flags" de estado (booleanos), montando e desmontando as diferentes interfaces (ecrãs).
 */
export default function PainelPrincipal({ usuarioLogado, projetoSelecionado, aoVoltarParaSelecao }) {
  
  // =====================================================================================
  // ESTADOS GLOBAIS DO PROJETO E NAVEGAÇÃO
  // =====================================================================================
  const [dadosProjetoAtual, definirDadosProjetoAtual] = useState(projetoSelecionado);
  
  // Flags que determinam qual ecrã está a ser exibido atualmente
  const [modoEdicaoProjeto, definirModoEdicaoProjeto] = useState(false);
  const [modoTelaIdentidadeVisual, definirModoTelaIdentidadeVisual] = useState(false);
  const [modoGaleriaIdentidade, definirModoGaleriaIdentidade] = useState(false);
  const [modoTelaImportacaoJson, definirModoTelaImportacaoJson] = useState(false);
  const [modoTelaGeradorPrompt, definirModoTelaGeradorPrompt] = useState(false);
  const [memoriaEmEdicao, definirMemoriaEmEdicao] = useState(null);

  // =====================================================================================
  // ESTADOS DE DADOS (MEMÓRIAS, ANEXOS E IDENTIDADE VISUAL)
  // =====================================================================================
  const [listaMidiasIdentidade, definirListaMidiasIdentidade] = useState([]);
  const [indiceLightboxIv, definirIndiceLightboxIv] = useState(null);

  const [listaMemorias, definirListaMemorias] = useState([]);
  const [listaAnexos, definirListaAnexos] = useState([]);
  const [abaMemoria, definirAbaMemoria] = useState('QUENTE'); // Filtro principal: QUENTE vs ARQUIVO

  // =====================================================================================
  // ESTADOS DE CONTROLE DE INTERFACE (EXPANSÃO DE TEXTOS)
  // =====================================================================================
  const [expandidoTipografia, definirExpandidoTipografia] = useState(false);
  const [expandidoTomVoz, definirExpandidoTomVoz] = useState(false);
  const [expandidoEstiloVisual, definirExpandidoEstiloVisual] = useState(false);

  const [exibirBotaoTipografia, definirExibirBotaoTipografia] = useState(false);
  const [exibirBotaoTomVoz, definirExibirBotaoTomVoz] = useState(false);
  const [exibirBotaoEstiloVisual, definirExibirBotaoEstiloVisual] = useState(false);

  // Referências para calcular dinamicamente a altura das caixas do cabeçalho
  const refPaletaCores = useRef(null);
  const refTipografia = useRef(null);
  const refTomVoz = useRef(null);
  const refEstiloVisual = useRef(null);

  // =====================================================================================
  // ESTADOS DO FORMULÁRIO DE UPLOAD DE ANEXOS
  // =====================================================================================
  const [arquivoUpload, definirArquivoUpload] = useState(null);
  const [descricaoManualAnexo, definirDescricaoManualAnexo] = useState('');
  const [analisarIa, definirAnalisarIa] = useState(true);

  // =====================================================================================
  // CICLOS DE VIDA (useEffect)
  // =====================================================================================
  
  // Gatilho inicial: Carrega as listas de memórias, anexos e mídias sempre que o projeto selecionado mudar
  useEffect(() => {
    definirDadosProjetoAtual(projetoSelecionado);
    carregarDadosWorkspace(projetoSelecionado.id);
    if (projetoSelecionado.identidade_visual_id) {
      carregarMidiasIdentidadeVisual(projetoSelecionado.identidade_visual_id);
    } else {
      definirListaMidiasIdentidade([]); // Reseta a lista se o projeto não tiver identidade
    }
  }, [projetoSelecionado]);

  // Listener de redimensionamento da janela: recalcula as alturas das caixas textuais
  useEffect(() => {
    const verificarAlturas = () => {
      if (refPaletaCores.current) {
        // Usa a caixa de paleta de cores como referência de altura limite (1.5x o tamanho dela)
        const alturaPaleta = refPaletaCores.current.clientHeight;
        const limiteAltura = alturaPaleta * 1.5;

        if (refTipografia.current) definirExibirBotaoTipografia(refTipografia.current.scrollHeight > limiteAltura);
        if (refTomVoz.current) definirExibirBotaoTomVoz(refTomVoz.current.scrollHeight > limiteAltura);
        if (refEstiloVisual.current) definirExibirBotaoEstiloVisual(refEstiloVisual.current.scrollHeight > limiteAltura);
      }
    };

    verificarAlturas();
    window.addEventListener('resize', verificarAlturas); // Atualiza caso o utilizador redimensione o browser
    return () => window.removeEventListener('resize', verificarAlturas);
  }, [dadosProjetoAtual]);

  // =====================================================================================
  // FUNÇÕES DE COMUNICAÇÃO COM O BACKEND (API REST)
  // =====================================================================================

  async function carregarMidiasIdentidadeVisual(idIv) {
    if (!idIv) return;
    try {
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/identidades-visuais/${idIv}/midias`);
      const dados = await res.json();
      if (Array.isArray(dados)) definirListaMidiasIdentidade(dados);
    } catch (err) {
      console.error('Erro ao carregar mídias da identidade visual:', err);
    }
  }

  // Descarrega simultaneamente as Memórias e os Anexos ligados ao ID do Projeto
  async function carregarDadosWorkspace(idDoProjeto = dadosProjetoAtual.id) {
    try {
      const resMem = await fetch(`${CONFIG_REDE.URL_BACKEND}/projetos/${idDoProjeto}/memorias`);
      const dadosMem = await resMem.json();
      if (Array.isArray(dadosMem)) definirListaMemorias(dadosMem);

      const resAnexos = await fetch(`${CONFIG_REDE.URL_BACKEND}/projetos/${idDoProjeto}/anexos`);
      const dadosAnexos = await resAnexos.json();
      if (Array.isArray(dadosAnexos)) definirListaAnexos(dadosAnexos);
    } catch (err) {
      console.error('Erro ao carregar dados do workspace:', err);
    }
  }

  // Utilizada quando voltamos da edição de um projeto: busca no backend o projeto de novo 
  // para garantir que dados como Nome e Logótipo estão atualizados na barra de topo.
  async function recarregarProjetoAtualizado() {
    try {
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/projetos?usuario_logado_id=${usuarioLogado.id}&perfil_logado=${usuarioLogado.perfil}`);
      const lista = await res.json();
      if (Array.isArray(lista)) {
        const atualizado = lista.find((p) => p.id === dadosProjetoAtual.id);
        if (atualizado) {
          definirDadosProjetoAtual(atualizado);
          if (atualizado.identidade_visual_id) {
            await carregarMidiasIdentidadeVisual(atualizado.identidade_visual_id);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao recarregar projeto:', err);
    }
  }

  function obterIconeTipo(tipo) {
    switch (tipo) {
      case 'DESENVOLVIMENTO': return <Code size={22} style={{ color: '#06b6d4' }} />;
      case 'CAMPANHA': return <Megaphone size={22} style={{ color: '#f97316' }} />;
      case 'COORDENACAO': return <Users size={22} style={{ color: '#10b981' }} />;
      case 'SALA_DE_AULA': return <GraduationCap size={22} style={{ color: '#8b5cf6' }} />;
      default: return <Folder size={22} style={{ color: '#9ca3af' }} />;
    }
  }

  // Atualização Parcial (PATCH) - Muito mais leve que enviar o objeto inteiro num PUT
  async function alternarRelevanciaAnexo(idAnexo, estadoAtual) {
    try {
      await fetch(`${CONFIG_REDE.URL_BACKEND}/anexos/${idAnexo}/relevancia`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ehRelevante: !estadoAtual })
      });
      carregarDadosWorkspace(); // Recarrega para refletir na interface
    } catch (err) {
      alert('Erro ao atualizar anexo.');
    }
  }

  async function alternarStatusMemoria(idMemoria, ehRelevanteAtual, estaArquivadoAtual) {
    try {
      await fetch(`${CONFIG_REDE.URL_BACKEND}/memorias/${idMemoria}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ehRelevante: !ehRelevanteAtual, estaArquivado: estaArquivadoAtual })
      });
      carregarDadosWorkspace();
    } catch (err) {
      alert('Erro ao atualizar memória.');
    }
  }

  async function moverParaArquivoMorto(idMemoria, estaArquivadoAtual) {
    try {
      await fetch(`${CONFIG_REDE.URL_BACKEND}/memorias/${idMemoria}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ehRelevante: estaArquivadoAtual, estaArquivado: !estaArquivadoAtual })
      });
      carregarDadosWorkspace();
    } catch (err) {
      alert('Erro ao mover memória.');
    }
  }

  /**
   * ENVIO DE FICHEIROS MISTOS: Utiliza a interface nativa FormData para agrupar 
   * o ficheiro binário (ficheiro físico) com texto simples (legenda, booleano de IA).
   */
  async function enviarAnexo(e) {
    e.preventDefault();
    if (!arquivoUpload) return;

    const formData = new FormData();
    formData.append('projetoId', dadosProjetoAtual.id);
    formData.append('arquivo', arquivoUpload);
    formData.append('descricaoManual', descricaoManualAnexo);
    formData.append('analisarComIa', analisarIa); // Passa a instrução ao backend para chamar o Gemini

    try {
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/anexos/upload`, { method: 'POST', body: formData });
      if (res.ok) {
        definirArquivoUpload(null); // Limpa o input
        definirDescricaoManualAnexo(''); // Limpa a legenda
        carregarDadosWorkspace(); // Atualiza a lista lateral para mostrar o novo ficheiro
        alert('Anexo enviado com sucesso!');
      } else {
        alert('Erro ao enviar ficheiro.');
      }
    } catch (err) {
      alert('Erro de conexão ao enviar anexo.');
    }
  }

  async function processarImportacaoJson(objetoJson) {
    const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/projetos/${dadosProjetoAtual.id}/importar-json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(objetoJson)
    });
    const resultado = await res.json();

    if (res.ok) {
      alert(resultado.mensagem || 'Prompts importados com sucesso!');
      carregarDadosWorkspace();
    } else {
      alert(resultado.mensagem || 'Erro ao importar JSON.');
      throw new Error(resultado.mensagem);
    }
  }

  // =====================================================================================
  // ROTEAMENTO INTERNO (Single Page Application Approach)
  // =====================================================================================
  // Dependendo de qual flag estiver 'true', o componente retorna um ecrã totalmente diferente.
  // O uso de props como 'aoVoltar' permite "fechar" esse ecrã alterando o estado no componente pai.

  if (memoriaEmEdicao) {
    return (
      <TelaEdicaoMemoria
        memoria={memoriaEmEdicao}
        projeto={dadosProjetoAtual}
        aoVoltar={() => definirMemoriaEmEdicao(null)} // Desliga o modo de edição
        aoSalvarSucesso={() => carregarDadosWorkspace()}
        aoExcluirSucesso={() => carregarDadosWorkspace()}
      />
    );
  }

  if (modoEdicaoProjeto) {
    return (
      <TelaEdicaoProjeto
        usuarioLogado={usuarioLogado}
        projeto={dadosProjetoAtual}
        aoSalvar={async () => { await recarregarProjetoAtualizado(); definirModoEdicaoProjeto(false); }}
        aoVoltar={() => definirModoEdicaoProjeto(false)}
      />
    );
  }

  if (modoGaleriaIdentidade) {
    return (
      <GaleriaIdentidadeVisual
        projeto={dadosProjetoAtual}
        aoAtualizarMidias={(novasMidias) => definirListaMidiasIdentidade(novasMidias)}
        aoVoltar={() => { recarregarProjetoAtualizado(); definirModoGaleriaIdentidade(false); }}
      />
    );
  }

  if (modoTelaIdentidadeVisual) {
    return (
      <TelaIdentidadeVisual
        projeto={dadosProjetoAtual}
        aoSalvar={async () => { await recarregarProjetoAtualizado(); definirModoTelaIdentidadeVisual(false); }}
        aoVoltar={() => { recarregarProjetoAtualizado(); definirModoTelaIdentidadeVisual(false); }}
        aoAbrirGaleriaCompleta={() => { definirModoTelaIdentidadeVisual(false); definirModoGaleriaIdentidade(true); }}
      />
    );
  }

  if (modoTelaImportacaoJson) {
    return (
      <TelaImportacaoJson
        projeto={dadosProjetoAtual}
        aoVoltar={() => definirModoTelaImportacaoJson(false)}
        aoImportarSucesso={processarImportacaoJson}
      />
    );
  }

  if (modoTelaGeradorPrompt) {
    return (
      <TelaGeradorPrompt
        projeto={dadosProjetoAtual}
        aoVoltar={() => definirModoTelaGeradorPrompt(false)}
        aoSalvarMemoriaSucesso={() => carregarDadosWorkspace()}
      />
    );
  }

  // Verifica se o projeto atual já tem um ID relacional para a tabela de Identidade Visual
  const possuiIdentidadeCadastrada = Boolean(dadosProjetoAtual.identidade_visual_id);

  // =====================================================================================
  // RENDERIZAÇÃO DO PAINEL PRINCIPAL (DASHBOARD)
  // =====================================================================================
  return (
    <div className="painel-workspace">
      
      {/* CABEÇALHO DO WORKSPACE */}
      <header className="barra-topo-workspace">
        
        {/* Navegação Superior */}
        <div className="linha-navegacao-topo">
          <div className="d-flex align-items-center gap-2">
            <button className="botao-voltar-projetos" onClick={aoVoltarParaSelecao}>
              <ArrowLeft size={18} />
              <span>Voltar aos Projetos</span>
            </button>
          </div>

          <div className="text-muted small">
            Logado como: <strong className="text-light ms-1">{usuarioLogado?.nome}</strong>
          </div>
        </div>

        {/* Informações Básicas do Projeto Atual */}
        <div className="cabecalho-identidade-projeto">
          <div className="moldura-logo-workspace">
            {dadosProjetoAtual.logo_url ? (
              <img src={`${CONFIG_REDE.URL_BACKEND}${dadosProjetoAtual.logo_url}`} alt={dadosProjetoAtual.titulo} className="imagem-logo-workspace" />
            ) : (
              <ImageIcon size={48} className="text-secondary" />
            )}
          </div>

          <div className="info-cabecalho-projeto">
            <div className="linha-titulo-projeto">
              <Flame size={30} strokeWidth={3} className="icone-flame-vermelho" />
              <h2 className="titulo-principal-projeto">{dadosProjetoAtual.titulo}</h2>

              <div className="bloco-tipo-projeto">
                {obterIconeTipo(dadosProjetoAtual.tipo_projeto)}
                <span className="texto-tipo-projeto">{dadosProjetoAtual.tipo_projeto}</span>
              </div>

              {/* Aciona o ecrã de TelaEdicaoProjeto */}
              <button type="button" className="botao-editar-cabecalho" onClick={() => definirModoEdicaoProjeto(true)}>
                <Edit3 size={16} />
                <span>Editar Projeto</span>
              </button>
            </div>

            <p className="descricao-objetivo-topo">
              {dadosProjetoAtual.objetivo || 'Nenhum objetivo geral definido para este projeto.'}
            </p>
          </div>
        </div>

        {/* Quadro de Identidade Visual (Vazio ou Preenchido) */}
        <div className="quadro-identidade-visual">
          {!possuiIdentidadeCadastrada ? (
            <div className="quadro-iv-vazio">
              <button type="button" className="btn botao-forja-laranja d-flex align-items-center gap-2" onClick={() => definirModoTelaIdentidadeVisual(true)}>
                <Palette size={18} />
                <span>Cadastrar Identidade Visual</span>
              </button>
            </div>
          ) : (
            <div>
              <div className="cabecalho-iv-preenchido">
                <div className="d-flex align-items-center gap-2">
                  <Palette size={20} className="text-info" />
                  <span className="fw-bold text-light">
                    Identidade Visual: <span className="text-info">{dadosProjetoAtual.nome_identidade}</span>
                  </span>
                </div>

                <div className="d-flex align-items-center flex-wrap gap-2">
                  <button type="button" className="botao-veja-mais-midias" style={{marginRight: '15px'}} onClick={() => definirModoGaleriaIdentidade(true)}>
                    <Eye size={15} />
                    <span>Galeria ({listaMidiasIdentidade.length})</span>
                  </button>
                  <button type="button" className="botao-editar-cabecalho" onClick={() => definirModoTelaIdentidadeVisual(true)}>
                    <Edit3 size={15} />
                    <span>Editar Identidade Visual</span>
                  </button>
                </div>
              </div>

              {/* Informações detalhadas da Identidade Visual */}
              <div className="grade-dados-iv">
                <div className="item-dado-iv center" ref={refPaletaCores}>
                  <span className="rotulo-dado-iv">Paleta de Cores</span>
                  <div className="linha-amostras-cores center">
                    {dadosProjetoAtual.cor_primaria && (
                      <span className="pilula-cor-iv" style={{margin: '5px auto'}}>
                        <span className="bolinha-cor-iv" style={{ backgroundColor: dadosProjetoAtual.cor_primaria }} />
                        {dadosProjetoAtual.cor_primaria}
                      </span>
                    )}
                    {dadosProjetoAtual.cor_secundaria && (
                      <span className="pilula-cor-iv" style={{margin: '5px auto'}}>
                        <span className="bolinha-cor-iv" style={{ backgroundColor: dadosProjetoAtual.cor_secundaria }} />
                        {dadosProjetoAtual.cor_secundaria}
                      </span>
                    )}
                    {dadosProjetoAtual.cor_destaque && (
                      <span className="pilula-cor-iv" style={{margin: '5px auto'}}>
                        <span className="bolinha-cor-iv" style={{ backgroundColor: dadosProjetoAtual.cor_destaque }} />
                        {dadosProjetoAtual.cor_destaque}
                      </span>
                    )}
                  </div>
                </div>

                <div className="item-dado-iv">
                  <span className="rotulo-dado-iv">Tipografia</span>
                  <div ref={refTipografia} className={`conteudo-caixa-iv ${expandidoTipografia ? 'expandido' : ''}`}>
                    <p className="valor-dado-iv">{dadosProjetoAtual.tipografia || 'Não informada'}</p>
                  </div>
                  {exibirBotaoTipografia && (
                    <button type="button" className="botao-detalhes-iv" onClick={() => definirExpandidoTipografia(!expandidoTipografia)}>
                      {expandidoTipografia ? 'Menos detalhes' : 'Mais detalhes'}
                    </button>
                  )}
                </div>

                <div className="item-dado-iv">
                  <span className="rotulo-dado-iv">Tom de Voz</span>
                  <div ref={refTomVoz} className={`conteudo-caixa-iv ${expandidoTomVoz ? 'expandido' : ''}`}>
                    <p className="valor-dado-iv">{dadosProjetoAtual.tom_de_voz || 'Não informado'}</p>
                  </div>
                  {exibirBotaoTomVoz && (
                    <button type="button" className="botao-detalhes-iv" onClick={() => definirExpandidoTomVoz(!expandidoTomVoz)}>
                      {expandidoTomVoz ? 'Menos detalhes' : 'Mais detalhes'}
                    </button>
                  )}
                </div>

                <div className="item-dado-iv">
                  <span className="rotulo-dado-iv">Estilo Visual</span>
                  <div ref={refEstiloVisual} className={`conteudo-caixa-iv ${expandidoEstiloVisual ? 'expandido' : ''}`}>
                    <p className="valor-dado-iv">{dadosProjetoAtual.estilo_visual || 'Não informado'}</p>
                  </div>
                  {exibirBotaoEstiloVisual && (
                    <button type="button" className="botao-detalhes-iv" onClick={() => definirExpandidoEstiloVisual(!expandidoEstiloVisual)}>
                      {expandidoEstiloVisual ? 'Menos detalhes' : 'Mais detalhes'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO PRINCIPAL (Módulos Inferiores) */}
      <main className="corpo-workspace-container">
        <div className="grade-colunas-workspace">
          
          {/* COLUNA ESQUERDA: Banco de Memórias */}
          <section className="painel-coluna-card coluna-principal-memorias" style={{ height: 'auto' }}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3 pb-3 border-bottom border-secondary">
              <h6 className="titulo-secao-coluna mb-0 border-0 pb-0">Banco de Memórias</h6>

              <button 
                type="button"
                className="btn btn-sm botao-forja-laranja d-flex align-items-center gap-1 py-2 px-3"
                style={{marginBottom: '15px'}}
                onClick={() => definirModoTelaImportacaoJson(true)}
              >
                <Upload size={14} />
                <span>Importar JSON de IA</span>
              </button>
            </div>

            {/* Alternador Quente / Arquivo Morto */}
            <div className="d-flex gap-2 mb-4">
              <button 
                type="button"
                style={{marginRight: '15px', marginBottom: '15px'}}
                className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 ${abaMemoria === 'QUENTE' ? 'btn-warning botao-aba-quente' : 'btn-outline-secondary botao-aba-inativa'}`}
                onClick={() => definirAbaMemoria('QUENTE')}
              >
                <CheckCircle2 size={15} />
                <span>Memória Quente ({listaMemorias.filter(m => !m.esta_arquivado).length})</span>
              </button>
              <button 
                type="button"
                className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 ${abaMemoria === 'ARQUIVO' ? 'btn-warning botao-aba-arquivo' : 'btn-outline-secondary botao-aba-inativa'}`}
                onClick={() => definirAbaMemoria('ARQUIVO')}
              >
                <Archive size={15} />
                <span>Arquivo Morto ({listaMemorias.filter(m => m.esta_arquivado).length})</span>
              </button>
            </div>

            {/* Renderização condicional através de map e filter */}
            <div className="d-flex flex-column">
              {listaMemorias
                .filter(m => abaMemoria === 'QUENTE' ? !m.esta_arquivado : m.esta_arquivado)
                .map((mem) => (
                <div key={mem.id} className="mb-3" style={{marginBottom: '20px'}}>
                  <CartaoMemoriaItem
                    key={mem.id} 
                    mem={mem} 
                    alternarStatusMemoria={alternarStatusMemoria} 
                    moverParaArquivoMorto={moverParaArquivoMorto} 
                    aoIniciarEdicao={(memoriaAlvo) => definirMemoriaEmEdicao(memoriaAlvo)}
                  /></div>
                ))}
            </div>
          </section>

          {/* COLUNA DIREITA: Geração de Prompts e Gestão de Anexos */}
          <div className="sidebar-colunas-direita" style={{ height: 'auto' }}>
            
            {/* Bloco 1: Gerador Avançado */}
            <section className="painel-coluna-card" style={{ height: 'auto' }}>
              <h6 className="titulo-secao-coluna">
                <Sparkles size={18} />
                <span>Forjar Novo Prompt</span>
              </h6>

              <p className="text-muted small mb-4">
                Aceda à Central de Geração Avançada para criar prompts personalizados utilizando o contexto completo do projeto.
              </p>

              <button 
                type="button"
                style={{marginTop: '15px'}} 
                className="btn botao-forja-laranja w-100 d-flex justify-content-center align-items-center gap-2 py-3 fw-bold"
                onClick={() => definirModoTelaGeradorPrompt(true)}
              >
                <Flame size={20} strokeWidth={2.5} />
                <span>Abrir Central de Geração Avançada</span>
              </button>
            </section>

            {/* Bloco 2: Upload de Ficheiros e Listagem de Anexos */}
            <section className="painel-coluna-card" style={{ height: 'auto' }}>
              <h6 className="titulo-secao-coluna">Anexos, Imagens & Ficheiros</h6>
              
              <form onSubmit={enviarAnexo} className="caixa-upload-anexo">
                <div className="grupo-campo-workspace mb-3">
                  <label className="form-label">Selecionar Ficheiro ou Imagem</label>
                  <input 
                    type="file" 
                    className="form-control form-control-sm formulario-input-workspace"
                    onChange={(e) => definirArquivoUpload(e.target.files[0])}
                    required
                  />
                </div>

                <div className="grupo-campo-workspace mb-3">
                  <label className="form-label">Descrição / Legenda Manual</label>
                  <input 
                    type="text" 
                    className="form-control form-control-sm formulario-input-workspace"
                    placeholder="Ex: Diagrama, ecrã de login..."
                    value={descricaoManualAnexo}
                    onChange={(e) => definirDescricaoManualAnexo(e.target.value)}
                  />
                </div>

                <div className="form-check mb-3">
                  <input type="checkbox" className="form-check-input" id="chkIa" checked={analisarIa} onChange={(e) => definirAnalisarIa(e.target.checked)} />
                  <label className="form-check-label small text-info ms-1" htmlFor="chkIa">Analisar com Gemini Vision</label>
                </div>

                <button type="submit" className="btn botao-forja-laranja w-100" style={{marginTop: '15px'}}>Enviar Anexo</button>
              </form>

              {/* Renderização da listagem de anexos importados */}
              <div className="d-flex flex-column gap-3 mt-4">
                {listaAnexos.map((anexo) => (
                  <CartaoAnexoItem 
                    key={anexo.id} 
                    anexo={anexo} 
                    alternarRelevanciaAnexo={alternarRelevanciaAnexo} 
                  />
                ))}
              </div>
            </section>

          </div>

        </div>
      </main>

      {/* COMPONENTE GLOBAL: Lightbox de Imagens (Galeria Flutuante) */}
      {/* O componente só é montado caso o índice selecionado não seja null */}
      {indiceLightboxIv !== null && (
        <ModalVisualizadorMidia
          listaMidias={listaMidiasIdentidade}
          indiceInicial={indiceLightboxIv}
          aoFechar={() => definirIndiceLightboxIv(null)}
        />
      )}
    </div>
  );
}