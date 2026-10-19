// Importa o React e hooks essenciais para manipulação de estado e ciclo de vida
import React, { useState, useEffect } from 'react';

// Importa a biblioteca de ícones para compor a interface visual
import { ArrowLeft, Save, Palette, Flame, Upload, Music, Video, Eye } from 'lucide-react';

// Importa o subcomponente "ModalVisualizadorMidia" do arquivo da Galeria para gerir o Lightbox
import { ModalVisualizadorMidia } from './GaleriaIdentidadeVisual';

// Importa as folhas de estilo dedicadas a este ecrã e à galeria associada
import '../estilos/TelaIdentidadeVisual.css';
import '../estilos/GaleriaIdentidadeVisual.css';

// =====================================================================================
// IMPORTAÇÃO DA VARIÁVEL GLOBAL DE CONFIGURAÇÃO DE REDE
// =====================================================================================
// Permite que todas as requisições (fetch) apontem automaticamente para a URL 
// do backend configurada globalmente no sistema (ex: http://localhost:3527).
import { CONFIG_REDE } from './config';

/**
 * COMPONENTE: TelaIdentidadeVisual
 * -------------------------------------------------------------------------------------
 * Permite ao utilizador criar ou editar as diretrizes visuais e comunicacionais de um projeto.
 * Esta "Identidade Visual" é fundamental porque atua como contexto injetável para a IA:
 * Cores, Tipografia, Tom de Voz e Estilo Visual são cruzados pelo Gerador de Prompts.
 * 
 * Além disso, o ecrã gere um submódulo de "Upload de Mídias de Composição", permitindo
 * anexar elementos inspiracionais ou padrão (Imagens, Vídeos e Áudios) associados à Identidade.
 */
