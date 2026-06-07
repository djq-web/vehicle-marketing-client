/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module "u-draw/dist/index.js" {
  export type DrawInstance = {
    canvas?: {
      width: number;
      height: number;
      requestAnimationFrame?: (callback: FrameRequestCallback) => number;
      cancelAnimationFrame?: (id: number) => void;
    };
    ctx?: UniApp.CanvasContext;
    mount: () => Promise<DrawInstance>;
    ready: () => Promise<DrawInstance>;
  };

  export function useDraw(
    selector: string,
    options?: {
      componentThis?: unknown;
      type?: "2d" | "context" | "webgl";
      immediate?: boolean;
    },
  ): DrawInstance;
}
