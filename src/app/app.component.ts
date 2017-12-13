import { Component, OnInit } from '@angular/core';
import { LoaderService } from './loader/loader.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(private loaderService: LoaderService ) {}

  ngOnInit(): void {
    let counter = 0;

    this.loaderService.load({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.0.0-beta/css/bootstrap.css',
      isStylesheet: true,
      targetElement: (<any>document).getElementsByTagName('head')[0]
    }).subscribe(v => {
      console.log(`Loaded: ${++counter}`);
    }, (v) => {
      alert(v.isLoaded);
    });

    this.loaderService.load({
      url: 'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
      isStylesheet: true,
      targetElement: (<any>document).getElementsByTagName('head')[0]
    }).subscribe(v => {
      console.log(`Loaded: ${++counter}`);
    }, (v) => {
      alert(v.isLoaded);
    });
  }
}
