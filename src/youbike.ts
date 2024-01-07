import { RawYouBike } from './types';

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
