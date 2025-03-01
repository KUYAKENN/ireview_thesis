import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessComponent } from './assess.component';

describe('AssessComponent', () => {
  let component: AssessComponent;
  let fixture: ComponentFixture<AssessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
