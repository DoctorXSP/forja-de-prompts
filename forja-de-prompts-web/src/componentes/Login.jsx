// Importa o React e os ganchos useState, useEffect e useRef para gerenciar os estados, ciclo de vida e referências
import React, { useState, useEffect, useRef } from 'react';

// Importa ícones da biblioteca lucide-react para ilustrar os campos da interface
import { Flame, Lock, User } from 'lucide-react';

// Importa o arquivo de imagem do logotipo colorido da aplicação a partir da pasta de assets
import logoColorido from '../assets/logo11color.png';

// Importa o arquivo de vídeo de fundo (MP4) que será reproduzido em loop no layout
import videoFundo from '../assets/fundo-forja.mp4';

// Importa o arquivo de estilos CSS específicos para estilizar a tela de login
import '../estilos/Login.css';

// Importa a variável centralizada de configuração de rede (URL/IP do backend)
import { CONFIG_REDE } from "./config";

/**
 * Componente funcional Login
 */
export default function Login({ aoRealizarLogin }) {
  
  // Declaração de estados locais
  const [loginUsuario, definirLoginUsuario] = useState('');
  const [senha, definirSenha] = useState('');
  const [carregando, definirCarregando] = useState(false);
  const [erro, definirErro] = useState('');

  // ==========================================
  // SOLUÇÃO PARA O PROBLEMA DO AUTOPLAY DO VÍDEO
  // Cria uma referência para acessar o elemento de vídeo diretamente no DOM
  // ==========================================
  const videoRef = useRef(null);

  // Efeito executado apenas uma vez quando o componente é montado na tela
  useEffect(() => {
    // Verifica se a referência ao vídeo existe
    if (videoRef.current) {
      // Tenta forçar a reprodução do vídeo programaticamente
      // O método play() retorna uma Promise. Capturamos o catch caso o navegador bloqueie.
      videoRef.current.play().catch(erro => {
        console.warn("Autoplay do vídeo foi bloqueado pelo navegador:", erro);
      });
    }
  }, []); // O array vazio [] garante que isso rode apenas na primeira renderização

  /**
   * Função assíncrona responsável por gerenciar o envio do formulário de autenticação.
   */
  async function aoEnviarFormularioLogin(evento) {
    evento.preventDefault();
    definirCarregando(true);
    definirErro('');

    console.log('[FRONTEND DEBUG] Tentando realizar login com:', { login: loginUsuario, senhaDigitada: '******' });

    try {
      const urlEndpoint = `${CONFIG_REDE.URL_BACKEND}/login`;
      console.log(`[FRONTEND DEBUG] Enviando requisição POST para ${urlEndpoint}`);

      const resposta = await fetch(urlEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginUsuario, password: senha })
      });

      console.log('[FRONTEND DEBUG] Status HTTP da resposta:', resposta.status);

      const dados = await resposta.json();
      console.log('[FRONTEND DEBUG] Dados retornados do backend:', dados);

      if (!resposta.ok) {
        throw new Error(dados.mensagem || 'Falha ao autenticar.');
      }

      console.log('[FRONTEND DEBUG ✅] Login bem-sucedido! Passando usuário para o App:', dados.usuario);
      aoRealizarLogin(dados.usuario);

    } catch (err) {
      console.error('[FRONTEND DEBUG ❌] Erro capturado no catch do login:', err);
      definirErro(err.message || 'Erro de conexão com o servidor.');
    } finally {
      definirCarregando(false);
    }
  }

  return (
    <div className="login-container">
      
      {/* 
        Elemento de vídeo animado de fundo (Background Video)
        - ref={videoRef}: Anexa a referência criada no topo do componente.
        - autoPlay, loop, muted, playsInline mantidos para compatibilidade máxima.
      */}
      <video 
        ref={videoRef} 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="video-background"
      >
        <source src={videoFundo} type="video/mp4" />
        Seu navegador não suporta vídeos em background.
      </video>

      {/* Camada de sobreposição (overlay) escura sobre o vídeo */}
      <div className="overlay-video"></div>

      {/* Card centralizado de acesso */}
      <div className="login-card text-center">
        <img src={logoColorido} alt="Forja de Prompts" className="login-logo mx-auto" />
        <h4 className="fw-bold mb-1" style={{ color: '#f97316' }}>Acesso à Forja</h4>
        <p className="small text-muted mb-4">Insira suas credenciais para acessar o núcleo de IA</p>

        {erro && <div className="alert alert-danger py-2 small">{erro}</div>}

        <form onSubmit={aoEnviarFormularioLogin} className="text-start">
          <div className="mb-3">
            <label className="form-label small text-secondary">Usuário ou E-mail</label>
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-secondary">
                <User size={16} />
              </span>
              <input 
                type="text" 
                className="form-control login-input" 
                placeholder="Ex: admin"
                value={loginUsuario}
                onChange={(e) => definirLoginUsuario(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small text-secondary">Senha de Acesso</label>
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-secondary">
                <Lock size={16} />
              </span>
              <input 
                type="password" 
                className="form-control login-input" 
                placeholder="••••••••"
                value={senha}
                onChange={(e) => definirSenha(e.target.value)}
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn botao-forja-laranja w-100 d-flex align-items-center justify-content-center gap-2" 
            disabled={carregando}
          >
            <Flame size={18} />
            {carregando ? 'Acessando Forja...' : 'Entrar no Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}