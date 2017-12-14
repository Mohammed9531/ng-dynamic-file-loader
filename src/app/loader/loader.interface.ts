import { AsyncSubject } from "rxjs/Rx";
import { LoaderEvent } from './loader.model';

/**
 * @author: Shoukath Mohammed 
 **
/**
 * @name: LoaderOptions
 * @type: Interface
 */
export interface LoaderOptions {
  url: string;
  async?: boolean;
  mediaType?: string;
  elementId?: string;
  loadAfter?: boolean;
  isStylesheet: boolean;
  targetElement: HTMLElement;
  loadAfterElement?: HTMLElement;
}

/**
 * @name: NodeLoadEvent<T>
 * @type: Interface
 */
export interface NodeLoadEvent<T> {
  el?: T;
  options?: LoaderOptions;
  isLoaded$?: AsyncSubject<LoaderEvent>;
}

/**
 * @name: NodeOptions
 * @type: Interface
 */
export interface NodeOptions {
  options?: LoaderOptions;
  isLoaded$: AsyncSubject<LoaderEvent>;
}

/**
 * @name: NodePreset
 * @type: Interface
 */
export interface NodePreset {
  originalValue: any;
  fallbackValue: any;
}
