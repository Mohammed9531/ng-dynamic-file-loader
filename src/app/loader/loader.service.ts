import { Injectable } from "@angular/core";
import { LoaderConstants } from './loader.constants';
import { LoaderModel, LoaderEvent } from './loader.model';
import { AsyncSubject, Observable, Subscription } from "rxjs/Rx";
import { LoaderOptions, NodeLoadEvent, NodeOptions, NodePreset } from "./loader.interface";

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

  constructor() {}

  /**
   * @public
   * @param: {options<LoaderOptions>}
   * @param: {isLoaded$<AsyncSubject<boolean>>}
   * @return: Observable<boolean>
   * @description: a reusable helper function to process the request 
   */
  public load(
    options: LoaderOptions,
    isLoaded$?: AsyncSubject<LoaderEvent>
  ): Observable<LoaderEvent> {
    isLoaded$ = isLoaded$ || new AsyncSubject<LoaderEvent>();

    // reusable configuration for various node events
    const config: NodeOptions = {
      options: options,
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
      isLoaded$.next(new LoaderEvent(options, true));

      return isLoaded$.asObservable();
    } else {
      // process the rquest
      this.loading = true;

      // add the current url to the loading queue
      this.loadingFile[options.url] = true;
    }

    /**
     * process file based on the file type, currently it only supports
     * stylesheet or a script
     */
    const extns: string[] = LoaderConstants.supportedExtns;

    // do not process unsupported file formats
    if (extns.indexOf(this.getFileExt(options.url)) === -1) {
      isLoaded$.error({ isLoaded: false });
      isLoaded$.complete();

      this.loading = false;
      this.loadNextQueueRequest();
    } else {
      // if the current request url is of supported extensions
      // process it further
      this[LoaderConstants[this.getFileExt(options.url)]](config);
    }

    // return an observable so user can subscribe to it.
    return isLoaded$.asObservable();
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
   * @param: {elementId<string>}
   * @return: void
   * @description: removes a single element from the DOM 
   */
  public remove(elementId: string): void {
    let el: HTMLElement;
    // find the element by id
    el = document.getElementById(elementId);

    // remove only if the remove method exists
    if (el && el.remove instanceof Function) {
      el.remove();
    } else {
      throw new Error(`element with the id '${elementId}' does not exist.`);
    }
  }

  /**
   * @public
   * @param: {elementIds<string[]>}
   * @return: void
   * @description: removes all dynamically injected scripts/styles from the DOM 
   */
  public removeAll(elementIds?: string[]): void {
    let _keys: string[];
    _keys = elementIds || Object.keys(this.loadedFiles);

    for (let i = 0; i < _keys.length; i++) {
      this.remove(_keys[i]);
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
    if (e.options.insertBefore && e.options.insertBeforeElement) {
      // insert before the requested element
      e.options.targetElement.insertBefore(el, e.options.insertBeforeElement);
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
    const el: Script = <Script>document.createElement("script");

    el.src = opts.options.url;
    el.type = "text/javascript";
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
    const el: Style = <Style>document.createElement("link");

    el.type = "text/css";
    el.rel = "stylesheet";
    el.href = opts.options.url;
    el.id = opts.options.elementId;
    el.media = (opts.options.mediaType || "screen").toLowerCase();

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
    const nextQueueItem: any = this.queue.shift();

    if (!!nextQueueItem) {
      this.load(nextQueueItem.options, nextQueueItem.isLoaded$);
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
      this.loadedFiles[e.el.id] = { src: e.options.url };

      e.isLoaded$.next(new LoaderEvent(e.options, null, null, true));
      e.isLoaded$.complete();
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
    e.isLoaded$.error(new LoaderEvent(e.options, null, null, false, true));
    e.isLoaded$.complete();

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
      .split("/")
      .pop()
      .split("#")[0]
      .split("?")[0]
      .split(".")
      .pop();
  }

  /**
   * @private
   * @param: {options<LoaderOptions>}
   * @return: boolean
   * @description: returns true if the requested file is a stylesheet
   */
  private isStylesheet(options: LoaderOptions): boolean {
    return options.isStylesheet || this.getFileExt(options.url) === "css";
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
}
