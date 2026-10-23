export interface MascotFaceCoords {
  leftEye: { x: number; y: number; w: number; h: number }
  rightEye: { x: number; y: number; w: number; h: number }
  mouth: { x: number; y: number; w: number; h: number }
}

export const MASCOT_FACE_COORDINATES: Record<string, MascotFaceCoords> = {
  'bell-alert.png': {
    leftEye: { x: 40.5, y: 57.6, w: 22.0, h: 22.0 },
    rightEye: { x: 64.8, y: 53.8, w: 22.0, h: 22.0 },
    mouth: { x: 53.0, y: 63.0, w: 16.0, h: 10.0 }
  },
  'book-learn.png': {
    leftEye: { x: 38.2, y: 51.3, w: 20.0, h: 20.0 },
    rightEye: { x: 66.6, y: 48.4, w: 20.0, h: 20.0 },
    mouth: { x: 54.7, y: 61.6, w: 16.0, h: 9.0 }
  },
  'calculator.png': {
    leftEye: { x: 33.4, y: 44.0, w: 20.0, h: 20.0 },
    rightEye: { x: 62.7, y: 42.1, w: 20.0, h: 20.0 },
    mouth: { x: 48.2, y: 49.0, w: 14.0, h: 8.0 }
  },
  'calendar-event.png': {
    leftEye: { x: 33.0, y: 42.7, w: 20.0, h: 20.0 },
    rightEye: { x: 60.8, y: 39.9, w: 20.0, h: 20.0 },
    mouth: { x: 46.5, y: 51.0, w: 12.0, h: 8.0 }
  },
  'chat-bubble.png': {
    leftEye: { x: 32.2, y: 55.5, w: 21.0, h: 21.0 },
    rightEye: { x: 67.2, y: 50.5, w: 21.0, h: 21.0 },
    mouth: { x: 52.4, y: 63.8, w: 18.0, h: 10.0 }
  },
  'clipboard.png': {
    leftEye: { x: 41.4, y: 36.7, w: 20.0, h: 20.0 },
    rightEye: { x: 69.0, y: 39.0, w: 18.0, h: 16.0 },
    mouth: { x: 55.2, y: 45.9, w: 16.0, h: 9.0 }
  },
  'clock-reminder.png': {
    leftEye: { x: 33.4, y: 49.2, w: 18.0, h: 20.0 },
    rightEye: { x: 68.6, y: 47.1, w: 18.0, h: 20.0 },
    mouth: { x: 51.4, y: 67.9, w: 16.0, h: 9.0 }
  },
  'coin-jar.png': {
    leftEye: { x: 39.5, y: 51.4, w: 20.0, h: 20.0 },
    rightEye: { x: 64.9, y: 55.9, w: 20.0, h: 20.0 },
    mouth: { x: 50.2, y: 62.4, w: 18.0, h: 10.0 }
  },
  'door-portal.png': {
    leftEye: { x: 38.3, y: 49.4, w: 20.0, h: 20.0 },
    rightEye: { x: 62.6, y: 49.4, w: 20.0, h: 20.0 },
    mouth: { x: 50.6, y: 58.4, w: 18.0, h: 10.0 }
  },
  'folder-docs.png': {
    leftEye: { x: 38.1, y: 44.9, w: 18.0, h: 18.0 },
    rightEye: { x: 62.4, y: 43.6, w: 18.0, h: 18.0 },
    mouth: { x: 51.3, y: 51.9, w: 14.0, h: 8.0 }
  },
  'gift-box.png': {
    leftEye: { x: 38.2, y: 48.5, w: 20.0, h: 20.0 },
    rightEye: { x: 63.1, y: 43.0, w: 20.0, h: 20.0 },
    mouth: { x: 53.6, y: 63.3, w: 18.0, h: 10.0 }
  },
  'heart-glow.png': {
    leftEye: { x: 37.4, y: 49.1, w: 18.0, h: 18.0 },
    rightEye: { x: 62.6, y: 45.1, w: 18.0, h: 18.0 },
    mouth: { x: 51.8, y: 55.0, w: 16.0, h: 9.0 }
  },
  'heart-handshake.png': {
    leftEye: { x: 35.4, y: 45.9, w: 19.0, h: 19.0 },
    rightEye: { x: 64.8, y: 44.4, w: 19.0, h: 19.0 },
    mouth: { x: 51.0, y: 58.0, w: 14.0, h: 9.0 }
  },
  'lightbulb-idea.png': {
    leftEye: { x: 32.3, y: 44.6, w: 20.0, h: 20.0 },
    rightEye: { x: 68.2, y: 42.8, w: 20.0, h: 20.0 },
    mouth: { x: 57.7, y: 57.6, w: 12.0, h: 8.0 }
  },
  'rocket.png': {
    leftEye: { x: 30.3, y: 45.0, w: 20.0, h: 20.0 },
    rightEye: { x: 60.6, y: 38.7, w: 20.0, h: 20.0 },
    mouth: { x: 48.2, y: 60.6, w: 16.0, h: 9.0 }
  },
  'scooter.png': {
    leftEye: { x: 36.6, y: 43.9, w: 20.0, h: 20.0 },
    rightEye: { x: 63.5, y: 39.1, w: 20.0, h: 20.0 },
    mouth: { x: 48.5, y: 50.1, w: 16.0, h: 9.0 }
  },
  'shield-protect.png': {
    leftEye: { x: 41.4, y: 49.2, w: 20.0, h: 20.0 },
    rightEye: { x: 66.6, y: 49.2, w: 20.0, h: 20.0 },
    mouth: { x: 53.6, y: 58.1, w: 16.0, h: 9.0 }
  },
  'shield-verified.png': {
    leftEye: { x: 35.8, y: 46.6, w: 20.0, h: 20.0 },
    rightEye: { x: 67.0, y: 45.7, w: 20.0, h: 20.0 },
    mouth: { x: 51.8, y: 55.3, w: 16.0, h: 9.0 }
  },
  'star-badge.png': {
    leftEye: { x: 36.0, y: 45.0, w: 20.0, h: 20.0 },
    rightEye: { x: 61.9, y: 44.6, w: 20.0, h: 20.0 },
    mouth: { x: 50.7, y: 54.6, w: 16.0, h: 9.0 }
  },
  'suit-executive.png': {
    leftEye: { x: 32.5, y: 40.5, w: 21.0, h: 21.0 },
    rightEye: { x: 63.6, y: 36.9, w: 21.0, h: 21.0 },
    mouth: { x: 48.1, y: 48.5, w: 16.0, h: 9.0 }
  },
  'tablet-tech.png': {
    leftEye: { x: 41.9, y: 50.7, w: 20.0, h: 20.0 },
    rightEye: { x: 62.8, y: 46.5, w: 20.0, h: 20.0 },
    mouth: { x: 56.3, y: 57.8, w: 16.0, h: 9.0 }
  },
  'toolbox.png': {
    leftEye: { x: 34.6, y: 44.2, w: 20.0, h: 20.0 },
    rightEye: { x: 66.0, y: 40.1, w: 20.0, h: 20.0 },
    mouth: { x: 54.5, y: 58.0, w: 16.0, h: 9.0 }
  },
  'trophy-winner.png': {
    leftEye: { x: 33.2, y: 41.4, w: 20.0, h: 20.0 },
    rightEye: { x: 67.4, y: 38.7, w: 20.0, h: 20.0 },
    mouth: { x: 50.3, y: 52.7, w: 16.0, h: 9.0 }
  },
  'umbrella.png': {
    leftEye: { x: 37.9, y: 45.1, w: 20.0, h: 20.0 },
    rightEye: { x: 64.6, y: 40.2, w: 20.0, h: 20.0 },
    mouth: { x: 55.1, y: 53.1, w: 16.0, h: 9.0 }
  }
}

export function getFaceCoordsForImage(imagePath: string): MascotFaceCoords {
  const filename = imagePath.split('/').pop() || ''
  return (
    MASCOT_FACE_COORDINATES[filename] || {
      leftEye: { x: 35.0, y: 45.0, w: 20.0, h: 20.0 },
      rightEye: { x: 65.0, y: 45.0, w: 20.0, h: 20.0 },
      mouth: { x: 50.0, y: 56.0, w: 16.0, h: 9.0 }
    }
  )
}
