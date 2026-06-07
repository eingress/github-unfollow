import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import {
  arrayMergeLeft,
  getFollowers,
  getFollowees,
  followUser,
  unfollowUser,
} from '../src/index';

type FetchSpy = ReturnType<typeof spyOn<typeof globalThis, 'fetch'>>;
type WriteSpy = ReturnType<typeof spyOn<typeof process.stdout, 'write'>>;
type ExitSpy = ReturnType<typeof spyOn<typeof process, 'exit'>>;

const makeFetch = (body: unknown, linkHeader: string | null = null) =>
  ((() =>
    Promise.resolve({
      json: () => Promise.resolve(body),
      headers: { get: (name: string) => (name === 'link' ? linkHeader : null) },
    } as unknown as Response)) as unknown as typeof fetch);

const rejectFetch = (message: string) =>
  ((() => Promise.reject(new Error(message))) as unknown as typeof fetch);

const nextLink = (page: number) =>
  `<https://api.github.com/user/followers?page=${page}>; rel="next"`;

describe('arrayMergeLeft', () => {
  test('returns elements in a not in b', () => {
    expect(arrayMergeLeft(['a', 'b', 'c'], ['b'])).toEqual(['a', 'c']);
  });

  test('returns all of a when b is empty', () => {
    expect(arrayMergeLeft(['a', 'b'], [])).toEqual(['a', 'b']);
  });

  test('returns empty array when a is empty', () => {
    expect(arrayMergeLeft([], ['a', 'b'])).toEqual([]);
  });

  test('returns empty array when a is a subset of b', () => {
    expect(arrayMergeLeft(['a', 'b'], ['a', 'b', 'c'])).toEqual([]);
  });
});

describe('getFollowers', () => {
  let fetchSpy: FetchSpy;
  let stderrSpy: WriteSpy;
  let exitSpy: ExitSpy;

  beforeEach(() => {
    fetchSpy = spyOn(globalThis, 'fetch');
    stderrSpy = spyOn(process.stderr, 'write').mockImplementation(() => true);
    exitSpy = spyOn(process, 'exit').mockImplementation((() => {}) as () => never);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    stderrSpy.mockRestore();
    exitSpy.mockRestore();
  });

  test('returns logins from a single page', async () => {
    fetchSpy.mockImplementation(makeFetch([{ login: 'alice' }, { login: 'bob' }]));
    expect(await getFollowers()).toEqual(['alice', 'bob']);
  });

  test('requests the correct endpoint', async () => {
    fetchSpy.mockImplementation(makeFetch([]));
    await getFollowers();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/user/followers?page=1&per_page=100'),
      expect.any(Object),
    );
  });

  test('paginates when link header contains rel="next"', async () => {
    fetchSpy
      .mockImplementationOnce(makeFetch([{ login: 'alice' }], nextLink(2)))
      .mockImplementationOnce(makeFetch([{ login: 'bob' }]));
    expect(await getFollowers()).toEqual(['alice', 'bob']);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  test('writes to stderr and exits on fetch failure', async () => {
    fetchSpy.mockImplementation(rejectFetch('network error'));
    await getFollowers();
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('network error'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe('getFollowees', () => {
  let fetchSpy: FetchSpy;
  let stderrSpy: WriteSpy;
  let exitSpy: ExitSpy;

  beforeEach(() => {
    fetchSpy = spyOn(globalThis, 'fetch');
    stderrSpy = spyOn(process.stderr, 'write').mockImplementation(() => true);
    exitSpy = spyOn(process, 'exit').mockImplementation((() => {}) as () => never);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    stderrSpy.mockRestore();
    exitSpy.mockRestore();
  });

  test('returns logins from a single page', async () => {
    fetchSpy.mockImplementation(makeFetch([{ login: 'carol' }, { login: 'dave' }]));
    expect(await getFollowees()).toEqual(['carol', 'dave']);
  });

  test('requests the correct endpoint', async () => {
    fetchSpy.mockImplementation(makeFetch([]));
    await getFollowees();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/user/following?page=1&per_page=100'),
      expect.any(Object),
    );
  });

  test('paginates when link header contains rel="next"', async () => {
    fetchSpy
      .mockImplementationOnce(makeFetch([{ login: 'carol' }], nextLink(2)))
      .mockImplementationOnce(makeFetch([{ login: 'dave' }]));
    expect(await getFollowees()).toEqual(['carol', 'dave']);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  test('writes to stderr and exits on fetch failure', async () => {
    fetchSpy.mockImplementation(rejectFetch('network error'));
    await getFollowees();
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('network error'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe('followUser', () => {
  let fetchSpy: FetchSpy;
  let stdoutSpy: WriteSpy;
  let stderrSpy: WriteSpy;
  let exitSpy: ExitSpy;

  beforeEach(() => {
    fetchSpy = spyOn(globalThis, 'fetch');
    stdoutSpy = spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = spyOn(process.stderr, 'write').mockImplementation(() => true);
    exitSpy = spyOn(process, 'exit').mockImplementation((() => {}) as () => never);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    exitSpy.mockRestore();
  });

  test('makes a PUT request to the correct endpoint', async () => {
    fetchSpy.mockImplementation(makeFetch(null));
    await followUser('alice');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/user/following/alice'),
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  test('writes confirmation to stdout', async () => {
    fetchSpy.mockImplementation(makeFetch(null));
    await followUser('alice');
    expect(stdoutSpy).toHaveBeenCalledWith('Followed: alice\n');
  });

  test('writes to stderr and exits on fetch failure', async () => {
    fetchSpy.mockImplementation(rejectFetch('network error'));
    await followUser('alice');
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('network error'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe('unfollowUser', () => {
  let fetchSpy: FetchSpy;
  let stdoutSpy: WriteSpy;
  let stderrSpy: WriteSpy;
  let exitSpy: ExitSpy;

  beforeEach(() => {
    fetchSpy = spyOn(globalThis, 'fetch');
    stdoutSpy = spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = spyOn(process.stderr, 'write').mockImplementation(() => true);
    exitSpy = spyOn(process, 'exit').mockImplementation((() => {}) as () => never);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    exitSpy.mockRestore();
  });

  test('makes a DELETE request to the correct endpoint', async () => {
    fetchSpy.mockImplementation(makeFetch(null));
    await unfollowUser('alice');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/user/following/alice'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('writes confirmation to stdout', async () => {
    fetchSpy.mockImplementation(makeFetch(null));
    await unfollowUser('alice');
    expect(stdoutSpy).toHaveBeenCalledWith('Unfollowed: alice\n');
  });

  test('writes to stderr and exits on fetch failure', async () => {
    fetchSpy.mockImplementation(rejectFetch('network error'));
    await unfollowUser('alice');
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('network error'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
