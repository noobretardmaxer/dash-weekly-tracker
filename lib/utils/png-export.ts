import { toPng } from "html-to-image";

export async function downloadNodeAsPng(node: HTMLElement, filename: string) {
  const dataUrl = await toPng(node, {
    backgroundColor: getComputedStyle(document.body).backgroundColor,
    pixelRatio: 2,
  });
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
