/// <reference types="vite/client" />

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.mp3' {
  const src: string;
  export default src;
}

interface Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Hands: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Camera: any;
}
