import React, { useState } from 'react';
import Login from './componentes/Login';
import TelaEntrada from './componentes/TelaEntrada';
import PainelPrincipal from './componentes/PainelPrincipal';

export default function App() {
  const [usuarioLogado, definirUsuarioLogado] = useState(null);
  const [projetoSelecionado, definirProjetoSelecionado] = useState(null);

  // 1. Se o utilizador não estiver logado, exibe a Tela de Login
  if (!usuarioLogado) {
    return <Login aoRealizarLogin={(usuario) => definirUsuarioLogado(usuario)} />;
  }

  // 2. Se estiver logado mas nenhum projeto foi selecionado, exibe a Tela de Entrada (Lobby de Projetos)
  if (!projetoSelecionado) {
    return (
      <TelaEntrada 
        usuarioLogado={usuarioLogado} 
        aoSelecionarProjeto={(projeto) => definirProjetoSelecionado(projeto)} 
        aoFazerLogout={() => {
          definirUsuarioLogado(null);
          definirProjetoSelecionado(null);
        }}
      />
    );
  }

  // 3. Se um projeto foi selecionado, entra no Workspace principal
  return (
    <PainelPrincipal 
      usuarioLogado={usuarioLogado} 
      projetoSelecionado={projetoSelecionado} 
      aoVoltarParaSelecao={() => definirProjetoSelecionado(null)} 
    />
  );
}