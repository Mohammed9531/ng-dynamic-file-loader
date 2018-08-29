import { element } from 'protractor';
import { URLS, STATUS_MAPPING } from './app.constants';
import { LoaderService } from './loader/loader.service';
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

const noop: Function = (): void => {};

/**
 * @author: Shoukath Mohammed
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  public config: any[];
  public currIdx: number;
  public results: any = {};

  constructor(
    private cdr: ChangeDetectorRef,
    private loaderService: LoaderService
  ) {}

  public ngOnInit(): void {
    this.init();
    this.logger();
  }

  public removeAll(): void {
    this.currIdx = null;
    this.results.all = [];
    this.loaderService.removeAll();

    this.config.forEach(resource => {
      resource.status = 'Not Started';
    });
  }

  public load(
    resource: any,
    e?: Event,
    activeIdx?: number,
    reqType?: string
  ): void {
    e ? e.preventDefault() : noop();
    this.currIdx = activeIdx;
    this.results[this.currIdx] = [];

    const idx: number = this.config.findIndex(i => {
      return i.cid === resource.cid;
    });

    this.loaderService.load(resource.data).subscribe(
      r => {
        this.onLoad(idx, r, reqType);
      },
      err => {
        this.onLoad(idx, err, reqType);
      }
    );
  }

  public loadAll(): void {
    this.results.all = [];
    this.config.forEach(resource => {
      this.load(resource, null, null, 'all');
    });
  }

  private onLoad(idx: number, result: any, reqType: string): void {
    const status: string = this.getStatus(result);
    this.config[idx].status = status;
    this.config[idx].logs.push(result);
  }

  public remove(e: Event, resource: any): void {
    this.currIdx = null;
    this.loaderService.remove(resource.data.elementId);
    resource.status = 'Not Started';
  }

  private init(): void {
    let counter: number = 0;
    const head: HTMLElement = (<any>document).getElementsByTagName('head')[0];
    const config: any[] = [];

    for (let i = 0; i < URLS.length; i++) {
      const obj: any = {};
      const cid: string = counter + '';

      obj.data = {
        cid: cid,
        url: URLS[i],
        debug: true,
        targetElement: head
      };
      counter++;

      obj.cid = cid;
      obj.logs = [];
      obj.status = 'Not Started';
      config.push(obj);
    }
    this.config = config;
  }

  private getStatus(result: any): string {
    let status: string = 'Not Started';
    const keys: string[] = Object.keys(result);

    for (let i = 0; i < keys.length; i++) {
      if (keys[i] !== 'data' && result[keys[i]]) {
        status = STATUS_MAPPING[keys[i]];
        break;
      }
    }
    return status;
  }

  private logger(): void {
    this.loaderService.logger$.subscribe(v => {
      if (!!this.currIdx && this.currIdx >= 0) {
        this.results[this.currIdx].push(v);
      } else {
        this.results['all'].push(v);
      }
      this.cdr.detectChanges();
    });
  }
}


