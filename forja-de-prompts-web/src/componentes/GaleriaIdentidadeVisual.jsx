// Importação dos ganchos (hooks) básicos e utilitários do React para gerenciamento de estado e ciclo de vida
import React, { useState, useEffect } from 'react';

// Importação de ícones visuais da biblioteca 'lucide-react' para enriquecer a interface do usuário
import {
  ArrowLeft, Upload, Trash2, Edit2, ChevronLeft, ChevronRight,
  X, Music, Video, Image as ImageIcon, Check, Flame
} from 'lucide-react';

// Importação do arquivo de folha de estilos CSS específico para esta galeria de identidade visual
import '../estilos/GaleriaIdentidadeVisual.css';

// =====================================================================================
// IMPORTAÇÃO DA VARIÁVEL GLOBAL DE CONFIGURAÇÃO DE REDE
// =====================================================================================
// Importa o objeto centralizado de rede. Modificando o arquivo config.js, 
// a URL/IP do backend mudará automaticamente em todo o projeto.
import { CONFIG_REDE } from './config';

// =====================================================================================
// COMPONENTE REUTILIZÁVEL: MODAL LIGHTBOX (TAMANHO REAL + SETAS + PLAYERS DE MÍDIA)
// =====================================================================================
export function ModalVisualizadorMidia({ listaMidias, indiceInicial, aoFechar }) {
  // Define o estado para controlar qual índice de mídia está sendo exibido atualmente no lightbox
  const [indiceAtual, definirIndiceAtual] = useState(indiceInicial || 0);

  // Armazena o número total de mídias presentes na lista
  const total = listaMidias.length;
  
  // Obtém o objeto da mídia atual com base no índice ativo
  const midiaAtual = listaMidias[indiceAtual];

  // Função para navegar para o item anterior da galeria de forma circular
  function irParaAnterior(e) {
    if (e) e.stopPropagation(); // Impede a propagação do clique para elementos pai
    definirIndiceAtual((atual) => (atual - 1 + total) % total);
  }

  // Função para navegar para o próximo item da galeria de forma circular
  function irParaProximo(e) {
    if (e) e.stopPropagation(); // Impede a propagação do clique para elementos pai
    definirIndiceAtual((atual) => (atual + 1) % total);
  }

  // Efeito colateral para escutar eventos de teclado (Setas direcionais e tecla ESC)
  useEffect(() => {
    function aoPressionarTecla(e) {
      if (e.key === 'ArrowLeft') irParaAnterior(); // Navega para a esquerda
      if (e.key === 'ArrowRight') irParaProximo(); // Navega para a direita
      if (e.key === 'Escape') aoFechar();         // Fecha o modal
    }
    window.addEventListener('keydown', aoPressionarTecla);
    // Remove o ouvinte de evento ao desmontar o componente para evitar vazamento de memória
    return () => window.removeEventListener('keydown', aoPressionarTecla);
  }, [total]);

  // Retorna nulo caso não exista nenhuma mídia selecionada
  if (!midiaAtual) return null;

  // Monta a URL completa do arquivo de mídia utilizando a variável centralizada CONFIG_REDE.URL_BACKEND
  const urlCompleta = `${CONFIG_REDE.URL_BACKEND}${midiaAtual.caminho_arquivo}`;

  return (
    // Contêiner principal do fundo escuro do modal que fecha ao ser clicado fora
    <div className="fundo-modal-lightbox" onClick={aoFechar}>
      {/* Barra Superior do Modal contendo o contador e o botão de fechar */}
      <div className="topo-lightbox" onClick={(e) => e.stopPropagation()}>
        <span className="contador-lightbox">
          Item {indiceAtual + 1} de {total} • {midiaAtual.tipo_midia}
        </span>
        <button type="button" className="botao-fechar-lightbox" onClick={aoFechar} title="Fechar (ESC)">
          <X size={22} />
        </button>
      </div>

      {/* Palco Central do Modal com as setas de navegação lateral */}
      <div className="palco-central-lightbox" onClick={(e) => e.stopPropagation()}>
        {/* Renderiza a seta esquerda apenas se houver mais de um item */}
        {total > 1 && (
          <button type="button" className="seta-navegacao-lightbox" onClick={irParaAnterior} title="Anterior">
            <ChevronLeft size={28} />
          </button>
        )}

        {/* Contêiner que abriga a mídia em tamanho real */}
        <div className="contenedor-midia-real">
          {/* Renderiza imagem se o tipo for IMAGEM */}
          {midiaAtual.tipo_midia === 'IMAGEM' && (
            <img src={urlCompleta} alt={midiaAtual.legenda} className="imagem-tamanho-real" />
          )}

          {/* Renderiza player de vídeo se o tipo for VIDEO */}
          {midiaAtual.tipo_midia === 'VIDEO' && (
            <video key={urlCompleta} src={urlCompleta} controls autoPlay className="video-player-real">
              Seu navegador não suporta a reprodução de vídeo.
            </video>
          )}

          {/* Renderiza player de áudio se o tipo for AUDIO */}
          {midiaAtual.tipo_midia === 'AUDIO' && (
            <div className="caixa-audio-player-real">
              <Music size={56} className="text-info mb-3" />
              <h6 className="fw-bold text-light mb-3">{midiaAtual.nome_arquivo}</h6>
              <audio key={urlCompleta} src={urlCompleta} controls autoPlay className="w-100">
                Seu navegador não suporta a reprodução de áudio.
              </audio>
            </div>
          )}

          {/* Rodapé interno exibindo a legenda da mídia */}
          <div className="legenda-rodape-lightbox">
            {midiaAtual.legenda}
          </div>
        </div>

        {/* Renderiza a seta direita apenas se houver mais de um item */}
        {total > 1 && (
          <button type="button" className="seta-navegacao-lightbox" onClick={irParaProximo} title="Próximo">
            <ChevronRight size={28} />
          </button>
        )}
      </div>
    </div>
  );
}

