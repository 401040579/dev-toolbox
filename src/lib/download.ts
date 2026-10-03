export function downloadText(text: string, filename: string, mime: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  // Give the browser a chance to consume the object URL before releasing it.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
