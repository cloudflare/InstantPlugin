export default function previewImageFile(file, onSuccess, onError = () => {}) {
  const image = new Image()

  if (!window.URL.createObjectURL) return onError(image)

  image.onload = onSuccess.bind(this, image)
  image.onerror = onError.bind(this, image)

  image.src = window.URL.createObjectURL(file)
}
