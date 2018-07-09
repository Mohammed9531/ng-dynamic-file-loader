import { Injectable } from '@angular/core';
import { LoaderConstants } from './loader.constants';
import { LoaderModel, LoaderEvent } from './loader.model';
import { Observable, Subscription, Subscriber, Subject } from 'rxjs/Rx';
import { LoaderOptions, NodeLoadEvent, NodeOptions, NodePreset } from './loader.interface';

/**
 * @description: access the native document object
 */
declare const document: any;
const noop: Function = new Function();

/**
 * @description: declare union type for supported elements
 */
type SupportedElements = HTMLLinkElement | HTMLScriptElement;

/**
 * @author: Shoukath Mohammed
 */
@Injectable()
export class LoaderService {
  private loading: boolean;
  private queue: any[] = [];
  private loadingFile: any = {};
  private loadedFiles: any = {};
  public logger$: Subject<string> = new Subject<string>();

  constructor() {}

  /**
   * @public
   * @param: {options<LoaderOptions>}
   * @param: {isLoaded$<Observable<boolean>>}
   * @return: Observable<boolean>
   * @description: a reusable helper function to process the request 
   */
  public load(
    options: LoaderOptions,
    isLoaded$?: Observable<LoaderEvent>,
    observer$?: Subscriber<any>): Observable<LoaderEvent> {

    if (!!isLoaded$) {
      this.init(options, observer$, isLoaded$);
    } else {
      isLoaded$ = new Observable<LoaderEvent>(obs => {
        this.init(options, obs, isLoaded$);
      });
    }

    // return an observable so user can subscribe to it.
    return isLoaded$;
  }

  /**
   * @public
   * @return: void
   * @description: loads a list of scripts/styles 
   */
  public loadAll(arr: LoaderOptions[]): Observable<LoaderEvent[]> {
    const subs: Observable<LoaderEvent>[] = [];
    for (let i = 0; i < arr.length; i++) {
      subs.push(this.load(arr[i]));
    }
    // returns consolidated observables
    return Observable.forkJoin(...subs);
  }
  
  /**
   * @public
   * @return: void
   * @description: resets the loaded files.
   */
  public reset(): void {
    this.queue = [];
    this.loading = false;
    this.loadedFiles = {};
    this.loadingFile = {};
  }

  /**
   * @public
   * @param: {elementId<string>}
   * @return: void
   * @description: removes a single element from the DOM 
   */
  public remove(elementId: string): void {
    let el: HTMLElement;
    const loaded: any = this.loadedFiles[elementId];

    // find the element by id
    el = document.getElementById(elementId);

    // remove only if the remove method exists
    if (el && el.remove instanceof Function) {
      // remove initiated event
      this.log('Removing', loaded);

      delete this.loadedFiles[elementId];
      el.remove();

      // remove success event
      this.log('Removed', loaded.options);
    } else {

      // remove failed event
      const error: string = `element with the id '${elementId}' does not exist.`;
      this.log(`Remove operation failed:  ${error}`, null, true);
      throw new Error(error);
    }
  }

  /**
   * @public
   * @param: {elementIds<string[]>}
   * @return: void
   * @description: removes all dynamically injected scripts/styles from the DOM 
   */
  public removeAll(elementIds?: string[]): void {
    let keys: string[];
    keys = elementIds || Object.keys(this.loadedFiles);

    for (let i = 0; i < keys.length; i++) {
      this.remove(keys[i]);
    }
  }

