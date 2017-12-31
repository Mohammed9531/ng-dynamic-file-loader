import { element } from 'protractor';
import { Component, OnInit } from '@angular/core';
import { URLS, STATUS_MAPPING } from './app.constants';
import { LoaderService } from './loader/loader.service';

/**
 * @author: Shoukath Mohammed
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public config: any[];

  constructor(private loaderService: LoaderService) {}

  public ngOnInit(): void {
    this.init();
  }

  public deleteAll(): void {
    this.loaderService.removeAll();

    this.config.forEach((resource) => {
      resource.status = 'Not Started';
    });
  }

  public load(resource: any, e?: Event): void {
   (e) ? e.preventDefault() : undefined;

    const idx: number = this.config.findIndex((i) => {
      return i.cid === resource.cid;
    });

    this.loaderService
    .load(resource.data)
    .subscribe(
      r => {
        this.onLoad(idx, r);
      },
      err => {
        this.onLoad(idx, err);
      }
    );
  }

  public loadAll(): void {
    this.config.forEach(resource => {
      this.load(resource);
    });
  }

  private onLoad(idx: number, result: any): void {
    this.config[idx].status = this.getStatus(result);
    this.config[idx].logs.push(result);
  }

  public remove(e: Event, resource: any): void {
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
}
