import { ErrorHandler, Injectable } from '@angular/core';
import { logError } from './log';

@Injectable()
export class LoggingErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    logError('Uncaught error', error);
  }
}