  /**
   * @private
   * @param: {options<LoaderOptions>}
   * @param: {observer$<Subscriber<any>>}
   * @param: {isLoaded$<Observable<LoaderEvent>>}
   * @return: void
   * @description: a helper function that initializes the request
   */
  private init(
    options: LoaderOptions,
    observer$: Subscriber<any>,
    isLoaded$: Observable<LoaderEvent>): void {

    // reusable configuration for various node events
    const config: NodeOptions = {
      options: options,
      observer$: observer$,
      isLoaded$: isLoaded$
    };

    options.isStylesheet = this.isStylesheet(options);
    options.elementId = options.elementId || this.getUUId();
    // get the index of current request to check if the
    // current script/stylesheet was already loaded.
    const currIdx: number = this.queue.findIndex(
      req => req.url === options.url
    );

    // if the file is already loading push the request to the queue bucket
    // if the file ain't loading, process it.
    if (this.loading) {
      !this.queue[currIdx] ? this.queue.push(config) : noop();
      observer$.next(new LoaderEvent(options, true));

      // queued event
      this.log('Queued', options);

      // in case if the requested url is already loaded do not proceed
    } else if (!this.loading && this.isLoaded(options.url)) {

      // duplicate resource event
      this.logger$.next(this.buildLog('Duplicate', options.url));

      observer$.next(new LoaderEvent(options, null, null, true));
      observer$.complete();

      // proceed with the loading
    } else {
      this.proceed(config, options);
    }
  }

    /**
   * @private
   * @param: {conf<NodeOptions>}
   * @param: {opts<LoaderOptions>}
   * @return: void
   * @description: a helper function that processes & completes
   * the request.
   */
  private proceed(
    conf: NodeOptions,
    opts: LoaderOptions): void {

    // process the rquest
    this.loading = true;

    // add the current url to the loading queue
    this.loadingFile[opts.url] = true;

    // emit & loading event
    this.log('Loading', opts);
    conf.observer$.next(new LoaderEvent(opts, null, true));
    /**
     * process file based on the file type, currently it only supports
     * stylesheet or a script
     */
    const extns: string[] = LoaderConstants.supportedExtns;

    // do not process unsupported file formats
    const idx: number = extns.indexOf(this.getFileExt(opts.url));

    if (idx === -1) {
      this.onError(conf);
    } else {
      // if the current request url is of supported extensions
      // process it further
      this[LoaderConstants[this.getFileExt(opts.url)]](conf);
    }
  }

  /**
   * @private
   * @param: {opts<NodeOptions>}
   * @return: void
   * @description: a reusable helper function to process the request 
   */
  private processRequest(e: NodeLoadEvent<HTMLElement>): void {
    // gets called on file load
    const el: HTMLElement = e.el;
    (<any>el).onreadystatechange = el.onload = this.onLoad.bind(
      this,
      new LoaderModel(<any>e, el)
    );

    // gets called on file load error
    el.onerror = this.onError.bind(this, new LoaderModel(<any>e, el));

    // use body if available. more safe in IE
    // (document.body || head).appendChild(styles);
    if (e.options.insertBefore 
      && e.options.insertBeforeElement) {
      // insert before the requested element
      e.options.targetElement.insertBefore(el,
        e.options.insertBeforeElement
      );
    } else {
      e.options.targetElement.appendChild(el);
    }
  }

  /**
   * @private
   * @param: {opts<NodeOptions>}
   * @return: void
   * @description: a helper function to load the scripts
   */
  private loadScript(opts: NodeOptions): void {
    type Script = HTMLScriptElement;
    const el: Script = <Script>document.createElement('script');

    el.src = opts.options.url;
    el.type = 'text/javascript';
    el.id = opts.options.elementId;
    el.async = opts.options.async || false;

    this.processRequest(new LoaderModel(opts, el));
  }

  /**
   * @private
   * @param: {opts<NodeOptions>}
   * @return: void
   * @description: a helper function to load the stylesheets
   */
  private loadStylesheet(opts: NodeOptions): void {
    type Style = HTMLLinkElement;
    const el: Style = <Style>document.createElement('link');

    el.type = 'text/css';
    el.rel = 'stylesheet';
    el.href = opts.options.url;
    el.id = opts.options.elementId;
    el.media = (opts.options.mediaType || 'screen').toLowerCase();

    this.processRequest(new LoaderModel(opts, el));
  }

