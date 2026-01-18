#!/usr/bin/env node

const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  
  return 'localhost';
}

const localIP = getLocalIP();
console.log('\n🌐 Development Server Access URLs:');
console.log(`   Frontend: http://localhost:3000`);
console.log(`   Frontend: http://${localIP}:3000`);
console.log(`   Backend:  http://localhost:3002/api/v1`);
console.log(`   Backend:  http://${localIP}:3002/api/v1`);
console.log(`   Health:   http://localhost:3002/health`);
console.log(`   Health:   http://${localIP}:3002/health\n`);