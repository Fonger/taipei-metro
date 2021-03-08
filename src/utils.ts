import { HEADERS } from "./types";

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

const COUNT_DOWN_REGEX = /^(\d{2}):(\d{2})$/;
export function parseCountdown(input: string): number {
  if (input === '59:50*') return Number.POSITIVE_INFINITY;

  const result = COUNT_DOWN_REGEX.exec(input);
  if (!result) throw new Error('input is not in 00:00 format');

  const min = parseInt(result[1] as string);
  const sec = parseInt(result[2] as string);

  return min * 60 + sec;
}

export function toCountdown(seconds: number): string {
  if (seconds === Number.POSITIVE_INFINITY) return '營運時間已過'

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