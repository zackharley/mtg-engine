import * as blessed from 'blessed';

import type { Client } from '@/clients/shared/client-interface';
import { parseDecisionInput } from '@/clients/shared/decision-parser';
import {
  formatManaPool,
  formatPlayerInfo,
  formatTurnInfo,
} from '@/clients/shared/game-state-renderer';
import { updateBattlefieldPanel } from '@/clients/tui/components/battlefield-panel';
import { updateDecisionsMenu } from '@/clients/tui/components/decisions-menu';
import { EventLog } from '@/clients/tui/components/event-log';
import { updateHandPanel } from '@/clients/tui/components/hand-panel';
import { updateStackPanel } from '@/clients/tui/components/stack-panel';
import { selectTargets } from '@/clients/tui/input/target-selector';
import {
  createLayout,
  type LayoutRegions,
} from '@/clients/tui/utils/layout-manager';
import type { PlayerId } from '@/core/primitives/id';
import type { AvailablePlayerDecision, GameEvent } from '@/core/state/reducer';
import type { GameState } from '@/core/state/state';
import type { GameController, GameSettings, PlayerDecision } from '@/index';
import { createGame } from '@/index';

const GAME_LOOP_DELAY_MS = 100;

export interface TUIClientOptions {
  /**
   * Player IDs that are controlled by humans (vs automated).
   * If empty, all players are human-controlled.
   */
  humanPlayerIds?: PlayerId[];
}

/**
 * Terminal User Interface client for playing Magic: The Gathering.
 */
export class TUIClient implements Client {
  private controller: GameController | null = null;
  private screen: blessed.Widgets.Screen | null = null;
  private layout: LayoutRegions | null = null;
  private eventLog: EventLog | null = null;
  private readonly humanPlayerIds: Set<PlayerId>;
  private isRunning = false;

  constructor(options: TUIClientOptions = {}) {
    this.humanPlayerIds = new Set(options.humanPlayerIds ?? []);
  }

  startGame(settings: GameSettings): void {
    const { controller, playerIds } = createGame(settings);

    // If no human players specified, all are human
    if (this.humanPlayerIds.size === 0) {
      playerIds.forEach((id) => {
        this.humanPlayerIds.add(id);
      });
    }

    this.controller = controller;
    this.initializeScreen();
    this.setupEventHandlers();
    this.render(controller.getState());
    this.startGameLoop();
  }

  handleDecision(playerId: PlayerId, decision: PlayerDecision): void {
    if (!this.controller) {
      throw new Error('No game controller available');
    }

    try {
      this.controller.provideDecision(decision);
      this.render(this.controller.getState());
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (this.eventLog) {
        this.eventLog.addError(errorMessage);
      }

      // Throw error so caller knows it failed
      throw error;
    }
  }

  render(state: GameState): void {
    if (!this.screen || !this.layout || !this.controller) {
      return;
    }

    const currentPlayerId = this.controller.getPlayerNeedingDecision();
    if (!currentPlayerId) {
      // No decision needed, show active player's view
      const activePlayerId = state.turn.activePlayerId;
      this.renderForPlayer(state, activePlayerId);
      return;
    }

    this.renderForPlayer(state, currentPlayerId);
  }

  onEvent(event: GameEvent): void {
    if (!this.eventLog || !this.controller) {
      return;
    }
    const state = this.controller.getState();
    this.eventLog.addEvent(event, state);
  }

  getController(): GameController | null {
    return this.controller;
  }

  shutdown(): void {
    this.isRunning = false;
    if (this.screen) {
      this.screen.destroy();
      this.screen = null;
    }
  }

  private initializeScreen(): void {
    this.screen ??= blessed.screen({
      smartCSR: true,
      title: 'Magic: The Gathering TUI',
    });

    if (!this.layout) {
      this.layout = createLayout(this.screen);
      this.eventLog = new EventLog(this.layout.bottomPanel);
    }

    // Handle quit
    this.screen.key(['q', 'C-c'], () => {
      this.shutdown();
      process.exit(0);
    });

    this.screen.render();
  }

  private setupEventHandlers(): void {
    if (!this.controller) {
      return;
    }

    this.controller.onEvents((events, state) => {
      events.forEach((event) => this.onEvent(event));
      this.render(state);
    });
  }

  private renderForPlayer(state: GameState, playerId: PlayerId): void {
    if (!this.screen || !this.layout || !this.controller) {
      return;
    }

    // Update game state panel (with status if any)
    this.updateTopBarWithStatus();

    // Update hand panel
    const availableDecisions = this.controller.getAvailableDecisions();
    updateHandPanel(this.layout.leftPanel, state, playerId, availableDecisions);

    // Update battlefield panel
    updateBattlefieldPanel(this.layout.centerPanel, state, availableDecisions);

    // Update stack panel
    updateStackPanel(this.layout.centerPanel, state);

    // Update decisions menu
    updateDecisionsMenu(this.layout.rightPanel, availableDecisions, state);

    // Show available decisions count in status
    if (availableDecisions.length > 0) {
      const player = state.players[playerId];
      const playerName = player?.name || playerId;
      this.statusMessage = `{green-fg}${playerName} - ${availableDecisions.length} decision(s) available. Press 1-${availableDecisions.length} to select.{/green-fg}`;
    } else {
      this.statusMessage =
        '{yellow-fg}No decisions available. Waiting for game to advance...{/yellow-fg}';
    }
    this.updateTopBarWithStatus();
  }

