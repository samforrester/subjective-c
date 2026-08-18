const supportsColor = Boolean(process.stdout.isTTY && !process.env.NO_COLOR);

const code = (value, text) => supportsColor ? `\u001b[${value}m${text}\u001b[0m` : text;

export const color = {
  bold: (text) => code("1", text),
  dim: (text) => code("2", text),
  cyan: (text) => code("36", text),
  green: (text) => code("32", text),
  yellow: (text) => code("33", text),
  red: (text) => code("31", text),
  magenta: (text) => code("35", text)
};

export function logStep(symbol, label, detail = "") {
  const suffix = detail ? ` ${color.dim(detail)}` : "";
  console.log(`${symbol} ${label}${suffix}`);
}

export function banner() {
  return `${color.bold("Subjective C")} ${color.magenta("0.2.0-alpha.2")} ${color.dim("— intent in, interface out")}`;
}
