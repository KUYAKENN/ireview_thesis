import { Component, Input, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, UserProfile } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { ProfileComponent } from '../front-end/user/profile/profile.component';
import { trigger, transition, style, animate } from '@angular/animations';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [CommonModule, ProfileComponent],
  animations: [
    trigger('dropdownAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-8px)' }))
      ])
    ]),
    trigger('backdropAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translate(-50%, -48%)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translate(-50%, -50%)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translate(-50%, -48%)' }))
      ])
    ])
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() isSidebarCollapsed = false;
  showProfileMenu = false;
  showProfileModal = false;
  user: UserProfile | null = null;
  hasNotification = true; // You can toggle this based on your notification logic
  private userSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (!user) {
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  getProfileLink(profile_path:string|null|undefined){
    if(!profile_path){
      return null;
    }
    return environment.publicUrl + '/uploads/profiles/' + profile_path
  }
  toggleProfileMenu(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showProfileMenu = !this.showProfileMenu;
  }

  openProfileModal() {
    this.router.navigate(['/homepage/user'])
    // this.showProfileModal = true;
    // this.showProfileMenu = false;
  }

  closeProfileModal() {
    this.showProfileModal = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    if (this.showProfileMenu) {
      const profileSection = document.querySelector('.profile-section');
      const profileMenu = document.querySelector('.profile-menu');
      
      if (!profileSection?.contains(event.target as Node) && 
          !profileMenu?.contains(event.target as Node)) {
        this.showProfileMenu = false;
      }
    }
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey() {
    this.showProfileMenu = false;
    this.showProfileModal = false;
  }
}