import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Flashcard, FlashcardItem, FlashcardService } from '../../../services/flashcard.service';
import { firstValueFrom } from 'rxjs';


@Component({
  selector: 'app-flashcard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .perspective { perspective: 1000px; }
    .backface-hidden { backface-visibility: hidden; }
    .back-side { transform: rotateY(180deg); }
    .flip-card { transform: rotateY(180deg); }
    .transform-gpu { transform-style: preserve-3d; }
  `],
  template: `
    <div class="fixed inset-0 bg-gray-50 flex items-center justify-center">
      <div class="bg-white rounded-3xl shadow-lg max-w-2xl w-full mx-auto">
        <div class="p-6">
          <div class="flex justify-between items-start">
            <div>
              <h2 class="text-lg flex items-center gap-2">
                <span>📑</span> 
                <span>Flashcards: {{title}}</span>
              </h2>
              <div class="mt-2">
                <span class="text-gray-600">Card {{currentIndex + 1}} of {{cards.length}}</span>
                <div class="mt-1 h-1 w-32 bg-gray-200 rounded-full">
                  <div class="h-1 bg-blue-500 rounded-full transition-all duration-300"
                       [style.width.%]="(currentIndex + 1) / cards.length * 100">
                  </div>
                </div>
              </div>
            </div>
            <button (click)="exitFlashcard()" 
                    class="text-gray-400 hover:text-gray-600">×</button>
          </div>
        </div>

        <div class="px-8 py-12">
          <div class="perspective">
            <div class="relative bg-white rounded-xl shadow-sm min-h-[300px] cursor-pointer transform-gpu transition-all duration-500"
                 [class.flip-card]="cards[currentIndex].showBack"
                 (click)="onFlipCard()">
              <div class="absolute inset-0 w-full h-full backface-hidden">
                <div class="flex items-center justify-center h-full p-16">
                  <p class="text-xl text-center">{{cards[currentIndex].front}}</p>
                </div>
              </div>
              <div class="absolute inset-0 w-full h-full backface-hidden back-side">
                <div class="flex items-center justify-center h-full p-16">
                  <p class="text-xl text-center">{{cards[currentIndex].back}}</p>
                </div>
              </div>
            </div>
          </div>
          <p class="mt-6 text-gray-400 text-center">
            Click card or press spacebar to {{cards[currentIndex].showBack ? 'see question' : 'see answer'}}
          </p>
        </div>

        <div class="px-8 pb-6">
          <div class="flex justify-between items-center gap-4 mb-6">
            <button (click)="onPreviousCard()"
                    [disabled]="currentIndex === 0"
                    class="px-6 py-2 text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50">
              ◀ Previous
            </button>

            <div class="flex gap-3">
              <button (click)="onShuffleCards()"
                      class="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                🔄 Shuffle
              </button>
              <button (click)="onResetProgress()"
                      class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                Reset
              </button>
            </div>

            <button (click)="onNextCard()"
                    [disabled]="currentIndex === cards.length - 1"
                    class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
              Next ▶
            </button>
          </div>

          <div class="text-gray-400 text-center text-sm">
            Keyboard shortcuts: ←/→ to navigate • Space to flip
          </div>
        </div>
      </div>
    </div>
  `
})
export class FlashcardComponent implements OnInit {
  title = '1';
  currentIndex = 0;
  cards: FlashcardItem[] = [
    { 
      front: "What is DOM?", 
      back: "Document Object Model - a programming interface for web documents.", 
      showBack: false 
    },
    { 
      front: "What is a 'Promise' in JavaScript?", 
      back: "A Promise represents the eventual result of an asynchronous operation.", 
      showBack: false 
    },
    { 
      front: "Difference between 'let' and 'const'?", 
      back: "'let' allows reassignment, 'const' does not.", 
      showBack: false 
    },
    { 
      front: "Purpose of 'async/await'?", 
      back: "Simplifies asynchronous code, making it more readable.", 
      showBack: false 
    },
    { 
      front: "Difference between '==' and '==='?", 
      back: "'==' compares values, '===' compares both value and type.", 
      showBack: false 
    }
  ];

  constructor(private route: ActivatedRoute, private router: Router, private flashcardService:FlashcardService) {
  
    // if (setId) {
    //   this.title = setId;
    // }
  }

  
  flashcard?:Flashcard;
  
  ngOnInit(): void {
      this.fetchData();
  }
    async fetchData(){
      try{
        const setId = this.route.snapshot.paramMap.get('id');
        const flashcards =(await firstValueFrom(this.flashcardService.getAll()));
        this.flashcard = flashcards.find(f=>f.id == setId);

        this.title = this.flashcard?.docTitle?? 'Please Wait';

        this.cards = this.flashcard?.items ?? [];
  
      }catch(e){}
      
    }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      this.onNextCard();
    } else if (event.key === 'ArrowLeft') {
      this.onPreviousCard();
    } else if (event.key === ' ') {
      event.preventDefault();
      this.onFlipCard();
    }
  }

  onFlipCard(): void {
    this.cards[this.currentIndex].showBack = !this.cards[this.currentIndex].showBack;
  }

  onNextCard(): void {
    if (this.currentIndex < this.cards.length - 1) {
      this.currentIndex++;
      this.cards[this.currentIndex].showBack = false;
    }
  }

  onPreviousCard(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.cards[this.currentIndex].showBack = false;
    }
  }

  onShuffleCards(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    this.currentIndex = 0;
    this.onResetProgress();
  }

  onResetProgress(): void {
    this.cards.forEach(card => card.showBack = false);
    this.currentIndex = 0;
  }

  exitFlashcard(): void {
    this.router.navigate(['/homepage/assess']);
  }
}