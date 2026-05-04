export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    clearMocks: true,
    testMatch: ['**/tests/**/*.test.ts'],
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                useESM: true
            }
        ]
    }
};