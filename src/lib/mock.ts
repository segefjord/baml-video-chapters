/*
	Returns items from data as promises in round-robin fashion.
	It's a factory that returns the mock data endpoint.
*/
export function mockEndpoint<T>(data: T[], startIndex?: number) {
	let index = startIndex ?? 0
	async function callEndpoint(ms=0): Promise<T> {
		const item = data[index] // cache for timeout
		index = (index+1) % data.length // round robin
		return new Promise(
			(resolve) => setTimeout(()=>resolve(item), ms)
		)
	}
	return callEndpoint
}
