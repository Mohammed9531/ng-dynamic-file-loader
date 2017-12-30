import { Subject } from 'rxjs/Rx';
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
  isStylesheet?: boolean;
  insertBefore?: boolean;
  targetElement: HTMLElement;
  insertBeforeElement?: HTMLElement;
}

/**
 * @name: NodeLoadEvent<T>
 * @type: Interface
 */
export interface NodeLoadEvent<T> {
  el?: T;
  options?: LoaderOptions;
  isLoaded$?: Subject<LoaderEvent>;
}

/**
 * @name: NodeOptions
 * @type: Interface
 */
export interface NodeOptions {
  options?: LoaderOptions;
  isLoaded$: Subject<LoaderEvent>;
}

/**
 * @name: NodePreset
 * @type: Interface
 */
export interface NodePreset {
  originalValue: any;
  fallbackValue: any;
}
