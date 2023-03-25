import 'dotenv/config';

const { GITHUB_API_TOKEN, GITHUB_API_URI = 'https://api.github.com' } =
  process.env;

const FETCH_OPTIONS = {
  headers: { Authorization: `token ${GITHUB_API_TOKEN}` },
};

const arrayMergeLeft = (a, b) => a.filter((e) => !b.includes(e));

const getFollowers = async (page = 1) => {
  const res = await fetch(
    `${GITHUB_API_URI}/user/followers?page=${page}&per_page=100`,
    FETCH_OPTIONS,
  );

  if (res.ok) {
    const data = await res.json();
    data.map((user) => followers.push(user.login));

    let link = res.headers.get('link');
    if (link.includes(`rel=\"next\"`)) {
      await getFollowers(++page);
    }
  }
};

const getFollowing = async (page = 1) => {
  const res = await fetch(
    `${GITHUB_API_URI}/user/following?page=${page}&per_page=100`,
    FETCH_OPTIONS,
  );

  if (res.ok) {
    const data = await res.json();
    data.map((user) => following.push(user.login));

    let link = res.headers.get('link');
    if (link.includes(`rel=\"next\"`)) {
      await getFollowing(++page);
    }
  }
};

const deleteFollower = async (user) => {
  console.log(`Unfollowing: ${user}…`);
  await fetch(`${GITHUB_API_URI}/user/following/${user}`, {
    ...FETCH_OPTIONS,
    method: 'DELETE',
  });
};

let followers = [];
let following = [];
let rejects = [];

(async () => {
  await getFollowers();
  await getFollowing();

  rejects = arrayMergeLeft(following, followers);
  rejects.map(async (reject) => await deleteFollower(reject));
})();
