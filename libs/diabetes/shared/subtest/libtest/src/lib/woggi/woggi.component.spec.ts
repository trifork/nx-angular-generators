import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WoggiComponent } from './woggi.component';

describe('WoggiComponent', () => {
  let component: WoggiComponent;
  let fixture: ComponentFixture<WoggiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WoggiComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WoggiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
