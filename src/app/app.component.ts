import { Component, OnInit } from '@angular/core';
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
  constructor(private loaderService: LoaderService) {}

  ngOnInit(): void {
    // this.loaderService.load({
    //   url: 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.0.0-beta/css/bootstrap.css',
    //   targetElement: (<any>document).getElementsByTagName('head')[0]
    // }).subscribe(v => {
    //   console.log(v);
    // }, (v) => {
    //   alert(v.isLoaded);
    // });

    // this.loaderService.load({
    //   url: 'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
    //   isStylesheet: true,
    //   targetElement: (<any>document).getElementsByTagName('head')[0]
    // }).subscribe(v => {
    //   console.log(v);
    // }, (v) => {
    //   alert(v.isLoaded);
    // });

    // this.loaderService.load({
    //   url: 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.0.0-beta/js/bootstrap.min.js',
    //   isStylesheet: false,
    //   targetElement: (<any>document).getElementsByTagName('head')[0]
    // }).subscribe(v => {
    //   console.log(v);
    // }, (v) => {
    //   alert(v.isLoaded);
    // });
    const head: HTMLElement = (<any>document).getElementsByTagName('head')[0];
    const config: any[] = [
      {
        url:
          'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
        targetElement: head
      },
      {
        url:
          'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.0.0-beta/css/bootstrap.css',
        targetElement: head
      },
      {
        url:
          'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.0.0-beta/js/bootstrap.min.js',
        targetElement: head
      },
      {
        url:
          'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.0.0-beta/js/bootstrap.min.js',
        targetElement: head
      }
    ];

    config.forEach(item => {
      this.loaderService.load(item).subscribe(
        v => {
          console.log(v);
        },
        v => {
          alert(v.isLoaded);
        }
      );
    });
  }

  public deleteAll(): void {
    this.loaderService.removeAll();
  }
}
