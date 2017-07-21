// @flow
import squel from "squel";
import Moment from "moment";

export function getFilterExpression(
  type: string,
  filter: Array<number | Moment>
): squel.expression {
  let expression = squel.expr();

  let property: string;
  let isString = false;
  switch (type) {
    case "camera":
      property = "exif.cameraModelRef";
      break;
    case "lens":
      property = "exif.lensRef";
      break;
    case "focalLength":
      property = "exif.focalLength";
      break;
    case "iso":
      property = "exif.isoSpeedRating";
      break;
    case "aperture":
      property = "exif.aperture";
      break;
    case "flag":
      property = "images.pick";
      break;
    case "color":
      isString = true;
      property = "images.colorLabels";
      break;
    case "rating":
      property = "images.rating";
      break;
    case "face":
      property = "keywordImage.tag";
      break;
    case "map":
      property = "images.id_local";
      break;
    case "date":
      property = "images.captureTime";
      break;
    case "shutter":
      property = "exif.shutterSpeed";
      break;
    default:
      return expression;
  }

  if (!filter || !filter.length) {
    return expression;
  }

  const minFilter = Math.min(filter[0], filter[1]);
  const maxFilter = Math.max(filter[0], filter[1]);

  switch (type) {
    case "camera":
    case "lens":
    case "flag":
    case "face":
    case "color":
      for (let i = 0; i < filter.length; i++) {
        if (filter[i] === null) {
          expression = expression.or(`${property} IS NULL`);
        } else if (isString === true) {
          expression = expression.or(`${property} = "${filter[i]}"`);
        } else {
          expression = expression.or(`${property} = ${filter[i]}`);
        }
      }
      break;
    case "focalLength":
    case "aperture":
    case "iso":
    case "shutter":
      if (filter[0] === filter[1]) {
        expression = expression.and(`${property} = ${minFilter}`);
      } else {
        expression = expression
          .and(`${property} >= ${minFilter}`)
          .and(`${property} <= ${maxFilter}`);
      }
      break;
    case "date":
      const dateFilter: [Moment, Moment] = [filter[0], filter[1]];
      expression = expression
        .and(`${property} >= "${dateFilter[0].format("YYYY-MM-DD")}"`)
        .and(
          `${property} < "${dateFilter[1]
            .clone()
            .add(1, "days")
            .format("YYYY-MM-DD")}"`
        );
      break;
    case "rating":
      if (filter[0] === 0) {
        expression = expression.and(`${property} IS NULL`);
        if (filter[1] !== 0) {
          expression = expression
            .or(`${property} >= 0`)
            .and(`${property} <= ${maxFilter}`);
        }
      } else if (filter[0] === filter[1]) {
        expression = expression.and(`${property} = ${minFilter}`);
      } else {
        expression = expression
          .and(`${property} >= ${minFilter}`)
          .and(`${property} <= ${maxFilter}`);
      }
      break;
    case "map":
      expression = expression.and(`${property} IN (${filter.join(", ")})`);
      break;
    default:
      break;
  }

  return expression;
}

export function formatDbValue(key: String, val: number) {
  if (!val) return "n/a";
  switch (key) {
    case "shutter":
      return val > 0
        ? `1/${Math.round(Math.pow(2, val) * 10) / 10}s`
        : `${Math.round(1 / Math.pow(2, val))}s`;
    case "focalLength":
      return `${val}mm`;
    case "aperture":
      return `f/${Math.round(val * 10) / 10}`;
    case "flag":
      return (
        {
          "0": "None",
          "-1": "Rejected",
          "1": "Selected"
        }[val.toString()] || "Undefined"
      );
    default:
      return val;
  }
}

export function dbSquelFrom() {
  return squel
    .select()
    .from("Adobe_images", "images")
    .left_join(
      "AgHarvestedExifMetadata",
      "exif",
      "images.id_local = exif.image"
    )
    .left_join(
      "AgLibraryKeywordImage",
      "keywordImage",
      "images.id_local = keywordImage.image"
    )
    .left_join(
      "AgInternedExifCameraModel",
      "camera",
      "exif.cameraModelRef = camera.id_local"
    )
    .left_join("AgInternedExifLens", "lens", "exif.lensRef = lens.id_local")
    .left_join(
      "AgLibraryKeyword",
      "face",
      "keywordImage.tag = face.id_local AND (face.keywordType = 'person' OR face.id_local IS NULL)"
    )
    .left_join(
      "AgLibraryKeyword",
      "tag",
      "keywordImage.tag = tag.id_local AND (face.keywordType IS NULL)"
    );
}

export const aggregateFields = [
  { field: "camera.value", name: "Camera", chartType: "pie" },
  { field: "lens.value", name: "Lens", chartType: "pie" },
  {
    field: "exif.focalLength",
    name: "Focal length",
    chartType: "bar",
    type: "focalLength"
  },
  { field: "exif.isoSpeedRating", name: "ISO", chartType: "bar" },
  {
    field: "exif.aperture",
    name: "Aperture",
    chartType: "bar",
    type: "aperture"
  },
  {
    field: "exif.shutterSpeed",
    name: "Shutter Speed",
    chartType: "bar",
    type: "shutter"
  },
  { field: "images.pick", name: "Flag", chartType: "pie", type: "flag" },
  { field: "images.colorLabels", name: "Color label", chartType: "pie" },
  { field: "images.rating", name: "Rating", chartType: "bar" },
  { field: "face.name", name: "Face", chartType: "pie" },
  {
    field: 'strftime("%Y", images.captureTime)',
    name: "Year",
    chartType: "bar"
  },
  {
    field: 'strftime("%Y-%m", images.captureTime)',
    name: "Month",
    chartType: "bar"
  },
  {
    field: 'strftime("%Y-%W", images.captureTime)',
    name: "Week",
    chartType: "bar"
  },
  {
    field: 'strftime("%Y-%m-%d", images.captureTime)',
    name: "Day",
    chartType: "bar"
  }
];

export function configureLogging() {
  switch ((process.env.NODE_ENV || "").toLowerCase()) {
    case "production":
      var console = window.console;
      if (!console) return;
      console.log = console.info = function() {};
      // console.warn = function() {};
      // console.error = function() {};
      break;
    case "test":
      return;
    default:
      break;
  }
}
