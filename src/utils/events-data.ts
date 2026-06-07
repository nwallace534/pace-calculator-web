import { DistanceUnit } from "pace-calculator";
import { CalculatorTime } from "./time";

export enum EventTags {
  Standard = "Standard",
  Sprints = "Sprints",
  MiddleDistance = "MiddleDistance",
  // Opt-in: events tagged TimesForPace appear in the Times-for-Pace results
  // table. The mile is untagged — selectable as an event but omitted from
  // that list because the per-mile pace row already restates it.
  TimesForPace = "TimesForPace",
}

export type TimeExample = {
  id: string;
  time: {
    timeHours: string;
    timeMinutes: string;
    timeSeconds: string;
    timeHundredths: string;
  };
};

export type EventGuide = {
  timeExamples: TimeExample[];
};

export type Event = {
  id: string;
  distanceValue: string;
  distanceDecimal: string;
  distanceUnit: DistanceUnit;
  eventTags: EventTags[];
  eventGuide?: EventGuide;
  showHours?: boolean;
  /** Defaults to true. False for sprints (100m, 200m). */
  showMinutes?: boolean;
  /** Defaults to false. True for sprints and 800m. */
  showHundredths?: boolean;
  /** Defaults to 1000. Smaller (e.g. 10) for events timed to sub-second
   *  precision, so the spinner can traverse the range in reasonable time. */
  stepMs?: number;
  defaultTime?: CalculatorTime;
};

