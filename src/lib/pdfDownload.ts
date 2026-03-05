let scriptsReady: Promise<void> | null = null;

const HTML2CANVAS_CDN = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
const JSPDF_CDN = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
const COMBINED_EXPORT_CONTAINER_ID = "otf-combined-native-pdf-export";
const IFRAME_PRINT_STYLE_ID = "otf-hide-embedded-print-btn";
const IFRAME_VIEWPORT_META_ID = "otf-embedded-viewport";
const IFRAME_MOBILE_STYLE_ID = "otf-embedded-mobile-layout";

type NativePdfPage = {
  title: string;
  src: string;
};

export const NATIVE_PDF_PAGES: NativePdfPage[] = [
  { title: "Deals in Words", src: "/track-record-in-words.html" },
  { title: "Our Operators", src: "/operators-our-operators.html" },
  { title: "How We Work Together", src: "/operators-how-we-work-together.html" },
  { title: "Operator Incentives", src: "/operators-incentives.html" },
  { title: "Model Walkthrough", src: "/fund-model-walk-through.html" },
  { title: "Exit Strategy & Liquidity", src: "/fund-model-exit-strategy-liquidity.html" },
  { title: "How We Source", src: "/sourcing.html" },
  { title: "Committed Deals · 2026", src: "/committed-deals-2026.html" },
];

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing?.dataset.loaded === "true") {
      resolve();
      return;
    }

    const script = existing ?? document.createElement("script");
    script.src = src;
    script.async = true;

    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    if (!existing) {
      document.head.appendChild(script);
    }
  });
}

async function ensurePdfLibs(): Promise<void> {
  if (!scriptsReady) {
    scriptsReady = Promise.all([loadScript(HTML2CANVAS_CDN), loadScript(JSPDF_CDN)]).then(() => undefined);
  }
  return scriptsReady;
}

function getElementCaptureSize(el: HTMLElement): { width: number; height: number } {
  const rect = el.getBoundingClientRect();
  return {
    width: Math.max(Math.ceil(rect.width), Math.ceil(el.scrollWidth), Math.ceil(el.clientWidth)),
    height: Math.max(Math.ceil(rect.height), Math.ceil(el.scrollHeight), Math.ceil(el.clientHeight)),
  };
}

type ParsedNativePage = {
  title: string;
  blocks: HTMLElement[];
  isPrePaginated: boolean;
};

type PdfRuntime = {
  html2canvas: (
    el: HTMLElement,
    options?: {
      scale?: number;
      useCORS?: boolean;
      backgroundColor?: string | null;
      ignoreElements?: (el: Element) => boolean;
      width?: number;
      height?: number;
      windowWidth?: number;
      windowHeight?: number;
    },
  ) => Promise<HTMLCanvasElement>;
  jsPDF: new (options?: { orientation?: string; unit?: string; format?: string }) => any;
};

function getPdfRuntime(): PdfRuntime {
  const w = window as unknown as {
    html2canvas: PdfRuntime["html2canvas"];
    jspdf: { jsPDF: PdfRuntime["jsPDF"] };
  };

  if (!w.html2canvas || !w.jspdf?.jsPDF) {
    throw new Error("PDF libraries are not available.");
  }

  return {
    html2canvas: w.html2canvas,
    jsPDF: w.jspdf.jsPDF,
  };
}

function applyEmbeddedDocumentStyles(doc: Document): void {
  if (!doc.getElementById(IFRAME_PRINT_STYLE_ID)) {
    const style = doc.createElement("style");
    style.id = IFRAME_PRINT_STYLE_ID;
    style.textContent = ".print-btn { display: none !important; }";
    doc.head.appendChild(style);
  }

  if (!doc.getElementById(IFRAME_VIEWPORT_META_ID)) {
    const meta = doc.createElement("meta");
    meta.id = IFRAME_VIEWPORT_META_ID;
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1.0";
    doc.head.appendChild(meta);
  }

  if (!doc.getElementById(IFRAME_MOBILE_STYLE_ID)) {
    const mobileStyle = doc.createElement("style");
    mobileStyle.id = IFRAME_MOBILE_STYLE_ID;
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
}

async function loadPageInHiddenIframe(src: string): Promise<HTMLIFrameElement> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.style.position = "fixed";
    iframe.style.left = "-100000px";
    iframe.style.top = "0";
    iframe.style.width = "1200px";
    iframe.style.height = "2000px";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.style.border = "0";

    const onLoad = () => {
      const doc = iframe.contentDocument;
      if (!doc) {
        reject(new Error(`Failed to access ${src}.`));
        return;
      }

      applyEmbeddedDocumentStyles(doc);
      resolve(iframe);
    };

    const onError = () => reject(new Error(`Failed to load ${src}.`));

    iframe.addEventListener("load", onLoad, { once: true });
    iframe.addEventListener("error", onError, { once: true });
    document.body.appendChild(iframe);
  });
}

