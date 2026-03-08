import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        exclude: [
            ...configDefaults.exclude,
            'e2e/**',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            thresholds: {
                perFile: true,
                statements: 90,
                branches: 90,
                functions: 90,
                lines: 90,
            },
            exclude: [
                'node_modules/',
                'dist/',
                'e2e/',
                'vite.config.ts',
                'vitest.config.ts',
                'src/hooks/useAuth.ts', // explicitly excluded — accesses Supabase directly; see comment in file
                'data/',
                'src/features/encounter/abilities/types.ts', // type-only file — no executable runtime code
                'src/stores/encounter/store.ts', // structural file — typeof window branch cannot be false in jsdom
            ],
        },
    },
});

