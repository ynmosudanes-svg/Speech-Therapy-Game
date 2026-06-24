const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/assets/Animation/Bird.json');
let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// The Lottie file has an "assets" array which contains broken local paths (e.g. C:\Users\Admin\Music\Bay.ai)
// These cause the browser to throw "Not allowed to load local resource" errors.
if (data.assets && Array.isArray(data.assets)) {
  data.assets = data.assets.map(asset => {
    if (asset.p && asset.p.includes('C:\\')) {
      // Remove the path to prevent the browser from trying to load it
      asset.p = '';
    }
    return asset;
  });
}

fs.writeFileSync(filePath, JSON.stringify(data));
console.log('Fixed broken asset paths in Bird.json');
