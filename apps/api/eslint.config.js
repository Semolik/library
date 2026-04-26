import nextConfig from '@workspace/eslint-config/next.js';

export default [
  {
    ignores: ['dist', 'node_modules', '.next'],
  },
  ...nextConfig,
];

