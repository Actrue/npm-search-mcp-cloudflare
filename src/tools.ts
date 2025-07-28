

interface NpmPackage {
  name: string;
  description: string;
  "dist-tags": { latest: string };
  versions: { [key: string]: { dependencies: Record<string, string> } };
  author: { name: string } | string;
  homepage: string;
  repository: { url: string };
}

export async function searchNpmPackage(packageName: string) {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`);
    const data = (await response.json()) as NpmPackage;
    
    if (response.ok) {
      return {
        name: data.name,
        version: data["dist-tags"].latest,
        description: data.description,
        author: typeof data.author === 'string' ? data.author : data.author?.name,
        homepage: data.homepage,
        repository: data.repository?.url,
        dependencies: data.versions[data["dist-tags"].latest].dependencies
      };
    } else {
      throw new Error(`Package '${packageName}' not found`);
    }
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error('Unknown error');
  }
}

interface NpmSearchResult {
  formData: {
    search: {
      q: {
        value: string;
      };
    };
  };
  objects: Array<{
    updated: string;
    searchScore: number;
    package: {
      name: string;
      keywords: string[];
      version: string;
      description: string;
      sanitized_name: string;
      maintainers: Array<{
        email: string;
        username: string;
      }>;
      date: {
        ts: number;
        rel: string;
      };
      links: {
        homepage?: string;
        repository?: string;
        npm: string;
        bugs?: string;
      };
      publisher?: {
        name?: string;
        avatars?: {
          small?: string;
          medium?: string;
          large?: string;
        };
      };
      license?: string;
      dependents: number;
      downloads: {
        monthly: number;
        weekly: number;
      };
      keywordsTruncated: boolean;
    };
  }>;
}

export async function searchNpmPackages(query: string): Promise<NpmSearchResult> {
  try {
    const response = await fetch(`https://www.npmjs.com/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (response.ok) {
      return data as NpmSearchResult;
    } else {
      throw new Error(`Search for '${query}' failed`);
    }
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error('Unknown error');
  }
}