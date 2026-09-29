// Bundled as text by esbuild: see `loader` in esbuild.config.mjs.
declare module '*.lua' {
	const source: string;
	export default source;
}

// Provided by Obsidian's Electron at runtime. Only what is used here: the save
// dialog through `remote`, which is how Obsidian's own PDF export asks.
declare module 'electron' {
	export const shell: {
		openPath(path: string): Promise<string>;
		showItemInFolder(path: string): void;
	};
	export const remote: {
		dialog: {
			showSaveDialog(options: {
				defaultPath?: string;
				filters?: { name: string; extensions: string[] }[];
				properties?: string[];
			}): Promise<{ canceled: boolean; filePath?: string }>;
		};
	};
}
