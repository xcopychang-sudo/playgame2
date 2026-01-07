import React from 'react';
import { GameCanvas } from './components/GameCanvas';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <GameCanvas />
    </div>
  );
};

export default App;
