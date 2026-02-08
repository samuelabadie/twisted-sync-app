import { booklaCentsToEur } from '../src/utils/price';

describe('booklaCentsToEur', () => {
  it('converts 10000 cents to 100 EUR', () => {
    expect(booklaCentsToEur(10000)).toBe(100);
  });

  it('converts 100 cents to 1 EUR', () => {
    expect(booklaCentsToEur(100)).toBe(1);
  });

  it('converts 10100 cents to 101 EUR', () => {
    expect(booklaCentsToEur(10100)).toBe(101);
  });

  it('converts 50 cents to 0.50 EUR', () => {
    expect(booklaCentsToEur(50)).toBe(0.5);
  });

  it('converts 0 cents to 0 EUR', () => {
    expect(booklaCentsToEur(0)).toBe(0);
  });

  it('converts 1500 cents to 15 EUR', () => {
    expect(booklaCentsToEur(1500)).toBe(15);
  });

  it('converts 99 cents to 0.99 EUR', () => {
    expect(booklaCentsToEur(99)).toBe(0.99);
  });
});
