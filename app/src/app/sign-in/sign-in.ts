import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientResponseError } from 'pocketbase';
import { Server } from '../server/server';

@Component({
  selector: 'app-sign-in',
  imports: [FormsModule],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
})
export class SignIn {
  private readonly server = inject(Server);
  private readonly router = inject(Router);

  protected email = '';
  protected password = '';
  protected serverUrl = this.server.url();
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected async signIn() {
    this.busy.set(true);
    this.error.set('');
    try {
      this.server.setUrl(this.serverUrl);
      await this.server.signIn(this.email.trim(), this.password);
      await this.router.navigateByUrl('/');
    } catch (error) {
      const unreachable = error instanceof ClientResponseError && error.status === 0;
      this.error.set(unreachable ? "Can't reach the server" : 'Wrong email or password');
    } finally {
      this.busy.set(false);
    }
  }
}
