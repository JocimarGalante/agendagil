import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgendaComponent } from './agenda/agenda.component';
import { AgendaListComponent } from './agenda-list/agenda-list.component';
import { AgendaFormComponent } from './agenda-form/agenda-form.component';



@NgModule({
  declarations: [
    AgendaComponent,
    AgendaListComponent,
    AgendaFormComponent
  ],
  imports: [
    CommonModule
  ]
})
export class SchedulingModule { }
