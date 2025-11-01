// Validates that mission-critical client files exist to avoid missing code regressions.
import fs from 'fs';

const mustExist = [
  'src/pages/ChatPage.jsx',
  'src/pages/LoginPage.jsx',
  'src/services/socketService.js',
  'src/services/messageService.js',
  'src/services/userService.js',
  'src/services/conversationService.js',
  'src/context/AuthContext.jsx',
  'src/context/ThemeContext.jsx',
  'src/index.css',
];

const missing = mustExist.filter((p)=>!fs.existsSync(new URL(`../${p}`, import.meta.url)));
if (missing.length) {
  console.error('Missing critical files:', missing);
  process.exit(1);
}

console.log('Codebase validation passed.');
