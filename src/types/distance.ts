export enum DistanceMode {
  Custom = "Custom",
  CustomTrack = "CustomTrack",
}

export const isCustomEvent = (event: string): boolean =>
  event === DistanceMode.Custom || event === DistanceMode.CustomTrack;
