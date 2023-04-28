import 'dotenv/config';

const { env, exit, stderr, stdout } = process;

const { GITHUB_API_TOKEN, GITHUB_API_URI = 'https://api.github.com' } = env;

const FETCH_OPTIONS = {
  headers: { Authorization: `token ${GITHUB_API_TOKEN}` },
};

const arrayMergeLeft = (a, b) => a.filter((e) => !b.includes(e));

const getFollowers = async (page = 1, result = []) => {
  try {
    const response = await fetch(
      `${GITHUB_API_URI}/user/followers?page=${page}&per_page=100`,
      FETCH_OPTIONS,
    );

    const data = await response.json();
    data.map((user) => result.push(user.login));

    let link = response.headers.get('link');
    if (link.includes(`rel=\"next\"`)) {
      await getFollowers(++page, result);
    }
  } catch (error) {
    stderr.write(`${error}\n`);
    exit(1);
  }
  return result;
};

const getFollowing = async (page = 1, result = []) => {
  try {
    const res = await fetch(
      `${GITHUB_API_URI}/user/following?page=${page}&per_page=100`,
      FETCH_OPTIONS,
    );

    const data = await res.json();
    data.map((user) => result.push(user.login));

    let link = res.headers.get('link');
    if (link.includes(`rel=\"next\"`)) {
      await getFollowing(++page, result);
    }
  } catch (error) {
    stderr.write(`${error}\n`);
    exit(1);
  }
  return result;
};

const deleteFollower = async (user) => {
  try {
    await fetch(`${GITHUB_API_URI}/user/following/${user}`, {
      ...FETCH_OPTIONS,
      method: 'DELETE',
    });
    stdout.write(`Unfollowed: ${user}\n`);
  } catch (error) {
    stderr.write(`${error}\n`);
    exit(1);
  }
};

(async () => {
  let followers = await getFollowers();
  let following = await getFollowing();
  let deletable = arrayMergeLeft(following, followers);

  deletable.map(async (user) => await deleteFollower(user));
})();
