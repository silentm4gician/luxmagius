// Función para manejar URLs de Google Drive e imágenes normales
const getImageUrl = (image) => {
  // Si ya es una URL de Firebase Storage, la usamos directamente
  if (image?.url && image.url.includes("firebasestorage.googleapis.com")) {
    return image.url;
  }

  // Si tenemos un driveId, construimos la URL óptima para visualización
  if (image?.driveId) {
    // Formato que funciona mejor para visualización de imágenes en Google Drive
    return `https://lh3.googleusercontent.com/d/${image.driveId}`;
  }

  // Si ya tenemos una URL de Google Drive, extraemos el ID y usamos el formato de visualización
  if (image?.url && image.url.includes("drive.google.com")) {
    const idMatch = image.url.match(/id=([^&]+)/);
    if (idMatch && idMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
    }
  }

  // Fallback a la URL proporcionada o un placeholder
  return image?.url || "/placeholder.svg";
};

export default getImageUrl;
