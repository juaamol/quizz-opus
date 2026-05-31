import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuizService } from './services/quiz.service';
import { Question, AppState } from './models/quiz.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  quizService = inject(QuizService);

  state = signal<AppState>('HOME');
  selectedFile = signal<string>('');
  currentQuizQuestions = signal<Question[]>([]);

  totalAvailable = computed(() => this.quizService.allQuestions().length);

  hasProgress = computed(() =>
    this.quizService.allQuestions().some((q) => q.userAnswer !== undefined),
  );

  score = computed(
    () => this.currentQuizQuestions().filter((q) => q.userAnswer === q.correctAnswer).length,
  );

  answeredCount = computed(
    () => this.currentQuizQuestions().filter((q) => q.userAnswer !== undefined).length,
  );

  async onFileChange() {
    if (this.selectedFile()) {
      await this.quizService.loadTestFile(this.selectedFile());
    }
  }

  startTest() {
    this.currentQuizQuestions.set([...this.quizService.allQuestions()]);
    this.state.set('QUIZ');
  }

  resetTest() {
    if (confirm('¿Estás seguro de que quieres borrar todo el progreso de este test?')) {
      this.quizService.clearProgress(this.selectedFile());
      const cleared = this.quizService.allQuestions().map((q) => ({ ...q, userAnswer: undefined }));
      this.quizService.allQuestions.set(cleared);
      this.currentQuizQuestions.set(cleared);
    }
  }

  finishTest() {
    this.state.set('RESULTS');
    window.scrollTo(0, 0);
  }

  reset() {
    this.state.set('HOME');
    this.selectedFile.set('');
    this.quizService.allQuestions.set([]);
  }

  toggleOption(questionId: number, optionLetter: string) {
    this.currentQuizQuestions.update((questions) => {
      const updated = questions.map((q) => {
        if (q.id === questionId) {
          const newAnswer = q.userAnswer === optionLetter ? undefined : optionLetter;
          return { ...q, userAnswer: newAnswer };
        }
        return q;
      });

      this.quizService.saveProgress(this.selectedFile(), updated);
      return updated;
    });
  }

  scrollToQuestion(qId: number) {
    const element = document.getElementById('question-' + qId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  onFolderSelected(event: any) {
    const files = event.target.files as FileList;
    if (files.length > 0) {
      this.quizService.setLocalFiles(files);
      this.selectedFile.set('');
    }
  }
}
