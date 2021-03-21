export const HEADERS = {
  'accept': '*/*',
  'content-type': 'application/soap+xml; charset=utf-8',
  'accept-encoding':	'gzip, deflate, br',
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
  stationname: string
  noservice: string,
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
