/** Escapes text for safe use inside an HTML document string. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Opens the browser's print dialog for a standalone HTML document. The document is rendered in
 * a hidden iframe, so none of the app's own layout or styles end up on the page; choose
 * "Save as PDF" as the destination to get a PDF. Browser-only.
 */
export function printHtml(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.tabIndex = -1;
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });

  const cleanup = () => iframe.remove();

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) return cleanup();
    frameWindow.addEventListener("afterprint", cleanup);
    frameWindow.focus();
    frameWindow.print();
    // Some browsers never fire afterprint; don't leave the iframe behind forever.
    window.setTimeout(cleanup, 5 * 60 * 1000);
  };

  iframe.srcdoc = html;
  document.body.appendChild(iframe);
}
