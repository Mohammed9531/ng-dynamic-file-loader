import { Injectable } from "@angular/core";
import { AsyncSubject, Observable } from "rxjs/Rx";
import { LoaderOptions, NodeLoadEvent, NodeOptions, NodePreset } from "./loader.interface";

/**
 * @description: access the native document object
 */
declare const document: any;

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

  public load(options: LoaderOptions,
    isLoaded$?: AsyncSubject<boolean>): Observable<boolean> {
    isLoaded$ = isLoaded$ || new AsyncSubject<boolean>();

    // reusable configuration for various node events
    const config: NodeOptions = {
      options: options,
      isLoaded$: isLoaded$
    };

    // get the index of current request to check if the
    // current script/stylesheet was already loaded.
    const currIdx: number = this.queue.findIndex(
      req => req.url === options.url
    );

    // if the file is already loading push the request to the queue bucket
    // if the file ain't loading, process it.
    if (this.loading) {
      !this.queue[currIdx] ? this.queue.push(config) : null;
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
    if (!options.isStylesheet) {
      this.loadScript(config);
    } else {
      this.loadStylesheet(config);
    }

    // return an observable so user can subscribe to it.
    return isLoaded$.asObservable();
  }

  private processLoading(e: NodeLoadEvent<HTMLElement>): void {
    // gets called on file load
    const el: HTMLElement = e.el;
    (<any>el).onreadystatechange = el.onload = this.onload.bind(this, {
      el: el,
      options: e.options,
      isLoaded$: e.isLoaded$
    });

    // gets called on file load error
    el.onerror = this.onerror.bind(this, {
      options: e.options,
      isLoaded$: e.isLoaded$
    });

    // use body if available. more safe in IE
    // (document.body || head).appendChild(styles);
    e.options.targetElement.appendChild(el);
  }

  private loadScript(opts: NodeOptions): void {
    type Script = HTMLScriptElement;
    const el: Script  = <Script>document.createElement("script");

    el.src = opts.options.url;
    el.type = "text/javascript";
    el.id = opts.options.elementId;
    el.async = opts.options.async || false;

    this.processLoading({
      el: el,
      options: opts.options,
      isLoaded$: opts.isLoaded$
    });
  }

  private loadStylesheet(opts: NodeOptions): void {
    type Style = HTMLLinkElement;
    const el: Style = <Style>document.createElement("link");

    el.media = "screen";
    el.type = "text/css";
    el.rel = "stylesheet";
    el.href = opts.options.url;
    el.id = opts.options.elementId;
  
    this.processLoading({
      el: el,
      options: opts.options,
      isLoaded$: opts.isLoaded$
    });
  }

  private preset<T>(pre: NodePreset, dataType: string): T {
    if (typeof pre.originalValue !== dataType) {
      pre.originalValue = pre.fallbackValue;
    }
    return pre.originalValue;
  }

  private loadNextQueueRequest(): void {
    const nextQueueItem: any = this.queue.shift();

    if (!!nextQueueItem) {
      this.load(nextQueueItem.options, nextQueueItem.isLoaded$);
    }
  }

  private onload(e: NodeLoadEvent<SupportedElements>): void {
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

  private onerror(e: NodeLoadEvent<any>): void {
    e.isLoaded$.error({
      isLoaded: false,
      options: e.options
    });
    e.isLoaded$.complete();

    this.loading = false;

    // load the next request in the queue
    this.loadNextQueueRequest();
  }
}
