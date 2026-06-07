import { describe, expect, it } from "vitest";
import { predictRaceTime } from "@/utils/predictions";
import { formatTime } from "@/utils/formatTime";

describe("predictRaceTime", () => {
  const twentyMinuteFiveK = {
    hours: 0,
    minutes: 20,
    seconds: 0,
    milliseconds: 0,
  };

  it("uses the Riegel formula for supported race distances", () => {
    const prediction = predictRaceTime({
      inputTime: twentyMinuteFiveK,
      inputMeters: 5000,
      targetMeters: 10000,
    });

    expect(prediction).not.toBeNull();
    expect(formatTime({ time: prediction!, alwaysShowHours: true })).toBe(
      "00:41:41",
    );
  });

  it("does not predict from or to sprint distances below 800m", () => {
    expect(
      predictRaceTime({
        inputTime: twentyMinuteFiveK,
        inputMeters: 5000,
        targetMeters: 400,
      }),
    ).toBeNull();

    expect(
      predictRaceTime({
        inputTime: twentyMinuteFiveK,
        inputMeters: 400,
        targetMeters: 5000,
      }),
    ).toBeNull();
  });

  it("supports 800m as the shortest prediction distance", () => {
    const prediction = predictRaceTime({
      inputTime: twentyMinuteFiveK,
      inputMeters: 5000,
      targetMeters: 800,
    });

    expect(prediction).not.toBeNull();
    expect(formatTime({ time: prediction!, alwaysShowHours: true })).toBe(
      "00:02:52",
    );
  });

  it("returns null for empty time or invalid distances", () => {
    expect(
      predictRaceTime({
        inputTime: {
          hours: 0,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        },
        inputMeters: 5000,
        targetMeters: 10000,
      }),
    ).toBeNull();

    expect(
      predictRaceTime({
        inputTime: twentyMinuteFiveK,
        inputMeters: 0,
        targetMeters: 10000,
      }),
    ).toBeNull();
  });
});
