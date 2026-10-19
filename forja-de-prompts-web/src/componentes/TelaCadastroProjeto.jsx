// Importação da biblioteca principal do React e do hook useState para gerenciar o estado local
import React, { useState } from 'react';
// Importação de ícones vetorizados (SVG) da biblioteca lucide-react para compor a interface
import { ArrowLeft, Save, Upload, Image as ImageIcon, PlusCircle } from 'lucide-react';

// Importação da folha de estilos específica para a identidade visual do formulário
import '../estilos/TelaEdicaoProjeto.css'; 

// =====================================================================================
// IMPORTAÇÃO DA VARIÁVEL GLOBAL DE CONFIGURAÇÃO DE REDE
// =====================================================================================
// Centraliza a URL da API. Se o backend mudar de 'localhost' para um domínio real 
// (ex: https://api.forja.com), basta alterar no config.js e esta tela herdará a mudança.
import { CONFIG_REDE } from './config';

/**
 * COMPONENTE: TelaCadastroProjeto
 * -------------------------------------------------------------------------------------
 * Responsável por renderizar o formulário de criação de um novo projeto.
 * Isolado em seu próprio arquivo para manter o princípio de Responsabilidade Única (SOLID),
 * evitando misturar lógicas de POST (criar) e PUT (atualizar) no mesmo local.
 * 
 * Props recebidas:
 * @param {Object} usuarioLogado - Dados do usuário atual (necessário para vincular o projeto ao dono).
 * @param {Function} aoSalvar - Callback executado com sucesso para atualizar a lista na tela principal.
 * @param {Function} aoVoltar - Callback executado ao clicar em "Cancelar" ou "Voltar".
 */
