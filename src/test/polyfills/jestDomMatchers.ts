import { expect } from 'vitest';

type MatcherResult = {
  pass: boolean;
  message: () => string;
};

type StyleExpectation = Record<string, string>;

type ClassExpectation = string | string[];

type TextExpectation = string | RegExp;

const isElement = (value: unknown): value is Element => value instanceof Element;

const format = (value: unknown) =>
  typeof value === 'string' ? value : JSON.stringify(value, null, 2);

const ensureElement = (received: unknown, matcherName: string): MatcherResult | Element => {
  if (!isElement(received)) {
    return {
      pass: false,
      message: () => `${matcherName} requires an Element. Received: ${format(received)}`,
    };
  }

  return received;
};

const parseClassExpectation = (expected: ClassExpectation): string[] => {
  if (Array.isArray(expected)) {
    return expected;
  }

  return expected.split(/\s+/).filter(Boolean);
};

const parseStyleExpectation = (expected: string | StyleExpectation): StyleExpectation => {
  if (typeof expected === 'string') {
    const styleMap: StyleExpectation = {};
    expected
      .split(';')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => {
        const [prop, value] = entry.split(':');
        if (prop && value) {
          styleMap[prop.trim()] = value.trim();
        }
      });

    return styleMap;
  }

  return expected;
};

const toBeInTheDocument = (received: unknown): MatcherResult => {
  const elementOrResult = ensureElement(received, 'toBeInTheDocument');
  if (!isElement(elementOrResult)) {
    return elementOrResult;
  }

  const pass = document.body.contains(elementOrResult);
  return {
    pass,
    message: () =>
      pass
        ? `Expected element ${format(elementOrResult)} not to be present in the document.`
        : `Expected element ${format(elementOrResult)} to be present in the document.`,
  };
};

const toHaveAttribute = (
  received: unknown,
  name: string,
  expectedValue?: string | RegExp,
): MatcherResult => {
  const elementOrResult = ensureElement(received, 'toHaveAttribute');
  if (!isElement(elementOrResult)) {
    return elementOrResult;
  }

  const actualValue = elementOrResult.getAttribute(name);
  const pass =
    expectedValue === undefined
      ? actualValue !== null
      : actualValue !== null &&
        (expectedValue instanceof RegExp
          ? expectedValue.test(actualValue)
          : actualValue === expectedValue);

  return {
    pass,
    message: () =>
      pass
        ? `Expected element not to have attribute \`${name}\` with value ${format(expectedValue)}.`
        : `Expected element to have attribute \`${name}\` with value ${format(expectedValue)}, received ${format(actualValue)}.`,
  };
};

const toHaveClass = (received: unknown, expected: ClassExpectation): MatcherResult => {
  const elementOrResult = ensureElement(received, 'toHaveClass');
  if (!isElement(elementOrResult)) {
    return elementOrResult;
  }

  const expectedClasses = parseClassExpectation(expected);
  const missingClasses = expectedClasses.filter((className) => !elementOrResult.classList.contains(className));
  const expectedList = expectedClasses.join(', ');

  return {
    pass: missingClasses.length === 0,
    message: () =>
      missingClasses.length === 0
        ? `Expected element not to have class(es): ${expectedList}.`
        : `Expected element to have class(es): ${expectedList}, missing: ${missingClasses.join(', ')}.`,
  };
};

const toHaveTextContent = (
  received: unknown,
  expected: TextExpectation,
  options?: { trim?: boolean },
): MatcherResult => {
  const elementOrResult = ensureElement(received, 'toHaveTextContent');
  if (!isElement(elementOrResult)) {
    return elementOrResult;
  }

  const textContent = options?.trim ? elementOrResult.textContent?.trim() ?? '' : elementOrResult.textContent ?? '';
  const pass =
    expected instanceof RegExp ? expected.test(textContent) : textContent.includes(expected.toString());

  return {
    pass,
    message: () =>
      pass
        ? `Expected element text content not to match ${format(expected)}.`
        : `Expected element text content to match ${format(expected)}, received ${format(textContent)}.`,
  };
};

