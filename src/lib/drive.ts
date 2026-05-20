export function driveUrlToImage(url: string): string {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`
  return url
}
