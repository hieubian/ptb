/* HIMACAKE Photo Booth — chỉ trình duyệt, không gửi ảnh lên máy chủ */
(function () {
  'use strict';

  /** Font chữ HIMACAKE ở chân ảnh — khớp logo web (Quicksand + nâu brand) */
  var PB_FOOTER_FONT_FAMILY =
    '"Quicksand", "Be Vietnam Pro", "Segoe UI", Roboto, system-ui, sans-serif';
  var PB_FOOTER_TEXT_COLOR = '#3E2723';

  /** Bộ lọc chân dung — cường độ điều chỉnh qua thanh trượt (100% = mặc định preset) */
  var FILTER_PARTS = {
    normal: [],
    silky: [
      { fn: 'brightness', v: 1.03 },
      { fn: 'contrast', v: 0.96 },
      { fn: 'saturate', v: 1.1 }
    ],
    warm: [
      { fn: 'sepia', v: 0.09 },
      { fn: 'saturate', v: 1.14 },
      { fn: 'brightness', v: 1.04 }
    ],
    blossom: [
      { fn: 'brightness', v: 1.05 },
      { fn: 'contrast', v: 0.97 },
      { fn: 'saturate', v: 1.32 }
    ],
    daydream: [
      { fn: 'brightness', v: 1.07 },
      { fn: 'contrast', v: 0.9 },
      { fn: 'saturate', v: 0.93 }
    ],
    radiant: [
      { fn: 'brightness', v: 1.1 },
      { fn: 'saturate', v: 1.2 }
    ],
    velvet: [
      { fn: 'contrast', v: 1.05 },
      { fn: 'saturate', v: 1.14 },
      { fn: 'brightness', v: 0.99 }
    ]
  };

  function filterNeutral(fn) {
    return fn === 'sepia' ? 0 : 1;
  }

  function clampNum(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  function formatFilterNum(v) {
    return String(Math.round(v * 1000) / 1000);
  }

  /**
   * strengthPct: 0 = tắt hiệu ứng, 100 = đúng preset, 300 = gấp 3 độ lệch so với trung tính (biên độ cao).
   */
  function buildFilterFromParts(parts, strengthPct) {
    if (!parts || !parts.length) return 'none';
    var m = strengthPct / 100;
    var bits = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var neu = filterNeutral(p.fn);
      var raw = neu + (p.v - neu) * m;
      var v;
      if (p.fn === 'brightness') {
        v = clampNum(raw, 0.18, 4.2);
      } else if (p.fn === 'contrast') {
        v = clampNum(raw, 0.1, 4.2);
      } else if (p.fn === 'saturate') {
        v = clampNum(raw, 0, 5.5);
      } else if (p.fn === 'sepia') {
        v = clampNum(raw, 0, 1);
      } else {
        v = raw;
      }
      bits.push(p.fn + '(' + formatFilterNum(v) + ')');
    }
    return bits.join(' ');
  }

  function canvasFilterFromPreset(id, strengthPct) {
    var s = typeof strengthPct === 'number' ? strengthPct : 100;
    if (!id || id === 'normal' || s <= 0) return 'none';
    return buildFilterFromParts(FILTER_PARTS[id], s);
  }
  /** 4 ảnh xếp dọc — ô ngang (landscape), viền + gutter + vùng chân giống film strip */
  function cellsStripFourVertical() {
    var mSide = 0.048;
    var mTop = 0.03;
    var footer = 0.152;
    var gY = 0.011;
    var photoBottom = 1 - footer;
    var usableV = photoBottom - mTop - 3 * gY;
    var cellH = usableV / 4;
    var cellW = 1 - 2 * mSide;
    var x = mSide;
    var cells = [];
    for (var i = 0; i < 4; i++) {
      cells.push({ x: x, y: mTop + i * (cellH + gY), w: cellW, h: cellH });
    }
    return cells;
  }

  /** 2×2 — ô dọc (portrait), viền đồng đều + chân lớn */
  function cells2x2Clean() {
    var mSide = 0.054;
    var mTop = 0.04;
    var footer = 0.162;
    var gX = 0.021;
    var gY = 0.021;
    var photoBottom = 1 - footer;
    var usableW = 1 - 2 * mSide - gX;
    var usableH = photoBottom - mTop - gY;
    var cellW = usableW / 2;
    var cellH = usableH / 2;
    return [
      { x: mSide, y: mTop, w: cellW, h: cellH },
      { x: mSide + cellW + gX, y: mTop, w: cellW, h: cellH },
      { x: mSide, y: mTop + cellH + gY, w: cellW, h: cellH },
      { x: mSide + cellW + gX, y: mTop + cellH + gY, w: cellW, h: cellH }
    ];
  }

  var LAYOUTS = [
    {
      id: 'r1000x3000',
      cardTitle: '4 ảnh',
      label: '1000×3000',
      outW: 1000,
      outH: 3000,
      cells: cellsStripFourVertical(),
      templateEditor: true,
      cleanComposite: true
    },
    {
      id: 'r1400x2000',
      cardTitle: '4 ảnh',
      label: '1400×2000',
      outW: 1400,
      outH: 2000,
      cells: cells2x2Clean(),
      templateEditor: true,
      cleanComposite: true
    },
    {
      id: 'r1500x2260',
      cardTitle: '4 ảnh',
      label: '1500×2260',
      outW: 1500,
      outH: 2260,
      cells: cells2x2Clean(),
      templateEditor: true,
      cleanComposite: true
    }
  ];

  var FILTERS_UI = [
    { id: 'normal', name: 'Tự nhiên' },
    { id: 'silky', name: 'Làn da mịn' },
    { id: 'warm', name: 'Ấm áp' },
    { id: 'blossom', name: 'Hồng cánh hoa' },
    { id: 'daydream', name: 'Mơ màng' },
    { id: 'radiant', name: 'Rạng rỡ' },
    { id: 'velvet', name: 'Nhung nhẹ' }
  ];

  var SWATCH_COLORS = [
    null,
    'custom',
    '#FFD54F',
    '#e8d0f5',
    '#bfe3ef',
    '#FFECB3',
    '#fff1d6',
    '#F4B41A'
  ];

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  /** DPI ratio — giới hạn 1–3 để tránh canvas quá lớn trên 4K+ */
  function getDPR() {
    return Math.min(3, Math.max(1, typeof window.devicePixelRatio === 'number' ? window.devicePixelRatio : 1));
  }

  /** Nhãn ngắn dưới nút (chỉ "4 ảnh", "2 ảnh", …) */
  function layoutShortLabel(L) {
    return L && L.label ? L.label : '';
  }

  function findLayoutById(id) {
    for (var i = 0; i < LAYOUTS.length; i++) {
      if (LAYOUTS[i].id === id) return LAYOUTS[i];
    }
    return LAYOUTS[0];
  }

  function drawCover(ctx, img, dx, dy, dw, dh) {
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    var scale = Math.max(dw / iw, dh / ih);
    var sw = dw / scale;
    var sh = dh / scale;
    var sx = (iw - sw) * 0.5;
    var sy = (ih - sh) * 0.5;
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  /**
   * Nền: màu khung, hoặc họa tiết IMG_4361 (drawCover — không méo) khi bật nền sticker.
   * Chân ảnh: luôn logo (nếu tải được) + chữ HIMACAKE.
   */
  function compositeCleanLayout(layout, frames, matColor, logoImg, usePatternBackground, patternImg) {
    var cells = layout.cells;
    if (!cells || !cells.length || frames.length < cells.length || !layout.outW || !layout.outH) return null;

    var W = Math.round(layout.outW);
    var H = Math.round(layout.outH);
    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;
    if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';

    var bg = matColor || '#ffffff';
    var patOk = patternImg && patternImg.complete && patternImg.naturalWidth && patternImg.naturalHeight;
    if (usePatternBackground && patOk) {
      drawCover(ctx, patternImg, 0, 0, W, H);
    } else {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
    }

    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      var fr = frames[i];
      if (!fr) continue;
      var dx = Math.round(c.x * W);
      var dy = Math.round(c.y * H);
      var dw = Math.round(c.w * W);
      var dh = Math.round(c.h * H);
      ctx.save();
      ctx.beginPath();
      ctx.rect(dx, dy, dw, dh);
      ctx.clip();
      drawCover(ctx, fr, dx, dy, dw, dh);
      ctx.restore();
    }

    var maxB = 0;
    for (var j = 0; j < cells.length; j++) {
      maxB = Math.max(maxB, cells[j].y + cells[j].h);
    }
    var footerTopPx = Math.min(H - 1, Math.round(maxB * H));
    var footH = H - footerTopPx;
    var marginX = Math.max(14, Math.round(W * 0.055));

    if (footH > 12) {
      var grad = ctx.createLinearGradient(0, footerTopPx, 0, H);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.35, 'rgba(255,255,255,0.5)');
      grad.addColorStop(1, 'rgba(255,255,255,0.82)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, footerTopPx, W, footH);

      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = Math.max(1, Math.round(W / 920));
      ctx.beginPath();
      ctx.moveTo(marginX, footerTopPx + 0.5);
      ctx.lineTo(W - marginX, footerTopPx + 0.5);
      ctx.stroke();

      var title = 'HIMACAKE';
      var fsTitle = Math.max(14, Math.min(Math.round(footH * 0.3), Math.round(W * 0.04)));

      var titleY = footerTopPx + footH * 0.48;

      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = PB_FOOTER_TEXT_COLOR;
      ctx.font = '700 ' + fsTitle + 'px ' + PB_FOOTER_FONT_FAMILY;
      if ('letterSpacing' in ctx) {
        ctx.letterSpacing = Math.round(Math.max(1, fsTitle * 0.12)) + 'px';
      }
      ctx.shadowColor = 'rgba(255,255,255,0.85)';
      ctx.shadowBlur = Math.max(3, Math.round(fsTitle * 0.25));

      var lgOk = logoImg && logoImg.complete && logoImg.naturalWidth;
      if (lgOk) {
        var lh = Math.round(fsTitle * 1.28);
        var lgW = (logoImg.naturalWidth / logoImg.naturalHeight) * lh;
        var gap = Math.round(fsTitle * 0.42);
        var tw = ctx.measureText(title).width;
        var total = lgW + gap + tw;
        var startX = W * 0.5 - total * 0.5;
        ctx.shadowBlur = 0;
        ctx.drawImage(logoImg, startX, titleY - lh * 0.5, lgW, lh);
        ctx.textAlign = 'left';
        ctx.shadowColor = 'rgba(255,255,255,0.85)';
        ctx.shadowBlur = Math.max(3, Math.round(fsTitle * 0.25));
        ctx.fillText(title, startX + lgW + gap, titleY);
      } else {
        ctx.fillText(title, W * 0.5, titleY);
      }
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      ctx.shadowBlur = 0;
    }

    return canvas;
  }

  /**
   * Vị trí 4 ô ảnh trên file khung IMG_4361 (0–1 theo chiều rộng/cao ảnh gốc).
   * Nếu lệch thực tế, chỉnh lại tọa độ này cho khớp lỗ cắt trên PNG.
   */
  var TEMPLATE_CELLS_4 = [
    { x: 0.07, y: 0.07, w: 0.39, h: 0.28 },
    { x: 0.54, y: 0.07, w: 0.39, h: 0.28 },
    { x: 0.07, y: 0.38, w: 0.39, h: 0.28 },
    { x: 0.54, y: 0.38, w: 0.39, h: 0.28 }
  ];

  var FRAME_MAT_COLORS = ['#ffffff', '#FFF3D0', '#e3f2fd', '#fff8e1', '#e8eaf6', '#F4B41A', '#1a1a1e', '#b2dfdb'];

  function loadImageElement(src, cb) {
    if (!src) {
      cb(null);
      return;
    }
    var im = new Image();
    im.onload = function () {
      cb(im);
    };
    im.onerror = function () {
      cb(null);
    };
    im.src = src;
  }

  /**
   * Ghép 4 ảnh lên khung PNG + viền ngoài + chân.
   * outW/outH: kích thước xuất cuối (template kéo giãn vào vùng trong viền để khớp tỷ lệ).
   */
  function compositeTemplateFrame(templateImg, logoImg, frames, matColor, stickerEnabled, outW, outH) {
    var natW = templateImg.naturalWidth;
    var natH = templateImg.naturalHeight;
    if (!natW || !natH) return null;

    var cw = outW && outH ? Math.round(outW) : natW + Math.max(16, Math.round(Math.min(natW, natH) * 0.022)) * 2;
    var ch = outW && outH ? Math.round(outH) : natH + Math.max(16, Math.round(Math.min(natW, natH) * 0.022)) * 2;
    var pad = Math.max(8, Math.round(Math.min(cw, ch) * 0.022));
    var tw = cw - pad * 2;
    var th = ch - pad * 2;
    if (tw <= 0 || th <= 0) return null;

    var canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = matColor || '#ffffff';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(templateImg, pad, pad, tw, th);

    var cells = TEMPLATE_CELLS_4;
    for (var fi = 0; fi < cells.length && fi < frames.length; fi++) {
      var fr = frames[fi];
      if (!fr) continue;
      var c = cells[fi];
      var dx = pad + c.x * tw;
      var dy = pad + c.y * th;
      var dw = c.w * tw;
      var dh = c.h * th;
      ctx.save();
      ctx.beginPath();
      ctx.rect(dx, dy, dw, dh);
      ctx.clip();
      drawCover(ctx, fr, dx, dy, dw, dh);
      ctx.restore();
    }

    var lgOk = logoImg && logoImg.complete && logoImg.naturalWidth;
    if (stickerEnabled && lgOk) {
      var sh = th * 0.12;
      var sw = (logoImg.naturalWidth / logoImg.naturalHeight) * sh;
      var sxb = pad + tw * 0.5 - sw * 0.5;
      var syb = pad + th * 0.48 - sh * 0.5;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.drawImage(logoImg, sxb, syb, sw, sh);
      ctx.restore();
    }

    var footY = pad + th * 0.91;
    var fs = Math.max(16, Math.round(th * 0.036));
    ctx.font =
      '700 ' +
      fs +
      'px "Quicksand", "Be Vietnam Pro", "Segoe UI", Roboto, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 10;
    var text = 'HIMACAKE';
    var textW = ctx.measureText(text).width;
    var lh = fs * 1.45;
    var lgW = 0;
    if (lgOk) {
      lgW = (logoImg.naturalWidth / logoImg.naturalHeight) * lh;
    }
    var gap = Math.round(fs * 0.5);
    var total = lgW + gap + textW;
    var cx = pad + tw / 2;
    var startX = cx - total / 2;
    if (lgOk) {
      ctx.drawImage(logoImg, startX, footY - lh / 2, lgW, lh);
    }
    ctx.fillText(text, startX + lgW + gap, footY);
    ctx.shadowBlur = 0;

    return canvas;
  }

  /** Nền mặc định trắng (gradient rất nhẹ — trùng CSS .page-photo-booth) */
  var PB_BG_DEFAULT = { c1: '#ffffff', c2: '#f6f6f8', c3: '#ffffff' };

  function hexToRgb(hex) {
    var s = (hex || '').replace('#', '');
    if (s.length !== 6) return { r: 139, g: 92, b: 246 };
    return {
      r: parseInt(s.slice(0, 2), 16),
      g: parseInt(s.slice(2, 4), 16),
      b: parseInt(s.slice(4, 6), 16)
    };
  }

  function rgbToHex(r, g, b) {
    return (
      '#' +
      [r, g, b]
        .map(function (x) {
          return ('0' + Math.round(Math.min(255, Math.max(0, x))).toString(16)).slice(-2);
        })
        .join('')
    );
  }

  function lerpHex(a, b, t) {
    var A = hexToRgb(a);
    var B = hexToRgb(b);
    return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
  }

  /** pct < 0 tối hơn, > 0 sáng hơn (theo % lệch về đen/trắng) */
  function shadeHex(hex, pct) {
    var rgb = hexToRgb(hex);
    if (pct <= 0) {
      var d = Math.min(1, -pct / 100);
      return rgbToHex(rgb.r * (1 - d), rgb.g * (1 - d), rgb.b * (1 - d));
    }
    var L = Math.min(1, pct / 100);
    return rgbToHex(
      rgb.r + (255 - rgb.r) * L,
      rgb.g + (255 - rgb.g) * L,
      rgb.b + (255 - rgb.b) * L
    );
  }

  /** Phát sáng = đổi màu nền gradient (vùng tím) ngoài khung, không phủ lên video */
  function applyOuterPageGlow(section, hex, intensityPct) {
    if (!section) return;
    if (!hex || intensityPct <= 0) {
      section.style.removeProperty('background');
      return;
    }
    var t = Math.min(1, Math.max(0, intensityPct / 100));
    var u1 = shadeHex(hex, -38);
    var u2 = hex;
    var u3 = shadeHex(hex, 30);
    var g1 = lerpHex(PB_BG_DEFAULT.c1, u1, t);
    var g2 = lerpHex(PB_BG_DEFAULT.c2, u2, t);
    var g3 = lerpHex(PB_BG_DEFAULT.c3, u3, t);
    section.style.background = 'linear-gradient(165deg, ' + g1 + ' 0%, ' + g2 + ' 38%, ' + g3 + ' 100%)';
  }

  /**
   * Một ô ảnh trong lưới: crop “cover” theo tỷ lệ cellW:cellH (không còn vuông).
   */
  function captureSourceFrame(video, imgFallback, mirror, filterId, filterStrengthPct, cellW, cellH) {
    var src = video && video.readyState >= 2 ? video : imgFallback;
    if (!src || (!(src instanceof HTMLVideoElement) && !(src instanceof HTMLImageElement))) return null;

    var w = src instanceof HTMLVideoElement ? src.videoWidth : src.naturalWidth;
    var h = src instanceof HTMLVideoElement ? src.videoHeight : src.naturalHeight;
    if (!w || !h) return null;

    var temp = document.createElement('canvas');
    temp.width = w;
    temp.height = h;
    var tctx = temp.getContext('2d');
    if (!tctx) return null;

    tctx.filter = canvasFilterFromPreset(filterId, filterStrengthPct);

    if (mirror && src instanceof HTMLVideoElement) {
      tctx.translate(w, 0);
      tctx.scale(-1, 1);
    }
    tctx.drawImage(src, 0, 0);
    tctx.setTransform(1, 0, 0, 1, 0, 0);
    tctx.filter = 'none';

    var cw = Math.max(1, Math.round(cellW || Math.min(w, h) * 0.5));
    var ch = Math.max(1, Math.round(cellH || Math.min(w, h) * 0.5));

    var out = document.createElement('canvas');
    out.width = cw;
    out.height = ch;
    var octx = out.getContext('2d');
    if (!octx) return null;
    if ('imageSmoothingQuality' in octx) octx.imageSmoothingQuality = 'high';
    drawCover(octx, temp, 0, 0, cw, ch);

    return out;
  }

  function compositeLayout(layout, frames) {
    var cells = layout.cells;
    if (!cells || !cells.length || frames.length < cells.length) return null;

    var W;
    var H;
    if (layout.outW && layout.outH) {
      W = Math.round(layout.outW);
      H = Math.round(layout.outH);
    } else {
      W = 1200;
      if (layout.polaroidBg) {
        H = Math.round(W * 0.95);
      } else {
        var mx = 0;
        var my = 0;
        for (var bi = 0; bi < cells.length; bi++) {
          var bc = cells[bi];
          mx = Math.max(mx, bc.x + bc.w);
          my = Math.max(my, bc.y + bc.h);
        }
        if (mx <= 0) mx = 1;
        if (my <= 0) my = 1;
        H = Math.round(W * (my / mx));
      }
    }

    var out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    var ctx = out.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = layout.polaroidBg ? '#fafafa' : '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      var fr = frames[i];
      if (!fr) continue;
      var dx = Math.round(c.x * W);
      var dy = Math.round(c.y * H);
      var dw = Math.round(c.w * W);
      var dh = Math.round(c.h * H);
      if (layout.polaroidBg) {
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0,0,0,0.12)';
        ctx.shadowBlur = 10;
        ctx.fillRect(dx - 4, dy - 4, dw + 8, dh + 32);
        ctx.restore();
        dy += 2;
        dh -= 8;
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(dx, dy, dw, dh);
      ctx.clip();
      drawCover(ctx, fr, dx, dy, dw, dh);
      ctx.restore();
    }

    return out;
  }

  function triggerDownload(canvas) {
    canvas.toBlob(function (blob) {
      if (!blob) return;
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'himacake-photobooth-' + Date.now() + '.png';
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  /**
   * HTML trang / edge CDN (Cloudflare) đôi khi cache bản JSP cũ — thiếu khối thanh cường độ.
   * Tạo markup nếu thiếu để JS mới vẫn hoạt động (chỉ cần JS được tải bản mới).
   */
  function ensureFilterStrengthMarkup() {
    if ($('#pb-filter-range')) return;
    var grid = $('#pb-filter-grid');
    var panel = document.querySelector('[data-panel="filter"]');
    if (!grid || !panel) return;
    var old = document.getElementById('pb-filter-strength-wrap');
    if (old) old.remove();
    var wrap = document.createElement('div');
    wrap.id = 'pb-filter-strength-wrap';
    wrap.className = 'pb-filter-strength';
    wrap.setAttribute('hidden', '');
    wrap.innerHTML =
      '<label class="pb-filter-strength__label" for="pb-filter-range">Cường độ bộ lọc</label>' +
      '<div class="pb-light-row pb-filter-strength__row">' +
      '<input type="range" id="pb-filter-range" min="0" max="300" value="100" step="5" ' +
      'aria-valuemin="0" aria-valuemax="300" aria-label="Cường độ bộ lọc">' +
      '<output id="pb-filter-out" for="pb-filter-range">100%</output>' +
      '</div>';
    grid.parentNode.insertBefore(wrap, grid.nextSibling);
  }

  function init() {
    document.body.classList.add('photo-booth-page');
    ensureFilterStrengthMarkup();

    var video = $('#pb-video');
    var staticImg = $('#pb-static');
    var preview = $('.pb-preview');
    var pageSection = $('.page-photo-booth');
    var msgEl = $('#pb-msg');
    var cdEl = $('#pb-countdown');
    var progEl = $('#pb-progress');
    var flipBtn = $('#pb-flip-camera');
    var resumeCamBtn = $('#pb-resume-camera');

    var currentStream = null;
    /** 'user' = trước (selfie), 'environment' = sau — iOS/Android chuẩn MediaDevices */
    var facingMode = 'user';

    var timerSec = 3;
    var selectedLayout = findLayoutById('r1000x3000');
    var filterId = 'normal';
    /** 100 = đúng preset; 0–300% — tăng biên độ hiệu ứng (khớp thanh trượt). */
    var filterStrengthPct = 100;
    var lightColor = null;
    var lightPct = 100;

    var modal = $('#pb-modal');
    var modalTabs = document.querySelectorAll('.pb-modal__tab');
    var panels = document.querySelectorAll('[data-panel]');

    var pbPage = $('#pb-page');
    var PB_TEMPLATE_SRC = pbPage ? pbPage.getAttribute('data-pb-template') || '' : '';
    var PB_LOGO_SRC = pbPage ? pbPage.getAttribute('data-pb-logo') || '' : '';
    var PB_LOGO_FB = pbPage ? pbPage.getAttribute('data-pb-logo-fallback') || '' : '';

    var capturePhase = $('#pb-capture-phase');
    var editorPhase = $('#pb-editor-phase');
    var filmstripEl = $('#pb-filmstrip');
    var editorCanvas = $('#pb-editor-canvas');
    var dlBtn = $('#pb-download-btn');
    var retakeBtn = $('#pb-retake-btn');
    var bgPatternToggle = $('#pb-bg-pattern-toggle');
    var frameSwatchesEl = $('#pb-frame-swatches');

    var capturedFrames = [];
    var frameMatColor = '#ffffff';
    /** Màu tùy chỉnh màu khung — cập nhật khi dùng color picker */
    var frameMatCustomColor = '#F4B41A';
    /** Nền sticker = họa tiết IMG_4361; mặc định tắt — chỉ dùng màu khung */
    var bgPatternOn = false;

    function colorPickerHexValue() {
      if (lightColor && SWATCH_COLORS.indexOf(lightColor) === -1) return lightColor;
      return '#F4B41A';
    }

    function setPreviewFilter() {
      if (!preview) return;
      var f = canvasFilterFromPreset(filterId, filterStrengthPct);
      preview.style.filter = f === 'none' ? 'none' : f;
    }

    function syncFilterStrengthUI() {
      ensureFilterStrengthMarkup();
      var wrap = $('#pb-filter-strength-wrap');
      var range = $('#pb-filter-range');
      var out = $('#pb-filter-out');
      if (!wrap || !range) return;
      var hide = filterId === 'normal';
      if (hide) {
        wrap.setAttribute('hidden', '');
        wrap.hidden = true;
      } else {
        wrap.removeAttribute('hidden');
        wrap.hidden = false;
      }
      range.disabled = hide;
      if (hide) return;
      range.value = String(filterStrengthPct);
      if (out) out.textContent = filterStrengthPct + '%';
    }

    function applyPreviewAspect(L) {
      if (!preview || !L || !L.cells || !L.cells.length || !L.outW || !L.outH) return;
      var c = L.cells[0];
      var pw = Math.max(1, Math.round(c.w * L.outW));
      var ph = Math.max(1, Math.round(c.h * L.outH));
      preview.style.aspectRatio = String(pw) + ' / ' + String(ph);
    }

    function refreshOuterGlow() {
      applyOuterPageGlow(pageSection, lightColor, lightPct);
      refreshSelectionSummary();
    }

    function filterDisplayName(fid) {
      for (var fi = 0; fi < FILTERS_UI.length; fi++) {
        if (FILTERS_UI[fi].id === fid) return FILTERS_UI[fi].name;
      }
      return fid;
    }

    function lightSummaryText() {
      if (!lightColor || lightPct <= 0) return 'Trắng';
      return String(lightColor).toUpperCase();
    }

    function refreshSelectionSummary() {
      var sg = $('#pb-sum-grid');
      var sf = $('#pb-sum-filter');
      var sl = $('#pb-sum-light');
      if (sg) sg.textContent = layoutShortLabel(selectedLayout);
      if (sf) {
        var fsum = filterDisplayName(filterId);
        if (filterId !== 'normal') fsum += ' · ' + filterStrengthPct + '%';
        sf.textContent = fsum;
      }
      if (sl) sl.textContent = lightSummaryText();
    }

    function showMsg(text) {
      if (!msgEl) return;
      msgEl.hidden = !text;
      msgEl.textContent = text || '';
    }

    function applyFacingMirrorClass() {
      if (!video) return;
      if (facingMode === 'user') {
        video.classList.add('pb-video--mirror');
      } else {
        video.classList.remove('pb-video--mirror');
      }
    }

    /** Selfie lật ngang cho đúng cảm giác gương; camera sau không lật */
    function mirrorForCapture() {
      return facingMode === 'user' && !preview.classList.contains('is-static');
    }

    function stopCamera() {
      if (currentStream) {
        currentStream.getTracks().forEach(function (t) {
          t.stop();
        });
        currentStream = null;
      }
      if (video && video.srcObject) {
        video.srcObject = null;
      }
    }

    function updateCameraChrome() {
      var staticMode = preview.classList.contains('is-static');
      var streamOk =
        !!currentStream &&
        currentStream.getTracks().some(function (t) {
          return t.readyState === 'live';
        });
      if (flipBtn) flipBtn.hidden = staticMode || !streamOk;
      if (resumeCamBtn) resumeCamBtn.hidden = streamOk && !staticMode;
    }

    /**
     * Ràng buộc video theo hướng dẫn W3C Media Capture — chỉ dùng khóa trình duyệt hỗ trợ;
     * toàn bộ giá trị ưu tiên dạng {@code ideal} (gợi ý), không {@code exact}, để UA chọn thiết bị / cấu hình mặc định nhanh, đúng trên desktop lẫn mobile.
     * @see https://www.w3.org/TR/mediacapture-streams/
     */
    function buildPrimaryVideoConstraints() {
      var sup =
        navigator.mediaDevices && typeof navigator.mediaDevices.getSupportedConstraints === 'function'
          ? navigator.mediaDevices.getSupportedConstraints()
          : {};
      var dpr = getDPR();
      /* DPI-aware: yêu cầu độ phân giải cao hơn trên màn hình retina/3x
         để ảnh chụp sắc nét, không bị mờ khi xuất */
      var idealW = dpr >= 2 ? 1920 : 1280;
      var idealH = dpr >= 2 ? 1080 : 720;
      var maxW = dpr >= 3 ? 3840 : 1920;
      var maxH = dpr >= 3 ? 2160 : 1080;
      var video = {};
      if (sup.width) {
        video.width = { ideal: idealW, max: maxW };
      }
      if (sup.height) {
        video.height = { ideal: idealH, max: maxH };
      }
      if (sup.frameRate) {
        video.frameRate = { ideal: 30, max: 60 };
      }
      if (sup.facingMode) {
        video.facingMode = { ideal: facingMode };
      }
      /* Ưu tiên resizeMode 'none' — tránh UA scale ảnh mờ */
      if (sup.resizeMode) {
        video.resizeMode = { ideal: 'none' };
      }
      return Object.keys(video).length ? video : true;
    }

    function startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showMsg('Trình duyệt không hỗ trợ camera. Thử Safari hoặc Chrome phiên bản mới.');
        return Promise.reject(new Error('no getUserMedia'));
      }
      stopCamera();

      var primary = { audio: false, video: buildPrimaryVideoConstraints() };

      function applyStream(stream) {
        currentStream = stream;
        if (video) {
          video.srcObject = stream;
          video.setAttribute('playsinline', '');
          video.setAttribute('webkit-playsinline', '');
          video.muted = true;
          var p = video.play();
          if (p && typeof p.catch === 'function') {
            p.catch(function () {});
          }
        }
        applyFacingMirrorClass();
        return stream;
      }

      /**
       * Một lần getUserMedia chính + tối đa một bước dự phòng tối giản — tránh chuỗi nhiều lần gọi
       * (mỗi lần fail có thể chờ timeout của UA), khớp lời khuyên MDN / thực hành tương tác phổ biến.
       */
      return navigator.mediaDevices
        .getUserMedia(primary)
        .then(applyStream)
        .catch(function () {
          return navigator.mediaDevices.getUserMedia({ audio: false, video: true }).then(applyStream);
        });
    }

    function openModal() {
      if (!modal) return;
      modal.hidden = false;
    }

    function closeModal() {
      if (!modal) return;
      modal.hidden = true;
    }

    var PANEL_TITLES = { grid: 'Khung lưới', filter: 'Bộ lọc', light: 'Phát sáng' };

    function switchPanel(id) {
      modalTabs.forEach(function (t) {
        t.setAttribute('aria-selected', t.getAttribute('data-tab') === id ? 'true' : 'false');
      });
      panels.forEach(function (p) {
        var on = p.getAttribute('data-panel') === id;
        p.hidden = !on;
      });
      var mh = $('#pb-modal-title');
      if (mh && PANEL_TITLES[id]) mh.textContent = PANEL_TITLES[id];
      if (id === 'filter') syncFilterStrengthUI();
    }

    function hydrateLayoutCardThumbs() {
      var root = $('#pb-page');
      if (!root) return;
      for (var i = 0; i < LAYOUTS.length; i++) {
        var Lo = LAYOUTS[i];
        var url = root.getAttribute('data-pb-layout-thumb-' + Lo.id);
        if (url) Lo.cardThumbUrl = url;
      }
    }

    /** Sơ đồ mini: PNG minh họa hoặc đúng % cells (0–1) + vùng chân */
    function buildLayoutCardDiagram(frameEl, L) {
      frameEl.innerHTML = '';
      if (L.cardThumbUrl) {
        var img = document.createElement('img');
        img.src = L.cardThumbUrl;
        img.className = 'pb-layout-card__thumb-img';
        img.alt = '';
        img.decoding = 'async';
        img.loading = 'lazy';
        frameEl.appendChild(img);
        return;
      }

      var cells = L.cells;
      if (!cells || !cells.length) return;

      var maxB = 0;
      for (var k = 0; k < cells.length; k++) {
        maxB = Math.max(maxB, cells[k].y + cells[k].h);
      }
      var footerTop = Math.min(1, Math.max(0, maxB));

      var diag = document.createElement('div');
      diag.className = 'pb-layout-card__diagram';
      var inner = document.createElement('div');
      inner.className = 'pb-layout-card__diagram-inner';

      for (var i = 0; i < cells.length; i++) {
        var c = cells[i];
        var slot = document.createElement('span');
        slot.className = 'pb-layout-card__slot-abs';
        slot.setAttribute('aria-hidden', 'true');
        slot.style.left = c.x * 100 + '%';
        slot.style.top = c.y * 100 + '%';
        slot.style.width = c.w * 100 + '%';
        slot.style.height = c.h * 100 + '%';
        inner.appendChild(slot);
      }

      var bar = document.createElement('div');
      bar.className = 'pb-layout-card__footer-abs';
      bar.setAttribute('aria-hidden', 'true');
      bar.style.top = footerTop * 100 + '%';
      bar.style.height = (1 - footerTop) * 100 + '%';

      inner.appendChild(bar);
      diag.appendChild(inner);
      frameEl.appendChild(diag);
    }

    function renderLayouts() {
      var grid = $('#pb-layout-grid');
      if (!grid) return;
      grid.innerHTML = '';
      LAYOUTS.forEach(function (L) {
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'pb-layout-card';
        card.setAttribute('aria-pressed', L.id === selectedLayout.id ? 'true' : 'false');
        card.dataset.layoutId = L.id;

        var frame = document.createElement('div');
        frame.className = 'pb-layout-card__frame';
        if (L.cardThumbUrl) {
          frame.classList.add('pb-layout-card__frame--thumb');
        } else if (L.outW && L.outH) {
          frame.style.setProperty('--pb-layout-preview-ar', L.outW + ' / ' + L.outH);
        }
        buildLayoutCardDiagram(frame, L);

        var lab = document.createElement('div');
        lab.className = 'pb-layout-card__label';
        var t1 = document.createElement('span');
        t1.className = 'pb-layout-card__title';
        t1.textContent = L.cardTitle || '4 ảnh';
        var t2 = document.createElement('span');
        t2.className = 'pb-layout-card__sub';
        t2.textContent = L.label || '';
        lab.appendChild(t1);
        lab.appendChild(t2);

        card.appendChild(frame);
        card.appendChild(lab);
        card.addEventListener('click', function () {
          selectedLayout = L;
          grid.querySelectorAll('.pb-layout-card').forEach(function (c) {
            c.setAttribute('aria-pressed', c.dataset.layoutId === L.id ? 'true' : 'false');
          });
          refreshSelectionSummary();
          applyPreviewAspect(L);
          rebuildFilmstrip();
        });
        grid.appendChild(card);
      });
    }

    function renderFilters() {
      var grid = $('#pb-filter-grid');
      if (!grid) return;
      grid.innerHTML = '';
      FILTERS_UI.forEach(function (F) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pb-filter-card';
        btn.dataset.filter = F.id;
        btn.setAttribute('aria-pressed', F.id === filterId ? 'true' : 'false');
        btn.innerHTML = '<div class="pb-filter-card__shot"></div><span class="pb-filter-card__name"></span>';
        btn.querySelector('.pb-filter-card__name').textContent = F.name;
        btn.addEventListener('click', function () {
          filterId = F.id;
          grid.querySelectorAll('.pb-filter-card').forEach(function (c) {
            c.setAttribute('aria-pressed', c.dataset.filter === filterId ? 'true' : 'false');
          });
          syncFilterStrengthUI();
          setPreviewFilter();
          refreshSelectionSummary();
        });
        grid.appendChild(btn);
      });
    }

    function renderSwatches() {
      var row = $('#pb-swatches');
      if (!row) return;
      row.innerHTML = '';
      SWATCH_COLORS.forEach(function (col) {
        var customOn = col === 'custom' && lightColor && SWATCH_COLORS.indexOf(lightColor) === -1;
        var active =
          (col === null && lightColor === null) ||
          (col !== null && col !== 'custom' && lightColor === col) ||
          customOn;

        if (col === 'custom') {
          /* Dùng y hệt class của frame color picker — đảm bảo tròn mọi thiết bị */
          var wrap = document.createElement('label');
          wrap.className = 'pb-frame-color-wrap' + (active ? ' pb-frame-color-wrap--active' : '');
          wrap.title = 'Chọn màu tuỳ chỉnh phát sáng';
          wrap.setAttribute('aria-label', 'Chọn màu tuỳ chỉnh phát sáng');
          wrap.setAttribute('role', 'button');

          var face = document.createElement('span');
          face.className = 'pb-frame-color-face';
          face.setAttribute('aria-hidden', 'true');

          var inp = document.createElement('input');
          inp.type = 'color';
          inp.className = 'pb-frame-color-input';
          inp.setAttribute('aria-label', 'Chọn màu tuỳ chỉnh phát sáng');
          try { inp.value = colorPickerHexValue(); } catch (e1) {}

          inp.addEventListener('input', function () {
            lightColor = inp.value;
            /* Cập nhật viền active */
            var allWraps = row.querySelectorAll('.pb-frame-color-wrap');
            allWraps.forEach(function(w){ w.classList.add('pb-frame-color-wrap--active'); });
            row.querySelectorAll('.pb-swatch').forEach(function(s){
              s.setAttribute('aria-pressed', 'false');
            });
            refreshOuterGlow();
          });
          inp.addEventListener('change', function () {
            lightColor = inp.value;
            renderSwatches();
            refreshOuterGlow();
          });

          wrap.appendChild(face);
          wrap.appendChild(inp);
          row.appendChild(wrap);
          return;
        }

        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'pb-swatch' + (active ? ' pb-swatch--active' : '');
        if (col === null) {
          b.classList.add('pb-swatch--none');
          b.title = 'Nền sạch — sáng nhẹ như studio';
          b.setAttribute('aria-label', 'Nền trắng mặc định, phát sáng nhẹ');
        } else {
          b.style.background = col;
          b.title = col;
        }
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
        b.addEventListener('click', function () {
          lightColor = col;
          renderSwatches();
          refreshOuterGlow();
        });
        row.appendChild(b);
      });
    }

    function rebuildFilmstrip() {
      if (!filmstripEl) return;
      filmstripEl.innerHTML = '';
      var n = selectedLayout && selectedLayout.cells ? selectedLayout.cells.length : 0;
      var show = selectedLayout && selectedLayout.templateEditor && n === 4;
      filmstripEl.hidden = !show;
      if (!show) return;
      var c0 = selectedLayout.cells && selectedLayout.cells[0];
      if (c0 && selectedLayout.outW && selectedLayout.outH) {
        var pw = Math.max(1, Math.round(c0.w * selectedLayout.outW));
        var ph = Math.max(1, Math.round(c0.h * selectedLayout.outH));
        filmstripEl.style.setProperty('--pb-filmstrip-aspect', pw + ' / ' + ph);
      } else {
        filmstripEl.style.removeProperty('--pb-filmstrip-aspect');
      }
      for (var si = 0; si < n; si++) {
        var li = document.createElement('div');
        li.className = 'pb-filmstrip__slot';
        li.setAttribute('role', 'listitem');
        li.dataset.index = String(si);
        filmstripEl.appendChild(li);
      }
    }

    function setFilmstripThumb(index, frameCanvas, layout) {
      if (!filmstripEl || filmstripEl.hidden) return;
      var slot = filmstripEl.querySelector('.pb-filmstrip__slot[data-index="' + index + '"]');
      if (!slot || !frameCanvas) return;
      slot.classList.add('pb-filmstrip__slot--filled');
      slot.innerHTML = '';
      var sc = document.createElement('canvas');
      sc.className = 'pb-filmstrip__canvas';
      slot.appendChild(sc);

      function paintThumb() {
        var cssW = Math.max(1, Math.round(slot.clientWidth));
        var cssH = Math.max(1, Math.round(slot.clientHeight));
        var c0 = layout.cells && layout.cells[0];
        var ar =
          c0 && layout.outW && layout.outH
            ? (c0.w * layout.outW) / (c0.h * layout.outH)
            : 1;
        var usedFallback = cssW < 4 || cssH < 4;
        if (usedFallback) {
          cssW = 88;
          cssH = Math.max(1, Math.round(cssW / ar));
        }
        var dpr = Math.min(3, Math.max(1, typeof window.devicePixelRatio === 'number' ? window.devicePixelRatio : 1));
        var bw = Math.max(1, Math.round(cssW * dpr));
        var bh = Math.max(1, Math.round(cssH * dpr));
        sc.width = bw;
        sc.height = bh;
        var sctx = sc.getContext('2d');
        if (!sctx) return;
        if ('imageSmoothingQuality' in sctx) sctx.imageSmoothingQuality = 'high';
        sctx.drawImage(frameCanvas, 0, 0, frameCanvas.width, frameCanvas.height, 0, 0, bw, bh);
        if (usedFallback) {
          sc.style.position = 'relative';
          sc.style.width = cssW + 'px';
          sc.style.height = cssH + 'px';
          sc.style.margin = '0 auto';
        } else {
          sc.style.position = '';
          sc.style.width = '';
          sc.style.height = '';
          sc.style.margin = '';
        }
      }

      requestAnimationFrame(function () {
        requestAnimationFrame(paintThumb);
      });
    }

    function showEditorPhase() {
      if (capturePhase) capturePhase.hidden = true;
      if (editorPhase) editorPhase.hidden = false;
      stopCamera();
      if (bgPatternToggle) bgPatternToggle.setAttribute('aria-pressed', bgPatternOn ? 'true' : 'false');
      renderFrameMatSwatches();
      redrawEditorCanvas();
    }

    function showCapturePhase() {
      capturedFrames = [];
      if (editorPhase) editorPhase.hidden = true;
      if (capturePhase) capturePhase.hidden = false;
      rebuildFilmstrip();
      /* Đã từng cấp → hiện chờ nhẹ thay vì trống trơn */
      var wasPreviouslyGranted = false;
      try { wasPreviouslyGranted = localStorage.getItem('pb_cam_granted') === '1'; } catch(e) {}
      if (wasPreviouslyGranted) showMsg('Đang kết nối camera…');
      startCamera()
        .then(function () {
          try { localStorage.setItem('pb_cam_granted', '1'); } catch(e) {}
          showMsg('');
          updateCameraChrome();
        })
        .catch(function () {
          try { localStorage.removeItem('pb_cam_granted'); } catch(e) {}
          updateCameraChrome();
          showMsg(
            'Không mở được camera. iPhone: Cài đặt → Safari → Camera → Cho phép cho trang web. Android: nhấn biểu tượng khóa thanh địa chỉ → Quyền → Camera. Sau đó nhấn Bật camera.'
          );
        });
    }

    function renderFrameMatSwatches() {
      if (!frameSwatchesEl) return;
      frameSwatchesEl.innerHTML = '';

      /* Các màu cố định */
      FRAME_MAT_COLORS.forEach(function (hex) {
        var active = frameMatColor === hex;
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'pb-frame-mat-swatch';
        b.style.background = hex;
        b.style.backgroundColor = hex;
        b.title = hex;
        b.setAttribute('aria-label', 'Màu khung ' + hex);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
        b.addEventListener('click', function () {
          frameMatColor = hex;
          syncFrameSwatchActive();
          if (bgPatternOn) {
            bgPatternOn = false;
            if (bgPatternToggle) bgPatternToggle.setAttribute('aria-pressed', 'false');
          }
          redrawEditorCanvas();
        });
        frameSwatchesEl.appendChild(b);
      });

      /* Nút màu tùy chỉnh (cầu vồng) — mở native color picker trên mọi thiết bị */
      var isCustom = !FRAME_MAT_COLORS.includes(frameMatColor);
      var wrap = document.createElement('label');
      wrap.className = 'pb-frame-color-wrap' + (isCustom ? ' pb-frame-color-wrap--active' : '');
      wrap.title = 'Chọn màu khung tùy ý';
      wrap.setAttribute('aria-label', 'Chọn màu khung tùy chỉnh');
      wrap.setAttribute('role', 'button');

      var face = document.createElement('span');
      face.className = 'pb-frame-color-face';
      face.setAttribute('aria-hidden', 'true');

      var inp = document.createElement('input');
      inp.type = 'color';
      inp.className = 'pb-frame-color-input';
      inp.setAttribute('aria-label', 'Chọn màu khung tùy chỉnh');
      try { inp.value = frameMatCustomColor; } catch(e) {}

      inp.addEventListener('input', function () {
        frameMatCustomColor = inp.value;
        frameMatColor = inp.value;
        syncFrameSwatchActive();
        if (bgPatternOn) {
          bgPatternOn = false;
          if (bgPatternToggle) bgPatternToggle.setAttribute('aria-pressed', 'false');
        }
        redrawEditorCanvas();
      });
      inp.addEventListener('change', function () {
        frameMatCustomColor = inp.value;
        frameMatColor = inp.value;
        syncFrameSwatchActive();
        redrawEditorCanvas();
      });

      wrap.appendChild(face);
      wrap.appendChild(inp);
      frameSwatchesEl.appendChild(wrap);
    }

    function syncFrameSwatchActive() {
      if (!frameSwatchesEl) return;
      var isCustom = !FRAME_MAT_COLORS.includes(frameMatColor);
      frameSwatchesEl.querySelectorAll('.pb-frame-mat-swatch').forEach(function (x) {
        var active = x.style.backgroundColor === '' ?
          x.title === frameMatColor :
          hexNorm(x.title) === hexNorm(frameMatColor);
        x.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      var wrap = frameSwatchesEl.querySelector('.pb-frame-color-wrap');
      if (wrap) {
        if (isCustom) {
          wrap.classList.add('pb-frame-color-wrap--active');
        } else {
          wrap.classList.remove('pb-frame-color-wrap--active');
        }
      }
    }

    function hexNorm(h) {
      return String(h || '').toLowerCase().replace(/\s/g, '');
    }

    function redrawEditorCanvas() {
      if (!editorCanvas || !capturedFrames.length) return;

      /** DPI-aware canvas display — vẽ ở resolution gốc,
       *  CSS scale xuống CSS px để sắc nét trên retina */
      function applyToEditorCanvas(out) {
        if (!out) return;
        editorCanvas.width = out.width;
        editorCanvas.height = out.height;
        var ectx = editorCanvas.getContext('2d');
        if ('imageSmoothingQuality' in ectx) ectx.imageSmoothingQuality = 'high';
        ectx.drawImage(out, 0, 0);
        /* Đảm bảo CSS width/height khớp container, canvas nội bộ giữ full-res */
        editorCanvas.style.width = '100%';
        editorCanvas.style.height = 'auto';
      }

      function finishClean(logo, pattern) {
        var out = compositeCleanLayout(
          selectedLayout,
          capturedFrames,
          frameMatColor,
          logo,
          bgPatternOn,
          pattern || null
        );
        applyToEditorCanvas(out);
      }

      if (selectedLayout.cleanComposite) {
        loadImageElement(PB_TEMPLATE_SRC, function (pattern) {
          loadImageElement(PB_LOGO_SRC, function (logo) {
            if (!logo) {
              loadImageElement(PB_LOGO_FB, function (lg2) {
                finishClean(lg2, pattern);
              });
            } else {
              finishClean(logo, pattern);
            }
          });
        });
        return;
      }

      loadImageElement(PB_TEMPLATE_SRC, function (tpl) {
        loadImageElement(PB_LOGO_SRC, function (logo) {
          if (!logo) {
            loadImageElement(PB_LOGO_FB, function (lg2) {
              finishRedraw(tpl, lg2);
            });
          } else {
            finishRedraw(tpl, logo);
          }
        });
      });

      function finishRedraw(tpl, logo) {
        if (tpl && capturedFrames.length >= 4 && selectedLayout.outW && selectedLayout.outH) {
          var out = compositeTemplateFrame(
            tpl,
            logo,
            capturedFrames,
            frameMatColor,
            true,
            selectedLayout.outW,
            selectedLayout.outH
          );
          if (out) {
            applyToEditorCanvas(out);
            return;
          }
        }
        var fb = compositeLayout(selectedLayout, capturedFrames);
        applyToEditorCanvas(fb);
      }
    }

    document.querySelectorAll('[data-timer]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        timerSec = parseInt(btn.getAttribute('data-timer'), 10) || 3;
        document.querySelectorAll('[data-timer]').forEach(function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
      });
    });

    document.querySelectorAll('.pb-tool').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tool = btn.getAttribute('data-open-tool');
        document.querySelectorAll('.pb-tool').forEach(function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        switchPanel(tool);
        openModal();
      });
    });

    modalTabs.forEach(function (t) {
      t.addEventListener('click', function () {
        switchPanel(t.getAttribute('data-tab'));
      });
    });

    var back = $('.pb-modal__backdrop');
    if (back) back.addEventListener('click', closeModal);
    var mx = $('.pb-modal__close');
    if (mx) mx.addEventListener('click', closeModal);

    var range = $('#pb-light-range');
    var rangeOut = $('#pb-light-out');
    if (range && rangeOut) {
      range.addEventListener('input', function () {
        lightPct = parseInt(range.value, 10);
        rangeOut.textContent = lightPct + '%';
        refreshOuterGlow();
      });
    }

    var modalBody = $('.pb-modal__body');
    if (modalBody) {
      modalBody.addEventListener('input', function (e) {
        var t = e.target;
        if (!t || t.id !== 'pb-filter-range') return;
        filterStrengthPct = parseInt(String(t.value), 10);
        if (Number.isNaN(filterStrengthPct)) filterStrengthPct = 100;
        filterStrengthPct = Math.min(300, Math.max(0, filterStrengthPct));
        var filterRangeOut = $('#pb-filter-out');
        if (filterRangeOut) filterRangeOut.textContent = filterStrengthPct + '%';
        setPreviewFilter();
        refreshSelectionSummary();
      });
    }

    function waitCountdown(sec, onTick, done) {
      var n = sec;
      function step() {
        if (n > 0) {
          onTick(n);
          n -= 1;
          setTimeout(step, 1000);
        } else {
          onTick(0);
          done();
        }
      }
      step();
    }

    var capBtn = $('.pb-capture');
    if (capBtn) {
      capBtn.addEventListener('click', function () {
        var layout = selectedLayout;
        var need = layout.cells.length;
        var frames = new Array(need);
        var busy = false;

        function sourceReady() {
          if (preview.classList.contains('is-static')) {
            return staticImg.complete && staticImg.naturalWidth > 0;
          }
          return video.readyState >= 2 && video.videoWidth > 0;
        }

        if (!sourceReady()) {
          showMsg('Chưa có hình từ camera. Hãy cấp quyền camera.');
          return;
        }

        if (busy) return;
        busy = true;
        capBtn.disabled = true;
        progEl.hidden = false;
        showMsg('');
        rebuildFilmstrip();

        function shotOne(idx, cb) {
          waitCountdown(
            timerSec,
            function (n) {
              if (n > 0) {
                cdEl.hidden = false;
                cdEl.textContent = String(n);
              } else {
                cdEl.hidden = true;
              }
            },
            function () {
              var c0 = layout.cells && layout.cells[0];
              var cellW = c0 && layout.outW ? Math.round(c0.w * layout.outW) : 600;
              var cellH = c0 && layout.outH ? Math.round(c0.h * layout.outH) : 600;
              var c = captureSourceFrame(
                preview.classList.contains('is-static') ? null : video,
                staticImg,
                mirrorForCapture(),
                filterId,
                filterStrengthPct,
                cellW,
                cellH
              );
              if (c) {
                frames[idx] = c;
                if (layout.templateEditor) setFilmstripThumb(idx, c, layout);
              }
              progEl.textContent = 'Đã chụp ' + (idx + 1) + ' / ' + need;
              cb();
            }
          );
        }

        var i = 0;
        function next() {
          if (i >= need) {
            progEl.hidden = true;
            cdEl.hidden = true;
            capBtn.disabled = false;
            busy = false;
            if (layout.templateEditor) {
              capturedFrames = frames;
              showEditorPhase();
              return;
            }
            var out = compositeLayout(layout, frames);
            if (out) triggerDownload(out);
            else showMsg('Không ghép được ảnh. Thử lại nhé.');
            return;
          }
          shotOne(i, function () {
            i += 1;
            next();
          });
        }
        progEl.textContent = 'Chuẩn bị… (' + need + ' ảnh)';
        next();
      });
    }

    if (bgPatternToggle) {
      bgPatternToggle.addEventListener('click', function () {
        bgPatternOn = !bgPatternOn;
        bgPatternToggle.setAttribute('aria-pressed', bgPatternOn ? 'true' : 'false');
        redrawEditorCanvas();
      });
    }

    if (dlBtn && editorCanvas) {
      dlBtn.addEventListener('click', function () {
        if (!editorCanvas.width || !editorCanvas.height) return;
        triggerDownload(editorCanvas);
      });
    }

    if (retakeBtn) {
      retakeBtn.addEventListener('click', function () {
        showMsg('');
        showCapturePhase();
      });
    }

    if (flipBtn) {
      flipBtn.addEventListener('click', function () {
        if (preview.classList.contains('is-static')) return;
        var prev = facingMode;
        facingMode = facingMode === 'user' ? 'environment' : 'user';
        startCamera()
          .then(function () {
            updateCameraChrome();
          })
          .catch(function () {
            facingMode = prev;
            applyFacingMirrorClass();
            updateCameraChrome();
            showMsg('Không đổi được camera. Thử lại hoặc kiểm tra quyền truy cập.');
          });
      });
    }

    if (resumeCamBtn) {
      resumeCamBtn.addEventListener('click', function () {
        preview.classList.remove('is-static');
        facingMode = 'user';
        showMsg('Đang bật camera…');
        startCamera()
          .then(function () {
            showMsg('');
            updateCameraChrome();
          })
          .catch(function () {
            updateCameraChrome();
            showMsg('Chưa bật được camera. Cho phép quyền Camera trong cài đặt trình duyệt.');
          });
      });
    }

    updateCameraChrome();

    /**
     * Khởi động camera thông minh — dùng Permissions API nếu có:
     *   - 'granted'  → start thầm lặng (thiết bị đã nhớ quyền)
     *   - 'prompt'   → thử start (desktop OK); mobile có thể cần tap nút
     *   - 'denied'   → chỉ hiện hướng dẫn, không gọi getUserMedia vô ích
     * localStorage 'pb_cam_granted' = '1' giúp tránh hiện thông báo lỗi
     * trong khoảnh khắc browser đang xử lý quyền đã được ghi nhớ.
     */
    function bootCamera() {
      var wasPreviouslyGranted = false;
      try { wasPreviouslyGranted = localStorage.getItem('pb_cam_granted') === '1'; } catch(e) {}

      function onSuccess() {
        try { localStorage.setItem('pb_cam_granted', '1'); } catch(e) {}
        showMsg('');
        updateCameraChrome();
      }

      function onFail() {
        try { localStorage.removeItem('pb_cam_granted'); } catch(e) {}
        updateCameraChrome();
        showMsg(
          'Không mở được camera. iPhone: Cài đặt → Safari → Camera → Cho phép cho trang web. Android: nhấn biểu tượng khóa thanh địa chỉ → Quyền → Camera. Sau đó nhấn Bật camera.'
        );
      }

      /* Đã từng cấp quyền → hiện thông báo chờ nhẹ thay vì thông báo lỗi ngay */
      if (wasPreviouslyGranted) {
        showMsg('Đang kết nối camera…');
      }

      /* Dùng Permissions API nếu browser hỗ trợ */
      if (navigator.permissions && typeof navigator.permissions.query === 'function') {
        navigator.permissions.query({ name: 'camera' }).then(function (status) {

          if (status.state === 'denied') {
            /* Quyền bị từ chối hoàn toàn — không cần gọi getUserMedia */
            try { localStorage.removeItem('pb_cam_granted'); } catch(e) {}
            updateCameraChrome();
            showMsg(
              'Camera bị chặn. Vào cài đặt trình duyệt → Quyền → Camera, cho phép trang web này, rồi tải lại trang.'
            );
            return;
          }

          /* 'granted' hoặc 'prompt' — thử start */
          startCamera().then(onSuccess).catch(function () {
            if (status.state === 'granted') {
              /* Browser báo đã cấp nhưng vẫn lỗi → thiết bị/tab bất thường */
              onFail();
            } else {
              /* 'prompt' — chưa cấp quyền lần nào, hiện hướng dẫn bình thường */
              onFail();
            }
          });

          /* Lắng nghe khi người dùng thay đổi quyền trong lúc dùng trang */
          status.onchange = function () {
            if (status.state === 'granted' && !currentStream) {
              showMsg('Đang kết nối camera…');
              startCamera().then(onSuccess).catch(onFail);
            } else if (status.state === 'denied') {
              try { localStorage.removeItem('pb_cam_granted'); } catch(e) {}
              stopCamera();
              updateCameraChrome();
              showMsg('Camera bị chặn. Cho phép lại trong cài đặt trình duyệt, rồi tải lại trang.');
            }
          };

        }).catch(function () {
          /* Permissions API không hỗ trợ query 'camera' (một số browser cũ) */
          startCamera().then(onSuccess).catch(onFail);
        });

      } else {
        /* Không có Permissions API — fallback trực tiếp */
        startCamera().then(onSuccess).catch(onFail);
      }
    }

    bootCamera();

    hydrateLayoutCardThumbs();
    renderLayouts();
    renderFilters();
    syncFilterStrengthUI();
    renderSwatches();
    setPreviewFilter();
    refreshOuterGlow();
    refreshSelectionSummary();
    applyPreviewAspect(selectedLayout);
    rebuildFilmstrip();

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && !modal.hidden) closeModal();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