// =====================================================================================
// TELA PRINCIPAL DA GALERIA DE MÍDIAS (MINIATURAS + FORMULÁRIO DE UPLOAD + EDIÇÃO)
// =====================================================================================
export default function GaleriaIdentidadeVisual({ projeto, aoVoltar, aoAtualizarMidias }) {
  // Estados para gerenciar a lista de mídias, arquivo selecionado, legenda e status de envio
  const [listaMidias, definirListaMidias] = useState([]);
  const [arquivoSelecionado, definirArquivoSelecionado] = useState(null);
  const [legendaNova, definirLegendaNova] = useState('');
  const [enviando, definirEnviando] = useState(false);

  // Estado para controlar o índice aberto no Lightbox (Pop-up em tamanho real)
  const [indiceLightbox, definirIndiceLightbox] = useState(null);

  // Estados para gerenciar a edição individual da legenda de um item
  const [midiaEmEdicaoId, definirMidiaEmEdicaoId] = useState(null);
  const [legendaEditada, definirLegendaEditada] = useState('');

  // Extrai o ID da identidade visual recebida via propriedades do componente pai
  const idIdentidade = projeto?.identidade_visual_id;

  // Efeito disparado sempre que o ID da identidade visual mudar para carregar as mídias do backend
  useEffect(() => {
    if (idIdentidade) {
      carregarMidias();
    }
  }, [idIdentidade]);

  // Função assíncrona para buscar as mídias cadastradas no backend usando a URL centralizada
  async function carregarMidias() {
    try {
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/identidades-visuais/${idIdentidade}/midias`);
      const dados = await res.json();
      if (Array.isArray(dados)) {
        definirListaMidias(dados);
        // Callback opcional para atualizar o componente pai com os novos dados
        if (aoAtualizarMidias) aoAtualizarMidias(dados);
      }
    } catch (erro) {
      console.error('Erro ao carregar mídias da galeria:', erro);
    }
  }

  // Função assíncrona para enviar um novo arquivo de mídia (imagem, vídeo ou áudio)
  async function enviarNovaMidia(e) {
    e.preventDefault();
    if (!arquivoSelecionado) return;
    definirEnviando(true);

    // Utiliza FormData para envio de arquivos binários via requisição HTTP POST
    const formData = new FormData();
    formData.append('midia', arquivoSelecionado);
    formData.append('legenda', legendaNova);

    try {
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/identidades-visuais/${idIdentidade}/midias`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        // Limpa os campos do formulário e recarrega a lista de mídias se o envio for bem-sucedido
        definirArquivoSelecionado(null);
        definirLegendaNova('');
        e.target.reset();
        await carregarMidias();
      } else {
        alert('Erro ao enviar mídia.');
      }
    } catch (erro) {
      alert('Erro de conexão ao enviar mídia.');
    } finally {
      definirEnviando(false);
    }
  }

  // Ativa o modo de edição para a legenda de um item específico
  function iniciarEdicao(midia) {
    definirMidiaEmEdicaoId(midia.id);
    definirLegendaEditada(midia.legenda);
  }

  // Função assíncrona para salvar a alteração da legenda no backend
  async function salvarEdicaoLegenda(midiaId) {
    if (!legendaEditada.trim()) return;
    try {
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/identidades-visuais/midias/${midiaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legenda: legendaEditada })
      });
      if (res.ok) {
        definirMidiaEmEdicaoId(null); // Encerra o modo de edição
        await carregarMidias();      // Atualiza a listagem
      } else {
        alert('Erro ao atualizar legenda.');
      }
    } catch (erro) {
      alert('Erro de conexão ao atualizar.');
    }
  }

  // Função assíncrona para excluir uma mídia específica após confirmação do usuário
  async function excluirMidia(midiaId) {
    if (!window.confirm('Deseja realmente excluir esta mídia da Identidade Visual?')) return;
    try {
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/identidades-visuais/midias/${midiaId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await carregarMidias(); // Recarrega a listagem após exclusão
      } else {
        alert('Erro ao excluir mídia.');
      }
    } catch (erro) {
      alert('Erro de conexão ao excluir.');
    }
  }

  return (
    <div className="galeria-iv-container">
      <div className="container" style={{ maxWidth: '1200px' }}>
        
        {/* TOPO DE NAVEGAÇÃO E TÍTULO DA PÁGINA */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <button type="button" className="botao-voltar-projetos" onClick={aoVoltar}>
            <ArrowLeft size={18} />
            <span>Voltar ao Projeto</span>
          </button>

          <h4 className="fw-bold text-warning mb-0 d-flex align-items-center gap-2">
            <Flame size={26} strokeWidth={3} className="icone-flame-vermelho" />
            <span>Galeria da Identidade Visual: {projeto?.nome_identidade}</span>
          </h4>
        </div>

        {/* PAINEL DE FORMULÁRIO PARA ADIÇÃO DE NOVOS ARQUIVOS */}
        <div className="painel-upload-galeria">
          <h6 className="fw-bold text-warning text-uppercase mb-3">
            Adicionar Imagem, Áudio ou Vídeo de Composição
          </h6>
          <form onSubmit={enviarNovaMidia}>
            <div className="row g-3 align-items-end">
              {/* Campo de seleção de arquivo local */}
              <div className="col-12 col-md-5">
                <label className="form-label small text-secondary fw-bold">
                  Arquivo (Imagem, Vídeo ou Áudio)
                </label>
                <input
                  type="file"
                  accept="image/*,video/*,audio/*"
                  className="form-control formulario-input-workspace"
                  onChange={(e) => definirArquivoSelecionado(e.target.files[0])}
                  required
                />
              </div>

              {/* Campo de preenchimento da legenda descritiva */}
              <div className="col-12 col-md-5">
                <label className="form-label small text-secondary fw-bold">
                  Legenda do Anexo
                </label>
                <input
                  type="text"
                  className="form-control formulario-input-workspace"
                  placeholder="Ex: Referência de tela inicial / Trilha sonora de fundo..."
                  value={legendaNova}
                  onChange={(e) => definirLegendaNova(e.target.value)}
                  required
                />
              </div>

              {/* Botão de envio do formulário */}
              <div className="col-12 col-md-2">
                <button
                  type="submit"
                  style={{marginTop: '15px'}}
                  className="btn botao-forja-laranja w-100 d-flex align-items-center justify-content-center gap-2"
                  disabled={enviando}
                >
                  <Upload size={16} />
                  <span>{enviando ? 'Enviando...' : 'Carregar'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* GRADE DE MINIATURAS DA GALERIA */}
        <div className="grade-galeria-120">
          {listaMidias.map((midia, index) => {
            // Monta a URL de cada arquivo utilizando a variável centralizada CONFIG_REDE.URL_BACKEND
            const urlArquivo = `${CONFIG_REDE.URL_BACKEND}${midia.caminho_arquivo}`;
            const estaEditando = midiaEmEdicaoId === midia.id;

            return (
              <div key={midia.id} className="cartao-midia-galeria">
                {/* Miniatura interativa que abre o modal em tamanho real ao ser clicada */}
                <div
                  className="miniatura-120-quadrada"
                  onClick={() => definirIndiceLightbox(index)}
                  title="Clique para abrir em tamanho real / dar play"
                >
                  {midia.tipo_midia === 'IMAGEM' && (
                    <img src={urlArquivo} alt={midia.legenda} />
                  )}
                  {midia.tipo_midia === 'VIDEO' && (
                    <>
                      <video src={urlArquivo} muted />
                      <span className="etiqueta-tipo-midia">VÍDEO ▶</span>
                    </>
                  )}
                  {midia.tipo_midia === 'AUDIO' && (
                    <>
                      <Music size={42} className="text-info" />
                      <span className="etiqueta-tipo-midia">ÁUDIO ♫</span>
                    </>
                  )}
                </div>

                {/* Bloco condicional: Exibe input de edição ou o texto da legenda */}
                {estaEditando ? (
                  <div className="w-100 mb-3">
                    <input
                      type="text"
                      className="form-control form-control-sm formulario-input-workspace mb-2"
                      value={legendaEditada}
                      onChange={(e) => definirLegendaEditada(e.target.value)}
                    />
                    <div className="d-flex justify-content-center gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-success d-flex align-items-center gap-1"
                        onClick={() => salvarEdicaoLegenda(midia.id)}
                      >
                        <Check size={14} /> Salvar
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => definirMidiaEmEdicaoId(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="legenda-midia-card">{midia.legenda}</div>
                )}

                {/* Botões de Ação Rápida: Editar Legenda e Excluir Mídia */}
                <div className="acoes-midia-card">
                  <button
                    type="button"
                    className="btn btn-sm botao-acao-editar d-flex align-items-center gap-1"
                    onClick={() => iniciarEdicao(midia)}
                    title="Editar Legenda"
                  >
                    <Edit2 size={14} />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm botao-acao-excluir d-flex align-items-center gap-1"
                    onClick={() => excluirMidia(midia.id)}
                    title="Excluir Mídia"
                  >
                    <Trash2 size={14} />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mensagem exibida caso a lista de mídias esteja vazia */}
        {listaMidias.length === 0 && (
          <div className="text-center py-5 text-muted">
            Nenhuma mídia cadastrada nesta Identidade Visual. Use o formulário acima para carregar imagens, vídeos ou áudios!
          </div>
        )}
      </div>

      {/* COMPONENTE DO MODAL LIGHTBOX EXIBIDO QUANDO UM ITEM É SELECIONADO */}
      {indiceLightbox !== null && (
        <ModalVisualizadorMidia
          listaMidias={listaMidias}
          indiceInicial={indiceLightbox}
          aoFechar={() => definirIndiceLightbox(null)}
        />
      )}
    </div>
  );
}