
// --- Camera Panning & Zoom Input Stub ---
export const camera = {
  x: 0,
  y: 0,
  zoom: 1,
};

export function setupCamera(canvas) {
    canvas.addEventListener('wheel', (e) => {
    camera.zoom = Math.max(0.5, Math.min(2, camera.zoom + (e.deltaY < 0 ? 0.1 : -0.1)));
    });
    let isPanning = false;
    let panStart = { x: 0, y: 0 };
    canvas.addEventListener('mousedown', (e) => {
    if (e.button === 1) { // Middle mouse button
        isPanning = true;
        panStart.x = e.clientX;
        panStart.y = e.clientY;
    }
    });
    canvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
        camera.x -= (e.clientX - panStart.x) / camera.zoom;
        camera.y -= (e.clientY - panStart.y) / camera.zoom;
        panStart.x = e.clientX;
        panStart.y = e.clientY;
    }
    });
    window.addEventListener('mouseup', () => { isPanning = false; });
}
// --- End Camera Panning & Zoom Input Stub ---
