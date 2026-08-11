import navigation from "./navigation";
import homepageContent from "./homepageContent";
import project from "./project";
import statCard from "./statCard";
import testimonial from "./testimonial";
import article from "./article";
import { portableTextObjects } from "./objects/portableTextObjects";

export const singletonTypes = new Set(["navigation", "homepageContent"]);

export const schemaTypes = [
  navigation,
  homepageContent,
  project,
  statCard,
  testimonial,
  article,
  ...portableTextObjects,
];
