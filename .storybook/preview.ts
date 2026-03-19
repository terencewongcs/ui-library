import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Test all components at the 3 breakpoints from CLAUDE.md
    viewport: {
      defaultViewport: 'responsive',
    },
    a11y: {
      // Run a11y checks on all stories by default
      disable: false,
    },
  },
};

export default preview;
