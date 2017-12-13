import { NwFsAttachPage } from './app.po';

describe('nw-fs-attach App', () => {
  let page: NwFsAttachPage;

  beforeEach(() => {
    page = new NwFsAttachPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