export const Events: Event[] = [
  {
    id: "oneHundredMeters",
    eventTags: [EventTags.Sprints, EventTags.TimesForPace],
    distanceValue: "100",
    distanceDecimal: "0",
    distanceUnit: DistanceUnit.Meters,
    showMinutes: false,
    showHundredths: true,
    stepMs: 10,
    defaultTime: {
      timeHours: "0",
      timeMinutes: "0",
      timeSeconds: "14",
      timeHundredths: "99",
    },
    eventGuide: {
      timeExamples: [
        {
          id: "sub15",
          time: {
            timeHours: "0",
            timeMinutes: "0",
            timeSeconds: "14",
            timeHundredths: "99",
          },
        },
        {
          id: "sub12",
          time: {
            timeHours: "0",
            timeMinutes: "0",
            timeSeconds: "11",
            timeHundredths: "99",
          },
        },
        {
          id: "fWR",
          time: {
            timeHours: "0",
            timeMinutes: "0",
            timeSeconds: "10",
            timeHundredths: "49",
          },
        },
        {
          id: "mWR",
          time: {
            timeHours: "0",
            timeMinutes: "0",
            timeSeconds: "09",
            timeHundredths: "58",
          },
        },
      ],
    },
  },
  {
    id: "twoHundredMeters",
    eventTags: [EventTags.Sprints, EventTags.TimesForPace],
    distanceValue: "200",
    distanceDecimal: "0",
    distanceUnit: DistanceUnit.Meters,
    showMinutes: false,
    showHundredths: true,
    stepMs: 10,
    defaultTime: {
      timeHours: "0",
      timeMinutes: "0",
      timeSeconds: "29",
      timeHundredths: "99",
    },
    eventGuide: {
      timeExamples: [
        {
          id: "sub30",
          time: {
            timeHours: "0",
            timeMinutes: "0",
            timeSeconds: "29",
            timeHundredths: "99",
          },
        },
        {
          id: "sub25",
          time: {
            timeHours: "0",
            timeMinutes: "0",
            timeSeconds: "24",
            timeHundredths: "99",
          },
        },
        {
          id: "fWR",
          time: {
            timeHours: "0",
            timeMinutes: "0",
            timeSeconds: "21",
            timeHundredths: "34",
          },
        },
        {
          id: "mWR",
          time: {
            timeHours: "0",
            timeMinutes: "0",
            timeSeconds: "19",
            timeHundredths: "19",
          },
        },
      ],
    },
  },
  {
    id: "fourHundredMeters",
    eventTags: [EventTags.Sprints, EventTags.TimesForPace],
    distanceValue: "400",
    distanceDecimal: "0",
    distanceUnit: DistanceUnit.Meters,
    showHundredths: true,
    stepMs: 10,
    defaultTime: {
      timeHours: "0",
      timeMinutes: "0",
      timeSeconds: "59",
      timeHundredths: "99",
    },
    eventGuide: {
      timeExamples: [
        {
          id: "sub60",
          time: {
            timeHours: "0",
            timeMinutes: "0",
            timeSeconds: "59",
            timeHundredths: "99",
          },
        },
        {
          id: "sub50",
          time: {
            timeHours: "0",
            timeMinutes: "0",
            timeSeconds: "49",
            timeHundredths: "99",
          },
        },
        {
          id: "fWR",
          time: {
            timeHours: "0",
            timeMinutes: "0",
            timeSeconds: "47",
            timeHundredths: "60",
          },
        },
        {
          id: "mWR",
          time: {
            timeHours: "0",
            timeMinutes: "0",
            timeSeconds: "43",
            timeHundredths: "03",
          },
        },
      ],
    },
  },
  {
    id: "eightHundredMeters",
    eventTags: [EventTags.MiddleDistance, EventTags.TimesForPace],
    distanceValue: "800",
    distanceDecimal: "0",
    distanceUnit: DistanceUnit.Meters,
    showHundredths: true,
    stepMs: 10,
    defaultTime: {
      timeHours: "0",
      timeMinutes: "02",
      timeSeconds: "30",
      timeHundredths: "00",
    },
    eventGuide: {
      timeExamples: [
        {
          id: "twoThirty",
          time: {
            timeHours: "0",
            timeMinutes: "02",
            timeSeconds: "30",
            timeHundredths: "00",
          },
        },
        {
          id: "subTwo",
          time: {
            timeHours: "0",
            timeMinutes: "01",
            timeSeconds: "59",
            timeHundredths: "99",
          },
        },
        {
          id: "fWR",
          time: {
            timeHours: "0",
            timeMinutes: "01",
            timeSeconds: "53",
            timeHundredths: "28",
          },
        },
        {
          id: "mWR",
          time: {
            timeHours: "0",
            timeMinutes: "01",
            timeSeconds: "40",
            timeHundredths: "91",
          },
        },
      ],
    },
  },
  {
    id: "fifteenHundredMeters",
    eventTags: [EventTags.MiddleDistance, EventTags.TimesForPace],
    distanceValue: "1500",
    distanceDecimal: "0",
    distanceUnit: DistanceUnit.Meters,
    showHundredths: true,
    stepMs: 10,
    defaultTime: {
      timeHours: "0",
      timeMinutes: "05",
      timeSeconds: "30",
      timeHundredths: "00",
    },
    eventGuide: {
      timeExamples: [
        {
          id: "fiveThirty",
          time: {
            timeHours: "0",
            timeMinutes: "05",
            timeSeconds: "30",
            timeHundredths: "00",
          },
        },
        {
          id: "sub5",
          time: {
            timeHours: "0",
            timeMinutes: "04",
            timeSeconds: "59",
            timeHundredths: "00",
          },
        },
        {
          id: "sub430",
          time: {
            timeHours: "0",
            timeMinutes: "04",
            timeSeconds: "29",
            timeHundredths: "00",
          },
        },
        {
          id: "fWR",
          time: {
            timeHours: "0",
            timeMinutes: "03",
            timeSeconds: "49",
            timeHundredths: "04",
          },
        },
        {
          id: "mWR",
          time: {
            timeHours: "0",
            timeMinutes: "03",
            timeSeconds: "26",
            timeHundredths: "00",
          },
        },
      ],
    },
  },
  {
    id: "mile",
    eventTags: [EventTags.MiddleDistance],
    distanceValue: "1",
    distanceDecimal: "0",
    distanceUnit: DistanceUnit.Miles,
    showHundredths: true,
    stepMs: 10,
    defaultTime: {
      timeHours: "0",
      timeMinutes: "05",
      timeSeconds: "59",
      timeHundredths: "99",
    },
    eventGuide: {
      timeExamples: [
        {
          id: "sub7",
          time: {
            timeHours: "0",
            timeMinutes: "06",
            timeSeconds: "59",
            timeHundredths: "00",
          },
        },
        {
          id: "sub6",
          time: {
            timeHours: "0",
            timeMinutes: "05",
            timeSeconds: "59",
            timeHundredths: "99",
          },
        },
        {
          id: "sub5",
          time: {
            timeHours: "0",
            timeMinutes: "04",
            timeSeconds: "59",
            timeHundredths: "00",
          },
        },
        {
          id: "fWR",
          time: {
            timeHours: "0",
            timeMinutes: "04",
            timeSeconds: "07",
            timeHundredths: "64",
          },
        },
        {
          id: "bannister",
          time: {
            timeHours: "0",
            timeMinutes: "03",
            timeSeconds: "59",
            timeHundredths: "40",
          },
        },
        {
          id: "mWR",
          time: {
            timeHours: "0",
            timeMinutes: "03",
            timeSeconds: "43",
            timeHundredths: "13",
          },
        },
      ],
    },
  },
  {
    id: "threeThousandMeters",
    eventTags: [EventTags.MiddleDistance, EventTags.TimesForPace],
    distanceValue: "3",
    distanceDecimal: "0",
    distanceUnit: DistanceUnit.Kilometers,
    showHundredths: true,
    defaultTime: {
      timeHours: "0",
      timeMinutes: "09",
      timeSeconds: "59",
      timeHundredths: "99",
    },
    eventGuide: {
      timeExamples: [
        {
          id: "sub10",
          time: {
            timeHours: "0",
            timeMinutes: "09",
            timeSeconds: "59",
            timeHundredths: "99",
          },
        },
        {
          id: "mWR",
          time: {
            timeHours: "0",
            timeMinutes: "07",
            timeSeconds: "20",
            timeHundredths: "67",
          },
        },
        {
          id: "fWR",
          time: {
            timeHours: "0",
            timeMinutes: "08",
            timeSeconds: "06",
            timeHundredths: "11",
          },
        },
        {
          id: "mWRSteeple",
          time: {
            timeHours: "0",
            timeMinutes: "07",
            timeSeconds: "52",
            timeHundredths: "11",
          },
        },
        {
          id: "fWRSteeple",
          time: {
            timeHours: "0",
            timeMinutes: "08",
            timeSeconds: "44",
            timeHundredths: "32",
          },
        },
      ],
    },
  },
  {
    id: "fiveK",
    eventTags: [EventTags.Standard, EventTags.TimesForPace],
    distanceValue: "5",
    distanceDecimal: "0",
    distanceUnit: DistanceUnit.Kilometers,
    eventGuide: {
      timeExamples: [
        {
          id: "avg",
          time: {
            timeHours: "0",
            timeMinutes: "33",
            timeSeconds: "0",
            timeHundredths: "00",
          },
        },
        {
          id: "sub30",
          time: {
            timeHours: "0",
            timeMinutes: "29",
            timeSeconds: "59",
            timeHundredths: "00",
          },
        },
        {
          id: "sub20",
          time: {
            timeHours: "0",
            timeMinutes: "19",
            timeSeconds: "59",
            timeHundredths: "00",
          },
        },
        {
          id: "sub15",
          time: {
            timeHours: "0",
            timeMinutes: "14",
            timeSeconds: "59",
            timeHundredths: "00",
          },
        },
        {
          id: "fWR",
          time: {
            timeHours: "0",
            timeMinutes: "13",
            timeSeconds: "58",
            timeHundredths: "06",
          },
        },
        {
          id: "mWR",
          time: {
            timeHours: "0",
            timeMinutes: "12",
            timeSeconds: "35",
            timeHundredths: "36",
          },
        },
      ],
    },
    defaultTime: {
      timeHours: "0",
      timeMinutes: "29",
      timeSeconds: "59",
      timeHundredths: "00",
    },
  },
  {
    id: "tenK",
    eventTags: [EventTags.Standard, EventTags.TimesForPace],
    distanceValue: "10",
    distanceDecimal: "0",
    distanceUnit: DistanceUnit.Kilometers,
    eventGuide: {
      timeExamples: [
        {
          id: "sub60",
          time: {
            timeHours: "00",
            timeMinutes: "59",
            timeSeconds: "59",
            timeHundredths: "00",
          },
        },
        {
          id: "sub50",
          time: {
            timeHours: "00",
            timeMinutes: "49",
            timeSeconds: "59",
            timeHundredths: "00",
          },
        },
        {
          id: "sub40",
          time: {
            timeHours: "00",
            timeMinutes: "39",
            timeSeconds: "59",
            timeHundredths: "00",
          },
        },
        {
          id: "fWR",
          time: {
            timeHours: "00",
            timeMinutes: "28",
            timeSeconds: "54",
            timeHundredths: "14",
          },
        },
        {
          id: "mWR",
          time: {
            timeHours: "00",
            timeMinutes: "26",
            timeSeconds: "11",
            timeHundredths: "00",
          },
        },
      ],
    },
    defaultTime: {
      timeHours: "00",
      timeMinutes: "59",
      timeSeconds: "59",
      timeHundredths: "00",
    },
    showHours: true,
  },
  {
    id: "halfMarathon",
    eventTags: [EventTags.Standard, EventTags.TimesForPace],
    distanceValue: "13",
    distanceDecimal: "109",
    distanceUnit: DistanceUnit.Miles,
    eventGuide: {
      timeExamples: [
        {
          id: "avg",
          time: {
            timeHours: "2",
            timeMinutes: "15",
            timeSeconds: "00",
            timeHundredths: "00",
          },
        },
        {
          id: "sub2",
          time: {
            timeHours: "1",
            timeMinutes: "59",
            timeSeconds: "59",
            timeHundredths: "00",
          },
        },
        {
          id: "sub90",
          time: {
            timeHours: "1",
            timeMinutes: "29",
            timeSeconds: "59",
            timeHundredths: "00",
          },
        },
        {
          id: "fWR",
          time: {
            timeHours: "1",
            timeMinutes: "02",
            timeSeconds: "52",
            timeHundredths: "00",
          },
        },
        {
          id: "mWR",
          time: {
            timeHours: "0",
            timeMinutes: "56",
            timeSeconds: "42",
            timeHundredths: "00",
          },
        },
      ],
    },
    defaultTime: {
      timeHours: "01",
      timeMinutes: "59",
      timeSeconds: "59",
      timeHundredths: "00",
    },
    showHours: true,
  },
  {
    id: "marathon",
    eventTags: [EventTags.Standard, EventTags.TimesForPace],
    distanceValue: "26",
    distanceDecimal: "218",
    distanceUnit: DistanceUnit.Miles,
    showHours: true,
    defaultTime: {
      timeHours: "03",
      timeMinutes: "59",
      timeSeconds: "59",
      timeHundredths: "00",
    },
    eventGuide: {
      timeExamples: [
        {
          id: "avg",
          time: {
            timeHours: "04",
            timeMinutes: "30",
            timeSeconds: "00",
            timeHundredths: "00",
          },
        },
        {
          id: "sub4",
          time: {
            timeHours: "03",
            timeMinutes: "59",
            timeSeconds: "59",
            timeHundredths: "00",
          },
        },
        {
          id: "sub3",
          time: {
            timeHours: "02",
            timeMinutes: "59",
            timeSeconds: "59",
            timeHundredths: "00",
          },
        },
        {
          id: "fWR",
          time: {
            timeHours: "02",
            timeMinutes: "09",
            timeSeconds: "56",
            timeHundredths: "00",
          },
        },
        {
          id: "mWR",
          time: {
            timeHours: "01",
            timeMinutes: "59",
            timeSeconds: "30",
            timeHundredths: "00",
          },
        },
      ],
    },
  },
];
