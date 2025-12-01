export type CommandStep =
    | { type: 'text'; data: string; delayMs?: number; repeat?: number }
    | { type: 'enter'; delayMs?: number; repeat?: number }
    | { type: 'arrowDown'; delayMs?: number; repeat?: number }
    | { type: 'arrowUp'; delayMs?: number; repeat?: number }
    | { type: 'esc'; delayMs?: number; repeat?: number }
    | { type: 'space'; delayMs?: number; repeat?: number }
    | { type: 'tab'; delayMs?: number; repeat?: number };

export type CommandPreset = {
    label: string;
    steps: CommandStep[];
};

export const commandPresets: CommandPreset[] = [
    // Runs /review, submits, moves to second item in the TUI, submits that option
    {
        label: '/review',
        steps: [
            { type: 'text', data: '/review' },
            // allow the TUI to render its menu before navigating
            { type: 'enter', delayMs: 280 },
            { type: 'arrowDown', delayMs: 280 },
            { type: 'enter', delayMs: 280 },
        ],
    },
    // Plain "fix" command (no leading slash), submit immediately
    {
        label: 'fix',
        steps: [
            { type: 'text', data: 'fix' },
            { type: 'enter', delayMs: 280 },
        ],
    },
    // Shortcut for PR flow: /review then immediately choose first option (two Enters)
    {
        label: '/review pr',
        steps: [
            { type: 'text', data: '/review' },
            { type: 'enter', delayMs: 280 },
            { type: 'enter', delayMs: 280 },
        ],
    },
    // Parameterized: leaves cursor after the command with a trailing space so user can add args
    {
        label: '/pr <branch|url>',
        steps: [{ type: 'text', data: '/pr ' }],
    },
    {
        label: '/clear',
        steps: [
            { type: 'text', data: '/clear' },
            { type: 'enter' },
        ],
    },
    {
        label: '/new',
        steps: [
            { type: 'text', data: '/new' },
            { type: 'enter' },
        ],
    },
    {
        label: '/work-step-by-step',
        steps: [
            { type: 'text', data: '/work-step-by-step' },
            { type: 'enter' },
        ],
    },
    {
        label: '/compact',
        steps: [
            { type: 'text', data: '/compact' },
            { type: 'enter' },
        ],
    },
];
