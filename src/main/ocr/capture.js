const { screen, desktopCapturer } = require('electron');
const path = require('node:path');
const fs = require('fs');
const { OCR_CONFIG } = require('../../shared/constants');

// Capture screenshot of selected area
async function captureSelectedArea(coordinates, mainWindow) {
  try {
    console.log('Capturing screenshot of selected area...', coordinates);

    // Get the display where the selection was made
    const mainWindowBounds = mainWindow.getBounds();
    const currentDisplay = screen.getDisplayMatching(mainWindowBounds);

    // Calculate scale factor for high DPI displays
    const scaleFactor = currentDisplay.scaleFactor || 1;

    // Get all available sources with appropriate size
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: currentDisplay.bounds.width * scaleFactor,
        height: currentDisplay.bounds.height * scaleFactor
      }
    });

    console.log('Found sources:', sources.length);

    if (!sources || sources.length === 0) {
      throw new Error('No screen source found');
    }

    // Use the first source (main screen capture)
    const source = sources[0];
    const screenshot = source.thumbnail;

    // console.log('Screenshot size:', screenshot.getSize());

    // Crop to selected area
    // Adjust coordinates for scale factor
    const cropArea = {
      x: Math.round(coordinates.x * scaleFactor),
      y: Math.round(coordinates.y * scaleFactor),
      width: Math.round(coordinates.width * scaleFactor),
      height: Math.round(coordinates.height * scaleFactor)
    };

    console.log('Crop area:', cropArea);
    
    const finalImage = screenshot.crop(cropArea);
    const imageBuffer = finalImage.toPNG();

    console.log('Image buffer size:', imageBuffer.length, 'bytes');

    // DEBUG: Save cropped image to file for inspection
    // const debugPath = path.join(__dirname, '../../debug-screenshot.png');
    // fs.writeFileSync(debugPath, imageBuffer);
    // console.log('Debug screenshot saved to:', debugPath);

    return imageBuffer;
  } catch (error) {
    console.error('Screenshot capture error:', error);
    throw error;
  }
}

module.exports = {
  captureSelectedArea
};
