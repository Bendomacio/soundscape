/**
 * UI TEST SUITE FOR SOUNDSCAPE
 * Run these tests before any deployment or review
 */

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: boolean;
}

// CSS Property validators
const CSS_TESTS = {
  // Check for problematic CSS properties
  noBackdropBlurOnModals: () => {
    const modals = document.querySelectorAll('.modal, .modal-backdrop, .modal-content');
    for (const el of modals) {
      const style = window.getComputedStyle(el);
      if (style.backdropFilter && style.backdropFilter !== 'none') {
        return { passed: false, error: `Element has backdrop-filter: ${style.backdropFilter}` };
      }
    }
    return { passed: true };
  },

  // Check z-index layering
  modalZIndexAboveAll: () => {
    const modal = document.querySelector('.modal');
    if (!modal) return { passed: true }; // No modal open
    const style = window.getComputedStyle(modal);
    const zIndex = parseInt(style.zIndex);
    if (zIndex < 9999) {
      return { passed: false, error: `Modal z-index is ${zIndex}, should be >= 9999` };
    }
    return { passed: true };
  },

  // Check input fields have proper height
  inputsHaveProperHeight: () => {
    const inputs = document.querySelectorAll('.input, input[type="text"], input[type="email"], input[type="password"]');
    for (const input of inputs) {
      const style = window.getComputedStyle(input);
      const height = parseInt(style.height);
      if (height < 40) {
        return { passed: false, error: `Input height is ${height}px, minimum should be 40px` };
      }
    }
    return { passed: true };
  },

  // Check buttons have proper padding and no text clipping
  buttonsHaveProperPadding: () => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const style = window.getComputedStyle(btn);
      const paddingLeft = parseInt(style.paddingLeft);
      const paddingRight = parseInt(style.paddingRight);
      const text = (btn as HTMLElement).innerText?.trim();

      // Skip icon-only buttons (no text or text hidden via CSS)
      if (!text || text.length === 0) continue;
      const btnStyle = window.getComputedStyle(btn);
      if (btnStyle.fontSize === '0px' || btn.clientWidth === 0 || btn.clientHeight === 0) continue;
      
      // Check padding for buttons with text
      if (paddingLeft < 8 || paddingRight < 8) {
        return { passed: false, error: `Button "${text.slice(0, 15)}" padding too small: ${paddingLeft}px/${paddingRight}px` };
      }
      
      // Check for text clipping in buttons
      if (btn.scrollWidth > btn.clientWidth + 2) {
        return { passed: false, error: `Button "${text.slice(0, 15)}" text is clipped (${btn.scrollWidth} > ${btn.clientWidth})` };
      }
    }
    return { passed: true };
  },

  // Check links with text have proper sizing
  linksHaveProperSizing: () => {
    const links = document.querySelectorAll('a');
    for (const link of links) {
      const text = (link as HTMLElement).innerText?.trim();
      if (!text || text.length === 0) continue;
      
      // Check for text clipping
      if (link.scrollWidth > link.clientWidth + 2) {
        const style = window.getComputedStyle(link);
        if (style.textOverflow !== 'ellipsis') {
          return { passed: false, error: `Link "${text.slice(0, 15)}" text is clipped` };
        }
      }
    }
    return { passed: true };
  },

  // Check badges/pills have proper sizing
  badgesHaveProperSizing: () => {
    const badges = document.querySelectorAll('.badge, [class*="rounded-full"], span[style*="border-radius: 9999px"], span[style*="border-radius:9999px"]');
    for (const badge of badges) {
      const text = (badge as HTMLElement).innerText?.trim();
      if (!text || text.length < 3) continue; // Skip icon-only badges

      const style = window.getComputedStyle(badge);
      const paddingLeft = parseInt(style.paddingLeft);
      const paddingRight = parseInt(style.paddingRight);

      // Badges with text should have at least 10px horizontal padding
      if (paddingLeft < 10 || paddingRight < 10) {
        return { passed: false, error: `Badge "${text.slice(0, 15)}" padding too small: ${paddingLeft}px/${paddingRight}px` };
      }
    }
    return { passed: true };
  },

  // Check fixed header elements are opaque enough to prevent map bleed-through
  headerOpacity: () => {
    const header = document.querySelector('header');
    if (!header) return { passed: true };

    const children = header.querySelectorAll('[class*="pointer-events-auto"]');
    for (const child of children) {
      const style = window.getComputedStyle(child);
      const bg = style.backgroundColor;

      // Parse rgba to check opacity — bg format: rgba(r, g, b, a) or rgb(r, g, b)
      const rgbaMatch = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (rgbaMatch) {
        const alpha = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
        if (alpha < 0.9) {
          return { passed: false, error: `Header element bg opacity ${alpha} < 0.9 — map markers will bleed through` };
        }
      }
    }
    return { passed: true };
  },

  // Check fixed elements don't overlap each other
  fixedElementsNoOverlap: () => {
    const fixedEls = document.querySelectorAll('header [class*="pointer-events-auto"]');
    const rects: { el: Element; rect: DOMRect }[] = [];

    for (const el of fixedEls) {
      rects.push({ el, rect: el.getBoundingClientRect() });
    }

    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i].rect;
        const b = rects[j].rect;
        const overlap = !(a.right < b.left || b.right < a.left || a.bottom < b.top || b.bottom < a.top);
        if (overlap) {
          return { passed: false, error: `Header elements overlap at (${Math.round(a.right)},${Math.round(a.top)}) and (${Math.round(b.left)},${Math.round(b.top)})` };
        }
      }
    }
    return { passed: true };
  },

  // Check for text overflow/clipping issues
  noTextOverflow: () => {
    const textElements = document.querySelectorAll('h1, h2, h3, h4, p, span, label');
    const issues: string[] = [];
    
    for (const el of textElements) {
      const style = window.getComputedStyle(el);
      const text = (el as HTMLElement).innerText?.trim();
      
      if (!text || text.length === 0) continue;
      
      // Check if text is being clipped
      if (el.scrollWidth > el.clientWidth + 2) {
        // Only flag if not using text-overflow: ellipsis intentionally
        if (style.textOverflow !== 'ellipsis' && style.whiteSpace !== 'nowrap') {
          issues.push(`"${text.slice(0, 20)}..." is clipped`);
        }
      }
      
      // Check if element is too small for its content
      if (el.scrollHeight > el.clientHeight + 2 && style.overflow !== 'auto' && style.overflow !== 'scroll') {
        issues.push(`"${text.slice(0, 20)}..." height overflow`);
      }
    }
    
    if (issues.length > 0) {
      return { passed: false, error: issues.slice(0, 3).join('; ') };
    }
    return { passed: true };
  },

  // Check icons don't overlap text
  iconsProperlyPositioned: () => {
    const inputWrappers = document.querySelectorAll('.input-wrapper');
    for (const wrapper of inputWrappers) {
      const icon = wrapper.querySelector('.input-icon, svg');
      const input = wrapper.querySelector('input');
      if (icon && input) {
        const iconRect = icon.getBoundingClientRect();
        const inputStyle = window.getComputedStyle(input);
        const paddingLeft = parseInt(inputStyle.paddingLeft);
        if (paddingLeft < iconRect.width + 12) {
          return { passed: false, error: `Input padding-left (${paddingLeft}px) too small for icon (${iconRect.width}px)` };
        }
      }
    }
    return { passed: true };
  },

  // Check modal content is interactive
  modalContentClickable: () => {
    const modalContent = document.querySelector('.modal-content');
    if (!modalContent) return { passed: true };
    const style = window.getComputedStyle(modalContent);
    if (style.pointerEvents === 'none') {
      return { passed: false, error: 'Modal content has pointer-events: none' };
    }
    return { passed: true };
  },

  // Check form elements are not disabled unexpectedly
  formElementsEnabled: () => {
    const modal = document.querySelector('.modal');
    if (!modal) return { passed: true };
    const inputs = modal.querySelectorAll('input:not([type="hidden"])');
    const buttons = modal.querySelectorAll('button[type="submit"]');
    for (const input of inputs) {
      if ((input as HTMLInputElement).disabled) {
        return { passed: false, error: 'Form input is unexpectedly disabled' };
      }
    }
    for (const btn of buttons) {
      // Submit buttons can be disabled based on form state, so just check they exist
    }
    return { passed: true };
  },

  // Check input fields have enough left padding for icons
  inputsHaveIconPadding: () => {
    const inputs = document.querySelectorAll('input');
    for (const input of inputs) {
      const parent = input.parentElement;
      if (!parent) continue;
      
      // Check if there's an icon/svg sibling
      const icon = parent.querySelector('svg');
      if (icon) {
        const style = window.getComputedStyle(input);
        const paddingLeft = parseInt(style.paddingLeft);
        if (paddingLeft < 44) {
          return { passed: false, error: `Input with icon has paddingLeft ${paddingLeft}px (need >= 44px)` };
        }
      }
    }
    return { passed: true };
  },

  // Check footer/stats text is not clipped
  footerTextNotClipped: () => {
    const footerSpans = document.querySelectorAll('[style*="borderTop"] span, .border-t span');
    for (const span of footerSpans) {
      const text = (span as HTMLElement).innerText?.trim();
      if (!text) continue;
      
      if (span.scrollWidth > span.clientWidth + 2) {
        return { passed: false, error: `Footer text "${text.slice(0, 20)}" is clipped` };
      }
    }
    return { passed: true };
  }
};

