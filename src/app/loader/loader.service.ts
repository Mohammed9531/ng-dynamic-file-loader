import { Injectable } from '@angular/core';
import { LoaderOptions, NodeLoadEvent } from './loader.interface';
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
    if (!options.isStylesheet) {
      this.loadScript(options, isLoaded$);
    }
    else {
      this.loadStylesheet(options, isLoaded$);
    }
    return isLoaded$.asObservable();
  }

  private loadScript(options: LoaderOptions, isLoaded$: AsyncSubject<boolean>): void {

  }

  private loadStylesheet(options: LoaderOptions, isLoaded$: AsyncSubject<boolean>): void {
    let el: HTMLLinkElement = <HTMLLinkElement>document.createElement('link');

    el.rel = 'stylesheet';
    el.type = 'text/css';
    el.media = 'screen';
    el.href = options.url;

    // gets called on file load
    (<any>el).onreadystatechange = el.onload = this.onload.bind(this, {
      el: el,
      options: options,
      isLoaded$: isLoaded$
    });

    // gets called on file load error
    el.onerror = this.onerror.bind(this, {
      options: options,
      isLoaded$: isLoaded$
    });

    // use body if available. more safe in IE
    // (document.body || head).appendChild(styles);
    options.targetElement.appendChild(el);
  }

  private preset(originalValue: any, fallbackValue: any): boolean {
    if (typeof originalValue !== 'boolean') {
      originalValue = fallbackValue;
    }
    return originalValue;
  }

  private onload(e: NodeLoadEvent<HTMLLinkElement>): void {
    const state: any = (<any>e.el).readyState;

    if (!this.loadedFiles[e.options.url] && (!state || /loaded|complete/.test(state))) {
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
