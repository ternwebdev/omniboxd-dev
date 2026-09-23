import React, { useState, useRef, useEffect } from 'react';
import { toBlob, toPng } from 'html-to-image';
import { X, Copy, Download, Share2, Check, MessageSquare, Twitter, Facebook, Sparkles, Moon, Sun, Monitor } from 'lucide-react';
import { ReviewItem, ThemeMode } from '../types';
import { COMPANY_COLORS } from '../lib/constants';
import { StarRating } from './StarRating';
import { useScrollLock } from '../lib/scrollLock';

interface ShareModalProps {
  review: ReviewItem | null;
  currentTheme?: ThemeMode;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ review, currentTheme, onClose }) => {
  const defaultTheme: ThemeMode = currentTheme || (document.documentElement.dataset.theme as ThemeMode) || 'dark';
  const [cardTheme, setCardTheme] = useState<ThemeMode>(defaultTheme);
  const [renderedImageUrl, setRenderedImageUrl] = useState<string | null>(null);
  const [renderedBlob, setRenderedBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Lock background scroll when share modal is active
  useScrollLock(Boolean(review));

  // Back button popstate support
  useEffect(() => {
    if (!review) return;

    const modalSessionKey = 'omniboxd_share_modal_' + Date.now();
    window.history.pushState({ modal: modalSessionKey }, '');

    let closedByPop = false;
    const handlePopState = () => {
      closedByPop = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (!closedByPop && window.history.state?.modal === modalSessionKey) {
        window.history.back();
      }
    };
  }, [review?.id]);

  if (!review) return null;

  const companyName = review.lines?.companies?.short_name || 'Bondi';
  const companyColor = review.lines?.companies?.color || COMPANY_COLORS[companyName] || '#555f5e';
  const lineNumber = review.lines?.number || '—';
  const authorName = review.users?.username || 'viajero';
  const ratingStars = '★'.repeat(Math.floor(review.rating)) + (review.rating % 1 >= 0.5 ? '½' : '');
  const postUrl = `${window.location.origin}/?review=${review.id}`;

  // Theme-specific styles for the ticket card
  const themeStyles = {
    dark: {
      cardBg: '#0f1212',
      border: '#283030',
      text: '#ede6d8',
      textMuted: '#859593',
      textBody: '#d4ccc0',
      subBoxBg: '#181e1e',
      subBoxBorder: '#283030',
      tagBg: '#1e2323',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeBorder: 'rgba(16, 185, 129, 0.4)',
      badgeText: '#34d399',
      footerBorder: '#283030',
      bgCapture: '#0d0f0f'
    },
    medium: {
      cardBg: '#242932',
      border: '#3b4453',
      text: '#e8e4dc',
      textMuted: '#959fad',
      textBody: '#cbd5e1',
      subBoxBg: '#2e3541',
      subBoxBorder: '#3b4453',
      tagBg: '#373f4d',
      badgeBg: 'rgba(52, 211, 153, 0.15)',
      badgeBorder: 'rgba(52, 211, 153, 0.4)',
      badgeText: '#34d399',
      footerBorder: '#3b4453',
      bgCapture: '#1c1f24'
    },
    light: {
      cardBg: '#f8f5ee',
      border: '#d3cabd',
      text: '#1c2020',
      textMuted: '#5e6c6b',
      textBody: '#2d3434',
      subBoxBg: '#f0ebe0',
      subBoxBorder: '#dfd7cb',
      tagBg: '#e5ded2',
      badgeBg: 'rgba(21, 128, 61, 0.12)',
      badgeBorder: 'rgba(21, 128, 61, 0.35)',
      badgeText: '#15803d',
      footerBorder: '#dfd7cb',
      bgCapture: '#ede8dc'
    }
  }[cardTheme];

  // Re-render image when modal opens or theme changes
  useEffect(() => {
    let active = true;

    const generate = async () => {
      if (!cardRef.current) return;
      setIsGenerating(true);
      setErrorMsg(null);

      try {
        const el = cardRef.current;
        // Ensure natural height is unconstrained on desktop or mobile
        const renderWidth = 390;
        const renderHeight = Math.max(el.scrollHeight, el.offsetHeight, 320);

        const renderOptions = {
          cacheBust: true,
          quality: 0.95,
          pixelRatio: 2,
          width: renderWidth,
          height: renderHeight,
          backgroundColor: themeStyles.bgCapture,
          skipFonts: true,
          style: {
            position: 'static',
            transform: 'none',
            maxHeight: 'none',
            height: `${renderHeight}px`,
            overflow: 'visible'
          }
        };

        const dataUrl = await toPng(el, renderOptions);
        const blob = await toBlob(el, renderOptions);

        if (active) {
          setRenderedImageUrl(dataUrl);
          setRenderedBlob(blob);
        }
      } catch (err: any) {
        console.warn('html-to-image render notice:', err);
        if (active) {
          setErrorMsg('Generando vista previa...');
        }
      } finally {
        if (active) setIsGenerating(false);
      }
    };

    const timer = setTimeout(generate, 160);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [review, cardTheme]);

  // Social texts
  // Spaced out WhatsApp text with breathing room and clear line breaks
  const whatsappText =
    `🚌 *Línea ${lineNumber} · ${companyName}*\n\n` +
    `⭐ *Calificación:* ${review.rating.toFixed(1)} / 5 estrellas\n` +
    (review.route_label ? `📍 *Recorrido:* ${review.route_label}\n` : '') +
    (review.vehicle_number ? `🔢 *Coche:* #${review.vehicle_number}\n` : '') +
    `\n` +
    `💬 *Opinión de @${authorName}:*\n\n` +
    `"${review.body}"\n\n` +
    (review.tags && review.tags.length > 0
      ? `🏷️ *Etiquetas:* ${review.tags.map((t) => (t.emoji ? `${t.emoji} ` : '') + t.label).join(' · ')}\n\n`
      : '') +
    `📲 *Leelo completo en:* ${postUrl}`;

  // Twitter/X: text capped comfortably to 280 characters, leaving room for link & hashtag
  const maxTwitterBody = 120;
  const twitterBody = review.body.length > maxTwitterBody ? `${review.body.slice(0, maxTwitterBody).trim()}…` : review.body;
  const twitterText = `🚌 Línea ${lineNumber} (${companyName}) · ${review.rating}★\n"${twitterBody}"\n\nPor @${authorName}\n${postUrl}\n#omniboxd`;

  // Standard share text
  const standardShareText =
    `🚌 Línea ${lineNumber} · ${companyName} (${review.rating} ★)\n` +
    (review.route_label ? `📍 Recorrido: ${review.route_label}\n` : '') +
    `"${review.body.slice(0, 160)}${review.body.length > 160 ? '…' : ''}"\n\n` +
    `Por @${authorName} en omniboxd\n` +
    `${postUrl}\n#omniboxd`;

  // 1. Copy image to clipboard
  const handleCopyImage = async () => {
    if (!renderedBlob) {
      setShareNotice('Aguardá un instante mientras se termina de renderizar el boleto.');
      return;
    }
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': renderedBlob })
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
      } else {
        handleDownload();
      }
    } catch (e) {
      handleDownload();
      setShareNotice('Tu navegador no admite copiar imágenes directamente al portapapeles. ¡Descargamos el boleto en PNG para que puedas adjuntarlo!');
    }
  };

  // 2. Download PNG
  const handleDownload = () => {
    if (!renderedImageUrl) {
      setShareNotice('Generando imagen para la descarga...');
      return;
    }
    const a = document.createElement('a');
    a.href = renderedImageUrl;
    a.download = `omniboxd-${lineNumber.toLowerCase()}-${companyName.toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 3. Native Share (Files or Text)
  const handleNativeShare = async () => {
    setShareNotice(null);
    let sharedFiles = false;

    try {
      if (renderedBlob && navigator.canShare) {
        const file = new File([renderedBlob], `omniboxd-${lineNumber}.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `omniboxd — Línea ${lineNumber}`,
            text: `Omniposteo en Línea ${lineNumber} (${companyName}) por @${authorName} · ${postUrl}`
          });
          sharedFiles = true;
          return;
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      console.warn('File share not supported or failed:', e);
    }

    if (!sharedFiles) {
      handleDownload();
      setShareNotice('Tu navegador no permite adjuntar archivos directamente. Descargamos la imagen PNG automáticamente para que la compartas en tus historias o redes.');

      if (navigator.share) {
        try {
          await navigator.share({
            title: `omniboxd — Línea ${lineNumber}`,
            text: standardShareText,
            url: postUrl
          });
        } catch (err: any) {
          if (err.name !== 'AbortError') handleCopyText();
        }
      } else {
        handleCopyText();
      }
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(standardShareText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch (e) {
      prompt('Copiá el texto:', standardShareText);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      prompt('Copiá el link al omniposteo:', postUrl);
    }
  };

  const handleTwitterClick = async () => {
    if (renderedBlob && navigator.clipboard && window.ClipboardItem) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': renderedBlob })
        ]);
        setShareNotice('📋 ¡Boleto en imagen copiado! Pegalo con Ctrl+V en tu tweet para mostrarlo completo.');
      } catch (e) {}
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150 touch-none"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-t-2xl sm:rounded-2xl max-w-md md:max-w-3xl lg:max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative my-auto max-h-[95vh] overflow-y-auto overscroll-contain touch-auto modal-scroll-area"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="text-base font-display font-bold text-[var(--text)]">Compartir omnipost</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Boleto HD
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>


        {/* Offscreen element for html-to-image capture (no overflow constraints to prevent desktop text cropping) */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: '0',
            width: '390px',
            minHeight: 'auto',
            maxHeight: 'none',
            overflow: 'visible',
            zIndex: -999,
            pointerEvents: 'none',
            opacity: 0
          }}
        >
          <div
            ref={cardRef}
            className="w-[390px] p-5 rounded-2xl shadow-2xl font-sans"
            style={{
              backgroundColor: themeStyles.cardBg,
              color: themeStyles.text,
              border: `1px solid ${themeStyles.border}`,
              height: 'auto',
              minHeight: 'auto',
              maxHeight: 'none',
              overflow: 'visible',
              fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif"
            }}
          >
            {/* Header ticket strip */}
            <div
              className="flex items-center justify-between pb-3 mb-3"
              style={{ borderBottom: `1px solid ${themeStyles.border}` }}
            >
              <div className="flex items-center gap-2">
                <img src="/img/isotipo-omniboxd.svg" alt="omniboxd" className="w-6 h-6 rounded-full bg-white object-contain shadow-xs" />
                <span className="font-bold text-amber-400 tracking-tight text-lg">omniboxd</span>
              </div>
              <span
                className="text-[11px] font-mono px-2 py-0.5 rounded"
                style={{
                  backgroundColor: themeStyles.badgeBg,
                  borderColor: themeStyles.badgeBorder,
                  color: themeStyles.badgeText,
                  borderWidth: '1px'
                }}
              >
                BOLETO URBANO
              </span>
            </div>

            {/* Line number and Company */}
            <div className="flex items-center justify-between my-2">
              <div className="flex items-center gap-2.5">
                <span
                  className="px-3 py-1 rounded-md font-mono font-bold text-lg text-white shadow-sm"
                  style={{ backgroundColor: companyColor }}
                >
                  {lineNumber}
                </span>
                <div>
                  <span className="font-bold text-base block leading-tight">{companyName}</span>
                  {review.vehicle_number && (
                    <span
                      className="text-[11px] font-mono"
                      style={{ color: themeStyles.textMuted }}
                    >
                      Coche #{review.vehicle_number}
                    </span>
                  )}
                </div>
              </div>
              <StarRating rating={review.rating} size="md" colorClass="text-amber-400" />
            </div>

            {/* Route label */}
            {review.route_label && (
              <div
                className="my-2.5 px-2.5 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: themeStyles.subBoxBg,
                  border: `1px solid ${themeStyles.subBoxBorder}`,
                  color: themeStyles.textMuted
                }}
              >
                📍 {review.route_label}
              </div>
            )}

            {/* Review body: full text rendered with no line clamping */}
            <p
              className="my-3 text-sm leading-relaxed italic whitespace-pre-wrap break-words"
              style={{ color: themeStyles.textBody }}
            >
              "{review.body}"
            </p>

            {/* Tags */}
            {review.tags && review.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 my-2">
                {review.tags.slice(0, 5).map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: themeStyles.tagBg,
                      border: `1px solid ${themeStyles.border}`,
                      color: themeStyles.textMuted
                    }}
                  >
                    {t.emoji ? `${t.emoji} ` : ''}{t.label}
                  </span>
                ))}
              </div>
            )}

            {/* Footer author */}
            <div
              className="pt-3 mt-3 flex items-center justify-between text-xs"
              style={{
                borderTop: `1px solid ${themeStyles.footerBorder}`,
                color: themeStyles.textMuted
              }}
            >
              <span>Viajante: <strong style={{ color: themeStyles.text }}>@{authorName}</strong></span>
              <span className="font-mono text-[11px]">omniboxd.netlify.app</span>
            </div>
          </div>
        </div>

        {/* Responsive layout: 1 col on mobile, 2 cols on tablets & desktops */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Left Column: Theme Picker & Live Preview */}
          <div className="md:col-span-6 lg:col-span-5 flex flex-col items-center space-y-3">
            {/* Theme selector for the card */}
            <div className="w-full flex items-center justify-between bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--border)]">
              <span className="text-[11px] font-medium text-[var(--text-muted)] px-2">Estilo:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCardTheme('dark')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    cardTheme === 'dark'
                      ? 'bg-amber-400 text-black shadow-xs font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <Moon className="w-3 h-3" />
                  <span>Oscuro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCardTheme('medium')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    cardTheme === 'medium'
                      ? 'bg-amber-400 text-black shadow-xs font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  <span>Medio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCardTheme('light')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    cardTheme === 'light'
                      ? 'bg-amber-400 text-black shadow-xs font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <Sun className="w-3 h-3" />
                  <span>Claro</span>
                </button>
              </div>
            </div>

            {/* Live preview image */}
            <div className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-3 flex flex-col items-center justify-center min-h-[220px]">
              {renderedImageUrl ? (
                <div className="relative group w-full flex flex-col items-center">
                  <img
                    src={renderedImageUrl}
                    alt="Vista previa del omnipost"
                    className="max-h-72 sm:max-h-[360px] md:max-h-[420px] w-auto object-contain rounded-lg shadow-md border border-[var(--border)]"
                  />
                  <span className="text-[11px] text-[var(--text-muted)] mt-2 text-center">
                    💡 En celulares podés <strong>mantener presionada la imagen</strong> para Guardar o Compartir.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
                  <Sparkles className="w-6 h-6 text-amber-400 animate-spin mb-2" />
                  <span className="text-xs">Generando imagen en modo {cardTheme === 'dark' ? 'oscuro' : cardTheme === 'medium' ? 'intermedio' : 'claro'}...</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Actions & Social Sharing */}
          <div className="md:col-span-6 lg:col-span-7 space-y-3.5">
            {/* Action buttons: Copy image & Download PNG */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyImage}
                disabled={isGenerating && !renderedBlob}
                className={`flat-btn justify-center py-2.5 font-semibold text-xs transition-all cursor-pointer ${
                  copiedImage
                    ? 'bg-emerald-500 text-black border-emerald-400'
                    : 'bg-amber-400 hover:bg-amber-300 text-black border-amber-300 font-bold'
                }`}
              >
                {copiedImage ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedImage ? '¡Imagen Copiada!' : 'Copiar Imagen'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={isGenerating && !renderedImageUrl}
                className="flat-btn justify-center py-2.5 font-semibold text-xs hover:text-emerald-400 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar PNG</span>
              </button>
            </div>

            {/* Native share button */}
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full flat-btn justify-center py-2.5 text-xs text-[var(--text)] border-[var(--border)] hover:border-amber-400/50 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>Abrir menú de compartir del sistema</span>
            </button>

            {/* Notice if file sharing restricted */}
            {shareNotice && (
              <div className="p-2.5 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
                <span className="shrink-0 mt-0.5">ℹ️</span>
                <span>{shareNotice}</span>
              </div>
            )}

            {/* Social sharing links */}
            <div>
              <p className="text-[11px] font-display uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Compartir en redes o mensajería:
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flat-btn text-[11px] justify-center py-2 text-emerald-400 hover:bg-emerald-400/10"
                  title="Compartir en WhatsApp con formato ordenado"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleTwitterClick}
                  className="flat-btn text-[11px] justify-center py-2 text-sky-400 hover:bg-sky-400/10"
                  title="Compartir en Twitter/X (¡Copia automáticamente la imagen al portapapeles para pegarla con Ctrl+V!)"
                >
                  <Twitter className="w-3.5 h-3.5" />
                  <span>X / Twitter</span>
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flat-btn text-[11px] justify-center py-2 text-blue-400 hover:bg-blue-400/10"
                  title="Compartir enlace directo en Facebook"
                >
                  <Facebook className="w-3.5 h-3.5" />
                  <span>Facebook</span>
                </a>
              </div>
            </div>

            {/* Quick copy text & direct omnipost link */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyText}
                className="flex-1 flat-btn text-[11px] justify-center py-2"
                title="Copiar texto formateado para redes"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'Texto copiado' : 'Copiar texto'}</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 flat-btn text-[11px] justify-center py-2"
                title="Copiar link directo a este omniposteo"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? '¡Link copiado!' : 'Copiar link'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
