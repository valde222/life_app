import { inject, Injectable } from '@angular/core';
import { Step } from '../../domain/models';
import { Repository } from './repository';

export interface StepDraft {
  text: string;
  done: boolean;
}

@Injectable({ providedIn: 'root' })
export class StepActions {
  private readonly repository = inject(Repository);

  async add(todo: string, text: string, order: number): Promise<void> {
    await this.repository.save('steps', { todo, text, order });
  }

  async addAll(todo: string, steps: readonly StepDraft[]): Promise<void> {
    for (const [order, step] of steps.entries()) {
      await this.repository.save('steps', { todo, text: step.text, done: step.done, order });
    }
  }

  async toggle(step: Pick<Step, 'id' | 'done'>): Promise<void> {
    await this.repository.save('steps', { id: step.id, done: !step.done });
  }

  async remove(id: string): Promise<void> {
    await this.repository.remove('steps', id);
  }
}
