import 'dotenv/config';

const { GITHUB_API_TOKEN } = process.env;

const baseURI = 'https://api.github.com';

const FETCH_OPTIONS = {
  headers: { Authorization: `token ${GITHUB_API_TOKEN}` },
};

const mergeLeft = (a, b) => a.filter((e) => !b.includes(e));

(async () => {
  let followers = [];
  let following = [];
  let rejects = [];

  const getFollowers = async (page = 1) => {
    const res = await fetch(
      `${baseURI}/user/followers?page=${page}&per_page=100`,
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
      `${baseURI}/user/following?page=${page}&per_page=100`,
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
    await fetch(`${baseURI}/user/following/${user}`, {
      ...FETCH_OPTIONS,
      method: 'DELETE',
    });
  };

  await getFollowers();
  await getFollowing();

  rejects = mergeLeft(following, followers);
  rejects.map(async (reject) => await deleteFollower(reject));
})();
