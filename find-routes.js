const fs = require('fs');
const path = require('path');

const clientDir = path.join(__dirname, 'apps/client/src');
const serverDir = path.join(__dirname, 'apps/server/src/modules');

const clientRoutes = new Set();
const serverRoutes = new Set();

// Find all api.* calls in client
function scanClient(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanClient(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.matchAll(/api\.(get|post|patch|put|delete)\(\s*(['`])(.*?)\2/g);
      for (const match of matches) {
        const method = match[1].toUpperCase();
        let route = match[3];
        // Strip query params
        if (route.includes('?')) {
          route = route.split('?')[0];
        }
        // Replace dynamic params
        route = route.replace(/\$\{[^}]+\}/g, ':param');
        if (!route.startsWith('/')) {
            route = '/' + route;
        }
        clientRoutes.add(`${method} ${route}`);
      }
    }
  }
}

// Prefixes from app.ts
const prefixes = {
  'authRoutes': '/auth',
  'courseRoutes': '/courses',
  'assignmentRoutes': '/courses',
  'userRoutes': '/users',
  'adminRoutes': '/admin',
  'communityRoutes': '/community',
  'mediaRoutes': '/media',
  'notificationRoutes': '/notifications',
  'quizRoutes': '/quizzes',
  'gamificationRoutes': '/gamification',
  'codingRoutes': '/coding',
  'aiRoutes': '/ai'
};

function getPrefixForFile(fileName) {
  for (const [key, val] of Object.entries(prefixes)) {
    if (fileName.replace('.ts', '').endsWith(key.replace('Routes', '.routes'))) return val;
  }
  return '';
}

// Find all router.* calls in server
function scanServer(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanServer(fullPath);
    } else if (fullPath.endsWith('.ts') && fullPath.includes('.routes.')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const prefix = getPrefixForFile(file);
      
      const matches = content.matchAll(/router\.(get|post|patch|put|delete)\(\s*(['`])(.*?)\2/g);
      for (const match of matches) {
        const method = match[1].toUpperCase();
        let route = match[3];
        if (route === '/') route = '';
        route = route.replace(/:[a-zA-Z0-9_]+/g, ':param');
        let fullRoute = `${prefix}${route}`;
        if (!fullRoute.startsWith('/')) fullRoute = '/' + fullRoute;
        serverRoutes.add(`${method} ${fullRoute}`);
      }
    }
  }
}

scanClient(clientDir);
scanServer(serverDir);

const missing = [];
for (let route of clientRoutes) {
  if (!serverRoutes.has(route)) {
    missing.push(route);
  }
}

console.log(missing.join('\n'));
