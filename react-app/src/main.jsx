import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';

// No StrictMode: the game engine mounts imperatively and must not double-init.
createRoot(document.getElementById('root')).render(<App />);
