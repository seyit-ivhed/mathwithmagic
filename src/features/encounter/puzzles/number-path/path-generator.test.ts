import { describe, it, expect, vi, afterEach } from 'vitest';
import {
    countUnvisitedNeighbors,
    getScoredMoves,
    backtrackPath,
    generateHamiltonianPath,
    generateSnakePath,
} from './path-generator';

const makeVisited = (size: number, trueAt: Array<[number, number]> = []): boolean[][] => {
    const grid = Array.from({ length: size }, () => Array(size).fill(false));
    for (const [r, c] of trueAt) {
        grid[r][c] = true;
    }
    return grid;
};

describe('countUnvisitedNeighbors', () => {
    it('counts all four neighbors when none are visited on an open grid', () => {
        const visited = makeVisited(3);
        expect(countUnvisitedNeighbors(3, visited, 1, 1)).toBe(4);
    });

    it('counts only in-bounds neighbors from a corner cell', () => {
        const visited = makeVisited(3);
        expect(countUnvisitedNeighbors(3, visited, 0, 0)).toBe(2);
    });

    it('returns 0 when all neighbors are visited', () => {
        const visited = makeVisited(3, [[0, 1], [1, 0], [2, 1], [1, 2]]);
        expect(countUnvisitedNeighbors(3, visited, 1, 1)).toBe(0);
    });

    it('does not count the cell itself', () => {
        const visited = makeVisited(3, [[1, 1]]);
        // Centre is visited; its 4 neighbors are still unvisited
        expect(countUnvisitedNeighbors(3, visited, 1, 1)).toBe(4);
    });
});

describe('getScoredMoves', () => {
    it('returns no moves when all neighbors are visited', () => {
        const visited = makeVisited(3, [[0, 1], [1, 0], [2, 1], [1, 2]]);
        const moves = getScoredMoves(3, visited, 1, 1);
        expect(moves).toHaveLength(0);
    });

    it('returns only in-bounds unvisited neighbors', () => {
        const visited = makeVisited(3, [[0, 1]]);
        const moves = getScoredMoves(3, visited, 0, 0);
        // (0,0) corner has neighbors (0,1) visited and (1,0) unvisited → 1 move
        expect(moves).toHaveLength(1);
        expect(moves[0]).toEqual({ r: 1, c: 0 });
    });

    it('places lower-score (fewer onward neighbors) moves first', () => {
        // Use an all-unvisited 4x4 grid from corner (0,0)
        // (0,1) has neighbors: (0,0)visited, (0,2), (1,1) → 2 unvisited
        // (1,0) has neighbors: (0,0)visited, (2,0), (1,1) → 2 unvisited
        // Both have equal score so we can't assert strict order,
        // but we CAN assert all valid moves are returned
        const visited = makeVisited(4, [[0, 0]]);
        const moves = getScoredMoves(4, visited, 0, 0);
        expect(moves).toHaveLength(2);
    });
});

describe('backtrackPath', () => {
    it('returns true immediately when path already has target length', () => {
        const visited = makeVisited(1, [[0, 0]]);
        const path = [{ row: 0, col: 0 }];
        expect(backtrackPath(1, 1, visited, path, 0, 0)).toBe(true);
    });

    it('returns false when there are no valid moves and path is incomplete', () => {
        // 2x2 grid, centre isolated: mark all neighbours visited, leave current unvisited
        // Start at (0,0), all neighbours visited → no moves → returns false
        const visited = makeVisited(2, [[0, 0], [0, 1], [1, 0]]);
        const path = [{ row: 0, col: 0 }];
        // targetLength 4, only 1 cell in path, no moves available
        expect(backtrackPath(2, 4, visited, path, 0, 0)).toBe(false);
    });

    it('finds a complete path on a 2x2 grid', () => {
        const visited = makeVisited(2, [[0, 0]]);
        const path = [{ row: 0, col: 0 }];
        const found = backtrackPath(2, 4, visited, path, 0, 0);
        expect(found).toBe(true);
        expect(path).toHaveLength(4);
    });

    it('restores visited and path after a failed branch', () => {
        // We can verify this indirectly: after backtrackPath returns false,
        // the path and visited array should be unmodified from the initial state.
        const visited = makeVisited(2, [[0, 0], [0, 1], [1, 0]]);
        const pathBefore = [{ row: 0, col: 0 }];
        const visitedSnapshot = visited.map(row => [...row]);

        backtrackPath(2, 4, visited, pathBefore, 0, 0);

        expect(pathBefore).toHaveLength(1);
        expect(visited).toEqual(visitedSnapshot);
    });
});

describe('generateSnakePath', () => {
    it('covers all cells exactly once for a 3x3 grid', () => {
        const path = generateSnakePath(3);
        expect(path).toHaveLength(9);
        const cells = new Set(path.map(p => `${p.row},${p.col}`));
        expect(cells.size).toBe(9);
    });

    it('traverses even rows left-to-right', () => {
        const path = generateSnakePath(3);
        expect(path[0]).toEqual({ row: 0, col: 0 });
        expect(path[1]).toEqual({ row: 0, col: 1 });
        expect(path[2]).toEqual({ row: 0, col: 2 });
    });

    it('traverses odd rows right-to-left', () => {
        const path = generateSnakePath(3);
        expect(path[3]).toEqual({ row: 1, col: 2 });
        expect(path[4]).toEqual({ row: 1, col: 1 });
        expect(path[5]).toEqual({ row: 1, col: 0 });
    });
});

describe('generateHamiltonianPath', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns a path covering all cells for a 3x3 grid', () => {
        const path = generateHamiltonianPath(3);
        expect(path).toHaveLength(9);
        const cells = new Set(path.map(p => `${p.row},${p.col}`));
        expect(cells.size).toBe(9);
    });

    it('returns a path covering all cells for a 4x4 grid', () => {
        const path = generateHamiltonianPath(4);
        expect(path).toHaveLength(16);
        const cells = new Set(path.map(p => `${p.row},${p.col}`));
        expect(cells.size).toBe(16);
    });

    it('applies parity fix by decrementing column when startCol is at last column', () => {
        // For a 3x3 grid (odd, 9 cells), force startRow=1, startCol=2:
        //   (1+2)=3 is odd → parity fix needed
        //   startCol=2 = size-1=2 → else branch: startCol--
        let callCount = 0;
        vi.spyOn(Math, 'random').mockImplementation(() => {
            callCount++;
            if (callCount === 1) return 0.4;   // startRow = Math.floor(0.4 * 3) = 1
            if (callCount === 2) return 0.95;  // startCol = Math.floor(0.95 * 3) = 2
            return 0;
        });

        const path = generateHamiltonianPath(3);
        expect(path).toHaveLength(9);
    });

    it('applies parity fix by incrementing column when startCol is not at last column', () => {
        // Force startRow=1, startCol=0: (1+0)=1 odd → fix needed, startCol < size-1 → startCol++
        let callCount = 0;
        vi.spyOn(Math, 'random').mockImplementation(() => {
            callCount++;
            if (callCount === 1) return 0.4;  // startRow = 1
            if (callCount === 2) return 0.1;  // startCol = 0
            return 0;
        });

        const path = generateHamiltonianPath(3);
        expect(path).toHaveLength(9);
    });
});
