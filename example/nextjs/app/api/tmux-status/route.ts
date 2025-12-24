import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';

const execAsync = promisify(exec);

// Map pane index to name based on 4-pane layout:
// ┌─────────────┬─────────────┐
// │   Claude    │    Codex    │  (pane 0, pane 3)
// ├─────────────┼─────────────┤
// │   lazygit   │    bash     │  (pane 1, pane 2)
// └─────────────┴─────────────┘
const paneNames: Record<number, string> = {
    0: 'claude',
    1: 'git',
    2: 'bash',
    3: 'codex',
};

export async function GET() {
    try {
        // Get current window index, name, and pane index
        const { stdout: info } = await execAsync(
            "tmux display-message -p '#I:#W:#P'"
        );

        const [windowIndex, windowName, paneIndex] = info.trim().split(':');
        const paneIdx = parseInt(paneIndex, 10);

        return NextResponse.json({
            windowIndex: parseInt(windowIndex, 10),
            windowName: windowName || '',
            paneIndex: paneIdx,
            paneName: paneNames[paneIdx] || `pane${paneIdx}`,
        });
    } catch (error) {
        // tmux might not be running or accessible
        return NextResponse.json(
            { error: 'Failed to get tmux status' },
            { status: 500 }
        );
    }
}
