import { useRef, useState } from 'react';
import { downloadNativePagesAsPdf } from '@/lib/pdfDownload';

type DocumentPageProps = {
  title: string;
  src?: string;
};

export default function DocumentPage({ title, src }: DocumentPageProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await downloadNativePagesAsPdf();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;

    const doc = iframe.contentDocument;
    const styleId = 'otf-hide-embedded-print-btn';
    const mobileStyleId = 'otf-embedded-mobile-layout';
    const viewportMetaId = 'otf-embedded-viewport';

    if (!doc.getElementById(styleId)) {
      const style = doc.createElement('style');
      style.id = styleId;
      style.textContent = '.print-btn { display: none !important; }';
      doc.head.appendChild(style);
    }

    if (!doc.getElementById(viewportMetaId)) {
      const meta = doc.createElement('meta');
      meta.id = viewportMetaId;
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0';
      doc.head.appendChild(meta);
    }

    if (!doc.getElementById(mobileStyleId)) {
      const mobileStyle = doc.createElement('style');
      mobileStyle.id = mobileStyleId;
      mobileStyle.textContent = `
        @media (max-width: 900px) {
          html, body {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            overflow-x: hidden !important;
          }
          body {
            min-width: 0 !important;
            padding: 0 !important;
          }
          .wrap {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px 16px 40px !important;
            overflow-x: hidden !important;
          }
          .page, .cover {
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            padding: 24px 16px !important;
            page-break-after: auto !important;
          }
          .page::before, .page::after, .cover::before, .cover::after {
            display: none !important;
          }
          .tbl-wrap {
            overflow-x: hidden !important;
          }
          table {
            width: 100% !important;
            min-width: 0 !important;
            table-layout: fixed !important;
          }
          th, td {
            white-space: normal !important;
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
          }
          .page-header,
          .panel-row,
          .cards-row,
          .prob-row,
          .two-col,
          .irr-row {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .panel,
          .mini-card,
          .prob-card,
          .stat-box,
          .two-col-main,
          .two-col-side {
            min-width: 0 !important;
            width: 100% !important;
          }
          .irr-equals {
            display: none !important;
          }
        }
      `;
      doc.head.appendChild(mobileStyle);
    }
  };

  return (
    <div className="h-full min-h-screen bg-background">
      {/* <button
        type="button"
        onClick={handleExportPdf}
        disabled={isExportingPdf}
        aria-busy={isExportingPdf}
        data-export-pdf="true"
        className="fixed bottom-6 right-6 z-50 rounded-lg bg-primary px-4 py-2.5 font-display text-sm font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70 print:hidden"
      >
        {isExportingPdf ? 'Preparing PDF…' : 'Export as PDF'}
      </button> */}

      {src ? (
        <iframe
          ref={iframeRef}
          title={title}
          src={src}
          onLoad={handleIframeLoad}
          className="h-screen w-full border-0"
        />
      ) : (
        <div className="h-screen w-full" />
      )}
    </div>
  );
}
