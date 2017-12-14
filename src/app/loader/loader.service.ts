import { LoaderModel } from './loader.model';
import { Injectable } from "@angular/core";
import { AsyncSubject, Observable } from "rxjs/Rx";
import { LoaderConstants } from './loader.constants';
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
   * @private
   * @param: {options<LoaderOptions>}
   * @param: {isLoaded$<AsyncSubject<boolean>>}
   * @return: Observable<boolean>
   * @description: a reusable helper function to process the request 
   */
  public load(options: LoaderOptions,
    isLoaded$?: AsyncSubject<boolean>): Observable<boolean> {
    isLoaded$ = isLoaded$ || new AsyncSubject<boolean>();

    // reusable configuration for various node events
    const config: NodeOptions = {
      options: options,
      isLoaded$: isLoaded$
    };

    options.isStylesheet = options.isStylesheet 
                          || this.getFileExt(options.url) === 'css';
    
    // get the index of current request to check if the
    // current script/stylesheet was already loaded.
    const currIdx: number = this.queue.findIndex(
      req => req.url === options.url
    );

    // if the file is already loading push the request to the queue bucket
    // if the file ain't loading, process it.
    if (this.loading) {
      !this.queue[currIdx] ? this.queue.push(config) : noop();
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
      isLoaded$.error({isLoaded: false});
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
   * @private
   * @param: {opts<NodeOptions>}
   * @return: void
   * @description: a reusable helper function to process the request 
   */
  private processRequest(e: NodeLoadEvent<HTMLElement>): void {
    // gets called on file load
    const el: HTMLElement = e.el;
    (<any>el).onreadystatechange = el.onload = this.onLoad.bind(this, {
      el: el,
      options: e.options,
      isLoaded$: e.isLoaded$
    });

    // gets called on file load error
    el.onerror = this.onError.bind(this, {
      options: e.options,
      isLoaded$: e.isLoaded$
    });

    // use body if available. more safe in IE
    // (document.body || head).appendChild(styles);
    e.options.targetElement.appendChild(el);
  }

  /**
   * @private
   * @param: {opts<NodeOptions>}
   * @return: void
   * @description: a helper function to load the scripts
   */
  private loadScript(opts: NodeOptions): void {
    type Script = HTMLScriptElement;
    const el: Script  = <Script>document.createElement("script");

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

    el.media = "screen";
    el.type = "text/css";
    el.rel = "stylesheet";
    el.href = opts.options.url;
    el.id = opts.options.elementId;
  
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
   * @param: {pre<NodePreset>}
   * @param: {dataType<string>}
   * @return: <T>
   * @description: a helper function to map the loader configuration
   */
  private getLoader(): any {

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
    
      this.loadedFiles[e.options.url] = true;
      delete this.loadingFile[e.options.url];

      e.isLoaded$.next(true);
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
    e.isLoaded$.error({
      isLoaded: false,
      options: e.options
    });
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
    return url.split('/').pop().split('#')[0].split('?')[0].split('.').pop();
  }
}
