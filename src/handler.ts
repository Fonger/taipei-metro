import { ALL_STATION_IDS, STATION_JSON_STRING } from "./stations";
import { NextTrainInfo, Output, RootInfo } from "./types";
import { fetchNextTrain, parseCountdown, render400, render404, renderJSON, toCountdown } from "./utils";

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  
  if (url.pathname === '/stations') {
    return renderJSON(STATION_JSON_STRING);
  } else if (url.pathname !== '/next-trains') {
    return render404();
  }
  const stnid = url.searchParams.get('stnid');
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
