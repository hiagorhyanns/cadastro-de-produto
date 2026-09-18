/**
 * Utility to downscale and compress images on the client side before triggering Gemini requests.
 * Resolves the image to a JPEG Data URL under the maximum bounds.
 */
export function resizeAndCompressImage(
  file: File,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const imgNode = new Image();
      imgNode.onload = () => {
        const canvas = document.createElement("canvas");
        let width = imgNode.width;
        let height = imgNode.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(imgNode, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve(readerEvent.target?.result as string);
        }
      };
      imgNode.onerror = (err) => {
        reject(err);
      };
      imgNode.src = readerEvent.target?.result as string;
    };
    reader.onerror = (err) => {
      reject(err);
    };
    reader.readAsDataURL(file);
  });
}
