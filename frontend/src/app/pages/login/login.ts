import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  imports: [FormsModule, NgIf],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private cdr  = inject(ChangeDetectorRef);

  email = '';
  password = '';
  error = '';
  loading = false;

  submit() {
    this.error = '';
    this.loading = true;
    this.auth.login(this.email, this.password).pipe(
      timeout(8000)
    ).subscribe({
      next: (res) => {
        const dest = res.user.role === 'ADMIN' ? '/dashboard' : '/tasks';
        this.router.navigate([dest]);
      },
      error: (err: any) => {
        this.error = err?.name === 'TimeoutError'
          ? 'El servidor tardó demasiado. Intenta de nuevo.'
          : (err?.error?.message ?? 'Error al iniciar sesión');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
