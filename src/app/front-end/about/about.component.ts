// about.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class AboutComponent implements OnInit {
  features = [
    {
      title: 'Extractive Text Summarization',
      description: 'Automatically extract and summarize key information from academic texts using advanced NLP techniques.',
      icon: '📝'
    },
    {
      title: 'Keyword Extraction',
      description: 'Identify and highlight important keywords and concepts from your study materials.',
      icon: '🔍'
    },
    {
      title: 'Smart Flashcards',
      description: 'Generate interactive flashcards to help reinforce learning and test understanding.',
      icon: '🗂️'
    },
    {
      title: 'Quiz Generation',
      description: 'Create practice quizzes from your study materials to assess knowledge retention.',
      icon: '✍️'
    },
    {
      title: 'Multiple Document Support',
      description: 'Process various document formats including PDFs, PowerPoint slides, and digital documents.',
      icon: '📚'
    },
    {
      title: 'User-Friendly Interface',
      description: 'Intuitive design that makes creating study materials simple and efficient.',
      icon: '💻'
    }
  ];

  teamMembers = [
    {
      name: "Balaguer, Grace C.",
      role: "Researcher",
      contribution: "Algorithm Development"
    },
    {
      name: "Burdeos, Benedict Jay D.",
      role: "Researcher",
      contribution: "Frontend Development"
    },
    {
      name: "Romblon, Sean Patrick O.",
      role: "Researcher",
      contribution: "Backend Integration"
    }
  ];

  constructor() { }

  ngOnInit(): void { }
}