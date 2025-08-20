import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewComponents } from './view-components';

describe('ViewComponents', () => {
  let component: ViewComponents;
  let fixture: ComponentFixture<ViewComponents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewComponents]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewComponents);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
