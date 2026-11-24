import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/baloo-2/latin-800.css';
import '@fontsource/lexend/latin-400.css';
import '@fontsource/lexend/latin-600.css';
import './styles.css';
import { createApp } from './ui/app';
import { setupPwa } from './ui/pwa';

const root = document.getElementById('app');
if (root) {
  createApp(root);
  setupPwa(root);
}
