import { Observable, Subscriber } from 'rxjs/Rx';
import { NodeOptions, LoaderOptions, NodeLoadEvent } from './loader.interface';

/**
 * @author: Shoukath Mohammed
 */

/**
 * @name: LoaderModel
 * @description: a helper model for binding things together
 */
export class LoaderModel {
  public el: HTMLElement;
  public options: LoaderOptions;
  public observer$: Subscriber<any>;
  public isLoaded$: Observable<LoaderEvent>;

  constructor(opts: NodeOptions, el?: HTMLElement) {
    this.el = el || null;
    this.options = opts.options;
    this.isLoaded$ = opts.isLoaded$;
    this.observer$ = opts.observer$;
  }
}

/**
 * @name: LoaderEvent
 * @description: responsible for constructing loader events
 * object
 */
export class LoaderEvent {
  public isLoaded: boolean;
  public isQueued: boolean;
  public isErrored: boolean;
  public isLoading: boolean;
  public data: LoaderOptions;

  constructor(data: LoaderOptions,
    isQueued: boolean, isLoading?: boolean,
    isLoaded?: boolean, isErrored?: boolean
  ) {
    this.data = data;
    this.isQueued = isQueued || false;
    this.isLoaded = isLoaded || false;
    this.isLoading = isLoading || false;
    this.isErrored = isErrored || false;
  }
}
