const fs = require('fs');
const file = 'c:\\React Course - (Udmey)\\Speech-Therapy-Games\\frontend\\src\\pages\\admin\\GameForm.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = '  const changeCurrentActivityType = (newType) => {';

const replacement = `  const handleCropMouseDown = (e) => {
    if (currentActivity?.cropMode !== 'free') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setCropStartPos({ x, y });
    setIsDrawingCrop(true);
    updateCurrentActivity((activity) => ({
      ...activity,
      cropRect: { x, y, width: 0, height: 0 },
    }));
  };

  const handleCropMouseMove = (e) => {
    if (!isDrawingCrop || currentActivity?.cropMode !== 'free') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const currentY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const x = Math.min(cropStartPos.x, currentX);
    const y = Math.min(cropStartPos.y, currentY);
    const width = Math.abs(currentX - cropStartPos.x);
    const height = Math.abs(currentY - cropStartPos.y);

    updateCurrentActivity((activity) => ({
      ...activity,
      cropRect: { x, y, width, height },
    }));
  };

  const handleCropMouseUp = () => {
    setIsDrawingCrop(false);
  };

  const changeCurrentActivityType = (newType) => {`;

if(content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log('Success');
} else {
  console.log('Target not found');
}
