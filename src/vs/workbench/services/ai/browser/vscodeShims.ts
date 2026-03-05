/*---------------------------------------------------------------------------------------------
 *  VS Code Framework Shims — Standalone type definitions and minimal implementations
 *  for Disposable, Emitter, Event, URI, createDecorator, registerSingleton.
 *
 *  These files live outside the Code OSS fork tree (src/vs/ not src/vscode/src/vs/),
 *  so they cannot import from VS Code's base/platform modules directly.
 *  This shim provides API-compatible standalone versions.
 *--------------------------------------------------------------------------------------------*/

// ============================================================================
// IDisposable & Disposable
// ============================================================================

export interface IDisposable {
	dispose(): void;
}

export class Disposable implements IDisposable {
	private readonly _store: IDisposable[] = [];
	private _isDisposed = false;

	protected _register<T extends IDisposable>(disposable: T): T {
		if (this._isDisposed) {
			console.warn('Registering disposable on already disposed object');
			disposable.dispose();
		} else {
			this._store.push(disposable);
		}
		return disposable;
	}

	dispose(): void {
		if (this._isDisposed) {
			return;
		}
		this._isDisposed = true;
		for (const disposable of this._store) {
			try {
				disposable.dispose();
			} catch (e) {
				console.error('Error disposing:', e);
			}
		}
		this._store.length = 0;
	}
}

// ============================================================================
// Event & Emitter
// ============================================================================

export type Event<T> = (listener: (e: T) => void) => IDisposable;

export namespace Event {
	export const None: Event<never> = () => ({ dispose() {} });
}

export class Emitter<T> implements IDisposable {
	private _listeners: Array<(e: T) => void> = [];
	private _disposed = false;

	get event(): Event<T> {
		return (listener: (e: T) => void): IDisposable => {
			if (this._disposed) {
				return { dispose() {} };
			}
			this._listeners.push(listener);
			return {
				dispose: () => {
					const idx = this._listeners.indexOf(listener);
					if (idx >= 0) {
						this._listeners.splice(idx, 1);
					}
				},
			};
		};
	}

	fire(event: T): void {
		if (this._disposed) {
			return;
		}
		for (const listener of [...this._listeners]) {
			try {
				listener(event);
			} catch (e) {
				console.error('Error in event listener:', e);
			}
		}
	}

	dispose(): void {
		this._disposed = true;
		this._listeners.length = 0;
	}
}

// ============================================================================
// URI
// ============================================================================

export class URI {
	readonly scheme: string;
	readonly authority: string;
	readonly path: string;
	readonly query: string;
	readonly fragment: string;

	private constructor(scheme: string, authority: string, path: string, query: string, fragment: string) {
		this.scheme = scheme;
		this.authority = authority;
		this.path = path;
		this.query = query;
		this.fragment = fragment;
	}

	static parse(value: string): URI {
		try {
			const url = new URL(value);
			return new URI(
				url.protocol.replace(/:$/, ''),
				url.host,
				url.pathname,
				url.search.replace(/^\?/, ''),
				url.hash.replace(/^#/, '')
			);
		} catch {
			return new URI('', '', value, '', '');
		}
	}

	static from(components: { scheme: string; path: string; authority?: string; query?: string; fragment?: string }): URI {
		return new URI(
			components.scheme,
			components.authority ?? '',
			components.path,
			components.query ?? '',
			components.fragment ?? ''
		);
	}

	toString(): string {
		let result = '';
		if (this.scheme) {
			result += this.scheme + '://';
		}
		if (this.authority) {
			result += this.authority;
		}
		result += this.path;
		if (this.query) {
			result += '?' + this.query;
		}
		if (this.fragment) {
			result += '#' + this.fragment;
		}
		return result;
	}
}

// ============================================================================
// createDecorator — Service identifier factory
// ============================================================================

export function createDecorator<T>(serviceId: string): { toString(): string } & T {
	const id = function (target: unknown, _key: string, index: number): void {
		// Decorator function — stores service dependency metadata
		// In the real VS Code DI, this would register the dependency
		if (typeof target === 'function') {
			(target as unknown as Record<string, unknown>)[`__${serviceId}_${index}`] = serviceId;
		}
	};
	id.toString = () => serviceId;
	return id as unknown as { toString(): string } & T;
}

// ============================================================================
// registerSingleton — Service registration
// ============================================================================

export const enum InstantiationType {
	Eager = 0,
	Delayed = 1,
}

const _singletonRegistry: Array<{
	id: { toString(): string };
	ctor: new (...args: never[]) => unknown;
	type: InstantiationType;
}> = [];

export function registerSingleton<T>(
	id: { toString(): string },
	ctor: new (...args: never[]) => T,
	type: InstantiationType = InstantiationType.Delayed
): void {
	_singletonRegistry.push({ id, ctor: ctor as new (...args: never[]) => unknown, type });
}

/** Get all registered singletons (for testing/debugging). */
export function getSingletonRegistry(): ReadonlyArray<{
	id: { toString(): string };
	ctor: new (...args: never[]) => unknown;
	type: InstantiationType;
}> {
	return _singletonRegistry;
}
