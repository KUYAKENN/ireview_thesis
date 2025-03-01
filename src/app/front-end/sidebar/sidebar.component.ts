import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside [class.collapsed]="isCollapsed">
      <div class="logo">
        <span>iReview</span>
      </div>

      <nav>
        <a routerLink="/homepage/documents" routerLinkActive="active" (click)="navigate()" class="nav-item">
          <div class="icon">📄</div>
          <span>Documents</span>
        </a>
        <a routerLink="/homepage/learn" routerLinkActive="active" (click)="navigate()" class="nav-item">
          <div class="icon">📚</div>
          <span>Learn</span>
        </a>
        <a routerLink="/homepage/assess" routerLinkActive="active" (click)="navigate()" class="nav-item">
          <div class="icon">✍️</div>
          <span>Assess</span>
        </a>
        <a routerLink="/homepage/progress" routerLinkActive="active" (click)="navigate()" class="nav-item">
          <div class="icon">📊</div>
          <span>Progress</span>
        </a>
        <a routerLink="/homepage/user" routerLinkActive="active" (click)="navigate()" class="nav-item">
          <div class="icon">👤</div>
          <span>User</span>
        </a>
      </nav>

      <div class="footer">
        <button class="toggle-btn" (click)="toggleSidebar()">
          {{ isCollapsed ? '▶' : '◀' }}
        </button>
      </div>
    </aside>
  `,
  styles: [`
    aside {
      width: 250px;
      background: #2c3e50;
      color: white;
      height: 100vh;
      position: fixed;
      transition: width 0.3s ease;
      box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    aside.collapsed {
      width: 80px;
    }
    
    .logo {
      font-size: 1.5rem;
      padding: 1.5rem;
      font-weight: bold;
      text-align: center;
      background: #34495e;
    }
    
    nav {
      display: flex;
      flex-direction: column;
      padding: 1rem;
    }

    .nav-item {
      text-decoration: none;
      color: white;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: background 0.3s, padding 0.3s;
      border-radius: 8px;
    }

    .nav-item.active {
      background: #34495e;
    }

    .nav-item:hover {
      background: #34495e;
    }

    .icon {
      font-size: 1.2rem;
    }

    .footer {
      padding: 1rem;
      text-align: center;
      border-top: 1px solid #34495e;
    }

    .toggle-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 1.2rem;
      transition: transform 0.3s ease;
    }

    .toggle-btn:hover {
      transform: scale(1.1);
    }

    aside.collapsed .logo span,
    aside.collapsed .nav-item span {
      display: none;
    }

    aside.collapsed .nav-item {
      justify-content: center;
    }
  `]
})
export class SidebarComponent {
  isCollapsed = false;
  @Output() toggleEvent = new EventEmitter<boolean>();

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.toggleEvent.emit(this.isCollapsed);
  }

  navigate() {
    this.toggleEvent.emit(this.isCollapsed); // Keep sidebar state updated
  }
}