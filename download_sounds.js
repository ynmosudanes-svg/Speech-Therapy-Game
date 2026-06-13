const https = require('https');
const fs = require('fs');
const path = require('path');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    // Ensure directory exists
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Handle redirects
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  try {
    const successUrl = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=' + encodeURIComponent('أحسَنْتَ يَا بَطَل');
    const errorUrl = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=' + encodeURIComponent('لَا بَأْس، جَرِّب ثَانِيَة');
    
    await download(successUrl, 'frontend/public/sounds/success_voice.mp3');
    await download(errorUrl, 'frontend/public/sounds/error_voice.mp3');
    
    const clapUrl = 'https://actions.google.com/sounds/v1/crowds/light_applause.ogg';
    const dingUrl = 'https://actions.google.com/sounds/v1/cartoon/cartoon_cowbell_bell.ogg';
    const errorBoopUrl = 'https://actions.google.com/sounds/v1/cartoon/siren_whistle.ogg';

    await download(clapUrl, 'frontend/public/sounds/clap.ogg');
    await download(dingUrl, 'frontend/public/sounds/ding.ogg');
    await download(errorBoopUrl, 'frontend/public/sounds/error_boop.ogg');
    
    console.log('Sounds downloaded successfully!');
  } catch (err) {
    console.error('Error downloading sounds:', err);
  }
}

main();