export default function TelaIdentidadeVisual({ projeto, aoSalvar, aoVoltar, aoAbrirGaleriaCompleta }) {
  
  // =====================================================================================
  // IDENTIFICAÇÃO DE MODO (Criação vs Edição)
  // =====================================================================================
  // Verifica se o projeto atual já possui uma identidade visual vinculada
  const [idIdentidadeAtual, definirIdIdentidadeAtual] = useState(projeto?.identidade_visual_id || null);
  // Booleano utilitário para adaptar textos e rotas de API (POST vs PUT)
  const editandoExistente = Boolean(idIdentidadeAtual);

  // =====================================================================================
  // ESTADOS DO FORMULÁRIO (Configurações Visuais e Comunicacionais)
  // =====================================================================================
  const [nome, definirNome] = useState(projeto?.nome_identidade || `Identidade - ${projeto?.titulo || 'Projeto'}`);
  const [corPrimaria, definirCorPrimaria] = useState(projeto?.cor_primaria || '#0f172a');
  const [corSecundaria, definirCorSecundaria] = useState(projeto?.cor_secundaria || '#f97316');
  const [corDestaque, definirCorDestaque] = useState(projeto?.cor_destaque || '#06b6d4');
  const [tipografia, definirTipografia] = useState(projeto?.tipografia || '');
  const [estiloVisual, definirEstiloVisual] = useState(projeto?.estilo_visual || '');
  const [tomDeVoz, definirTomDeVoz] = useState(projeto?.tom_de_voz || '');
  const [salvando, definirSalvando] = useState(false);

  // =====================================================================================
  // ESTADOS DO SUBMÓDULO DE UPLOAD DE MÍDIAS DE COMPOSIÇÃO
  // =====================================================================================
  const [listaMidiasIv, definirListaMidiasIv] = useState([]); // Array de ficheiros já anexados
  const [arquivoMidia, definirArquivoMidia] = useState(null); // Ficheiro binário selecionado no input
  const [legendaMidia, definirLegendaMidia] = useState('');   // Metadado descritivo do ficheiro
  const [enviandoMidia, definirEnviandoMidia] = useState(false);
  
  // Estado que controla a abertura do Modal Lightbox (se for null, fecha o modal)
  const [indiceLightbox, definirIndiceLightbox] = useState(null);

  // =====================================================================================
  // CICLO DE VIDA (useEffect)
  // =====================================================================================
  // Assim que o ecrã for montado, se já existir uma identidade, carrega a grelha de ficheiros
  useEffect(() => {
    if (idIdentidadeAtual) {
      carregarMidiasDaIdentidade(idIdentidadeAtual);
    }
  }, [idIdentidadeAtual]);

  /**
   * FUNÇÃO: carregarMidiasDaIdentidade
   * -------------------------------------------------------------------------------------
   * Faz um fetch (GET) ao backend solicitando todas as mídias atreladas à ID desta Identidade.
   */
  async function carregarMidiasDaIdentidade(idIv) {
    try {
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/identidades-visuais/${idIv}/midias`);
      const dados = await res.json();
      if (Array.isArray(dados)) definirListaMidiasIv(dados);
    } catch (err) {
      console.error('Erro ao carregar mídias da identidade:', err);
    }
  }

  /**
   * FUNÇÃO: salvarIdentidadeVisual
   * -------------------------------------------------------------------------------------
   * Submete os dados de texto (Cores, Tom, Tipografia) via requisição JSON.
   * Se já existia uma identidade (editandoExistente = true), faz PUT (atualiza).
   * Se não existia, faz POST (cria) associando-a ao ID do Projeto.
   */
  async function salvarIdentidadeVisual(e) {
    e.preventDefault();
    definirSalvando(true);

    const url = editandoExistente
      ? `${CONFIG_REDE.URL_BACKEND}/identidades-visuais/${idIdentidadeAtual}`
      : `${CONFIG_REDE.URL_BACKEND}/identidades-visuais`;

    const metodo = editandoExistente ? 'PUT' : 'POST';

    try {
      const resposta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projetoId: projeto.id,
          nome,
          corPrimaria,
          corSecundaria,
          corDestaque,
          tipografia,
          estiloVisual,
          tomDeVoz
        })
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        alert(editandoExistente ? 'Identidade Visual atualizada!' : 'Identidade Visual cadastrada!');
        // Atualiza o estado na Tela Principal
        aoSalvar();
      } else {
        alert(dados.mensagem || 'Erro ao guardar identidade visual.');
      }
    } catch (erro) {
      alert('Erro de conexão com o servidor.');
    } finally {
      definirSalvando(false);
    }
  }

  /**
   * FUNÇÃO: anexarMidiaComposicao
   * -------------------------------------------------------------------------------------
   * Funciona de forma independente do formulário principal de Identidade Visual.
   * Se o utilizador anexar uma imagem antes de guardar a Identidade, o sistema tenta "salvar 
   * o esqueleto" (POST de IdentidadeVisual em background) para obter um ID e só depois 
   * faz o upload (POST multipart/form-data) na rota de mídias usando esse novo ID.
   */
  async function anexarMidiaComposicao(e) {
    e.preventDefault(); // Previne recarregamento se disparado por form submit (embora aqui seja um onClick)
    
    // Validação básica do ficheiro e da legenda
    if (!arquivoMidia || !legendaMidia.trim()) {
      alert('Selecione um ficheiro (imagem, áudio ou vídeo) e preencha a legenda obrigatória.');
      return;
    }

    definirEnviandoMidia(true);
    let idParaAnexar = idIdentidadeAtual;

    try {
      // 1. Criação condicional em background (Cenário: Identidade Nova)
      if (!idParaAnexar) {
        const resCriar = await fetch(`${CONFIG_REDE.URL_BACKEND}/identidades-visuais`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projetoId: projeto.id,
            nome, corPrimaria, corSecundaria, corDestaque,
            tipografia, estiloVisual, tomDeVoz
          })
        });
        const dadosCriar = await resCriar.json();
        if (!resCriar.ok) throw new Error('Falha ao inicializar a estrutura da Identidade Visual.');
        
        // Atribui o novo ID gerado pela BD
        idParaAnexar = dadosCriar.id;
        definirIdIdentidadeAtual(idParaAnexar); 
      }

      // 2. Upload do Ficheiro usando FormData
      const formData = new FormData();
      formData.append('midia', arquivoMidia);
      formData.append('legenda', legendaMidia);

      const resMidia = await fetch(`${CONFIG_REDE.URL_BACKEND}/identidades-visuais/${idParaAnexar}/midias`, {
        method: 'POST',
        body: formData // Envia em formato Multipart/form-data automaticamente
      });

      if (resMidia.ok) {
        // Limpa os inputs de ficheiro após sucesso e recarrega a grelha
        definirArquivoMidia(null);
        definirLegendaMidia('');
        await carregarMidiasDaIdentidade(idParaAnexar);
      } else {
        alert('Erro ao anexar ficheiro na API.');
      }
    } catch (erro) {
      alert(erro.message || 'Erro inesperado ao enviar mídia.');
    } finally {
      definirEnviandoMidia(false);
    }
  }

  // =====================================================================================
  // RENDERIZAÇÃO DA INTERFACE (JSX)
  // =====================================================================================
  return (
    <div className="tela-iv-container">
      <div className="container" style={{ maxWidth: '900px' }}>
        
        {/* ================= BARRA DE TOPO (Navegação) ================= */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <button type="button" className="botao-voltar-projetos" onClick={aoVoltar}>
            <ArrowLeft size={18} />
            <span>Voltar ao Projeto</span>
          </button>

          <h4 className="fw-bold text-warning mb-0 d-flex align-items-center gap-2">
            <Flame size={24} strokeWidth={3} className="icone-flame-vermelho" />
            <span>{editandoExistente ? 'Editar Identidade Visual' : 'Cadastrar Identidade Visual'}</span>
          </h4>
        </div>

        {/* ================= CARTÃO PRINCIPAL DO FORMULÁRIO ================= */}
        <div className="card-iv-forja">
          
          <form onSubmit={salvarIdentidadeVisual}>
            
            {/* PRÉ-VISUALIZAÇÃO DE CORES (Renderizada com base no estado em tempo real) */}
            <label className="form-label small text-secondary fw-bold mb-2 d-flex align-items-center gap-2">
              <Palette size={16} className="text-warning" />
              <span>Pré-visualização da Paleta de Cores</span>
            </label>
            <div className="barra-previa-paleta">
              <div className="fatia-cor-previa" style={{ backgroundColor: corPrimaria }}>
                Primária ({corPrimaria})
              </div>
              <div className="fatia-cor-previa" style={{ backgroundColor: corSecundaria }}>
                Secundária ({corSecundaria})
              </div>
              <div className="fatia-cor-previa" style={{ backgroundColor: corDestaque }}>
                Destaque ({corDestaque})
              </div>
            </div>

            <div className="row">
              {/* NOME DA IDENTIDADE */}
              <div className="col-12">
                <div className="grupo-campo-iv">
                  <label className="form-label">Nome da Identidade Visual</label>
                  <input
                    type="text"
                    className="form-control input-iv-dark"
                    value={nome}
                    onChange={(e) => definirNome(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* SELETORES DE CORES: Combinam o color-picker nativo com input de texto HEX */}
              <div className="col-12 col-md-4">
                <div className="grupo-campo-iv">
                  <label className="form-label">Cor Primária</label>
                  <div className="caixa-seletor-cor">
                    <input type="color" className="input-cor-nativo" value={corPrimaria} onChange={(e) => definirCorPrimaria(e.target.value)} />
                    <input type="text" className="input-hex-cor" value={corPrimaria} onChange={(e) => definirCorPrimaria(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="grupo-campo-iv">
                  <label className="form-label">Cor Secundária</label>
                  <div className="caixa-seletor-cor">
                    <input type="color" className="input-cor-nativo" value={corSecundaria} onChange={(e) => definirCorSecundaria(e.target.value)} />
                    <input type="text" className="input-hex-cor" value={corSecundaria} onChange={(e) => definirCorSecundaria(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="grupo-campo-iv">
                  <label className="form-label">Cor de Destaque</label>
                  <div className="caixa-seletor-cor">
                    <input type="color" className="input-cor-nativo" value={corDestaque} onChange={(e) => definirCorDestaque(e.target.value)} />
                    <input type="text" className="input-hex-cor" value={corDestaque} onChange={(e) => definirCorDestaque(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* INSTRUÇÕES LINGUÍSTICAS E TIPOGRÁFICAS PARA A IA */}
              <div className="col-12 col-md-6">
                <div className="grupo-campo-iv">
                  <label className="form-label">Tipografia (Fontes)</label>
                  <input
                    type="text"
                    className="form-control input-iv-dark"
                    placeholder="Ex: Inter, Montserrat, Serifadas para Títulos"
                    value={tipografia}
                    onChange={(e) => definirTipografia(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="grupo-campo-iv">
                  <label className="form-label">Tom de Voz</label>
                  <input
                    type="text"
                    className="form-control input-iv-dark"
                    placeholder="Ex: Didático, técnico, direto e descontraído"
                    value={tomDeVoz}
                    onChange={(e) => definirTomDeVoz(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12">
                <div className="grupo-campo-iv">
                  <label className="form-label">Estilo Visual Detalhado</label>
                  <textarea
                    className="form-control input-iv-dark"
                    rows="3"
                    placeholder="Ex: Utilizar um estilo minimalista, focado em linhas retas, com grande contraste entre texto e fundo."
                    value={estiloVisual}
                    onChange={(e) => definirEstiloVisual(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ================= SUBMÓDULO: UPLOAD DE MÍDIAS ================= */}
            <div className="secao-midias-composicao">
              <h6 className="titulo-secao-midias">
                Mídias de Composição da Identidade Visual (Imagens, Áudios e Vídeos)
              </h6>

              {/* Formulário Inline de Upload */}
              <div className="row g-3 align-items-end mb-4">
                <div className="col-12 col-md-5">
                  <label className="form-label small text-secondary fw-bold mb-2">Selecionar Ficheiro</label>
                  <input
                    type="file"
                    accept="image/*,video/*,audio/*"
                    className="form-control input-iv-dark"
                    onChange={(e) => definirArquivoMidia(e.target.files[0])}
                  />
                </div>
                <div className="col-12 col-md-5">
                  <label className="form-label small text-secondary fw-bold mb-2">Legenda do Anexo</label>
                  <input
                    type="text"
                    className="form-control input-iv-dark"
                    placeholder="Ex: Padrão de background / Vinheta Musical..."
                    value={legendaMidia}
                    onChange={(e) => definirLegendaMidia(e.target.value)}
                  />
                </div>
                
                {/* Botão de Anexo Assíncrono (Chama a função mas não submete o form geral) */}
                <div className="col-12 col-md-2">
                  <button
                    type="button"
                    className="btn btn-info text-dark fw-bold w-100 d-flex align-items-center justify-content-center gap-1 py-2 mt-2"
                    onClick={anexarMidiaComposicao}
                    disabled={enviandoMidia}
                  >
                    <Upload size={16} />
                    <span>{enviandoMidia ? '...' : 'Anexar'}</span>
                  </button>
                </div>
              </div>

              {/* GRELHA DE MINIATURAS E GALERIA */}
              {/* Exibe até 6 miniaturas no ecrã. Se houverem mais, um botão "Veja Mais" abrirá a Galeria Completa. */}
              {listaMidiasIv.length > 0 && (
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 pt-3 border-top border-secondary">
                  <div className="linha-miniaturas-56">
                    {listaMidiasIv.slice(0, 6).map((midia, idx) => {
                      const urlMidia = `${CONFIG_REDE.URL_BACKEND}${midia.caminho_arquivo}`;
                      return (
                        // Div clicável que abre o Lightbox (Modal) passando o índice
                        <div
                          key={midia.id}
                          className="miniatura-56-redonda"
                          title={`${midia.legenda} (Clique para ampliar)`}
                          onClick={() => definirIndiceLightbox(idx)}
                        >
                          {midia.tipo_midia === 'IMAGEM' && <img src={urlMidia} alt={midia.legenda} />}
                          {midia.tipo_midia === 'VIDEO' && <Video size={22} className="text-warning" />}
                          {midia.tipo_midia === 'AUDIO' && <Music size={22} className="text-info" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Renderização Condicional: Acesso à Galeria Completa */}
                  {aoAbrirGaleriaCompleta && (
                    <button
                      type="button"
                      className="botao-veja-mais-midias"
                      onClick={aoAbrirGaleriaCompleta}
                    >
                      <Eye size={15} />
                      <span>Veja Mais ({listaMidiasIv.length})</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* RODAPÉ DO FORMULÁRIO GERAL (Salvar Identidade) */}
            <div className="d-flex justify-content-end align-items-center gap-3 mt-4 pt-3 border-top border-secondary">
              <button type="button" className="btn botao-forja-vermelho" onClick={aoVoltar}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn botao-forja-laranja d-flex align-items-center gap-2"
                disabled={salvando}
              >
                <Save size={18} />
                <span>{salvando ? 'A Guardar...' : 'Guardar Identidade Visual'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ================= LIGHTBOX POP-UP (OVERLAY GLOBAL) ================= */}
      {/* O Modal Visualizador sobrepõe o ecrã inteiro. Desmonta caso 'indiceLightbox' seja null. */}
      {indiceLightbox !== null && (
        <ModalVisualizadorMidia
          listaMidias={listaMidiasIv}
          indiceInicial={indiceLightbox}
          aoFechar={() => definirIndiceLightbox(null)}
        />
      )}
    </div>
  );
}