const toHaveValue = (received: unknown, expected?: string | number | string[] | null): MatcherResult => {
  const elementOrResult = ensureElement(received, 'toHaveValue');
  if (!isElement(elementOrResult)) {
    return elementOrResult;
  }

  const actualValue = (elementOrResult as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
  const pass = expected === undefined ? actualValue !== '' : actualValue === expected;

  return {
    pass,
    message: () =>
      pass
        ? `Expected element value not to be ${format(expected)}.`
        : `Expected element value to be ${format(expected)}, received ${format(actualValue)}.`,
  };
};

const toBeVisible = (received: unknown): MatcherResult => {
  const elementOrResult = ensureElement(received, 'toBeVisible');
  if (!isElement(elementOrResult)) {
    return elementOrResult;
  }

  const style = getComputedStyle(elementOrResult);
  const pass =
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    elementOrResult.getAttribute('hidden') === null &&
    elementOrResult.getAttribute('aria-hidden') !== 'true';

  return {
    pass,
    message: () =>
      pass
        ? 'Expected element not to be visible.'
        : 'Expected element to be visible.',
  };
};

const toBeDisabled = (received: unknown): MatcherResult => {
  const elementOrResult = ensureElement(received, 'toBeDisabled');
  if (!isElement(elementOrResult)) {
    return elementOrResult;
  }

  const pass = (elementOrResult as HTMLButtonElement).disabled === true;
  return {
    pass,
    message: () => (pass ? 'Expected element not to be disabled.' : 'Expected element to be disabled.'),
  };
};

const toBeEnabled = (received: unknown): MatcherResult => {
  const elementOrResult = ensureElement(received, 'toBeEnabled');
  if (!isElement(elementOrResult)) {
    return elementOrResult;
  }

  const pass = !(elementOrResult as HTMLButtonElement).disabled;
  return {
    pass,
    message: () => (pass ? 'Expected element not to be enabled.' : 'Expected element to be enabled.'),
  };
};

const toHaveStyle = (received: unknown, expected: string | StyleExpectation): MatcherResult => {
  const elementOrResult = ensureElement(received, 'toHaveStyle');
  if (!isElement(elementOrResult)) {
    return elementOrResult;
  }

  const expectedStyles = parseStyleExpectation(expected);
  const style = getComputedStyle(elementOrResult);

  const failingEntries = Object.entries(expectedStyles).filter(
    ([prop, value]) => style.getPropertyValue(prop).trim() !== value,
  );

  return {
    pass: failingEntries.length === 0,
    message: () =>
      failingEntries.length === 0
        ? 'Expected element not to match provided styles.'
        : `Expected element to have styles ${format(expectedStyles)}, mismatches: ${format(Object.fromEntries(failingEntries))}.`,
  };
};

const toHaveFocus = (received: unknown): MatcherResult => {
  const elementOrResult = ensureElement(received, 'toHaveFocus');
  if (!isElement(elementOrResult)) {
    return elementOrResult;
  }

  const pass = document.activeElement === elementOrResult;
  return {
    pass,
    message: () => (pass ? 'Expected element not to have focus.' : 'Expected element to have focus.'),
  };
};

const toContainElement = (received: unknown, expected: Element | null): MatcherResult => {
  const elementOrResult = ensureElement(received, 'toContainElement');
  if (!isElement(elementOrResult)) {
    return elementOrResult;
  }

  const pass = expected != null ? elementOrResult.contains(expected) : false;
  return {
    pass,
    message: () =>
      pass
        ? 'Expected element not to contain provided child element.'
        : 'Expected element to contain the provided child element.',
  };
};

const matchers = {
  toBeInTheDocument,
  toHaveAttribute,
  toHaveClass,
  toHaveTextContent,
  toHaveValue,
  toBeVisible,
  toBeDisabled,
  toBeEnabled,
  toHaveStyle,
  toHaveFocus,
  toContainElement,
};

let registered = false;

export const registerJestDomMatchers = () => {
  if (registered) {
    return;
  }

  expect.extend(matchers);
  registered = true;
};

declare module 'vitest' {
  interface Assertion<T = any> {
    toBeInTheDocument(): void;
    toHaveAttribute(name: string, value?: string | RegExp): void;
    toHaveClass(expected: ClassExpectation): void;
    toHaveTextContent(expected: TextExpectation, options?: { trim?: boolean }): void;
    toHaveValue(expected?: string | number | string[] | null): void;
    toBeVisible(): void;
    toBeDisabled(): void;
    toBeEnabled(): void;
    toHaveStyle(expected: string | StyleExpectation): void;
    toHaveFocus(): void;
    toContainElement(expected: Element | null): void;
  }

  interface AsymmetricMatchersContaining {
    toBeInTheDocument(): void;
    toHaveAttribute(name: string, value?: string | RegExp): void;
    toHaveClass(expected: ClassExpectation): void;
    toHaveTextContent(expected: TextExpectation, options?: { trim?: boolean }): void;
    toHaveValue(expected?: string | number | string[] | null): void;
    toBeVisible(): void;
    toBeDisabled(): void;
    toBeEnabled(): void;
    toHaveStyle(expected: string | StyleExpectation): void;
    toHaveFocus(): void;
    toContainElement(expected: Element | null): void;
  }
}
