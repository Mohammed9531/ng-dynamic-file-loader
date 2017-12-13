import { Injectable } from '@angular/core';
import { LoaderOptions, NodeLoadEvent, NodeOptions } from './loader.interface';
import { AsyncSubject, BehaviorSubject, Observable } from 'rxjs/Rx';

// access the native document
declare const document: any;

/**
 * @author: Shoukath Mohammed 
 */
@Injectable()
export class LoaderService {

  private loading: boolean;
  private queue: any[] = [];
  private loadingFile: any = {};
  private loadedFiles: any = {};
  private isLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor() { }

  public load(options: LoaderOptions, isLoaded$?: AsyncSubject<boolean>): Observable<boolean> {
    isLoaded$ =  isLoaded$ || new AsyncSubject<boolean>();
    const currIdx: number = this.queue.findIndex((req) => req.url === options.url);

    // if the file is already loading push the request to the queue bucket 
    // if the file ain't loading, process it.
    if (this.loading) {
      const config: any = {
        options: options,
        isLoaded$: isLoaded$
      };
      !this.queue[currIdx] ? this.queue.push(config) : null;
      return isLoaded$.asObservable();
    }
    // process the rquest 
    else {
      this.loading = true;
      this.loadingFile[options.url] = true;
    }

    /**
     * process file based on the file type, currently it only supports
     * stylesheet or a script
     */
    const opts: NodeOptions = {
      options: options,
      isLoaded$: isLoaded$
    };
    if (!options.isStylesheet) {
      this.loadScript(opts);
    }
    else {
      this.loadStylesheet(opts);
    }
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
    let el_: HTMLScriptElement = <HTMLScriptElement>document.createElement('script');

    el_.src   = opts.options.url;
    el_.type  = 'text/javascript';
    el_.id    = opts.options.elementId;
    el_.async = opts.options.async || false;
    this.processLoading({ el: el_, options: opts.options, isLoaded$: opts.isLoaded$ });
  }

  private loadStylesheet(opts: NodeOptions): void {
    let el_: HTMLLinkElement = <HTMLLinkElement>document.createElement('link');

    el_.media = 'screen';
    el_.type  = 'text/css';
    el_.rel   = 'stylesheet';
    el_.href  = opts.options.url;
    el_.id    = opts.options.elementId;
    this.processLoading({ el: el_, options: opts.options, isLoaded$: opts.isLoaded$ });
  }

  private preset(originalValue: any, fallbackValue: any): boolean {
    if (typeof originalValue !== 'boolean') {
      originalValue = fallbackValue;
    }
    return originalValue;
  }

  private onload(e: NodeLoadEvent<HTMLLinkElement>): void {
    const state: any = (<any>e.el).readyState;

    if (!this.loadedFiles[e.options.url] && 
      (!state || /loaded|complete/.test(state))) {
  
      this.loadedFiles[e.options.url] = true;
      delete this.loadingFile[e.options.url];
      e.isLoaded$.next(true);
      e.isLoaded$.complete();
      this.loading = false;

      this.loadNextQueueRequest();
    }
  }

  private onerror(e: NodeLoadEvent<any>): void {
    e.isLoaded$.error({
      isLoaded: false,
      options: e.options
    });
    e.isLoaded$.complete();

    this.loading =  false;
    this.loadNextQueueRequest();
  }

  private loadNextQueueRequest(): void {
    const nextQueueItem: any = this.queue.shift();

    if (!!nextQueueItem) {
      this.load(nextQueueItem.options, nextQueueItem.isLoaded$);
    }
  }
}