  /**
   * @private
   * @param: {pre<NodePreset>}
   * @param: {dataType<string>}
   * @return: <T>
   * @description: a helper function to map the loader configuration
   */
  private preset<T>(pre: NodePreset, dataType: string): T {
    if (typeof pre.originalValue !== dataType) {
      pre.originalValue = pre.fallbackValue;
    }
    return pre.originalValue;
  }

  /**
   * @private
   * @return: void
   * @description: a helper function to load the next item/request
   * in the queue.
   */
  private loadNextQueueRequest(): void {
    const nextQItem: any = this.queue.shift();

    if (!!nextQItem) {
      this.load(
        nextQItem.options,
        nextQItem.isLoaded$,
        nextQItem.observer$
      );
    }
  }

  /**
   * @private
   * @type: callback
   * @param: {e<NodeLoadEvent<SupportedElements>>}
   * @return: void
   * @description: success callback method
   */
  private onLoad(e: NodeLoadEvent<SupportedElements>): void {
    const state: any = (<any>e.el).readyState;

    if (
      !this.loadedFiles[e.options.url] &&
      (!state || /loaded|complete/.test(state))
    ) {
      delete this.loadingFile[e.options.url];
      this.loadedFiles[e.el.id] = {
        src: e.options.url,
        options: e.options
      };

      // loaded event
      this.log('Done', e.options);

      e.observer$.next(new LoaderEvent(e.options, null, null, true));
      e.observer$.complete();
      this.loading = false;

      // load the next request in the queue
      this.loadNextQueueRequest();
    }
  }

  /**
   * @private
   * @type: callback
   * @param: {e<NodeLoadEvent<any>>}
   * @return: void
   * @description: error callback method
   */
  private onError(e: NodeLoadEvent<any>): void {
    // failed event
    this.log('Failed', e.options);

    e.observer$.error(new LoaderEvent(e.options, null, null, false, true));
    e.observer$.complete();

    this.loading = false;

    // load the next request in the queue
    this.loadNextQueueRequest();
  }

  /**
   * @private
   * @param: {url<string>}
   * @return: string
   * @description: returns the file extensions as a string 
   */
  private getFileExt(url: string): string {
    return url
      .split('/')
      .pop()
      .split('#')[0]
      .split('?')[0]
      .split('.')
      .pop();
  }

  /**
   * @private
   * @param: {options<LoaderOptions>}
   * @return: boolean
   * @description: returns true if the requested file is a stylesheet
   */
  private isStylesheet(options: LoaderOptions): boolean {
    return options.isStylesheet || this.getFileExt(options.url) === 'css';
  }

  /**
   * @private
   * @param: {url<string>}
   * @return: boolean
   * @description: returns true if the requested file is already loaded
   */
  private isLoaded(url: string): boolean {
    let isDuplicate: boolean = false;
    const keys: string[] = Object.keys(this.loadedFiles);

    for (let i = 0; i < keys.length; i++) {
      if (this.loadedFiles[keys[i]].src === url) {
        isDuplicate = true;
        break;
      }
    }
    return isDuplicate;
  }

  /**
   * @private
   * @return: string
   * @description: generates a unique id
   */
  private getUUId(): string {
    const getUniqueId: any = (): number => Math.floor(Math.random() * 10000);
    return `C${getUniqueId()}_${getUniqueId()}`;
  }

  /**
   * @private
   * @param: {status<string>}
   * @param: {url<string>}
   * @return: string
   * @description: constructs log for debugging purpose
   */
  private buildLog(status: string, url?: string): string {
    const now: Date = new Date();
    return `[${now.getMilliseconds()}] ${status}${url ? ' -> ' + url : ''}`;
  }

  /**
   * @private
   * @param: {status<string>}
   * @param: {opts<LoaderOptions>}
   * @param: {flat<boolean>}
   * @return: string
   * @description: emits log on if debug mode is enabled
   */
  private log(status: string, opts?: LoaderOptions, flat?: boolean): void {
    if (opts && opts.debug) {
      this.logger$.next(this.buildLog(status, opts.url));
    } else if (flat) {
      this.logger$.next(this.buildLog(status));
    }
  }
}
