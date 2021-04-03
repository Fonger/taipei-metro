import { stations } from "./stations";
import { HEADERS, NextTrainInfo, Station } from "./types";

export function render404() {
  return renderJSON('{"error":"Not Found"}', 404);
}

export function render400() {
  return renderJSON('{"error":"Bad Request"}', 400);
}

export function renderJSON(json: string | object, status = 200) {
  return new Response(typeof json === 'object' ? JSON.stringify(json) : json, {
    status,
    headers: {
      'content-type': 'application/json; charset=utf8',
    }
  })
}

export function parseCountdown(info: NextTrainInfo): number | string {
  const countdown = info.countdown.trim();
  const diffsec = parseInt(info.diffsec.trim() || '0');

  if (countdown === '00:00' || countdown === '-1') {
    return 0;
  } else if (countdown === '59:50*') {
    return '營運時間已過';
  } else if (countdown === '59:59*') {
    return '擷取資料中';
  } else if (countdown === '59:05*' || countdown === '59:40*') {
    return '詳見通知'
  }

  const split = countdown.split(':');
  const sec = parseInt(split[1]);

  if (countdown.startsWith('-2')) {
    if (sec > diffsec) {
      return 361; // 06:01
    } else if (diffsec > sec) {
      return 363; // 06:03
    }
    return 367; // 06:07
  }

  if (split.length < 2) {
    return 360; // 06:00
  }

  const min = parseInt(split[0]);
  let calibrated = min * 60 + sec - diffsec - 10;
  calibrated -= calibrated % 5;

  return calibrated > 0 ? calibrated : 0;
}

export function toCountdown(seconds: number): string {
  let min: number | string = Math.floor(seconds / 60);
  let sec: number | string = seconds % 60;

  if (min < 10) min = '0' + min;
  if (sec < 10) sec = '0' + sec;

  return min + ':' + sec;
}

export function fetchNextTrain(stnid: string) {
  return fetch('https://ws.metro.taipei/trtcappweb/traintime.asmx', {
    method: 'POST',
    headers: HEADERS,
    body: `<?xml version="1.0" encoding="utf-8"?>
    <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
      <soap12:Body>
        <GetNextTrain2 xmlns="http://tempuri.org/">
          <stnid>${stnid}</stnid>
        </GetNextTrain2>
      </soap12:Body>
    </soap12:Envelope>`
  });
}

export function fetchCartWeight(tripno: string) {
  return fetch('https://ws.metro.taipei/trtcappweb/CartWeight.asmx?op=GetNextTrain2', {
    method: 'POST',
    headers: HEADERS,
    body: `<?xml version="1.0" encoding="utf-8"?>
    <soap12:Envelope
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema"
    xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
      <soap12:Body>
        <GetCartDetailbyTripID xmlns="http://tempuri.org/">
          <strCW>${tripno}</strCW>
        </GetCartDetailbyTripID>
      </soap12:Body>
    </soap12:Envelope>`
  });
}

/*
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <GetCartDetailbyTripIDResponse xmlns="http://tempuri.org/">
      <GetCartDetailbyTripIDResult>
        <root time="time" ErrStatement="" xmlns="">
          <Detail updateTime="2021-03-09 00:44:18" CID="1" Cart6W="3.139" Cart6L="1" Cart5W="3.227" Cart5L="1" Cart4W="3.124" Cart4L="1" Cart3W="3.032" Cart3L="1" Cart2W="3.159" Cart2L="1" Cart1W="3.11" Cart1L="1" TrainNumber="218" StationID="BL13" />
        </root>
      </GetCartDetailbyTripIDResult>
    </GetCartDetailbyTripIDResponse>
  </soap:Body>
</soap:Envelope>
*/

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRad(lat2-lat1);
  const dLon = toRad(lon2-lon1);
  lat1 = toRad(lat1);
  lat2 = toRad(lat2);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c;
  return d;
}

function toRad(value: number) {
    return value * Math.PI / 180;
}

export function getNearestStations(longitude: number, latitude: number): Station[] {
  const result: (Station & { distance: number })[] = [];

  for (const station of stations ){
    for (const exit of station.exits) {
      const distance = getDistance(latitude, longitude, exit.latitude, exit.longitude);
      if (distance < 3) {
        result.push({
          ...station,
          distance,
        });
        break;
      }
    }
  }

  return result.sort((a, b) => a.distance - b.distance).slice(0, 6);
}