  private startGameLoop(): void {
    if (!this.controller || !this.screen) {
      return;
    }

    this.isRunning = true;

    const processGameLoop = (): void => {
      if (!this.isRunning || !this.controller) {
        return;
      }

      const state = this.controller.getState();

      // Check if game ended
      if (state.gameEnded) {
        // Game ended - could show a message box here
        return;
      }

      // Check if waiting for decision
      if (this.controller.isWaitingForDecision()) {
        const playerId = this.controller.getPlayerNeedingDecision();
        if (!playerId) {
          return;
        }

        // Check if this is a human player
        if (this.humanPlayerIds.has(playerId)) {
          void this.handleHumanDecision(playerId);
        } else {
          // Auto-pass for non-human players
          try {
            this.controller.provideDecision({ type: 'PASS_PRIORITY' });
          } catch (error) {
            // Log error but continue - shouldn't happen for pass
            console.error('Error auto-passing:', error);
          }
          // Continue loop after a short delay
          setTimeout(processGameLoop, GAME_LOOP_DELAY_MS);
        }
      } else {
        // No decision needed, continue loop
        setTimeout(processGameLoop, GAME_LOOP_DELAY_MS);
      }
    };

    processGameLoop();
  }

  private async handleHumanDecision(playerId: PlayerId): Promise<void> {
    if (!this.controller || !this.screen) {
      return;
    }

    const state = this.controller.getState();
    const availableDecisions = this.controller.getAvailableDecisions();

    // Check if there are any decisions available
    if (availableDecisions.length === 0) {
      this.handleAutoPass();
      return;
    }

    this.render(state);

    // Wait for user input via number key or decision selection
    const decision = await this.waitForDecision(availableDecisions, state);

    if (!decision) {
      this.handleDecisionCancelled();
      return;
    }

    // Handle decisions that need additional input
    const finalDecision = await this.handleTargetSelection(decision, state);
    if (!finalDecision) {
      return;
    }

    // Submit decision (with error handling)
    this.submitDecision(playerId, finalDecision);
  }

  private handleAutoPass(): void {
    if (!this.controller) {
      return;
    }
    this.showStatusMessage(
      '{yellow-fg}No decisions available. Auto-passing priority...{/yellow-fg}',
    );
    try {
      this.controller.provideDecision({ type: 'PASS_PRIORITY' });
    } catch (_error) {
      // Log error but continue - shouldn't happen for pass
      console.error('Error auto-passing:', _error);
    }
    setTimeout(() => this.startGameLoop(), GAME_LOOP_DELAY_MS);
  }

  private handleDecisionCancelled(): void {
    this.showStatusMessage(
      '{yellow-fg}Cancelled. Waiting for decision...{/yellow-fg}',
    );
    setTimeout(() => this.startGameLoop(), GAME_LOOP_DELAY_MS);
  }

  private async handleTargetSelection(
    decision: PlayerDecision,
    state: GameState,
  ): Promise<PlayerDecision | null> {
    // Only handle CAST_SPELL decisions that don't already have targets selected
    if (
      decision.type !== 'CAST_SPELL' ||
      (decision.targets && decision.targets.length > 0)
    ) {
      return decision;
    }

    if (!this.screen || !this.controller) {
      setTimeout(() => this.startGameLoop(), GAME_LOOP_DELAY_MS);
      return null;
    }

    const card = state.cards[decision.cardId];
    if (!card) {
      return decision;
    }

    const definition = state.cardDefinitions[card.definitionId];
    if (!definition) {
      return decision;
    }

    // Get targeting information from controller
    const targetingInfo = this.controller.getTargetingInfo(decision.cardId);
    if (!targetingInfo) {
      // No targeting requirements, return decision as-is
      return decision;
    }

    const { validTargets, minTargets, maxTargets } = targetingInfo;

    // If minTargets is 0 (optional targeting) and no valid targets, allow casting without targets
    if (minTargets === 0 && validTargets.length === 0) {
      return decision;
    }

    // If no valid targets but targeting is required, return decision as-is
    // (The validation will happen when the decision is provided)
    if (validTargets.length === 0) {
      return decision;
    }

    const targets = await selectTargets(this.screen, {
      validTargets,
      state,
      title: `Select targets for ${definition.name}`,
      minTargets,
      maxTargets,
    });

    if (!targets) {
      setTimeout(() => this.startGameLoop(), GAME_LOOP_DELAY_MS);
      return null;
    }

    return { ...decision, targets };
  }