export default function TelaCadastroProjeto({ usuarioLogado, aoSalvar, aoVoltar }) {
  
  // =====================================================================================
  // ESTADOS DO FORMULÁRIO (CONTROLLED COMPONENTS)
  // =====================================================================================
  // No React, formulários são "controlados" pelo estado. Cada input tem seu valor 
  // amarrado a uma variável de estado e é atualizado pela sua respectiva função 'definir...'.
  const [titulo, definirTitulo] = useState('');
  const [tipoProjeto, definirTipoProjeto] = useState('DESENVOLVIMENTO');
  const [objetivo, definirObjetivo] = useState('');
  const [publicoAlvo, definirPublicoAlvo] = useState('');
  const [persona, definirPersona] = useState('');
  const [resultadoEsperado, definirResultadoEsperado] = useState('');
  const [urlRepositorio, definirUrlRepositorio] = useState('');
  const [caminhoPastaLocal, definirCaminhoPastaLocal] = useState('');
  
  // Estes campos possuem valores padrão (default) alinhados com o esquema do banco de dados
  const [diasParaArquivar, definirDiasParaArquivar] = useState(30); 
  const [projetoAtivo, definirProjetoAtivo] = useState(1); 
  
  // =====================================================================================
  // ESTADOS PARA MANIPULAÇÃO DE ARQUIVO (UPLOAD DE IMAGEM)
  // =====================================================================================
  // Armazena o objeto File binário nativo do navegador selecionado pelo usuário
  const [arquivoLogo, definirArquivoLogo] = useState(null); 
  // Armazena uma URL local em memória para exibir a imagem na tela antes do envio ao servidor
  const [previaLogo, definirPreviaLogo] = useState(null);   
  
  // Estado de controle de interface: evita duplos cliques no botão de salvar
  const [carregando, definirCarregando] = useState(false);  

  /**
   * FUNÇÃO: lidarComSelecaoArquivo
   * -------------------------------------------------------------------------------------
   * Disparada quando o usuário escolhe uma imagem no input do tipo 'file'.
   * Intercepta o arquivo, salva no estado e gera uma URL virtual para o preview visual.
   */
  function lidarComSelecaoArquivo(e) {
    // e.target.files é um array contendo os arquivos selecionados. Pegamos o primeiro [0].
    const arquivo = e.target.files[0];
    if (arquivo) {
      definirArquivoLogo(arquivo); // Guarda o arquivo bruto para o envio via FormData
      // URL.createObjectURL cria um link temporário na memória do navegador para a imagem
      definirPreviaLogo(URL.createObjectURL(arquivo)); 
    }
  }

  /**
   * FUNÇÃO: handleSubmit
   * -------------------------------------------------------------------------------------
   * Disparada ao submeter o formulário (onSubmit).
   * Empacota todos os dados de texto e o arquivo de imagem em um FormData para envio.
   */
  async function handleSubmit(e) {
    // e.preventDefault() impede o comportamento padrão do HTML de recarregar a página ao enviar form
    e.preventDefault();
    
    // Ativa o estado de carregamento para desabilitar o botão e dar feedback visual
    definirCarregando(true);

    // FormData é a API nativa necessária para enviar formulários mistos (texto + arquivos binários).
    // O cabeçalho 'Content-Type: multipart/form-data' será configurado automaticamente pelo fetch.
    const formData = new FormData();
    formData.append('usuarioId', usuarioLogado?.id);
    formData.append('titulo', titulo);
    formData.append('tipoProjeto', tipoProjeto);
    formData.append('objetivo', objetivo);
    formData.append('publicoAlvo', publicoAlvo);
    formData.append('persona', persona);
    formData.append('resultadoEsperado', resultadoEsperado);
    formData.append('urlRepositorio', urlRepositorio);
    formData.append('caminhoPastaLocal', caminhoPastaLocal);
    formData.append('diasParaArquivar', diasParaArquivar);
    formData.append('projetoAtivo', projetoAtivo);

    // Se o usuário selecionou uma imagem, anexa o arquivo binário ao payload
    if (arquivoLogo) {
      formData.append('logo', arquivoLogo);
    }

    try {
      // Faz a requisição POST para o backend utilizando a URL Global configurada no config.js
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/projetos`, {
        method: 'POST',
        body: formData 
      });

      // Se a resposta HTTP for da família 200 (Sucesso)
      if (res.ok) {
        alert('Projeto criado com sucesso!');
        // Chama a função passada pelo componente pai (TelaEntrada) para fechar esta tela e recarregar a lista
        aoSalvar(); 
      } else {
        alert('Erro ao criar o projeto no banco de dados.');
      }
    } catch (err) {
      // Captura erros de rede (ex: servidor fora do ar, erro de CORS)
      console.error('Erro na requisição POST:', err);
      alert('Erro de conexão ao salvar.');
    } finally {
      // O bloco finally executa independentemente de sucesso ou falha, liberando o botão de salvar
      definirCarregando(false);
    }
  }

  // =====================================================================================
  // RENDERIZAÇÃO DO COMPONENTE (JSX)
  // =====================================================================================
  return (
    <div className="tela-edicao-container">
      <div className="container py-4" style={{ maxWidth: '800px' }}>
        
        {/* BARRA SUPERIOR DE NAVEGAÇÃO */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button className="btn btn-sm btn-outline-secondary text-light d-flex align-items-center gap-1" onClick={aoVoltar}>
            <ArrowLeft size={16} /> Voltar aos Projetos
          </button>
          <h4 className="fw-bold text-success mb-0 d-flex align-items-center gap-2">
            <PlusCircle size={22} /> Criar Novo Projeto
          </h4>
        </div>

        {/* CONTAINER DO FORMULÁRIO */}
        {/* O evento onSubmit está atrelado à tag <form>, o que permite enviar apertando "Enter" */}
        <div className="card-edicao-forja p-4">
          <form onSubmit={handleSubmit}>
            
            {/* SEÇÃO DE UPLOAD DE LOGOTIPO */}
            <div className="mb-5 text-center">
              <label className="form-label d-block text-secondary fw-bold mb-2">Logotipo do Projeto</label>
              
              <div className="container-previa-logo mx-auto mb-3">
                {/* Renderização Condicional: Se houver URL de preview, mostra a imagem. Senão, mostra o ícone SVG placeholder */}
                {previaLogo ? (
                  <img src={previaLogo} alt="Prévia do Logo" className="imagem-previa-logo" />
                ) : (
                  <ImageIcon size={32} className="text-secondary" />
                )}
              </div>
              
              {/* O input real (type="file") é invisível (d-none). 
                  A label age como o botão estilizado que, ao ser clicado, aciona o input oculto. */}
              <label className="btn btn-sm btn-warning cursor-pointer">
                <Upload size={14} className="me-1" /> <span style={{ margin: "0 10px" }}>Carregar Logo</span>
                <input type="file" accept="image/*" className="d-none mx-3" onChange={lidarComSelecaoArquivo} />
              </label> 
            </div>

            {/* GRID DE CAMPOS DE TEXTO E SELEÇÃO */}
            <div className="row">
              
              {/* CAMPO: TÍTULO DO PROJETO (Obrigatório) */}
              <div className="col-12">
                <div className="grupo-campo-forja">
                  <label className="form-label">Título do Projeto *</label>
                  {/* value e onChange formam o "two-way data binding" no React */}
                  <input 
                    type="text" 
                    className="form-control formulario-input-dark" 
                    value={titulo}
                    onChange={(e) => definirTitulo(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* CAMPO: TIPO DE PROJETO (Select/Dropdown) */}
              <div className="col-12">
                <div className="grupo-campo-forja">
                  <label className="form-label">Tipo de Projeto</label>
                  <select 
                    className="form-select formulario-input-dark"
                    value={tipoProjeto}
                    onChange={(e) => definirTipoProjeto(e.target.value)}
                  >
                    <option value="DESENVOLVIMENTO">Desenvolvimento</option>
                    <option value="CAMPANHA">Campanha Publicitária</option>
                    <option value="COORDENACAO">Coordenação de Curso</option>
                    <option value="SALA_DE_AULA">Sala de Aula</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>
              </div>

              {/* CAMPO: OBJETIVO GERAL (Textarea longo) */}
              <div className="col-12">
                <div className="grupo-campo-forja">
                  <label className="form-label">Objetivo Geral</label>
                  <textarea 
                    className="form-control formulario-input-dark" 
                    rows="3"
                    value={objetivo}
                    onChange={(e) => definirObjetivo(e.target.value)}
                  />
                </div>
              </div>

              {/* METADADOS PARA IA: Público-Alvo e Persona alimentam os contextos dos Prompts futuramente */}
              <div className="col-12 col-md-6">
                <div className="grupo-campo-forja">
                  <label className="form-label">Público-Alvo</label>
                  <input 
                    type="text" 
                    className="form-control formulario-input-dark" 
                    value={publicoAlvo}
                    onChange={(e) => definirPublicoAlvo(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="grupo-campo-forja">
                  <label className="form-label">Persona da IA</label>
                  <input 
                    type="text" 
                    className="form-control formulario-input-dark" 
                    value={persona}
                    onChange={(e) => definirPersona(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12">
                <div className="grupo-campo-forja">
                  <label className="form-label">Resultado Esperado</label>
                  <textarea 
                    className="form-control formulario-input-dark" 
                    rows="2"
                    value={resultadoEsperado}
                    onChange={(e) => definirResultadoEsperado(e.target.value)}
                  />
                </div>
              </div>

              {/* INFORMAÇÕES TÉCNICAS E ARQUIVAMENTO */}
              <div className="col-12 col-md-6">
                <div className="grupo-campo-forja">
                  <label className="form-label">URL do Repositório (GitHub)</label>
                  <input 
                    type="text" 
                    className="form-control formulario-input-dark" 
                    value={urlRepositorio}
                    onChange={(e) => definirUrlRepositorio(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="grupo-campo-forja">
                  <label className="form-label">Caminho da Pasta Local</label>
                  <input 
                    type="text" 
                    className="form-control formulario-input-dark" 
                    value={caminhoPastaLocal}
                    onChange={(e) => definirCaminhoPastaLocal(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="grupo-campo-forja">
                  <label className="form-label">Dias para Arquivar</label>
                  <input 
                    type="number" 
                    className="form-control formulario-input-dark" 
                    value={diasParaArquivar}
                    onChange={(e) => definirDiasParaArquivar(e.target.value)}
                  />
                </div>
              </div>

              {/* STATUS BOOLEANO (Armazenado como 1/0 no banco de dados) */}
              <div className="col-12 col-md-6">
                <div className="grupo-campo-forja">
                  <label className="form-label">Projeto Ativo</label>
                  <select 
                    className="form-select formulario-input-dark"
                    value={projetoAtivo}
                    onChange={(e) => definirProjetoAtivo(Number(e.target.value))}
                  >
                    <option value={1}>Sim</option>
                    <option value={0}>Não</option>
                  </select>
                </div>
              </div>
            </div>

            {/* RODAPÉ E AÇÕES DO FORMULÁRIO */}
            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-secondary">
              <button type="button" className="btn botao-forja-vermelho" onClick={aoVoltar}>Cancelar</button>
              
              {/* O botão fica desabilitado (disabled) enquanto 'carregando' for true. 
                  Isso previne que o usuário clique várias vezes e envie cadastros duplicados ao backend. */}
              <button type="submit" className="btn botao-forja-laranja d-flex align-items-center gap-2" style={{marginLeft: '15px'}} disabled={carregando}>
                <Save size={16} /> {carregando ? 'Criando...' : 'Cadastrar Projeto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}