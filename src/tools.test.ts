import { describe, expect, test, vi, beforeEach } from "vitest";
import { searchNpmPackage, searchNpmPackages, getDownloadStats } from "./tools";

describe("tools.ts 功能测试", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("fetch", vi.fn());
	});

	test("searchNpmPackage - 成功返回包信息", async () => {
		const mockData = {
			name: "react",
			"dist-tags": { latest: "18.2.0" },
			description: "React library",
			author: { name: "Facebook" },
			homepage: "https://reactjs.org/",
			repository: { url: "https://github.com/facebook/react" },
			versions: { "18.2.0": { dependencies: { "react-dom": "18.2.0" } } },
		};
		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData),
		});

		const result = await searchNpmPackage("react");
		expect(result).toEqual({
			name: "react",
			version: "18.2.0",
			description: "React library",
			author: "Facebook",
			homepage: "https://reactjs.org/",
			repository: "https://github.com/facebook/react",
			dependencies: { "react-dom": "18.2.0" },
		});
	});

	test("searchNpmPackage - 处理404错误", async () => {
		(fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 404,
			json: () => Promise.resolve({ error: "Package not found" }),
		});

		await expect(searchNpmPackage("non-existent-package")).rejects.toThrow(
			"Package 'non-existent-package' not found",
		);
	});

	test("searchNpmPackages - 成功返回搜索结果", async () => {
		const mockResults = {
			objects: [
				{
					package: {
						name: "react",
						version: "18.2.0",
						description: "React library",
					},
				},
			],
		};
		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockResults),
		});

		const result = await searchNpmPackages("react");
		expect(result.objects[0].package.name).toBe("react");
	});

	test("searchNpmPackages - 支持搜索选项", async () => {
		const mockResults = {
			objects: [
				{
					package: {
						name: "react",
						version: "18.2.0",
						description: "React library",
						date: {
							ts: 1678886400000,
							rel: "2 months ago"
						},
						downloads: {
							monthly: 1000000,
							weekly: 250000
						}
					},
				},
			],
		};
		
		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockResults),
		});

		const result = await searchNpmPackages("react", {
			size: 10,
			sortBy: "downloads",
			popularity: 1.0
		});
		
		expect(result.objects[0].package.name).toBe("react");
		expect(result.objects[0].package.downloads).toBeDefined();
		expect(result.objects[0].package.date).toBeDefined();
	});

	test("searchNpmPackages - 处理搜索选项错误", async () => {
		(fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 400,
			json: () => Promise.resolve({ error: "Invalid search parameters" }),
		});

		await expect(searchNpmPackages("react", { size: -1 })).rejects.toThrow(
			"Search for 'react' failed",
		);
	});

	test("getDownloadStats - 成功返回下载统计信息", async () => {
		const mockData = {
			downloads: 123456,
			start: "2023-01-01",
			end: "2023-01-31",
			package: "react"
		};
		
		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData),
		});

		const result = await getDownloadStats("react", "last-month");
		expect(result.downloads).toBe(123456);
		expect(result.package).toBe("react");
	});

	test("getDownloadStats - 处理404错误", async () => {
		(fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 404,
			json: () => Promise.resolve({ error: "Package not found" }),
		});

		await expect(getDownloadStats("non-existent-package")).rejects.toThrow(
			"Failed to fetch download stats for 'non-existent-package'",
		);
	});

	test("searchNpmPackage - 处理网络错误", async () => {
		(fetch as any).mockRejectedValueOnce(new Error("Network error"));

		await expect(searchNpmPackage("react")).rejects.toThrow("Network error");
	});

	test("searchNpmPackages - 处理网络错误", async () => {
		(fetch as any).mockRejectedValueOnce(new Error("Network error"));

		await expect(searchNpmPackages("react")).rejects.toThrow("Network error");
	});

	test("getDownloadStats - 处理网络错误", async () => {
		(fetch as any).mockRejectedValueOnce(new Error("Network error"));

		await expect(getDownloadStats("react")).rejects.toThrow("Network error");
	});

	test("searchNpmPackages - 处理无效的搜索选项", async () => {
		const mockResults = {
			objects: [
				{
					package: {
						name: "react",
						version: "18.2.0",
						description: "React library",
					},
				},
			],
		};
		
		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockResults),
		});

		// 测试无效的sortBy选项
		const result = await searchNpmPackages("react", {
			sortBy: "invalid-sort" as any
		});
		
		expect(result.objects[0].package.name).toBe("react");
	});
});
