import { describe, expect, it } from 'vitest';
import {
  colors,
  semanticColors,
  fontSizes,
  fontWeights,
  radii,
  shadows,
  spacing,
} from './tokens';

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

describe('color palette', () => {
  it('every scale step is a valid hex value', () => {
    for (const scale of Object.values(colors)) {
      if (typeof scale === 'string') {
        expect(scale).toMatch(HEX);
        continue;
      }
      for (const [step, hex] of Object.entries(scale)) {
        expect(hex, `${step}`).toMatch(HEX);
      }
    }
  });

  it('each of the five scales exposes a 50..950 ramp', () => {
    for (const name of ['blue', 'green', 'red', 'yellow', 'neutral'] as const) {
      const scale = colors[name];
      expect(scale[50]).toBeDefined();
      expect(scale[700]).toBeDefined();
      expect(scale[950]).toBeDefined();
    }
  });

  it('anchors on the four official logo colors', () => {
    expect(colors.blue[600]).toBe('#0047AB'); // royal blue — primary
    expect(colors.green[500]).toBe('#00A651'); // brand green
    expect(colors.red[500]).toBe('#D32F2F'); // action red
    expect(colors.yellow[400]).toBe('#FFD700'); // signboard gold
  });
});

describe('semantic colors', () => {
  it('every semantic token resolves to a readable hex string', () => {
    for (const [name, value] of Object.entries(semanticColors)) {
      expect(value, name).toMatch(HEX);
    }
  });

  it('primary derives from royal blue, background from neutral-50', () => {
    expect(semanticColors.primary).toBe(colors.blue[600]);
    expect(semanticColors.background).toBe(colors.neutral[50]);
  });

  it('danger derives from the brand red, success from green, accent from gold', () => {
    expect(semanticColors.danger).toBe(colors.red[500]);
    expect(semanticColors.success).toBe(colors.green[600]);
    expect(semanticColors.accent).toBe(colors.yellow[500]);
  });
});

describe('type scale', () => {
  it('sizes are rem-based and strictly increasing', () => {
    expect(fontSizes.xs).toMatch(/rem$/);
    expect(fontSizes['6xl']).toMatch(/rem$/);
    const rems = Object.values(fontSizes).map((v) => parseFloat(v));
    for (let i = 1; i < rems.length; i += 1) {
      const cur = rems[i];
      const prev = rems[i - 1];
      expect(cur).toBeDefined();
      expect(prev).toBeDefined();
      expect(cur as number).toBeGreaterThan(prev as number);
    }
  });

  it('weights are in the expected order', () => {
    expect(fontWeights.regular).toBe(400);
    expect(fontWeights.extrabold).toBe(800);
    expect(fontWeights.bold).toBeLessThan(fontWeights.extrabold);
  });
});

describe('spacing, radii, shadows', () => {
  it('spacing scale starts at zero and px, then grows in rem', () => {
    expect(spacing[0]).toBe('0');
    expect(spacing.px).toBe('1px');
    expect(spacing[4]).toBe('1rem');
    expect(spacing[6]).toBe('1.5rem');
  });

  it('radii and shadows are declared', () => {
    expect(radii.md).toBe('0.5rem');
    expect(radii.full).toBe('9999px');
    expect(shadows.md).toContain('rgba(18, 22, 26');
    expect(shadows.none).toBe('none');
  });
});