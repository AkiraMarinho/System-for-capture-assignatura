import React, { useState, useRef } from 'react';

function ComponenteAssinatura() {
  const [status, setStatus] = useState("Aguardando clique no botão...");
  const [statusColor, setStatusColor] = useState("#333");
  const [dispositivo, setDispositivo] = useState(null);
  
  const canvasRef = useRef(null);
  const desenhandoRef = useRef(false);

  // Função para mapear a resolução gigante da Wacom para os pixels do Canvas
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
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000000';

      // Resolução interna padrão da STU-520A (Eixos máximos do hardware)
      const MAX_W_MESA = 10400;
      const MAX_H_MESA = 7800;

      // Ouvinte dos dados brutos da USB da Wacom
      mesa.oninputreport = (evento) => {
        const { data } = evento;
        const view = new DataView(data.buffer);
        
        // Decodificação dos bytes da caneta conforme protocolo padrão HID Wacom STU
        // Nota: A posição exata dos bytes varia por modelo, este é o mapeamento padrão de coordenadas:
        const rdy = view.getUint8(0);
        const xBruto = view.getUint16(1, true); 
        const yBruto = view.getUint16(3, true);
        const pressao = view.getUint16(5, true);

        // Se a caneta estiver tocando a mesa (pressão maior que zero)
        if (pressao > 100) {
          const x = mapearCoordenada(xBruto, MAX_W_MESA, canvas.width);
          const y = mapearCoordenada(yBruto, MAX_H_MESA, canvas.height);

          if (!desenhandoRef.current) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            desenhandoRef.current = true;
          } else {
            ctx.lineTo(x, y);
            ctx.stroke();
          }
          setStatus("Assinando...");
        } else {
          // Caneta levantou da mesa
          desenhandoRef.current = false;
        }
      };

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
    // Aqui entra o seu código antigo que envia para o backend
  };

  const limparCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStatus("Painel limpo. Pronto para nova assinatura.");
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Painel de Assinatura Digital (React + WebHID)</h2>
      
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

      {/* O quadrado onde a assinatura vai aparecer desenhada no navegador */}
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={300} 
        style={{ border: '2px dashed #000', backgroundColor: '#f9f9f9', display: 'block', marginBottom: '15px' }}
      />

      <div style={{ fontWeight: 'bold', fontSize: '16px', color: statusColor }}>
        {status}
      </div>
    </div>
  );
}

export default ComponenteAssinatura;