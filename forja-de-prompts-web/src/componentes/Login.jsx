// Importa o React e o gancho useState para gerenciar os estados (variáveis reativas) do componente
import React, { useState } from 'react';

// Importa ícones da biblioteca lucide-react para ilustrar os campos da interface
import { Flame, Lock, User } from 'lucide-react';

// Importa o arquivo de imagem do logotipo colorido da aplicação a partir da pasta de assets
import logoColorido from '../assets/logo11color.png';

// Importa o arquivo de vídeo de fundo (MP4) que será reproduzido em loop no layout
import videoFundo from '../assets/fundo-forja.mp4';

// Importa o arquivo de estilos CSS específicos para estilizar a tela de login
import '../estilos/Login.css';

// Importa a variável centralizada de configuração de rede (URL/IP do backend)
// Desta forma, alterando o endereço neste arquivo de configuração, a mudança reflete no projeto inteiro.
import { CONFIG_REDE } from "./config";

/**
 * Componente funcional Login
 * Recebe via propriedade (props) a função 'aoRealizarLogin' para notificar o componente 
 * principal (App) quando a autenticação for bem-sucedida.
 */
export default function Login({ aoRealizarLogin }) {
  
  // Declaração de estados locais para armazenar o valor digitado no campo de login (usuário ou e-mail)
  const [loginUsuario, definirLoginUsuario] = useState('');

  // Declaração de estado local para armazenar a senha digitada pelo usuário
  const [senha, definirSenha] = useState('');

  // Declaração de estado para controlar se a aplicação está aguardando a resposta do servidor (carregando)
  const [carregando, definirCarregando] = useState(false);

  // Declaração de estado para armazenar mensagens de erro caso o login falhe
  const [erro, definirErro] = useState('');

  /**
   * Função assíncrona responsável por gerenciar o envio do formulário de autenticação.
   * Disparada quando o usuário clica no botão de entrar ou aperta Enter.
   */
  async function aoEnviarFormularioLogin(evento) {
    // Previne o comportamento padrão do formulário de recarregar a página ao ser submetido
    evento.preventDefault();

    // Ativa o estado de carregamento (desabilita o botão e mostra feedback visual)
    definirCarregando(true);

    // Limpa eventuais mensagens de erro anteriores antes de tentar uma nova requisição
    definirErro('');

    // Imprime um log no console do navegador para fins de depuração (debug do frontend)
    console.log('[FRONTEND DEBUG] Tentando realizar login com:', { login: loginUsuario, senhaDigitada: '******' });

    try {
      // Monta a URL completa do endpoint de login utilizando a variável centralizada de configuração
      const urlEndpoint = `${CONFIG_REDE.URL_BACKEND}/login`;

      console.log(`[FRONTEND DEBUG] Enviando requisição POST para ${urlEndpoint}`);

      // Realiza uma requisição HTTP assíncrona (POST) para o servidor backend
      const resposta = await fetch(urlEndpoint, {
        method: 'POST', // Define o método HTTP como POST para envio seguro de credenciais
        headers: { 'Content-Type': 'application/json' }, // Informa que o corpo da requisição está no formato JSON
        body: JSON.stringify({ login: loginUsuario, password: senha }) // Converte os dados do usuário em string JSON
      });

      console.log('[FRONTEND DEBUG] Status HTTP da resposta:', resposta.status);

      // Converte a resposta recebida do servidor de texto/JSON para um objeto JavaScript utilizável
      const dados = await resposta.json();

      console.log('[FRONTEND DEBUG] Dados retornados do backend:', dados);

      // Verifica se a resposta HTTP não foi bem-sucedida (ex: status 401, 404, 500)
      if (!resposta.ok) {
        // Lança um erro customizado utilizando a mensagem enviada pelo backend ou uma mensagem padrão
        throw new Error(dados.mensagem || 'Falha ao autenticar.');
      }

      console.log('[FRONTEND DEBUG ✅] Login bem-sucedido! Passando usuário para o App:', dados.usuario);

      // Executa a função recebida via props para atualizar o estado global do aplicativo com os dados do usuário logado
      aoRealizarLogin(dados.usuario);

    } catch (err) {
      // Captura qualquer erro ocorrido durante a requisição (falha de rede, servidor fora do ar, credenciais erradas)
      console.error('[FRONTEND DEBUG ❌] Erro capturado no catch do login:', err);

      // Atualiza o estado de erro para exibir a mensagem na interface para o usuário
      definirErro(err.message || 'Erro de conexão com o servidor.');
    } finally {
      // Bloco executado independentemente de sucesso ou erro: desativa o estado de carregamento
      definirCarregando(false);
    }
  }

  // Retorna a estrutura JSX que renderiza a interface visual do componente na tela
  return (
    <div className="login-container">
      
      {/* 
        Elemento de vídeo animado de fundo (Background Video)
        - autoPlay: Inicia a reprodução automaticamente assim que carregado.
        - loop: Mantém o vídeo repetindo infinitamente.
        - muted: Obrigatório para permitir reprodução automática nos navegadores modernos (evita bloqueio de áudio).
        - playsInline: Garante que o vídeo toque inline em dispositivos móveis sem forçar tela cheia.
      */}
      <video autoPlay loop muted playsInline className="video-background">
        <source src={videoFundo} type="video/mp4" />
        Seu navegador não suporta vídeos em background.
      </video>

      {/* Camada de sobreposição (overlay) escura sobre o vídeo para destacar os elementos do card de login */}
      <div className="overlay-video"></div>

      {/* Card centralizado de acesso com alinhamento de texto centralizado */}
      <div className="login-card text-center">
        
        {/* Logotipo colorido da aplicação */}
        <img src={logoColorido} alt="Forja de Prompts" className="login-logo mx-auto" />
        
        {/* Título de cabeçalho do card */}
        <h4 className="fw-bold mb-1" style={{ color: '#f97316' }}>Acesso à Forja</h4>
        
        {/* Subtítulo descritivo */}
        <p className="small text-muted mb-4">Insira suas credenciais para acessar o núcleo de IA</p>

        {/* Renderização condicional: Exibe o alerta de erro na tela apenas se a variável 'erro' contiver conteúdo */}
        {erro && <div className="alert alert-danger py-2 small">{erro}</div>}

        {/* Formulário principal acoplado à função de envio ao submeter */}
        <form onSubmit={aoEnviarFormularioLogin} className="text-start">
          
          {/* Grupo de input para o campo de Usuário ou E-mail */}
          <div className="mb-3">
            <label className="form-label small text-secondary">Usuário ou E-mail</label>
            <div className="input-group">
              {/* Ícone estético incorporado ao lado esquerdo do input */}
              <span className="input-group-text bg-dark border-secondary text-secondary">
                <User size={16} />
              </span>
              {/* Campo de texto controlado pelo estado 'loginUsuario' */}
              <input 
                type="text" 
                className="form-control login-input" 
                placeholder="Ex: admin"
                value={loginUsuario}
                onChange={(e) => definirLoginUsuario(e.target.value)} // Atualiza o estado a cada caractere digitado
                required // Torna o campo de preenchimento obrigatório
              />
            </div>
          </div>

          {/* Grupo de input para o campo de Senha */}
          <div className="mb-4">
            <label className="form-label small text-secondary">Senha de Acesso</label>
            <div className="input-group">
              {/* Ícone estético incorporado ao lado esquerdo do input de senha */}
              <span className="input-group-text bg-dark border-secondary text-secondary">
                <Lock size={16} />
              </span>
              {/* Campo de senha mascarada controlado pelo estado 'senha' */}
              <input 
                type="password" 
                className="form-control login-input" 
                placeholder="••••••••"
                value={senha}
                onChange={(e) => definirSenha(e.target.value)} // Atualiza o estado da senha a cada alteração
                required // Torna o campo obrigatório
              />
            </div>
          </div>

          {/* Botão de envio do formulário (desabilitado dinamicamente enquanto 'carregando' for true) */}
          <button 
            type="submit" 
            className="btn botao-forja-laranja w-100 d-flex align-items-center justify-content-center gap-2" 
            disabled={carregando}
          >
            <Flame size={18} />
            {/* Altera o texto do botão com base no estado de carregamento */}
            {carregando ? 'Acessando Forja...' : 'Entrar no Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}