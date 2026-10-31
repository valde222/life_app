import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientResponseError } from 'pocketbase';
import { LocalStore } from '../core/data/local-store';
import { Server } from '../core/server/server';
import { checkServerUrl } from '../core/server/server-url';

@Component({
  selector: 'app-sign-in',
  imports: [FormsModule],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
})
export class SignIn {
  private readonly server = inject(Server);
  private readonly router = inject(Router);
  private readonly store = inject(LocalStore);

  protected email = '';
  protected password = '';
  protected serverUrl = this.server.url();
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
      this.server.setUrl(this.serverUrl);
      await this.server.signIn(this.email.trim(), this.password);
      await this.store.adopt(`${this.server.url()}#${this.server.pb.authStore.record?.id}`);
      await this.router.navigateByUrl('/');
    } catch (error) {
      const status = error instanceof ClientResponseError ? error.status : undefined;
      this.error.set(
        status === 0
          ? "Can't reach the server"
          : status === 429
            ? 'Too many tries. Wait a minute'
            : 'Wrong email or password',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
