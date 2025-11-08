// WPM (Words Per Minute) Configuration
const WPM_CONFIG = {
  DEFAULT: 300,
  MIN: 100,
  MAX: 600
};

// IPC Channel Names
const IPC_CHANNELS = {
  // Main window to main process
  START_SELECTION: 'start-selection',
  CLEAR_SELECTION: 'clear-selection',
  REFRESH_OCR: 'refresh-ocr',

  // Overlay window to main process
  SELECTION_COMPLETE: 'selection-complete',
  SELECTION_CANCELLED: 'selection-cancelled',

  // Main process to renderer
  SELECTION_STORED: 'selection-stored',
  SELECTION_CLEARED: 'selection-cleared',
  OCR_PROCESSING: 'ocr-processing',
  OCR_PROGRESS: 'ocr-progress',
  OCR_COMPLETE: 'ocr-complete',
  OCR_ERROR: 'ocr-error'
};

// Window Configuration
const WINDOW_CONFIG = {
  MAIN: {
    WIDTH: 416,
    HEIGHT: 680,
    RESIZABLE: false,
    MAXIMIZABLE: false,
    FULLSCREENABLE: false,
    ALWAYS_ON_TOP: true
  },
  OVERLAY: {
    FRAME: false,
    TRANSPARENT: true,
    ALWAYS_ON_TOP: true,
    SKIP_TASKBAR: true
  },
  BORDER: {
    FRAME: false,
    TRANSPARENT: true,
    ALWAYS_ON_TOP: true,
    SKIP_TASKBAR: true,
    RESIZABLE: false,
    FOCUSABLE: false
  }
};

// OCR Configuration
const OCR_CONFIG = {
  LANGUAGE: 'eng',
  WORKER_COUNT: 1,
  MAX_IMAGE_DIMENSION: 1920,
  MIN_SELECTION_SIZE: 10,
  PARAGRAPH_GAP_MULTIPLIER: 1.5
};

module.exports = {
  WPM_CONFIG,
  IPC_CHANNELS,
  WINDOW_CONFIG,
  OCR_CONFIG
};
