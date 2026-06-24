const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/assets/Animation/Bird.json');
let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// The shadow is usually the last shape layer, or a layer named something like "Shadow" or "Ellipse".
// Let's loop through layers and find the ellipse at the bottom.
data.layers = data.layers.filter(layer => {
  // Let's check if the layer has an Ellipse and is at the bottom (y > 600)
  // Or just check if the layer's name is "Shape Layer 20" since we saw it in the snippet.
  if (layer.nm === 'Shape Layer 20') {
    return false; // remove the shadow
  }
  
  // Or maybe check if it contains an Ellipse that looks like a shadow
  if (layer.shapes) {
    const hasEllipse = layer.shapes.some(shape => shape.nm === 'Ellipse 1' || shape.ty === 'el');
    // shadow opacity is usually low, or it's positioned low.
    if (hasEllipse && layer.ks && layer.ks.p && layer.ks.p.k && layer.ks.p.k[1] > 600) {
       return false;
    }
  }
  return true;
});

fs.writeFileSync(filePath, JSON.stringify(data));
console.log('Removed shadow layer from Bird.json');
