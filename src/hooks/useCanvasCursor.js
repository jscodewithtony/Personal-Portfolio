import { useEffect } from "react";

const useCanvasCursor = () => {
  function n(e) {
    this.init(e || {});
  }
  n.prototype = {
    init: function (e) {
      this.phase = e.phase || 0;
      this.offset = e.offset || 0;
      this.frequency = e.frequency || 0.001;
      this.amplitude = e.amplitude || 1;
      this.currentValue = 0;
    },
    update: function () {
      this.phase += this.frequency;
      this.currentValue = this.offset + Math.sin(this.phase) * this.amplitude;
      return this.currentValue;
    },
    value: function () {
      return this.currentValue;
    },
  };

  function Line(e) {
    this.init(e || {});
  }

  Line.prototype = {
    init: function (e) {
      this.spring = e.spring + 0.1 * Math.random() - 0.02;
      this.friction = E.friction + 0.01 * Math.random() - 0.002;
      this.nodes = [];
      for (var t, nIdx = 0; nIdx < E.size; nIdx++) {
        t = new Node();
        t.x = pos.x;
        t.y = pos.y;
        this.nodes.push(t);
      }
    },
    update: function () {
      var e = this.spring,
        t = this.nodes[0];
      t.vx += (pos.x - t.x) * e;
      t.vy += (pos.y - t.y) * e;
      for (var nNode, i = 0, a = this.nodes.length; i < a; i++) {
        t = this.nodes[i];
        if (0 < i) {
          nNode = this.nodes[i - 1];
          t.vx += (nNode.x - t.x) * e;
          t.vy += (nNode.y - t.y) * e;
          t.vx += nNode.vx * E.dampening;
          t.vy += nNode.vy * E.dampening;
        }
        t.vx *= this.friction;
        t.vy *= this.friction;
        t.x += t.vx;
        t.y += t.vy;
        e *= E.tension;
      }
    },
    draw: function () {
      if (!ctx) return;
      var eNode,
        tNode,
        nX = this.nodes[0].x,
        iY = this.nodes[0].y;
      ctx.beginPath();
      ctx.moveTo(nX, iY);
      var a = 1;
      for (var o = this.nodes.length - 2; a < o; a++) {
        eNode = this.nodes[a];
        tNode = this.nodes[a + 1];
        nX = 0.5 * (eNode.x + tNode.x);
        iY = 0.5 * (eNode.y + tNode.y);
        ctx.quadraticCurveTo(eNode.x, eNode.y, nX, iY);
      }
      eNode = this.nodes[a];
      tNode = this.nodes[a + 1];
      if (eNode && tNode) {
        ctx.quadraticCurveTo(eNode.x, eNode.y, tNode.x, tNode.y);
      }
      ctx.stroke();
      ctx.closePath();
    },
  };

  function onMousemove(e) {
    function o() {
      lines = [];
      for (var idx = 0; idx < E.trails; idx++) {
        lines.push(new Line({ spring: 0.4 + (idx / E.trails) * 0.025 }));
      }
    }
    function c(evt) {
      if (evt.touches) {
        pos.x = evt.touches[0].clientX;
        pos.y = evt.touches[0].clientY;
      } else {
        pos.x = evt.clientX;
        pos.y = evt.clientY;
      }
    }
    function l(evt) {
      if (evt.touches && 1 === evt.touches.length) {
        pos.x = evt.touches[0].clientX;
        pos.y = evt.touches[0].clientY;
      }
    }
    document.removeEventListener("mousemove", onMousemove);
    document.removeEventListener("touchstart", onMousemove);
    document.addEventListener("mousemove", c);
    document.addEventListener("touchmove", c, { passive: true });
    document.addEventListener("touchstart", l, { passive: true });
    c(e);
    o();
    render();
  }

  function render() {
    if (ctx && ctx.running) {
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      if (document.body.dataset.cursorProjectHover === "true") {
        ctx.frame++;
        window.requestAnimationFrame(render);
        return;
      }

      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "hsla(" + Math.round(f.update()) + ",50%,50%,0.2)";
      ctx.lineWidth = 1;
      for (var t = 0; t < E.trails; t++) {
        if (lines[t]) {
          lines[t].update();
          lines[t].draw();
        }
      }
      ctx.frame++;
      window.requestAnimationFrame(render);
    }
  }

  function resizeCanvas() {
    if (ctx && ctx.canvas) {
      ctx.canvas.width = window.innerWidth;
      ctx.canvas.height = window.innerHeight;
    }
  }

  var ctx,
    f,
    pos = { x: 0, y: 0 },
    lines = [],
    E = {
      debug: true,
      friction: 0.5,
      trails: 20,
      size: 50,
      dampening: 0.25,
      tension: 0.98,
    };

  function Node() {
    this.x = 0;
    this.y = 0;
    this.vy = 0;
    this.vx = 0;
  }

  const renderCanvas = function () {
    const canvasEl = document.getElementById("canvas");
    if (!canvasEl) return;
    ctx = canvasEl.getContext("2d");
    if (!ctx) return;
    ctx.running = true;
    ctx.frame = 1;
    f = new n({
      phase: Math.random() * 2 * Math.PI,
      amplitude: 85,
      frequency: 0.0015,
      offset: 285,
    });
    document.addEventListener("mousemove", onMousemove);
    document.addEventListener("touchstart", onMousemove, { passive: true });
    document.body.addEventListener("orientationchange", resizeCanvas);
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
  };

  useEffect(() => {
    renderCanvas();

    const onFocus = () => {
      if (ctx && !ctx.running) {
        ctx.running = true;
        render();
      }
    };
    const onBlur = () => {
      if (ctx) {
        ctx.running = true;
      }
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    return () => {
      if (ctx) {
        ctx.running = false;
      }
      document.removeEventListener("mousemove", onMousemove);
      document.removeEventListener("touchstart", onMousemove);
      document.body.removeEventListener("orientationchange", resizeCanvas);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);
};

export default useCanvasCursor;
