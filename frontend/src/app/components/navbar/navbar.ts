import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  get isAdmin() { return this.auth.isAdmin(); }
  get currentUser() { return this.auth.getUser(); }

  get roleLabel(): string {
    if (this.currentUser?.isSuperUser) return 'Super Usuario';
    return this.currentUser?.role === 'ADMIN' ? 'Administrador' : 'Trabajador';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}