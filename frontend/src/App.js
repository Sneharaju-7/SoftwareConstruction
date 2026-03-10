import React from 'react';
import './App.css';

function App() {
  const handleFeelingLow = () => {
    alert("Sending a message to your emergency contact and playing soothing music...");
    // This is where we will later link Gemini and the WhatsApp Deeplink
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fdf6e3', minHeight: '100vh' }}>
      <header style={{ backgroundColor: '#2d3436', padding: '20px', color: 'white', borderRadius: '10px' }}>
        <h1>Good Morning! ☀️</h1>
        <p>Did you sleep well today?</p>
      </header>

      <main style={{ marginTop: '50px' }}>
        <button 
          onClick={handleFeelingLow}
          style={{ 
            fontSize: '24px', 
            padding: '30px 60px', 
            backgroundColor: '#ff7675', 
            color: 'white', 
            border: 'none', 
            borderRadius: '15px',
            boxShadow: '0px 10px #d63031',
            cursor: 'pointer'
          }}>
          I'm Feeling Low
        </button>

        <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <button style={menuButtonStyle}>💊 Meds</button>
          <button style={menuButtonStyle}>🎮 Games</button>
          <button style={menuButtonStyle}>📅 Doctor</button>
          <button style={menuButtonStyle}>🤖 Chat</button>
        </div>
      </main>
    </div>
  );
}

const menuButtonStyle = {
  padding: '20px',
  fontSize: '20px',
  backgroundColor: '#74b9ff',
  border: 'none',
  borderRadius: '10px',
  color: 'white'
};

export default App;