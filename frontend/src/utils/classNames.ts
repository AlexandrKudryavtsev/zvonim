type ClassValue = string | number | boolean | undefined | null;
type ClassArray = ClassValue[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClassDictionary = Record<string, any>;
type ClassInput = ClassValue | ClassArray | ClassDictionary;

/**
 * @example
 * classNames('foo', 'bar') // => 'foo bar'
 * classNames('foo', { bar: true }) // => 'foo bar'
 * classNames({ 'foo-bar': true }) // => 'foo-bar'
 * classNames({ 'foo-bar': false }) // => ''
 * classNames({ foo: true }, { bar: true }) // => 'foo bar'
 * classNames({ foo: true, bar: false }) // => 'foo'
 * classNames('foo', { bar: true, duck: false }, 'baz', { quux: true }) // => 'foo bar baz quux'
 * classNames(null, false, 'bar', undefined, 0, 1, { baz: null }, '') // => 'bar 1'
 */
export function classNames(...inputs: ClassInput[]): string {
  const classes: string[] = [];

  inputs.forEach((input) => {
    if (!input) return;

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
      return;
    }

    if (Array.isArray(input)) {
      input.forEach((item) => {
        const result = classNames(item);
        if (result) {
          classes.push(result);
        }
      });
      return;
    }

    if (typeof input === 'object') {
      Object.entries(input).forEach(([key, value]) => {
        if (value) {
          classes.push(key);
        }
      });
      return;
    }
  });

  return classes.join(' ').trim();
}

export const cn = classNames;
