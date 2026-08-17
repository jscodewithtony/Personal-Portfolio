import navigation from "./navigation";
import homepageContent from "./homepageContent";
import aboutPage from "./aboutPage";
import siteSettings from "./siteSettings";
import theme from "./theme";
import project from "./project";
import statCard from "./statCard";
import testimonial from "./testimonial";
import article from "./article";
import { portableTextObjects } from "./objects/portableTextObjects";

export const singletonTypes = new Set([
  "navigation",
  "homepageContent",
  "aboutPage",
  "siteSettings",
]);

export const schemaTypes = [
  navigation,
  homepageContent,
  aboutPage,
  siteSettings,
  theme,
  project,
  statCard,
  testimonial,
  article,
  ...portableTextObjects,
];
