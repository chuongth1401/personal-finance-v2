import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './settings.html',
})
export class Settings {
  protected readonly saved = signal(false);

  protected readonly form = new FormGroup({
    displayName: new FormControl('Người dùng', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('user@example.com', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    budgetAlertThreshold: new FormControl(80, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(100)],
    }),
    emailNotifications: new FormControl(true, { nonNullable: true }),
    budgetAlerts: new FormControl(true, { nonNullable: true }),
  });

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.saved.set(false);
      return;
    }
    this.saved.set(true);
  }
}
