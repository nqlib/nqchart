export async function fetchGithubStars(): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/ctesibius/beecharts`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: {
        revalidate: 3600,
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as { stargazers_count?: number };
    return data.stargazers_count ?? null;
  } catch {
    return null;
  }
}
