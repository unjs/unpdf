/* eslint-disable @typescript-eslint/consistent-type-imports */
import type { Canvas } from "canvas";
import type {
  BinaryData,
  PDFDocumentProxy,
} from "pdfjs-dist/types/src/display/api";
import {
  getDocumentProxy,
  getResolvedPDFJS,
  interopDefault,
  isBrowser,
  isNode,
  isPDFDocumentProxy,
} from "./utils";

export async function extractImages(
  data: BinaryData | PDFDocumentProxy,
  pageNumber: number,
) {
  const pdf = isPDFDocumentProxy(data) ? data : await getDocumentProxy(data);
  const page = await pdf.getPage(pageNumber);

  if (pageNumber < 1 || pageNumber > pdf.numPages) {
    throw new Error(
      `Invalid page number. Must be between 1 and ${pdf.numPages}.`,
    );
  }

  const operatorList = await page.getOperatorList();
  const { OPS } = await getResolvedPDFJS();

  const images: Uint8ClampedArray[] = [];

  for (let i = 0; i < operatorList.fnArray.length; i++) {
    const op = operatorList.fnArray[i];

    if (op !== OPS.paintImageXObject) {
      continue;
    }

    const imageKey = operatorList.argsArray[i][0];
    const image = await page.objs.get(imageKey);
    images.push(image.data);
  }

  return images;
}

export async function renderPageAsImage(
  data: BinaryData | PDFDocumentProxy,
  pageNumber: number,
  options: {
    canvas?: () => Promise<typeof import("canvas")>;
    /** @default 1 */
    scale?: number;
    width?: number;
    height?: number;
  } = {},
) {
  const canvasFactory = await createIsomorphicCanvasFactory(options.canvas);
  const pdf = isPDFDocumentProxy(data)
    ? data
    : await getDocumentProxy(data, { canvasFactory });
  const page = await pdf.getPage(pageNumber);

  if (pageNumber < 1 || pageNumber > pdf.numPages) {
    throw new Error(
      `Invalid page number. Must be between 1 and ${pdf.numPages}.`,
    );
  }

  // Create viewport of the page at required scale
  let outputScale = options.scale || 1;
  let viewport = page.getViewport({ scale: outputScale });

  // Scale it up/down depending on the custom width/height passed
  if (options.width) {
    outputScale = options.width / viewport.width;
  } else if (options.height) {
    outputScale = options.height / viewport.height;
  }
  if (outputScale !== 1 && outputScale > 0) {
    viewport = page.getViewport({ scale: outputScale });
  }

  const ctx = canvasFactory.create(viewport.width, viewport.height);

  await page.render({
    canvasContext: ctx.context,
    viewport,
  }).promise;

  const dataUrl = isBrowser
    ? ctx.canvas.toDataURL()
    : (ctx.canvas as Canvas).toDataURL();

  const response = await fetch(dataUrl);
  return await response.arrayBuffer();
}

export async function createIsomorphicCanvasFactory(
  canvas?: () => Promise<typeof import("canvas")>,
) {
  const _canvas = canvas ? await interopDefault(canvas()) : undefined;

  return {
    _createCanvas(width: number, height: number) {
      if (isBrowser) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        return canvas;
      }

      if (isNode) {
        if (!_canvas) {
          throw new Error('Failed to resolve "canvas" package.');
        }

        return _canvas.createCanvas(width, height);
      }

      throw new Error("Unsupported environment for canvas creation.");
    },
    create(width: number, height: number) {
      const _canvas = this._createCanvas(width, height);
      const context = _canvas.getContext(
        "2d",
      ) as unknown as CanvasRenderingContext2D;
      return {
        canvas: _canvas,
        context,
      };
    },
    reset(
      ctx: { canvas?: Canvas; context?: CanvasRenderingContext2D },
      width: number,
      height: number,
    ) {
      if (ctx.canvas) {
        ctx.canvas.width = width;
        ctx.canvas.height = height;
      }
    },
    destroy(ctx: { canvas?: Canvas; context?: CanvasRenderingContext2D }) {
      if (ctx.canvas) {
        ctx.canvas.width = 0;
        ctx.canvas.height = 0;
      }
      ctx.canvas = undefined;
      ctx.context = undefined;
    },
  };
}
