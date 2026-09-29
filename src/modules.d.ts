// Bundled as text by esbuild: see `loader` in esbuild.config.mjs.
declare module '*.lua' {
	const source: string;
	export default source;
}

// Provided by Obsidian's Electron at runtime. Only what is used here.
declare module 'electron' {
	export const shell: {
		openPath(path: string): Promise<string>;
		showItemInFolder(path: string): void;
	};
}
