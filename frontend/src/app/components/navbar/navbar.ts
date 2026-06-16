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

  readonly isAdmin = this.auth.isAdmin();

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}