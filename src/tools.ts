interface NpmPackage {
	name: string;
	description: string;
	"dist-tags": { latest: string };
	versions: { [key: string]: { dependencies: Record<string, string> } };
	author: { name: string } | string;
	homepage: string;
	repository: { url: string };
}

// 缓存配置
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存时间

export async function searchNpmPackage(packageName: string) {
	try {
		// 尝试从缓存中获取数据
		const cacheKey = `package:${packageName}`;
		const cachedData = await getFromCache(cacheKey);
		if (cachedData) {
			console.log(`Returning cached data for package '${packageName}'`);
			return cachedData;
		}

		const response = await fetch(`https://registry.npmjs.org/${packageName}`);

		const data = (await response.json()) as NpmPackage;

		if (response.ok) {
			const result = {
				name: data.name,
				version: data["dist-tags"].latest,
				description: data.description,
				author: typeof data.author === "string" ? data.author : data.author?.name,
				homepage: data.homepage,
				repository: data.repository?.url,
				dependencies: data.versions[data["dist-tags"].latest].dependencies,
			};

			// 将结果缓存
			await saveToCache(cacheKey, result, CACHE_TTL);

			return result;
		} else {
			// 根据不同的HTTP状态码提供更具体的错误信息
			switch (response.status) {
				case 404:
					throw new Error(`Package '${packageName}' not found on npm registry`);
				case 429:
					throw new Error(`Rate limit exceeded when fetching package '${packageName}'`);
				case 500:
					throw new Error(`Internal server error when fetching package '${packageName}'`);
				default:
					throw new Error(`Failed to fetch package '${packageName}' (HTTP ${response.status})`);
			}
		}
	} catch (error: unknown) {
		// 提供更详细的错误信息
		if (error instanceof Error) {
			console.error(`Error searching for package '${packageName}':`, error.message);
			throw error;
		} else {
			const errorMsg = `Unknown error when searching for package '${packageName}'`;
			console.error(errorMsg);
			throw new Error(errorMsg);
		}
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

// 搜索选项接口
interface SearchOptions {
	size?: number;
	from?: number;
	quality?: number;
	popularity?: number;
	maintenance?: number;
	sortBy?: 'optimal' | 'quality' | 'popularity' | 'maintenance' | 'created' | 'updated' | 'downloads';
}

// 下载统计接口
interface DownloadStats {
	downloads: number;
	start: string;
	end: string;
	package: string;
}

export async function searchNpmPackages(query: string, options?: SearchOptions): Promise<NpmSearchResult> {
	try {
		// 构建查询参数
		const params = new URLSearchParams();
		params.append('text', query);
		
		if (options) {
			if (options.size !== undefined) params.append('size', options.size.toString());
			if (options.from !== undefined) params.append('from', options.from.toString());
			if (options.quality !== undefined) params.append('quality', options.quality.toString());
			if (options.popularity !== undefined) params.append('popularity', options.popularity.toString());
			if (options.maintenance !== undefined) params.append('maintenance', options.maintenance.toString());
			if (options.sortBy !== undefined) params.append('sortBy', options.sortBy);
		}

		// 尝试从缓存中获取数据
		const cacheKey = `search:${query}:${params.toString()}`;
		const cachedData = await getFromCache(cacheKey);
		if (cachedData) {
			console.log(`Returning cached data for search query '${query}'`);
			return cachedData;
		}

		const response = await fetch(
			`https://registry.npmjs.org/-/v1/search?${params.toString()}`,
		);

		const data = await response.json();

		if (response.ok) {
			// 将结果缓存
			await saveToCache(cacheKey, data, CACHE_TTL);

			return data as NpmSearchResult;
		} else {
			// 根据不同的HTTP状态码提供更具体的错误信息
			switch (response.status) {
				case 400:
					throw new Error(`Search for '${query}' failed`);
				case 429:
					throw new Error(`Rate limit exceeded when searching for '${query}'`);
				case 500:
					throw new Error(`Internal server error when searching for '${query}'`);
				default:
					throw new Error(`Failed to search for '${query}' (HTTP ${response.status})`);
			}
		}
	} catch (error: unknown) {
		// 提供更详细的错误信息
		if (error instanceof Error) {
			console.error(`Error searching for packages with query '${query}':`, error.message);
			throw error;
		} else {
			const errorMsg = `Unknown error when searching for packages with query '${query}'`;
			console.error(errorMsg);
			throw new Error(errorMsg);
		}
	}
}

export async function getDownloadStats(packageName: string, period: 'last-day' | 'last-week' | 'last-month' = 'last-month'): Promise<DownloadStats> {
	try {
		// 尝试从缓存中获取数据
		const cacheKey = `download-stats:${packageName}:${period}`;
		const cachedData = await getFromCache(cacheKey);
		if (cachedData) {
			console.log(`Returning cached download stats for package '${packageName}'`);
			return cachedData;
		}

		const response = await fetch(`https://api.npmjs.org/downloads/point/${period}/${packageName}`);
		
		const data = await response.json();
		
		if (response.ok) {
			// 将结果缓存
			await saveToCache(cacheKey, data, CACHE_TTL);

			return data as DownloadStats;
		} else {
			// 根据不同的HTTP状态码提供更具体的错误信息
			switch (response.status) {
				case 404:
					throw new Error(`Failed to fetch download stats for '${packageName}'`);
				case 429:
					throw new Error(`Rate limit exceeded when fetching download stats for '${packageName}'`);
				case 500:
					throw new Error(`Internal server error when fetching download stats for '${packageName}'`);
				default:
					throw new Error(`Failed to fetch download stats for '${packageName}' (HTTP ${response.status})`);
			}
		}
	} catch (error: unknown) {
		// 提供更详细的错误信息
		if (error instanceof Error) {
			console.error(`Error fetching download stats for package '${packageName}':`, error.message);
			throw error;
		} else {
			const errorMsg = `Unknown error when fetching download stats for package '${packageName}'`;
			console.error(errorMsg);
			throw new Error(errorMsg);
		}
	}
}

// 缓存数据接口
interface CacheData {
	value: any;
	expires: number;
}

// 缓存辅助函数
async function getFromCache(key: string): Promise<any> {
	// 在Cloudflare Workers中，我们可以使用caches API
	// 但在普通环境中，我们暂时返回null
	if (typeof caches !== 'undefined') {
		const cache = await caches.open('npm-search-cache');
		const response = await cache.match(key);
		if (response) {
			const data = await response.json() as CacheData;
			// 检查是否过期
			if (data.expires > Date.now()) {
				return data.value;
			} else {
				// 删除过期的缓存
				await cache.delete(key);
			}
		}
	}
	return null;
}

async function saveToCache(key: string, value: any, ttl: number): Promise<void> {
	// 在Cloudflare Workers中，我们可以使用caches API
	// 但在普通环境中，我们暂时不执行任何操作
	if (typeof caches !== 'undefined') {
		const cache = await caches.open('npm-search-cache');
		const data: CacheData = {
			value: value,
			expires: Date.now() + ttl
		};
		const response = new Response(JSON.stringify(data), {
			headers: { 'Content-Type': 'application/json' }
		});
		await cache.put(key, response);
	}
}