function createCombinedExportContainer(tocItems: Array<{ title: string; startPage: number }>): HTMLDivElement {
  const existing = document.getElementById(COMBINED_EXPORT_CONTAINER_ID);
  if (existing) {
    existing.remove();
  }

  const container = document.createElement("div");
  container.id = COMBINED_EXPORT_CONTAINER_ID;
  container.style.position = "fixed";
  container.style.left = "-99999px";
  container.style.top = "0";
  container.style.width = "210mm";
  container.style.background = "#fff";
  container.style.zIndex = "-1";

  const baseStyle = document.createElement("style");
  baseStyle.textContent = `
    #${COMBINED_EXPORT_CONTAINER_ID} * {
      box-sizing: border-box;
    }
    #${COMBINED_EXPORT_CONTAINER_ID} .otf-export-cover,
    #${COMBINED_EXPORT_CONTAINER_ID} .otf-export-toc {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 24mm 18mm;
      background: #ffffff;
      color: #0f172a;
      font-family: "League Spartan", "Inter", Arial, sans-serif;
    }
    #${COMBINED_EXPORT_CONTAINER_ID} .otf-export-toc h2 {
      margin: 0;
      font-size: 30px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-weight: 800;
      color: #1a56db;
    }
    #${COMBINED_EXPORT_CONTAINER_ID} .otf-export-toc-list {
      margin: 10mm 0 0;
      padding: 0;
      list-style: none;
    }
    #${COMBINED_EXPORT_CONTAINER_ID} .otf-export-toc-item {
      display: flex;
      align-items: baseline;
      gap: 6px;
      margin: 0 0 3.5mm;
      font-size: 15px;
      color: #0f172a;
    }
    #${COMBINED_EXPORT_CONTAINER_ID} .otf-export-toc-item:last-child {
      margin-bottom: 0;
    }
    #${COMBINED_EXPORT_CONTAINER_ID} .otf-export-toc-label {
      white-space: nowrap;
      font-weight: 600;
    }
    #${COMBINED_EXPORT_CONTAINER_ID} .otf-export-toc-dots {
      flex: 1;
      border-bottom: 1px dotted #94a3b8;
      transform: translateY(-2px);
    }
    #${COMBINED_EXPORT_CONTAINER_ID} .otf-export-toc-page {
      min-width: 14px;
      text-align: right;
      font-weight: 700;
      color: #1e293b;
    }
  `;
  container.appendChild(baseStyle);

  const toc = document.createElement("section");
  toc.className = "page otf-export-toc";
  const tocList = document.createElement("ol");
  tocList.className = "otf-export-toc-list";
  for (const itemData of tocItems) {
    const item = document.createElement("li");
    item.className = "otf-export-toc-item";
    item.innerHTML = `
      <span class="otf-export-toc-label">${itemData.title}</span>
      <span class="otf-export-toc-dots"></span>
      <span class="otf-export-toc-page">${itemData.startPage}</span>
    `;
    tocList.appendChild(item);
  }

  const tocTitle = document.createElement("h2");
  tocTitle.textContent = "Table of Contents";
  toc.appendChild(tocTitle);
  toc.appendChild(tocList);
  container.appendChild(toc);

  document.body.appendChild(container);
  return container;
}

