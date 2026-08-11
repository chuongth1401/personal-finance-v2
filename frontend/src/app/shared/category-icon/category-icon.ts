import { Component, input } from '@angular/core';
import {
  LucideBanknote,
  LucideBriefcase,
  LucideCar,
  LucideFilm,
  LucideGift,
  LucideGraduationCap,
  LucideHeartPulse,
  LucideHome,
  LucidePiggyBank,
  LucideReceipt,
  LucideShoppingBag,
  LucideTag,
  LucideUtensils,
  LucideWallet,
} from '@lucide/angular';

import { CategoryIconKey } from '../../core/utils/category-icons';

@Component({
  selector: 'app-category-icon',
  imports: [
    LucideUtensils,
    LucideCar,
    LucideShoppingBag,
    LucideReceipt,
    LucideFilm,
    LucideHeartPulse,
    LucideHome,
    LucideGraduationCap,
    LucideBanknote,
    LucideGift,
    LucideWallet,
    LucidePiggyBank,
    LucideBriefcase,
    LucideTag,
  ],
  template: `
    @switch (icon()) {
      @case ('utensils') {
        <svg lucideUtensils [size]="size()" />
      }
      @case ('car') {
        <svg lucideCar [size]="size()" />
      }
      @case ('shopping-bag') {
        <svg lucideShoppingBag [size]="size()" />
      }
      @case ('receipt') {
        <svg lucideReceipt [size]="size()" />
      }
      @case ('film') {
        <svg lucideFilm [size]="size()" />
      }
      @case ('heart-pulse') {
        <svg lucideHeartPulse [size]="size()" />
      }
      @case ('home') {
        <svg lucideHome [size]="size()" />
      }
      @case ('graduation-cap') {
        <svg lucideGraduationCap [size]="size()" />
      }
      @case ('banknote') {
        <svg lucideBanknote [size]="size()" />
      }
      @case ('gift') {
        <svg lucideGift [size]="size()" />
      }
      @case ('wallet') {
        <svg lucideWallet [size]="size()" />
      }
      @case ('piggy-bank') {
        <svg lucidePiggyBank [size]="size()" />
      }
      @case ('briefcase') {
        <svg lucideBriefcase [size]="size()" />
      }
      @default {
        <svg lucideTag [size]="size()" />
      }
    }
  `,
})
export class CategoryIcon {
  readonly icon = input<CategoryIconKey | string | null>(null);
  readonly size = input<number>(16);
}
