export type DurationSetting = {
    wholeRound: number;
    placingBet: number;
    lockingBet: number;
    showingResult?: number;
    generatingResult?: number;
    startRound?: number;
};

export class GameSetting {
    id: number;
    lobbyId?: number;
    name: string;
    configName?: string;
    durations: DurationSetting;
    choices?: string[];
    hedgeBetGroups?: string[][];
    numberOfRoundHistory: number;
    validateBalanceWhenBet?: boolean;
    durationShowPromptMessage?: number;
}
