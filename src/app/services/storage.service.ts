import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly PREFIX = 'quiz_data_';

  saveProgress(fileName: string, answers: Record<number, string | undefined>) {
    localStorage.setItem(this.PREFIX + fileName, JSON.stringify(answers));
  }

  loadProgress(fileName: string): Record<number, string | undefined> {
    const data = localStorage.getItem(this.PREFIX + fileName);
    return data ? JSON.parse(data) : {};
  }

  clearProgress(fileName: string) {
    localStorage.removeItem(this.PREFIX + fileName);
  }
}
