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
  const result = COUNT_DOWN_REGEX.exec(input);
  if (!result) throw new Error('input is not in 00:00 format');

  const min = parseInt(result[1] as string);
  const sec = parseInt(result[2] as string);

  return min * 60 + sec;
}

export function toCountdown(seconds: number): string {
  let min: number | string = Math.floor(seconds / 60);
  let sec: number | string = seconds % 60;

  if (min < 10) min = '0' + min;
  if (sec < 10) sec = '0' + sec;

  return min + ':' + sec;
}
