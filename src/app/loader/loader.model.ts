import { LoaderService } from "./loader.service";
import { AsyncSubject } from "rxjs/Rx";
import { NodeOptions, LoaderOptions, NodeLoadEvent } from "./loader.interface";

export class LoaderModel {
  public el: HTMLElement;
  public options: LoaderOptions;
  public isLoaded$: AsyncSubject<LoaderEvent>;

  constructor(opts: NodeOptions, el?: HTMLElement) {
    this.el = el || null;
    this.options = opts.options;
    this.isLoaded$ = opts.isLoaded$;
  }
}

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
