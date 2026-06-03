import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';

// NOTE: no React.StrictMode — the game engine mounts imperatively and must not
// be double-initialised (StrictMode runs effects twice in dev).
createRoot(document.getElementById('root')).render(<App />);
