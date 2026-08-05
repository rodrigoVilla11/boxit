export type ShareData = {
  title: string | null;
  dateText: string;
  durationText: string;
  volumeText: string;
  sets: number;
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Dibuja una imagen cuadrada (1080²) del resumen del entreno, con la marca. */
export function workoutShareImage(data: ShareData): Promise<Blob> {
  const W = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = W;
  const ctx = canvas.getContext('2d')!;
  const SANS = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';

  // Fondo + tarjeta
  ctx.fillStyle = '#0B0F0E';
  ctx.fillRect(0, 0, W, W);
  ctx.strokeStyle = 'rgba(34,197,94,0.35)';
  ctx.lineWidth = 3;
  roundRect(ctx, 40, 40, W - 80, W - 80, 44);
  ctx.stroke();

  // Wordmark "BOX iT" centrado
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 104px ${SANS}`;
  const box = 'BOX ';
  const it = 'iT';
  const wBox = ctx.measureText(box).width;
  const wIt = ctx.measureText(it).width;
  const startX = (W - (wBox + wIt)) / 2;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#F0F4F2';
  ctx.fillText(box, startX, 270);
  ctx.fillStyle = '#22C55E';
  ctx.fillText(it, startX + wBox, 270);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#8A938F';
  ctx.font = `600 42px ${SANS}`;
  ctx.fillText('¡Entreno terminado!', W / 2, 350);

  // Título / fecha
  ctx.fillStyle = '#F0F4F2';
  ctx.font = `800 60px ${SANS}`;
  ctx.fillText(data.title || data.dateText, W / 2, 490);
  if (data.title) {
    ctx.fillStyle = '#8A938F';
    ctx.font = `400 36px ${SANS}`;
    ctx.fillText(data.dateText, W / 2, 548);
  }

  // Stats
  const stats: [string, string][] = [
    ['Duración', data.durationText],
    ['Volumen', data.volumeText],
    ['Series', String(data.sets)],
  ];
  const colW = (W - 160) / 3;
  stats.forEach(([label, value], i) => {
    const cx = 80 + colW * i + colW / 2;
    ctx.fillStyle = '#A3E635';
    ctx.font = `800 56px ${SANS}`;
    ctx.fillText(value, cx, 760);
    ctx.fillStyle = '#8A938F';
    ctx.font = `600 30px ${SANS}`;
    ctx.fillText(label.toUpperCase(), cx, 810);
  });

  // Pie
  ctx.fillStyle = '#8A938F';
  ctx.font = `500 30px ${SANS}`;
  ctx.fillText('Registrado con BOX iT', W / 2, W - 90);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen.'))),
      'image/png',
    ),
  );
}

/** Comparte (o descarga) la imagen del entreno. */
export async function shareWorkoutImage(data: ShareData): Promise<void> {
  const blob = await workoutShareImage(data);
  const file = new File([blob], 'boxit-entreno.png', { type: 'image/png' });
  const nav = navigator as Navigator & {
    canShare?: (d: { files: File[] }) => boolean;
  };
  if (nav.canShare?.({ files: [file] }) && navigator.share) {
    await navigator.share({ files: [file], title: 'Mi entreno en BOX iT' });
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'boxit-entreno.png';
  a.click();
  URL.revokeObjectURL(url);
}
