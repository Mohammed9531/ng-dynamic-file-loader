import { LoaderService } from './loader.service';
import { AsyncSubject } from 'rxjs/Rx';
import { NodeOptions, LoaderOptions, NodeLoadEvent } from './loader.interface';

export class LoaderModel {
    public el: HTMLElement;
    public options: LoaderOptions;
    public isLoaded$: AsyncSubject<boolean>;

    constructor(opts: NodeOptions, el?: HTMLElement) {
        this.el = el || null;
        this.options = opts.options;
        this.isLoaded$ = opts.isLoaded$
    }
}

// export class LoaderEventModel {
//     public isLoaded: boolean;
//     public isQueued: boolean;
//     public isLoading: boolean;

//     constructor(loader: any) {
//         this.isQueued = loader.isQueued || false;
//         this.isLoading = loader.isLoading;
//     }
// }