export async function downloadNativePagesAsPdf(fileName = "otf-native-pages.pdf"): Promise<void> {
  await ensurePdfLibs();
  const { html2canvas, jsPDF } = getPdfRuntime();
  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  const pageWidth = 595.28;
  const pageHeight = 841.89;

  const iframes: HTMLIFrameElement[] = [];
  const parsedPages: ParsedNativePage[] = [];

  for (const page of NATIVE_PDF_PAGES) {
    const iframe = await loadPageInHiddenIframe(page.src);
    iframes.push(iframe);

    const doc = iframe.contentDocument;
    if (!doc) throw new Error(`Failed to access ${page.src}.`);
    if (doc.fonts?.ready) {
      await doc.fonts.ready;
    }

    const extractedBlocks = Array.from(doc.querySelectorAll<HTMLElement>(".cover, .page"));
    const isPrePaginated = extractedBlocks.length > 0;
    const blocks = isPrePaginated ? extractedBlocks : [doc.body as HTMLElement];
    parsedPages.push({ title: page.title, blocks, isPrePaginated });
  }

  const estimatePdfPagesForContinuousBlock = (block: HTMLElement) => {
    const { width, height } = getElementCaptureSize(block);
    if (width <= 0 || height <= 0) return 1;
    const renderedHeight = (height * pageWidth) / width;
    return Math.max(1, Math.ceil(renderedHeight / pageHeight));
  };

  let nextStartPage = 2;
  const tocItems = parsedPages.map((page) => {
    const pageCount = page.isPrePaginated
      ? page.blocks.length
      : estimatePdfPagesForContinuousBlock(page.blocks[0]);
    const item = { title: page.title, startPage: nextStartPage };
    nextStartPage += pageCount;
    return item;
  });

  const tocContainer = createCombinedExportContainer(tocItems);
  const tocBlock = tocContainer.querySelector<HTMLElement>(".page");
  if (!tocBlock) {
    throw new Error("Failed to render table of contents.");
  }

  let pageIndex = 0;
  const addCanvasToPdfAsSinglePage = (canvas: HTMLCanvasElement) => {
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;
    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;
    if (pageIndex > 0) {
      pdf.addPage();
    }
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, imgWidth, imgHeight);
    pageIndex += 1;
  };

  const addCanvasToPdfAsPagedFlow = (canvas: HTMLCanvasElement) => {
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (pageIndex > 0) {
      pdf.addPage();
    }

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    pageIndex += 1;
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      pageIndex += 1;
      heightLeft -= pageHeight;
    }
  };

  try {
    const tocSize = getElementCaptureSize(tocBlock);
    const tocCanvas = await html2canvas(tocBlock, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      width: tocSize.width,
      height: tocSize.height,
      windowWidth: Math.max(tocSize.width, document.documentElement.scrollWidth),
      windowHeight: Math.max(tocSize.height, document.documentElement.scrollHeight),
      ignoreElements: (el) => (el as HTMLElement).dataset?.exportPdf === "true",
    });
    addCanvasToPdfAsSinglePage(tocCanvas);

    for (let i = 0; i < parsedPages.length; i += 1) {
      const iframe = iframes[i];
      const doc = iframe.contentDocument;
      if (!doc) continue;
      const docEl = doc.documentElement;
      const blocks = parsedPages[i].blocks;

      for (const block of blocks) {
        const { width, height } = getElementCaptureSize(block);
        const canvas = await html2canvas(block, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          width,
          height,
          windowWidth: Math.max(width, docEl.scrollWidth),
          windowHeight: Math.max(height, docEl.scrollHeight),
          ignoreElements: (el) => (el as HTMLElement).dataset?.exportPdf === "true",
        });
        if (parsedPages[i].isPrePaginated) {
          addCanvasToPdfAsSinglePage(canvas);
        } else {
          addCanvasToPdfAsPagedFlow(canvas);
        }
      }
    }
  } finally {
    tocContainer.remove();
    iframes.forEach((iframe) => iframe.remove());
  }

  pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}

export async function downloadElementAsPdf(element: HTMLElement, fileName: string): Promise<void> {
  await ensurePdfLibs();

  if (element.ownerDocument.fonts?.ready) {
    await element.ownerDocument.fonts.ready;
  }

  const { html2canvas, jsPDF } = getPdfRuntime();
  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  const pageWidth = 595.28; // A4 width in pt
  const pageHeight = 841.89; // A4 height in pt
  const pagedBlocks = element.querySelectorAll<HTMLElement>(".cover, .page");

  if (pagedBlocks.length > 0) {
    const blocks = Array.from(pagedBlocks);
    const docEl = element.ownerDocument.documentElement;

    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i];
      const { width, height } = getElementCaptureSize(block);

      const canvas = await html2canvas(block, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width,
        height,
        windowWidth: Math.max(width, docEl.scrollWidth),
        windowHeight: Math.max(height, docEl.scrollHeight),
        ignoreElements: (el) => (el as HTMLElement).dataset?.exportPdf === "true",
      });

      const imgData = canvas.toDataURL("image/png");
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      if (i > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
    }
  } else {
    const { width, height } = getElementCaptureSize(element);
    const docEl = element.ownerDocument.documentElement;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      width,
      height,
      windowWidth: Math.max(width, docEl.scrollWidth),
      windowHeight: Math.max(height, docEl.scrollHeight),
      ignoreElements: (el) => (el as HTMLElement).dataset?.exportPdf === "true",
    });

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
  }

  pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}
