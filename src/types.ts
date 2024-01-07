export const HEADERS = {
	accept: '*/*',
	'content-type': 'application/soap+xml; charset=utf-8',
	'accept-encoding': 'gzip, deflate, br',
	'user-agent': '%E5%8F%B0%E5%8C%97%E6%8D%B7%E9%81%8BGo/1.5.40.5 CFNetwork/1220.1 Darwin/20.3.0',
	'accept-language': 'zh-tw',
};

export interface NextTrainInfo {
	flag: string;
	priority: string;
	platform: string;
	stnid: string;
	tripno: string;
	PVID: string;
	TID: string;
	destination: string;
	countdown: string;
	uptime: string;
	nowtime: string;
	diffsec: string;
	countdownSeconds?: number;
	calibratedCountdownSeconds?: number;
	calibratedCountdown?: string;
}

export interface RootInfo {
	station: string;
	stationname: string;
	noservice: string;
	ErrStatement: string;
	xmlns: string;
}

export interface Output {
	info: RootInfo;
	nextTrains: NextTrainInfo[];
}

export interface Station {
	stnid: string;
	code: string;
	name: string;
	line: string;
	exits: Exit[];
}

export interface Exit {
	no: string;
	longitude: number;
	latitude: number;
}

export interface RawYouBike {
	/**
	 * sno: 站點代號
	 */
	sno: string;
	/**
	 * sna: 站點名稱(中文)
	 */
	sna: string;
	/**
	 * tot: 場站總停車格
	 */
	tot: number;
	/**
	 * sbi: 場站目前車輛數量
	 */
	sbi: number;
	/**
	 * sarea: 場站區域(中文)
	 */
	sarea: string;
	/**
	 * mday: 資料更新時間
	 */
	mday: string;
	/**
	 * lat: 緯度
	 */
	lat: number;
	/**
	 * lng: 經度
	 */
	lng: number;
	/**
	 * ar: 地址(中文)
	 */
	ar: string;
	/**
	 * sareaen: 場站區域(英文)
	 */
	sareaen: string;
	/**
	 * snaen: 站點名稱(英文)
	 */
	snaen: string;
	/**
	 * aren: 地址(英文)
	 */
	aren: string;
	/**
	 * bemp: 空位數量
	 */
	bemp: number;
	/**
	 * act: 營運狀態，"1" 為正常，"0" 為暫停服務
	 */
	act: string;
	/**
	 * srcUpdateTime: RawYouBike2.0系統發布資料更新的時間
	 * 只有台北市 YouBike 2.0 有此欄位
	 */
	srcUpdateTime?: string;
	/**
	 * updateTime: 大數據平台經過處理後將資料存入DB的時間
	 * 只有台北市 YouBike 2.0 有此欄位
	 */
	updateTime?: string;
	/**
	 * infoTime: 各場站來源資料更新時間
	 * 只有台北市 YouBike 2.0 有此欄位
	 */
	infoTime?: string;
	/**
	 * infoDate: 各場站來源資料更新時間
	 * 只有台北市 YouBike 2.0 有此欄位
	 */
	infoDate?: string;
}
