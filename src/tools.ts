

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
  console.log('开始查询npm包:', packageName);
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`);
    console.log('获取到响应，状态码:', response.status);
    const data = (await response.json()) as NpmPackage;
    
    if (response.ok) {
      console.log('成功获取包信息:', packageName);
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
      console.error('包查询失败:', packageName, '状态码:', response.status);
      throw new Error(`Package '${packageName}' not found`);
    }
  } catch (error: unknown) {
    console.error('查询npm包时发生错误:', packageName, error);
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
  console.log('开始搜索npm包:', query);
  try {
    const response = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}`);
    console.log('搜索响应状态:', response.status);
    const data = await response.json();
    
    if (response.ok) {
      console.log('搜索成功:', query, '结果数量:', data.objects?.length || 0);
      return data as NpmSearchResult;
    } else {
      console.error('搜索请求失败:', query, '状态码:', response.status);
      throw new Error(`Search for '${query}' failed`);
    }
  } catch (error: unknown) {
    console.error('搜索npm包时发生错误:', query, error);
    throw error instanceof Error ? error : new Error('Unknown error');
  }
}