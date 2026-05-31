import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DepartmentsService, Department } from '../../services/departments.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent implements OnInit {
  private auth = inject(AuthService);
  private deptService = inject(DepartmentsService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  departmentId: number | null = null;
  departments: Department[] = [];
  error = '';
  loading = false;

  ngOnInit() {
    this.deptService.getAll().subscribe({
      next: (res: { departments: Department[] }) => this.departments = res.departments,
      error: () => {}
    });
  }

  submit() {
    this.error = '';
    this.loading = true;
    this.auth.register({ name: this.name, email: this.email, password: this.password, departmentId: this.departmentId! }).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err: any) => {
        this.error = err?.error?.message ?? 'Registration failed';
        this.loading = false;
      },
    });
  }
}
