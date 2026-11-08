export function canShareImage(file) {
  try { return !!(file && navigator.share && navigator.canShare?.({ files: [file] })); }
  catch { return false; }
}

export function downloadImage(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// Prepare the file before a tap so the device's share menu opens within user activation.
export function bindImageExport({ downloadButton, shareButton, status, tr }) {
  let file = null;
  const message = (key) => {
    status.dataset.i18n = key;
    status.textContent = tr(key);
    // Keep the confirmation above the fixed navigation, scrolling only its own screen.
    const screen = status.closest('.screen');
    if (screen) {
      const visibleBottom = screen.getBoundingClientRect().bottom - parseFloat(getComputedStyle(screen).paddingBottom);
      const overflow = status.getBoundingClientRect().bottom - visibleBottom;
      if (overflow > 0) screen.scrollTop += overflow;
    }
  };
  downloadButton.addEventListener('click', () => {
    if (!file) return;
    downloadImage(file);
    message('image.downloaded');
  });
  shareButton.addEventListener('click', async () => {
    if (!file || shareButton.disabled) return;
    shareButton.disabled = true;
    status.textContent = '';
    delete status.dataset.i18n;
    try {
      await navigator.share({ files: [file] });
      message('image.shared');
    } catch (error) {
      if (error?.name !== 'AbortError') message('image.shareFailed');
    } finally { shareButton.disabled = false; }
  });
  return (nextFile) => {
    file = nextFile;
    downloadButton.disabled = !file;
    shareButton.hidden = !canShareImage(file);
    status.textContent = '';
    delete status.dataset.i18n;
  };
}
