import { STATION_JSON_STRING } from "./stations";
import { parseCountdown, render400, render404, renderJSON, toCountdown } from "./utils";

const STNID_REGEX = /^\d{3}$/;

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  
  if (url.pathname === '/stations') {
    return renderJSON(STATION_JSON_STRING);
  } else if (url.pathname !== '/next-trains') {
    return render404();
  }
  const stnid = url.searchParams.get('stnid');
  if (!stnid || !STNID_REGEX.test(stnid)) {
    return render400();
  }
  
  const response = await fetch('https://ws.metro.taipei/trtcappweb/traintime.asmx', {
    method: 'POST',
    headers: {
      'accept': '*/*',
      'content-type': 'application/soap+xml; charset=utf-8',
      'accept-encoding':	'gzip, deflate, br',
      'user-agent': '%E5%8F%B0%E5%8C%97%E6%8D%B7%E9%81%8BGo/1.5.40.5 CFNetwork/1220.1 Darwin/20.3.0',
      'accept-language': 'zh-tw',
    },
    body: `<?xml version="1.0" encoding="utf-8"?>
    <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
      <soap12:Body>
        <GetNextTrain2 xmlns="http://tempuri.org/">
          <stnid>${stnid}</stnid>
        </GetNextTrain2>
      </soap12:Body>
    </soap12:Envelope>`
  })

  /*
  const result = await response.text();
  return new Response(result, {
    headers: {
      'content-type': 'application/xml; charset=utf8'
    }
  });
  */

  const output = {} as Output;

  const handler = new MyElementHandler(output);
  await new HTMLRewriter()
    .on('*', handler)
    .transform(response).text();

  const dest = url.searchParams.get('destination');
  if (dest) {
    const nextTrain = output.nextTrains.find(t => t.destination === dest);

    if (!nextTrain) return render404();
    return renderJSON(nextTrain);
  }

  return renderJSON(output); 
}


class MyElementHandler {
  constructor(readonly output: Output) { }

  element(element:　Element) {
    if (element.tagName === 'root') {
      this.output.info = Object.fromEntries(element.attributes) as unknown as RootInfo;
    } else if (element.tagName === 'detail') {
      if (!this.output.nextTrains) this.output.nextTrains = [];
      const info = Object.fromEntries(element.attributes) as unknown as NextTrainInfo;

      const countdownSeconds = parseCountdown(info.countdown);

      const calibratedSeconds = parseInt(info.diffsec) + 10;

      let calibratedCountdownSeconds =  countdownSeconds - calibratedSeconds;

      if (calibratedCountdownSeconds < 0) calibratedCountdownSeconds = 0;

      info.countdownSeconds = countdownSeconds
      info.calibratedCountdownSeconds = calibratedCountdownSeconds
      info.calibratedCountdown = toCountdown(calibratedCountdownSeconds);

      this.output.nextTrains.push(info);
    }
  }
}

interface NextTrainInfo {
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

interface RootInfo {
  station: string;
  stationname: string
  noservice: string,
  ErrStatement: string;
  xmlns: string;
}

interface Output {
  info: RootInfo;
  nextTrains: NextTrainInfo[];
}
