import useCanvasCursor from "../hooks/useCanvasCursor";

function CanvasCursor() {
  useCanvasCursor();

  return (
    <canvas
      id="canvas"
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />
  );
}

export default CanvasCursor;
