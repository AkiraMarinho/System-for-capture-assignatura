import React from 'react';
import ComponenteAssinatura from './components/ComponenteAssinatura';
import './App.css';

function Header() {
  return (
    <header className="App-header">
    </header>
  );
}

function Title() {
  return (
    <>
      <h1>Captura de Assinatura</h1>
      <p>Conecte sua mesa Wacom STU-520A via USB para assinar</p>
    </>
  );
}
  
function Footer() {
  return (
    <footer className="App-footer">
    </footer>
  );
}

function App() {
  return (
    <>
      <Header />
      <Title />
      
      <main style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
        {/* O ComponenteAssinatura já contém o Canvas interno e todos os botões de ação vinculados ao USB */}
        <ComponenteAssinatura />
      </main>
      
      <Footer />
    </>
  );
}

export default App;