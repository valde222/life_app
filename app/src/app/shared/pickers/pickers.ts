import { inject, Injectable } from '@angular/core';
import { Sheets } from '../ui/sheet';
import { DatePicker, DatePickerData, DatePickerResult } from './date-picker';
import { LinkPicker, LinkPickerData, LinkPickerResult } from './link-picker';
import { MoveTo, MoveToData } from './move-to';
import { ReminderPicker, ReminderPickerData } from './reminder-picker';
import { TimePicker, TimePickerData, TimePickerResult } from './time-picker';

@Injectable({ providedIn: 'root' })
export class Pickers {
  private readonly sheets = inject(Sheets);

  list(current: string): Promise<string | undefined> {
    return this.sheets.open<string, MoveToData>(MoveTo, { current }).closed;
  }

  date(data: DatePickerData): Promise<DatePickerResult | undefined> {
    return this.sheets.open<DatePickerResult, DatePickerData>(DatePicker, data).closed;
  }

  time(data: TimePickerData): Promise<TimePickerResult | undefined> {
    return this.sheets.open<TimePickerResult, TimePickerData>(TimePicker, data).closed;
  }

  reminder(data: ReminderPickerData): Promise<string | undefined> {
    return this.sheets.open<string, ReminderPickerData>(ReminderPicker, data).closed;
  }

  links(data: LinkPickerData): Promise<LinkPickerResult | undefined> {
    return this.sheets.open<LinkPickerResult, LinkPickerData>(LinkPicker, data, {
      panelClass: ['sheet-panel', 'sheet-tall'],
    }).closed;
  }
}
