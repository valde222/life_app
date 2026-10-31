import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { checkServerUrl } from '../../core/server/server-url';
import { Session, SignInError, SignInFailure } from '../../core/session/session';

const FAILURE_MESSAGES: Record<SignInFailure, string> = {
  unreachable: "Can't reach the server",
  throttled: 'Too many tries. Wait a minute',
  refused: 'Wrong email or password',
};

@Component({
  selector: 'app-sign-in',
  imports: [FormsModule],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
})
export class SignIn {
  private readonly session = inject(Session);
  private readonly router = inject(Router);

  protected email = '';
  protected password = '';
  protected serverUrl = this.session.serverUrl();
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected async signIn() {
    const urlProblem = checkServerUrl(this.serverUrl);
    if (urlProblem) {
      this.error.set(urlProblem);
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      await this.session.signIn(this.serverUrl, this.email.trim(), this.password);
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.error.set(FAILURE_MESSAGES[error instanceof SignInError ? error.failure : 'refused']);
    } finally {
      this.busy.set(false);
    }
  }
}
