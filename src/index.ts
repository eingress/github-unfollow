const { GITHUB_API_TOKEN, GITHUB_API_URI = `https://api.github.com` } =
  process.env;

const FETCH_OPTIONS: RequestInit = {
  headers: {
    Accept: `application/vnd.github+json`,
    Authorization: `Bearer ${GITHUB_API_TOKEN}`,
  },
};

export const arrayMergeLeft = (a: string[], b: string[]): string[] =>
  a.filter((e) => !b.includes(e));

export const getFollowers = async (
  followers: string[] = [],
  page = 1,
): Promise<string[]> => {
  try {
    const response = await fetch(
      `${GITHUB_API_URI}/user/followers?page=${page}&per_page=100`,
      FETCH_OPTIONS,
    );

    const users = (await response.json()) as { login: string }[];
    users.map((user) => followers.push(user.login));

    const link = response.headers.get('link');
    if (link?.includes(`rel="next"`)) {
      await getFollowers(followers, ++page);
    }
  } catch (error) {
    process.stderr.write(`${error}\n`);
    process.exit(1);
  }
  return followers;
};

export const getFollowees = async (
  followees: string[] = [],
  page = 1,
): Promise<string[]> => {
  try {
    const response = await fetch(
      `${GITHUB_API_URI}/user/following?page=${page}&per_page=100`,
      FETCH_OPTIONS,
    );

    const users = (await response.json()) as { login: string }[];
    users.map((user) => followees.push(user.login));

    const link = response.headers.get('link');
    if (link?.includes(`rel="next"`)) {
      await getFollowees(followees, ++page);
    }
  } catch (error) {
    process.stderr.write(`${error}\n`);
    process.exit(1);
  }
  return followees;
};

export const followUser = async (user: string): Promise<void> => {
  try {
    await fetch(`${GITHUB_API_URI}/user/following/${user}`, {
      ...FETCH_OPTIONS,
      method: `PUT`,
    });
    process.stdout.write(`Followed: ${user}\n`);
  } catch (error) {
    process.stderr.write(`${error}\n`);
    process.exit(1);
  }
};

export const unfollowUser = async (user: string): Promise<void> => {
  try {
    await fetch(`${GITHUB_API_URI}/user/following/${user}`, {
      ...FETCH_OPTIONS,
      method: `DELETE`,
    });
    process.stdout.write(`Unfollowed: ${user}\n`);
  } catch (error) {
    process.stderr.write(`${error}\n`);
    process.exit(1);
  }
};

if (import.meta.main)
  (async () => {
    const followees = await getFollowees();
    const followers = await getFollowers();

    arrayMergeLeft(followers, followees).map(
      async (user) => await followUser(user),
    );

    arrayMergeLeft(followees, followers).map(
      async (user) => await unfollowUser(user),
    );
  })();
