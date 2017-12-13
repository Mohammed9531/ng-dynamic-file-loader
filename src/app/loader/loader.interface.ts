import { AsyncSubject } from 'rxjs/Rx';

export interface LoaderOptions {
    url: string;
    targetElement: HTMLElement,
    elementId?: string;
    loadAfter?: boolean;
    loadAfterElement?: HTMLElement;
    isStylesheet: boolean;
    async?: boolean;
};


export interface NodeLoadEvent<T> {
    el?: T;
    options?: LoaderOptions;
    isLoaded$?: AsyncSubject<boolean>;
};

export interface NodeOptions {
    options?: LoaderOptions;
    isLoaded$: AsyncSubject<boolean>
}