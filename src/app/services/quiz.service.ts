// src/app/services/quiz.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Question } from '../models/quiz.model';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class QuizService {
  private storage = inject(StorageService);

  allQuestions = signal<Question[]>([]);

  // Store the actual File objects in a Map to access them later
  private fileMap = new Map<string, File>();

  // The list of names for the dropdown
  availableFiles = signal<string[]>([]);

  // Method to update the list when a folder is picked
  setLocalFiles(files: FileList) {
    this.fileMap.clear();
    const names: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.name.endsWith('.md')) {
        this.fileMap.set(file.name, file);
        names.push(file.name);
      }
    });

    this.availableFiles.set(names.sort());
  }

  async loadTestFile(fileName: string) {
    const file = this.fileMap.get(fileName);
    if (!file) return;

    try {
      // Read the local file as text
      const content = await file.text();
      this.parseMarkdown(content, fileName);
    } catch (error) {
      console.error('Error leyendo el archivo local:', error);
      this.allQuestions.set([]);
    }
  }

  private parseMarkdown(md: string, fileName: string) {
    const questions: Question[] = [];
    const savedAnswers = this.storage.loadProgress(fileName);

    const tableRegex = /\|\s*(\d+)\s*\|\s*\*\*([A-D])\*\*\s*\|\s*(.*?)\s*\|/g;
    const answersMap = new Map<number, { letter: string; theme: string }>();
    let match;
    while ((match = tableRegex.exec(md)) !== null) {
      answersMap.set(parseInt(match[1]), { letter: match[2], theme: match[3] });
    }

    const questionRegex = /\*\*(\d+)\.\s*(.+?)(?=\n\s*\*\*\d+\.|\n\s*---|\n\s*###|$)/gs;
    let qMatch;
    while ((qMatch = questionRegex.exec(md)) !== null) {
      const id = parseInt(qMatch[1]);
      const content = qMatch[2];
      const lines = content
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length > 0) {
        const text = lines[0].replace(/\*\*/g, '').trim();
        const options = lines.filter((l) => /^[A-D]\)/.test(l));
        const answerData = answersMap.get(id);

        if (answerData) {
          questions.push({
            id,
            text,
            options,
            correctAnswer: answerData.letter,
            theme: answerData.theme,
            userAnswer: savedAnswers[id],
          });
        }
      }
    }
    this.allQuestions.set(questions);
  }

  saveProgress(fileName: string, questions: Question[]) {
    const progress: Record<number, string | undefined> = {};
    questions.forEach((q) => {
      if (q.userAnswer) progress[q.id] = q.userAnswer;
    });
    this.storage.saveProgress(fileName, progress);
  }

  clearProgress(fileName: string) {
    this.storage.clearProgress(fileName);
  }
}
