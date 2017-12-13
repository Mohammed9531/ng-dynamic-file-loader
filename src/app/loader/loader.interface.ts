import { AsyncSubject } from "rxjs/Rx";

/**
 * @author: Shoukath Mohammed 
 */
export interface LoaderOptions {
  url: string;
  async?: boolean;
  elementId?: string;
  loadAfter?: boolean;
  isStylesheet: boolean;
  targetElement: HTMLElement;
  loadAfterElement?: HTMLElement;
}

export interface NodeLoadEvent<T> {
  el?: T;
  options?: LoaderOptions;
  isLoaded$?: AsyncSubject<boolean>;
}

export interface NodeOptions {
  options?: LoaderOptions;
  isLoaded$: AsyncSubject<boolean>;
}

export interface NodePreset {
  originalValue: any;
  fallbackValue: any;
}