// Functional tests
const FUNCTIONAL_TESTS = {
  // Check Supabase connection
  supabaseConfigured: () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || url.includes('your-project')) {
      return { passed: false, error: 'VITE_SUPABASE_URL not configured' };
    }
    if (!key || !key.startsWith('eyJ')) {
      return { passed: false, error: 'VITE_SUPABASE_ANON_KEY not configured or invalid format' };
    }
    return { passed: true };
  },

  // Check Mapbox token
  mapboxConfigured: () => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token || !token.startsWith('pk.')) {
      return { passed: false, error: 'VITE_MAPBOX_TOKEN not configured' };
    }
    return { passed: true };
  }
};

// Run all CSS tests
export function runCSSTests(): TestSuite {
  const results: TestResult[] = [];
  
  for (const [name, testFn] of Object.entries(CSS_TESTS)) {
    try {
      const result = testFn();
      results.push({ name, ...result });
    } catch (err) {
      results.push({ name, passed: false, error: String(err) });
    }
  }

  return {
    name: 'CSS & Layout Tests',
    tests: results,
    passed: results.every(r => r.passed)
  };
}

// Run all functional tests
export function runFunctionalTests(): TestSuite {
  const results: TestResult[] = [];
  
  for (const [name, testFn] of Object.entries(FUNCTIONAL_TESTS)) {
    try {
      const result = testFn();
      results.push({ name, ...result });
    } catch (err) {
      results.push({ name, passed: false, error: String(err) });
    }
  }

  return {
    name: 'Functional Tests',
    tests: results,
    passed: results.every(r => r.passed)
  };
}

// Run all tests and log results
export function runAllTests(): { suites: TestSuite[]; allPassed: boolean } {
  const suites = [
    runFunctionalTests(),
    runCSSTests()
  ];

  console.group('🧪 SOUNDSCAPE UI TESTS');
  
  for (const suite of suites) {
    console.group(suite.passed ? `✅ ${suite.name}` : `❌ ${suite.name}`);
    for (const test of suite.tests) {
      if (test.passed) {
        console.log(`  ✓ ${test.name}`);
      } else {
        console.error(`  ✗ ${test.name}: ${test.error}`);
      }
    }
    console.groupEnd();
  }

  const allPassed = suites.every(s => s.passed);
  console.log(allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  console.groupEnd();

  return { suites, allPassed };
}

// Auto-run tests in development
if (import.meta.env.DEV) {
  // Run tests after DOM is ready
  if (document.readyState === 'complete') {
    setTimeout(runAllTests, 1000);
  } else {
    window.addEventListener('load', () => setTimeout(runAllTests, 1000));
  }
}
