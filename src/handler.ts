import { ALL_STATION_IDS, STATION_JSON_STRING, stations } from "./stations";
import { NextTrainInfo, Output, RootInfo } from "./types";
import { fetchNextTrain, getNearestStations, parseCountdown, render400, render404, renderJSON, toCountdown } from "./utils";

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  
  if (url.pathname === '/stations') {
    const longitude = url.searchParams.get('longitude');
    const latitude = url.searchParams.get('latitude');
    if (longitude && latitude) {
      const nearStations = getNearestStations(parseFloat(longitude), parseFloat(latitude));
      return renderJSON(nearStations);
    }
    return renderJSON(STATION_JSON_STRING);
  } else if (url.pathname !== '/next-trains') {
    return render404();
  }
  let stnid = url.searchParams.get('stnid');
  let code = url.searchParams.get('code');
  if (stnid == null) {
    if (code != null) {
      code = code.toUpperCase();
      const station = stations.find(s => s.code === code);
      if (station) {
        stnid = station.stnid;
      }
    }
  }

  if (!stnid || !ALL_STATION_IDS.includes(stnid)) {
    return render400();
  }
  
  const response = await fetchNextTrain(stnid);
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

      const countdownSeconds = parseCountdown(info);

      if (typeof countdownSeconds === 'number') {
        info.calibratedCountdownSeconds = countdownSeconds
        info.calibratedCountdown = toCountdown(countdownSeconds);
      } else {
        info.calibratedCountdownSeconds = Number.POSITIVE_INFINITY;
        info.calibratedCountdown = countdownSeconds;
      }
      this.output.nextTrains.push(info);
    }
  }
}
