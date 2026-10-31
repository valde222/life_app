import { computed, inject, Signal, signal } from '@angular/core';
import { StepActions } from '../../core/data/step-actions';
import { Store } from '../../core/data/store';

export interface StepRow {
  id?: string;
  text: string;
  done: boolean;
}

export class TodoSteps {
  private readonly store = inject(Store);
  private readonly stepActions = inject(StepActions);
  private readonly drafts = signal<StepRow[]>([]);
  private readonly saved = computed(() =>
    this.store
      .steps()
      .filter((step) => step.todo === this.todo())
      .sort((a, b) => a.order - b.order),
  );

  readonly all = computed<StepRow[]>(() => (this.isDraft() ? this.drafts() : this.saved()));
  readonly done = computed(() => this.all().filter((step) => step.done).length);
  readonly newText = signal('');

  constructor(
    private readonly todo: Signal<string>,
    private readonly isDraft: Signal<boolean>,
  ) {}

  async add() {
    const text = this.newText().trim();
    if (!text) {
      return;
    }
    this.newText.set('');
    if (this.isDraft()) {
      this.drafts.update((steps) => [...steps, { text, done: false }]);
      return;
    }
    await this.stepActions.add(this.todo(), text, this.all().length);
  }

  async toggle(step: StepRow, index: number) {
    if (this.isDraft()) {
      this.drafts.update((steps) =>
        steps.map((each, i) => (i === index ? { ...each, done: !each.done } : each)),
      );
      return;
    }
    if (step.id) {
      await this.stepActions.toggle({ id: step.id, done: step.done });
    }
  }

  async remove(step: StepRow, index: number) {
    if (this.isDraft()) {
      this.drafts.update((steps) => steps.filter((_, i) => i !== index));
      return;
    }
    if (step.id) {
      await this.stepActions.remove(step.id);
    }
  }

  saveDrafts(todo: string): Promise<void> {
    return this.stepActions.addAll(todo, this.drafts());
  }

  track(index: number, step: StepRow) {
    return step.id ?? index;
  }
}
