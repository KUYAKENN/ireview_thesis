import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, ChartOptions, registerables } from 'chart.js';
import { AttemptData, Quiz, QuizService } from '../../services/quiz.service';
import { firstValueFrom } from 'rxjs';

Chart.register(...registerables);

interface QuizProgress {
  topic: string;
  attempt: number;
  score: number;
  maxScore: number;
  date?: Date;
}

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-100">
      <!-- Main Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-800 py-8">
        <div class="max-w-7xl mx-auto px-4">
          <h1 class="text-3xl font-bold text-white mb-2">Quiz Progress Analysis</h1>
          <p class="text-blue-100">Track your learning journey and performance improvements</p>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 py-6">
        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div class="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Attempts</p>
                <p class="text-2xl font-bold text-gray-900">{{ quizData.length }}</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span class="text-blue-600 text-xl">📝</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Average Score</p>
                <p class="text-2xl font-bold text-gray-900">{{ getAverageScore() }}%</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <span class="text-green-600 text-xl">📊</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Unique Topics</p>
                <p class="text-2xl font-bold text-gray-900">{{ uniqueTopics.length }}</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <span class="text-purple-600 text-xl">📚</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Filter Section -->
        <div class="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Topic</label>
              <select
                [(ngModel)]="selectedTopic"
                (change)="updateChart()"
                class="w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
              >
                <option value="All">All Topics</option>
                <option *ngFor="let t of uniqueTopics" [value]="t">{{ t }}</option>
              </select>
            </div>
            <div class="flex-1">
              <div class="text-sm text-gray-600 mb-2">Performance Overview</div>
              <div class="flex gap-4">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-green-500"></div>
                  <span class="text-sm text-gray-600">High (≥70%)</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span class="text-sm text-gray-600">Medium (40-69%)</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-red-500"></div>
                  <span class="text-sm text-gray-600">Low (<40%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Content Area -->
        <div *ngIf="filteredData.length > 0; else noData">
          <!-- Quiz Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div 
              *ngFor="let quiz of filteredData"
              class="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border border-gray-200"
            >
              <div class="flex items-start justify-between mb-4">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">{{ quiz.topic }}</h3>
                  <p class="text-sm text-gray-600">Attempt {{ quiz.attempt }}</p>
                </div>
                <div [ngClass]="{
                  'bg-green-100 text-green-800': getProgressPercentage(quiz.score, quiz.maxScore) >= 70,
                  'bg-yellow-100 text-yellow-800': getProgressPercentage(quiz.score, quiz.maxScore) >= 40 && getProgressPercentage(quiz.score, quiz.maxScore) < 70,
                  'bg-red-100 text-red-800': getProgressPercentage(quiz.score, quiz.maxScore) < 40
                }" class="px-3 py-1 rounded-full text-sm font-medium">
                  {{ quiz.score }}/{{ quiz.maxScore }}
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="relative pt-1">
                <div class="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200">
                  <div
                    [style.width]="getProgressWidth(quiz.score, quiz.maxScore)"
                    [ngClass]="{
                      'bg-green-500': getProgressPercentage(quiz.score, quiz.maxScore) >= 70,
                      'bg-yellow-500': getProgressPercentage(quiz.score, quiz.maxScore) >= 40 && getProgressPercentage(quiz.score, quiz.maxScore) < 70,
                      'bg-red-500': getProgressPercentage(quiz.score, quiz.maxScore) < 40
                    }"
                    class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500"
                  ></div>
                </div>
                <div class="flex justify-between mt-1">
                  <span class="text-xs text-gray-600">Score</span>
                  <span class="text-xs font-medium text-gray-900">
                    {{ getProgressPercentage(quiz.score, quiz.maxScore) }}%
                  </span>
                </div>
              </div>

              <div class="mt-4 pt-4 border-t border-gray-100">
                <div class="flex justify-between items-center text-sm">
                  <span class="text-gray-600">
                    {{ quiz.date | date:'MMM d, y' }}
                  </span>
                  <span [ngClass]="{
                    'text-green-600': getProgressPercentage(quiz.score, quiz.maxScore) >= 70,
                    'text-yellow-600': getProgressPercentage(quiz.score, quiz.maxScore) >= 40 && getProgressPercentage(quiz.score, quiz.maxScore) < 70,
                    'text-red-600': getProgressPercentage(quiz.score, quiz.maxScore) < 40
                  }" class="font-medium">
                    {{ getPerformanceLabel(quiz.score, quiz.maxScore) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Chart -->
          <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 mb-6">Performance Trend</h3>
            <div class="h-[400px] w-full">
              <canvas #chartCanvas></canvas>
            </div>
          </div>
        </div>

        <ng-template #noData>
          <div class="text-center py-12 bg-white rounded-xl shadow-sm">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl">📊</span>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Quiz Attempts Yet</h3>
            <p class="text-gray-600">Complete some quizzes to see your progress analysis</p>
          </div>
        </ng-template>
      </div>
    </div>
  `
})
export class ProgressComponent implements AfterViewInit, OnInit {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;
  quizData: QuizProgress[] = [];
  selectedTopic = 'All';
  private quizzes: Quiz[] = [];

  constructor(private quizService: QuizService) {}

  async ngOnInit() {
    await this.fetchData();
  }

  ngAfterViewInit() {
    if (this.quizData.length > 0 && this.chartCanvas) {
      setTimeout(() => {
        this.initializeChart();
      }, 0);
    }
  }

  async fetchData() {
    try {
      this.quizzes = await firstValueFrom(this.quizService.getAll());
      const attempts = await this.quizService.getAllAttempts();

      this.quizData = attempts.reduce((acc: QuizProgress[], attempt: AttemptData) => {
        const quiz = this.quizzes.find(q => q.id === attempt.quiz_id);
        if (!quiz) return acc;

        const existingAttempts = acc.filter(a => a.topic === quiz.docTitle).length;

        return [...acc, {
          topic: quiz.docTitle,
          attempt: existingAttempts + 1,
          score: attempt.score,
          maxScore: attempt.totalQuestions,
          date: new Date(attempt.end_time)
        }];
      }, []);

      this.quizData.sort((a, b) => {
        if (a.topic === b.topic) {
          return a.attempt - b.attempt;
        }
        return a.topic.localeCompare(b.topic);
      });

    } catch (error) {
      console.error('Error fetching quiz data:', error);
    }
  }

  get uniqueTopics(): string[] {
    return Array.from(new Set(this.quizData.map(q => q.topic)));
  }

  get filteredData(): QuizProgress[] {
    if (this.selectedTopic === 'All') {
      return this.quizData;
    }
    return this.quizData.filter(q => q.topic === this.selectedTopic);
  }

  getAverageScore(): number {
    if (this.quizData.length === 0) return 0;
    const totalPercentage = this.quizData.reduce((sum, quiz) => 
      sum + this.getProgressPercentage(quiz.score, quiz.maxScore), 0);
    return Math.round(totalPercentage / this.quizData.length);
  }

  private initializeChart() {
    if (!this.chartCanvas) return;
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    // Prepare data based on selected topic
    const datasets = [];
    const labels = [];

    if (this.selectedTopic === 'All') {
      // For All topics view
      const topics = this.uniqueTopics;
      const maxAttempt = Math.max(...this.quizData.map(d => d.attempt));
      
      for (let i = 1; i <= maxAttempt; i++) {
        labels.push(`Attempt ${i}`);
      }

      topics.forEach((topic, index) => {
        const topicData = this.quizData.filter(q => q.topic === topic);
        const data = new Array(maxAttempt).fill(null);
        
        topicData.forEach(q => {
          data[q.attempt - 1] = this.getProgressPercentage(q.score, q.maxScore);
        });

        datasets.push({
          label: topic,
          data: data,
          borderColor: this.getTopicColor(index),
          backgroundColor: `${this.getTopicColor(index)}20`,
          tension: 0.4,
          fill: false
        });
      });
    } else {
      // For single topic view
      const data = this.filteredData;
      labels.push(...data.map(d => `Attempt ${d.attempt}`));
      
      datasets.push({
        label: this.selectedTopic,
        data: data.map(d => this.getProgressPercentage(d.score, d.maxScore)),
        borderColor: this.getTopicColor(0),
        backgroundColor: `${this.getTopicColor(0)}20`,
        tension: 0.4,
        fill: true
      });
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value) => `${value}%`
            },
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 12,
            titleColor: '#fff',
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            bodySpacing: 8,
            callbacks: {
              label: function(context: any) {
                return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
              }
            }
          }
        }
      }
    });
  }

  updateChart(): void {
    this.initializeChart();
  }

  private getTopicColor(index: number): string {
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // yellow
      '#ef4444', // red
      '#8b5cf6', // purple
      '#14b8a6', // teal
      '#f97316', // orange
      '#ec4899'  // pink
    ];
    return colors[index % colors.length];
  }

  getProgressWidth(score: number, max: number): string {
    if (max <= 0) return '0%';
    return `${(score / max) * 100}%`;
  }

  getProgressPercentage(score: number, max: number): number {
    if (max <= 0) return 0;
    return Math.round((score / max) * 100);
  }

  getPerformanceLabel(score: number, max: number): string {
    const percentage = this.getProgressPercentage(score, max);
    if (percentage >= 70) return 'Excellent';
    if (percentage >= 40) return 'Good';
    return 'Needs Improvement';
  }
}