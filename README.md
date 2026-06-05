# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

<!-- ............. -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Captura de Assinatura Wacom</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            background-color: #f4f4f9;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        button {
            background-color: #007bc4;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 16px;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
        }
        button:hover {
            background-color: #005994;
        }
        #signature-result {
            margin-top: 20px;
            text-align: center;
        }
        #sig-image {
            border: 1px dashed #ccc;
            max-width: 100%;
            display: none;
            margin-top: 10px;
        }
    </style>

    <script src="js/wgssStu.js"></script>
</head>
<body>

<div class="container">
    <h2>Captura de Assinatura STU Wacom</h2>
    <p>Clique no botão abaixo para ativar a mesa digitalizadora e realizar a assinatura.</p>
    
    <button id="btn-capture" onclick="startCapture()">Iniciar Captura de Assinatura</button>

    <div id="signature-result">
        <h3>Resultado da Assinatura:</h3>
        <p id="status-text">Aguardando início...</p>
        <img id="sig-image" alt="Assinatura Capturada">
    </div>
</div>

<script>
    // Configurações básicas baseadas no Wacom Signature SDK (Web STU)
    var stuDevice = null;
    var ec = null;

    async function startCapture() {
        document.getElementById('status-text').innerText = "Conectando à mesa Wacom...";
        
        try {
            // 1. Verifica se o SDK local está respondendo e busca dispositivos
            var usbDevices = await WacomGSS.STU.getUsbDevices();
            
            if (usbDevices.length === 0) {
                throw new Error("Nenhuma mesa STU da Wacom foi detectada. Verifique os cabos.");
            }

            // 2. Abre o primeiro dispositivo encontrado
            stuDevice = usbDevices[0];
            ec = new WacomGSS.STU.EncryptionHandler();
            var tablet = new WacomGSS.STU.Tablet();
            
            await tablet.usbConnect(stuDevice, ec);
            document.getElementById('status-text').innerText = "Mesa conectada! Por favor, assine na tela do dispositivo.";

            // 3. Define a tela de captura (Interface nativa do SDK que aparece na mesa)
            // O SDK possui métodos para desenhar os botões "OK", "Limpar" e "Cancelar" na própria tela da mesa.
            // Para produção, aqui entra a lógica de renderizar o protocolo de captura (Capability do tablet).

            // 4. Exemplo simulado de recebimento dos dados de imagem em Base64 após o "OK" na mesa:
            tablet.onSignatureReceived = function(base64Image) {
                const imgElement = document.getElementById('sig-image');
                imgElement.src = "data:image/png;base64," + base64Image;
                imgElement.style.display = "block";
                document.getElementById('status-text').innerText = "Assinatura capturada com sucesso!";
                tablet.disconnect();
            };

            tablet.onCancel = function() {
                document.getElementById('status-text').innerText = "Captura cancelada pelo usuário.";
                tablet.disconnect();
            };

        } catch (error) {
            console.error("Erro na captura:", error);
            document.getElementById('status-text').innerText = "Erro: " + error.message;
        }
    }
</script>

</body>
</html>
