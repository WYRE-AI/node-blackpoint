import { describe, expect, it } from 'vitest';
import { applyPaginationMeta, buildQueryString, normalizePath } from '../src/pagination.js';

describe('normalizePath', () => {
  it('strips a trailing slash and collapses duplicates', () => {
    expect(normalizePath('/accounts/')).toBe('/accounts');
    expect(normalizePath('accounts')).toBe('/accounts');
    expect(normalizePath('//assets//')).toBe('/assets');
  });

  it('keeps a root slash', () => {
    expect(normalizePath('/')).toBe('/');
  });
});

describe('buildQueryString', () => {
  it('skips null and undefined and repeats arrays', () => {
    expect(buildQueryString({ a: 1, b: undefined, c: null, d: ['x', 'y'] })).toBe('?a=1&d=x&d=y');
  });

  it('returns an empty string when nothing is set', () => {
    expect(buildQueryString({})).toBe('');
  });
});

describe('applyPaginationMeta', () => {
  it('returns non-objects unchanged', () => {
    expect(applyPaginationMeta(null)).toBeNull();
    expect(applyPaginationMeta([{ id: '1' }])).toEqual([{ id: '1' }]);
    expect(applyPaginationMeta({ data: [] })).toEqual({ data: [] });
    expect(applyPaginationMeta({ data: [], meta: ['nope'] })).toEqual({ data: [], meta: ['nope'] });
  });

  it('copies page meta onto pagination', () => {
    const page = applyPaginationMeta({
      data: [{ id: 't1' }],
      meta: { currentPage: '2', totalItems: 30, pageSize: 10, totalPages: 3 },
    });
    expect(page.pagination).toEqual({
      page: 2,
      pageSize: 10,
      totalCount: 30,
      totalPages: 3,
      hasNext: true,
    });
  });

  it('copies skip/take meta and preserves an existing pagination field', () => {
    const page = applyPaginationMeta({
      data: [],
      meta: { skip: 0, take: 50, total: 10 },
      pagination: { cursor: 'keep' },
    });
    expect(page.pagination).toMatchObject({
      skip: 0,
      take: 50,
      totalCount: 10,
      hasNext: false,
      cursor: 'keep',
    });
  });
});
