// Loaded lazily, only when "Record a clip" is pressed. Records ~6 s of the 3D canvas, then shares or downloads it.
const TYPES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
export const supported = () => typeof MediaRecorder !== 'undefined' && !!HTMLCanvasElement.prototype.captureStream;
export function record(api, btn, secs = 6) {
  const type = TYPES.find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
  // Prefer recording the WebGL canvas directly; fall back to a 2D blit canvas.
  const tryRec = (canvas, labelHint) => new Promise(res => {
    let stream, rec, chunks = [], ok = false;
    try {
      stream = canvas.captureStream(30);
      try { rec = new MediaRecorder(stream, type ? { mimeType: type, videoBitsPerSecond: 3e6 } : undefined); }
      catch (_) { rec = new MediaRecorder(stream); }
    } catch (e) { return res(null); }
    rec.ondataavailable = e => { if (e.data && e.data.size) { chunks.push(e.data); ok = true; } };
    rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); res(ok ? { chunks, mime: (rec.mimeType || type || 'video/webm').split(';')[0] } : null); };
    try { rec.start(200); } catch (e) { stream.getTracks().forEach(t => t.stop()); return res(null); }
    setTimeout(() => { try { if (rec.state !== 'inactive') rec.stop(); } catch (_) { res(null); } }, secs * 1000 + 250);
  });
  const label = btn.textContent; btn.disabled = true; btn.classList.add('rec');
  let left = secs; btn.textContent = `Recording ${left}s`;
  const iv = setInterval(() => { left--; if (left > 0) btn.textContent = `Recording ${left}s`; }, 1000);
  const finish = (blob, mime) => {
    clearInterval(iv); btn.disabled = false; btn.classList.remove('rec'); btn.textContent = label;
    const ext = mime.includes('mp4') ? 'mp4' : 'webm', name = `${api.D.slug}-clip.${ext}`, file = new File([blob], name, { type: mime });
    window.__hiwClip = { size: blob.size, type: mime };
    return (async () => {
      if (!blob.size) { api.toast && api.toast('Nothing was recorded'); return null; }
      try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: api.D.name, text: `${api.D.name}, in 3D`, url: api.D.url }); return blob; } } catch (e) { if (e && e.name === 'AbortError') return blob; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 30000); api.toast && api.toast('Clip downloaded'); return blob;
    })();
  };
  return (async () => {
    // Direct WebGL capture first
    let out = await tryRec(api.canvas);
    if (!out) {
      // 2D blit fallback (needs preserveDrawingBuffer on the WebGL renderer)
      const src = api.canvas, dst = document.createElement('canvas');
      dst.width = 640; dst.height = Math.max(2, Math.round(640 * (src.height || 360) / (src.width || 640)));
      const ctx = dst.getContext('2d', { alpha: false });
      const blit = () => { try { if (src.width) ctx.drawImage(src, 0, 0, dst.width, dst.height); } catch (_) {} };
      api.hooks.add(blit); const tick = setInterval(blit, 32); blit();
      out = await tryRec(dst);
      clearInterval(tick); api.hooks.delete(blit);
    }
    if (!out) { clearInterval(iv); btn.disabled = false; btn.classList.remove('rec'); btn.textContent = label; window.__hiwClip = { size: 0, type: '' }; api.toast && api.toast('Nothing was recorded'); return null; }
    const blob = new Blob(out.chunks, { type: out.mime });
    return finish(blob, out.mime);
  })();
}
