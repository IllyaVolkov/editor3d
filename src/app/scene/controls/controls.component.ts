import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.css']
})
export class ControlsComponent {
  @Output() save: EventEmitter<void>;
  @Output() clear: EventEmitter<void>;

  constructor() {
    this.save = new EventEmitter<void>();
    this.clear = new EventEmitter<void>();
  }
}
