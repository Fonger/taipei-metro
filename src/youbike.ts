import { RawYouBike, RawYouBikeStationFromYahoo, YouBikeStationFromYahoo } from './types';

export async function getYouBikeData(sno?: string | null) {
	const allData = await Promise.all([
		// 新北市 YouBike 1.0
		getJSON('https://data.ntpc.gov.tw/api/datasets/71cd1490-a2df-4198-bef1-318479775e8a/json?size=1000&page=0'),
		// 新北市 YouBike 2.0 (1/2)
		getJSON('https://data.ntpc.gov.tw/api/datasets/010e5b15-3823-4b20-b401-b1cf000550c5/json?size=1000&page=0'),
		// 新北市 YouBike 2.0 (2/2)
		getJSON('https://data.ntpc.gov.tw/api/datasets/010e5b15-3823-4b20-b401-b1cf000550c5/json?size=1000&page=1'),
		// 台北市 YouBike 2.0
		getJSON('https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json'),
	]).then((data) => {
		const youbikes = data.flat();
		return youbikes
			.filter((youbike) => youbike.act === '1')
			.map((youbike) => {
				const { sno, sna, tot, sbi, sarea, mday, lat, lng, ar, bemp } = youbike;
				const date = transformMday(mday);
				const age = Math.round((Date.now() - date.getTime()) / 1000);

				return {
					sno,
					sna,
					tot,
					sbi,
					sarea,
					mday: date,
					age,
					lat,
					lng,
					ar,
					bemp,
				};
			});
	});

	if (sno) {
		const snoList = sno.split(',');
		return allData.filter((youbike) => snoList.includes(youbike.sno));
	}

	return allData;
}

function getJSON(url: string) {
	return fetch(url, {
		headers: {
			Accept: 'application/json',
		},
	}).then((response) => response.json<RawYouBike[]>());
}

const TAIWAN_SEPARATE_DATE_FORMAT = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/;
const TAIWAN_DATE_FORMAT = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/;

function transformMday(mday: string) {
	const sepMatch = TAIWAN_SEPARATE_DATE_FORMAT.exec(mday);
	if (sepMatch) {
		return new Date(`${sepMatch[1]}T${sepMatch[2]}+0800`);
	}

	const strMatch = TAIWAN_DATE_FORMAT.exec(mday);

	if (strMatch) {
		return new Date(`${strMatch[1]}-${strMatch[2]}-${strMatch[3]}T${strMatch[4]}:${strMatch[5]}:${strMatch[6]}+0800`);
	}

	throw new Error(`Invalid date format: ${mday}`);
}

export async function getYouBikeDataFromYahoo(ids: string[]) {
	const res = await fetch('https://busserver.bus.yahoo.com/busserver/bike_tpe.xml');
	if (!res.body) throw new Error('No body');

	const decompressedStream = res.body.pipeThrough(new DecompressionStream('deflate'));
	const decompressedResponse = new Response(decompressedStream);

	const textEncoder = new TextEncoder();
	let isFirst = true;

	const stream = new ReadableStream({
		async start(controller) {
			controller.enqueue(textEncoder.encode('['));

			const rewriter = new HTMLRewriter().on('station', {
				element(element) {
					const rawStation = {} as RawYouBikeStationFromYahoo;

					for (const [key, value] of element.attributes) {
						rawStation[key as keyof RawYouBikeStationFromYahoo] = value;
					}

					if (ids.length > 0 && !ids.includes(rawStation.id)) return;

					const { id, name, nameen, open, total: totalStr, occupied, eoccupied, lon, lat, time } = rawStation;

					const date = transformMday(time);
					const total = parseInt(totalStr, 10);
					const totalOccupied = parseInt(occupied, 10);
					const eOccupied = parseInt(eoccupied, 10);
					const normalOccupied = totalOccupied - eOccupied;
					const station: YouBikeStationFromYahoo = {
						id,
						name,
						nameen,
						open: open === '1',
						total,
						available: total - totalOccupied,
						totalOccupied,
						normalOccupied,
						eOccupied,
						lon: parseFloat(lon),
						lat: parseFloat(lat),
						time: date,
						age: Math.round((Date.now() - date.getTime()) / 1000),
					};

					if (!station.open) return;

					const jsonChunk = JSON.stringify(station);

					if (!isFirst) {
						controller.enqueue(textEncoder.encode(','));
					}
					isFirst = false;

					controller.enqueue(textEncoder.encode(jsonChunk));
				},
			});

			await rewriter.transform(decompressedResponse).text();

			controller.enqueue(textEncoder.encode(']'));
			controller.close();
		},
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'application/json',
		},
	});
}
