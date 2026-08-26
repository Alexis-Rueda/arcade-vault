const WALL_THICKNESS = 3;

export function drawWallBorder(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.strokeStyle = '#ff3333';
  ctx.lineWidth = WALL_THICKNESS;
  ctx.shadowColor = 'rgba(255, 50, 50, 0.6)';
  ctx.shadowBlur = 10;
  ctx.strokeRect(
    WALL_THICKNESS / 2,
    WALL_THICKNESS / 2,
    w - WALL_THICKNESS,
    h - WALL_THICKNESS,
  );
  ctx.restore();
}
