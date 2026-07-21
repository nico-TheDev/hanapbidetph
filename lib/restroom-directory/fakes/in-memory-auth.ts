import type { Actor, AuthPort } from "../ports/auth";

export class InMemoryAuth implements AuthPort {
  private actor: Actor = { role: "guest" };

  setActor(actor: Actor): void {
    this.actor = actor;
  }

  async getActor(): Promise<Actor> {
    return this.actor;
  }
}
