import React, { useState, useRef } from 'react';

export default function ComponenteAssinatura() {
  const [status, setStatus] = useState("Aguardando clique no botão...");
  const [statusColor, setStatusColor] = useState("#333");
  const [dispositivo, setDispositivo] = useState(null);
  
  const canvasRef = useRef(null);
  const desenhandoRef = useRef(false);
  
  // 1. NOVO: Referência para guardar o ponto anterior e permitir o traço suave
  const ultimoPontoRef = useRef(null);

  const mapearCoordenada = (valor, limiteMesa, limiteCanvas) => {
    return (valor / limiteMesa) * limiteCanvas;
  };

  const iniciarCaptura = async () => {
    if (!navigator.hid) {
      setStatus("Erro: Este navegador não suporta conexão USB direta. Use o Chrome ou Edge.");
      setStatusColor("red");
      return;
    }

    setStatusColor("#0070f3");
    setStatus("Selecione a mesa na janela flutuante...");

    try {
      const FILTRO_WACOM = { vendorId: 0x056a };
      const dispositivos = await navigator.hid.requestDevice({ filters: [FILTRO_WACOM] });
      
      if (!dispositivos || dispositivos.length === 0) {
        setStatus("Aviso: Nenhuma mesa foi selecionada.");
        setStatusColor("orange");
        return;
      }

      const mesa = dispositivos[0];
      await mesa.open();
      setDispositivo(mesa);
      
      setStatus(`Conectado com sucesso à: ${mesa.productName || "Mesa Wacom"}`);
      setStatusColor("green");

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Resolução interna padrão da STU-520A
      const MAX_W_MESA = 10400;
      const MAX_H_MESA = 7800;

      // =================================================================
      // SUBSTUIÇÃO AQUI: Todo este bloco mesa.oninputreport foi reescrito
      // =================================================================
      mesa.oninputreport = (evento) => {
        const { data } = evento;
        const view = new DataView(data.buffer);
        
        const xBruto = view.getUint16(1, true); 
        const yBruto = view.getUint16(3, true);
        const pressao = view.getUint16(5, true);

        // Configurações estéticas do traço (Ajustado para formato caneta/nanquim)
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 1;
        ctx.shadowColor = '#000000';
        ctx.strokeStyle = '#000000';

        // Engrossa o traço dinamicamente de acordo com a força na caneta
        ctx.lineWidth = pressao > 1000 ? 3.5 : 1.8;

        // Filtro de pressão: Só desenha se a caneta realmente encostar (evita "fantasmas")
        if (pressao > 150) { 
          const xAtual = mapearCoordenada(xBruto, MAX_W_MESA, canvas.width);
          const yAtual = mapearCoordenada(yBruto, MAX_H_MESA, canvas.height);

          if (!desenhandoRef.current || !ultimoPontoRef.current) {
            // Início do traço: guarda onde começou
            ctx.beginPath();
            ctx.moveTo(xAtual, yAtual);
            desenhandoRef.current = true;
            ultimoPontoRef.current = { x: xAtual, y: yAtual };
          } else {
            // MÁGICA DA SUAVIZAÇÃO: Cria curvas entre os pontos em vez de retas picotadas
            const antigo = ultimoPontoRef.current;
            const midX = (antigo.x + xAtual) / 2;
            const midY = (antigo.y + yAtual) / 2;

            ctx.quadraticCurveTo(antigo.x, antigo.y, midX, midY);
            ctx.stroke();
            
            ultimoPontoRef.current = { x: xAtual, y: yAtual };
          }
          setStatus("Assinando...");
        } else {
          // Caneta levantou da mesa: encerra o traço atual
          if (desenhandoRef.current) {
            ctx.closePath();
          }
          desenhandoRef.current = false;
          ultimoPontoRef.current = null;
        }
      };
      // =================================================================
      // FIM DA SUBSTITUIÇÃO
      // =================================================================

    } catch (erro) {
      console.error(erro);
      setStatus(`Erro ao interagir com o hardware: ${erro.message}`);
      setStatusColor("red");
    }
  };

  const salvarAssinatura = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    console.log("PNG da assinatura pronto:", dataUrl);
    alert("Assinatura salva com sucesso em formato Base64/PNG!");
  };

  const limparCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ultimoPontoRef.current = null;
    desenhandoRef.current = false;
    setStatus("Painel limpo. Pronto para nova assinatura.");
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '15px' }}>
        <button onClick={iniciarCaptura} style={{ marginRight: '10px', padding: '10px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Ativar Mesa Wacom
        </button>
        <button onClick={limparCanvas} style={{ marginRight: '10px', padding: '10px', backgroundColor: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Limpar Tela
        </button>
        <button onClick={salvarAssinatura} style={{ padding: '10px', backgroundColor: 'green', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Confirmar e Salvar
        </button>
      </div>

      <canvas 
        ref={canvasRef} 
        width={800} // Ajustado para a proporção que você usava no CSS
        height={480} 
        style={{ border: '2px dashed #000', backgroundColor: '#f9f9f9', display: 'block', marginBottom: '15px' }}
      />

      <div style={{ fontWeight: 'bold', fontSize: '16px', color: statusColor }}>
        {status}
      </div>
    </div>
  );
}

export default ComponenteAssinatura;