import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../../header/header.component';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="layout">
      <app-sidebar (toggleEvent)="toggleSidebar($event)"></app-sidebar>
      <div class="main-content" [class.collapsed]="isSidebarCollapsed">
        <app-header [isSidebarCollapsed]="isSidebarCollapsed"></app-header>
        <div class="page-content">
          <router-outlet></router-outlet> <!-- ✅ This ensures navigation updates content -->
        </div>
      </div>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      height: 100vh;
      transition: margin-left 0.3s ease;
    }

    .main-content {
      flex-grow: 1;
      padding: 2rem;
      margin-left: 250px;
      transition: margin-left 0.3s ease;
    }

    .main-content.collapsed {
      margin-left: 80px;
    }

    .page-content {
      margin-top: 20px;
    }
  `]
})
export class HomepageComponent {
  isSidebarCollapsed = false;

  toggleSidebar(isCollapsed: boolean) {
    this.isSidebarCollapsed = isCollapsed;
  }
}
