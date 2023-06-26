import 'dotenv/config';

const { env, exit, stderr, stdout } = process;

const { GITHUB_API_TOKEN, GITHUB_API_URI = `https://api.github.com` } = env;

const FETCH_OPTIONS = {
  headers: {
    Accept: `application/vnd.github+json`,
    Authorization: `Bearer ${GITHUB_API_TOKEN}`,
  },
};

const arrayMergeLeft = (a, b) => a.filter((e) => !b.includes(e));

const getFollowers = async (followers = [], page = 1) => {
  try {
    const response = await fetch(
      `${GITHUB_API_URI}/user/followers?page=${page}&per_page=100`,
      FETCH_OPTIONS,
    );

    const users = await response.json();
    users.map((user) => followers.push(user.login));

    let link = response.headers.get('link');
    if (link.includes(`rel=\"next\"`)) {
      await getFollowers(followers, ++page);
    }
  } catch (error) {
    stderr.write(`${error}\n`);
    exit(1);
  }
  return followers;
};

const getFollowees = async (followees = [], page = 1) => {
  try {
    const response = await fetch(
      `${GITHUB_API_URI}/user/following?page=${page}&per_page=100`,
      FETCH_OPTIONS,
    );

    const users = await response.json();
    users.map((user) => followees.push(user.login));

    let link = response.headers.get('link');
    if (link.includes(`rel=\"next\"`)) {
      await getFollowees(followees, ++page);
    }
  } catch (error) {
    stderr.write(`${error}\n`);
    exit(1);
  }
  return followees;
};

const followUser = async (user) => {
  try {
    await fetch(`${GITHUB_API_URI}/user/following/${user}`, {
      ...FETCH_OPTIONS,
      method: `PUT`,
    });
    stdout.write(`Followed: ${user}\n`);
  } catch (error) {
    stderr.write(`${error}\n`);
    exit(1);
  }
};

const unfollowUser = async (user) => {
  try {
    await fetch(`${GITHUB_API_URI}/user/following/${user}`, {
      ...FETCH_OPTIONS,
      method: `DELETE`,
    });
    stdout.write(`Unfollowed: ${user}\n`);
  } catch (error) {
    stderr.write(`${error}\n`);
    exit(1);
  }
};

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