  private submitDecision(playerId: PlayerId, decision: PlayerDecision): void {
    try {
      this.handleDecision(playerId, decision);
      setTimeout(() => this.startGameLoop(), GAME_LOOP_DELAY_MS);
    } catch {
      setTimeout(() => this.startGameLoop(), GAME_LOOP_DELAY_MS);
    }
  }

  private waitForDecision(
    availableDecisions: AvailablePlayerDecision[],
    state: GameState,
  ): Promise<PlayerDecision | null> {
    return new Promise((resolve) => {
      if (!this.screen || !this.layout) {
        resolve(null);
        return;
      }

      this.showStatusMessage(
        `Press 1-${availableDecisions.length} to select a decision, 'p' to pass, or 'q' to quit`,
      );

      const handleKey = this.createDecisionKeyHandler(
        availableDecisions,
        state,
        resolve,
      );

      this.screen.on('keypress', handleKey);
    });
  }

  private createDecisionKeyHandler(
    availableDecisions: AvailablePlayerDecision[],
    state: GameState,
    resolve: (value: PlayerDecision | null) => void,
  ): (ch: string, key: { name: string }) => void {
    const handleKey = (ch: string, key: { name: string }): void => {
      if (
        this.handleNumericInput({
          ch,
          availableDecisions,
          state,
          resolve,
          handleKey,
        })
      ) {
        return;
      }
      if (this.handlePassInput(ch, availableDecisions, resolve, handleKey)) {
        return;
      }
      if (this.handleQuitInput(key, ch, resolve, handleKey)) {
        return;
      }
      this.handleInvalidInput(ch, availableDecisions);
    };
    return handleKey;
  }

  private handleNumericInput(options: {
    ch: string;
    availableDecisions: AvailablePlayerDecision[];
    state: GameState;
    resolve: (value: PlayerDecision | null) => void;
    handleKey: (ch: string, key: { name: string }) => void;
  }): boolean {
    const { ch, availableDecisions, state, resolve, handleKey } = options;
    const num = parseInt(ch, 10);
    if (isNaN(num) || num < 1 || num > availableDecisions.length) {
      return false;
    }
    this.screen?.removeListener('keypress', handleKey);
    this.clearStatusMessage();
    const parsed = parseDecisionInput(
      num.toString(),
      availableDecisions,
      state,
    );
    resolve(parsed);
    return true;
  }

  private handlePassInput(
    ch: string,
    availableDecisions: AvailablePlayerDecision[],
    resolve: (value: PlayerDecision | null) => void,
    handleKey: (ch: string, key: { name: string }) => void,
  ): boolean {
    if (ch !== 'p' && ch !== 'P') {
      return false;
    }
    this.screen?.removeListener('keypress', handleKey);
    this.clearStatusMessage();
    const passDecision = availableDecisions.find(
      (d) => d.type === 'PASS_PRIORITY',
    );
    if (passDecision) {
      resolve({ type: 'PASS_PRIORITY' });
    } else {
      this.showStatusMessage(
        '{red-fg}Pass Priority not available. Please select a valid decision.{/red-fg}',
      );
      this.screen?.on('keypress', handleKey);
    }
    return true;
  }

  private handleQuitInput(
    key: { name: string },
    ch: string,
    resolve: (value: PlayerDecision | null) => void,
    handleKey: (ch: string, key: { name: string }) => void,
  ): boolean {
    if (key.name !== 'escape' && ch !== 'q' && ch !== 'Q') {
      return false;
    }
    this.screen?.removeListener('keypress', handleKey);
    this.clearStatusMessage();
    resolve(null);
    return true;
  }

  private handleInvalidInput(
    ch: string | undefined,
    availableDecisions: AvailablePlayerDecision[],
  ): void {
    if (ch?.length === 1) {
      this.showStatusMessage(
        `{yellow-fg}Invalid input: "${ch}". Press 1-${availableDecisions.length} for a decision, 'p' to pass, or 'q' to quit{/yellow-fg}`,
      );
    }
  }

  private statusMessage = '';

  private showStatusMessage(message: string): void {
    if (!this.screen || !this.layout) {
      return;
    }
    this.statusMessage = message;
    this.updateTopBarWithStatus();
  }

  private clearStatusMessage(): void {
    if (!this.screen || !this.layout) {
      return;
    }
    this.statusMessage = '';
    this.updateTopBarWithStatus();
  }

  private updateTopBarWithStatus(): void {
    if (!this.screen || !this.layout || !this.controller) {
      return;
    }
    const state = this.controller.getState();
    const turnInfo = formatTurnInfo(state.turn);
    const players = Object.entries(state.players).map(([playerId, player]) => {
      const playerInfo = formatPlayerInfo(player, playerId as PlayerId);
      const manaPool = formatManaPool(player.manaPool);
      return `${playerInfo} | Mana: ${manaPool}`;
    });

    const lines = [turnInfo, '', ...players];
    if (this.statusMessage) {
      lines.push('', `{cyan-fg}Status: {/cyan-fg}${this.statusMessage}`);
    }

    this.layout.topBar.setContent(lines.join('\n'));
    this.screen.render();
  }
}
